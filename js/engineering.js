/* ==========================================================
   Design — Engineering 카드: STEP 모델(COVE FINAL)로 만든 X-ray 분해 뷰
   · 투명한 몸체 위에 안쪽 부품의 윤곽선이 겹쳐 보이는 기술 도면 느낌이에요.
   · 카드 위에서 마우스를 좌우로 움직이면 분해 ↔ 조립이 부드럽게 이어져요.
     (왼쪽 = 분해, 오른쪽 = 조립. 모바일은 카드 위를 좌우로 쓸어 보세요.)
   · 마우스를 올리기 전에는 스크롤에 맞춰 조립돼요.
   모델: assets/eng/cove-eng.glb — 부품 402개를 층 8개로 묶어 가볍게 줄인 것
   ========================================================== */
const root = document.getElementById('engineering');
const LAYERS = ['head_top', 'head_inner', 'head_low', 'body_top', 'board', 'ring', 'body_frame', 'base'];   // 위 → 아래
const SHELL = new Set(['head_top', 'head_low', 'body_top']);                                              // 겉 껍데기 층: 은은한 라벤더 빛을 입힘
if (root) {
  const cv = root.querySelector('canvas'), hint = root.querySelector('.eng__hint');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches, touch = window.matchMedia('(hover: none)').matches;
  if (hint) hint.textContent = touch ? '카드를 좌우로 쓸어 보세요 · 왼쪽 분해 → 오른쪽 조립' : '마우스를 좌우로 움직여 보세요 · 왼쪽 분해 → 오른쪽 조립';
  let started = false;
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; init().catch(err => console.warn('Engineering view unavailable:', err)); } }, { rootMargin: '900px 0px' }).observe(root);

  async function init() {
    const [THREE, { GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
      import('three'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/libs/meshopt_decoder.module.js'),
    ]);
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), smooth = (t) => t * t * (3 - 2 * t);
    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    const scene = new THREE.Scene();
    const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
    const model = (await loader.loadAsync('assets/eng/cove-eng.glb')).scene; scene.add(model);

    // X-ray 재질: 몸체는 거의 투명, 가장자리(윤곽선)는 가는 먹색 선. 겉 껍데기는 테두리에 라벤더 빛이 번짐.
    const fillPlain = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
    const fillShell = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { c1: { value: new THREE.Color('#b8a6e0') }, c2: { value: new THREE.Color('#f6c9a8') } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 c1; uniform vec3 c2; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1. - abs(dot(normalize(vN), normalize(vV))), 1.6); vec3 col = mix(c2, c1, smoothstep(0., 1., f)); gl_FragColor = vec4(col, 0.10 + 0.62 * f); }',
    });
    const lineMat = new THREE.LineBasicMaterial({ color: 0x2b2731, transparent: true, opacity: 0.5, depthWrite: false });
    const lineShell = new THREE.LineBasicMaterial({ color: 0x4b3f78, transparent: true, opacity: 0.42, depthWrite: false });
    const layers = {}, meshes = [];
    model.traverse(o => { if (o.isMesh) meshes.push(o); });
    for (const o of meshes) {
      const name = o.name.split('__')[0]; o.userData.y0 = o.position.y;
      if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
      const shell = SHELL.has(name);
      o.material = shell ? fillShell : fillPlain; o.renderOrder = 1;
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 28), shell ? lineShell : lineMat);
      lines.renderOrder = 2; o.add(lines);
      (layers[name] ||= []).push(o);
    }
    const order = LAYERS.filter(k => layers[k]);
    const rank = (k) => order.length - 1 - order.indexOf(k);
    const GAP = 0.085;
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3());
    const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 10);

    let w = 0, h = 0, e = 1, eGoal = 1, yaw = -0.55, tiltEl = 0.2, dirty = true, visible = false, usingMouse = false, mx = 0.5, my = 0.5;
    function fit() {
      w = cv.clientWidth; h = cv.clientHeight; if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
    }
    new ResizeObserver(fit).observe(cv); fit();
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; dirty = true; }).observe(root);

    // 마우스를 올리기 전: 카드가 화면 아래에서 올라올 때 분해 → 가운데에 오면 조립
    function scrollGoal() { const r = root.getBoundingClientRect(), vh = window.innerHeight, c = r.top + r.height / 2; return 1 - clamp((vh * 1.0 - c) / (vh * 0.55), 0, 1); }
    // 카드 위 좌우 위치: 왼쪽 = 분해(1), 오른쪽 = 조립(0)
    const onMove = (ev) => {
      const r = root.getBoundingClientRect(); mx = clamp((ev.clientX - r.left) / r.width, 0, 1); my = clamp((ev.clientY - r.top) / r.height, 0, 1);
      usingMouse = true; dirty = true;
    };
    root.addEventListener('pointermove', onMove); root.addEventListener('pointerdown', onMove);
    root.style.touchAction = 'pan-y';

    function place(v) { for (const k of order) for (const m of layers[k]) m.position.y = m.userData.y0 + v * rank(k) * GAP; }
    function camPlace(v) {
      const ext = GAP * (order.length - 1) * v, hgt = size.y + ext;
      const r = Math.hypot(size.x, hgt, size.z) / 2;
      const fov = camera.fov * Math.PI / 180, d = r / Math.sin(Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * camera.aspect)) / 2) * 0.82;
      const cy = box.min.y + hgt / 2, az = yaw, el = tiltEl;
      camera.position.set(d * Math.sin(az) * Math.cos(el), cy + d * Math.sin(el), d * Math.cos(az) * Math.cos(el)); camera.lookAt(0, cy, 0);
    }

    let last = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!visible) return;
      eGoal = reduced ? 0 : usingMouse ? smooth(1 - mx) : smooth(scrollGoal());
      const ne = e + (eGoal - e) * Math.min(1, dt * 5);                       // 천천히 흐르듯 따라감
      if (Math.abs(ne - e) > 0.0004) { e = ne; dirty = true; }
      const yawGoal = -0.55 + (mx - 0.5) * 0.5, elGoal = 0.2 + (0.5 - my) * 0.25;   // 마우스에 따라 살짝 돌아보는 시차
      const ny = yaw + (yawGoal - yaw) * Math.min(1, dt * 4), nel = tiltEl + (elGoal - tiltEl) * Math.min(1, dt * 4);
      if (Math.abs(ny - yaw) > 0.0004 || Math.abs(nel - tiltEl) > 0.0004) { yaw = ny; tiltEl = nel; dirty = true; }
      if (dirty) { dirty = false; place(e); camPlace(e); renderer.render(scene, camera); }
    })(performance.now());
  }
}
