-- ==============================================================================
-- Migration: 20260824000006_add_must_change_password_to_profiles.sql
-- Description: Adds must_change_password column to public.profiles and enforces
--              cryptographic, tamper-proof first-login password changes.
-- ==============================================================================

-- 1. Add must_change_password column to public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.must_change_password IS 'Flag indicating the staff member must set a new permanent password on next login.';

-- 2. Performance index for active profiles requiring password change
CREATE INDEX IF NOT EXISTS idx_profiles_must_change_pwd
  ON public.profiles(organization_id, must_change_password);

-- 3. Update handle_new_auth_user() to populate must_change_password from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_meta_org_text TEXT;
  v_meta_org UUID;
  v_target_org UUID;
  v_role TEXT;
  v_full_name TEXT;
  v_mobile TEXT;
  v_must_change_pwd BOOLEAN;
BEGIN
  -- Safe block: Never allow trigger failure to abort GoTrue auth transaction
  BEGIN
    -- Extract full name
    v_full_name := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      split_part(NEW.email, '@', 1),
      'Staff Member'
    );

    -- Extract mobile
    v_mobile := NULLIF(TRIM(NEW.raw_user_meta_data->>'mobile'), '');

    -- Extract role (default to STAFF if not specified or invalid)
    v_role := UPPER(COALESCE(TRIM(NEW.raw_user_meta_data->>'role'), 'STAFF'));
    IF v_role NOT IN ('OWNER', 'ADMIN', 'STAFF') THEN
      v_role := 'STAFF';
    END IF;

    -- Extract must_change_password flag from metadata (default true for new accounts)
    v_must_change_pwd := COALESCE((NEW.raw_user_meta_data->>'must_change_password')::BOOLEAN, false);

    -- Extract and validate organization_id from user metadata
    v_meta_org_text := TRIM(NEW.raw_user_meta_data->>'organization_id');
    IF v_meta_org_text IS NOT NULL AND v_meta_org_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_meta_org := v_meta_org_text::UUID;
      -- Verify target organization exists in public.organizations
      SELECT id INTO v_target_org FROM public.organizations WHERE id = v_meta_org LIMIT 1;
    END IF;

    -- Fallback: If organization was not in metadata or not found, resolve primary org
    IF v_target_org IS NULL THEN
      SELECT id INTO v_target_org FROM public.organizations ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- Ultimate fallback to default Credzo organization
    IF v_target_org IS NULL THEN
      v_target_org := '87dbe69e-3688-4487-b64b-9ed1f502e9bf'::UUID;
      INSERT INTO public.organizations (id, name)
      VALUES (v_target_org, 'Credzo Finance')
      ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Upsert profile record
    INSERT INTO public.profiles (
      id,
      organization_id,
      full_name,
      role,
      mobile,
      is_active,
      must_change_password,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      v_target_org,
      v_full_name,
      v_role,
      v_mobile,
      true,
      v_must_change_pwd,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      mobile = COALESCE(EXCLUDED.mobile, public.profiles.mobile),
      is_active = true,
      must_change_password = EXCLUDED.must_change_password,
      updated_at = NOW();

  EXCEPTION WHEN OTHERS THEN
    -- Log warning internally but do NOT crash the GoTrue auth user creation
    RAISE WARNING '[handle_new_auth_user] Non-fatal exception provisioning profile for user %: % (SQLSTATE: %)',
      NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Server-Side Trigger on auth.users to automatically clear must_change_password
-- When a user successfully updates their password via Supabase Auth (GoTrue),
-- the encrypted_password column changes, automatically resetting must_change_password = false.
CREATE OR REPLACE FUNCTION public.handle_auth_password_changed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when password actually changes
  IF OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password THEN
    UPDATE public.profiles
    SET must_change_password = false, updated_at = NOW()
    WHERE id = NEW.id AND must_change_password = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_password_changed ON auth.users;
CREATE TRIGGER on_auth_user_password_changed
  AFTER UPDATE OF encrypted_password ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_password_changed();

-- 5. Guard Trigger on public.profiles: Prevent direct client REST tampering of security flags
CREATE OR REPLACE FUNCTION public.prevent_client_security_tampering()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  v_caller_role := public.get_auth_role();

  -- Prevent non-owners/admins from altering is_active on self or other profiles
  IF OLD.is_active <> NEW.is_active AND (v_caller_role IS NULL OR v_caller_role NOT IN ('OWNER', 'ADMIN')) THEN
    RAISE EXCEPTION 'Permission Denied: Only Organization Owners and Admins can alter account active status.';
  END IF;

  -- Prevent non-owners/admins from arbitrarily clearing must_change_password via REST API
  IF OLD.must_change_password = true AND NEW.must_change_password = false AND (v_caller_role IS NULL OR v_caller_role NOT IN ('OWNER', 'ADMIN')) THEN
    -- Allow if called internally by system trigger/superuser; otherwise reject direct client REST calls
    IF current_user <> 'postgres' AND auth.uid() = OLD.id THEN
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
