// ==============================================================================
// Credzo Finance CRM — Web Push Service Worker
// Scope: /
// Handles Web Push event payloads, notification dispatch, and client routing.
// ==============================================================================

const SW_VERSION = 'v1.0.0-2026';
const DEFAULT_ICON = '/icons/icon-192.png';
const DEFAULT_BADGE = '/icons/badge-72.png';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for old service workers to exit
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim control over all open clients immediately
  event.waitUntil(self.clients.claim());
});

// ==============================================================================
// Push Event Handler
// Triggered by browser when a Web Push payload arrives from push service (FCM/Mozilla/Apple)
// ==============================================================================
self.addEventListener('push', (event) => {
  let payload = {
    title: '🔔 Credzo CRM Alert',
    body: 'You have a new update in Credzo CRM.',
    icon: DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    tag: 'credzo-notification',
    data: {
      url: '/admin',
    },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        title: parsed.title || payload.title,
        body: parsed.body || payload.body,
        icon: parsed.icon || payload.icon,
        badge: parsed.badge || payload.badge,
        tag: parsed.tag || parsed.type || payload.tag,
        data: parsed.data || { url: parsed.url || '/admin' },
      };
      if (parsed.url && !payload.data.url) {
        payload.data.url = parsed.url;
      }
    } catch {
      // If payload is plain text
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    data: payload.data,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true, // Keep notification visible until dismissed or clicked
    actions: [
      { action: 'open', title: 'Open CRM' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// ==============================================================================
// Notification Click Handler
// Routes user to the specific lead, follow-up, or dashboard page upon clicking
// ==============================================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin';
  const resolvedUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there is already a window/tab open with the application
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client && client.url !== resolvedUrl) {
              return client.navigate(resolvedUrl);
            }
          });
        }
      }

      // If no window is open, open a new browser tab/window
      if (self.clients.openWindow) {
        return self.clients.openWindow(resolvedUrl);
      }
    })
  );
});

// ==============================================================================
// Push Subscription Change Handler
// If the browser invalidates or refreshes push subscription keys
// ==============================================================================
self.addEventListener('pushsubscriptionchange', (event) => {
  console.info('[Credzo SW] Push subscription expired or changed by browser.');
});
