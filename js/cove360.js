/* ==========================================================
   Cove 360° 뷰어 (KeyShot로 뽑은 20×20 이미지: assets/cove360/{가로}_{세로}.webp)
   · 끌면 돌아가요(가로 = 한 바퀴, 세로 = 위·아래 각도). 놓으면 관성으로 조금 더 돌아요.
   · data-v360="drag" : Design 칸 — 가만히 두면 천천히 혼자 돌아요.
   · data-v360="follow": 마무리 장면 — 마우스를 따라 몸을 돌려요(마우스가 없으면 살짝 흔들려요).
   · 화면 근처에 왔을 때에만 이미지를 불러오고, 아직 못 받은 각도는 가장 가까운 이미지로 대신 보여요.
   ========================================================== */
(() => {
  const DIR = 'assets/cove360s/', CROP = [0.2, 0.14, 0.6, 0.74], N = 20,   // 가운데 Cove 부분만 잘라 줄인 이미지(원본 크기의 1/4 정도 메모리): 위치·크기는 원래 전체 프레임 기준으로 맞춰 그림
     ASPECT = 2039 / 1440, U0 = 10, V0 = 10, VMIN = 3;   // 세로 0~2 는 바닥면이라 쓰지 않음
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const wrap = (u) => ((u % N) + N) % N;

  function make(host) {
    const mode = host.dataset.v360 === 'follow' ? 'follow' : 'drag';
    const cv = document.createElement('canvas'); cv.className = 'v360__cv'; cv.setAttribute('aria-hidden', 'true');
    host.appendChild(cv);
    const cx = cv.getContext('2d');
    const imgs = new Map();                       // 'u_v' → 불러온 Image
    let u = U0, v = V0, vu = 0, vv = 0;           // 현재 각도(소수), 속도
    let z = 1, tz = 1, goal = null;               // 확대(현재·목표), 버튼으로 정한 목표 각도
    let tu = U0, tv = V0;                         // follow 모드 목표
    let dragging = false, lastX = 0, lastY = 0, lastMove = performance.now(), mouseT = -1e9;
    const fig3d = mode === 'follow' ? host.closest('.intro__render') : null;
    let started = false, visible = false, ready = false, w = 0, h = 0, drawn = '';
    const noAuto = host.dataset.auto === 'off';                                // 버튼으로 각도를 고르는 칸(Design)은 혼자 돌지 않음
    if (host.dataset.start) { const s = host.dataset.start.split(',').map(Number); u = s[0]; v = s[1]; }

    const key = (a, b) => a + '_' + b;
    const near = (ua) => {                        // 주어진 회전 번호·지금 높이에서 가장 가까운, 이미 받은 이미지
      const a = wrap(Math.round(ua)), b = clamp(Math.round(v), 0, N - 1);
      let best = null, bd = 1e9;
      for (let r = 0; r < N && !best; r++) {
        for (let da = -r; da <= r; da++) for (let db = -r; db <= r; db++) {
          if (Math.max(Math.abs(da), Math.abs(db)) !== r) continue;
          const bb = b + db; if (bb < 0 || bb >= N) continue;
          const im = imgs.get(key(wrap(a + da), bb)); if (!im) continue;
          const d = da * da + db * db; if (d < bd) { bd = d; best = im; }
        }
      }
      return best;
    };

    function load() {                             // 시작 각도 → 같은 높이 한 바퀴 → 나머지 순으로 받음
      if (started) return; started = true;
      const order = [];
      for (let i = 0; i < N; i++) order.push([wrap(U0 + i), V0]);
      // 위·아래 각도는 한 줄 건너 한 줄만 받음(가까운 줄로 대신 보여 줌): 받는 양과 메모리가 반으로 줄어 버퍼링이 덜함. 마무리 장면은 위아래 ±4줄만 씀.
      const reach = mode === 'follow' ? 4 : N;
      for (let d = 2; d < N && d <= reach; d += 2) for (const b of [V0 - d, V0 + d]) if (b >= 4 && b <= 18) for (let i = 0; i < N; i++) order.push([wrap(U0 + i), b]);
      let i = 0;
      const next = () => {
        if (i >= order.length) return;
        const [a, b] = order[i++], im = new Image(); im.decoding = 'async';
        im.onload = () => { const done = () => { imgs.set(key(a, b), im); if (!ready) { ready = true; host.classList.add('is-ready'); const fg = host.closest('figure'); if (fg) fg.classList.add('has-360'); } next(); }; if (im.decode) im.decode().then(done, done); else done(); };     // 미리 풀어 둬서 처음 그릴 때 끊기지 않게
        im.onerror = next; im.src = DIR + b + '_' + a + '.webp';          // 파일 이름은 {위·아래 각도}_{회전}
      };
      for (let k = 0; k < 6; k++) next();
    }

    function fit() {
      const d = Math.min(devicePixelRatio || 1, 2), W = host.clientWidth, H = host.clientHeight;
      if (!W || !H) return; w = W; h = H; cv.width = Math.round(W * d); cv.height = Math.round(H * d); cx.setTransform(d, 0, 0, d, 0, 0); drawn = '';
    }
    new ResizeObserver(fit).observe(host); fit();

    function draw() {
      // 20장 사이의 각도는 이웃한 두 장을 겹쳐(크로스페이드) 그려서, 장면이 뚝뚝 바뀌며 지글거리는 것을 없앰
      const f0 = Math.floor(u), k = u - f0; let im = near(f0); if (!im || !w) return;
      // 겹침은 두 장 사이의 가운데 30%에서만(그 밖에서는 한 장만): 계속 겹쳐 있으면 눈이 여러 개로 보이는 잔상이 생김
      let im2 = im, a2 = 0;
      if (k >= 0.65) im = near(f0 + 1); else if (k > 0.35) { im2 = near(f0 + 1); const q = (k - 0.35) / 0.3; a2 = im2 === im ? 0 : q * q * (3 - 2 * q); }
      const id = im.src + im2.src + a2.toFixed(2) + w + 'x' + h + '@' + z.toFixed(3); if (id === drawn) return; drawn = id;
      let dw = w, dh = w / ASPECT; if (dh > h) { dh = h; dw = h * ASPECT; }                // 칸 안에 맞춤(contain)
      cx.clearRect(0, 0, w, h); cx.save(); cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high'; cx.translate(w / 2, h / 2); cx.scale(z, z);
      const rx = -dw / 2 + CROP[0] * dw, ry = -dh / 2 + CROP[1] * dh, rw = CROP[2] * dw, rh = CROP[3] * dh;
      cx.drawImage(im, rx, ry, rw, rh);
      if (a2 > 0) { cx.globalAlpha = a2; cx.drawImage(im2, rx, ry, rw, rh); cx.globalAlpha = 1; }
      cx.restore();
    }

    // 끌기 (마우스: 가로·세로, 터치: 가로만 — 세로는 페이지 스크롤에 양보)
    host.addEventListener('pointerdown', (e) => {
      if (mode === 'follow') return;
      host.dispatchEvent(new Event('v360:drag')); dragging = true; goal = null; lastX = e.clientX; lastY = e.clientY; vu = vv = 0; host.classList.add('is-drag');
      try { host.setPointerCapture(e.pointerId); } catch (_) {}
    });
    host.addEventListener('pointermove', (e) => {
      if (mode === 'follow') { mouseT = performance.now(); tu = U0 + (e.clientX / innerWidth - 0.5) * 16; tv = V0 + (e.clientY / innerHeight - 0.5) * 7; return; }
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; lastMove = performance.now();
      const k = N / Math.max(320, w) * 1.5;        // 칸 너비 하나 끌면 한 바퀴 반
      u -= dx * k; vu = -dx * k;
      if (e.pointerType !== 'touch') { v = clamp(v + dy * 0.05 * (N / 10), VMIN, N - 1); vv = dy * 0.05 * (N / 10); }
    });
    const up = () => { if (!dragging) return; dragging = false; host.classList.remove('is-drag'); if (performance.now() - lastMove > 90) vu = vv = 0; lastMove = performance.now(); };
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    if (mode === 'follow') addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; mouseT = performance.now(); tu = U0 + (e.clientX / innerWidth - 0.5) * 16; tv = V0 + (e.clientY / innerHeight - 0.5) * 7; }, { passive: true });

    /* 마무리 장면: 마우스·손가락으로 Cove 근처를 끌면 키샷 360° 렌더가 그대로 돌아감(3D로 바뀌지 않음). 놓고 3초 뒤 다시 마우스를 따라감.
       그냥 누르기(끌지 않음)는 3D 반응(js/intro-cove.js)이 처리하고, 세로로 쓸어 내리면 페이지 스크롤이 그대로 됨(touch-action: pan-y). */
    let fd = null, fmoved = false, holdUntil = 0, fx = 0, fy = 0;
    if (fig3d) {
      const inZone = (e) => { const r = fig3d.getBoundingClientRect(); return e.clientX > r.left - r.width * 0.1 && e.clientX < r.right + r.width * 0.1 && e.clientY > r.top - r.height * 0.45 && e.clientY < r.bottom + r.height * 0.1; };
      addEventListener('pointerdown', (e) => { if (e.button > 0 || !visible || !inZone(e) || (e.target.closest && e.target.closest('a, button, nav'))) return; fd = { x: e.clientX, y: e.clientY }; fmoved = false; fx = e.clientX; fy = e.clientY; }, { passive: true });
      addEventListener('pointermove', (e) => {
        if (!fd) return;
        if (!fmoved && Math.abs(e.clientX - fd.x) + Math.abs(e.clientY - fd.y) > 8) { fmoved = true; fig3d.classList.add('is-drag360'); vu = vv = 0; }
        if (!fmoved) return;
        const dx = e.clientX - fx, dy = e.clientY - fy; fx = e.clientX; fy = e.clientY; holdUntil = performance.now() + 3000;
        const k = N / Math.max(320, w) * 1.5; u -= dx * k; if (e.pointerType !== 'touch') v = clamp(v + dy * 0.05 * (N / 10), VMIN, N - 1);
      }, { passive: true });
      const fup = () => { if (!fd) return; fd = null; if (fmoved) { u = U0 + (((u - U0 + N / 2) % N) + N) % N - N / 2; holdUntil = performance.now() + 3000; } };    // 한 바퀴 이상 돌렸어도 가까운 쪽으로 돌아가게 정리
      addEventListener('pointerup', fup, { passive: true }); addEventListener('pointercancel', fup, { passive: true });
    }

    let last = performance.now();
    function tick(now) {
      requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!visible) return;
      z += (tz - z) * Math.min(1, dt * 8); if (Math.abs(tz - z) < 0.002) z = tz;
      if (goal && !dragging) {                                                         // 보는 각도 버튼: 가까운 쪽으로 돌아 이동
        let du = goal.u - wrap(u); if (du > N / 2) du -= N; if (du < -N / 2) du += N;
        u += du * Math.min(1, dt * 6); v += (goal.v - v) * Math.min(1, dt * 6); lastMove = now;
        if (Math.abs(du) < 0.02 && Math.abs(goal.v - v) < 0.02) { u = goal.u; v = goal.v; goal = null; }
      } else if (mode === 'follow' && fig3d && (fd && fmoved || now < holdUntil)) {
        /* 끌고 있거나 놓은 직후: 사용자가 돌려 둔 각도 유지 */
      } else if (mode === 'follow') {
        if (fig3d && fig3d.classList.contains('is-drag360')) { fig3d.classList.remove('is-drag360'); fmoved = false; }
        const idle = now - mouseT > 4000;
        if (fig3d && fig3d.classList.contains('is-act')) { tu = U0; tv = V0; u += (U0 - u) * Math.min(1, dt * 14); v += (V0 - v) * Math.min(1, dt * 14); }   // 3D Cove가 움직이는 동안은 정면으로 맞춰 둠(돌아올 때 어긋나지 않게)
        else if (idle) { tu = U0 + Math.sin(now / 2600) * 1.8; tv = V0 + Math.cos(now / 3300) * 1.2; }
        u += (tu - u) * Math.min(1, dt * 5); v += (clamp(tv, VMIN, N - 1) - v) * Math.min(1, dt * 5);
      } else if (!dragging) {
        if (Math.abs(vu) > 0.01 || Math.abs(vv) > 0.01) { u += vu; v = clamp(v + vv, VMIN, N - 1); const f = Math.pow(0.04, dt); vu *= f; vv *= f; }
        else if (!noAuto && now - lastMove > 2500) u += dt * 1.1;                                  // 가만히 두면 천천히 돈다
      }
      draw();
    }
    requestAnimationFrame(tick);
    host.v360 = {
      go: (a, b) => { goal = { u: wrap(a), v: clamp(b, VMIN, N - 1) }; vu = vv = 0; },
      zoom: (f) => { tz = clamp(tz * f, 0.7, 2.6); },
      set: (a, b, zz) => { u = wrap(a); v = clamp(b, VMIN, N - 1); z = tz = clamp(zz, 0.7, 2.6); goal = null; vu = vv = 0; drawn = ''; },        // 3D 시뮬레이터와 각도를 맞출 때(즉시)
      get: () => ({ u: wrap(u), v, z: tz }),
    };

    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (en.isIntersecting) load(); }, { rootMargin: '2200px 0px' }).observe(host);
  }

  document.querySelectorAll('[data-v360]').forEach(make);
  // ───────── Design 칸: 고화질 360° + 3D 시뮬레이터를 하나로 ─────────
  // 평소: 360° 렌더가 보임(끌어서 회전, Top/Front/Perspective/Side·확대 버튼). 동작 버튼을 누르면 같은 각도의 3D 시뮬레이터가 이어받아
  // 움직이고(인사·쓰다듬기·공놀이·머리 끌기 등), 가만히 두면 자세를 원래대로 돌린 뒤 다시 360° 렌더로 돌아온다.
  const fig = document.querySelector('.design__visual'), host = fig && fig.querySelector('.v360');
  if (!fig || !host) return;
  const sim = () => window.COVE_SIM;
  const VIEW360 = { top: [180, 84], front: [0, 5], persp: [35, 14], side: [90, 5] };      // 시뮬레이터 보기 각도 {회전 az, 높이 el}
  const azToU = (az) => U0 + az / 18, elToV = (el) => V0 + (el - 5) / 8.2;                // 3D 카메라 각도 ↔ 360° 이미지 번호 (u=15 가 az 90)
  const uToAz = (u0) => { let d = wrap(u0) - U0; if (d > N / 2) d -= N; return d * 18; }, vToEl = (v0) => clamp((v0 - V0) * 8.2 + 5, -5, 84);
  const ready = () => host.classList.contains('is-ready') && host.v360;
  host.addEventListener('v360:drag', () => fig.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', 'false')));      // 끌어서 돌리면 고른 각도 표시를 끔
  let live = false, returning = false;

  fig.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {      // 보는 각도 버튼 → 360°도 같이 돌아감
    const t = VIEW360[b.dataset.view]; if (t && ready()) host.v360.go(azToU(t[0]), elToV(t[1]));
  }));
  fig.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => { if (ready()) host.v360.zoom(b.dataset.zoom === 'in' ? 1.25 : 0.8); }));
  fig.querySelector('[data-act="reset"]')?.addEventListener('click', () => { if (ready()) { host.v360.go(azToU(35), elToV(14)); host.v360.zoom(1 / host.v360.get().z); } });

  function goLive() {                                                                          // 360° → 3D: 같은 각도·크기로 맞춘 뒤 3D 를 보여 줌
    const s = sim(); if (live || !s || !ready()) return;
    const g = host.v360.get(), az = uToAz(g.u), el = vToEl(g.v);
    s.camGoal.az = s.cam.az = az; s.camGoal.el = s.cam.el = el; s.camGoal.zoom = s.cam.zoom = clamp(g.z, 0.6, 3.2);
    live = true; fig.classList.add('is-live');
  }
  fig.querySelectorAll('[data-motion]').forEach((b) => b.addEventListener('click', goLive, true));      // 시뮬레이터가 클릭을 처리하기 전에 각도부터 맞춤

  setInterval(() => {                                                                          // 3D 로 이어받은 동안 가만히 있으면 360° 로 복귀
    const s = sim(); if (!live || returning || !s || s.busy) return;
    returning = true; s.stop(false);                                                           // 자세를 원래대로(AWAKE)
    const t0 = performance.now();
    const back = () => {
      const p = s.pose, g = s.goal, settled = ['neck', 'head', 'tilt', 'body'].every((j) => Math.abs(p[j] - g[j]) < 1.2);
      if (!settled && performance.now() - t0 < 2800) { setTimeout(back, 120); return; }
      if (s.busy) { returning = false; return; }                                               // 그 사이 다시 만졌으면 계속 3D
      host.v360.set(azToU(s.cam.az), elToV(s.cam.el), s.cam.zoom);
      live = false; returning = false; fig.classList.remove('is-live');
    };
    setTimeout(back, 150);
  }, 400);
})();