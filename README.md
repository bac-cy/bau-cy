# Cove — Desktop Home Robot

데스크탑 홈 로봇 **Cove**를 소개하는 브랜드 홈페이지입니다.
`index.html`을 브라우저로 열면 바로 볼 수 있어요.

## 구조
- `index.html` — 페이지 내용 (Hero · About · Features · Design · Experience · Gallery · Footer)
- `css/style.css` — 디자인 (색상은 맨 위 `:root`에서 한 번에 바꿀 수 있음)
- `js/main.js` — 스크롤 효과, Experience 상태 전환, 임시 로봇 일러스트
- `assets/` — 렌더 이미지·영상을 넣을 폴더

## 렌더 이미지로 교체하기
`index.html`에서 `<div class="cove-art" data-cove></div>` 자리를 이미지로 바꾸면 됩니다.

```html
<img src="assets/hero.png" alt="Cove 정면 렌더">
<video src="assets/turntable.mp4" autoplay muted loop playsinline></video>
```
