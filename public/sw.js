// Minimal service worker — exists only to satisfy PWA installability checks
// (Chrome's "Add to Home Screen" / install banner looks for a registered SW).
//
// It intentionally does NOT cache any API responses or app shell files.
// This is an inventory app — showing a stale cached stock count after the
// app is offline-served would be actively misleading, not helpful. If real
// offline support is wanted later, add it deliberately with a clear strategy
// for invalidating inventory data, not as a side effect of installability.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// No fetch handler — every request passes straight through to the network.

// ─── Web Push ────────────────────────────────────────────────────────────
// Displays a system notification when the server sends a push payload
// (daily manager alert digest — low stock + supplier order-day reminders).
// This only fires for a Home Screen web app on iOS (browser tabs on iOS
// cannot receive push at all — see IosInstallHint.tsx); on Android/desktop
// it works the same whether installed or just open in a tab.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* non-JSON payload, ignore */ }

  const title = data.title || 'Stock-It · לנדוור';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    dir: 'rtl',
    lang: 'he',
    data: { url: data.url || '/alerts' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/alerts';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) { client.focus(); if ('navigate' in client) client.navigate(targetUrl); return; }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
