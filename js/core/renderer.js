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

import { trackToCss } from './schema-spec.js';

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
 * 아이템 강조색은 tokens.css의 --p-item-1 ~ --p-item-8을 순환한다.
 *
 * 규칙 5는 컴포넌트가 --p-* primitive를 직접 참조하는 것을 금지한다.
 * tokens.css에 --fgp-item-* semantic 별칭이 아직 없어 아래 한 줄에서만
 * primitive를 참조하고, 나머지 코드와 CSS는 --fgp-item-accent만 본다.
 * tokens.css를 열 수 있게 되면 이 매핑은 그쪽으로 옮기는 것이 맞다.
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

/** span 객체 → '1 / 3' 또는 '1 / span 2' */
function spanToCss(v) {
  if (v.span !== undefined) return `${v.start} / span ${v.span}`;
  if (v.end !== undefined) return `${v.start} / ${v.end}`;
  return String(v.start);
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
    el.style.setProperty(ITEM_ACCENT_PROP, `var(--p-item-${accent})`);
    el.style.setProperty(ITEM_ACCENT_DEEP_PROP, `var(--p-item-${accent}-deep)`);

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

  const unsubscribe = store.subscribe(render);
  render();

  /** 구독을 끊고 만들어 둔 DOM을 걷어낸다. */
  function destroy() {
    unsubscribe();
    if (container.parentNode === root) root.removeChild(container);
  }

  return { render, destroy, getContainer: () => container };
}

export default createRenderer;
