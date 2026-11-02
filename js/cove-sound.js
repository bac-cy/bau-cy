/* ==========================================================
   Cove 소리 — 직접 만든(합성) 효과음만 써요. 따로 받은 음원 파일 없음.
   · 모터 소리: 고개·몸통이 움직이는 동안 아주 작고 높은 '삐릭' 소리를 가끔 (움직임이 빠를수록 더 자주)
   · 동작 효과음: 눈 표정이 바뀔 때 귀여운 '뽕·뽀로롱·띠링' 하는 높고 맑은 소리 (깜짝·신남·하트·윙크·속상·어지러움·졸림 등), 공 통통, 앙앙앙, 냠냠
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
  // 모터: 낮게 '부르르' 하는 연속음은 쓰지 않고, 움직이는 동안 아주 작고 높은 '삐릭' 소리만 가끔 냄
  return ctx;
}
function resume() {
  const c = ensure(); if (!c) return;
  if (c.state === 'suspended') c.resume().then(() => { if (on) { lastExpr = -1e9; EXPR['하트 눈'](); } window.dispatchEvent(new Event('cove:sound-on')); }).catch(() => {});   // 처음 한 번 누르면 맑은 소리로 "소리 켜짐"을 알려 줌
}
['pointerdown', 'keydown', 'touchend', 'click'].forEach(ev => window.addEventListener(ev, resume, { capture: true, passive: true }));
try { ensure(); } catch (e) { /* 무시 */ }

/* 모터: level 0~1 (관절이 움직이는 빠르기) — 움직이는 동안 작고 높은 '삐릭' 소리를 가끔 */
let nextMotorBlip = 0, blipIdx = 0;
function motor(level) {
  if (!on || !ensure() || ctx.state !== 'running') return;
  const l = Math.min(1, Math.max(0, level)); if (l < 0.06) return;
  const n = performance.now(); if (n < nextMotorBlip) return;
  nextMotorBlip = n + 150 + (1 - l) * 170 + Math.random() * 60;
  const SC = [1568, 1760, 1976, 2349, 1760, 2093]; const f = SC[blipIdx++ % SC.length];
  pluck(f, 0.05, 0.05 + 0.05 * l, 0, f * 1.12);
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

/* 귀여운 '뿅' 소리: 맑은 사인파 + 위 배음, 아주 빠르게 사라지는 튕기는 소리 (낮은 소리·떨림·뭉개짐 없음) */
function pluck(f, dur = 0.18, vol = 0.2, delay = 0, glideTo = 0) {
  const c = ctx; if (!c) return;
  const t = c.currentTime + delay, g = c.createGain(), v = vol * 4.2;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(master);
  [[1, 1], [2, 0.32], [3, 0.1]].forEach(([m, a]) => {
    const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * m, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo * m, t + Math.min(dur, 0.06));
    og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.03);
  });
}
const EXPR = {                                                                  // 귀여운 아기 로봇 소리 (높고 맑은 뿅뿅)
  '놀란 눈': () => { pluck(1175, 0.12, 0.2, 0, 1319); pluck(1760, 0.16, 0.18, 0.07); },                                              // 뽕!
  '신난 눈': () => { [1047, 1319, 1568, 2093].forEach((f, i) => pluck(f, 0.14, 0.15, i * 0.075)); },                                  // 뽀로롱~ 올라감
  '하트 눈': () => { pluck(1319, 0.34, 0.17); pluck(1760, 0.42, 0.15, 0.13); },                                                      // 띠링 두 번 (맑은 종소리)
  '웃는 눈': () => { pluck(1175, 0.3, 0.15); pluck(1568, 0.36, 0.13, 0.12); },
  '반짝 눈': () => { pluck(2349, 0.1, 0.1); pluck(3136, 0.08, 0.06, 0.05); },                                                         // 반짝
  '윙크': () => { pluck(1568, 0.07, 0.17, 0, 1976); },                                                                                 // 뽁
  '속상한 눈': () => { [988, 784, 659].forEach((f, i) => pluck(f, 0.3, 0.13, i * 0.2)); },                                             // 뽀-로-롱 아래로 (부드럽게)
  '어지러운 눈': () => { [1175, 988, 1175, 988, 1175].forEach((f, i) => pluck(f, 0.09, 0.1, i * 0.085)); },                           // 뽀로뽀로
  '졸린 눈': () => { pluck(880, 0.5, 0.1); pluck(698, 0.6, 0.08, 0.3); },                                                              // 하품 같은 느린 두 음
  '편안한 눈': () => { pluck(784, 0.45, 0.07); },
};
function expr(name) {
  if (!on || !EXPR[name] || !ensure() || ctx.state !== 'running') return;
  const n = performance.now(); if (n - lastExpr < 180) return; lastExpr = n;
  EXPR[name]();
}
function bite() {                                                               // 냠 (오물오물)
  if (!on || !ensure() || ctx.state !== 'running') return;
  pluck(1568, 0.07, 0.2, 0, 1319); pluck(1319, 0.07, 0.14, 0.06, 1175);
}
function bounce() {                                                             // 공 통통 (뽀잉)
  if (!on || !ensure() || ctx.state !== 'running') return;
  const n = performance.now(); if (n - lastBounce < 90) return; lastBounce = n;
  pluck(988, 0.12, 0.17, 0, 1319);
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
  pluck(1760 + Math.random() * 300, 0.04, 0.1);                                    // 맑은 톡
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
    if (ensure()) { master.gain.setTargetAtTime(on ? VOL : 0, ctx.currentTime, 0.03); }
    paint(); if (on) { resume(); setTimeout(() => EXPR['하트 눈'] && ctx && ctx.state === 'running' && EXPR['하트 눈'](), 60); }
  });
  document.body.appendChild(b);
}
if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

export const CoveSound = { motor, expr, bite, bounce, type, get on() { return on; }, get running() { return !!ctx && ctx.state === 'running'; } };
window.CoveSound = CoveSound;
