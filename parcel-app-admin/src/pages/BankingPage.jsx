import { useEffect, useMemo, useState } from 'react'
import PaginationControls from '../components/common/PaginationControls'
import TableStateRows from '../components/common/TableStateRows'
import useToast from '../hooks/useToast'
import { apiRequest } from '../services/api'
import { paginateLocal } from '../services/pagination'

export default function BankingPage({ token }) {
  const toast = useToast()
  const [vendors, setVendors] = useState([])
  const [couriers, setCouriers] = useState([])
  const [activeType, setActiveType] = useState('all')
  const [search, setSearch] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [formByKey, setFormByKey] = useState({})

  const visibleRows = useMemo(() => {
    if (activeType === 'vendors') return vendors
    if (activeType === 'couriers') return couriers
    return [...vendors, ...couriers]
  }, [activeType, vendors, couriers])

  const pagedRows = useMemo(() => paginateLocal(visibleRows, page, pageSize), [visibleRows, page, pageSize])

  async function loadBanking() {
    try {
      setIsLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (activeType !== 'all') params.set('type', activeType)
      if (search.trim()) params.set('search', search.trim())
      const query = params.toString()
      const path = query ? `/auth/api/banking/?${query}` : '/auth/api/banking/'

      const payload = await apiRequest(path, {
        method: 'GET',
        token,
      })

      const vendorRows = Array.isArray(payload?.data?.vendors) ? payload.data.vendors : []
      const courierRows = Array.isArray(payload?.data?.couriers) ? payload.data.couriers : []
      setVendors(vendorRows)
      setCouriers(courierRows)

      const defaults = {}
      ;[...vendorRows, ...courierRows].forEach((row) => {
        const key = `${row.type}-${row.id}`
        defaults[key] = {
          account_name: row.account_name || '',
          account_no: row.account_no || '',
          bank_name: row.bank_name || '',
          account_type: row.account_type || 'Savings',
          email: row.email || '',
          updated_at: row.updated_at || '',
        }
      })
      setFormByKey(defaults)
    } catch (err) {
      setError(err.message || 'Failed to load banking records.')
      toast.error(err.message || 'Failed to load banking records.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBanking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeType])

  async function handleSave(row) {
    const key = `${row.type}-${row.id}`
    const form = formByKey[key]
    if (!form) return

    try {
      setIsSubmitting(true)
      setError('')
      setNotice('')

      const body = {
        account_name: form.account_name,
        account_no: form.account_no,
        bank_name: form.bank_name,
        account_type: form.account_type,
        updated_at: form.updated_at,
      }

      if (row.type === 'vendor') {
        body.vendor_email = form.email
      }
      if (row.type === 'courier') {
        body.courier_email = form.email
      }

      const payload = await apiRequest(`/auth/api/banking/${row.type}/${row.id}/update/`, {
        method: 'PATCH',
        token,
        body,
      })

      setNotice(payload?.message || 'Banking record updated successfully.')
      toast.success(payload?.message || 'Banking record updated successfully.')
      await loadBanking()
    } catch (err) {
      setError(err.message || 'Failed to update banking record.')
      toast.error(err.message || 'Failed to update banking record.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function setField(key, field, value) {
    setFormByKey((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }))
  }

  return (
    <div className="banking-page">
      <div className="banking-header">
        <div>
          <h2>Banking Management</h2>
          <p>Review and update vendor/courier payout account records.</p>
        </div>
        <div className="banking-stat-chip">Records: {visibleRows.length}</div>
      </div>

      <div className="banking-filters">
        <select value={activeType} onChange={(event) => setActiveType(event.target.value)}>
          <option value="all">All accounts</option>
          <option value="vendors">Vendor accounts</option>
          <option value="couriers">Courier accounts</option>
        </select>

        <input
          type="search"
          placeholder="Search by email, account name, or bank"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <button type="button" className="ghost-btn" onClick={loadBanking} disabled={isLoading}>
          Apply Filters
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {notice ? <p className="form-success">{notice}</p> : null}

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={visibleRows.length}
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
              <th>Type</th>
              <th>Email</th>
              <th>Account Name</th>
              <th>Account No</th>
              <th>Bank</th>
              <th>Account Type</th>
              <th>Updated At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <TableStateRows
              isLoading={isLoading}
              error={error}
              rows={pagedRows.items}
              colSpan={8}
              loadingMessage="Loading banking records..."
              emptyMessage="No banking records found."
              onRetry={loadBanking}
              renderRow={(row) => {
                const key = `${row.type}-${row.id}`
                const form = formByKey[key] || {}
                return (
                  <tr key={key}>
                    <td>{row.type}</td>
                    <td>
                      <input
                        type="email"
                        value={form.email || ''}
                        onChange={(event) => setField(key, 'email', event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={form.account_name || ''}
                        onChange={(event) => setField(key, 'account_name', event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={form.account_no || ''}
                        onChange={(event) => setField(key, 'account_no', event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={form.bank_name || ''}
                        onChange={(event) => setField(key, 'bank_name', event.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        value={form.account_type || 'Savings'}
                        onChange={(event) => setField(key, 'account_type', event.target.value)}
                      >
                        <option value="Savings">Savings</option>
                        <option value="Current">Current</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="e.g. 2026-04-06"
                        value={form.updated_at || ''}
                        onChange={(event) => setField(key, 'updated_at', event.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="ghost-btn compact"
                        onClick={() => handleSave(row)}
                        disabled={isSubmitting}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                )
              }}
            />
          </tbody>
        </table>
      </div>
    </div>
  )
}
