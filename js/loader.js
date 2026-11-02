/* 시작 화면 미리보기: 어두운 화면에 Cove 눈 LED 두 개가 켜지고 깜빡이며 두리번거리다가, 준비가 되면 웃는 눈으로 바뀌며 위아래로 열림.
   · 사이트에서는 페이지와 3D(인트로 Cove)가 준비되면 열리고, 너무 오래 걸려도 6초 안에는 열림. 최소 2.4초는 보여 줌. */
(() => {
  const demo = !!window.__loaderDemo, R = document.documentElement;
  const el = document.createElement('div'); el.className = 'cv-load'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="cv-load__half cv-load__half--t"></div><div class="cv-load__half cv-load__half--b"></div><div class="cv-load__center"><div class="cv-load__eyes"><i class="cv-eye"></i><i class="cv-eye"></i></div></div>';
  document.body.appendChild(el); R.classList.remove('loader-on'); R.classList.add('loader-active'); R.style.overflow = 'hidden';
  const t0 = performance.now(), MIN = 2400, MAX = 6000;
  let loaded = document.readyState === 'complete', done = false;
  addEventListener('load', () => { loaded = true; });
  function open() {
    if (done) return; done = true; el.classList.add('is-done');
    setTimeout(() => { el.classList.add('is-open'); window.dispatchEvent(new Event('cove:loader-open')); setTimeout(() => { el.remove(); R.style.overflow = ''; R.classList.remove('loader-active'); try { window.__lenis && window.__lenis.start && window.__lenis.start(); } catch (e) {} }, 1400); }, 750);
  }
  (function tick() {
    const t = performance.now() - t0, introState = R.dataset.introCove;
    const ready = demo ? true : loaded && introState !== 'loading';
    if ((t > MIN && ready) || t > MAX) { open(); return; }
    requestAnimationFrame(tick);
  })();
  if (demo) window.__loaderReplay = () => location.reload();
})();
