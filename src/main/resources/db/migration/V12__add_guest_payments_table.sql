-- V12__add_guest_payments_table.sql
-- Stores guest buyer information for payments initiated without a TradeLynk account.
-- Used by the WhatsApp bot and any unauthenticated payment links.
-- Guest payment references are prefixed with "tlg_" to distinguish them from
-- authenticated payment references (prefixed "tl_").

CREATE TABLE IF NOT EXISTS guest_payments (
    id                  BIGSERIAL PRIMARY KEY,

    -- Item / seller info
    item_id             BIGINT NOT NULL,
    variant_id          BIGINT,
    seller_id           BIGINT NOT NULL,

    -- Guest buyer info (no User account required)
    buyer_name          VARCHAR(150) NOT NULL,
    buyer_email         VARCHAR(255) NOT NULL,
    buyer_phone         VARCHAR(30),

    -- Payment details
    amount              BIGINT NOT NULL CHECK (amount > 0),   -- In Naira
    paystack_reference  VARCHAR(100) NOT NULL UNIQUE,
    authorization_url   VARCHAR(500),
    delivery_address    VARCHAR(500) NOT NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',

    -- Timestamps
    paid_at             TIMESTAMP,
    order_created_at    TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key to items table (soft reference — item may be deleted)
    CONSTRAINT fk_guest_payment_item   FOREIGN KEY (item_id)   REFERENCES items(id)  ON DELETE RESTRICT,
    CONSTRAINT fk_guest_payment_seller FOREIGN KEY (seller_id) REFERENCES users(id)  ON DELETE RESTRICT
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_reference  ON guest_payments(paystack_reference);
CREATE        INDEX IF NOT EXISTS idx_guest_email      ON guest_payments(buyer_email);
CREATE        INDEX IF NOT EXISTS idx_guest_seller_id  ON guest_payments(seller_id);
CREATE        INDEX IF NOT EXISTS idx_guest_status     ON guest_payments(status);

-- Comments
COMMENT ON TABLE  guest_payments IS 'Payments initiated by non-registered (guest) buyers via WhatsApp bot or direct links';
COMMENT ON COLUMN guest_payments.amount IS 'Order amount in Naira (not kobo)';
COMMENT ON COLUMN guest_payments.paystack_reference IS 'Unique Paystack reference — always prefixed tlg_ for guest payments';
COMMENT ON COLUMN guest_payments.status IS 'PENDING | SUCCESS | FAILED | CANCELLED';
COMMENT ON COLUMN guest_payments.order_created_at IS 'Set when downstream order tracking is recorded for this guest payment';

