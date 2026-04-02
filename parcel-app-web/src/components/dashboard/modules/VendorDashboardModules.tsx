"use client";

import { useEffect, useMemo, useState } from "react";

import { apiForm, unwrapListData } from "@/lib/api";
import { useApi } from "@/lib/hooks/useApi";
import { DashboardFeedback } from "@/components/dashboard/DashboardUi";
import { formatNaira } from "@/lib/productHelpers";
import type { Product, User } from "@/lib/types";

type VendorTab = "products" | "deals" | "transactions" | "resolutions";

interface VendorDealItem {
  dispatch_item_id: number | string;
  order_id: number | string;
  product_id: number | string;
  product_name?: string;
  quantity?: number;
  prod_price?: number;
  total_amount?: number;
  is_supply_ready?: boolean;
}

interface CategoryOption {
  id: number;
  name: string;
}

interface BankDetails {
  bank_name: string;
  account_type: string;
  account_name: string;
  account_no: string;
}

interface ResolutionItem {
  id: number;
  orderId: string;
  customerName: string;
  issueType: "delivery" | "quality" | "payment" | "other";
  description: string;
  status: "pending" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high";
  amount: number;
  vendorResponse?: string;
}

const initialBank: BankDetails = {
  bank_name: "",
  account_type: "",
  account_name: "",
  account_no: "",
};

const sampleResolutions: ResolutionItem[] = [
  {
    id: 1,
    orderId: "ORD-9001",
    customerName: "Amina Yusuf",
    issueType: "delivery",
    description: "Package arrived late and seal looked tampered.",
    status: "pending",
    priority: "high",
    amount: 54000,
  },
  {
    id: 2,
    orderId: "ORD-9002",
    customerName: "Kola Adebayo",
    issueType: "quality",
    description: "Received wrong size for the requested model.",
    status: "in_progress",
    priority: "medium",
    amount: 28000,
    vendorResponse: "Warehouse team is validating lot batch now.",
  },
];

