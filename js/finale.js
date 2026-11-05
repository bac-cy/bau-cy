/* ==========================================================
   Cove — 마무리 장면 (맨 아래)
   큰 COVE 리퀴드 글라스 글자가 한 글자씩 내려앉고, 이어서 Cove가 커지며 올라와요.
   마우스를 따라 글자가 기울고, 지나간 자리에 라일락·복숭아 빛이 번져요. (예전 인트로 마지막 장면을 그대로 옮김)
   ========================================================== */
(() => {
  const root = document.getElementById('finale');
  if (!root) return;
  const $ = s => root.querySelector(s);
  const peach = $('.intro__peach'), blobA = $('.intro__blob--a'), blobB = $('.intro__blob--b'), dots = $('.intro__dots');
  const word = $('.intro__bigword'), render = $('.intro__render');
  const GLYPHS = [{"vb": "215.5 98.3 112.0 100.4", "d": "M 269.85 102.81 C 282.44 101.30 300.40 105.25 310.00 113.82 C 321.82 124.37 310.16 139.64 298.66 134.08 C 293.47 131.57 291.30 128.24 284.39 126.68 C 245.03 117.79 246.80 178.67 287.98 167.90 C 294.46 166.21 295.74 162.93 300.15 160.65 C 313.13 153.92 324.47 170.67 311.50 181.67 C 296.22 194.63 268.34 195.67 251.83 184.53 C 218.48 162.03 230.45 107.53 269.85 102.81 "}, {"vb": "332.3 98.5 97.2 97.0", "d": "M 402.76 147.18 C 402.76 135.14 392.98 125.38 380.91 125.38 C 368.84 125.38 359.06 135.14 359.06 147.18 C 359.06 159.23 368.84 168.99 380.91 168.99 C 392.98 168.99 402.76 159.23 402.76 147.18 M 426.5 147 C 426.5 172.11 406.09 192.47 380.91 192.47 C 355.74 192.47 335.33 172.11 335.33 147 C 335.33 121.88 355.74 101.52 380.91 101.52 C 406.09 101.52 426.5 121.88 426.5 147 "}, {"vb": "438.8 102.2 88.9 93.5", "d": "M 469.84 182.76 C 471.66 186.77 474.92 189.95 478.98 191.65 C 478.98 191.65 477.97 191.23 478.98 191.65 C 481.59 192.75 484.53 192.75 487.13 191.65 L 487.13 191.65 C 491.19 189.95 493.71 187.75 496.28 182.76 C 500.86 173.96 510.45 152.66 510.45 152.66 C 510.45 152.66 517.91 135.36 523.53 122.58 C 523.54 122.56 523.55 122.54 523.56 122.51 C 523.57 122.49 523.58 122.46 523.59 122.44 L 523.60 122.41 L 523.60 122.41 C 524.41 120.48 524.72 118.29 524.37 116.00 C 523.60 110.95 519.55 106.87 514.50 106.09 C 509.01 105.25 504.10 108.17 501.92 112.66 L 501.91 112.65 L 501.78 112.95 C 501.71 113.11 501.64 113.27 501.57 113.43 L 484.49 153.17 C 483.95 154.42 482.17 154.42 481.62 153.17 L 464.75 113.92 C 464.69 113.75 464.62 113.59 464.55 113.43 L 464.42 113.14 L 464.41 113.14 C 462.48 109.17 458.42 106.43 453.71 106.43 C 447.14 106.43 441.81 111.76 441.81 118.33 C 441.81 119.95 442.14 121.49 442.72 122.89 L 442.73 122.92 C 442.75 122.98 442.78 123.02 442.80 123.07 C 447.50 133.45 456.91 154.22 456.91 154.22 C 456.91 154.22 465.53 173.25 469.84 182.76 "}, {"vb": "533.4 99.3 88.3 95.4", "d": "M 612.25 170.75 C 618.32 177.13 615.11 188.77 606.73 190.47 C 600.67 191.70 573.40 191.35 566.60 190.56 C 550.21 188.65 539.59 172.14 544.23 156.46 C 545.25 152.99 547.69 150.32 548.92 146.99 C 536.43 130.69 545.84 105.84 566.60 103.42 C 574.89 102.46 597.21 102.34 605.42 103.33 C 618.55 104.91 618.72 124.90 605.42 126.49 C 594.62 127.78 581.37 125.48 570.28 126.49 C 566.19 127.25 565.31 133.87 569.53 134.66 C 580.16 136.41 607.54 129.09 610.08 144.18 C 613.79 166.15 582.41 156.32 570.28 158.58 C 565.73 159.42 565.19 166.51 571.05 167.47 C 581.03 169.09 594.94 166.38 605.41 167.51 C 607.83 167.77 610.58 169.00 612.25 170.75 "}];
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
  const rcv = document.createElement('canvas'); rcv.className = 'intro__ripple'; rcv.setAttribute('aria-hidden', 'true'); word.after(rcv);
  const rx = rcv.getContext('2d'), rings = []; let rw = 0, rh = 0, lastR = { x: -999, y: -999 };
  const rfit = () => { const d = Math.min(devicePixelRatio, 2); rw = rcv.clientWidth; rh = rcv.clientHeight; rcv.width = rw * d; rcv.height = rh * d; rx.setTransform(d, 0, 0, d, 0, 0); }; rfit(); addEventListener('resize', rfit);
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return; const st = root.querySelector('.intro__stage').getBoundingClientRect(); const x = e.clientX - st.left, y = e.clientY - st.top;
    if (Math.hypot(x - lastR.x, y - lastR.y) > 34) { lastR = { x, y }; rings.push({ x, y, t: 0 }); if (rings.length > 22) rings.shift(); }
  }, { passive: true });
  const backOut = t => { const c1 = 1.70158, c3 = c1 + 1, u = t - 1; return 1 + c3 * u * u * u + c1 * u * u; };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = t => t * t * (3 - 2 * t);
  function smoothDamp(cur, target, vel, time, dt) {
    const w = 2 / time, x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const d = cur - target, tmp = (vel.v + w * d) * dt; vel.v = (vel.v - w * tmp) * e; return target + (d + tmp) * e;
  }
  const pointer = { x: .55, y: .45, active: false, t: 0 }, cur = { x: .55, y: .45 };
  window.addEventListener('pointermove', e => { pointer.x = e.clientX / innerWidth; pointer.y = e.clientY / innerHeight; pointer.active = true; pointer.t = performance.now(); }, { passive: true });

  const LITE = !!window.COVE_LITE;
  let ss = 0, last = performance.now(); const vss = { v: 0 };
  function frame(now) {
    requestAnimationFrame(frame);
    if (LITE && now - last < 30) return;                                // 가벼운 모드: 초당 약 30번만
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const r = root.getBoundingClientRect();
    if (r.bottom < -50 || r.top > innerHeight + 50) return;
    const rects = LITE ? null : chars.map(el => el.getBoundingClientRect());           // 스타일을 쓰기 전에 먼저 읽어서(강제 레이아웃 방지) 끊김을 줄임
    const W = innerWidth, H = innerHeight;
    // 장면이 화면 아래에서 절반쯤 올라왔을 때부터 글자가 나오기 시작해서, 화면에 꽉 차면 Cove가 올라옴
    const raw = -r.top / H + 0.8, tgt = clamp(raw, 0, (r.height - H) / H + 0.8);
    ss = smoothDamp(ss, tgt, vss, 0.2, dt); if (Math.abs(tgt - ss) < 0.0003 && Math.abs(vss.v) < 0.005) { ss = tgt; vss.v = 0; }
    const b = smooth(clamp(ss / 1.0));
    const bl = clamp(b / 0.55), br = clamp((b - 0.62) / 0.38);                          // 글자가 먼저 다 나오고, 그다음 Cove가 올라옴
    const idle = !pointer.active || now - pointer.t > 4000;
    const tx = idle ? .5 + Math.sin(now / 3200) * .28 : pointer.x, ty = idle ? .45 + Math.cos(now / 3900) * .2 : pointer.y;
    cur.x += (tx - cur.x) * .08; cur.y += (ty - cur.y) * .08;
    const ax = cur.x * W, ay = cur.y * H;
    const bump = Math.sin(Math.PI * clamp((b - 0.62) / 0.38));
    const sa = (1) * (1 + 0.5 * bump), sb = (1) * (1 + 0.35 * bump);
    blobA.style.transform = `translate3d(${ax}px, ${ay}px, 0) scale(${sa.toFixed(3)})`;
    blobB.style.transform = `translate3d(${W - ax * .8}px, ${H - ay * .7}px, 0) scale(${sb.toFixed(3)})`;
    const glow = clamp(b * 4) * (1 - .08 * b);
    blobA.style.opacity = glow * 0.55; blobB.style.opacity = glow * 0.5;
    dots.style.opacity = clamp(b * 4) * .55;
    peach.style.opacity = b;
    word.style.opacity = 1;
    word.style.transform = `scale(${(1 + (1 - bl) * 0.22).toFixed(3)})`;
    chars.forEach((el, i) => {
      const q = clamp(bl * 1.55 - i * 0.17), e = backOut(q);
      el.style.opacity = clamp(q * 2.6);
      el.style.transform = `translate3d(0, ${((1 - e) * H * 0.42).toFixed(1)}px, 0)`;
      if (!LITE) el.style.filter = q < 0.98 ? `blur(${((1 - q) * 12).toFixed(1)}px)` : 'none';   // 가벼운 모드에선 블러 없이 투명도만
    });
    // 글자 위치를 먼저 한꺼번에 읽고(레이아웃 계산 1번) 나서 스타일을 씀 → 글자마다 읽고 쓰기를 번갈아 하면 매 프레임 끊김
    if (!LITE && b > 0.02) chars.forEach((el, i) => {      // 가벼운 모드: 마우스 따라 기울기·출렁임 없이 등장 움직임만(매 프레임 다시 그리는 부분 제거)
      const inner = el.firstChild, rr = rects[i]; if (!rr.width) return;
      const ccx = rr.left + rr.width / 2, ccy = rr.top + rr.height / 2, dx = ax - ccx, dy = ay - ccy, dist = Math.hypot(dx, dy);
      const st = inner._s || (inner._s = { tx: 0, ty: 0, rx: 0, ry: 0, sc: 1, hx: 50, hy: 30 });
      const prox = Math.exp(-Math.pow(dist / (W * 0.22), 2)), k = 1 - Math.exp(-dt * 9);
      st.ry += (clamp(dx / W, -.6, .6) * 26 - st.ry) * k; st.rx += (-clamp(dy / H, -.6, .6) * 20 - st.rx) * k;
      st.tx += (clamp(dx / W, -.6, .6) * 16 - st.tx) * k; st.ty += (clamp(dy / H, -.6, .6) * 10 - st.ty) * k;
      st.sc += ((1 + 0.085 * prox) - st.sc) * k;
      const jx = 1 + 0.014 * Math.sin(now / 900 + i * 1.7), jy = 1 + 0.014 * Math.cos(now / 1100 + i * 1.1);
      inner.style.transform = `translate3d(${st.tx.toFixed(1)}px, ${st.ty.toFixed(1)}px, 0) rotateX(${st.rx.toFixed(2)}deg) rotateY(${st.ry.toFixed(2)}deg) scale(${(st.sc * jx).toFixed(4)}, ${(st.sc * jy).toFixed(4)})`;
      st.hx += ((clamp((ax - rr.left) / rr.width, -.2, 1.2) * 100) - st.hx) * k; st.hy += ((clamp((ay - rr.top) / rr.height, -.2, 1.2) * 100) - st.hy) * k;
      inner.style.setProperty('--hx', st.hx.toFixed(1) + '%'); inner.style.setProperty('--hy', st.hy.toFixed(1) + '%'); inner.style.setProperty('--hp', (0.35 + 0.55 * prox).toFixed(3));
    });
    if (!LITE) rx.clearRect(0, 0, rw, rh);
    if (!LITE && bl > 0.5 && rings.length) {
      rx.globalCompositeOperation = 'screen';
      for (let i = rings.length - 1; i >= 0; i--) {
        const g = rings[i]; g.t += dt / 1.9; if (g.t >= 1) { rings.splice(i, 1); continue; }
        const e = 1 - Math.pow(1 - g.t, 1.8), rad = 50 + e * 190, al = Math.sin(Math.PI * Math.min(1, g.t * 1.15)) * Math.pow(1 - g.t, 0.6);
        const warm = i % 2 === 0, c0 = warm ? '255,214,196' : '206,190,248', c1 = warm ? '255,236,226' : '240,232,255';
        const gr = rx.createRadialGradient(g.x, g.y, 0, g.x, g.y, rad);
        gr.addColorStop(0, `rgba(${c1},${(0.5 * al).toFixed(3)})`); gr.addColorStop(0.45, `rgba(${c0},${(0.26 * al).toFixed(3)})`); gr.addColorStop(1, `rgba(${c0},0)`);
        rx.fillStyle = gr; rx.beginPath(); rx.arc(g.x, g.y, rad, 0, 7); rx.fill();
      }
      rx.globalCompositeOperation = 'source-over';
    }
    burst.style.opacity = (0.95 * bump).toFixed(3);
    burst.style.transform = `scale(${(0.45 + 1.15 * br).toFixed(3)})`;
    if (render) render.style.opacity = clamp(br * 3);
    if (render) render.style.transform = `translate3d(0, ${(1 - backOut(br)) * H * 0.95}px, 0) scale(${(0.7 + 0.3 * backOut(br)).toFixed(3)})`;
  }
  requestAnimationFrame(frame);
})();
