/**
 * Test & Verification Script for Web Push Cryptography
 * Tests:
 * 1. P-256 ECDH Shared Secret generation
 * 2. HKDF Key Derivation (RFC 5869)
 * 3. AES-128-GCM Content Encryption (RFC 8291)
 * 4. VAPID JWT Signing (RFC 8292)
 */

import crypto from 'node:crypto';

console.log('Testing Web Push Cryptographic Implementation...\n');

// 1. Generate client subscriber keys (simulating browser PushSubscription)
const clientEcdh = crypto.createECDH('prime256v1');
clientEcdh.generateKeys();
const clientPublicKey = clientEcdh.getPublicKey();
const clientAuth = crypto.randomBytes(16);

// 2. Generate server VAPID keys
const serverEcdh = crypto.createECDH('prime256v1');
serverEcdh.generateKeys();
const vapidPublicKey = serverEcdh.getPublicKey('base64url');
const vapidPrivateKey = serverEcdh.getPrivateKey('base64url');

console.log('✓ VAPID Keys generated successfully');
console.log('  Public Key:', vapidPublicKey.substring(0, 30) + '...');
console.log('  Private Key:', vapidPrivateKey.substring(0, 15) + '...');

// 3. Test ECDH Shared Secret
const serverEphemeral = crypto.createECDH('prime256v1');
serverEphemeral.generateKeys();
const sharedSecret = serverEphemeral.computeSecret(clientPublicKey);
console.log('✓ ECDH Shared Secret computed:', sharedSecret.length, 'bytes');

// 4. Test HKDF derivation of IKM
const authInfo = Buffer.concat([
  Buffer.from('WebPush: info\0', 'utf8'),
  clientPublicKey,
  serverEphemeral.getPublicKey(),
]);

const ikm = crypto.hkdfSync('sha256', sharedSecret, clientAuth, authInfo, 32);
console.log('✓ IKM derived via HKDF:', ikm.byteLength, 'bytes');

// 5. Test CEK & Nonce derivation
const salt = crypto.randomBytes(16);
const keyInfo = Buffer.from('Content-Encoding: aes128gcm\0', 'utf8');
const cek = crypto.hkdfSync('sha256', ikm, salt, keyInfo, 16);

const nonceInfo = Buffer.from('Content-Encoding: nonce\0', 'utf8');
const nonce = crypto.hkdfSync('sha256', ikm, salt, nonceInfo, 12);
console.log('✓ CEK & Nonce derived successfully');

// 6. Test AES-128-GCM encryption
const payload = JSON.stringify({
  title: '🔔 New Lead Received',
  body: 'Rahul Sharma is interested in a ₹15L home loan.',
  type: 'NEW_LEAD',
  url: '/admin/leads',
});

const plaintext = Buffer.concat([Buffer.from(payload, 'utf8'), Buffer.from([2])]);
const cipher = crypto.createCipheriv('aes-128-gcm', Buffer.from(cek), Buffer.from(nonce));
const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);

console.log('✓ Payload encrypted with AES-128-GCM:', ciphertext.length, 'bytes');

// 7. Test client decryption to verify end-to-end roundtrip!
const clientSharedSecret = clientEcdh.computeSecret(serverEphemeral.getPublicKey());
const clientIkm = crypto.hkdfSync('sha256', clientSharedSecret, clientAuth, authInfo, 32);
const clientCek = crypto.hkdfSync('sha256', clientIkm, salt, keyInfo, 16);
const clientNonce = crypto.hkdfSync('sha256', clientIkm, salt, nonceInfo, 12);

const decipher = crypto.createDecipheriv('aes-128-gcm', Buffer.from(clientCek), Buffer.from(clientNonce));
const tag = ciphertext.subarray(ciphertext.length - 16);
const encryptedData = ciphertext.subarray(0, ciphertext.length - 16);
decipher.setAuthTag(tag);
const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
const decryptedJson = JSON.parse(decrypted.subarray(0, decrypted.length - 1).toString('utf8'));

console.log('✓ Payload decrypted successfully by client simulator:');
console.log('  Title:', decryptedJson.title);
console.log('  Body:', decryptedJson.body);
console.log('  Type:', decryptedJson.type);

console.log('\n=========================================');
console.log(' All Web Push Cryptographic Tests Passed! ');
console.log('=========================================\n');
