/* ==========================================================
   Cove 소리 — 직접 만든(합성) 효과음만 써요. 따로 받은 음원 파일 없음.
   · 모터 소리: 고개·몸통이 움직일 때 아기 강아지 로봇처럼 '찌릭찌릭' 작고 높은 서보 소리 (움직임이 빠를수록 살짝 빨라져요)
   · 동작 효과음: 눈 표정이 바뀔 때 아기 강아지처럼 짧게 '왕!'·'끼잉'·'아우' 하는 높고 말랑한 소리 (깜짝·신남·하트·윙크·속상·어지러움·졸림 등), 공 통통, 앙앙앙, 냠냠
   · 브라우저는 처음 한 번 화면을 누르기 전에는 소리를 막아요. 그래서 첫 클릭·터치·키 입력에서 켜지고,
     전시용 시작 파일(start.bat)은 이 제한을 풀고 열기 때문에 처음부터 자동으로 나요.
   · 우측 하단 스피커 버튼으로 켜고 끌 수 있고, 선택은 기억해요. 처음엔 켜짐, 소리는 작게.
   ========================================================== */
const KEY = 'cove-sound';
let on = true; try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* 무시 */ }
let ctx = null, master = null, mGain = null, mOsc1 = null, mOsc2 = null, mFilter = null, mTrem = null, mLfo = null, lastMotor = -1e9, lastExpr = -1e9, lastBounce = -1e9;
const VOL = 1.7;                                                        // 전체 소리 크기 (리미터가 찢어짐을 막아 줌)

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  try { ctx = new AC(); } catch (e) { return null; }
  master = ctx.createGain(); master.gain.value = on ? VOL : 0;
  const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -10; lim.knee.value = 8; lim.ratio.value = 10; lim.attack.value = 0.002; lim.release.value = 0.12;   // 커져도 찢어지지 않게 눌러 줌
  master.connect(lim); lim.connect(ctx.destination);
  // 모터: 높고 말랑한 사인파를 빠르게 떨어 '찌릭찌릭' 하는 아주 작은 서보 소리 (낮고 거친 소리는 쓰지 않음)
  mFilter = ctx.createBiquadFilter(); mFilter.type = 'lowpass'; mFilter.frequency.value = 2600; mFilter.Q.value = 0.7;
  mGain = ctx.createGain(); mGain.gain.value = 0;
  mTrem = ctx.createGain(); mTrem.gain.value = 0.55;
  mLfo = ctx.createOscillator(); mLfo.type = 'sine'; mLfo.frequency.value = 14; const lg = ctx.createGain(); lg.gain.value = 0.45; mLfo.connect(lg); lg.connect(mTrem.gain);
  mOsc1 = ctx.createOscillator(); mOsc1.type = 'sine'; mOsc1.frequency.value = 420;
  mOsc2 = ctx.createOscillator(); mOsc2.type = 'triangle'; mOsc2.frequency.value = 843;
  mOsc1.connect(mFilter); mOsc2.connect(mFilter); mFilter.connect(mTrem); mTrem.connect(mGain); mGain.connect(master);
  mOsc1.start(); mOsc2.start(); mLfo.start();
  setInterval(() => { if (ctx && performance.now() - lastMotor > 220) mGain.gain.setTargetAtTime(0, ctx.currentTime, 0.06); }, 100);   // 움직임이 멈추면 조용해짐
  return ctx;
}
function resume() {
  const c = ensure(); if (!c) return;
  if (c.state === 'suspended') c.resume().then(() => { if (on) { lastExpr = -1e9; EXPR['하트 눈'](); } window.dispatchEvent(new Event('cove:sound-on')); }).catch(() => {});   // 처음 한 번 누르면 맑은 소리로 "소리 켜짐"을 알려 줌
}
['pointerdown', 'keydown', 'touchend', 'click'].forEach(ev => window.addEventListener(ev, resume, { capture: true, passive: true }));
try { ensure(); } catch (e) { /* 무시 */ }

/* 모터: level 0~1 (관절이 움직이는 빠르기) */
function motor(level) {
  if (!on || !ensure() || ctx.state !== 'running') return;
  const l = Math.min(1, Math.max(0, level));
  if (l < 0.03) return;
  lastMotor = performance.now(); const t = ctx.currentTime;
  mGain.gain.setTargetAtTime(0.05 + 0.14 * l, t, 0.04);
  mOsc1.frequency.setTargetAtTime(400 + 300 * l, t, 0.05); mOsc2.frequency.setTargetAtTime(800 + 600 * l, t, 0.05);
  mLfo.frequency.setTargetAtTime(11 + 12 * l, t, 0.05);                       // 빨리 움직일수록 더 빠르게 찌릭찌릭
}

/* 짧은 음 하나: [시작 주파수, 끝 주파수, 길이(초), 파형, 크기, 시작 지연(초)] */
function tone(f0, f1, dur, type = 'sine', vol = 0.2, delay = 0) {
  const c = ctx; if (!c) return;
  const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  vol *= 4.2; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.012, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.03);
}
function vibrato(f, dur, rate, depth, vol) {                                     // 어지러운 소리: 떨리는 음
  const c = ctx, t = c.currentTime, o = c.createOscillator(), l = c.createOscillator(), lg = c.createGain(), g = c.createGain();
  o.type = 'sine'; o.frequency.value = f; l.frequency.value = rate; lg.gain.value = depth; l.connect(lg); lg.connect(o.frequency);
  vol *= 4.2; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); l.start(t); o.stop(t + dur + 0.03); l.stop(t + dur + 0.03);
}

