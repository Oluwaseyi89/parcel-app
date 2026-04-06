import { API_BASE_URL } from '../config/constants'

function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`
}

export async function apiRequest(path, options = {}) {
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
