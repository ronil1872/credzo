// ==============================================================================
// Credzo Finance CRM — Web Push Notification Client Library
// Provides subscription lifecycle management, device detection, and alert templates.
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { formatIndianCurrency } from './calculator';

// Starter VAPID Public Key (Safe for public client-side bundling)
export const DEFAULT_VAPID_PUBLIC_KEY =
  'BNHBJJ7A0K6RGvryAqOH0efKkKe2W6UYFeC2DTvJOnsWCcWp9NkowSdfpv5KzFxa8QJGN69vfQIK1bgCwC2Tm2Q';

export function getVapidPublicKey(): string {
  const envKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim();
  return envKey || DEFAULT_VAPID_PUBLIC_KEY;
}

/**
 * Converts a Base64URL string to a Uint8Array buffer required by PushManager.subscribe.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks whether Web Push and Service Worker APIs are supported in this browser.
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const hasSW = 'serviceWorker' in navigator;
  const hasPush = 'PushManager' in window;
  const hasNotif = 'Notification' in window;
  return Boolean(hasSW && hasPush && hasNotif);
}

/**
 * Detects if the current user agent is iOS or iPadOS.
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isIpadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isIos || isIpadOs;
}

/**
 * Detects if the web app is running in Standalone PWA mode.
 * (Required by Apple iOS 16.4+ for Web Push permissions).
 */
export function isPWAStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
  const isNavigatorStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(isStandaloneMedia || isNavigatorStandalone);
}

/**
 * Evaluates iOS Web Push readiness.
 */
export function getIOSPushStatus(): {
  isIOS: boolean;
  isStandalone: boolean;
  supported: boolean;
  guideMessage?: string;
} {
  const isIOS = isIOSDevice();
  const isStandalone = isPWAStandalone();

  if (isIOS && !isStandalone) {
    return {
      isIOS: true,
      isStandalone: false,
      supported: false,
      guideMessage:
        'On iPhone and iPad, Apple requires adding Credzo CRM to your Home Screen to enable Web Push. Tap Share (⎋) and choose "Add to Home Screen".',
    };
  }

  return {
    isIOS,
    isStandalone,
    supported: isPushNotificationSupported(),
  };
}

/**
 * Detects detailed client browser, version, operating system, and capabilities.
 */
export interface DetailedClientEnvironment {
  browser: 'Chrome' | 'Edge' | 'Brave' | 'Safari' | 'Firefox' | 'Opera' | 'Other';
  browserVersion: string;
  os: 'Windows' | 'macOS' | 'iOS' | 'iPadOS' | 'Android' | 'Linux' | 'Other';
  isBrave: boolean;
  isIOS: boolean;
  isPWA: boolean;
}

