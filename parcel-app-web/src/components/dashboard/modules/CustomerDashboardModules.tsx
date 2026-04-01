"use client";

import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/api";
import { formatNaira, getProductName, getProductPrice } from "@/lib/productHelpers";
import type { Product, User } from "@/lib/types";

type CustomerTab = "carts" | "orders" | "deliveries" | "notifications" | "complaints";

interface CartRow {
  id: number | string;
  product_id: number | string;
  product_name?: string;
  quantity: number;
}

interface DispatchProduct {
  order_id: number | string;
  product_id: number | string;
  product_name?: string;
  quantity?: number;
  total_amount?: number;
  is_delivered?: boolean;
  is_received?: boolean;
}

interface DispatchDeal {
  order_id: number | string;
  email?: string;
  customer_name?: string;
  total_items?: number;
  total_price?: number;
  is_delivered?: boolean;
  products: DispatchProduct[];
}

interface ComplaintItem {
  id: number;
  complaint_subject: string;
  courier_involved: string;
  complaint_detail?: string;
  is_resolved?: boolean;
  is_satisfied?: boolean;
  created_at?: string;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const staticNotifications: NotificationItem[] = [
  { id: 1, title: "Order Update", message: "Your recent order is being prepared.", time: "10 mins ago", read: false },
  { id: 2, title: "Payment Confirmed", message: "Your payment was received successfully.", time: "3 hours ago", read: false },
  { id: 3, title: "Welcome", message: "Welcome to Parcel App customer dashboard.", time: "2 days ago", read: true },
];

export default function CustomerDashboardModules({ tab, user }: { tab: CustomerTab; user: User | null }) {
  const customerName = useMemo(() => `${String(user?.last_name ?? "")} ${String(user?.first_name ?? "")}`.trim(), [user?.first_name, user?.last_name]);

  const [cartRows, setCartRows] = useState<CartRow[]>([]);
  const [cartProducts, setCartProducts] = useState<Record<string, Product>>({});

  const [deliveries, setDeliveries] = useState<DispatchDeal[]>([]);

  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintCourier, setComplaintCourier] = useState("");
  const [complaintDetail, setComplaintDetail] = useState("");

