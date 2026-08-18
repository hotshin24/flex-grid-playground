const COLORS = [
    ['#6c63ff','#3b35cc'],
    ['#48b0f1','#2580c0'],
    ['#f16c48','#c03525'],
    ['#48f1b0','#25c07c'],
    ['#f1c948','#c09925'],
    ['#c948f1','#9025c0'],
    ['#f1486c','#c0253b'],
    ['#48f1f1','#25c0c0'],
  ];

  const EXAMPLES = [
    {
      id: 'nav',
      title: '네비게이션 바',
      category: '레이아웃',
      categoryColor: '#6c63ff',
      desc: '로고·메뉴·CTA 버튼을 양끝으로 배치하는 전형적인 상단 내비게이션입니다.',
      previewHeight: 64,
      css: `.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 56px;
  background: #1e1b4b;
  gap: 16px;
}
.logo {
  font-weight: 800;
  font-size: 18px;
  color: #a78bfa;
  letter-spacing: -0.5px;
  text-decoration: none;
}
.menu {
  display: flex;
  list-style: none;
  gap: 28px;
}
.menu a {
  font-size: 14px;
  color: #c4b5fd;
  text-decoration: none;
  cursor: pointer;
}
.menu a:hover { color: #fff; }
.cta {
  padding: 8px 18px;
  background: #6c63ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}`,
      html: `<nav class="navbar">
  <a class="logo" href="#">MyBrand</a>
  <ul class="menu">
    <li><a href="#">홈</a></li>
    <li><a href="#">소개</a></li>
    <li><a href="#">작업물</a></li>
  </ul>
  <button class="cta">시작하기</button>
</nav>`
    },
    {
      id: 'center',
      title: '완전 가운데 정렬',
      category: '정렬',
      categoryColor: '#48b0f1',
      desc: 'justify-content + align-items를 모두 center로 설정해 수평·수직 모두 가운데 정렬합니다.',
      previewHeight: 120,
      css: `.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  background: #0f172a;
}
.card {
  padding: 20px 32px;
  background: #1e1b4b;
  border: 1px solid #3730a3;
  border-radius: 12px;
  color: #a78bfa;
  font-weight: 700;
  font-size: 16px;
}`,
      html: `<div class="container">
  <div class="card">가운데 정렬 완료!</div>
</div>`
    },
    {
      id: 'sidebar',
      title: '사이드바 레이아웃',
      category: '레이아웃',
      categoryColor: '#6c63ff',
      desc: 'flex-shrink:0으로 사이드바 너비를 고정하고, 메인 영역은 flex:1로 나머지를 채웁니다.',
      previewHeight: 100,
      css: `.layout {
  display: flex;
  height: 100px;
  gap: 0;
}
.sidebar {
  flex-shrink: 0;
  width: 80px;
  background: #1e1b4b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #a78bfa;
  font-weight: 600;
}
.main {
  flex: 1;
  background: #0f172a;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 13px;
  color: #475569;
}`,
      html: `<div class="layout">
  <aside class="sidebar">메뉴</aside>
  <main class="main">flex: 1 로 남은 공간을 채웁니다</main>
</div>`
    },
    {
      id: 'card-grid',
      title: '카드 그리드',
      category: '반응형',
      categoryColor: '#48f1b0',
      desc: 'flex-wrap: wrap + flex: 1 1 140px 조합으로 화면 너비에 따라 자동 줄 바꿈되는 카드 목록입니다.',
      previewHeight: 130,
      css: `.card-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  background: #0f172a;
}
.card {
  flex: 1 1 100px;
  min-height: 70px;
  background: #1e1b4b;
  border: 1px solid #312e81;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #c4b5fd;
  font-weight: 600;
}`,
      html: `<div class="card-list">
  <div class="card">카드 1</div>
  <div class="card">카드 2</div>
  <div class="card">카드 3</div>
  <div class="card">카드 4</div>
  <div class="card">카드 5</div>
</div>`
    },
    {
      id: 'media',
      title: '미디어 오브젝트',
      category: 'UI 컴포넌트',
      categoryColor: '#f1c948',
      desc: '이미지와 텍스트를 나란히 배치하는 고전적인 UI 패턴입니다. SNS 피드, 댓글, 알림에 자주 씁니다.',
      previewHeight: 100,
      css: `.media {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px;
  background: #0f172a;
}
.avatar {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg,#6c63ff,#48b0f1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #fff;
  font-size: 16px;
}
.content {
  flex: 1;
}
.name {
  font-weight: 700;
  font-size: 13px;
  color: #e2e8f0;
  margin-bottom: 4px;
}
.text {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}`,
      html: `<div class="media">
  <div class="avatar">K</div>
  <div class="content">
    <div class="name">김개발</div>
    <div class="text">
      flex-shrink: 0 으로 아바타 크기를 고정하고
      텍스트 영역은 flex: 1로 늘립니다.
    </div>
  </div>
</div>`
    },
    {
      id: 'tags',
      title: '태그 클라우드',
      category: 'UI 컴포넌트',
      categoryColor: '#f1c948',
      desc: 'flex-wrap: wrap으로 태그가 넘치면 자동으로 줄 바꿈됩니다. 블로그 태그, 스킬 배지에 활용합니다.',
      previewHeight: 90,
      css: `.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: #0f172a;
}
.tag {
  padding: 5px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
}
.tag-purple { color:#a78bfa; border-color:#6c63ff44; background:#6c63ff11; }
.tag-blue   { color:#7dd3fc; border-color:#38bdf844; background:#38bdf811; }
.tag-green  { color:#86efac; border-color:#22c55e44; background:#22c55e11; }
.tag-yellow { color:#fcd34d; border-color:#fbbf2444; background:#fbbf2411; }
.tag-pink   { color:#f9a8d4; border-color:#f4729444; background:#f4729411; }
.tag-teal   { color:#6ee7b7; border-color:#10b98144; background:#10b98111; }
.tag-indigo { color:#c4b5fd; border-color:#8b5cf644; background:#8b5cf611; }`,
      html: `<div class="tag-cloud">
  <span class="tag tag-purple">CSS</span>
  <span class="tag tag-blue">HTML</span>
  <span class="tag tag-green">JavaScript</span>
  <span class="tag tag-yellow">React</span>
  <span class="tag tag-pink">Flexbox</span>
  <span class="tag tag-teal">Grid</span>
  <span class="tag tag-indigo">TypeScript</span>
</div>`
    },
    {
      id: 'buttons',
      title: '버튼 그룹',
      category: 'UI 컴포넌트',
      categoryColor: '#f1c948',
      desc: 'align-items: center로 크기가 다른 버튼들을 세로 기준선에 맞추고 gap으로 간격을 정리합니다.',
      previewHeight: 72,
      css: `.btn-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #0f172a;
}
.btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.btn-primary {
  background: #6c63ff;
  color: #fff;
}
.btn-secondary {
  background: transparent;
  color: #a78bfa;
  border: 1px solid #6c63ff55;
}
.btn-sm {
  padding: 5px 12px;
  font-size: 11px;
  background: #1e1b4b;
  color: #64748b;
  border: 1px solid #2d3152;
}
.spacer { flex: 1; }`,
      html: `<div class="btn-group">
  <button class="btn btn-primary">저장</button>
  <button class="btn btn-secondary">미리보기</button>
  <div class="spacer"></div>
  <button class="btn btn-sm">취소</button>
</div>`
    },
    {
      id: 'form-row',
      title: '폼 인라인 행',
      category: '폼',
      categoryColor: '#f16c48',
      desc: 'label을 flex-shrink:0으로 고정하고 input에 flex:1을 줘 레이블과 입력 필드를 한 줄로 정렬합니다.',
      previewHeight: 130,
      css: `.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: #0f172a;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.form-row label {
  flex-shrink: 0;
  width: 60px;
  font-size: 12px;
  color: #94a3b8;
  text-align: right;
}
.form-row input {
  flex: 1;
  padding: 7px 12px;
  background: #1e1b4b;
  border: 1px solid #312e81;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 12px;
  outline: none;
}`,
      html: `<form class="form">
  <div class="form-row">
    <label for="name">이름</label>
    <input id="name" type="text" placeholder="홍길동">
  </div>
  <div class="form-row">
    <label for="email">이메일</label>
    <input id="email" type="email" placeholder="hello@example.com">
  </div>
  <div class="form-row">
    <label for="pw">비밀번호</label>
    <input id="pw" type="password" placeholder="••••••••">
  </div>
</form>`
    },
    {
      id: 'footer',
      title: '푸터 레이아웃',
      category: '레이아웃',
      categoryColor: '#6c63ff',
      desc: '여러 열을 flex로 나란히 배치하고 space-between으로 양끝 정렬합니다. 반응형 사이트 하단에 활용합니다.',
      previewHeight: 120,
      css: `.footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding: 20px 24px;
  background: #0d1117;
  flex-wrap: wrap;
}
.footer-col h4 {
  font-size: 12px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 8px;
}
.footer-col ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.footer-col a {
  font-size: 11px;
  color: #475569;
  text-decoration: none;
  cursor: pointer;
}
.footer-col a:hover { color: #94a3b8; }
.copy {
  width: 100%;
  text-align: center;
  font-size: 11px;
  color: #334155;
  padding-top: 12px;
  border-top: 1px solid #1e2233;
}`,
      html: `<footer class="footer">
  <div class="footer-col">
    <h4>서비스</h4>
    <ul>
      <li><a href="#">소개</a></li>
      <li><a href="#">요금제</a></li>
      <li><a href="#">블로그</a></li>
    </ul>
  </div>
  <div class="footer-col">
    <h4>지원</h4>
    <ul>
      <li><a href="#">문서</a></li>
      <li><a href="#">FAQ</a></li>
      <li><a href="#">문의</a></li>
    </ul>
  </div>
  <div class="footer-col">
    <h4>회사</h4>
    <ul>
      <li><a href="#">팀 소개</a></li>
      <li><a href="#">채용</a></li>
      <li><a href="#">개인정보</a></li>
    </ul>
  </div>
  <div class="copy">© 2026 MyBrand. All rights reserved.</div>
</footer>`
    },
    {
      id: 'profile',
      title: '프로필 카드',
      category: 'UI 컴포넌트',
      categoryColor: '#f1c948',
      desc: 'flex-direction:column + align-items:center로 아바타·이름·설명·버튼을 세로로 가운데 정렬합니다.',
      previewHeight: 170,
      css: `.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 20px;
  background: #0f172a;
  width: 100%;
}
.p-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg,#6c63ff,#f16c48);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
}
.p-name {
  font-size: 16px;
  font-weight: 700;
  color: #e2e8f0;
}
.p-bio {
  font-size: 12px;
  color: #64748b;
  text-align: center;
  line-height: 1.5;
}
.p-stats {
  display: flex;
  gap: 24px;
}
.p-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.p-stat strong {
  font-size: 15px;
  font-weight: 800;
  color: #e2e8f0;
}
.p-stat span {
  font-size: 10px;
  color: #475569;
}
.p-btn {
  padding: 8px 28px;
  background: #6c63ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}`,
      html: `<div class="profile-card">
  <div class="p-avatar">K</div>
  <div class="p-name">김개발</div>
  <div class="p-bio">프론트엔드를 좋아하는<br>주니어 개발자입니다.</div>
  <div class="p-stats">
    <div class="p-stat"><strong>128</strong><span>팔로워</span></div>
    <div class="p-stat"><strong>47</strong><span>팔로잉</span></div>
    <div class="p-stat"><strong>32</strong><span>게시물</span></div>
  </div>
  <button class="p-btn">팔로우</button>
</div>`
    },
    {
      id: 'chat',
      title: '채팅 말풍선',
      category: 'UI 컴포넌트',
      categoryColor: '#f1c948',
      desc: 'flex-direction:column + align-self로 보낸 메시지와 받은 메시지를 각각 왼쪽·오른쪽으로 배치합니다.',
      previewHeight: 150,
      css: `.chat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #0a0c14;
}
.bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.5;
}
.bubble.received {
  align-self: flex-start;
  background: #1e1b4b;
  color: #c4b5fd;
  border-bottom-left-radius: 3px;
}
.bubble.sent {
  align-self: flex-end;
  background: #6c63ff;
  color: #fff;
  border-bottom-right-radius: 3px;
}
.time {
  font-size: 10px;
  color: #334155;
  align-self: center;
}`,
      html: `<div class="chat">
  <div class="bubble received">안녕하세요! flexbox 공부 중이에요 😊</div>
  <div class="bubble sent">오, 저도요! align-self가 신기하더라고요</div>
  <div class="time">오전 9:31</div>
  <div class="bubble received">맞아요, flex-direction: column일 때<br>align-self로 좌우를 바꾸는 게 핵심이에요!</div>
  <div class="bubble sent">이제 이해됐어요 👍</div>
  <div class="time">오전 9:32</div>
</div>`
    },
    {
      id: 'pricing',
      title: '요금제 카드',
      category: '레이아웃',
      categoryColor: '#6c63ff',
      desc: '가격 카드 3개를 flex로 나란히 배치합니다. align-items:stretch로 일반 카드는 같은 높이로 늘리고, 추천 카드에만 align-self:flex-start를 적용해 콘텐츠 높이만큼만 표시합니다.',
      previewHeight: 180,
      css: `.pricing {
  display: flex;
  gap: 10px;
  align-items: stretch;
  padding: 12px;
  background: #0a0c14;
}
.plan {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: #0f172a;
  border: 1px solid #1e2233;
  border-radius: 12px;
}
.plan.featured {
  background: #1e1b4b;
  border-color: #6c63ff;
  padding: 20px 14px;
  align-self: flex-start;
}
.plan-name {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #475569;
}
.plan.featured .plan-name { color: #a78bfa; }
.plan-price {
  font-size: 22px;
  font-weight: 800;
  color: #e2e8f0;
}
.plan-price span {
  font-size: 12px;
  font-weight: 400;
  color: #475569;
}
.plan-feat {
  font-size: 11px;
  color: #64748b;
  line-height: 1.6;
}
.plan-btn {
  padding: 7px;
  border-radius: 7px;
  border: 1px solid #2d3152;
  background: transparent;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  margin-top: auto;
}
.plan.featured .plan-btn {
  background: #6c63ff;
  color: #fff;
  border-color: transparent;
}`,
      html: `<div class="pricing">
  <div class="plan">
    <div class="plan-name">Free</div>
    <div class="plan-price">₩0<span>/월</span></div>
    <div class="plan-feat">프로젝트 3개<br>5GB 저장소</div>
    <button class="plan-btn">시작하기</button>
  </div>
  <div class="plan featured">
    <div class="plan-name">Pro ⭐</div>
    <div class="plan-price">₩9,900<span>/월</span></div>
    <div class="plan-feat">무제한 프로젝트<br>50GB 저장소<br>우선 지원</div>
    <button class="plan-btn">업그레이드</button>
  </div>
  <div class="plan">
    <div class="plan-name">Team</div>
    <div class="plan-price">₩29,900<span>/월</span></div>
    <div class="plan-feat">팀 관리<br>200GB 저장소</div>
    <button class="plan-btn">문의하기</button>
  </div>
</div>`
    },
    {
      id: 'toast',
      title: '토스트 알림',
      category: 'UI 컴포넌트',
      categoryColor: '#f1c948',
      desc: 'flex + gap으로 아이콘·메시지·닫기 버튼을 한 줄에 배치합니다. align-items:center로 수직 중앙 정렬하고, flex-grow:1로 메시지 영역이 남은 공간을 채웁니다.',
      previewHeight: 80,
      css: `.toast-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #0a0c14;
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
}
.toast.success { background: #48f1b011; border-color: #48f1b033; }
.toast.error   { background: #f16c4811; border-color: #f16c4833; }
.toast.info    { background: #48b0f111; border-color: #48b0f133; }
.toast-icon { font-size: 16px; flex-shrink: 0; }
.toast-msg {
  flex-grow: 1;
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}
.toast-sub {
  font-size: 11px;
  font-weight: 400;
  color: #64748b;
  margin-top: 2px;
}
.toast-close {
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  flex-shrink: 0;
  background: none;
  border: none;
  line-height: 1;
}`,
      html: `<div class="toast-stack">
  <div class="toast success">
    <span class="toast-icon">✅</span>
    <div class="toast-msg">저장 완료<div class="toast-sub">변경 사항이 저장되었습니다.</div></div>
    <button class="toast-close">✕</button>
  </div>
  <div class="toast error">
    <span class="toast-icon">❌</span>
    <div class="toast-msg">업로드 실패<div class="toast-sub">파일 크기가 너무 큽니다.</div></div>
    <button class="toast-close">✕</button>
  </div>
  <div class="toast info">
    <span class="toast-icon">ℹ️</span>
    <div class="toast-msg">업데이트 알림<div class="toast-sub">새 버전이 출시되었습니다.</div></div>
    <button class="toast-close">✕</button>
  </div>
</div>`
    },
    {
      id: 'tabs',
      title: '탭 메뉴',
      category: 'UI 컴포넌트',
      categoryColor: '#f1c948',
      desc: 'flex로 탭 버튼을 가로로 배열합니다. 활성 탭은 border-bottom으로 강조하고, 마지막 탭에 margin-left:auto를 써서 오른쪽에 플로팅 버튼을 배치합니다.',
      previewHeight: 60,
      css: `.tab-bar {
  display: flex;
  align-items: flex-end;
  gap: 0;
  border-bottom: 2px solid #1e2233;
  padding: 0 16px;
  background: #0f172a;
}
.tab {
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  cursor: pointer;
  margin-bottom: -2px;
  transition: all 0.15s;
  white-space: nowrap;
}
.tab:hover { color: #94a3b8; }
.tab.active {
  color: #a78bfa;
  border-bottom-color: #6c63ff;
}
.tab-action {
  margin-left: auto;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid #6c63ff44;
  background: #6c63ff11;
  color: #a78bfa;
  cursor: pointer;
  align-self: center;
}`,
      html: `<div class="tab-bar">
  <button class="tab active">개요</button>
  <button class="tab">프로젝트</button>
  <button class="tab">팀원</button>
  <button class="tab">설정</button>
  <button class="tab-action">+ 새 탭</button>
</div>`
    },
    {
      id: 'breadcrumb',
      title: '브레드크럼 & 툴바',
      category: '레이아웃',
      categoryColor: '#6c63ff',
      desc: '페이지 경로(breadcrumb)와 액션 버튼을 양쪽으로 나누는 툴바입니다. justify-content:space-between으로 좌우에 배치하고, 각 영역 안도 flex로 정렬합니다.',
      previewHeight: 60,
      css: `.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 52px;
  background: #0f172a;
  border-bottom: 1px solid #1e2233;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.bc-item { color: #475569; }
.bc-item.current { color: #e2e8f0; font-weight: 600; }
.bc-sep { color: #334155; }
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hdr-btn {
  padding: 6px 12px;
  border-radius: 7px;
  border: 1px solid #2d3152;
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.hdr-btn.primary {
  background: #6c63ff;
  border-color: transparent;
  color: #fff;
}`,
      html: `<header class="page-header">
  <nav class="breadcrumb">
    <span class="bc-item">홈</span>
    <span class="bc-sep">›</span>
    <span class="bc-item">프로젝트</span>
    <span class="bc-sep">›</span>
    <span class="bc-item current">대시보드</span>
  </nav>
  <div class="header-actions">
    <button class="hdr-btn">내보내기</button>
    <button class="hdr-btn">공유</button>
    <button class="hdr-btn primary">저장</button>
  </div>
</header>`
    },
    {
      id: 'kanban',
      title: '칸반 컬럼',
      category: '레이아웃',
      categoryColor: '#6c63ff',
      desc: 'flex로 칸반 보드의 컬럼을 가로로 배열하고, 각 컬럼 내부도 flex-direction:column으로 카드를 세로 적층합니다. flex-shrink:0으로 컬럼 너비를 고정합니다.',
      previewHeight: 200,
      css: `.kanban {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #0a0c14;
  overflow-x: auto;
}
.kanban-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  width: 160px;
}
.col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
}
.col-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}
.col-count {
  font-size: 10px;
  background: #1e2233;
  color: #475569;
  border-radius: 100px;
  padding: 0 6px;
  font-weight: 700;
}
.kanban-card {
  background: #0f172a;
  border: 1px solid #1e2233;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
}
.kanban-card .card-tag {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 100px;
  margin-bottom: 6px;
}`,
      html: `<div class="kanban">
  <div class="kanban-col">
    <div class="col-header"><span class="col-title">할 일</span><span class="col-count">3</span></div>
    <div class="kanban-card"><span class="card-tag" style="background:#6c63ff22;color:#a78bfa">기능</span><br>로그인 페이지 구현</div>
    <div class="kanban-card"><span class="card-tag" style="background:#f1c94822;color:#f1c948">디자인</span><br>다크모드 색상 정의</div>
    <div class="kanban-card"><span class="card-tag" style="background:#48b0f122;color:#7dd3fc">문서</span><br>API 문서 작성</div>
  </div>
  <div class="kanban-col">
    <div class="col-header"><span class="col-title">진행 중</span><span class="col-count">2</span></div>
    <div class="kanban-card"><span class="card-tag" style="background:#6c63ff22;color:#a78bfa">기능</span><br>검색 필터 개발</div>
    <div class="kanban-card"><span class="card-tag" style="background:#f16c4822;color:#f16c48">버그</span><br>날짜 표시 오류 수정</div>
  </div>
  <div class="kanban-col">
    <div class="col-header"><span class="col-title">완료</span><span class="col-count">1</span></div>
    <div class="kanban-card"><span class="card-tag" style="background:#48f1b022;color:#48f1b0">완료</span><br>헤더 반응형 작업</div>
  </div>
</div>`
    },
    {
      id: 'input-group',
      title: '입력 그룹 (Input Group)',
      category: '폼',
      categoryColor: '#48f1b0',
      desc: 'flex로 접두어(prefix)·입력창·버튼을 한 줄에 붙여 배치합니다. 입력창에만 flex-grow:1을 줘서 남은 공간을 채우고, border-radius는 양 끝 요소에만 적용합니다.',
      previewHeight: 100,
      css: `.input-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: #0f172a;
}
.input-group {
  display: flex;
  align-items: stretch;
  border: 1px solid #2d3152;
  border-radius: 8px;
  overflow: hidden;
  background: #0a0c14;
}
.ig-prefix {
  padding: 0 12px;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #475569;
  background: #1a1d2e;
  border-right: 1px solid #2d3152;
  white-space: nowrap;
  flex-shrink: 0;
}
.ig-input {
  flex-grow: 1;
  padding: 10px 12px;
  background: transparent;
  border: none;
  color: #e2e8f0;
  font-size: 13px;
  outline: none;
}
.ig-btn {
  padding: 0 16px;
  background: #6c63ff;
  color: #fff;
  border: none;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}`,
      html: `<div class="input-form">
  <div class="input-group">
    <span class="ig-prefix">🔍</span>
    <input class="ig-input" type="text" placeholder="검색어를 입력하세요">
    <button class="ig-btn">검색</button>
  </div>
  <div class="input-group">
    <span class="ig-prefix">https://</span>
    <input class="ig-input" type="text" placeholder="example.com">
    <button class="ig-btn">복사</button>
  </div>
</div>`
    },
    {
      id: 'stat-cards',
      title: '통계 카드 대시보드',
      category: 'UI 컴포넌트',
      categoryColor: '#f1c948',
      desc: 'flex-wrap:wrap과 flex:1 1 120px(flex-grow+shrink+basis)를 함께 써서 카드가 화면 너비에 따라 자동으로 줄 바꿈되는 반응형 그리드를 만듭니다.',
      previewHeight: 130,
      css: `.stat-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px;
  background: #0a0c14;
}
.stat-card {
  flex: 1 1 120px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  background: #0f172a;
  border: 1px solid #1e2233;
  border-radius: 12px;
}
.stat-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #475569;
}
.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #e2e8f0;
  line-height: 1;
}
.stat-delta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
}
.delta-up { color: #48f1b0; }
.delta-down { color: #f16c48; }`,
      html: `<div class="stat-grid">
  <div class="stat-card">
    <div class="stat-label">총 방문자</div>
    <div class="stat-value">24.8K</div>
    <div class="stat-delta delta-up">↑ 12.5% 지난달 대비</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">전환율</div>
    <div class="stat-value">3.6%</div>
    <div class="stat-delta delta-down">↓ 0.8% 지난달 대비</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">매출</div>
    <div class="stat-value">₩2.1M</div>
    <div class="stat-delta delta-up">↑ 8.3% 지난달 대비</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">신규 가입</div>
    <div class="stat-value">1,204</div>
    <div class="stat-delta delta-up">↑ 21% 지난달 대비</div>
  </div>
</div>`
    },
  ];

  const CHALLENGES = [
    {
      id: 1, title: '정중앙 배치', difficulty: '⭐',
      desc: '아이템 3개를 컨테이너 정중앙(가로 & 세로 모두)에 배치하세요.',
      hint: 'justify-content: center + align-items: center 를 동시에 설정하세요.',
      target: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'center', alignItems:'center' },
      ignore: ['alignContent', 'gap'],
      itemCount: 3,
      colors: ['#6c63ff','#48b0f1','#f16c48'],
      miniStyle: { justifyContent:'center', alignItems:'center', height:'54px' },
    },
    {
      id: 2, title: '양끝 정렬 (네비게이션)', difficulty: '⭐',
      desc: '아이템을 좌우 양끝으로 나눠 배치하세요.',
      hint: 'justify-content: space-between 을 사용하세요.',
      target: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'space-between', alignItems:'center' },
      ignore: ['alignContent', 'gap'],
      itemCount: 3,
      colors: ['#6c63ff','#f1c948','#48b0f1'],
      miniStyle: { justifyContent:'space-between', alignItems:'center', height:'40px' },
    },
    {
      id: 3, title: '세로 쌓기 (열 방향)', difficulty: '⭐',
      desc: '아이템들이 세로로 쌓이도록 방향을 바꿔보세요.',
      hint: 'flex-direction: column 을 설정하세요.',
      target: { flexDirection:'column', flexWrap:'nowrap', justifyContent:'flex-start', alignItems:'stretch' },
      ignore: ['alignContent', 'gap'],
      itemCount: 3,
      colors: ['#6c63ff','#48b0f1','#f16c48'],
      miniStyle: { flexDirection:'column', alignItems:'stretch', gap:'4px', height:'70px' },
    },
    {
      id: 4, title: '줄 바꿈 그리드', difficulty: '⭐⭐',
      desc: '아이템이 넘치면 다음 줄로 내려가게 하세요.',
      hint: 'flex-wrap: wrap 을 설정하세요.',
      target: { flexDirection:'row', flexWrap:'wrap', justifyContent:'flex-start', alignItems:'flex-start' },
      ignore: ['alignContent', 'gap'],
      itemCount: 3,
      colors: ['#6c63ff','#48b0f1','#f16c48'],
      miniStyle: { flexWrap:'wrap', alignItems:'flex-start', gap:'4px', height:'auto' },
    },
    {
      id: 5, title: '균등 분배', difficulty: '⭐⭐',
      desc: '아이템 사이 간격을 포함해 모두 동일하게 분배하세요.',
      hint: 'justify-content: space-evenly 를 사용하세요.',
      target: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'space-evenly', alignItems:'center' },
      ignore: ['alignContent', 'gap'],
      itemCount: 4,
      colors: ['#6c63ff','#48b0f1','#f16c48','#48f1b0'],
      miniStyle: { justifyContent:'space-evenly', alignItems:'center', height:'44px' },
    },
    {
      id: 6, title: '역방향 배치', difficulty: '⭐⭐',
      desc: '아이템이 오른쪽에서 왼쪽 순서로 나타나게 하세요.',
      hint: 'flex-direction: row-reverse 를 설정하세요.',
      target: { flexDirection:'row-reverse', flexWrap:'nowrap', justifyContent:'flex-start', alignItems:'center' },
      ignore: ['alignContent', 'gap'],
      itemCount: 3,
      colors: ['#6c63ff','#48b0f1','#f16c48'],
      miniStyle: { flexDirection:'row-reverse', alignItems:'center', height:'44px' },
    },
    {
      id: 7, title: '하단 정렬', difficulty: '⭐⭐⭐',
      desc: '아이템을 컨테이너 아래쪽에 붙여 배치하세요.',
      hint: 'align-items: flex-end 를 사용하세요. (주축이 row일 때 교차축이 세로입니다)',
      target: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'flex-start', alignItems:'flex-end' },
      ignore: ['alignContent', 'gap'],
      itemCount: 3,
      colors: ['#6c63ff','#48b0f1','#f16c48'],
      miniStyle: { alignItems:'flex-end', height:'60px' },
    },
    {
      id: 8, title: '사이드바 레이아웃', difficulty: '⭐⭐⭐',
      desc: '첫 아이템은 고정 너비, 두 번째 아이템은 남은 공간을 채우게 하세요.',
      hint: 'align-items: stretch + (아이템2에 flex-grow:1 적용)',
      target: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'flex-start', alignItems:'stretch' },
      ignore: ['alignContent', 'gap'],
      itemCount: 2,
      colors: ['#6c63ff','#48b0f1'],
      miniStyle: { alignItems:'stretch', height:'52px' },
      itemWidths: ['40px','auto'],
      itemGrows: [0, 1],
    },
  ];

  const EXPLAIN_DATA_LEGACY = [
  {
    key: 'direction', name: 'flex-direction', section: 'parent',
    applyProp: 'flexDirection', short: '주축(main axis) 방향 설정',
    desc: '아이템이 나열되는 주축의 방향을 결정합니다. 방향이 바뀌면 justify-content와 align-items의 기준 축도 함께 바뀝니다.',
    note: null,
    values: [
      { val:'row', isDefault:true, desc:'왼쪽에서 오른쪽으로 수평 나열 (기본값)',
        demo:{ container:{flexDirection:'row',alignItems:'center',gap:'8px',height:'80px'}, items:[{w:54,h:54,label:'1'},{w:54,h:54,label:'2'},{w:54,h:54,label:'3'}] } },
      { val:'row-reverse', desc:'오른쪽에서 왼쪽으로 역방향 나열',
        demo:{ container:{flexDirection:'row-reverse',alignItems:'center',gap:'8px',height:'80px'}, items:[{w:54,h:54,label:'1'},{w:54,h:54,label:'2'},{w:54,h:54,label:'3'}] } },
      { val:'column', desc:'위에서 아래로 수직 나열',
        demo:{ container:{flexDirection:'column',alignItems:'stretch',gap:'6px',height:'160px'}, items:[{h:38,label:'1'},{h:38,label:'2'},{h:38,label:'3'}] } },
      { val:'column-reverse', desc:'아래에서 위로 역방향 수직 나열',
        demo:{ container:{flexDirection:'column-reverse',alignItems:'stretch',gap:'6px',height:'160px'}, items:[{h:38,label:'1'},{h:38,label:'2'},{h:38,label:'3'}] } },
    ]
  },
  {
    key: 'wrap', name: 'flex-wrap', section: 'parent',
    applyProp: 'flexWrap', short: '줄 넘김 여부',
    desc: '아이템이 컨테이너 너비를 초과할 때 다음 줄로 넘길지 결정합니다. 기본값 nowrap은 억지로 한 줄에 모두 넣습니다.',
    note: '💡 아이템을 많이 추가하고 wrap으로 바꿔보세요. 반응형 레이아웃에 유용합니다.',
    values: [
      { val:'nowrap', isDefault:true, desc:'한 줄 고정 — 아이템이 찌그러질 수 있음 (기본값)',
        demo:{ container:{flexWrap:'nowrap',alignItems:'center',gap:'6px',height:'70px'}, items:[{w:50,h:48,label:'1'},{w:50,h:48,label:'2'},{w:50,h:48,label:'3'},{w:50,h:48,label:'4'},{w:50,h:48,label:'5'}] } },
      { val:'wrap', desc:'넘치면 다음 줄로 이동 — 반응형 레이아웃에 필수',
        demo:{ container:{flexWrap:'wrap',alignItems:'flex-start',gap:'6px',height:'120px'}, items:[{w:50,h:48,label:'1'},{w:50,h:48,label:'2'},{w:50,h:48,label:'3'},{w:50,h:48,label:'4'},{w:50,h:48,label:'5'}] } },
      { val:'wrap-reverse', desc:'줄 넘김 방향이 반대 (새 줄이 위로 생김)',
        demo:{ container:{flexWrap:'wrap-reverse',alignItems:'flex-start',gap:'6px',height:'120px'}, items:[{w:50,h:48,label:'1'},{w:50,h:48,label:'2'},{w:50,h:48,label:'3'},{w:50,h:48,label:'4'},{w:50,h:48,label:'5'}] } },
    ]
  },
  {
    key: 'justify', name: 'justify-content', section: 'parent',
    applyProp: 'justifyContent', short: '주축 정렬 방식',
    desc: '아이템들 사이와 주변의 빈 공간을 어떻게 분배할지 결정합니다. 주축(flex-direction 방향)을 따라 정렬합니다.',
    note: '📐 주축(flex-direction 방향)을 따라 정렬합니다. row면 가로축, column이면 세로축.',
    values: [
      { val:'flex-start', isDefault:true, desc:'주축 시작점에 모두 모음 (기본값)',
        demo:{ container:{justifyContent:'flex-start',alignItems:'center',gap:'8px',height:'70px'}, items:[{w:48,h:48,label:'1'},{w:48,h:48,label:'2'},{w:48,h:48,label:'3'}] } },
      { val:'flex-end', desc:'주축 끝점에 모두 모음',
        demo:{ container:{justifyContent:'flex-end',alignItems:'center',gap:'8px',height:'70px'}, items:[{w:48,h:48,label:'1'},{w:48,h:48,label:'2'},{w:48,h:48,label:'3'}] } },
      { val:'center', desc:'주축 가운데에 모두 모음',
        demo:{ container:{justifyContent:'center',alignItems:'center',gap:'8px',height:'70px'}, items:[{w:48,h:48,label:'1'},{w:48,h:48,label:'2'},{w:48,h:48,label:'3'}] } },
      { val:'space-between', desc:'양 끝에 붙이고 아이템 사이만 균등 분배',
        demo:{ container:{justifyContent:'space-between',alignItems:'center',height:'70px'}, items:[{w:48,h:48,label:'1'},{w:48,h:48,label:'2'},{w:48,h:48,label:'3'}] } },
      { val:'space-around', desc:'각 아이템 양쪽에 동일 여백 (끝 = 중간 ÷ 2)',
        demo:{ container:{justifyContent:'space-around',alignItems:'center',height:'70px'}, items:[{w:48,h:48,label:'1'},{w:48,h:48,label:'2'},{w:48,h:48,label:'3'}] } },
      { val:'space-evenly', desc:'모든 간격(양 끝 포함)이 완전히 동일',
        demo:{ container:{justifyContent:'space-evenly',alignItems:'center',height:'70px'}, items:[{w:48,h:48,label:'1'},{w:48,h:48,label:'2'},{w:48,h:48,label:'3'}] } },
    ]
  },
  {
    key: 'alignItems', name: 'align-items', section: 'parent',
    applyProp: 'alignItems', short: '교차축 정렬 (한 줄)',
    desc: '한 줄 안에서 아이템들을 교차축 방향으로 어떻게 정렬할지 결정합니다. align-self로 개별 아이템을 덮어쓸 수 있습니다.',
    note: '📐 교차축(주축의 수직 방향)을 따라 정렬합니다. row면 세로축, column이면 가로축.',
    values: [
      { val:'stretch', isDefault:true, desc:'교차축 방향으로 가득 늘어남 (기본값) — height 없는 아이템에 적용',
        demo:{ container:{alignItems:'stretch',justifyContent:'flex-start',gap:'8px',height:'80px'}, items:[{w:54,label:'1'},{w:54,label:'2'},{w:54,label:'3'}] } },
      { val:'flex-start', desc:'교차축 시작점(위쪽)에 정렬',
        demo:{ container:{alignItems:'flex-start',justifyContent:'flex-start',gap:'8px',height:'80px'}, items:[{w:54,h:28,label:'1'},{w:54,h:52,label:'2'},{w:54,h:38,label:'3'}] } },
      { val:'flex-end', desc:'교차축 끝점(아래쪽)에 정렬',
        demo:{ container:{alignItems:'flex-end',justifyContent:'flex-start',gap:'8px',height:'80px'}, items:[{w:54,h:28,label:'1'},{w:54,h:52,label:'2'},{w:54,h:38,label:'3'}] } },
      { val:'center', desc:'교차축 가운데에 정렬',
        demo:{ container:{alignItems:'center',justifyContent:'flex-start',gap:'8px',height:'80px'}, items:[{w:54,h:28,label:'1'},{w:54,h:52,label:'2'},{w:54,h:38,label:'3'}] } },
      { val:'baseline', desc:'텍스트 기준선(baseline)에 맞춰 정렬',
        demo:{ container:{alignItems:'baseline',justifyContent:'flex-start',gap:'8px',height:'80px'}, items:[{w:46,h:26,label:'A',fontSize:'11px'},{w:46,h:52,label:'A',fontSize:'22px'},{w:46,h:38,label:'A',fontSize:'15px'}] } },
    ]
  },
  {
    key: 'alignContent', name: 'align-content', section: 'parent',
    applyProp: 'alignContent', short: '교차축 정렬 (여러 줄)',
    desc: '여러 줄로 감쌌을 때 줄 묶음 전체를 교차축 방향으로 어떻게 분배할지 결정합니다.',
    note: '⚠️ flex-wrap: wrap으로 줄이 2개 이상일 때만 효과가 있습니다. 한 줄이면 무시됩니다.',
    values: [
      { val:'flex-start', desc:'모든 줄을 교차축 시작점에 모음',
        demo:{ container:{flexWrap:'wrap',alignContent:'flex-start',gap:'6px',height:'130px'}, items:[{w:50,h:36,label:'1'},{w:50,h:36,label:'2'},{w:50,h:36,label:'3'},{w:50,h:36,label:'4'},{w:50,h:36,label:'5'}] } },
      { val:'center', desc:'모든 줄을 교차축 가운데로',
        demo:{ container:{flexWrap:'wrap',alignContent:'center',gap:'6px',height:'130px'}, items:[{w:50,h:36,label:'1'},{w:50,h:36,label:'2'},{w:50,h:36,label:'3'},{w:50,h:36,label:'4'},{w:50,h:36,label:'5'}] } },
      { val:'flex-end', desc:'모든 줄을 교차축 끝점에 모음',
        demo:{ container:{flexWrap:'wrap',alignContent:'flex-end',gap:'6px',height:'130px'}, items:[{w:50,h:36,label:'1'},{w:50,h:36,label:'2'},{w:50,h:36,label:'3'},{w:50,h:36,label:'4'},{w:50,h:36,label:'5'}] } },
      { val:'space-between', desc:'첫 줄은 위, 마지막 줄은 아래, 나머지 균등 분배',
        demo:{ container:{flexWrap:'wrap',alignContent:'space-between',gap:'0px 6px',height:'130px'}, items:[{w:50,h:36,label:'1'},{w:50,h:36,label:'2'},{w:50,h:36,label:'3'},{w:50,h:36,label:'4'},{w:50,h:36,label:'5'}] } },
      { val:'space-around', desc:'각 줄 위아래에 동일한 여백',
        demo:{ container:{flexWrap:'wrap',alignContent:'space-around',gap:'0px 6px',height:'130px'}, items:[{w:50,h:36,label:'1'},{w:50,h:36,label:'2'},{w:50,h:36,label:'3'},{w:50,h:36,label:'4'},{w:50,h:36,label:'5'}] } },
      { val:'stretch', desc:'각 줄이 남은 공간을 채우도록 늘어남',
        demo:{ container:{flexWrap:'wrap',alignContent:'stretch',gap:'0px 6px',height:'130px'}, items:[{w:50,label:'1'},{w:50,label:'2'},{w:50,label:'3'},{w:50,label:'4'},{w:50,label:'5'}] } },
    ]
  },
  {
    key: 'gap', name: 'gap', section: 'parent',
    applyProp: null, short: '아이템 사이 간격',
    desc: '아이템 사이의 간격을 설정합니다. margin과 달리 컨테이너 바깥쪽에는 적용되지 않습니다.',
    note: '💡 margin 대신 gap을 쓰면 마지막 아이템 여백 처리가 자동이라 훨씬 편합니다.',
    values: [
      { val:'gap: 0px', isDefault:false, desc:'아이템 사이 간격 없음',
        demo:{ container:{gap:'0px',alignItems:'center',height:'70px'}, items:[{w:54,h:54,label:'1'},{w:54,h:54,label:'2'},{w:54,h:54,label:'3'}] } },
      { val:'gap: 12px', isDefault:true, desc:'일반적으로 많이 쓰는 간격',
        demo:{ container:{gap:'12px',alignItems:'center',height:'70px'}, items:[{w:54,h:54,label:'1'},{w:54,h:54,label:'2'},{w:54,h:54,label:'3'}] } },
      { val:'gap: 24px', isDefault:false, desc:'넓은 간격',
        demo:{ container:{gap:'24px',alignItems:'center',height:'70px'}, items:[{w:54,h:54,label:'1'},{w:54,h:54,label:'2'},{w:54,h:54,label:'3'}] } },
      { val:'row-gap & column-gap', isDefault:false, desc:'행·열 간격을 각각 따로 설정 (gap: 8px 20px)',
        demo:{ container:{flexWrap:'wrap',rowGap:'8px',columnGap:'20px',alignItems:'flex-start',height:'110px'}, items:[{w:54,h:44,label:'1'},{w:54,h:44,label:'2'},{w:54,h:44,label:'3'},{w:54,h:44,label:'4'}] } },
    ]
  },
  {
    key: 'grow', name: 'flex-grow', section: 'child',
    applyProp: null, short: '남은 공간 차지 비율',
    desc: '컨테이너에 남은 공간이 있을 때 아이템이 얼마나 늘어날지를 비율로 설정합니다. 기본값 0이면 늘어나지 않습니다.',
    note: '💡 조작 탭에서 아이템을 선택하고 flex-grow 슬라이더를 올려보세요.',
    values: [
      { val:'flex-grow: 0', isDefault:true, desc:'늘어나지 않음 — 남은 공간이 비어있음 (기본값)',
        demo:{ container:{alignItems:'center',gap:'6px',height:'70px'}, items:[{w:60,h:54,grow:0,label:'0'},{w:60,h:54,grow:0,label:'0'},{w:60,h:54,grow:0,label:'0'}] } },
      { val:'flex-grow: 1', isDefault:false, desc:'남은 공간을 균등하게 나눔 (flex: 1 과 같은 효과)',
        demo:{ container:{alignItems:'center',gap:'6px',height:'70px'}, items:[{h:54,grow:1,label:'1'},{h:54,grow:1,label:'1'},{h:54,grow:1,label:'1'}] } },
      { val:'grow: 0 · 1 · 2 비교', isDefault:false, desc:'숫자 비율대로 남은 공간 분배 (2는 1의 2배)',
        demo:{ container:{alignItems:'center',gap:'6px',height:'70px'}, items:[{w:40,h:54,grow:0,label:'0'},{h:54,grow:1,label:'1'},{h:54,grow:2,label:'2'}] } },
    ]
  },
  {
    key: 'shrink', name: 'flex-shrink', section: 'child',
    applyProp: null, short: '공간 부족 시 줄어드는 비율',
    desc: '컨테이너가 아이템을 담기에 너무 좁을 때 얼마나 줄어들지 비율로 설정합니다. 기본값 1은 균등 축소를 의미합니다.',
    note: '⚠️ flex-shrink: 0 은 사이드바처럼 너비를 고정해야 하는 요소에 자주 사용합니다.',
    values: [
      { val:'flex-shrink: 0', isDefault:false, desc:'절대 줄어들지 않음 — 고정 크기 유지 (overflow 발생 가능)',
        demo:{ container:{flexWrap:'nowrap',alignItems:'center',gap:'6px',height:'70px'}, items:[{w:80,h:54,shrink:0,label:'0'},{w:80,h:54,shrink:0,label:'0'},{w:80,h:54,shrink:0,label:'0'}] } },
      { val:'flex-shrink: 1', isDefault:true, desc:'공간 부족 시 균등하게 줄어듦 (기본값)',
        demo:{ container:{flexWrap:'nowrap',alignItems:'center',gap:'6px',height:'70px'}, items:[{w:80,h:54,shrink:1,label:'1'},{w:80,h:54,shrink:1,label:'1'},{w:80,h:54,shrink:1,label:'1'}] } },
      { val:'shrink: 0 · 1 · 3 비교', isDefault:false, desc:'비율이 클수록 더 많이 줄어듦',
        demo:{ container:{flexWrap:'nowrap',alignItems:'center',gap:'6px',height:'70px'}, items:[{w:80,h:54,shrink:0,label:'0'},{w:80,h:54,shrink:1,label:'1'},{w:80,h:54,shrink:3,label:'3'}] } },
    ]
  },
  {
    key: 'basis', name: 'flex-basis', section: 'child',
    applyProp: null, short: '아이템의 기본 크기',
    desc: 'grow/shrink가 적용되기 전의 초기 크기입니다. width/height와 비슷하지만 주축 방향에 따라 자동으로 가로/세로에 적용됩니다.',
    note: null,
    values: [
      { val:'auto', isDefault:true, desc:'콘텐츠 크기 기준 (기본값) — width가 있으면 width 사용',
        demo:{ container:{alignItems:'center',gap:'6px',height:'70px'}, items:[{h:54,basis:'auto',label:'auto'},{h:54,basis:'auto',label:'auto'},{h:54,basis:'auto',label:'auto'}] } },
      { val:'120px', isDefault:false, desc:'명시적 픽셀 값으로 초기 크기 고정',
        demo:{ container:{alignItems:'center',gap:'6px',height:'70px'}, items:[{h:54,basis:'120px',label:'120px'},{h:54,basis:'120px',label:'120px'},{h:54,basis:'120px',label:'120px'}] } },
      { val:'0', isDefault:false, desc:'기본 크기 없이 grow 비율만으로 공간 분배',
        demo:{ container:{alignItems:'center',gap:'6px',height:'70px'}, items:[{h:54,basis:'0',grow:1,label:'basis:0\ngrow:1'},{h:54,basis:'0',grow:2,label:'basis:0\ngrow:2'},{h:54,basis:'0',grow:1,label:'basis:0\ngrow:1'}] } },
    ]
  },
  {
    key: 'flexShorthand', name: 'flex (단축 속성)', section: 'child',
    applyProp: null, short: 'grow · shrink · basis 한번에',
    desc: 'flex-grow, flex-shrink, flex-basis를 한 번에 선언하는 단축 속성입니다. 실무에서는 단축 속성을 더 많이 사용합니다.',
    note: '💡 flex: 1 이 가장 많이 쓰이는 패턴입니다. 남은 공간을 균등하게 나눌 때 사용합니다.',
    values: [
      { val:'flex: 0 1 auto', isDefault:true, desc:'= 기본값 (늘어나지 않고, 줄어들 수 있음)',
        demo:{ container:{alignItems:'center',gap:'6px',height:'70px'}, items:[{w:70,h:54,label:'0 1 auto'},{w:70,h:54,label:'0 1 auto'}] } },
      { val:'flex: 1', isDefault:false, desc:'= 1 1 0 — 남은 공간을 균등 분배 (가장 많이 사용)',
        demo:{ container:{alignItems:'center',gap:'6px',height:'70px'}, items:[{h:54,grow:1,label:'flex:1'},{h:54,grow:1,label:'flex:1'},{h:54,grow:1,label:'flex:1'}] } },
      { val:'flex: none', isDefault:false, desc:'= 0 0 auto — 고정 크기 (늘거나 줄지 않음)',
        demo:{ container:{alignItems:'center',gap:'6px',height:'70px'}, items:[{w:80,h:54,grow:0,shrink:0,label:'none'},{w:80,h:54,grow:0,shrink:0,label:'none'}] } },
      { val:'flex: 1 0 160px', isDefault:false, desc:'사이드바 패턴 — 160px 기준, 늘어날 수 있고 안 줄어듦',
        demo:{ container:{alignItems:'stretch',gap:'6px',height:'70px'}, items:[{basis:'80px',shrink:0,label:'사이드바'},{grow:1,label:'메인'}] } },
    ]
  },
  {
    key: 'alignSelf', name: 'align-self', section: 'child',
    applyProp: 'alignSelf', short: '개별 아이템 교차축 정렬',
    desc: '컨테이너의 align-items 설정과 관계없이 특정 아이템 하나만 따로 정렬할 때 사용합니다. 부모의 align-items를 이 아이템에 한해 덮어씁니다.',
    note: '💡 조작 탭에서 아이템을 선택하면 align-self를 개별로 바꿔볼 수 있습니다.',
    values: [
      { val:'auto', isDefault:true, desc:'부모의 align-items 값을 그대로 상속 (기본값)',
        demo:{ container:{alignItems:'flex-start',gap:'8px',height:'80px'}, items:[{w:54,h:40,label:'1'},{w:54,h:40,label:'2'},{w:54,h:40,label:'3'}] } },
      { val:'flex-start', isDefault:false, desc:'이 아이템만 교차축 시작점(위쪽)으로', highlight:1,
        demo:{ container:{alignItems:'center',gap:'8px',height:'80px'}, items:[{w:54,h:40,label:'1'},{w:54,h:40,label:'2★',alignSelf:'flex-start',highlight:true},{w:54,h:40,label:'3'}] } },
      { val:'flex-end', isDefault:false, desc:'이 아이템만 교차축 끝점(아래쪽)으로', highlight:1,
        demo:{ container:{alignItems:'center',gap:'8px',height:'80px'}, items:[{w:54,h:40,label:'1'},{w:54,h:40,label:'2★',alignSelf:'flex-end',highlight:true},{w:54,h:40,label:'3'}] } },
      { val:'center', isDefault:false, desc:'이 아이템만 교차축 가운데로', highlight:1,
        demo:{ container:{alignItems:'flex-start',gap:'8px',height:'80px'}, items:[{w:54,h:40,label:'1'},{w:54,h:40,label:'2★',alignSelf:'center',highlight:true},{w:54,h:40,label:'3'}] } },
      { val:'stretch', isDefault:false, desc:'이 아이템만 교차축으로 꽉 채움', highlight:1,
        demo:{ container:{alignItems:'flex-start',gap:'8px',height:'80px'}, items:[{w:54,h:40,label:'1'},{w:54,label:'2★',alignSelf:'stretch',highlight:true},{w:54,h:40,label:'3'}] } },
    ]
  },
  {
    key: 'order', name: 'order', section: 'child',
    applyProp: null, short: '아이템 배치 순서',
    desc: 'HTML 구조를 바꾸지 않고 시각적 순서만 변경합니다. 숫자가 작을수록 앞에 배치되며 기본값은 0입니다.',
    note: '⚠️ order는 시각적 순서만 바꿉니다. 스크린 리더와 탭 순서는 HTML 순서를 따르므로 접근성에 주의하세요.',
    values: [
      { val:'order: 0 (기본)', isDefault:true, desc:'HTML 순서 그대로 배치 (기본값)',
        demo:{ container:{alignItems:'center',gap:'8px',height:'70px'}, items:[{w:54,h:54,order:0,label:'1'},{w:54,h:54,order:0,label:'2'},{w:54,h:54,order:0,label:'3'}] } },
      { val:'order 음수 → 맨 앞', isDefault:false, desc:'음수 order는 기본(0) 아이템보다 앞에 위치',
        demo:{ container:{alignItems:'center',gap:'8px',height:'70px'}, items:[{w:54,h:54,order:0,label:'1'},{w:54,h:54,order:0,label:'2'},{w:54,h:54,order:-1,label:'3★',highlight:true}] } },
      { val:'순서 재배치', isDefault:false, desc:'HTML은 1·2·3이지만 order로 2·3·1로 표시',
        demo:{ container:{alignItems:'center',gap:'8px',height:'70px'}, items:[{w:54,h:54,order:3,label:'1'},{w:54,h:54,order:1,label:'2'},{w:54,h:54,order:2,label:'3'}] } },
    ]
  },
];

  const EXPLAIN_DATA = {
    direction: {
      prop: 'flex-direction', jsProp: 'flexDirection', type: 'container',
      desc: '주축(main axis)의 방향을 설정합니다. 기본값은 <code>row</code>로 가로(왼→오)로 배치됩니다.',
      tip: '방향이 바뀌면 justify-content와 align-items의 축도 함께 바뀝니다!',
      values: [
        { val: 'row',            desc: '왼쪽 → 오른쪽 (기본값)' },
        { val: 'row-reverse',    desc: '오른쪽 → 왼쪽' },
        { val: 'column',         desc: '위 → 아래 (세로 쌓기)' },
        { val: 'column-reverse', desc: '아래 → 위 (역방향)' },
      ]
    },
    wrap: {
      prop: 'flex-wrap', jsProp: 'flexWrap', type: 'container',
      desc: '아이템이 한 줄에 다 들어가지 못할 때 <strong>줄 바꿈</strong> 여부를 설정합니다.',
      tip: '반응형 카드 레이아웃에서 <code>wrap</code>을 자주 씁니다.',
      values: [
        { val: 'nowrap',       desc: '줄 바꿈 없음, 한 줄에 강제 배치 (기본값)' },
        { val: 'wrap',         desc: '넘치면 다음 줄로 바꿈' },
        { val: 'wrap-reverse', desc: '넘치면 위쪽 줄로 역방향 바꿈' },
      ]
    },
    justify: {
      prop: 'justify-content', jsProp: 'justifyContent', type: 'container',
      desc: '<strong>주축(main axis)</strong> 방향으로 아이템을 어떻게 배치할지 정렬 방식을 설정합니다.',
      tip: 'flex-direction이 row이면 가로 정렬, column이면 세로 정렬을 담당합니다.',
      values: [
        { val: 'flex-start',    desc: '주축 시작점 기준 정렬 (기본값)' },
        { val: 'flex-end',      desc: '주축 끝점 기준 정렬' },
        { val: 'center',        desc: '주축 가운데 정렬' },
        { val: 'space-between', desc: '첫·끝은 끝에, 사이 간격 균등 분배' },
        { val: 'space-around',  desc: '각 아이템 양쪽에 균등 여백 (끝은 절반)' },
        { val: 'space-evenly',  desc: '모든 간격(끝 포함) 완전 균등' },
      ]
    },
    alignItems: {
      prop: 'align-items', jsProp: 'alignItems', type: 'container',
      desc: '<strong>교차축(cross axis)</strong> 방향으로 한 줄 내 아이템들을 정렬합니다.',
      tip: 'flex-direction이 row이면 세로 정렬, column이면 가로 정렬을 담당합니다.',
      values: [
        { val: 'stretch',    desc: '교차축을 꽉 채우도록 늘림 (기본값)' },
        { val: 'flex-start', desc: '교차축 시작점 정렬' },
        { val: 'flex-end',   desc: '교차축 끝점 정렬' },
        { val: 'center',     desc: '교차축 가운데 정렬' },
        { val: 'baseline',   desc: '텍스트 기준선(baseline) 맞춤' },
      ]
    },
    alignContent: {
      prop: 'align-content', jsProp: 'alignContent', type: 'container',
      desc: '<strong>여러 줄</strong>이 생겼을 때 줄들을 교차축 방향으로 정렬합니다. <code>flex-wrap: wrap</code>일 때만 효과가 있습니다.',
      tip: 'align-items는 한 줄 내 정렬, align-content는 여러 줄 사이 정렬입니다.',
      values: [
        { val: 'normal',        desc: '기본값 (stretch처럼 동작)' },
        { val: 'flex-start',    desc: '교차축 시작점 정렬' },
        { val: 'flex-end',      desc: '교차축 끝점 정렬' },
        { val: 'center',        desc: '교차축 가운데 정렬' },
        { val: 'space-between', desc: '첫·끝 줄은 끝에, 사이 간격 균등' },
        { val: 'space-around',  desc: '각 줄 양쪽에 균등 여백' },
        { val: 'stretch',       desc: '줄들이 교차축을 꽉 채움' },
      ]
    },
    gap: {
      prop: 'gap', jsProp: 'gap', type: 'container',
      desc: '아이템 사이의 간격(row-gap + column-gap)을 한번에 설정합니다. <code>margin</code>보다 깔끔합니다.',
      tip: '<code>gap: 10px 20px</code>처럼 row/column 따로 지정할 수도 있습니다.',
      values: [
        { val: '0px',  gapNum: 0,  desc: '간격 없음' },
        { val: '8px',  gapNum: 8,  desc: '기본 간격' },
        { val: '16px', gapNum: 16, desc: '넓은 간격' },
        { val: '24px', gapNum: 24, desc: '더 넓은 간격' },
      ]
    },
    grow: {
      prop: 'flex-grow', jsProp: 'flexGrow', type: 'item',
      desc: '남은 공간을 아이템이 얼마나 차지할지 비율을 설정합니다. <code>0</code>이면 늘어나지 않습니다.',
      tip: '여러 아이템에 각각 다른 grow 값을 주면 비율대로 공간이 분배됩니다.',
      values: [
        { val: 0, desc: '늘어나지 않음 (기본값)' },
        { val: 1, desc: '남은 공간을 균등하게 차지' },
        { val: 2, desc: 'grow:1 아이템의 2배 공간 차지' },
      ]
    },
    shrink: {
      prop: 'flex-shrink', jsProp: 'flexShrink', type: 'item',
      desc: '컨테이너가 좁아질 때 아이템이 얼마나 줄어들지 비율을 설정합니다. 기본값 <code>1</code>은 동등하게 줄어듦.',
      tip: '<code>flex-shrink: 0</code>으로 아이템 크기를 고정할 수 있습니다. 네비바 로고 등에 유용합니다.',
      values: [
        { val: 1, desc: '기본적으로 줄어듦 (기본값)' },
        { val: 0, desc: '줄어들지 않음 (고정 크기)' },
        { val: 2, desc: '다른 아이템보다 2배 빠르게 줄어듦' },
      ]
    },
    basis: {
      prop: 'flex-basis', jsProp: 'flexBasis', type: 'item',
      desc: 'grow/shrink 적용 전 아이템의 기본 크기를 설정합니다. <code>auto</code>이면 콘텐츠 크기나 width를 따릅니다.',
      tip: '<code>flex: 1 1 0</code>처럼 basis를 0으로 하면 모든 아이템을 동일한 비율로 만들 수 있습니다.',
      values: [
        { val: 'auto',  desc: '콘텐츠 크기 또는 width 사용 (기본값)' },
        { val: '80px',  desc: '80px 고정 기본 크기' },
        { val: '140px', desc: '140px 고정 기본 크기' },
        { val: '50%',   desc: '컨테이너의 50% 기본 크기' },
      ]
    },
    flexShorthand: {
      prop: 'flex', jsProp: null, type: 'item',
      desc: '<code>flex-grow</code> · <code>flex-shrink</code> · <code>flex-basis</code>를 한 줄로 쓰는 단축 속성입니다.',
      tip: '<code>flex: 1</code>은 <code>flex: 1 1 0</code>과 같습니다. 레이아웃에서 가장 자주 쓰는 패턴!',
      values: [
        { val: '0 1 auto', label: 'flex: 0 1 auto', desc: '기본값 — grow 안 함, 필요하면 shrink, auto 크기' },
        { val: '1',        label: 'flex: 1',         desc: '남은 공간 전부 채움 (= flex: 1 1 0)' },
        { val: 'auto',     label: 'flex: auto',      desc: '콘텐츠 크기 기반 grow/shrink 모두 허용' },
        { val: 'none',     label: 'flex: none',      desc: 'grow/shrink 없음, 크기 완전 고정' },
      ]
    },
    alignSelf: {
      prop: 'align-self', jsProp: 'alignSelf', type: 'item',
      desc: '개별 아이템의 교차축 정렬을 설정합니다. 부모의 <code>align-items</code>를 이 아이템에 한해 덮어씁니다.',
      tip: '한 아이템만 다른 위치에 배치하고 싶을 때 사용합니다.',
      values: [
        { val: 'auto',       desc: '부모 align-items를 따름 (기본값)' },
        { val: 'flex-start', desc: '이 아이템만 교차축 시작점' },
        { val: 'flex-end',   desc: '이 아이템만 교차축 끝점' },
        { val: 'center',     desc: '이 아이템만 교차축 가운데' },
        { val: 'stretch',    desc: '이 아이템만 교차축을 꽉 채움' },
      ]
    },
    order: {
      prop: 'order', jsProp: 'order', type: 'item',
      desc: '아이템의 배치 순서를 변경합니다. 기본값 <code>0</code>이며, 값이 작을수록 앞에 배치됩니다.',
      tip: 'HTML 소스 순서를 바꾸지 않고도 시각적 배치 순서를 바꿀 수 있습니다.',
      values: [
        { val:  0, label: 'order: 0',  desc: '기본 순서 (기본값)' },
        { val: -1, label: 'order: -1', desc: '다른 0 아이템보다 앞으로' },
        { val:  1, label: 'order: 1',  desc: '다른 0 아이템보다 뒤로' },
        { val:  2, label: 'order: 2',  desc: '가장 뒤로 이동' },
      ]
    },
  };
