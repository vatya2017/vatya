// Service Worker - 오프라인 지원
const CACHE_NAME = 'vatya-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/업무-대시보드.html',
  '/google-auth.js',
  '/google-calendar-api.js',
  '/sync-manager.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://accounts.google.com/gsi/client'
];

// 설치 이벤트
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch 이벤트 - 캐시 우선
self.addEventListener('fetch', event => {
  // Google API 요청은 네트워크 우선
  if (event.request.url.includes('googleapis.com') ||
      event.request.url.includes('accounts.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            return caches.match('/index.html');
          });
      })
  );
});
