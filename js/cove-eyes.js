/* ==========================================================
   Cove 눈 — 8×8 LED 도트 표정 (시뮬레이터 look.js 에서 가져옴)
   · 표정 패턴(PATTERNS) · 깜빡임 · 도트 그리기(drawPattern)
   · createEyes(): 머리 안쪽 LED 매트릭스 위치를 기준으로 머리 겉면에 눈 패널을 올린다
   ========================================================== */
const mirror = (rows) => rows.map((r) => [...r].reverse().join(''));
const OVAL = ['00000000', '00011000', '00111100', '00111100', '00111100', '00011000', '00000000', '00000000'];   // 4×5 둥근 타원
const HAPPY = ['00000000', '00000000', '00011000', '00100100', '01000010', '00000000', '00000000', '00000000'];  // ^
const CHEVRON = ['00000000', '01100000', '00011000', '00001100', '00011000', '01100000', '00000000', '00000000']; // >
const SAD_L = ['00000000', '00000011', '00001110', '00111100', '01110000', '00000000', '00000000', '00000000'];   // 바깥쪽이 처진 눈
const SPARK = (off) => OVAL.map((r, y) => r.split('').map((v, x) => (off.some(([oy, ox]) => oy === y && ox === x) ? '0' : v)).join(''));
const STAR = ['00011000', '00011000', '11111111', '01111110', '00111100', '01100110', '01000010', '00000000'];        // ★
const STAR_SM = ['00000000', '00000000', '00011000', '00111100', '00011000', '00000000', '00000000', '00000000'];   // 작게 반짝
const withDrop = (rows, y, x) => rows.map((r, i) => (i === y ? r.split('').map((v, j) => (j === x ? '1' : v)).join('') : r));
const TEAR = (frame) => ({ L: frame < 2 ? withDrop(OVAL, 6 + frame, 2) : OVAL, R: frame < 2 ? withDrop(OVAL, 6 + frame, 5) : OVAL });   // 바깥쪽으로 눈물 방울이 또르르
const RING = [[1, 3], [1, 4], [2, 5], [3, 5], [4, 4], [4, 3], [3, 2], [2, 2]];   // 눈 칸 안에서 한 바퀴 도는 점의 자리(8곳)
const SPIN = (i) => { const g = Array.from({ length: 8 }, () => Array(8).fill('0')); for (const k of [0, 1]) { const [y, x] = RING[(i - k + 8) % 8]; g[y + 1][x] = '1'; if (k === 0) { g[y + 1][x + 1 > 7 ? 7 : x + 1] = '1'; } } return g.map((r) => r.join('')); };   // 점이 꼬리를 끌며 빙글
const UPSET_L = ['00000000', '00000000', '01110000', '00111100', '00111100', '00011000', '00000000', '00000000'];   // 안쪽이 내려온 눈꺼풀 + 처진 눈 (속상함과 화남의 중간)
export const PATTERNS = {
  '뜬 눈': OVAL,
  '위 보는 눈': ['00011000', '00111100', '00111100', '00111100', '00011000', '00000000', '00000000', '00000000'],   // 뜬 눈을 한 줄 올려 위를 보는 눈
  '감은 눈': ['00000000', '00000000', '00000000', '01000010', '00111100', '00000000', '00000000', '00000000'],   // ∪ 편안히 감은 눈
  '웃는 눈': HAPPY,
  '졸린 눈': ['00000000', '00000000', '00000000', '00111100', '00111100', '00011000', '00000000', '00000000'],   // 눈꺼풀이 반쯤 내려온 눈
  '놀란 눈': ['00000000', '00111100', '01111110', '01100110', '01100110', '01111110', '00111100', '00000000'],   // 동공이 비어 있는 큰 눈
  '하트 눈': ['00000000', '01100110', '01111110', '01111110', '00111100', '00011000', '00000000', '00000000'],   // ♥
  '반짝 눈': { frames: [SPARK([[2, 3]]), SPARK([[2, 3], [3, 2]]), SPARK([[2, 3]]), OVAL], step: 0.3 },            // 눈동자에 하이라이트가 반짝
  '슬픈 눈': { L: SAD_L, R: mirror(SAD_L) },                                                                      // 조르는 듯 처진 눈
  '신난 눈': { L: CHEVRON, R: mirror(CHEVRON) },                                                                  // > <
  '윙크': { L: OVAL, R: HAPPY },                                                                                  // 한쪽 눈만 ^
  '편안한 눈': ['00000000', '00000000', '00000000', '00111110', '00000000', '00000000', '00000000', '00000000'],   // ━ 가로 한 줄 5칸
  '별 눈': { frames: [STAR, STAR, STAR_SM], step: 0.3 },                                                          // ★ 반짝반짝
  '눈물 눈': { frames: [TEAR(0), TEAR(1), TEAR(2), TEAR(2)], step: 0.4 },                                          // 눈물 한 방울이 또르르
  '어지러운 눈': { frames: [0, 1, 2, 3, 4, 5, 6, 7].map(SPIN), step: 0.09 },                                        // 점이 빙글빙글
  '속상한 눈': { L: UPSET_L, R: mirror(UPSET_L) },
  '점 눈': ['00000000', '00000000', '00000000', '00011000', '00011000', '00000000', '00000000', '00000000'],       // 동글동글 점 두 개
};
export const EXPRESSIONS = Object.keys(PATTERNS);

