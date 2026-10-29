"use client";

import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Pagination, PaginatedResponse } from "@/lib/types/backend";

/**
 * Loads one page of a list endpoint. Works with paginated responses ({data, pagination}) and
 * with endpoints that return the whole list in `data`.
 */
export function usePaginatedList<T>(path: string | null, pageSize = 10) {
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!path) return;
    setIsLoading(true);
    setError("");
    try {
      const separator = path.includes("?") ? "&" : "?";
      const body = await apiRequest<PaginatedResponse<T>>(`${path}${separator}page=${page}&page_size=${pageSize}`);
      setItems(Array.isArray(body?.data) ? body.data : []);
      setPagination(body?.pagination ?? null);
    } catch (err) {
      setItems([]);
      setPagination(null);
      setError(err instanceof Error ? err.message : "Unable to load data.");
    } finally {
      setIsLoading(false);
    }
  }, [path, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  // A new path (e.g. a changed filter) starts again from the first page.
  useEffect(() => {
    setPage(1);
  }, [path]);

  return { items, setItems, pagination, page, setPage, isLoading, error, reload: load };
}
