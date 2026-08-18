/**
 * check-renderer.mjs — renderer.js 동작 확인
 *
 * jsdom을 쓰지 않는다. renderer가 실제로 호출하는 DOM API만 이 파일 안에서
 * 최소 구현해 주입하고, 그 스텁을 관찰해 검증한다.
 * 확인 범위는 DOM 구조·요소 재사용·스타일 값 반영까지이며,
 * 실제 레이아웃 계산이나 트랜지션 재생은 브라우저 몫이다.
 *
 *   node tools/check-renderer.mjs
 */

import { createStore } from '../js/core/store.js';
import { createRenderer, toCssValue, ITEM_CLASS, CONTAINER_CLASS, SELECTED_CLASS } from '../js/core/renderer.js';
import { FLEX_SCHEMA } from '../js/topics/flex/schema.js';
import { GRID_SCHEMA } from '../js/topics/grid/schema.js';

let failed = 0;

function check(label, ok, detail = '') {
  console.log(`  [${ok ? 'OK  ' : 'FAIL'}] ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ==========================================================================
   최소 DOM 스텁 — renderer가 쓰는 API만 구현한다
   ========================================================================== */

function makeDom() {
  const stats = { created: 0, innerHTMLWrites: 0 };

  function makeStyle() {
    const custom = new Map();
    return {
      setProperty(name, value) { custom.set(name, value); },
      getPropertyValue(name) { return custom.get(name) ?? ''; },
    };
  }

  function createElement(tag) {
    stats.created++;
    const classes = new Set();

    const el = {
      tagName: String(tag).toUpperCase(),
      className: '',
      children: [],
      parentNode: null,
      textContent: '',
      style: makeStyle(),
      attrs: {},
      classList: {
        add: (n) => classes.add(n),
        remove: (n) => classes.delete(n),
        contains: (n) => classes.has(n),
        toggle: (n, force) => (force ? classes.add(n) : classes.delete(n), Boolean(force)),
      },
      appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
      },
      removeChild(child) {
        const i = this.children.indexOf(child);
        if (i === -1) throw new Error('removeChild: 자식이 아님');
        this.children.splice(i, 1);
        child.parentNode = null;
        return child;
      },
      setAttribute(name, value) { this.attrs[name] = String(value); },
      getAttribute(name) { return this.attrs[name] ?? null; },
    };

    // innerHTML 사용은 금지 — 쓰기 시도를 잡아낸다
    Object.defineProperty(el, 'innerHTML', {
      get: () => '',
      set: () => { stats.innerHTMLWrites++; },
    });

    return el;
  }

  return { doc: { createElement }, stats, createElement };
}

function setup(options = {}) {
  const dom = makeDom();
  const root = dom.createElement('div');
  const store = createStore({ flex: FLEX_SCHEMA, grid: GRID_SCHEMA }, options);
  const renderer = createRenderer({ store, schemas: { flex: FLEX_SCHEMA, grid: GRID_SCHEMA }, root, doc: dom.doc });
  return { dom, root, store, renderer, container: renderer.getContainer() };
}

/** 아이템 개수를 바꾼다. 마지막 아이템을 복제해 id만 새로 준다. */
function withItemCount(store, n) {
  const items = store.getState().items;
  const next = [];
  for (let i = 0; i < n; i++) {
    const src = items[i] ?? items[items.length - 1];
    next.push({ ...src, id: i + 1 });
  }
  store.dispatch({ items: next });
}

/* ==========================================================================
   toCssValue — 내부 표현 → CSS 값
   ========================================================================== */
section('값 직렬화');

{
  check('track-list 배열', toCssValue(
    { control: 'track-list' },
    [{ size: 1, unit: 'fr' }, { size: 200, unit: 'px' }, { unit: 'auto' }]
  ) === '1fr 200px auto');

  check('area-grid 2차원 배열', toCssValue(
    { control: 'area-grid' },
    [['hd', 'hd'], ['sd', 'mn']]
  ) === '"hd hd" "sd mn"');

  check('span 객체 start/end', toCssValue({ control: 'span' }, { start: 1, end: 3 }) === '1 / 3');
  check('span 객체 start/span', toCssValue({ control: 'span' }, { start: 1, span: 2 }) === '1 / span 2');
  check('문자열은 그대로', toCssValue({ control: 'enum' }, 'flex-start') === 'flex-start');
  check('숫자는 문자열로', toCssValue({ control: 'number' }, 0) === '0');
}

/* ==========================================================================
   초기 마운트
   ========================================================================== */
section('초기 마운트');

{
  const { root, container, store } = setup();
  const s = store.getState();

  check('root에 컨테이너 1개', root.children.length === 1 && root.children[0] === container);
  check('컨테이너 클래스', container.className === CONTAINER_CLASS, container.className);
  check('아이템 수가 상태와 일치', container.children.length === s.items.length, `${container.children.length}개`);
  check('아이템 클래스', container.children.every((c) => c.className === ITEM_CLASS));
  check('display는 토픽에서', container.style.display === 'flex', container.style.display);
  check('data-topic 반영', container.getAttribute('data-topic') === 'flex');
  check('containerWidth 반영', container.style.maxWidth === '800px', container.style.maxWidth);
  check('아이템 라벨 1부터', eq(container.children.map((c) => c.textContent), ['1', '2', '3', '4']));
  check('data-item-id 반영', eq(container.children.map((c) => c.getAttribute('data-item-id')), ['1', '2', '3', '4']));
}

/* ==========================================================================
   스키마 파생 스타일 반영
   ========================================================================== */
section('스타일 값 반영');

{
  const { container, store } = setup();

  check('컨테이너 기본값 반영',
    container.style.flexDirection === 'row' && container.style.justifyContent === 'flex-start' && container.style.gap === '8px',
    `${container.style.flexDirection} / ${container.style.justifyContent} / ${container.style.gap}`);

  store.dispatch({ container: { justifyContent: 'center', flexDirection: 'column' } });
  check('dispatch 후 갱신',
    container.style.justifyContent === 'center' && container.style.flexDirection === 'column');

  check('아이템 기본값 반영',
    container.children[0].style.flexGrow === '0' && container.children[0].style.flexBasis === 'auto',
    `flexGrow=${container.children[0].style.flexGrow}`);

  const items = store.getState().items;
  items[0] = { ...items[0], flexGrow: 2, width: 120 };
  store.dispatch({ items });
  check('아이템 속성 갱신', container.children[0].style.flexGrow === '2');
  check('기하값 px 단위', container.children[0].style.width === '120px' && container.children[0].style.height === '60px');
  check('다른 아이템은 그대로', container.children[1].style.flexGrow === '0');

  store.undo();
  check('undo가 스타일까지 원복',
    container.children[0].style.flexGrow === '0' && container.children[0].style.width === '80px');
}

/* ==========================================================================
   요소 재사용 diffing
   ========================================================================== */
section('요소 재사용 (개수 불변)');

{
  const { dom, container, store } = setup();
  const before = [...container.children];
  const createdAfterMount = dom.stats.created;

  store.dispatch({ container: { justifyContent: 'space-between' } });
  store.dispatch({ container: { alignItems: 'center' } });
  store.dispatch({ selectedId: 3 });

  check('요소를 새로 만들지 않음', dom.stats.created === createdAfterMount, `createElement 추가 호출 ${dom.stats.created - createdAfterMount}회`);
  check('동일 요소 유지 (identity)', container.children.every((c, i) => c === before[i]));
  check('스타일은 갱신됨', container.style.justifyContent === 'space-between' && container.style.alignItems === 'center');
}

section('요소 재사용 (개수 증감)');

{
  const { dom, container, store } = setup();
  const before = [...container.children];
  const baseline = dom.stats.created;

  withItemCount(store, 6);
  check('4 → 6 개수 반영', container.children.length === 6);
  check('추가된 요소만 생성', dom.stats.created - baseline === 2, `${dom.stats.created - baseline}회 생성`);
  check('기존 4개 재사용', before.every((el, i) => container.children[i] === el));
  check('새 아이템도 스타일 적용', container.children[5].style.width === '80px');

  const afterGrow = [...container.children];
  const baseline2 = dom.stats.created;

  withItemCount(store, 2);
  check('6 → 2 개수 반영', container.children.length === 2);
  check('제거는 뒤에서', container.children[0] === afterGrow[0] && container.children[1] === afterGrow[1]);
  check('축소 시 생성 없음', dom.stats.created === baseline2);
  check('떼어낸 요소의 parentNode 해제', afterGrow[5].parentNode === null);

  withItemCount(store, 4);
  check('다시 늘리면 새 요소 생성', container.children.length === 4 && dom.stats.created - baseline2 === 2);
}

/* ==========================================================================
   innerHTML 금지
   ========================================================================== */
section('innerHTML 미사용');

{
  const { dom, store } = setup();
  store.dispatch({ container: { gap: '24px' } });
  withItemCount(store, 7);
  withItemCount(store, 1);
  store.setTopic('grid');
  check('innerHTML 쓰기 0회', dom.stats.innerHTMLWrites === 0, `${dom.stats.innerHTMLWrites}회`);
}

/* ==========================================================================
   선택 표시
   ========================================================================== */
section('선택 상태');

{
  const { container, store } = setup();

  check('초기 선택은 1번', container.children[0].classList.contains(SELECTED_CLASS));
  check('나머지는 미선택', !container.children[1].classList.contains(SELECTED_CLASS));
  check('aria-selected 반영',
    container.children[0].getAttribute('aria-selected') === 'true' &&
    container.children[1].getAttribute('aria-selected') === 'false');

  store.dispatch({ selectedId: 3 });
  check('선택 이동', !container.children[0].classList.contains(SELECTED_CLASS) &&
    container.children[2].classList.contains(SELECTED_CLASS));
  check('aria-selected 이동', container.children[2].getAttribute('aria-selected') === 'true');
}

/* ==========================================================================
   아이템 색 순환
   ========================================================================== */
section('아이템 강조색 순환 (--fgp-item-1~8)');

{
  const { container, store } = setup();
  withItemCount(store, 9);

  const accents = container.children.map((c) => c.style.getPropertyValue('--fgp-item-accent'));
  check('1~8 순서대로', eq(accents.slice(0, 8), [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `var(--fgp-item-${n})`)));
  check('9번째는 1로 순환', accents[8] === 'var(--fgp-item-1)', accents[8]);
  check('deep 변형도 함께',
    container.children[2].style.getPropertyValue('--fgp-item-accent-deep') === 'var(--fgp-item-3-deep)');
  check('primitive 직접 참조 없음', accents.every((v) => v.startsWith('var(--fgp-')));
}

/* ==========================================================================
   토픽 전환
   ========================================================================== */
section('토픽 전환');

{
  const { dom, container, store } = setup();
  const before = [...container.children];
  const baseline = dom.stats.created;

  store.dispatch({ container: { flexDirection: 'column' } });
  store.setTopic('grid');

  check('display가 grid로', container.style.display === 'grid', container.style.display);
  check('data-topic 갱신', container.getAttribute('data-topic') === 'grid');
  check('track-list 직렬화', container.style.gridTemplateColumns === '1fr 1fr 1fr', container.style.gridTemplateColumns);
  check('length 속성 반영', container.style.rowGap === '12px' && container.style.columnGap === '12px');
  check('flex 전용 속성 제거', container.style.flexDirection === '', `[${container.style.flexDirection}]`);
  check('토픽 전환에도 요소 재사용',
    dom.stats.created === baseline && container.children.every((c, i) => c === before[i]));

  store.setTopic('flex');
  check('flex 복귀 시 값 복원', container.style.flexDirection === 'column' && container.style.display === 'flex');
  check('grid 전용 속성 제거', container.style.gridTemplateColumns === '');
}

/* ==========================================================================
   destroy
   ========================================================================== */
section('destroy');

{
  const { root, container, store, renderer } = setup();
  renderer.destroy();

  check('컨테이너 제거', root.children.length === 0 && container.parentNode === null);

  const snapshot = container.style.justifyContent;
  store.dispatch({ container: { justifyContent: 'space-evenly' } });
  check('구독 해제 후 갱신 없음', container.style.justifyContent === snapshot, `[${container.style.justifyContent}]`);
}

/* ==========================================================================
   방어
   ========================================================================== */
section('방어');

{
  let threw = 0;
  const dom = makeDom();
  const store = createStore({ flex: FLEX_SCHEMA });
  const root = dom.createElement('div');

  try { createRenderer({ schemas: {}, root, doc: dom.doc }); } catch { threw++; }
  try { createRenderer({ store, root, doc: dom.doc }); } catch { threw++; }
  try { createRenderer({ store, schemas: {}, doc: dom.doc }); } catch { threw++; }
  try { createRenderer({ store, schemas: {}, root, doc: dom.doc }); } catch { threw++; }
  check('잘못된 구성 4종 거부', threw === 4, `${threw}/4`);
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
