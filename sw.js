// Service Worker - 오프라인 지원
const CACHE_NAME = 'vatya-v4';
const STATIC_CACHE = [
  '/google-auth.js',
  '/google-calendar-api.js',
  '/sync-manager.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 설치: 정적 JS만 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 전부 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Fetch: HTML은 항상 네트워크 우선, JS/CSS는 캐시 우선
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Google API: 항상 네트워크
  if (url.includes('googleapis.com') || url.includes('accounts.google.com')) return;

  // HTML: 네트워크 우선 → 실패 시 캐시
  if (event.request.destination === 'document' || url.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 정적 파일: 캐시 우선 → 없으면 네트워크
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(res => {
        if (res && res.status === 200)
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        return res;
      })
    )
  );
});
