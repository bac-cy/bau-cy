/* 디테일 효과 미리보기 (?fx=1 일 때만 불러옴) — 스프링 트레일 · 필름 입자 · 제목 공개 · 자석 버튼 · 카드 빛/기울기 */
(() => {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.documentElement.classList.add('fx');
  // 1) 필름 입자
  const g = document.createElement('div'); g.className = 'fx-grain'; g.setAttribute('aria-hidden', 'true'); document.body.appendChild(g);
  // 2) 스프링 트레일 커서 (마우스 있는 기기만)
  if (fine) {
    const cv = document.createElement('canvas'), ring = document.createElement('div'); cv.className = 'fx-trail'; ring.className = 'fx-ring'; cv.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
    document.body.append(cv, ring);
    const x = cv.getContext('2d'); let W = 0, H = 0, dpr = 1;
    const fit = () => { dpr = Math.min(devicePixelRatio, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }; fit(); addEventListener('resize', fit);
    const N = 34, pts = Array.from({ length: N }, () => ({ x: -99, y: -99, vx: 0, vy: 0 })); let mx = -99, my = -99, started = false, lastMove = 0;
    addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; mx = e.clientX; my = e.clientY; lastMove = performance.now(); if (!started) { started = true; pts.forEach(p => { p.x = mx; p.y = my; }); } ring.style.transform = `translate(${mx}px, ${my}px)`; }, { passive: true });
    const hot = 'a, button, [role="button"], .feature, .sim__treat, .gallery__film';
    document.addEventListener('pointerover', (e) => { if (e.target.closest && e.target.closest(hot)) ring.classList.add('on'); });
    document.addEventListener('pointerout', (e) => { if (e.target.closest && e.target.closest(hot)) ring.classList.remove('on'); });
    (function tick(now) {
      requestAnimationFrame(tick);
      if (!started || now - lastMove > 2500) { if (started) x.clearRect(0, 0, W, H); return; }
      x.clearRect(0, 0, W, H); let tx = mx, ty = my;
      pts.forEach((p, i) => { const k = i ? .42 : .5; p.vx = (p.vx + (tx - p.x) * k) * .5; p.vy = (p.vy + (ty - p.y) * k) * .5; p.x += p.vx; p.y += p.vy; tx = p.x; ty = p.y; });
      x.lineCap = x.lineJoin = 'round';
      for (let i = 1; i < N; i++) { const a = pts[i - 1], b = pts[i], t = 1 - i / N; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.strokeStyle = `rgba(150,128,205,${(.34 * t).toFixed(3)})`; x.lineWidth = 2 + 13 * t; x.stroke(); }
    })(performance.now());
  }
  // 3) 제목이 마스크 안에서 올라오기
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: .3 });
  document.querySelectorAll('.statement, .detail h3, .principles span').forEach(el => {
    const mask = document.createElement('span'), inn = document.createElement('span'); mask.className = 'fx-mask'; inn.className = 'fx-in';
    while (el.firstChild) inn.appendChild(el.firstChild); mask.appendChild(inn); el.appendChild(mask); el.classList.add('fx-t'); io.observe(mask);
  });
  if (!fine) return;
  // 4) 자석 버튼
  document.querySelectorAll('.sim__motions button, .nav__links a').forEach(b => {
    b.classList.add('fx-mag');
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * .32).toFixed(1)}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
  // 5) 카드: 따라오는 빛 + 1~2도 기울기 (Key Features)
  document.querySelectorAll('.feature').forEach(c => {
    c.classList.add('fx-card');
    c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height; c.style.setProperty('--mx', px * 100 + '%'); c.style.setProperty('--my', py * 100 + '%'); c.style.transform = `perspective(900px) rotateY(${((px - .5) * 5).toFixed(2)}deg) rotateX(${((.5 - py) * 5).toFixed(2)}deg) translateY(-3px)`; });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
})();
