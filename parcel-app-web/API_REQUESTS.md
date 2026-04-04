# Parcel App Service API Requests (Postman Debug Guide)

This file contains realistic sample request and response objects for every endpoint listed here, based on parcel-app-service URL routes and response patterns in views.

## Base URL and Headers

- Base URL: http://127.0.0.1:8000
- JSON Header: Content-Type: application/json
- Protected routes: Authorization: Bearer <token>

## Response Envelope Patterns Used By Service

Most endpoints return one of these:

```json
{
  "status": "success",
  "message": "Optional message",
  "data": {}
}
```

```json
{
  "status": "error",
  "message": "Error detail"
}
```

```json
{
  "status": "success",
  "data": "string|object|array"
}
```

---

## Product Endpoints

### 1) GET /product/products/

Sample request object:
```json
{
  "method": "GET",
  "url": "/product/products/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "search": "iphone",
    "category": "Electronics",
    "status": "active",
    "page": 1
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 15,
        "prod_name": "iPhone 13",
        "prod_model": "A2633",
        "prod_price": 780000,
        "prod_qty": 7,
        "prod_disc": 5,
        "status": "active",
        "vendor_email": "vendor1@example.com"
      }
    ]
  }
}
```

### 2) GET /product/products/{product_id}/

Sample request object:
```json
{
  "method": "GET",
  "url": "/product/products/15/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "id": 15,
    "prod_name": "iPhone 13",
    "prod_model": "A2633",
    "prod_desc": "128GB, Blue",
    "prod_price": 780000,
    "prod_qty": 7,
    "prod_disc": 5,
    "category": "Electronics",
    "status": "active",
    "vendor_email": "vendor1@example.com"
  }
}
```

### 3) POST /product/products/create/

Sample request object:
```json
{
  "method": "POST",
  "url": "/product/products/create/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "vendor_email": "vendor1@example.com",
    "prod_name": "Samsung S22",
    "prod_model": "SM-S901B",
    "prod_desc": "8GB RAM, 256GB",
    "prod_price": 620000,
    "prod_qty": 12,
    "prod_disc": 10,
    "category": "Electronics"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Product created successfully and submitted for approval",
  "data": {
    "id": 41,
    "prod_name": "Samsung S22",
    "approval_status": "pending"
  }
}
```

### 4) GET /product/vendor/products/?include_temp=true

Sample request object:
```json
{
  "method": "GET",
  "url": "/product/vendor/products/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "include_temp": true
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "approved": [
      {
        "id": 15,
        "prod_name": "iPhone 13",
        "prod_price": 780000,
        "status": "active"
      }
    ],
    "pending": [
      {
        "id": 103,
        "prod_name": "Infinix Note 30",
        "approval_status": "pending"
      }
    ]
  }
}
```

### 5) PATCH /product/products/{product_id}/update/

Sample request object:
```json
{
  "method": "PATCH",
  "url": "/product/products/15/update/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "prod_price": 760000,
    "prod_qty": 10,
    "prod_disc": 8
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Product updated successfully",
  "data": {
    "id": 15,
    "prod_price": 760000,
    "prod_qty": 10,
    "prod_disc": 8
  }
}
```

### 6) GET /product/categories/

Sample request object:
```json
{
  "method": "GET",
  "url": "/product/categories/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Electronics"
    },
    {
      "id": 2,
      "name": "Fashion"
    }
  ]
}
```

### 7) POST /product/categories/create/

Sample request object:
```json
{
  "method": "POST",
  "url": "/product/categories/create/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "name": "Groceries"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Category created successfully",
  "data": {
    "id": 6,
    "name": "Groceries"
  }
}
```

### 8) GET /product/temp-products/

Sample request object:
```json
{
  "method": "GET",
  "url": "/product/temp-products/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "status": "pending"
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "id": 103,
      "vendor_email": "vendor2@example.com",
      "prod_name": "Infinix Note 30",
      "approval_status": "pending"
    }
  ]
}
```

### 9) POST /product/temp-products/{temp_product_id}/approve/

