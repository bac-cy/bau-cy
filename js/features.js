/* ==========================================================
   Key Features 카드의 작은 움직임 그래픽 (카드 위쪽의 숫자 자리)
   01 Gentle Expression — 눈 LED(8×8 도트)가 깜빡이고 웃는 눈으로 바뀐다 (시뮬레이터의 표정 도트 그대로)
   02 Body Language     — 위에서 본 Cove가 좌우로 천천히 돈다
   03 Quiet Attention   — 고개를 살짝 갸웃한다
   Pressure for Rest    — 손·팔이 닿으면 몸이 지그시 눌리고 압력 파동이 퍼진다
   · 화면에 들어오면 한 번 재생하고, 카드에 마우스를 올리면 다시 재생해요.
   · 터치 기기는 화면에 보이는 동안 천천히 반복해요. "움직임 줄이기"를 켜면 멈춘 그림만 보여요.
   ========================================================== */
import { eyeRows } from './cove-eyes.js';

const INK = '#2b2731', LAV = '#7d6aa8', CREAM_A = '#fffdfa', CREAM_B = '#e6dccd';
const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const lerp = (a, b, x) => a + (b - a) * x;
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
function pebble(c, x, y, w, h, r, grad = true, stroke = 'rgba(125,106,168,.75)') {
  rr(c, x, y, w, h, r);
  if (grad) { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, CREAM_A); g.addColorStop(1, CREAM_B); c.fillStyle = g; } else c.fillStyle = 'rgba(255,253,250,.6)';
  c.fill(); c.lineWidth = 1.5; c.strokeStyle = stroke; c.stroke();
}
const eyeDots = (c, cx, cy, gap, r, dy = 0) => { c.fillStyle = INK; for (const s of [-1, 1]) { c.beginPath(); c.arc(cx + s * gap, cy + dy, r, 0, 7); c.fill(); } };

/* 01 — LED 눈 */
const EYE_SEQ = [[0, '뜬 눈'], [1.0, '감은 눈'], [1.14, '뜬 눈'], [1.9, '웃는 눈'], [3.5, '뜬 눈']];
function drawEyes(c, w, h, t) {
  const s = Math.min(w / 300, h / 150); c.save(); c.translate(w / 2, h / 2); c.scale(s, s);
  rr(c, -118, -52, 236, 104, 52); const g = c.createLinearGradient(0, -52, 0, 52); g.addColorStop(0, '#3b3447'); g.addColorStop(1, '#1c1923'); c.fillStyle = g; c.fill();
  let name = '뜬 눈'; for (const [at, n] of EYE_SEQ) if (t >= at) name = n;
  const pitch = 11, ox = [-96, 8];
  [0, 1].forEach((side) => {
    const rows = eyeRows(name, side, t);
    rows.forEach((row, y) => [...row].forEach((v, x) => {
      const px = ox[side] + x * pitch + 5, py = -40 + y * pitch + 2;
      if (v === '1') { const gr = c.createRadialGradient(px, py, 0, px, py, 9); gr.addColorStop(0, 'rgba(255,250,240,1)'); gr.addColorStop(.45, 'rgba(255,226,196,.95)'); gr.addColorStop(1, 'rgba(255,217,184,0)'); c.fillStyle = gr; c.beginPath(); c.arc(px, py, 9, 0, 7); c.fill(); }
      else { c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.arc(px, py, 1.5, 0, 7); c.fill(); }
    }));
  });
  c.restore();
}

/* 02 — 위에서 본 회전 */
function drawBody(c, w, h, t) {
  const s = Math.min(w / 300, h / 150); c.save(); c.translate(w / 2, h / 2); c.scale(s, s);
  const th = (t < 1.5 ? ease(t / 1.5) * 32 : t < 3 ? 32 : t < 4.5 ? lerp(32, -32, ease((t - 3) / 1.5)) : lerp(-32, 0, ease((t - 4.5) / 1.5))) * Math.PI / 180;
  const R = 56;
  c.setLineDash([3, 5]); c.lineWidth = 1.2; c.strokeStyle = 'rgba(125,106,168,.45)';
  for (const [a0, a1] of [[-32, 32]]) { c.beginPath(); c.arc(0, 0, R + 16, (a0 - 90) * Math.PI / 180, (a1 - 90) * Math.PI / 180); c.stroke(); }
  c.setLineDash([]);
  c.save(); c.rotate(th);
  c.beginPath(); c.arc(0, 0, R, 0, 7); const g = c.createRadialGradient(-14, -18, 6, 0, 0, R); g.addColorStop(0, CREAM_A); g.addColorStop(1, CREAM_B); c.fillStyle = g; c.fill(); c.lineWidth = 1.5; c.strokeStyle = 'rgba(125,106,168,.75)'; c.stroke();
  c.beginPath(); c.arc(0, 0, R * 0.76, 0, 7); c.lineWidth = 1.2; c.strokeStyle = 'rgba(125,106,168,.4)'; c.stroke();
  eyeDots(c, 0, -R * 0.58, 9, 2.6);
  c.beginPath(); c.moveTo(0, -R); c.lineTo(0, -R - 9); c.lineWidth = 1.5; c.strokeStyle = LAV; c.stroke();
  c.restore(); c.restore();
}

