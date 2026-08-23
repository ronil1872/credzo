// ==============================================================================
// Credzo Finance — Secure Team Member Provisioning Edge Function
// Endpoint: /functions/v1/admin-create-user
// BUILD_VERSION: v20260824-diagnostic-001
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const BUILD_VERSION = 'v20260824-diagnostic-001';

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
    console.log('[Credzo AdminCreateUser] Starting request processing...');

    // 1. Verify Authorization Header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Credzo AdminCreateUser] Missing or invalid Authorization header');
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
      console.error('[Credzo AdminCreateUser] Edge Function missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing backend credentials.' }),
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
      console.warn('[Credzo AdminCreateUser] Failed to authenticate caller JWT:', callerError?.message);
      return new Response(
        JSON.stringify({ error: `Authentication session expired or invalid: ${callerError?.message || 'Unauthorized'}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Credzo AdminCreateUser] Caller authenticated: ${callerUser.id}`);

    // 4. Verify Caller Profile, Role & Organization Boundary
    const profileRes = await supabaseAdmin
      .from('profiles')
      .select('id, organization_id, role, is_active')
      .eq('id', callerUser.id)
      .maybeSingle();

    const callerProfile = profileRes?.data;
    const profileFetchError = profileRes?.error;

    if (profileFetchError || !callerProfile) {
      console.warn('[Credzo AdminCreateUser] Caller profile not found:', profileFetchError?.message);
      return new Response(
        JSON.stringify({ error: `Caller profile could not be verified: ${profileFetchError?.message || 'Profile missing'}` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Credzo AdminCreateUser] Caller profile: role=${callerProfile.role}, active=${callerProfile.is_active}, org=${callerProfile.organization_id}`);

    if (callerProfile.is_active === false) {
      return new Response(
        JSON.stringify({ error: 'Your account has been deactivated. Operation not permitted.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerProfile.role !== 'OWNER' && callerProfile.role !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Permission Denied: Only Organization Owners and Admins can manage team members.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Parse and Validate Request Payload
    const body = await req.json().catch(() => null);
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

    console.log(`[Credzo AdminCreateUser] Target user: email=${trimmedEmail}, role=${targetRole}, name=${trimmedName}`);

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

    // ADMIN callers are strictly limited to creating STAFF accounts
    if (callerProfile.role === 'ADMIN' && targetRole === 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Permission Denied: Administrators may only provision STAFF accounts. Contact an Organization Owner to create Admins.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Secure Internal User Creation in Supabase Auth
    // Cryptographically random high-entropy token used strictly for initial account setup.
    // Plaintext passwords are NEVER exposed to admins or stored in the database.
    const internalInitPassword = crypto.randomUUID() + crypto.randomUUID() + '!Aa1';

    console.log('[Credzo AdminCreateUser] Calling supabaseAdmin.auth.admin.createUser...');
    const createAuthRes = await supabaseAdmin.auth.admin.createUser({
      email: trimmedEmail,
      password: internalInitPassword,
      email_confirm: true,
      user_metadata: {
        full_name: trimmedName,
        mobile: trimmedMobile,
      },
    });

    const newAuthData = createAuthRes?.data;
    const authCreateError = createAuthRes?.error;

    if (authCreateError || !newAuthData?.user) {
      console.error('[Credzo AdminCreateUser] Supabase auth.admin.createUser error:', authCreateError?.message);
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
    console.log(`[Credzo AdminCreateUser] Auth user created successfully: ${createdUserId}`);

    // 8. Provision or Update Profile Record in caller's organization
    // Check if profile was auto-provisioned by auth trigger
    const profileCheckRes = await supabaseAdmin
      .from('profiles')
      .select('id, organization_id')
      .eq('id', createdUserId)
      .maybeSingle();

    const existingProfile = profileCheckRes?.data;
    console.log(`[Credzo AdminCreateUser] Existing profile found: ${existingProfile ? 'yes' : 'no'}`);

    let profileRecord = null;
    let profileInsertError = null;

    if (existingProfile) {
      const updateRes = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: trimmedName,
          role: targetRole,
          mobile: trimmedMobile || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', createdUserId)
        .select()
        .maybeSingle();
      profileRecord = updateRes?.data;
      profileInsertError = updateRes?.error;
    } else {
      const insertRes = await supabaseAdmin
        .from('profiles')
        .insert({
          id: createdUserId,
          organization_id: callerProfile.organization_id, // Strictly bound to caller's org
          full_name: trimmedName,
          role: targetRole,
          mobile: trimmedMobile || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();
      profileRecord = insertRes?.data;
      profileInsertError = insertRes?.error;
    }

    if (profileInsertError || !profileRecord) {
      console.error('[Credzo AdminCreateUser] Profile provision error:', profileInsertError?.message);
      // Clean up orphaned auth user if profile insertion failed
      await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(() => null);
      return new Response(
        JSON.stringify({ error: profileInsertError?.message || 'Failed to provision team member profile record.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Credzo AdminCreateUser] Profile successfully set up for user: ${createdUserId}`);

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
          created_at: profileRecord.created_at,
        },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error('[Credzo AdminCreateUser] Unhandled exception:', msg);
    return new Response(
      JSON.stringify({ error: `Server exception: ${msg}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
