-- ==============================================================================
-- Migration: 20260824000005_fix_handle_new_auth_user_trigger.sql
-- Description: Fixes auth.users -> public.profiles provisioning trigger to:
--   1. Guarantee public.organizations baseline record exists (prevents FK violation).
--   2. Honor organization_id, role, mobile, full_name passed in raw_user_meta_data.
--   3. Add robust exception isolation so trigger errors never crash GoTrue (AuthApiError 500).
-- ==============================================================================

-- 1. Ensure the default Credzo Finance organization exists in public.organizations
INSERT INTO public.organizations (id, name, created_at, updated_at)
VALUES (
  '87dbe69e-3688-4487-b64b-9ed1f502e9bf',
  'Credzo Finance',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = COALESCE(public.organizations.name, EXCLUDED.name);

-- 2. Resilient Profile Provisioning Function for auth.users Trigger
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_meta_org_text TEXT;
  v_meta_org UUID;
  v_target_org UUID;
  v_role TEXT;
  v_full_name TEXT;
  v_mobile TEXT;
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
      -- Auto-insert default organization if table is empty
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
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      mobile = COALESCE(EXCLUDED.mobile, public.profiles.mobile),
      is_active = true,
      updated_at = NOW();

  EXCEPTION WHEN OTHERS THEN
    -- Log warning internally but do NOT crash the GoTrue auth user creation
    RAISE WARNING '[handle_new_auth_user] Non-fatal exception provisioning profile for user %: % (SQLSTATE: %)',
      NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Ensure trigger is cleanly bound to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
