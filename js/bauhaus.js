/* 바우하우스 미리보기 (?bauhaus=1) */
(() => {
  const R = document.documentElement; R.classList.add('bauhaus');
  const $ = (h) => { const t = document.createElement('div'); t.innerHTML = h.trim(); return t.firstElementChild; };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), ez = (u) => { u = clamp(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const LAV = '#b8a6e0', PEACH = '#f6c9a8', INK = '#1d1d1f';

  /* 2) 12열 격자 (G 키 또는 왼쪽 아래 버튼으로 켜고 끔) */
  const grid = $('<div class="bh-grid" aria-hidden="true">' + '<i></i>'.repeat(12) + '</div>'); document.body.appendChild(grid);
  const hint = $('<button class="bh-hint" type="button">Grid · G</button>'); document.body.appendChild(hint);
  const tg = () => R.classList.toggle('bh-grid-on'); hint.addEventListener('click', tg); addEventListener('keydown', (e) => { if ((e.key === 'g' || e.key === 'G') && !/input|textarea/i.test(e.target.tagName)) tg(); });
  R.classList.add('bh-grid-on');

  /* 4) 큰 단색 도형: About(복숭아 원) · Features(라벤더 반원 + 먹색 사각) */
  const about = document.getElementById('about'), feats = document.getElementById('features');
  if (about) { about.classList.add('bh-about'); about.appendChild($(`<div class="bh-shape bh-circle" style="right:-9vw;top:-8vw;width:34vw;height:34vw;background:${PEACH}"></div>`)); about.appendChild($(`<div class="bh-shape" style="left:var(--gutter);bottom:0;width:7vw;height:7vw;background:${INK}"></div>`)); }
  if (feats) { feats.style.overflow = 'hidden'; feats.appendChild($(`<div class="bh-shape bh-half" style="left:-6vw;bottom:-1px;width:30vw;height:15vw;background:${LAV}"></div>`)); feats.appendChild($(`<div class="bh-shape bh-circle" style="right:6vw;top:5vw;width:6vw;height:6vw;background:${INK}"></div>`)); }

  /* 1) 기본 도형으로 읽는 Cove: 원·사각·타원·점이 모여 Cove가 됨 */
  const shapes = $(`<section class="bh-shapes" aria-label="기본 도형으로 읽는 Cove"><div class="bh-shapes__stick"><span class="bh-label">Form follows function</span><canvas aria-hidden="true"></canvas><div class="bh-cap"><p data-s="0">모든 형태는 기본 도형에서 시작해요.</p><p data-s="1">원 · 타원 · 선 · 점.</p><p data-s="2">Cove는 둥근 두 볼륨과 선 하나, 점 두 개예요.</p></div></div></section>`);
  about && about.after(shapes);
  const cv = shapes.querySelector('canvas'), cx = cv.getContext('2d'), caps = [...shapes.querySelectorAll('.bh-cap p')];
  function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fit() { const d = Math.min(devicePixelRatio, 2), w = cv.clientWidth, h = cv.clientHeight; if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); } cx.setTransform(cv.width / 1000, 0, 0, cv.height / 700, 0, 0); }
  // 부품: [시작 {x,y,w,h,r}, 끝 {x,y,w,h,r}, 색]
  const P = [
    { a: { x: 230, y: 380, w: 250, h: 250, r: 125 }, b: { x: 500, y: 520, w: 360, h: 124, r: 58 }, c: PEACH, label: '몸통 · 타원' },     // 원 → 몸통(납작한 타원)
    { a: { x: 770, y: 230, w: 220, h: 220, r: 0 }, b: { x: 500, y: 330, w: 270, h: 108, r: 52 }, c: LAV, label: '머리 · 타원' },        // 정사각형 → 머리
    { a: { x: 560, y: 120, w: 14, h: 120, r: 0 }, b: { x: 500, y: 435, w: 14, h: 80, r: 0 }, c: INK, label: '목 · 선' },               // 선 → 목
    { a: { x: 120, y: 90, w: 220, h: 12, r: 0 }, b: { x: 500, y: 594, w: 270, h: 12, r: 6 }, c: INK, label: '바닥판 · 선' },          // 선 → 바닥판
  ];
  function draw(p) {
    fit(); cx.clearRect(0, 0, 1000, 700); const e = ez((p - 0.18) / 0.5), ph = ez((p - 0.7) / 0.2);
    for (const s of P) { const x = lerp(s.a.x, s.b.x, e), y = lerp(s.a.y, s.b.y, e), w = lerp(s.a.w, s.b.w, e), h = lerp(s.a.h, s.b.h, e), r = lerp(s.a.r, s.b.r, e); rr(cx, x - w / 2, y - h / 2, w, h, r); cx.fillStyle = s.c; cx.fill(); }
    for (const s of [-1, 1]) { const x = lerp(s === -1 ? 380 : 880, 500 + s * 44, e), y = lerp(560, 332, e), r = lerp(26, 7, e); cx.fillStyle = INK; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill(); }   // 점 → 눈
    cx.globalAlpha = ph; cx.fillStyle = INK; cx.font = '500 22px Jost, sans-serif'; cx.textAlign = 'left';
    const L = [['머리 · 타원', 660, 320], ['목 · 선', 560, 435], ['몸통 · 타원', 700, 520], ['눈 · 점', 580, 300]];
    cx.strokeStyle = INK; cx.lineWidth = 1.4; for (const [t, x, y] of L) { cx.beginPath(); cx.moveTo(x - 60, y); cx.lineTo(x - 6, y); cx.stroke(); cx.fillText(t, x, y + 7); } cx.globalAlpha = 1;
  }
  /* 5) 센서 도면 */
  const blue = $(`<section class="bh-blue" aria-label="센서 도면"><p class="l">Function drawing</p><h2>어디에 무엇이 있는지, 한 장으로.</h2>
  <svg viewBox="0 0 1000 560" role="img" aria-label="Cove의 센서 위치 도면">
    <g fill="none" stroke="${INK}" stroke-width="2">
      <rect class="dr" x="270" y="330" width="330" height="140" rx="62"/><rect class="dr" x="293" y="150" width="284" height="110" rx="55"/><line class="dr" x1="435" y1="262" x2="435" y2="330"/><line class="dr" x1="250" y1="480" x2="620" y2="480"/>
      <path class="dr" d="M308 215 Q435 232 562 215" stroke-dasharray="6 6"/><path class="dr" d="M286 400 H584" stroke-dasharray="6 6"/>
    </g>
    <g class="pop">
      <circle cx="372" cy="170" r="8" fill="${LAV}" stroke="${INK}" stroke-width="2"/><circle cx="435" cy="160" r="8" fill="${LAV}" stroke="${INK}" stroke-width="2"/><circle cx="498" cy="170" r="8" fill="${LAV}" stroke="${INK}" stroke-width="2"/>
      <circle cx="435" cy="262" r="9" fill="${PEACH}" stroke="${INK}" stroke-width="2"/><circle cx="435" cy="452" r="9" fill="${PEACH}" stroke="${INK}" stroke-width="2"/>
      <circle cx="400" cy="205" r="4" fill="${INK}"/><circle cx="470" cy="205" r="4" fill="${INK}"/>
      <g stroke="${INK}" stroke-width="1.4" fill="none"><path d="M498 170 L700 100 H820"/><path d="M445 262 L700 262 H820"/><path d="M444 452 L700 452 H820"/></g>
      <text x="830" y="96" font-size="20" font-weight="500">접촉센서 × 3</text><text x="830" y="120" font-size="15" opacity=".7">머리 위, 구멍 3곳</text>
      <text x="830" y="258" font-size="20" font-weight="500">거리센서 · 턱</text><text x="830" y="282" font-size="15" opacity=".7">머리 아래 우레탄 부분</text>
      <text x="830" y="448" font-size="20" font-weight="500">거리센서 · 하단</text><text x="830" y="472" font-size="15" opacity=".7">구멍이 있는 몸통 하단</text>
    </g>
    <g class="pop" transform="translate(110 150)"><circle cx="0" cy="0" r="82" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="-34" cy="22" r="9" fill="${LAV}" stroke="${INK}" stroke-width="2"/><circle cx="34" cy="22" r="9" fill="${LAV}" stroke="${INK}" stroke-width="2"/><circle cx="0" cy="-34" r="9" fill="${LAV}" stroke="${INK}" stroke-width="2"/>
      <text x="-82" y="118" font-size="16" opacity=".75">머리 위 (위에서 본 모습)</text></g>
    <g class="pop" font-size="14"><circle cx="64" cy="500" r="8" fill="${LAV}" stroke="${INK}" stroke-width="2"/><text x="82" y="505">접촉센서</text><circle cx="190" cy="500" r="8" fill="${PEACH}" stroke="${INK}" stroke-width="2"/><text x="208" y="505">거리센서</text></g>
  </svg></section>`);
  const gal = document.getElementById('gallery');
  const anchor = () => document.querySelector('.jobs-spec') || gal;
  setTimeout(() => { const a = anchor(); a && a.before(blue); new IntersectionObserver(([en], o) => { if (en.isIntersecting) { blue.classList.add('in'); o.disconnect(); } }, { threshold: 0.3 }).observe(blue); }, 60);
  (function loop() { requestAnimationFrame(loop); const r = shapes.getBoundingClientRect(); if (r.bottom < -50 || r.top > innerHeight + 50) return; const p = clamp(-r.top / (r.height - innerHeight)); draw(p); const s = p < 0.2 ? 0 : p < 0.62 ? 1 : 2; caps.forEach((c, i) => c.classList.toggle('on', i === s)); })();
})();
