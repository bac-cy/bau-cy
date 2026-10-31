/* ==========================================================
   Design — Engineering: 스크롤하면 Cove 안쪽 부품이 층층이 펼쳐져요.
   · 스크롤에 맞춰 분해 이미지 60장이 재생돼요. (조립된 모습 → 부품이 모두 펼쳐진 모습)
   · 펼쳐진 뒤 부품에 마우스를 올리면(모바일은 누르면) 이름과 역할이 보여요.
   · 부품 이름·설명은 assets/eng/eng.json 에서 읽어요.
   ========================================================== */
const root = document.getElementById('engineering');
if (root) {
  const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
  const tip = root.querySelector('.eng__tip');
  const view = root;                                              // 카드의 이미지 칸
  const hint = root.querySelector('.eng__hint');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(hover: none)').matches;
  if (touch && hint) hint.textContent = '펼쳐진 부품을 눌러 보세요';
  let data = null, imgs = [], loaded = 0, started = false;
  let frame = 0, goal = 0, hoverName = null, W = 640, H = 960, dpr = 1;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);

  function load() {
    if (started) return; started = true;
    fetch('assets/eng/eng.json').then(r => r.json()).then(d => {
      data = d; W = d.w; H = d.h;
      for (let i = 0; i < d.n; i++) { const im = new Image(); im.decoding = 'async'; im.src = `assets/eng/${String(i).padStart(2, '0')}.webp`; im.onload = () => { loaded++; dirty = true; }; imgs.push(im); }
      root.classList.add('is-ready'); fit();
    }).catch(() => {});
  }
  new IntersectionObserver(([e]) => { if (e.isIntersecting) load(); }, { rootMargin: '1200px 0px' }).observe(root);

  function fit() {
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); dirty = true;
  }
  new ResizeObserver(fit).observe(cv);

  let dirty = true;
  function progress() {                                             // 카드가 화면 아래에서 올라와 가운데쯤 오는 동안 펼쳐진다
    const r = root.getBoundingClientRect(), vh = window.innerHeight, c = r.top + r.height / 2;
    return clamp((vh * 0.88 - c) / (vh * 0.42), 0, 1);
  }
  function draw() {
    if (!data) return;
    const f = Math.round(frame), im = imgs[f] && imgs[f].complete && imgs[f].naturalWidth ? imgs[f] : imgs.slice(0, f + 1).reverse().find(i => i.complete && i.naturalWidth);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    if (im) ctx.drawImage(im, 0, 0, cv.width, cv.height);
    // 펼쳐진 뒤에는 부품 위치에 작은 점
    if (f >= 40) {
      ctx.fillStyle = 'rgba(125,106,168,.55)';
      for (const [k, v] of Object.entries(data.frames[f])) { ctx.beginPath(); ctx.arc(v[0] * cv.width, v[1] * cv.height, (k === hoverName ? 5.5 : 2.6) * dpr, 0, 7); if (k === hoverName) ctx.fillStyle = '#5b43a6'; ctx.fill(); ctx.fillStyle = 'rgba(125,106,168,.55)'; }
    }
  }
  function nearest(x, y) {                                             // x, y: 캔버스 안 0~1 위치
    if (!data || Math.round(frame) < 40) return null;
    const a = data.frames[Math.round(frame)], r = cv.getBoundingClientRect(); let best = null, bd = (34 / r.height) ** 2;
    for (const [k, v] of Object.entries(a)) { const dx = (v[0] - x) * (r.width / r.height), dy = v[1] - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = k; } }
    return best;
  }
  function show(name, px, py) {
    hoverName = name; dirty = true;
    if (!name) { tip.classList.remove('is-on'); return; }
    const n = data.names[name];
    tip.innerHTML = `<b></b><i></i><span></span>`; tip.children[0].textContent = name + (n.count > 1 ? ` ×${n.count}` : ''); tip.children[1].textContent = n.en; tip.children[2].textContent = n.desc;
    const rr = cv.getBoundingClientRect(), br = view.getBoundingClientRect();
    let left = rr.left - br.left + px, top = rr.top - br.top + py;
    tip.classList.add('is-on');
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    left = clamp(left + 16, 8, br.width - tw - 8); top = clamp(top - th / 2, 8, br.height - th - 8);
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  const pos = (e) => { const r = cv.getBoundingClientRect(); const px = e.clientX - r.left, py = e.clientY - r.top; return [px, py, px / r.width, py / r.height]; };
  cv.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; const [px, py, x, y] = pos(e); const n = nearest(x, y); if (n !== hoverName) show(n, px, py); else if (n) show(n, px, py); });
  cv.addEventListener('pointerleave', () => show(null));
  cv.addEventListener('click', (e) => { const [px, py, x, y] = pos(e); const n = nearest(x, y); show(n === hoverName && touch ? null : n, px, py); });

  let last = performance.now();
  (function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const r = root.getBoundingClientRect(); if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
    const p = reduced ? 1 : progress();
    goal = smooth(clamp(p, 0, 1)) * ((data ? data.n : 60) - 1);
    const nf = frame + (goal - frame) * Math.min(1, dt * 9);
    if (Math.abs(nf - frame) > 0.01) { frame = nf; dirty = true; } else if (frame !== goal) { frame = goal; dirty = true; }
    if (Math.round(frame) < 40 && hoverName) show(null);
    root.classList.toggle('is-open', Math.round(frame) >= 40);
    if (dirty) { dirty = false; draw(); }
  })(performance.now());
}
