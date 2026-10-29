// Shapes returned by parcel-app-service (/api/v1). Only the fields the dashboards read are typed.

export interface Pagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
}

export interface PaginatedResponse<T> {
  status: string;
  data: T[];
  pagination?: Pagination;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "failed";

export interface ApiOrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  vendor: number;
  status?: string;
}

export interface ApiOrder {
  id: number;
  order_number: string;
  status: OrderStatus;
  payment_status: string;
  payment_method?: string;
  total_amount: string;
  shipping_method?: string;
  tracking_number?: string;
  items: ApiOrderItem[];
  can_be_cancelled?: boolean;
  created_at: string;
}

export interface ApiNotification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  type_display?: string;
  action_url?: string;
  action_label?: string;
  is_read: boolean;
  created_at: string;
}

export interface ShippingAddress {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  street_address: string;
  apartment?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default?: boolean;
}

export type DashboardRole = "customer" | "vendor" | "courier";
