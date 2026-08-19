/**
 * topics/grid/explain.js — Grid 속성 설명 탭의 보충 콘텐츠
 *
 * 설명 문장 본체(desc · tip · values[].desc)는 schema.js 에 있다. 여기에는
 * 스키마가 담지 못하는 세 가지만 둔다.
 *
 *   samples — enum 이 아닌 속성의 대표 사례. 스키마에는 "어떤 값을 나란히
 *             보여줄지" 가 없다. 사례마다 desc 를 붙이는 것은 값 자체가 설명을
 *             필요로 하기 때문이다 — enum 의 values[].desc 와 같은 자리다
 *   demos   — 데모 판 설정 덮어쓰기. 조건부 속성(유형 B)은 조건이 성립하는 판에서만
 *             값 차이가 보인다
 *   display — 데모 컨테이너의 display. Grid 는 grid 다
 *
 * 문장을 새로 쓰지 않는다. samples 의 desc 는 그 값이 무엇인지 한 줄로 적은 것이고,
 * 속성이 무엇인지는 스키마의 desc · tip 이 말한다.
 */

/** 데모 컨테이너는 그리드여야 한다. flex 로 두면 트랙이 서지 않는다. */
export const GRID_DISPLAY = 'grid';

/**
 * enum 이 아닌 속성 12개의 대표 사례.
 *
 * 값이 자유 형식이라 "값별 데모" 가 성립하지 않는다. 대신 실무에서 자주 쓰는
 * 형태 몇 가지를 골라 나란히 둔다 — 트랙 목록이면 균등·비균등·자동, 라인 좌표면
 * 번호·음수·span 같은 식이다. enum 의 values 가 하던 일을 사례가 대신한다.
 */
export const GRID_EXPLAIN_SAMPLES = {
  'grid-template-columns': [
    { val: '1fr 1fr 1fr', desc: '세 열을 똑같이 나눕니다' },
    { val: '200px 1fr', desc: '왼쪽은 고정, 오른쪽은 남는 만큼' },
    { val: 'repeat(4, 1fr)', desc: 'repeat()로 같은 트랙을 줄여 적습니다' },
    { val: 'minmax(120px, 1fr) 1fr', desc: '첫 열은 120px 아래로 줄지 않습니다' },
    { val: 'auto 1fr auto', desc: '양쪽은 내용만큼, 가운데가 남는 자리를 먹습니다' },
  ],
  'grid-template-rows': [
    { val: 'auto', desc: '내용 높이만큼 (기본값)' },
    { val: '60px 60px', desc: '두 행을 60px로 고정' },
    { val: '1fr 2fr', desc: '아래 행이 위 행의 두 배' },
    { val: 'repeat(3, 40px)', desc: '같은 높이의 행 세 개' },
  ],
  'grid-template-areas': [
    { val: 'none', desc: '영역을 두지 않습니다 (기본값)' },
    { val: '"hd hd" "sd mn"', desc: '머리글이 두 칸, 아래는 사이드바와 본문' },
    { val: '"hd hd" ". mn"', desc: '마침표는 빈 칸입니다' },
  ],
  'row-gap': [
    { val: '0px', desc: '행 사이를 붙입니다' },
    { val: '8px', desc: '기본 간격' },
    { val: '24px', desc: '넓은 간격' },
  ],
  'column-gap': [
    { val: '0px', desc: '열 사이를 붙입니다' },
    { val: '8px', desc: '기본 간격' },
    { val: '24px', desc: '넓은 간격' },
  ],
  'grid-auto-columns': [
    { val: 'auto', desc: '내용만큼 (기본값)' },
    { val: '60px', desc: '자동 생성된 열을 60px로' },
    { val: '1fr', desc: '남는 자리를 나눠 갖게' },
  ],
  'grid-auto-rows': [
    { val: 'auto', desc: '내용만큼 (기본값)' },
    { val: '40px', desc: '자동 생성된 행을 40px로' },
    { val: '1fr', desc: '남는 높이를 자동 생성된 행끼리 나눠 갖습니다' },
  ],
  'grid-column-start': [
    { val: 'auto', desc: '자동 배치에 맡깁니다 (기본값)' },
    { val: '2', desc: '2번 라인에서 시작' },
    { val: '3', desc: '3번 라인에서 시작' },
    { val: '-2', desc: '끝에서 두 번째 라인. 음수는 뒤에서 셉니다' },
  ],
  'grid-column-end': [
    { val: 'auto', desc: '한 칸만 차지 (기본값)' },
    { val: '3', desc: '3번 라인에서 끝. 1에서 시작하면 두 칸입니다' },
    { val: 'span 2', desc: '끝 라인 대신 칸 수로 지정' },
    { val: '-1', desc: '마지막 라인까지' },
  ],
  'grid-row-start': [
    { val: 'auto', desc: '자동 배치에 맡깁니다 (기본값)' },
    { val: '2', desc: '2번 가로 라인에서 시작' },
    { val: '-2', desc: '끝에서 두 번째 가로 라인' },
  ],
  'grid-row-end': [
    { val: 'auto', desc: '한 칸만 차지 (기본값)' },
    { val: '3', desc: '3번 가로 라인에서 끝' },
    { val: 'span 2', desc: '두 행을 차지' },
  ],
  'grid-area': [
    { val: 'auto', desc: '자동 배치에 맡깁니다 (기본값)' },
    { val: 'hd', desc: 'grid-template-areas에 정의한 이름' },
    { val: '1 / 1 / 3 / 2', desc: '네 라인을 한 번에 — 행시작 / 열시작 / 행끝 / 열끝' },
  ],
};

