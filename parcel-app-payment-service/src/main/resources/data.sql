-- Data migration script for PostgreSQL
-- Run this after schema.sql to populate initial data (optional)

-- Example: Insert sample products
INSERT INTO parcel_product_product (
    vendor_name, vendor_phone, vendor_email, prod_name, prod_cat, prod_price, prod_qty
) VALUES
    ('Tech Vendor', '+2348012345678', 'vendor@example.com', 'Laptop', 'Electronics', '500000', 10),
    ('Fashion Store', '+2348087654321', 'fashion@example.com', 'T-Shirt', 'Clothing', '5000', 50)
ON CONFLICT DO NOTHING;

-- Example: Insert sample users
INSERT INTO user_payment (email, first_name, last_name) VALUES
    ('john@example.com', 'John', 'Doe'),
    ('jane@example.com', 'Jane', 'Smith')
ON CONFLICT (email) DO NOTHING;
