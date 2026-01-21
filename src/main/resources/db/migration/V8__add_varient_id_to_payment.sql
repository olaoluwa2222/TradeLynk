ALTER TABLE payments ADD COLUMN variant_id BIGINT;
ALTER TABLE payments ADD CONSTRAINT fk_payments_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
CREATE INDEX idx_payments_variant_id ON payments(variant_id);