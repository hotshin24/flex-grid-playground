/**
 * topics/grid/challenges.js — CSS Grid 챌린지 40건 (GR-08)
 *
 * Flex 챌린지(topics/flex/challenges.js)와 같은 형식이다. 다만 성격이 다르다 —
 * Flex 40건 중 1~8 은 v0.1 js/data.js 에서 옮겨 온 것이고 9~40 이 v1.0 신규다.
 * 이 40건은 전부 v1.0 신규 작성이라 글자 단위로 대조할 원본이 없다. 그래서
 * tools/check-challenges.mjs 의 Grid 검증은 이관 대조 대신 설계 규칙 검사다.
 *
 * ignore 는 두지 않는다. target 에 없는 키는 애초에 채점되지 않으므로 ignore 는
 * 무효다. Flex 40건은 그 사실을 모른 채 쓰인 것이 남아 있을 뿐이다.
 *
 * target 키는 컨테이너 속성만 쓴다. 아이템 속성 7건은 챌린지 탭에서 컨트롤이
 * 서지 않고 checkAnswer 도 items 를 보지 않는다. length 4종(row-gap ·
 * column-gap · grid-auto-columns · grid-auto-rows)도 쓰지 않는다 — 값 공간이
 * 사실상 무한이라 좋은 문제가 나오지 않는다.
 *
 * 다루지 않는 개념이 둘 있다. grid-template-areas 와 dense 다. 둘 다 아이템에
 * grid-area · span 을 줘야 그림이 되는데 챌린지 탭은 컨테이너 속성만 다룬다.
 * areas 는 이름만 있고 아이템이 안 들어간 행이 높이 0으로 접혔고, dense 는 빈
 * 칸을 만들 수단이 없어 dense 없는 값과 같은 그림이었다. 정답 판정은 되지만
 * 맞혀도 화면이 답을 보여 주지 못해 문제로 두지 않는다. 두 개념은 속성 설명
 * 탭이 전용 데모로 다루므로 학습 경로는 끊기지 않는다.
 *
 * 설계 규칙 세 가지. 어기면 정답을 맞혀도 그림이 변하지 않는다.
 *   1. 세로 정렬(alignItems·alignContent)을 물으면 gridTemplateRows 를 함께 정한다.
 *      행이 auto 면 늘어날 자리가 없어 start 와 stretch 가 같은 그림이다.
 *   2. 트랙 전체 정렬(justifyContent·alignContent)을 물으면 트랙을 고정 단위로 둔다.
 *      fr 이면 트랙이 폭을 다 써서 정렬할 여백이 없다.
 *   3. track-list 값은 펼쳐서 적는다. repeat() 은 파서를 지나며 값이 손실된다.
 *      '1fr 1fr 1fr' (O) / 'repeat(3, 1fr)' (X)
 *
 * 이 파일에 색 값이 없다. 목표 미리보기의 아이템 색은 accents 순번을
 * --fgp-item-N 별칭으로 옮길 뿐이다. miniStyle 의 px 는 목표 판의 축소 비율이라
 * --sp-* 토큰으로 옮기지 않는다 — 간격이 아니라 그림의 치수다.
 */

