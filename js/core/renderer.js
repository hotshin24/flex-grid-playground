/**
 * renderer.js — 프리뷰 DOM 렌더링 (M1)
 *
 * store를 구독해 상태가 바뀔 때마다 프리뷰를 갱신한다.
 *
 * 이 파일의 존재 이유는 "속성 변화가 눈에 보이는 것"이므로 CSS 트랜지션은
 * 기능이다. 따라서 DOM을 다시 만들지 않는다.
 *
 *   - innerHTML을 쓰지 않는다.
 *   - 아이템 개수가 바뀔 때만 요소를 추가·제거한다.
 *   - 그 외에는 같은 요소의 스타일만 in-place로 갱신한다.
 *   - 값이 실제로 바뀐 속성만 기록한다 (직전 적용값을 요소별로 기억).
 *
 * 어떤 속성을 DOM에 반영할지는 토픽 schema.js에서 나온다. 속성이 추가돼도
 * 이 파일은 고치지 않는다.
 *
 * 색상은 CSS가 담당한다. 이 파일은 클래스와 사용자 설정값만 얹는다.
 */

import { trackToCss, spanToCss } from './schema-spec.js';

/* --------------------------------------------------------------------------
   DOM 계약
   클래스 이름은 components.css가 받는다. 여기서 색·간격을 직접 쓰지 않는다.
   -------------------------------------------------------------------------- */

export const CONTAINER_CLASS = 'fgp-preview__container';
export const ITEM_CLASS = 'fgp-preview__item';
export const SELECTED_CLASS = 'is-selected';

/** 토픽별 컨테이너 display. 스키마 속성이 아니라 토픽 자체의 성질이다. */
const DISPLAY_BY_TOPIC = { flex: 'flex', grid: 'grid' };
const DEFAULT_DISPLAY = 'flex';

/**
 * 아이템 강조색은 tokens.css의 --fgp-item-1 ~ --fgp-item-8을 순환한다.
 *
 * 인덱스별 semantic 별칭을 --fgp-item-accent에 대입하는 것이 전부다.
 * 어떤 primitive에 걸리는지는 tokens.css가 정하며, 테마별로 달라질 수 있다.
 */
const ITEM_ACCENT_COUNT = 8;
const ITEM_ACCENT_PROP = '--fgp-item-accent';
const ITEM_ACCENT_DEEP_PROP = '--fgp-item-accent-deep';

/* --------------------------------------------------------------------------
   값 직렬화
   스키마의 내부 표현을 CSS 값 문자열로 바꾼다.
   -------------------------------------------------------------------------- */

/** areas 2차원 배열 → '"hd hd" "sd mn"' */
function areasToCss(rows) {
  return rows.map((row) => `"${row.join(' ')}"`).join(' ');
}

/**
 * 스키마 항목 하나의 상태값을 CSS 값으로 바꾼다.
 * 문자열·숫자는 그대로 통과하므로 enum·length·number·text는 분기가 없다.
 */
export function toCssValue(entry, raw) {
  if (raw === undefined || raw === null) return '';

  if (entry.control === 'track-list' && Array.isArray(raw)) {
    return raw.map(trackToCss).join(' ');
  }

  if (entry.control === 'area-grid' && Array.isArray(raw)) {
    return areasToCss(raw);
  }

  if (entry.control === 'span' && typeof raw === 'object') {
    return spanToCss(raw);
  }

  return String(raw);
}

/* --------------------------------------------------------------------------
   스타일 적용
   -------------------------------------------------------------------------- */

/**
 * 요소별 직전 적용값. 값이 바뀐 속성만 건드리기 위한 것이며,
 * 이게 없으면 매 렌더마다 같은 값을 다시 써서 트랜지션이 흔들릴 수 있다.
 */
const applied = new WeakMap();

/**
 * next에 있는 속성만 남기고 in-place로 갱신한다.
 * 토픽이 바뀌어 사라진 속성은 빈 문자열로 지운다 (요소는 재사용).
 */
