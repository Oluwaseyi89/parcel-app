import { ALLOWED_ROLES, SESSION_KEY } from '../config/constants'

export function readSession() {
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

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function mapSessionFromPayload(payload, fallbackToken = '') {
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

export function isSessionValid(session) {
  if (!session?.token || !session?.email || !session?.role) {
    return false
  }

  return ALLOWED_ROLES.has(session.role)
}
