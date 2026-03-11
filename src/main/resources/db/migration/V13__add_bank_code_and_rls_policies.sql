-- ============================================================
-- V13: Add bank_code to seller_profiles + Enable RLS on all
--      public tables exposed via PostgREST (Supabase).
--
-- NOTE: flyway_schema_history is intentionally excluded —
--       enabling RLS on it inside a Flyway migration causes
--       a lock/timeout because Flyway holds an advisory lock
--       on that table during migration execution.
--
-- CONTEXT:
--   TradeLynk uses Spring Boot + JPA for all data access.
--   PostgREST / Supabase direct REST access is NOT used by the app.
--   Enabling RLS with DENY-ALL policies locks down direct
--   Supabase API access. Spring Boot connects as the DB
--   owner/superuser which bypasses RLS automatically.
-- ============================================================

-- Increase statement timeout for this session to handle slow Supabase pooler
SET statement_timeout = '60s';

-- ──────────────────────────────────────────────────────────
-- 1. Add bank_code column to seller_profiles
-- ──────────────────────────────────────────────────────────
ALTER TABLE seller_profiles
    ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20);

-- Back-fill common banks from name
UPDATE seller_profiles SET bank_code = '044' WHERE bank_name ILIKE '%access%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '057' WHERE bank_name ILIKE '%zenith%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '058' WHERE (bank_name ILIKE '%guaranty%' OR bank_name ILIKE '%gtbank%' OR bank_name ILIKE '%gt bank%') AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '011' WHERE bank_name ILIKE '%first bank%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '033' WHERE (bank_name ILIKE '%united bank%' OR bank_name ILIKE 'uba') AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '035' WHERE bank_name ILIKE '%wema%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '232' WHERE bank_name ILIKE '%sterling%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '214' WHERE (bank_name ILIKE '%fcmb%' OR bank_name ILIKE '%first city%') AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '032' WHERE bank_name ILIKE '%union bank%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '221' WHERE bank_name ILIKE '%stanbic%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '050' WHERE bank_name ILIKE '%ecobank%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '070' WHERE bank_name ILIKE '%fidelity%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '076' WHERE bank_name ILIKE '%polaris%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '082' WHERE bank_name ILIKE '%keystone%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '301' WHERE bank_name ILIKE '%jaiz%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '101' WHERE bank_name ILIKE '%providus%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '090267' WHERE bank_name ILIKE '%kuda%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '100004' WHERE bank_name ILIKE '%opay%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '100033' WHERE bank_name ILIKE '%palmpay%' AND bank_code IS NULL;
UPDATE seller_profiles SET bank_code = '50515' WHERE bank_name ILIKE '%moniepoint%' AND bank_code IS NULL;

-- ──────────────────────────────────────────────────────────
-- 2. Enable RLS on each public table individually.
--    Using plain SQL — no PL/pgSQL block — to avoid
--    statement timeout on Supabase connection pooler.
--    flyway_schema_history is excluded on purpose.
-- ──────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.users;
CREATE POLICY deny_all_direct_access ON public.users AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.seller_profiles;
CREATE POLICY deny_all_direct_access ON public.seller_profiles AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.items;
CREATE POLICY deny_all_direct_access ON public.items AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.orders;
CREATE POLICY deny_all_direct_access ON public.orders AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.payments;
CREATE POLICY deny_all_direct_access ON public.payments AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.guest_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_payments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.guest_payments;
CREATE POLICY deny_all_direct_access ON public.guest_payments AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.product_variants;
CREATE POLICY deny_all_direct_access ON public.product_variants AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.product_images;
CREATE POLICY deny_all_direct_access ON public.product_images AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.product_tags;
CREATE POLICY deny_all_direct_access ON public.product_tags AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_tags FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.item_tags;
CREATE POLICY deny_all_direct_access ON public.item_tags AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.collections;
CREATE POLICY deny_all_direct_access ON public.collections AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.collection_items;
CREATE POLICY deny_all_direct_access ON public.collection_items AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.likes;
CREATE POLICY deny_all_direct_access ON public.likes AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.feedbacks;
CREATE POLICY deny_all_direct_access ON public.feedbacks AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.reports;
CREATE POLICY deny_all_direct_access ON public.reports AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.disputes;
CREATE POLICY deny_all_direct_access ON public.disputes AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.transfers;
CREATE POLICY deny_all_direct_access ON public.transfers AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.device_tokens;
CREATE POLICY deny_all_direct_access ON public.device_tokens AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.password_reset_tokens;
CREATE POLICY deny_all_direct_access ON public.password_reset_tokens AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.verification_tokens;
CREATE POLICY deny_all_direct_access ON public.verification_tokens AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_configs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.whatsapp_configs;
CREATE POLICY deny_all_direct_access ON public.whatsapp_configs AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.whatsapp_conversations;
CREATE POLICY deny_all_direct_access ON public.whatsapp_conversations AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.shipping_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_profiles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.shipping_profiles;
CREATE POLICY deny_all_direct_access ON public.shipping_profiles AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_options FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all_direct_access ON public.variant_options;
CREATE POLICY deny_all_direct_access ON public.variant_options AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- Reset timeout to default
SET statement_timeout = '0';
