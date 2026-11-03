/* ==========================================================
   Cove 소리 — 직접 만든(합성) 효과음만 써요. 따로 받은 음원 파일 없음.
   · 모터 소리: 고개·몸통이 움직이는 동안 공기가 스치는 듯한 부드러운 '쉬이' 소리 (움직임이 빠를수록 살짝 커짐)
   · 동작 효과음: 눈 표정이 바뀔 때 LG 로봇 같은 깔끔한 전자 '띠링' 종소리 (깜짝·신남·하트·윙크·속상·어지러움·졸림 등), 공 통통, 앙앙앙, 냠냠
   · 브라우저는 처음 한 번 화면을 누르기 전에는 소리를 막아요. 그래서 첫 클릭·터치·키 입력에서 켜지고,
     전시용 시작 파일(start.bat)은 이 제한을 풀고 열기 때문에 처음부터 자동으로 나요.
   · 우측 하단 스피커 버튼으로 켜고 끌 수 있고, 선택은 기억해요. 처음엔 켜짐, 소리는 작게.
   ========================================================== */
const KEY = 'cove-sound';
let on = true; try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* 무시 */ }
let limNode = null, bgmMute = null, ctx = null, master = null, mGain = null, mOsc1 = null, mOsc2 = null, mFilter = null, mTrem = null, mLfo = null, mNoise = null, lastMotor = -1e9, lastExpr = -1e9, lastBounce = -1e9;
const VOL = 2.1;                                                        // 전체 소리 크기 (리미터가 찢어짐을 막아 줌)

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  try { ctx = new AC(); } catch (e) { return null; }
  master = ctx.createGain(); master.gain.value = on ? VOL : 0;
  const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -10; lim.knee.value = 8; lim.ratio.value = 10; lim.attack.value = 0.002; lim.release.value = 0.12;   // 커져도 찢어지지 않게 눌러 줌
  const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 1700; soft.Q.value = 0.5;     // 날카로운 높은 소리를 깎아 부드럽게
  master.connect(soft); soft.connect(lim); lim.connect(ctx.destination); limNode = lim;
  // 모터: 낮게 '부르르' 하는 소리가 아니라, 가전 로봇처럼 공기가 스치는 듯한 아주 부드러운 '쉬이' 소리
  const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  mNoise = ctx.createBufferSource(); mNoise.buffer = nb; mNoise.loop = true;
  mFilter = ctx.createBiquadFilter(); mFilter.type = 'bandpass'; mFilter.frequency.value = 1600; mFilter.Q.value = 0.8;
  mGain = ctx.createGain(); mGain.gain.value = 0; mNoise.connect(mFilter); mFilter.connect(mGain); mGain.connect(master); mNoise.start();
  setInterval(() => { if (ctx && performance.now() - lastMotor > 220) mGain.gain.setTargetAtTime(0, ctx.currentTime, 0.08); }, 100);   // 움직임이 멈추면 조용해짐
  return ctx;
}
function resume() {
  const c = ensure(); if (!c) return;
  if (c.state === 'suspended') c.resume().then(() => { window.dispatchEvent(new Event('cove:sound-on')); startBgm(); }).catch(() => {});   // 
}
['pointerdown', 'keydown', 'touchend', 'click'].forEach(ev => window.addEventListener(ev, resume, { capture: true, passive: true }));
try { ensure(); setTimeout(startBgm, 600); } catch (e) { /* 무시 */ }

/* 모터: level 0~1 (관절이 움직이는 빠르기) — 움직이는 동안 공기가 스치는 듯한 부드러운 '쉬이' 소리 */
function motor(level) {
  if (!on || !ensure() || ctx.state !== 'running') return;
  const l = Math.min(1, Math.max(0, level)); motionHint(l); if (l < 0.05) return;
  lastMotor = performance.now(); const t = ctx.currentTime;
  mGain.gain.setTargetAtTime(0.02 + 0.09 * l, t, 0.07);
  mFilter.frequency.setTargetAtTime(1300 + 900 * l, t, 0.08);
}

