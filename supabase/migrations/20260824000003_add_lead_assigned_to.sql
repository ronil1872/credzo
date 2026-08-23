-- ==============================================================================
-- Migration: 20260824000003_add_lead_assigned_to.sql
-- Description: Add direct assigned_to foreign key columns on leads & insurance_leads
--              with server-side organization isolation validation triggers.
-- ==============================================================================

-- 1. Add assigned_to column to public.leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to
  ON public.leads(organization_id, assigned_to);

COMMENT ON COLUMN public.leads.assigned_to IS 'Primary staff owner assigned to this loan lead within the same organization.';

-- 2. Add assigned_to column to public.insurance_leads
ALTER TABLE public.insurance_leads
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_insurance_leads_assigned_to
  ON public.insurance_leads(organization_id, assigned_to);

COMMENT ON COLUMN public.insurance_leads.assigned_to IS 'Primary staff owner assigned to this insurance lead within the same organization.';

-- 3. Validation Trigger Function: Ensure assigned_to strictly belongs to the same organization
CREATE OR REPLACE FUNCTION public.validate_lead_assignment_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = NEW.assigned_to 
        AND organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'Security Violation: Assigned profile % does not belong to organization %', 
        NEW.assigned_to, NEW.organization_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Idempotent Triggers on public.leads and public.insurance_leads
DROP TRIGGER IF EXISTS trg_validate_leads_assigned_to ON public.leads;
CREATE TRIGGER trg_validate_leads_assigned_to
  BEFORE INSERT OR UPDATE OF assigned_to, organization_id ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_assignment_org();

DROP TRIGGER IF EXISTS trg_validate_insurance_leads_assigned_to ON public.insurance_leads;
CREATE TRIGGER trg_validate_insurance_leads_assigned_to
  BEFORE INSERT OR UPDATE OF assigned_to, organization_id ON public.insurance_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_assignment_org();
