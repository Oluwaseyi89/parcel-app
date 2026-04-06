import { useEffect, useState } from 'react'
import { useToast } from '../components/common/ToastProvider'
import { apiRequest } from '../services/api'
import { API_BASE_URL } from '../config/constants'

export default function SettingsPage({ token, session }) {
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadProfile() {
    try {
      setIsLoading(true)
      setError('')
      const payload = await apiRequest('/auth/api/profile/', {
        method: 'GET',
        token,
      })
      const data = payload?.data || {}
      setProfile(data)
      setProfileForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
      })
    } catch (err) {
      setError(err.message || 'Failed to load profile settings.')
      toast.error(err.message || 'Failed to load profile settings.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleSaveProfile(event) {
    event.preventDefault()
    try {
      setIsSavingProfile(true)
      setError('')
      setNotice('')
      const payload = await apiRequest('/auth/api/profile/', {
        method: 'PATCH',
        token,
        body: profileForm,
      })
      setNotice(payload?.message || 'Profile updated successfully.')
      toast.success(payload?.message || 'Profile updated successfully.')
      await loadProfile()
    } catch (err) {
      setError(err.message || 'Failed to update profile.')
      toast.error(err.message || 'Failed to update profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault()
    try {
      setIsChangingPassword(true)
      setError('')
      setNotice('')
      const payload = await apiRequest('/auth/api/change-password/', {
        method: 'POST',
        token,
        body: passwordForm,
      })
      setNotice(payload?.message || 'Password changed successfully.')
      toast.success(payload?.message || 'Password changed successfully.')
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (err) {
      setError(err.message || 'Failed to change password.')
      toast.error(err.message || 'Failed to change password.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h2>Settings</h2>
          <p>Manage profile details, credentials, and environment context.</p>
        </div>
        <div className="settings-chip">Role: {profile?.role || session?.role || 'n/a'}</div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {notice ? <p className="form-success">{notice}</p> : null}

      <section className="settings-section">
        <h3>Profile</h3>
        {isLoading ? (
          <p>Loading profile...</p>
        ) : error && !profile ? (
          <div>
            <p className="form-error">{error}</p>
            <button type="button" className="ghost-btn" onClick={loadProfile}>
              Retry
            </button>
          </div>
        ) : null}

        <form className="settings-form" onSubmit={handleSaveProfile}>
          <label>
            Email
            <input type="email" value={profile?.email || session?.email || ''} disabled />
          </label>
          <label>
            First Name
            <input
              type="text"
              value={profileForm.first_name}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  first_name: event.target.value,
                }))
              }
              required
            />
          </label>
          <label>
            Last Name
            <input
              type="text"
              value={profileForm.last_name}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  last_name: event.target.value,
                }))
              }
              required
            />
          </label>
          <label>
            Phone
            <input
              type="text"
              value={profileForm.phone}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  phone: event.target.value,
                }))
              }
              placeholder="Optional"
            />
          </label>

          <button type="submit" className="primary-btn" disabled={isSavingProfile}>
            {isSavingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h3>Security</h3>
        <form className="settings-form" onSubmit={handleChangePassword}>
          <label>
            Current Password
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(event) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  current_password: event.target.value,
                }))
              }
              required
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(event) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  new_password: event.target.value,
                }))
              }
              minLength={8}
              required
            />
          </label>
          <label>
            Confirm New Password
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(event) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  confirm_password: event.target.value,
                }))
              }
              minLength={8}
              required
            />
          </label>

          <button type="submit" className="primary-btn" disabled={isChangingPassword}>
            {isChangingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h3>Environment</h3>
        <div className="settings-kv-grid">
          <div>
            <p className="settings-kv-label">API Base URL</p>
            <p className="settings-kv-value">{API_BASE_URL}</p>
          </div>
          <div>
            <p className="settings-kv-label">Session Email</p>
            <p className="settings-kv-value">{session?.email || 'n/a'}</p>
          </div>
          <div>
            <p className="settings-kv-label">Token Present</p>
            <p className="settings-kv-value">{session?.token ? 'yes' : 'no'}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
