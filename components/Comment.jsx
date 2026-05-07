'use client';

import { sanitizeHTML } from '@/lib/utils';

/**
 * Renders a single comment (and nested replies) in a discussion thread.
 * Mirrors the `comment()` function from index.html.
 */
export default function Comment({ node, level = 1 }) {
  const marginLeft = `calc(${level - 1} * var(--indent))`;

  return (
    <div className="comment" style={{ marginLeft }}>
      <div className="head">
        <span className="author">{node.author || '—'}</span>
        <span className="badges">
          {node.is_highly_voted && <span className="pill hv">Highly Voted</span>}
          {node.is_most_recent && <span className="pill recent">Most Recent</span>}
          {node.selected_answer && (
            <span className="pill sel">Selected: {node.selected_answer}</span>
          )}
          {node.relative_time && <span className="pill">{node.relative_time}</span>}
          <span className="pill">▲ {node.upvotes ?? 0}</span>
        </span>
      </div>

      <div
        className="txt"
        dangerouslySetInnerHTML={{ __html: sanitizeHTML(node.html || node.text || '') }}
      />

      {node.replies && node.replies.length > 0 && (
        <div className="replies">
          {node.replies.map((reply, idx) => (
            <Comment key={idx} node={reply} level={Math.min(level + 1, 6)} />
          ))}
        </div>
      )}
    </div>
  );
}
