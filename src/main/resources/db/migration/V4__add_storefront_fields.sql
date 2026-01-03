-- V4__add_storefront_fields.sql
-- Add username to users table and storefront fields to seller_profiles

-- ============================================
-- 1. ADD USERNAME TO USERS TABLE
-- ============================================
ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- 2. ADD STOREFRONT FIELDS TO SELLER_PROFILES
-- ============================================

-- Required fields (collected during signup)
ALTER TABLE seller_profiles ADD COLUMN store_tagline VARCHAR(100);
ALTER TABLE seller_profiles ADD COLUMN bio TEXT;

-- Optional fields (shown in form but not required)
ALTER TABLE seller_profiles ADD COLUMN logo_url VARCHAR(500);
ALTER TABLE seller_profiles ADD COLUMN banner_image_url VARCHAR(500);
ALTER TABLE seller_profiles ADD COLUMN phone_number VARCHAR(20);
ALTER TABLE seller_profiles ADD COLUMN whatsapp_number VARCHAR(20);
ALTER TABLE seller_profiles ADD COLUMN instagram_handle VARCHAR(50);
ALTER TABLE seller_profiles ADD COLUMN twitter_handle VARCHAR(50);
ALTER TABLE seller_profiles ADD COLUMN store_screenshot_url VARCHAR(500); -- For verification

-- ============================================
-- 3. ADD INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_seller_profiles_verified ON seller_profiles(verified);