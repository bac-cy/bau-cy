/* 배경 통일(기본 C안 · 애플풍; 주소 끝에 ?bg=a / ?bg=b 를 붙이면 다른 안): 라일락·복숭아 빛이 섹션마다 아주 천천히 색을 바꾸며 이어짐 (?bg=a 은은하게 / ?bg=b 또렷하게) */
(() => {
  const mode = /[?&]bg=a/.test(location.search) ? 'a' : /[?&]bg=b/.test(location.search) ? 'b' : 'c', K = mode === 'a' ? 0.55 : mode === 'c' ? 0.62 : 1;       // 색 진하기
  document.documentElement.classList.add('bgfx-on'); document.body.classList.add('bg-' + mode); document.documentElement.classList.add('bg-' + mode);
  const bg = document.createElement('div'); bg.className = 'bgfx'; bg.innerHTML = '<i></i><i></i><i></i>'; document.body.prepend(bg);
  const P = {   // [빛1(왼쪽 위), 빛2(오른쪽 아래), 빛3(가운데)] 각각 [r,g,b,a]
    about:    [[200, 182, 245, .62], [255, 206, 178, .45], [235, 225, 252, .35]],
    features: [[255, 205, 175, .55], [205, 188, 245, .5], [255, 232, 214, .4]],
    design:   [[232, 214, 196, .55], [214, 200, 245, .4], [255, 240, 226, .4]],
    gallery:  [[226, 220, 240, .5], [255, 214, 190, .38], [245, 238, 250, .35]],
    footer:   [[198, 180, 244, .6], [255, 204, 178, .5], [236, 226, 250, .35]],
  };
  if (mode === 'c') Object.assign(P, {   // 애플풍: 채도를 낮춘 진주빛(은은한 라벤더·핑크·스카이)
    about:    [[214, 218, 246, .7], [246, 222, 226, .55], [232, 236, 250, .5]],
    features: [[246, 224, 224, .6], [210, 220, 246, .55], [240, 236, 248, .5]],
    design:   [[226, 226, 238, .6], [236, 224, 232, .5], [244, 244, 250, .5]],
    gallery:  [[228, 230, 242, .55], [244, 230, 232, .45], [244, 244, 250, .4]],
    footer:   [[212, 216, 246, .65], [246, 220, 226, .55], [234, 236, 250, .45]],
  });
  const ids = ['about', 'features', 'design', 'gallery'], els = ids.map(i => document.getElementById(i)), foot = document.querySelector('.footer');
  const mix = (a, b, t) => a.map((v, k) => v + (b[k] - v) * t);
  const rgba = (c) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${(c[3] * K).toFixed(3)})`;
  const smooth = (t) => t * t * (3 - 2 * t);
  let cur = null;
  function update(now) {
    requestAnimationFrame(update);
    const mid = innerHeight * 0.6; let a = 'about', b = 'about', t = 0;
    const list = [...els.map((e, i) => [ids[i], e]), ['footer', foot]];
    for (let i = 0; i < list.length; i++) {
      const top = list[i][1] ? list[i][1].getBoundingClientRect().top : 1e9;
      if (top <= mid) { a = list[i][0]; b = list[i + 1] ? list[i + 1][0] : a; const nt = list[i + 1] && list[i + 1][1] ? list[i + 1][1].getBoundingClientRect().top : 1e9; t = list[i + 1] ? smooth(Math.min(1, Math.max(0, (mid - top) / Math.max(1, (mid - top) + (nt - mid))))) : 0; }
    }
    const c = [0, 1, 2].map(k => mix(P[a][k], P[b][k], t));
    cur = cur ? cur.map((cc, k) => cc.map((v, m) => v + (c[k][m] - v) * 0.06)) : c;      // 부드럽게 따라감
    const r = document.documentElement.style; r.setProperty('--c1', rgba(cur[0])); r.setProperty('--c2', rgba(cur[1])); r.setProperty('--c3', rgba(cur[2]));
    const s = now / 1000, k = bg.children;                                                   // 빛 덩어리가 아주 천천히 떠다님
    k[0].style.transform = `translate(${Math.sin(s / 7) * 4}vw, ${Math.cos(s / 9) * 4}vh)`;
    k[1].style.transform = `translate(${Math.cos(s / 8) * -4}vw, ${Math.sin(s / 6) * 4}vh)`;
    k[2].style.transform = `translate(${Math.sin(s / 10 + 1) * 6}vw, ${Math.cos(s / 11) * 5}vh)`;
  }
  requestAnimationFrame(update);
})();