Sample request object:
```json
{
  "method": "POST",
  "url": "/product/temp-products/103/approve/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "action": "approve"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Product approved successfully",
  "data": {
    "temp_product_id": 103,
    "approved_product_id": 57
  }
}
```

### 10) GET /product/inventory/status/

Sample request object:
```json
{
  "method": "GET",
  "url": "/product/inventory/status/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "total_products": 185,
    "active_products": 160,
    "low_stock": 9,
    "out_of_stock": 3
  }
}
```

---

## Dispatch Endpoints

### 1) GET /dispatch/dispatches/

Sample request object:
```json
{
  "method": "GET",
  "url": "/dispatch/dispatches/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "status": "assigned",
    "page": 1
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "count": 1,
    "results": [
      {
        "id": 22,
        "order": 90,
        "status": "assigned",
        "courier_email": "rider@example.com",
        "handled_dispatch": false
      }
    ]
  }
}
```

### 2) POST /dispatch/dispatches/create/

Sample request object:
```json
{
  "method": "POST",
  "url": "/dispatch/dispatches/create/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "order": 90,
    "courier_email": "rider@example.com",
    "pickup_address": "10 Ikeja, Lagos",
    "delivery_address": "22 Lekki, Lagos"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Dispatch created successfully",
  "data": {
    "id": 22,
    "order": 90,
    "status": "pending"
  }
}
```

### 3) GET /dispatch/dispatches/{dispatch_id}/

Sample request object:
```json
{
  "method": "GET",
  "url": "/dispatch/dispatches/22/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "id": 22,
    "order": 90,
    "status": "assigned",
    "courier_email": "rider@example.com",
    "items": [
      {
        "id": 501,
        "order_item": 800,
        "is_ready_for_pickup": true,
        "is_picked_up": false,
        "is_delivered": false,
        "is_received": false
      }
    ]
  }
}
```

### 4) POST /dispatch/dispatches/{dispatch_id}/assign/

Sample request object:
```json
{
  "method": "POST",
  "url": "/dispatch/dispatches/22/assign/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "courier_email": "rider2@example.com"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Courier assigned successfully",
  "data": {
    "dispatch_id": 22,
    "courier_email": "rider2@example.com"
  }
}
```

### 5) POST /dispatch/dispatches/{dispatch_id}/status/

Sample request object:
```json
{
  "method": "POST",
  "url": "/dispatch/dispatches/22/status/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "status": "in_transit"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Dispatch status updated to in_transit",
  "data": {
    "dispatch_id": 22,
    "status": "in_transit"
  }
}
```

### 6) PATCH /dispatch/items/{item_id}/update/

Sample request object:
```json
{
  "method": "PATCH",
  "url": "/dispatch/items/501/update/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "is_picked_up": true,
    "is_delivered": false,
    "is_received": false
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Dispatch item updated successfully",
  "data": {
    "id": 501,
    "is_picked_up": true,
    "is_delivered": false,
    "is_received": false
  }
}
```

### 7) GET /dispatch/vendor/items/

Sample request object:
```json
{
  "method": "GET",
  "url": "/dispatch/vendor/items/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "status": "pending"
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "id": 501,
      "order_item": 800,
      "is_ready_for_pickup": false,
      "order_item_details": {
        "order": 90,
        "product_name": "iPhone 13",
        "quantity": 1,
        "total_price": 780000
      }
    }
  ]
}
```

### 8) POST /dispatch/courier/location/

Sample request object:
```json
{
  "method": "POST",
  "url": "/dispatch/courier/location/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "courier_email": "rider@example.com",
    "latitude": 6.535,
    "longitude": 3.375,
    "accuracy": 15
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Location updated",
  "data": {
    "courier_email": "rider@example.com",
    "latitude": 6.535,
    "longitude": 3.375,
    "updated_at": "2026-04-04T10:20:30Z"
  }
}
```

### 9) GET /dispatch/ready-orders/

Sample request object:
```json
{
  "method": "GET",
  "url": "/dispatch/ready-orders/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "order_id": 90,
      "customer_name": "John Doe",
      "items_ready": 2,
      "total_items": 2
    }
  ]
}
```

