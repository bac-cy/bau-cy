/* ==========================================================
   Design — Engineering 카드: STEP 모델(COVE FINAL)로 만든 실시간 분해 뷰
   · 카드가 화면에 올라오면 Cove가 층층이 펼쳐져요. (스크롤에 맞춰 열고 닫혀요)
   · 층에 마우스를 올리면(모바일은 누르면) 그 층이 강조되고 이름과 역할이 보여요.
   · 좌우로 끌면 돌려 볼 수 있어요.
   모델: assets/eng/cove-eng.glb — 부품 402개를 층 8개로 묶어 가볍게 줄인 것
   ========================================================== */
const root = document.getElementById('engineering');
const LAYERS = {   // 위 → 아래
  head_top:   { ko: '머리 윗 껍데기', en: 'Head top shell', desc: '3D 프린팅한 머리의 바깥 껍데기. 안쪽의 LED·센서·모터를 감싸고, 패브릭이 그 위를 덮어요.' },
  head_inner: { ko: '머리 모터와 브라켓', en: 'Head motors & brackets', desc: '고개를 들고 숙이고, 갸웃하게 하는 다이나믹셀 모터 2개와 이를 붙잡는 브라켓이에요.' },
  head_low:   { ko: '머리 프레임과 아래 판', en: 'Head frame & lower plate', desc: '머리 안쪽의 뼈대예요. LED, 센서, 모터가 이 프레임에 고정되고, 아래 판은 우레탄 폼으로 마감해요.' },
  body_top:   { ko: '몸통 윗 폼', en: 'Body top foam', desc: '기대는 손과 팔에 안전하고 부드러운 압력을 전하는 우레탄 폼 층이에요. 기둥이 드나드는 홈이 있어요.' },
  board:      { ko: '제어 보드층', en: 'Control boards', desc: '전원, 통신, 제어 보드와 커넥터가 모여 있는 층이에요.' },
  ring:       { ko: '자석 링과 브라켓', en: 'Magnet ring & bracket', desc: '몸통 폼을 쉽게 떼고 붙일 수 있도록 자석을 붙잡아 주는 링과 브라켓이에요.' },
  body_frame: { ko: '몸통 프레임과 목 모터', en: 'Body frame & neck motor', desc: '몸통 안쪽의 뼈대와, 기둥을 일으키는 목 모터가 들어 있어요.' },
  base:       { ko: '회전 바닥판', en: 'Rotating base', desc: '몸통을 좌우로 돌리는 회전 바닥판과 베어링, 받침이에요.' },
};
if (root) {
  const cv = root.querySelector('canvas'), tip = root.querySelector('.eng__tip'), hint = root.querySelector('.eng__hint');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches, touch = window.matchMedia('(hover: none)').matches;
  if (touch && hint) hint.textContent = '펼쳐진 층을 눌러 보세요';
  let started = false;
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; init().catch(err => console.warn('Engineering view unavailable:', err)); } }, { rootMargin: '900px 0px' }).observe(root);

  async function init() {
    const [THREE, { GLTFLoader }, { MeshoptDecoder }, { RoomEnvironment }] = await Promise.all([
      import('three'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/libs/meshopt_decoder.module.js'), import('three/addons/environments/RoomEnvironment.js'),
    ]);
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), smooth = (t) => t * t * (3 - 2 * t);
    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene(); scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xfff4e8, 0xd8c8c0, 1.1)); const key = new THREE.DirectionalLight(0xfff1e2, 1.0); key.position.set(-1, 2, 1.5); scene.add(key);
    const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
    const model = (await loader.loadAsync('assets/eng/cove-eng.glb')).scene; scene.add(model);

    // 층(노드 이름 앞부분)별로 묶기
    const layers = {}; const pick = [];
    model.traverse(o => {
      if (!o.isMesh) return;
      const name = o.name.split('__')[0]; o.userData.layer = name; if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
      o.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.08, envMapIntensity: 0.9, emissive: 0x7d6aa8, emissiveIntensity: 0, side: THREE.DoubleSide });
      o.userData.y0 = o.position.y; (layers[name] ||= []).push(o); pick.push(o);
    });
    const order = Object.keys(LAYERS).filter(k => layers[k]);                 // 위 → 아래
    const rank = (k) => order.length - 1 - order.indexOf(k);                   // 아래에서부터 0,1,2…
    const GAP = 0.085;                                                         // 층 사이를 벌리는 간격(m)
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3());
    const center = new THREE.Vector3(0, (size.y + GAP * (order.length - 1)) / 2, 0);
    const radius = Math.hypot(size.x, size.y + GAP * (order.length - 1), size.z) / 2;
    const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 10);

    let w = 0, h = 0, openT = 0, yaw = -0.5, yawGoal = -0.5, drag = null, hover = null, dirty = true, visible = false;
    function fit() {
      w = cv.clientWidth; h = cv.clientHeight; if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
    }
    new ResizeObserver(fit).observe(cv); fit();
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; dirty = true; }).observe(root);

    function progress() { const r = root.getBoundingClientRect(), vh = window.innerHeight, c = r.top + r.height / 2; return 1 - clamp((vh * 1.0 - c) / (vh * 0.55), 0, 1); }   // 1=펼침(카드가 화면 아래에서 막 올라옴) → 0=조립(화면 가운데 도착)
    function place(e) {                                                        // e: 0(조립) ~ 1(펼침)
      for (const k of order) for (const m of layers[k]) m.position.y = m.userData.y0 + e * rank(k) * GAP;
    }
    function camPlace() {                                                      // 펼침 정도에 따라 중심과 거리를 함께 맞춰 항상 화면에 꽉 차게
      const ext = GAP * (order.length - 1) * openT, hgt = size.y + ext;
      const r = Math.hypot(size.x, hgt, size.z) / 2;
      const fov = camera.fov * Math.PI / 180, d = r / Math.sin(Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * camera.aspect)) / 2) * 0.82;
      const cy = box.min.y + hgt / 2, el = 0.2, az = yaw;
      camera.position.set(d * Math.sin(az) * Math.cos(el), cy + d * Math.sin(el), d * Math.cos(az) * Math.cos(el)); camera.lookAt(0, cy, 0);
    }
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function hit(ev) { const r = cv.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const i = ray.intersectObjects(pick, false)[0]; return i ? i.object.userData.layer : null; }
    function setHover(k, ev) {
      if (k !== hover) { hover = k; dirty = true; }
      if (!k) { tip.classList.remove('is-on'); return; }
      const L = LAYERS[k]; tip.innerHTML = '<b></b><i></i><span></span>'; tip.children[0].textContent = L.ko; tip.children[1].textContent = L.en; tip.children[2].textContent = L.desc;
      const rr = root.getBoundingClientRect(); tip.classList.add('is-on');
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      tip.style.left = clamp(ev.clientX - rr.left + 16, 8, rr.width - tw - 8) + 'px'; tip.style.top = clamp(ev.clientY - rr.top - th / 2, 8, rr.height - th - 8) + 'px';
    }
    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, yaw: yawGoal, moved: false }; try { cv.setPointerCapture(e.pointerId); } catch {} });
    cv.addEventListener('pointermove', (e) => { if (drag) { const dx = e.clientX - drag.x; if (Math.abs(dx) > 4) drag.moved = true; if (drag.moved) yawGoal = drag.yaw + dx * 0.008; } });
    cv.addEventListener('pointerup', () => { drag = null; });
    cv.style.touchAction = 'pan-y';

    let last = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!visible) return;
      const goal = reduced ? 0 : smooth(progress());
      const nt = openT + (goal - openT) * Math.min(1, dt * 10); if (Math.abs(nt - openT) > 0.0005) { openT = nt; dirty = true; }
      const ny = yaw + (yawGoal - yaw) * Math.min(1, dt * 8); if (Math.abs(ny - yaw) > 0.0005) { yaw = ny; dirty = true; }
      if (dirty) {
        dirty = false; place(openT); camPlace();
        for (const k of order) for (const m of layers[k]) m.material.emissiveIntensity = k === hover ? 0.32 : 0;
        renderer.render(scene, camera);
      }
    })(performance.now());
  }
}
