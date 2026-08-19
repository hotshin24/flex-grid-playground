/**
 * topics/grid/presets.js — Grid 프리셋 5종 (F-11)
 *
 * Flex 프리셋(topics/flex/presets.js)과 같은 형식이다. 다만 성격이 다르다 —
 * Flex 5종은 v0.1 applyPreset() 을 옮긴 것이고 이 5종은 v1.0 신규 작성이다.
 * 그래서 check-presets 의 Grid 검증은 이관 대조 대신 스키마 정합성 검사다.
 *
 * container·items 의 키는 스키마의 jsProp 이다. 오타가 나면 조용히 무시되어
 * 화면에서는 "적용했는데 아무 일도 없다" 로만 보이므로, 게이트가 실제 스키마와
 * 대조한다.
 *
 * container 는 12키를 전부 적는다. 빠뜨린 키는 이전 프리셋의 값이 그대로 남아,
 * 무엇을 눌렀느냐가 아니라 그 전에 무엇을 눌렀느냐에 따라 그림이 달라진다.
 *
 * 아이템에는 스키마 속성 7종과 기하값(width·height)만 둔다. id 는 적용하는 쪽이
 * 붙인다 — 프리셋이 id 를 들고 있으면 상태의 id 체계와 어긋난다.
 *
 * track-list 값은 배열로 적는다. CONTROL_TYPES['track-list'] 가 쓰는 형태이고,
 * repeat() 문자열은 파서를 지나며 트랙 수가 손실된다.
 *
 * gridArea 를 쓰는 프리셋(holy-grail)은 gridTemplateAreas 와 이름이 맞아야 한다.
 * 어긋나면 아이템이 자동 배치로 떨어지고 이름만 남은 행이 0px 로 접힌다.
 *
 * width·height 가 null 이면 "크기를 정하지 않는다" 는 뜻이다. renderer 가 유한한
 * 수일 때만 크기를 얹으므로 아이템이 자기 칸을 채운다. justify-items 나
 * align-items 를 stretch 로 둔 프리셋은 반드시 null 이어야 한다 — 크기가 박혀
 * 있으면 stretch 가 할 일이 없어, 영역을 두 칸으로 잡아 놓고도 아이템은 그
 * 안에 작게 놓인다. 키를 빼지 않고 null 을 적는 이유는 빠뜨린 키가 앞 프리셋의
 * 값을 물려받기 때문이다.
 *
 * 반대로 center 계열로 정렬하는 프리셋(centered)은 크기가 있어야 한다. 크기를
 * 비우면 아이템이 글자 너비로 줄어 가운데 정렬이 보이지 않는다.
 *
 * 이 파일에 색 값이 없다. px 는 트랙 크기와 아이템 기하값이라 --sp-* 토큰으로
 * 옮기지 않는다 — 간격이 아니라 판의 치수다.
 */

export const GRID_PRESETS = [
  {
    id: 'holy-grail',
    label: '홀리 그레일',
    desc: '헤더·사이드바·본문·푸터를 영역 이름으로 배치한다',
    container: {
      gridTemplateColumns: [{ size: 160, unit: 'px' }, { size: 1, unit: 'fr' }],
      gridTemplateRows: [{ size: 56, unit: 'px' }, { size: 1, unit: 'fr' }, { size: 40, unit: 'px' }],
      gridTemplateAreas: '"header header"\n"nav main"\n"footer footer"',
      rowGap: '8px',
      columnGap: '8px',
      justifyItems: 'stretch',
      alignItems: 'stretch',
      justifyContent: 'start',
      alignContent: 'start',
      gridAutoFlow: 'row',
      gridAutoColumns: 'auto',
      gridAutoRows: 'auto',
    },
    items: [
      { gridArea: 'header', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
      { gridArea: 'nav', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
      { gridArea: 'main', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
      { gridArea: 'footer', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
    ],
  },
  {
    id: 'card-grid',
    label: '카드 그리드',
    desc: '같은 크기 카드를 4열로 늘어놓고 행 높이를 고정한다',
    container: {
      gridTemplateColumns: [{ size: 1, unit: 'fr' }, { size: 1, unit: 'fr' }, { size: 1, unit: 'fr' }, { size: 1, unit: 'fr' }],
      // 명시 행도 gridAutoRows 와 같은 높이여야 한다. auto 로 두면 첫 줄만
      // 내용 높이로 주저앉아 "행 높이를 고정한다" 가 첫 줄에서 거짓이 된다.
      gridTemplateRows: [{ size: 90, unit: 'px' }],
      gridTemplateAreas: 'none',
      rowGap: '12px',
      columnGap: '12px',
      justifyItems: 'stretch',
      alignItems: 'stretch',
      justifyContent: 'start',
      alignContent: 'start',
      gridAutoFlow: 'row',
      gridAutoColumns: 'auto',
      gridAutoRows: '90px',
    },
    items: [
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
    ],
  },
  {
    id: 'dashboard',
    label: '대시보드',
    desc: '크기가 다른 위젯을 칸 수로 배치한다',
    container: {
      gridTemplateColumns: [{ size: 1, unit: 'fr' }, { size: 1, unit: 'fr' }, { size: 1, unit: 'fr' }, { size: 1, unit: 'fr' }],
      // 명시 행도 gridAutoRows 와 같은 높이로 둔다. auto 면 첫 줄 위젯만 납작해져
      // 칸 수로 크기가 정해진다는 이 프리셋의 요점이 흐려진다.
      gridTemplateRows: [{ size: 72, unit: 'px' }],
      gridTemplateAreas: 'none',
      rowGap: '10px',
      columnGap: '10px',
      justifyItems: 'stretch',
      alignItems: 'stretch',
      justifyContent: 'start',
      alignContent: 'start',
      gridAutoFlow: 'row dense',
      gridAutoColumns: 'auto',
      gridAutoRows: '72px',
    },
    items: [
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'span 2', gridRowStart: 'auto', gridRowEnd: 'span 2', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'span 2', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'span 2', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'span 2', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
    ],
  },
  {
    id: 'two-column',
    label: '사이드바',
    desc: '고정 폭 사이드바와 남은 공간을 채우는 본문',
    container: {
      gridTemplateColumns: [{ size: 200, unit: 'px' }, { size: 1, unit: 'fr' }],
      gridTemplateRows: [{ size: 1, unit: 'fr' }],
      gridTemplateAreas: 'none',
      rowGap: '12px',
      columnGap: '12px',
      justifyItems: 'stretch',
      alignItems: 'stretch',
      justifyContent: 'start',
      alignContent: 'start',
      gridAutoFlow: 'row',
      gridAutoColumns: 'auto',
      gridAutoRows: 'auto',
    },
    items: [
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: null, height: null },
    ],
  },
  {
    id: 'centered',
    label: '정중앙 배치',
    desc: '고정 크기 판을 컨테이너 한가운데에 놓는다',
    container: {
      gridTemplateColumns: [{ size: 120, unit: 'px' }, { size: 120, unit: 'px' }],
      gridTemplateRows: [{ size: 80, unit: 'px' }, { size: 80, unit: 'px' }],
      gridTemplateAreas: 'none',
      rowGap: '10px',
      columnGap: '10px',
      justifyItems: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      alignContent: 'center',
      gridAutoFlow: 'row',
      gridAutoColumns: 'auto',
      gridAutoRows: 'auto',
    },
    items: [
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: 80, height: 56 },
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: 80, height: 56 },
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: 80, height: 56 },
      { gridArea: 'auto', gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto', justifySelf: 'auto', alignSelf: 'auto', width: 80, height: 56 },
    ],
  },
];

export default GRID_PRESETS;
