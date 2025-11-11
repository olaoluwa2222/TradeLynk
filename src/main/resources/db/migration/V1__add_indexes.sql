CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_role
    ON users(role);

CREATE INDEX IF NOT EXISTS idx_users_is_active
    ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_items_seller_id
    ON items(seller_id);

CREATE INDEX IF NOT EXISTS idx_items_status
    ON items(status);

CREATE INDEX IF NOT EXISTS idx_items_seller_status
    ON items(seller_id, status);

CREATE INDEX IF NOT EXISTS idx_items_category
    ON items(category);

CREATE INDEX IF NOT EXISTS idx_items_created_at
    ON items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_items_price
    ON items(price);

CREATE INDEX IF NOT EXISTS idx_items_category_status
    ON items(category, status);

CREATE INDEX IF NOT EXISTS idx_items_like_count
    ON items(like_count DESC);

CREATE INDEX IF NOT EXISTS idx_items_view_count
    ON items(view_count DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_item_user
    ON likes(item_id, user_id);

CREATE INDEX IF NOT EXISTS idx_likes_item_id
    ON likes(item_id);

CREATE INDEX IF NOT EXISTS idx_likes_user_id
    ON likes(user_id);

CREATE INDEX IF NOT EXISTS idx_likes_created_at
    ON likes(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_reference
    ON payments(paystack_reference);

CREATE INDEX IF NOT EXISTS idx_payments_buyer_id
    ON payments(buyer_id);

CREATE INDEX IF NOT EXISTS idx_payments_seller_id
    ON payments(seller_id);

CREATE INDEX IF NOT EXISTS idx_payments_item_id
    ON payments(item_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
    ON payments(status);

CREATE INDEX IF NOT EXISTS idx_payments_seller_status
    ON payments(seller_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_created_at
    ON payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_item_id
    ON reports(item_id);

CREATE INDEX IF NOT EXISTS idx_reports_status
    ON reports(status);

CREATE INDEX IF NOT EXISTS idx_reports_item_status
    ON reports(item_id, status);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id
    ON reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_reports_created_at
    ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_reviewed_by
    ON reports(reviewed_by);

CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_profiles_user_id
    ON seller_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_verified
    ON seller_profiles(verified);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_subaccount
    ON seller_profiles(pay_stack_subaccount_id);