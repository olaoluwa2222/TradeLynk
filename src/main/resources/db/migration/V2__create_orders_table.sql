-- V2__create_orders_table.sql
-- Database migration for Orders table
-- Place this in src/main/resources/db/migration/
-- Since you already have V1, this should be V2

-- ============================================
-- CREATE ORDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
                                      id BIGSERIAL PRIMARY KEY,

    -- Foreign Keys
                                      item_id BIGINT NOT NULL,
                                      buyer_id BIGINT NOT NULL,
                                      seller_id BIGINT NOT NULL,
                                      payment_id BIGINT NOT NULL UNIQUE,

    -- Order Details
                                      amount BIGINT NOT NULL CHECK (amount > 0),
    delivery_address VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_DELIVERY' CHECK (status IN ('PENDING_DELIVERY', 'DELIVERED', 'CANCELLED')),
    cancellation_reason VARCHAR(1000),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    auto_completed_at TIMESTAMP,

    -- Foreign Key Constraints
    CONSTRAINT fk_order_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
    CONSTRAINT fk_order_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_order_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_order_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT
    );

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_status_created_at ON orders(status, created_at);
CREATE INDEX idx_orders_payment_id ON orders(payment_id);

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE orders IS 'Stores order information after successful payment';
COMMENT ON COLUMN orders.item_id IS 'Reference to the purchased item';
COMMENT ON COLUMN orders.buyer_id IS 'Reference to the buyer (user)';
COMMENT ON COLUMN orders.seller_id IS 'Reference to the seller (user)';
COMMENT ON COLUMN orders.payment_id IS 'Reference to the payment record (unique - one order per payment)';
COMMENT ON COLUMN orders.amount IS 'Final paid amount in kobo (Nigerian currency)';
COMMENT ON COLUMN orders.delivery_address IS 'Campus delivery location provided by buyer';
COMMENT ON COLUMN orders.status IS 'Order status: PENDING_DELIVERY, DELIVERED, or CANCELLED';
COMMENT ON COLUMN orders.cancellation_reason IS 'Reason for cancellation if order is cancelled';
COMMENT ON COLUMN orders.delivered_at IS 'Timestamp when buyer marked order as delivered';
COMMENT ON COLUMN orders.auto_completed_at IS 'Timestamp when system auto-completed delivery (after 48 hours)';