function applyStyles(el, next) {
  const prev = applied.get(el) ?? {};

  for (const [jsProp, value] of Object.entries(next)) {
    if (prev[jsProp] !== value) el.style[jsProp] = value;
  }

  for (const jsProp of Object.keys(prev)) {
    if (!(jsProp in next)) el.style[jsProp] = '';
  }

  applied.set(el, next);
}

/** 스키마의 해당 scope 속성만 골라 CSS 값 묶음을 만든다. */
function styleBundle(schema, scope, source) {
  const out = {};

  for (const entry of schema) {
    if (entry.scope !== scope) continue;
    out[entry.jsProp] = toCssValue(entry, source[entry.jsProp]);
  }

  return out;
}

/* --------------------------------------------------------------------------
   렌더러
   -------------------------------------------------------------------------- */

/**
 * @param {Object}   config
 * @param {Object}   config.store    createStore()가 만든 저장소
 * @param {Object}   config.schemas  { [topic]: schema[] }
 * @param {Element}  config.root     마운트 지점
 * @param {Document} [config.doc]    문서 객체. 테스트에서 대체 가능
 */
/* --------------------------------------------------------------------------
   렌더 결과 측정 (F-13 유형 B·C)

   어떤 속성은 값이 옳아도 조건이 안 맞으면 아무 일도 하지 않는다. 남는 공간이
   없으면 flex-grow 가, 넘치지 않으면 flex-shrink 가 그렇다. 그 조건은 상태만
   봐서는 알 수 없고 실제로 그려진 결과를 재야 안다.

   여기서 하는 일은 재는 것까지다. 어떤 속성이 어떤 키에 매여 있는지는 스키마의
   measuredInactive 가 정하고, 판정은 schema-spec 의 isInactive 가 한다.
   이 파일에 속성 이름이 없다.

   ★ 잰 값을 store 에 넣지 않는다. 넣으면 구독자가 반응해 다시 렌더하고 다시
   재는 고리가 생긴다 (PRD 8장 리스크). 렌더러가 들고 있다가 onMeasure 로
   알리기만 한다 — 그 통지를 받는 쪽은 컨트롤 표시만 갈아 끼우므로 렌더가
   다시 돌지 않는다.
   -------------------------------------------------------------------------- */

/** 재기 전. DOM 이 없는 환경(검증 스크립트)에서도 이 모양이 그대로 나간다. */
export const EMPTY_MEASURED = Object.freeze({
  lineCount: 0,
  hasFreeSpace: false,
  hasCrossFreeSpace: false,
  isOverflowing: false,
  shrinkBlocked: false,
  canShrink: false,
  crossAuto: false,
  hasImplicitColumns: false,
  hasImplicitRows: false,
  hasPlacementGaps: false,
});

/** 1px 미만은 반올림 오차로 본다. 이보다 작은 틈을 "남는 공간"이라 하지 않는다. */
const SLACK = 1;

const num = (v) => Number.parseFloat(v) || 0;

/** 'none' 이면 트랙이 없다는 뜻이다. 그리드가 아니면 늘 그렇다. */
function trackSizes(value) {
  const raw = String(value ?? '').trim();
  if (raw === '' || raw === 'none') return null;
  const sizes = raw.split(/\s+/).map(Number.parseFloat).filter(Number.isFinite);
  return sizes.length > 0 ? sizes : null;
}

/** 같은 줄에 선 아이템끼리 묶는다. 교차축 시작 위치가 같으면 한 줄이다. */
function groupLines(rects, vertical) {
  const key = vertical ? 'left' : 'top';
  const lines = new Map();
  rects.forEach((r) => {
    const at = Math.round(r[key]);
    if (!lines.has(at)) lines.set(at, []);
    lines.get(at).push(r);
  });
  return [...lines.values()];
}

