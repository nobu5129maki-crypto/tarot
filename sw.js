// 最小限の Service Worker (PWA インストール有効化用)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // ネットワークリクエストをそのまま通す (パススルー)
  event.respondWith(fetch(event.request));
});