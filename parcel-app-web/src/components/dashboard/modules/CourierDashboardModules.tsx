"use client";

import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import { formatNaira } from "@/lib/productHelpers";
import type { User } from "@/lib/types";

type CourierTab = "deals" | "dispatches" | "transactions" | "resolutions";

interface CourierDeal {
  dispatch_id: number | string;
  order_id: number | string;
  customer_name?: string;
  address?: string;
  phone_no?: string;
  handled_dispatch?: boolean;
  products: Array<{
    dispatch_item_id: number | string;
    product_id: number | string;
    vendor_name?: string;
    vendor_phone?: string;
    vendor_address?: string;
    is_supply_ready?: boolean;
  }>;
}

interface CourierDispatch {
  dispatch_id: number | string;
  order_id: number | string;
  courier_email?: string;
  customer_name?: string;
  total_price?: number;
  products: Array<{
    dispatch_item_id: number | string;
    product_id: number | string;
    product_name?: string;
    quantity?: number;
    total_amount?: number;
    is_picked_up?: boolean;
    is_delivered?: boolean;
  }>;
}

interface BankDetails {
  bank_name: string;
  account_type: string;
  account_name: string;
  account_no: string;
}

interface CourierTransaction {
  id: number;
  reference: string;
  amount: number;
  status: "pending" | "settled";
  date: string;
}

interface CourierResolutionCard {
  id: number;
  title: string;
  description: string;
}

const initialBank: BankDetails = {
  bank_name: "",
  account_type: "",
  account_name: "",
  account_no: "",
};

const sampleTransactions: CourierTransaction[] = [
  { id: 1, reference: "CR-1001", amount: 12000, status: "settled", date: "2026-03-18" },
  { id: 2, reference: "CR-1002", amount: 8500, status: "settled", date: "2026-03-17" },
  { id: 3, reference: "CR-1003", amount: 5500, status: "pending", date: "2026-03-16" },
];

const resolutionCards: CourierResolutionCard[] = [
  { id: 1, title: "Issue Resolution", description: "Track and resolve delivery issues." },
  { id: 2, title: "Customer Feedback", description: "Review ratings and comments from customers." },
  { id: 3, title: "Performance Metrics", description: "Monitor delivery performance trends." },
];

