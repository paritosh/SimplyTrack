
// Basic service worker for PWA and TWA compatibility

const CACHE_NAME = 'simplytrack-cache-v1';
const urlsToCache = [
  '/',
  // Add other important assets you want to pre-cache, e.g.:
  // '/_next/static/css/...', // Specific build files if known
  // '/_next/static/chunks/app/...', // Specific build files if known
  // '/icons/icon-192x192.png',
  // '/icons/icon-512x512.png'
  // Be careful with Next.js build hashes, they change.
  // More advanced caching would use dynamic caching or tools like Workbox.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Add core assets that are less likely to change frequently.
        // For Next.js, the main pages and JS chunks are more dynamic.
        // A full offline experience requires more sophisticated caching.
        return cache.addAll(urlsToCache.filter(url => !url.includes('_next/static'))); // Example: Cache root and icons
      })
      .catch(error => {
        console.error('Failed to open cache during install:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // For Next.js, be cautious about caching all _next/static requests
                // as they can fill up cache quickly with versioned files.
                // This example caches navigation requests (HTML) and specific assets.
                if (event.request.mode === 'navigate' || urlsToCache.includes(event.request.url)) {
                   cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          }
        ).catch(() => {
          // Basic offline fallback for navigation requests, if a root page is cached.
          if (event.request.mode === 'navigate' && urlsToCache.includes('/')) {
            return caches.match('/');
          }
          // If not a navigation request or root isn't cached, just let it fail (or provide specific fallback)
        });
      })
  );
});

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
});
