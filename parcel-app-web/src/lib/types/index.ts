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
