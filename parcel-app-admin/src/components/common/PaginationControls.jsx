export default function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="pagination-controls">
      <div className="pagination-meta">
        <span>Total: {total}</span>
        <label>
          Per page
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      <div className="pagination-nav">
        <button type="button" className="ghost-btn compact" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button type="button" className="ghost-btn compact" onClick={() => onPageChange(page + 1)} disabled={!canNext}>
          Next
        </button>
      </div>
    </div>
  )
}
