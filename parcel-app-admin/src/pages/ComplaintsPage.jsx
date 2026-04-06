import { useEffect, useState } from 'react'
import PaginationControls from '../components/common/PaginationControls'
import TableStateRows from '../components/common/TableStateRows'
import { useToast } from '../components/common/ToastProvider'
import { apiRequest } from '../services/api'
import { normalizePaginatedPayload, paginateLocal, withPaginationParams } from '../services/pagination'

export default function ComplaintsPage({ token }) {
  const toast = useToast()
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [resolvedFilter, setResolvedFilter] = useState('all')
  const [satisfiedFilter, setSatisfiedFilter] = useState('all')

  const [resolvedById, setResolvedById] = useState({})
  const [satisfiedById, setSatisfiedById] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  function buildQuery() {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (resolvedFilter !== 'all') params.set('is_resolved', resolvedFilter)
    if (satisfiedFilter !== 'all') params.set('is_satisfied', satisfiedFilter)
    const query = params.toString()
    return query ? `/auth/api/complaints/?${query}` : '/auth/api/complaints/'
  }

  async function loadComplaints() {
    try {
      setIsLoading(true)
      setError('')
      const path = withPaginationParams(buildQuery(), page, pageSize)
      const payload = await apiRequest(path, {
        method: 'GET',
        token,
      })

      const normalized = normalizePaginatedPayload(payload)
      const localPage = paginateLocal(normalized.items, page, pageSize)
      const list = normalized.isServerPaginated ? normalized.items : localPage.items
      setComplaints(list)
      setTotal(normalized.isServerPaginated ? normalized.total : localPage.total)

      const resolvedDefaults = {}
      const satisfiedDefaults = {}
      list.forEach((item) => {
        resolvedDefaults[item.id] = Boolean(item.is_resolved)
        satisfiedDefaults[item.id] = Boolean(item.is_satisfied)
      })
      setResolvedById(resolvedDefaults)
      setSatisfiedById(satisfiedDefaults)
    } catch (err) {
      setError(err.message || 'Failed to load complaints.')
      toast.error(err.message || 'Failed to load complaints.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadComplaints()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, resolvedFilter, satisfiedFilter, page, pageSize])

  async function handleUpdateComplaint(complaintId) {
    try {
      setIsSubmitting(true)
      setError('')
      setNotice('')
      const payload = await apiRequest(`/auth/api/complaints/${complaintId}/update/`, {
        method: 'PATCH',
        token,
        body: {
          is_resolved: Boolean(resolvedById[complaintId]),
          is_satisfied: Boolean(satisfiedById[complaintId]),
        },
      })

      setNotice(payload?.message || 'Complaint updated successfully.')
      toast.success(payload?.message || 'Complaint updated successfully.')
      await loadComplaints()
    } catch (err) {
      setError(err.message || 'Failed to update complaint.')
      toast.error(err.message || 'Failed to update complaint.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="complaints-page">
      <div className="complaints-header">
        <div>
          <h2>Complaints Management</h2>
          <p>Triage customer complaints and track resolution outcomes.</p>
        </div>
        <div className="complaints-stat-chip">Cases: {total}</div>
      </div>

      <div className="complaints-filters">
        <input
          type="search"
          placeholder="Search by customer, subject, or courier"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={resolvedFilter} onChange={(event) => setResolvedFilter(event.target.value)}>
          <option value="all">All resolution states</option>
          <option value="true">Resolved</option>
          <option value="false">Unresolved</option>
        </select>

        <select value={satisfiedFilter} onChange={(event) => setSatisfiedFilter(event.target.value)}>
          <option value="all">All satisfaction states</option>
          <option value="true">Satisfied</option>
          <option value="false">Unsatisfied</option>
        </select>

        <button type="button" className="ghost-btn" onClick={loadComplaints} disabled={isLoading}>
          Apply Filters
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {notice ? <p className="form-success">{notice}</p> : null}

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPageSize(next)
          setPage(1)
        }}
      />

      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Subject</th>
              <th>Courier</th>
              <th>Detail</th>
              <th>Resolved</th>
              <th>Satisfied</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <TableStateRows
              isLoading={isLoading}
              error={error}
              rows={complaints}
              colSpan={8}
              loadingMessage="Loading complaints..."
              emptyMessage="No complaints found."
              onRetry={loadComplaints}
              renderRow={(item) => (
                <tr key={item.id}>
                  <td>{item.customer_email || 'n/a'}</td>
                  <td>{item.complaint_subject || 'n/a'}</td>
                  <td>{item.courier_involved || 'n/a'}</td>
                  <td>
                    <div className="complaint-detail-cell">{item.complaint_detail || 'n/a'}</div>
                  </td>
                  <td>
                    <select
                      value={resolvedById[item.id] ? 'true' : 'false'}
                      onChange={(event) =>
                        setResolvedById((prev) => ({
                          ...prev,
                          [item.id]: event.target.value === 'true',
                        }))
                      }
                    >
                      <option value="true">Resolved</option>
                      <option value="false">Unresolved</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={satisfiedById[item.id] ? 'true' : 'false'}
                      onChange={(event) =>
                        setSatisfiedById((prev) => ({
                          ...prev,
                          [item.id]: event.target.value === 'true',
                        }))
                      }
                    >
                      <option value="true">Satisfied</option>
                      <option value="false">Unsatisfied</option>
                    </select>
                  </td>
                  <td>{item.updated_at || 'n/a'}</td>
                  <td>
                    <button
                      type="button"
                      className="ghost-btn compact"
                      onClick={() => handleUpdateComplaint(item.id)}
                      disabled={isSubmitting}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              )}
            />
          </tbody>
        </table>
      </div>
    </div>
  )
}
