-- ============================================
-- Flyway Migration: V2__add_enhanced_product_system.sql
-- Place this in: src/main/resources/db/migration/
-- ============================================

-- NOTE: This is the SAME script as Supabase, but formatted for Flyway
-- Flyway will SKIP this migration if tables already exist in Supabase

-- ============================================
-- STEP 1: Add new columns to existing items table
-- ============================================

ALTER TABLE items ADD COLUMN IF NOT EXISTS slug VARCHAR(150);
ALTER TABLE items ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE items ADD COLUMN IF NOT EXISTS compare_at_price BIGINT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS cost_price BIGINT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT true;
ALTER TABLE items ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS download_url VARCHAR(500);
ALTER TABLE items ADD COLUMN IF NOT EXISTS download_limit INTEGER;
ALTER TABLE items ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true;
ALTER TABLE items ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE items ADD COLUMN IF NOT EXISTS allow_backorders BOOLEAN DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS weight_in_grams INTEGER;
ALTER TABLE items ADD COLUMN IF NOT EXISTS length_in_cm INTEGER;
ALTER TABLE items ADD COLUMN IF NOT EXISTS width_in_cm INTEGER;
ALTER TABLE items ADD COLUMN IF NOT EXISTS height_in_cm INTEGER;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS meta_title VARCHAR(200);
ALTER TABLE items ADD COLUMN IF NOT EXISTS meta_description VARCHAR(500);
ALTER TABLE items ADD COLUMN IF NOT EXISTS vendor VARCHAR(100);
ALTER TABLE items ADD COLUMN IF NOT EXISTS product_type VARCHAR(100);
ALTER TABLE items ADD COLUMN IF NOT EXISTS shipping_profile_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_items_slug ON items(slug);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS idx_items_is_featured ON items(is_featured);
CREATE INDEX IF NOT EXISTS idx_items_shipping_profile_id ON items(shipping_profile_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'items_slug_key'
        AND conrelid = 'items'::regclass
    ) THEN
ALTER TABLE items ADD CONSTRAINT items_slug_key UNIQUE (slug);
END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'items_sku_key'
        AND conrelid = 'items'::regclass
    ) THEN
ALTER TABLE items ADD CONSTRAINT items_sku_key UNIQUE (sku);
END IF;
END $$;

-- ============================================
-- STEP 2-9: Create all new tables
-- ============================================

