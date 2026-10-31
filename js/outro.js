/* ==========================================================
   Cove — Outro: 엔딩 크레딧 자동 롤링
   · 아웃트로가 화면에 절반 이상 보이면 크레딧이 아래에서 위로 천천히 올라갑니다.
   · 끝나면 마지막 문구가 서서히 나타납니다.
   · 완전히 벗어났다가 다시 오면 처음부터 다시 흐릅니다.
   명단은 js/credits.js 에서 고칩니다.
   ========================================================== */
(() => {
  const outro = document.getElementById('outro');
  if (!outro) return;
  const win = outro.querySelector('.outro__window');
  const roll = outro.querySelector('.outro__roll');
  const slot = outro.querySelector('.outro__groups');
  const SPEED = 58;          // 올라가는 속도 (px/초) — 작을수록 천천히
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 명단 채우기
  const mk = (tag, cls, text) => { const e = document.createElement(tag); e.className = cls; if (text != null) e.textContent = text; return e; };
  const namesEl = (arr, cols) => { const l = mk('div', 'outro__names'); if (cols) l.dataset.cols = cols; (arr || []).forEach(n => l.appendChild(mk('p', 'outro__name', n))); return l; };
  const credits = window.COVE_CREDITS || [];
  let total = 0;
  credits.forEach(g => {
    const wrap = mk('div', 'outro__group');
    if (g.role) wrap.appendChild(mk('p', 'outro__role', g.role));
    if (g.sub) g.sub.forEach(s => {
      const sub = mk('div', 'outro__sub'); sub.appendChild(mk('p', 'outro__sublabel', s.label)); sub.appendChild(namesEl(s.names)); wrap.appendChild(sub); total += (s.names || []).length;
    }); else { wrap.appendChild(namesEl(g.names, g.cols)); total += (g.names || []).length; }
    slot.appendChild(wrap);
  });
  if (total > 16) slot.classList.add('is-wide');   // 이름이 많으면 두 칸 배치

  if (reduced) { outro.classList.add('is-static', 'is-ended'); return; }

  let anim = null, inView = false;
  function build() {
    if (anim) anim.cancel();
    const H = win.clientHeight, R = roll.offsetHeight;
    const distance = H + R, duration = Math.max(14000, distance / SPEED * 1000);
    anim = roll.animate(
      [{ transform: `translateY(${H}px)` }, { transform: `translateY(${-R}px)` }],
      { duration, easing: 'linear', fill: 'both', delay: 600 }
    );
    anim.pause();
    anim.onfinish = () => outro.classList.add('is-ended');
    if (inView) anim.play();
  }
  build();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { outro.classList.remove('is-ended'); build(); }, 250); });

  new IntersectionObserver(([en]) => {
    if (en.intersectionRatio >= 0.5 && !inView) { inView = true; if (anim && anim.playState !== 'finished') anim.play(); }
    else if (en.intersectionRatio === 0 && inView) {            // 완전히 벗어남 → 다음에 처음부터
      inView = false; outro.classList.remove('is-ended'); if (anim) { anim.cancel(); build(); }
    }
  }, { threshold: [0, 0.5] }).observe(outro);
})();
