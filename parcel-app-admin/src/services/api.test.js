import { describe, expect, it, vi } from 'vitest'
import { apiRequest } from './api'

describe('apiRequest', () => {
  it('sends JSON bodies with the session token header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { ok: true } }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/auth/api/orders/', {
      method: 'POST',
      token: 'session-token',
      body: { status: 'approved' },
      headers: {
        'X-Test': '1',
      },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:7000/auth/api/orders/',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ status: 'approved' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Session-Token': 'session-token',
          'X-Test': '1',
        }),
      }),
    )
  })

  it('surfaces nested server error messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          errors: {
            error: ['Session token expired'],
          },
        }),
      }),
    )

    await expect(apiRequest('/auth/api/profile/', { method: 'GET' })).rejects.toThrow(
      'Session token expired',
    )
  })

  it('falls back to the default error message when the response body is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error('invalid json')),
      }),
    )

    await expect(apiRequest('/auth/api/profile/', { method: 'GET' })).rejects.toThrow(
      'Request failed. Please try again.',
    )
  })
})
