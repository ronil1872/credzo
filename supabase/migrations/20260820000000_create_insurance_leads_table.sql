-- ==============================================================================
-- Credzo Finance — Create Separate insurance_leads Table & Security Setup
-- Migration Name: 20260820000000_create_insurance_leads_table.sql
-- Description: Creates isolated insurance_leads table with RLS, indexes, and triggers.
-- Multi-Tenant Security: Explicit deterministic assignment to Credzo Finance organization.
-- ==============================================================================

-- 1. Helper Function: Get Explicit Credzo Finance Default Organization ID
CREATE OR REPLACE FUNCTION public.get_default_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT '87dbe69e-3688-4487-b64b-9ed1f502e9bf'::UUID;
$$;

-- 2. Table: insurance_leads
CREATE TABLE IF NOT EXISTS public.insurance_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Customer Identification
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  city TEXT,

  -- Insurance Requirements
  insurance_type TEXT NOT NULL,
  
  -- Callback Scheduling
  preferred_callback_date DATE,
  preferred_callback_time TEXT,

  -- Customer Message / Specific Requirement Notes
  message TEXT,

  -- Lead Status & Sales Workflow
  status TEXT NOT NULL DEFAULT 'NEW',

  -- Marketing Attribution
  lead_source TEXT NOT NULL DEFAULT 'website',
  campaign TEXT,
  ad TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Explicit Voluntary Consent
  consent BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for Performance & CRM Querying
CREATE INDEX IF NOT EXISTS idx_insurance_leads_org ON public.insurance_leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_insurance_leads_created_at ON public.insurance_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insurance_leads_status ON public.insurance_leads(status);
CREATE INDEX IF NOT EXISTS idx_insurance_leads_mobile ON public.insurance_leads(mobile);
CREATE INDEX IF NOT EXISTS idx_insurance_leads_type ON public.insurance_leads(insurance_type);

-- 4. Trigger Function: Server-Side Enforcement of Organization ID
-- For anonymous public submissions, ALWAYS forcefully override organization_id to Credzo Finance's explicit org.
CREATE OR REPLACE FUNCTION public.assign_insurance_lead_default_organization()
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

DROP TRIGGER IF EXISTS trg_insurance_leads_default_organization ON public.insurance_leads;
CREATE TRIGGER trg_insurance_leads_default_organization
  BEFORE INSERT ON public.insurance_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_insurance_lead_default_organization();

-- 5. Enable Row Level Security
ALTER TABLE public.insurance_leads ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policy 1: Public & Authenticated Insertion Policy
-- Public users must provide affirmative consent and cannot inject foreign organization IDs.
DROP POLICY IF EXISTS "Public visitors can submit insurance enquiries with consent" ON public.insurance_leads;
CREATE POLICY "Public visitors can submit insurance enquiries with consent"
  ON public.insurance_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    consent = true
    AND full_name IS NOT NULL
    AND length(trim(full_name)) >= 2
    AND mobile IS NOT NULL
    AND length(trim(mobile)) >= 10
    AND insurance_type IS NOT NULL
    AND (
      -- Anonymous visitors: must either omit organization_id or supply the explicit Credzo organization
      (auth.role() = 'anon' AND (organization_id IS NULL OR organization_id = public.get_default_organization_id()))
      OR
      -- Authenticated staff: organization_id must match staff's organization
      (auth.role() = 'authenticated' AND organization_id = public.get_auth_organization_id())
    )
  );

-- 7. RLS Policy 2: Authenticated Staff can view insurance leads of their organization
DROP POLICY IF EXISTS "Authenticated users can view insurance leads of their organization" ON public.insurance_leads;
CREATE POLICY "Authenticated users can view insurance leads of their organization"
  ON public.insurance_leads
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_auth_organization_id());

-- 8. RLS Policy 3: Authenticated Staff can update insurance leads of their organization
DROP POLICY IF EXISTS "Authenticated users can update insurance leads of their organization" ON public.insurance_leads;
CREATE POLICY "Authenticated users can update insurance leads of their organization"
  ON public.insurance_leads
  FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_auth_organization_id())
  WITH CHECK (organization_id = public.get_auth_organization_id());

-- 9. RLS Policy 4: Admins and Owners can delete insurance leads of their organization
DROP POLICY IF EXISTS "Admins and owners can delete insurance leads of their organization" ON public.insurance_leads;
CREATE POLICY "Admins and owners can delete insurance leads of their organization"
  ON public.insurance_leads
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_auth_organization_id() AND 
    public.get_auth_role() IN ('OWNER', 'ADMIN')
  );
