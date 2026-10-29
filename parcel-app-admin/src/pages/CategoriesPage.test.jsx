import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../components/common/ToastProvider'
import CategoriesPage from './CategoriesPage'
import { apiRequest } from '../services/api'

vi.mock('../services/api', () => ({
  apiRequest: vi.fn(),
}))

function listPayload(items) {
  return {
    status: 'success',
    data: items,
    pagination: { page: 1, page_size: 20, total_count: items.length, total_pages: 1, next: null, previous: null },
  }
}

function renderPage() {
  return render(
    <ToastProvider>
      <CategoriesPage token="admin-token" />
    </ToastProvider>,
  )
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    apiRequest.mockReset()
  })

  it('lists categories from the paginated API', async () => {
    apiRequest.mockResolvedValueOnce(listPayload([{ id: 1, name: 'Phones', slug: 'phones', description: 'Mobile phones' }]))

    renderPage()

    expect(await screen.findByText('Phones')).toBeInTheDocument()
    expect(apiRequest).toHaveBeenCalledWith('/product/categories/?page=1&page_size=20', { method: 'GET', token: 'admin-token' })
  })

  it('derives the slug from the name and creates the category', async () => {
    const user = userEvent.setup()
    apiRequest
      .mockResolvedValueOnce(listPayload([]))
      .mockResolvedValueOnce({ status: 'success', data: { id: 2, name: 'Home & Kitchen', slug: 'home-kitchen' } })
      .mockResolvedValueOnce(listPayload([{ id: 2, name: 'Home & Kitchen', slug: 'home-kitchen' }]))

    renderPage()
    expect(await screen.findByText(/No categories yet/)).toBeInTheDocument()

    await user.type(screen.getByLabelText('Name'), 'Home & Kitchen')
    expect(screen.getByLabelText('Slug')).toHaveValue('home-kitchen')

    await user.click(screen.getByRole('button', { name: 'Create category' }))

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/product/categories/create/', {
        method: 'POST',
        token: 'admin-token',
        body: { name: 'Home & Kitchen', slug: 'home-kitchen', description: '' },
      }),
    )
    expect(await screen.findByText('home-kitchen')).toBeInTheDocument()
  })

  it('stops following the name once the slug is edited by hand', async () => {
    const user = userEvent.setup()
    apiRequest.mockResolvedValueOnce(listPayload([]))

    renderPage()
    await screen.findByText(/No categories yet/)

    await user.type(screen.getByLabelText('Slug'), 'custom slug')
    await user.type(screen.getByLabelText('Name'), 'Phones')

    expect(screen.getByLabelText('Slug')).toHaveValue('custom-slug')
  })

  it('shows the API error when creation fails', async () => {
    const user = userEvent.setup()
    apiRequest.mockResolvedValueOnce(listPayload([])).mockRejectedValueOnce(new Error('category with this slug already exists.'))

    renderPage()
    await screen.findByText(/No categories yet/)

    await user.type(screen.getByLabelText('Name'), 'Phones')
    await user.click(screen.getByRole('button', { name: 'Create category' }))

    expect(await screen.findByText('category with this slug already exists.')).toBeInTheDocument()
  })
})
