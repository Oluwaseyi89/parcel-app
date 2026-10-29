"use client";

import type { Pagination } from "@/lib/types/backend";

export default function PaginationBar({
  pagination,
  page,
  onPageChange,
}: {
  pagination: Pagination | null;
  page: number;
  onPageChange: (page: number) => void;
}) {
  if (!pagination || pagination.total_pages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-zinc-100 pt-4 text-sm text-zinc-600">
      <span>
        Page {page} of {pagination.total_pages} · {pagination.total_count} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!pagination.previous}
          className="rounded-lg border border-zinc-300 px-3 py-1 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!pagination.next}
          className="rounded-lg border border-zinc-300 px-3 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