/* 짧은 음 하나: [시작 주파수, 끝 주파수, 길이(초), 파형, 크기, 시작 지연(초)] */
function tone(f0, f1, dur, type = 'sine', vol = 0.2, delay = 0) {
  const c = ctx; if (!c) return;
  const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  vol *= 3.0; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.012, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.03);
}
function vibrato(f, dur, rate, depth, vol) {                                     // 어지러운 소리: 떨리는 음
  const c = ctx, t = c.currentTime, o = c.createOscillator(), l = c.createOscillator(), lg = c.createGain(), g = c.createGain();
  o.type = 'sine'; o.frequency.value = f; l.frequency.value = rate; lg.gain.value = depth; l.connect(lg); lg.connect(o.frequency);
  vol *= 3.0; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); l.start(t); o.stop(t + dur + 0.03); l.stop(t + dur + 0.03);
}

/* LG 가전·로봇 같은 부드러운 '띠링' 소리: 둥근 사인파 종소리, 살짝 부드럽게 시작해서 길게 울리다 사라짐, 도·미·솔 같은 편안한 음계 */
function pluck(f, dur = 0.5, vol = 0.2, delay = 0, glideTo = 0) {
  const c = ctx; if (!c) return;
  const t = c.currentTime + delay, g = c.createGain(), v = vol * 3.0;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.025); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(master);
  [[1, 1], [2, 0.05]].forEach(([m, a]) => {
    const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * m, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo * m, t + Math.min(dur, 0.05));
    og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.03);
  });
}
/* 루나(Loona) 같은 전자 펫의 '찍·끼익' 소리: 높은 음역(700Hz 이상)에서 빠르게 올라갔다 내려가는 짧은 울음. 떨림·낮은 소리는 쓰지 않음 */
function squeak(pts, dur = 0.14, vol = 0.18, delay = 0) {
  const c = ctx; if (!c) return;
  const t = c.currentTime + delay, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain(), v = vol * 3.0;
  o.type = 'sine'; o2.type = 'sine';
  pts.forEach(([u, f], i) => { const tt = t + u * dur; if (i === 0) { o.frequency.setValueAtTime(f, tt); o2.frequency.setValueAtTime(f * 2, tt); } else { o.frequency.exponentialRampToValueAtTime(f, tt); o2.frequency.exponentialRampToValueAtTime(f * 2, tt); } });
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.015, dur * 0.25)); g.gain.setValueAtTime(v, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g2.gain.value = 0.2; o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master); o.start(t); o2.start(t); o.stop(t + dur + 0.04); o2.stop(t + dur + 0.04);
}
// 음 높이: 도5=523 미5=659 솔5=784 라5=880 시5=988 도6=1047 미6=1319 솔6=1568
const EXPR_CHIME = {                                                            // LG 가전·로봇처럼 깔끔한 전자 종소리 (동물 울음 없이, 음높이가 미끄러지지 않는 또렷한 음만)
  '놀란 눈': () => { pluck(988, 0.22, 0.17); pluck(1319, 0.34, 0.15, 0.09); },                                                   // 띠딩 (짧게 올라감)
  '신난 눈': () => { [523, 659, 784, 1047, 1319].forEach((f, i) => pluck(f, 0.45, 0.14, i * 0.1)); },                              // 도미솔도미 경쾌하게
  '하트 눈': () => { pluck(784, 0.7, 0.17); pluck(1047, 0.9, 0.16, 0.16); },                                                      // 솔→도 맑은 두 음
  '웃는 눈': () => { pluck(659, 0.6, 0.15); pluck(988, 0.8, 0.14, 0.14); },
  '반짝 눈': () => { pluck(1319, 0.45, 0.1); pluck(1760, 0.4, 0.07, 0.08); },
  '윙크': () => { pluck(1047, 0.2, 0.14); },
  '속상한 눈': () => { [784, 659, 523].forEach((f, i) => pluck(f, 0.6, 0.12, i * 0.26)); },                                       // 솔미도 천천히 내려감
  '어지러운 눈': () => { [659, 784, 659, 784].forEach((f, i) => pluck(f, 0.26, 0.1, i * 0.13)); },
  '졸린 눈': () => { pluck(523, 0.9, 0.1); pluck(392, 1.1, 0.08, 0.35); },
  '편안한 눈': () => { pluck(523, 0.8, 0.07); },
};
/* 엘릭(Eilik) 느낌: 책상 위 작은 로봇이 "뿌잇·삐리릿·뿌우~" 하고 재잘거리는 짧고 말랑한 전자 말소리. 높은 음역(600Hz 이상)에서 빠르게 올라가거나 내려가는 둥근 '붑' 소리에
   모음처럼 들리는 필터를 걸어 아기 로봇이 옹알이하는 느낌을 냄. (엘릭 실제 음원은 아니고 느낌만 비슷하게 만든 소리) */
