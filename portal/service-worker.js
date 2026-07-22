const CACHE_NAME = 'vanguard-portal-v2';
const STATIC_ASSETS = [
  '/portal/',
  '/portal/manifest.json',
  '/portal/icons/icon-192x192.png',
  '/portal/icons/icon-512x512.png',
  '/images/vanguard-logo.png',
];

const OFFLINE_PAGE = '/portal/';

// Install: cache static assets for offline support
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, stale-while-revalidate for static
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go to network for API calls — don't cache auth/data
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // For navigation requests: network-first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the latest version
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(OFFLINE_PAGE))
    );
    return;
  }

  // For static assets: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// Background sync: retry failed COI requests when back online
self.addEventListener('sync', event => {
  if (event.tag === 'coi-request-sync') {
    event.waitUntil(retryCOIRequests());
  }
});

async function retryCOIRequests() {
  // Placeholder for background sync logic
  // When implemented, pull queued requests from IndexedDB and retry
  console.log('Background sync: checking for queued COI requests');
}

// Periodic sync: refresh policy data in background
self.addEventListener('periodicsync', event => {
  if (event.tag === 'refresh-policies') {
    event.waitUntil(refreshPoliciesInBackground());
  }
});

async function refreshPoliciesInBackground() {
  console.log('Periodic sync: refreshing policy data');
}

// Push notifications: COI ready, policy renewals, etc.
self.addEventListener('push', event => {
  let data = { title: 'Vanguard Insurance', body: 'You have a new notification.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || '',
    icon: '/portal/icons/icon-192x192.png',
    badge: '/portal/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/portal/',
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Vanguard Insurance', options)
  );
});

// Handle notification click: open or focus the portal
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/portal/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes('/portal') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return clients.openWindow(targetUrl);
    })
  );
});