export default function VendorDashboardModules({ tab, user }: { tab: VendorTab; user: User | null }) {
  const { request: readRequest, isLoading: isReadLoading, error: readError } = useApi();
  const { request } = useApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [tempCount, setTempCount] = useState(0);

  const [deals, setDeals] = useState<VendorDealItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

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
    category_id: "",
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ edit_price: "", edit_qty: "", edit_disc: "" });

  const [resolutions, setResolutions] = useState<ResolutionItem[]>(sampleResolutions);
  const [resolutionReply, setResolutionReply] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const email = String(user?.email ?? "");
  const vendorName = `${String(user?.last_name ?? "")} ${String(user?.first_name ?? "")}`.trim();

  useEffect(() => {
    if (!email) {
      return;
    }

    if (tab === "products") {
      readRequest<{ status?: string; data?: { approved?: Product[]; pending?: unknown[] } }>("/product/vendor/products/?include_temp=true", { method: "GET" })
        .then((res) => {
          const approved = Array.isArray(res.data?.approved) ? res.data?.approved : [];
          const pending = Array.isArray(res.data?.pending) ? res.data?.pending : [];
          setProducts(approved ?? []);
          setTempCount(pending?.length ?? 0);
        })
        .catch(() => setProducts([]));

      readRequest<{ data?: CategoryOption[] }>("/product/categories/", { method: "GET" })
        .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
        .catch(() => setCategories([]));
      return;
    }

    if (tab === "deals") {
      readRequest<unknown>("/dispatch/vendor/items/?status=pending", { method: "GET" })
        .then((res) => {
          const rows = unwrapListData<Record<string, unknown>>(res).map((item) => {
            const orderItemDetails = (item.order_item_details ?? {}) as Record<string, unknown>;
            return {
              dispatch_item_id: String(item.id ?? ""),
              order_id: String(orderItemDetails.order ?? ""),
              product_id: String(item.order_item ?? ""),
              product_name: String(orderItemDetails.product_name ?? "Product"),
              quantity: Number(orderItemDetails.quantity ?? 0),
              total_amount: Number(orderItemDetails.total_price ?? 0),
              is_supply_ready: Boolean(item.is_ready_for_pickup),
            } as VendorDealItem;
          });
          setDeals(rows);
        })
        .catch(() => setDeals([]));
      return;
    }

    if (tab === "transactions") {
      readRequest<{ status?: string; data?: Partial<BankDetails> }>(`/banking/vendor/get/${encodeURIComponent(email)}/`, { method: "GET" })
        .then((res) => {
          if (res.status === "success" && res.data) {
            setFetchedBank(res.data);
          }
        })
        .catch(() => undefined);
    }
  }, [tab, email, readRequest]);

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
      formData.append("vendor_email", email);
      formData.append("name", uploadForm.prod_name);
      formData.append("model", uploadForm.prod_model);
      formData.append("description", uploadForm.prod_desc);
      formData.append("category", uploadForm.category_id);
      formData.append("price", uploadForm.prod_price);
      formData.append("quantity", uploadForm.prod_qty);
      formData.append("discount_percentage", uploadForm.prod_disc || "0");
      formData.append("image", uploadPhoto, uploadPhoto.name);

      const res = await apiForm<{ status?: string; message?: string; data?: string }>("/product/products/create/", "POST", formData);
      if (res.status === "success") {
        setMessage(String(res.message ?? res.data ?? "Product uploaded."));
      } else {
        setError(String(res.message ?? res.data ?? "Unable to upload product."));
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
      formData.append("is_ready_for_pickup", String(checked));
      await request<{ status?: string; data?: string }>(`/dispatch/items/${item.dispatch_item_id}/update/`, {
        method: "PATCH",
        body: {
          is_ready_for_pickup: checked,
        } as Record<string, unknown>,
        json: true,
      });

      setDeals((prev) => prev.map((row) => (String(row.order_id) === String(item.order_id) && String(row.product_id) === String(item.product_id) ? { ...row, is_supply_ready: checked } : row)));
      setMessage("Supply status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update supply status.");
    }
  }

  async function deleteProduct(productId: number | string) {
    setError("");
    setMessage("");
    try {
      const res = await request<{ status?: string; message?: string; data?: string }>(`/product/products/${productId}/update/`, {
        method: "PATCH",
        body: {
          status: "archived",
        } as Record<string, unknown>,
        json: true,
      });
      if (res.status === "success") {
        setProducts((prev) => prev.filter((product) => String(product.id) !== String(productId)));
        setMessage(String(res.message ?? res.data ?? "Product archived."));
      } else {
        setError(String(res.message ?? res.data ?? "Unable to archive product."));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete product.");
    }
  }

  async function saveProductEdit(productId: string) {
    setError("");
    setMessage("");

    if (!editForm.edit_price || !editForm.edit_qty || !editForm.edit_disc) {
      setError("Edit fields are required.");
      return;
    }

    try {
      const payload = {
        price: Number(editForm.edit_price),
        quantity: Number(editForm.edit_qty),
        discount_percentage: Number(editForm.edit_disc),
      };
      const res = await request<{ status?: string; message?: string; data?: string }>(`/product/products/${productId}/update/`, {
        method: "PATCH",
        body: payload as Record<string, unknown>,
        json: true,
      });

      if (res.status === "success") {
        setProducts((prev) =>
          prev.map((product) =>
            String(product.id) === productId
              ? {
                  ...product,
                  price: Number(editForm.edit_price),
                  quantity: Number(editForm.edit_qty),
                  discount_percentage: Number(editForm.edit_disc),
                }
              : product,
          ),
        );
        setEditingProductId(null);
        setEditForm({ edit_price: "", edit_qty: "", edit_disc: "" });
        setMessage(String(res.message ?? res.data ?? "Product updated."));
      } else {
        setError(String(res.message ?? res.data ?? "Unable to update product."));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update product.");
    }
  }

  async function markResolutionResolved(id: number) {
    setResolutions((prev) => prev.map((item) => (item.id === id ? { ...item, status: "resolved" } : item)));
    setMessage("Resolution marked as resolved.");
  }

  function sendResolutionReply(id: number) {
    if (!resolutionReply.trim()) {
      setError("Write a response before sending.");
      return;
    }

    setResolutions((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "in_progress", vendorResponse: resolutionReply }
          : item,
      ),
    );
    setResolutionReply("");
    setMessage("Response sent.");
  }

  async function saveBank(method: "POST" | "PATCH") {
    setError("");
    setMessage("");

    if (!bank.bank_name || !bank.account_type || !bank.account_name || !bank.account_no) {
      setError("All bank fields are required.");
      return;
    }

    const path = method === "POST" ? "/banking/vendor/save/" : `/banking/vendor/update/${encodeURIComponent(email)}/`;
    const payload = {
      ...bank,
      vendor_email: email,
      added_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const res = await request<{ status?: string; data?: string }>(path, {
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
  const activeError = error || readError || "";

  if (tab === "products") {
    return (
      <div className="space-y-4">
        <DashboardFeedback message={message} error={activeError} isLoading={isReadLoading} />

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
            <select value={uploadForm.category_id} onChange={(e) => setUploadForm((prev) => ({ ...prev, category_id: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5">
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>{category.name}</option>
              ))}
            </select>
            <input placeholder="Description" value={uploadForm.prod_desc} onChange={(e) => setUploadForm((prev) => ({ ...prev, prod_desc: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2.5" />
          </div>
          <button type="submit" className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:brightness-95">Upload Product</button>
        </form>

        <div className="space-y-2">
          {products.map((prod) => {
            const productId = String(prod.id);
            const isEditing = editingProductId === productId;

            return (
              <div key={productId} className="rounded-lg border border-zinc-200 p-3 text-sm">
                <p className="font-medium text-zinc-900">{String(prod.prod_name ?? prod.name ?? "Unnamed Product")}</p>
                <p className="text-zinc-600">{String(prod.prod_model ?? "No model")}</p>
                <p className="text-danger">{formatNaira(Number(prod.prod_price ?? prod.price ?? 0))}</p>

                {isEditing ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <input placeholder="Price" value={editForm.edit_price} onChange={(e) => setEditForm((prev) => ({ ...prev, edit_price: e.target.value }))} className="rounded border border-zinc-300 px-2 py-1.5" />
                    <input placeholder="Qty" value={editForm.edit_qty} onChange={(e) => setEditForm((prev) => ({ ...prev, edit_qty: e.target.value }))} className="rounded border border-zinc-300 px-2 py-1.5" />
                    <input placeholder="Discount" value={editForm.edit_disc} onChange={(e) => setEditForm((prev) => ({ ...prev, edit_disc: e.target.value }))} className="rounded border border-zinc-300 px-2 py-1.5" />
                    <button onClick={() => saveProductEdit(productId)} className="rounded bg-danger px-3 py-1.5 text-xs font-medium text-white">Save</button>
                    <button onClick={() => setEditingProductId(null)} className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700">Cancel</button>
                  </div>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProductId(productId);
                        setEditForm({
                          edit_price: String(prod.prod_price ?? prod.price ?? ""),
                          edit_qty: String((prod as { quantity?: number; prod_qty?: number }).quantity ?? (prod as { prod_qty?: number }).prod_qty ?? ""),
                          edit_disc: String((prod as { discount_percentage?: number; prod_disc?: number }).discount_percentage ?? (prod as { prod_disc?: number }).prod_disc ?? ""),
                        });
                      }}
                      className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700"
                    >
                      Edit
                    </button>
                    <button onClick={() => deleteProduct(prod.id)} className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (tab === "deals") {
    return (
      <div className="space-y-4">
        <DashboardFeedback message={message} error={activeError} isLoading={isReadLoading} />

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
        <DashboardFeedback message={message} error={activeError} isLoading={isReadLoading} />

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
    <div className="space-y-4">
      <DashboardFeedback message={message} error={activeError} />

      {resolutions.map((item) => (
        <div key={item.id} className="rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-zinc-900">{item.orderId} - {item.customerName}</p>
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs">{item.status}</span>
          </div>
          <p className="mt-1 text-sm text-zinc-600">Issue: {item.issueType}</p>
          <p className="text-sm text-zinc-600">Priority: {item.priority}</p>
          <p className="text-sm text-zinc-600">Amount: {formatNaira(item.amount)}</p>
          <p className="mt-2 text-sm text-zinc-700">{item.description}</p>
          {item.vendorResponse && <p className="mt-2 rounded bg-zinc-50 p-2 text-xs text-zinc-700">Response: {item.vendorResponse}</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            <input value={resolutionReply} onChange={(e) => setResolutionReply(e.target.value)} placeholder="Write response" className="min-w-55 flex-1 rounded border border-zinc-300 px-3 py-1.5 text-sm" />
            <button onClick={() => sendResolutionReply(item.id)} className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700">Send Reply</button>
            <button onClick={() => markResolutionResolved(item.id)} className="rounded bg-danger px-3 py-1.5 text-xs font-medium text-white">Mark Resolved</button>
          </div>
        </div>
      ))}
    </div>
  );
}
