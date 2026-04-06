import { useEffect, useState } from 'react'
import PaginationControls from '../components/common/PaginationControls'
import TableStateRows from '../components/common/TableStateRows'
import { useToast } from '../components/common/ToastProvider'
import { apiRequest } from '../services/api'
import { normalizePaginatedPayload, paginateLocal, withPaginationParams } from '../services/pagination'

export default function UsersPage({ token, role }) {
  const toast = useToast()
  const canManageAdmins = role === 'super_admin'
  const [activeTab, setActiveTab] = useState(canManageAdmins ? 'admins' : 'customers')

  const [admins, setAdmins] = useState([])
  const [customers, setCustomers] = useState([])
  const [adminTotal, setAdminTotal] = useState(0)
  const [customerTotal, setCustomerTotal] = useState(0)

  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [customerError, setCustomerError] = useState('')
  const [adminNotice, setAdminNotice] = useState('')

  const [adminPage, setAdminPage] = useState(1)
  const [adminPageSize, setAdminPageSize] = useState(10)
  const [customerPage, setCustomerPage] = useState(1)
  const [customerPageSize, setCustomerPageSize] = useState(10)

  const [customerSearch, setCustomerSearch] = useState('')
  const [customerActiveFilter, setCustomerActiveFilter] = useState('all')
  const [customerVerifiedFilter, setCustomerVerifiedFilter] = useState('all')

  const [newAdmin, setNewAdmin] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'staff',
    password: '',
    confirm_password: '',
  })
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)

  const customersTotal = customerTotal
  const customersVerified = customers.filter((customer) => customer.is_email_verified).length

  function formatDate(value) {
    if (!value) return 'n/a'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'n/a'
    return date.toLocaleDateString()
  }

  function buildCustomerQuery() {
    const params = new URLSearchParams()
    if (customerSearch.trim()) {
      params.set('search', customerSearch.trim())
    }
    if (customerActiveFilter !== 'all') {
      params.set('is_active', customerActiveFilter)
    }
    if (customerVerifiedFilter !== 'all') {
      params.set('is_email_verified', customerVerifiedFilter)
    }

    const query = params.toString()
    return query ? `/auth/api/customers/?${query}` : '/auth/api/customers/'
  }

  async function loadAdmins() {
    if (!canManageAdmins) return

    try {
      setIsLoadingAdmins(true)
      setAdminError('')
      const payload = await apiRequest('/auth/api/admins/', {
        method: 'GET',
        token,
      })
      const normalized = normalizePaginatedPayload(payload?.data)
      if (normalized) {
        setAdmins(normalized.items)
        setAdminTotal(normalized.total)
      } else {
        const base = Array.isArray(payload?.data) ? payload.data : []
        const paginated = paginateLocal(base, adminPage, adminPageSize)
        setAdmins(paginated.items)
        setAdminTotal(paginated.total)
      }
    } catch (error) {
      setAdminError(error.message || 'Failed to load admin accounts.')
      toast.error(error.message || 'Failed to load admin accounts.')
    } finally {
      setIsLoadingAdmins(false)
    }
  }

  async function loadCustomers() {
    try {
      setIsLoadingCustomers(true)
      setCustomerError('')
      const endpoint = withPaginationParams(buildCustomerQuery(), customerPage, customerPageSize)
      const payload = await apiRequest(endpoint, {
        method: 'GET',
        token,
      })
      const normalized = normalizePaginatedPayload(payload?.data)
      if (normalized) {
        setCustomers(normalized.items)
        setCustomerTotal(normalized.total)
      } else {
        const base = Array.isArray(payload?.data) ? payload.data : []
        const paginated = paginateLocal(base, customerPage, customerPageSize)
        setCustomers(paginated.items)
        setCustomerTotal(paginated.total)
      }
    } catch (error) {
      setCustomerError(error.message || 'Failed to load customers.')
      toast.error(error.message || 'Failed to load customers.')
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  useEffect(() => {
    if (canManageAdmins) {
      loadAdmins()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canManageAdmins, adminPage, adminPageSize])

  useEffect(() => {
    loadCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, customerActiveFilter, customerVerifiedFilter, customerPage, customerPageSize])

  async function handleCreateAdmin(event) {
    event.preventDefault()
    if (!canManageAdmins || isCreatingAdmin) return

    setAdminError('')
    setAdminNotice('')

    try {
      setIsCreatingAdmin(true)
      const payload = await apiRequest('/auth/api/admins/', {
        method: 'POST',
        token,
        body: newAdmin,
      })

      setAdminNotice(payload?.message || 'Admin user created successfully.')
      toast.success(payload?.message || 'Admin user created successfully.')
      setNewAdmin({
        email: '',
        first_name: '',
        last_name: '',
        role: 'staff',
        password: '',
        confirm_password: '',
      })

      await loadAdmins()
    } catch (error) {
      setAdminError(error.message || 'Unable to create admin user.')
      toast.error(error.message || 'Unable to create admin user.')
    } finally {
      setIsCreatingAdmin(false)
    }
  }

  async function handleDeactivateAdmin(adminId) {
    if (!canManageAdmins || !adminId) return

    try {
      setAdminError('')
      setAdminNotice('')
      const payload = await apiRequest(`/auth/api/admins/${adminId}/`, {
        method: 'DELETE',
        token,
      })
      setAdminNotice(payload?.message || 'Admin account deactivated.')
      toast.success(payload?.message || 'Admin account deactivated.')
      await loadAdmins()
    } catch (error) {
      setAdminError(error.message || 'Unable to deactivate admin account.')
      toast.error(error.message || 'Unable to deactivate admin account.')
    }
  }

  async function handleVerifyCustomer(customerId) {
    if (!customerId) return

    try {
      setCustomerError('')
      await apiRequest(`/auth/api/customers/${customerId}/`, {
        method: 'PATCH',
        token,
        body: {
          is_email_verified: true,
        },
      })
      toast.success('Customer verified successfully.')
      await loadCustomers()
    } catch (error) {
      setCustomerError(error.message || 'Unable to update customer.')
      toast.error(error.message || 'Unable to update customer.')
    }
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h2>Users Management</h2>
          <p>Operate admin and customer accounts from a single control center.</p>
        </div>
        <div className="users-stats">
          <div className="users-stat-card">
            <p className="users-stat-label">Customers</p>
            <p className="users-stat-value">{customersTotal}</p>
          </div>
          <div className="users-stat-card">
            <p className="users-stat-label">Verified Customers</p>
            <p className="users-stat-value">{customersVerified}</p>
          </div>
          <div className="users-stat-card">
            <p className="users-stat-label">Admin Accounts</p>
            <p className="users-stat-value">{adminTotal}</p>
          </div>
        </div>
      </div>

      <div className="users-tabs" role="tablist" aria-label="Users tabs">
        {canManageAdmins ? (
          <button
            type="button"
            className={`users-tab ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            Admin Accounts
          </button>
        ) : null}
        <button
          type="button"
          className={`users-tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customers
        </button>
      </div>

      {activeTab === 'admins' && canManageAdmins ? (
        <section className="users-section">
          <h3>Create Admin User</h3>
          <form className="users-admin-form" onSubmit={handleCreateAdmin}>
            <input
              type="email"
              placeholder="Email"
              value={newAdmin.email}
              onChange={(event) => setNewAdmin((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="First name"
              value={newAdmin.first_name}
              onChange={(event) => setNewAdmin((prev) => ({ ...prev, first_name: event.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Last name"
              value={newAdmin.last_name}
              onChange={(event) => setNewAdmin((prev) => ({ ...prev, last_name: event.target.value }))}
              required
            />
            <select
              value={newAdmin.role}
              onChange={(event) => setNewAdmin((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="staff">Staff</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
            <input
              type="password"
              placeholder="Password"
              value={newAdmin.password}
              onChange={(event) => setNewAdmin((prev) => ({ ...prev, password: event.target.value }))}
              minLength={8}
              required
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={newAdmin.confirm_password}
              onChange={(event) => setNewAdmin((prev) => ({ ...prev, confirm_password: event.target.value }))}
              minLength={8}
              required
            />
            <button type="submit" className="primary-btn" disabled={isCreatingAdmin}>
              {isCreatingAdmin ? 'Creating...' : 'Create Admin'}
            </button>
          </form>

          {adminError ? <p className="form-error">{adminError}</p> : null}
          {adminNotice ? <p className="form-success">{adminNotice}</p> : null}

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <TableStateRows
                  isLoading={isLoadingAdmins}
                  error={adminError}
                  rows={admins}
                  colSpan={6}
                  loadingMessage="Loading admin accounts..."
                  emptyMessage="No admin accounts found."
                  onRetry={loadAdmins}
                  renderRow={(admin) => (
                    <tr key={admin.id}>
                      <td>{admin.full_name || `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'n/a'}</td>
                      <td>{admin.email}</td>
                      <td>{admin.role_display || admin.role}</td>
                      <td>{admin.is_active ? 'Active' : 'Inactive'}</td>
                      <td>{formatDate(admin.last_login)}</td>
                      <td>
                        {admin.is_active ? (
                          <button
                            type="button"
                            className="ghost-btn compact"
                            onClick={() => handleDeactivateAdmin(admin.id)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <span className="muted-inline">No action</span>
                        )}
                      </td>
                    </tr>
                  )}
                />
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={adminPage}
            pageSize={adminPageSize}
            total={adminTotal}
            pageSizeOptions={[10, 20, 50]}
            onPageChange={setAdminPage}
            onPageSizeChange={(size) => {
              setAdminPageSize(size)
              setAdminPage(1)
            }}
          />
        </section>
      ) : null}

      {activeTab === 'customers' ? (
        <section className="users-section">
          <h3>Customer Directory</h3>
          <div className="users-filters">
            <input
              type="search"
              placeholder="Search by email or name"
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
            />
            <select
              value={customerActiveFilter}
              onChange={(event) => setCustomerActiveFilter(event.target.value)}
            >
              <option value="all">All status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select
              value={customerVerifiedFilter}
              onChange={(event) => setCustomerVerifiedFilter(event.target.value)}
            >
              <option value="all">All verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setCustomerPage(1)
                loadCustomers()
              }}
            >
              Apply Filters
            </button>
          </div>

          {customerError ? <p className="form-error">{customerError}</p> : null}

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Country/State</th>
                  <th>Verified</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <TableStateRows
                  isLoading={isLoadingCustomers}
                  error={customerError}
                  rows={customers}
                  colSpan={7}
                  loadingMessage="Loading customers..."
                  emptyMessage="No customers matched your filters."
                  onRetry={loadCustomers}
                  renderRow={(customer) => (
                    <tr key={customer.id}>
                      <td>{customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'n/a'}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || 'n/a'}</td>
                      <td>{[customer.country, customer.state].filter(Boolean).join(', ') || 'n/a'}</td>
                      <td>{customer.is_email_verified ? 'Yes' : 'No'}</td>
                      <td>{formatDate(customer.created_at)}</td>
                      <td>
                        {!customer.is_email_verified ? (
                          <button
                            type="button"
                            className="ghost-btn compact"
                            onClick={() => handleVerifyCustomer(customer.id)}
                          >
                            Verify
                          </button>
                        ) : (
                          <span className="muted-inline">No action</span>
                        )}
                      </td>
                    </tr>
                  )}
                />
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={customerPage}
            pageSize={customerPageSize}
            total={customerTotal}
            pageSizeOptions={[10, 20, 50]}
            onPageChange={setCustomerPage}
            onPageSizeChange={(size) => {
              setCustomerPageSize(size)
              setCustomerPage(1)
            }}
          />
        </section>
      ) : null}
    </div>
  )
}