CREATE TABLE IF NOT EXISTS product_variants (
                                                id BIGSERIAL PRIMARY KEY,
                                                item_id BIGINT NOT NULL,
                                                variant_name VARCHAR(100) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    price BIGINT,
    compare_at_price BIGINT,
    cost_price BIGINT,
    stock INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    track_inventory BOOLEAN NOT NULL DEFAULT true,
    allow_backorders BOOLEAN NOT NULL DEFAULT false,
    image_url VARCHAR(500),
    is_default BOOLEAN NOT NULL DEFAULT false,
    position INTEGER DEFAULT 0,
    weight_in_grams INTEGER,
    variant_options TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_variants_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_product_variants_item_id ON product_variants(item_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_default ON product_variants(is_default);

CREATE TABLE IF NOT EXISTS product_images (
                                              id BIGSERIAL PRIMARY KEY,
                                              item_id BIGINT NOT NULL,
                                              image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    alt_text VARCHAR(200),
    position INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    width INTEGER,
    height INTEGER,
    file_size BIGINT,
    cloudinary_public_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_images_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_product_images_item_id ON product_images(item_id);
CREATE INDEX IF NOT EXISTS idx_product_images_position ON product_images(position);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary);

CREATE TABLE IF NOT EXISTS collections (
                                           id BIGSERIAL PRIMARY KEY,
                                           seller_id BIGINT NOT NULL,
                                           name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_collections_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_collections_seller_id ON collections(seller_id);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_is_active ON collections(is_active);
CREATE INDEX IF NOT EXISTS idx_collections_is_featured ON collections(is_featured);

CREATE TABLE IF NOT EXISTS collection_items (
                                                collection_id BIGINT NOT NULL,
                                                item_id BIGINT NOT NULL,
                                                PRIMARY KEY (collection_id, item_id),
    CONSTRAINT fk_collection_items_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    CONSTRAINT fk_collection_items_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_item_id ON collection_items(item_id);

CREATE TABLE IF NOT EXISTS product_tags (
                                            id BIGSERIAL PRIMARY KEY,
                                            name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(50),
    description VARCHAR(200),
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_product_tags_name ON product_tags(name);
CREATE INDEX IF NOT EXISTS idx_product_tags_usage_count ON product_tags(usage_count);

CREATE TABLE IF NOT EXISTS item_tags (
                                         item_id BIGINT NOT NULL,
                                         tag_id BIGINT NOT NULL,
                                         PRIMARY KEY (item_id, tag_id),
    CONSTRAINT fk_item_tags_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_tags_tag FOREIGN KEY (tag_id) REFERENCES product_tags(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_item_tags_item_id ON item_tags(item_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id ON item_tags(tag_id);

CREATE TABLE IF NOT EXISTS shipping_profiles (
                                                 id BIGSERIAL PRIMARY KEY,
                                                 seller_id BIGINT NOT NULL,
                                                 name VARCHAR(100) NOT NULL,
    shipping_method VARCHAR(50) NOT NULL,
    flat_rate_cost BIGINT,
    cost_per_kg BIGINT,
    free_shipping_threshold BIGINT,
    min_delivery_days INTEGER,
    max_delivery_days INTEGER,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    location_rates TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shipping_profiles_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_shipping_profiles_seller_id ON shipping_profiles(seller_id);
CREATE INDEX IF NOT EXISTS idx_shipping_profiles_is_default ON shipping_profiles(is_default);

CREATE TABLE IF NOT EXISTS variant_options (
                                               id BIGSERIAL PRIMARY KEY,
                                               seller_id BIGINT,
                                               option_name VARCHAR(50) NOT NULL,
    option_values TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_system_template BOOLEAN NOT NULL DEFAULT false,
    category VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_variant_options_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_variant_options_seller_id ON variant_options(seller_id);
CREATE INDEX IF NOT EXISTS idx_variant_options_option_name ON variant_options(option_name);

-- ============================================
-- STEP 10: Add foreign key constraint
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_items_shipping_profile'
        AND conrelid = 'items'::regclass
    ) THEN
ALTER TABLE items
    ADD CONSTRAINT fk_items_shipping_profile
        FOREIGN KEY (shipping_profile_id)
            REFERENCES shipping_profiles(id)
            ON DELETE SET NULL;
END IF;
END $$;

-- ============================================
-- STEP 11: Add new enum values
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'items_status') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum
            WHERE enumlabel = 'OUT_OF_STOCK'
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'items_status')
        ) THEN
ALTER TYPE items_status ADD VALUE 'OUT_OF_STOCK';
END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_enum
            WHERE enumlabel = 'DRAFT'
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'items_status')
        ) THEN
ALTER TYPE items_status ADD VALUE 'DRAFT';
END IF;
END IF;
END $$;

-- ============================================
-- STEP 12: Insert variant templates
-- ============================================

INSERT INTO variant_options (seller_id, option_name, option_values, display_order, is_system_template, category)
VALUES
    (NULL, 'Size', 'XS,S,M,L,XL,XXL', 0, true, 'CLOTHING'),
    (NULL, 'Color', 'Black,White,Red,Blue,Green,Yellow,Orange,Pink,Purple,Brown,Gray', 1, true, NULL),
    (NULL, 'Storage', '64GB,128GB,256GB,512GB,1TB', 0, true, 'ELECTRONICS'),
    (NULL, 'Format', 'Hardcover,Paperback,eBook', 0, true, 'BOOKS'),
    (NULL, 'Weight', '250g,500g,1kg,2kg,5kg', 0, true, 'FOOD')
    ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 13: Create triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipping_profiles_updated_at ON shipping_profiles;
CREATE TRIGGER update_shipping_profiles_updated_at
    BEFORE UPDATE ON shipping_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();