let TR = 1;                                                                     // 소리를 낼 때마다 살짝 다른 높이로 (같은 소리가 반복되지 않게)
function boop(f0, f1, dur = 0.1, vol = 0.18, delay = 0) {
  const c = ctx; if (!c) return; f0 *= TR; f1 *= TR;
  const t = c.currentTime + delay, g = c.createGain(), bp = c.createBiquadFilter(), v = vol * 3.0;
  bp.type = 'bandpass'; bp.Q.value = 0.9; bp.frequency.setValueAtTime(Math.max(700, f0 * 1.1), t); bp.frequency.exponentialRampToValueAtTime(Math.max(700, f1 * 1.1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.03, dur * 0.35)); g.gain.setValueAtTime(v, t + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  [['sine', 1, 1], ['sine', 2, 0.06]].forEach(([type, m, a]) => {
    const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0 * m, t); o.frequency.exponentialRampToValueAtTime(f1 * m, t + dur);
    og.gain.value = a; o.connect(og); og.connect(bp); o.start(t); o.stop(t + dur + 0.04);
  });
  bp.connect(g); g.connect(master);
}
const seq = (arr, dur, vol, gap) => arr.forEach((p, i) => boop(p[0], p[1], dur, vol, i * gap));
// 표정마다 여러 가지 소리를 준비해 두고 매번 다른 것을 골라요 (높이도 조금씩 다르게)
const EXPR_EILIK = {
  '놀란 눈': [() => { boop(620, 1150, 0.09, 0.2); boop(1150, 900, 0.1, 0.17, 0.1); },                                              // 뿌잇!
              () => { boop(700, 900, 0.07, 0.17); boop(900, 1350, 0.1, 0.2, 0.09); },                                               // 어? (올라감)
              () => { boop(1300, 800, 0.08, 0.18); boop(800, 1300, 0.1, 0.17, 0.09); boop(1300, 1000, 0.09, 0.13, 0.2); }],        // 앗 뿌
  '신난 눈': [() => seq([[800, 1000], [1000, 1250], [1250, 1600], [1400, 1800]], 0.07, 0.17, 0.09),                                  // 삐리리릿
              () => seq([[900, 900], [900, 900], [900, 1200], [1200, 1700]], 0.06, 0.16, 0.1),                                      // 뿌 뿌 뿌-삐
              () => seq([[1000, 1300], [1300, 1000], [1000, 1300], [1300, 1000], [1000, 1500]], 0.06, 0.14, 0.075),                // 뽀로로로롱
              () => { boop(700, 1000, 0.12, 0.17); boop(1000, 1500, 0.14, 0.16, 0.12); boop(1500, 1300, 0.14, 0.12, 0.26); }],     // 뿌우-삐-이
  '하트 눈': [() => { boop(720, 1050, 0.2, 0.17); boop(1050, 1350, 0.26, 0.15, 0.2); },                                              // 뿌우~
              () => { boop(800, 900, 0.14, 0.15); boop(1000, 1250, 0.3, 0.15, 0.17); },                                             // 뽀로~
              () => { boop(650, 1000, 0.3, 0.16); boop(1000, 840, 0.22, 0.12, 0.3); }],                                             // 뿌우~웅
  '웃는 눈': [() => { boop(760, 1100, 0.16, 0.15); boop(1100, 980, 0.18, 0.12, 0.17); },
              () => seq([[900, 1100], [1000, 1300]], 0.09, 0.14, 0.11)],
  '반짝 눈': [() => boop(1500, 2000, 0.06, 0.1), () => { boop(1800, 2200, 0.05, 0.09); boop(1400, 1700, 0.05, 0.07, 0.07); }],
  '윙크': [() => boop(800, 1300, 0.07, 0.16), () => { boop(1100, 800, 0.05, 0.14); boop(800, 1300, 0.07, 0.16, 0.06); }, () => boop(900, 1500, 0.09, 0.15)],
  '속상한 눈': [() => { boop(950, 700, 0.3, 0.14); boop(780, 560, 0.4, 0.12, 0.34); },                                                // 뿌우…
              () => { boop(900, 650, 0.5, 0.14); boop(700, 620, 0.2, 0.09, 0.55); },                                                // 뿌우우웅
              () => seq([[900, 800], [800, 650], [700, 540]], 0.16, 0.12, 0.22)],                                                    // 뿌 뿌 뿌…
  '어지러운 눈': [() => seq([[900, 1200], [1200, 900], [900, 1200]], 0.11, 0.12, 0.13),
              () => seq([[1000, 800], [800, 1000], [1000, 800], [800, 1000]], 0.1, 0.11, 0.12)],
  '졸린 눈': [() => boop(820, 560, 0.55, 0.1), () => { boop(600, 900, 0.3, 0.09); boop(900, 520, 0.55, 0.1, 0.32); }],               // 하품
  '편안한 눈': [() => boop(700, 740, 0.4, 0.07), () => boop(760, 700, 0.45, 0.07)],
};
// 동작(버튼)에 맞춘 소리: 인사, 쓰다듬기, 간지럼, 잠들기, 간식, 쉬기
const EVENT_EILIK = {
  greet: () => seq([[800, 1000], [1000, 800], [900, 1400]], 0.1, 0.17, 0.13),                                                        // 삐-뽀-삐!
  pet: () => seq([[760, 840], [840, 760], [760, 840], [840, 760], [760, 900]], 0.09, 0.1, 0.1),                                        // 그르릉 하는 듯한 낮은 떨림
  tickle: () => seq([[1000, 1400], [1400, 1000], [1100, 1500], [1500, 1100], [1200, 1700], [1700, 1200]], 0.06, 0.13, 0.075),          // 까르르
  sleep: () => { boop(700, 540, 0.6, 0.09); boop(640, 520, 0.7, 0.07, 0.7); },                                                       // 쿨… 쿨…
  rest: () => { boop(660, 760, 0.45, 0.08); },
  snack: () => seq([[900, 1200], [1200, 1500], [1000, 1300]], 0.1, 0.15, 0.13),                                                      // 냠냠 기대
  startle: () => boop(620, 1150, 0.09, 0.2),
  wink: () => boop(800, 1300, 0.07, 0.16),
  happy: () => seq([[800, 1000], [1000, 1250], [1250, 1600]], 0.08, 0.16, 0.1),
  upset: () => boop(900, 600, 0.45, 0.13),
};
const useChime = /[?&]sound=chime/.test(location.search);                          // 주소 끝에 ?sound=chime 을 붙이면 예전 종소리 버전으로 들어 볼 수 있음
const EXPR = useChime ? EXPR_CHIME : EXPR_EILIK;
const lastVar = {};
function expr(name) {
  if (!on || !EXPR[name] || !ensure() || ctx.state !== 'running') return;
  const n = performance.now(); if (n - lastExpr < 180) return; lastExpr = n;
  duck(); let f = EXPR[name]; if (Array.isArray(f)) { lastVar[name] = ((lastVar[name] ?? -1) + 1 + Math.floor(Math.random() * (f.length - 1 || 1))) % f.length; f = f[lastVar[name]]; }   // 지난번과 다른 변형을 고름
  TR = useChime ? 1 : 0.74 + Math.random() * 0.2; f(); TR = 1;                    // 엘릭풍 소리는 전체적으로 낮고 둥글게(0.74~0.94배)
}
function bite() {                                                               // 냠
  if (!on || !ensure() || ctx.state !== 'running') return;
  if (useChime) { pluck(1175, 0.12, 0.16); pluck(988, 0.14, 0.12, 0.07); } else { boop(900, 650, 0.06, 0.16); boop(980, 700, 0.06, 0.12, 0.07); }
}
function bounce() {                                                             // 공 통통
  if (!on || !ensure() || ctx.state !== 'running') return;
  const n = performance.now(); if (n - lastBounce < 90) return; lastBounce = n;
  if (useChime) pluck(659, 0.2, 0.14); else boop(640, 960, 0.09, 0.15);
}

