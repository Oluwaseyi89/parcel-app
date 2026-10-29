"use client";

import { useState } from "react";

import { DashboardFeedback } from "@/components/dashboard/DashboardUi";
import PaginationBar from "@/components/dashboard/shared/PaginationBar";
import { apiRequest } from "@/lib/api";
import { usePaginatedList } from "@/lib/hooks/usePaginatedList";
import type { ApiNotification } from "@/lib/types/backend";

export default function NotificationsPanel() {
  const { items, setItems, pagination, page, setPage, isLoading, error, reload } =
    usePaginatedList<ApiNotification>("/messaging/notifications/");
  const [actionError, setActionError] = useState("");

  const unread = items.filter((note) => !note.is_read).length;

  async function markRead(id: number) {
    setActionError("");
    try {
      await apiRequest(`/messaging/notifications/${id}/`, { method: "PATCH", body: { action: "mark_read" } });
      setItems((prev) => prev.map((note) => (note.id === id ? { ...note, is_read: true } : note)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update notification.");
    }
  }

  async function markAllRead() {
    setActionError("");
    try {
      await apiRequest("/messaging/notifications/", { method: "POST", body: { action: "mark_all_read" } });
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update notifications.");
    }
  }

  return (
    <div className="space-y-3">
      <DashboardFeedback error={error || actionError} isLoading={isLoading} />
      <div className="flex items-center justify-between">
        <p className="text-zinc-700">Unread on this page: {unread}</p>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-sm font-medium text-danger">
            Mark all as read
          </button>
        )}
      </div>
      {!isLoading && !error && items.length === 0 && <p className="text-sm text-zinc-500">You have no notifications.</p>}
      {items.map((note) => (
        <div
          key={note.id}
          className={`rounded-lg border p-4 ${note.is_read ? "border-zinc-200" : "border-blue-200 bg-blue-50"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-zinc-900">{note.title}</p>
            {!note.is_read && (
              <button className="text-xs font-medium text-danger" onClick={() => markRead(note.id)}>
                Mark read
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-600">{note.message}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {note.type_display ?? note.notification_type} · {new Date(note.created_at).toLocaleString()}
          </p>
        </div>
      ))}
      <PaginationBar pagination={pagination} page={page} onPageChange={setPage} />
    </div>
  );
}
