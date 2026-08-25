-- ==============================================================================
-- Credzo Finance — Web Push Notification System Migration
-- Migration Name: 20260826000000_web_push_notifications.sql
-- Description:
--   1. Creates `push_subscriptions` table for multi-device push subscription management.
--   2. Creates `notification_logs` table for tracking notification delivery audit logs.
--   3. Configures Row Level Security (RLS) policies for Staff and Admins.
--   4. Adds helper functions and triggers.
-- ==============================================================================

-- 1. Table: push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_push_subscriptions_user_endpoint UNIQUE (user_id, endpoint)
);

COMMENT ON TABLE public.push_subscriptions IS 'Web Push subscriptions per staff member and device.';

-- Indexes for high-performance lookup during notification dispatch
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user 
  ON public.push_subscriptions(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_org 
  ON public.push_subscriptions(organization_id, is_active);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
  ON public.push_subscriptions(endpoint);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER trg_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. Table: notification_logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'SENT',
  devices_targeted INTEGER NOT NULL DEFAULT 0,
  devices_succeeded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_notification_log_status CHECK (status IN ('SENT', 'FAILED', 'PARTIAL'))
);

COMMENT ON TABLE public.notification_logs IS 'Audit log of sent push notifications and delivery results.';

CREATE INDEX IF NOT EXISTS idx_notification_logs_org_created 
  ON public.notification_logs(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user 
  ON public.notification_logs(user_id, created_at DESC);

-- 3. Row Level Security (RLS)

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- push_subscriptions Policies:
-- A: SELECT policy
DROP POLICY IF EXISTS "push_subscriptions_select_policy" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_select_policy"
  ON public.push_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    -- Staff can read their own subscriptions
    user_id = auth.uid()
    OR
    -- ADMIN / OWNER can read all subscriptions in their organization
    (
      organization_id = public.get_auth_organization_id()
      AND public.get_auth_role() IN ('OWNER', 'ADMIN')
    )
  );

-- B: INSERT policy (Authenticated users can create subscriptions for themselves in their organization)
DROP POLICY IF EXISTS "push_subscriptions_insert_policy" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_insert_policy"
  ON public.push_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id = public.get_auth_organization_id()
  );

-- C: UPDATE policy (Staff can update their own subscriptions; Admins can update subscriptions within their org)
DROP POLICY IF EXISTS "push_subscriptions_update_policy" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_update_policy"
  ON public.push_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (
      organization_id = public.get_auth_organization_id()
      AND public.get_auth_role() IN ('OWNER', 'ADMIN')
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    (
      organization_id = public.get_auth_organization_id()
      AND public.get_auth_role() IN ('OWNER', 'ADMIN')
    )
  );

-- D: DELETE policy (Staff can remove their own subscriptions; Admins can delete within org)
DROP POLICY IF EXISTS "push_subscriptions_delete_policy" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_delete_policy"
  ON public.push_subscriptions
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (
      organization_id = public.get_auth_organization_id()
      AND public.get_auth_role() IN ('OWNER', 'ADMIN')
    )
  );

-- notification_logs Policies:
-- Staff and Admins can view logs within their organization
DROP POLICY IF EXISTS "notification_logs_select_policy" ON public.notification_logs;
CREATE POLICY "notification_logs_select_policy"
  ON public.notification_logs
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_auth_organization_id()
  );

-- Function for upserting push subscriptions cleanly
CREATE OR REPLACE FUNCTION public.upsert_push_subscription(
  p_endpoint TEXT,
  p_p256dh TEXT,
  p_auth TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_device_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_subscription_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User is not authenticated';
  END IF;

  SELECT organization_id INTO v_org_id FROM public.profiles WHERE id = v_user_id;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Profile or organization not found for authenticated user';
  END IF;

  INSERT INTO public.push_subscriptions (
    user_id,
    organization_id,
    endpoint,
    p256dh,
    auth,
    user_agent,
    device_name,
    is_active,
    last_used_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_org_id,
    p_endpoint,
    p_p256dh,
    p_auth,
    p_user_agent,
    p_device_name,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, endpoint)
  DO UPDATE SET
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    user_agent = COALESCE(EXCLUDED.user_agent, push_subscriptions.user_agent),
    device_name = COALESCE(EXCLUDED.device_name, push_subscriptions.device_name),
    is_active = true,
    last_used_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_subscription_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id
  );
END;
$$;
