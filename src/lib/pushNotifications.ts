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

/**
 * Registers the Service Worker at `/sw.js`.
 */
export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[Credzo Push Debug] Service Worker API not available.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.info('[Credzo Push Debug] Service Worker registered successfully. Scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('[Credzo Push Debug] Service Worker registration error:', error);
    return null;
  }
}

/**
 * Obtains current browser PushSubscription if registered (Non-blocking).
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    // Use getRegistration() instead of ready to avoid hanging if SW is not active yet
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !('pushManager' in registration)) return null;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn('[Credzo Push Debug] Error checking push subscription:', err);
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
  userId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
  if (!isPushNotificationSupported()) {
    const ios = getIOSPushStatus();
    if (ios.isIOS && !ios.isStandalone) {
      return {
        success: false,
        error:
          'Apple iOS requires adding this app to your Home Screen before enabling notifications. Tap Share (⎋) -> Add to Home Screen.',
      };
    }
    return { success: false, error: 'Web Push is not supported on this browser.' };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials are not configured.' };
  }

  try {
    // 1. Request native browser notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error:
          permission === 'denied'
            ? 'Notifications were blocked in your browser. Please click the site settings/lock icon in your URL bar and allow notifications.'
            : 'Notification permission was not granted.',
      };
    }

    // 2. Register Service Worker
    const registration = await registerPushServiceWorker();
    if (!registration) {
      return { success: false, error: 'Failed to initialize Service Worker.' };
    }

    // 3. Subscribe with VAPID Application Server Key
    const vapidKey = getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    let pushSubscription = await registration.pushManager.getSubscription();
    if (!pushSubscription) {
      pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });
    }

    // 4. Extract subscription keys
    const rawP256dh = pushSubscription.getKey('p256dh');
    const rawAuth = pushSubscription.getKey('auth');

    if (!rawP256dh || !rawAuth) {
      return { success: false, error: 'Failed to obtain cryptographic subscription keys.' };
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

    // 5. Store / Upsert subscription in Supabase database
    const { error: upsertError } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        organization_id: organizationId,
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
    );

    if (upsertError) {
      console.error('[Credzo Push] Failed to save push subscription to DB:', upsertError);
      return { success: false, error: `Failed to save subscription: ${upsertError.message}` };
    }

    return { success: true, subscription: pushSubscription };
  } catch (err: unknown) {
    console.error('[Credzo Push] Unexpected subscription error:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to subscribe to push notifications.' };
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