### 10) GET /dispatch/stats/

Sample request object:
```json
{
  "method": "GET",
  "url": "/dispatch/stats/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "total_dispatches": 340,
    "pending": 15,
    "assigned": 23,
    "in_transit": 12,
    "delivered": 290
  }
}
```

### 11) POST /dispatch/dispatches/{dispatch_id}/optimize-route/

Sample request object:
```json
{
  "method": "POST",
  "url": "/dispatch/dispatches/22/optimize-route/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "start_latitude": 6.5244,
    "start_longitude": 3.3792,
    "end_latitude": 6.6018,
    "end_longitude": 3.3515
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Route optimized successfully",
  "data": {
    "dispatch_id": 22,
    "estimated_distance_km": 14.2,
    "estimated_duration_min": 36,
    "polyline": "ab12xy..."
  }
}
```

---

## Order and Payment Endpoints

### 1) GET /order/orders/

Sample request object:
```json
{
  "method": "GET",
  "url": "/order/orders/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "status": "pending",
    "page": 1
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "count": 1,
    "results": [
      {
        "id": 90,
        "customer_email": "customer@example.com",
        "status": "pending",
        "total_amount": 780000,
        "created_at": "2026-04-04T09:50:00Z"
      }
    ]
  }
}
```

### 2) POST /order/orders/create/

Sample request object:
```json
{
  "method": "POST",
  "url": "/order/orders/create/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "customer_email": "customer@example.com",
    "items": [
      {
        "product_id": 15,
        "quantity": 1,
        "unit_price": 780000
      }
    ],
    "shipping_address": {
      "street": "22 Lekki Phase 1",
      "state": "Lagos",
      "country": "Nigeria",
      "zip_code": "101001"
    },
    "payment_method": "card"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Order created successfully",
  "data": {
    "id": 90,
    "status": "pending",
    "total_amount": 780000
  }
}
```

### 3) GET /order/orders/{order_id}/

Sample request object:
```json
{
  "method": "GET",
  "url": "/order/orders/90/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "id": 90,
    "customer_email": "customer@example.com",
    "status": "pending",
    "items": [
      {
        "product_id": 15,
        "quantity": 1,
        "total_price": 780000
      }
    ],
    "total_amount": 780000
  }
}
```

### 4) PATCH /order/orders/{order_id}/

Sample request object:
```json
{
  "method": "PATCH",
  "url": "/order/orders/90/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "operation": "cancel"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Order cancelled successfully",
  "data": {
    "id": 90,
    "status": "cancelled"
  }
}
```

### 5) POST /order/orders/{order_id}/status/

Sample request object:
```json
{
  "method": "POST",
  "url": "/order/orders/90/status/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "status": "processing"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Order status updated to processing",
  "data": {
    "id": 90,
    "status": "processing"
  }
}
```

### 6) POST /order/payments/initiate/

Sample request object:
```json
{
  "method": "POST",
  "url": "/order/payments/initiate/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "order_id": 90,
    "email": "customer@example.com",
    "amount": 780000
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Payment initiated",
  "data": {
    "reference": "PAY-90-20260404-ABC123",
    "authorization_url": "https://checkout.example/pay/PAY-90-20260404-ABC123",
    "access_code": "ACX-111222"
  }
}
```

### 7) POST /order/payments/verify/{reference}/

Sample request object:
```json
{
  "method": "POST",
  "url": "/order/payments/verify/PAY-90-20260404-ABC123/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": {}
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Payment verified successfully",
  "data": {
    "reference": "PAY-90-20260404-ABC123",
    "payment_status": "success",
    "amount": 780000,
    "order_id": 90
  }
}
```

### 8) GET /order/shipping-addresses/

Sample request object:
```json
{
  "method": "GET",
  "url": "/order/shipping-addresses/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "id": 8,
      "customer_email": "customer@example.com",
      "street": "22 Lekki Phase 1",
      "state": "Lagos",
      "country": "Nigeria",
      "zip_code": "101001"
    }
  ]
}
```

### 9) POST /order/shipping-addresses/

