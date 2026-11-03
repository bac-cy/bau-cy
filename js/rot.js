/* 360° 회전 장면: 스크롤 진행도 → 키샷 360° 렌더(assets/cove360/{높이}_{회전}.webp)의 회전 각도.
   · 인접한 두 장을 겹쳐 그려서(크로스페이드) 20장이어도 부드럽게 돌아요.
   · 같은 각도로 눈금 다이얼이 돌고, 아래 규격 3칸 중 지금 각도에 맞는 칸이 진하게 켜져요. */
(() => {
  const root = document.getElementById('rot'); if (!root) return;
  const cv = root.querySelector('.rot__cv'), cx = cv.getContext('2d');
  const ticks = root.querySelector('.rot__ticks'), degEl = root.querySelector('.deg'), cols = [...root.querySelectorAll('.rot__col')];
  const N = 20, V = 11, DIR = 'assets/cove360s/', U0 = 10;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const imgs = new Array(N).fill(null);
  let started = false, w = 0, h = 0, p = 0, pt = 0, lastKey = '';

  function load() {
    if (started) return; started = true;
    for (let i = 0; i < N; i++) {
      const u = (U0 + i) % N, im = new Image(); im.decoding = 'async';
      im.onload = () => { imgs[u] = im; lastKey = ''; };
      im.src = DIR + V + '_' + u + '.webp';
    }
  }
  new IntersectionObserver(([en]) => { if (en.isIntersecting) load(); }, { rootMargin: '1600px 0px' }).observe(root);

  function fit() {
    const d = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    w = W; h = H; cv.width = Math.round(W * d); cv.height = Math.round(H * d); cx.setTransform(d, 0, 0, d, 0, 0); lastKey = '';
  }
  new ResizeObserver(fit).observe(cv); fit();

  // 눈금: 10° 마다 하나, 30° 마다 굵게. 한 바퀴를 한 그룹으로 만들어 돌린다.
  { let s = ''; for (let a = 0; a < 360; a += 10) { const big = a % 30 === 0, r0 = 280, r1 = big ? 296 : 289, t = a * Math.PI / 180; s += `<line class="tk${big ? ' big' : ''}" x1="${(300 + Math.sin(t) * r0).toFixed(1)}" y1="${(300 - Math.cos(t) * r0).toFixed(1)}" x2="${(300 + Math.sin(t) * r1).toFixed(1)}" y2="${(300 - Math.cos(t) * r1).toFixed(1)}"/>`; } ticks.innerHTML = s; }

  function draw(f) {
    const a = Math.floor(f) % N, b = (a + 1) % N, k = f - Math.floor(f);
    const ia = imgs[a] || imgs[b] || imgs.find(Boolean); if (!ia || !w) return;
    const ib = imgs[b] || ia;
    const key = a + ':' + k.toFixed(2) + ':' + w + 'x' + h + (imgs.filter(Boolean).length);
    if (key === lastKey) return; lastKey = key;
    const W = ia.naturalWidth, H = ia.naturalHeight, sx = W * 0.0333, sy = H * 0.0405, sw = W * 0.9333, sh = H * 0.8919;       // Cove가 있는 가운데 부분만 잘라 씀
    let dw = w, dh = w * sh / sw; if (dh > h) { dh = h; dw = h * sw / sh; }
    const dx = (w - dw) / 2, dy = h - dh;
    cx.clearRect(0, 0, w, h);
    cx.globalAlpha = 1; cx.drawImage(ia, sx, sy, sw, sh, dx, dy, dw, dh);
    if (ib !== ia && k > 0.01) { cx.globalAlpha = k; cx.drawImage(ib, sx, sy, sw, sh, dx, dy, dw, dh); cx.globalAlpha = 1; }
  }

  /* 끌어서 돌리기: 스크롤 각도에 더해지는 덧각도(off). 놓고 3초 뒤 천천히 스크롤 각도로 돌아옴. 세로로 쓸면 페이지 스크롤(touch-action: pan-y) */
  let off = 0, dragging = false, dX = 0, dMoved = false, holdAt = 0;
  const view = root.querySelector('.rot__view');
  view.addEventListener('pointerdown', (e) => { if (e.button > 0) return; dragging = true; dMoved = false; dX = e.clientX; });
  addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - dX; if (!dMoved && Math.abs(dx) < 4) return; dMoved = true; dX = e.clientX; off += dx * -0.6; holdAt = performance.now(); view.classList.add('is-drag'); }, { passive: true });
  const endDrag = () => { dragging = false; view.classList.remove('is-drag'); holdAt = performance.now(); };
  addEventListener('pointerup', endDrag, { passive: true }); addEventListener('pointercancel', endDrag, { passive: true });

  let on = -1;
  function frame() {
    requestAnimationFrame(frame);
    const r = root.getBoundingClientRect(); if (r.bottom < -50 || r.top > innerHeight + 50) return;
    pt = clamp(-r.top / Math.max(1, r.height - innerHeight));
    p += (pt - p) * 0.14; if (Math.abs(pt - p) < 0.0004) p = pt;
    if (!dragging && performance.now() - holdAt > 3000 && off !== 0) { off *= 0.94; if (Math.abs(off) < 0.3) off = 0; }
    const angle = (((p * 360 + off) % 360) + 360) % 360;
    draw((U0 + angle / 360 * N) % N);
    ticks.setAttribute('transform', `rotate(${(-angle).toFixed(2)} 300 300)`);
    degEl.textContent = Math.round(angle) + '°';
    const idx = Math.min(cols.length - 1, Math.floor(angle / 360 * cols.length * 0.9999));
    if (idx !== on) { on = idx; cols.forEach((c, i) => c.classList.toggle('is-on', i === idx)); }
  }
  requestAnimationFrame(frame);
})();
