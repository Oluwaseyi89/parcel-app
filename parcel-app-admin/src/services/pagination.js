export function normalizePaginatedPayload(payload) {
  if (!payload) {
    return { items: [], total: 0, isServerPaginated: false }
  }

  // Standard API envelope: { status, data: [...], pagination: { total_count, ... } }
  if (Array.isArray(payload?.data) && typeof payload?.pagination?.total_count === 'number') {
    return {
      items: payload.data,
      total: payload.pagination.total_count,
      isServerPaginated: true,
      next: payload.pagination.next,
      previous: payload.pagination.previous,
    }
  }

  if (Array.isArray(payload?.results) && typeof payload?.count === 'number') {
    return {
      items: payload.results,
      total: payload.count,
      isServerPaginated: true,
      next: payload.next,
      previous: payload.previous,
    }
  }

  if (Array.isArray(payload?.data)) {
    return {
      items: payload.data,
      total: payload.data.length,
      isServerPaginated: false,
    }
  }

  if (payload?.data && typeof payload.data === 'object') {
    return normalizePaginatedPayload(payload.data)
  }

  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      isServerPaginated: false,
    }
  }

  return { items: [], total: 0, isServerPaginated: false }
}

export function paginateLocal(items, page, pageSize) {
  const safeItems = Array.isArray(items) ? items : []
  const safePage = Math.max(1, Number(page) || 1)
  const safePageSize = Math.max(1, Number(pageSize) || 10)
  const start = (safePage - 1) * safePageSize

  return {
    items: safeItems.slice(start, start + safePageSize),
    total: safeItems.length,
  }
}

export function withPaginationParams(path, page, pageSize) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}page=${page}&page_size=${pageSize}`
}

// Grouped listings (moderation queue, banking) paginate each group with the shared ?page,
// so one screen shows a page from every group and the page count is the largest group's.
export function summarizeGroupPagination(pagination, groups) {
  const metas = groups.map((group) => pagination?.[group]).filter(Boolean)
  return {
    total: metas.reduce((sum, meta) => sum + (Number(meta.total_count) || 0), 0),
    totalPages: Math.max(1, ...metas.map((meta) => Number(meta.total_pages) || 1)),
  }
}
