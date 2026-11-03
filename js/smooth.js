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
    const offset = -(parseFloat(getComputedStyle(el).scrollMarginTop) || 0), dist = Math.abs(el.getBoundingClientRect().top + offset);
    if (dist < 4) return;
    /* 메뉴 이동: 천천히 출발해서 속도를 내고 부드럽게 멈추는 한 번의 스크롤(거리에 맞춰 0.8~1.6초).
       이동하는 동안 주변이 어색하게 반응하지 않도록: 메뉴 바는 그대로 있고, 강조 항목은 누른 항목에 고정,
       페이지 표시는 도착한 뒤에 바뀌고, 유리 흐림 효과는 잠시 꺼서(가벼워짐) 끊김을 줄여요. */
    const dur = Math.min(1.6, Math.max(0.8, 0.7 + dist / innerHeight * 0.1));
    const R = document.documentElement; window.__coveJump = id; R.classList.add('is-jumping');
    let ended = false;
    const end = () => { if (ended) return; ended = true; window.__coveJump = null; R.classList.remove('is-jumping'); window.dispatchEvent(new Event('scroll')); };
    lenis.scrollTo(el, { offset, duration: dur, easing: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, onComplete: end });
    setTimeout(end, dur * 1000 + 600);
  });
})();
