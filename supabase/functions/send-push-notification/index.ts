// ==============================================================================
// Credzo Finance — Web Push Notification Dispatcher Edge Function
// Endpoint: /functions/v1/send-push-notification
// Architecture:
//   1. Authenticates caller (User JWT, Anon Key for public lead alerts, or Service Role).
//   2. Handles both direct push dispatches and automated CRM reminder checks.
//   3. Queries active push subscriptions matching target recipients from database.
//   4. Performs RFC 8291 (aes128gcm) payload encryption using Web Crypto API.
//   5. Generates RFC 8292 compliant VAPID authorization tokens (ES256).
//   6. Sends Web Push messages to endpoints (FCM, Apple APNs, Mozilla AutoPush).
//   7. Automatically deactivates expired / unregistered (404/410) subscriptions.
//   8. Logs notification activity to `notification_logs`.
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==============================================================================
// Base64URL and Cryptographic Helpers (Pure Web Crypto API)
// ==============================================================================

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binaryStr = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binaryStr += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    output.set(arr, offset);
    offset += arr.length;
  }
  return output;
}

// Convert DER ECDSA signature to IEEE P1363 format (64 bytes: r || s) for Web Push VAPID
function derToP1363(der: Uint8Array): Uint8Array {
  if (der.length === 64) return der;
  let offset = 2;
  if (der[1] & 0x80) offset += der[1] & 0x7f;

  // Read r
  if (der[offset] !== 0x02) throw new Error('Malformed DER signature (tag r)');
  const rLength = der[offset + 1];
  let rStart = offset + 2;
  let rLen = rLength;
  if (rLen === 33 && der[rStart] === 0x00) {
    rStart++;
    rLen--;
  }
  const rBytes = der.slice(rStart, rStart + rLen);

  offset += 2 + rLength;

  // Read s
  if (der[offset] !== 0x02) throw new Error('Malformed DER signature (tag s)');
  const sLength = der[offset + 1];
  let sStart = offset + 2;
  let sLen = sLength;
  if (sLen === 33 && der[sStart] === 0x00) {
    sStart++;
    sLen--;
  }
  const sBytes = der.slice(sStart, sStart + sLen);

  const rawSig = new Uint8Array(64);
  rawSig.set(rBytes, 32 - rBytes.length);
  rawSig.set(sBytes, 64 - sBytes.length);
  return rawSig;
}

// ==============================================================================
// VAPID Authorization JWT Generator (RFC 8292)
// ==============================================================================
async function createVapidAuthHeader(
  endpointUrl: string,
  vapidPublicKeyBase64: string,
  vapidPrivateKeyBase64: string,
  vapidSubject: string
): Promise<string> {
  const parsedUrl = new URL(endpointUrl);
  const audience = `${parsedUrl.protocol}//${parsedUrl.host}`;
  const nowInSecs = Math.floor(Date.now() / 1000);
  const expInSecs = nowInSecs + 12 * 60 * 60; // 12 hours validity

  const header = {
    typ: 'JWT',
    alg: 'ES256',
  };

  const payload = {
    aud: audience,
    exp: expInSecs,
    sub: vapidSubject,
  };

  const encodedHeader = uint8ArrayToBase64Url(stringToUint8Array(JSON.stringify(header)));
  const encodedPayload = uint8ArrayToBase64Url(stringToUint8Array(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKeyBase64);
  const publicKeyBytes = base64UrlToUint8Array(vapidPublicKeyBase64);

  const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33));
  const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65));
  const d = uint8ArrayToBase64Url(privateKeyBytes);

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x,
    y,
    d,
    ext: true,
  };

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    stringToUint8Array(signingInput)
  );

  let signatureBytes = new Uint8Array(signatureBuffer);
  if (signatureBytes.length !== 64) {
    signatureBytes = derToP1363(signatureBytes);
  }

  const encodedSignature = uint8ArrayToBase64Url(signatureBytes);
  const jwt = `${signingInput}.${encodedSignature}`;

  return `vapid t=${jwt}, k=${vapidPublicKeyBase64}`;
}

// ==============================================================================
// HKDF Key Derivation (RFC 5869)
// ==============================================================================
async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    ikm,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info,
    },
    baseKey,
    length * 8
  );

  return new Uint8Array(derivedBits);
}

