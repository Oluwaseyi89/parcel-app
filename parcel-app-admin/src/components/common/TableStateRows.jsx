export default function TableStateRows({
  isLoading,
  error,
  rows,
  colSpan,
  emptyMessage,
  loadingMessage,
  onRetry,
  renderRow,
}) {
  if (isLoading) {
    return (
      <tr>
        <td colSpan={colSpan}>{loadingMessage || 'Loading...'}</td>
      </tr>
    )
  }

  if (error) {
    return (
      <tr>
        <td colSpan={colSpan}>
          <div className="table-state-error">
            <span>{error}</span>
            {onRetry ? (
              <button type="button" className="ghost-btn compact" onClick={onRetry}>
                Retry
              </button>
            ) : null}
          </div>
        </td>
      </tr>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <tr>
        <td colSpan={colSpan}>{emptyMessage || 'No records found.'}</td>
      </tr>
    )
  }

  return rows.map((row) => renderRow(row))
}
