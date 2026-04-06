import { useEffect, useState } from 'react'
import PaginationControls from '../components/common/PaginationControls'
import TableStateRows from '../components/common/TableStateRows'
import { apiRequest } from '../services/api'
import { normalizePaginatedPayload, paginateLocal, withPaginationParams } from '../services/pagination'
import { useToast } from '../components/common/ToastProvider'

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'ready',
  'dispatched',
  'in_transit',
  'delivered',
  'cancelled',
  'refunded',
  'failed',
]

const PAYMENT_STATUSES = ['pending', 'paid', 'partially_paid', 'failed', 'refunded']

export default function OrdersPage({ token }) {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [notesByOrder, setNotesByOrder] = useState({})
  const [statusByOrder, setStatusByOrder] = useState({})
  const [isUpdating, setIsUpdating] = useState(false)

  function formatDate(value) {
    if (!value) return 'n/a'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'n/a'
    return date.toLocaleDateString()
  }

  async function loadOrders() {
    try {
      setIsLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (statusFilter) params.set('status', statusFilter)
      if (paymentStatusFilter) params.set('payment_status', paymentStatusFilter)

      const query = params.toString()
      const basePath = query ? `/auth/api/orders/?${query}` : '/auth/api/orders/'
      const path = withPaginationParams(basePath, page, pageSize)

      const payload = await apiRequest(path, {
        method: 'GET',
        token,
      })
      const normalized = normalizePaginatedPayload(payload)
      const localPage = paginateLocal(normalized.items, page, pageSize)
      const effectiveItems = normalized.isServerPaginated ? normalized.items : localPage.items
      setOrders(effectiveItems)
      setTotal(normalized.isServerPaginated ? normalized.total : localPage.total)

      const defaults = {}
      effectiveItems.forEach((order) => {
        defaults[order.id] = order.status
      })
      setStatusByOrder(defaults)
    } catch (err) {
      setError(err.message || 'Failed to load orders.')
      toast.error(err.message || 'Failed to load orders.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter, paymentStatusFilter, page, pageSize])

  async function handleUpdateOrder(orderId) {
    const status = statusByOrder[orderId]
    if (!status) return

    try {
      setIsUpdating(true)
      setError('')
      setNotice('')
      const payload = await apiRequest(`/auth/api/orders/${orderId}/status/`, {
        method: 'PATCH',
        token,
        body: {
          status,
          notes: notesByOrder[orderId] || '',
        },
      })
      setNotice(payload?.message || 'Order updated successfully.')
      toast.success(payload?.message || 'Order updated successfully.')
      await loadOrders()
    } catch (err) {
      setError(err.message || 'Failed to update order status.')
      toast.error(err.message || 'Failed to update order status.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h2>Orders Management</h2>
          <p>Monitor order lifecycle, payment state, and intervention actions.</p>
        </div>
        <div className="orders-stat-chip">Total: {total}</div>
      </div>

      <div className="orders-filters">
        <input
          type="search"
          placeholder="Search by order number, customer email, payment ref"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All order statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select value={paymentStatusFilter} onChange={(event) => setPaymentStatusFilter(event.target.value)}>
          <option value="">All payment statuses</option>
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <button type="button" className="ghost-btn" onClick={loadOrders} disabled={isLoading}>
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
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Created</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            <TableStateRows
              isLoading={isLoading}
              error={error}
              rows={orders}
              colSpan={7}
              loadingMessage="Loading orders..."
              emptyMessage="No orders found for the current filters."
              onRetry={loadOrders}
              renderRow={(order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.order_number}</strong>
                    <br />
                    <span className="muted-inline">{order.shipping_method || 'n/a'}</span>
                  </td>
                  <td>
                    {order?.customer?.name || 'n/a'}
                    <br />
                    <span className="muted-inline">{order?.customer?.email || 'n/a'}</span>
                  </td>
                  <td>{order.total_amount}</td>
                  <td>
                    {order.payment_status}
                    <br />
                    <span className="muted-inline">{order.payment_method || 'n/a'}</span>
                  </td>
                  <td>{order.status}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>
                    <div className="order-update-cell">
                      <select
                        value={statusByOrder[order.id] || order.status}
                        onChange={(event) =>
                          setStatusByOrder((prev) => ({
                            ...prev,
                            [order.id]: event.target.value,
                          }))
                        }
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={`${order.id}-${status}`} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Optional note"
                        value={notesByOrder[order.id] || ''}
                        onChange={(event) =>
                          setNotesByOrder((prev) => ({
                            ...prev,
                            [order.id]: event.target.value,
                          }))
                        }
                      />

                      <button
                        type="button"
                        className="ghost-btn compact"
                        onClick={() => handleUpdateOrder(order.id)}
                        disabled={isUpdating}
                      >
                        Update
                      </button>
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
