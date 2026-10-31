import { printedMaterial, layerUV } from './print-material.js';
import { fabricFor } from './fabric-material.js';
/* ==========================================================
   Design 카드 안의 Cove 장면 (Form / Material / Motion)
   각 카드의 이미지 칸에서 그 항목을 보여주는 장면이 저절로 재생돼요.
   · Form     — 옆모습 → 앞모습 → 3/4 각도로 돌아요
   · Material — 머리 아래 이음선 가까이로 확대, 빛이 지나가듯 천천히 흔들려요
   · Motion   — 머리를 숙이고 몸통을 돌리며 갸웃, 눈 표정이 바뀌어요 (반복)
   화면에 보이는 카드만 그려요. 불러오지 못하면 기존 임시 그림이 그대로 남아요.
   ========================================================== */
const slots = [...document.querySelectorAll('.slot[data-scene]')];
if (slots.length) {
  const io = new IntersectionObserver((es) => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    init().catch(err => console.warn('Cove card scenes unavailable:', err));
  }, { rootMargin: '900px 0px' });
  slots.forEach(s => io.observe(s));
}

async function init() {
  const [THREE, { GLTFLoader }, { RoomEnvironment }, { MeshoptDecoder }, EYES] = await Promise.all([
    import('three'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/environments/RoomEnvironment.js'),
    import('three/addons/libs/meshopt_decoder.module.js'), import('./cove-eyes.js'),
  ]);
  const D2R = Math.PI / 180, clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync('assets/cove-rig.glb');

  /* 재질 (시뮬레이터와 같은 패브릭 외피 · 흰 파이핑 · 알루미늄 · 고무) */
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
  const FABRIC = ['새_헤드_상판', '새_쿠션', '새_하부_폼', '새_하부_쉘'], PIPING = ['새_헤드_하부판', '새_하부_덮개판'], ALU = ['기둥_1', '본체6'], RUBBER = ['새_미끄럼방지_고무링', '하부_회전판'];

  /* Motion 연기: 머리를 살짝 숙여(갸웃이 크게 되는 높이) → 몸통을 돌리며 갸웃 → 눈으로 마음 전하기. 로봇이 움직일 수 있는 범위 안. */
  const K = [[0, 25, -34, 0, 0], [1.2, 21, -25, 0, 0], [2.6, 21, -25, 12, 18], [4.2, 21, -25, -12, -18], [5.8, 21, -25, 10, 12], [7.2, 23, -30, 0, 0], [8.4, 25, -34, 0, 0]];
  const ease = (x) => x * x * (3 - 2 * x);
  const TOUR_LEN = 8.4, TOUR_REST = 1.6;
  const tourAt = (t) => { let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++; const a = K[i], b = K[i + 1], f = ease(clamp((t - a[0]) / (b[0] - a[0]), 0, 1)); return [1, 2, 3, 4].map(c => a[c] + (b[c] - a[c]) * f); };
  const TOUR_EYES = [[0, '뜬 눈'], [1.2, '반짝 눈'], [2.6, '신난 눈'], [5.8, '반짝 눈'], [7.4, '뜬 눈']];
  const TOUR_MSG = [[0, '머리를 살짝 숙여요'], [2.6, '몸을 돌리며 갸웃해요'], [5.8, '눈으로 마음을 전해요']];
  const last = (list, t) => { let r = list[0]; for (const e of list) if (e[0] <= t + 1e-6) r = e; return r; };

  function smoothDamp(cur, target, v, time, dt) { const w = 2 / time, x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x), d = cur - target, tmp = (v.v + w * d) * dt; v.v = (v.v - w * tmp) * e; return target + (d + tmp) * e; }

  /* 카드마다 Cove 한 개 (모델을 복제해서 쓰고, 재질은 함께 써요) */
  const cards = slots.map((slot) => {
    const root3 = gltf.scene.clone(true), scene = new THREE.Scene(); scene.add(root3); scene.environment = envTex;
    scene.add(new THREE.HemisphereLight(0xfff4e8, 0xd8c8c0, 1.5));
    const key = new THREE.DirectionalLight(0xfff1e2, 0.9); key.position.set(-1.2, 2, 1.5); scene.add(key);
    const fill = new THREE.DirectionalLight(0xe4dbf5, 0.55); fill.position.set(2, .6, -1); scene.add(fill);
    const by = {}; root3.traverse(o => { by[o.name] = o; });
    const matrices = [], shells = [];
    root3.traverse(o => {
      if (!o.isMesh) return;
      if (FABRIC.includes(o.name)) o.material = fabricFor(THREE, o.name); else if (PIPING.includes(o.name)) o.material = piping; else if (ALU.includes(o.name)) { o.material = aluminum; layerUV(THREE, o); } else if (RUBBER.includes(o.name)) o.material = rubber;
      if (/KeyStudio-HT16K33-8x8-LED-Matrix/.test(o.name)) { matrices.push(o); o.visible = false; return; }
      if (['새_헤드_상판', '새_쿠션', '새_헤드_하부판'].includes(o.name)) shells.push(o);
    });
    const col = by['기둥'], head = by['머리'], tilt = Object.values(by).find(o => /^머리_갸웃/.test(o.name)), rig = by['COVE_리그'] || root3;
    if (by['새_미끄럼방지_고무링']) scene.attach(by['새_미끄럼방지_고무링']);
    const eyes = EYES.createEyes(THREE, { model: root3, col, head, tilt, shells, matrices });
    const FRONT = eyes.front.clone().setY(0).normalize(), RIGHT = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), FRONT).normalize();
    const AXZ = new THREE.Vector3(0, 0, 1), AXY = new THREE.Vector3(0, 1, 0);
    const rest = new Map([col, head, tilt, rig].map(o => [o, o.quaternion.clone()]));
    const spin = (o, ax, deg) => o.quaternion.copy(rest.get(o)).multiply(new THREE.Quaternion().setFromAxisAngle(ax, deg * D2R));
    const setPose = (p) => { spin(col, AXZ, p[0]); spin(head, AXZ, p[1]); spin(tilt, AXY, p[2]); spin(rig, AXY, p[3]); };
    root3.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root3), center = box.getCenter(new THREE.Vector3()), sphere = box.getBoundingSphere(new THREE.Sphere());
    center.y = box.min.y + (box.max.y - box.min.y) * 0.48;
    let seam = new THREE.Vector3();
    { const m = by['새_헤드_하부판']; if (m) { const bb = new THREE.Box3().setFromObject(m), c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3()); seam = c.clone().addScaledVector(FRONT, Math.min(s.x, s.z) * 0.36); seam.y = bb.min.y + s.y * 0.35; seam.sub(center); } }
    // 그림자
    const c2 = document.createElement('canvas'); c2.width = c2.height = 128; const g2 = c2.getContext('2d'), gr = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(110,80,120,.26)'); gr.addColorStop(1, 'rgba(110,80,120,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(sphere.radius * 1.9, sphere.radius * 1.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c2), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(center.x, box.min.y - 0.001, center.z); scene.add(shadow);

    const cv = document.createElement('canvas'); cv.className = 'slot__scene'; cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', { form: 'Cove의 두 개의 둥근 볼륨', material: 'Cove의 소재가 만나는 이음선', motion: 'Cove가 몸통을 돌리고 갸웃하는 모습' }[slot.dataset.scene]);
    const msg = document.createElement('span'); msg.className = 'slot__msg'; msg.setAttribute('aria-live', 'off');
    slot.append(cv, msg);
    const camera = new THREE.PerspectiveCamera(28, 1.6, 0.01, 10);
    return { slot, kind: slot.dataset.scene, scene, camera, cv, msg, ctx: cv.getContext('2d'), setPose, eyes, FRONT, RIGHT, center, sphere, seam,
      cam: { az: 35, el: 14, zoom: 1, tx: 0, ty: 0, tz: 0 }, cvel: { az: { v: 0 }, el: { v: 0 }, zoom: { v: 0 }, tx: { v: 0 }, ty: { v: 0 }, tz: { v: 0 } },
      t: 0, rest: 0, visible: false, text: '', w: 0, h: 0 };
  });

  const vis = new IntersectionObserver((es) => es.forEach(e => { const c = cards.find(k => k.slot === e.target); if (c) { c.visible = e.isIntersecting; if (e.isIntersecting && !c.started) { c.started = true; c.t = 0; } } }), { threshold: 0.15 });
  cards.forEach(c => vis.observe(c.slot));
  const reduced = false;   // 사용자 요청: PC의 '움직임 줄이기' 설정과 상관없이 모든 효과를 보여준다

  function say(c, text) { if (c.text === text) return; c.text = text; c.msg.textContent = text; }
  function goal(c) {                                                           // 카드마다 보여줄 카메라·자세·눈
    const t = c.t; let g = { az: 35, el: 14, zoom: 1, tx: 0, ty: 0, tz: 0 }, pose = [25, -34, 0, 0], eye = '뜬 눈';
    if (c.kind === 'form') {
      const p = t % 14.5;
      g = p < 4.6 ? { ...g, az: 90, el: 5 } : p < 9.5 ? { ...g, az: 0, el: 5 } : { ...g, az: 35, el: 14 };
      say(c, '두 개의 둥근 볼륨');
    } else if (c.kind === 'material') {
      g = { az: 40 + 16 * Math.sin(t * 0.55), el: 8, zoom: 2.5, tx: c.seam.x, ty: c.seam.y, tz: c.seam.z };
      say(c, '소재가 만나는 이음선');
    } else {
      const cyc = TOUR_LEN + TOUR_REST, p = t % cyc, q = Math.min(p, TOUR_LEN);
      pose = tourAt(q); eye = last(TOUR_EYES, q)[1]; g = { az: 24, el: 10, zoom: 0.9, tx: 0, ty: 0, tz: 0 };
      say(c, last(TOUR_MSG, q)[1]);
    }
    return { g, pose, eye };
  }
  let prev = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    for (const c of cards) {
      if (!c.visible) continue;
      const w = c.slot.clientWidth, h = c.slot.clientHeight; if (!w || !h) continue;
      if (w !== c.w || h !== c.h) { c.w = w; c.h = h; c.cv.width = Math.round(w * renderer.getPixelRatio()); c.cv.height = Math.round(h * renderer.getPixelRatio()); c.camera.aspect = w / h; c.camera.updateProjectionMatrix(); }
      c.t += reduced ? 0 : dt;
      const { g, pose, eye } = goal(c);
      for (const k of ['az', 'el', 'zoom', 'tx', 'ty', 'tz']) c.cam[k] = reduced ? g[k] : smoothDamp(c.cam[k], g[k], c.cvel[k], k === 'zoom' ? 0.5 : 0.34, dt);
      const sway = c.kind === 'motion' ? 0 : 1, tt = c.t;
      c.setPose([pose[0] + sway * (0.45 * Math.sin(2 * Math.PI * tt / 3.7)), pose[1] + sway * (0.7 * Math.sin(2 * Math.PI * tt / 4.3 + 0.6)), pose[2], pose[3]]);
      c.eyes.show(eye, 0, 0, c.t);
      const vf = c.camera.fov * D2R, hf = 2 * Math.atan(Math.tan(vf / 2) * c.camera.aspect);
      const dist = (c.sphere.radius * 0.95) / Math.sin(Math.min(vf * 0.98, hf * 1.0) / 2) / c.cam.zoom;
      const az = c.cam.az * D2R, el = c.cam.el * D2R, dir = c.FRONT.clone().multiplyScalar(Math.cos(az)).addScaledVector(c.RIGHT, Math.sin(az));
      const target = c.center.clone().add(new THREE.Vector3(c.cam.tx, c.cam.ty, c.cam.tz));
      c.camera.position.copy(target).addScaledVector(dir, dist * Math.cos(el)); c.camera.position.y += dist * Math.sin(el); c.camera.lookAt(target);
      renderer.setSize(c.cv.width, c.cv.height, false); renderer.render(c.scene, c.camera);
      c.ctx.clearRect(0, 0, c.cv.width, c.cv.height); c.ctx.drawImage(renderer.domElement, 0, 0);
      if (!c.shown) { c.shown = true; c.slot.classList.add('has-scene'); }
    }
  }
  requestAnimationFrame(frame);
}
