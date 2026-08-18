-- ==============================================================================
-- Credzo Finance / LoanCheck — Public Lead Submission Policy & Default Org Trigger
-- Migration Name: 20260818000001_public_lead_submission.sql
-- ==============================================================================

-- 1. Trigger Function: Automatically Assign Default Organization If Null on Public Lead Ingestion
CREATE OR REPLACE FUNCTION public.assign_lead_default_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := (SELECT id FROM public.organizations ORDER BY created_at ASC LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_leads_default_organization ON public.leads;
CREATE TRIGGER trg_leads_default_organization
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_lead_default_organization();

-- 2. Public RLS Policy: Allow Anonymous Visitors to Submit Lead Enquiries with Explicit Consent
DROP POLICY IF EXISTS "Public visitors can submit lead enquiries with consent" ON public.leads;
CREATE POLICY "Public visitors can submit lead enquiries with consent"
  ON public.leads
  FOR INSERT
  TO public
  WITH CHECK (
    consent_given = true
    AND name IS NOT NULL
    AND length(trim(name)) >= 2
    AND mobile IS NOT NULL
    AND length(trim(mobile)) >= 10
    AND requested_amount > 0
  );
