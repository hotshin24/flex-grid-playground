/**
 * topics/grid/examples.js — CSS Grid 실전 예제 18건 (GR-07)
 *
 * Flex 예제(topics/flex/examples.js)와 같은 형식이다. 필드 7종이 같고
 * 카테고리도 같은 5종을 쓴다 — 레이아웃 · 정렬 · 반응형 · UI 컴포넌트 · 폼
 *
 * Flex 18건은 v0.1 이관이지만 이 18건은 신규 작성이다.
 *
 * 배열 순서는 Flex 와 같은 카테고리 차례로 맞췄다. 원본 초안은
 * 레이아웃 · UI 컴포넌트 · 반응형 · 정렬 · 폼 순이었다. 카테고리 강조색과
 * 필터 칩 자리는 배열에 처음 나온 차례로 정해지므로(ui/examples.js 의
 * accentOf), 순서가 다르면 같은 '정렬'이 Flex 에서는 두 번째 색,
 * Grid 에서는 네 번째 색이 되고 칩 자리도 옮겨 앉는다. 토픽을 갈아탈 때마다
 * 색과 자리가 흔들리는 셈이라 순서만 맞췄다. 예제 내용은 한 글자도 고치지
 * 않았다.
 *
 * css · html 필드는 학습자가 그대로 복사해 쓰는 코드다.
 * 이 안의 색상 리터럴은 토큰으로 바꾸지 않는다 — 바꾸면 복사해서 쓸 수 없다.
 * 규칙 5(색상 리터럴 금지)는 v1.0 신규 코드에 적용되며 예제 콘텐츠는 대상이 아니다.
 */

