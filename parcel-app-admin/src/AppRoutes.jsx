import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './components/auth/LoginPage'
import LoadingPage from './components/auth/LoadingPage'
import UnauthorizedPage from './components/auth/UnauthorizedPage'
import PlaceholderPage from './components/common/PlaceholderPage'
import ProtectedLayout from './components/layout/ProtectedLayout'
import DashboardPage from './pages/DashboardPage'
import ComplaintsPage from './pages/ComplaintsPage'
import BankingPage from './pages/BankingPage'
import DispatchPage from './pages/DispatchPage'
import ModerationPage from './pages/ModerationPage'
import OrdersPage from './pages/OrdersPage'
import UsersPage from './pages/UsersPage'
import { apiRequest } from './services/api'
import {
  clearSession,
  isSessionValid,
  mapSessionFromPayload,
  readSession,
  saveSession,
} from './services/session'

export default function AppRoutes() {
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
        <Route path="dashboard" element={<DashboardPage token={session?.token} />} />
        <Route path="users" element={<UsersPage token={session?.token} role={session?.role} />} />
        <Route path="moderation" element={<ModerationPage token={session?.token} />} />
        <Route path="orders" element={<OrdersPage token={session?.token} />} />
        <Route path="dispatch" element={<DispatchPage token={session?.token} />} />
        <Route path="complaints" element={<ComplaintsPage token={session?.token} />} />
        <Route path="banking" element={<BankingPage token={session?.token} />} />
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
