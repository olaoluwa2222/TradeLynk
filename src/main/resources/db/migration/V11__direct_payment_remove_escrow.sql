-- V11__direct_payment_remove_escrow.sql
-- Migrate from escrow flow to direct payment flow.
-- PAYMENT_HELD status is replaced by PAID.
-- Sellers now receive 100% of order amounts directly via Paystack.

-- ============================================
-- 1. DROP OLD CHECK CONSTRAINT ON status COLUMN
--    (V2 created: CHECK (status IN ('PENDING_DELIVERY', 'DELIVERED', 'CANCELLED'))
--     V3 did not drop it — we drop it here so PAID and all new statuses are accepted)
-- ============================================

-- Find and drop the constraint by name (Postgres names inline CHECK constraints automatically)
-- The constraint name is typically orders_status_check or similar
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'orders'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT ' || quote_ident(constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END;
$$;

-- ============================================
-- 2. MIGRATE EXISTING ORDER STATUSES
-- ============================================

-- Any order that was in PAYMENT_HELD (funds "in escrow") is now PAID
UPDATE orders
SET status = 'PAID'
WHERE status = 'PAYMENT_HELD';

-- Any legacy PENDING_DELIVERY orders become PAID as well
UPDATE orders
SET status = 'PAID'
WHERE status = 'PENDING_DELIVERY';

-- Update the column comment to reflect new statuses
COMMENT ON COLUMN orders.status IS 'Order status: PAID, SHIPPED, DELIVERED, COMPLETED, DISPUTED, REFUNDED, CANCELLED';

-- ============================================
-- NOTE: No structural schema changes required.
-- The status column is VARCHAR so no ALTER needed.
-- platform_fee column in transfers is kept for historical records
-- but new transfers always store 0 as platform_fee.
-- ============================================