/* 03 — 갸웃 */
function drawAttention(c, w, h, t) {
  const s = Math.min(w / 300, h / 150); c.save(); c.translate(w / 2 - 150 * s, h / 2 - 75 * s); c.scale(s, s);
  const a = (t < 0.8 ? 0 : t < 1.6 ? ease((t - 0.8) / 0.8) : t < 2.8 ? 1 : ease(1 - (t - 2.8) / 1.2)) * 13 * Math.PI / 180;
  c.fillStyle = 'rgba(125,106,168,.12)'; c.beginPath(); c.ellipse(150, 140, 62, 5, 0, 0, 7); c.fill();
  pebble(c, 88, 98, 124, 38, 19);
  c.beginPath(); c.moveTo(150, 98); c.lineTo(150, 70); c.lineWidth = 3; c.strokeStyle = 'rgba(125,106,168,.7)'; c.lineCap = 'round'; c.stroke();
  c.save(); c.translate(150, 70); c.rotate(a);
  pebble(c, -52, -32, 104, 32, 16); eyeDots(c, 0, -16, 15 - a * 5, 2.9, 0);
  c.restore(); c.restore();
}

/* Pressure for Rest — 머리가 내려와 몸통 위의 패드를 지그시 눌렀다 놓는다. 색은 차분한 회색빛, 눈은 실제 Cove처럼 8×8 LED 도트 */
const ledEyes = (c, cx, cy, pitch, r, name, t, gap) => { c.fillStyle = INK; [0, 1].forEach((side) => { const ox = cx + (side ? gap : -gap) - 3.5 * pitch; eyeRows(name, side, t).forEach((row, y) => [...row].forEach((v, x) => { if (v === '1') { c.beginPath(); c.arc(ox + x * pitch, cy - 3.5 * pitch + y * pitch, r, 0, 7); c.fill(); } })); }); };
function drawPressure(c, w, h, t) {
  const s = Math.min(w / 300, h / 150); c.save(); c.translate(w / 2 - 150 * s, h / 2 - 75 * s); c.scale(s, s);
  const p = t < 1.1 ? ease(t / 1.1) : t < 2.5 ? 1 : ease(1 - (t - 2.5) / 1.5);
  c.beginPath(); c.moveTo(30, 140); c.lineTo(270, 140); c.lineWidth = 1.2; c.strokeStyle = 'rgba(43,39,49,.16)'; c.stroke();
  const bodyTop = 100, padH = 24 - 13 * p, padY = bodyTop - padH, padW = 124 + 12 * p;
  c.fillStyle = 'rgba(43,39,49,.08)'; c.beginPath(); c.ellipse(150, 140, 66 + p * 6, 5, 0, 0, 7); c.fill();
  pebble(c, 86, bodyTop, 128, 38, 19, true, 'rgba(43,39,49,.3)');                                        // 몸통
  rr(c, 150 - padW / 2, padY, padW, padH, Math.min(11, padH / 2 + 2));       // 패드 (머리와 몸통 사이)
  c.fillStyle = 'rgba(206,201,214,.8)'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(43,39,49,.28)'; c.stroke();
  const hy = padY - 32 + 1; pebble(c, 100, hy, 100, 32, 16, true, 'rgba(43,39,49,.3)'); ledEyes(c, 150, hy + 16, 2.5, 0.95, p > 0.5 ? '편안한 눈' : '뜬 눈', t, 17);   // 머리가 내려와 패드를 누른다
  c.restore();
}

const ARTS = { eyes: [drawEyes, 4.0, false], body: [drawBody, 6.0, false], attention: [drawAttention, 4.0, false], pressure: [drawPressure, 4.0, false] };
const reduced = false;   // 사용자 요청: PC의 '움직임 줄이기' 설정과 상관없이 모든 효과를 보여준다
const touchOnly = window.matchMedia('(hover: none)').matches;
const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

const arts = [...document.querySelectorAll('.feature__art')].map((el) => {
  const [draw, len, breathe] = ARTS[el.dataset.art] || ARTS.eyes;
  const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
  const a = { el, cv, ctx, draw, len, breathe, t: 0, playing: false, visible: false, w: 0, h: 0, seen: false };
  const fit = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; a.w = w; a.h = h; cv.width = Math.round(w * dpr()); cv.height = Math.round(h * dpr()); a.dirty = true; };
  new ResizeObserver(fit).observe(el); fit();
  new IntersectionObserver(([e]) => { a.visible = e.isIntersecting; if (e.isIntersecting && !a.seen && !reduced) { a.seen = true; a.playing = true; a.t = 0; } }, { threshold: 0.5 }).observe(el);
  const card = el.closest('.feature');
  const replay = () => { if (reduced || a.playing) return; a.playing = true; a.t = 0; };
  card.addEventListener('pointerenter', replay); card.addEventListener('focusin', replay);
  a.dirty = true; return a;
});

let last = performance.now();
(function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  for (const a of arts) {
    if (!a.visible && !a.dirty) continue;
    if (a.playing && a.visible) { a.t += dt; if (a.t >= a.len) { if (a.breathe && touchOnly || touchOnly) a.t -= a.len; else { a.playing = false; a.t = 0; } } a.dirty = true; }
    if (a.dirty && a.w) { a.ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0); a.ctx.clearRect(0, 0, a.w, a.h); a.draw(a.ctx, a.w, a.h, a.t); a.dirty = false; }
  }
})(performance.now());
