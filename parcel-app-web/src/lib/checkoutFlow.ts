import { apiRequest } from "@/lib/api";
import { storage } from "@/lib/storage";
import type { CheckoutDraft } from "@/lib/types";

interface ApiResponse<T = unknown> {
  status?: string;
  message?: string;
  data?: T;
  errors?: unknown;
}

interface OrderResponseData {
  id?: number | string;
  order_number?: string;
}

function extractOrderId(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const maybe = data as Record<string, unknown>;
  const id = maybe.id;
  if (typeof id === "number" || typeof id === "string") {
    return String(id);
  }

  return null;
}

function normalizeShippingMethod(method?: string): "pickup" | "delivery" | "express" {
  const value = String(method ?? "").toLowerCase();
  if (value.includes("express")) return "express";
  if (value.includes("delivery") || value.includes("door")) return "delivery";
  return "pickup";
}

function buildShippingAddress(draft: CheckoutDraft): Record<string, string> {
  return {
    street: String(draft.customer?.street ?? ""),
    city: String(draft.customer?.state ?? ""),
    state: String(draft.customer?.state ?? ""),
    country: String(draft.customer?.country ?? ""),
    postal_code: String(draft.zip_code ?? ""),
    full_name: `${String(draft.customer?.first_name ?? "")} ${String(draft.customer?.last_name ?? "")}`.trim(),
    phone: String(draft.customer?.phone_no ?? ""),
    email: String(draft.customer?.email ?? ""),
  };
}

export async function persistCartSnapshot(draft: CheckoutDraft): Promise<void> {
  if (!draft.items.length) {
    throw new Error("Cannot save an empty cart.");
  }

  // Persist locally; backend cart endpoints were removed from service namespace.
  storage.setCheckoutDraft(draft);
}

export async function createOrderFromCheckoutDraft(draft: CheckoutDraft): Promise<string> {
  if (!draft.items.length) {
    throw new Error("Checkout is empty.");
  }

  const payload = {
    shipping_method: normalizeShippingMethod(draft.shipping_method),
    shipping_address: buildShippingAddress(draft),
    customer_notes: "",
    items: draft.items.map((item) => ({
      product: Number(item.product_id),
      quantity: Number(item.quantity),
    })),
  };

  const response = await apiRequest<ApiResponse<OrderResponseData>>("/order/orders/create/", {
    method: "POST",
    body: payload as Record<string, unknown>,
    json: true,
  });

  if (String(response.status ?? "").toLowerCase() !== "success") {
    throw new Error(String(response.message ?? "Unable to create order."));
  }

  const orderId = extractOrderId(response.data);
  if (!orderId) {
    throw new Error("Order was created but no order id was returned.");
  }

  storage.setCurrentOrder(orderId);
  return orderId;
}

export async function ensureOrderFromDraft(draft: CheckoutDraft | null): Promise<string> {
  const existing = storage.getCurrentOrder();
  if (existing) {
    return existing;
  }

  if (!draft) {
    throw new Error("Checkout details are missing.");
  }

  return createOrderFromCheckoutDraft(draft);
}