  const [notifications, setNotifications] = useState<NotificationItem[]>(staticNotifications);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.email || !customerName) {
      return;
    }

    if (tab === "carts") {
      apiRequest<{ status?: string; data?: CartRow[] }>(`/parcel_customer/get_cart/${encodeURIComponent(customerName)}/`, { method: "GET" })
        .then((res) => setCartRows(Array.isArray(res.data) ? res.data : []))
        .catch(() => setCartRows([]));
      return;
    }

    if (tab === "deliveries") {
      apiRequest<{ deals?: DispatchDeal[] }>("/parcel_dispatch/get_dispatch_from_db/", { method: "GET" })
        .then((res) => {
          const deals = Array.isArray(res.deals) ? res.deals : [];
          setDeliveries(deals.filter((deal) => String(deal.email ?? "") === String(user.email)));
        })
        .catch(() => setDeliveries([]));
      return;
    }

    if (tab === "complaints") {
      apiRequest<{ data?: ComplaintItem[] }>(`/parcel_backends/get_dist_complain/${encodeURIComponent(String(user.email))}/`, { method: "GET" })
        .then((res) => setComplaints(Array.isArray(res.data) ? res.data.filter((c) => !c.is_satisfied) : []))
        .catch(() => setComplaints([]));
    }
  }, [tab, user?.email, customerName]);

  useEffect(() => {
    if (tab !== "carts" || cartRows.length === 0) {
      return;
    }

    Promise.all(
      cartRows.map((row) =>
        apiRequest<{ status?: string; data?: Product }>(`/parcel_product/get_sing_prod/${row.product_id}/`, { method: "GET" })
          .then((res) => [String(row.product_id), res.data] as const)
          .catch(() => [String(row.product_id), undefined] as const),
      ),
    ).then((pairs) => {
      const next: Record<string, Product> = {};
      for (const [key, value] of pairs) {
        if (value) {
          next[key] = value;
        }
      }
      setCartProducts(next);
    });
  }, [tab, cartRows]);

  async function markReceived(orderId: number | string, productId: number | string, checked: boolean) {
    setError("");
    setMessage("");
    try {
      await apiRequest<{ status?: string; data?: string }>(`/parcel_dispatch/update_dispatched_product/${orderId}/${productId}/`, {
        method: "PATCH",
        body: {
          is_received: checked,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>,
        json: true,
      });
      setMessage("Delivery receipt updated.");
      setDeliveries((prev) =>
        prev.map((deal) =>
          String(deal.order_id) !== String(orderId)
            ? deal
            : {
                ...deal,
                products: deal.products.map((prod) =>
                  String(prod.product_id) === String(productId) ? { ...prod, is_received: checked } : prod,
                ),
              },
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update receipt.");
    }
  }

  async function submitComplaint(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!user?.email || !complaintSubject || !complaintCourier || !complaintDetail) {
      setError("Please complete all complaint fields.");
      return;
    }

    try {
      const payload = {
        customer_email: user.email,
        complaint_subject: complaintSubject,
        courier_involved: complaintCourier,
        complaint_detail: complaintDetail,
        is_resolved: false,
        is_satisfied: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const res = await apiRequest<{ status?: string; data?: string }>("/parcel_backends/customer_complain/", {
        method: "POST",
        body: payload as Record<string, unknown>,
        json: true,
      });

      setMessage(String(res.data ?? "Complaint submitted."));
      setComplaintSubject("");
      setComplaintCourier("");
      setComplaintDetail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit complaint.");
    }
  }

  async function markComplaintSatisfied(id: number, checked: boolean) {
    setError("");
    try {
      await apiRequest<{ status?: string; data?: string }>(`/parcel_backends/update_complain/${id}/`, {
        method: "PATCH",
        body: {
          is_satisfied: checked,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>,
        json: true,
      });
      setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, is_satisfied: checked } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update complaint.");
    }
  }

  if (tab === "carts") {
    const amount = cartRows.reduce((sum, row) => {
      const product = cartProducts[String(row.product_id)];
      return sum + getProductPrice(product ?? {}) * Number(row.quantity ?? 0);
    }, 0);

    return (
      <div className="space-y-4">
        <p className="text-zinc-700">Saved cart items: {cartRows.length}</p>
        {cartRows.length === 0 && <p className="text-sm text-zinc-500">No saved cart records found.</p>}
        {cartRows.map((row) => {
          const product = cartProducts[String(row.product_id)] ?? ({ id: row.product_id } as Product);
          const price = getProductPrice(product);
          return (
            <div key={`cart-${row.product_id}`} className="rounded-lg border border-zinc-200 p-4">
              <p className="font-medium text-zinc-900">{row.product_name || getProductName(product)}</p>
              <p className="text-sm text-zinc-600">Qty: {row.quantity}</p>
              <p className="text-sm text-zinc-600">Unit: {formatNaira(price)}</p>
              <p className="text-sm font-semibold text-danger">Amount: {formatNaira(price * Number(row.quantity ?? 0))}</p>
            </div>
          );
        })}
        <div className="rounded-lg bg-zinc-50 p-4 text-sm font-semibold text-zinc-800">Estimated total: {formatNaira(amount)}</div>
      </div>
    );
  }

  if (tab === "orders") {
    return (
      <div className="space-y-3">
        <p className="text-zinc-700">Order history view migrated.</p>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Detailed order timeline cards from legacy app are next; checkout and payment lifecycle is already active.
        </div>
      </div>
    );
  }

  if (tab === "deliveries") {
    return (
      <div className="space-y-4">
        {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <p className="text-zinc-700">Expected delivery groups: {deliveries.length}</p>
        {deliveries.map((deal) => (
          <div key={String(deal.order_id)} className="rounded-lg border border-zinc-200 p-4">
            <p className="font-medium text-zinc-900">Order #{deal.order_id}</p>
            <p className="text-sm text-zinc-600">Total: {formatNaira(Number(deal.total_price ?? 0))}</p>
            <div className="mt-3 space-y-2">
              {deal.products.map((prod) => (
                <label key={`${deal.order_id}-${prod.product_id}`} className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-sm">
                  <span>{prod.product_name || `Product ${prod.product_id}`}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(prod.is_received)}
                    onChange={(e) => markReceived(deal.order_id, prod.product_id, e.target.checked)}
                    disabled={!prod.is_delivered}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "notifications") {
    const unread = notifications.filter((n) => !n.read).length;
    return (
      <div className="space-y-3">
        <p className="text-zinc-700">Unread notifications: {unread}</p>
        {notifications.map((note) => (
          <div key={note.id} className={`rounded-lg border p-4 ${note.read ? "border-zinc-200" : "border-blue-200 bg-blue-50"}`}>
            <div className="flex items-center justify-between">
              <p className="font-medium text-zinc-900">{note.title}</p>
              {!note.read && (
                <button
                  className="text-xs font-medium text-danger"
                  onClick={() => setNotifications((prev) => prev.map((n) => (n.id === note.id ? { ...n, read: true } : n)))}
                >
                  Mark read
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-600">{note.message}</p>
            <p className="mt-1 text-xs text-zinc-500">{note.time}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={submitComplaint} className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <input value={complaintSubject} onChange={(e) => setComplaintSubject(e.target.value)} placeholder="Complaint Subject" className="w-full rounded-lg border border-zinc-300 px-3 py-2.5" />
        <input value={complaintCourier} onChange={(e) => setComplaintCourier(e.target.value)} placeholder="Courier Name" className="w-full rounded-lg border border-zinc-300 px-3 py-2.5" />
        <textarea value={complaintDetail} onChange={(e) => setComplaintDetail(e.target.value)} placeholder="Complaint details" className="h-32 w-full rounded-lg border border-zinc-300 px-3 py-2.5" />
        <button type="submit" className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:brightness-95">Submit Complaint</button>
      </form>

      <div className="space-y-2">
        {complaints.map((item) => (
          <div key={item.id} className="rounded-lg border border-zinc-200 p-4">
            <p className="font-medium text-zinc-900">{item.complaint_subject}</p>
            <p className="text-sm text-zinc-600">Courier: {item.courier_involved}</p>
            <p className="mt-1 text-sm text-zinc-600">{item.complaint_detail}</p>
            {item.is_resolved && (
              <label className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" checked={Boolean(item.is_satisfied)} onChange={(e) => markComplaintSatisfied(item.id, e.target.checked)} />
                Mark as satisfied
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