/* 강아지 소리용: 시간에 따라 높낮이가 변하는 말랑한 소리. pts = [[0~1 시간 비율, 주파수], ...], 살짝 떨림(vib)을 줌 */
function chirp(pts, dur, vol = 0.2, delay = 0, vib = 0, type = 'sine') {
  const c = ctx; if (!c) return;
  const t = c.currentTime + delay, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain();
  o.type = type; o2.type = 'sine';
  pts.forEach(([u, f], i) => { const tt = t + u * dur; if (i === 0) { o.frequency.setValueAtTime(f, tt); o2.frequency.setValueAtTime(f * 2, tt); } else { o.frequency.exponentialRampToValueAtTime(f, tt); o2.frequency.exponentialRampToValueAtTime(f * 2, tt); } });
  if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 7 + Math.random() * 2; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
  const v = vol * 4.2;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.02, dur * 0.2)); g.gain.setValueAtTime(v, t + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g2.gain.value = 0.28;                                                         // 위 배음을 살짝 섞어 말랑하고 맑게
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}
const EXPR = {                                                                  // 아기 강아지 로봇 소리
  '놀란 눈': () => { chirp([[0, 700], [0.35, 1250], [1, 900]], 0.16, 0.2); },                                                 // "왕!" 하고 짧게 놀람
  '신난 눈': () => { [[760, 980], [900, 1150], [1050, 1350]].forEach((p, i) => chirp([[0, p[0]], [0.4, p[1]], [1, p[0] * 1.05]], 0.1, 0.17, i * 0.115)); },   // 왕왕왕 신나게
  '하트 눈': () => { chirp([[0, 620], [0.5, 960], [1, 800]], 0.42, 0.17, 0, 14); },                                           // "끼잉~" 좋아서 콧소리
  '웃는 눈': () => { chirp([[0, 660], [0.5, 980], [1, 840]], 0.34, 0.15, 0, 12); },
  '반짝 눈': () => { chirp([[0, 1500], [1, 2000]], 0.08, 0.1); },                                                               // 삐용 작은 반짝
  '윙크': () => { chirp([[0, 520], [1, 980]], 0.07, 0.17); chirp([[0, 1250], [1, 1500]], 0.06, 0.1, 0.075); },                  // 뽁
  '속상한 눈': () => { chirp([[0, 950], [0.4, 700], [1, 430]], 0.6, 0.15, 0, 16); },                                         // "끼이잉…" 풀 죽음
  '어지러운 눈': () => { chirp([[0, 560], [0.5, 760], [1, 520]], 0.7, 0.13, 0, 45); },                                          // 우웅~ 빙글빙글
  '졸린 눈': () => { chirp([[0, 720], [0.45, 640], [1, 380]], 0.7, 0.11, 0, 6); },                                            // "아우~" 하품
  '편안한 눈': () => { chirp([[0, 480], [0.5, 520], [1, 470]], 0.4, 0.07, 0, 5); },                                           // 후- 편안
};
function expr(name) {
  if (!on || !EXPR[name] || !ensure() || ctx.state !== 'running') return;
  const n = performance.now(); if (n - lastExpr < 180) return; lastExpr = n;
  EXPR[name]();
}
function bite() {                                                               // 냠 (오물오물 귀엽게)
  if (!on || !ensure() || ctx.state !== 'running') return;
  chirp([[0, 520], [1, 340]], 0.07, 0.2); chirp([[0, 640], [1, 400]], 0.06, 0.12, 0.05);
}
function bounce() {                                                             // 공 통통 (뽀잉)
  if (!on || !ensure() || ctx.state !== 'running') return;
  const n = performance.now(); if (n - lastBounce < 90) return; lastBounce = n;
  chirp([[0, 520], [0.4, 880], [1, 640]], 0.09, 0.17);
}

/* 타이핑: 키보드를 톡 치는 소리 (HI, I'm cove 글자가 하나씩 나올 때) */
let noiseBuf = null;
function type() {
  if (!on || !ensure() || ctx.state !== 'running') return;
  const c = ctx, t = c.currentTime;
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.05), c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); }
  const n = c.createBufferSource(); n.buffer = noiseBuf; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200 + Math.random() * 1400; bp.Q.value = 1.1;
  const g = c.createGain(); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
  n.connect(bp); bp.connect(g); g.connect(master); n.start(t);                    // 딸깍 하는 바삭한 소리
  tone(320 + Math.random() * 60, 220, 0.04, 'sine', 0.16);                         // 키가 눌리는 말랑한 톡
}

/* 켜기/끄기 버튼 (우측 하단) */
const ICON_ON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
function mount() {
  if (document.getElementById('snd')) return;
  const b = document.createElement('button'); b.type = 'button'; b.id = 'snd'; b.className = 'snd';
  const paint = () => { b.innerHTML = on ? ICON_ON : ICON_OFF; b.setAttribute('aria-label', on ? '소리 끄기' : '소리 켜기'); b.setAttribute('aria-pressed', String(on)); };
  paint();
  b.addEventListener('click', () => {
    on = !on; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* 무시 */ }
    if (ensure()) { master.gain.setTargetAtTime(on ? VOL : 0, ctx.currentTime, 0.03); if (!on) mGain.gain.setTargetAtTime(0, ctx.currentTime, 0.03); }
    paint(); if (on) { resume(); setTimeout(() => EXPR['하트 눈'] && ctx && ctx.state === 'running' && EXPR['하트 눈'](), 60); }
  });
  document.body.appendChild(b);
}
if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

export const CoveSound = { motor, expr, bite, bounce, type, get on() { return on; }, get running() { return !!ctx && ctx.state === 'running'; } };
window.CoveSound = CoveSound;
