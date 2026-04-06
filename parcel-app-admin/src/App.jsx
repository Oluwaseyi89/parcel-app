import { useMemo, useState } from 'react'
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

function LoginPage({ onLogin, session }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState(session?.email || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(session?.role || 'admin')

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!email || !password) return

    onLogin({ email, role })
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <p className="login-kicker">parcel operations</p>
        <h2>Admin Sign In</h2>
        <p>Issue 1 scaffold: protected routes + shell; API integration comes in Issue 2.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@parcel.com"
              required
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
            />
          </label>
          <label>
            Role
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="admin">admin</option>
              <option value="super_admin">super_admin</option>
            </select>
          </label>
          <button type="submit" className="primary-btn">Sign In</button>
        </form>
      </div>
    </div>
  )
}

function AppRoutes() {
  const [session, setSession] = useState(() => readSession())

  function handleLogin(nextSession) {
    saveSession(nextSession)
    setSession(nextSession)
  }

  function handleLogout() {
    clearSession()
    setSession(null)
  }

  const protectedElement = useMemo(() => {
    if (!session) {
      return <Navigate to="/login" replace />
    }
    return <ProtectedLayout session={session} onLogout={handleLogout} />
  }, [session])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} session={session} />} />

      <Route path="/" element={protectedElement}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <PlaceholderPage
              title="Admin Dashboard"
              summary="Operational KPIs and interventions will live here."
              bullets={[
                'System health overview',
                'Pending approval counters',
                'Recent escalations feed',
              ]}
            />
          }
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
