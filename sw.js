/* 오프라인 캐시 전용 서비스워커.
   index.html은 이 파일 없이도 완전히 동작한다 — 등록에 실패하면 조용히 넘어간다.
   서비스워커만은 별도 파일이어야 해서(data:/blob:에서 등록 불가) 어쩔 수 없이 분리했다. */
const CACHE = 'beatbox-v0.1.5';
const ASSETS = ['.', 'index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 네트워크 우선, 실패하면 캐시 — 새로고침하면 항상 최신을 받고 오프라인에서도 열린다 */
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
