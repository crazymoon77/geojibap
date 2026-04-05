// 캐시 버전 — 변경 시 모든 기기의 이전 캐시 자동 삭제
const CACHE_VERSION = 'v3'
const CACHE_NAME = `geojibap-${CACHE_VERSION}`

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  // 캐시 없이 항상 네트워크에서 가져옴
  event.respondWith(fetch(event.request))
})
