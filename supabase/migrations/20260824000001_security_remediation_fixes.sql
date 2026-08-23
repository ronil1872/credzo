-- ==============================================================================
-- Credzo Finance — Security Remediation & Integrity Hardening
-- Migration Name: 20260824000001_security_remediation_fixes.sql
-- Description:
--   1. Enforces mandatory default organization assignment on public loan leads (spoofing prevention).
--   2. Enforces strict parent and tenant immutability on follow_ups & insurance_follow_ups.
--   3. Adds session_id length constraint on calculator_sessions.
-- ==============================================================================

-- ==============================================================================
-- 1. Public Loan Lead Organization Spoofing Prevention
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.assign_lead_default_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Defense-in-depth: Never trust client-supplied organization_id for anonymous/unauthenticated submissions
  IF auth.role() = 'anon' OR auth.uid() IS NULL THEN
    NEW.organization_id := public.get_default_organization_id();
  ELSIF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.get_auth_organization_id();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_leads_default_organization ON public.leads;
CREATE TRIGGER trg_leads_default_organization
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_lead_default_organization();

-- Update Public Loan Lead Insert RLS Policy to explicitly enforce organization boundary
DROP POLICY IF EXISTS "Public visitors can submit lead enquiries with consent" ON public.leads;
CREATE POLICY "Public visitors can submit lead enquiries with consent"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    consent_given = true
    AND name IS NOT NULL
    AND length(trim(name)) >= 2
    AND mobile IS NOT NULL
    AND length(trim(mobile)) >= 10
    AND requested_amount > 0
    AND (
      -- Anonymous visitors: must either omit organization_id or supply the explicit Credzo organization
      (auth.role() = 'anon' AND (organization_id IS NULL OR organization_id = public.get_default_organization_id()))
      OR
      -- Authenticated staff: organization_id must match staff's organization
      (auth.role() = 'authenticated' AND organization_id = public.get_auth_organization_id())
    )
  );

-- ==============================================================================
-- 2. Follow-Up Parent & Tenant Immutability Protection
-- ==============================================================================

-- Loan Follow-ups Immutability Trigger
CREATE OR REPLACE FUNCTION public.protect_follow_up_immutability()
RETURNS TRIGGER AS $$
BEGIN
  -- lead_id can NEVER be modified once assigned
  IF NEW.lead_id <> OLD.lead_id THEN
    RAISE EXCEPTION 'lead_id is strictly immutable.';
  END IF;

  -- organization_id can NEVER be modified once assigned
  IF NEW.organization_id <> OLD.organization_id THEN
    RAISE EXCEPTION 'organization_id is strictly immutable.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_follow_up_immutability ON public.follow_ups;
CREATE TRIGGER trg_protect_follow_up_immutability
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_follow_up_immutability();

-- Insurance Follow-ups Immutability Trigger
CREATE OR REPLACE FUNCTION public.protect_insurance_follow_up_immutability()
RETURNS TRIGGER AS $$
BEGIN
  -- insurance_lead_id can NEVER be modified once assigned
  IF NEW.insurance_lead_id <> OLD.insurance_lead_id THEN
    RAISE EXCEPTION 'insurance_lead_id is strictly immutable.';
  END IF;

  -- organization_id can NEVER be modified once assigned
  IF NEW.organization_id <> OLD.organization_id THEN
    RAISE EXCEPTION 'organization_id is strictly immutable.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_insurance_follow_up_immutability ON public.insurance_follow_ups;
CREATE TRIGGER trg_protect_insurance_follow_up_immutability
  BEFORE UPDATE ON public.insurance_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_insurance_follow_up_immutability();

-- ==============================================================================
-- 3. Calculator Session Payload Limit
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_calculator_sessions_session_id_len'
  ) THEN
    ALTER TABLE public.calculator_sessions
      ADD CONSTRAINT chk_calculator_sessions_session_id_len
      CHECK (session_id IS NULL OR length(session_id) <= 64);
  END IF;
END $$;
