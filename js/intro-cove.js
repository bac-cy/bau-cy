/* ==========================================================
   인트로의 Cove — 마우스를 따라 일어나서 바라봐요
   · 처음에는 조약돌처럼 겹쳐 있고, 마우스를 움직이면 일어나요.
   · 일어난 뒤에는 마우스 쪽으로 몸통을 돌리고 고개를 갸웃하며, 눈 LED도 그쪽을 봐요.
   · 잠시 가만히 있으면 다시 조용히 내려앉아요.
   3D를 불러오지 못하거나 "움직임 줄이기"를 켠 경우에는 기존 렌더 이미지가 그대로 보여요.
   ========================================================== */
const figure = document.querySelector('.intro__render');
const ptr = { x: 0, y: 0, at: -1e9, seen: false };               // 마우스·터치 위치: 3D가 준비되기 전부터 기억해 둔다
{
  const onMove = (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.at = performance.now(); ptr.seen = true; };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onMove, { passive: true });
  document.addEventListener('pointerleave', () => { ptr.at = -1e9; });
}
if (figure && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const start = () => init().catch(err => console.warn('Intro Cove unavailable:', err));
  if (document.readyState === 'complete') setTimeout(start, 300); else window.addEventListener('load', () => setTimeout(start, 300));
}

