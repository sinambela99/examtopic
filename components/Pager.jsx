'use client';

/**
 * Pagination component.
 * Mirrors the `paginate()` function from index.html.
 *
 * @param {number}   total      - Total number of items
 * @param {number}   pageSize   - Items per page (MAX_SAFE_INTEGER = "All")
 * @param {number}   current    - Current page (1-based)
 * @param {function} onPage     - Callback: onPage(pageNumber)
 */
export default function Pager({ total, pageSize, current, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1 && total === 0) return null;

  const buttons = [];

  const addBtn = (label, page, isActive = false, isDisabled = false) => {
    buttons.push(
      <button
        key={`${label}-${page}`}
        className={`pagebtn${isActive ? ' active' : ''}`}
        disabled={isDisabled}
        onClick={() => !isDisabled && onPage(page)}
      >
        {label}
      </button>
    );
  };

  // Prev button
  addBtn('« Prev', Math.max(1, current - 1), false, current === 1);

  const startPage = Math.max(1, current - 2);
  const endPage = Math.min(totalPages, current + 2);

  if (startPage > 1) {
    addBtn('1', 1, current === 1);
    if (startPage > 2) {
      buttons.push(
        <span key="ellipsis-start" className="ellipsis">…</span>
      );
    }
  }

  for (let page = startPage; page <= endPage; page++) {
    addBtn(String(page), page, current === page);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      buttons.push(
        <span key="ellipsis-end" className="ellipsis">…</span>
      );
    }
    addBtn(String(totalPages), totalPages, current === totalPages);
  }

  // Next button
  addBtn('Next »', Math.min(totalPages, current + 1), false, current === totalPages);

  return <div className="pager" id="pager">{buttons}</div>;
}
