import { apiRequest } from "@/lib/api";
import { storage } from "@/lib/storage";
import type { CheckoutDraft } from "@/lib/types";

interface LegacyApiResponse<T = unknown> {
  status?: string;
  data?: T;
}

function isoNow(): string {
  return new Date().toISOString();
}

function isSuccess(resp?: LegacyApiResponse): boolean {
  return String(resp?.status ?? "").toLowerCase() === "success";
}

function isError(resp?: LegacyApiResponse): boolean {
  return String(resp?.status ?? "").toLowerCase() === "error";
}

function normalizeCustomerName(raw: string | undefined): string {
  const value = String(raw ?? "").trim();
  return value || "Guest Customer";
}

function extractPrimitiveId(value: unknown): string | number | null {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const maybeId = (value as Record<string, unknown>).id;
  if (typeof maybeId === "string" || typeof maybeId === "number") {
    return maybeId;
  }

  const maybeOrderId = (value as Record<string, unknown>).order_id;
  if (typeof maybeOrderId === "string" || typeof maybeOrderId === "number") {
    return maybeOrderId;
  }

  return null;
}

function requireId(value: unknown, message: string): string | number {
  const id = extractPrimitiveId(value);
  if (id === null) {
    throw new Error(message);
  }
  return id;
}

async function saveOrUpdateByStatus<T extends Record<string, unknown>>(
  savePath: string,
  saveMethod: "POST" | "PATCH",
  updatePath: string,
  updateMethod: "PATCH" | "POST",
  payloadForSave: T,
  payloadForUpdate: Partial<T>,
): Promise<LegacyApiResponse> {
  const saved = await apiRequest<LegacyApiResponse>(savePath, {
    method: saveMethod,
    body: payloadForSave,
    json: true,
  });

  if (isSuccess(saved)) {
    return saved;
  }

  if (!isError(saved)) {
    throw new Error("Unexpected API response while saving checkout state.");
  }

  return apiRequest<LegacyApiResponse>(updatePath, {
    method: updateMethod,
    body: payloadForUpdate,
    json: true,
  });
}

export async function persistCartSnapshot(draft: CheckoutDraft): Promise<void> {
  if (!draft.items.length) {
    throw new Error("Cannot save an empty cart.");
  }

  const customerName = normalizeCustomerName(draft.customer_name);
  const now = isoNow();

  for (const item of draft.items) {
    const itemPayload = {
      customer_name: customerName,
      product_id: item.product_id,
      prod_name: item.product_name,
      purchased_qty: item.quantity,
      prod_qty: item.quantity,
      is_customer: draft.is_customer,
      updated_at: now,
      created_at: now,
    };

    const saveResp = await apiRequest<LegacyApiResponse>(
      `/parcel_customer/cart_save/${encodeURIComponent(customerName)}/${encodeURIComponent(String(item.product_name))}/`,
      {
        method: "POST",
        body: itemPayload,
        json: true,
      },
    );

    if (!isSuccess(saveResp)) {
      await apiRequest<LegacyApiResponse>(
        `/parcel_customer/cart_update/${encodeURIComponent(customerName)}/${encodeURIComponent(String(item.product_name))}/`,
        {
          method: "PATCH",
          body: {
            ...itemPayload,
            created_at: undefined,
          },
          json: true,
        },
      );
    }
  }

  const cartSummaryPayload = {
    customer_name: customerName,
    total_items: draft.total_items,
    total_price: draft.subtotal,
    updated_at: now,
    created_at: now,
  };

  const summarySave = await apiRequest<LegacyApiResponse>(`/parcel_customer/prod_cart_save/${encodeURIComponent(customerName)}/`, {
    method: "POST",
    body: cartSummaryPayload,
    json: true,
  });

  if (!isSuccess(summarySave)) {
    await apiRequest<LegacyApiResponse>(`/parcel_customer/prod_cart_update/${encodeURIComponent(customerName)}/`, {
      method: "PATCH",
      body: {
        ...cartSummaryPayload,
        created_at: undefined,
      },
      json: true,
    });
  }
}

export async function createOrderFromCheckoutDraft(draft: CheckoutDraft): Promise<string> {
  if (!draft.items.length) {
    throw new Error("Checkout is empty.");
  }

  const customerName = normalizeCustomerName(draft.customer_name);
  const now = isoNow();

  let customerId: string | number | null = extractPrimitiveId(draft.customer?.id ?? null);
  const isCustomer = Boolean(draft.is_customer && customerId !== null);

  if (!customerId) {
    const anonymousPayload = {
      first_name: String(draft.customer?.first_name ?? ""),
      last_name: String(draft.customer?.last_name ?? ""),
      country: String(draft.customer?.country ?? ""),
      state: String(draft.customer?.state ?? ""),
      street: String(draft.customer?.street ?? ""),
      zip_code: String(draft.zip_code ?? ""),
      email: String(draft.customer?.email ?? ""),
      phone_no: String(draft.customer?.phone_no ?? ""),
      reg_date: now,
    };

    const anonymousResp = await apiRequest<LegacyApiResponse>("/parcel_customer/anonymous_save/", {
      method: "POST",
      body: anonymousPayload,
      json: true,
    });

    customerId = requireId(anonymousResp.data, "Unable to resolve customer record for checkout.");
  }

  const orderSavePayload = {
    customer_id: customerId,
    customer_name: customerName,
    total_items: draft.total_items,
    total_price: draft.subtotal,
    shipping_method: draft.shipping_method,
    zip_code: draft.zip_code,
    is_customer: isCustomer,
    is_completed: false,
    created_at: now,
    updated_at: now,
  };

  const orderResp = await saveOrUpdateByStatus(
    `/parcel_order/order_save/${encodeURIComponent(customerName)}/`,
    "POST",
    `/parcel_order/order_update/${encodeURIComponent(customerName)}/`,
    "PATCH",
    orderSavePayload,
    {
      ...orderSavePayload,
      created_at: undefined,
    },
  );

  const orderId = requireId(orderResp.data, "Unable to create an order for payment.");

  for (const item of draft.items) {
    const itemPayload = {
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      is_customer: isCustomer,
      is_completed: false,
      created_at: now,
      updated_at: now,
    };

    const orderItemResp = await apiRequest<LegacyApiResponse>(
      `/parcel_order/order_item_update/${encodeURIComponent(String(orderId))}/${encodeURIComponent(String(item.product_id))}/`,
      {
        method: "PATCH",
        body: itemPayload,
        json: true,
      },
    );

    if (!isSuccess(orderItemResp)) {
      await apiRequest<LegacyApiResponse>(
        `/parcel_order/order_item_save/${encodeURIComponent(String(orderId))}/${encodeURIComponent(String(item.product_id))}/`,
        {
          method: "PATCH",
          body: itemPayload,
          json: true,
        },
      );
    }
  }

  const paymentPayload = {
    order_id: orderId,
    customer_id: customerId,
    customer_name: customerName,
    is_customer: isCustomer,
    amount: draft.grand_total_amount,
    shipping_fee: draft.shipping_fee,
    grand_total_amount: draft.grand_total_amount,
    created_at: now,
    updated_at: now,
  };

  await saveOrUpdateByStatus(
    `/parcel_order/payment_save/${encodeURIComponent(String(orderId))}/`,
    "POST",
    `/parcel_order/payment_update/${encodeURIComponent(String(orderId))}/`,
    "PATCH",
    paymentPayload,
    {
      ...paymentPayload,
      created_at: undefined,
    },
  );

  const normalizedOrderId = String(orderId);
  storage.setCurrentOrder(normalizedOrderId);
  return normalizedOrderId;
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