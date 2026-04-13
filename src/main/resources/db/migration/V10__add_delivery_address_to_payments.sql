-- Add delivery_address column to payments table
-- This stores the delivery address in the payment record so the webhook can use it
-- when creating orders (without relying on Paystack metadata extraction)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS delivery_address VARCHAR(500);

COMMENT ON COLUMN payments.delivery_address IS 'Delivery address stored for webhook order creation';

