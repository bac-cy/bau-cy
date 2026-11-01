/* 미리보기(?jobs=1): 한 줄 약속 · 압력 시연 · 큰 숫자 스펙 · One more thing */
(() => {
  const $ = (h) => { const t = document.createElement('div'); t.innerHTML = h.trim(); return t.firstElementChild; };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), ez = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };
  const intro = document.getElementById('intro'), feats = document.getElementById('features'), gal = document.getElementById('gallery'), foot = document.querySelector('.footer');

  /* 1) 한 줄 약속 */
  const tag = $(`<section class="jobs-tag" aria-label="한 줄 약속"><p>${['로봇에게', '기대어', '쉬어', '보세요.'].map((w, i) => `<span class="w" style="transition-delay:${i * 0.18}s">${i === 1 ? '<em>기대어</em>' : w}</span>`).join(' ')}<small>Cove — Desktop Home Robot</small></p></section>`);
  intro && intro.after(tag);

  /* 2) 압력 시연: 스크롤을 따라 팔(점선 캡슐)이 내려와 머리를 누르고, 머리와 몸통 사이의 라벤더 패드가 지그시 눌림 */
  const press = $(`<section class="jobs-press" aria-label="압력으로 쉬는 시연"><div class="jobs-press__stick"><div class="jobs-press__veil"></div><span class="jobs-press__label">Pressure for Rest</span><canvas aria-hidden="true"></canvas><div class="jobs-press__text"><p data-s="0">손이나 팔을 올려 기대면,</p><p data-s="1">Cove가 지그시 눌러 줘요.</p><p data-s="2">그 압력이, 쉬는 순간을 도와요.</p></div></div></section>`);
  feats && feats.before(press);
  const pc = press.querySelector('canvas'), px = pc.getContext('2d'), veil = press.querySelector('.jobs-press__veil'), lines = [...press.querySelectorAll('.jobs-press__text p')];
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function pebble(c, x, y, w, h, r, light) {
    rr(c, x, y, w, h, r); const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, light ? '#f3eee6' : '#e6dfd4'); g.addColorStop(1, light ? '#d9d0c2' : '#c4baa9'); c.fillStyle = g; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(125,106,168,.55)'; c.stroke();
  }
  function eyes(c, cx, cy, gap, closed) { c.fillStyle = '#2b2731'; c.strokeStyle = '#2b2731'; c.lineWidth = 4; c.lineCap = 'round'; for (const s of [-1, 1]) { const x = cx + s * gap; if (closed) { c.beginPath(); c.moveTo(x - 11, cy); c.lineTo(x + 11, cy); c.stroke(); } else { c.beginPath(); c.arc(x, cy, 7, 0, 7); c.fill(); } } }
  function fit(cv, cx) { const d = Math.min(devicePixelRatio, 2), w = cv.clientWidth, h = cv.clientHeight; if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const k = Math.min(cv.width / 1000, cv.height / 700); cx.setTransform(k, 0, 0, k, (cv.width - 1000 * k) / 2, (cv.height - 700 * k) / 2); }   // 가로세로 비율을 지키며 가운데에 맞춤(세로로 긴 모바일 화면에서 찌그러지지 않게)
  function drawPress(p, t) {
    // Key Features의 Pressure for Rest 카드와 같은 모습: 바닥선 · 몸통 · 몸통만큼 넓은 라벤더 패드 · 머리. 눌리면 패드가 얇은 선처럼 납작해지고 동심 타원 파동이 퍼짐
    fit(pc, px); px.clearRect(0, 0, 1000, 700);
    const push = ez((p - 0.3) / 0.35), rel = ez((p - 0.86) / 0.12), pr = push * (1 - rel);
    const base = 580, bodyH = 124, bodyW = 360, cx = 500, bodyTop = base - bodyH;
    px.strokeStyle = 'rgba(125,106,168,.35)'; px.lineWidth = 2; px.beginPath(); px.moveTo(110, base + 8); px.lineTo(890, base + 8); px.stroke();   // 바닥선
    px.fillStyle = 'rgba(80,60,120,.12)'; px.beginPath(); px.ellipse(cx, base + 6, 200 + pr * 12, 14, 0, 0, 7); px.fill();
    const bh = bodyH * (1 - 0.06 * pr); pebble(px, cx - bodyW / 2 - 6 * pr, base - bh, bodyW + 12 * pr, bh, 58, false);                  // 몸통
    const padW = bodyW + 6, padH = 64 - 50 * pr, padY = base - bh - padH + 6, headH = 108, headW = 270, headY = padY - headH + 4;
    for (let k = 0; k < 3; k++) { const ph = ((t * 0.55 + k / 3) % 1), r = 220 + ph * 250; px.strokeStyle = `rgba(125,106,168,${(0.55 * (1 - ph) * (0.25 + 0.75 * pr)).toFixed(3)})`; px.lineWidth = 2.2; px.beginPath(); px.ellipse(cx, padY + padH / 2 + 8, r, r * 0.26, 0, 0, 7); px.stroke(); }   // 퍼지는 동심 파동
    rr(px, cx - padW / 2, padY, padW, padH, Math.min(28, padH / 2 + 3)); px.fillStyle = 'rgba(184,166,224,.9)'; px.fill(); px.lineWidth = 2.4; px.strokeStyle = 'rgba(125,106,168,.95)'; px.stroke();   // 라벤더 패드
    pebble(px, cx - headW / 2, headY, headW, headH, 52, true);                                                              // 머리
    eyes(px, cx, headY + headH / 2 + 2, 44, false);
  }
  function updPress(now) {
    const r = press.getBoundingClientRect(), total = r.height - innerHeight, p = clamp(-r.top / total);
    if (r.bottom > -50 && r.top < innerHeight + 50) {
      drawPress(p, now / 1000);
      veil.style.opacity = (0.9 * ez((p - 0.45) / 0.3) * (1 - ez((p - 0.86) / 0.12))).toFixed(3);                       // 화면 전체가 천천히 가라앉음
      pc.style.transform = `scale(${(1 - 0.035 * ez((p - 0.45) / 0.3) * (1 - ez((p - 0.86) / 0.12))).toFixed(4)})`;
      const s = p < 0.3 ? 0 : p < 0.62 ? 1 : p < 0.96 ? 2 : -1; lines.forEach((l, i) => l.classList.toggle('on', i === s));
      if (p < 0.12) lines[0].classList.add('on');
    }
  }

  /* 3) 큰 숫자 스펙 */
  const spec = $(`<section class="jobs-spec" aria-label="스펙"><p class="jobs-spec__label">Tech Specs</p><div class="jobs-spec__grid">
    <div class="jobs-spec__item"><div class="jobs-spec__num"><i data-a="160" data-b="237">160–237</i><span>mm</span></div><div class="jobs-spec__cap"><b>Height</b>접은 모습부터 가장 길게 펴졌을 때까지</div></div>
    <div class="jobs-spec__item"><div class="jobs-spec__num"><i data-a="222" data-b="251">222–251</i><span>mm</span></div><div class="jobs-spec__cap"><b>Width</b>몸통을 돌리고 갸웃할 때의 폭</div></div>
    <div class="jobs-spec__item"><div class="jobs-spec__num"><i data-a="4" data-b="4">4</i><span>모터</span></div><div class="jobs-spec__cap"><b>Motors</b>고개와 몸통을 부드럽게 움직이는 다이나믹셀 4개</div></div>
    <div class="jobs-spec__item"><div class="jobs-spec__num"><i data-a="2" data-b="2">2</i><span>+</span><i data-a="3" data-b="3">3</i><span>센서</span></div><div class="jobs-spec__cap"><b>Sensors</b>거리센서 2개 · 접촉센서 3개</div></div></div></section>`);
  gal && gal.before(spec);
  const io = new IntersectionObserver((es) => es.forEach(e => { if (!e.isIntersecting) return; const it = e.target; it.classList.add('in'); io.unobserve(it);
    it.querySelectorAll('i[data-a]').forEach(n => { const a = +n.dataset.a, b = +n.dataset.b, t0 = performance.now(); (function step(now) { const u = ez((now - t0) / 1400), va = Math.round(a * u), vb = Math.round(b * u); n.textContent = a === b ? va : `${va}–${vb}`; if (u < 1) requestAnimationFrame(step); else n.textContent = a === b ? a : `${a}–${b}`; })(t0); }); }), { threshold: 0.4 });
  spec.querySelectorAll('.jobs-spec__item').forEach(i => io.observe(i));
  const io2 = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }), { threshold: 0.45 }); io2.observe(tag);

  /* 4) One more thing: 화면이 어두워지며 Cove가 스르르 잠들고 문구 한 줄 */
  const end = $(`<section class="jobs-end" aria-label="마무리"><div class="jobs-end__stick"><canvas aria-hidden="true"></canvas><div class="jobs-end__text"><p>ROBOTWORLD 2026에서 만나요.</p><small>HIDE LAB · Hongik University</small></div></div></section>`);
  foot && foot.before(end);
  const ec = end.querySelector('canvas'), ex = ec.getContext('2d'), etext = end.querySelector('.jobs-end__text');
  function drawEnd(p, t) {
    fit(ec, ex); ex.clearRect(0, 0, 1000, 700);
    const sleep = ez((p - 0.3) / 0.25), breath = Math.sin(t * 1.3) * 0.5 + 0.5, base = 520, cx = 500;
    ex.fillStyle = 'rgba(0,0,0,.35)'; ex.beginPath(); ex.ellipse(cx, base + 6, 250, 18, 0, 0, 7); ex.fill();
    const g = ex.createLinearGradient(0, base - 150, 0, base); g.addColorStop(0, '#6c6573'); g.addColorStop(1, '#4a4452');
    const bodyY = base - 130, headLow = 4 + 16 * sleep;                                                                     // 잠들면서 머리가 몸통 쪽으로 내려앉음
    rr(ex, cx - 220, bodyY, 440, 130, 62); ex.fillStyle = g; ex.fill(); ex.strokeStyle = 'rgba(184,166,224,.35)'; ex.lineWidth = 2; ex.stroke();
    const hy = bodyY - 98 + headLow - breath * 3 * sleep; rr(ex, cx - 160, hy, 320, 108, 54); const g2 = ex.createLinearGradient(0, hy, 0, hy + 108); g2.addColorStop(0, '#8d8697'); g2.addColorStop(1, '#6c6573'); ex.fillStyle = g2; ex.fill(); ex.stroke();
    const glow = 1 - sleep * 0.92; ex.save(); ex.shadowColor = `rgba(255,220,190,${0.7 * glow})`; ex.shadowBlur = 24; ex.strokeStyle = `rgba(255,236,220,${0.35 + 0.65 * glow})`; ex.lineWidth = 6; ex.lineCap = 'round';
    for (const s of [-1, 1]) { const x = cx + s * 58, y = hy + 54; ex.beginPath(); if (sleep > 0.5) { ex.moveTo(x - 16, y); ex.lineTo(x + 16, y); } else { ex.moveTo(x, y - 10 * (1 - sleep)); ex.lineTo(x, y + 10 * (1 - sleep)); } ex.stroke(); } ex.restore();
  }
  function updEnd(now) {
    const r = end.getBoundingClientRect(), total = r.height - innerHeight, p = clamp(-r.top / total);
    if (r.bottom > -50 && r.top < innerHeight + 50) { drawEnd(p, now / 1000); if (p > 0.55) end.classList.add('in'); else end.classList.remove('in'); }
  }
  (function loop(now) { requestAnimationFrame(loop); updPress(now); updEnd(now); })(performance.now());
})();
