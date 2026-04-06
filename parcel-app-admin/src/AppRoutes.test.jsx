import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from './AppRoutes'
import { apiRequest } from './services/api'
import {
  clearSession,
  isSessionValid,
  mapSessionFromPayload,
  readSession,
  saveSession,
} from './services/session'

vi.mock('./services/api', () => ({
  apiRequest: vi.fn(),
}))

vi.mock('./services/session', () => ({
  clearSession: vi.fn(),
  isSessionValid: vi.fn(),
  mapSessionFromPayload: vi.fn(),
  readSession: vi.fn(),
  saveSession: vi.fn(),
}))

vi.mock('./pages/DashboardPage', () => ({
  default: () => <div>Dashboard Stub</div>,
}))

vi.mock('./pages/UsersPage', () => ({
  default: () => <div>Users Stub</div>,
}))

vi.mock('./pages/ModerationPage', () => ({
  default: () => <div>Moderation Stub</div>,
}))

vi.mock('./pages/OrdersPage', () => ({
  default: () => <div>Orders Stub</div>,
}))

vi.mock('./pages/DispatchPage', () => ({
  default: () => <div>Dispatch Stub</div>,
}))

vi.mock('./pages/ComplaintsPage', () => ({
  default: () => <div>Complaints Stub</div>,
}))

vi.mock('./pages/BankingPage', () => ({
  default: () => <div>Banking Stub</div>,
}))

vi.mock('./pages/SettingsPage', () => ({
  default: () => <div>Settings Stub</div>,
}))

describe('AppRoutes auth guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated users to the login page', async () => {
    readSession.mockReturnValue(null)
    isSessionValid.mockReturnValue(false)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Admin Sign In' })).toBeInTheDocument()
    expect(clearSession).toHaveBeenCalled()
  })

  it('renders protected content when a stored session is refreshed successfully', async () => {
    const storedSession = {
      token: 'session-token',
      email: 'admin@parcel.com',
      role: 'admin',
    }

    readSession.mockReturnValue(storedSession)
    isSessionValid.mockImplementation((session) => Boolean(session?.token && session?.email && session?.role))
    apiRequest.mockResolvedValue({
      data: {
        email: 'admin@parcel.com',
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
      },
    })
    mapSessionFromPayload.mockReturnValue(storedSession)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Dashboard Stub')).toBeInTheDocument()
    expect(saveSession).toHaveBeenCalledWith(storedSession)
    expect(screen.getByText('admin@parcel.com')).toBeInTheDocument()
  })
})
