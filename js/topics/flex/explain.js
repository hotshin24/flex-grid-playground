/**
 * topics/flex/explain.js — 속성 설명 탭의 보충 콘텐츠
 *
 * 설명 문장 본체(desc · tip · values[].desc)는 schema.js에 있다. 여기에는
 * 스키마가 담지 못하는 두 가지만 둔다.
 *
 *   notes   — v0.1 EXPLAIN_DATA의 note. 스키마의 tip과 겹치지 않는 것만 옮겼다
 *   samples — enum이 아닌 속성의 데모용 값 목록. 스키마에는 min·max·units만
 *             있어서 "어떤 값을 나란히 보여줄지"는 여기서 정한다
 *
 * 문장은 v0.1에서 그대로 가져왔다. 새로 쓰지 않는다.
 */

/**
 * 스키마 tip과 중복되지 않는 note만 남겼다.
 *
 * 옮기지 않은 것: align-content · gap · flex · order 의 note는 새 스키마의
 * tip이 같은 내용을 이미 더 정확히 담고 있다. 두 번 보여줄 이유가 없다.
 *
 * flex-grow · align-self 의 note는 "조작 탭"이라는 v0.1 UI 이름을 가리켰다.
 * 그 탭은 이제 플레이그라운드다. 문장에서 이름 한 단어만 바꿨다.
 */
export const FLEX_EXPLAIN_NOTES = {
  'flex-wrap': '💡 아이템을 많이 추가하고 wrap으로 바꿔보세요. 반응형 레이아웃에 유용합니다.',
  'justify-content': '📐 주축(flex-direction 방향)을 따라 정렬합니다. row면 가로축, column이면 세로축.',
  'align-items': '📐 교차축(주축의 수직 방향)을 따라 정렬합니다. row면 세로축, column이면 가로축.',
  'flex-grow': '💡 플레이그라운드 탭에서 아이템을 선택하고 flex-grow 슬라이더를 올려보세요.',
  'flex-shrink': '⚠️ flex-shrink: 0 은 사이드바처럼 너비를 고정해야 하는 요소에 자주 사용합니다.',
  'align-self': '💡 플레이그라운드 탭에서 아이템을 선택하면 align-self를 개별로 바꿔볼 수 있습니다.',
};

/**
 * enum이 아닌 속성의 데모 값. v0.1 EXPLAIN_DATA의 values를 그대로 옮겼다.
 * enum 속성은 스키마의 values를 쓰므로 여기에 없다.
 */
export const FLEX_EXPLAIN_SAMPLES = {
  gap: [
    { val: '0px', desc: '간격 없음' },
    { val: '8px', desc: '기본 간격' },
    { val: '16px', desc: '넓은 간격' },
    { val: '24px', desc: '더 넓은 간격' },
  ],
  'flex-grow': [
    { val: 0, desc: '늘어나지 않음 (기본값)' },
    { val: 1, desc: '남은 공간을 균등하게 차지' },
    { val: 2, desc: 'grow:1 아이템의 2배 공간 차지' },
  ],
  'flex-shrink': [
    { val: 1, desc: '기본적으로 줄어듦 (기본값)' },
    { val: 0, desc: '줄어들지 않음 (고정 크기)' },
    { val: 2, desc: '다른 아이템보다 2배 빠르게 줄어듦' },
  ],
  'flex-basis': [
    { val: 'auto', desc: '콘텐츠 크기 또는 width 사용 (기본값)' },
    { val: '80px', desc: '80px 고정 기본 크기' },
    { val: '140px', desc: '140px 고정 기본 크기' },
    { val: '50%', desc: '컨테이너의 50% 기본 크기' },
  ],
  order: [
    { val: 0, label: 'order: 0', desc: '기본 순서 (기본값)' },
    { val: -1, label: 'order: -1', desc: '다른 0 아이템보다 앞으로' },
    { val: 1, label: 'order: 1', desc: '다른 0 아이템보다 뒤로' },
    { val: 2, label: 'order: 2', desc: '가장 뒤로 이동' },
  ],
};

/** 주축 방향 데모의 표시 이름. axisAware 속성에서만 쓴다. */
export const AXIS_LABELS = {
  row: 'flex-direction: row',
  column: 'flex-direction: column',
};

export default { FLEX_EXPLAIN_NOTES, FLEX_EXPLAIN_SAMPLES, AXIS_LABELS };
