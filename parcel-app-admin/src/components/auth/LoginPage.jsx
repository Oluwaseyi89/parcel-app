import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

export default function LoginPage({ onLogin, session }) {
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
