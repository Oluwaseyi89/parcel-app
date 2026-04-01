"use client";

import { useEffect, useMemo, useState } from "react";

import { apiForm, apiRequest } from "@/lib/api";
import { formatNaira } from "@/lib/productHelpers";
import type { Product, User } from "@/lib/types";

type VendorTab = "products" | "deals" | "transactions" | "resolutions";

interface VendorDealItem {
  order_id: number | string;
  product_id: number | string;
  vendor_phone?: string;
  product_name?: string;
  quantity?: number;
  prod_price?: number;
  total_amount?: number;
  is_supply_ready?: boolean;
  is_supply_received?: boolean;
  is_received?: boolean;
}

interface DispatchDeal {
  order_id: number | string;
  products: VendorDealItem[];
  courier_name?: string;
  courier_phone?: string;
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

export default function VendorDashboardModules({ tab, user }: { tab: VendorTab; user: User | null }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [tempCount, setTempCount] = useState(0);

  const [deals, setDeals] = useState<VendorDealItem[]>([]);

  const [bank, setBank] = useState<BankDetails>(initialBank);
  const [fetchedBank, setFetchedBank] = useState<Partial<BankDetails>>({});

  const [uploadPhoto, setUploadPhoto] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    prod_name: "",
    prod_model: "",
    prod_price: "",
    prod_qty: "",
    prod_desc: "",
    prod_disc: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const email = String(user?.email ?? "");
  const vendorPhone = String(user?.phone_no ?? "");
  const vendorName = `${String(user?.last_name ?? "")} ${String(user?.first_name ?? "")}`.trim();

  useEffect(() => {
    if (!email) {
      return;
    }

    if (tab === "products") {
      apiRequest<{ data?: Product[] }>(`/parcel_product/get_dist_ven_product/${encodeURIComponent(email)}/`, { method: "GET" })
        .then((res) => setProducts(Array.isArray(res.data) ? res.data : []))
        .catch(() => setProducts([]));

      apiRequest<{ data?: unknown[] }>(`/parcel_product/get_dist_temp_product/${encodeURIComponent(email)}/`, { method: "GET" })
        .then((res) => setTempCount(Array.isArray(res.data) ? res.data.length : 0))
        .catch(() => setTempCount(0));
      return;
    }

    if (tab === "deals") {
      apiRequest<{ deals?: DispatchDeal[] }>("/parcel_dispatch/get_dispatch_from_db/", { method: "GET" })
        .then((res) => {
          const allDeals = Array.isArray(res.deals) ? res.deals : [];
          const rows: VendorDealItem[] = [];
          for (const deal of allDeals) {
            for (const prod of deal.products ?? []) {
              if (String(prod.vendor_phone ?? "") === vendorPhone && !prod.is_received) {
                rows.push({ ...prod, order_id: deal.order_id });
              }
            }
          }
          setDeals(rows);
        })
        .catch(() => setDeals([]));
      return;
    }

    if (tab === "transactions") {
      apiRequest<{ status?: string; data?: Partial<BankDetails> }>(`/parcel_backends/get_dist_vend_bank/${encodeURIComponent(email)}/`, { method: "GET" })
        .then((res) => {
          if (res.status === "success" && res.data) {
            setFetchedBank(res.data);
          }
        })
        .catch(() => undefined);
    }
  }, [tab, email, vendorPhone]);

  async function uploadProduct(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!uploadPhoto) {
      setError("Product image is required.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("vendor_name", vendorName);
      formData.append("vendor_phone", vendorPhone);
      formData.append("vendor_email", email);
      formData.append("vend_photo", String(user?.vend_photo ?? ""));
      formData.append("prod_cat", String(user?.bus_category ?? "General_Merchandise"));
      formData.append("prod_name", uploadForm.prod_name);
      formData.append("prod_model", uploadForm.prod_model);
      formData.append("prod_photo", uploadPhoto, uploadPhoto.name);
      formData.append("prod_price", uploadForm.prod_price);
      formData.append("prod_qty", uploadForm.prod_qty);
      formData.append("prod_disc", uploadForm.prod_disc);
      formData.append("prod_desc", uploadForm.prod_desc);
      formData.append("img_base", uploadPhoto.name);
      formData.append("upload_date", new Date().toISOString());

      const res = await apiForm<{ status?: string; data?: string }>("/parcel_product/product_upload/", "POST", formData);
      if (res.status === "success") {
        setMessage(String(res.data ?? "Product uploaded."));
      } else {
        setError(String(res.data ?? "Unable to upload product."));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload product.");
    }
  }

  async function toggleSupplyReady(item: VendorDealItem, checked: boolean) {
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("is_supply_ready", String(checked));
      formData.append("updated_at", new Date().toISOString());
      await apiForm<{ status?: string; data?: string }>(`/parcel_dispatch/update_supplied_product/${item.order_id}/${item.product_id}/`, "POST", formData);

      setDeals((prev) => prev.map((row) => (String(row.order_id) === String(item.order_id) && String(row.product_id) === String(item.product_id) ? { ...row, is_supply_ready: checked } : row)));
      setMessage("Supply status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update supply status.");
    }
  }

  async function saveBank(method: "POST" | "PATCH") {
    setError("");
    setMessage("");

    if (!bank.bank_name || !bank.account_type || !bank.account_name || !bank.account_no) {
      setError("All bank fields are required.");
      return;
    }

    const path = method === "POST" ? "/parcel_backends/save_vend_bank/" : `/parcel_backends/update_vend_bank/${encodeURIComponent(email)}`;
    const payload = {
      ...bank,
      vendor_email: email,
      added_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
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

  const productsTotal = useMemo(() => products.length, [products.length]);

  if (tab === "products") {
    return (
      <div className="space-y-4">
        {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 p-3 text-sm">Approved products: <strong>{productsTotal}</strong></div>
          <div className="rounded-lg border border-zinc-200 p-3 text-sm">Unapproved uploads: <strong>{tempCount}</strong></div>
          <div className="rounded-lg border border-zinc-200 p-3 text-sm">Vendor: <strong>{vendorName || "Unknown"}</strong></div>
        </div>

        <form onSubmit={uploadProduct} className="space-y-3 rounded-lg border border-zinc-200 p-4">
          <input type="file" accept="image/*" onChange={(e) => setUploadPhoto(e.target.files?.[0] ?? null)} className="w-full rounded-lg border border-zinc-300 p-2" />
          <div className="grid gap-3 md:grid-cols-2">
            <input placeholder="Product Name" value={uploadForm.prod_name} onChange={(e) => setUploadForm((prev) => ({ ...prev, prod_name: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5" />
            <input placeholder="Model" value={uploadForm.prod_model} onChange={(e) => setUploadForm((prev) => ({ ...prev, prod_model: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5" />
            <input placeholder="Price" value={uploadForm.prod_price} onChange={(e) => setUploadForm((prev) => ({ ...prev, prod_price: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5" />
            <input placeholder="Quantity" value={uploadForm.prod_qty} onChange={(e) => setUploadForm((prev) => ({ ...prev, prod_qty: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5" />
            <input placeholder="Discount" value={uploadForm.prod_disc} onChange={(e) => setUploadForm((prev) => ({ ...prev, prod_disc: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5" />
            <input placeholder="Description" value={uploadForm.prod_desc} onChange={(e) => setUploadForm((prev) => ({ ...prev, prod_desc: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5" />
          </div>
          <button type="submit" className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:brightness-95">Upload Product</button>
        </form>

        <div className="space-y-2">
          {products.map((prod) => (
            <div key={String(prod.id)} className="rounded-lg border border-zinc-200 p-3 text-sm">
              <p className="font-medium text-zinc-900">{String(prod.prod_name ?? prod.name ?? "Unnamed Product")}</p>
              <p className="text-zinc-600">{String(prod.prod_model ?? "No model")}</p>
              <p className="text-danger">{formatNaira(Number(prod.prod_price ?? prod.price ?? 0))}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === "deals") {
    return (
      <div className="space-y-4">
        {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <p className="text-zinc-700">Supply deals: {deals.length}</p>
        {deals.map((item) => (
          <div key={`${item.order_id}-${item.product_id}`} className="rounded-lg border border-zinc-200 p-4">
            <p className="font-medium text-zinc-900">Order #{item.order_id}</p>
            <p className="text-sm text-zinc-600">Product: {item.product_name || item.product_id}</p>
            <p className="text-sm text-zinc-600">Quantity: {item.quantity}</p>
            <p className="text-sm text-zinc-600">Amount: {formatNaira(Number(item.total_amount ?? 0))}</p>
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" checked={Boolean(item.is_supply_ready)} onChange={(e) => toggleSupplyReady(item, e.target.checked)} />
              Mark as ready for courier pickup
            </label>
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
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-zinc-700">Resolution center migrated.</p>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        High-priority customer issues panel from the React app can now be plugged into this tab with API-backed ticket records.
      </div>
    </div>
  );
}
