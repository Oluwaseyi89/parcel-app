import { useEffect, useState } from 'react'
import PaginationControls from '../components/common/PaginationControls'
import TableStateRows from '../components/common/TableStateRows'
import useToast from '../hooks/useToast'
import { apiRequest } from '../services/api'
import { normalizePaginatedPayload, withPaginationParams } from '../services/pagination'

const TEMPLATE_TYPES = [
  'order_confirmation',
  'order_shipped',
  'order_delivered',
  'payment_received',
  'account_verification',
  'password_reset',
  'promotional',
  'notification',
  'custom',
]

const EMPTY_TEMPLATE = { name: '', template_type: 'custom', subject: '', body_html: '', is_active: true }
const EMPTY_SMTP = {
  name: '',
  host: '',
  port: 587,
  username: '',
  password: '',
  use_tls: true,
  use_ssl: false,
  default_from_email: '',
  default_from_name: '',
  is_active: false,
}

function usePagedList(path, token) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    try {
      setIsLoading(true)
      setError('')
      const payload = await apiRequest(withPaginationParams(path, page, pageSize), { method: 'GET', token })
      const normalized = normalizePaginatedPayload(payload)
      setRows(normalized.items)
      setTotal(normalized.total)
    } catch (err) {
      setError(err.message || 'Failed to load data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void load()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, token, page, pageSize])

  return { rows, total, page, setPage, pageSize, setPageSize, isLoading, error, reload: load }
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

function Pager({ list }) {
  return (
    <PaginationControls
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      onPageChange={list.setPage}
      onPageSizeChange={(next) => {
        list.setPageSize(next)
        list.setPage(1)
      }}
    />
  )
}

export default function MessagingPage({ token }) {
  const toast = useToast()
  const [tab, setTab] = useState('templates')
  const templates = usePagedList('/messaging/templates/', token)
  const emails = usePagedList('/messaging/emails/', token)
  const [smtp, setSmtp] = useState([])
  const [smtpError, setSmtpError] = useState('')

  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE)
  const [smtpForm, setSmtpForm] = useState(EMPTY_SMTP)
  const [testRecipient, setTestRecipient] = useState('')
  const [preview, setPreview] = useState(null)
  const [isBusy, setIsBusy] = useState(false)

  async function loadSmtp() {
    try {
      setSmtpError('')
      const payload = await apiRequest('/messaging/smtp-settings/', { method: 'GET', token })
      setSmtp(Array.isArray(payload?.data) ? payload.data : [])
    } catch (err) {
      setSmtpError(err.message || 'Failed to load SMTP settings.')
    }
  }

  useEffect(() => {
    if (tab === 'smtp') {
      queueMicrotask(() => {
        void loadSmtp()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token])

  async function run(action, success) {
    try {
      setIsBusy(true)
      const payload = await action()
      toast.success(payload?.message || success)
      return true
    } catch (err) {
      toast.error(err.message || 'Request failed.')
      return false
    } finally {
      setIsBusy(false)
    }
  }

  async function createTemplate(event) {
    event.preventDefault()
    const ok = await run(
      () => apiRequest('/messaging/templates/', { method: 'POST', token, body: templateForm }),
      'Template created.',
    )
    if (ok) {
      setTemplateForm(EMPTY_TEMPLATE)
      await templates.reload()
    }
  }

  async function toggleTemplate(template) {
    const ok = await run(
      () => apiRequest(`/messaging/templates/${template.id}/`, { method: 'PUT', token, body: { is_active: !template.is_active } }),
      template.is_active ? 'Template deactivated.' : 'Template activated.',
    )
    if (ok) await templates.reload()
  }

  async function deleteTemplate(template) {
    if (!window.confirm(`Delete template "${template.name}"?`)) return
    const ok = await run(() => apiRequest(`/messaging/templates/${template.id}/`, { method: 'DELETE', token }), 'Template deleted.')
    if (ok) await templates.reload()
  }

  async function previewTemplate(template) {
    // Fill each declared variable with a visible placeholder so the layout can be checked.
    const variables = Object.fromEntries((template.variable_list || template.variables || []).map((name) => [name, `[${name}]`]))
    try {
      const payload = await apiRequest(`/messaging/templates/${template.id}/preview/`, { method: 'POST', token, body: { variables } })
      setPreview({ name: template.name, html: payload?.data?.preview_html || '' })
    } catch (err) {
      toast.error(err.message || 'Failed to preview template.')
    }
  }

  async function createSmtp(event) {
    event.preventDefault()
    const ok = await run(
      () => apiRequest('/messaging/smtp-settings/', { method: 'POST', token, body: { ...smtpForm, port: Number(smtpForm.port) } }),
      'SMTP settings saved.',
    )
    if (ok) {
      setSmtpForm(EMPTY_SMTP)
      await loadSmtp()
    }
  }

  async function sendTest(event) {
    event.preventDefault()
    await run(
      () => apiRequest('/email/send-test/', { method: 'POST', token, body: { type: 'test', recipient: testRecipient.trim() } }),
      'Test email sent.',
    )
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h2>Messaging</h2>
          <p>Email templates, sent messages and outgoing mail settings.</p>
        </div>
      </div>

      <div className="users-tabs">
        {[
          ['templates', 'Templates'],
          ['emails', 'Sent emails'],
          ['smtp', 'SMTP & test email'],
        ].map(([key, label]) => (
          <button key={key} type="button" className={tab === key ? 'primary-btn' : 'ghost-btn'} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'templates' && (
        <>
          <section className="users-section">
            <h3>New template</h3>
            <form className="users-admin-form" onSubmit={createTemplate}>
              <input placeholder="Name" value={templateForm.name} onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))} required />
              <select value={templateForm.template_type} onChange={(e) => setTemplateForm((p) => ({ ...p, template_type: e.target.value }))}>
                {TEMPLATE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <input placeholder="Subject" value={templateForm.subject} onChange={(e) => setTemplateForm((p) => ({ ...p, subject: e.target.value }))} required />
              <textarea
                placeholder="HTML body — use {variable_name} placeholders"
                rows={6}
                value={templateForm.body_html}
                onChange={(e) => setTemplateForm((p) => ({ ...p, body_html: e.target.value }))}
                required
              />
              <label className="muted-inline">
                <input type="checkbox" checked={templateForm.is_active} onChange={(e) => setTemplateForm((p) => ({ ...p, is_active: e.target.checked }))} />
                Active
              </label>
              <button type="submit" className="primary-btn" disabled={isBusy}>
                Create template
              </button>
            </form>
          </section>

          <section className="users-section">
            <h3>Templates</h3>
            <Pager list={templates} />
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <TableStateRows
                    isLoading={templates.isLoading}
                    error={templates.error}
                    rows={templates.rows}
                    colSpan={5}
                    loadingMessage="Loading templates..."
                    emptyMessage="No templates yet."
                    onRetry={templates.reload}
                    renderRow={(template) => (
                      <tr key={template.id}>
                        <td>{template.name}</td>
                        <td>{String(template.template_type).replace(/_/g, ' ')}</td>
                        <td>{template.subject}</td>
                        <td>{template.is_active ? 'Active' : 'Inactive'}</td>
                        <td>
                          <button type="button" className="ghost-btn compact" onClick={() => previewTemplate(template)}>
                            Preview
                          </button>
                          <button type="button" className="ghost-btn compact" onClick={() => toggleTemplate(template)} disabled={isBusy}>
                            {template.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button type="button" className="ghost-btn compact" onClick={() => deleteTemplate(template)} disabled={isBusy}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    )}
                  />
                </tbody>
              </table>
            </div>
            {preview && (
              <div className="users-section">
                <h3>Preview: {preview.name}</h3>
                {/* Sandboxed so template HTML cannot run scripts in the admin app. */}
                <iframe title={`Preview of ${preview.name}`} sandbox="" srcDoc={preview.html} style={{ width: '100%', height: 360, border: '1px solid #e4e4e7' }} />
                <button type="button" className="ghost-btn compact" onClick={() => setPreview(null)}>
                  Close preview
                </button>
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'emails' && (
        <section className="users-section">
          <h3>Sent emails</h3>
          <Pager list={emails} />
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Recipients</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Opens</th>
                </tr>
              </thead>
              <tbody>
                <TableStateRows
                  isLoading={emails.isLoading}
                  error={emails.error}
                  rows={emails.rows}
                  colSpan={5}
                  loadingMessage="Loading emails..."
                  emptyMessage="No emails have been sent yet."
                  onRetry={emails.reload}
                  renderRow={(email) => (
                    <tr key={email.id}>
                      <td>{email.subject}</td>
                      <td>{Array.isArray(email.recipients) ? email.recipients.map((r) => r.email).join(', ') : '—'}</td>
                      <td>{email.status_display || email.status}</td>
                      <td>{formatDate(email.sent_at || email.created_at)}</td>
                      <td>{email.open_count ?? 0}</td>
                    </tr>
                  )}
                />
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'smtp' && (
        <>
          <section className="users-section">
            <h3>Send a test email</h3>
            <form className="users-admin-form" onSubmit={sendTest}>
              <input type="email" placeholder="Recipient email" value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} required />
              <button type="submit" className="primary-btn" disabled={isBusy}>
                Send test email
              </button>
            </form>
            <p className="muted-inline">Uses the server's configured mail settings (EMAIL_HOST on the API service).</p>
          </section>

          <section className="users-section">
            <h3>SMTP configurations</h3>
            {smtpError ? <p className="form-error">{smtpError}</p> : null}
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Host</th>
                    <th>From</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  <TableStateRows
                    isLoading={false}
                    error=""
                    rows={smtp}
                    colSpan={4}
                    emptyMessage="No SMTP configurations saved."
                    renderRow={(row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        <td>
                          {row.host}:{row.port}
                        </td>
                        <td>{row.default_from_name ? `${row.default_from_name} <${row.default_from_email}>` : row.default_from_email}</td>
                        <td>{row.is_active ? 'Yes' : 'No'}</td>
                      </tr>
                    )}
                  />
                </tbody>
              </table>
            </div>
          </section>

          <section className="users-section">
            <h3>Add SMTP configuration</h3>
            <form className="users-admin-form" onSubmit={createSmtp}>
              <input placeholder="Name" value={smtpForm.name} onChange={(e) => setSmtpForm((p) => ({ ...p, name: e.target.value }))} required />
              <input placeholder="Host" value={smtpForm.host} onChange={(e) => setSmtpForm((p) => ({ ...p, host: e.target.value }))} required />
              <input type="number" placeholder="Port" value={smtpForm.port} onChange={(e) => setSmtpForm((p) => ({ ...p, port: e.target.value }))} required />
              <input type="email" placeholder="Username" value={smtpForm.username} onChange={(e) => setSmtpForm((p) => ({ ...p, username: e.target.value }))} required />
              <input type="password" placeholder="Password" autoComplete="new-password" value={smtpForm.password} onChange={(e) => setSmtpForm((p) => ({ ...p, password: e.target.value }))} required />
              <input type="email" placeholder="Default from email" value={smtpForm.default_from_email} onChange={(e) => setSmtpForm((p) => ({ ...p, default_from_email: e.target.value }))} required />
              <input placeholder="Default from name" value={smtpForm.default_from_name} onChange={(e) => setSmtpForm((p) => ({ ...p, default_from_name: e.target.value }))} />
              <label className="muted-inline">
                <input type="checkbox" checked={smtpForm.use_tls} onChange={(e) => setSmtpForm((p) => ({ ...p, use_tls: e.target.checked, use_ssl: e.target.checked ? false : p.use_ssl }))} />
                Use TLS
              </label>
              <label className="muted-inline">
                <input type="checkbox" checked={smtpForm.use_ssl} onChange={(e) => setSmtpForm((p) => ({ ...p, use_ssl: e.target.checked, use_tls: e.target.checked ? false : p.use_tls }))} />
                Use SSL
              </label>
              <label className="muted-inline">
                <input type="checkbox" checked={smtpForm.is_active} onChange={(e) => setSmtpForm((p) => ({ ...p, is_active: e.target.checked }))} />
                Make active
              </label>
              <button type="submit" className="primary-btn" disabled={isBusy}>
                Save configuration
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  )
}
