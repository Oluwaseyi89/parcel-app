"use client";

import { useEffect, useState } from "react";

import { apiForm, apiRequest } from "@/lib/api";
import { formatNaira } from "@/lib/productHelpers";
import type { User } from "@/lib/types";

type CourierTab = "deals" | "dispatches" | "transactions" | "resolutions";

interface CourierDeal {
  order_id: number | string;
  customer_name?: string;
  address?: string;
  phone_no?: string;
  handled_dispatch?: boolean;
  products: Array<{
    product_id: number | string;
    vendor_name?: string;
    vendor_phone?: string;
    vendor_address?: string;
    is_supply_ready?: boolean;
  }>;
}

interface CourierDispatch {
  order_id: number | string;
  courier_email?: string;
  customer_name?: string;
  total_price?: number;
  products: Array<{
    product_id: number | string;
    product_name?: string;
    quantity?: number;
    total_amount?: number;
    is_supply_received?: boolean;
    is_delivered?: boolean;
  }>;
}

interface BankDetails {
  bank_name: string;
  account_type: string;
  account_name: string;
  account_no: string;
}

const initialBank: BankDetails = {
  bank_name: "",
  account_type: "",
  account_name: "",
  account_no: "",
};

export default function CourierDashboardModules({ tab, user }: { tab: CourierTab; user: User | null }) {
  const [deals, setDeals] = useState<CourierDeal[]>([]);
  const [dispatches, setDispatches] = useState<CourierDispatch[]>([]);

  const [bank, setBank] = useState<BankDetails>(initialBank);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const email = String(user?.email ?? "");
  const courierName = `${String(user?.last_name ?? "")} ${String(user?.first_name ?? "")}`.trim();

  useEffect(() => {
    if (!email) {
      return;
    }

    if (tab === "deals") {
      apiRequest<{ deals?: CourierDeal[] }>("/parcel_dispatch/get_dispatch_from_db/", { method: "GET" })
        .then((res) => {
          const rows = Array.isArray(res.deals) ? res.deals.filter((d) => !d.handled_dispatch) : [];
          setDeals(rows);
        })
        .catch(() => setDeals([]));
      return;
    }

    if (tab === "dispatches") {
      apiRequest<{ deals?: CourierDispatch[] }>("/parcel_dispatch/get_dispatch_from_db/", { method: "GET" })
        .then((res) => {
          const rows = Array.isArray(res.deals)
            ? res.deals.filter((d) => String(d.courier_email ?? "") === email && !d.products?.every((p) => p.is_delivered))
            : [];
          setDispatches(rows);
        })
        .catch(() => setDispatches([]));
    }
  }, [tab, email]);

  async function acceptDeal(orderId: number | string) {
    setError("");
    setMessage("");
    try {
      const payload = {
        handled_dispatch: true,
        courier_id: user?.id,
        courier_name: courierName,
        courier_email: email,
        courier_phone: user?.phone_no,
        updated_at: new Date().toISOString(),
      };
      await apiRequest<{ status?: string; data?: string }>(`/parcel_dispatch/update_dispatch/${orderId}/`, {
        method: "PATCH",
        body: payload as Record<string, unknown>,
        json: true,
      });
      setDeals((prev) => prev.filter((d) => String(d.order_id) !== String(orderId)));
      setMessage("Deal accepted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept deal.");
    }
  }

  async function toggleDispatchProduct(orderId: number | string, productId: number | string, key: "is_delivered" | "is_supply_received", checked: boolean) {
    setError("");
    setMessage("");

    try {
      if (key === "is_supply_received") {
        const formData = new FormData();
        formData.append("is_supply_received", String(checked));
        formData.append("updated_at", new Date().toISOString());
        await apiForm<{ status?: string; data?: string }>(`/parcel_dispatch/update_received_product/${orderId}/${productId}/`, "POST", formData);
      } else {
        await apiRequest<{ status?: string; data?: string }>(`/parcel_dispatch/update_dispatched_product/${orderId}/${productId}/`, {
          method: "PATCH",
          body: {
            is_delivered: checked,
            updated_at: new Date().toISOString(),
          } as Record<string, unknown>,
          json: true,
        });
      }

      setDispatches((prev) =>
        prev.map((dispatch) =>
          String(dispatch.order_id) !== String(orderId)
            ? dispatch
            : {
                ...dispatch,
                products: dispatch.products.map((prod) =>
                  String(prod.product_id) === String(productId) ? { ...prod, [key]: checked } : prod,
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

    const path = method === "POST" ? "/parcel_backends/save_cour_bank/" : `/parcel_backends/update_cour_bank/${encodeURIComponent(email)}`;

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
            <button onClick={() => acceptDeal(deal.order_id)} className="mt-3 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:brightness-95">
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
                        checked={Boolean(prod.is_supply_received)}
                        onChange={(e) => toggleDispatchProduct(dispatch.order_id, prod.product_id, "is_supply_received", e.target.checked)}
                      />
                      Supply received
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(prod.is_delivered)}
                        onChange={(e) => toggleDispatchProduct(dispatch.order_id, prod.product_id, "is_delivered", e.target.checked)}
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
    return (
      <div className="space-y-4">
        {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-3 md:grid-cols-2">
          <input placeholder="Bank Name" value={bank.bank_name} onChange={(e) => setBank((prev) => ({ ...prev, bank_name: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5" />
          <select value={bank.account_type} onChange={(e) => setBank((prev) => ({ ...prev, account_type: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5">
            <option value="">Account Type</option>
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
          </select>
          <input placeholder="Account Name" value={bank.account_name} onChange={(e) => setBank((prev) => ({ ...prev, account_name: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5" />
          <input placeholder="Account Number" value={bank.account_no} onChange={(e) => setBank((prev) => ({ ...prev, account_no: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => saveBank("POST")} className="rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-red-50">Save</button>
          <button onClick={() => saveBank("PATCH")} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:brightness-95">Update</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
      Courier resolution center is active and ready for API-backed dispute tickets in the next substage.
    </div>
  );
}
