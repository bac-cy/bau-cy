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
  (window.COVE_CREDITS || []).forEach(g => {
    const wrap = document.createElement('div'); wrap.className = 'outro__group';
    const role = document.createElement('p'); role.className = 'outro__role'; role.textContent = g.role;
    wrap.appendChild(role);
    (g.names || []).forEach(n => { const p = document.createElement('p'); p.className = 'outro__name'; p.textContent = n; wrap.appendChild(p); });
    slot.appendChild(wrap);
  });

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
