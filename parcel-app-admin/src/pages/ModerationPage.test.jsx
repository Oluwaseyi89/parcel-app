import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../components/common/ToastProvider'
import ModerationPage from './ModerationPage'
import { apiRequest } from '../services/api'

vi.mock('../services/api', () => ({
  apiRequest: vi.fn(),
}))

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

function makeQueue(status = 'pending') {
  return {
    data: {
      vendors: [
        {
          id: 1,
          first_name: 'Ada',
          last_name: 'Vendor',
          email: 'ada@example.com',
          business_name: 'Ada Stores',
          approval_status: status,
          submitted_at: '2026-04-06T00:00:00.000Z',
        },
      ],
      couriers: [],
      products: [],
      summary: {
        vendors: 1,
        couriers: 0,
        products: 0,
      },
    },
  }
}

describe('ModerationPage', () => {
  it('optimistically updates a moderation row before the API resolves', async () => {
    const user = userEvent.setup()
    const patchRequest = createDeferred()

    apiRequest.mockResolvedValueOnce(makeQueue('pending'))
    apiRequest.mockImplementationOnce(() => patchRequest.promise)
    apiRequest.mockResolvedValueOnce(makeQueue('approved'))

    render(
      <ToastProvider>
        <ModerationPage token="session-token" />
      </ToastProvider>,
    )

    const vendorRow = (await screen.findByText('Ada Stores')).closest('tr')
    expect(within(vendorRow).getByText('pending')).toBeInTheDocument()

    await user.click(within(vendorRow).getByRole('button', { name: 'Approve' }))

    expect(within(screen.getByText('Ada Stores').closest('tr')).getByText('approved')).toBeInTheDocument()
    expect(apiRequest).toHaveBeenCalledWith('/auth/api/moderation/vendors/1/', {
      method: 'PATCH',
      token: 'session-token',
      body: {
        action: 'approve',
        reason: '',
      },
    })

    patchRequest.resolve({ message: 'Moderation updated successfully.' })

    const successMessages = await screen.findAllByText('Moderation updated successfully.')
    expect(successMessages.length).toBeGreaterThan(0)
  })

  it('rolls back the optimistic status when the moderation API fails', async () => {
    const user = userEvent.setup()
    const patchRequest = createDeferred()

    apiRequest.mockResolvedValueOnce(makeQueue('pending'))
    apiRequest.mockImplementationOnce(() => patchRequest.promise)

    render(
      <ToastProvider>
        <ModerationPage token="session-token" />
      </ToastProvider>,
    )

    const vendorRow = (await screen.findByText('Ada Stores')).closest('tr')

    await user.click(within(vendorRow).getByRole('button', { name: 'Reject' }))

    expect(within(screen.getByText('Ada Stores').closest('tr')).getByText('rejected')).toBeInTheDocument()

    patchRequest.reject(new Error('Moderation API failed'))

    const errorMessages = await screen.findAllByText('Moderation API failed')
    expect(errorMessages.length).toBeGreaterThan(0)
    await waitFor(() => {
      expect(within(screen.getByText('Ada Stores').closest('tr')).getByText('pending')).toBeInTheDocument()
    })
  })
})
