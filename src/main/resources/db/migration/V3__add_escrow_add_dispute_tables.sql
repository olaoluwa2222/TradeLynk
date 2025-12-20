-- V3__add_escrow_and_dispute_tables.sql
-- Database migration for escrow system: Disputes and Transfers
-- Place this in src/main/resources/db/migration/

-- ============================================
-- 1. UPDATE ORDERS TABLE - ADD NEW STATUSES AND TIMESTAMPS
-- ============================================

-- Add new timestamp columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;

-- Update status column to support new escrow statuses
-- Note: Existing data will need manual migration if you have orders
-- For now, we'll just add the constraint
COMMENT ON COLUMN orders.status IS 'Order status: PAYMENT_HELD, SHIPPED, DELIVERED, COMPLETED, DISPUTED, REFUNDED, CANCELLED';

-- ============================================
-- 2. CREATE DISPUTES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS disputes (
                                        id BIGSERIAL PRIMARY KEY,

    -- Foreign Keys
                                        order_id BIGINT NOT NULL,
                                        raised_by BIGINT NOT NULL,
                                        resolved_by BIGINT,

    -- Dispute Details
                                        reason VARCHAR(50) NOT NULL CHECK (reason IN (
                                                                           'ITEM_NOT_RECEIVED',
                                                                           'ITEM_NOT_AS_DESCRIBED',
                                                                           'ITEM_DAMAGED',
                                                                           'WRONG_ITEM_SENT',
                                                                           'INCOMPLETE_ORDER',
                                                                           'OTHER'
                                                                                     )),
    description VARCHAR(1000) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN (
                                                      'OPEN',
                                                      'UNDER_REVIEW',
                                                      'RESOLVED',
                                                      'CLOSED'
                                                                )),
    resolution VARCHAR(50) CHECK (resolution IN (
                                  'REFUND_BUYER',
                                  'RELEASE_TO_SELLER',
                                  'PARTIAL_REFUND',
                                  'NO_ACTION'
                                                )),
    admin_notes VARCHAR(1000),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,

    -- Foreign Key Constraints
    CONSTRAINT fk_dispute_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
    CONSTRAINT fk_dispute_raised_by FOREIGN KEY (raised_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_dispute_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
    );

-- ============================================
-- 3. CREATE TRANSFERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS transfers (
                                         id BIGSERIAL PRIMARY KEY,

    -- Foreign Keys
                                         seller_id BIGINT NOT NULL,
                                         order_id BIGINT NOT NULL,

    -- Transfer Details
                                         amount BIGINT NOT NULL CHECK (amount > 0),
    original_amount BIGINT NOT NULL CHECK (original_amount > 0),
    platform_fee BIGINT NOT NULL CHECK (platform_fee >= 0),
    paystack_transfer_code VARCHAR(100) UNIQUE,
    paystack_recipient_code VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
                                                         'PENDING',
                                                         'SUCCESS',
                                                         'FAILED',
                                                         'REVERSED'
                                                                   )),
    failure_reason VARCHAR(500),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    -- Foreign Key Constraints
    CONSTRAINT fk_transfer_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
    );

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Disputes indexes
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_raised_by ON disputes(raised_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_resolved_by ON disputes(resolved_by);

-- Transfers indexes
CREATE INDEX IF NOT EXISTS idx_transfers_seller_id ON transfers(seller_id);
CREATE INDEX IF NOT EXISTS idx_transfers_order_id ON transfers(order_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_paystack_code ON transfers(paystack_transfer_code);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at DESC);

-- Orders additional indexes for escrow queries
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at);
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON orders(completed_at);

-- ============================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE disputes IS 'Tracks disputes raised by buyers for order issues';
COMMENT ON COLUMN disputes.order_id IS 'Reference to the disputed order';
COMMENT ON COLUMN disputes.raised_by IS 'User who raised the dispute (buyer)';
COMMENT ON COLUMN disputes.resolved_by IS 'Admin who resolved the dispute';
COMMENT ON COLUMN disputes.reason IS 'Reason for dispute (enum)';
COMMENT ON COLUMN disputes.description IS 'Detailed explanation from buyer';
COMMENT ON COLUMN disputes.status IS 'Dispute status: OPEN, UNDER_REVIEW, RESOLVED, CLOSED';
COMMENT ON COLUMN disputes.resolution IS 'How dispute was resolved (if resolved)';
COMMENT ON COLUMN disputes.admin_notes IS 'Admin notes about resolution';

COMMENT ON TABLE transfers IS 'Tracks Paystack transfers to sellers (payouts)';
COMMENT ON COLUMN transfers.seller_id IS 'Seller receiving the payout';
COMMENT ON COLUMN transfers.order_id IS 'Order associated with this payout';
COMMENT ON COLUMN transfers.amount IS 'Amount transferred to seller in kobo (after platform fee)';
COMMENT ON COLUMN transfers.original_amount IS 'Original order amount before fees';
COMMENT ON COLUMN transfers.platform_fee IS 'Platform commission (3%)';
COMMENT ON COLUMN transfers.paystack_transfer_code IS 'Paystack transfer reference';
COMMENT ON COLUMN transfers.paystack_recipient_code IS 'Paystack recipient code for seller';
COMMENT ON COLUMN transfers.status IS 'Transfer status: PENDING, SUCCESS, FAILED, REVERSED';
COMMENT ON COLUMN transfers.failure_reason IS 'Reason if transfer failed';

-- ============================================
-- 6. DATA MIGRATION (IF YOU HAVE EXISTING ORDERS)
-- ============================================

-- If you have existing orders with status PENDING_DELIVERY, update them:
-- UPDATE orders SET status = 'PAYMENT_HELD' WHERE status = 'PENDING_DELIVERY';

-- Note: Uncomment the above line ONLY if you want to migrate existing orders
-- Otherwise, leave existing orders as-is and new orders will use new statuses