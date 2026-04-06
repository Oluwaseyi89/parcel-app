import { useEffect, useState } from 'react'
import TableStateRows from '../components/common/TableStateRows'
import useToast from '../hooks/useToast'
import useOptimisticMutation from '../hooks/useOptimisticMutation'
import { apiRequest } from '../services/api'

function ModerationSection({ title, rows, kind, columns, onAction, isSubmitting, isLoading, error, onRetry }) {
  return (
    <section className="moderation-section">
      <h3>{title}</h3>
      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={`${title}-${column.key}`}>{column.label}</th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <TableStateRows
              isLoading={isLoading}
              error={error}
              rows={rows}
              colSpan={columns.length + 1}
              loadingMessage="Loading moderation items..."
              emptyMessage="No items in this queue."
              onRetry={onRetry}
              renderRow={(row) => (
                <tr key={`${kind}-${row.id}`}>
                  {columns.map((column) => (
                    <td key={`${kind}-${row.id}-${column.key}`}>{column.render(row)}</td>
                  ))}
                  <td className="moderation-actions-cell">
                    <button
                      type="button"
                      className="ghost-btn compact"
                      onClick={() => onAction(kind, row.id, 'approve')}
                      disabled={isSubmitting}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="ghost-btn compact"
                      onClick={() => onAction(kind, row.id, 'request_changes')}
                      disabled={isSubmitting}
                    >
                      Request Changes
                    </button>
                    <button
                      type="button"
                      className="ghost-btn compact"
                      onClick={() => onAction(kind, row.id, 'reject')}
                      disabled={isSubmitting}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              )}
            />
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function ModerationPage({ token }) {
  const toast = useToast()
  const { run: runOptimisticMutation, isMutating } = useOptimisticMutation()
  const [queueType, setQueueType] = useState('all')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [data, setData] = useState({ vendors: [], couriers: [], products: [], summary: {} })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [actionReason, setActionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function formatDate(value) {
    if (!value) return 'n/a'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'n/a'
    return date.toLocaleDateString()
  }

  async function loadQueue() {
    try {
      setIsLoading(true)
      setLoadError('')
      setError('')
      const params = new URLSearchParams({
        type: queueType,
        status: statusFilter,
      })
      const payload = await apiRequest(`/auth/api/moderation/queue/?${params.toString()}`, {
        method: 'GET',
        token,
      })
      setData(payload?.data || { vendors: [], couriers: [], products: [], summary: {} })
    } catch (err) {
      const message = err.message || 'Failed to load moderation queue.'
      setLoadError(message)
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, queueType, statusFilter])

  async function handleModerationAction(type, id, action) {
    setIsSubmitting(true)
    setError('')
    setNotice('')

    const statusByAction = {
      approve: 'approved',
      reject: 'rejected',
      request_changes: 'changes_requested',
    }

    try {
      await runOptimisticMutation({
        applyOptimistic: () => {
          const previous = data
          const key = type
          const nextStatus = statusByAction[action] || action
          setData((prev) => ({
            ...prev,
            [key]: (prev?.[key] || []).map((row) =>
              row.id === id ? { ...row, approval_status: nextStatus } : row,
            ),
          }))
          return previous
        },
        rollback: (previous) => {
          if (previous) {
            setData(previous)
          }
        },
        mutate: () =>
          apiRequest(`/auth/api/moderation/${type}/${id}/`, {
            method: 'PATCH',
            token,
            body: {
              action,
              reason: actionReason,
            },
          }),
        onSuccess: (payload) => {
          setNotice(payload?.message || 'Moderation updated successfully.')
          toast.success(payload?.message || 'Moderation updated successfully.')
          setActionReason('')
        },
        onError: (err) => {
          setError(err.message || 'Unable to update moderation status.')
          toast.error(err.message || 'Unable to update moderation status.')
        },
      })

      await loadQueue()
    } catch {
      // Errors are surfaced via the optimistic mutation callbacks.
    } finally {
      setIsSubmitting(false)
    }
  }

  const vendors = data?.vendors || []
  const couriers = data?.couriers || []
  const products = data?.products || []

  return (
    <div className="moderation-page">
      <div className="moderation-header">
        <div>
          <h2>Moderation Queue</h2>
          <p>Review and decide vendor, courier, and product submissions.</p>
        </div>
        <div className="moderation-summary">
          <span>Vendors: {data?.summary?.vendors || 0}</span>
          <span>Couriers: {data?.summary?.couriers || 0}</span>
          <span>Products: {data?.summary?.products || 0}</span>
        </div>
      </div>

      <div className="moderation-controls">
        <select value={queueType} onChange={(event) => setQueueType(event.target.value)}>
          <option value="all">All Queues</option>
          <option value="vendors">Vendors</option>
          <option value="couriers">Couriers</option>
          <option value="products">Products</option>
        </select>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="changes_requested">Changes Requested</option>
          <option value="all">All statuses</option>
        </select>

        <input
          type="text"
          placeholder="Optional reason (for reject/request changes)"
          value={actionReason}
          onChange={(event) => setActionReason(event.target.value)}
        />

        <button type="button" className="ghost-btn" onClick={loadQueue} disabled={isLoading}>
          Refresh Queue
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {notice ? <p className="form-success">{notice}</p> : null}

      {queueType === 'all' || queueType === 'vendors' ? (
        <ModerationSection
          title="Vendor Submissions"
          rows={vendors}
          kind="vendors"
          onAction={handleModerationAction}
          isSubmitting={isSubmitting || isMutating}
          isLoading={isLoading}
          error={loadError}
          onRetry={loadQueue}
          columns={[
            { key: 'name', label: 'Name', render: (row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'n/a' },
            { key: 'email', label: 'Email', render: (row) => row.email || 'n/a' },
            { key: 'business_name', label: 'Business', render: (row) => row.business_name || 'n/a' },
            { key: 'approval_status', label: 'Status', render: (row) => row.approval_status || 'n/a' },
            { key: 'submitted_at', label: 'Submitted', render: (row) => formatDate(row.submitted_at) },
          ]}
        />
      ) : null}

      {queueType === 'all' || queueType === 'couriers' ? (
        <ModerationSection
          title="Courier Submissions"
          rows={couriers}
          kind="couriers"
          onAction={handleModerationAction}
          isSubmitting={isSubmitting || isMutating}
          isLoading={isLoading}
          error={loadError}
          onRetry={loadQueue}
          columns={[
            { key: 'name', label: 'Name', render: (row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'n/a' },
            { key: 'email', label: 'Email', render: (row) => row.email || 'n/a' },
            { key: 'service_area', label: 'Service Area', render: (row) => row.service_area || 'n/a' },
            { key: 'vehicle_type', label: 'Vehicle', render: (row) => row.vehicle_type || 'n/a' },
            { key: 'approval_status', label: 'Status', render: (row) => row.approval_status || 'n/a' },
            { key: 'submitted_at', label: 'Submitted', render: (row) => formatDate(row.submitted_at) },
          ]}
        />
      ) : null}

      {queueType === 'all' || queueType === 'products' ? (
        <ModerationSection
          title="Product Submissions"
          rows={products}
          kind="products"
          onAction={handleModerationAction}
          isSubmitting={isSubmitting || isMutating}
          isLoading={isLoading}
          error={loadError}
          onRetry={loadQueue}
          columns={[
            { key: 'name', label: 'Product', render: (row) => row.name || 'n/a' },
            { key: 'vendor__email', label: 'Vendor Email', render: (row) => row.vendor__email || 'n/a' },
            { key: 'vendor__business_name', label: 'Vendor Business', render: (row) => row.vendor__business_name || 'n/a' },
            { key: 'approval_status', label: 'Status', render: (row) => row.approval_status || 'n/a' },
            { key: 'submitted_at', label: 'Submitted', render: (row) => formatDate(row.submitted_at) },
          ]}
        />
      ) : null}
    </div>
  )
}
