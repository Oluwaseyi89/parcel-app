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

const RECIPIENT_GROUPS = [
  ['', 'No group (specific emails only)'],
  ['all_customers', 'All verified customers'],
  ['active_vendors', 'All approved vendors'],
  ['couriers', 'All approved couriers'],
]

const EMPTY_BULK = { template_id: '', name: '', description: '', user_type: '', emails: '' }

function parseEmails(value) {
  return value
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter(Boolean)
}

function StatCard({ label, value }) {
  return (
    <div className="users-stat-card">
      <div className="users-stat-label">{label}</div>
      <div className="users-stat-value">{value}</div>
    </div>
  )
}

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

  const [activeTemplates, setActiveTemplates] = useState([])
  const [bulkForm, setBulkForm] = useState(EMPTY_BULK)
  const [bulkResult, setBulkResult] = useState(null)
  const [bulkError, setBulkError] = useState('')

  const [stats, setStats] = useState(null)
  const [statsRange, setStatsRange] = useState({ start_date: '', end_date: '' })
  const [statsError, setStatsError] = useState('')

  async function loadSmtp() {
    try {
      setSmtpError('')
      const payload = await apiRequest('/messaging/smtp-settings/', { method: 'GET', token })
      setSmtp(Array.isArray(payload?.data) ? payload.data : [])
    } catch (err) {
      setSmtpError(err.message || 'Failed to load SMTP settings.')
    }
  }

  async function loadActiveTemplates() {
    try {
      const payload = await apiRequest(withPaginationParams('/messaging/templates/?is_active=true', 1, 100), { method: 'GET', token })
      setActiveTemplates(Array.isArray(payload?.data) ? payload.data : [])
    } catch (err) {
      setBulkError(err.message || 'Failed to load templates.')
    }
  }

  async function loadStats() {
    try {
      setStatsError('')
      const params = new URLSearchParams()
      if (statsRange.start_date) params.set('start_date', statsRange.start_date)
      if (statsRange.end_date) params.set('end_date', statsRange.end_date)
      const query = params.toString()
      const payload = await apiRequest(query ? `/messaging/stats/?${query}` : '/messaging/stats/', { method: 'GET', token })
      setStats(payload?.data || null)
    } catch (err) {
      setStatsError(err.message || 'Failed to load email stats.')
    }
  }

  useEffect(() => {
    if (tab === 'bulk') {
      queueMicrotask(() => {
        void loadActiveTemplates()
      })
    }
    if (tab === 'stats') {
      queueMicrotask(() => {
        void loadStats()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token])

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

  async function sendBulk(event) {
    event.preventDefault()
    setBulkError('')
    setBulkResult(null)
    const recipientEmails = parseEmails(bulkForm.emails)
    if (!bulkForm.user_type && recipientEmails.length === 0) {
      setBulkError('Choose a recipient group or enter at least one email address.')
      return
    }
    try {
      setIsBusy(true)
      const payload = await apiRequest('/messaging/bulk-email/', {
        method: 'POST',
        token,
        body: {
          template_id: Number(bulkForm.template_id),
          name: bulkForm.name.trim(),
          description: bulkForm.description.trim(),
          recipient_filter: bulkForm.user_type ? { user_type: bulkForm.user_type } : {},
          recipient_emails: recipientEmails,
        },
      })
      setBulkResult(payload?.data || null)
      toast.success(payload?.message || 'Bulk email created.')
      setBulkForm(EMPTY_BULK)
    } catch (err) {
      setBulkError(err.message || 'Failed to send bulk email.')
    } finally {
      setIsBusy(false)
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
          ['bulk', 'Bulk email'],
          ['stats', 'Stats'],
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

      {tab === 'bulk' && (
        <section className="users-section">
          <h3>Send a bulk email</h3>
          <form className="users-admin-form" onSubmit={sendBulk}>
            <select value={bulkForm.template_id} onChange={(e) => setBulkForm((p) => ({ ...p, template_id: e.target.value }))} required>
              <option value="">Choose an active template</option>
              {activeTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} — {template.subject}
                </option>
              ))}
            </select>
            <input placeholder="Campaign name" value={bulkForm.name} onChange={(e) => setBulkForm((p) => ({ ...p, name: e.target.value }))} maxLength={100} required />
            <input placeholder="Description (optional)" value={bulkForm.description} onChange={(e) => setBulkForm((p) => ({ ...p, description: e.target.value }))} />
            <select value={bulkForm.user_type} onChange={(e) => setBulkForm((p) => ({ ...p, user_type: e.target.value }))}>
              {RECIPIENT_GROUPS.map(([value, label]) => (
                <option key={value || 'none'} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <textarea
              rows={3}
              placeholder="Additional recipient emails, separated by commas or new lines"
              value={bulkForm.emails}
              onChange={(e) => setBulkForm((p) => ({ ...p, emails: e.target.value }))}
            />
            {bulkError ? <p className="form-error">{bulkError}</p> : null}
            <button type="submit" className="primary-btn" disabled={isBusy}>
              {isBusy ? 'Sending...' : 'Send bulk email'}
            </button>
          </form>
          {activeTemplates.length === 0 && !bulkError ? <p className="muted-inline">Create and activate a template first.</p> : null}
          {bulkResult && (
            <div className="users-stats">
              <StatCard label="Status" value={bulkResult.status_display || bulkResult.status} />
              <StatCard label="Recipients" value={bulkResult.total_recipients ?? 0} />
              <StatCard label="Sent" value={bulkResult.success_count ?? 0} />
              <StatCard label="Failed" value={bulkResult.failure_count ?? 0} />
            </div>
          )}
        </section>
      )}

      {tab === 'stats' && (
        <section className="users-section">
          <h3>Email stats</h3>
          <form
            className="users-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadStats()
            }}
          >
            <label className="muted-inline">
              From
              <input type="date" value={statsRange.start_date} onChange={(e) => setStatsRange((p) => ({ ...p, start_date: e.target.value }))} />
            </label>
            <label className="muted-inline">
              To
              <input type="date" value={statsRange.end_date} onChange={(e) => setStatsRange((p) => ({ ...p, end_date: e.target.value }))} />
            </label>
            <button type="submit" className="ghost-btn">
              Apply
            </button>
          </form>
          <p className="muted-inline">Defaults to the last 30 days.</p>
          {statsError ? <p className="form-error">{statsError}</p> : null}
          {stats && (
            <>
              <div className="users-stats">
                <StatCard label="Sent" value={stats.total_sent} />
                <StatCard label="Delivered" value={stats.total_delivered} />
                <StatCard label="Opened" value={stats.total_opened} />
                <StatCard label="Clicked" value={stats.total_clicked} />
                <StatCard label="Open rate" value={`${stats.open_rate}%`} />
                <StatCard label="Click rate" value={`${stats.click_rate}%`} />
                <StatCard label="Bounce rate" value={`${stats.bounce_rate}%`} />
              </div>
              <h3>Top templates</h3>
              {stats.top_templates?.length ? (
                <ul className="activity-list">
                  {stats.top_templates.map((row) => (
                    <li key={row.template__name}>
                      {row.template__name}: {row.count}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted-inline">No template emails in this period.</p>
              )}
              <h3>Recent activity</h3>
              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Sent</th>
                      <th>Opens</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableStateRows
                      isLoading={false}
                      error=""
                      rows={stats.recent_activity || []}
                      colSpan={4}
                      emptyMessage="No emails in this period."
                      renderRow={(row) => (
                        <tr key={row.id}>
                          <td>{row.subject}</td>
                          <td>{row.status}</td>
                          <td>{formatDate(row.sent_at)}</td>
                          <td>{row.open_count ?? 0}</td>
                        </tr>
                      )}
                    />
                  </tbody>
                </table>
              </div>
            </>
          )}
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
