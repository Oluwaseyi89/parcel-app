import { useEffect, useMemo, useState } from 'react'
import PaginationControls from '../components/common/PaginationControls'
import TableStateRows from '../components/common/TableStateRows'
import { apiRequest } from '../services/api'
import { normalizePaginatedPayload, paginateLocal, withPaginationParams } from '../services/pagination'
import useToast from '../hooks/useToast'

const DISPATCH_STATUSES = [
  'pending',
  'assigned',
  'picking_up',
  'in_transit',
  'delivered',
  'cancelled',
  'delayed',
  'returned',
]

export default function DispatchPage({ token }) {
  const toast = useToast()
  const [dispatches, setDispatches] = useState([])
  const [couriers, setCouriers] = useState([])
  const [readyOrders, setReadyOrders] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [selectedReadyOrderId, setSelectedReadyOrderId] = useState('')
  const [createNote, setCreateNote] = useState('')

  const [statusByDispatch, setStatusByDispatch] = useState({})
  const [notesByDispatch, setNotesByDispatch] = useState({})
  const [courierByDispatch, setCourierByDispatch] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const readyOrderOptions = useMemo(
    () => readyOrders.map((order) => ({ value: String(order.id), label: `${order.order_number} (${order.customer_email || 'n/a'})` })),
    [readyOrders],
  )

  function formatDate(value) {
    if (!value) return 'n/a'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'n/a'
    return date.toLocaleDateString()
  }

  async function loadDispatches() {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (statusFilter) params.set('status', statusFilter)
    const query = params.toString()
    const basePath = query ? `/auth/api/dispatches/?${query}` : '/auth/api/dispatches/'
    const path = withPaginationParams(basePath, page, pageSize)

    const payload = await apiRequest(path, {
      method: 'GET',
      token,
    })
    const normalized = normalizePaginatedPayload(payload)
    const localPage = paginateLocal(normalized.items, page, pageSize)
    const list = normalized.isServerPaginated ? normalized.items : localPage.items
    setDispatches(list)
    setTotal(normalized.isServerPaginated ? normalized.total : localPage.total)

    const statusDefaults = {}
    const courierDefaults = {}
    list.forEach((dispatch) => {
      statusDefaults[dispatch.id] = dispatch.status
      courierDefaults[dispatch.id] = dispatch?.courier?.id ? String(dispatch.courier.id) : ''
    })
    setStatusByDispatch(statusDefaults)
    setCourierByDispatch(courierDefaults)
  }

  async function loadAll() {
    try {
      setIsLoading(true)
      setError('')
      const [dispatchPayload, courierPayload, readyPayload] = await Promise.all([
        apiRequest('/auth/api/dispatches/', { method: 'GET', token }),
        apiRequest('/auth/api/couriers/', { method: 'GET', token }),
        apiRequest('/auth/api/dispatches/ready-orders/', { method: 'GET', token }),
      ])

      const dispatchList = Array.isArray(dispatchPayload?.data) ? dispatchPayload.data : []
      setDispatches(dispatchList)
      setCouriers(Array.isArray(courierPayload?.data) ? courierPayload.data : [])
      setReadyOrders(Array.isArray(readyPayload?.data) ? readyPayload.data : [])

      const statusDefaults = {}
      const courierDefaults = {}
      dispatchList.forEach((dispatch) => {
        statusDefaults[dispatch.id] = dispatch.status
        courierDefaults[dispatch.id] = dispatch?.courier?.id ? String(dispatch.courier.id) : ''
      })
      setStatusByDispatch(statusDefaults)
      setCourierByDispatch(courierDefaults)
      if (!selectedReadyOrderId && readyPayload?.data?.length) {
        setSelectedReadyOrderId(String(readyPayload.data[0].id))
      }
    } catch (err) {
      setError(err.message || 'Failed to load dispatch data.')
      toast.error(err.message || 'Failed to load dispatch data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (!token) return
    loadDispatches().catch((err) => setError(err.message || 'Failed to load dispatches.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page, pageSize])

  async function handleCreateDispatch() {
    if (!selectedReadyOrderId) return

    try {
      setIsSubmitting(true)
      setError('')
      setNotice('')
      const payload = await apiRequest('/auth/api/dispatches/create/', {
        method: 'POST',
        token,
        body: {
          order_id: selectedReadyOrderId,
          admin_notes: createNote,
        },
      })

      setNotice(payload?.message || 'Dispatch created successfully.')
      toast.success(payload?.message || 'Dispatch created successfully.')
      setCreateNote('')
      await loadAll()
    } catch (err) {
      setError(err.message || 'Failed to create dispatch.')
      toast.error(err.message || 'Failed to create dispatch.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAssignCourier(dispatchId) {
    const courierId = courierByDispatch[dispatchId]
    if (!courierId) return

    try {
      setIsSubmitting(true)
      setError('')
      setNotice('')
      const payload = await apiRequest(`/auth/api/dispatches/${dispatchId}/assign/`, {
        method: 'PATCH',
        token,
        body: {
          courier_id: courierId,
          notes: notesByDispatch[dispatchId] || '',
        },
      })
      setNotice(payload?.message || 'Courier assigned successfully.')
      toast.success(payload?.message || 'Courier assigned successfully.')
      await loadAll()
    } catch (err) {
      setError(err.message || 'Failed to assign courier.')
      toast.error(err.message || 'Failed to assign courier.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateStatus(dispatchId) {
    const status = statusByDispatch[dispatchId]
    if (!status) return

    try {
      setIsSubmitting(true)
      setError('')
      setNotice('')
      const payload = await apiRequest(`/auth/api/dispatches/${dispatchId}/status/`, {
        method: 'PATCH',
        token,
        body: {
          status,
          notes: notesByDispatch[dispatchId] || '',
        },
      })
      setNotice(payload?.message || 'Dispatch status updated successfully.')
      toast.success(payload?.message || 'Dispatch status updated successfully.')
      await loadAll()
    } catch (err) {
      setError(err.message || 'Failed to update dispatch status.')
      toast.error(err.message || 'Failed to update dispatch status.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="dispatch-page">
      <div className="dispatch-header">
        <div>
          <h2>Dispatch Management</h2>
          <p>Create dispatches, assign couriers, and drive last-mile operations.</p>
        </div>
        <div className="dispatch-stat-chip">Dispatches: {total}</div>
      </div>

      <section className="dispatch-create-section">
        <h3>Create Dispatch</h3>
        <div className="dispatch-create-grid">
          <select
            value={selectedReadyOrderId}
            onChange={(event) => setSelectedReadyOrderId(event.target.value)}
          >
            <option value="">Select ready order</option>
            {readyOrderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Optional admin note"
            value={createNote}
            onChange={(event) => setCreateNote(event.target.value)}
          />
          <button type="button" className="primary-btn" onClick={handleCreateDispatch} disabled={isSubmitting || !selectedReadyOrderId}>
            Create Dispatch
          </button>
        </div>
      </section>

      <div className="dispatch-filters">
        <input
          type="search"
          placeholder="Search by tracking number, order number, or customer email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          {DISPATCH_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <button type="button" className="ghost-btn" onClick={loadDispatches} disabled={isLoading}>
          Apply Filters
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {notice ? <p className="form-success">{notice}</p> : null}

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPageSize(next)
          setPage(1)
        }}
      />

      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Tracking</th>
              <th>Order</th>
              <th>Courier</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <TableStateRows
              isLoading={isLoading}
              error={error}
              rows={dispatches}
              colSpan={6}
              loadingMessage="Loading dispatches..."
              emptyMessage="No dispatches found."
              onRetry={loadDispatches}
              renderRow={(dispatch) => (
                <tr key={dispatch.id}>
                  <td>{dispatch.tracking_number}</td>
                  <td>
                    {dispatch?.order?.order_number || 'n/a'}
                    <br />
                    <span className="muted-inline">{dispatch?.order?.customer_email || 'n/a'}</span>
                  </td>
                  <td>
                    <select
                      value={courierByDispatch[dispatch.id] || ''}
                      onChange={(event) =>
                        setCourierByDispatch((prev) => ({
                          ...prev,
                          [dispatch.id]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select courier</option>
                      {couriers.map((courier) => (
                        <option key={`${dispatch.id}-courier-${courier.id}`} value={courier.id}>
                          {courier.name} ({courier.status})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={statusByDispatch[dispatch.id] || dispatch.status}
                      onChange={(event) =>
                        setStatusByDispatch((prev) => ({
                          ...prev,
                          [dispatch.id]: event.target.value,
                        }))
                      }
                    >
                      {DISPATCH_STATUSES.map((status) => (
                        <option key={`${dispatch.id}-status-${status}`} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{formatDate(dispatch.created_at)}</td>
                  <td>
                    <div className="dispatch-actions-cell">
                      <input
                        type="text"
                        placeholder="Optional note"
                        value={notesByDispatch[dispatch.id] || ''}
                        onChange={(event) =>
                          setNotesByDispatch((prev) => ({
                            ...prev,
                            [dispatch.id]: event.target.value,
                          }))
                        }
                      />
                      <div className="dispatch-actions-buttons">
                        <button
                          type="button"
                          className="ghost-btn compact"
                          onClick={() => handleAssignCourier(dispatch.id)}
                          disabled={isSubmitting || !courierByDispatch[dispatch.id]}
                        >
                          Assign
                        </button>
                        <button
                          type="button"
                          className="ghost-btn compact"
                          onClick={() => handleUpdateStatus(dispatch.id)}
                          disabled={isSubmitting}
                        >
                          Update Status
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            />
          </tbody>
        </table>
      </div>
    </div>
  )
}
