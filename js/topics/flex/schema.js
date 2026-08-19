/**
 * topics/flex/schema.js — Flexbox 속성 정의
 * 컨테이너 6 + 아이템 6 = 12개
 *
 * v0.1 EXPLAIN_DATA 의 설명문을 이관하고 스키마 규격에 맞춰 재구성.
 */

const MDN = 'https://developer.mozilla.org/en-US/docs/Web/CSS/';

export const FLEX_SCHEMA = [
  /* ====================== 컨테이너 ====================== */
  {
    prop: 'flex-direction', jsProp: 'flexDirection', scope: 'container',
    control: 'enum', default: 'row', urlKey: 'd',
    label: '주축 방향',
    desc: '아이템이 배치되는 <strong>주축</strong>의 방향을 정합니다. 이 값이 바뀌면 justify-content와 align-items가 가리키는 축도 함께 바뀝니다.',
    tip: 'Flexbox의 나머지 속성이 전부 이 값에 종속됩니다. 결과가 예상과 다르면 여기부터 확인하세요.',
    mdn: MDN + 'flex-direction',
    relatedTo: ['grid-auto-flow'],
    demo: { itemCount: 3 },
    values: [
      { val: 'row',            desc: '왼쪽에서 오른쪽 (기본값)' },
      { val: 'row-reverse',    desc: '오른쪽에서 왼쪽' },
      { val: 'column',         desc: '위에서 아래' },
      { val: 'column-reverse', desc: '아래에서 위' },
    ],
  },
  {
    prop: 'flex-wrap', jsProp: 'flexWrap', scope: 'container',
    control: 'enum', default: 'nowrap', urlKey: 'w',
    label: '줄 넘김',
    desc: '아이템이 한 줄에 다 들어가지 않을 때 다음 줄로 넘길지 결정합니다.',
    tip: 'nowrap이면 줄이 하나뿐이라 align-content가 동작하지 않습니다. 이게 초보자가 가장 자주 막히는 지점입니다.',
    mdn: MDN + 'flex-wrap',
    axisAware: true,
    // column 데모는 높이가 막혀 있어야 줄이 넘어간다. row 데모는 카드 폭이
    // 이미 좁아 그대로도 넘치지만, 같은 판을 쓰므로 함께 고정한다.
    demo: { itemCount: 7, itemSizes: 'wide', containerStyle: { height: '220px' } },
    values: [
      { val: 'nowrap',       desc: '넘기지 않고 아이템을 줄여서 한 줄에 (기본값)' },
      { val: 'wrap',         desc: '넘칠 때 다음 줄로' },
      { val: 'wrap-reverse', desc: '다음 줄을 반대 방향으로 쌓음' },
    ],
  },
  {
    prop: 'justify-content', jsProp: 'justifyContent', scope: 'container',
    control: 'enum', default: 'flex-start', urlKey: 'j',
    label: '주축 정렬',
    desc: '<strong>주축</strong> 방향으로 아이템 전체를 정렬하고 남은 공간을 분배합니다.',
    tip: 'Grid에도 같은 이름의 속성이 있지만 대상이 다릅니다. Flex는 아이템을, Grid는 트랙 전체를 움직입니다.',
    mdn: MDN + 'justify-content',
    axisAware: true,
    relatedTo: ['justify-content'],
    demo: { itemCount: 3 },
    values: [
      { val: 'flex-start',    desc: '주축 시작점에 붙임 (기본값)' },
      { val: 'flex-end',      desc: '주축 끝점에 붙임' },
      { val: 'center',        desc: '주축 가운데' },
      { val: 'space-between', desc: '양끝은 붙이고 사이를 균등 분배' },
      { val: 'space-around',  desc: '각 아이템 양옆에 같은 여백. 바깥 여백은 절반' },
      { val: 'space-evenly',  desc: '모든 간격을 완전히 균등하게' },
    ],
  },
  {
    prop: 'align-items', jsProp: 'alignItems', scope: 'container',
    control: 'enum', default: 'stretch', urlKey: 'a',
    label: '교차축 정렬',
    desc: '<strong>교차축</strong> 방향으로 각 줄 안에서 아이템을 정렬합니다.',
    tip: '줄이 여러 개여도 각 줄 내부에서 개별 적용됩니다. 줄 자체를 움직이는 건 align-content입니다.',
    mdn: MDN + 'align-items',
    axisAware: true,
    relatedTo: ['align-items'],
    demo: { itemCount: 3, itemSizes: 'varied' },
    values: [
      {
        val: 'stretch',
        desc: '교차축을 꽉 채움 (기본값). 아이템에 크기가 없을 때만 동작',
        // 유형 C — 아이템이 교차축 크기를 스스로 정했으면 늘어날 자리가 없다
        measuredInactive: {
          key: 'crossAuto',
          reason: '아이템이 교차축 크기를 스스로 정하고 있어 늘어날 여지가 없습니다.',
          hint: '아이템의 높이(주축이 column이면 너비)를 지우면 stretch가 컨테이너를 채웁니다.',
        },
      },
      { val: 'flex-start', desc: '교차축 시작점' },
      { val: 'flex-end',   desc: '교차축 끝점' },
      { val: 'center',     desc: '교차축 가운데' },
      { val: 'baseline',   desc: '텍스트 기준선을 맞춤' },
    ],
  },
  {
    prop: 'align-content', jsProp: 'alignContent', scope: 'container',
    control: 'enum', default: 'normal', urlKey: 'c',
    label: '여러 줄 정렬',
    desc: '줄이 <strong>두 개 이상</strong>일 때, 줄 뭉치 전체를 교차축 방향으로 정렬합니다.',
    tip: 'flex-wrap: wrap 이면서 실제로 줄이 넘어간 상태에서만 효과가 보입니다.',
    mdn: MDN + 'align-content',
    axisAware: true,
    inactiveWhen: {
      prop: 'flexWrap',
      equals: 'nowrap',
      reason: '지금은 flex-wrap이 nowrap이라 줄이 하나뿐입니다. 정렬할 줄 뭉치가 없습니다.',
      hint: 'flex-wrap을 wrap으로 바꿔 줄을 두 개 이상 만들어 보세요.',
    },
    demo: { itemCount: 7, itemSizes: 'wide', containerStyle: { flexWrap: 'wrap', height: '220px' } },
    values: [
      { val: 'normal',        desc: 'stretch 처럼 동작 (기본값)' },
      { val: 'flex-start',    desc: '줄 뭉치를 교차축 시작점에' },
      { val: 'flex-end',      desc: '줄 뭉치를 교차축 끝점에' },
      { val: 'center',        desc: '줄 뭉치를 가운데' },
      { val: 'space-between', desc: '첫 줄과 마지막 줄을 양끝에 붙이고 균등 분배' },
      { val: 'space-around',  desc: '각 줄 위아래에 같은 여백' },
      { val: 'stretch',       desc: '줄들이 공간을 나눠 가짐' },
    ],
  },
  {
    prop: 'gap', jsProp: 'gap', scope: 'container',
    control: 'length', default: '8px', urlKey: 'g',
    label: '아이템 간격',
    desc: '아이템 사이의 간격입니다. margin과 달리 바깥쪽에는 여백이 생기지 않습니다.',
    tip: 'margin으로 간격을 주면 첫/마지막 아이템만 예외 처리해야 합니다. gap은 그 문제가 없습니다.',
    mdn: MDN + 'gap',
    units: ['px', 'rem', '%', 'em'],
    demo: { itemCount: 4 },
  },

  /* ====================== 아이템 ====================== */
  {
    prop: 'flex-grow', jsProp: 'flexGrow', scope: 'item',
    control: 'number', default: 0, min: 0, max: 5, step: 1, urlKey: 'ig',
    label: '늘어나는 비율',
    desc: '컨테이너에 <strong>남은 공간</strong>이 있을 때, 그 공간을 얼마나 차지할지 비율로 정합니다.',
    tip: '값 자체가 크기가 아니라 남은 공간의 분배 비율입니다. 1과 2를 주면 1:2로 나눠 갖습니다.',
    mdn: MDN + 'flex-grow',
    // 유형 B — 남는 공간이 없으면 나눠 가질 것도 없다
    measuredInactive: {
      key: 'hasFreeSpace',
      reason: '지금 주축에 남는 공간이 없습니다. 나눠 가질 자리가 없어 값을 올려도 그대로입니다.',
      hint: '컨테이너를 넓히거나 아이템을 줄여 빈 자리를 만들어 보세요.',
    },
    axisAware: true,
    // 주축을 따라 늘어나므로 row 는 너비가, column 은 높이가 커진다.
    // column 데모는 높이가 막혀 있어야 "남은 공간"이 생긴다. 아이템 3개 ×
    // 44px + 간격 8px + 안쪽 여백 16px = 156px 이므로 260px 이면 104px 이 남는다.
    demo: { itemCount: 3, containerStyle: { height: '260px' } },
  },
  {
    prop: 'flex-shrink', jsProp: 'flexShrink', scope: 'item',
    control: 'number', default: 1, min: 0, max: 5, step: 1, urlKey: 'is',
    label: '줄어드는 비율',
    desc: '공간이 <strong>부족할 때</strong> 얼마나 줄어들지 비율로 정합니다. 기본값이 1이라 아이템은 기본적으로 줄어듭니다.',
    tip: '0을 주면 절대 줄어들지 않습니다. 로고나 아이콘이 찌그러질 때 쓰는 해법입니다.',
    mdn: MDN + 'flex-shrink',
    // 유형 C — 넘치지 않으면 줄일 일이 없고, 하한에 닿았으면 더 줄지 못한다
    measuredInactive: {
      key: 'canShrink',
      reason: '아이템이 넘치지 않았거나, 이미 더 줄 수 없는 크기에 닿았습니다.',
      hint: '컨테이너를 좁혀 아이템이 넘치게 해 보세요. 넘쳤는데도 그대로면 min-width·min-height의 기본값 auto가 막고 있는 것입니다.',
    },
    axisAware: true,
    // grow 의 반대편. column 데모는 높이가 모자라야 줄어든다. 아이템 4개 ×
    // 40px + 간격 12px + 안쪽 여백 16px = 188px 이므로 168px 이면 20px 이
    // 모자라 대상 아이템이 절반으로 줄어든다. 더 줄이면 0 이 되어 사라진다.
    demo: { itemCount: 4, itemSizes: 'wide', containerStyle: { height: '168px' } },
  },
  {
    prop: 'flex-basis', jsProp: 'flexBasis', scope: 'item',
    control: 'length', default: 'auto', urlKey: 'ib',
    label: '기본 크기',
    desc: 'grow·shrink가 적용되기 <strong>전</strong>의 기준 크기입니다. 주축이 가로면 width, 세로면 height 역할을 합니다.',
    tip: 'width보다 우선합니다. 둘 다 설정하면 flex-basis가 이깁니다.',
    mdn: MDN + 'flex-basis',
    axisAware: true,
    units: ['auto', 'px', '%', 'rem', 'content'],
    relatedTo: ['grid-template-columns'],
    demo: { itemCount: 3 },
  },
  {
    prop: 'flex', jsProp: 'flex', scope: 'item',
    control: 'enum', default: '0 1 auto', urlKey: 'if',
    label: '단축 속성',
    desc: 'grow · shrink · basis를 한 번에 지정하는 단축 속성입니다.',
    tip: '실무에서는 개별 속성보다 이 단축형을 훨씬 자주 씁니다. flex: 1 을 외워두면 대부분 해결됩니다.',
    mdn: MDN + 'flex',
    axisAware: true,
    // grow · shrink · basis 의 단축이므로 셋과 같은 축을 탄다.
    // 같은 판에서 비교되도록 flex-grow 와 같은 높이를 쓴다.
    demo: { itemCount: 3, containerStyle: { height: '260px' } },
    values: [
      { val: '0 1 auto', label: 'flex: 0 1 auto', desc: '기본값. 늘지 않고, 필요하면 줄고, 크기는 auto' },
      { val: '1',        label: 'flex: 1',        desc: '남은 공간을 전부 채움 (= 1 1 0)' },
      { val: 'auto',     label: 'flex: auto',     desc: '콘텐츠 크기 기준으로 늘고 줄음 (= 1 1 auto)' },
      { val: 'none',     label: 'flex: none',     desc: '크기 완전 고정 (= 0 0 auto)' },
    ],
  },
  {
    prop: 'align-self', jsProp: 'alignSelf', scope: 'item',
    control: 'enum', default: 'auto', urlKey: 'ia',
    label: '개별 교차축 정렬',
    desc: '이 아이템에 한해 부모의 <code>align-items</code>를 덮어씁니다.',
    tip: '아바타 하나만 아래로 붙이는 식으로, 예외 하나 때문에 구조를 바꾸지 않아도 됩니다.',
    mdn: MDN + 'align-self',
    axisAware: true,
    relatedTo: ['align-self'],
    demo: { itemCount: 3, itemSizes: 'varied' },
    values: [
      { val: 'auto',       desc: '부모 align-items를 따름 (기본값)' },
      { val: 'flex-start', desc: '이 아이템만 교차축 시작점' },
      { val: 'flex-end',   desc: '이 아이템만 교차축 끝점' },
      { val: 'center',     desc: '이 아이템만 교차축 가운데' },
      { val: 'stretch',    desc: '이 아이템만 교차축을 꽉 채움' },
    ],
  },
  {
    prop: 'order', jsProp: 'order', scope: 'item',
    control: 'number', default: 0, min: -3, max: 3, step: 1, urlKey: 'io',
    label: '배치 순서',
    desc: 'HTML 소스 순서를 바꾸지 않고 <strong>시각적</strong> 배치 순서만 바꿉니다. 값이 작을수록 앞입니다.',
    tip: '화면 순서와 DOM 순서가 달라지면 키보드 탭 이동과 스크린 리더 읽기 순서가 어긋납니다. 접근성상 남용하면 안 되는 속성입니다.',
    inactiveWhen: {
      source: 'state',
      prop: 'hasMultipleItems',
      equals: false,
      reason: '아이템이 하나뿐이라 앞뒤를 다툴 상대가 없습니다.',
      hint: '아이템을 하나 더 추가한 뒤 값을 바꿔 보세요.',
    },
    mdn: MDN + 'order',
    relatedTo: ['order'],
    demo: { itemCount: 4 },
  },
];

export default FLEX_SCHEMA;