export const GRID_CHALLENGES = [
  /* ===================== ⭐ 단일 개념 (1~8) ===================== */
  {
    id: 1, title: '2열 만들기', difficulty: '⭐',
    desc: '아이템 6개가 2열로 놓이게 하세요. 두 열은 같은 너비를 갖습니다.',
    hint: 'fr 은 남은 공간을 나누는 단위입니다. 같은 값을 두 번 두면 반씩 나눠 갖습니다.',
    target: { gridTemplateColumns: '1fr 1fr' },
    itemCount: 6,
    accents: [1, 2, 3, 4, 5, 6],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', height: '56px' },
  },
  {
    id: 2, title: '사이드바 + 본문', difficulty: '⭐',
    desc: '왼쪽은 200px 고정, 오른쪽은 남은 공간을 전부 차지하게 하세요.',
    hint: '고정 폭은 px, 나머지를 채우는 쪽은 fr 입니다.',
    target: { gridTemplateColumns: '200px 1fr' },
    itemCount: 2,
    accents: [2, 4],
    miniStyle: { display: 'grid', gridTemplateColumns: '60px 1fr', gap: '4px', height: '48px' },
  },
  {
    id: 3, title: '2행 만들기', difficulty: '⭐',
    desc: '행 두 개를 각각 80px 높이로 정하세요.',
    hint: '열과 마찬가지로 행도 트랙 목록으로 정합니다.',
    target: { gridTemplateRows: '80px 80px' },
    itemCount: 6,
    accents: [3, 4, 5, 6, 7, 8],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '26px 26px', gap: '4px', height: '60px' },
  },
  {
    id: 4, title: '셀 안 가로 가운데', difficulty: '⭐',
    desc: '각 아이템을 자기 셀 안에서 가로 가운데에 두세요. 아이템은 내용만큼만 차지합니다.',
    hint: '셀 안 가로 정렬은 justify-items 가 맡습니다.',
    target: { gridTemplateColumns: '1fr 1fr 1fr', justifyItems: 'center' },
    itemCount: 6,
    accents: [1, 3, 5, 7, 2, 4],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', justifyItems: 'center', gap: '4px', height: '56px' },
  },
  {
    id: 5, title: '셀 안 오른쪽', difficulty: '⭐',
    desc: '각 아이템을 자기 셀의 오른쪽 끝에 붙이세요.',
    hint: 'Grid 에서는 flex-end 가 아니라 end 입니다. Flex 와 값 이름이 다릅니다.',
    target: { gridTemplateColumns: '1fr 1fr 1fr', justifyItems: 'end' },
    itemCount: 6,
    accents: [8, 7, 6, 5, 4, 3],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', justifyItems: 'end', gap: '4px', height: '56px' },
  },
  {
    id: 6, title: '셀 안 세로 가운데', difficulty: '⭐',
    desc: '행 높이를 120px 로 정하고, 각 아이템을 셀 안 세로 가운데에 두세요.',
    hint: '행이 auto 면 늘어날 자리가 없어 차이가 보이지 않습니다. 높이를 먼저 정하세요.',
    target: { gridTemplateRows: '120px', alignItems: 'center' },
    itemCount: 3,
    accents: [2, 5, 8],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '52px', alignItems: 'center', gap: '4px', height: '60px' },
  },
  {
    id: 7, title: '셀 안 아래쪽', difficulty: '⭐',
    desc: '행 높이를 120px 로 정하고, 각 아이템을 셀 바닥에 붙이세요.',
    hint: '세로 정렬은 align-items 입니다. 값 이름은 end 입니다.',
    target: { gridTemplateRows: '120px', alignItems: 'end' },
    itemCount: 3,
    accents: [4, 6, 1],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '52px', alignItems: 'end', gap: '4px', height: '60px' },
  },
  {
    id: 8, title: '열 방향으로 채우기', difficulty: '⭐',
    desc: '아이템이 가로가 아니라 세로 방향으로 먼저 채워지게 하세요.',
    hint: '자동 배치 방향을 정하는 속성이 따로 있습니다.',
    target: { gridAutoFlow: 'column' },
    itemCount: 6,
    accents: [1, 2, 3, 4, 5, 6],
    miniStyle: { display: 'grid', gridTemplateRows: '24px 24px', gridAutoFlow: 'column', gap: '4px', height: '56px' },
  },

  /* ===================== ⭐⭐ 두 개념 조합 (9~15) ===================== */
  {
    id: 9, title: '그리드 전체 가로 가운데', difficulty: '⭐⭐',
    desc: '열 세 개를 각각 80px 로 정하고, 그리드 전체를 컨테이너 가로 가운데에 두세요.',
    hint: '트랙이 fr 이면 폭을 다 써서 정렬할 여백이 없습니다. 고정 단위로 바꿔야 합니다.',
    target: { gridTemplateColumns: '80px 80px 80px', justifyContent: 'center' },
    itemCount: 6,
    accents: [3, 3, 3, 5, 5, 5],
    miniStyle: { display: 'grid', gridTemplateColumns: '24px 24px 24px', justifyContent: 'center', gap: '4px', height: '56px' },
  },
  {
    id: 10, title: '그리드 전체 양끝', difficulty: '⭐⭐',
    desc: '열 세 개를 80px 로 정하고, 첫 열은 왼쪽 끝 마지막 열은 오른쪽 끝에 붙이세요.',
    hint: '남는 공간을 트랙 사이에 나눠 넣는 값입니다.',
    target: { gridTemplateColumns: '80px 80px 80px', justifyContent: 'space-between' },
    itemCount: 6,
    accents: [1, 4, 7, 2, 5, 8],
    miniStyle: { display: 'grid', gridTemplateColumns: '24px 24px 24px', justifyContent: 'space-between', gap: '4px', height: '56px' },
  },
  {
    id: 11, title: '그리드 전체 세로 가운데', difficulty: '⭐⭐',
    desc: '행 두 개를 각각 60px 로 정하고, 그리드 전체를 컨테이너 세로 가운데에 두세요.',
    hint: '줄 뭉치 전체를 세로로 움직이는 속성입니다. 각 셀 안 정렬과는 다릅니다.',
    target: { gridTemplateRows: '60px 60px', alignContent: 'center' },
    itemCount: 6,
    accents: [6, 6, 6, 2, 2, 2],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '18px 18px', alignContent: 'center', gap: '4px', height: '60px' },
  },
  {
    id: 12, title: '셀 안 정중앙', difficulty: '⭐⭐',
    desc: '행 높이를 120px 로 정하고, 각 아이템을 셀 안 가로·세로 모두 가운데에 두세요.',
    hint: 'Grid 는 가로와 세로를 따로 정합니다. 두 속성을 함께 써야 합니다.',
    target: { gridTemplateRows: '120px', justifyItems: 'center', alignItems: 'center' },
    itemCount: 3,
    accents: [1, 5, 3],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '52px', justifyItems: 'center', alignItems: 'center', gap: '4px', height: '60px' },
  },
  {
    id: 13, title: '열 우선 + 셀 가운데', difficulty: '⭐⭐',
    desc: '아이템이 세로 방향으로 먼저 채워지고, 각 아이템은 셀 안 가로 가운데에 놓이게 하세요.',
    hint: '배치 방향과 셀 안 정렬은 서로 다른 속성입니다.',
    target: { gridAutoFlow: 'column', justifyItems: 'center' },
    itemCount: 6,
    accents: [7, 8, 1, 2, 3, 4],
    miniStyle: { display: 'grid', gridTemplateRows: '24px 24px', gridAutoFlow: 'column', justifyItems: 'center', gap: '4px', height: '56px' },
  },
  {
    id: 14, title: '최소 폭이 있는 열', difficulty: '⭐⭐',
    desc: '첫 열은 최소 120px 을 지키되 남으면 늘어나고, 둘째 열은 남은 공간을 차지하게 하세요.',
    hint: 'minmax 는 최솟값과 최댓값을 함께 정합니다.',
    target: { gridTemplateColumns: 'minmax(120px, 1fr) 1fr' },
    itemCount: 4,
    accents: [5, 6, 5, 6],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', height: '52px' },
  },
  {
    id: 15, title: '양옆은 내용만큼', difficulty: '⭐⭐',
    desc: '양쪽 열은 내용 크기만큼만 차지하고 가운데 열이 남은 공간을 전부 갖게 하세요.',
    hint: 'auto 는 내용 크기를 따릅니다. 헤더의 로고·메뉴·버튼 배치에 자주 쓰는 조합입니다.',
    target: { gridTemplateColumns: 'auto 1fr auto' },
    itemCount: 3,
    accents: [2, 3, 4],
    miniStyle: { display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '4px', height: '48px' },
  },

  /* ================= ⭐⭐⭐ 세 개념 이상 (16~20) ================= */
  {
    id: 16, title: '카드 판 정중앙', difficulty: '⭐⭐⭐',
    desc: '양옆은 120px 고정, 가운데는 남은 공간을 갖는 3열 2행 판을 만들고, 각 아이템을 셀 안 가로·세로 정중앙에 두세요.',
    hint: '트랙 정의 두 개와 셀 안 정렬 두 개, 네 속성을 씁니다.',
    target: {
      gridTemplateColumns: '120px 1fr 120px',
      gridTemplateRows: '60px 60px',
      justifyItems: 'center',
      alignItems: 'center',
    },
    itemCount: 6,
    accents: [4, 2, 6, 1, 5, 3],
    miniStyle: {
      display: 'grid',
      gridTemplateColumns: '26px 1fr 26px',
      gridTemplateRows: '18px 18px',
      justifyItems: 'center',
      alignItems: 'center',
      gap: '3px',
      height: '60px',
    },
  },
  {
    id: 17, title: '사방 양끝 분배', difficulty: '⭐⭐⭐',
    desc: '열 셋과 행 둘을 모두 고정 크기로 두고, 가로·세로 모두 첫 트랙은 시작 끝 트랙은 끝에 붙이며 남는 공간을 사이에 넣으세요.',
    hint: '두 축 모두 트랙이 고정 단위여야 여백이 생깁니다. 같은 이름의 값을 가로·세로에 각각 씁니다.',
    target: {
      gridTemplateColumns: '100px 100px 100px',
      gridTemplateRows: '50px 50px',
      justifyContent: 'space-between',
      alignContent: 'space-between',
    },
    itemCount: 6,
    accents: [1, 7, 1, 7, 1, 7],
    miniStyle: {
      display: 'grid',
      gridTemplateColumns: '22px 22px 22px',
      gridTemplateRows: '16px 16px',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      gap: '3px',
      height: '60px',
    },
  },
  {
    id: 18, title: '오른쪽 아래로 몰기', difficulty: '⭐⭐⭐',
    desc: '가운데 열이 양옆의 두 배인 3열 2행 판을 만들고, 각 아이템을 셀의 오른쪽 아래 구석에 붙이세요.',
    hint: 'fr 은 비율입니다. 셀 안 가로와 세로 정렬은 서로 다른 속성이고 값 이름은 end 입니다.',
    target: {
      gridTemplateColumns: '1fr 2fr 1fr',
      gridTemplateRows: '70px 70px',
      justifyItems: 'end',
      alignItems: 'end',
    },
    itemCount: 6,
    accents: [8, 3, 8, 3, 8, 3],
    miniStyle: {
      display: 'grid',
      gridTemplateColumns: '1fr 2fr 1fr',
      gridTemplateRows: '20px 20px',
      justifyItems: 'end',
      alignItems: 'end',
      gap: '3px',
      height: '60px',
    },
  },
  {
    id: 19, title: '양축 트랙 정렬', difficulty: '⭐⭐⭐',
    desc: '열과 행을 모두 고정 크기로 두고, 가로·세로 양쪽 모두 간격이 완전히 균등하게 배치하세요.',
    hint: '두 축 모두 트랙이 고정 단위여야 여백이 생깁니다. 바깥 여백까지 같아야 하는 값입니다.',
    target: {
      gridTemplateColumns: '80px 80px 80px',
      gridTemplateRows: '60px 60px',
      justifyContent: 'space-evenly',
      alignContent: 'space-evenly',
    },
    itemCount: 6,
    accents: [3, 5, 7, 4, 6, 8],
    miniStyle: { display: 'grid', gridTemplateColumns: '24px 24px 24px', gridTemplateRows: '18px 18px', justifyContent: 'space-evenly', alignContent: 'space-evenly', gap: '4px', height: '60px' },
  },
  {
    id: 20, title: '완성형 카드 판', difficulty: '⭐⭐⭐',
    desc: '3열 2행 판을 만들고, 각 아이템을 셀 안 정중앙에 두며, 그리드 전체는 세로 가운데에 오게 하세요.',
    hint: '셀 안 정렬과 그리드 전체 정렬은 서로 다른 층입니다. 네 속성을 모두 씁니다.',
    target: {
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '80px 80px',
      justifyItems: 'center',
      alignItems: 'center',
      alignContent: 'center',
    },
    itemCount: 6,
    accents: [1, 2, 3, 4, 5, 6],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '22px 22px', justifyItems: 'center', alignItems: 'center', alignContent: 'center', gap: '4px', height: '60px' },
  },

  /* ===================== ⭐ 단일 개념 (21~28) ===================== */
  {
    id: 21, title: '4열 만들기', difficulty: '⭐',
    desc: '아이템 8개가 4열로 놓이게 하세요. 각 열은 같은 너비입니다.',
    hint: '같은 값을 네 번 적습니다. repeat 축약은 표시용이므로 펼쳐서 적어도 같습니다.',
    target: { gridTemplateColumns: '1fr 1fr 1fr 1fr' },
    itemCount: 8,
    accents: [1, 2, 3, 4, 5, 6, 7, 8],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '3px', height: '52px' },
  },
  {
    id: 22, title: '2:1 비율 두 열', difficulty: '⭐',
    desc: '왼쪽 열이 오른쪽 열의 두 배 너비를 갖게 하세요.',
    hint: 'fr 은 비율입니다. 2와 1을 주면 2:1로 나눠 갖습니다.',
    target: { gridTemplateColumns: '2fr 1fr' },
    itemCount: 4,
    accents: [3, 6, 3, 6],
    miniStyle: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4px', height: '48px' },
  },
  {
    id: 23, title: '내용만큼만 좁은 열', difficulty: '⭐',
    desc: '첫 열은 내용이 들어갈 수 있는 가장 좁은 너비로, 둘째 열은 남은 공간을 차지하게 하세요.',
    hint: 'auto 는 내용에 맞추되 남으면 늘어납니다. 가장 좁게 붙이는 값은 따로 있습니다.',
    target: { gridTemplateColumns: 'min-content 1fr' },
    itemCount: 4,
    accents: [7, 2, 7, 2],
    miniStyle: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px', height: '48px' },
  },
  {
    id: 24, title: '내용을 다 펼치는 열', difficulty: '⭐',
    desc: '첫 열이 줄바꿈 없이 내용을 다 펼칠 만큼 넓어지게 하고, 둘째 열은 나머지를 갖게 하세요.',
    hint: 'min-content 의 반대편에 있는 값입니다.',
    target: { gridTemplateColumns: 'max-content 1fr' },
    itemCount: 4,
    accents: [4, 8, 4, 8],
    miniStyle: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px', height: '48px' },
  },
  {
    id: 25, title: '셀 높이를 꽉 채우기', difficulty: '⭐',
    desc: '행 높이를 120px 로 정하고, 각 아이템이 그 높이를 남김없이 채우게 하세요.',
    hint: '행이 auto 면 늘어날 자리가 없어 start 와 구분되지 않습니다. 높이를 먼저 정하세요.',
    target: { gridTemplateRows: '120px', alignItems: 'stretch' },
    itemCount: 3,
    accents: [2, 6, 4],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '52px', alignItems: 'stretch', gap: '4px', height: '60px' },
  },
  {
    id: 26, title: '셀 안 위쪽', difficulty: '⭐',
    desc: '행 높이를 120px 로 정하고, 각 아이템을 셀 위쪽에 붙이세요.',
    hint: 'Flex 의 flex-start 에 해당하는 값이 Grid 에서는 다른 이름입니다.',
    target: { gridTemplateRows: '120px', alignItems: 'start' },
    itemCount: 3,
    accents: [5, 1, 7],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '52px', alignItems: 'start', gap: '4px', height: '60px' },
  },
  {
    id: 27, title: '셀 안 왼쪽', difficulty: '⭐',
    desc: '각 아이템을 자기 셀의 왼쪽에 붙이세요. 아이템은 내용만큼만 차지합니다.',
    hint: '가로 방향 셀 정렬입니다. 값 이름은 flex-start 가 아닙니다.',
    target: { gridTemplateColumns: '1fr 1fr 1fr', justifyItems: 'start' },
    itemCount: 6,
    accents: [6, 5, 4, 3, 2, 1],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', justifyItems: 'start', gap: '4px', height: '56px' },
  },
  {
    id: 28, title: '3행 만들기', difficulty: '⭐',
    desc: '행 세 개를 각각 60px 높이로 정하세요.',
    hint: '열과 같은 방식입니다. 값을 세 번 적습니다.',
    target: { gridTemplateRows: '60px 60px 60px' },
    itemCount: 6,
    accents: [8, 7, 6, 5, 4, 3],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '16px 16px 16px', gap: '3px', height: '60px' },
  },

  /* ===================== ⭐⭐ 두 개념 조합 (29~35) ===================== */
  {
    id: 29, title: '그리드 전체 오른쪽', difficulty: '⭐⭐',
    desc: '열 세 개를 80px 로 정하고, 그리드 전체를 컨테이너 오른쪽 끝에 붙이세요.',
    hint: '트랙이 고정 단위여야 남는 공간이 생깁니다. 값 이름은 flex-end 가 아닙니다.',
    target: { gridTemplateColumns: '80px 80px 80px', justifyContent: 'end' },
    itemCount: 6,
    accents: [1, 1, 1, 8, 8, 8],
    miniStyle: { display: 'grid', gridTemplateColumns: '24px 24px 24px', justifyContent: 'end', gap: '4px', height: '56px' },
  },
  {
    id: 30, title: '트랙마다 같은 여백', difficulty: '⭐⭐',
    desc: '열 세 개를 80px 로 정하고, 각 트랙 양옆에 같은 여백을 두세요. 바깥 여백은 사이 여백의 절반이 됩니다.',
    hint: 'space-between · space-around · space-evenly 는 여백 분배 방식이 서로 다릅니다.',
    target: { gridTemplateColumns: '80px 80px 80px', justifyContent: 'space-around' },
    itemCount: 6,
    accents: [4, 4, 4, 2, 2, 2],
    miniStyle: { display: 'grid', gridTemplateColumns: '24px 24px 24px', justifyContent: 'space-around', gap: '4px', height: '56px' },
  },
  {
    id: 31, title: '그리드 전체 아래쪽', difficulty: '⭐⭐',
    desc: '행 두 개를 60px 로 정하고, 그리드 전체를 컨테이너 바닥에 붙이세요.',
    hint: '각 셀 안 정렬이 아니라 줄 뭉치 전체를 세로로 움직입니다.',
    target: { gridTemplateRows: '60px 60px', alignContent: 'end' },
    itemCount: 6,
    accents: [3, 3, 3, 7, 7, 7],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '18px 18px', alignContent: 'end', gap: '4px', height: '60px' },
  },
  {
    id: 32, title: '줄 뭉치 양끝', difficulty: '⭐⭐',
    desc: '행 두 개를 60px 로 정하고, 첫 줄은 맨 위 마지막 줄은 맨 아래에 붙이세요.',
    hint: '세로 방향으로 남는 공간을 줄 사이에 넣습니다.',
    target: { gridTemplateRows: '60px 60px', alignContent: 'space-between' },
    itemCount: 6,
    accents: [5, 5, 5, 1, 1, 1],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '16px 16px', alignContent: 'space-between', gap: '4px', height: '60px' },
  },
  {
    id: 33, title: '기준선 맞추기', difficulty: '⭐⭐',
    desc: '행 높이를 120px 로 정하고, 아이템의 텍스트 기준선이 나란히 놓이게 하세요.',
    hint: '글자가 앉는 선을 기준으로 삼는 값입니다. Flex 에도 같은 이름이 있습니다.',
    target: { gridTemplateRows: '120px', alignItems: 'baseline' },
    itemCount: 3,
    accents: [6, 3, 8],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '52px', alignItems: 'baseline', gap: '4px', height: '60px' },
  },
  {
    id: 34, title: '열 우선 + 세로 가운데', difficulty: '⭐⭐',
    desc: '행 두 개를 60px 로 정하고, 아이템이 세로 방향으로 먼저 채워지되 각 아이템은 셀 안 세로 가운데에 놓이게 하세요.',
    hint: '배치 방향과 셀 안 정렬은 서로 다른 속성입니다. 행 높이가 정해져야 가운데가 보입니다.',
    target: { gridTemplateRows: '60px 60px', gridAutoFlow: 'column', alignItems: 'center' },
    itemCount: 6,
    accents: [2, 4, 6, 8, 1, 3],
    miniStyle: {
      display: 'grid',
      gridTemplateRows: '22px 22px',
      gridAutoFlow: 'column',
      alignItems: 'center',
      gap: '4px',
      height: '56px',
    },
  },
  {
    id: 35, title: '양옆 고정 헤더', difficulty: '⭐⭐',
    desc: '왼쪽 로고와 오른쪽 버튼은 고정 폭, 가운데 메뉴가 남은 공간을 차지하며 셀 안 가운데 정렬되게 하세요.',
    hint: '고정 폭은 px, 가운데는 fr 입니다. 셀 안 정렬은 별도 속성입니다.',
    target: { gridTemplateColumns: '100px 1fr 100px', justifyItems: 'center' },
    itemCount: 3,
    accents: [7, 1, 7],
    miniStyle: { display: 'grid', gridTemplateColumns: '28px 1fr 28px', justifyItems: 'center', gap: '4px', height: '48px' },
  },

  /* ================= ⭐⭐⭐ 세 개념 이상 (36~40) ================= */
  {
    id: 36, title: '상·하한이 있는 열', difficulty: '⭐⭐⭐',
    desc: '첫 열은 최소 80px 최대 200px 사이에서 움직이고 둘째 열은 남은 공간, 셋째 열은 100px 고정인 2행 판을 만들고, 아이템을 셀 바닥에 붙이세요.',
    hint: 'minmax 는 최솟값과 최댓값을 함께 정합니다. 세로 정렬은 행이 정해져야 보입니다.',
    target: {
      gridTemplateColumns: 'minmax(80px, 200px) 1fr 100px',
      gridTemplateRows: '80px 80px',
      alignItems: 'end',
    },
    itemCount: 6,
    accents: [5, 6, 7, 5, 6, 7],
    miniStyle: {
      display: 'grid',
      gridTemplateColumns: '26px 1fr 22px',
      gridTemplateRows: '22px 22px',
      alignItems: 'end',
      gap: '3px',
      height: '60px',
    },
  },
  {
    id: 37, title: '줄 뭉치 여백 감싸기', difficulty: '⭐⭐⭐',
    desc: '행 두 개를 60px 로 정하고, 각 줄 위아래에 같은 여백을 두세요. 바깥 여백은 사이 여백의 절반이 됩니다. 아이템은 셀 왼쪽 위에 붙입니다.',
    hint: 'space-between 과 space-evenly 사이에 있는 값입니다. 셀 안 정렬 두 개도 함께 씁니다.',
    target: {
      gridTemplateRows: '60px 60px',
      justifyItems: 'start',
      alignItems: 'start',
      alignContent: 'space-around',
    },
    itemCount: 6,
    accents: [3, 5, 7, 2, 4, 6],
    miniStyle: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '16px 16px',
      justifyItems: 'start',
      alignItems: 'start',
      alignContent: 'space-around',
      gap: '3px',
      height: '60px',
    },
  },
  {
    id: 38, title: '고정 판 정중앙', difficulty: '⭐⭐⭐',
    desc: '열과 행을 모두 고정 크기로 두고, 그리드 전체를 컨테이너 가로·세로 정중앙에 두세요.',
    hint: '두 축 모두 고정 단위여야 여백이 생깁니다. 가로와 세로를 각각 정합니다.',
    target: {
      gridTemplateColumns: '80px 80px',
      gridTemplateRows: '60px 60px',
      justifyContent: 'center',
      alignContent: 'center',
    },
    itemCount: 4,
    accents: [1, 3, 5, 7],
    miniStyle: { display: 'grid', gridTemplateColumns: '24px 24px', gridTemplateRows: '18px 18px', justifyContent: 'center', alignContent: 'center', gap: '4px', height: '60px' },
  },
  {
    id: 39, title: '셀은 채우고 판은 아래로', difficulty: '⭐⭐⭐',
    desc: '행 두 개를 60px 로 두고, 각 아이템은 셀을 가로로 꽉 채우되 그리드 전체는 바닥에 붙게 하세요.',
    hint: '셀 안 정렬과 그리드 전체 정렬은 서로 다른 층입니다. 두 속성이 충돌하지 않습니다.',
    target: {
      gridTemplateRows: '60px 60px',
      justifyItems: 'stretch',
      alignContent: 'end',
    },
    itemCount: 6,
    accents: [8, 6, 4, 2, 7, 5],
    miniStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '18px 18px', justifyItems: 'stretch', alignContent: 'end', gap: '4px', height: '60px' },
  },
  {
    id: 40, title: '완성형 대시보드 판', difficulty: '⭐⭐⭐',
    desc: '4열 2행 고정 판을 만들고, 아이템은 셀 안 가운데에, 그리드 전체는 가로로 완전 균등 간격, 세로로는 각 줄 위아래에 같은 여백을 두세요.',
    hint: '다섯 속성을 모두 씁니다. 가로와 세로의 여백 분배 방식이 서로 다릅니다.',
    target: {
      gridTemplateColumns: '70px 70px 70px 70px',
      gridTemplateRows: '60px 60px',
      justifyItems: 'center',
      justifyContent: 'space-evenly',
      alignContent: 'space-around',
    },
    itemCount: 8,
    accents: [1, 2, 3, 4, 5, 6, 7, 8],
    miniStyle: { display: 'grid', gridTemplateColumns: '18px 18px 18px 18px', gridTemplateRows: '18px 18px', justifyItems: 'center', justifyContent: 'space-evenly', alignContent: 'space-around', gap: '3px', height: '60px' },
  },
];

export default GRID_CHALLENGES;
