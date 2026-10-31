/* ==========================================================
   Cove 3D viewer — Design 섹션 "Render — 3/4 View"
   마우스/터치로 좌우로 돌려볼 수 있습니다. (확대·이동은 막아 두어 스크롤을 방해하지 않음)
   3D를 불러오지 못하면 기존 임시 이미지가 그대로 남습니다.
   ========================================================== */
/* 3D 라이브러리와 모델은 Design 섹션이 가까워졌을 때에만 불러옵니다.
   (페이지를 열자마자 불러오면 인트로 스크롤이 버벅일 수 있음) */
const host = document.querySelector('.cove-3d');
if (host) {
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    init(host).catch(err => console.warn('Cove 3D viewer unavailable:', err));
  }, { rootMargin: '900px 0px' });
  io.observe(host);
}

async function init(host) {
  const [THREE, { GLTFLoader }, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
    import('three'),
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/controls/OrbitControls.js'),
    import('three/addons/environments/RoomEnvironment.js'),
  ]);
  const figure = host.closest('figure');
  const startAz = +(host.dataset.az ?? 35);   // 시작 가로 각도(도)
  const startEl = +(host.dataset.el ?? 14);   // 시작 높이 각도(도)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xfff4e8, 0xd8c8c0, 1.5));   // 부드러운 전체 조명
  const key = new THREE.DirectionalLight(0xfff1e2, 0.9);
  key.position.set(-1.2, 2, 1.5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe4dbf5, 0.55);
  fill.position.set(2, .6, -1);
  scene.add(fill);

  const gltf = await new GLTFLoader().loadAsync(host.dataset.model);
  const model = gltf.scene;
  const material = new THREE.MeshStandardMaterial({
    color: 0xefe9e1, roughness: 0.55, metalness: 0, envMapIntensity: 1.25,
  });
  model.traverse(o => { if (o.isMesh) o.material = material; });
  scene.add(model);

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());

  // soft contact shadow under the model
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d').createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(110,80,120,.26)'); g.addColorStop(1, 'rgba(70,50,90,0)');
  const cx = c.getContext('2d'); cx.fillStyle = g; cx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(sphere.radius * 1.8, sphere.radius * 1.8),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(center.x, box.min.y - 0.001, center.z);
  scene.add(shadow);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(center);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.8;
  controls.minPolarAngle = THREE.MathUtils.degToRad(40);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(92);
  renderer.domElement.style.touchAction = 'pan-y';   // 세로 스크롤은 페이지가 그대로 처리

  function place() {
    const a = THREE.MathUtils.degToRad(startAz), e = THREE.MathUtils.degToRad(startEl);
    const d = fitDistance();
    camera.position.set(
      center.x + d * Math.sin(a) * Math.cos(e),
      center.y + d * Math.sin(e),
      center.z + d * Math.cos(a) * Math.cos(e));
    controls.update();
  }
  function fitDistance() {
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    return (sphere.radius * 0.9) / Math.sin(Math.min(vfov, hfov) / 2);
  }
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    renderer.domElement.style.cssText += ';width:100%;height:100%;display:block;cursor:grab';
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, fitDistance());
    controls.update(); dirty = true;
  }

  let dirty = true, visible = false;
  controls.addEventListener('change', () => { dirty = true; });
  renderer.domElement.addEventListener('pointerdown', () => { renderer.domElement.style.cursor = 'grabbing'; });
  window.addEventListener('pointerup', () => { renderer.domElement.style.cursor = 'grab'; });

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) dirty = true; }).observe(host);

  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    controls.update();
    if (dirty) { renderer.render(scene, camera); dirty = false; }
  })();

  resize(); place(); resize();
  figure.classList.add('has-3d');   // 3D가 준비되면 임시 이미지를 숨김
}
