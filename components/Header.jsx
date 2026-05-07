'use client';

import { useState, useEffect } from 'react';

/**
 * The sticky header with exam selector, page controls, theme toggle, PDF and
 * Open All Discussions buttons.
 * Mirrors the <header> from index.html.
 */
export default function Header({
  examList,
  selectedExam,
  onExamChange,
  onLoad,
  currentPage,
  totalPages,
  onGoPage,
  pageSize,
  onPageSizeChange,
  onThemeToggle,
  theme,
  onOpenAll,
  onGeneratePdf,
  isPdfGenerating,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [jumpValue, setJumpValue] = useState(String(currentPage));

  // Sync jump input when page changes externally
  useEffect(() => {
    setJumpValue(String(currentPage));
  }, [currentPage]);

  const handleGo = () => {
    const page = parseInt(jumpValue, 10);
    if (!isNaN(page)) {
      onGoPage(Math.max(1, Math.min(page, totalPages || 1)));
    }
  };

  const handleJumpKeyDown = (e) => {
    if (e.key === 'Enter') handleGo();
  };

  const PAGE_SIZES = ['10', '20', '30', '40', '50', 'All'];

  return (
    <header>
      <div className="bar">
        <div className="brand">ExamHub</div>
        <div className="spacer" />
        <button
          className="hamb"
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
        >
          ☰ Menu
        </button>

        <div className={`menu${menuOpen ? ' open' : ''}`}>
          <div className="row">
            <label htmlFor="exam-select">Exam</label>
            <select
              id="exam-select"
              className="exam-select"
              value={selectedExam}
              onChange={(e) => onExamChange(e.target.value)}
            >
              <option value="" disabled>
                {examList.length === 0 ? 'Loading…' : '— Select exam —'}
              </option>
              {examList.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>

            <button id="load" className="btn" type="button" onClick={onLoad}>
              Load
            </button>

            <label htmlFor="jump-input">Page</label>
            <input
              id="jump-input"
              className="jump-input"
              type="number"
              min="1"
              step="1"
              placeholder="1"
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={handleJumpKeyDown}
            />
            <button id="go" className="btn" type="button" onClick={handleGo}>
              Go
            </button>

            <label htmlFor="pagesize-select">Per page</label>
            <select
              id="pagesize-select"
              className="pagesize-select"
              value={String(pageSize) === String(Number.MAX_SAFE_INTEGER) ? 'All' : String(pageSize)}
              onChange={(e) => onPageSizeChange(e.target.value)}
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button id="theme" className="btn" type="button" onClick={onThemeToggle}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <button
              id="pdf"
              className="btn"
              type="button"
              onClick={onGeneratePdf}
              disabled={isPdfGenerating}
            >
              {isPdfGenerating ? 'Generating…' : 'Generate PDF'}
            </button>

            <button id="openall" className="btn" type="button" onClick={onOpenAll}>
              Open All Discussions
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
