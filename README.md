# Cove — Desktop Home Robot

데스크탑 홈 로봇 **Cove**를 소개하는 브랜드 홈페이지입니다.
`index.html`을 브라우저로 열면 바로 볼 수 있어요.
(3D 모델은 웹 주소(GitHub Pages)에서만 보이고, 파일을 직접 열면 임시 이미지가 대신 보여요.)

## 구조
- `index.html` — 페이지 내용 (인트로 · About · Features · Design · Experience · Gallery · Footer)
- `css/style.css` — 디자인 (색상은 맨 위 `:root`에서 한 번에 바꿀 수 있음)
- `js/main.js` — 스크롤 효과, Experience 상태 전환, 임시 로봇 일러스트
- `css/intro.css`, `js/intro.js` — 맨 앞 인트로 (HI → I'm cove → Cove 렌더)
- `css/outro.css`, `js/outro.js` — 맨 뒤 아웃트로(엔딩 크레딧 자동 롤링)
- `js/credits.js` — **엔딩 크레딧 명단** (여기만 고치면 크레딧이 바뀜)
- `js/viewer.js` — Design 섹션의 돌려볼 수 있는 3D 뷰어
- `assets/intro-cove.png` — 인트로 3번 장면의 Cove 렌더 (지금은 임시 이미지, 같은 이름으로 바꿔 끼우면 됨)
- `assets/cove.glb` — Cove 3D 모델 (겉모습만 담은 가벼운 버전)
- `assets/` — 렌더 이미지·영상을 넣을 폴더

## 렌더 이미지로 교체하기
`index.html`에서 `<div class="cove-art" data-cove></div>` 자리를 이미지로 바꾸면 됩니다.

```html
<img src="assets/hero.png" alt="Cove 정면 렌더">
<video src="assets/turntable.mp4" autoplay muted loop playsinline></video>
```