Sample request object:
```json
{
  "method": "POST",
  "url": "/order/shipping-addresses/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "customer_email": "customer@example.com",
    "street": "12 Admiralty Way",
    "state": "Lagos",
    "country": "Nigeria",
    "zip_code": "101241"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Shipping address saved",
  "data": {
    "id": 9,
    "street": "12 Admiralty Way",
    "state": "Lagos"
  }
}
```

### 10) GET /order/vendor/orders/

Sample request object:
```json
{
  "method": "GET",
  "url": "/order/vendor/orders/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "status": "processing"
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "order_id": 90,
      "status": "processing",
      "customer_name": "John Doe",
      "items_count": 1,
      "total_amount": 780000
    }
  ]
}
```

### 11) GET /order/courier/orders/

Sample request object:
```json
{
  "method": "GET",
  "url": "/order/courier/orders/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "status": "assigned"
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "order_id": 90,
      "dispatch_id": 22,
      "status": "assigned",
      "delivery_address": "22 Lekki, Lagos"
    }
  ]
}
```

### 12) GET /order/stats/

Sample request object:
```json
{
  "method": "GET",
  "url": "/order/stats/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "total_orders": 1290,
    "pending": 73,
    "processing": 54,
    "delivered": 1080,
    "cancelled": 83
  }
}
```

---

## Banking Endpoints

### 1) POST /banking/vendor/save/

Sample request object:
```json
{
  "method": "POST",
  "url": "/banking/vendor/save/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "vendor_email": "vendor1@example.com",
    "bank_name": "GTBank",
    "account_type": "Savings",
    "account_name": "Vendor One",
    "account_no": "0123456789"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "data": "Account details saved."
}
```

### 2) PATCH /banking/vendor/update/{vendor_email}/

Sample request object:
```json
{
  "method": "PATCH",
  "url": "/banking/vendor/update/vendor1@example.com/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "bank_name": "First Bank",
    "account_type": "Current",
    "account_name": "Vendor One Ltd",
    "account_no": "1234567890"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "data": "Account details updated."
}
```

### 3) GET /banking/vendor/get/{vendor_email}/

Sample request object:
```json
{
  "method": "GET",
  "url": "/banking/vendor/get/vendor1@example.com/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "bank_name": "First Bank",
    "account_type": "Current",
    "account_name": "Vendor One Ltd",
    "account_no": "1234567890"
  }
}
```

### 4) POST /banking/courier/save/

Sample request object:
```json
{
  "method": "POST",
  "url": "/banking/courier/save/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "courier_email": "rider@example.com",
    "bank_name": "UBA",
    "account_type": "Savings",
    "account_name": "Rider One",
    "account_no": "9988776655"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "data": "Account details saved."
}
```

### 5) PATCH /banking/courier/update/{courier_email}/

Sample request object:
```json
{
  "method": "PATCH",
  "url": "/banking/courier/update/rider@example.com/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "bank_name": "Zenith",
    "account_type": "Current",
    "account_name": "Rider One",
    "account_no": "5566778899"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "data": "Account details updated."
}
```

---

## Complaint Endpoints

### 1) POST /complaints/submit/

Sample request object:
```json
{
  "method": "POST",
  "url": "/complaints/submit/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "customer_email": "customer@example.com",
    "complaint_subject": "Damaged package",
    "courier_involved": "rider@example.com",
    "complaint_detail": "Outer box was torn and device scratched"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "data": "Your complaint has been registered"
}
```

### 2) PATCH /complaints/update/{complaint_id}/

Sample request object:
```json
{
  "method": "PATCH",
  "url": "/complaints/update/31/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "is_resolved": true,
    "is_satisfied": true
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "data": "Complaint Updated."
}
```

### 3) GET /complaints/customer/{customer_email}/

Sample request object:
```json
{
  "method": "GET",
  "url": "/complaints/customer/customer@example.com/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "id": 31,
      "complaint_subject": "Damaged package",
      "courier_involved": "rider@example.com",
      "complaint_detail": "Outer box was torn and device scratched",
      "is_resolved": true,
      "is_satisfied": true,
      "created_at": "2026-04-01T12:00:00Z"
    }
  ]
}
```

