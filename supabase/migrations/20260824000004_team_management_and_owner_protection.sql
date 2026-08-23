-- ==============================================================================
-- Migration: 20260824000004_team_management_and_owner_protection.sql
-- Description: Add mobile and is_active columns to profiles, with server-side
--              OWNER protection and strict organization boundary enforcement.
-- ==============================================================================

-- 1. Add mobile and is_active columns to public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mobile TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Performance Index for active team members per organization
CREATE INDEX IF NOT EXISTS idx_profiles_org_active
  ON public.profiles(organization_id, is_active);

COMMENT ON COLUMN public.profiles.mobile IS 'Direct contact number for the staff member.';
COMMENT ON COLUMN public.profiles.is_active IS 'Controls whether the user account is active or deactivated.';

-- 3. Trigger Function: Protect OWNER Role and Ensure At Least One Active OWNER
CREATE OR REPLACE FUNCTION public.protect_owner_and_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_role TEXT;
  v_owner_count INTEGER;
BEGIN
  -- Retrieve the calling user's role
  v_caller_role := public.get_auth_role();

  -- Condition A: Prevent ADMIN from modifying, demoting, or deactivating an OWNER
  IF OLD.role = 'OWNER' AND v_caller_role = 'ADMIN' AND auth.uid() <> OLD.id THEN
    RAISE EXCEPTION 'Permission Denied: Administrators cannot modify, demote, or deactivate OWNER accounts.';
  END IF;

  -- Condition B: Prevent ADMIN from promoting any user to OWNER
  IF NEW.role = 'OWNER' AND OLD.role <> 'OWNER' AND v_caller_role = 'ADMIN' THEN
    RAISE EXCEPTION 'Permission Denied: Only existing Organization Owners can promote a user to OWNER.';
  END IF;

  -- Condition C: Ensure the organization always retains at least one active OWNER
  IF OLD.role = 'OWNER' AND (NEW.role <> 'OWNER' OR NEW.is_active = false) THEN
    SELECT COUNT(*) INTO v_owner_count
    FROM public.profiles
    WHERE organization_id = OLD.organization_id
      AND role = 'OWNER'
      AND is_active = true
      AND id <> OLD.id;

    IF v_owner_count = 0 THEN
      RAISE EXCEPTION 'Security Restriction: An organization must retain at least one active OWNER.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Idempotent Trigger Binding on public.profiles
DROP TRIGGER IF EXISTS trg_protect_owner_and_role_escalation ON public.profiles;
CREATE TRIGGER trg_protect_owner_and_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_owner_and_role_escalation();
