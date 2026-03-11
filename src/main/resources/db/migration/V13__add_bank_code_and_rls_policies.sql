-- ============================================================
-- V13: Add bank_code to seller_profiles + Enable RLS on all
--      public tables exposed via PostgREST (Supabase).
--
-- CONTEXT:
--   TradeLynk uses Spring Boot + JPA for all data access.
--   PostgREST / Supabase direct REST access is NOT used by
--   the application. Enabling RLS with DENY-ALL policies
--   locks down direct API access while Spring Boot (which
--   connects via the DB superuser / service-role key) is
--   unaffected, because RLS is only enforced for
--   non-superuser roles (i.e. the `anon` / `authenticated`
--   PostgREST roles).
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. Add bank_code column to seller_profiles
-- ──────────────────────────────────────────────────────────
ALTER TABLE seller_profiles
    ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20);

-- Back-fill from a simple name→code lookup for existing rows.
-- Only the most common banks are listed here; any unmatched
-- rows stay NULL and will be resolved at runtime via the live
-- Paystack /bank endpoint.
UPDATE seller_profiles SET bank_code = '044' WHERE bank_name ILIKE '%access%';
UPDATE seller_profiles SET bank_code = '057' WHERE bank_name ILIKE '%zenith%';
UPDATE seller_profiles SET bank_code = '058' WHERE bank_name ILIKE '%guaranty%' OR bank_name ILIKE '%gtbank%' OR bank_name ILIKE '%gt bank%';
UPDATE seller_profiles SET bank_code = '011' WHERE bank_name ILIKE '%first bank%';
UPDATE seller_profiles SET bank_code = '033' WHERE bank_name ILIKE '%united bank%' OR bank_name ILIKE 'uba';
UPDATE seller_profiles SET bank_code = '035' WHERE bank_name ILIKE '%wema%';
UPDATE seller_profiles SET bank_code = '232' WHERE bank_name ILIKE '%sterling%';
UPDATE seller_profiles SET bank_code = '214' WHERE bank_name ILIKE '%fcmb%' OR bank_name ILIKE '%first city%';
UPDATE seller_profiles SET bank_code = '032' WHERE bank_name ILIKE '%union bank%';
UPDATE seller_profiles SET bank_code = '221' WHERE bank_name ILIKE '%stanbic%';
UPDATE seller_profiles SET bank_code = '050' WHERE bank_name ILIKE '%ecobank%';
UPDATE seller_profiles SET bank_code = '070' WHERE bank_name ILIKE '%fidelity%';
UPDATE seller_profiles SET bank_code = '076' WHERE bank_name ILIKE '%polaris%';
UPDATE seller_profiles SET bank_code = '082' WHERE bank_name ILIKE '%keystone%';
UPDATE seller_profiles SET bank_code = '301' WHERE bank_name ILIKE '%jaiz%';
UPDATE seller_profiles SET bank_code = '101' WHERE bank_name ILIKE '%providus%';
UPDATE seller_profiles SET bank_code = '090267' WHERE bank_name ILIKE '%kuda%';
UPDATE seller_profiles SET bank_code = '100004' WHERE bank_name ILIKE '%opay%';
UPDATE seller_profiles SET bank_code = '100033' WHERE bank_name ILIKE '%palmpay%';
UPDATE seller_profiles SET bank_code = '50515' WHERE bank_name ILIKE '%moniepoint%';

-- ──────────────────────────────────────────────────────────
-- 2. Enable RLS on every public table flagged by Supabase
--    linter. We use a DENY-ALL approach: no PostgREST role
--    (anon / authenticated) can read or write any row
--    directly. All access goes through the Spring Boot API.
-- ──────────────────────────────────────────────────────────

-- Helper: enable RLS and add a deny-all policy in one shot
-- (PL/pgSQL block so we can iterate).
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'users',
        'seller_profiles',
        'items',
        'orders',
        'payments',
        'guest_payments',
        'product_variants',
        'product_images',
        'product_tags',
        'item_tags',
        'collections',
        'collection_items',
        'likes',
        'feedbacks',
        'reports',
        'disputes',
        'transfers',
        'device_tokens',
        'password_reset_tokens',
        'verification_tokens',
        'whatsapp_configs',
        'whatsapp_conversations',
        'shipping_profiles',
        'variant_options',
        'flyway_schema_history'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', tbl);

        -- Drop any pre-existing deny policy so this script is idempotent
        EXECUTE format(
            'DROP POLICY IF EXISTS deny_all_direct_access ON public.%I', tbl
        );

        -- Deny all direct PostgREST access (anon + authenticated roles)
        -- Spring Boot connects as the DB owner/superuser so it is exempt.
        EXECUTE format(
            'CREATE POLICY deny_all_direct_access ON public.%I
             AS RESTRICTIVE
             FOR ALL
             TO anon, authenticated
             USING (false)
             WITH CHECK (false)',
            tbl
        );
    END LOOP;
END;
$$;