function event(name) {                                                         // 동작(인사·쓰다듬기·간지럼·잠들기 등)이 시작될 때 나는 소리
  if (useChime || !on || !EVENT_EILIK[name] || !ensure() || ctx.state !== 'running') return;
  duck(); TR = 0.76 + Math.random() * 0.14; EVENT_EILIK[name](); TR = 1;
}
let idleSince = 0, wasMoving = false;                                           // 가만히 있다가 움직이기 시작할 때 작은 '으응?' 소리
function motionHint(level) {
  if (useChime || !on || !ctx || ctx.state !== 'running') return; const n = performance.now();
  if (level > 0.28) { if (!wasMoving && n - idleSince > 1800) { duck(); TR = 0.76 + Math.random() * 0.16; Math.random() < 0.5 ? boop(760, 980, 0.09, 0.1) : boop(980, 780, 0.09, 0.1); TR = 1; } wasMoving = true; idleSince = n; }
  else if (level < 0.05) wasMoving = false;
}

/* 배경음악: assets/bgm.mp3 파일이 있으면 그 곡을 잔잔하게 반복하고, 없으면 코드로 만든 아주 잔잔한 앰비언트(느린 화음 + 가끔 울리는 맑은 종소리)를 깔아요.
   소리가 켜져 있을 때만, 매우 작게. Cove 효과음이 나올 때와 영상을 전체 화면으로 볼 때는 자동으로 줄어들어요. */