export const GRID_EXAMPLES = [
  /* ========================= 레이아웃 (5) ========================= */
  {
    id: 'holy-grail',
    title: '홀리 그레일 레이아웃',
    category: '레이아웃',
    desc: '헤더·사이드바·본문·광고·푸터를 areas로 그림처럼 배치합니다. Grid가 가장 빛나는 고전 패턴입니다.',
    previewHeight: 260,
    css: `.holy-grail {
  display: grid;
  grid-template-columns: 160px 1fr 120px;
  grid-template-rows: 56px 1fr 40px;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  gap: 8px;
  height: 100%;
  background: #0f172a;
  padding: 8px;
}
.hg-header { grid-area: header; background: #6366f1; }
.hg-nav    { grid-area: nav;    background: #1e293b; }
.hg-main   { grid-area: main;   background: #334155; }
.hg-aside  { grid-area: aside;  background: #1e293b; }
.hg-footer { grid-area: footer; background: #475569; }
.holy-grail > * {
  border-radius: 6px;
  display: grid;
  place-items: center;
  color: #e2e8f0;
  font-size: 13px;
}`,
    html: `<div class="holy-grail">
  <header class="hg-header">Header</header>
  <nav class="hg-nav">Nav</nav>
  <main class="hg-main">Main</main>
  <aside class="hg-aside">Aside</aside>
  <footer class="hg-footer">Footer</footer>
</div>`,
  },
  {
    id: 'dashboard',
    title: '대시보드 위젯 보드',
    category: '레이아웃',
    desc: '크기가 다른 위젯을 span으로 배치합니다. 위젯마다 몇 칸을 차지할지만 정하면 나머지는 Grid가 채웁니다.',
    previewHeight: 260,
    css: `.dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 72px;
  gap: 10px;
  padding: 10px;
  background: #0f172a;
}
.widget {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #cbd5e1;
  font-size: 12px;
}
.w-wide  { grid-column: span 2; }
.w-tall  { grid-row: span 2; }
.w-big   { grid-column: span 2; grid-row: span 2; }`,
    html: `<div class="dashboard">
  <div class="widget w-big">매출 추이</div>
  <div class="widget w-wide">방문자</div>
  <div class="widget">전환율</div>
  <div class="widget w-tall">알림</div>
  <div class="widget">신규</div>
  <div class="widget w-wide">최근 주문</div>
</div>`,
  },
  {
    id: 'magazine',
    title: '매거진 레이아웃',
    category: '레이아웃',
    desc: '헤드라인 기사 하나를 크게 두고 나머지를 주변에 흘립니다. 라인 번호로 직접 자리를 지정하는 방식입니다.',
    previewHeight: 260,
    css: `.magazine {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 8px;
  height: 100%;
  padding: 8px;
  background: #18181b;
}
.article {
  background: #27272a;
  border-radius: 6px;
  padding: 10px;
  color: #d4d4d8;
  font-size: 12px;
}
.lead {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
  background: #7c3aed;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
}
.side { grid-column: 3; }`,
    html: `<div class="magazine">
  <article class="article lead">오늘의 헤드라인</article>
  <article class="article side">단신 1</article>
  <article class="article side">단신 2</article>
  <article class="article">칼럼</article>
  <article class="article">리뷰</article>
  <article class="article">사진</article>
</div>`,
  },
  {
    id: 'sidebar-sticky',
    title: '사이드바 + 본문',
    category: '레이아웃',
    desc: '고정 폭 사이드바와 나머지를 채우는 본문입니다. 240px 1fr 두 값이면 끝납니다.',
    previewHeight: 200,
    css: `.app-shell {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 12px;
  height: 100%;
  padding: 10px;
  background: #0c0a1d;
}
.side-panel {
  background: #1e1b4b;
  border-radius: 8px;
  padding: 12px;
  display: grid;
  grid-auto-rows: max-content;
  gap: 8px;
  align-content: start;
}
.side-panel a {
  color: #c7d2fe;
  font-size: 13px;
  text-decoration: none;
  padding: 6px 8px;
  border-radius: 4px;
  background: #312e81;
}
.content {
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
  color: #e2e8f0;
}`,
    html: `<div class="app-shell">
  <nav class="side-panel">
    <a href="#">대시보드</a>
    <a href="#">주문 관리</a>
    <a href="#">상품</a>
    <a href="#">설정</a>
  </nav>
  <main class="content">본문 영역</main>
</div>`,
  },
  {
    id: 'footer-columns',
    title: '푸터 다단 링크',
    category: '레이아웃',
    desc: '푸터를 여러 단으로 나눕니다. auto-fit과 minmax를 쓰면 화면이 좁아질 때 단이 알아서 줄어듭니다.',
    previewHeight: 200,
    css: `.site-footer {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  padding: 20px;
  background: #111827;
}
.foot-col h4 {
  color: #f9fafb;
  font-size: 13px;
  margin: 0 0 8px;
}
.foot-col ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 5px;
}
.foot-col a {
  color: #9ca3af;
  font-size: 12px;
  text-decoration: none;
}`,
    html: `<footer class="site-footer">
  <div class="foot-col">
    <h4>제품</h4>
    <ul><li><a href="#">기능</a></li><li><a href="#">가격</a></li></ul>
  </div>
  <div class="foot-col">
    <h4>회사</h4>
    <ul><li><a href="#">소개</a></li><li><a href="#">채용</a></li></ul>
  </div>
  <div class="foot-col">
    <h4>지원</h4>
    <ul><li><a href="#">문서</a></li><li><a href="#">문의</a></li></ul>
  </div>
  <div class="foot-col">
    <h4>정책</h4>
    <ul><li><a href="#">약관</a></li><li><a href="#">개인정보</a></li></ul>
  </div>
</footer>`,
  },

  /* ========================= 정렬 (3) ========================= */
  {
    id: 'perfect-center',
    title: '정중앙 배치',
    category: '정렬',
    desc: 'place-items: center 한 줄이면 가로·세로 정중앙입니다. Grid에서 가장 짧은 가운데 정렬입니다.',
    previewHeight: 180,
    css: `.center-box {
  display: grid;
  place-items: center;
  height: 100%;
  background: #0f172a;
}
.center-box .badge {
  background: #6366f1;
  color: #fff;
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
}

/* place-items 는 align-items 와 justify-items 의 단축입니다
   align-items: center; justify-items: center; 와 같습니다 */`,
    html: `<div class="center-box">
  <div class="badge">정중앙</div>
</div>`,
  },
  {
    id: 'cell-alignment',
    title: '셀 안 아홉 위치',
    category: '정렬',
    desc: 'justify-self와 align-self를 짝지으면 셀 안 아홉 곳 어디로든 보낼 수 있습니다.',
    previewHeight: 240,
    css: `.nine-cells {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 68px);
  gap: 6px;
  padding: 10px;
  background: #0f172a;
}
.cell {
  background: #1e293b;
  border: 1px dashed #475569;
  border-radius: 6px;
  display: grid;
}
.dot {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: #6366f1;
}
.tl { justify-self: start;  align-self: start; }
.tc { justify-self: center; align-self: start; }
.tr { justify-self: end;    align-self: start; }
.ml { justify-self: start;  align-self: center; }
.mc { justify-self: center; align-self: center; }
.mr { justify-self: end;    align-self: center; }
.bl { justify-self: start;  align-self: end; }
.bc { justify-self: center; align-self: end; }
.br { justify-self: end;    align-self: end; }`,
    html: `<div class="nine-cells">
  <div class="cell"><span class="dot tl"></span></div>
  <div class="cell"><span class="dot tc"></span></div>
  <div class="cell"><span class="dot tr"></span></div>
  <div class="cell"><span class="dot ml"></span></div>
  <div class="cell"><span class="dot mc"></span></div>
  <div class="cell"><span class="dot mr"></span></div>
  <div class="cell"><span class="dot bl"></span></div>
  <div class="cell"><span class="dot bc"></span></div>
  <div class="cell"><span class="dot br"></span></div>
</div>`,
  },
  {
    id: 'track-alignment',
    title: '트랙 전체 정렬',
    category: '정렬',
    desc: '트랙이 고정 폭이라 남는 공간이 있을 때 justify-content가 그리드 전체를 움직입니다. fr이면 효과가 없습니다.',
    previewHeight: 200,
    css: `.track-align {
  display: grid;
  grid-template-columns: repeat(3, 72px);
  grid-template-rows: repeat(2, 56px);
  justify-content: center;
  align-content: space-between;
  gap: 8px;
  height: 100%;
  padding: 12px;
  background: #0f172a;
}
.ta-item {
  background: #6366f1;
  border-radius: 6px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 12px;
}

/* 열을 1fr 로 바꾸면 트랙이 폭을 다 써서
   justify-content 가 아무 효과도 내지 않습니다 */`,
    html: `<div class="track-align">
  <div class="ta-item">1</div>
  <div class="ta-item">2</div>
  <div class="ta-item">3</div>
  <div class="ta-item">4</div>
  <div class="ta-item">5</div>
  <div class="ta-item">6</div>
</div>`,
  },

  /* ========================= 반응형 (4) ========================= */
  {
    id: 'auto-fit-cards',
    title: 'auto-fit 반응형 그리드',
    category: '반응형',
    desc: 'auto-fit은 빈 트랙을 접어 남은 카드가 폭을 나눠 갖습니다. auto-fill과의 차이를 확인해 보세요.',
    previewHeight: 200,
    css: `.auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  padding: 12px;
  background: #0f172a;
}
.tile {
  background: #334155;
  border-radius: 8px;
  min-height: 64px;
  display: grid;
  place-items: center;
  color: #e2e8f0;
  font-size: 12px;
}

/* auto-fill 로 바꾸면 빈 트랙이 남아 카드가 늘어나지 않습니다
   grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); */`,
    html: `<div class="auto-fit">
  <div class="tile">1</div>
  <div class="tile">2</div>
  <div class="tile">3</div>
</div>`,
  },
  {
    id: 'areas-responsive',
    title: 'areas 재배치 반응형',
    category: '반응형',
    desc: '미디어 쿼리에서 areas만 다시 그리면 배치가 통째로 바뀝니다. 아이템 CSS는 건드리지 않습니다.',
    previewHeight: 260,
    css: `.resp-layout {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas:
    "head"
    "main"
    "side"
    "foot";
  gap: 8px;
  padding: 8px;
  background: #0f172a;
}
@media (min-width: 600px) {
  .resp-layout {
    grid-template-columns: 180px 1fr;
    grid-template-areas:
      "head head"
      "side main"
      "foot foot";
  }
}
.r-head { grid-area: head; background: #6366f1; }
.r-side { grid-area: side; background: #1e293b; }
.r-main { grid-area: main; background: #334155; }
.r-foot { grid-area: foot; background: #475569; }
.resp-layout > * {
  border-radius: 6px;
  padding: 14px;
  color: #e2e8f0;
  font-size: 12px;
}`,
    html: `<div class="resp-layout">
  <header class="r-head">Header</header>
  <aside class="r-side">Sidebar</aside>
  <main class="r-main">Main</main>
  <footer class="r-foot">Footer</footer>
</div>`,
  },
  {
    id: 'twelve-column',
    title: '12칼럼 그리드',
    category: '반응형',
    desc: '부트스트랩식 12칼럼을 Grid로 만듭니다. span 숫자만 바꾸면 폭이 정해집니다.',
    previewHeight: 220,
    css: `.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 8px;
  padding: 12px;
  background: #0f172a;
}
.col {
  background: #4338ca;
  border-radius: 6px;
  padding: 12px 6px;
  color: #e0e7ff;
  font-size: 11px;
  text-align: center;
}
.c-12 { grid-column: span 12; }
.c-6  { grid-column: span 6; }
.c-4  { grid-column: span 4; }
.c-3  { grid-column: span 3; }`,
    html: `<div class="grid-12">
  <div class="col c-12">12</div>
  <div class="col c-6">6</div>
  <div class="col c-6">6</div>
  <div class="col c-4">4</div>
  <div class="col c-4">4</div>
  <div class="col c-4">4</div>
  <div class="col c-3">3</div>
  <div class="col c-3">3</div>
  <div class="col c-3">3</div>
  <div class="col c-3">3</div>
</div>`,
  },
  {
    id: 'content-first',
    title: '본문 우선 순서 바꾸기',
    category: '반응형',
    desc: '넓은 화면에서는 사이드바가 왼쪽이지만 좁은 화면에서는 본문이 먼저 옵니다. HTML 순서는 본문이 앞입니다.',
    previewHeight: 220,
    css: `.content-first {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  padding: 10px;
  background: #0f172a;
}
@media (min-width: 600px) {
  .content-first { grid-template-columns: 180px 1fr; }
  .cf-main { grid-column: 2; grid-row: 1; }
  .cf-side { grid-column: 1; grid-row: 1; }
}
.cf-main { background: #334155; }
.cf-side { background: #1e293b; }
.content-first > * {
  border-radius: 8px;
  padding: 16px;
  color: #e2e8f0;
  font-size: 12px;
}`,
    html: `<div class="content-first">
  <main class="cf-main">본문 (HTML에서 먼저)</main>
  <aside class="cf-side">사이드바 (넓은 화면에서 왼쪽)</aside>
</div>`,
  },

  /* ========================= UI 컴포넌트 (4) ========================= */
  {
    id: 'grid-card-grid',
    title: '카드 그리드',
    category: 'UI 컴포넌트',
    desc: 'auto-fill과 minmax로 카드 수를 화면이 정하게 합니다. 미디어 쿼리 없이 열 수가 바뀝니다.',
    previewHeight: 240,
    css: `.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding: 12px;
  background: #0f172a;
}
.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  overflow: hidden;
  display: grid;
  grid-template-rows: 72px auto;
}
.card-thumb { background: #4f46e5; }
.card-body {
  padding: 10px;
  color: #cbd5e1;
  font-size: 12px;
}
.card-body strong {
  display: block;
  color: #f1f5f9;
  font-size: 13px;
  margin-bottom: 3px;
}`,
    html: `<div class="card-grid">
  <article class="card">
    <div class="card-thumb"></div>
    <div class="card-body"><strong>상품 A</strong>29,000원</div>
  </article>
  <article class="card">
    <div class="card-thumb"></div>
    <div class="card-body"><strong>상품 B</strong>34,000원</div>
  </article>
  <article class="card">
    <div class="card-thumb"></div>
    <div class="card-body"><strong>상품 C</strong>19,000원</div>
  </article>
  <article class="card">
    <div class="card-thumb"></div>
    <div class="card-body"><strong>상품 D</strong>42,000원</div>
  </article>
</div>`,
  },
  {
    id: 'masonry-dense',
    title: '갤러리 (빈 칸 메우기)',
    category: 'UI 컴포넌트',
    desc: '크기가 제각각인 사진을 배치할 때 dense를 켜면 앞쪽에 생긴 빈 칸을 뒤 사진이 메웁니다.',
    previewHeight: 288,
    css: `.gallery {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 60px;
  grid-auto-flow: row dense;
  gap: 8px;
  padding: 10px;
  background: #1c1917;
}
.photo {
  background: #44403c;
  border-radius: 6px;
  display: grid;
  place-items: center;
  color: #d6d3d1;
  font-size: 11px;
}
.p-wide { grid-column: span 2; }
.p-tall { grid-row: span 2; }
.p-big  { grid-column: span 2; grid-row: span 2; background: #7c2d12; }`,
    html: `<div class="gallery">
  <figure class="photo p-big">1</figure>
  <figure class="photo p-wide">2</figure>
  <figure class="photo">3</figure>
  <figure class="photo p-tall">4</figure>
  <figure class="photo">5</figure>
  <figure class="photo p-wide">6</figure>
  <figure class="photo">7</figure>
</div>`,
  },
  {
    id: 'pricing-table',
    title: '가격표',
    category: 'UI 컴포넌트',
    desc: '요금제 카드를 나란히 두고 가운데 하나만 강조합니다. 셀 안에서 아이템을 늘리는 stretch가 높이를 맞춰줍니다.',
    previewHeight: 240,
    css: `.pricing {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
  align-items: stretch;
  background: #0f172a;
}
.plan {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 8px;
  padding: 14px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  color: #cbd5e1;
  font-size: 12px;
}
.plan.featured {
  border-color: #6366f1;
  background: #1e1b4b;
}
.plan h3 { margin: 0; color: #f1f5f9; font-size: 14px; }
.plan .price { color: #a5b4fc; font-size: 20px; font-weight: 800; }
.plan button {
  border: 0;
  border-radius: 6px;
  padding: 8px;
  background: #6366f1;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}`,
    html: `<div class="pricing">
  <div class="plan">
    <h3>Basic</h3>
    <div class="price">₩0</div>
    <p>개인 사용자를 위한 무료 요금제</p>
    <button>시작하기</button>
  </div>
  <div class="plan featured">
    <h3>Pro</h3>
    <div class="price">₩19,000</div>
    <p>팀 협업과 고급 기능을 모두</p>
    <button>선택하기</button>
  </div>
  <div class="plan">
    <h3>Team</h3>
    <div class="price">₩49,000</div>
    <p>대규모 조직을 위한 요금제</p>
    <button>문의하기</button>
  </div>
</div>`,
  },
  {
    id: 'media-object',
    title: '프로필 카드',
    category: 'UI 컴포넌트',
    desc: '아바타와 텍스트를 areas로 묶습니다. 아바타가 두 줄을 세로로 가로지르는 배치입니다.',
    previewHeight: 160,
    css: `.profile {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  grid-template-areas:
    "avatar name   action"
    "avatar bio    action";
  gap: 4px 12px;
  align-items: center;
  padding: 14px;
  background: #1e293b;
  border-radius: 10px;
  max-width: 380px;
  margin: 12px auto;
}
.avatar {
  grid-area: avatar;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #6366f1;
}
.p-name { grid-area: name; color: #f1f5f9; font-size: 14px; font-weight: 700; }
.p-bio  { grid-area: bio;  color: #94a3b8; font-size: 12px; }
.p-act  {
  grid-area: action;
  border: 1px solid #6366f1;
  background: transparent;
  color: #a5b4fc;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
}`,
    html: `<div class="profile">
  <div class="avatar"></div>
  <div class="p-name">신호진</div>
  <div class="p-bio">웹 퍼블리셔 · 커머스 13년</div>
  <button class="p-act">팔로우</button>
</div>`,
  },

  /* ========================= 폼 (2) ========================= */
  {
    id: 'label-input-form',
    title: '라벨-입력 2열 폼',
    category: '폼',
    desc: '라벨 열은 내용만큼, 입력 열은 나머지를 채웁니다. max-content 1fr 두 값이면 라벨 폭이 저절로 맞습니다.',
    previewHeight: 252,
    css: `.form-2col {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 12px 16px;
  align-items: center;
  padding: 16px;
  background: #1e293b;
  border-radius: 10px;
  max-width: 420px;
  margin: 12px auto;
}
.form-2col label {
  color: #cbd5e1;
  font-size: 12px;
  white-space: nowrap;
}
.form-2col input,
.form-2col textarea {
  width: 100%;
  box-sizing: border-box;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 8px 10px;
  color: #e2e8f0;
  font-size: 12px;
}
.form-2col .full { grid-column: 1 / -1; }
.form-2col button {
  grid-column: 2;
  justify-self: end;
  border: 0;
  border-radius: 6px;
  background: #6366f1;
  color: #fff;
  padding: 8px 18px;
  font-size: 12px;
  cursor: pointer;
}`,
    html: `<form class="form-2col">
  <label for="nm">이름</label>
  <input id="nm" type="text" placeholder="홍길동">
  <label for="em">이메일</label>
  <input id="em" type="email" placeholder="you@example.com">
  <label for="ms">문의 내용</label>
  <textarea id="ms" rows="3"></textarea>
  <button type="button">보내기</button>
</form>`,
  },
  {
    id: 'checkout-form',
    title: '결제 정보 폼',
    category: '폼',
    desc: '한 줄에 두 칸, 어떤 줄은 한 칸으로 씁니다. span과 1 / -1로 칸 수를 조절합니다.',
    previewHeight: 288,
    css: `.checkout {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
  background: #1e293b;
  border-radius: 10px;
  max-width: 440px;
  margin: 12px auto;
}
.field { display: grid; gap: 5px; }
.field.wide { grid-column: 1 / -1; }
.field label { color: #94a3b8; font-size: 11px; }
.field input {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 8px 10px;
  color: #e2e8f0;
  font-size: 12px;
}
.checkout .submit {
  grid-column: 1 / -1;
  border: 0;
  border-radius: 6px;
  background: #22c55e;
  color: #052e16;
  padding: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}`,
    html: `<form class="checkout">
  <div class="field wide">
    <label for="cn">카드 번호</label>
    <input id="cn" type="text" placeholder="0000 0000 0000 0000">
  </div>
  <div class="field">
    <label for="ex">유효기간</label>
    <input id="ex" type="text" placeholder="MM/YY">
  </div>
  <div class="field">
    <label for="cv">CVC</label>
    <input id="cv" type="text" placeholder="123">
  </div>
  <div class="field wide">
    <label for="ho">카드 소유자</label>
    <input id="ho" type="text" placeholder="HONG GILDONG">
  </div>
  <button class="submit" type="button">결제하기</button>
</form>`,
  },
];

export default GRID_EXAMPLES;