// ==============================================================================
// Web Push Message Encryption (RFC 8291 - aes128gcm)
// ==============================================================================
async function encryptPushPayload(
  payloadText: string,
  userP256dhBase64: string,
  userAuthBase64: string
): Promise<Uint8Array> {
  const userPublicKeyBytes = base64UrlToUint8Array(userP256dhBase64);
  const userAuthBytes = base64UrlToUint8Array(userAuthBase64);

  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  const localPublicKeyBuffer = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKeyBytes = new Uint8Array(localPublicKeyBuffer);

  const subscriberKey = await crypto.subtle.importKey(
    'raw',
    userPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  const sharedSecretBuffer = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: subscriberKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBuffer);

  const authInfo = concatUint8Arrays([
    stringToUint8Array('WebPush: info\0'),
    userPublicKeyBytes,
    localPublicKeyBytes,
  ]);

  const ikm = await hkdf(userAuthBytes, sharedSecret, authInfo, 32);

  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const keyInfo = stringToUint8Array('Content-Encoding: aes128gcm\0');
  const cek = await hkdf(salt, ikm, keyInfo, 16);

  const nonceInfo = stringToUint8Array('Content-Encoding: nonce\0');
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  const payloadBytes = stringToUint8Array(payloadText);
  const plaintext = concatUint8Arrays([payloadBytes, new Uint8Array([2])]);

  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      tagLength: 128,
    },
    aesKey,
    plaintext
  );
  const ciphertext = new Uint8Array(ciphertextBuffer);

  const recordSize = 4096;
  const rsBytes = new Uint8Array(4);
  const view = new DataView(rsBytes.buffer);
  view.setUint32(0, recordSize, false);

  const header = concatUint8Arrays([
    salt,
    rsBytes,
    new Uint8Array([localPublicKeyBytes.length]),
    localPublicKeyBytes,
  ]);

  return concatUint8Arrays([header, ciphertext]);
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    const l = amount / 100000;
    return `₹${l % 1 === 0 ? l : l.toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

// ==============================================================================
// Push Dispatcher Routine
// ==============================================================================
async function sendPushToSubscriptions(
  supabaseAdmin: any,
  subscriptions: any[],
  notification: any,
  orgId: string,
  targetUsers: string[],
  callerUserId: string | null,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
) {
  const payloadJsonString = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: notification.icon || '/icons/icon-192.png',
    badge: notification.badge || '/icons/badge-72.png',
    tag: notification.tag || notification.type || 'credzo-crm-alert',
    type: notification.type || 'SYSTEM',
    url: notification.url || '/admin',
    data: {
      url: notification.url || '/admin',
      leadId: notification.data?.leadId || notification.leadId || null,
      type: notification.type || 'SYSTEM',
      timestamp: new Date().toISOString(),
      ...notification.data,
    },
  });

  let successCount = 0;
  let failCount = 0;
  let deactivatedCount = 0;

  for (const sub of subscriptions) {
    try {
      const encryptedBody = await encryptPushPayload(payloadJsonString, sub.p256dh, sub.auth);
      const vapidAuth = await createVapidAuthHeader(sub.endpoint, vapidPublicKey, vapidPrivateKey, vapidSubject);

      const response = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
          TTL: '86400',
          Urgency: 'high',
          'Content-Encoding': 'aes128gcm',
          'Content-Type': 'application/octet-stream',
          Authorization: vapidAuth,
        },
        body: encryptedBody,
      });

      if (response.status === 201 || response.status === 200) {
        successCount++;
        await supabaseAdmin
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id);
      } else if (response.status === 404 || response.status === 410) {
        deactivatedCount++;
        await supabaseAdmin
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('id', sub.id);
      } else {
        failCount++;
      }
    } catch (err) {
      failCount++;
      console.error(`[send-push-notification] Error for sub ${sub.id}:`, err);
    }
  }

  // Delivery log
  try {
    await supabaseAdmin.from('notification_logs').insert({
      organization_id: orgId,
      user_id: targetUsers.length === 1 ? targetUsers[0] : callerUserId,
      notification_type: notification.type || 'SYSTEM',
      title: notification.title,
      body: notification.body,
      url: notification.url || '/admin',
      data: notification.data || {},
      status: successCount > 0 ? (failCount > 0 ? 'PARTIAL' : 'SENT') : 'FAILED',
      devices_targeted: subscriptions.length,
      devices_succeeded: successCount,
    });
  } catch (logErr) {
    console.warn('[send-push-notification] Error writing delivery log:', logErr);
  }

  return { successCount, failCount, deactivatedCount };
}

// ==============================================================================
// Main Edge Function Handler
// ==============================================================================
serve(async (req: Request) => {
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
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vapidPublicKey =
      Deno.env.get('VAPID_PUBLIC_KEY') ||
      'BNHBJJ7A0K6RGvryAqOH0efKkKe2W6UYFeC2DTvJOnsWCcWp9NkowSdfpv5KzFxa8QJGN69vfQIK1bgCwC2Tm2Q';
    const vapidPrivateKey =
      Deno.env.get('VAPID_PRIVATE_KEY') ||
      'eperGXhjiVsSPXsdG7Gt0kUwfwozLfzpUvPdPbE55ZU';
    const vapidSubject =
      Deno.env.get('VAPID_SUBJECT') || 'mailto:notifications@credzofinance.com';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const token = authHeader.replace('Bearer ', '').trim();
    let callerUserId: string | null = null;
    let callerOrgId: string | null = null;

    if (token && token !== supabaseServiceRoleKey) {
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (userData?.user) {
        callerUserId = userData.user.id;
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('organization_id, role')
          .eq('id', callerUserId)
          .maybeSingle();
        if (profile) callerOrgId = profile.organization_id;
      }
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid request payload.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =========================================================================
    // Diagnostic Action: Inspect State
    // =========================================================================
    if (body.action === 'debug-inspect-state') {
      const { data: subs } = await supabaseAdmin.from('push_subscriptions').select('*');
      const { data: profiles } = await supabaseAdmin.from('profiles').select('id, email, full_name, role, organization_id, is_active');
      const { data: orgs } = await supabaseAdmin.from('organizations').select('*');
      const { data: logs } = await supabaseAdmin.from('notification_logs').select('*').order('created_at', { ascending: false }).limit(20);
      const { data: leads } = await supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false }).limit(10);

      return new Response(
        JSON.stringify({
          subscriptions: subs || [],
          profiles: profiles || [],
          organizations: orgs || [],
          logs: logs || [],
          leads: leads || [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // Diagnostic Action: Direct Push to All Active Subscriptions
    // =========================================================================
    if (body.action === 'send-real-direct-push') {
      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('is_active', true);

      console.log('[send-push-notification] Direct test push to active subs count:', subscriptions?.length || 0);

      if (!subscriptions || subscriptions.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'No active push subscriptions found in database.', sent: 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const notif = body.notification || {
        title: '🔔 Direct Web Push Test',
        body: 'Real-time Web Push notification successfully delivered to your device!',
        type: 'TEST',
        url: '/admin',
        tag: `test-${Date.now()}`,
      };

      const result = await sendPushToSubscriptions(
        supabaseAdmin,
        subscriptions,
        notif,
        subscriptions[0].organization_id || '00000000-0000-0000-0000-000000000000',
        subscriptions.map((s) => s.user_id),
        callerUserId,
        vapidPublicKey,
        vapidPrivateKey,
        vapidSubject
      );

      return new Response(
        JSON.stringify({
          success: result.successCount > 0,
          delivered: result.successCount,
          failed: result.failCount,
          deactivated: result.deactivatedCount,
          subscriptionsCount: subscriptions.length,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // Scenario A: Public Lead Submission Event (Customer submits lead form)
    // =========================================================================
    if (body.event_type === 'PUBLIC_LEAD_SUBMISSION' || body.event === 'NEW_LEAD') {
      console.log('[send-push-notification] Processing PUBLIC_LEAD_SUBMISSION event:', JSON.stringify(body.lead || {}));
      const lead = body.lead || {};
      const customerName = lead.name || lead.full_name || 'A customer';
      const amount = Number(lead.requested_amount) || 0;
      const loanType = lead.loan_type || lead.insurance_type || 'Loan';
      const formattedAmt = formatCurrency(amount);
      const isHighValue = amount >= 5000000;

      // Query all active subscriptions for staff (robust targeting across orgs)
      let { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('id, user_id, organization_id, endpoint, p256dh, auth, device_name')
        .eq('is_active', true);

      console.log('[send-push-notification] Total active staff subscriptions found:', subscriptions?.length || 0);

      if (!subscriptions || subscriptions.length === 0) {
        // Log that a lead was created but no staff devices were registered yet
        try {
          const { data: defaultOrg } = await supabaseAdmin.from('organizations').select('id').limit(1).maybeSingle();
          if (defaultOrg) {
            await supabaseAdmin.from('notification_logs').insert({
              organization_id: defaultOrg.id,
              notification_type: isHighValue ? 'HIGH_VALUE_LEAD' : 'NEW_LEAD',
              title: isHighValue ? '🔥 High-Value Lead' : '🔔 New Lead Received',
              body: `${customerName} submitted a ${formattedAmt} enquiry (No active devices).`,
              url: '/admin/leads',
              status: 'SENT',
              devices_targeted: 0,
              devices_succeeded: 0,
            });
          }
        } catch (_) {}

        return new Response(JSON.stringify({ message: 'No active staff subscriptions found in DB.', sent: 0 }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // If lead specifies an organization, filter subscriptions for that org
      if (lead.organization_id) {
        const filtered = subscriptions.filter((s) => s.organization_id === lead.organization_id);
        if (filtered.length > 0) subscriptions = filtered;
      }

      const targetOrgId = subscriptions[0]?.organization_id || '00000000-0000-0000-0000-000000000000';
      const targetUserIds = [...new Set(subscriptions.map((s) => s.user_id))];

      const notification = isHighValue
        ? {
            title: '🔥 High-Value Lead',
            body: `New ${formattedAmt} ${loanType} enquiry received from ${customerName}.`,
            type: 'HIGH_VALUE_LEAD',
            url: lead.id ? `/admin/leads/${lead.id}` : '/admin/leads',
            tag: `lead-highval-${lead.id || Date.now()}`,
          }
        : {
            title: '🔔 New Lead Received',
            body: `${customerName} is interested in a ${formattedAmt} ${loanType} loan.`,
            type: 'NEW_LEAD',
            url: lead.id ? `/admin/leads/${lead.id}` : '/admin/leads',
            tag: `lead-${lead.id || Date.now()}`,
          };

      const result = await sendPushToSubscriptions(
        supabaseAdmin,
        subscriptions,
        notification,
        targetOrgId,
        targetUserIds,
        null,
        vapidPublicKey,
        vapidPrivateKey,
        vapidSubject
      );

      console.log('[send-push-notification] Public lead dispatch completed:', result);

      return new Response(
        JSON.stringify({
          success: true,
          event: notification.type,
          sent: result.successCount,
          failed: result.failCount,
          deactivated: result.deactivatedCount,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // Scenario B: Automated CRM Reminders (Follow-ups Due/Overdue, Cold Leads, Pending Docs)
    // =========================================================================
    if (body.action === 'check-crm-reminders') {
      const orgId = body.organization_id || callerOrgId;
      if (!orgId) {
        return new Response(JSON.stringify({ error: 'Organization ID required.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let totalSent = 0;
      const now = new Date();
      const nowIso = now.toISOString();

      // 1. Check Follow-ups Due & Overdue
      const { data: dueFollowUps } = await supabaseAdmin
        .from('follow_ups')
        .select('id, lead_id, assigned_to, scheduled_at, leads(name, organization_id)')
        .eq('organization_id', orgId)
        .eq('status', 'PENDING')
        .lte('scheduled_at', nowIso)
        .limit(20);

      if (dueFollowUps && dueFollowUps.length > 0) {
        for (const fu of dueFollowUps) {
          const custName = (fu.leads as any)?.name || 'Lead';
          const isOverdue = new Date(fu.scheduled_at).getTime() < now.getTime() - 1000 * 60 * 30; // 30 mins late

          const notif = isOverdue
            ? {
                title: '⚠️ Follow-up Overdue',
                body: `Your follow-up with ${custName} is overdue.`,
                type: 'FOLLOW_UP_OVERDUE',
                url: fu.lead_id ? `/admin/leads/${fu.lead_id}` : '/admin/follow-ups',
                tag: `fu-overdue-${fu.id}`,
              }
            : {
                title: '⏰ Follow-up Due',
                body: `You have a follow-up scheduled with ${custName}.`,
                type: 'FOLLOW_UP_DUE',
                url: fu.lead_id ? `/admin/leads/${fu.lead_id}` : '/admin/follow-ups',
                tag: `fu-due-${fu.id}`,
              };

          const targetUsers = fu.assigned_to ? [fu.assigned_to] : [];
          if (targetUsers.length > 0) {
            const { data: subs } = await supabaseAdmin
              .from('push_subscriptions')
              .select('id, user_id, endpoint, p256dh, auth, device_name')
              .in('user_id', targetUsers)
              .eq('is_active', true);

            if (subs && subs.length > 0) {
              const res = await sendPushToSubscriptions(
                supabaseAdmin,
                subs,
                notif,
                orgId,
                targetUsers,
                callerUserId,
                vapidPublicKey,
                vapidPrivateKey,
                vapidSubject
              );
              totalSent += res.successCount;
            }
          }
        }
      }

      // 2. Check Cold Leads (no activity for 3+ days)
      const threeDaysAgoIso = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const { data: coldLeads } = await supabaseAdmin
        .from('leads')
        .select('id, name, assigned_to, updated_at')
        .eq('organization_id', orgId)
        .in('status', ['NEW', 'CONTACTED'])
        .lte('updated_at', threeDaysAgoIso)
        .limit(5);

      if (coldLeads && coldLeads.length > 0) {
        for (const cl of coldLeads) {
          const notif = {
            title: '🥶 Lead Going Cold',
            body: `${cl.name} has not been contacted for 3 days.`,
            type: 'LEAD_GOING_COLD',
            url: `/admin/leads/${cl.id}`,
            tag: `cold-lead-${cl.id}`,
          };

          const targetUsers = cl.assigned_to ? [cl.assigned_to] : (callerUserId ? [callerUserId] : []);
          if (targetUsers.length > 0) {
            const { data: subs } = await supabaseAdmin
              .from('push_subscriptions')
              .select('id, user_id, endpoint, p256dh, auth, device_name')
              .in('user_id', targetUsers)
              .eq('is_active', true);

            if (subs && subs.length > 0) {
              const res = await sendPushToSubscriptions(
                supabaseAdmin,
                subs,
                notif,
                orgId,
                targetUsers,
                callerUserId,
                vapidPublicKey,
                vapidPrivateKey,
                vapidSubject
              );
              totalSent += res.successCount;
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'CRM reminder checks completed.',
          totalSent,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // Scenario C: Direct Push Dispatch (Specific User or Event)
    // =========================================================================
    const {
      target_user_id,
      target_user_ids,
      all_organization_staff,
      target_role,
      notification,
    } = body;

    if (!notification || !notification.title || !notification.body) {
      return new Response(
        JSON.stringify({ error: 'Notification title and body are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orgId = body.organization_id || callerOrgId;
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'Organization ID could not be determined.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let targetUsers: string[] = [];
    if (target_user_id) {
      targetUsers = [target_user_id];
    } else if (Array.isArray(target_user_ids) && target_user_ids.length > 0) {
      targetUsers = target_user_ids;
    } else if (all_organization_staff || target_role) {
      let query = supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('organization_id', orgId)
        .eq('is_active', true);

      if (target_role && target_role !== 'ALL') {
        query = query.eq('role', target_role);
      }

      const { data: staffMembers } = await query;
      if (staffMembers) {
        targetUsers = staffMembers.map((s) => s.id);
      }
    } else if (callerUserId) {
      targetUsers = [callerUserId];
    }

    if (targetUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No recipient staff users found.', totalSent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth, device_name')
      .in('user_id', targetUsers)
      .eq('is_active', true);

    if (subError) {
      return new Response(JSON.stringify({ error: 'Database error reading subscriptions.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active push subscriptions registered for target user(s).',
          totalTargetedUsers: targetUsers.length,
          totalSubscriptions: 0,
          sent: 0,
          failed: 0,
          deactivated: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dispatchRes = await sendPushToSubscriptions(
      supabaseAdmin,
      subscriptions,
      notification,
      orgId,
      targetUsers,
      callerUserId,
      vapidPublicKey,
      vapidPrivateKey,
      vapidSubject
    );

    return new Response(
      JSON.stringify({
        success: true,
        totalTargetedUsers: targetUsers.length,
        totalSubscriptions: subscriptions.length,
        sent: dispatchRes.successCount,
        failed: dispatchRes.failCount,
        deactivated: dispatchRes.deactivatedCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[send-push-notification] Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
