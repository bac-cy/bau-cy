/* 글자 해독(스크램블) 효과 미리보기 — 주소 끝에 ?scramble=1 을 붙였을 때만 동작해요(기본 화면은 그대로).
   작은 라벨·푸터 크레딧 글자가 화면에 들어오면 무작위 기호가 빠르게 바뀌다가 왼쪽부터 제 글자로 맞춰져요. 마우스를 올려도 다시 한 번 재생돼요.
   마음에 들면 위의 주소 조건을 지우면 항상 적용돼요. 되돌리려면 cove.html 의 js/scramble.js 줄을 지움. */
(() => {
  if (!/[?&]scramble=1/.test(location.search)) return;
  const GLYPHS = '01:/+-=<>[]#%&*ABCDEFGHJKLMNPRSTVXZ';
  const SEL = '.label, .eyebrow, .about__text h3, .footer__credits dt, .footer__credits dd, .footer__event, .specs dt, .pager__name';
  const rnd = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  function run(el) {
    if (el._sc) return; const final = el._final || (el._final = el.textContent); if (!final.trim()) return;
    el._sc = true; const n = final.length, t0 = performance.now(), DUR = Math.min(900, 380 + n * 22);
    (function step(now) {
      const p = Math.min(1, (now - t0) / DUR), fixed = Math.floor(p * n * 1.15);
      let s = ''; for (let i = 0; i < n; i++) { const c = final[i]; s += (i < fixed || c === ' ' || c === '·' || c === '→') ? c : rnd(); }
      el.textContent = s;
      if (p < 1) requestAnimationFrame(step); else { el.textContent = final; el._sc = false; }
    })(t0);
  }
  const els = [...document.querySelectorAll(SEL)].filter(el => !el.children.length && el.textContent.trim());
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting && !e.target._done) { e.target._done = true; run(e.target); } }), { threshold: 0.6 });
  els.forEach(el => { io.observe(el); el.addEventListener('pointerenter', () => run(el)); });
})();
