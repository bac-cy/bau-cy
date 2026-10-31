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
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 큰 COVE 글자는 한 글자씩 따로 움직이고, 도착하는 순간 퍼지는 빛을 둔다
  word.innerHTML = [...'COVE'].map(ch => `<span class="intro__ch">${ch}</span>`).join('');
  const chars = [...word.querySelectorAll('.intro__ch')];
  const burst = document.createElement('div'); burst.className = 'intro__burst'; burst.setAttribute('aria-hidden', 'true');
  word.parentNode.insertBefore(burst, word);
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
  const TYPE_START = 0.08, TYPE_END = 0.22;       // 이 구간을 스크롤하는 동안 I'm cove 가 한 글자씩 입력됨
  const OUT_START = 0.32, OUT_SPAN = 0.09;         // I'm cove 사라지기 (I'm cove 가 읽히는 구간을 이전의 약 2배로)
  const RISE_START = 0.36, RISE_SPAN = 0.17;       // 큰 COVE 글자 + 렌더 올라오기
  const P1_TIME = 0.42;                            // HI → I'm cove 가 녹아들듯 넘어가는 시간(초) — 클수록 더 부드럽고 느긋
  const GLIDE_TIME = 0.2;                          // 스크롤을 따라오는 시간(초) — 작을수록 쫀쫀, 클수록 부드러움

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

    // I'm cove: 스크롤하는 만큼 한 글자씩 입력된다 (올리면 지워진다)
    if (!reduced) {
      const tp = smooth(clamp((ss - TYPE_START) / (TYPE_END - TYPE_START))), k = Math.round(tp * IM_TEXT.length);
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
    const idle = !pointer.active || now - pointer.t > 2500;
    const tx = idle ? .55 + Math.sin(now / 3800) * .16 : pointer.x;
    const ty = idle ? .45 + Math.cos(now / 4600) * .12 : pointer.y;
    cur.x += (tx - cur.x) * .045; cur.y += (ty - cur.y) * .045;
    const ax = cur.x * W, ay = cur.y * H;
    const bump = Math.sin(Math.PI * clamp((b - 0.45) / 0.55));                    // 도착 직전에 가장 큰 값
    const sa = (0.55 + 0.45 * imA) * (1 + 0.5 * bump), sb = (0.6 + 0.4 * imA) * (1 + 0.35 * bump);   // 빛 덩어리가 부풀어 오름
    blobA.style.transform = `translate3d(${ax}px, ${ay}px, 0) scale(${sa.toFixed(3)})`;
    blobB.style.transform = `translate3d(${W - ax * .8}px, ${H - ay * .7}px, 0) scale(${sb.toFixed(3)})`;
    const glow = imA * (1 - .55 * b);
    blobA.style.opacity = glow; blobB.style.opacity = glow;
    dots.style.opacity = imA * .55;
    peach.style.opacity = b;

    lineIm.style.opacity = imA * (1 - out);
    lineIm.style.transform = `translate3d(0, ${(1 - imA) * 26 - out * 24}px, 0) scale(${(0.94 + 0.06 * imA + out * 0.2).toFixed(3)})`;   // 나타날 때 안착, 사라질 때 앞으로 다가옴
    lineIm.style.filter = (imA < 0.99 || out > 0.01) ? `blur(${((1 - imA) * 8 + out * 14).toFixed(1)}px)` : 'none';   // 번지듯 나타나고, 흩어지듯 사라짐

    // Scene 3
    word.style.opacity = 1;
    word.style.transform = `scale(${(1 + (1 - b) * 0.22).toFixed(3)})`;                // 카메라가 뒤로 물러나듯 줄어듦
    chars.forEach((el, i) => {                                                          // 글자마다 시차를 두고 튀어 오르듯 내려앉음
      const q = clamp(b * 1.55 - i * 0.17), e = backOut(q);
      el.style.opacity = clamp(q * 2.6);
      el.style.transform = `translate3d(0, ${((1 - e) * H * 0.42).toFixed(1)}px, 0)`;
      el.style.filter = q < 0.98 ? `blur(${((1 - q) * 12).toFixed(1)}px)` : 'none';
    });
    burst.style.opacity = (0.95 * bump).toFixed(3);                                      // 도착하는 순간 퍼지는 빛
    burst.style.transform = `scale(${(0.45 + 1.15 * clamp((b - 0.35) / 0.65)).toFixed(3)})`;
    render.style.opacity = clamp(b * 3);
    render.style.transform = `translate3d(0, ${(1 - backOut(b)) * H * 0.95}px, 0) scale(${(0.7 + 0.3 * backOut(b)).toFixed(3)})`;   // 커지며 올라오다 살짝 지나쳤다 안착

  }
  requestAnimationFrame(frame);
})();