export function createRenderer({ store, schemas, root, doc = globalThis.document }) {
  if (!store) throw new Error('createRenderer: store가 필요합니다');
  if (!schemas) throw new Error('createRenderer: schemas가 필요합니다');
  if (!root) throw new Error('createRenderer: root 요소가 필요합니다');
  if (!doc) throw new Error('createRenderer: document를 찾을 수 없습니다');

  const container = doc.createElement('div');
  container.className = CONTAINER_CLASS;
  root.appendChild(container);

  function createItemEl() {
    const el = doc.createElement('div');
    el.className = ITEM_CLASS;
    return el;
  }

  /** 개수 차이만큼만 요소를 늘리거나 줄인다. 기존 요소는 건드리지 않는다. */
  function resize(count) {
    while (container.children.length < count) {
      container.appendChild(createItemEl());
    }
    while (container.children.length > count) {
      container.removeChild(container.children[container.children.length - 1]);
    }
  }

  function renderItem(el, item, index, schema, selectedId) {
    const accent = (index % ITEM_ACCENT_COUNT) + 1;
    el.style.setProperty(ITEM_ACCENT_PROP, `var(--fgp-item-${accent})`);
    el.style.setProperty(ITEM_ACCENT_DEEP_PROP, `var(--fgp-item-${accent}-deep)`);

    const styles = styleBundle(schema, 'item', item);
    styles.width = `${item.width}px`;
    styles.height = `${item.height}px`;
    applyStyles(el, styles);

    const selected = item.id === selectedId;
    el.classList.toggle(SELECTED_CLASS, selected);
    el.setAttribute('data-item-id', String(item.id));
    el.setAttribute('aria-selected', String(selected));

    const label = String(index + 1);
    if (el.textContent !== label) el.textContent = label;
  }

  function render() {
    const state = store.getState();
    const schema = schemas[state.topic];

    if (!schema) throw new Error(`renderer: 토픽 '${state.topic}'의 스키마가 없습니다`);

    const containerStyles = styleBundle(schema, 'container', state.container);
    containerStyles.display = DISPLAY_BY_TOPIC[state.topic] ?? DEFAULT_DISPLAY;
    containerStyles.maxWidth = `${state.containerWidth}px`;
    applyStyles(container, containerStyles);

    container.setAttribute('data-topic', state.topic);

    resize(state.items.length);

    state.items.forEach((item, i) => {
      renderItem(container.children[i], item, i, schema, state.selectedId);
    });
  }

  /* ---- 측정 ---- */

  let measured = { ...EMPTY_MEASURED };
  const listeners = new Set();

  /**
   * 실제로 그려진 결과를 잰다. 읽기만 한다.
   *
   * 축은 브라우저에게 묻는다. 계산된 flex-direction 이 column 계열이면 주축이
   * 세로다. 트랙이 있으면(그리드) 트랙 합으로, 없으면(플렉스) 줄별 아이템 합으로
   * 찬 길이를 구한다 — 토픽을 묻지 않고 계산값의 모양으로 갈린다.
   */
  function measure() {
    if (typeof globalThis.getComputedStyle !== 'function') return { ...EMPTY_MEASURED };

    const cs = globalThis.getComputedStyle(container);
    const box = container.getBoundingClientRect?.();
    if (!box) return { ...EMPTY_MEASURED };

    const inner = {
      width: box.width - num(cs.borderLeftWidth) - num(cs.borderRightWidth)
        - num(cs.paddingLeft) - num(cs.paddingRight),
      height: box.height - num(cs.borderTopWidth) - num(cs.borderBottomWidth)
        - num(cs.paddingTop) - num(cs.paddingBottom),
    };

    const vertical = String(cs.flexDirection).startsWith('column');
    const items = [...container.children];
    const rects = items.map((el) => el.getBoundingClientRect());

    const columns = trackSizes(cs.gridTemplateColumns);
    const rows = trackSizes(cs.gridTemplateRows);
    const colGap = num(cs.columnGap);
    const rowGap = num(cs.rowGap);

    const sum = (list, gap) => list.reduce((a, b) => a + b, 0) + Math.max(0, list.length - 1) * gap;

    const lines = groupLines(rects, vertical);
    const lineExtent = (line) => sum(line.map((r) => (vertical ? r.height : r.width)), vertical ? rowGap : colGap);
    const filledMain = columns && !vertical ? sum(columns, colGap)
      : rows && vertical ? sum(rows, rowGap)
        : Math.max(0, ...lines.map(lineExtent), 0);

    const crossSizes = rows && !vertical ? rows : columns && vertical ? columns : null;
    const filledCross = crossSizes
      ? sum(crossSizes, vertical ? colGap : rowGap)
      : sum(lines.map((line) => Math.max(0, ...line.map((r) => (vertical ? r.width : r.height)), 0)),
        vertical ? colGap : rowGap);

    const mainRoom = vertical ? inner.height : inner.width;
    const crossRoom = vertical ? inner.width : inner.height;

    // 아이템이 스스로 정한 크기 합. 줄어들 여지가 있는지 보는 데 쓴다.
    const declared = items.reduce((total, el) => {
      const own = num(vertical ? el.style.height : el.style.width);
      return total + own;
    }, 0) + Math.max(0, items.length - 1) * (vertical ? rowGap : colGap);

    const isOverflowing = declared - mainRoom > SLACK;
    // 넘쳤는데도 실제로 줄어들지 않았다면 더 줄 수 없는 상태다
    const shrinkBlocked = isOverflowing && filledMain - mainRoom > SLACK;

    // 아이템이 교차축 크기를 스스로 정했는가. 정했으면 stretch 가 할 일이 없다.
    const crossAuto = items.length > 0 && items.some((el) => {
      const own = vertical ? el.style.width : el.style.height;
      return own === '' || own === 'auto';
    });

    const explicit = (inlineValue) => {
      const list = trackSizes(inlineValue);
      return list ? list.length : 0;
    };

    return {
      lineCount: lines.length,
      hasFreeSpace: mainRoom - filledMain > SLACK,
      hasCrossFreeSpace: crossRoom - filledCross > SLACK,
      isOverflowing,
      shrinkBlocked,
      canShrink: isOverflowing && !shrinkBlocked,
      crossAuto,
      hasImplicitColumns: Boolean(columns) && columns.length > explicit(container.style.gridTemplateColumns),
      hasImplicitRows: Boolean(rows) && rows.length > explicit(container.style.gridTemplateRows),
      // 배치되지 않은 빈 칸이 있는가. 칸 수보다 아이템이 적으면 dense 가 메울 자리가 있다.
      hasPlacementGaps: Boolean(columns && rows) && columns.length * rows.length > items.length,
    };
  }

  /** 재고 알린다. 통지를 받는 쪽은 컨트롤 표시만 바꾼다 — 렌더가 다시 돌지 않는다. */
  function remeasure() {
    measured = measure();
    listeners.forEach((fn) => fn(measured));
    return measured;
  }

  const unsubscribe = store.subscribe(() => { render(); remeasure(); });
  render();
  remeasure();

  /**
   * 첫 측정은 한 프레임 뒤에 다시 한다.
   *
   * 모듈이 도는 시점에는 아직 배치가 끝나지 않아 사각형이 전부 0 이다. 그대로
   * 두면 "남는 공간 없음 · 넘치지 않음" 으로 읽혀 멀쩡한 컨트롤이 첫 화면에서
   * 회색으로 뜬다. 배치가 끝난 뒤 한 번 더 재서 바로잡는다.
   */
  if (typeof globalThis.requestAnimationFrame === 'function') {
    globalThis.requestAnimationFrame(() => remeasure());
  }

  /** 구독을 끊고 만들어 둔 DOM을 걷어낸다. */
  function destroy() {
    unsubscribe();
    if (container.parentNode === root) root.removeChild(container);
  }

  return {
    render,
    destroy,
    getContainer: () => container,
    getMeasured: () => measured,
    remeasure,
    /** 측정 결과 구독. store 구독과 별개 경로다. */
    onMeasure(fn) {
      listeners.add(fn);
      fn(measured);
      return () => listeners.delete(fn);
    },
  };
}

export default createRenderer;
