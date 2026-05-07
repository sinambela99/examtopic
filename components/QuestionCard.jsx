'use client';

import { useState, useCallback } from 'react';
import { sanitizeHTML } from '@/lib/utils';
import VotesCard from './VotesCard';
import Comment from './Comment';

/**
 * Renders a single question card.
 * Mirrors the `renderCard()` function from index.html.
 *
 * @param {object} question  - The question data object
 * @param {number} index     - Zero-based index in the full DATA array
 * @param {Map}    selections - Shared selections map (questionId → letter)
 * @param {function} onSelect - Callback: onSelect(questionId, letter)
 * @param {boolean} forceOpenReveal - When true (PDF mode), reveal is always open
 */
export default function QuestionCard({ question, index, selections, onSelect, forceOpenReveal = false }) {
  const [revealOpen, setRevealOpen] = useState(forceOpenReveal);

  const questionId = question.question_id;
  const chosenAnswer = selections.get(questionId) || null;

  // Available answer options
  const availableOptions = question.options || {};
  const showLetters = Object.keys(availableOptions).filter(
    (letter) => (availableOptions[letter] || '').trim() !== ''
  );
  const hasOptions = showLetters.length > 0;

  const totalVotes = Object.values(question.votes || {}).reduce((s, c) => s + c, 0);

  // Determine answer classes when revealed
  const getOptClass = useCallback(
    (letter) => {
      let cls = 'opt';
      if (chosenAnswer === letter) cls += ' selected';
      if (revealOpen && hasOptions) {
        if (question.correct_answer && question.correct_answer.includes(letter)) {
          cls += ' correct';
        }
        if (
          chosenAnswer &&
          question.correct_answer &&
          !question.correct_answer.includes(chosenAnswer) &&
          letter === chosenAnswer
        ) {
          cls += ' wrong';
        }
      }
      return cls;
    },
    [chosenAnswer, revealOpen, hasOptions, question.correct_answer]
  );

  const handleOptionClick = (letter) => {
    onSelect(questionId, letter);
  };

  const handleRevealToggle = (e) => {
    setRevealOpen(e.target.open);
  };

  const questionNumber =
    question.question_number || (index >= 0 ? index + 1 : '—');

  return (
    <div className="card">
      {/* Question header */}
      <div className="qhead">
        <div className="qtitle">{`Question #${questionNumber}`}</div>
        <div className="qid">{`ID: ${question.question_id || '—'}`}</div>
        <div className="topic">{`Topic ${question.topic_number || '—'}`}</div>
      </div>

      {/* Question text */}
      {question.question_html ? (
        <div
          className="qtext"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(question.question_html) }}
        />
      ) : question.question_text ? (
        <div
          className="qtext"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(question.question_text) }}
        />
      ) : null}

      {/* Question images */}
      {question.question_images && question.question_images.length > 0 && (
        <div className="qimgs">
          {question.question_images.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt="" loading="lazy" decoding="async" />
          ))}
        </div>
      )}

      {/* Answer options */}
      {hasOptions && (
        <div className={`opts${revealOpen ? ' revealed' : ''}`}>
          {showLetters.map((letter) => (
            <div
              key={letter}
              className={getOptClass(letter)}
              data-letter={letter}
              onClick={() => handleOptionClick(letter)}
            >
              <div className="letter">{letter}</div>
              <div
                className="text"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHTML(availableOptions[letter] || ''),
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Reveal answer & discussion */}
      <details
        className="reveal"
        open={revealOpen}
        onToggle={handleRevealToggle}
      >
        <summary>Reveal answer &amp; discussion</summary>

        <div className="meta-top">
          <span>
            {question.correct_answer
              ? `Correct: ${question.correct_answer}`
              : 'Correct answer shown below'}
          </span>
          {hasOptions && <span className="pill">{`Total votes: ${totalVotes}`}</span>}
        </div>

        {/* Correct answer images */}
        {question.correct_answer_images && question.correct_answer_images.length > 0 && (
          <div className="cimgs">
            {question.correct_answer_images.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" loading="lazy" decoding="async" />
            ))}
          </div>
        )}

        {/* Voting stats */}
        {hasOptions && <VotesCard votes={question.votes || {}} />}

        {/* Discussion */}
        <div className="discussion">
          {question.discussion && question.discussion.length > 0 ? (
            question.discussion.map((item, i) => (
              <Comment key={i} node={item} level={1} />
            ))
          ) : (
            <div className="txt">(No discussion)</div>
          )}
        </div>
      </details>
    </div>
  );
}
