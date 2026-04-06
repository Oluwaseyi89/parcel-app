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
          element={
            <PlaceholderPage
              title="Users"
              summary="Admin and customer management workspace."
              bullets={['Admin accounts', 'Customer search and status filters', 'Deactivate/reactivate controls']}
            />
          }
        />
        <Route
          path="moderation"
          element={
            <PlaceholderPage
              title="Moderation"
              summary="Vendor, courier, and product moderation queues."
              bullets={['Pending queues', 'Approve/reject/request changes', 'Suspend/reactivate actions']}
            />
          }
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
