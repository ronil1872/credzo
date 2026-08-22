-- ==============================================================================
-- Credzo Finance — Settings (Loan Interest Rates) & Insurance CRM Notes/Follow-ups
-- Migration Name: 20260823000000_settings_and_insurance_crm_extensions.sql
-- ==============================================================================

-- ==============================================================================
-- 1. Table: loan_interest_rates
-- Database-backed storage for illustrative interest rates and loan parameters.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.loan_interest_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  loan_type TEXT NOT NULL,
  label TEXT NOT NULL,
  rate NUMERIC(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  min_amount NUMERIC(14,2) NOT NULL DEFAULT 25000 CHECK (min_amount > 0),
  max_amount NUMERIC(14,2) NOT NULL DEFAULT 5000000 CHECK (max_amount >= min_amount),
  default_amount NUMERIC(14,2) NOT NULL DEFAULT 500000,
  min_tenure_months INTEGER NOT NULL DEFAULT 6 CHECK (min_tenure_months > 0),
  max_tenure_months INTEGER NOT NULL DEFAULT 60 CHECK (max_tenure_months >= min_tenure_months),
  default_tenure_months INTEGER NOT NULL DEFAULT 36,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_loan_interest_rates_org_type UNIQUE (organization_id, loan_type)
);

COMMENT ON TABLE public.loan_interest_rates IS 'Organization-scoped illustrative loan rates and bounds for the EMI calculator.';

CREATE INDEX IF NOT EXISTS idx_loan_interest_rates_org ON public.loan_interest_rates(organization_id);
CREATE INDEX IF NOT EXISTS idx_loan_interest_rates_active ON public.loan_interest_rates(is_active);

-- Auto updated_at Trigger
DROP TRIGGER IF EXISTS trg_loan_interest_rates_updated_at ON public.loan_interest_rates;
CREATE TRIGGER trg_loan_interest_rates_updated_at
  BEFORE UPDATE ON public.loan_interest_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Seed Default Baseline Rates for Default Credzo Organization
INSERT INTO public.loan_interest_rates (
  organization_id, loan_type, label, rate, min_amount, max_amount, default_amount,
  min_tenure_months, max_tenure_months, default_tenure_months
) VALUES
  ('87dbe69e-3688-4487-b64b-9ed1f502e9bf', 'personal', 'Personal Loan', 12.00, 25000, 5000000, 500000, 6, 60, 36),
  ('87dbe69e-3688-4487-b64b-9ed1f502e9bf', 'business', 'Business Loan', 14.00, 100000, 10000000, 1000000, 12, 84, 36),
  ('87dbe69e-3688-4487-b64b-9ed1f502e9bf', 'home', 'Home Loan', 9.00, 500000, 100000000, 3500000, 12, 360, 240),
  ('87dbe69e-3688-4487-b64b-9ed1f502e9bf', 'lap', 'Loan Against Property', 10.00, 500000, 50000000, 2500000, 12, 180, 120),
  ('87dbe69e-3688-4487-b64b-9ed1f502e9bf', 'gold', 'Gold Loan', 12.00, 10000, 2500000, 200000, 3, 36, 12),
  ('87dbe69e-3688-4487-b64b-9ed1f502e9bf', 'other', 'Other Loans', 12.00, 25000, 5000000, 500000, 6, 60, 36)
ON CONFLICT (organization_id, loan_type) DO NOTHING;

-- RLS: loan_interest_rates
ALTER TABLE public.loan_interest_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active loan interest rates" ON public.loan_interest_rates;
DROP POLICY IF EXISTS "Public can view active loan interest rates" ON public.loan_interest_rates;
CREATE POLICY "Public can view active loan interest rates"
  ON public.loan_interest_rates
  FOR SELECT
  TO anon
  USING (
    is_active = true AND
    organization_id = public.get_default_organization_id()
  );

DROP POLICY IF EXISTS "Authenticated users can view loan interest rates of their org" ON public.loan_interest_rates;
CREATE POLICY "Authenticated users can view loan interest rates of their org"
  ON public.loan_interest_rates
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_auth_organization_id()
  );

DROP POLICY IF EXISTS "Admins and Owners can update interest rates" ON public.loan_interest_rates;
CREATE POLICY "Admins and Owners can update interest rates"
  ON public.loan_interest_rates
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_auth_organization_id() AND
    public.get_auth_role() IN ('OWNER', 'ADMIN')
  )
  WITH CHECK (
    organization_id = public.get_auth_organization_id() AND
    public.get_auth_role() IN ('OWNER', 'ADMIN')
  );

DROP POLICY IF EXISTS "Admins and Owners can insert interest rates" ON public.loan_interest_rates;
CREATE POLICY "Admins and Owners can insert interest rates"
  ON public.loan_interest_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_auth_organization_id() AND
    public.get_auth_role() IN ('OWNER', 'ADMIN')
  );

