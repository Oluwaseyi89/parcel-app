import { useEffect, useState } from 'react'
import { apiRequest } from '../../services/api'

const PERIODS = [
  ['day', 'Today'],
  ['week', 'This week'],
  ['month', 'This month'],
]

function formatNaira(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? `₦${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'
}

function StatCard({ label, value }) {
  return (
    <div className="users-stat-card">
      <div className="users-stat-label">{label}</div>
      <div className="users-stat-value">{value}</div>
    </div>
  )
}

// Order and dispatch performance for a chosen period. Loads independently of the dashboard
// metrics so one failing does not hide the other.
export default function PerformanceStats({ token }) {
  const [period, setPeriod] = useState('week')
  const [orders, setOrders] = useState(null)
  const [dispatches, setDispatches] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    queueMicrotask(async () => {
      try {
        setError('')
        const [orderPayload, dispatchPayload] = await Promise.all([
          apiRequest(`/order/stats/?period=${period}`, { method: 'GET', token }),
          apiRequest(`/dispatch/stats/?period=${period}`, { method: 'GET', token }),
        ])
        if (!cancelled) {
          setOrders(orderPayload?.data || {})
          setDispatches(dispatchPayload?.data || {})
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load performance stats.')
      }
    })
    return () => {
      cancelled = true
    }
  }, [token, period])

  return (
    <div className="activity-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h3>Performance</h3>
        <select value={period} onChange={(event) => setPeriod(event.target.value)}>
          {PERIODS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {orders && dispatches ? (
        <div className="users-stats">
          <StatCard label="Orders" value={orders.total_orders ?? 0} />
          <StatCard label="Revenue" value={formatNaira(orders.total_revenue)} />
          <StatCard label="Average order" value={formatNaira(orders.average_order_value)} />
          <StatCard label="Pending orders" value={orders.pending_orders ?? 0} />
          <StatCard label="Dispatches" value={dispatches.total_dispatches ?? 0} />
          <StatCard label="Active dispatches" value={dispatches.active_dispatches ?? 0} />
          <StatCard label="Completed" value={dispatches.completed_dispatches ?? 0} />
          <StatCard label="Completion rate" value={`${Number(dispatches.completion_rate ?? 0).toFixed(1)}%`} />
        </div>
      ) : (
        !error && <p className="muted-inline">Loading performance stats...</p>
      )}
    </div>
  )
}
