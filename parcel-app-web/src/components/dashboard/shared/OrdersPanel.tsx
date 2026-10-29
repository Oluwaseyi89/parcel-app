"use client";

import { useState } from "react";

import { DashboardFeedback } from "@/components/dashboard/DashboardUi";
import PaginationBar from "@/components/dashboard/shared/PaginationBar";
import { apiRequest } from "@/lib/api";
import { usePaginatedList } from "@/lib/hooks/usePaginatedList";
import { formatNaira } from "@/lib/productHelpers";
import type { ApiOrder, DashboardRole, OrderStatus } from "@/lib/types/backend";

const FILTERS: Array<OrderStatus | "all"> = ["all", "pending", "confirmed", "processing", "ready", "dispatched", "in_transit", "delivered", "cancelled"];

// Steps a vendor may take; later steps (dispatch onwards) belong to admins and couriers.
const VENDOR_NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: "confirmed", label: "Confirm order" },
  confirmed: { status: "processing", label: "Start processing" },
  processing: { status: "ready", label: "Mark ready for dispatch" },
};

// Courier orders come from a dedicated endpoint that only lists active deliveries.
const LIST_PATH: Record<DashboardRole, string> = {
  customer: "/order/",
  vendor: "/order/",
  courier: "/order/courier/",
};

export default function OrdersPanel({ role, vendorId }: { role: DashboardRole; vendorId?: number | string }) {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const basePath = LIST_PATH[role];
  const path = filter === "all" || role === "courier" ? basePath : `${basePath}?status=${filter}`;
  const { items, pagination, page, setPage, isLoading, error, reload } = usePaginatedList<ApiOrder>(path);

  async function runAction(order: ApiOrder, action: () => Promise<unknown>, success: string) {
    setMessage("");
    setActionError("");
    setBusyId(order.id);
    try {
      await action();
      setMessage(success);
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update the order.");
    } finally {
      setBusyId(null);
    }
  }

  function cancelOrder(order: ApiOrder) {
    // Customers cancel their own pending orders through the order detail endpoint.
    return runAction(order, () => apiRequest(`/order/${order.id}/`, { method: "PATCH", body: {} }), `Order ${order.order_number} cancelled.`);
  }

  function advanceOrder(order: ApiOrder, next: OrderStatus) {
    return runAction(
      order,
      () => apiRequest(`/order/${order.id}/status/`, { method: "POST", body: { status: next } }),
      `Order ${order.order_number} updated to ${next.replace("_", " ")}.`,
    );
  }

  return (
    <div className="space-y-4">
      <DashboardFeedback message={message} error={error || actionError} isLoading={isLoading} />
      {role !== "courier" && (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filter === status ? "bg-danger text-white" : "bg-zinc-100 text-zinc-700"}`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
      )}
      {!isLoading && !error && items.length === 0 && <p className="text-sm text-zinc-500">No orders to show.</p>}
      {items.map((order) => {
        // Vendors only see (and act on) the lines for their own products.
        const lines = role === "vendor" && vendorId != null ? order.items.filter((item) => String(item.vendor) === String(vendorId)) : order.items;
        const vendorStep = role === "vendor" ? VENDOR_NEXT_STATUS[order.status] : undefined;
        const busy = busyId === order.id;
        return (
          <div key={order.id} className="rounded-lg border border-zinc-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-zinc-900">{order.order_number}</p>
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">{order.status.replace("_", " ")}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              {new Date(order.created_at).toLocaleDateString()} · Payment: {order.payment_status}
              {order.tracking_number ? ` · Tracking: ${order.tracking_number}` : ""}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-700">
              {lines.map((item) => (
                <li key={item.id}>
                  {item.quantity} × {item.product_name} — {formatNaira(Number(item.total_price))}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm font-semibold text-danger">Order total: {formatNaira(Number(order.total_amount))}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {role === "customer" && order.status === "pending" && order.can_be_cancelled !== false && (
                <button
                  disabled={busy}
                  onClick={() => cancelOrder(order)}
                  className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Cancel order
                </button>
              )}
              {vendorStep && (
                <button
                  disabled={busy}
                  onClick={() => advanceOrder(order, vendorStep.status)}
                  className="rounded-lg bg-danger px-3 py-1 text-xs font-medium text-white hover:brightness-95 disabled:opacity-50"
                >
                  {vendorStep.label}
                </button>
              )}
            </div>
          </div>
        );
      })}
      <PaginationBar pagination={pagination} page={page} onPageChange={setPage} />
    </div>
  );
}
