export function normalizePaginatedPayload(payload) {
  if (!payload) {
    return { items: [], total: 0, isServerPaginated: false }
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
