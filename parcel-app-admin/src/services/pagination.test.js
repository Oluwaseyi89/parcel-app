import { describe, expect, it } from 'vitest'
import { normalizePaginatedPayload, summarizeGroupPagination } from './pagination'

describe('normalizePaginatedPayload', () => {
  it('reads the standard paginated envelope as server-paginated', () => {
    const payload = {
      status: 'success',
      data: [{ id: 1 }, { id: 2 }],
      pagination: { page: 2, page_size: 2, total_count: 7, total_pages: 4, next: 'n', previous: 'p' },
    }

    expect(normalizePaginatedPayload(payload)).toEqual({
      items: [{ id: 1 }, { id: 2 }],
      total: 7,
      isServerPaginated: true,
      next: 'n',
      previous: 'p',
    })
  })

  it('still treats an unpaginated data array as local', () => {
    const result = normalizePaginatedPayload({ status: 'success', data: [{ id: 1 }] })

    expect(result.isServerPaginated).toBe(false)
    expect(result.total).toBe(1)
  })
})

describe('summarizeGroupPagination', () => {
  it('sums totals and uses the largest page count across requested groups', () => {
    const pagination = {
      vendors: { total_count: 45, total_pages: 3 },
      couriers: { total_count: 4, total_pages: 1 },
    }

    expect(summarizeGroupPagination(pagination, ['vendors', 'couriers'])).toEqual({ total: 49, totalPages: 3 })
  })

  it('ignores groups missing from the response', () => {
    expect(summarizeGroupPagination({ products: { total_count: 2, total_pages: 1 } }, ['vendors', 'products'])).toEqual({
      total: 2,
      totalPages: 1,
    })
    expect(summarizeGroupPagination(undefined, ['vendors'])).toEqual({ total: 0, totalPages: 1 })
  })
})
