/* Cove 오프라인 서비스 워커: 인터넷이 되는 곳에서 한 번 열어 두면, 이후 와이파이 없이도 같은 주소가 열려요.
   · 설치할 때 사이트 파일 전부(precache.json)를 저장하고, 글꼴(구글 폰트)은 처음 쓸 때 저장해요.
   · 저장된 파일을 먼저 보여 주고, 인터넷이 있으면 뒤에서 새 버전으로 갱신해요(다음에 열 때 반영).
   · 영상은 부분 재생(Range)을 저장본에서 잘라서 줘요. */
const V = 'cove-v8';
const norm = (u) => { const x = new URL(u, self.location); return x.origin + x.pathname; };
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    let list = []; try { list = await (await fetch('precache.json', { cache: 'reload' })).json(); } catch (_) {}
    for (const u of list) { try { const r = await fetch(u, { cache: 'reload' }); if (r && r.ok) await c.put(norm(u), r); } catch (_) {} }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== V) await caches.delete(k); await self.clients.claim(); })());
});
async function rangeResp(req, res) {
  const buf = await res.arrayBuffer(), m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  let s = m && m[1] ? +m[1] : 0, e = m && m[2] ? +m[2] : buf.byteLength - 1; e = Math.min(e, buf.byteLength - 1);
  return new Response(buf.slice(s, e + 1), { status: 206, headers: { 'Content-Type': res.headers.get('Content-Type') || 'video/mp4', 'Content-Range': `bytes ${s}-${e}/${buf.byteLength}`, 'Content-Length': String(e - s + 1) } });
}
async function handle(req) {
  const cache = await caches.open(V), key = norm(req.url);
  let hit = await cache.match(key);
  if (!hit && req.mode === 'navigate') hit = await cache.match(norm('index.html')) || await cache.match(norm('./'));
  if (req.headers.has('range')) { if (hit) return rangeResp(req, hit); try { return await fetch(req); } catch (_) { return new Response('', { status: 504 }); } }
  if (hit) { fetch(req, { cache: 'no-cache' }).then((r) => { if (r && r.ok && r.status === 200) cache.put(key, r.clone()); }).catch(() => {}); return hit; }      // 저장본 먼저, 뒤에서 갱신
  try { const r = await fetch(req); if (r && r.ok) cache.put(key, r.clone()); return r; } catch (_) { return new Response('offline', { status: 503 }); }
}
async function runtime(req) {   // 구글 폰트: 한 번 받으면 저장해 두고 이후엔 저장본 사용
  const cache = await caches.open(V), hit = await cache.match(req);
  if (hit) return hit;
  try { const r = await fetch(req); if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()); return r; } catch (_) { return new Response('', { status: 504 }); }
}
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === self.location.origin) e.respondWith(handle(req));
  else if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) e.respondWith(runtime(req));
});
