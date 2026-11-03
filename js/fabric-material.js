/* Cove 패브릭 외피 — 멜란지(혼방) 면 원단 느낌: 아주 고운 실이 어긋나게 엮여 짙고 옅은 잔 얼룩·짧은 실 결이 섞인 부드러운 무광 원단.
   (색은 그대로 두고 질감만 사용자가 준 회색 멜란지 원단 사진에 맞춤)
   이전 설명: 면(코튼·린넨) 직조 느낌.
   색은 사용자가 준 MATERIAL 렌더의 원단 색(웜 그레이지 / 크림 두 가지)을 따른다.
   실을 위·아래로 엮은 평직 무늬를 셰이더로 만들어 색 결 · 미세한 요철 · 보풀 느낌을 준다.
   (모델에 UV가 없어서 모델 안쪽 좌표로 3방향에서 입히고, 멀리서는 무늬가 자연스럽게 사라진다) */
const COLORS = {   // 같은 원단, 색만 두 가지
  '새_헤드_상판': '#aaa59c', '새_하부_쉘': '#aaa49b',   // 그레이지(채도를 살짝 뺌)
  '새_쿠션': '#d7d3ca', '새_하부_폼': '#e6e3dc',         // 크림(채도를 살짝 뺌)
};
export const FABRIC_NAMES = Object.keys(COLORS);
const cache = {};
export function fabricFor(THREE, name, freq = 105) {
  const hex = COLORS[name] || '#ddd5c9';
  const ck = hex + '|' + freq; if (cache[ck]) return cache[ck];
  const m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.98, metalness: 0, sheen: 0.7, sheenRoughness: 0.7, sheenColor: new THREE.Color('#fff8ee'), envMapIntensity: 0.45 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uFr = { value: freq };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos; varying vec3 vObjN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position; vObjN = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vObjPos; varying vec3 vObjN; uniform float uFr;
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
// 멜란지: 가로실·세로실이 짧게 짙었다 옅었다 하며(실 결), 낱낱의 섬유 점이 어긋나게 섞임
float mel(vec2 p, float fade){
  vec2 c = floor(p);
  float over = mod(c.x + c.y, 2.0);
  float rowS = nz(vec2(p.x * 0.16, c.y * 7.31 + 3.1));
  float colS = nz(vec2(c.x * 5.17 + 9.7, p.y * 0.16));
  float strand = mix(rowS, colS, over);
  float fine = nz(p * 1.9 + 4.3);
  float fleck = hh(c * 1.37 + 11.0);
  float v = strand * 0.55 + fine * 0.25 + fleck * 0.35;
  return mix(0.5, v, fade);
}
float tri2(vec3 p, vec3 n, float fr, float fade){
  vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x + w.y + w.z);
  return w.x * mel(p.yz * fr * 1.15, fade) + w.y * mel(p.xz * fr * 1.15, fade) + w.z * mel(p.xy * fr * 1.15, fade);
}
float tri(vec3 p, vec3 n, float fr, out float fade){
  vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x + w.y + w.z);
  float px = max(length(fwidth(p * fr)), 1e-5); fade = 1.0 - smoothstep(0.75, 1.6, px);
  return w.x * weave(p.yz * fr, fade) + w.y * weave(p.xz * fr, fade) + w.z * weave(p.xy * fr, fade);
}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
float fdA; float hgt = tri(vObjPos, normalize(vObjN), uFr, fdA);
float ml = tri2(vObjPos, normalize(vObjN), uFr, fdA);
float cloud = nz(vObjPos.xz * 14.0 + 2.0) * 0.5 + nz(vObjPos.xy * 14.0 + 7.0) * 0.5;
float heather = (nz(vObjPos.xz * 70.0 + 5.0) + nz(vObjPos.xy * 70.0 + 1.0) + nz(vObjPos.yz * 70.0 + 9.0)) / 3.0;   // 멀리서도 보이는 고운 멜란지 얼룩
float tone = 0.78 + 0.42 * ml + 0.14 * (cloud - 0.5) + 0.22 * (heather - 0.5);          // 멜란지의 짙고 옅은 잔 얼룩(평균은 원래 색 그대로)
diffuseColor.rgb *= tone * (0.93 + 0.12 * hgt);`);
  };
  m.customProgramCacheKey = () => 'fabric-mel' + freq;
  return cache[ck] = m;
}
