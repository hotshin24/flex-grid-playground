/**
 * topics/flex/examples.js — 실전 예제 18건 (F-08)
 *
 * v0.1 js/data.js 의 EXAMPLES 를 옮겼다. 제목 · 설명 · css · html 은 한 글자도
 * 고치지 않았다. 회귀 검증(PRD 7.1)에서 v0.1 화면과 나란히 대조해야 한다.
 *
 * categoryColor 는 떼어냈다. v0.1 은 카테고리 색을 hex 리터럴로 들고 있어
 * CLAUDE.md 규칙 5 를 어긴다. 게다가 그 값이 카테고리와 일대일도 아니었다 —
 * '폼' 두 건이 서로 다른 색(#f16c48 · #48f1b0)을 쓰고, 그중 하나는 '반응형'과
 * 같은 색이었다. 옮겨봐야 어긋난 표를 옮기는 셈이다.
 *
 * 색은 데이터가 아니라 표시 방식이므로 css/components.css 가 정한다.
 * ui/examples.js 가 카테고리 순번을 data-category 에 실어 주고, CSS 가 그 번호로
 * --fgp-item-1..8 semantic 별칭을 고른다. 카테고리가 늘어도 이 파일은 그대로다.
 *
 * css · html 문자열 안의 색상 리터럴은 예제 콘텐츠다. 우리 스타일시트가 아니라
 * 사용자에게 보여 줄 코드이므로 규칙 5 의 대상이 아니다.
 */

export const FLEX_EXAMPLES = [
    {
      id: 'nav',
      title: '네비게이션 바',
      category: '레이아웃',
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

export default FLEX_EXAMPLES;