/**
 * 데모 판 설정.
 *
 * 조건부 속성(F-13 유형 B)은 조건이 성립하는 판에서만 값 차이가 보인다.
 * 트랙이 fr 이면 justify-content 가 옮길 여백이 없고, 암시적 트랙이 없으면
 * grid-auto-* 가 정할 대상이 없다. 값을 바꿔도 그림이 같다면 판이 틀린 것이다.
 *
 * 스키마의 demo 에 이미 들어 있는 것은 여기 다시 적지 않는다. 덮어쓰는 것만 둔다.
 */
export const GRID_EXPLAIN_DEMOS = {
  // 트랙 목록은 값 자체가 판이므로 컨테이너에 다른 트랙을 걸지 않는다
  'grid-template-columns': { itemCount: 5, containerStyle: { height: '80px' } },
  'grid-template-rows': { itemCount: 4, containerStyle: { height: '140px', gridTemplateColumns: 'repeat(2, 1fr)' } },
  'grid-template-areas': { itemCount: 4, containerStyle: { height: '110px', gridTemplateColumns: 'repeat(2, 1fr)' } },

  'row-gap': { itemCount: 6, containerStyle: { height: '120px', gridTemplateColumns: 'repeat(3, 1fr)' } },
  'column-gap': { itemCount: 6, containerStyle: { height: '120px', gridTemplateColumns: 'repeat(3, 1fr)' } },

  /* ---- 조건부 5건. 각 조건을 판에 심는다 ---- */

  // 트랙이 px 라야 남는 가로 여백이 생긴다. fr 이면 꽉 차서 아무 변화가 없다
  'justify-content': { itemCount: 3, containerStyle: { gridTemplateColumns: '60px 60px 60px', height: '70px' } },

  // 높이가 있어야 줄 뭉치를 세로로 옮길 자리가 생긴다
  'align-content': { itemCount: 6, containerStyle: { height: '180px', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '40px 40px' } },

  /**
   * 자동 배치가 열 방향이라 선언하지 않은 열이 생긴다.
   * 아이템 크기를 비워 두는 것이 핵심이다 — 크기가 박혀 있으면 auto 든 60px 든
   * 1fr 든 아이템이 같은 자리를 차지해 세 값이 같은 그림이 된다.
   */
  'grid-auto-columns': {
    itemCount: 4,
    itemSizes: 'fill',
    /**
     * justify-content: start 가 있어야 auto 와 1fr 이 갈린다.
     * 기본값 normal 은 auto 트랙을 늘려 컨테이너를 채우므로 둘이 같은 그림이 된다 —
     * CSS 가 그렇게 동작하는 것이지 판이 틀린 것은 아니지만, 여기서 보여야 할 것은
     * "auto 는 내용만큼, 1fr 은 남는 만큼" 이다.
     */
    containerStyle: {
      height: '80px', gridTemplateColumns: '40px', gridAutoFlow: 'column', justifyContent: 'start',
    },
  },

  // 행을 하나만 선언해 나머지가 자동 생성되게 한다. 여기도 크기를 비운다
  'grid-auto-rows': {
    itemCount: 6,
    itemSizes: 'fill',
    // align-content: start 를 두는 이유는 위와 같다. normal 이면 auto 행이 늘어난다
    containerStyle: {
      height: '190px', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '30px',
      alignContent: 'start',
    },
  },

  /**
   * dense 는 메울 빈 칸이 있어야 일한다.
   *
   * 앞의 두 아이템이 각각 두 칸을 차지하게 한다. 세 열짜리 판에서 첫 아이템이
   * 1~2 열을 먹으면 둘째는 남은 한 칸에 들어가지 못해 다음 줄로 넘어가고,
   * 첫 줄 셋째 칸이 빈다. dense 가 아니면 그 칸이 그대로 비고, dense 면 뒤
   * 아이템이 거슬러 올라와 메운다.
   */
  'grid-auto-flow': {
    itemCount: 6,
    itemSizes: 'fill',
    containerStyle: { height: '150px', gridTemplateColumns: 'repeat(3, 1fr)' },
    itemStyles: [{ gridColumn: 'span 2' }, { gridColumn: 'span 2' }],

    /**
     * 열 흐름은 다른 판을 쓴다.
     *
     * 위 판을 열 흐름으로 돌리면 명시한 행이 없어 격자가 한 행이 된다. 아이템이
     * 옆으로만 늘어서므로 dense 가 거슬러 올라가 메울 세로 칸이 아예 생기지
     * 않는다 — 실측에서 column 과 column dense 가 글자 하나까지 같았던 이유다.
     *
     * 그래서 행을 셋 선언하고, 스팬을 열이 아니라 행에 건다. 첫 아이템이 c1 의
     * 두 행을 먹으면 둘째는 남은 한 행에 들어가지 못해 다음 열로 넘어가고
     * c1 의 마지막 행이 빈다. dense 가 아니면 그대로 비고, dense 면 뒤 아이템이
     * 거슬러 올라와 메운다 — 행 흐름 판과 정확히 같은 이야기를 축만 바꿔 한다.
     */
    byValue: {
      column: {
        containerStyle: { height: '150px', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' },
        itemStyles: [{ gridRow: 'span 2' }, { gridRow: 'span 2' }],
      },
      'column dense': {
        containerStyle: { height: '150px', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' },
        itemStyles: [{ gridRow: 'span 2' }, { gridRow: 'span 2' }],
      },
    },
  },

  /* ---- 라인 좌표는 번호가 보여야 읽힌다 ---- */
  'grid-column-start': { itemCount: 6, lines: true, containerStyle: { height: '110px', gridTemplateColumns: 'repeat(3, 1fr)' } },
  'grid-column-end': { itemCount: 6, lines: true, containerStyle: { height: '110px', gridTemplateColumns: 'repeat(3, 1fr)' } },
  'grid-row-start': { itemCount: 6, lines: true, containerStyle: { height: '140px', gridTemplateColumns: 'repeat(3, 1fr)' } },
  'grid-row-end': { itemCount: 6, lines: true, containerStyle: { height: '140px', gridTemplateColumns: 'repeat(3, 1fr)' } },

  // 이름으로 배치하려면 그 이름이 정의돼 있어야 한다
  'grid-area': {
    itemCount: 4,
    lines: true,
    containerStyle: {
      height: '120px',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridTemplateAreas: '"hd hd" "sd mn"',
    },
  },

  // 칸을 채우는 모습을 보여야 하므로 아이템에 크기를 주지 않는다
  'justify-items': { itemCount: 6, itemSizes: 'fill', containerStyle: { height: '120px', gridTemplateColumns: 'repeat(3, 1fr)' } },
  'justify-self': { itemCount: 6, itemSizes: 'fill', containerStyle: { height: '120px', gridTemplateColumns: 'repeat(3, 1fr)' } },
  'align-items': { itemCount: 6, itemSizes: 'fill', containerStyle: { height: '160px', gridTemplateColumns: 'repeat(3, 1fr)' } },
  'align-self': { itemCount: 6, itemSizes: 'fill', containerStyle: { height: '160px', gridTemplateColumns: 'repeat(3, 1fr)' } },
};

/**
 * 스키마 tip 과 겹치지 않는 보충만 둔다.
 *
 * Grid 는 라인과 트랙을 구분하는 것이 처음에 가장 걸린다. 그 한 문장만 더한다.
 */
export const GRID_EXPLAIN_NOTES = {
  'grid-template-columns': '📐 트랙은 칸이고 라인은 그 경계입니다. 열이 3개면 라인은 4개입니다.',
  'grid-column-start': '💡 아래 번호 띠가 라인입니다. 양수와 음수가 같은 자리를 가리킵니다.',
  'grid-auto-flow': '💡 dense는 앞에 남은 빈 칸을 뒤 아이템으로 메웁니다. 소스 순서가 시각 순서와 달라집니다.',
};

export default { GRID_EXPLAIN_SAMPLES, GRID_EXPLAIN_DEMOS, GRID_EXPLAIN_NOTES, GRID_DISPLAY };
