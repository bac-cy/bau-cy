/* 3D프린터 출력 느낌의 은은한 새틴 로즈 그레이 재질 — 목 기둥에 사용.
   Visune "3D Printed Materials Pack (MAT040)"의 Large Format FDM 변위 이미지(적층 결)를
   요철(bump)로 입혀, 한 층씩 쌓아 올린 프린트 결이 은은하게 보인다. (assets/fdm-layers.webp) */
let tex = null;
export function printedMaterial(THREE) {
  if (!tex) {
    tex = new THREE.TextureLoader().load(new URL('../assets/fdm-layers.webp', import.meta.url).href);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
  }
  return new THREE.MeshStandardMaterial({ color: '#a39c93', roughness: 0.92, metalness: 0, envMapIntensity: 0.45, bumpMap: tex, bumpScale: 1.6 });
}
// 모델에 UV가 없어서, 모델 안쪽 높이(y)를 따라 결이 층층이 쌓이도록 UV를 만든다.
export function layerUV(THREE, mesh) {
  const g = mesh.geometry; if (g.attributes.uv) return;
  const p = g.attributes.position, uv = new Float32Array(p.count * 2), S = 1 / 0.006;   // 6mm마다 결 무늬 한 번 반복
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + p.getZ(i)) * S; uv[i * 2 + 1] = p.getY(i) * S; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
