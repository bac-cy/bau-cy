/* ==========================================================
   Design — Engineering 카드: STEP 모델(COVE FINAL)로 만든 X-ray 분해 뷰
   · 투명한 몸체 위에 안쪽 부품의 윤곽선이 겹쳐 보이는 기술 도면 느낌이에요.
   · 부품(층)을 클릭하면 이름과 역할이 보여요.
   · 마우스 왼쪽 버튼을 누른 채 끌면 정면·측면·위에서 자유롭게 돌려 볼 수 있어요.
   · 카드 위에서 마우스 휠을 굴리면 분해 ↔ 조립이 부드럽게 이어져요. (휠 아래로 = 조립, 위로 = 분해 · 끝까지 가면 페이지가 이어서 스크롤돼요)
   · 휠을 쓰기 전과 모바일에서는 페이지 스크롤에 맞춰 조립돼요.
   모델: assets/eng/cove-eng.glb — 부품 402개를 층 8개로 묶어 가볍게 줄인 것
   ========================================================== */
const root = document.getElementById('engineering');
const INFO = {   // 위 → 아래
  head_top:   { ko: '머리 윗 껍데기', en: 'Head top shell', desc: '3D 프린팅한 머리의 바깥 껍데기. 안쪽의 LED·센서·모터를 감싸고, 패브릭이 그 위를 덮어요.' },
  head_inner: { ko: '머리 모터와 브라켓', en: 'Head motors & brackets', desc: '고개를 들고 숙이고, 갸웃하게 하는 다이나믹셀 모터 2개와 이를 붙잡는 브라켓이에요.' },
  head_low:   { ko: '머리 프레임과 아래 판', en: 'Head frame & lower plate', desc: '머리 안쪽의 뼈대예요. LED, 센서, 모터가 이 프레임에 고정되고, 아래 판은 우레탄 폼으로 마감해요.' },
  body_top:   { ko: '몸통 윗 폼', en: 'Body top foam', desc: '기대는 손과 팔에 안전하고 부드러운 압력을 전하는 우레탄 폼 층이에요. 기둥이 드나드는 홈이 있어요.' },
  board:      { ko: '제어 보드층', en: 'Control boards', desc: '전원, 통신, 제어 보드와 커넥터가 모여 있는 층이에요.' },
  ring:       { ko: '자석 링과 브라켓', en: 'Magnet ring & bracket', desc: '몸통 폼을 쉽게 떼고 붙일 수 있도록 자석을 붙잡아 주는 링과 브라켓이에요.' },
  body_frame: { ko: '몸통 프레임과 목 모터', en: 'Body frame & neck motor', desc: '몸통 안쪽의 뼈대와, 기둥을 일으키는 목 모터가 들어 있어요.' },
  base:       { ko: '회전 바닥판', en: 'Rotating base', desc: '몸통을 좌우로 돌리는 회전 바닥판과 베어링, 받침이에요.' },
};
const LAYERS = ['head_top', 'head_inner', 'head_low', 'body_top', 'board', 'ring', 'body_frame', 'base'];   // 위 → 아래
const SHELL = new Set(['head_top', 'head_low', 'body_top']);                                              // 겉 껍데기 층: 은은한 샌드 빛을 입힘
if (root) {
  const cv = root.querySelector('canvas'), tip = root.querySelector('.eng__tip'), hint = root.querySelector('.eng__hint');
  const reduced = false, touch = window.matchMedia('(hover: none)').matches;
  if (hint) hint.textContent = touch ? '부품을 눌러 보세요 · 끌어서 돌려 보세요' : '부품을 눌러 보세요 · 끌어서 돌려 보세요 · 스크롤이나 아래 바로 합치기·펼치기';
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

    // X-ray 재질: 층마다 은은한 파스텔 빛(진주·복숭아·라일락·실버블루)을 입히고, 윤곽선은 따뜻한 먹색 가는 선.
    const TINT = { head_top: ['#e9e4df', '#d9d3cd'], head_inner: ['#e4e2e8', '#d0cdd8'], head_low: ['#ebe6e0', '#dcd5ce'], body_top: ['#e9e4df', '#d9d3cd'],
      board: ['#e2e5ea', '#cfd4dc'], ring: ['#e9e6e1', '#d9d4cc'], body_frame: ['#e4e2e8', '#d0cdd8'], base: ['#e6e2db', '#d4cec4'] };
    const mk = (k) => {
      const [c2, c1] = TINT[k] || TINT.base, shell = SHELL.has(k);
      return new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { c1: { value: new THREE.Color(c1) }, c2: { value: new THREE.Color(c2) }, a0: { value: shell ? 0.12 : 0.18 }, a1: { value: shell ? 0.55 : 0.5 }, hi: { value: 0 } },
        vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform vec3 c1; uniform vec3 c2; uniform float a0; uniform float a1; uniform float hi; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1. - abs(dot(normalize(vN), normalize(vV))), 1.5); vec3 col = mix(c2, c1, smoothstep(0., 1., f)); col = mix(col, vec3(1.), hi * .35); gl_FragColor = vec4(col, a0 + a1 * f + hi * .28); }',
      });
    };
    const lineBase = new THREE.LineBasicMaterial({ color: 0x3a3340, transparent: true, opacity: 0.38, depthWrite: false });
    const lineHi = new THREE.LineBasicMaterial({ color: 0x6b55b0, transparent: true, opacity: 0.85, depthWrite: false });
    const layers = {}, meshes = [], fills = {};
    model.traverse(o => { if (o.isMesh) meshes.push(o); });
    for (const o of meshes) {
      const name = o.name.split('__')[0]; o.userData.y0 = o.position.y; o.userData.layer = name;
      if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
      o.material = fills[name] ||= mk(name); o.renderOrder = 1;
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 28), lineBase);
      lines.renderOrder = 2; lines.userData.isLine = true; o.add(lines); o.userData.lines = lines;
      (layers[name] ||= []).push(o);
    }
    const order = LAYERS.filter(k => layers[k]);
    const rank = (k) => order.length - 1 - order.indexOf(k);
    const GAP = 0.085;
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3());
    const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 10);

    let w = 0, h = 0, e = 1, eGoal = 1, yaw = -0.55, tiltEl = 0.2, baseYaw = -0.55, baseEl = 0.2, drag = null, dirty = true, visible = false, usingWheel = false, wheelE = 1, mx = 0.5, my = 0.5;
    function fit() {
      w = cv.clientWidth; h = cv.clientHeight; if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
    }
    new ResizeObserver(fit).observe(cv); fit();
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; dirty = true; }).observe(root);

    // 스크롤로 조립: 카드는 화면에 고정돼 있고, 오른쪽 내용을 따라 스크롤하는 동안 분해 → 조립이 이어짐 (그룹을 지나가는 진행도 사용)
    const grid = document.querySelector('.engspec__grid') || root;
    function scrollGoal() { const g = grid.getBoundingClientRect(), vh = window.innerHeight; const p = clamp((vh * 0.15 - g.top) / Math.max(1, g.height - vh * 0.8), 0, 1);  return 1 - smooth(clamp(p / 0.92, 0, 1)); }
    root.addEventListener('pointermove', (ev) => {
      if (!drag && e < 0.4) { root.style.cursor = hitLayer(ev) ? 'pointer' : 'grab'; }
      if (drag) { baseYaw = drag.yaw + (ev.clientX - drag.x) * 0.009; baseEl = clamp(drag.el + (ev.clientY - drag.y) * 0.006, -0.25, 1.35); dirty = true; return; }   // 끄는 동안: 돌려 보기
    });
    root.addEventListener('pointerdown', (ev) => { if (ev.button > 0) return; drag = { x: ev.clientX, y: ev.clientY, yaw: baseYaw, el: baseEl }; root.classList.add('is-grab'); try { root.setPointerCapture(ev.pointerId); } catch {} });
    const endDrag = (ev) => { const d = drag, click = d && Math.hypot(ev.clientX - d.x, ev.clientY - d.y) < 5; drag = null; root.classList.remove('is-grab'); if (click && ev.type === 'pointerup') { const k = hitLayer(ev); if (k) select(k, ev); else if (sel) select(sel, ev); } };
    root.addEventListener('pointerup', endDrag); root.addEventListener('pointercancel', endDrag);
    root.style.touchAction = 'pan-y'; root.style.cursor = 'grab';

    // 부품(층)을 클릭하면 이름과 역할을 보여 준다
    let sel = null; const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function hitLayer(ev) { const r = cv.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const i = ray.intersectObjects(meshes, false)[0]; return i ? i.object.userData.layer : null; }
    function select(k, ev) {
      sel = k === sel ? null : k; dirty = true;
      for (const n in fills) fills[n].uniforms.hi.value = n === sel ? 1 : 0;
      for (const m of meshes) m.userData.lines.material = m.userData.layer === sel ? lineHi : lineBase;
      if (!sel) { tip.classList.remove('is-on'); return; }
      const L = INFO[sel]; tip.innerHTML = '<b></b><i></i><span></span>'; tip.children[0].textContent = L.ko; tip.children[1].textContent = L.en; tip.children[2].textContent = L.desc;
      const rr = root.getBoundingClientRect(); tip.classList.add('is-on'); const tw = tip.offsetWidth, th = tip.offsetHeight;
      tip.style.left = clamp(ev.clientX - rr.left + 18, 8, rr.width - tw - 8) + 'px'; tip.style.top = clamp(ev.clientY - rr.top - th / 2, 8, rr.height - th - 8) + 'px';
    }
    function place(v) { for (const k of order) for (const m of layers[k]) m.position.y = m.userData.y0 + v * rank(k) * GAP; }
    function camPlace(v) {
      const ext = GAP * (order.length - 1) * v, hgt = size.y + ext;
      const r = Math.hypot(size.x, hgt, size.z) / 2;
      const fov = camera.fov * Math.PI / 180, d = r / Math.sin(Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * camera.aspect)) / 2) * 0.82;
      const cy = box.min.y + hgt / 2, az = yaw, el = tiltEl;
      camera.position.set(d * Math.sin(az) * Math.cos(el), cy + d * Math.sin(el), d * Math.cos(az) * Math.cos(el)); camera.lookAt(0, cy, 0);
    }

    // 아래 슬라이더: 좌우로 밀어서 부품을 합치거나 펼침 (왼쪽 = 합치기, 오른쪽 = 펼치기). 스크롤·휠로 움직일 때는 슬라이더도 따라감
    const slider = document.querySelector('.eng__slider input'); let sliding = false, slideY = 0;
    if (slider) {
      const set = () => { usingWheel = true; wheelE = clamp(+slider.value / 100, 0, 1); slideY = window.scrollY; dirty = true; };
      slider.addEventListener('input', set);
      slider.addEventListener('pointerdown', () => { sliding = true; set(); }); addEventListener('pointerup', () => { sliding = false; });
      slider.addEventListener('keydown', () => { sliding = true; setTimeout(() => { sliding = false; }, 400); });
    }
    let last = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!visible) return;
      if (usingWheel && !sliding && Math.abs(window.scrollY - slideY) > 60) usingWheel = false;     // 슬라이더로 맞춘 뒤 스크롤을 움직이면 다시 스크롤 연동
      eGoal = reduced ? 0 : usingWheel ? wheelE : scrollGoal();
      /* 스크롤로 분해↔조립할 때는 훨씬 천천히, 일정한 속도(전체 약 4초)로 부드럽게 따라감. 슬라이더를 직접 끌 때는 빠르게 */
      const k = usingWheel ? 6 : 1.6, cap = usingWheel ? 2 : 0.26;
      const step = Math.max(-cap * dt, Math.min(cap * dt, (eGoal - e) * Math.min(1, dt * k)));
      const ne = e + step;
      if (Math.abs(ne - e) > 0.0004) { e = ne; dirty = true; }
      if (slider && !sliding) { const sv = Math.round((usingWheel ? wheelE : e) * 100); if (+slider.value !== sv) slider.value = sv; slider.style.setProperty('--p', sv + '%'); }
      const yawGoal = baseYaw, elGoal = baseEl;
      const ny = yaw + (yawGoal - yaw) * Math.min(1, dt * 4), nel = tiltEl + (elGoal - tiltEl) * Math.min(1, dt * 4);
      if (Math.abs(ny - yaw) > 0.0004 || Math.abs(nel - tiltEl) > 0.0004) { yaw = ny; tiltEl = nel; dirty = true; }
      if (dirty) { dirty = false; place(e); camPlace(e); renderer.render(scene, camera); }
    })(performance.now());
  }
}
