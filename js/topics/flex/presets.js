/**
 * topics/flex/presets.js — Flex 프리셋 (F-11)
 *
 * v0.1 js/app.js 의 applyPreset() 에 있던 5종을 설정값 그대로 옮겼다.
 * 라벨도 v0.1 index.html 의 버튼 문구를 쓴다. desc 는 무엇에 쓰는 배치인지
 * 한 줄로 덧붙인 것이다.
 *
 * container·items 의 키는 스키마의 jsProp 이다. 오타가 나면 조용히 무시되므로
 * tools/check-presets.mjs 가 실제 스키마와 대조한다.
 *
 * 아이템에는 스키마 속성과 기하값(width·height)만 둔다. id 는 적용하는 쪽이
 * 붙인다 — 프리셋이 id 를 들고 있으면 상태의 id 체계와 어긋난다.
 */

export const FLEX_PRESETS = [
  {
    id: 'center',
    label: '가운데 정렬',
    desc: '한 덩어리를 화면 정중앙에 놓는다',
    container: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'normal',
      gap: '8px',
    },
    items: [
      { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0, width: 120, height: 80 },
    ],
  },
  {
    id: 'nav',
    label: '네비게이션',
    desc: '로고와 메뉴를 양끝에 두고 가운데를 늘린다',
    container: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignContent: 'normal',
      gap: '8px',
    },
    items: [
      { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0, width: 100, height: 50 },
      { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0, width: 80, height: 50 },
      { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0, width: 80, height: 50 },
    ],
  },
  {
    id: 'card',
    label: '카드 그리드',
    desc: '넘치면 다음 줄로 넘겨 카드를 깐다',
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      alignContent: 'flex-start',
      gap: '12px',
    },
    items: [
      { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0, width: 110, height: 90 },
      { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0, width: 110, height: 90 },
      { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0, width: 110, height: 90 },
      { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0, width: 110, height: 90 },
      { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0, width: 110, height: 90 },
    ],
  },
  {
    id: 'sidebar',
    label: '사이드바',
    desc: '한쪽 폭을 고정하고 나머지가 남는 자리를 먹는다',
    container: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      alignContent: 'normal',
      gap: '0px',
    },
    items: [
      { flexGrow: 0, flexShrink: 0, flexBasis: '160px', alignSelf: 'auto', order: 0, width: 160, height: 60 },
      { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0, width: 80, height: 60 },
    ],
  },
  {
    id: 'space',
    label: '양쪽 정렬',
    desc: '아이템 사이 간격을 균등하게 벌린다',
    container: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignContent: 'normal',
      gap: '0px',
    },
    items: [
      { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0, width: 80, height: 60 },
      { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0, width: 80, height: 60 },
      { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0, width: 80, height: 60 },
    ],
  },
];

export default FLEX_PRESETS;
