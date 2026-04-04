export type Nullable<T> = T | null;

export interface User {
  id?: number | string;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

export interface CartItem {
  id: number | string;
  price?: number;
  purchased_qty: number;
  [key: string]: unknown;
}

export interface Product {
  id: number | string;
  name?: string;
  title?: string;
  prod_name?: string;
  prod_model?: string;
  price?: number;
  prod_price?: number;
  description?: string;
  prod_desc?: string;
  photo?: string;
  prod_photo?: string;
  discount?: number;
  prod_disc?: number;
  vendor_name?: string;
  vendor_photo?: string;
  category?: string;
  rating?: number;
  stock?: number;
  [key: string]: unknown;
}

export interface Order {
  id: number | string;
  order_id?: number | string;
  [key: string]: unknown;
}

export interface Deal {
  id?: number | string;
  order_id?: number | string;
  handled_dispatch?: boolean;
  [key: string]: unknown;
}

export interface CheckoutDraft {
  mode: "cart" | "single";
  customer_name: string;
  shipping_method?: string;
  zip_code?: string;
  total_items: number;
  subtotal: number;
  shipping_fee: number;
  grand_total_amount: number;
  is_customer: boolean;
  items: Array<{
    product_id: number | string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  customer?: {
    id?: number | string | null;
    first_name?: string;
    last_name?: string;
    street?: string;
    state?: string;
    country?: string;
    email?: string;
    phone_no?: string;
  };
}

/**
 * Dashboard API response types.
 * Used across vendor, courier, and customer dashboard modules.
 */

export type ApiResponse<T = string> = {
  status?: string;
  message?: string;
  data?: T;
};

export type ApiListResponse<T> = ApiResponse<T[]>;

export interface BankDetails {
  bank_name: string;
  account_type: string;
  account_name: string;
  account_no: string;
}

export interface ProductsApprovalResponse {
  approved?: Product[];
  pending?: Product[];
}

export interface CategoryOption {
  id: number;
  name: string;
}
