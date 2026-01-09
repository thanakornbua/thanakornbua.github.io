// Service Worker for TCAS70 Dashboard
// Provides offline support and caching for all platforms

const CACHE_NAME = 'tcas70-v2';
const urlsToCache = [
  '/index.html',
  '/timer.html',
  '/styles.css',
  '/data.json',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .catch((error) => {
        console.log('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always try network first for timetable-data.json so timetable updates are accurate
  if (url.pathname.endsWith('/timetable-data.json')) {
    event.respondWith(
      fetch(event.request.clone())
        .then((response) => {
          if (response && response.status === 200) {
            const toCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Default: cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => caches.match('/index.html'))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Background sync (for future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

function syncData() {
  return fetch('/data.json')
    .then(response => response.json())
    .then(data => {
      return caches.open(CACHE_NAME)
        .then(cache => cache.put('/data.json', new Response(JSON.stringify(data))));
    });
}
