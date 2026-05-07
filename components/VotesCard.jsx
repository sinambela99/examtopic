'use client';

import { pct } from '@/lib/utils';

/**
 * Renders the voting statistics card for a question.
 * Mirrors the `votesCard()` function from index.html.
 */
export default function VotesCard({ votes }) {
  const votesObj = votes || {};
  const total = Object.values(votesObj).reduce((sum, c) => sum + c, 0);
  const entries = Object.entries(votesObj).sort((a, b) => b[1] - a[1]);
  const [topKey = '', topCount = 0] = entries[0] || [];
  const topPct = total ? Math.round((topCount * 100) / total) : 0;

  return (
    <div className="votes">
      <div className="title">Answer votes</div>

      {/* Summary bar */}
      <div className="summary">
        <div
          className="summarybar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={topPct}
        >
          <div className="seg seg-major" style={{ width: `${topPct}%` }} />
          <div className="label">{`${topKey || '—'} (${topPct}%)`}</div>
        </div>
        <div className="legend">
          <span className="pill">{`${topKey || '—'} (${topPct}%)`}</span>
          <span className="pill">Other</span>
        </div>
      </div>

      {/* Detailed rows */}
      {entries.map(([combo, count]) => {
        if (count <= 0) return null;
        const pctVal = pct(count, total);
        return (
          <div className="vrow" key={combo}>
            <div className="lab">{combo}</div>
            <div className="vbar">
              <span style={{ width: `${pctVal}%` }} />
            </div>
            <div className="cnt">{`${count} • ${pctVal}%`}</div>
          </div>
        );
      })}
    </div>
  );
}
