import { useEffect, useState } from 'react'
import PaginationControls from '../components/common/PaginationControls'
import TableStateRows from '../components/common/TableStateRows'
import useToast from '../hooks/useToast'
import { apiRequest } from '../services/api'
import { normalizePaginatedPayload, withPaginationParams } from '../services/pagination'

// While typing, only replace disallowed characters so a separator can be entered; the ends are
// trimmed when the slug is finalised.
function slugifyPartial(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function slugify(value) {
  return slugifyPartial(value).replace(/^-+|-+$/g, '')
}

const EMPTY_FORM = { name: '', slug: '', description: '' }

export default function CategoriesPage({ token }) {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [slugEdited, setSlugEdited] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function loadCategories() {
    try {
      setIsLoading(true)
      setError('')
      const payload = await apiRequest(withPaginationParams('/product/categories/', page, pageSize), { method: 'GET', token })
      const normalized = normalizePaginatedPayload(payload)
      setCategories(normalized.items)
      setTotal(normalized.total)
    } catch (err) {
      setError(err.message || 'Failed to load categories.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadCategories()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, pageSize])

  function updateName(name) {
    // Keep the slug in step with the name until the admin edits it directly.
    setForm((prev) => ({ ...prev, name, slug: slugEdited ? prev.slug : slugify(name) }))
  }

  async function handleCreate(event) {
    event.preventDefault()
    setFormError('')
    try {
      setIsSaving(true)
      const payload = await apiRequest('/product/categories/create/', {
        method: 'POST',
        token,
        body: { name: form.name.trim(), slug: slugify(form.slug), description: form.description.trim() },
      })
      toast.success(payload?.message || 'Category created.')
      setForm(EMPTY_FORM)
      setSlugEdited(false)
      await loadCategories()
    } catch (err) {
      setFormError(err.message || 'Failed to create category.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h2>Product Categories</h2>
          <p>Categories vendors can assign to their products.</p>
        </div>
      </div>

      <section className="settings-section">
        <h3>Add category</h3>
        <form className="settings-form" onSubmit={handleCreate}>
          <label>
            Name
            <input value={form.name} onChange={(event) => updateName(event.target.value)} maxLength={100} required />
          </label>
          <label>
            Slug
            <input
              value={form.slug}
              onChange={(event) => {
                setSlugEdited(true)
                setForm((prev) => ({ ...prev, slug: slugifyPartial(event.target.value) }))
              }}
              maxLength={100}
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
            />
          </label>
          {formError ? <p className="form-error">{formError}</p> : null}
          <button type="submit" className="primary-btn" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Create category'}
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h3>Existing categories</h3>
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
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <TableStateRows
                isLoading={isLoading}
                error={error}
                rows={categories}
                colSpan={3}
                loadingMessage="Loading categories..."
                emptyMessage="No categories yet. Vendors cannot categorise products until you add some."
                onRetry={loadCategories}
                renderRow={(category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.slug}</td>
                    <td>{category.description || '—'}</td>
                  </tr>
                )}
              />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