async function init() {
  const [THREE, { GLTFLoader }, { RoomEnvironment }, { MeshoptDecoder }, EYES] = await Promise.all([
    import('three'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/environments/RoomEnvironment.js'),
    import('three/addons/libs/meshopt_decoder.module.js'), import('./cove-eyes.js'),
  ]);
  const D2R = Math.PI / 180, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const cv = renderer.domElement; cv.className = 'intro__live'; cv.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xfff4e8, 0xd8c8c0, 1.5));
  const key = new THREE.DirectionalLight(0xfff1e2, 0.9); key.position.set(-1.2, 2, 1.5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xe4dbf5, 0.55); fill.position.set(2, .6, -1); scene.add(fill);

  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const model = (await loader.loadAsync('assets/cove-rig.glb')).scene; scene.add(model);

  // 인트로 렌더 이미지와 같은 흰색 무광 재질 + 알루미늄 기둥
  const white = new THREE.MeshStandardMaterial({ color: 0xefe9e1, roughness: 0.55, metalness: 0, envMapIntensity: 1.25 });
  const aluminum = new THREE.MeshStandardMaterial({ color: '#c6c9cc', roughness: 0.32, metalness: 1, envMapIntensity: 1.1 });
  const BODY = ['새_헤드_상판', '새_쿠션', '새_하부_폼', '새_하부_쉘', '새_헤드_하부판', '새_하부_덮개판', '새_미끄럼방지_고무링', '하부_회전판'], ALU = ['기둥_1', '본체6'];
  const by = {}, matrices = [], shells = [];
  model.traverse(o => {
    by[o.name] = o; if (!o.isMesh) return;
    if (BODY.includes(o.name)) o.material = white; else if (ALU.includes(o.name)) o.material = aluminum;
    if (/KeyStudio-HT16K33-8x8-LED-Matrix/.test(o.name)) { matrices.push(o); o.visible = false; }
    if (['새_헤드_상판', '새_쿠션', '새_헤드_하부판'].includes(o.name)) shells.push(o);
  });
  const col = by['기둥'], head = by['머리'], tilt = Object.values(by).find(o => /^머리_갸웃/.test(o.name)), rig = by['COVE_리그'] || model;
  if (by['새_미끄럼방지_고무링']) scene.attach(by['새_미끄럼방지_고무링']);
  const eyes = EYES.createEyes(THREE, { model, col, head, tilt, shells, matrices });
  const AXZ = new THREE.Vector3(0, 0, 1), AXY = new THREE.Vector3(0, 1, 0);
  const rest = new Map([col, head, tilt, rig].map(o => [o, o.quaternion.clone()]));
  const spin = (o, ax, deg) => o.quaternion.copy(rest.get(o)).multiply(new THREE.Quaternion().setFromAxisAngle(ax, deg * D2R));

  // 로봇이 실제로 움직일 수 있는 범위 (시뮬레이터 robotexport.js)
  const TILT_ENV = [[-47.8, 0, 0], [-43.8, 0, 0], [-40.5, 0, 0], [-27.2, -6.5, 7.6], [-25.4, -15.3, 14.9], [-12, -13.9, 6.9], [-7.2, -8, 4.9], [-2.8, -7.1, 9.1], [0, 0, 0]];
  const tiltRange = (h) => { const e = TILT_ENV; if (h <= e[0][0]) return [e[0][1], e[0][2]]; for (let i = 1; i < e.length; i++) if (h <= e[i][0]) { const [h0, a0, b0] = e[i - 1], [h1, a1, b1] = e[i], f = (h - h0) / (h1 - h0); return [a0 + (a1 - a0) * f, b0 + (b1 - b0) * f]; } return [0, 0]; };
  const smoothDamp = (cur, target, v, time, dt) => { const w = 2 / time, x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x), d = cur - target, tmp = (v.v + w * d) * dt; v.v = (v.v - w * tmp) * e; return target + (d + tmp) * e; };

  // 그림자
  const c2 = document.createElement('canvas'); c2.width = c2.height = 128; const g2 = c2.getContext('2d'), gr = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(110,80,120,.30)'); gr.addColorStop(1, 'rgba(110,80,120,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c2), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.0069; scene.add(shadow);

  // 카메라: 인트로 렌더 이미지와 같은 정면 시점. 캔버스는 이미지보다 크게 잡아서 일어나도 잘리지 않게 한다.
  const FRONT = eyes.front.clone().setY(0).normalize(), RIGHT = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), FRONT).normalize();
  const camera = new THREE.PerspectiveCamera(22, 1, 0.01, 10);
  const EL = 7 * D2R, DIST = 0.86, TARGET = new THREE.Vector3(0, 0.122, 0);
  camera.position.copy(TARGET).addScaledVector(FRONT, DIST * Math.cos(EL)); camera.position.y += DIST * Math.sin(EL); camera.lookAt(TARGET);
  const SCALE = 1.45;                                                        // 캔버스 한 변 = 이미지 폭 × SCALE
  const visibleH = 2 * DIST * Math.tan(11 * D2R);                             // 캔버스 세로가 담는 실제 길이(m)
  figure.appendChild(cv);
  function resize() {
    const w = figure.clientWidth; if (!w) return;
    const S = Math.round(w * SCALE), dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr); renderer.setSize(S, S, false);
    cv.style.cssText = `position:absolute;left:50%;width:${S}px;height:${S}px;margin-left:${-S / 2}px;bottom:${-Math.round(S * 0.026 / visibleH * 1) - 0}px;pointer-events:none;`;
  }
  resize(); new ResizeObserver(resize).observe(figure);

  const AWAKE = { neck: 25, head: -34 }, IDLE_MS = 9000;
  const pose = { neck: 0, head: 0, tilt: 0, body: 0 }, vel = { neck: { v: 0 }, head: { v: 0 }, tilt: { v: 0 }, body: { v: 0 } };
  let gaze = { x: 0, y: 0 }, tNow = 0, last = performance.now(), shown = false;
  let autoFrom = 0, autoUntil = -1, autoDone = false;                       // 도착하면 마우스가 없어도 스스로 한 번 일어나 두리번거린다
  const visible = () => { const r = figure.getBoundingClientRect(); return +getComputedStyle(figure).opacity > 0.4 && r.bottom > 0 && r.top < innerHeight; };

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible()) return;
    tNow += dt;
    const op = +getComputedStyle(figure).opacity;
    if (op < 0.3) autoDone = false;                                              // 장면을 벗어났다 돌아오면 다시
    if (!autoDone && op > 0.97) { autoDone = true; autoFrom = tNow + 0.5; autoUntil = tNow + 6.8; }
    const pAwake = ptr.seen && now - ptr.at < IDLE_MS, aAwake = !pAwake && tNow >= autoFrom && tNow < autoUntil;
    const awake = pAwake || aAwake;
    const r = figure.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * 0.5;
    // 마우스가 Cove 기준 어디에 있는지 (-1 ~ 1)
    let dx = clamp((ptr.x - cx) / (innerWidth * 0.26), -1, 1), dy = clamp((ptr.y - cy) / (innerHeight * 0.3), -1, 1);   // Cove 주변 가까운 범위에서 최대로 반응
    if (aAwake) { const u = tNow - autoFrom; dx = 0.8 * Math.sin(u * 1.25); dy = -0.12 + 0.2 * Math.sin(u * 0.8); }   // 좌우로 천천히 둘러봄
    else if (!awake) { dx = 0; dy = 0; }
    gaze.x += (dx - gaze.x) * Math.min(1, dt * 8); gaze.y += (dy - gaze.y) * Math.min(1, dt * 8);
    const goal = { neck: 0, head: 0, tilt: 0, body: 0 };
    if (awake) {
      goal.neck = AWAKE.neck + gaze.y * -3; goal.head = clamp(-29 + gaze.y * 5, -34, -24);   // 갸웃이 크게 되는 높이에서, 커서가 위면 고개를 들고 아래면 숙임
      goal.body = clamp(gaze.x * 70, -75, 75);                                               // 커서 쪽으로 몸통을 크게 돌림
      const [lo, hi] = tiltRange(goal.head); goal.tilt = clamp(gaze.x * 15, lo, hi);         // 가능한 만큼 갸웃
    }
    const T = { neck: awake ? 0.45 : 0.9, head: awake ? 0.4 : 0.9, tilt: 0.3, body: awake ? 0.35 : 0.8 };
    for (const j of ['neck', 'head', 'tilt', 'body']) pose[j] = smoothDamp(pose[j], goal[j], vel[j], T[j], dt);
    const up = clamp((pose.neck - 2) / 10, 0, 1), sway = up * up * (3 - 2 * up);
    spin(col, AXZ, pose.neck + sway * 0.4 * Math.sin(2 * Math.PI * tNow / 3.7));
    spin(head, AXZ, pose.head + sway * 0.6 * Math.sin(2 * Math.PI * tNow / 4.3 + 0.6));
    spin(tilt, AXY, pose.tilt); spin(rig, AXY, pose.body);
    eyes.group.visible = true;
    const near = ptr.seen && now - ptr.at < IDLE_MS + 3000;
    const gx = Math.round(clamp((ptr.x - cx) / (innerWidth * 0.5), -1, 1) * (near ? 2 : 0)), gy = Math.round(gaze.y * 1.4);
    eyes.show(awake && Math.abs(gaze.x) + Math.abs(gaze.y) > 0.9 ? '반짝 눈' : '뜬 눈', awake ? Math.round(clamp(gaze.x * 2.6, -2, 2)) : gx, gy, tNow);
    renderer.render(scene, camera);
    if (!shown) { shown = true; figure.classList.add('is-live'); }
  }
  requestAnimationFrame(frame);
  window.COVE_INTRO = { pose, gaze, ptr };
}
