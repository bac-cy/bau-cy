/* ==========================================================
   Cove — Intro choreography
   Scene 1  HI (흰 배경, 좌→우로 타이핑)
   Scene 2  I'm cove (스크롤 한 번 → 반응형 그라디언트 + 타이핑)
   Scene 3  큰 COVE 글자와 Cove 렌더가 스크롤에 맞춰 아래에서 올라옴
   ========================================================== */
(() => {
  const intro = document.getElementById('intro');
  if (!intro) return;
  const $ = s => intro.querySelector(s);
  const lineHi = $('.intro__line--hi'), lineIm = $('.intro__line--im');
  const peach = $('.intro__peach'), blobA = $('.intro__blob--a'), blobB = $('.intro__blob--b');
  const dots = $('.intro__dots');
  const word = $('.intro__bigword'), render = $('.intro__render');
  const reduced = false;   // 사용자 요청: PC의 '움직임 줄이기' 설정과 상관없이 모든 효과를 보여준다
  // 큰 COVE 글자는 한 글자씩 따로 움직이고, 도착하는 순간 퍼지는 빛을 둔다
  // Cove.ai 로고의 COVE 글자 모양(assets/cove-logo.svg)을 글자마다 따로 그려 움직임
  const GLYPHS = [{"vb": "215.5 98.3 112.0 100.4", "d": "M 269.85 102.81 C 282.44 101.30 300.40 105.25 310.00 113.82 C 321.82 124.37 310.16 139.64 298.66 134.08 C 293.47 131.57 291.30 128.24 284.39 126.68 C 245.03 117.79 246.80 178.67 287.98 167.90 C 294.46 166.21 295.74 162.93 300.15 160.65 C 313.13 153.92 324.47 170.67 311.50 181.67 C 296.22 194.63 268.34 195.67 251.83 184.53 C 218.48 162.03 230.45 107.53 269.85 102.81 "}, {"vb": "332.3 98.5 97.2 97.0", "d": "M 402.76 147.18 C 402.76 135.14 392.98 125.38 380.91 125.38 C 368.84 125.38 359.06 135.14 359.06 147.18 C 359.06 159.23 368.84 168.99 380.91 168.99 C 392.98 168.99 402.76 159.23 402.76 147.18 M 426.5 147 C 426.5 172.11 406.09 192.47 380.91 192.47 C 355.74 192.47 335.33 172.11 335.33 147 C 335.33 121.88 355.74 101.52 380.91 101.52 C 406.09 101.52 426.5 121.88 426.5 147 "}, {"vb": "438.8 102.2 88.9 93.5", "d": "M 469.84 182.76 C 471.66 186.77 474.92 189.95 478.98 191.65 C 478.98 191.65 477.97 191.23 478.98 191.65 C 481.59 192.75 484.53 192.75 487.13 191.65 L 487.13 191.65 C 491.19 189.95 493.71 187.75 496.28 182.76 C 500.86 173.96 510.45 152.66 510.45 152.66 C 510.45 152.66 517.91 135.36 523.53 122.58 C 523.54 122.56 523.55 122.54 523.56 122.51 C 523.57 122.49 523.58 122.46 523.59 122.44 L 523.60 122.41 L 523.60 122.41 C 524.41 120.48 524.72 118.29 524.37 116.00 C 523.60 110.95 519.55 106.87 514.50 106.09 C 509.01 105.25 504.10 108.17 501.92 112.66 L 501.91 112.65 L 501.78 112.95 C 501.71 113.11 501.64 113.27 501.57 113.43 L 484.49 153.17 C 483.95 154.42 482.17 154.42 481.62 153.17 L 464.75 113.92 C 464.69 113.75 464.62 113.59 464.55 113.43 L 464.42 113.14 L 464.41 113.14 C 462.48 109.17 458.42 106.43 453.71 106.43 C 447.14 106.43 441.81 111.76 441.81 118.33 C 441.81 119.95 442.14 121.49 442.72 122.89 L 442.73 122.92 C 442.75 122.98 442.78 123.02 442.80 123.07 C 447.50 133.45 456.91 154.22 456.91 154.22 C 456.91 154.22 465.53 173.25 469.84 182.76 "}, {"vb": "533.4 99.3 88.3 95.4", "d": "M 612.25 170.75 C 618.32 177.13 615.11 188.77 606.73 190.47 C 600.67 191.70 573.40 191.35 566.60 190.56 C 550.21 188.65 539.59 172.14 544.23 156.46 C 545.25 152.99 547.69 150.32 548.92 146.99 C 536.43 130.69 545.84 105.84 566.60 103.42 C 574.89 102.46 597.21 102.34 605.42 103.33 C 618.55 104.91 618.72 124.90 605.42 126.49 C 594.62 127.78 581.37 125.48 570.28 126.49 C 566.19 127.25 565.31 133.87 569.53 134.66 C 580.16 136.41 607.54 129.09 610.08 144.18 C 613.79 166.15 582.41 156.32 570.28 158.58 C 565.73 159.42 565.19 166.51 571.05 167.47 C 581.03 169.09 594.94 166.38 605.41 167.51 C 607.83 167.77 610.58 169.00 612.25 170.75 "}];
  // 리퀴드 글라스: 글자 모양으로 오려낸 반투명 유리(뒤의 빛이 번져 보임) + 가장자리 빛과 은은한 그림자
  word.innerHTML = GLYPHS.map((g, i) => {
    const mask = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${g.vb}"><path d="${g.d}" fill="#000"/></svg>`);
    return `<span class="intro__ch"><span class="intro__chi"><i class="intro__glass" style="--m:url('data:image/svg+xml;utf8,${mask}')"></i><svg viewBox="${g.vb}" aria-hidden="true"><defs>
      <linearGradient id="lgf${i}" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".62"/><stop offset=".45" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#e8dcff" stop-opacity=".3"/></linearGradient>
      <linearGradient id="lgs${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#cdbdf2" stop-opacity=".75"/></linearGradient></defs>
      <path d="${g.d}" fill="url(#lgf${i})"/><path d="${g.d}" fill="none" stroke="url(#lgs${i})" stroke-width="1.7" stroke-linejoin="round"/></svg></span></span>`;
  }).join('');
  const chars = [...word.querySelectorAll('.intro__ch')];
  const burst = document.createElement('div'); burst.className = 'intro__burst'; burst.setAttribute('aria-hidden', 'true');
  word.parentNode.insertBefore(burst, word);
  // 파문: 커서가 지나간 자리에서 물결처럼 번져 나가는 링 (리퀴드 글라스 글자 위, Cove 아래)
  const rcv = document.createElement('canvas'); rcv.className = 'intro__ripple'; rcv.setAttribute('aria-hidden', 'true'); word.after(rcv);
  const rx = rcv.getContext('2d'), rings = []; let rw = 0, rh = 0, lastR = { x: -999, y: -999 };
  const rfit = () => { const d = Math.min(devicePixelRatio, 2); rw = rcv.clientWidth; rh = rcv.clientHeight; rcv.width = rw * d; rcv.height = rh * d; rx.setTransform(d, 0, 0, d, 0, 0); }; rfit(); addEventListener('resize', rfit);
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return; const st = intro.querySelector('.intro__stage').getBoundingClientRect(); const x = e.clientX - st.left, y = e.clientY - st.top;
    if (Math.hypot(x - lastR.x, y - lastR.y) > 46) { lastR = { x, y }; rings.push({ x, y, t: 0 }); if (rings.length > 14) rings.shift(); }
  }, { passive: true });
  const backOut = t => { const c1 = 1.70158, c3 = c1 + 1, u = t - 1; return 1 + c3 * u * u * u + c1 * u * u; };   // 살짝 지나쳤다 돌아오는 곡선

  /* ---------- 타이핑 ---------- */
  // 타이핑 전에 글자가 잠깐 보였다 사라지는 깜빡임을 막기 위해 먼저 비워 둡니다.
  if (!reduced) intro.querySelectorAll('.intro__typed').forEach(el => { el.textContent = ''; });
  function typeInto(line, speed = 170, onDone) {
    const out = line.querySelector('.intro__typed'), caret = line.querySelector('.intro__caret');
    const text = line.dataset.type; let i = 0;
    if (reduced) { out.textContent = text; caret.classList.add('is-done'); onDone && onDone(); return; }
    out.textContent = '';
    (function tick() {
      out.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, speed);
      else { setTimeout(() => caret.classList.add('is-done'), 900); onDone && onDone(); }
    })();
  }
  const IM_TEXT = lineIm.dataset.type, imOut = lineIm.querySelector('.intro__typed'), imCaret = lineIm.querySelector('.intro__caret');
  let hiStarted = false, imShown = -1;
  const startHi = () => { if (hiStarted) return; hiStarted = true; setTimeout(() => typeInto(lineHi, 220), 500); };
  // 글꼴이 준비된 뒤에 시작해야 깜빡임 없이 타이핑됩니다.
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(startHi);
  setTimeout(startHi, 1500);

  /* ---------- 반응형 그라디언트 (마우스를 따라가고, 가만히 있으면 천천히 흐름) ---------- */
  const pointer = { x: .55, y: .45, active: false, t: 0 };
  const cur = { x: .55, y: .45 };
  window.addEventListener('pointermove', e => {
    pointer.x = e.clientX / window.innerWidth; pointer.y = e.clientY / window.innerHeight;
    pointer.active = true; pointer.t = performance.now();
  }, { passive: true });

  /* ---------- 스크롤 진행도 ----------
     단위는 "화면 높이(svh)"입니다. s = 1 이면 화면 한 장만큼 스크롤한 상태. */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const smooth = t => t * t * (3 - 2 * t);          // 시작과 끝이 부드러운 곡선
  // 목표값을 향해 부드럽게 가속·감속하며 따라가는 스프링(튀지 않음)
  function smoothDamp(cur, target, vel, time, dt) {
    const w = 2 / time, x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const d = cur - target, tmp = (vel.v + w * d) * dt;
    vel.v = (vel.v - w * tmp) * e;
    return target + (d + tmp) * e;
  }

  // HI ↔ I'm cove 전환: 스크롤을 따라 처음부터 끝까지 연속으로 이어집니다 (끊기는 지점 없음).
  const STEP1 = 0.10;                              // 이만큼 스크롤하면 I'm cove 장면 완성 (약 1.5칸)
  // I'm cove → Cove 렌더 구간
  // 휠 1칸 ≈ 0.067 (HI → I'm cove 가 1.5칸 = 0.10). 구간 길이를 칸 수로 환산해 잡았습니다.
  const TYPE_CPS = 7;                              // I'm cove 입력 속도(초당 글자 수)
  const OUT_START = 0.62, OUT_SPAN = 0.12;         // I'm cove 사라지기 (I'm cove 가 읽히는 구간을 이전의 약 2배로)
  const RISE_START = 0.67, RISE_SPAN = 0.34;       // 큰 COVE 글자 + 렌더 올라오기
  const P1_TIME = 0.42;                            // HI → I'm cove 가 녹아들듯 넘어가는 시간(초) — 클수록 더 부드럽고 느긋
  const GLIDE_TIME = 0.2;                          // 스크롤을 따라오는 시간(초) — 작을수록 쫀쫀, 클수록 부드러움

  let typedF = 0;
  let ss = 0, last = performance.now();
  const vss = { v: 0 }, vp1 = { v: 0 };
  let pp1 = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const r = intro.getBoundingClientRect();
    if (r.bottom < -50 || r.top > window.innerHeight + 50) return;   // 화면 밖이면 쉼
    const W = window.innerWidth, H = window.innerHeight;
    const s = clamp(-r.top / H, 0, (r.height - H) / H);

    // 휠이 한 칸씩 끊겨 움직여도 화면은 미끄러지듯 따라오게 함 (되감기도 동일)
    ss = reduced ? s : smoothDamp(ss, s, vss, GLIDE_TIME, dt);
    if (Math.abs(s - ss) < 0.0003 && Math.abs(vss.v) < 0.005) { ss = s; vss.v = 0; }
    // HI → I'm cove 진행도: 스크롤 목표를 향해 천천히 따라가서, 휠 한 칸에도 부드럽게 녹아들듯 넘어감
    pp1 = reduced ? clamp(s / STEP1) : smoothDamp(pp1, clamp(s / STEP1), vp1, P1_TIME, dt);
    if (Math.abs(clamp(s / STEP1) - pp1) < 0.002 && Math.abs(vp1.v) < 0.01) { pp1 = clamp(s / STEP1); vp1.v = 0; }
    const p1 = pp1;

    // HI가 위로 사라지는 동안 I'm cove가 아래에서 올라와 자연스럽게 겹쳐 바뀝니다
    const hiA = smooth(clamp(p1 / 0.8));
    const imA = smooth(clamp((p1 - 0.2) / 0.8));
    const out = clamp((ss - OUT_START) / OUT_SPAN);
    const b = smooth(clamp((ss - RISE_START) / RISE_SPAN));
    const bl = clamp(b / 0.55), br = clamp((b - 0.62) / 0.38);                          // 글자가 먼저 다 나오고(0~55%), 그다음 Cove가 올라옴(62~100%)

    // I'm cove: 나타나면 시간에 맞춰 한 글자씩 입력된다 (스크롤을 되돌리면 빠르게 지워진다)
    if (!reduced) {
      const want = imA > 0.35 && out < 0.2;
      typedF = want ? Math.min(IM_TEXT.length, typedF + dt * TYPE_CPS) : Math.max(0, typedF - dt * 40);
      const k = Math.floor(typedF + 0.0001);
      if (k !== imShown) {
        imShown = k; imOut.textContent = IM_TEXT.slice(0, k);
        imCaret.classList.toggle('is-done', k === IM_TEXT.length);
      }
    }

    // Scene 1
    lineHi.style.opacity = 1 - hiA;
    lineHi.style.transform = `translate3d(0, ${-hiA * 34}px, 0) scale(${(1 + hiA * 0.16).toFixed(3)})`;   // 커지면서
    lineHi.style.filter = hiA > 0.01 ? `blur(${(hiA * 11).toFixed(1)}px)` : 'none';   // 번지듯 사라짐

    // Scene 2 — 그라디언트 위치 계산
    const idle = !pointer.active || now - pointer.t > 4000;
    const tx = idle ? .5 + Math.sin(now / 3200) * .28 : pointer.x;
    const ty = idle ? .45 + Math.cos(now / 3900) * .2 : pointer.y;
    cur.x += (tx - cur.x) * .08; cur.y += (ty - cur.y) * .08;
    const ax = cur.x * W, ay = cur.y * H;
    const bump = Math.sin(Math.PI * clamp((b - 0.62) / 0.38));                    // Cove가 도착하는 순간에 가장 큰 값
    const sa = (0.55 + 0.45 * imA) * (1 + 0.5 * bump), sb = (0.6 + 0.4 * imA) * (1 + 0.35 * bump);   // 빛 덩어리가 부풀어 오름
    blobA.style.transform = `translate3d(${ax}px, ${ay}px, 0) scale(${sa.toFixed(3)})`;
    blobB.style.transform = `translate3d(${W - ax * .8}px, ${H - ay * .7}px, 0) scale(${sb.toFixed(3)})`;
    const glow = imA * (1 - .08 * b);          // 마지막 장면까지 반응형 빛이 또렷하게 남음
    blobA.style.opacity = glow; blobB.style.opacity = glow;
    dots.style.opacity = imA * .55;
    peach.style.opacity = b;

    lineIm.style.opacity = imA * (1 - out);
    lineIm.style.transform = `translate3d(0, ${(1 - imA) * 26 - out * 24}px, 0) scale(${(0.94 + 0.06 * imA + out * 0.2).toFixed(3)})`;   // 나타날 때 안착, 사라질 때 앞으로 다가옴
    lineIm.style.filter = (imA < 0.99 || out > 0.01) ? `blur(${((1 - imA) * 8 + out * 14).toFixed(1)}px)` : 'none';   // 번지듯 나타나고, 흩어지듯 사라짐

    // Scene 3
    word.style.opacity = 1;
    word.style.transform = `scale(${(1 + (1 - bl) * 0.22).toFixed(3)})`;                // 카메라가 뒤로 물러나듯 줄어듦
    chars.forEach((el, i) => {                                                          // 글자마다 시차를 두고 튀어 오르듯 내려앉음
      const q = clamp(bl * 1.55 - i * 0.17), e = backOut(q);
      el.style.opacity = clamp(q * 2.6);
      el.style.transform = `translate3d(0, ${((1 - e) * H * 0.42).toFixed(1)}px, 0)`;
      el.style.filter = q < 0.98 ? `blur(${((1 - q) * 12).toFixed(1)}px)` : 'none';
    });
    // 리퀴드 글라스 반응: 마우스(없으면 천천히 떠다니는 가상의 빛)를 따라 글자가 기울고, 가까울수록 살짝 부풀며, 빛 반사가 따라다님
    if (b > 0.02) chars.forEach((el, i) => {
      const inner = el.firstChild, r = el.getBoundingClientRect(); if (!r.width) return;
      const ccx = r.left + r.width / 2, ccy = r.top + r.height / 2, dx = ax - ccx, dy = ay - ccy, dist = Math.hypot(dx, dy);
      const st = inner._s || (inner._s = { tx: 0, ty: 0, rx: 0, ry: 0, sc: 1, hx: 50, hy: 30 });
      const prox = Math.exp(-Math.pow(dist / (W * 0.22), 2));
      const k = 1 - Math.exp(-dt * 9);
      st.ry += (clamp(dx / W, -.6, .6) * 26 - st.ry) * k; st.rx += (-clamp(dy / H, -.6, .6) * 20 - st.rx) * k;
      st.tx += (clamp(dx / W, -.6, .6) * 16 - st.tx) * k; st.ty += (clamp(dy / H, -.6, .6) * 10 - st.ty) * k;
      st.sc += ((1 + 0.085 * prox) - st.sc) * k;
      const jx = 1 + 0.014 * Math.sin(now / 900 + i * 1.7), jy = 1 + 0.014 * Math.cos(now / 1100 + i * 1.1);           // 젤리처럼 살짝 출렁
      inner.style.transform = `translate3d(${st.tx.toFixed(1)}px, ${st.ty.toFixed(1)}px, 0) rotateX(${st.rx.toFixed(2)}deg) rotateY(${st.ry.toFixed(2)}deg) scale(${(st.sc * jx).toFixed(4)}, ${(st.sc * jy).toFixed(4)})`;
      st.hx += ((clamp((ax - r.left) / r.width, -.2, 1.2) * 100) - st.hx) * k; st.hy += ((clamp((ay - r.top) / r.height, -.2, 1.2) * 100) - st.hy) * k;
      inner.style.setProperty('--hx', st.hx.toFixed(1) + '%'); inner.style.setProperty('--hy', st.hy.toFixed(1) + '%'); inner.style.setProperty('--hp', (0.35 + 0.55 * prox).toFixed(3));
    });
    // 파문 그리기 (큰 COVE 글자가 보이는 동안만)
    rx.clearRect(0, 0, rw, rh);
    if (bl > 0.5 && rings.length) {
      rx.globalCompositeOperation = 'screen';
      for (let i = rings.length - 1; i >= 0; i--) {
        const g = rings[i]; g.t += dt / 1.9; if (g.t >= 1) { rings.splice(i, 1); continue; }
        const e = 1 - Math.pow(1 - g.t, 2.2), rad = 10 + e * 190, al = Math.pow(1 - g.t, 1.6);
        const gr = rx.createRadialGradient(g.x, g.y, rad * 0.55, g.x, g.y, rad);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.82, `rgba(236,226,255,${(0.22 * al).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
        rx.fillStyle = gr; rx.beginPath(); rx.arc(g.x, g.y, rad, 0, 7); rx.fill();
        rx.lineWidth = 2.2; rx.strokeStyle = `rgba(255,255,255,${(0.8 * al).toFixed(3)})`; rx.beginPath(); rx.arc(g.x, g.y, rad * 0.97, 0, 7); rx.stroke();
        rx.lineWidth = 1.2; rx.strokeStyle = `rgba(196,176,240,${(0.55 * al).toFixed(3)})`; rx.beginPath(); rx.arc(g.x, g.y, rad * 0.8, 0, 7); rx.stroke();
      }
      rx.globalCompositeOperation = 'source-over';
    }
    burst.style.opacity = (0.95 * bump).toFixed(3);                                      // 도착하는 순간 퍼지는 빛
    burst.style.transform = `scale(${(0.45 + 1.15 * br).toFixed(3)})`;
    render.style.opacity = clamp(br * 3);
    render.style.transform = `translate3d(0, ${(1 - backOut(br)) * H * 0.95}px, 0) scale(${(0.7 + 0.3 * backOut(br)).toFixed(3)})`;   // 커지며 올라오다 살짝 지나쳤다 안착

  }
  requestAnimationFrame(frame);
})();