DROP POLICY IF EXISTS "Admins and Owners can delete interest rates" ON public.loan_interest_rates;
CREATE POLICY "Admins and Owners can delete interest rates"
  ON public.loan_interest_rates
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_auth_organization_id() AND
    public.get_auth_role() IN ('OWNER', 'ADMIN')
  );


-- ==============================================================================
-- 2. Table: insurance_lead_notes
-- Internal staff notes for insurance leads.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.insurance_lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_lead_id UUID NOT NULL REFERENCES public.insurance_leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.insurance_lead_notes IS 'Internal chronological notes attached to insurance leads.';

CREATE INDEX IF NOT EXISTS idx_insurance_lead_notes_lead ON public.insurance_lead_notes(insurance_lead_id);
CREATE INDEX IF NOT EXISTS idx_insurance_lead_notes_org ON public.insurance_lead_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_insurance_lead_notes_created_at ON public.insurance_lead_notes(created_at DESC);

-- RLS: insurance_lead_notes
ALTER TABLE public.insurance_lead_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view insurance lead notes of their org" ON public.insurance_lead_notes;
CREATE POLICY "Authenticated users can view insurance lead notes of their org"
  ON public.insurance_lead_notes
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_auth_organization_id());

DROP POLICY IF EXISTS "Authenticated users can insert insurance lead notes for their org" ON public.insurance_lead_notes;
CREATE POLICY "Authenticated users can insert insurance lead notes for their org"
  ON public.insurance_lead_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_auth_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.insurance_leads
      WHERE insurance_leads.id = insurance_lead_notes.insurance_lead_id
        AND insurance_leads.organization_id = public.get_auth_organization_id()
    )
  );

DROP POLICY IF EXISTS "Admins and authors can delete insurance lead notes" ON public.insurance_lead_notes;
CREATE POLICY "Admins and authors can delete insurance lead notes"
  ON public.insurance_lead_notes
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_auth_organization_id() AND
    (author_id = auth.uid() OR public.get_auth_role() IN ('OWNER', 'ADMIN'))
  );


-- ==============================================================================
-- 3. Table: insurance_follow_ups
-- Scheduled callbacks and tasks for insurance leads.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.insurance_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_lead_id UUID NOT NULL REFERENCES public.insurance_leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.insurance_follow_ups IS 'Scheduled follow-up callbacks and tasks for insurance leads.';

CREATE INDEX IF NOT EXISTS idx_insurance_follow_ups_lead ON public.insurance_follow_ups(insurance_lead_id);
CREATE INDEX IF NOT EXISTS idx_insurance_follow_ups_org ON public.insurance_follow_ups(organization_id);
CREATE INDEX IF NOT EXISTS idx_insurance_follow_ups_status ON public.insurance_follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_insurance_follow_ups_scheduled_at ON public.insurance_follow_ups(scheduled_at ASC);

-- Auto updated_at Trigger
DROP TRIGGER IF EXISTS trg_insurance_follow_ups_updated_at ON public.insurance_follow_ups;
CREATE TRIGGER trg_insurance_follow_ups_updated_at
  BEFORE UPDATE ON public.insurance_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS: insurance_follow_ups
ALTER TABLE public.insurance_follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view insurance follow-ups of their org" ON public.insurance_follow_ups;
CREATE POLICY "Authenticated users can view insurance follow-ups of their org"
  ON public.insurance_follow_ups
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_auth_organization_id());

DROP POLICY IF EXISTS "Authenticated users can insert insurance follow-ups for their org" ON public.insurance_follow_ups;
CREATE POLICY "Authenticated users can insert insurance follow-ups for their org"
  ON public.insurance_follow_ups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_auth_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.insurance_leads
      WHERE insurance_leads.id = insurance_follow_ups.insurance_lead_id
        AND insurance_leads.organization_id = public.get_auth_organization_id()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can update insurance follow-ups of their org" ON public.insurance_follow_ups;
CREATE POLICY "Authenticated users can update insurance follow-ups of their org"
  ON public.insurance_follow_ups
  FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_auth_organization_id())
  WITH CHECK (
    organization_id = public.get_auth_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.insurance_leads
      WHERE insurance_leads.id = insurance_follow_ups.insurance_lead_id
        AND insurance_leads.organization_id = public.get_auth_organization_id()
    )
  );

DROP POLICY IF EXISTS "Admins and owners can delete insurance follow-ups" ON public.insurance_follow_ups;
CREATE POLICY "Admins and owners can delete insurance follow-ups"
  ON public.insurance_follow_ups
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_auth_organization_id() AND
    public.get_auth_role() IN ('OWNER', 'ADMIN')
  );
