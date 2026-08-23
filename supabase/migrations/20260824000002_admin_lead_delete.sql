-- ==============================================================================
-- Credzo Finance — Secure Lead Deletion RLS Policies (Admin/Owner Only)
-- Migration Name: 20260824000002_admin_lead_delete.sql
-- Description:
--   1. Explicitly defines and hardens DELETE RLS policies on public.leads.
--   2. Explicitly defines and hardens DELETE RLS policies on public.insurance_leads.
--   3. Multi-Tenant Security: Only users belonging to the same organization WITH role
--      ADMIN or OWNER can delete leads. STAFF and anonymous users have 0 delete permissions.
-- ==============================================================================

-- 1. Ensure RLS is enabled on public.leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 2. Secure DELETE policy for public.leads
DROP POLICY IF EXISTS "Admins and owners can delete leads of their organization" ON public.leads;
CREATE POLICY "Admins and owners can delete leads of their organization"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_auth_organization_id() AND 
    public.get_auth_role() IN ('OWNER', 'ADMIN')
  );

COMMENT ON POLICY "Admins and owners can delete leads of their organization" ON public.leads
  IS 'Allows permanent deletion of loan leads strictly to authenticated users with ADMIN or OWNER role within the same organization.';

-- 3. Ensure RLS is enabled on public.insurance_leads
ALTER TABLE public.insurance_leads ENABLE ROW LEVEL SECURITY;

-- 4. Secure DELETE policy for public.insurance_leads
DROP POLICY IF EXISTS "Admins and owners can delete insurance leads of their organization" ON public.insurance_leads;
CREATE POLICY "Admins and owners can delete insurance leads of their organization"
  ON public.insurance_leads
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_auth_organization_id() AND 
    public.get_auth_role() IN ('OWNER', 'ADMIN')
  );

COMMENT ON POLICY "Admins and owners can delete insurance leads of their organization" ON public.insurance_leads
  IS 'Allows permanent deletion of insurance leads strictly to authenticated users with ADMIN or OWNER role within the same organization.';
