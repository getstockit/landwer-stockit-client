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
