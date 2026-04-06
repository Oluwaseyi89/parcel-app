import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'

const SESSION_KEY = 'parcel_admin_shell_session'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000'
const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'staff', 'operator'])

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/users', label: 'Users' },
  { path: '/moderation', label: 'Moderation' },
  { path: '/orders', label: 'Orders' },
  { path: '/dispatch', label: 'Dispatch' },
  { path: '/complaints', label: 'Complaints' },
  { path: '/banking', label: 'Banking' },
  { path: '/settings', label: 'Settings' },
]

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.email || !parsed?.role) return null
    return parsed
  } catch {
    return null
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`
}

async function apiRequest(path, options = {}) {
  const { token, headers = {}, body, ...rest } = options
  const nextHeaders = {
    ...headers,
  }

  if (body !== undefined && !nextHeaders['Content-Type']) {
    nextHeaders['Content-Type'] = 'application/json'
  }

  if (token) {
    nextHeaders['X-Session-Token'] = token
  }

  const response = await fetch(buildApiUrl(path), {
    ...rest,
    headers: nextHeaders,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const serverMessage = payload?.message || payload?.error || payload?.errors?.error?.[0]
    throw new Error(serverMessage || 'Request failed. Please try again.')
  }

  return payload
}

function mapSessionFromPayload(payload, fallbackToken = '') {
  const admin = payload?.admin || payload?.data || {}
  const sessionToken = payload?.session?.session_token || fallbackToken
  const role = admin?.role || ''

  return {
    token: sessionToken,
    email: admin?.email || '',
    role,
    firstName: admin?.first_name || '',
    lastName: admin?.last_name || '',
  }
}

function isSessionValid(session) {
  if (!session?.token || !session?.email || !session?.role) {
    return false
  }

  return ALLOWED_ROLES.has(session.role)
}

function ProtectedLayout({ session, onLogout }) {
  const location = useLocation()

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <p className="brand-mark">Parcel</p>
          <p className="brand-sub">Admin Console</p>
        </div>
        <nav className="nav-list">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content-wrap">
        <header className="topbar">
          <div>
            <h1 className="page-heading">{NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.label || 'Admin'}</h1>
            <p className="page-sub">Operations control and intervention</p>
          </div>
          <div className="topbar-right">
            <div className="chip">{session.role}</div>
            <div className="chip">{session.email}</div>
            <button type="button" className="ghost-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="page-card">
          <Outlet />
        </section>
      </main>
    </div>
  )
}

function PlaceholderPage({ title, summary, bullets }) {
  return (
    <div className="placeholder">
      <h2>{title}</h2>
      <p>{summary}</p>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </div>
  )
}

function DashboardPage({ token }) {
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setIsLoading(true)
        setError(null)
        const payload = await apiRequest('/auth/api/dashboard/metrics/', {
          method: 'GET',
          token,
        })
        setMetrics(payload?.data || {})
      } catch (err) {
        setError(err.message || 'Failed to load dashboard metrics')
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchMetrics()
    }
  }, [token])

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

      {recentActivity && recentActivity.pending_vendors && recentActivity.pending_vendors.length > 0 ? (
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

      {recentActivity && recentActivity.pending_couriers && recentActivity.pending_couriers.length > 0 ? (
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

      {recentActivity && recentActivity.pending_products && recentActivity.pending_products.length > 0 ? (
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

function MetricCard({ label, value, total, color }) {
  return (
    <div className="metric-card" style={{ borderTopColor: color }}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-sub">of {total} total</div>
    </div>
  )
}

function UsersPage({ token, role }) {
  const canManageAdmins = role === 'super_admin'
  const [activeTab, setActiveTab] = useState(canManageAdmins ? 'admins' : 'customers')

  const [admins, setAdmins] = useState([])
  const [customers, setCustomers] = useState([])

  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [customerError, setCustomerError] = useState('')
  const [adminNotice, setAdminNotice] = useState('')

  const [customerSearch, setCustomerSearch] = useState('')
  const [customerActiveFilter, setCustomerActiveFilter] = useState('all')
  const [customerVerifiedFilter, setCustomerVerifiedFilter] = useState('all')

  const [newAdmin, setNewAdmin] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'staff',
    password: '',
    confirm_password: '',
  })
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)

  const customersTotal = customers.length
  const customersVerified = customers.filter((customer) => customer.is_email_verified).length

  function formatDate(value) {
    if (!value) return 'n/a'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'n/a'
    return date.toLocaleDateString()
  }

  function buildCustomerQuery() {
    const params = new URLSearchParams()
    if (customerSearch.trim()) {
      params.set('search', customerSearch.trim())
    }
    if (customerActiveFilter !== 'all') {
      params.set('is_active', customerActiveFilter)
    }
    if (customerVerifiedFilter !== 'all') {
      params.set('is_email_verified', customerVerifiedFilter)
    }

    const query = params.toString()
    return query ? `/auth/api/customers/?${query}` : '/auth/api/customers/'
  }

  async function loadAdmins() {
    if (!canManageAdmins) return

    try {
      setIsLoadingAdmins(true)
      setAdminError('')
      const payload = await apiRequest('/auth/api/admins/', {
        method: 'GET',
        token,
      })
      setAdmins(Array.isArray(payload?.data) ? payload.data : [])
    } catch (error) {
      setAdminError(error.message || 'Failed to load admin accounts.')
    } finally {
      setIsLoadingAdmins(false)
    }
  }

  async function loadCustomers() {
    try {
      setIsLoadingCustomers(true)
      setCustomerError('')
      const payload = await apiRequest(buildCustomerQuery(), {
        method: 'GET',
        token,
      })
      setCustomers(Array.isArray(payload?.data) ? payload.data : [])
    } catch (error) {
      setCustomerError(error.message || 'Failed to load customers.')
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  useEffect(() => {
    if (canManageAdmins) {
      loadAdmins()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canManageAdmins])

  useEffect(() => {
    loadCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, customerActiveFilter, customerVerifiedFilter])

  async function handleCreateAdmin(event) {
    event.preventDefault()
    if (!canManageAdmins || isCreatingAdmin) return

    setAdminError('')
    setAdminNotice('')

    try {
      setIsCreatingAdmin(true)
      const payload = await apiRequest('/auth/api/admins/', {
        method: 'POST',
        token,
        body: newAdmin,
      })

      setAdminNotice(payload?.message || 'Admin user created successfully.')
      setNewAdmin({
        email: '',
        first_name: '',
        last_name: '',
        role: 'staff',
        password: '',
        confirm_password: '',
      })

      await loadAdmins()
    } catch (error) {
      setAdminError(error.message || 'Unable to create admin user.')
    } finally {
      setIsCreatingAdmin(false)
    }
  }

  async function handleDeactivateAdmin(adminId) {
    if (!canManageAdmins || !adminId) return

    try {
      setAdminError('')
      setAdminNotice('')
      const payload = await apiRequest(`/auth/api/admins/${adminId}/`, {
        method: 'DELETE',
        token,
      })
      setAdminNotice(payload?.message || 'Admin account deactivated.')
      await loadAdmins()
    } catch (error) {
      setAdminError(error.message || 'Unable to deactivate admin account.')
    }
  }

  async function handleVerifyCustomer(customerId) {
    if (!customerId) return

    try {
      setCustomerError('')
      await apiRequest(`/auth/api/customers/${customerId}/`, {
        method: 'PATCH',
        token,
        body: {
          is_email_verified: true,
        },
      })
      await loadCustomers()
    } catch (error) {
      setCustomerError(error.message || 'Unable to update customer.')
    }
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h2>Users Management</h2>
          <p>Operate admin and customer accounts from a single control center.</p>
        </div>
        <div className="users-stats">
          <div className="users-stat-card">
            <p className="users-stat-label">Customers</p>
            <p className="users-stat-value">{customersTotal}</p>
          </div>
          <div className="users-stat-card">
            <p className="users-stat-label">Verified Customers</p>
            <p className="users-stat-value">{customersVerified}</p>
          </div>
          <div className="users-stat-card">
            <p className="users-stat-label">Admin Accounts</p>
            <p className="users-stat-value">{admins.length}</p>
          </div>
        </div>
      </div>

      <div className="users-tabs" role="tablist" aria-label="Users tabs">
        {canManageAdmins ? (
          <button
            type="button"
            className={`users-tab ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            Admin Accounts
          </button>
        ) : null}
        <button
          type="button"
          className={`users-tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customers
        </button>
      </div>

      {activeTab === 'admins' && canManageAdmins ? (
        <section className="users-section">
          <h3>Create Admin User</h3>
          <form className="users-admin-form" onSubmit={handleCreateAdmin}>
            <input
              type="email"
              placeholder="Email"
              value={newAdmin.email}
              onChange={(event) => setNewAdmin((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="First name"
              value={newAdmin.first_name}
              onChange={(event) => setNewAdmin((prev) => ({ ...prev, first_name: event.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Last name"
              value={newAdmin.last_name}
              onChange={(event) => setNewAdmin((prev) => ({ ...prev, last_name: event.target.value }))}
              required
            />
            <select
              value={newAdmin.role}
              onChange={(event) => setNewAdmin((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="staff">Staff</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
            <input
              type="password"
              placeholder="Password"
              value={newAdmin.password}
              onChange={(event) => setNewAdmin((prev) => ({ ...prev, password: event.target.value }))}
              minLength={8}
              required
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={newAdmin.confirm_password}
              onChange={(event) => setNewAdmin((prev) => ({ ...prev, confirm_password: event.target.value }))}
              minLength={8}
              required
            />
            <button type="submit" className="primary-btn" disabled={isCreatingAdmin}>
              {isCreatingAdmin ? 'Creating...' : 'Create Admin'}
            </button>
          </form>

          {adminError ? <p className="form-error">{adminError}</p> : null}
          {adminNotice ? <p className="form-success">{adminNotice}</p> : null}

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingAdmins ? (
                  <tr>
                    <td colSpan="6">Loading admin accounts...</td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan="6">No admin accounts found.</td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id}>
                      <td>{admin.full_name || `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'n/a'}</td>
                      <td>{admin.email}</td>
                      <td>{admin.role_display || admin.role}</td>
                      <td>{admin.is_active ? 'Active' : 'Inactive'}</td>
                      <td>{formatDate(admin.last_login)}</td>
                      <td>
                        {admin.is_active ? (
                          <button
                            type="button"
                            className="ghost-btn compact"
                            onClick={() => handleDeactivateAdmin(admin.id)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <span className="muted-inline">No action</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === 'customers' ? (
        <section className="users-section">
          <h3>Customer Directory</h3>
          <div className="users-filters">
            <input
              type="search"
              placeholder="Search by email or name"
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
            />
            <select
              value={customerActiveFilter}
              onChange={(event) => setCustomerActiveFilter(event.target.value)}
            >
              <option value="all">All status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select
              value={customerVerifiedFilter}
              onChange={(event) => setCustomerVerifiedFilter(event.target.value)}
            >
              <option value="all">All verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
            <button type="button" className="ghost-btn" onClick={loadCustomers}>
              Apply Filters
            </button>
          </div>

          {customerError ? <p className="form-error">{customerError}</p> : null}

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Country/State</th>
                  <th>Verified</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingCustomers ? (
                  <tr>
                    <td colSpan="7">Loading customers...</td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan="7">No customers matched your filters.</td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'n/a'}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || 'n/a'}</td>
                      <td>{[customer.country, customer.state].filter(Boolean).join(', ') || 'n/a'}</td>
                      <td>{customer.is_email_verified ? 'Yes' : 'No'}</td>
                      <td>{formatDate(customer.created_at)}</td>
                      <td>
                        {!customer.is_email_verified ? (
                          <button
                            type="button"
                            className="ghost-btn compact"
                            onClick={() => handleVerifyCustomer(customer.id)}
                          >
                            Verify
                          </button>
                        ) : (
                          <span className="muted-inline">No action</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function ModerationPage({ token }) {
  const [queueType, setQueueType] = useState('all')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [data, setData] = useState({ vendors: [], couriers: [], products: [], summary: {} })
  const [isLoading, setIsLoading] = useState(true)
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
      setError(err.message || 'Failed to load moderation queue.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, queueType, statusFilter])

  async function handleModerationAction(type, id, action) {
    try {
      setIsSubmitting(true)
      setError('')
      setNotice('')
      const payload = await apiRequest(`/auth/api/moderation/${type}/${id}/`, {
        method: 'PATCH',
        token,
        body: {
          action,
          reason: actionReason,
        },
      })
      setNotice(payload?.message || 'Moderation updated successfully.')
      setActionReason('')
      await loadQueue()
    } catch (err) {
      setError(err.message || 'Unable to update moderation status.')
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

      {isLoading ? <p>Loading moderation queue...</p> : null}

      {(queueType === 'all' || queueType === 'vendors') && !isLoading ? (
        <ModerationSection
          title="Vendor Submissions"
          rows={vendors}
          kind="vendors"
          formatDate={formatDate}
          onAction={handleModerationAction}
          isSubmitting={isSubmitting}
          columns={[
            { key: 'name', label: 'Name', render: (row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'n/a' },
            { key: 'email', label: 'Email', render: (row) => row.email || 'n/a' },
            { key: 'business_name', label: 'Business', render: (row) => row.business_name || 'n/a' },
            { key: 'approval_status', label: 'Status', render: (row) => row.approval_status || 'n/a' },
            { key: 'submitted_at', label: 'Submitted', render: (row) => formatDate(row.submitted_at) },
          ]}
        />
      ) : null}

      {(queueType === 'all' || queueType === 'couriers') && !isLoading ? (
        <ModerationSection
          title="Courier Submissions"
          rows={couriers}
          kind="couriers"
          formatDate={formatDate}
          onAction={handleModerationAction}
          isSubmitting={isSubmitting}
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

      {(queueType === 'all' || queueType === 'products') && !isLoading ? (
        <ModerationSection
          title="Product Submissions"
          rows={products}
          kind="products"
          formatDate={formatDate}
          onAction={handleModerationAction}
          isSubmitting={isSubmitting}
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

function ModerationSection({ title, rows, kind, columns, onAction, isSubmitting }) {
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1}>No items in this queue.</td>
              </tr>
            ) : (
              rows.map((row) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function LoginPage({ onLogin, session }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState(session?.email || '')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email || !password || isSubmitting) return

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await onLogin({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'Unable to log in. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <p className="login-kicker">parcel operations</p>
        <h2>Admin Sign In</h2>
        <p>Issue 2 integration: backend auth/session handshake enabled.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@parcel.com"
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              required
              autoComplete="current-password"
            />
          </label>
          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

function LoadingPage() {
  return (
    <div className="login-screen">
      <div className="login-card">
        <h2>Loading Session</h2>
        <p>Validating your admin session...</p>
      </div>
    </div>
  )
}

function UnauthorizedPage({ onSignOut }) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <p className="login-kicker">permission required</p>
        <h2>Access Denied</h2>
        <p>Your account does not have admin panel permissions.</p>
        <button type="button" className="primary-btn" onClick={onSignOut}>
          Return To Login
        </button>
      </div>
    </div>
  )
}

function AppRoutes() {
  const [session, setSession] = useState(() => readSession())
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isUnauthorized, setIsUnauthorized] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function bootstrapSession() {
      const existing = readSession()
      if (!isSessionValid(existing)) {
        clearSession()
        if (isMounted) {
          setSession(null)
          setIsBootstrapping(false)
        }
        return
      }

      try {
        const profilePayload = await apiRequest('/auth/api/profile/', {
          method: 'GET',
          token: existing.token,
        })

        const refreshed = mapSessionFromPayload(profilePayload, existing.token)
        if (!isSessionValid(refreshed)) {
          throw new Error('Insufficient permissions')
        }

        saveSession(refreshed)
        if (isMounted) {
          setSession(refreshed)
          setIsUnauthorized(false)
        }
      } catch {
        clearSession()
        if (isMounted) {
          setSession(null)
          setIsUnauthorized(false)
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false)
        }
      }
    }

    bootstrapSession()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleLogin(credentials) {
    const payload = await apiRequest('/auth/api/login/', {
      method: 'POST',
      body: credentials,
    })

    const nextSession = mapSessionFromPayload(payload)
    if (!isSessionValid(nextSession)) {
      clearSession()
      setSession(null)
      setIsUnauthorized(true)
      throw new Error('Insufficient permissions to access admin panel.')
    }

    saveSession(nextSession)
    setSession(nextSession)
    setIsUnauthorized(false)
  }

  async function handleLogout() {
    const sessionToken = session?.token
    try {
      if (sessionToken) {
        await apiRequest('/auth/api/logout/', {
          method: 'POST',
          token: sessionToken,
        })
      }
    } catch {
      // Ignore logout request errors and force local sign-out.
    } finally {
      clearSession()
      setSession(null)
      setIsUnauthorized(false)
    }
  }

  if (isBootstrapping) {
    return <LoadingPage />
  }

  if (isUnauthorized) {
    return <UnauthorizedPage onSignOut={handleLogout} />
  }

  const protectedElement = session ? (
    <ProtectedLayout session={session} onLogout={handleLogout} />
  ) : (
    <Navigate to="/login" replace />
  )

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} session={session} />} />

      <Route path="/" element={protectedElement}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={<DashboardPage token={session?.token} />}
        />
        <Route
          path="users"
          element={<UsersPage token={session?.token} role={session?.role} />}
        />
        <Route
          path="moderation"
          element={<ModerationPage token={session?.token} />}
        />
        <Route
          path="orders"
          element={
            <PlaceholderPage
              title="Orders"
              summary="Order intervention and status controls."
              bullets={['Order list and detail', 'Status transitions', 'Payment verification hooks']}
            />
          }
        />
        <Route
          path="dispatch"
          element={
            <PlaceholderPage
              title="Dispatch"
              summary="Dispatch creation, assignment, and optimization."
              bullets={['Ready orders queue', 'Courier assignment', 'Route optimization actions']}
            />
          }
        />
        <Route
          path="complaints"
          element={
            <PlaceholderPage
              title="Complaints"
              summary="Complaint triage and resolution tracking."
              bullets={['Global complaint list', 'Case updates', 'Resolution metrics']}
            />
          }
        />
        <Route
          path="banking"
          element={
            <PlaceholderPage
              title="Banking"
              summary="Vendor and courier payout detail oversight."
              bullets={['Vendor bank records', 'Courier bank records', 'Update and validation workflow']}
            />
          }
        />
        <Route
          path="settings"
          element={
            <PlaceholderPage
              title="Settings"
              summary="Operational preferences and security settings."
              bullets={['Profile and password', 'Session policy', 'Environment flags overview']}
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
