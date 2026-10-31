import { printedMaterial, layerUV } from './print-material.js';
/* ==========================================================
   Cove 시뮬레이터 — Design 섹션
   · 머리·몸통을 끌거나 눌러서 자세를 바꿀 수 있어요.
   · TOP / FRONT / PERSPECTIVE / SIDE 로 보는 각도를 바꿀 수 있어요.
   · 인사, 쓰다듬음, 간지럼, 간식 동작을 재생해 볼 수 있어요. (시뮬레이터 presets.js 동작 그대로)
   · 눈은 머리 안쪽 8×8 LED 매트릭스 위치에 맞춰 그려요. (cove-eyes.js)
   3D 파일은 Design 섹션 근처에 왔을 때에만 불러오고, 실패하면 기존 임시 이미지가 그대로 남아요.
   ========================================================== */

const host = document.querySelector('.cove-3d');
if (host) {
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    init(host).catch(err => console.warn('Cove simulator unavailable:', err));
  }, { rootMargin: '900px 0px' });
  io.observe(host);
}

async function init(host) {
  const [THREE, { GLTFLoader }, { RoomEnvironment }, { MeshoptDecoder }, EYES, PRE] = await Promise.all([
    import('three'),
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/environments/RoomEnvironment.js'),
    import('three/addons/libs/meshopt_decoder.module.js'),
    import('./cove-eyes.js'),
    import('./cove-presets.js'),
  ]);

  const figure = host.closest('figure');
  const ui = figure.querySelector('.sim__ui');
  const caption = figure.querySelector('figcaption');
  const statusEl = figure.querySelector('.sim__status');
  const D2R = Math.PI / 180;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ───────── 장면 ───────── */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xfff4e8, 0xd8c8c0, 1.5));
  const key = new THREE.DirectionalLight(0xfff1e2, 0.9); key.position.set(-1.2, 2, 1.5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xe4dbf5, 0.55); fill.position.set(2, .6, -1); scene.add(fill);

  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(host.dataset.model);
  const model = gltf.scene; scene.add(model);

  /* ───────── 재질: 패브릭 외피 + 흰 파이핑 + 알루미늄 기둥 + 고무링 (시뮬레이터 look.js) ───────── */
  const fabric = new THREE.MeshPhysicalMaterial({ color: '#ddd5c9', roughness: 1, metalness: 0, sheen: 0.55, sheenRoughness: 0.85, sheenColor: new THREE.Color('#ffffff'), envMapIntensity: 0.5 });
  fabric.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vObjPos;
