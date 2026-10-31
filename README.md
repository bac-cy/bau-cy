# Cove — Desktop Home Robot

데스크탑 홈 로봇 **Cove**를 소개하는 브랜드 홈페이지입니다.
`index.html`을 브라우저로 열면 바로 볼 수 있어요.
(3D 시뮬레이터는 웹 주소(GitHub Pages)에서만 보이고, 파일을 직접 열면 임시 이미지가 대신 보여요.)

## 구조
- `index.html` — 페이지 내용 (인트로 · About · Features · Design · Experience · Gallery · Footer)
- `css/style.css` — 디자인 (색상은 맨 위 `:root`에서 한 번에 바꿀 수 있음)
- `js/main.js` — 스크롤 효과, Experience 상태 전환, 임시 로봇 일러스트
- `css/intro.css`, `js/intro.js` — 맨 앞 인트로 (HI → I'm cove → Cove 렌더)
- `css/outro.css`, `js/outro.js` — 맨 뒤 아웃트로(프로젝트 명세, 줄이 차례로 나타남). 내용은 `index.html`의 `#outro` 안에서 바로 고침
- `js/sim.js`, `css/sim.css` — Design 섹션의 **Cove 시뮬레이터** (머리·몸통 끌기, Top/Front/Perspective/Side, 인사·쓰다듬음·간지럼·간식 동작)
- `js/cove-eyes.js` — 눈 LED(8×8 도트) 표정과 눈 위치 계산 (시뮬레이터 look.js 에서 가져옴)
- `js/cove-presets.js` — 동작 데이터 (시뮬레이터 presets.js 그대로)
- `assets/intro-cove.png` — 인트로 3번 장면의 Cove 렌더 (지금은 임시 이미지, 같은 이름으로 바꿔 끼우면 됨)
- `assets/cove-rig.glb` — 시뮬레이터용 Cove 3D 모델 (뼈대 포함, 원본 23MB를 겉모습 위주로 0.56MB로 줄임)
- `assets/` — 렌더 이미지·영상을 넣을 폴더

## 렌더 이미지로 교체하기
`index.html`에서 `<div class="cove-art" data-cove></div>` 자리를 이미지로 바꾸면 됩니다.

```html
<img src="assets/hero.png" alt="Cove 정면 렌더">
<video src="assets/turntable.mp4" autoplay muted loop playsinline></video>
```
