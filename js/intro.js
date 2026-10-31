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
  const dots = $('.intro__dots'), fade = $('.intro__fade');
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
  const startIm = () => { if (imStarted) return; imStarted = true; typeInto(lineIm, 150, () => { imDone = true; }); };
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

  /* ---------- 스크롤 진행도 ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  let p = 0;
  function readScroll() {
    const r = intro.getBoundingClientRect();
    p = clamp(-r.top / Math.max(1, r.height - window.innerHeight));
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const r = intro.getBoundingClientRect();
    if (r.bottom < -50 || r.top > window.innerHeight + 50) return;   // 화면 밖이면 쉼
    readScroll();
    const W = window.innerWidth, H = window.innerHeight;

    const a = easeOut(clamp((p - 0.04) / 0.06));       // 1 → 2 장면 전환
    const b = easeOut(clamp((p - 0.30) / 0.45));       // 3 장면 올라오기
    const out = clamp((p - 0.28) / 0.10);              // I'm cove 사라짐
    const f = clamp((p - 0.94) / 0.06);                // 끝에서 기본 배경색으로 이어짐

    if (p >= 0.06) startIm();
    if (p >= 0.30 && !imDone && imStarted) {           // 타이핑이 끝나기 전에 넘어가면 바로 완성
      lineIm.querySelector('.intro__typed').textContent = lineIm.dataset.type;
      lineIm.querySelector('.intro__caret').classList.add('is-done'); imDone = true;
    }

    // Scene 1
    lineHi.style.opacity = 1 - a;
    lineHi.style.transform = `translate3d(0, ${-a * 24}px, 0)`;

    // Scene 2 — 그라디언트 위치 계산
    const idle = !pointer.active || now - pointer.t > 2500;
    const tx = idle ? .55 + Math.sin(now / 3800) * .16 : pointer.x;
    const ty = idle ? .45 + Math.cos(now / 4600) * .12 : pointer.y;
    cur.x += (tx - cur.x) * .045; cur.y += (ty - cur.y) * .045;
    const ax = cur.x * W, ay = cur.y * H;
    blobA.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
    blobB.style.transform = `translate3d(${W - ax * .8}px, ${H - ay * .7}px, 0)`;
    const glow = a * (1 - .55 * b);
    blobA.style.opacity = glow; blobB.style.opacity = glow;
    dots.style.opacity = a * .55;
    peach.style.opacity = b;

    lineIm.style.opacity = a * (1 - out);
    lineIm.style.transform = `translate3d(0, ${-out * 40}px, 0)`;

    // Scene 3
    word.style.opacity = clamp(b * 2.4);
    word.style.transform = `translate3d(0, ${(1 - b) * H * 0.55}px, 0)`;
    render.style.opacity = clamp(b * 3);
    render.style.transform = `translate3d(0, ${(1 - b) * H * 0.95}px, 0)`;

    fade.style.opacity = f;
  }
  requestAnimationFrame(frame);
})();