const BGM_LEVEL = 0.6, BGM_FILE_LEVEL = 0.3;                                     // 코드로 만든 반주 / 고른 곡의 음량
let bgmBus = null, bgmStarted = false, bgmBase = BGM_LEVEL, echoIn = null;
function bgmSetup() {
  const c = ctx; bgmBus = c.createGain(); bgmBus.gain.value = 0; bgmBus.connect(master);
  echoIn = c.createGain(); const dl = c.createDelay(1.5); dl.delayTime.value = 0.34; const fb = c.createGain(); fb.gain.value = 0.22; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
  echoIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(bgmBus);                    // 은은한 메아리(공간감)
  bgmBus.gain.value = 0;                                                                                          // 처음엔 0, 구간 제어가 알맞은 때 천천히 올림
}
/* 코드로 만든 배경음악: 가볍고 경쾌한 뮤직박스풍 반주. 느린 낮은 화음(무서운 느낌)은 쓰지 않고, 밝은 장조(도·라·파·솔)의 통통 튀는 아르페지오 + 아주 작은 셰이커. 낮은 베이스 없이 가볍게. 템포 116. */
const BPM = 116, STEP = 60 / BPM / 2;                                                                                              // 8분음표 한 칸의 길이(초)
const PROG = [[[523.25, 659.25, 783.99, 1046.5], 0], [[440, 523.25, 698.5, 880], 0], [[523.25, 659.25, 783.99, 1046.5], 0], [[392, 493.9, 587.3, 783.99], 0]];   // 도 · 파 · 도 · 솔 (모두 밝은 장조, 낮은 베이스 없음)
const PATS = [[0, 1, 2, 3, 2, 1, 2, 1], [0, 2, 1, 3, 2, 1, 0, 1], [0, 1, 2, 1, 3, 2, 1, 2], [0, 2, 3, 2, 1, 2, 3, 1], [3, 2, 1, 2, 3, 1, 2, 0]];
function bgmNote(f, t, vol, dur, send) {
  const c = ctx, g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(bgmBus); if (send) g.connect(echoIn);
  [[1, 1], [2, 0.16]].forEach(([m, a]) => { const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = f * m; og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.03); });
}
let shakerBuf = null;
function bgmShaker(t, vol) {
  const c = ctx; if (!shakerBuf) { shakerBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.05), c.sampleRate); const d = shakerBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); }
  const n = c.createBufferSource(); n.buffer = shakerBuf; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500; const g = c.createGain(); g.gain.value = vol * 0.6; n.connect(hp); hp.connect(g); g.connect(bgmBus); n.start(t);
}
let bgmStep = 0, bgmNext = 0, bgmBar = 0, bgmPat = PATS[0], bgmOrder = [0, 1, 2, 3];
function bgmSchedule() {
  if (!ctx || ctx.state !== 'running') return; if (!bgmNext || bgmNext < ctx.currentTime) bgmNext = ctx.currentTime + 0.05;
  while (bgmNext < ctx.currentTime + 0.4) {
    const t = bgmNext, i = bgmStep % 8;
    if (i === 0) { bgmBar++; bgmPat = PATS[Math.floor(Math.random() * PATS.length)]; if (bgmBar % 8 === 1 && Math.random() < 0.35) bgmOrder = [0, 3, 1, 2]; else if (bgmBar % 8 === 1) bgmOrder = [0, 1, 2, 3]; }
    const [tones, bass] = PROG[bgmOrder[Math.floor(bgmStep / 8) % 4]];
    if (on) {
      if (!(i === 7 && Math.random() < 0.3)) bgmNote(tones[bgmPat[i]], t, i % 4 === 0 ? 0.06 : 0.04, 0.34, true);          // 통통 튀는 멜로디 (가끔 쉼)
      if (i % 2 === 1) bgmShaker(t, 0.01);                                                                                          // 아주 작은 셰이커
    }
    bgmNext += STEP; bgmStep++;
  }
}
function startBgm() {
  if (bgmStarted || !ensure() || ctx.state !== 'running') return; bgmStarted = true; bgmSetup();
  fetch('assets/bgm.mp3').then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(b => ctx.decodeAudioData(b)).then(buf => {         // 음악 파일이 있으면 그 곡을 반복
    bgmBus.disconnect(); bgmMute = ctx.createGain(); bgmMute.gain.value = on ? 1 : 0; bgmBus.connect(bgmMute); bgmMute.connect(limNode); bgmBus.gain.cancelScheduledValues(0); bgmBus.gain.value = 0; bgmBase = BGM_FILE_LEVEL;   // 고른 곡은 소리를 깎는 필터를 거치지 않고 원음 그대로(작게)
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(bgmBus); s.start(); window.COVE_BGM = 'file';
  }).catch(() => {                                                                                                                  // 없으면 코드로 만든 잔잔한 소리
    window.COVE_BGM = 'generated'; setInterval(bgmSchedule, 100);
  });
  setInterval(() => {                                                                                                               // 영상 전체 화면에서는 배경음악을 끔
    if (!bgmBus) return; const full = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const intro = document.getElementById('intro'), inIntro = !!intro && intro.getBoundingClientRect().bottom > innerHeight * 0.5;      // 맨 앞 인트로(영상) 구간
    const lvl = window.COVE_BGM === 'file' ? BGM_FILE_LEVEL : window.COVE_BGM === 'generated' ? BGM_LEVEL : 0;
    bgmBase = full || inIntro ? 0 : lvl;                                                                                          // 영상 구간에서는 배경음악 없음, 그 구간을 넘어가면 천천히 켜짐
    if (!duckT) bgmBus.gain.setTargetAtTime(bgmBase, ctx.currentTime, 1.1);
  }, 500);
}
let duckT = 0;
function duck() {                                                                                                                   // Cove 소리가 나는 동안 배경음악을 잠깐 줄임
  if (!bgmBus) return; bgmBus.gain.setTargetAtTime(bgmBase * 0.35, ctx.currentTime, 0.06); clearTimeout(duckT);
  duckT = setTimeout(() => { duckT = 0; bgmBus.gain.setTargetAtTime(bgmBase, ctx.currentTime, 0.5); }, 1100);
}
document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {}); });

/* 타이핑: 키보드를 톡 치는 소리 (HI, I'm cove 글자가 하나씩 나올 때) */
let noiseBuf = null;
function type() {
  if (!on || !ensure() || ctx.state !== 'running') return;
  const c = ctx, t = c.currentTime;
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.05), c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); }
  const n = c.createBufferSource(); n.buffer = noiseBuf; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300 + Math.random() * 700; bp.Q.value = 0.8;
  const g = c.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  n.connect(bp); bp.connect(g); g.connect(master); n.start(t);                    // 딸깍 하는 바삭한 소리
  pluck(880 + Math.random() * 150, 0.07, 0.08);                                   // 맑은 톡
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
    if (ensure()) { master.gain.setTargetAtTime(on ? VOL : 0, ctx.currentTime, 0.03); if (bgmMute) bgmMute.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.05); }
    paint(); if (on) resume();
  });
  document.body.appendChild(b);
}
if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

export const CoveSound = { motor, expr, event, bite, bounce, type, get on() { return on; }, get running() { return !!ctx && ctx.state === 'running'; }, get bgmLevel() { return bgmBus ? +bgmBus.gain.value.toFixed(3) : -1; } };
window.CoveSound = CoveSound;
