/**
 * topics/grid/schema.js — CSS Grid 속성 정의
 * 컨테이너 12 + 아이템 7 = 19개
 *
 * Flex와 달리 enum이 아닌 컨트롤(track-list · area-grid · span)이 6개 포함된다.
 * 이 6개가 v0.1 구조로 확장 불가능했던 직접적 원인이다.
 */

const MDN = 'https://developer.mozilla.org/ko/docs/Web/CSS/';

export const GRID_SCHEMA = [
  /* ====================== 컨테이너 — 명시적 트랙 ====================== */
  {
    prop: 'grid-template-columns', jsProp: 'gridTemplateColumns', scope: 'container',
    control: 'track-list', default: [{ size: 1, unit: 'fr' }, { size: 1, unit: 'fr' }, { size: 1, unit: 'fr' }],
    urlKey: 'tc',
    label: '열 트랙',
    desc: '<strong>열</strong>의 개수와 각 열의 너비를 정합니다. Grid에서 가장 먼저 정하게 되는 속성입니다.',
    tip: 'fr은 남은 공간의 분배 비율입니다. %와 달리 gap을 계산에 포함하므로 넘치지 않습니다.',
    mdn: MDN + 'grid-template-columns',
    units: ['fr', 'px', '%', 'auto', 'min-content', 'max-content', 'minmax'],
    relatedTo: ['flex-basis'],
    demo: { itemCount: 6 },
  },
  {
    prop: 'grid-template-rows', jsProp: 'gridTemplateRows', scope: 'container',
    control: 'track-list', default: [{ unit: 'auto' }],
    urlKey: 'tr',
    label: '행 트랙',
    desc: '<strong>행</strong>의 개수와 각 행의 높이를 정합니다.',
    tip: '행을 지정하지 않으면 필요한 만큼 암시적으로 생성됩니다. 그 크기는 grid-auto-rows가 결정합니다.',
    mdn: MDN + 'grid-template-rows',
    units: ['fr', 'px', '%', 'auto', 'min-content', 'max-content', 'minmax'],
    demo: { itemCount: 6 },
  },
  {
    prop: 'grid-template-areas', jsProp: 'gridTemplateAreas', scope: 'container',
    control: 'area-grid', default: 'none',
    urlKey: 'ta',
    label: '영역 이름',
    desc: '셀에 이름을 붙여 레이아웃을 <strong>그림처럼</strong> 정의합니다. 아이템은 <code>grid-area</code>로 이름을 참조해 배치됩니다.',
    tip: '각 영역은 반드시 직사각형이어야 합니다. L자 모양은 만들 수 없습니다. 빈 칸은 마침표로 표시합니다.',
    mdn: MDN + 'grid-template-areas',
    demo: { itemCount: 4 },
  },

  /* ====================== 컨테이너 — 간격 ====================== */
  {
    prop: 'row-gap', jsProp: 'rowGap', scope: 'container',
    control: 'length', default: '12px', urlKey: 'rg',
    label: '행 간격',
    desc: '행 트랙 사이의 간격입니다.',
    tip: 'row-gap과 column-gap을 같은 값으로 쓸 거라면 gap 단축형이 편합니다.',
    mdn: MDN + 'row-gap',
    units: ['px', 'rem', '%', 'em'],
    demo: { itemCount: 6 },
  },
  {
    prop: 'column-gap', jsProp: 'columnGap', scope: 'container',
    control: 'length', default: '12px', urlKey: 'cg',
    label: '열 간격',
    desc: '열 트랙 사이의 간격입니다.',
    tip: 'fr 계산은 gap을 먼저 뺀 나머지 공간에서 이뤄집니다. 그래서 gap을 키워도 레이아웃이 깨지지 않습니다.',
    mdn: MDN + 'column-gap',
    units: ['px', 'rem', '%', 'em'],
    relatedTo: ['gap'],
    demo: { itemCount: 6 },
  },

  /* ====================== 컨테이너 — 셀 내부 정렬 ====================== */
  {
    prop: 'justify-items', jsProp: 'justifyItems', scope: 'container',
    control: 'enum', default: 'stretch', urlKey: 'ji',
    label: '셀 내부 가로 정렬',
    desc: '각 아이템을 <strong>자기 셀 안에서</strong> 가로 방향으로 정렬합니다.',
    tip: 'Flex에는 대응하는 속성이 없습니다. 셀이라는 고정된 칸이 있어야 성립하는 개념이기 때문입니다.',
    mdn: MDN + 'justify-items',
    demo: { itemCount: 6 },
    values: [
      { val: 'stretch', desc: '셀 너비를 꽉 채움 (기본값)' },
      { val: 'start',   desc: '셀 왼쪽' },
      { val: 'end',     desc: '셀 오른쪽' },
      { val: 'center',  desc: '셀 가로 가운데' },
    ],
  },
  {
    prop: 'align-items', jsProp: 'alignItems', scope: 'container',
    control: 'enum', default: 'stretch', urlKey: 'ai',
    label: '셀 내부 세로 정렬',
    desc: '각 아이템을 <strong>자기 셀 안에서</strong> 세로 방향으로 정렬합니다.',
    tip: 'Flex의 align-items는 교차축 기준이라 flex-direction에 따라 방향이 바뀌지만, Grid에서는 항상 세로입니다.',
    mdn: MDN + 'align-items',
    relatedTo: ['align-items'],
    demo: { itemCount: 6, containerStyle: { height: '260px' } },
    values: [
      { val: 'stretch',  desc: '셀 높이를 꽉 채움 (기본값)' },
      { val: 'start',    desc: '셀 위쪽' },
      { val: 'end',      desc: '셀 아래쪽' },
      { val: 'center',   desc: '셀 세로 가운데' },
      { val: 'baseline', desc: '텍스트 기준선을 맞춤' },
    ],
  },

  /* ====================== 컨테이너 — 그리드 전체 정렬 ====================== */
  {
    prop: 'justify-content', jsProp: 'justifyContent', scope: 'container',
    control: 'enum', default: 'start', urlKey: 'jc',
    label: '그리드 가로 정렬',
    desc: '트랙 전체 너비가 컨테이너보다 작을 때, <strong>그리드 전체</strong>를 가로로 정렬합니다.',
    tip: '열 너비가 fr이면 항상 꽉 차므로 효과가 없습니다. px 같은 고정 단위일 때만 남는 공간이 생깁니다.',
    mdn: MDN + 'justify-content',
    relatedTo: ['justify-content'],
    demo: { itemCount: 3, containerStyle: { gridTemplateColumns: '80px 80px 80px' } },
    values: [
      { val: 'start',         desc: '컨테이너 왼쪽 (기본값)' },
      { val: 'end',           desc: '컨테이너 오른쪽' },
      { val: 'center',        desc: '컨테이너 가로 가운데' },
      { val: 'space-between', desc: '양끝에 붙이고 트랙 사이를 균등 분배' },
      { val: 'space-around',  desc: '각 트랙 양옆에 같은 여백' },
      { val: 'space-evenly',  desc: '모든 간격을 완전히 균등하게' },
    ],
  },
  {
    prop: 'align-content', jsProp: 'alignContent', scope: 'container',
    control: 'enum', default: 'start', urlKey: 'ac',
    label: '그리드 세로 정렬',
    desc: '트랙 전체 높이가 컨테이너보다 작을 때, <strong>그리드 전체</strong>를 세로로 정렬합니다.',
    tip: '컨테이너에 높이가 지정돼 있어야 남는 공간이 생겨 효과가 보입니다.',
    mdn: MDN + 'align-content',
    demo: { itemCount: 6, containerStyle: { height: '300px', gridTemplateRows: '60px 60px' } },
    values: [
      { val: 'start',         desc: '컨테이너 위쪽 (기본값)' },
      { val: 'end',           desc: '컨테이너 아래쪽' },
      { val: 'center',        desc: '컨테이너 세로 가운데' },
      { val: 'space-between', desc: '위아래 끝에 붙이고 균등 분배' },
      { val: 'space-around',  desc: '각 트랙 위아래에 같은 여백' },
      { val: 'space-evenly',  desc: '모든 간격을 완전히 균등하게' },
    ],
  },

  /* ====================== 컨테이너 — 암시적 그리드 ====================== */
  {
    prop: 'grid-auto-flow', jsProp: 'gridAutoFlow', scope: 'container',
    control: 'enum', default: 'row', urlKey: 'af',
    label: '자동 배치 방향',
    desc: '위치를 지정하지 않은 아이템을 <strong>어느 방향으로 채울지</strong> 정합니다.',
    tip: 'dense를 붙이면 앞쪽에 생긴 빈 칸을 뒤 아이템이 메웁니다. 시각 순서와 DOM 순서가 어긋나므로 접근성 주의가 필요합니다.',
    mdn: MDN + 'grid-auto-flow',
    relatedTo: ['flex-direction'],
    demo: { itemCount: 6 },
    values: [
      { val: 'row',        desc: '행을 먼저 채움. 가로로 진행 (기본값)' },
      { val: 'column',     desc: '열을 먼저 채움. 세로로 진행' },
      { val: 'row dense',  desc: '가로로 진행하되 빈 칸을 메움' },
      { val: 'column dense', desc: '세로로 진행하되 빈 칸을 메움' },
    ],
  },
  {
    prop: 'grid-auto-columns', jsProp: 'gridAutoColumns', scope: 'container',
    control: 'length', default: 'auto', urlKey: 'ao',
    label: '암시적 열 크기',
    desc: '명시하지 않은 열이 <strong>자동 생성</strong>될 때의 너비입니다.',
    tip: 'grid-auto-flow: column 이거나 아이템이 지정 범위를 벗어날 때 생성됩니다. 프리뷰에서 점선 테두리로 표시됩니다.',
    mdn: MDN + 'grid-auto-columns',
    units: ['auto', 'px', 'fr', '%', 'min-content', 'max-content'],
    demo: { itemCount: 6, containerStyle: { gridAutoFlow: 'column' } },
  },
  {
    prop: 'grid-auto-rows', jsProp: 'gridAutoRows', scope: 'container',
    control: 'length', default: 'auto', urlKey: 'ar',
    label: '암시적 행 크기',
    desc: '명시하지 않은 행이 <strong>자동 생성</strong>될 때의 높이입니다.',
    tip: '카드 그리드에서 실무적으로 가장 자주 쓰는 속성입니다. 행 개수를 모를 때 높이만 통일할 수 있습니다.',
    mdn: MDN + 'grid-auto-rows',
    units: ['auto', 'px', 'fr', '%', 'min-content', 'max-content'],
    demo: { itemCount: 7 },
  },

  /* ====================== 아이템 — 배치 ====================== */
  {
    prop: 'grid-column-start', jsProp: 'gridColumnStart', scope: 'item',
    control: 'span', default: 'auto', urlKey: 'ics',
    label: '시작 열 라인',
    desc: '아이템이 시작할 <strong>세로 라인 번호</strong>입니다. 라인은 트랙이 아니라 트랙 사이의 경계선입니다.',
    tip: '열이 3개면 라인은 4개입니다. 음수는 끝에서부터 세며, -1이 마지막 라인입니다.',
    mdn: MDN + 'grid-column-start',
    demo: { itemCount: 6 },
  },
  {
    prop: 'grid-column-end', jsProp: 'gridColumnEnd', scope: 'item',
    control: 'span', default: 'auto', urlKey: 'ice',
    label: '끝 열 라인',
    desc: '아이템이 끝날 세로 라인 번호이거나, <code>span n</code> 형태의 칸 수입니다.',
    tip: 'grid-column: 1 / 3 은 3번째 칸까지가 아니라 1번과 3번 라인 사이, 즉 2칸입니다.',
    mdn: MDN + 'grid-column-end',
    demo: { itemCount: 6 },
  },
  {
    prop: 'grid-row-start', jsProp: 'gridRowStart', scope: 'item',
    control: 'span', default: 'auto', urlKey: 'irs',
    label: '시작 행 라인',
    desc: '아이템이 시작할 <strong>가로 라인 번호</strong>입니다.',
    tip: '지정하면 자동 배치 흐름에서 빠져나와 그 자리에 고정됩니다.',
    mdn: MDN + 'grid-row-start',
    demo: { itemCount: 6 },
  },
  {
    prop: 'grid-row-end', jsProp: 'gridRowEnd', scope: 'item',
    control: 'span', default: 'auto', urlKey: 'ire',
    label: '끝 행 라인',
    desc: '아이템이 끝날 가로 라인 번호이거나 <code>span n</code> 형태의 칸 수입니다.',
    tip: '행 방향으로 칸을 넘기면 암시적 행이 생성될 수 있습니다.',
    mdn: MDN + 'grid-row-end',
    demo: { itemCount: 6 },
  },
  {
    prop: 'grid-area', jsProp: 'gridArea', scope: 'item',
    control: 'text', default: 'auto', urlKey: 'iar',
    label: '영역 이름',
    desc: '<code>grid-template-areas</code>에서 정의한 <strong>이름</strong>으로 배치하거나, 네 라인을 한 번에 지정합니다.',
    tip: '이름으로 배치하면 라인 번호를 세지 않아도 되고, 반응형에서 areas만 다시 그리면 배치가 통째로 바뀝니다.',
    mdn: MDN + 'grid-area',
    demo: { itemCount: 4 },
  },

  /* ====================== 아이템 — 셀 내부 정렬 ====================== */
  {
    prop: 'justify-self', jsProp: 'justifySelf', scope: 'item',
    control: 'enum', default: 'auto', urlKey: 'ijs',
    label: '개별 가로 정렬',
    desc: '이 아이템에 한해 부모의 <code>justify-items</code>를 덮어씁니다.',
    tip: 'Flex의 align-self와 같은 역할이지만, Grid에는 가로·세로 두 방향이 각각 존재합니다.',
    mdn: MDN + 'justify-self',
    demo: { itemCount: 6 },
    values: [
      { val: 'auto',    desc: '부모 justify-items를 따름 (기본값)' },
      { val: 'stretch', desc: '이 아이템만 셀 너비를 꽉 채움' },
      { val: 'start',   desc: '이 아이템만 셀 왼쪽' },
      { val: 'end',     desc: '이 아이템만 셀 오른쪽' },
      { val: 'center',  desc: '이 아이템만 셀 가로 가운데' },
    ],
  },
  {
    prop: 'align-self', jsProp: 'alignSelf', scope: 'item',
    control: 'enum', default: 'auto', urlKey: 'ias',
    label: '개별 세로 정렬',
    desc: '이 아이템에 한해 부모의 <code>align-items</code>를 덮어씁니다.',
    tip: 'justify-self와 짝으로 쓰면 셀 안 아홉 위치 어디로든 보낼 수 있습니다.',
    mdn: MDN + 'align-self',
    relatedTo: ['align-self'],
    demo: { itemCount: 6, containerStyle: { height: '260px' } },
    values: [
      { val: 'auto',    desc: '부모 align-items를 따름 (기본값)' },
      { val: 'stretch', desc: '이 아이템만 셀 높이를 꽉 채움' },
      { val: 'start',   desc: '이 아이템만 셀 위쪽' },
      { val: 'end',     desc: '이 아이템만 셀 아래쪽' },
      { val: 'center',  desc: '이 아이템만 셀 세로 가운데' },
    ],
  },
];

export default GRID_SCHEMA;