float h31(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{ float g1 = vn(vObjPos * 420.0), g2 = vn(vObjPos * 130.0), g3 = vn(vObjPos * 38.0);
  diffuseColor.rgb *= 0.93 + 0.10 * g1 + 0.05 * g2 + 0.04 * g3; }`);
  };
  const piping = new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.55, metalness: 0, envMapIntensity: 0.9 });
  const aluminum = printedMaterial(THREE);
  const rubber = new THREE.MeshStandardMaterial({ color: '#8d8c8a', roughness: 0.9, metalness: 0 });
  const FABRIC = ['새_헤드_상판', '새_쿠션', '새_하부_폼', '새_하부_쉘'], PIPING = ['새_헤드_하부판', '새_하부_덮개판'];
  const ALU = ['기둥_1', '본체6'], RUBBER = ['새_미끄럼방지_고무링', '하부_회전판'];
  const by = {}; model.traverse(o => { by[o.name] = o; });
  const matrices = [], shells = [], pickables = [];
  model.traverse(o => {
    if (!o.isMesh) return;
    if (FABRIC.includes(o.name)) o.material = fabric; else if (PIPING.includes(o.name)) o.material = piping;
    else if (ALU.includes(o.name)) { o.material = aluminum; layerUV(THREE, o); } else if (RUBBER.includes(o.name)) o.material = rubber;
    if (/KeyStudio-HT16K33-8x8-LED-Matrix/.test(o.name)) { matrices.push(o); o.visible = false; return; }   // 눈 위치 계산용 (화면에는 안 보임)
    if (['새_헤드_상판', '새_쿠션', '새_헤드_하부판'].includes(o.name)) shells.push(o);
    if (o.name === '눈_LED_가이드') o.visible = true;
    pickables.push(o);
  });
  const col = by['기둥'], head = by['머리'], tilt = Object.values(by).find(o => /^머리_갸웃/.test(o.name)), root = by['COVE_리그'] || model;
  const ring = by['새_미끄럼방지_고무링'];
  if (ring) scene.attach(ring);                 // 바닥에 닿는 고무링은 몸통이 돌아도 제자리에 둠

  /* ───────── 눈 (8×8 LED 도트) ───────── */
  const eyes = EYES.createEyes(THREE, { model, col, head, tilt, shells, matrices });
  const FRONT = eyes.front.clone().setY(0).normalize();                   // 로봇이 바라보는 방향
  const RIGHT = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), FRONT).normalize();   // 정면에서 마주 본 사람의 오른쪽
  pickables.push(...eyes.group.children);

  /* ───────── 자세 ───────── */
  const AXZ = new THREE.Vector3(0, 0, 1), AXY = new THREE.Vector3(0, 1, 0);
  const rest = new Map([col, head, tilt, root].map(o => [o, o.quaternion.clone()]));
  const spin = (o, ax, deg) => o.quaternion.copy(rest.get(o)).multiply(new THREE.Quaternion().setFromAxisAngle(ax, deg * D2R));
  // 로봇이 실제로 움직일 수 있는 범위 (시뮬레이터 robotexport.js)
  const NECK = [0, 34], HEAD = [-46, 0], BODY = [-90, 90];
  const TILT_ENV = [[-47.8, 0, 0], [-43.8, 0, 0], [-40.5, 0, 0], [-27.2, -6.5, 7.6], [-25.4, -15.3, 14.9], [-12, -13.9, 6.9], [-7.2, -8, 4.9], [-2.8, -7.1, 9.1], [0, 0, 0]];
  function tiltRange(h) {
    const e = TILT_ENV;
    if (h <= e[0][0]) return [e[0][1], e[0][2]];
    for (let i = 1; i < e.length; i++) if (h <= e[i][0]) { const [h0, a0, b0] = e[i - 1], [h1, a1, b1] = e[i], f = (h - h0) / (h1 - h0); return [a0 + (a1 - a0) * f, b0 + (b1 - b0) * f]; }
    return [0, 0];
  }
  const limit = (p) => { const neck = clamp(p.neck, ...NECK), head = clamp(p.head, ...HEAD), body = clamp(p.body, ...BODY); const [lo, hi] = tiltRange(head); return { neck, head, tilt: clamp(p.tilt, lo, hi), body }; };
  const AWAKE = { neck: 25, head: -34, tilt: 0, body: 0 };
  const pose = { ...AWAKE }, goal = { ...AWAKE }, vel = { neck: 0, head: 0, tilt: 0, body: 0 };
  function writePose() { spin(col, AXZ, pose.neck); spin(head, AXZ, pose.head); spin(tilt, AXY, pose.tilt); spin(root, AXY, pose.body); }
  function smoothDamp(cur, target, v, time, dt) {
    const w = 2 / time, x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x), d = cur - target, tmp = (v.v + w * d) * dt;
    v.v = (v.v - w * tmp) * e; return target + (d + tmp) * e;
  }
  const vv = { neck: { v: 0 }, head: { v: 0 }, tilt: { v: 0 }, body: { v: 0 } };

  /* ───────── 동작(클립) ───────── */
  const items = PRE.PRESET_GROUPS[0].items, find = (n) => items.find(i => i.name === n);
  function slice(c, a, b, label) {                                          // 시나리오 한 부분만 잘라서 쓴다
    const keys = c.keys.filter(k => k[0] >= a - 1e-6 && k[0] <= b + 1e-6).map(k => [+(k[0] - a).toFixed(3), ...k.slice(1)]);
    let eyesT = (c.eyes || []).map(e => [e[0] - a, e[1]]);
    const before = eyesT.filter(e => e[0] <= 0).pop(); eyesT = [before ? [0, before[1]] : [0, '뜬 눈'], ...eyesT.filter(e => e[0] > 0 && e[0] <= b - a)];
    const markers = (c.markers || []).filter(m => m.t >= a - 1e-6 && m.t < b - 1e-6).map(m => ({ t: m.t - a, label: m.label }));
    return { keys, eyes: eyesT, markers, duration: b - a, label };
  }
  const full = (n) => { const c = find(n); return { keys: c.keys, eyes: c.eyes || [], markers: c.markers || [], duration: c.duration }; };
  const rest1 = find('시나리오1 휴식'), tickle = find('시나리오2 간지럽히기'), snack = find('시나리오3 간식주기'), greet = find('시나리오4 인사');
  const petStart = (rest1.markers.find(m => m.label === '쓰다듬어 줘서 좋아요') || { t: 3 }).t;
  const CLIPS = {
    greet: full('시나리오4 인사'),
    pet: slice(rest1, petStart, petStart + 6),
    tickle: slice(tickle, 0, 14),
    snack: slice(snack, 0, 14),
    rest: full('시나리오1 휴식'),
  };
  let clip = null, clipT = 0, clipName = '';
  function sampleClip(c, t) {
    const K = c.keys; if (t <= K[0][0]) return K[0]; if (t >= K[K.length - 1][0]) return K[K.length - 1];
    let lo = 0, hi = K.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (K[m][0] <= t) lo = m; else hi = m; }
    const a = K[lo], b = K[hi], f = (t - a[0]) / (b[0] - a[0] || 1);
    return a.map((v, i) => i === 0 ? t : (v ?? 0) + ((b[i] ?? 0) - (v ?? 0)) * f);
  }
  const eyeAt = (list, t) => { let n = '뜬 눈'; for (const e of list) if (e[0] <= t + 1e-6) n = e[1]; return n; };
  const motionBtns = [...figure.querySelectorAll('[data-motion]')];
  function setStatus(text, cls = '') { if (!statusEl) return; statusEl.textContent = text; statusEl.dataset.k = cls; }
  const HINT = '머리와 몸통을 끌어서 움직여 보세요';
  const stepsEl = figure.querySelector('.sim__steps'); let stepIdx = -1;
  function buildSteps(c) {
    if (!stepsEl) return; stepsEl.textContent = ''; stepIdx = -1;
    (c?.markers || []).forEach((m, i) => { const li = document.createElement('li'); li.innerHTML = `<i>${String(i + 1).padStart(2, '0')}</i><span></span>`; li.lastChild.textContent = m.label; stepsEl.appendChild(li); });
    stepsEl.hidden = !c || !c.markers?.length;
  }
  let lastActive = -1e9, gest = null, nextGest = 3;                        // 사용자가 마지막으로 만진 시각 / 지금 하는 혼자 동작 / 다음 동작 시각
  figure.addEventListener('pointerdown', () => { lastActive = tNow; gest = null; }, true);
  window.addEventListener('pointerup', () => { lastActive = tNow; });
  function play(name) {
    if (!CLIPS[name]) return;
    if (clipName === name && clip) { stopClip(); return; }                  // 같은 버튼을 다시 누르면 멈춤
    clip = CLIPS[name]; clipName = name; clipT = -0.9; gest = null; lastActive = tNow;   // 처음 0.9초는 시작 자세로 부드럽게 이동
    buildSteps(clip);
    motionBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.motion === name)));
  }
  function stopClip(keepPose = true) {
    clip = null; clipName = ''; motionBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
    setStatus(HINT); buildSteps(null); lastActive = tNow;
    if (!keepPose) Object.assign(goal, AWAKE);
  }

  /* ───────── 카메라와 보기 각도 ───────── */
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 10);
  const box = new THREE.Box3().setFromObject(model), center = box.getCenter(new THREE.Vector3()), sphere = box.getBoundingSphere(new THREE.Sphere());
  center.y = box.min.y + (box.max.y - box.min.y) * 0.48;
  const VIEWS = { persp: { az: 35, el: 14, label: '3/4 View' }, front: { az: 0, el: 5, label: 'Front View' }, side: { az: 90, el: 5, label: 'Side View' }, top: { az: 180, el: 84, label: 'Top View' } };
  const cam = { az: 35, el: 14, dist: 1, zoom: 1 }, camGoal = { az: 35, el: 14, zoom: 1 }, cv = { az: { v: 0 }, el: { v: 0 }, zoom: { v: 0 } };
  const ZMIN = 0.6, ZMAX = 3.2;
  let view = 'persp';
  const viewBtns = [...figure.querySelectorAll('[data-view]')];
  // 3D 칸은 카드 전체를 덮는다(확대해도 가장자리가 보이지 않음). 모델은 그 안의 "안전 영역"에 맞춰 놓는다.
  const mobileMQ = window.matchMedia('(max-width: 760px)');
  const safe = () => (mobileMQ.matches ? { w: 0.96, h: 0.69, cy: 0.455 } : { w: 0.92, h: 0.78, cy: 0.47 });
  function fitDistance() {
    const s = safe(), vf = camera.fov * D2R, tv = Math.tan(vf / 2), th = tv * camera.aspect;
    const vv = 2 * Math.atan(tv * s.h), hv = 2 * Math.atan(th * s.w);
    return (sphere.radius * 0.95) / Math.sin(Math.min(vv, hv) / 2);
  }
  function setView(v) {
    view = v; camGoal.az = VIEWS[v].az; camGoal.el = VIEWS[v].el;
    // 가장 가까운 회전 방향으로 돌도록 기준을 맞춘다
    camGoal.az = cam.az + (((camGoal.az - cam.az) % 360) + 540) % 360 - 180;
    viewBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
    if (caption) caption.textContent = `Render — ${VIEWS[v].label}`;
  }
  function placeCamera() {
    const az = cam.az * D2R, el = cam.el * D2R, d = cam.dist / cam.zoom;
    const dir = FRONT.clone().multiplyScalar(Math.cos(az)).addScaledVector(RIGHT, Math.sin(az));
    camera.position.copy(center).addScaledVector(dir, d * Math.cos(el)); camera.position.y += d * Math.sin(el);
    camera.lookAt(center);
  }

  /* ───────── 바닥 그림자 ───────── */
  const c2 = document.createElement('canvas'); c2.width = c2.height = 128;
  const g2 = c2.getContext('2d'), gr = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(110,80,120,.26)'); gr.addColorStop(1, 'rgba(110,80,120,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(sphere.radius * 1.9, sphere.radius * 1.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c2), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(center.x, box.min.y - 0.001, center.z); scene.add(shadow);

  /* ───────── 끌기 / 누르기 ───────── */
  const el = renderer.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  el.style.touchAction = 'pan-y';
  let drag = null;
  const isHead = (o) => { for (; o; o = o.parent) if (o === head) return true; return false; };
  function pick(ev) {
    const r = el.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(pickables, false)[0];
    return h ? (isHead(h.object) ? 'head' : 'body') : null;
  }
  // 머리를 끌 때: 위아래 = 고개 들기(기둥+머리), 좌우 = 갸웃. 갸웃이 가능한 머리 높이로 자동으로 맞춘다.
  function headDrag(dx, dy) {
    const neck = clamp(drag.p0.neck - dy * 0.18, ...NECK);
    let h = clamp(-1.36 * neck, ...HEAD);
    const wantTilt = clamp(drag.p0.tilt + dx * 0.12 * TILT_SIGN, -20, 20);
    let bestH = null;
    for (let s = 0; s <= 46 && bestH === null; s++) for (const sg of [1, -1]) {                // 지금 머리 높이에서 가장 가까운, 그 갸웃이 가능한 높이
      const hh = clamp(h + sg * s, ...HEAD), [lo, hi] = tiltRange(hh);
      if (wantTilt >= lo - 1e-6 && wantTilt <= hi + 1e-6) { bestH = hh; break; }
    }
    if (bestH === null) { bestH = -25.4; }
    const [lo, hi] = tiltRange(bestH);
    goal.neck = neck; goal.head = bestH; goal.tilt = clamp(wantTilt, lo, hi);
  }
  let TILT_SIGN = -1;                                                       // 끈 쪽으로 머리가 기울도록 (+갸웃은 정면에서 볼 때 오른쪽이 올라감)
  el.addEventListener('pointerdown', (ev) => {
    if (ev.button > 0) return;
    const kind = pick(ev);
    drag = { kind, x0: ev.clientX, y0: ev.clientY, p0: { ...goal }, moved: false, az0: camGoal.az, el0: camGoal.el, id: ev.pointerId };
    if (kind) stopClip();
    try { el.setPointerCapture(ev.pointerId); } catch { /* 무시 */ }
  });
  el.addEventListener('pointermove', (ev) => {
    if (!drag) { el.style.cursor = pick(ev) ? 'grab' : 'default'; return; }
    const dx = ev.clientX - drag.x0, dy = ev.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) { drag.moved = true; el.style.cursor = 'grabbing'; }
    if (drag.kind === 'head') headDrag(dx, dy);
    else if (drag.kind === 'body') goal.body = clamp(drag.p0.body + dx * 0.35, ...BODY);
    else { camGoal.az = drag.az0 - dx * 0.4; camGoal.el = clamp(drag.el0 + dy * 0.3, -5, 84); view = 'persp'; viewBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === 'persp'))); if (caption) caption.textContent = `Render — ${VIEWS.persp.label}`; }
  });
  const end = (ev) => {
    if (!drag) return;
    const d = drag; drag = null; el.style.cursor = 'default';
    if (!d.moved && d.kind === 'head') play('pet');                         // 머리를 톡 누르면 쓰다듬음
    else if (!d.moved && d.kind === 'body') play('greet');                  // 몸통을 톡 누르면 인사
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', () => { drag = null; });

  viewBtns.forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  motionBtns.forEach(b => b.addEventListener('click', () => play(b.dataset.motion)));
  figure.querySelector('[data-act="reset"]')?.addEventListener('click', () => { stopClip(false); setView('persp'); camGoal.zoom = 1; });

  /* 확대·축소: + − 버튼, Ctrl(⌘)+휠 또는 트랙패드 핀치, 터치 두 손가락 핀치, 빈 곳을 두 번 누르면 원래 크기.
     그냥 휠은 페이지 스크롤에 쓰이도록 그대로 둔다. */
  const zoomBy = (f) => { camGoal.zoom = clamp(camGoal.zoom * f, ZMIN, ZMAX); };
  figure.querySelector('[data-zoom="in"]')?.addEventListener('click', () => zoomBy(1.25));
  figure.querySelector('[data-zoom="out"]')?.addEventListener('click', () => zoomBy(1 / 1.25));
  el.addEventListener('wheel', (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); zoomBy(Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0022))); }, { passive: false });
  el.addEventListener('dblclick', (e) => { if (!pick(e)) camGoal.zoom = 1; });
  const touches = new Map(); let pinch0 = null;
  el.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') return; touches.set(e.pointerId, [e.clientX, e.clientY]); if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: camGoal.zoom }; drag = null; } }, true);
  el.addEventListener('pointermove', (e) => { if (!touches.has(e.pointerId)) return; touches.set(e.pointerId, [e.clientX, e.clientY]); if (touches.size === 2 && pinch0) { const [a, b] = [...touches.values()]; camGoal.zoom = clamp(pinch0.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0.d, ZMIN, ZMAX); } }, true);
  const lift = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch0 = null; };
  el.addEventListener('pointerup', lift, true); el.addEventListener('pointercancel', lift, true);
  figure.querySelector('[data-act="toggle"]')?.addEventListener('click', (e) => {
    stopClip(); const sitting = goal.neck < 10; Object.assign(goal, sitting ? AWAKE : { neck: 0, head: 0, tilt: 0, body: goal.body });
    e.currentTarget.textContent = sitting ? '앉기' : '일어나기';
  });

  /* ───────── 반복 ───────── */
  let dirty = true, visible = false, last = performance.now(), tNow = 0;
  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); renderer.domElement.style.cssText += ';width:100%;height:100%;display:block';
    camera.aspect = w / h; camera.updateProjectionMatrix(); cam.dist = fitDistance();
    camera.setViewOffset(w, h, 0, -(safe().cy - 0.5) * h, w, h); dirty = true;     // 모델 중심을 안전 영역의 가운데로
  }
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) { dirty = true; last = performance.now(); } }).observe(host);

  /* ───────── 변칙적인 움직임 ─────────
     가만히 두면 Cove가 혼자서 두리번거리고, 갸웃하고, 끄덕이고, 깜짝 놀라고, 하품하고, 몸을 흔든다.
     순서와 간격은 매번 달라진다. 모두 로봇이 움직일 수 있는 범위 안이다. */
  const env = (u) => Math.sin(Math.PI * clamp(u, 0, 1));
  const GESTS = [
    { name: '두리번두리번', dur: 4.6, eye: '뜬 눈', f: (u) => ({ body: 26 * Math.sin(2 * Math.PI * u) * env(u * 1.0 + 0.0) ** 0.3, tilt: 6 * Math.sin(2 * Math.PI * u), gx: Math.round(2 * Math.sin(2 * Math.PI * u)) }) },
    { name: '갸웃?', dur: 3.2, eye: '반짝 눈', f: (u) => ({ tilt: 12 * env(u), head: -3 * env(u), body: 8 * env(u) }) },
    { name: '끄덕끄덕', dur: 1.8, eye: '뜬 눈', f: (u) => ({ head: -8 * Math.sin(4 * Math.PI * u) * env(u) }) },
    { name: '앗, 깜짝!', dur: 1.8, eye: '놀란 눈', f: (u) => { const p = u < 0.14 ? u / 0.14 : Math.exp(-(u - 0.14) * 4.2); return { neck: 7 * p, head: -7 * p, body: 6 * p }; } },
    { name: '하아암~', dur: 3.6, eye: '졸린 눈', f: (u) => ({ neck: -7 * env(u), head: 9 * env(u) }) },
    { name: '신나서 흔들흔들', dur: 2.4, eye: '신난 눈', f: (u) => ({ body: 13 * Math.sin(6 * Math.PI * u) * env(u), tilt: 5 * Math.sin(6 * Math.PI * u) * env(u) }) },
  ];
  let lastG = -1;
  function pickGesture() { let i; do { i = Math.floor(Math.random() * GESTS.length); } while (i === lastG); lastG = i; return { ...GESTS[i], t: 0 }; }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; tNow += dt;
    // 동작 재생
    if (clip) {
      clipT += dt;
      const t = clamp(clipT, 0, clip.duration), s = sampleClip(clip, t);
      Object.assign(goal, limit({ neck: s[1], head: s[2], tilt: s[3] ?? 0, body: s[4] ?? 0 }));
      eyeName = eyeAt(clip.eyes, t);
      const mi = clip.markers.reduce((r, x, i) => (x.t <= t + 1e-6 ? i : r), -1); const m = clip.markers[mi]; if (m) setStatus(m.label, 'play');
      if (mi !== stepIdx && stepsEl) { stepIdx = mi; [...stepsEl.children].forEach((li, i) => li.classList.toggle('cur', i === mi)); }
      if (clipT >= clip.duration + 0.4) { stopClip(); setStatus(HINT); }
    }
    // 가만히 두면 혼자서 움직인다 (일어서 있고, 끌거나 동작을 재생하는 중이 아닐 때)
    let off = null, gx = 0;
    const idle = !clip && !drag && tNow - lastActive > 2.4 && goal.neck > 12 && pose.neck > 12;
    if (!idle) { if (gest) { gest = null; setStatus(HINT); } }
    else if (!gest && tNow >= nextGest) { gest = pickGesture(); }
    if (gest) {
      gest.t += dt; const u = gest.t / gest.dur;
      if (u >= 1) { gest = null; nextGest = tNow + 3 + Math.random() * 5; setStatus(HINT); }
      else { off = gest.f(u); gx = off.gx || 0; if (statusEl && statusEl.textContent !== gest.name) setStatus(gest.name, 'play'); }
    }
    let target = goal;
    if (off) target = limit({ neck: goal.neck + (off.neck || 0), head: goal.head + (off.head || 0), tilt: goal.tilt + (off.tilt || 0), body: goal.body + (off.body || 0) });
    // 목표 자세를 부드럽게 따라간다
    const tm = clip ? (clipT < 0 ? 0.3 : 0.07) : gest ? 0.16 : 0.1;           // 동작이 시작되기 전 준비 구간은 천천히 부드럽게
    for (const j of ['neck', 'head', 'tilt', 'body']) pose[j] = smoothDamp(pose[j], target[j], vv[j], tm, dt);
    // 서 있을 때는 숨 쉬듯 아주 조금 흔들린다
    const g = clamp((pose.neck - 2) / 10, 0, 1), a = g * g * (3 - 2 * g);
    const sway = { neck: a * (0.45 * Math.sin(2 * Math.PI * tNow / 3.7) + 0.25 * Math.sin(2 * Math.PI * tNow / 5.9 + 1.3)), head: a * (0.7 * Math.sin(2 * Math.PI * tNow / 4.3 + 0.6) + 0.3 * Math.sin(2 * Math.PI * tNow / 2.9 + 2.1)) };
    const shown = { ...pose }; shown.neck += sway.neck; shown.head += sway.head;
    const saved = { ...pose }; Object.assign(pose, shown); writePose(); Object.assign(pose, saved);
    if (!clip) eyeName = gest ? gest.eye : pose.neck < 4 ? '감은 눈' : '뜬 눈';
    eyes.show(eyeName, gx, 0, tNow);
    // 카메라
    cam.az = smoothDamp(cam.az, camGoal.az, cv.az, 0.28, dt); cam.el = smoothDamp(cam.el, camGoal.el, cv.el, 0.28, dt); cam.zoom = smoothDamp(cam.zoom, camGoal.zoom, cv.zoom, 0.22, dt);
    placeCamera();
    renderer.render(scene, camera);
  }
  let eyeName = '뜬 눈';
  resize(); setView('persp'); cam.az = camGoal.az; cam.el = camGoal.el; writePose(); setStatus(HINT);
  figure.classList.add('has-3d'); ui?.removeAttribute('hidden');
  requestAnimationFrame(frame);

  // 확인·연동용 (콘솔에서 COVE_SIM.play('greet') 처럼 쓸 수 있어요)
  window.COVE_SIM = { play, stop: stopClip, setView, goal, pose, eyes, pick, camGoal, cam, get view() { return view; }, setTiltSign(s) { TILT_SIGN = s; } };
}
