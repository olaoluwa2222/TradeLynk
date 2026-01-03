-- V6__add_storefront_themes.sql
-- Add theme and customization fields

DO $$
BEGIN
    -- Theme
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'theme'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN theme VARCHAR(50) DEFAULT 'modern-clean';
END IF;

    -- Primary color
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'primary_color'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN primary_color VARCHAR(7) DEFAULT '#000000';
END IF;

    -- Secondary color
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'secondary_color'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#FFFFFF';
END IF;

    -- Layout type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'layout_type'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN layout_type VARCHAR(20) DEFAULT 'multi-page';
END IF;

    -- Facebook handle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'facebook_handle'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN facebook_handle VARCHAR(100);
END IF;
END $$;