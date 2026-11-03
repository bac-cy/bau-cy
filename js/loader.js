/* 시작 화면 미리보기: 어두운 화면에 Cove 눈 LED 두 개가 켜지고 깜빡이며 두리번거리다가, 준비가 되면 웃는 눈으로 바뀌며 위아래로 열림.
   · 사이트에서는 페이지와 3D(인트로 Cove)가 준비되면 열리고, 너무 오래 걸려도 6초 안에는 열림. 최소 2.4초는 보여 줌. */
(() => {
  const demo = !!window.__loaderDemo, R = document.documentElement;
  const el = document.createElement('div'); el.className = 'cv-load'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="cv-load__half cv-load__half--t"></div><div class="cv-load__half cv-load__half--b"></div><div class="cv-load__center"><div class="cv-load__eyes"><i class="cv-eye"></i><i class="cv-eye"></i></div></div>';
  document.body.appendChild(el); R.classList.remove('loader-on'); R.classList.add('loader-active'); R.style.overflow = 'hidden';
  const t0 = performance.now(), MIN = 2400, MAX = 6000;
  // 브라우저는 처음 한 번 누르기 전에는 소리를 막아요 → 막혀 있으면 아래에 작은 안내를 보여 주고, 한 번 누르면 소리가 켜져요
  const hint = document.createElement('p'); hint.className = 'cv-load__hint'; hint.textContent = '소리가 들리려면 화면을 한 번 눌러 주세요'; el.appendChild(hint);
  (function chk(n) { const cs = window.CoveSound; if (cs && cs.running) { hint.remove(); return; } if (cs && cs.on) hint.classList.add('is-on'); if (n < 200) setTimeout(() => chk(n + 1), 100); })(0);
  window.addEventListener('cove:sound-on', () => hint.remove(), { once: true });
  // 눈 모션(켜짐·깜빡임·두리번)에 맞춘 은은한 효과음. 시각 애니메이션(css/loader.css)의 시간과 맞춤.
  const snd = (name) => { if (el.isConnected && !el.classList.contains('is-done')) { const cs = window.CoveSound; if (cs && cs.loader) cs.loader(name); } };
  setTimeout(() => snd('on'), 420);
  for (let k = 0; k < 3; k++) {
    setTimeout(() => snd('blink'), 1300 + 3800 * k + 3800 * 0.384); setTimeout(() => snd('blink'), 1300 + 3800 * k + 3800 * 0.70);
    setTimeout(() => snd('look'), 1600 + 4600 * k + 4600 * 0.28); setTimeout(() => snd('look'), 1600 + 4600 * k + 4600 * 0.62);
  }
  let loaded = document.readyState === 'complete', done = false;
  addEventListener('load', () => { loaded = true; });
  function open() {
    if (done) return; done = true; { const cs = window.CoveSound; if (cs && cs.loader) cs.loader('happy'); } el.classList.add('is-done');
    setTimeout(() => { el.classList.add('is-open'); window.dispatchEvent(new Event('cove:loader-open')); setTimeout(() => { el.remove(); window.dispatchEvent(new Event('cove:loader-done')); R.style.overflow = ''; R.classList.remove('loader-active'); try { window.__lenis && window.__lenis.start && window.__lenis.start(); } catch (e) {} }, 1400); }, 750);
  }
  (function tick() {
    const t = performance.now() - t0, introState = R.dataset.introCove;
    const ready = demo ? true : loaded && introState !== 'loading';
    if ((t > MIN && ready) || t > MAX) { open(); return; }
    requestAnimationFrame(tick);
  })();
  if (demo) window.__loaderReplay = () => location.reload();
})();
