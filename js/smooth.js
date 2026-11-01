/* 전체 스크롤을 부드럽게 (Lenis, MIT) — 휠을 한 칸씩 굴려도 미끄러지듯 이어지고, 멈출 때 서서히 감속해요.
   터치 스크롤은 기기 기본 동작을 그대로 쓰고, 카드 안의 휠 조작(Engineering)·확대(시뮬레이터 Ctrl+휠)는 그대로 동작해요. */
(() => {
  if (!window.Lenis) return;
  const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.55, smoothWheel: true, syncTouch: false });
  window.__lenis = lenis;
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  // 메뉴·링크의 #이동도 같은 부드러움으로
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = document.querySelector(id); if (!el) return;
    e.preventDefault();
    lenis.scrollTo(el, { offset: -(parseFloat(getComputedStyle(el).scrollMarginTop) || 0), duration: 1.4 });
  });
})();
