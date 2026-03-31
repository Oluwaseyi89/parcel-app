export const STORAGE_KEYS = {
  customerAuth: "logcus",
  vendorAuth: "logvend",
  courierAuth: "logcour",
  cart: "parcelCart",
  cartTotal: "cartTot",
  productView: "prodView",
  buySingle: "buySingle",
} as const;

export const ROUTES = {
  home: "/",
  vendor: "/vendor",
  courier: "/courier",
  catalogue: "/catalogue",
  hotDeals: "/hot-deals",
  customer: "/customer",
  registerVendor: "/register-vendor",
  registerCourier: "/register-courier",
  registerCustomer: "/register-customer",
  courierDash: "/courier-dash",
  vendorDash: "/vendor-dash",
  customerDash: "/customer-dash",
  cartCheck: "/cart-check",
  single: "/single",
  payment: "/payment",
  verify: "/verify",
  productDetail: "/prod-detail",
} as const;
