export const SESSION_KEY = 'parcel_admin_shell_session'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
export const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'staff', 'operator'])

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/users', label: 'Users' },
  { path: '/moderation', label: 'Moderation' },
  { path: '/orders', label: 'Orders' },
  { path: '/dispatch', label: 'Dispatch' },
  { path: '/complaints', label: 'Complaints' },
  { path: '/banking', label: 'Banking' },
  { path: '/settings', label: 'Settings' },
]
