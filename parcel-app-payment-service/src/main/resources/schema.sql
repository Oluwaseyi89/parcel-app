-- Parcel App Payment Service - PostgreSQL Schema
-- Idempotent schema creation - safe to run multiple times
-- Aligned with JPA entity definitions (all IDs are Long/BIGINT)

-- Create user_payment table
CREATE TABLE IF NOT EXISTS user_payment (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create parcel_product_product table (Products/Inventory)
CREATE TABLE IF NOT EXISTS parcel_product_product (
    id BIGSERIAL PRIMARY KEY,
    vendor_name VARCHAR(255),
    vendor_phone VARCHAR(20),
    vendor_email VARCHAR(255),
    vend_photo TEXT,
    prod_cat VARCHAR(100),
    prod_name VARCHAR(255) NOT NULL,
    prod_model VARCHAR(100),
    prod_photo TEXT,
    prod_price VARCHAR(50),
    prod_qty INTEGER DEFAULT 0,
    prod_disc VARCHAR(255),
    prod_desc TEXT,
    img_base TEXT,
    appr_officer VARCHAR(100),
    appr_date VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create parcel_order_orderdetail table (Orders)
CREATE TABLE IF NOT EXISTS parcel_order_orderdetail (
    id BIGSERIAL PRIMARY KEY,
    customer_id VARCHAR(50),
    customer_name VARCHAR(255),
    total_items INTEGER,
    total_price INTEGER,
    shipping_method VARCHAR(100),
    shipping_fee VARCHAR(50),
    zip_code VARCHAR(20),
    payment_id VARCHAR(100),
    is_customer BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create parcel_order_orderitem table (Order Items/Line Items)
CREATE TABLE IF NOT EXISTS parcel_order_orderitem (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 1,
    is_customer BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orderitem_order FOREIGN KEY (order_id) 
        REFERENCES parcel_order_orderdetail(id) ON DELETE CASCADE,
    CONSTRAINT fk_orderitem_product FOREIGN KEY (product_id) 
        REFERENCES parcel_product_product(id) ON DELETE RESTRICT
);

-- Create parcel_order_paymentdetail table (Payment Details)
CREATE TABLE IF NOT EXISTS parcel_order_paymentdetail (
    id BIGSERIAL PRIMARY KEY,
    order_id INTEGER,
    customer_id VARCHAR(255),
    customer_name VARCHAR(255),
    amount INTEGER,
    shipping_fee INTEGER,
    grand_total_amount INTEGER,
    provider VARCHAR(100),
    payment_type VARCHAR(50),
    status VARCHAR(50),
    is_customer BOOLEAN DEFAULT FALSE,
    reference VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_email ON user_payment(email);
CREATE INDEX IF NOT EXISTS idx_orderitem_order_id ON parcel_order_orderitem(order_id);
CREATE INDEX IF NOT EXISTS idx_orderitem_product_id ON parcel_order_orderitem(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_reference ON parcel_order_paymentdetail(reference);
CREATE INDEX IF NOT EXISTS idx_payment_status ON parcel_order_paymentdetail(status);
