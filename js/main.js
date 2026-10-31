/* ==========================================================
   Cove — interactions
   ========================================================== */

/* ---------- 1. Placeholder Cove illustration ----------
   렌더 이미지가 들어오기 전까지 [data-cove] 자리에 임시 로봇 그림을 그립니다.
   해당 자리를 <img>로 바꾸면 이 그림은 자동으로 사라집니다. */
let coveId = 0;
function coveSVG() {
  const n = ++coveId;
  return `
<svg viewBox="0 0 400 400" role="img" aria-label="Cove 로봇 임시 일러스트">
  <defs>
    <linearGradient id="body${n}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffdfa"/>
      <stop offset=".55" stop-color="#f1ebe3"/>
      <stop offset="1" stop-color="#d8d0cb"/>
    </linearGradient>
    <radialGradient id="rim${n}" cx=".8" cy=".85" r=".6">
      <stop offset="0" stop-color="#c9b8ec" stop-opacity=".8"/>
      <stop offset="1" stop-color="#c9b8ec" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="warm${n}" cx=".2" cy=".9" r=".55">
      <stop offset="0" stop-color="#ffd2ae" stop-opacity=".7"/>
      <stop offset="1" stop-color="#ffd2ae" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="face${n}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3b3447"/>
      <stop offset="1" stop-color="#1c1923"/>
    </linearGradient>
    <linearGradient id="base${n}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9e6ee"/>
      <stop offset="1" stop-color="#b9b5c0"/>
    </linearGradient>
    <filter id="blur${n}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="soft${n}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>

  <!-- light pool & shadow on the desk -->
  <ellipse class="cove-pool cove-soft" cx="200" cy="352" rx="160" ry="22" opacity=".65" filter="url(#blur${n})"/>
  <ellipse class="cove-soft" cx="200" cy="344" rx="100" ry="10" fill="rgba(60,40,70,.22)" filter="url(#soft${n})"/>

  <!-- base -->
  <rect class="cove-solid" x="122" y="314" width="156" height="30" rx="15" fill="url(#base${n})"/>
  <path class="cove-ring cove-soft" d="M136 318 H264" stroke-width="3" stroke-linecap="round" filter="url(#soft${n})"/>
  <path class="cove-ring" d="M138 318 H262" stroke-width="1.5" stroke-linecap="round"/>

  <!-- body -->
  <path class="cove-solid" d="M200 66 C292 66 332 128 332 204 C332 280 286 322 200 322 C114 322 68 280 68 204 C68 128 108 66 200 66 Z" fill="url(#body${n})"/>
  <path class="cove-soft" d="M200 66 C292 66 332 128 332 204 C332 280 286 322 200 322 C114 322 68 280 68 204 C68 128 108 66 200 66 Z" fill="url(#rim${n})"/>
  <path class="cove-soft" d="M200 66 C292 66 332 128 332 204 C332 280 286 322 200 322 C114 322 68 280 68 204 C68 128 108 66 200 66 Z" fill="url(#warm${n})"/>
  <ellipse class="cove-soft" cx="148" cy="118" rx="58" ry="24" fill="#fff" opacity=".8" transform="rotate(-22 148 118)" filter="url(#soft${n})"/>
  <path class="cove-solid" d="M92 262 Q200 296 308 262" fill="none" stroke="rgba(60,40,70,.08)" stroke-width="1.5"/>
  <circle class="cove-eye" cx="200" cy="88" r="2.5"/>

  <!-- face -->
  <rect class="cove-solid" x="116" y="150" width="168" height="102" rx="51" fill="url(#face${n})"/>
  <path class="cove-soft" d="M140 160 Q200 150 260 160" stroke="rgba(255,255,255,.12)" stroke-width="3" fill="none" stroke-linecap="round"/>

  <!-- eyes -->
  <g class="cove-eyes">
    <rect class="cove-eye-glow cove-soft" x="148" y="178" width="28" height="46" rx="14" filter="url(#soft${n})"/>
    <rect class="cove-eye-glow cove-soft" x="224" y="178" width="28" height="46" rx="14" filter="url(#soft${n})"/>
    <rect class="cove-eye" x="152" y="182" width="20" height="38" rx="10"/>
    <rect class="cove-eye" x="228" y="182" width="20" height="38" rx="10"/>
  </g>
</svg>`;
}

document.querySelectorAll('[data-cove]').forEach(el => {
  if (!el.children.length) el.innerHTML = coveSVG();
});

/* ---------- 2. Reveal on scroll ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---------- 3. Nav background on scroll ---------- */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- 6. Page indicator ----------
   좌측 하단에 지금 보고 있는 섹션을 표시합니다. (인트로에서는 숨김)
   이름/번호를 바꾸려면 아래 목록만 수정하면 됩니다. */
const PAGES = [
  { sel: '#intro',       num: '',   name: '' },
  { sel: '#about',       num: '01', name: 'About' },
  { sel: '#features',    num: '02', name: 'Features' },
  { sel: '#design',      num: '03', name: 'Design' },
  { sel: '#gallery',     num: '04', name: 'Gallery' },
  { sel: '.closing',     num: '',   name: 'Credits' },
].map(p => ({ ...p, el: document.querySelector(p.sel) })).filter(p => p.el);

