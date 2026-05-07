'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import QuestionCard from '@/components/QuestionCard';
import Pager from '@/components/Pager';
import { parseUpdateDate } from '@/lib/utils';

const NUMERIC_SIZES = [10, 20, 30, 40, 50];

/* ─────────────────────────────────────────
   Helper: read/write localStorage safely
───────────────────────────────────────── */
function lsGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); } catch { /* ignore */ }
}

/* ─────────────────────────────────────────
   Helper: resolve initial page size
───────────────────────────────────────── */
function resolvePageSize(stored) {
  if (stored && String(stored).toLowerCase() === 'all') return Number.MAX_SAFE_INTEGER;
  const n = parseInt(stored || '10', 10);
  return NUMERIC_SIZES.includes(n) ? n : 10;
}

export default function ExamHubApp() {
  /* ── State ─────────────────────────────── */
  const [theme, setTheme] = useState('light');
  const [examList, setExamList] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [data, setData] = useState([]);           // full question array
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selections, setSelections] = useState(new Map()); // questionId → letter
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfStatus, setPdfStatus] = useState('');
  const [openAllReveal, setOpenAllReveal] = useState(false); // triggers all reveals open

  // Track key to force re-render of all cards when "open all" is toggled
  const openAllKey = useRef(0);

  /* ── Theme initialization ──────────────── */
  useEffect(() => {
    const stored = lsGet('viewer-theme');
    if (stored) {
      applyTheme(stored);
    } else {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(dark ? 'dark' : 'light');
    }
    // Page size
    const storedSize = lsGet('page-size');
    setPageSize(resolvePageSize(storedSize));
  }, []);

  const applyTheme = (mode) => {
    document.documentElement.setAttribute('data-theme', mode);
    setTheme(mode);
    lsSet('viewer-theme', mode);
  };

  const handleThemeToggle = () => {
    applyTheme(theme === 'light' ? 'dark' : 'light');
  };

  /* ── Load exam list ────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/exams');
        if (!res.ok) throw new Error('exams.json not found');
        const list = await res.json();
        const codes = (Array.isArray(list) ? list : []).map((c) =>
          String(c).toUpperCase()
        );
        setExamList(codes);

        // Restore last selected exam
        const last = lsGet('last-exam');
        if (last) {
          const upper = String(last).toUpperCase();
          setSelectedExam(upper);
        }
      } catch {
        setExamList([]);
      }
    })();
  }, []);

  /* ── Load exam data ────────────────────── */
  const loadExam = useCallback(
    async (examCode) => {
      const code = (examCode || '').trim();
      if (!code) {
        setData([]);
        setLoadError('');
        return;
      }
      setIsLoading(true);
      setLoadError('');
      setData([]);
      setCurrentPage(1);
      setOpenAllReveal(false);

      const slug = code.toLowerCase();
      try {
        const res = await fetch(`/api/exam/${slug}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const questions = await res.json();
        setData(questions);
        lsSet('last-exam', code);
      } catch {
        setLoadError(
          `Could not load examtopics_${slug}_with_discussions.json. ` +
            'Make sure the file exists in the project root.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /* ── Option selection ──────────────────── */
  const handleSelect = useCallback((questionId, letter) => {
    setSelections((prev) => {
      const next = new Map(prev);
      next.set(questionId, letter);
      return next;
    });
  }, []);

  /* ── Page size change ──────────────────── */
  const handlePageSizeChange = (val) => {
    let newSize;
    if (String(val).toLowerCase() === 'all') {
      newSize = Number.MAX_SAFE_INTEGER;
      lsSet('page-size', 'All');
    } else {
      const n = parseInt(val, 10);
      newSize = NUMERIC_SIZES.includes(n) ? n : 10;
      lsSet('page-size', String(newSize));
    }
    setPageSize(newSize);
    setCurrentPage(1);
  };

  /* ── Open all discussions ──────────────── */
  const handleOpenAll = () => {
    openAllKey.current += 1;
    setOpenAllReveal(true);
  };

  /* ── PDF generation ────────────────────── */
  const handleGeneratePdf = async () => {
    if (!data.length) return;
    setIsPdfGenerating(true);
    setPdfStatus('Rendering all questions…');

    // Temporarily switch to "all" so all questions render
    const prevPage = currentPage;
    const prevSize = pageSize;
    setPageSize(Number.MAX_SAFE_INTEGER);
    setCurrentPage(1);
    setOpenAllReveal(true);
    openAllKey.current += 1;

    // Wait for render
    await new Promise((r) => setTimeout(r, 300));
    setPdfStatus('Loading images…');

    // Wait for images
    const images = [...document.querySelectorAll('img')];
    await new Promise((resolve) => {
      if (!images.length) return resolve();
      // Force reload stale images
      images.forEach((img) => {
        if (!img.complete || img.naturalWidth === 0) {
          const src = img.src;
          img.src = '';
          img.src = src;
        }
      });
      let remaining = images.length;
      const done = () => { if (--remaining <= 0) setTimeout(resolve, 2000); };
      images.forEach((img) => {
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          done();
          return;
        }
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
      setTimeout(resolve, 15000);
    });

    setPdfStatus('Opening print dialog…');
    await new Promise((r) => setTimeout(r, 150));
    window.print();

    // Restore
    setPageSize(prevSize);
    setCurrentPage(prevPage);
    setOpenAllReveal(false);
    setIsPdfGenerating(false);
    setPdfStatus('');
  };

  /* ── Derived: current page questions ──── */
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const pageQuestions = (() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(
      start,
      pageSize === Number.MAX_SAFE_INTEGER ? undefined : start + pageSize
    );
  })();

  /* ── Meta line ────────────────────────── */
  const metaText = (() => {
    if (!data.length) return '';
    const first = data[0];
    const exam = first.exam_code || selectedExam || '';
    const rawUpdateText = first.dump_updated_text || '';
    const formattedDate = parseUpdateDate(rawUpdateText);
    if (formattedDate && formattedDate !== rawUpdateText) {
      return `Exam: ${exam} with Last Updated on ${formattedDate}`;
    }
    return `Exam: ${exam}${rawUpdateText ? ` with ${rawUpdateText}` : ''}`;
  })();

  /* ── Group questions by topic for dividers ─ */
  const groupedItems = (() => {
    let lastTopic = null;
    const items = [];
    pageQuestions.forEach((q, pageIdx) => {
      const topicNum = (q.topic_number || '').toString();
      if (topicNum && topicNum !== lastTopic) {
        items.push({ type: 'divider', topicNum });
        lastTopic = topicNum;
      }
      const globalIndex = (currentPage - 1) * (pageSize === Number.MAX_SAFE_INTEGER ? 0 : pageSize) + pageIdx;
      items.push({ type: 'question', question: q, index: globalIndex });
    });
    return items;
  })();

  /* ── Click handler for all links (open in new tab) ── */
  useEffect(() => {
    const handler = (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      a.target = '_blank';
      a.rel = 'noopener';
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  /* ── Render ─────────────────────────────── */
  return (
    <>
      <Header
        examList={examList}
        selectedExam={selectedExam}
        onExamChange={setSelectedExam}
        onLoad={() => loadExam(selectedExam)}
        currentPage={currentPage}
        totalPages={totalPages}
        onGoPage={(p) => setCurrentPage(p)}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        onThemeToggle={handleThemeToggle}
        theme={theme}
        onOpenAll={handleOpenAll}
        onGeneratePdf={handleGeneratePdf}
        isPdfGenerating={isPdfGenerating}
      />

      <div className="container">
        {/* Meta line */}
        {metaText && (
          <div className="meta-top">
            <span>{metaText}</span>
          </div>
        )}

        {/* Main content area */}
        <div id="app">
          {isLoading && <div className="card">Loading…</div>}

          {!isLoading && loadError && (
            <div className="card">
              <span dangerouslySetInnerHTML={{ __html: loadError }} />
            </div>
          )}

          {!isLoading && !loadError && data.length === 0 && (
            <div>Choose an exam and press Load.</div>
          )}

          {!isLoading && !loadError && groupedItems.map((item, i) => {
            if (item.type === 'divider') {
              return (
                <div key={`divider-${item.topicNum}-${i}`} className="topic-divider">
                  {`Topic ${item.topicNum} - Question Set 1`}
                </div>
              );
            }
            return (
              <QuestionCard
                key={`${item.question.question_id}-${openAllKey.current}`}
                question={item.question}
                index={item.index}
                selections={selections}
                onSelect={handleSelect}
                forceOpenReveal={openAllReveal}
              />
            );
          })}
        </div>

        {/* Pagination */}
        {data.length > 0 && !isLoading && (
          <Pager
            total={data.length}
            pageSize={pageSize}
            current={currentPage}
            onPage={(p) => {
              setCurrentPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>

      {/* PDF overlay */}
      <div id="pdf-overlay" style={{ display: isPdfGenerating ? 'flex' : 'none' }}>
        <div className="box" id="pdf-status">{pdfStatus || 'Generating PDF…'}</div>
      </div>
    </>
  );
}
