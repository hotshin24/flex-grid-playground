/**
 * check-grid-overlay.mjs — 라인 번호 오버레이 확인 (GR-05)
 *
 * 세 가지를 본다.
 *
 *   숫자   트랙 n 개면 라인 n+1 개이고, 같은 라인이 양수와 음수 두 이름을 갖는다.
 *   무해   재기만 하고 상태를 건드리지 않는가. store 에 올리면 렌더가 다시
 *          유발돼 무한 루프가 된다 (PRD 8장 리스크).
 *   판정   토픽을 묻지 않고 라인이 있는지로 판정하는가.
 *
 * jsdom 을 쓰지 않는다. 계산된 스타일과 사각형은 주입해 대체한다.
 *
 *   node tools/check-grid-overlay.mjs
 */

import { readFileSync } from 'node:fs';
import { createStore } from '../js/core/store.js';
import { FLEX_SCHEMA } from '../js/topics/flex/schema.js';
import { GRID_SCHEMA } from '../js/topics/grid/schema.js';
import {
  createGridOverlay, linesFrom, tracksFrom, trackSizes, explicitCount,
  ROOT_CLASS, LABEL_CLASS, TRACK_CLASS, TOGGLE_CLASS, IMPLICIT_CLASS,
} from '../js/ui/grid-overlay.js';

let failed = 0;

