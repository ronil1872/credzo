-- ==============================================================================
-- Credzo Finance — Hardened Staff Login Rate Limiting (Edge Function Gateway)
-- Migration: 20260824000000_staff_login_rate_limiting.sql
-- Description: Server-enforced rate-limiting table and internal procedures
--              accessible EXCLUSIVELY by service_role (Edge Function).
-- Security Rules:
--   1. RLS Enabled with ZERO public / anon / authenticated access policies.
--   2. Rate limit records are keyed by SHA-256 hash of normalized email.
--   3. No public/anon RPCs exist; unauthenticated lockout DoS is prevented.
--   4. SECURITY DEFINER functions use empty search_path (SET search_path = '')
--      with fully qualified schema references to prevent search-path hijacking.
-- ==============================================================================

-- 1. Ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Drop any legacy/insecure rate limiting functions if previously created
DROP FUNCTION IF EXISTS public.check_staff_login_lockout(TEXT);
DROP FUNCTION IF EXISTS public.record_staff_login_failure(TEXT);
DROP FUNCTION IF EXISTS public.reset_staff_login_lockout();

-- 3. Create staff_login_attempts table
CREATE TABLE IF NOT EXISTS public.staff_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash TEXT NOT NULL UNIQUE,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_failed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Performance index on email_hash
CREATE INDEX IF NOT EXISTS idx_staff_login_attempts_email_hash 
  ON public.staff_login_attempts(email_hash);

-- 5. Enable Row Level Security (RLS)
-- Table remains completely private with 0 client-accessible policies.
ALTER TABLE public.staff_login_attempts ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke all public/anon/authenticated access to the table
REVOKE ALL ON TABLE public.staff_login_attempts FROM PUBLIC;
REVOKE ALL ON TABLE public.staff_login_attempts FROM anon;
REVOKE ALL ON TABLE public.staff_login_attempts FROM authenticated;
GRANT ALL ON TABLE public.staff_login_attempts TO service_role;

-- 6. Atomic internal function for recording failure with row-level lock (SERVICE ROLE ONLY)
-- Hardened with empty search_path and explicit table alias
CREATE OR REPLACE FUNCTION public.internal_record_staff_login_failure(p_email_hash TEXT)
RETURNS pg_catalog.jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_locked pg_catalog.bool;
  v_locked_until pg_catalog.timestamptz;
  v_failed_attempts pg_catalog.int4;
  v_remaining_seconds pg_catalog.int4;
BEGIN
  IF p_email_hash IS NULL OR pg_catalog.trim(p_email_hash) = '' THEN
    RETURN pg_catalog.jsonb_build_object(
      'is_locked', false,
      'failed_attempts', 0,
      'remaining_seconds', 0
    );
  END IF;

  -- Atomic UPSERT with explicit table alias 'sla'
  INSERT INTO public.staff_login_attempts AS sla (
    email_hash,
    failed_attempts,
    locked_until,
    last_failed_at,
    updated_at
  )
  VALUES (
    p_email_hash,
    1,
    NULL,
    pg_catalog.now(),
    pg_catalog.now()
  )
  ON CONFLICT (email_hash) DO UPDATE
  SET failed_attempts = CASE
        -- If previous 15-minute lock has expired, reset counter to 1
        WHEN sla.locked_until IS NOT NULL 
             AND sla.locked_until <= pg_catalog.now() THEN 1
        ELSE sla.failed_attempts + 1
      END,
      locked_until = CASE
        -- If previous lock expired, clear lock
        WHEN sla.locked_until IS NOT NULL 
             AND sla.locked_until <= pg_catalog.now() THEN NULL
        -- If incrementing reaches or exceeds 5, apply 15-minute lock
        WHEN (sla.failed_attempts + 1) >= 5 
             THEN pg_catalog.now() + pg_catalog.interval '15 minutes'
        ELSE sla.locked_until
      END,
      last_failed_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
  RETURNING 
    (sla.locked_until IS NOT NULL AND sla.locked_until > pg_catalog.now()),
    sla.locked_until,
    sla.failed_attempts,
    pg_catalog.coalesce(
      pg_catalog.greatest(0, EXTRACT(epoch FROM (sla.locked_until - pg_catalog.now()))::pg_catalog.int4),
      0
    )
  INTO v_is_locked, v_locked_until, v_failed_attempts, v_remaining_seconds;

  RETURN pg_catalog.jsonb_build_object(
    'is_locked', v_is_locked,
    'locked_until', v_locked_until,
    'failed_attempts', v_failed_attempts,
    'remaining_seconds', v_remaining_seconds
  );
END;
$$;

-- 7. Restrict internal function strictly to service_role (Edge Function)
REVOKE ALL ON FUNCTION public.internal_record_staff_login_failure(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.internal_record_staff_login_failure(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.internal_record_staff_login_failure(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.internal_record_staff_login_failure(TEXT) TO service_role;
