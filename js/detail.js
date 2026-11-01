/* 작은 디테일 미리보기 (?detail=1): 브라우저 탭 아이콘(파비콘)과 모바일 홈 아이콘을 Cove 심벌로 바꿈 */
(() => {
  const set = (rel, href, extra = {}) => { document.querySelectorAll(`link[rel="${rel}"]`).forEach(l => l.remove()); const l = document.createElement('link'); l.rel = rel; l.href = href; Object.entries(extra).forEach(([k, v]) => l.setAttribute(k, v)); document.head.appendChild(l); };
  set('icon', 'favicon.svg', { type: 'image/svg+xml' }); set('alternate icon', 'favicon-32.png', { type: 'image/png' }); set('apple-touch-icon', 'apple-touch-icon.png');
})();
