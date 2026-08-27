// ==============================================================================
// Credzo Finance — Secure Team Member Provisioning Edge Function
// Endpoint: /functions/v1/admin-create-user
// BUILD_VERSION: v20260824-diagnostic-002
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('[admin-create-user] Incoming POST request received');

    // 1. Verify Authorization Header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[admin-create-user] operation "validate_auth_header" failed: missing or malformed Bearer header');
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // 2. Initialize Privileged Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      Deno.env.get('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[admin-create-user] operation "validate_env" failed:', {
        hasUrl: Boolean(supabaseUrl),
        hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
      });
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 3. Authenticate Requesting User
    const userRes = await supabaseAdmin.auth.getUser(token);
    const callerUser = userRes?.data?.user;
    const callerError = userRes?.error;

    if (callerError || !callerUser) {
      console.error('[admin-create-user] operation "authenticate_caller" failed:', {
        name: callerError?.name,
        message: callerError?.message,
        status: callerError?.status,
      });
      return new Response(
        JSON.stringify({ error: 'Authentication session expired or invalid.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[admin-create-user] Caller authenticated: caller_id=${callerUser.id}`);

    // 4. Verify Caller Profile, Role & Organization Boundary
    const profileRes = await supabaseAdmin
      .from('profiles')
      .select('id, organization_id, role, is_active')
      .eq('id', callerUser.id)
      .maybeSingle();

    const callerProfile = profileRes?.data;
    const profileFetchError = profileRes?.error;

    if (profileFetchError || !callerProfile) {
      console.error('[admin-create-user] operation "fetch_caller_profile" failed:', {
        code: profileFetchError?.code,
        message: profileFetchError?.message,
        details: profileFetchError?.details,
        hint: profileFetchError?.hint,
        profileFound: Boolean(callerProfile),
      });
      return new Response(
        JSON.stringify({ error: 'Caller profile could not be verified.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[admin-create-user] Caller verified: role=${callerProfile.role}, active=${callerProfile.is_active}`);

    if (callerProfile.is_active === false) {
      console.warn('[admin-create-user] Caller account is deactivated');
      return new Response(
        JSON.stringify({ error: 'Your account has been deactivated. Operation not permitted.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerProfile.role !== 'OWNER' && callerProfile.role !== 'ADMIN') {
      console.warn(`[admin-create-user] Permission denied for role=${callerProfile.role}`);
      return new Response(
        JSON.stringify({ error: 'Permission Denied: Only Organization Owners and Admins can manage team members.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Parse and Validate Request Payload
    const body = await req.json().catch((jsonErr) => {
      console.error('[admin-create-user] operation "parse_payload" failed:', {
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

    const { full_name, email, mobile, role } = body;

    const trimmedName = typeof full_name === 'string' ? full_name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const trimmedMobile = typeof mobile === 'string' ? mobile.trim() : '';
    const targetRole = typeof role === 'string' ? role.trim().toUpperCase() : 'STAFF';

    if (!trimmedName || trimmedName.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Full name is required (minimum 2 characters).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail) || trimmedEmail.length > 320) {
      return new Response(
        JSON.stringify({ error: 'A valid email address is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Strict Role Assignment Boundary Verification
    if (targetRole === 'OWNER') {
      return new Response(
        JSON.stringify({ error: 'Security Restriction: Organization Owner accounts cannot be created via team management.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (targetRole !== 'STAFF' && targetRole !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Invalid role specified. Supported roles are STAFF or ADMIN.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerProfile.role === 'ADMIN' && targetRole === 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Permission Denied: Administrators may only provision STAFF accounts. Contact an Organization Owner to create Admins.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Secure Temporary Password Generation & Auth User Creation
    // Generates a cryptographically secure 40-character temporary password (crypto.randomUUID() + '!Aa1', well within Bcrypt 72-byte limit)
    const temporaryPassword = crypto.randomUUID() + '!Aa1';

    console.log('[admin-create-user] Calling supabaseAdmin.auth.admin.createUser...');
    const createAuthRes = await supabaseAdmin.auth.admin.createUser({
      email: trimmedEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: trimmedName,
        mobile: trimmedMobile || null,
        organization_id: callerProfile.organization_id,
        role: targetRole,
        must_change_password: true,
      },
    });

    const newAuthData = createAuthRes?.data;
    const authCreateError = createAuthRes?.error;

    if (authCreateError || !newAuthData?.user) {
      console.error('[admin-create-user] operation "create_auth_user" failed:', {
        name: authCreateError?.name,
        message: authCreateError?.message,
        status: authCreateError?.status,
        code: (authCreateError as any)?.code,
      });
      const isDuplicate = authCreateError?.message?.toLowerCase().includes('already registered') ||
        authCreateError?.message?.toLowerCase().includes('duplicate') ||
        authCreateError?.message?.toLowerCase().includes('already been registered');
      return new Response(
        JSON.stringify({
          error: isDuplicate
            ? 'A user with this email address is already registered in the system.'
            : (authCreateError?.message || 'Failed to create authentication user.'),
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const createdUserId = newAuthData.user.id;
    const createdUserEmail = newAuthData.user.email;
    console.log(`[admin-create-user] Auth user created: user_id=${createdUserId}`);

    // 8. Provision or Update Profile Record in caller's organization
    const profileCheckRes = await supabaseAdmin
      .from('profiles')
      .select('id, organization_id')
      .eq('id', createdUserId)
      .maybeSingle();

    const existingProfile = profileCheckRes?.data;
    const profileCheckError = profileCheckRes?.error;

    if (profileCheckError) {
      console.error('[admin-create-user] operation "check_existing_profile" failed:', {
        code: profileCheckError.code,
        message: profileCheckError.message,
        details: profileCheckError.details,
        hint: profileCheckError.hint,
      });
    }

    let profileRecord = null;
    let profileInsertError = null;

    if (existingProfile) {
      console.log('[admin-create-user] Updating existing profile for user...');
      const updateRes = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: trimmedName,
          role: targetRole,
          mobile: trimmedMobile || null,
          is_active: true,
          must_change_password: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', createdUserId)
        .select()
        .maybeSingle();
      profileRecord = updateRes?.data;
      profileInsertError = updateRes?.error;
    } else {
      console.log('[admin-create-user] Inserting new profile for user...');
      const insertRes = await supabaseAdmin
        .from('profiles')
        .insert({
          id: createdUserId,
          organization_id: callerProfile.organization_id,
          full_name: trimmedName,
          role: targetRole,
          mobile: trimmedMobile || null,
          is_active: true,
          must_change_password: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();
      profileRecord = insertRes?.data;
      profileInsertError = insertRes?.error;
    }

    if (profileInsertError || !profileRecord) {
      console.error('[admin-create-user] operation "provision_profile" failed:', {
        code: profileInsertError?.code,
        message: profileInsertError?.message,
        details: profileInsertError?.details,
        hint: profileInsertError?.hint,
        hasRecord: Boolean(profileRecord),
      });

      // Clean up orphaned auth user if profile insertion failed
      await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch((delErr) => {
        console.error('[admin-create-user] operation "cleanup_orphaned_user" failed:', {
          message: delErr?.message,
        });
      });

      return new Response(
        JSON.stringify({ error: profileInsertError?.message || 'Failed to provision team member profile record.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[admin-create-user] Profile successfully provisioned for user_id=${createdUserId}`);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: createdUserId,
          email: createdUserEmail,
          full_name: profileRecord.full_name,
          role: profileRecord.role,
          mobile: profileRecord.mobile,
          is_active: profileRecord.is_active,
          must_change_password: true,
          temporary_password: temporaryPassword,
          created_at: profileRecord.created_at,
        },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[admin-create-user] unhandled_exception failed:', {
      name: error?.name || 'UnknownError',
      message: error?.message || String(err),
      stack: error?.stack || null,
    });
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

