import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { NAV_ITEMS } from '../../config/constants'

export default function ProtectedLayout({ session, onLogout }) {
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
