-- ==============================================================================
-- Credzo Finance — Fix Service Role Recognition in Profiles Security Guard Trigger
-- Migration: 20260828000000_fix_service_role_security_tampering_trigger.sql
--
-- Problem:
-- When Edge Functions (e.g. admin-update-team-member) update `is_active` using service_role,
-- `auth.uid()` is NULL in PostgreSQL. The trigger `prevent_client_security_tampering`
-- checked `get_auth_role()`, which returned NULL, causing a false "Permission Denied"
-- exception even though the Edge Function already authorized the Admin/Owner caller.
--
-- Solution:
-- Recognize `service_role`, `postgres`, and `supabase_admin` executions as trusted
-- server-side administrative calls while continuing to block direct client REST tampering.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.prevent_client_security_tampering()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_role TEXT;
  v_jwt_role TEXT;
BEGIN
  -- 1. Allow trusted server-side Edge Functions / service_role / internal superusers
  v_jwt_role := COALESCE(
    auth.role(),
    current_setting('request.jwt.claim.role', true),
    ''
  );

  IF v_jwt_role = 'service_role' OR current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- 2. Direct client REST calls: Retrieve authenticated caller's profile role
  v_caller_role := public.get_auth_role();

  -- Prevent non-owners/admins from altering is_active on self or other profiles
  IF OLD.is_active IS DISTINCT FROM NEW.is_active AND (v_caller_role IS NULL OR v_caller_role NOT IN ('OWNER', 'ADMIN')) THEN
    RAISE EXCEPTION 'Permission Denied: Only Organization Owners and Admins can alter account active status.';
  END IF;

  -- Prevent non-owners/admins from arbitrarily clearing must_change_password via REST API
  IF OLD.must_change_password = true AND NEW.must_change_password = false AND (v_caller_role IS NULL OR v_caller_role NOT IN ('OWNER', 'ADMIN')) THEN
    IF auth.uid() = OLD.id THEN
      RAISE EXCEPTION 'Security Restriction: must_change_password cannot be directly modified via REST API. Complete the password setup flow.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_client_security_tampering ON public.profiles;
CREATE TRIGGER trg_prevent_client_security_tampering
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_security_tampering();
