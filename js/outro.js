/* 아웃트로: 화면에 들어오면 줄이 위에서부터 차례로 나타납니다. */
(() => {
  const outro = document.getElementById('outro');
  if (!outro) return;
  const lines = [...outro.querySelectorAll('.outro__logo, .outro__event, .r')];
  lines.forEach((el, i) => el.style.setProperty('--d', `${i * 110}ms`));
  new IntersectionObserver(([en], io) => { if (en.isIntersecting) { outro.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.25 }).observe(outro);
})();
