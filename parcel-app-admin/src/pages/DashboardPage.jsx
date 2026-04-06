import { useCallback, useEffect, useState } from 'react'
import useToast from '../hooks/useToast'
import { apiRequest } from '../services/api'

function MetricCard({ label, value, total, color }) {
  return (
    <div className="metric-card" style={{ borderTopColor: color }}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-sub">of {total} total</div>
    </div>
  )
}

export default function DashboardPage({ token }) {
  const toast = useToast()
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMetrics = useCallback(async () => {
    if (!token) return
    try {
      setIsLoading(true)
      setError(null)
      const payload = await apiRequest('/auth/api/dashboard/metrics/', {
        method: 'GET',
        token,
      })
      setMetrics(payload?.data || {})
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.')
      toast.error(err.message || 'Failed to load dashboard metrics.')
    } finally {
      setIsLoading(false)
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  if (isLoading) {
    return (
      <div className="placeholder">
        <h2>Admin Dashboard</h2>
        <p>Loading operational metrics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="placeholder">
        <h2>Admin Dashboard</h2>
        <p style={{ color: '#b42318' }}>{error}</p>
        <button type="button" className="ghost-btn" onClick={fetchMetrics}>
          Retry
        </button>
      </div>
    )
  }

  const pendingCounts = metrics?.pending_counts || {}
  const totalCounts = metrics?.total_counts || {}
  const recentActivity = metrics?.recent_activity || {}

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Admin Dashboard</h2>

      <div className="metrics-grid">
        <MetricCard
          label="Pending Vendors"
          value={pendingCounts.vendors || 0}
          total={totalCounts.vendors || 0}
          color="#ca520c"
        />
        <MetricCard
          label="Pending Couriers"
          value={pendingCounts.couriers || 0}
          total={totalCounts.couriers || 0}
          color="#2b7a78"
        />
        <MetricCard
          label="Pending Products"
          value={pendingCounts.products || 0}
          total={totalCounts.products || 0}
          color="#8b5a8e"
        />
        <MetricCard
          label="Pending Orders"
          value={pendingCounts.orders || 0}
          total={totalCounts.orders || 0}
          color="#d4a574"
        />
      </div>

      {recentActivity?.pending_vendors?.length > 0 ? (
        <div className="activity-section">
          <h3>Recent Pending Vendors</h3>
          <ul className="activity-list">
            {recentActivity.pending_vendors.map((vendor) => (
              <li key={vendor.id}>
                {vendor.business_name || vendor.email} - {new Date(vendor.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {recentActivity?.pending_couriers?.length > 0 ? (
        <div className="activity-section">
          <h3>Recent Pending Couriers</h3>
          <ul className="activity-list">
            {recentActivity.pending_couriers.map((courier) => (
              <li key={courier.id}>
                {courier.first_name} {courier.last_name} ({courier.email}) - {new Date(courier.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {recentActivity?.pending_products?.length > 0 ? (
        <div className="activity-section">
          <h3>Recent Pending Products</h3>
          <ul className="activity-list">
            {recentActivity.pending_products.map((product) => (
              <li key={product.id}>
                {product.name} - {new Date(product.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
