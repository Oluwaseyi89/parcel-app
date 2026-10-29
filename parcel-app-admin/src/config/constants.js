export const SESSION_KEY = 'parcel_admin_shell_session'
// Origin of parcel-app-service, baked in at build time (vite.config.js refuses production builds
// without it). The admin authenticates with the X-Session-Token header, so a different origin is fine.
const DEV_API_BASE_URL = 'http://localhost:7000'
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? DEV_API_BASE_URL : '')
).replace(/\/+$/, '')
export const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'staff', 'operator'])

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/users', label: 'Users' },
  { path: '/moderation', label: 'Moderation' },
  { path: '/orders', label: 'Orders' },
  { path: '/dispatch', label: 'Dispatch' },
  { path: '/complaints', label: 'Complaints' },
  { path: '/banking', label: 'Banking' },
  { path: '/categories', label: 'Categories' },
  { path: '/messaging', label: 'Messaging' },
  { path: '/settings', label: 'Settings' },
]