const pager = document.getElementById('pager');
const pagerNum = pager.querySelector('.pager__num');
const pagerName = pager.querySelector('.pager__name');
let pagerIndex = -1, pagerTick = false;

function updatePager() {
  pagerTick = false;
  const mid = window.innerHeight * 0.5;
  let idx = 0;
  PAGES.forEach((p, i) => { if (p.el.getBoundingClientRect().top <= mid) idx = i; });
  const cur = PAGES[idx];
  const show = Boolean(cur.name);
  pager.classList.toggle('is-visible', show);
  pager.classList.toggle('is-dark', false);
  if (idx !== pagerIndex && show) {
    const first = pagerIndex === -1 || !pager.classList.contains('is-visible');
    pager.classList.add('is-swapping');
    setTimeout(() => {
      pagerNum.textContent = cur.num;
      pagerName.textContent = cur.name;
      pager.classList.remove('is-swapping');
    }, first ? 0 : 250);
  }
  pagerIndex = idx;
}
window.addEventListener('scroll', () => { if (!pagerTick) { pagerTick = true; requestAnimationFrame(updatePager); } }, { passive: true });
window.addEventListener('resize', updatePager);
updatePager();

/* ---------- 7. Nav highlight ----------
   스크롤 위치에 맞는 상단 메뉴 항목을 강조합니다. (인트로·마지막 문구 구간에서는 강조 없음) */
const spyItems = [...document.querySelectorAll('.nav__links a')]
  .map(a => ({ a, el: document.querySelector(a.getAttribute('href')) })).filter(x => x.el);
const spyEnd = document.querySelector('.closing');
let spyTick = false;
function updateNavSpy() {
  spyTick = false;
  const mid = window.innerHeight * 0.45;
  let cur = null;
  spyItems.forEach(x => { if (x.el.getBoundingClientRect().top <= mid) cur = x; });
  if (cur && spyEnd && spyEnd.getBoundingClientRect().top <= mid) cur = null;
  spyItems.forEach(x => {
    if (x === cur) x.a.setAttribute('aria-current', 'location'); else x.a.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => { if (!spyTick) { spyTick = true; requestAnimationFrame(updateNavSpy); } }, { passive: true });
window.addEventListener('resize', updateNavSpy);
updateNavSpy();

/* ---------- 8. Gallery film ----------
   · 화면에 절반 이상 보일 때만 재생하고 벗어나면 멈춘다. (소리 없이 반복)
   · 영상을 누르면 전체 화면: 처음부터, 소리와 함께, 조작 막대가 보인다. 닫으면(Esc · 다시 누르기) 원래대로 돌아온다. */
(() => {
  const fig = document.querySelector('.gallery__film'), v = fig && fig.querySelector('video');
  if (!v) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFull = () => document.fullscreenElement === fig || document.webkitFullscreenElement === fig || v.webkitDisplayingFullscreen;
  new IntersectionObserver(([en]) => {
    if (reduce || isFull()) return;
    if (en.intersectionRatio >= 0.5) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
  }, { threshold: [0, 0.5] }).observe(v);
  if (reduce) v.controls = true;

  // 전체 화면에서는 조작 막대가 바로 숨고, 마우스를 움직이거나 화면을 누르면 잠깐 나타났다 다시 숨는다
  let hideT = 0;
  const showBar = () => { if (!isFull()) return; v.controls = true; fig.style.cursor = ''; clearTimeout(hideT); hideT = setTimeout(hideBar, 1500); };
  const hideBar = () => { if (!isFull() || v.paused) return; v.controls = false; fig.style.cursor = 'none'; };
  ['pointermove', 'pointerdown', 'touchstart'].forEach(t => fig.addEventListener(t, showBar, { passive: true }));
  const enter = () => {
    v.currentTime = 0; v.muted = false; v.controls = false; fig.classList.add('is-full'); setTimeout(hideBar, 300);
    const req = fig.requestFullscreen || fig.webkitRequestFullscreen;
    if (req) { const r = req.call(fig); if (r && r.catch) r.catch(() => exitUI()); }
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();                  // iPhone Safari
    const p = v.play(); if (p && p.catch) p.catch(() => {});
  };
  const exitUI = () => { clearTimeout(hideT); fig.style.cursor = ''; fig.classList.remove('is-full'); v.muted = true; v.controls = reduce; const p = v.play(); if (p && p.catch && !reduce) p.catch(() => {}); };
  fig.addEventListener('click', (e) => {
    if (isFull()) { if (e.target === fig) (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }   // 전체 화면에서는 영상 조작 막대를 쓴다
    enter();
  });
  fig.tabIndex = 0; fig.setAttribute('role', 'button'); fig.setAttribute('aria-label', '홍보 영상 전체 화면으로 보기');
  fig.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !isFull()) { e.preventDefault(); enter(); } });
  const onChange = () => { if (!isFull()) exitUI(); };
  document.addEventListener('fullscreenchange', onChange); document.addEventListener('webkitfullscreenchange', onChange);
  v.addEventListener('webkitendfullscreen', exitUI);
})();