export default function CourierDashboardModules({ tab, user }: { tab: CourierTab; user: User | null }) {
  const [deals, setDeals] = useState<CourierDeal[]>([]);
  const [dispatches, setDispatches] = useState<CourierDispatch[]>([]);

  const [bank, setBank] = useState<BankDetails>(initialBank);
  const [fetchedBank, setFetchedBank] = useState<Partial<BankDetails>>({});
  const [transactions] = useState<CourierTransaction[]>(sampleTransactions);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const email = String(user?.email ?? "");
  const courierName = `${String(user?.last_name ?? "")} ${String(user?.first_name ?? "")}`.trim();

  function extractDispatchList(payload: unknown): Array<Record<string, unknown>> {
    if (!payload || typeof payload !== "object") {
      return [];
    }

    const body = payload as Record<string, unknown>;
    if (body.results && typeof body.results === "object") {
      const wrapped = body.results as Record<string, unknown>;
      if (Array.isArray(wrapped.data)) {
        return wrapped.data as Array<Record<string, unknown>>;
      }
    }
    if (Array.isArray(body.data)) {
      return body.data as Array<Record<string, unknown>>;
    }

    return [];
  }

  useEffect(() => {
    if (!email) {
      return;
    }

    if (tab === "deals") {
      apiRequest<unknown>("/dispatch/dispatches/?status=assigned", { method: "GET" })
        .then((res) => {
          const rows = extractDispatchList(res).map((dispatch) => {
            const orderDetails = (dispatch.order_details ?? {}) as Record<string, unknown>;
            const customerDetails = (orderDetails.customer_details ?? {}) as Record<string, unknown>;
            const itemRows = Array.isArray(dispatch.items) ? dispatch.items : [];

            return {
              dispatch_id: String(dispatch.id ?? ""),
              order_id: String(orderDetails.id ?? dispatch.order ?? ""),
              customer_name: `${String(customerDetails.first_name ?? "")} ${String(customerDetails.last_name ?? "")}`.trim(),
              address: String(dispatch.delivery_address ?? ""),
              products: itemRows.map((item) => {
                const orderItemDetails = (item as Record<string, unknown>).order_item_details as Record<string, unknown>;
                const vendorDetails = (item as Record<string, unknown>).vendor_details as Record<string, unknown>;
                return {
                  dispatch_item_id: String((item as Record<string, unknown>).id ?? ""),
                  product_id: String((item as Record<string, unknown>).order_item ?? ""),
                  vendor_name: `${String(vendorDetails?.first_name ?? "")} ${String(vendorDetails?.last_name ?? "")}`.trim(),
                  vendor_phone: String(vendorDetails?.phone ?? ""),
                  is_supply_ready: Boolean((item as Record<string, unknown>).is_ready_for_pickup),
                };
              }),
            } as CourierDeal;
          });
          setDeals(rows);
        })
        .catch(() => setDeals([]));
      return;
    }

    if (tab === "dispatches") {
      apiRequest<unknown>("/dispatch/dispatches/", { method: "GET" })
        .then((res) => {
          const rows = extractDispatchList(res)
            .map((dispatch) => {
              const orderDetails = (dispatch.order_details ?? {}) as Record<string, unknown>;
              const customerDetails = (orderDetails.customer_details ?? {}) as Record<string, unknown>;
              const courierDetails = (dispatch.courier_details ?? {}) as Record<string, unknown>;
              const itemRows = Array.isArray(dispatch.items) ? dispatch.items : [];

              return {
                dispatch_id: String(dispatch.id ?? ""),
                order_id: String(orderDetails.id ?? dispatch.order ?? ""),
                courier_email: String(courierDetails.email ?? ""),
                customer_name: `${String(customerDetails.first_name ?? "")} ${String(customerDetails.last_name ?? "")}`.trim(),
                total_price: Number(orderDetails.total_amount ?? 0),
                products: itemRows.map((item) => {
                  const orderItemDetails = (item as Record<string, unknown>).order_item_details as Record<string, unknown>;
                  return {
                    dispatch_item_id: String((item as Record<string, unknown>).id ?? ""),
                    product_id: String((item as Record<string, unknown>).order_item ?? ""),
                    product_name: String(orderItemDetails?.product_name ?? "Product"),
                    quantity: Number(orderItemDetails?.quantity ?? 0),
                    total_amount: Number(orderItemDetails?.total_price ?? 0),
                    is_picked_up: Boolean((item as Record<string, unknown>).is_picked_up),
                    is_delivered: Boolean((item as Record<string, unknown>).is_delivered),
                  };
                }),
              } as CourierDispatch;
            })
            .filter((d) => String(d.courier_email ?? "") === email && !d.products.every((p) => p.is_delivered));
          setDispatches(rows);
        })
        .catch(() => setDispatches([]));
      return;
    }

    if (tab === "transactions") {
      apiRequest<{ status?: string; data?: Partial<BankDetails> }>(`/banking/courier/get/${encodeURIComponent(email)}/`, { method: "GET" })
        .then((res) => {
          if (res.status === "success" && res.data) {
            setFetchedBank(res.data);
          }
        })
        .catch(() => undefined);
    }
  }, [tab, email]);

  async function acceptDeal(dispatchId: number | string) {
    setError("");
    setMessage("");
    try {
      const payload = {
        status: "picking_up",
        notes: `Accepted by ${courierName}`,
      };
      await apiRequest<{ status?: string; data?: string }>(`/dispatch/dispatches/${dispatchId}/status/`, {
        method: "POST",
        body: payload as Record<string, unknown>,
        json: true,
      });
      setDeals((prev) => prev.filter((d) => String(d.dispatch_id) !== String(dispatchId)));
      setMessage("Deal accepted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept deal.");
    }
  }

  async function toggleDispatchProduct(orderId: number | string, dispatchItemId: number | string, key: "is_delivered" | "is_picked_up", checked: boolean) {
    setError("");
    setMessage("");

    try {
      await apiRequest<{ status?: string; data?: string }>(`/dispatch/items/${dispatchItemId}/update/`, {
        method: "PATCH",
        body: {
          [key]: checked,
        } as Record<string, unknown>,
        json: true,
      });

      setDispatches((prev) =>
        prev.map((dispatch) =>
          String(dispatch.order_id) !== String(orderId)
            ? dispatch
            : {
                ...dispatch,
                products: dispatch.products.map((prod) =>
                  String(prod.dispatch_item_id) === String(dispatchItemId) ? { ...prod, [key]: checked } : prod,
                ),
              },
        ),
      );
      setMessage("Dispatch status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update dispatch item.");
    }
  }

  async function saveBank(method: "POST" | "PATCH") {
    setError("");
    setMessage("");

    if (!bank.bank_name || !bank.account_type || !bank.account_name || !bank.account_no) {
      setError("All bank fields are required.");
      return;
    }

    const path = method === "POST" ? "/banking/courier/save/" : `/banking/courier/update/${encodeURIComponent(email)}/`;

    try {
      const payload = {
        ...bank,
        courier_email: email,
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const res = await apiRequest<{ status?: string; data?: string }>(path, {
        method,
        body: payload as Record<string, unknown>,
        json: true,
      });
      if (res.status === "success") {
        setMessage(String(res.data ?? "Bank details saved."));
      } else {
        setError(String(res.data ?? "Unable to save bank details."));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save bank details.");
    }
  }

  if (tab === "deals") {
    return (
      <div className="space-y-4">
        {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <p className="text-zinc-700">Deals available: {deals.length}</p>
        {deals.map((deal) => (
          <div key={String(deal.order_id)} className="rounded-lg border border-zinc-200 p-4">
            <p className="font-medium text-zinc-900">Order #{deal.order_id}</p>
            <p className="text-sm text-zinc-600">Customer: {deal.customer_name}</p>
            <p className="text-sm text-zinc-600">Address: {deal.address}</p>
            <div className="mt-2 space-y-1 text-sm text-zinc-600">
              {deal.products.map((prod) => (
                <p key={`${deal.order_id}-${prod.product_id}`}>Vendor: {prod.vendor_name} ({prod.is_supply_ready ? "Ready" : "Pending"})</p>
              ))}
            </div>
            <button onClick={() => acceptDeal(deal.dispatch_id)} className="mt-3 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:brightness-95">
              Accept Deal
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "dispatches") {
    return (
      <div className="space-y-4">
        {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <p className="text-zinc-700">Dispatch groups: {dispatches.length}</p>
        {dispatches.map((dispatch) => (
          <div key={String(dispatch.order_id)} className="rounded-lg border border-zinc-200 p-4">
            <p className="font-medium text-zinc-900">Order #{dispatch.order_id}</p>
            <p className="text-sm text-zinc-600">Customer: {dispatch.customer_name}</p>
            <p className="text-sm text-zinc-600">Total: {formatNaira(Number(dispatch.total_price ?? 0))}</p>
            <div className="mt-3 space-y-2">
              {dispatch.products.map((prod) => (
                <div key={`${dispatch.order_id}-${prod.product_id}`} className="rounded border border-zinc-200 p-3 text-sm">
                  <p className="font-medium text-zinc-800">{prod.product_name || `Product ${prod.product_id}`}</p>
                  <p className="text-zinc-600">Qty: {prod.quantity}</p>
                  <p className="text-zinc-600">Amount: {formatNaira(Number(prod.total_amount ?? 0))}</p>
                  <div className="mt-2 flex gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(prod.is_picked_up)}
                        onChange={(e) => toggleDispatchProduct(dispatch.order_id, prod.dispatch_item_id, "is_picked_up", e.target.checked)}
                      />
                      Picked up
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(prod.is_delivered)}
                        onChange={(e) => toggleDispatchProduct(dispatch.order_id, prod.dispatch_item_id, "is_delivered", e.target.checked)}
                      />
                      Delivered
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "transactions") {
    const total = transactions.reduce((sum, row) => sum + row.amount, 0);

    return (
      <div className="space-y-4">
        {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 p-3 text-sm">Total records: <strong>{transactions.length}</strong></div>
          <div className="rounded-lg border border-zinc-200 p-3 text-sm">Settled: <strong>{transactions.filter((row) => row.status === "settled").length}</strong></div>
          <div className="rounded-lg border border-zinc-200 p-3 text-sm">Total amount: <strong>{formatNaira(total)}</strong></div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input placeholder={fetchedBank.bank_name || "Bank Name"} value={bank.bank_name} onChange={(e) => setBank((prev) => ({ ...prev, bank_name: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5" />
          <select value={bank.account_type} onChange={(e) => setBank((prev) => ({ ...prev, account_type: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5">
            <option value="">{fetchedBank.account_type || "Account Type"}</option>
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
          </select>
          <input placeholder={fetchedBank.account_name || "Account Name"} value={bank.account_name} onChange={(e) => setBank((prev) => ({ ...prev, account_name: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5" />
          <input placeholder={fetchedBank.account_no || "Account Number"} value={bank.account_no} onChange={(e) => setBank((prev) => ({ ...prev, account_no: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => saveBank("POST")} className="rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-red-50">Save</button>
          <button onClick={() => saveBank("PATCH")} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:brightness-95">Update</button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((row) => (
                <tr key={row.id} className="border-t border-zinc-200">
                  <td className="px-3 py-2">{row.reference}</td>
                  <td className="px-3 py-2">{formatNaira(row.amount)}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{new Date(row.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resolutionCards.map((card) => (
        <div key={card.id} className="rounded-lg border border-zinc-200 p-4">
          <p className="font-semibold text-zinc-900">{card.title}</p>
          <p className="mt-1 text-sm text-zinc-600">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
