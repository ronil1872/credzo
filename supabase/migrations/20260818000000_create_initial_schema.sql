-- ==============================================================================
-- Credzo Finance / LoanCheck — Initial Database Schema & RLS Security Migration
-- Migration Name: 20260818000000_create_initial_schema.sql
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Trigger Function: Automatically Update updated_at Timestamps
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. Table: organizations
-- Represents the DSA / Financial Consultancy organization.
-- Designed for clean multi-tenant isolation.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.organizations IS 'DSA or consultancy business organization tenant boundary.';

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. Table: profiles
-- Connects authenticated Supabase Auth users (auth.users) to organizations & roles.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STAFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_profile_role CHECK (role IN ('OWNER', 'ADMIN', 'STAFF'))
);

COMMENT ON TABLE public.profiles IS 'Internal user profile mapping Supabase Auth users to organizations and roles.';

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. Helper Functions for Non-Recursive Row Level Security
-- Uses SECURITY DEFINER with fixed search_path to prevent recursive RLS queries.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_auth_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ==============================================================================
-- 6. Table: leads
-- Primary customer enquiry and sales journey records.
-- Includes snapshot of calculation parameters, UTM tracking, and explicit consent.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Customer Details
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  city TEXT,

  -- Loan Requirements
  loan_type TEXT NOT NULL,
  requested_amount NUMERIC(14, 2) NOT NULL,
  approved_amount NUMERIC(14, 2) DEFAULT 0.00,
  disbursed_amount NUMERIC(14, 2) DEFAULT 0.00,
  monthly_income NUMERIC(14, 2),
  existing_emi NUMERIC(14, 2),
  employment_type TEXT,

  -- Preferred Callback Schedule
  preferred_callback_date DATE,
  preferred_callback_time TEXT,

  -- Internal Sales Priority Scoring (Deterministic; not lender underwriting)
  lead_score TEXT DEFAULT 'WARM',
  lead_score_reason TEXT,

  -- Internal Sales Status
  status TEXT NOT NULL DEFAULT 'NEW',

  -- Marketing Attribution & UTM
  lead_source TEXT NOT NULL DEFAULT 'website',
  campaign TEXT,
  ad TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Explicit Customer Consent (Mandatory for compliance)
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMPTZ,

  -- Calculator Snapshot (Values displayed to user at time of enquiry)
  calculated_emi NUMERIC(14, 2),
  estimated_interest NUMERIC(14, 2),
  estimated_total_repayment NUMERIC(14, 2),
  illustrative_interest_rate NUMERIC(5, 2),
  loan_tenure_months INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_lead_loan_type CHECK (loan_type IN ('personal', 'business', 'home', 'lap', 'gold', 'other')),
  CONSTRAINT chk_lead_status CHECK (status IN ('NEW', 'CONTACTED', 'INTERESTED', 'DOCUMENTS', 'APPLICATION', 'APPROVED', 'DISBURSED', 'LOST')),
  CONSTRAINT chk_lead_score CHECK (lead_score IN ('HOT', 'WARM', 'COLD')),
  CONSTRAINT chk_lead_employment_type CHECK (employment_type IS NULL OR employment_type IN ('salaried', 'self_employed', 'business')),
  CONSTRAINT chk_lead_requested_amount CHECK (requested_amount > 0),
  CONSTRAINT chk_lead_approved_amount CHECK (approved_amount >= 0),
  CONSTRAINT chk_lead_disbursed_amount CHECK (disbursed_amount >= 0),
  CONSTRAINT chk_lead_monthly_income CHECK (monthly_income IS NULL OR monthly_income >= 0),
  CONSTRAINT chk_lead_existing_emi CHECK (existing_emi IS NULL OR existing_emi >= 0),
  CONSTRAINT chk_lead_tenure CHECK (loan_tenure_months IS NULL OR loan_tenure_months > 0)
);

COMMENT ON TABLE public.leads IS 'Core loan enquiries, calculation snapshot, UTM tracking, and sales pipeline state.';

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. Table: lead_notes
-- Chronological, appendable sales notes recorded by CRM staff.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.lead_notes IS 'Chronological sales notes and activity log for customer leads.';

-- ==============================================================================
-- 8. Table: follow_ups
-- Scheduled callbacks and sales follow-up tasks.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_follow_up_status CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED'))
);

COMMENT ON TABLE public.follow_ups IS 'Scheduled customer follow-up tasks and callback management.';

CREATE TRIGGER trg_follow_ups_updated_at
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 9. Table: campaigns
-- Marketing campaign metadata to correlate real lead conversions.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source TEXT,
  medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.campaigns IS 'Marketing campaign metadata for conversion and acquisition tracking.';

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 10. Table: lead_events
-- Immutable audit log of lead lifecycle changes.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.lead_events IS 'Immutable audit log tracking all status changes and critical lead events.';