export async function detectClientEnvironment(): Promise<DetailedClientEnvironment> {
  if (typeof window === 'undefined') {
    return {
      browser: 'Other',
      browserVersion: 'unknown',
      os: 'Other',
      isBrave: false,
      isIOS: false,
      isPWA: false,
    };
  }

  const ua = navigator.userAgent;
  let isBrave = false;
  try {
    const braveObj = (navigator as unknown as { brave?: { isBrave?: () => Promise<boolean> } }).brave;
    if (braveObj && typeof braveObj.isBrave === 'function') {
      isBrave = await braveObj.isBrave().catch(() => false);
    }
  } catch {
    isBrave = false;
  }

  let browser: DetailedClientEnvironment['browser'] = 'Other';
  let browserVersion = 'unknown';

  if (isBrave) {
    browser = 'Brave';
    const match = ua.match(/(?:Chrome|Brave)\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('Edg/')) {
    browser = 'Edge';
    const match = ua.match(/Edg\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    browser = 'Opera';
    const match = ua.match(/(?:OPR|Opera)\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    browser = 'Safari';
    const match = ua.match(/Version\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('Firefox/')) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  }

  let os: DetailedClientEnvironment['os'] = 'Other';
  const isIpadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/ipad/.test(ua.toLowerCase()) || isIpadOs) os = 'iPadOS';
  else if (/iphone|ipod/.test(ua.toLowerCase())) os = 'iOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  return {
    browser,
    browserVersion,
    os,
    isBrave,
    isIOS: os === 'iOS' || os === 'iPadOS',
    isPWA: isPWAStandalone(),
  };
}

/**
 * Returns a human-friendly device and browser description.
 */
export function getFriendlyDeviceName(): string {
  if (typeof window === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent;
  let browser = 'Browser';
  let os = 'Device';

  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';

  if (ua.includes('Windows')) os = 'Windows PC';
  else if (ua.includes('Macintosh')) os = 'Mac';
  else if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Android')) os = 'Android Device';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

export interface PushDiagnosticReport {
  browser: string;
  browserVersion: string;
  os: string;
  isBrave: boolean;
  notificationSupported: boolean;
  notificationPermission: NotificationPermissionState;
  serviceWorkerSupported: boolean;
  serviceWorkerActive: boolean;
  serviceWorkerScope?: string;
  serviceWorkerState?: string;
  pushManagerSupported: boolean;
  vapidKeyValid: boolean;
  vapidKeyLength: number;
  existingSubscriptionEndpoint?: string | null;
  subscribeTestResult: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  exceptionName?: string;
  exceptionMessage?: string;
  remediationAdvice?: string;
  timestamp: string;
}

/**
 * Runs a comprehensive Web Push diagnostic check on the current browser/device.
 */
export async function runPushDiagnostics(): Promise<PushDiagnosticReport> {
  const env = await detectClientEnvironment();
  const notificationSupported = typeof window !== 'undefined' && 'Notification' in window;
  const notificationPermission = getNotificationPermissionState();
  const serviceWorkerSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;
  const pushManagerSupported = typeof window !== 'undefined' && 'PushManager' in window;

  const vapidKey = getVapidPublicKey();
  let vapidKeyValid = false;
  let vapidKeyLength = 0;
  try {
    const rawKey = urlBase64ToUint8Array(vapidKey);
    vapidKeyLength = rawKey.byteLength;
    vapidKeyValid = rawKey.byteLength === 65 && rawKey[0] === 0x04;
  } catch {
    vapidKeyValid = false;
  }

  let serviceWorkerActive = false;
  let serviceWorkerScope: string | undefined;
  let serviceWorkerState: string | undefined;
  let existingEndpoint: string | null = null;
  let subscribeTestResult: 'SUCCESS' | 'FAILED' | 'SKIPPED' = 'SKIPPED';
  let exceptionName: string | undefined;
  let exceptionMessage: string | undefined;
  let remediationAdvice: string | undefined;

  try {
    if (serviceWorkerSupported) {
      const reg = await ensureActiveServiceWorker();
      if (reg) {
        serviceWorkerScope = reg.scope;
        const target = reg.active || reg.waiting || reg.installing;
        serviceWorkerState = target?.state || 'unknown';
        serviceWorkerActive = Boolean(reg.active && reg.active.state === 'activated');

        if (reg.pushManager) {
          const sub = await reg.pushManager.getSubscription().catch(() => null);
          if (sub) {
            existingEndpoint = sub.endpoint;
          }

          if (notificationPermission === 'granted' && vapidKeyValid) {
            try {
              const rawKey = urlBase64ToUint8Array(vapidKey);
              const testSub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: rawKey as unknown as BufferSource,
              });
              existingEndpoint = testSub.endpoint;
              subscribeTestResult = 'SUCCESS';
            } catch (subErr: unknown) {
              const err = subErr as (Error & { code?: number });
              subscribeTestResult = 'FAILED';
              exceptionName = err.name || 'DOMException';
              exceptionMessage = err.message || 'Push registration failed';
            }
          }
        }
      }
    }
  } catch (err: unknown) {
    const errorObj = err as Error;
    exceptionName = errorObj.name;
    exceptionMessage = errorObj.message;
  }

  // Generate customized advice based on findings
  if (env.isBrave && subscribeTestResult === 'FAILED') {
    remediationAdvice =
      'Brave disables Google Push Messaging by default. Go to brave://settings/privacy -> Enable "Use Google services for push messaging", restart Brave, and retry.';
  } else if (env.os === 'Windows' && subscribeTestResult === 'FAILED') {
    remediationAdvice =
      'Windows Push Service error: Ensure Windows Notifications are enabled in Windows Settings -> System -> Notifications for ' +
      env.browser +
      '. Also verify firewall/VPN is not blocking FCM/WNS.';
  } else if (env.isIOS && !env.isPWA) {
    remediationAdvice =
      'On iPhone/iPad, Web Push requires running from the Home Screen. Tap Share (⎋) -> "Add to Home Screen" and open from the icon.';
  } else if (notificationPermission === 'denied') {
    remediationAdvice =
      'Notifications are blocked in this browser. Click the lock/tune icon in the address bar and set Notifications to "Allow".';
  } else if (subscribeTestResult === 'SUCCESS') {
    remediationAdvice = 'Web Push is fully operational and ready on this browser!';
  }

  return {
    browser: env.browser,
    browserVersion: env.browserVersion,
    os: env.os,
    isBrave: env.isBrave,
    notificationSupported,
    notificationPermission,
    serviceWorkerSupported,
    serviceWorkerActive,
    serviceWorkerScope,
    serviceWorkerState,
    pushManagerSupported,
    vapidKeyValid,
    vapidKeyLength,
    existingSubscriptionEndpoint: existingEndpoint,
    subscribeTestResult,
    exceptionName,
    exceptionMessage,
    remediationAdvice,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Promise timeout utility to prevent hanging calls.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMsg = 'Operation timed out'
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${timeoutMsg} (exceeded ${ms}ms)`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

/**
 * Ensures the Service Worker at `/sw.js` is registered, active, and controlling the scope.
 * Cleans up any stale or non-root duplicate registrations.
 */
export async function ensureActiveServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[Push Debug] Service Worker API not available in window/navigator.');
    return null;
  }

  try {
    // 1. Clean up stale/duplicate registrations outside scope '/'
    try {
      const allRegistrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of allRegistrations) {
        const regUrl = new URL(reg.scope);
        if (regUrl.pathname !== '/' && regUrl.origin === window.location.origin) {
          console.info('[Push Debug] Unregistering non-root service worker:', reg.scope);
          await reg.unregister().catch(() => {});
        }
      }
    } catch (cleanErr) {
      console.warn('[Push Debug] Stale registration cleanup notice:', cleanErr);
    }

    // 2. Register /sw.js with scope '/'
    const registration = await withTimeout(
      navigator.serviceWorker.register('/sw.js', { scope: '/' }),
      8000,
      'Service worker registration timed out'
    );

    // 3. If a worker is waiting, post SKIP_WAITING to accelerate activation
    if (registration.waiting) {
      console.info('[Push Debug] Posting SKIP_WAITING to waiting worker');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // 4. If registration.active is already activated, return immediately
    if (registration.active && registration.active.state === 'activated') {
      console.info('[Push Debug] Service Worker is already active and activated. Scope:', registration.scope);
      return registration;
    }

    // 5. Otherwise wait for activation with timeout
    const activationPromise = new Promise<ServiceWorkerRegistration>((resolve) => {
      navigator.serviceWorker.ready
        .then((readyReg) => resolve(readyReg))
        .catch(() => {});

      const targetWorker = registration.installing || registration.waiting || registration.active;
      if (targetWorker) {
        if (targetWorker.state === 'activated') {
          resolve(registration);
          return;
        }
        targetWorker.addEventListener('statechange', () => {
          if (targetWorker.state === 'activated') {
            resolve(registration);
          }
        });
      }
    });

    const activeReg = await withTimeout(activationPromise, 6000, 'Service worker activation timed out');
    console.info('[Push Debug] Service worker registration active and verified. Scope:', activeReg.scope);
    return activeReg;
  } catch (error) {
    console.error('[Push Debug] Service Worker registration / activation error:', error);
    try {
      const fallback = await withTimeout(
        navigator.serviceWorker.getRegistration(),
        3000,
        'Fallback getRegistration timed out'
      );
      if (fallback) return fallback;
    } catch {
      // Ignore fallback error
    }
    return null;
  }
}

/**
 * Registers the Service Worker at `/sw.js` (alias to ensureActiveServiceWorker).
 */
export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  return ensureActiveServiceWorker();
}

/**
 * Obtains current browser PushSubscription if registered (Non-blocking).
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !('pushManager' in registration)) return null;
    return await withTimeout(
      registration.pushManager.getSubscription(),
      4000,
      'PushManager getSubscription timed out'
    );
  } catch (err) {
    console.warn('[Push Debug] Error checking push subscription:', err);
    return null;
  }
}

export type NotificationPermissionState =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported'
  | 'ios_not_pwa';

export function getNotificationPermissionState(): NotificationPermissionState {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) {
    const ios = getIOSPushStatus();
    if (ios.isIOS && !ios.isStandalone) {
      return 'ios_not_pwa';
    }
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Requests browser permission and creates a Web Push subscription.
 * Saves the subscription to Supabase `push_subscriptions` table.
 */
export async function subscribeStaffToPush(
  userId?: string,
  organizationId?: string
): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
  const startTime = Date.now();
  console.log('[Push Debug] ========================================');
  console.log('[Push Debug] Initiating Web Push subscription flow...');

  // 0. Environment & Compatibility Checks
  if (!isPushNotificationSupported()) {
    const ios = getIOSPushStatus();
    if (ios.isIOS && !ios.isStandalone) {
      return {
        success: false,
        error:
          'Apple iOS requires adding this app to your Home Screen before enabling notifications. Tap Share (⎋) -> Add to Home Screen.',
      };
    }
    return { success: false, error: 'Web Push notifications are not supported on this browser.' };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase backend credentials are not configured.' };
  }

  try {
    // Step 1: Request native browser notification permission
    console.log('[Push Debug] Step 1/7: Permission request started');
    let permission: NotificationPermission = Notification.permission;
    if (permission !== 'granted') {
      try {
        permission = await withTimeout(
          Notification.requestPermission(),
          20000,
          'Notification permission prompt timed out or was dismissed'
        );
      } catch (permErr: unknown) {
        const errorObj = permErr as Error;
        console.error('[Push Debug] ❌ Step 1 failed:', { name: errorObj.name, message: errorObj.message });
        return {
          success: false,
          error: `Permission error (${errorObj.name}): ${errorObj.message || 'Notification permission request timed out.'}`,
        };
      }
    }
    console.log('[Push Debug] Step 1/7: Permission result:', permission);

    if (permission !== 'granted') {
      return {
        success: false,
        error:
          permission === 'denied'
            ? 'Notifications were blocked in your browser. Please click the site settings/lock icon in your URL address bar and allow notifications.'
            : 'Notification permission was not granted by the browser.',
      };
    }

    // Step 2: Register & activate Service Worker
    console.log('[Push Debug] Step 2/7: Service worker registration & activation check');
    const registration = await ensureActiveServiceWorker();
    if (!registration) {
      return {
        success: false,
        error: 'Service Worker failed to activate. Please refresh the page and try again.',
      };
    }

    if (!('pushManager' in registration)) {
      return {
        success: false,
        error: 'PushManager API is not available on this browser service worker registration.',
      };
    }
    console.log('[Push Debug] Step 2/7: Service worker active verified. Scope:', registration.scope);

    // Step 3: VAPID public key conversion
    console.log('[Push Debug] Step 3/7: VAPID conversion');
    const vapidKey = getVapidPublicKey();
    if (!vapidKey) {
      return { success: false, error: 'VAPID public key is missing from environment configuration.' };
    }
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);
    console.log('[Push Debug] Step 3/7: VAPID key converted successfully. ByteLength:', applicationServerKey.byteLength);

    // Step 4: PushManager subscription
    console.log('[Push Debug] Step 4/7: PushManager subscription started');
    let pushSubscription: PushSubscription | null = null;

    try {
      const existingSub = await withTimeout(
        registration.pushManager.getSubscription(),
        4000,
        'Checking existing subscription timed out'
      );

      if (existingSub) {
        console.log('[Push Debug] Found existing push subscription:', existingSub.endpoint);
        const existingKey = existingSub.getKey('p256dh');
        if (existingKey) {
          pushSubscription = existingSub;
        } else {
          console.warn('[Push Debug] Existing subscription missing cryptographic keys. Unsubscribing...');
          await existingSub.unsubscribe().catch(() => {});
        }
      }
    } catch (checkErr) {
      console.warn('[Push Debug] Notice while checking existing subscription:', checkErr);
    }

    if (!pushSubscription) {
      try {
        pushSubscription = await withTimeout(
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as unknown as BufferSource,
          }),
          12000,
          'PushManager subscription timed out waiting for browser push service'
        );
      } catch (subErr: unknown) {
        const errorObj = subErr as (Error & { code?: number });
        console.warn('[Push Debug] Direct subscription attempt failed:', {
          name: errorObj.name,
          message: errorObj.message,
          code: errorObj.code,
        });

        // If conflict with existing subscription, reset and retry
        try {
          const oldSub = await registration.pushManager.getSubscription();
          if (oldSub) {
            console.log('[Push Debug] Clearing old subscription before retry...');
            await oldSub.unsubscribe().catch(() => {});
          }
          pushSubscription = await withTimeout(
            registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey as unknown as BufferSource,
            }),
            10000,
            'PushManager re-subscription timed out'
          );
        } catch (retryErr: unknown) {
          const retryErrorObj = retryErr as (Error & { code?: number });
          console.error('[Push Debug] ❌ Step 4 PushManager.subscribe failed after reset:', {
            name: retryErrorObj.name,
            message: retryErrorObj.message,
            code: retryErrorObj.code,
            stack: retryErrorObj.stack,
          });

          const isPushServiceErr =
            retryErrorObj.message?.toLowerCase().includes('push service error') ||
            retryErrorObj.name === 'AbortError';

          const errorMessage = isPushServiceErr
            ? 'Browser Push Service error: The browser push service could not establish a connection. If on iPad/iPhone, ensure Credzo CRM is launched from your Home Screen (PWA mode). If on PC, check notification permissions in browser and OS settings.'
            : `Push subscription error (${retryErrorObj.name}): ${retryErrorObj.message || 'Push service registration failed.'}`;

          return {
            success: false,
            error: errorMessage,
          };
        }
      }
    }

    if (!pushSubscription || !pushSubscription.endpoint) {
      return { success: false, error: 'PushManager failed to return a valid subscription endpoint.' };
    }
    console.log('[Push Debug] Step 4/7: PushManager subscription obtained:', pushSubscription.endpoint);

    // Step 5: Extract subscription keys
    console.log('[Push Debug] Step 5/7: Extracting subscription keys');
    const rawP256dh = pushSubscription.getKey('p256dh');
    const rawAuth = pushSubscription.getKey('auth');

    if (!rawP256dh || !rawAuth) {
      return { success: false, error: 'Failed to extract cryptographic subscription keys (P256DH / Auth) from browser.' };
    }

    const p256dh = btoa(String.fromCharCode(...new Uint8Array(rawP256dh)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const auth = btoa(String.fromCharCode(...new Uint8Array(rawAuth)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const deviceName = getFriendlyDeviceName();
    const userAgent = navigator.userAgent;
    console.log('[Push Debug] Step 5/7: Cryptographic keys extracted successfully. Device:', deviceName);

    // Step 6: Supabase session & user resolution
    console.log('[Push Debug] Step 6/7: Resolving Supabase auth session');
    let effectiveUserId = userId;
    let effectiveOrgId = organizationId;

    if (!effectiveUserId || !effectiveOrgId) {
      const sessionResult = await withTimeout(
        supabase.auth.getSession(),
        6000,
        'Supabase getSession timed out'
      );
      const authUser = sessionResult.data?.session?.user;
      if (!authUser) {
        return { success: false, error: 'Authenticated user session not found. Please log in again.' };
      }
      effectiveUserId = authUser.id;

      if (!effectiveOrgId) {
        const profileRes = await withTimeout(
          Promise.resolve(
            supabase.from('profiles').select('organization_id').eq('id', effectiveUserId).maybeSingle()
          ),
          6000,
          'Supabase fetch profile organization timed out'
        );
        effectiveOrgId = profileRes.data?.organization_id;
      }
    }

    if (!effectiveUserId || !effectiveOrgId) {
      return { success: false, error: 'Organization ID not found for current user session.' };
    }

    console.log('[Push Debug] Step 6/7: Supabase session verified:', {
      userId: effectiveUserId,
      organizationId: effectiveOrgId,
    });

    // Step 7: Save / Upsert subscription in Supabase database
    console.log('[Push Debug] Step 7/7: Saving subscription to Supabase push_subscriptions table');
    const upsertRes = await withTimeout(
      Promise.resolve(
        supabase.from('push_subscriptions').upsert(
          {
            user_id: effectiveUserId,
            organization_id: effectiveOrgId,
            endpoint: pushSubscription.endpoint,
            p256dh,
            auth,
            device_name: deviceName,
            user_agent: userAgent,
            is_active: true,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,endpoint',
          }
        )
      ),
      10000,
      'Saving subscription to Supabase timed out'
    );

    if (upsertRes.error) {
      console.error('[Push Debug] ❌ Step 7 DB upsert failed:', upsertRes.error);
      return { success: false, error: `Database error (${upsertRes.error.code}): ${upsertRes.error.message}` };
    }

    console.log('[Push Debug] Step 7/7: Subscription record successfully saved in database');
    const duration = Date.now() - startTime;
    console.log(`[Push Debug] Enable flow completed successfully in ${duration}ms`);

    return { success: true, subscription: pushSubscription };
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error('[Push Debug] ❌ Unexpected error in enable flow:', {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack,
    });
    return {
      success: false,
      error: errorObj.message || 'An unexpected error occurred during push notification setup.',
    };
  }
}

/**
 * Unsubscribes current device from browser PushManager and deactivates subscription in database.
 */
export async function unsubscribeStaffFromPush(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await getCurrentPushSubscription();
    if (subscription) {
      await subscription.unsubscribe().catch(() => {});

      if (isSupabaseConfigured()) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .match({ user_id: userId, endpoint: subscription.endpoint });
      }
    }
    return { success: true };
  } catch (err: unknown) {
    console.error('[Credzo Push] Unsubscribe error:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to unsubscribe.' };
  }
}

/**
 * Checks whether the current device is actively subscribed and recorded in DB.
 */
export async function checkStaffPushSubscriptionStatus(
  userId: string
): Promise<{
  isSubscribed: boolean;
  permission: NotificationPermissionState;
  deviceLabel: string;
  endpoint?: string;
}> {
  const permission = getNotificationPermissionState();
  const deviceLabel = getFriendlyDeviceName();

  console.log('[Credzo Push Debug] checkStaffPushSubscriptionStatus:', {
    userId,
    permission,
    deviceLabel,
    hasNotification: typeof window !== 'undefined' && 'Notification' in window,
    nativePermission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
    hasServiceWorker: typeof window !== 'undefined' && 'serviceWorker' in navigator,
    hasPushManager: typeof window !== 'undefined' && 'PushManager' in window,
  });

  if (permission !== 'granted') {
    return { isSubscribed: false, permission, deviceLabel };
  }

  const subscription = await getCurrentPushSubscription();
  console.log('[Credzo Push Debug] Existing push subscription on device:', subscription ? subscription.endpoint : 'None');

  if (!subscription) {
    return { isSubscribed: false, permission, deviceLabel };
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint)
        .maybeSingle();

      if (error) {
        console.warn('[Credzo Push Debug] Error checking subscription in Supabase DB:', error.message);
      }

      const active = Boolean(data?.is_active);
      console.log('[Credzo Push Debug] Subscription DB record active status:', active);

      return {
        isSubscribed: active,
        permission,
        deviceLabel,
        endpoint: subscription.endpoint,
      };
    } catch (err) {
      console.warn('[Credzo Push Debug] DB check exception:', err);
    }
  }

  return {
    isSubscribed: true,
    permission,
    deviceLabel,
    endpoint: subscription.endpoint,
  };
}

// ==============================================================================
// Push Notification Dispatcher & Predefined Event Templates
// ==============================================================================

export type NotificationEventType =
  | 'NEW_LEAD'
  | 'FOLLOW_UP_DUE'
  | 'FOLLOW_UP_OVERDUE'
  | 'LEAD_GOING_COLD'
  | 'DOCUMENT_PENDING'
  | 'APPLICATION_STATUS'
  | 'HIGH_VALUE_LEAD';

export interface PushNotificationPayload {
  title: string;
  body: string;
  type: NotificationEventType | string;
  url: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export interface SendPushNotificationOptions {
  targetUserId?: string;
  targetUserIds?: string[];
  targetRole?: 'ADMIN' | 'STAFF' | 'ALL';
  allOrganizationStaff?: boolean;
  organizationId?: string;
  notification: PushNotificationPayload;
}

/**
 * Calls the Supabase Edge Function to dispatch push notifications to registered devices.
 */
export async function dispatchPushNotification(
  options: SendPushNotificationOptions
): Promise<{
  success: boolean;
  sent?: number;
  totalSubscriptions?: number;
  failed?: number;
  message?: string;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        target_user_id: options.targetUserId,
        target_user_ids: options.targetUserIds,
        target_role: options.targetRole,
        all_organization_staff: options.allOrganizationStaff,
        organization_id: options.organizationId,
        notification: options.notification,
      },
    });

    if (error) {
      console.warn('[Credzo Push] Edge function invocation error:', error);
      return { success: false, error: error.message || 'Failed to dispatch push notification.' };
    }

    return {
      success: Boolean(data?.success),
      sent: data?.sent ?? 0,
      totalSubscriptions: data?.totalSubscriptions ?? 0,
      failed: data?.failed ?? 0,
      message: data?.message,
    };
  } catch (err: unknown) {
    console.error('[Credzo Push] Dispatch error:', err);
    return { success: false, error: (err as Error)?.message || 'Dispatch error.' };
  }
}

// ==============================================================================
// 7 Notification Templates (Exact Platform Requirements)
// ==============================================================================

export const NotificationTemplates = {
  /**
   * 1. NEW LEAD
   * Title: "🔔 New Lead Received"
   * Body: "Rahul Sharma is interested in a ₹15L home loan."
   */
  newLead(customerName: string, amount: number, loanType: string, leadId?: string): PushNotificationPayload {
    const formattedAmount = formatIndianCurrency(amount);
    const loanName = loanType.charAt(0).toUpperCase() + loanType.slice(1);
    return {
      title: '🔔 New Lead Received',
      body: `${customerName} is interested in a ${formattedAmount} ${loanName} loan.`,
      type: 'NEW_LEAD',
      url: leadId ? `/admin/leads/${leadId}` : '/admin/leads',
      tag: `lead-${leadId || 'new'}`,
      data: { leadId, customerName, amount, loanType },
    };
  },

  /**
   * 2. FOLLOW-UP DUE
   * Title: "⏰ Follow-up Due"
   * Body: "You have a follow-up scheduled with Rahul Sharma."
   */
  followUpDue(customerName: string, leadId?: string, followUpId?: string): PushNotificationPayload {
    return {
      title: '⏰ Follow-up Due',
      body: `You have a follow-up scheduled with ${customerName}.`,
      type: 'FOLLOW_UP_DUE',
      url: leadId ? `/admin/leads/${leadId}` : '/admin/follow-ups',
      tag: `followup-${followUpId || leadId || 'due'}`,
      data: { leadId, followUpId, customerName },
    };
  },

  /**
   * 3. FOLLOW-UP OVERDUE
   * Title: "⚠️ Follow-up Overdue"
   * Body: "Your follow-up with Rahul Sharma is overdue."
   */
  followUpOverdue(customerName: string, leadId?: string, followUpId?: string): PushNotificationPayload {
    return {
      title: '⚠️ Follow-up Overdue',
      body: `Your follow-up with ${customerName} is overdue.`,
      type: 'FOLLOW_UP_OVERDUE',
      url: leadId ? `/admin/leads/${leadId}` : '/admin/follow-ups',
      tag: `followup-${followUpId || leadId || 'overdue'}`,
      data: { leadId, followUpId, customerName },
    };
  },

  /**
   * 4. LEAD GOING COLD
   * Title: "🥶 Lead Going Cold"
   * Body: "Rahul Sharma has not been contacted for 3 days."
   */
  leadGoingCold(customerName: string, daysInactive = 3, leadId?: string): PushNotificationPayload {
    return {
      title: '🥶 Lead Going Cold',
      body: `${customerName} has not been contacted for ${daysInactive} days.`,
      type: 'LEAD_GOING_COLD',
      url: leadId ? `/admin/leads/${leadId}` : '/admin/leads',
      tag: `lead-cold-${leadId || 'alert'}`,
      data: { leadId, customerName, daysInactive },
    };
  },

  /**
   * 5. DOCUMENT PENDING
   * Title: "📄 Documents Pending"
   * Body: "Rahul Sharma still has pending documents."
   */
  documentPending(customerName: string, leadId?: string): PushNotificationPayload {
    return {
      title: '📄 Documents Pending',
      body: `${customerName} still has pending documents.`,
      type: 'DOCUMENT_PENDING',
      url: leadId ? `/admin/leads/${leadId}` : '/admin/leads',
      tag: `lead-doc-${leadId || 'pending'}`,
      data: { leadId, customerName },
    };
  },

  /**
   * 6. APPLICATION STATUS
   * Title: "✅ Application Updated"
   * Body: "Rahul Sharma's application status has changed."
   */
  applicationStatus(customerName: string, newStatus?: string, leadId?: string): PushNotificationPayload {
    const statusNote = newStatus ? ` to ${newStatus}` : '';
    return {
      title: '✅ Application Updated',
      body: `${customerName}'s application status has changed${statusNote}.`,
      type: 'APPLICATION_STATUS',
      url: leadId ? `/admin/leads/${leadId}` : '/admin/leads',
      tag: `lead-status-${leadId || 'updated'}`,
      data: { leadId, customerName, newStatus },
    };
  },

  /**
   * 7. HIGH VALUE LEAD
   * Title: "🔥 High-Value Lead"
   * Body: "New ₹50L home-loan enquiry received."
   */
  highValueLead(customerName: string, amount: number, loanType = 'home', leadId?: string): PushNotificationPayload {
    const formattedAmount = formatIndianCurrency(amount);
    const loanName = loanType.charAt(0).toUpperCase() + loanType.slice(1);
    return {
      title: '🔥 High-Value Lead',
      body: `New ${formattedAmount} ${loanName} loan enquiry received from ${customerName}.`,
      type: 'HIGH_VALUE_LEAD',
      url: leadId ? `/admin/leads/${leadId}` : '/admin/leads',
      tag: `lead-highval-${leadId || 'alert'}`,
      data: { leadId, customerName, amount, loanType },
    };
  },
};
