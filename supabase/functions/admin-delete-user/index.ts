// ==============================================================================
// Credzo Finance — Secure Team Member Deletion Edge Function
// Endpoint: /functions/v1/admin-delete-user
// BUILD_VERSION: v20260824-delete-001
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
    console.log('[admin-delete-user] Incoming POST request received');

    // 2. Verify Authorization Header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[admin-delete-user] operation "validate_auth_header" failed: missing or malformed Bearer header');
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
      console.error('[admin-delete-user] operation "validate_env" failed: Missing backend credentials');
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
      console.error('[admin-delete-user] operation "authenticate_caller" failed:', {
        name: callerError?.name,
        message: callerError?.message,
        status: callerError?.status,
      });
      return new Response(
        JSON.stringify({ error: 'Authentication session expired or invalid.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[admin-delete-user] Caller authenticated: caller_id=${callerUser.id}`);

    // 5. Verify Caller Profile, Role & Organization Boundary
    const profileRes = await supabaseAdmin
      .from('profiles')
      .select('id, organization_id, role, is_active')
      .eq('id', callerUser.id)
      .maybeSingle();

    const callerProfile = profileRes?.data;
    const profileFetchError = profileRes?.error;

    if (profileFetchError || !callerProfile) {
      console.error('[admin-delete-user] operation "fetch_caller_profile" failed:', {
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
      console.warn('[admin-delete-user] Caller account is deactivated');
      return new Response(
        JSON.stringify({ error: 'Your account has been deactivated. Operation not permitted.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerProfile.role !== 'OWNER' && callerProfile.role !== 'ADMIN') {
      console.warn(`[admin-delete-user] Permission denied for role=${callerProfile.role}`);
      return new Response(
        JSON.stringify({ error: 'Permission Denied: Only Organization Owners and Admins can delete team members.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Parse and Validate Request Payload
    const body = await req.json().catch((jsonErr) => {
      console.error('[admin-delete-user] operation "parse_payload" failed:', {
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

    const { target_user_id } = body;
    const trimmedTargetId = typeof target_user_id === 'string' ? target_user_id.trim() : '';

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!trimmedTargetId || !uuidRegex.test(trimmedTargetId)) {
      return new Response(
        JSON.stringify({ error: 'A valid target user ID is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Security Boundary: Self-Delete Prevention
    if (callerUser.id === trimmedTargetId) {
      return new Response(
        JSON.stringify({ error: 'Security Restriction: You cannot delete your own account.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Fetch and Verify Target User Profile
    const targetProfileRes = await supabaseAdmin
      .from('profiles')
      .select('id, organization_id, role, full_name, is_active')
      .eq('id', trimmedTargetId)
      .maybeSingle();

    const targetProfile = targetProfileRes?.data;
    const targetFetchError = targetProfileRes?.error;

    if (targetFetchError) {
      console.error('[admin-delete-user] operation "fetch_target_profile" failed:', {
        code: targetFetchError.code,
        message: targetFetchError.message,
      });
      return new Response(
        JSON.stringify({ error: 'Failed to verify target user profile.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If profile exists, enforce strict tenant isolation and role permissions
    if (targetProfile) {
      // Tenant Isolation: Target must strictly belong to caller's organization
      if (targetProfile.organization_id !== callerProfile.organization_id) {
        console.warn('[admin-delete-user] Tenant boundary violation attempt');
        return new Response(
          JSON.stringify({ error: 'Permission Denied: Target user does not belong to your organization.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Owner Protection: OWNER accounts can NEVER be deleted
      if (targetProfile.role === 'OWNER') {
        return new Response(
          JSON.stringify({ error: 'Security Restriction: Organization Owner accounts cannot be deleted.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Admin Restrictions: ADMIN callers can ONLY delete STAFF accounts
      if (callerProfile.role === 'ADMIN' && targetProfile.role !== 'STAFF') {
        return new Response(
          JSON.stringify({ error: 'Permission Denied: Administrators can only delete STAFF accounts. Contact an Organization Owner to manage Admin accounts.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 9. Authoritative Deletion via Supabase Auth Admin API
    console.log(`[admin-delete-user] Executing auth.admin.deleteUser for target_id=${trimmedTargetId}...`);
    const deleteAuthRes = await supabaseAdmin.auth.admin.deleteUser(trimmedTargetId);

    if (deleteAuthRes.error) {
      console.error('[admin-delete-user] operation "delete_auth_user" failed:', {
        name: deleteAuthRes.error.name,
        message: deleteAuthRes.error.message,
        status: deleteAuthRes.error.status,
      });

      // If user was not found in auth.users, clean up any residual profile record
      if (deleteAuthRes.error.message?.toLowerCase().includes('not found') || deleteAuthRes.error.status === 404) {
        if (targetProfile) {
          await supabaseAdmin.from('profiles').delete().eq('id', trimmedTargetId);
        }
        return new Response(
          JSON.stringify({ success: true, message: 'User record was cleaned up successfully.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: deleteAuthRes.error.message || 'Failed to delete user account.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If profile record still exists (in case cascade did not fire immediately), remove it explicitly
    const { error: profileDeleteErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', trimmedTargetId);

    if (profileDeleteErr) {
      console.warn('[admin-delete-user] Residual profile delete notice:', profileDeleteErr.message);
    }

    console.log(`[admin-delete-user] User deleted successfully: target_id=${trimmedTargetId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Team member account has been permanently deleted.',
        deleted_user_id: trimmedTargetId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[admin-delete-user] unhandled_exception failed:', {
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
