/**
 * Credzo Finance — VAPID Keypair Generator Utility
 * 
 * Generates an RFC 8292 compliant ECDSA P-256 keypair formatted for Web Push.
 * Run using: node scripts/generate-vapid-keys.mjs
 */

import crypto from 'node:crypto';

function generateVapidKeys() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();

  const publicKey = ecdh.getPublicKey('base64url');
  const privateKey = ecdh.getPrivateKey('base64url');

  console.log('\n======================================================');
  console.log(' Credzo Finance — Web Push VAPID Keypair Generated');
  console.log('======================================================\n');
  console.log('Add these to your environment configuration:\n');
  console.log('--- Frontend (.env.local) ---');
  console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}\n`);
  console.log('--- Supabase Edge Function Secrets ---');
  console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
  console.log(`VAPID_SUBJECT=mailto:notifications@credzofinance.com\n`);
  console.log('To set Supabase secrets via CLI:');
  console.log(`supabase secrets set VAPID_PUBLIC_KEY="${publicKey}" VAPID_PRIVATE_KEY="${privateKey}" VAPID_SUBJECT="mailto:notifications@credzofinance.com"`);
  console.log('======================================================\n');

  return { publicKey, privateKey };
}

generateVapidKeys();
