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
  let hiStarted = false, imStarted = false, imDone = false;
  const startHi = () => { if (hiStarted) return; hiStarted = true; setTimeout(() => typeInto(lineHi, 220), 500); };
  const startIm = () => { if (imStarted) return; imStarted = true; typeInto(lineIm, 110, () => { imDone = true; }); };
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

  // HI ↔ I'm cove 전환: 살짝만 스크롤해도 장면이 딱 넘어가고(스냅), 되돌리면 딱 돌아옵니다.
  const TRIGGER_ON = 0.10, TRIGGER_OFF = 0.05;    // 넘어가는 / 돌아오는 스크롤 위치 (히스테리시스)
  const SNAP_SPEED = 9;                            // 클수록 더 빠르고 쫀쫀하게 전환
  // I'm cove → Cove 렌더 구간
  const OUT_START = 0.32, OUT_SPAN = 0.14;         // I'm cove 사라지기
  const RISE_START = 0.36, RISE_SPAN = 0.55;       // 큰 COVE 글자 + 렌더 올라오기 (전체 스크롤 약 1화면)
  const GLIDE_SPEED = 11;                          // 휠 한 칸의 움직임이 부드럽게 이어지는 정도

  let on = false, t = 0, ss = 0, last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const r = intro.getBoundingClientRect();
    if (r.bottom < -50 || r.top > window.innerHeight + 50) return;   // 화면 밖이면 쉼
    const W = window.innerWidth, H = window.innerHeight;
    const s = clamp(-r.top / H, 0, (r.height - H) / H);

    if (!on && s > TRIGGER_ON) on = true;
    else if (on && s < TRIGGER_OFF) on = false;
    const goal = on ? 1 : 0;
    t = reduced ? goal : t + (goal - t) * (1 - Math.exp(-dt * SNAP_SPEED));
    if (Math.abs(goal - t) < 0.002) t = goal;

    // HI는 앞쪽 절반에 빠르게 빠지고, I'm cove는 뒤이어 들어옵니다 (겹쳐 섞이지 않음)
    const hiA = easeOut(clamp(t / 0.55));
    const imA = easeOut(clamp((t - 0.35) / 0.65));
    // 휠이 한 칸씩 끊겨 움직여도 화면은 미끄러지듯 따라오게 함 (되감기도 동일)
    ss = reduced ? s : ss + (s - ss) * (1 - Math.exp(-dt * GLIDE_SPEED));
    if (Math.abs(s - ss) < 0.0005) ss = s;
    const out = clamp((ss - OUT_START) / OUT_SPAN);
    const b = easeOut(clamp((ss - RISE_START) / RISE_SPAN));

    if (t > 0.3) startIm();
    if (ss >= RISE_START && imStarted && !imDone) {      // 타이핑이 끝나기 전에 넘어가면 바로 완성
      lineIm.querySelector('.intro__typed').textContent = lineIm.dataset.type;
      lineIm.querySelector('.intro__caret').classList.add('is-done'); imDone = true;
    }

    // Scene 1
    lineHi.style.opacity = 1 - hiA;
    lineHi.style.transform = `translate3d(0, ${-hiA * 28}px, 0)`;

    // Scene 2 — 그라디언트 위치 계산
    const idle = !pointer.active || now - pointer.t > 2500;
    const tx = idle ? .55 + Math.sin(now / 3800) * .16 : pointer.x;
    const ty = idle ? .45 + Math.cos(now / 4600) * .12 : pointer.y;
    cur.x += (tx - cur.x) * .045; cur.y += (ty - cur.y) * .045;
    const ax = cur.x * W, ay = cur.y * H;
    blobA.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
    blobB.style.transform = `translate3d(${W - ax * .8}px, ${H - ay * .7}px, 0)`;
    const glow = imA * (1 - .55 * b);
    blobA.style.opacity = glow; blobB.style.opacity = glow;
    dots.style.opacity = imA * .55;
    peach.style.opacity = b;

    lineIm.style.opacity = imA * (1 - out);
    lineIm.style.transform = `translate3d(0, ${(1 - imA) * 18 - out * 40}px, 0)`;

    // Scene 3
    word.style.opacity = clamp(b * 2.4);
    word.style.transform = `translate3d(0, ${(1 - b) * H * 0.55}px, 0)`;
    render.style.opacity = clamp(b * 3);
    render.style.transform = `translate3d(0, ${(1 - b) * H * 0.95}px, 0)`;

  }
  requestAnimationFrame(frame);
})();