-- ==============================================================================
-- 11. Table: calculator_sessions
-- Optional anonymous calculator interaction analytics (Zero sensitive PII).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.calculator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  loan_type TEXT,
  loan_amount NUMERIC(14, 2),
  interest_rate NUMERIC(5, 2),
  tenure_months INTEGER,
  calculated_emi NUMERIC(14, 2),
  calculated_interest NUMERIC(14, 2),
  calculated_repayment NUMERIC(14, 2),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.calculator_sessions IS 'Anonymous calculator usage events for drop-off and marketing analytics.';

-- ==============================================================================
-- 12. Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);

CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_mobile ON public.leads(mobile);
CREATE INDEX IF NOT EXISTS idx_leads_loan_type ON public.leads(loan_type);
CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign ON public.leads(utm_campaign);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_organization_id ON public.lead_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON public.lead_notes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON public.follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_organization_id ON public.follow_ups(organization_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_at ON public.follow_ups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON public.follow_ups(status);

CREATE INDEX IF NOT EXISTS idx_campaigns_organization_id ON public.campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_utm_campaign ON public.campaigns(utm_campaign);

CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON public.lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_organization_id ON public.lead_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON public.lead_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calc_sessions_created_at ON public.calculator_sessions(created_at DESC);

-- ==============================================================================
-- 13. Enable Row Level Security (RLS) on ALL Private Tables
-- ==============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_sessions ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 14. Row Level Security Policies
-- Strictly enforces organization-level data isolation.
-- Anonymous users have ZERO read permissions on private tables.
-- ==============================================================================

-- --- ORGANIZATIONS POLICIES ---
CREATE POLICY "Users can view their own organization"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (id = public.get_auth_organization_id());

-- --- PROFILES POLICIES ---
CREATE POLICY "Users can view profiles within their organization"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_auth_organization_id());

CREATE POLICY "Users can update their own profile or admins can update org profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR 
    (organization_id = public.get_auth_organization_id() AND public.get_auth_role() IN ('OWNER', 'ADMIN'))
  )
  WITH CHECK (
    id = auth.uid() OR 
    (organization_id = public.get_auth_organization_id() AND public.get_auth_role() IN ('OWNER', 'ADMIN'))
  );

-- --- LEADS POLICIES ---
CREATE POLICY "Authenticated users can view leads of their organization"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_auth_organization_id());

CREATE POLICY "Authenticated users can insert leads for their organization"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_auth_organization_id());

CREATE POLICY "Authenticated users can update leads of their organization"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_auth_organization_id())
  WITH CHECK (organization_id = public.get_auth_organization_id());

CREATE POLICY "Admins and owners can delete leads of their organization"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_auth_organization_id() AND 
    public.get_auth_role() IN ('OWNER', 'ADMIN')
  );

-- --- LEAD NOTES POLICIES ---
CREATE POLICY "Authenticated users can view notes of their organization"
  ON public.lead_notes
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_auth_organization_id());

CREATE POLICY "Authenticated users can insert notes for their organization"
  ON public.lead_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_auth_organization_id());

-- --- FOLLOW UPS POLICIES ---
CREATE POLICY "Authenticated users can view follow-ups of their organization"
  ON public.follow_ups
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_auth_organization_id());

CREATE POLICY "Authenticated users can insert follow-ups for their organization"
  ON public.follow_ups
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_auth_organization_id());

CREATE POLICY "Authenticated users can update follow-ups of their organization"
  ON public.follow_ups
  FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_auth_organization_id())
  WITH CHECK (organization_id = public.get_auth_organization_id());

CREATE POLICY "Admins and owners can delete follow-ups of their organization"
  ON public.follow_ups
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_auth_organization_id() AND 
    public.get_auth_role() IN ('OWNER', 'ADMIN')
  );

-- --- CAMPAIGNS POLICIES ---
CREATE POLICY "Authenticated users can view campaigns of their organization"
  ON public.campaigns
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_auth_organization_id());

CREATE POLICY "Authenticated users can manage campaigns for their organization"
  ON public.campaigns
  FOR ALL
  TO authenticated
  USING (organization_id = public.get_auth_organization_id())
  WITH CHECK (organization_id = public.get_auth_organization_id());

-- --- LEAD EVENTS POLICIES (Immutable Audit Log) ---
CREATE POLICY "Authenticated users can view events of their organization"
  ON public.lead_events
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_auth_organization_id());

CREATE POLICY "Authenticated users can insert events for their organization"
  ON public.lead_events
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_auth_organization_id());

-- --- CALCULATOR SESSIONS POLICIES ---
-- Anonymous visitors may record anonymous session usage
CREATE POLICY "Anyone can insert anonymous calculator sessions"
  ON public.calculator_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only authenticated users can read analytics
CREATE POLICY "Authenticated users can view calculator sessions"
  ON public.calculator_sessions
  FOR SELECT
  TO authenticated
  USING (true);
