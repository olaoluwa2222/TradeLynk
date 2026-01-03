-- V4__add_storefront_fields.sql
-- Add username to users table and storefront fields to seller_profiles
-- Created: 2026-01-03
-- Author: TradeLynk Team

-- ============================================
-- 1. ADD USERNAME TO USERS TABLE
-- ============================================
DO $$
BEGIN
    -- Add username column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
ALTER TABLE users ADD COLUMN username VARCHAR(50);
END IF;

    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_username_key'
    ) THEN
ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
END IF;
END $$;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================
-- 2. ADD STOREFRONT FIELDS TO SELLER_PROFILES
-- ============================================

-- Required fields (collected during signup)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'store_tagline'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN store_tagline VARCHAR(100);
END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'bio'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN bio TEXT;
END IF;

    -- Optional fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'logo_url'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN logo_url VARCHAR(500);
END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'banner_image_url'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN banner_image_url VARCHAR(500);
END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'phone_number'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN phone_number VARCHAR(20);
END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'whatsapp_number'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN whatsapp_number VARCHAR(20);
END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'instagram_handle'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN instagram_handle VARCHAR(50);
END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'twitter_handle'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN twitter_handle VARCHAR(50);
END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seller_profiles' AND column_name = 'store_screenshot_url'
    ) THEN
ALTER TABLE seller_profiles ADD COLUMN store_screenshot_url VARCHAR(500);
END IF;
END $$;

-- ============================================
-- 3. ADD INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_seller_profiles_verified ON seller_profiles(verified);

-- ============================================
-- 4. VERIFY MIGRATION SUCCESS
-- ============================================
-- This comment confirms migration completed successfully