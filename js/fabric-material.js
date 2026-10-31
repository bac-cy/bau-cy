/* Cove 패브릭 외피 — 면(코튼·린넨) 직조 느낌.
   색은 사용자가 준 MATERIAL 렌더의 원단 색(웜 그레이지 / 크림 두 가지)을 따른다.
   실을 위·아래로 엮은 평직 무늬를 셰이더로 만들어 색 결 · 미세한 요철 · 보풀 느낌을 준다.
   (모델에 UV가 없어서 모델 안쪽 좌표로 3방향에서 입히고, 멀리서는 무늬가 자연스럽게 사라진다) */
const COLORS = {   // 같은 원단, 색만 두 가지
  '새_헤드_상판': '#c6beb3', '새_하부_쉘': '#c1b8ad',   // 그레이지
  '새_쿠션': '#e3dcd2', '새_하부_폼': '#e6e0d7',         // 크림
};
export const FABRIC_NAMES = Object.keys(COLORS);
const cache = {};
export function fabricFor(THREE, name) {
  const hex = COLORS[name] || '#ddd5c9';
  if (cache[hex]) return cache[hex];
  const m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.96, metalness: 0, sheen: 1.0, sheenRoughness: 0.55, sheenColor: new THREE.Color('#fff8ee'), envMapIntensity: 0.45 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos; varying vec3 vObjN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position; vObjN = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vObjPos; varying vec3 vObjN;
float hh(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float nz(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hh(i), hh(i + vec2(1,0)), f.x), mix(hh(i + vec2(0,1)), hh(i + vec2(1,1)), f.x), f.y); }
// 평직: 가로실과 세로실이 번갈아 위·아래로 지나감. 실마다 굵기가 조금씩 달라 린넨 같은 불규칙함이 생김
float weave(vec2 p, float fade){
  vec2 c = floor(p), f = fract(p);
  float over = mod(c.x + c.y, 2.0);
  float warp = sin(f.x * 3.14159), weft = sin(f.y * 3.14159);
  float h = mix(warp, weft, over);
  float slub = nz(p * vec2(0.25, 0.9)) * .5 + nz(p * vec2(0.9, 0.25)) * .5;
  h = (h * 0.5 + 0.5) * (0.8 + 0.4 * slub);
  return mix(0.65, h, fade);
}
float tri(vec3 p, vec3 n, float fr, out float fade){
  vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x + w.y + w.z);
  float px = max(length(fwidth(p * fr)), 1e-5); fade = 1.0 - smoothstep(0.75, 1.6, px);
  return w.x * weave(p.yz * fr, fade) + w.y * weave(p.xz * fr, fade) + w.z * weave(p.xy * fr, fade);
}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
float fdA; float hgt = tri(vObjPos, normalize(vObjN), 105.0, fdA);
diffuseColor.rgb *= 0.84 + 0.22 * hgt;`);
  };
  return cache[hex] = m;
}
