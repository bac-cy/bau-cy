/* 디테일 효과 (사용자 요청으로 적용): 필름 입자 · 자석 버튼 · 카드 빛/기울기 */
(() => {
  if (window.COVE_LITE) return;                       // 가벼운 모드: 입자·기울기·자석 효과 없음
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.documentElement.classList.add('fx');
  // 1) 필름 입자
  const g = document.createElement('div'); g.className = 'fx-grain'; g.setAttribute('aria-hidden', 'true'); document.body.appendChild(g);
  // (스프링 트레일 커서·제목 공개는 요청 시 추가 — 지금은 입자·자석 버튼·카드 빛만 적용)
  if (!fine) return;
  // 4) 자석 버튼
  document.querySelectorAll('.sim__motions button, .nav__links a').forEach(b => {
    b.classList.add('fx-mag');
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * .32).toFixed(1)}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
  // 5) 카드: 따라오는 빛 + 1~2도 기울기 (Key Features)
  document.querySelectorAll('.feature').forEach(c => {
    c.classList.add('fx-card');
    c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height; c.style.setProperty('--mx', px * 100 + '%'); c.style.setProperty('--my', py * 100 + '%'); c.style.transform = `perspective(900px) rotateY(${((px - .5) * 5).toFixed(2)}deg) rotateX(${((.5 - py) * 5).toFixed(2)}deg) translateY(-3px)`; });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
})();