### 4) GET /complaints/all/

Sample request object:
```json
{
  "method": "GET",
  "url": "/complaints/all/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "id": 31,
      "customer_email": "customer@example.com",
      "complaint_subject": "Damaged package",
      "is_resolved": true,
      "is_satisfied": true
    }
  ]
}
```

---

## Customer Auth and Profile Endpoints

### 1) POST /auth/customer/register/

Sample request object:
```json
{
  "method": "POST",
  "url": "/auth/customer/register/",
  "headers": {
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "customer@example.com",
    "phone_no": "08012345678",
    "password": "StrongPass123!",
    "street": "22 Lekki",
    "state": "Lagos",
    "country": "Nigeria"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Customer registered successfully. Activation email sent",
  "data": {
    "email": "customer@example.com"
  }
}
```

### 2) POST /auth/customer/login/

Sample request object:
```json
{
  "method": "POST",
  "url": "/auth/customer/login/",
  "headers": {
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "email": "customer@example.com",
    "password": "StrongPass123!"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "email": "customer@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

### 3) GET /auth/customer/profile/

Sample request object:
```json
{
  "method": "GET",
  "url": "/auth/customer/profile/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_no": "08012345678",
    "street": "22 Lekki",
    "state": "Lagos",
    "country": "Nigeria"
  }
}
```

### 4) POST /auth/customer/password/reset/

Sample request object:
```json
{
  "method": "POST",
  "url": "/auth/customer/password/reset/",
  "headers": {
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "email": "customer@example.com"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Reset link sent to your email"
}
```

### 5) POST /auth/customer/password/save/

Sample request object:
```json
{
  "method": "POST",
  "url": "/auth/customer/password/save/",
  "headers": {
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "email": "customer@example.com",
    "password": "NewStrongPass123!"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Password updated successfully"
}
```

---

## Vendor Auth and Management Endpoints

### 1) POST /vendors/register/

Sample request object:
```json
{
  "method": "POST",
  "url": "/vendors/register/",
  "headers": {
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "vendor_name": "TechHub",
    "vendor_email": "vendor1@example.com",
    "vendor_phone": "08011112222",
    "vendor_address": "12 Marina, Lagos",
    "password": "VendorPass123!"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Registration successful. Activation email sent to vendor1@example.com",
  "data": {
    "vendor_email": "vendor1@example.com"
  }
}
```

### 2) POST /vendors/login/

Sample request object:
```json
{
  "method": "POST",
  "url": "/vendors/login/",
  "headers": {
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "vendor_email": "vendor1@example.com",
    "password": "VendorPass123!"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOi...",
    "vendor": {
      "vendor_email": "vendor1@example.com",
      "vendor_name": "TechHub"
    }
  }
}
```

### 3) GET /vendors/profile/

Sample request object:
```json
{
  "method": "GET",
  "url": "/vendors/profile/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "vendor_name": "TechHub",
    "vendor_email": "vendor1@example.com",
    "vendor_phone": "08011112222",
    "vendor_address": "12 Marina, Lagos"
  }
}
```

### 4) GET /vendors/temp/list/

Sample request object:
```json
{
  "method": "GET",
  "url": "/vendors/temp/list/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "id": 11,
      "vendor_email": "pendingvendor@example.com",
      "vendor_name": "Pending Shop",
      "is_email_verified": true,
      "is_approved": false
    }
  ]
}
```

### 5) POST /vendors/approve/{temp_vendor_id}/

Sample request object:
```json
{
  "method": "POST",
  "url": "/vendors/approve/11/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "approve": true
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Vendor pendingvendor@example.com approved successfully",
  "data": {
    "temp_vendor_id": 11,
    "approved": true
  }
}
```

### 6) GET /vendors/list/

Sample request object:
```json
{
  "method": "GET",
  "url": "/vendors/list/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "active": true
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "id": 3,
      "vendor_name": "TechHub",
      "vendor_email": "vendor1@example.com",
      "is_active": true
    }
  ]
}
```

---

## Courier Auth and Operations Endpoints

### 1) POST /couriers/register/

Sample request object:
```json
{
  "method": "POST",
  "url": "/couriers/register/",
  "headers": {
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "courier_name": "Rider One",
    "courier_email": "rider@example.com",
    "phone_no": "08033334444",
    "password": "CourierPass123!",
    "vehicle_type": "bike"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Registration successful. Activation email sent to rider@example.com",
  "data": {
    "courier_email": "rider@example.com"
  }
}
```

### 2) POST /couriers/login/

Sample request object:
```json
{
  "method": "POST",
  "url": "/couriers/login/",
  "headers": {
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "courier_email": "rider@example.com",
    "password": "CourierPass123!"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOi...",
    "courier": {
      "courier_email": "rider@example.com",
      "courier_name": "Rider One"
    }
  }
}
```

### 3) GET /couriers/profile/

Sample request object:
```json
{
  "method": "GET",
  "url": "/couriers/profile/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "courier_name": "Rider One",
    "courier_email": "rider@example.com",
    "phone_no": "08033334444",
    "vehicle_type": "bike"
  }
}
```

### 4) POST /couriers/location/update/

Sample request object:
```json
{
  "method": "POST",
  "url": "/couriers/location/update/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "courier_email": "rider@example.com",
    "latitude": 6.5301,
    "longitude": 3.3892
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Courier location updated",
  "data": {
    "courier_email": "rider@example.com",
    "latitude": 6.5301,
    "longitude": 3.3892
  }
}
```

### 5) POST /couriers/status/update/

Sample request object:
```json
{
  "method": "POST",
  "url": "/couriers/status/update/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "courier_email": "rider@example.com",
    "availability_status": "available"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Courier status updated",
  "data": {
    "courier_email": "rider@example.com",
    "availability_status": "available"
  }
}
```

### 6) GET /couriers/available/

Sample request object:
```json
{
  "method": "GET",
  "url": "/couriers/available/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "state": "Lagos"
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "courier_email": "rider@example.com",
      "courier_name": "Rider One",
      "availability_status": "available",
      "latitude": 6.5301,
      "longitude": 3.3892
    }
  ]
}
```

### 7) GET /couriers/temp/list/

Sample request object:
```json
{
  "method": "GET",
  "url": "/couriers/temp/list/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "id": 20,
      "courier_email": "pendingrider@example.com",
      "courier_name": "Pending Rider",
      "is_email_verified": true,
      "is_approved": false
    }
  ]
}
```

### 8) POST /couriers/approve/{temp_courier_id}/

Sample request object:
```json
{
  "method": "POST",
  "url": "/couriers/approve/20/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "approve": true
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Courier pendingrider@example.com approved successfully",
  "data": {
    "temp_courier_id": 20,
    "approved": true
  }
}
```

### 9) GET /couriers/list/

Sample request object:
```json
{
  "method": "GET",
  "url": "/couriers/list/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "active": true
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "id": 4,
      "courier_name": "Rider One",
      "courier_email": "rider@example.com",
      "is_active": true
    }
  ]
}
```

---

## Admin Auth and Management Endpoints

### 1) POST /auth/api/login/

Sample request object:
```json
{
  "method": "POST",
  "url": "/auth/api/login/",
  "headers": {
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "email": "admin@example.com",
    "password": "AdminPass123!"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOi...",
    "admin": {
      "id": 1,
      "email": "admin@example.com",
      "role": "super_admin"
    }
  }
}
```

### 2) POST /auth/api/logout/

Sample request object:
```json
{
  "method": "POST",
  "url": "/auth/api/logout/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": {}
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

### 3) GET /auth/api/profile/

Sample request object:
```json
{
  "method": "GET",
  "url": "/auth/api/profile/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "first_name": "Super",
    "last_name": "Admin",
    "role": "super_admin"
  }
}
```

### 4) PATCH /auth/api/profile/

Sample request object:
```json
{
  "method": "PATCH",
  "url": "/auth/api/profile/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "first_name": "Platform",
    "last_name": "Administrator"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "first_name": "Platform",
    "last_name": "Administrator"
  }
}
```

### 5) POST /auth/api/change-password/

Sample request object:
```json
{
  "method": "POST",
  "url": "/auth/api/change-password/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "old_password": "AdminPass123!",
    "new_password": "AdminPass456!"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

### 6) GET /auth/api/admins/

Sample request object:
```json
{
  "method": "GET",
  "url": "/auth/api/admins/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "page": 1
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "email": "admin@example.com",
      "role": "super_admin",
      "is_active": true
    }
  ]
}
```

### 7) POST /auth/api/admins/

Sample request object:
```json
{
  "method": "POST",
  "url": "/auth/api/admins/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "email": "ops-admin@example.com",
    "password": "OpsAdmin123!",
    "role": "admin"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Admin user created successfully",
  "data": {
    "id": 7,
    "email": "ops-admin@example.com",
    "role": "admin"
  }
}
```

### 8) GET /auth/api/customers/

Sample request object:
```json
{
  "method": "GET",
  "url": "/auth/api/customers/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "page": 1
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": [
    {
      "id": 23,
      "email": "customer@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_active": true
    }
  ]
}
```

---

## Messaging Endpoints

### 1) GET /messaging/templates/

Sample request object:
```json
{
  "method": "GET",
  "url": "/messaging/templates/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "page": 1
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "count": 2,
    "results": [
      {
        "id": 1,
        "name": "order_confirmation",
        "subject": "Order Confirmed",
        "body": "Hello {{name}}, your order {{order_id}} is confirmed."
      }
    ]
  }
}
```

### 2) POST /messaging/templates/

Sample request object:
```json
{
  "method": "POST",
  "url": "/messaging/templates/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "name": "delivery_update",
    "subject": "Delivery Update",
    "body": "Hi {{name}}, your package is now {{status}}."
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Template created",
  "data": {
    "id": 3,
    "name": "delivery_update"
  }
}
```

### 3) GET /messaging/templates/{template_id}/

Sample request object:
```json
{
  "method": "GET",
  "url": "/messaging/templates/3/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "id": 3,
    "name": "delivery_update",
    "subject": "Delivery Update",
    "body": "Hi {{name}}, your package is now {{status}}."
  }
}
```

### 4) PUT /messaging/templates/{template_id}/

Sample request object:
```json
{
  "method": "PUT",
  "url": "/messaging/templates/3/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "name": "delivery_update",
    "subject": "Delivery Status Update",
    "body": "Hello {{name}}, order {{order_id}} is {{status}}."
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Template updated",
  "data": {
    "id": 3,
    "subject": "Delivery Status Update"
  }
}
```

### 5) DELETE /messaging/templates/{template_id}/

Sample request object:
```json
{
  "method": "DELETE",
  "url": "/messaging/templates/3/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Template deleted",
  "data": {
    "id": 3
  }
}
```

### 6) POST /messaging/templates/{template_id}/preview/

Sample request object:
```json
{
  "method": "POST",
  "url": "/messaging/templates/1/preview/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "context": {
      "name": "John Doe",
      "order_id": "ORD-2026-90",
      "status": "processing"
    }
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "preview_subject": "Order Confirmed",
    "preview_body": "Hello John Doe, your order ORD-2026-90 is confirmed."
  }
}
```

### 7) GET /messaging/emails/

Sample request object:
```json
{
  "method": "GET",
  "url": "/messaging/emails/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "page": 1,
    "status": "sent"
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "count": 1,
    "results": [
      {
        "id": 19,
        "to_email": "customer@example.com",
        "subject": "Order Confirmed",
        "status": "sent",
        "created_at": "2026-04-04T10:15:00Z"
      }
    ]
  }
}
```

### 8) POST /messaging/emails/

Sample request object:
```json
{
  "method": "POST",
  "url": "/messaging/emails/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "to_email": "customer@example.com",
    "subject": "Promo Offer",
    "body": "Get 10% off today"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Email queued successfully",
  "data": {
    "id": 20,
    "status": "queued"
  }
}
```

### 9) POST /messaging/orders/{order_id}/send-confirmation/

Sample request object:
```json
{
  "method": "POST",
  "url": "/messaging/orders/90/send-confirmation/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "resend": false
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Order confirmation sent",
  "data": {
    "order_id": 90,
    "email_status": "sent"
  }
}
```

### 10) POST /messaging/bulk-email/

Sample request object:
```json
{
  "method": "POST",
  "url": "/messaging/bulk-email/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "subject": "Maintenance Notice",
    "body": "Service window starts at 11PM",
    "recipients": [
      "vendor1@example.com",
      "customer@example.com"
    ]
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Bulk email queued",
  "data": {
    "queued_count": 2,
    "failed_count": 0
  }
}
```

### 11) GET /messaging/notifications/

Sample request object:
```json
{
  "method": "GET",
  "url": "/messaging/notifications/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "read": false,
    "page": 1
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "count": 1,
    "results": [
      {
        "id": 44,
        "title": "Dispatch assigned",
        "message": "You have a new dispatch",
        "read": false
      }
    ]
  }
}
```

### 12) POST /messaging/notifications/

Sample request object:
```json
{
  "method": "POST",
  "url": "/messaging/notifications/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "recipient_email": "rider@example.com",
    "title": "Pickup Reminder",
    "message": "Please pick up order ORD-2026-90"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Notification created",
  "data": {
    "id": 45,
    "read": false
  }
}
```

### 13) PATCH /messaging/notifications/{notification_id}/

Sample request object:
```json
{
  "method": "PATCH",
  "url": "/messaging/notifications/45/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "read": true
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "Notification updated",
  "data": {
    "id": 45,
    "read": true
  }
}
```

### 14) GET /messaging/smtp-settings/

Sample request object:
```json
{
  "method": "GET",
  "url": "/messaging/smtp-settings/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {},
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "noreply@parcelapp.com",
    "use_tls": true,
    "from_email": "noreply@parcelapp.com"
  }
}
```

### 15) POST /messaging/smtp-settings/

Sample request object:
```json
{
  "method": "POST",
  "url": "/messaging/smtp-settings/",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "noreply@parcelapp.com",
    "password": "app-specific-password",
    "use_tls": true,
    "from_email": "noreply@parcelapp.com"
  }
}
```

Sample response object:
```json
{
  "status": "success",
  "message": "SMTP settings saved",
  "data": {
    "host": "smtp.gmail.com",
    "port": 587,
    "use_tls": true
  }
}
```

### 16) GET /messaging/stats/

Sample request object:
```json
{
  "method": "GET",
  "url": "/messaging/stats/",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "query": {
    "range": "30d"
  },
  "body": null
}
```

Sample response object:
```json
{
  "status": "success",
  "data": {
    "total_sent": 4021,
    "total_failed": 43,
    "success_rate": 98.94,
    "notifications_unread": 17
  }
}
```

---

## Geolocation Endpoint

### 1) POST /geolocation/api/calculate/

Sample request object:
```json
{
  "method": "POST",
  "url": "/geolocation/api/calculate/",
  "headers": {
    "Content-Type": "application/json"
  },
  "query": {},
  "body": {
    "origin": {
      "latitude": 6.5244,
      "longitude": 3.3792
    },
    "destination": {
      "latitude": 6.6018,
      "longitude": 3.3515
    }
  }
}
```

Sample response object:
```json
{
  "distance_km": 9.84,
  "estimated_duration_min": 23,
  "origin": {
    "latitude": 6.5244,
    "longitude": 3.3792
  },
  "destination": {
    "latitude": 6.6018,
    "longitude": 3.3515
  }
}
```

---

## Quick Error Response Object (Reusable in Postman Tests)

```json
{
  "status": "error",
  "message": "Enter valid data please."
}
```

or:

```json
{
  "status": "error",
  "data": "You have no bank details yet"
}
```

## Notes

- Use exact snake_case keys from samples when debugging request validation.
- Some endpoints can return paginated `data.results`; others return a direct array/object in `data`.
- A few legacy/template endpoints exist in the service but are not included here because this file focuses on API-style debugging requests.
