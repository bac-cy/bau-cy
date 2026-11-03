/* 자동 스크롤 (전시용): 항상 켜져 있어서 마우스·터치 없이도 페이지가 천천히 스스로 내려가요.
   · 마우스 커서를 움직이면 그때부터 마우스가 제어권을 가져요(자동 스크롤 멈춤). 커서를 10초 동안 가만히 두면 다시 자동으로 내려가요.
   · 휠·터치·클릭·키보드를 써도 바로 멈추고, 25초 동안 아무것도 안 하면 이어서 내려가요.
   · 맨 아래에 닿으면 몇 초 머문 뒤 새로고침해서 처음(눈 시작 화면)부터 다시 시작해요.
   · 영상 전체 화면, 시작 화면 중에는 멈춰 있어요. 주소 끝에 ?auto=0 을 붙이면 자동 스크롤이 꺼져요. */
(() => {
  const q = new URLSearchParams(location.search); if (q.get('auto') === '0') return;
  const SPEED = 90, SLOW_INTRO = 0.5, RESUME_MS = 25000, MOUSE_MS = 10000, END_WAIT_MS = 9000, START_DELAY_MS = 3500;   // 초당 px, 인트로 구간 배속, 사용 후 재개, 맨 아래 대기, 시작 대기
  let y = 0, last = 0, startAt = 0, pausedUntil = 0, endAt = 0, started = false;
  const maxY = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const busy = () => document.documentElement.classList.contains('loader-on') || document.documentElement.classList.contains('loader-active') || !!document.fullscreenElement || !!document.webkitFullscreenElement || document.hidden;
  const touch = (ms) => { pausedUntil = performance.now() + (ms || RESUME_MS); y = scrollY; endAt = 0; };
  let mx = null, my = null;                                                      // 마우스 커서가 실제로 움직였을 때만 제어권을 넘김(스크롤 때문에 생기는 가짜 움직임은 무시)
  addEventListener('mousemove', (e) => { if (mx === null) { mx = e.screenX; my = e.screenY; return; } if (Math.hypot(e.screenX - mx, e.screenY - my) >= 4) { mx = e.screenX; my = e.screenY; touch(MOUSE_MS); } }, { passive: true, capture: true });
  ['wheel', 'pointerdown', 'touchstart', 'keydown'].forEach(t => addEventListener(t, () => touch(),  { passive: true, capture: true }));
  addEventListener('cove:loader-done', () => { startAt = performance.now() + START_DELAY_MS; started = true; });
  setTimeout(() => { if (!started) { startAt = performance.now() + START_DELAY_MS; started = true; } }, 9000);    // 시작 화면 신호를 놓쳐도 시작
  const intro = () => document.getElementById('intro');
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now;
    if (!started || now < startAt || now < pausedUntil || busy()) { y = scrollY; return; }
    if (maxY() > innerHeight * 2 && scrollY >= maxY() - 2) {                                                  // 맨 아래: 잠시 머문 뒤 처음부터 다시
      if (!endAt) endAt = now; if (now - endAt > END_WAIT_MS) location.reload(); return;
    }
    endAt = 0;
    const it = intro(), inIntro = !!it && it.getBoundingClientRect().bottom > innerHeight * 0.3;
    y += SPEED * (inIntro ? SLOW_INTRO : 1) * dt;
    if (Math.abs(y - scrollY) > 60) y = scrollY + SPEED * dt;                      // 다른 방식으로 위치가 바뀌었으면 현재 위치에서 이어서
    scrollTo({ top: y, left: 0, behavior: 'instant' });                           // 사이트의 부드러운 스크롤 설정과 겹치지 않게 즉시 이동
  }
  requestAnimationFrame(tick);
})();