// LED 한 칸마다 또렷한 동그란 점(밝은 중심 + 얇은 헤일로)을 찍고, 천 뒤에서 은은하게 번지도록 두 겹으로 합성한다.
// 꺼진 칸은 아무것도 그리지 않는다(천 뒤라 보이지 않음).
export function drawPattern(canvas, rows) {
  const S = canvas.width, cell = S / 8, ctx = canvas.getContext('2d');
  const dots = document.createElement('canvas'); dots.width = dots.height = S;
  const g = dots.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((v, x) => {
    if (v !== '1') return;
    const cx = (x + 0.5) * cell, cy = (y + 0.5) * cell;
    const R = cell * 0.5;                          // 이웃 칸과 살짝만 닿아 한 칸 한 칸이 구분되어 보이도록
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, R);
    grad.addColorStop(0, 'rgba(252,254,255,1)');
    grad.addColorStop(0.5, 'rgba(232,243,255,.96)');
    grad.addColorStop(0.82, 'rgba(200,224,255,.4)');
    grad.addColorStop(1, 'rgba(200,224,255,0)');
    g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  }));
  ctx.clearRect(0, 0, S, S);
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = `blur(${cell * 0.1}px)`; ctx.drawImage(dots, 0, 0);               // 도트 자체 (거의 선명)
  ctx.globalAlpha = 0.34; ctx.filter = `blur(${cell * 0.5}px)`; ctx.drawImage(dots, 0, 0);   // 천에 번지는 빛
  ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
}

/* 8×8 도트 매트릭스라서 눈의 모든 움직임은 "도트 한 칸" 단위의 프레임으로만 만든다(중간 값 없음):
   - 시선: 패턴을 칸 단위(−2~+2)로 밀기
   - 깜빡임: 눈 높이를 5줄 → 3줄 → 1줄로 줄였다가 되돌리는 5프레임 (60ms 간격)
   - 표정 전환: 프레임이 바뀌는 순간 통째로 교체 (LED가 한 번에 바뀌는 것처럼) */
const BLINK_FRAMES = [1, 2, 2, 1, 0];          // 0 = 뜬 눈, 1 = 반쯤, 2 = 감김
const BLINK_STEP = 0.06;
function blinkStage(t) {                       // 3.8초마다, 조금씩 어긋나게 한 번씩 깜빡임 (시간만으로 결정되어 재생·내보내기에서 같다)
  const P = 3.8, n = Math.floor((t - 1.6) / P);
  if (n < 0) return 0;
  const start = 1.6 + n * P + 0.9 * (0.5 + 0.5 * Math.sin(n * 12.9898));
  const ph = t - start;
  if (ph < 0 || ph >= BLINK_FRAMES.length * BLINK_STEP) return 0;
  return BLINK_FRAMES[Math.floor(ph / BLINK_STEP)];
}
const BLINK = { 1: ['00000000', '00000000', '00011000', '00111100', '00011000', '00000000', '00000000', '00000000'],    // 반쯤 감김
                2: ['00000000', '00000000', '00000000', '00111100', '00000000', '00000000', '00000000', '00000000'] };  // 감김
const shiftRows = (rows, gx, gy) => {
  const src = rows.map((r) => r.split('')), out = Array.from({ length: 8 }, () => Array(8).fill('0'));
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const sx = x - gx, sy = y - gy;
    if (sx >= 0 && sx < 8 && sy >= 0 && sy < 8) out[y][x] = src[sy][sx];
  }
  return out.map((r) => r.join(''));
};
// 눈 한쪽만 따로 고른 표정의 프레임 (side 0 = 보는 사람 기준 왼쪽 눈, 1 = 오른쪽 눈). 윙크는 어느 쪽에 골라도 그 눈이 윙크한다.
function soloPattern(name, side, gx, gy, stage, t) {
  const def = PATTERNS[name] || PATTERNS['뜬 눈'];
  let f = def;
  if (!Array.isArray(def) && def.frames) f = def.frames[Math.floor(t / def.step) % def.frames.length];
  let rows = Array.isArray(f) ? f : name === '윙크' ? f.R : side === 0 ? f.L : f.R;
  if (name === '뜬 눈' && BLINK[stage]) rows = BLINK[stage];
  return shiftRows(rows, gx, gy);
}
// 팔레트용: 눈 한 개짜리 그림 (side 0/1 = 보는 사람 기준 왼쪽/오른쪽 눈)
export const eyeRows = (name, side = 0, t = 0) => soloPattern(name, side, 0, 0, 0, t);
// 반환: [보는 사람 기준 왼쪽 눈 프레임, 오른쪽 눈 프레임]
function framePattern(name, gx, gy, stage, t) {
  const def = PATTERNS[name] || PATTERNS['뜬 눈'];
  let L, R;
  if (Array.isArray(def)) L = R = def;
  else if (def.frames) { const f = def.frames[Math.floor(t / def.step) % def.frames.length]; if (Array.isArray(f)) L = R = f; else { L = f.L; R = f.R; } }
  else { L = def.L; R = def.R; }
  if (name === '뜬 눈' && BLINK[stage]) L = R = BLINK[stage];
  return [shiftRows(L, gx, gy), shiftRows(R, gx, gy)];
}


