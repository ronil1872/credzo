-- ==============================================================================
-- Credzo Finance / LoanCheck — Safe Auto-provision Profile on User Creation
-- Migration Name: 20260819000000_handle_new_staff_user.sql
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_default_org UUID;
BEGIN
  -- 1. Resolve primary organization ID
  SELECT id INTO v_default_org FROM public.organizations ORDER BY created_at ASC LIMIT 1;
  IF v_default_org IS NULL THEN
    v_default_org := '87dbe69e-3688-4487-b64b-9ed1f502e9bf'::uuid;
  END IF;

  -- 2. Strict Least-Privilege Role Assignment:
  -- Client/user metadata is NEVER trusted for role assignment.
  -- Every new auth user unconditionally receives 'STAFF'.
  INSERT INTO public.profiles (id, organization_id, full_name, role)
  VALUES (
    NEW.id,
    v_default_org,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1)),
    'STAFF'
  )
  ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id;
    -- Role is intentionally PRESERVED on conflict to prevent downgrading existing ADMIN/OWNER accounts.

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