function check(label, ok, detail = '') {
  console.log(`  [${ok ? 'OK  ' : 'FAIL'}] ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const codeOnly = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/^\s*\/\/.*$/gm, ' ');

/* ========================================================================== */

function createElement(tag) {
  const classes = new Set();
  const listeners = {};
  const custom = new Map();
  const el = {
    tagName: String(tag).toUpperCase(),
    className: '', children: [], parentNode: null, textContent: '',
    hidden: false, disabled: false, value: '', attrs: {}, listeners,
    style: {
      setProperty(n, v) { custom.set(n, v); },
      getPropertyValue(n) { return custom.get(n) ?? ''; },
      removeProperty(n) { custom.delete(n); },
    },
    classList: {
      add: (n) => classes.add(n), remove: (n) => classes.delete(n),
      contains: (n) => classes.has(n),
      toggle: (n, force) => (force ? classes.add(n) : classes.delete(n), Boolean(force)),
    },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    removeChild(child) {
      const at = this.children.indexOf(child);
      if (at >= 0) this.children.splice(at, 1);
      child.parentNode = null;
      return child;
    },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    removeAttribute(name) { delete this.attrs[name]; },
    getAttribute(name) { return this.attrs[name] ?? null; },
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    focus() { this.focused = true; },
  };
  Object.defineProperty(el, 'firstChild', { get: () => el.children[0] ?? null });
  Object.defineProperty(el, 'innerHTML', { get: () => '', set: () => {} });
  return el;
}

const doc = { createElement };

function fire(el, type, props = {}) {
  const e = { type, target: el, ...props };
  e.preventDefault = () => {};
  let node = el;
  while (node) {
    (node.listeners?.[type] ?? []).slice().forEach((fn) => fn(e));
    node = node.parentNode;
  }
  return e;
}

const walk = (el, out = []) => { out.push(el); el.children.forEach((c) => walk(c, out)); return out; };
const byClass = (root, cls) => walk(root).filter((el) => el.className.split(' ').includes(cls));
const labelsOn = (root, side) => byClass(root, LABEL_CLASS)
  .filter((el) => el.getAttribute('data-side') === side)
  .map((el) => el.textContent);

/** renderer 가 그린 컨테이너를 흉내낸다. 계산값은 브라우저가 주는 형태로 준다. */
function fakeContainer(inline = {}) {
  const el = createElement('div');
  el.style.gridTemplateColumns = inline.gridTemplateColumns ?? '';
  el.style.gridTemplateRows = inline.gridTemplateRows ?? '';
  return el;
}

function fakeStyle(computed) {
  return () => ({ borderLeftWidth: '1px', borderTopWidth: '1px', paddingLeft: '12px', paddingTop: '12px', ...computed });
}

const fakeRect = () => ({ left: 0, top: 0, width: 0, height: 0 });

function build({ computed, inline, visible, toolbar } = {}) {
  const root = createElement('div');
  const bar = toolbar === false ? undefined : createElement('div');
  const container = fakeContainer(inline);
  const api = createGridOverlay({
    getContainer: () => container,
    root, toolbar: bar, visible, doc,
    getStyle: fakeStyle(computed ?? {}),
    getRect: fakeRect,
  });
  return { ...api, host: root, toolbar: bar, container };
}

/* ==========================================================================
   숫자 — 트랙 n 개면 라인 n+1 개
   ========================================================================== */
section('라인 번호');

{
  check('계산값을 px 배열로', JSON.stringify(trackSizes('100px 200px 50px')) === '[100,200,50]');
  check('none은 빈 배열', trackSizes('none').length === 0);
  check('빈 값도 빈 배열', trackSizes('').length === 0 && trackSizes(undefined).length === 0);

  check('명시 트랙 수를 계약으로 센다', explicitCount('1fr 1fr 1fr') === 3);
  check('minmax도 하나로 센다', explicitCount('minmax(100px, 1fr) 1fr') === 2);
  check('none이면 0', explicitCount('none') === 0 && explicitCount('') === 0);

  const three = linesFrom('100px 100px 100px', '1fr 1fr 1fr');
  check('트랙 3개 → 라인 4개', three.length === 4, `${three.length}개`);
  check('양수는 1..4', JSON.stringify(three.map((l) => l.positive)) === '[1,2,3,4]');
  check('음수는 -4..-1', JSON.stringify(three.map((l) => l.negative)) === '[-4,-3,-2,-1]');
  // 라인 수가 m 이면 k번 라인의 음수 이름은 k - (m+1) 이므로 두 이름의 차는 늘 m+1 이다
  check('같은 라인이 두 이름을 갖는다',
    three.every((l) => l.positive - l.negative === three.length + 1),
    `1번이 ${three[0].negative}번 · 4번이 ${three[3].negative}번`);
  check('오프셋이 누적된다', JSON.stringify(three.map((l) => l.offset)) === '[0,100,200,300]');

  [1, 2, 5, 8].forEach((n) => {
    const lines = linesFrom(Array(n).fill('50px').join(' '), Array(n).fill('1fr').join(' '));
    check(`트랙 ${n}개 → 라인 ${n + 1}개`,
      lines.length === n + 1
      && lines[0].negative === -(n + 1) && lines[n].negative === -1
      && lines[0].positive === 1 && lines[n].positive === n + 1);
  });

  // 암시적 트랙
  const mixed = linesFrom('100px 100px 100px 60px', '1fr 1fr 1fr');
  check('명시 3 + 암시 1 → 라인 5개', mixed.length === 5);
  check('명시 라인은 4개까지', mixed.filter((l) => l.explicit).length === 4,
    mixed.map((l) => `${l.positive}${l.explicit ? '' : '*'}`).join(' '));
  check('암시 라인이 구분된다', mixed[4].explicit === false);
}

/* ==========================================================================
   판정 — 토픽을 묻지 않는다
   ========================================================================== */
section('라인 존재 판정');

{
  check('그리드가 아니면 라인 0',
    linesFrom('none', '').length === 0 && linesFrom('none', 'none').length === 0);

  const flex = build({ computed: { gridTemplateColumns: 'none', gridTemplateRows: 'none' } });
  check('Flex에서는 오버레이가 사라진다', flex.hasLines() === false && flex.root.hidden === true);
  check('Flex에서는 토글도 사라진다', byClass(flex.toolbar, TOGGLE_CLASS)[0].hidden === true);
  check('Flex에서는 라벨 0개', byClass(flex.host, LABEL_CLASS).length === 0);

  const grid = build({
    computed: { gridTemplateColumns: '100px 100px 100px', gridTemplateRows: '80px' },
    inline: { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto' },
  });
  check('Grid에서는 나타난다', grid.hasLines() === true && grid.root.hidden === false);
  check('토글도 나타난다', byClass(grid.toolbar, TOGGLE_CLASS)[0].hidden === false);

  const src = codeOnly(read('../js/ui/grid-overlay.js'));
  check('토픽 이름이 코드에 없다', !/'grid'|"grid"|'flex'|"flex"/.test(src));
  check('topic이라는 변수도 쓰지 않는다', !/\btopic\b/.test(src));
  check('판정은 계산된 트랙 목록으로', /gridTemplateColumns/.test(src) && /NO_TRACKS/.test(src));
}

/* ==========================================================================
   표시 · 갱신
   ========================================================================== */
section('표시와 갱신');

{
  const api = build({
    computed: { gridTemplateColumns: '100px 100px 100px', gridTemplateRows: '80px 80px' },
    inline: { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto' },
  });

  check('열 라벨 4개', labelsOn(api.host, 'top').length === 4, labelsOn(api.host, 'top').join('  '));
  check('행 라벨 3개', labelsOn(api.host, 'left').length === 3, labelsOn(api.host, 'left').join('  '));
  check('양수와 음수를 함께 적는다',
    labelsOn(api.host, 'top').every((t) => /^-?\d+ \/ -\d+$/.test(t)),
    labelsOn(api.host, 'top')[0]);

  // 트랙 추가 — renderer 가 인라인을 갈고 계산값이 따라 바뀐 상황
  api.container.style.gridTemplateColumns = '1fr 1fr 1fr 1fr';
  const grown = build({
    computed: { gridTemplateColumns: '80px 80px 80px 80px', gridTemplateRows: '80px 80px' },
    inline: { gridTemplateColumns: '1fr 1fr 1fr 1fr', gridTemplateRows: 'auto auto' },
  });
  check('트랙을 더하면 라인도 는다', labelsOn(grown.host, 'top').length === 5,
    labelsOn(grown.host, 'top').join('  '));

  const shrunk = build({
    computed: { gridTemplateColumns: '160px 160px', gridTemplateRows: '80px 80px' },
    inline: { gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto' },
  });
  check('트랙을 빼면 라인도 준다', labelsOn(shrunk.host, 'top').length === 3,
    labelsOn(shrunk.host, 'top').join('  '));

  // 같은 인스턴스에서 계산값이 바뀌는 경로
  let computed = { gridTemplateColumns: '100px 100px', gridTemplateRows: '80px' };
  const host = createElement('div');
  const container = fakeContainer({ gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto' });
  const live = createGridOverlay({
    getContainer: () => container, root: host, doc,
    getStyle: () => ({ ...computed, borderLeftWidth: '0px', borderTopWidth: '0px', paddingLeft: '0px', paddingTop: '0px' }),
    getRect: fakeRect,
  });
  check('처음 열 라인 3개', labelsOn(host, 'top').length === 3);
  computed = { gridTemplateColumns: '70px 70px 70px 70px', gridTemplateRows: '80px' };
  container.style.gridTemplateColumns = '1fr 1fr 1fr 1fr';
  live.refresh();
  check('refresh 한 번으로 5개가 된다', labelsOn(host, 'top').length === 5,
    labelsOn(host, 'top').join('  '));

  const implicit = build({
    computed: { gridTemplateColumns: '100px 100px 100px 100px', gridTemplateRows: '80px' },
    inline: { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto' },
  });
  const marks = byClass(implicit.host, LABEL_CLASS)
    .filter((el) => el.getAttribute('data-side') === 'top')
    .map((el) => el.classList.contains(IMPLICIT_CLASS));
  check('암시 라인만 다른 표시', JSON.stringify(marks) === '[false,false,false,false,true]',
    '색 말고 선 모양도 바뀐다 — components.css의 --fgp-grid-line-style-implicit');
}

/* ==========================================================================
   암시적 트랙 구분 (GR-06)

   어느 트랙이 암시적인가 — 브라우저가 만든 트랙 수에서 선언한 트랙 수를 뺀
   나머지다. 선언한 수는 renderer 가 얹어 둔 인라인 값에서 센다.
   ========================================================================== */
section('암시적 트랙');

{
  const bandsOn = (root, side) => byClass(root, TRACK_CLASS)
    .filter((el) => el.getAttribute('data-side') === side);
  const markOn = (root, side) => bandsOn(root, side)
    .map((el) => (el.classList.contains(IMPLICIT_CLASS) ? '암시' : '명시'));

  /* 순수 함수 */
  check('선언한 만큼은 명시',
    tracksFrom('100px 100px 100px', '1fr 1fr 1fr').every((t) => t.explicit));
  check('넘친 만큼이 암시',
    JSON.stringify(tracksFrom('100px 100px 100px 60px 60px', '1fr 1fr 1fr').map((t) => t.explicit))
      === '[true,true,true,false,false]');
  check('선언이 없으면 전부 암시',
    tracksFrom('60px 60px', '').every((t) => !t.explicit));
  check('그리드가 아니면 트랙 0', tracksFrom('none', '1fr 1fr').length === 0);
  check('띠에 크기와 자리가 실린다',
    JSON.stringify(tracksFrom('100px 60px', '1fr').map((t) => [t.offset, t.size])) === '[[0,100],[100,60]]');

  /**
   * 명시 3개 · 아이템 7개.
   * 한 줄에 3개씩이므로 3행이 필요한데 행은 auto 하나만 선언했다 —
   * 나머지 2행은 브라우저가 만든다.
   */
  const overflow = build({
    computed: { gridTemplateColumns: '100px 100px 100px', gridTemplateRows: '60px 60px 60px' },
    inline: { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto' },
  });
  check('명시 열 3개는 전부 명시로', JSON.stringify(markOn(overflow.host, 'top')) === '["명시","명시","명시"]');
  check('아이템이 넘쳐 생긴 행 2개가 암시로',
    JSON.stringify(markOn(overflow.host, 'left')) === '["명시","암시","암시"]',
    markOn(overflow.host, 'left').join(' · '));
  check('암시 행 개수 = 계산 트랙 - 선언 트랙',
    overflow.tracks().rows.filter((t) => !t.explicit).length === 2);

  /* grid-auto-flow: column — 암시적 열이 생긴다 */
  const flowColumn = build({
    computed: { gridTemplateColumns: '100px 100px 100px 100px 100px', gridTemplateRows: '60px' },
    inline: { gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto' },
  });
  check('auto-flow column에서 암시 열을 잡는다',
    JSON.stringify(markOn(flowColumn.host, 'top')) === '["명시","명시","암시","암시","암시"]',
    markOn(flowColumn.host, 'top').join(' · '));
  check('같은 뺄셈이 두 축에 그대로 통한다',
    flowColumn.tracks().columns.filter((t) => !t.explicit).length === 3
    && overflow.tracks().rows.filter((t) => !t.explicit).length === 2,
    '축을 가리지 않는다');

  /* 갱신 */
  let computed = { gridTemplateColumns: '100px 100px 100px', gridTemplateRows: '60px' };
  const host = createElement('div');
  const container = fakeContainer({ gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto' });
  const live = createGridOverlay({
    getContainer: () => container, root: host, doc,
    getStyle: () => ({ ...computed, borderLeftWidth: '0px', borderTopWidth: '0px', borderRightWidth: '0px', borderBottomWidth: '0px', paddingLeft: '0px', paddingTop: '0px', paddingRight: '0px', paddingBottom: '0px' }),
    getRect: fakeRect,
  });
  check('처음에는 암시 행 없음', markOn(host, 'left').filter((m) => m === '암시').length === 0);

  computed = { gridTemplateColumns: '100px 100px 100px', gridTemplateRows: '60px 60px 60px' };
  live.refresh();
  check('아이템이 늘면 암시 행이 생긴다',
    JSON.stringify(markOn(host, 'left')) === '["명시","암시","암시"]', markOn(host, 'left').join(' · '));

  container.style.gridTemplateRows = 'auto auto auto';
  live.refresh();
  check('행을 선언하면 명시로 바뀐다',
    JSON.stringify(markOn(host, 'left')) === '["명시","명시","명시"]', markOn(host, 'left').join(' · '));

  /* 표시가 색만이 아닌지 */
  const css = read('../css/components.css');
  const block = css.slice(css.indexOf('.fgp-gridlines__track {'), css.indexOf('토픽 전환 (F-01)'));
  check('명시 띠는 실선 토큰',
    /border:\s*1px var\(--fgp-grid-line-style-explicit\) var\(--fgp-grid-line-explicit\)/.test(block));
  check('암시 띠는 선 모양을 바꾼다',
    /\.is-implicit[^}]*border-style:\s*var\(--fgp-grid-line-style-implicit\)/.test(block),
    '색만 바꾸면 색각 이상 사용자에게 정보가 사라진다');
  check('암시 띠는 색도 바꾼다',
    /\.is-implicit[^}]*border-color:\s*var\(--fgp-grid-line-implicit\)/.test(block));
  check('선 모양 값이 실제로 다르다',
    /--fgp-grid-line-style-explicit:\s*solid/.test(read('../css/tokens.css'))
    && /--fgp-grid-line-style-implicit:\s*dashed/.test(read('../css/tokens.css')),
    'solid ↔ dashed');
  check('띠에 data-explicit이 붙는다',
    bandsOn(overflow.host, 'left').map((el) => el.getAttribute('data-explicit')).join(',') === 'true,false,false');

  /* 상태 무해 */
  const store = createStore({ flex: FLEX_SCHEMA, grid: GRID_SCHEMA });
  store.setTopic('grid');
  let notified = 0;
  store.subscribe(() => { notified += 1; });
  const before = JSON.stringify(store.getState());
  for (let i = 0; i < 10; i += 1) live.refresh();
  check('띠를 다시 그려도 상태는 그대로', notified === 0 && JSON.stringify(store.getState()) === before);
}

/* ==========================================================================
   다음 프레임 재실행
   ========================================================================== */
section('다음 프레임');

{
  const api = build({
    computed: { gridTemplateColumns: '100px 100px 100px', gridTemplateRows: '80px' },
    inline: { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto' },
  });

  check('refreshSoon을 내놓는다', typeof api.refreshSoon === 'function');

  // rAF 가 없는 환경에서도 바로 한 번은 돈다
  const before = byClass(api.host, LABEL_CLASS).length;
  api.refreshSoon();
  check('rAF가 없어도 즉시 한 번 그린다',
    byClass(api.host, LABEL_CLASS).length === before, `${before}개`);

  // rAF 를 흉내내 두 번째 실행이 걸리는지 본다
  const frames = [];
  const realRaf = globalThis.requestAnimationFrame;
  const realCancel = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = (fn) => { frames.push(fn); return frames.length; };
  globalThis.cancelAnimationFrame = (id) => { frames[id - 1] = null; };

  const live = build({
    computed: { gridTemplateColumns: '100px 100px', gridTemplateRows: '80px' },
    inline: { gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto' },
  });
  live.refreshSoon();
  check('다음 프레임 실행을 예약한다', frames.filter(Boolean).length === 1, `${frames.filter(Boolean).length}건`);

  live.refreshSoon();
  live.refreshSoon();
  check('여러 번 불러도 예약은 하나', frames.filter(Boolean).length === 1,
    '상태 변화가 몰아쳐도 같은 일을 반복하지 않는다');

  frames.filter(Boolean).forEach((fn) => fn());
  check('예약이 실제로 돈다', labelsOn(live.host, 'top').length === 3);

  globalThis.requestAnimationFrame = realRaf;
  globalThis.cancelAnimationFrame = realCancel;

  const mainSrc = codeOnly(read('../js/main.js'));
  check('main.js가 refreshSoon을 쓴다', /overlay\.refreshSoon\(\)/.test(mainSrc));
  check('측정도 같은 경로로 한 프레임 미룬다',
    /function measureAfterPaint/.test(mainSrc) && /requestAnimationFrame/.test(mainSrc),
    '오버레이와 측정의 원인이 같다');
  const block = mainSrc.slice(mainSrc.indexOf('function measureAfterPaint'),
    mainSrc.indexOf('function sync('));
  check('미룬 실행에도 dispatch가 없다', !/dispatch\(|setView\(/.test(block));
}

/* ==========================================================================
   토글
   ========================================================================== */
section('토글');

{
  const api = build({
    computed: { gridTemplateColumns: '100px 100px 100px', gridTemplateRows: '80px' },
    inline: { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto' },
  });
  const button = byClass(api.toolbar, TOGGLE_CLASS)[0];

  check('기본은 켜짐', api.isVisible() === true && api.root.hidden === false,
    '결과를 읽을 수단이 없던 자리를 메우는 기능이라 꺼 두면 있는 줄도 모른다');
  check('버튼이 상태를 알린다', button.getAttribute('aria-pressed') === 'true');

  fire(button, 'click', { target: button });
  check('끄면 감춰진다', api.isVisible() === false && api.root.hidden === true);
  check('끄면 라벨도 띠도 걷힌다',
    byClass(api.host, LABEL_CLASS).length === 0 && byClass(api.host, TRACK_CLASS).length === 0);
  check('버튼 글자와 상태가 따라간다',
    button.getAttribute('aria-pressed') === 'false' && button.textContent.includes('보기'),
    button.textContent);

  fire(button, 'click', { target: button });
  check('다시 켜면 돌아온다',
    api.isVisible() === true && labelsOn(api.host, 'top').length === 4);

  check('api로도 켜고 끈다', api.toggle(false) === false && api.toggle(true) === true);

  const off = build({
    computed: { gridTemplateColumns: '100px 100px', gridTemplateRows: '80px' },
    inline: { gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto' },
    visible: false,
  });
  check('처음 상태를 지정할 수 있다', off.isVisible() === false && off.root.hidden === true);

  // 라인이 없으면 켜도 나오지 않는다
  const flex = build({ computed: { gridTemplateColumns: 'none', gridTemplateRows: 'none' } });
  flex.toggle(true);
  check('라인이 없으면 켜도 나오지 않는다', flex.isVisible() === false && flex.root.hidden === true);
}

/* ==========================================================================
   무해 — 상태를 건드리지 않는다 (PRD 8장 리스크)
   ========================================================================== */
section('상태 무해');

{
  const store = createStore({ flex: FLEX_SCHEMA, grid: GRID_SCHEMA });
  store.setTopic('grid');

  let notified = 0;
  store.subscribe(() => { notified += 1; });

  const before = JSON.stringify(store.getState());
  const api = build({
    computed: { gridTemplateColumns: '100px 100px 100px', gridTemplateRows: '80px' },
    inline: { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto' },
  });

  for (let i = 0; i < 20; i += 1) api.refresh();
  api.toggle();
  api.toggle();

  check('refresh 20회 + 토글 2회에도 통지 0', notified === 0, `${notified}회`);
  check('상태가 한 글자도 바뀌지 않았다', JSON.stringify(store.getState()) === before);
  check('히스토리도 그대로', store.canUndo() === false && store.canRedo() === false);

  const src = codeOnly(read('../js/ui/grid-overlay.js'));
  check('store를 import하지 않는다', !/from '.*store/.test(src));
  check('dispatch·setView를 부르지 않는다', !/dispatch|setView|resetView/.test(src));
  check('renderer를 import하지 않는다', !/from '.*renderer/.test(src),
    'getContainer 하나만 받는다');

  const main = codeOnly(read('../js/main.js'));
  check('main.js도 sync 안에서 읽기만 한다',
    /overlay\.refresh\(\);/.test(main) && !/overlay\.refresh\(\)\s*&&\s*store/.test(main));
  check('renderer.js는 손대지 않았다',
    !/gridlines|overlay/i.test(read('../js/core/renderer.js')),
    '오버레이는 renderer가 그린 결과를 읽기만 한다');
}

/* ==========================================================================
   접근성 · 하드코딩
   ========================================================================== */
section('접근성 · 하드코딩');

{
  const api = build({
    computed: { gridTemplateColumns: '100px 100px 100px', gridTemplateRows: '80px' },
    inline: { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto' },
  });
  const button = byClass(api.toolbar, TOGGLE_CLASS)[0];

  check('오버레이는 보조 기술에서 숨긴다',
    byClass(api.host, ROOT_CLASS)[0].getAttribute('aria-hidden') === 'true',
    '같은 정보가 컨트롤과 코드에 이미 있다');
  check('토글은 button 요소', button.tagName === 'BUTTON' && button.getAttribute('type') === 'button');
  check('토글이 눌림 상태를 알린다', button.getAttribute('aria-pressed') !== null);

  const src = read('../js/ui/grid-overlay.js');
  const html = read('../index.html');
  check('인라인 onclick 0건', !/onclick/i.test(src) && !/onclick/i.test(html));
  check('이벤트는 위임으로만', (src.match(/addEventListener/g) ?? []).length === 1, 'toolbar click 하나');
  check('innerHTML 0건', !/innerHTML/.test(codeOnly(src)));
  check('마크업에는 마운트 지점만',
    /id="fgp-preview-tools"/.test(html) && !/라인 번호/.test(codeOnly(html)),
    '버튼 글자는 JS가 넣는다 — 주석은 제외하고 본다');

  const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g;
  [['js/ui/grid-overlay.js', '../js/ui/grid-overlay.js'],
   ['js/main.js', '../js/main.js'],
   ['css/components.css', '../css/components.css'],
   ['index.html', '../index.html']].forEach(([label, rel]) => {
    const hits = read(rel).match(COLOR) ?? [];
    check(`${label} 색상 0건`, hits.length === 0, hits.join(', ') || '0건');
  });

  const css = read('../css/components.css');
  const block = css.slice(css.indexOf('.fgp-preview__tools {'), css.indexOf('토픽 전환 (F-01)'));
  check('준비된 토큰만 쓴다',
    ['--fgp-grid-line-explicit', '--fgp-grid-line-implicit',
     '--fgp-grid-line-number-bg', '--fgp-grid-line-number-fg'].every((t) => block.includes(t)),
    'tokens.css는 손대지 않았다');
  check('선 모양 토큰도 쓴다',
    block.includes('--fgp-grid-line-style-explicit') && block.includes('--fgp-grid-line-style-implicit'),
    '명시·암시를 색만으로 나누지 않는다');
  const stray = block.replace(/border(-[a-z]+)?:\s*1px/g, '').match(/\d+px/g) ?? [];
  check('오버레이 CSS에 px 리터럴 없음', stray.length === 0, stray.join(', ') || '테두리 1px만');
  check('오버레이 CSS에 --p- 참조 없음', !/var\(--p-/.test(block));
  check('아이템 클릭을 막지 않는다', /pointer-events:\s*none/.test(block),
    '오버레이가 F-05 아이템 선택을 가로채면 안 된다');
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
