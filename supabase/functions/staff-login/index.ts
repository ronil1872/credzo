// ==============================================================================
// Credzo Finance — Staff Authentication & Rate Limiting Edge Function Gateway
// Endpoint: /functions/v1/staff-login
// Security Architecture:
//   1. Replaces untrusted client-driven rate limiting with a server-side gateway.
//   2. Pre-checks 15-minute lockout BEFORE contacting Supabase Auth.
//   3. Genuine password failure increments DB attempt counter via service_role.
//   4. Locks account for 15 minutes upon reaching 5 failed attempts.
//   5. Successful authentication resets attempt counter and returns official session.
//   6. Zero client-callable RPCs; zero exposure of service_role key.
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Normalizes email and computes cryptographic SHA-256 hash.
 */
async function hashEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { email, password } = body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email and password are required.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || trimmedEmail.length > 320 || password.length > 512) {
      return new Response(
        JSON.stringify({ error: 'Invalid input format or length.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailHash = await hashEmail(trimmedEmail);

    // Initialize privileged backend client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      Deno.env.get('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[Credzo Security] Edge Function missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
      return new Response(
        JSON.stringify({ error: 'Server authentication configuration error.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // --------------------------------------------------------------------------
    // 1. Pre-check Lockout Status
    // --------------------------------------------------------------------------
    const { data: existingRecord } = await supabaseAdmin
      .from('staff_login_attempts')
      .select('failed_attempts, locked_until')
      .eq('email_hash', emailHash)
      .maybeSingle();

    if (existingRecord?.locked_until) {
      const lockedUntilDate = new Date(existingRecord.locked_until);
      const now = new Date();

      if (lockedUntilDate.getTime() > now.getTime()) {
        const remainingSeconds = Math.max(
          1,
          Math.ceil((lockedUntilDate.getTime() - now.getTime()) / 1000)
        );

        return new Response(
          JSON.stringify({
            error: 'Too many failed login attempts.',
            is_locked: true,
            remaining_seconds: remainingSeconds,
            failed_attempts: existingRecord.failed_attempts || 5,
            remaining_attempts: 0,
          }),
          {
            status: 423, // 423 Locked
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // --------------------------------------------------------------------------
    // 2. Perform Real Authentication via Supabase Auth (GoTrue)
    // --------------------------------------------------------------------------
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: trimmedEmail.toLowerCase(),
      password,
    });

    // --------------------------------------------------------------------------
    // 3. Handle Authentication Failure (Atomic Server-Side Failure Recording)
    // --------------------------------------------------------------------------
    if (authError) {
      let isLocked = false;
      let remainingSeconds = 0;
      let failedAttempts = 1;

      // Call internal atomic stored procedure with row-level MVCC locking
      const { data: failResult, error: failRpcError } = await supabaseAdmin.rpc(
        'internal_record_staff_login_failure',
        { p_email_hash: emailHash }
      );

      if (!failRpcError && failResult && typeof failResult === 'object') {
        isLocked = Boolean((failResult as Record<string, unknown>).is_locked);
        remainingSeconds = Number((failResult as Record<string, unknown>).remaining_seconds) || 0;
        failedAttempts = Number((failResult as Record<string, unknown>).failed_attempts) || 1;
      } else {
        if (failRpcError) {
          console.warn('[Credzo Security] internal_record_staff_login_failure RPC warning:', failRpcError.message);
        }
        // Fallback atomic table upsert if internal RPC is not present
        const currentAttempts = (existingRecord?.locked_until && new Date(existingRecord.locked_until).getTime() <= Date.now())
          ? 0
          : (existingRecord?.failed_attempts || 0);
        const newAttempts = currentAttempts + 1;
        const willLock = newAttempts >= 5;
        const lockUntil = willLock ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;

        await supabaseAdmin.from('staff_login_attempts').upsert(
          {
            email_hash: emailHash,
            failed_attempts: newAttempts,
            locked_until: lockUntil,
            last_failed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email_hash' }
        );

        isLocked = willLock;
        remainingSeconds = willLock ? 900 : 0;
        failedAttempts = newAttempts;
      }

      const remainingAttempts = Math.max(0, 5 - failedAttempts);

      if (isLocked) {
        return new Response(
          JSON.stringify({
            error: 'Too many failed login attempts.',
            is_locked: true,
            remaining_seconds: remainingSeconds || 900,
            failed_attempts: failedAttempts,
            remaining_attempts: 0,
          }),
          {
            status: 423, // 423 Locked
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'Invalid email or password. Please check your credentials.',
          is_locked: false,
          remaining_seconds: 0,
          failed_attempts: failedAttempts,
          remaining_attempts: remainingAttempts,
        }),
        {
          status: 401, // 401 Unauthorized
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // --------------------------------------------------------------------------
    // 4. Handle Authentication Success (Verify Account Status & Session Return)
    // --------------------------------------------------------------------------
    // Check if staff profile is active
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('is_active')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userProfile && userProfile.is_active === false) {
      return new Response(
        JSON.stringify({
          error: 'Your staff account has been deactivated. Please contact your organization administrator.',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Clear any previous failed attempts for this verified user
    await supabaseAdmin
      .from('staff_login_attempts')
      .delete()
      .eq('email_hash', emailHash);

    return new Response(
      JSON.stringify({
        session: authData.session,
        user: authData.user,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    console.error('[Credzo Security] Uncaught exception in staff-login gateway:', err instanceof Error ? err.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred during authentication.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