/* 두 LED 매트릭스(KeyStudio-HT16K33-8x8-LED-Matrix)의 중심에서 앞쪽으로 광선을 쏴서
   머리 외피를 뚫고 나오는 점에 눈 패널(16mm)을 올린다. (시뮬레이터와 같은 방식)
   기준 자세: 기둥 35°, 머리 -42°.  반환: show(표정, gx, gy, t, 왼눈표정, 오른눈표정) */
export function createEyes(THREE, { model, col, head, tilt, shells, matrices }) {
  const Z = new THREE.Vector3(0, 0, 1), D2R = Math.PI / 180;
  const save = [col, head].map((o) => o.quaternion.clone());
  col.quaternion.copy(save[0]).multiply(new THREE.Quaternion().setFromAxisAngle(Z, 35 * D2R));
  head.quaternion.copy(save[1]).multiply(new THREE.Quaternion().setFromAxisAngle(Z, -42 * D2R));
  model.updateMatrixWorld(true);
  const zAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(col.getWorldQuaternion(new THREE.Quaternion())).normalize();
  const front = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), zAxis).normalize().multiplyScalar(-1);
  const viewerRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), front).normalize();
  const ray = new THREE.Raycaster(), group = new THREE.Group(); group.name = '눈';
  const SIZE = 0.016, GAP_IN = 0.003, RAISE = 0.007;
  const tiltQ = tilt.getWorldQuaternion(new THREE.Quaternion()).invert();
  const centers = matrices.map((m) => new THREE.Box3().setFromObject(m, true).getCenter(new THREE.Vector3()));
  const mid = centers[0].clone().add(centers[1]).multiplyScalar(0.5);
  const list = [];
  for (let mi = 0; mi < matrices.length; mi++) {
    const c = centers[mi].clone();
    const toMid = mid.clone().sub(c); toMid.y = 0; if (toMid.length() > 1e-6) c.addScaledVector(toMid.normalize(), GAP_IN);
    c.y += RAISE;
    ray.set(c.clone().addScaledVector(front, 0.3), front.clone().negate());
    const hits = ray.intersectObjects(shells, false);
    if (!hits.length) continue;
    const hit = hits[0];
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
    if (n.dot(front) < 0) n.negate();
    const pos = hit.point.clone().addScaledVector(n, 0.0004);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), mat);
    mesh.renderOrder = 5; mesh.userData.isEye = true;
    const look = new THREE.Object3D(); look.position.copy(pos); look.up.set(0, 1, 0); look.lookAt(pos.clone().add(n));
    mesh.position.copy(tilt.worldToLocal(pos.clone()));
    mesh.quaternion.copy(tiltQ.clone().multiply(look.quaternion));
    group.add(mesh); list.push({ canvas, tex, x: pos.dot(viewerRight) });
  }
  col.quaternion.copy(save[0]); head.quaternion.copy(save[1]);
  list.sort((a, b) => a.x - b.x);                       // 보는 사람 기준 왼쪽 → 오른쪽
  tilt.add(group);
  let lastKey = '';
  const api = {
    group, front, count: list.length, rows: null,
    show(name, gx = 0, gy = 0, t = 0, nameL = '', nameR = '') {
      const solo = !!(nameL || nameR), names = [nameL || name, nameR || name];
      const stage = names.includes('뜬 눈') ? blinkStage(t) : 0;
      const frames = names.map((n) => { const d = PATTERNS[n]; return d && d.frames ? Math.floor(t / d.step) % d.frames.length : 0; });
      const key = `${solo ? names.join('/') : name}|${gx}|${gy}|${stage}|${frames.join(',')}`;
      if (key === lastKey) return false;
      lastKey = key;
      const [pl, pr] = solo ? [soloPattern(names[0], 0, gx, gy, stage, t), soloPattern(names[1], 1, gx, gy, stage, t)] : framePattern(name, gx, gy, stage, t);
      list.forEach((e, i) => { drawPattern(e.canvas, i === 0 ? pl : pr); e.tex.needsUpdate = true; });
      api.rows = [pl, pr];
      return true;
    },
  };
  api.show('뜬 눈');
  return api;
}
