// ==============================================================================
// Credzo Finance — Secure Team Member Update & Permissions Edge Function
// Endpoint: /functions/v1/admin-update-team-member
// BUILD_VERSION: v20260824-update-001
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('[admin-update-team-member] Incoming POST request received');

    // 2. Verify Authorization Header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[admin-update-team-member] operation "validate_auth_header" failed: missing or malformed Bearer header');
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // 3. Initialize Privileged Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      Deno.env.get('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[admin-update-team-member] operation "validate_env" failed: Missing backend credentials');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing backend credentials.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 4. Authenticate Requesting User
    const userRes = await supabaseAdmin.auth.getUser(token);
    const callerUser = userRes?.data?.user;
    const callerError = userRes?.error;

    if (callerError || !callerUser) {
      console.error('[admin-update-team-member] operation "authenticate_caller" failed:', {
        name: callerError?.name,
        message: callerError?.message,
        status: callerError?.status,
      });
      return new Response(
        JSON.stringify({ error: 'Authentication session expired or invalid.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Verify Caller Profile, Role & Organization Boundary
    const profileRes = await supabaseAdmin
      .from('profiles')
      .select('id, organization_id, role, is_active')
      .eq('id', callerUser.id)
      .maybeSingle();

    const callerProfile = profileRes?.data;
    const profileFetchError = profileRes?.error;

    if (profileFetchError || !callerProfile) {
      console.error('[admin-update-team-member] operation "fetch_caller_profile" failed:', {
        code: profileFetchError?.code,
        message: profileFetchError?.message,
        profileFound: Boolean(callerProfile),
      });
      return new Response(
        JSON.stringify({ error: 'Caller profile could not be verified.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerProfile.is_active === false) {
      console.warn('[admin-update-team-member] Caller account is deactivated');
      return new Response(
        JSON.stringify({ error: 'Your account has been deactivated. Operation not permitted.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerProfile.role !== 'OWNER' && callerProfile.role !== 'ADMIN') {
      console.warn(`[admin-update-team-member] Permission denied for role=${callerProfile.role}`);
      return new Response(
        JSON.stringify({ error: 'Permission Denied: Only Organization Owners and Admins can manage team members.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Parse and Validate Request Payload
    const body = await req.json().catch((jsonErr) => {
      console.error('[admin-update-team-member] operation "parse_payload" failed:', {
        name: jsonErr?.name,
        message: jsonErr?.message,
      });
      return null;
    });

    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request payload format.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { target_user_id, full_name, mobile, role, is_active } = body;
    const trimmedTargetId = typeof target_user_id === 'string' ? target_user_id.trim() : '';

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!trimmedTargetId || !uuidRegex.test(trimmedTargetId)) {
      return new Response(
        JSON.stringify({ error: 'A valid target user ID is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Fetch and Verify Target User Profile
    const targetProfileRes = await supabaseAdmin
      .from('profiles')
      .select('id, organization_id, role, full_name, mobile, is_active')
      .eq('id', trimmedTargetId)
      .maybeSingle();

    const targetProfile = targetProfileRes?.data;
    const targetFetchError = targetProfileRes?.error;

    if (targetFetchError || !targetProfile) {
      console.error('[admin-update-team-member] operation "fetch_target_profile" failed:', {
        code: targetFetchError?.code,
        message: targetFetchError?.message,
        profileFound: Boolean(targetProfile),
      });
      return new Response(
        JSON.stringify({ error: 'Target team member profile not found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Strict Tenant Boundary Enforcement
    if (targetProfile.organization_id !== callerProfile.organization_id) {
      console.warn('[admin-update-team-member] Tenant boundary violation attempt');
      return new Response(
        JSON.stringify({ error: 'Permission Denied: Target user does not belong to your organization.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSelf = callerUser.id === trimmedTargetId;
    const isTargetOwner = targetProfile.role === 'OWNER';
    const isCallerOwner = callerProfile.role === 'OWNER';
    const isCallerAdmin = callerProfile.role === 'ADMIN';

    // 9. Process and Validate Field Updates
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // --- A. Full Name ---
    if (full_name !== undefined) {
      const trimmedName = typeof full_name === 'string' ? full_name.trim() : '';
      if (!trimmedName || trimmedName.length < 2) {
        return new Response(
          JSON.stringify({ error: 'Full name must be at least 2 characters.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // ADMIN cannot modify other ADMIN or OWNER names
      if (isCallerAdmin && !isSelf && (isTargetOwner || targetProfile.role === 'ADMIN')) {
        return new Response(
          JSON.stringify({ error: 'Permission Denied: Administrators can only modify STAFF accounts.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      updatePayload.full_name = trimmedName;
    }

    // --- B. Mobile Number ---
    if (mobile !== undefined) {
      const trimmedMobile = typeof mobile === 'string' ? mobile.trim().replace(/\D/g, '').slice(0, 10) : '';
      if (isCallerAdmin && !isSelf && (isTargetOwner || targetProfile.role === 'ADMIN')) {
        return new Response(
          JSON.stringify({ error: 'Permission Denied: Administrators can only modify STAFF accounts.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      updatePayload.mobile = trimmedMobile || null;
    }

    // --- C. Role Modification ---
    if (role !== undefined) {
      const requestedRole = typeof role === 'string' ? role.trim().toUpperCase() : '';

      // Rule 1: No one can ever promote anyone to OWNER
      if (requestedRole === 'OWNER') {
        return new Response(
          JSON.stringify({ error: 'Security Restriction: Organization Owner accounts cannot be created or assigned via team management.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rule 2: Target is OWNER -> Role can NEVER be changed
      if (isTargetOwner && requestedRole !== 'OWNER') {
        return new Response(
          JSON.stringify({ error: 'Security Restriction: Organization Owner accounts cannot be demoted or have their role altered.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rule 3: Self-Role Modification is strictly blocked
      if (isSelf && requestedRole !== callerProfile.role) {
        return new Response(
          JSON.stringify({ error: 'Security Restriction: You cannot alter your own role.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rule 4: ADMIN callers can NEVER change roles
      if (isCallerAdmin && requestedRole !== targetProfile.role) {
        return new Response(
          JSON.stringify({ error: 'Permission Denied: Only Organization Owners can change team member roles.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rule 5: OWNER callers may change STAFF <-> ADMIN
      if (isCallerOwner) {
        if (requestedRole !== 'STAFF' && requestedRole !== 'ADMIN') {
          return new Response(
            JSON.stringify({ error: 'Invalid role specified. Supported roles are STAFF or ADMIN.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        updatePayload.role = requestedRole;
      }
    }

    // --- D. Account Status (is_active) ---
    if (is_active !== undefined) {
      const nextActiveState = Boolean(is_active);

      // Rule 1: Self-deactivation is strictly blocked
      if (isSelf && nextActiveState === false) {
        return new Response(
          JSON.stringify({ error: 'Security Restriction: You cannot deactivate your own account.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rule 2: OWNER accounts can NEVER be deactivated
      if (isTargetOwner && nextActiveState === false) {
        return new Response(
          JSON.stringify({ error: 'Security Restriction: Organization Owner accounts cannot be deactivated.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rule 3: ADMIN callers cannot deactivate other ADMINs or OWNERs
      if (isCallerAdmin && (isTargetOwner || targetProfile.role === 'ADMIN')) {
        return new Response(
          JSON.stringify({ error: 'Permission Denied: Administrators can only activate or deactivate STAFF accounts.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      updatePayload.is_active = nextActiveState;
    }

    // 10. Execute Server-Side Profile Update
    console.log(`[admin-update-team-member] Applying updates for user_id=${trimmedTargetId}...`);
    const updateRes = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', trimmedTargetId)
      .select()
      .single();

    if (updateRes.error || !updateRes.data) {
      console.error('[admin-update-team-member] operation "update_profile" failed:', {
        code: updateRes.error?.code,
        message: updateRes.error?.message,
      });
      return new Response(
        JSON.stringify({ error: updateRes.error?.message || 'Failed to update team member profile.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 11. Synchronize Auth User Metadata if full_name or mobile was modified
    if (updatePayload.full_name || updatePayload.mobile !== undefined) {
      await supabaseAdmin.auth.admin.updateUserById(trimmedTargetId, {
        user_metadata: {
          full_name: updateRes.data.full_name,
          mobile: updateRes.data.mobile || '',
        },
      }).catch((authSyncErr) => {
        console.warn('[admin-update-team-member] Auth metadata sync warning:', authSyncErr?.message);
      });
    }

    console.log(`[admin-update-team-member] User updated successfully: user_id=${trimmedTargetId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Team member updated successfully.',
        profile: updateRes.data,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[admin-update-team-member] unhandled_exception failed:', {
      name: error?.name || 'UnknownError',
      message: error?.message || String(err),
      stack: error?.stack || null,
    });
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
