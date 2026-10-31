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

/* ---------- 4. Hero glow follows the pointer (subtle) ---------- */
const hero = document.querySelector('.hero');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (hero && !reduced) {
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    hero.style.setProperty('--mx', `${x * 60}px`);
    hero.style.setProperty('--my', `${y * 40}px`);
  });
}

/* ---------- 5. Experience moods ----------
   문구를 바꾸고 싶으면 아래 내용만 수정하면 됩니다. */
const MOODS = {
  wake:   { title: 'Good morning', desc: '아침이 오면 천천히 눈을 뜨고, 따뜻한 빛으로 하루의 시작을 알립니다.' },
  listen: { title: 'I’m listening', desc: '말을 걸면 눈빛이 부드러운 라벤더로 바뀌며, 숨 쉬듯 반응합니다.' },
  focus:  { title: 'Stay with you', desc: '집중하는 동안에는 눈을 가늘게 뜨고, 은은한 빛만 남긴 채 조용히 곁을 지킵니다.' },
  rest:   { title: 'Rest well',     desc: '하루가 끝나면 노을빛으로 물들며 천천히 눈을 감습니다.' },
};
const exp = document.getElementById('experience');
const moodText = document.querySelector('.mood-text');
const moodTitle = document.getElementById('mood-title');
const moodDesc = document.getElementById('mood-desc');
const moodButtons = document.querySelectorAll('.moods button');

moodButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const mood = btn.dataset.mood;
    if (exp.dataset.mood === mood) return;
    moodButtons.forEach(b => b.setAttribute('aria-selected', String(b === btn)));
    exp.dataset.mood = mood;
    moodText.classList.add('is-changing');
    setTimeout(() => {
      moodTitle.textContent = MOODS[mood].title;
      moodDesc.textContent = MOODS[mood].desc;
      moodText.classList.remove('is-changing');
    }, 300);
  });
});

/* ---------- 6. Page indicator ----------
   좌측 하단에 지금 보고 있는 섹션을 표시합니다. (Hero에서는 숨김)
   이름/번호를 바꾸려면 아래 목록만 수정하면 됩니다. */
const PAGES = [
  { sel: '.hero',        num: '',   name: '' },
  { sel: '#about',       num: '01', name: 'About' },
  { sel: '#features',    num: '02', name: 'Features' },
  { sel: '#design',      num: '03', name: 'Design' },
  { sel: '#experience',  num: '04', name: 'Experience' },
  { sel: '#gallery',     num: '05', name: 'Gallery' },
  { sel: '.closing',     num: '',   name: 'Coming soon' },
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
  pager.classList.toggle('is-dark', cur.sel === '#experience');
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
