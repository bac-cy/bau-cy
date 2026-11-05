/* Cove ?ㅽ봽?쇱씤 ?쒕퉬???뚯빱: ?명꽣?룹씠 ?섎뒗 怨녹뿉????踰??댁뼱 ?먮㈃, ?댄썑 ??댄뙆???놁씠??媛숈? 二쇱냼媛 ?대젮??
   쨌 ?ㅼ튂?????ъ씠???뚯씪 ?꾨?(precache.json)瑜???ν븯怨? 湲瑗?援ш? ?고듃)? 泥섏쓬 ??????ν빐??
   쨌 ??λ맂 ?뚯씪??癒쇱? 蹂댁뿬 二쇨퀬, ?명꽣?룹씠 ?덉쑝硫??ㅼ뿉????踰꾩쟾?쇰줈 媛깆떊?댁슂(?ㅼ쓬??????諛섏쁺).
   쨌 ?곸긽? 遺遺??ъ깮(Range)????λ낯?먯꽌 ?섎씪??以섏슂. */
const V = 'cove-v15';
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
  if (hit) { fetch(req, { cache: 'no-cache' }).then((r) => { if (r && r.ok && r.status === 200) cache.put(key, r.clone()); }).catch(() => {}); return hit; }      // ??λ낯 癒쇱?, ?ㅼ뿉??媛깆떊
  try { const r = await fetch(req); if (r && r.ok) cache.put(key, r.clone()); return r; } catch (_) { return new Response('offline', { status: 503 }); }
}
async function runtime(req) {   // 援ш? ?고듃: ??踰?諛쏆쑝硫???ν빐 ?먭퀬 ?댄썑????λ낯 ?ъ슜
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
