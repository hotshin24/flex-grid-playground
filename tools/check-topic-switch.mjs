/**
 * check-topic-switch.mjs — 토픽 전환 확인 (F-01)
 *
 * 이 단계의 요점은 "core 네 파일을 고치지 않고도 Grid 가 서는가" 다.
 * store · renderer · codegen · controls 가 토픽을 이미 다루고 있는지 직접 묻고,
 * main.js 가 토픽 이름을 코드에 박아 두지 않았는지 본다.
 *
 * jsdom 을 쓰지 않는다. store 와 codegen 은 순수 JS 라 진짜를 그대로 쓴다.
 *
 *   node tools/check-topic-switch.mjs
 */

import { readFileSync } from 'node:fs';
import { createStore } from '../js/core/store.js';
import { partitionByScope, defaultsFrom } from '../js/core/schema-spec.js';
import { generateCode } from '../js/core/codegen.js';
import { createControl, PENDING_CLASS } from '../js/ui/controls.js';
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

const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const codeOnly = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/^\s*\/\/.*$/gm, ' ');

const SCHEMAS = { flex: FLEX_SCHEMA, grid: GRID_SCHEMA };

/* ========================================================================== */

function createElement(tag) {
  const classes = new Set();
  const listeners = {};
  const el = {
    tagName: String(tag).toUpperCase(),
    className: '', children: [], parentNode: null, textContent: '',
    hidden: false, disabled: false, value: '', attrs: {}, listeners,
    style: {
      _custom: new Map(),
      setProperty(n, v) { this._custom.set(n, v); },
      getPropertyValue(n) { return this._custom.get(n) ?? ''; },
      removeProperty(n) { this._custom.delete(n); },
    },
    classList: {
      add: (n) => classes.add(n),
      remove: (n) => classes.delete(n),
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
  Object.defineProperty(el, 'innerHTML', { get: () => '', set: () => {} });
  return el;
}

const doc = { createElement };
const walk = (el, out = []) => { out.push(el); el.children.forEach((c) => walk(c, out)); return out; };

/* ==========================================================================
   토픽 목록 — store 가 정한다
   ========================================================================== */
section('토픽 목록');

{
  const store = createStore(SCHEMAS);

  check('store가 토픽 목록을 준다', typeof store.getTopics === 'function');
  check('레지스트리 키와 같은 순서',
    JSON.stringify(store.getTopics()) === JSON.stringify(Object.keys(SCHEMAS)),
    store.getTopics().join(', '));
  check('시작 토픽은 첫 키', store.getTopic() === Object.keys(SCHEMAS)[0]);
  check('없는 토픽은 막는다', (() => {
    try { store.setTopic('없는토픽'); return false; } catch { return true; }
  })());

  const main = codeOnly(read('../js/main.js'));
  check('main.js가 store에서 목록을 받는다', /store\.getTopics\(\)/.test(main));
  check('토픽 목록을 코드에 박지 않음',
    !/TOPICS\s*=\s*\[/.test(main) && !/\[\s*'flex'\s*,\s*'grid'\s*\]/.test(main));
  check('전환은 store.setTopic으로만', /store\.setTopic\(/.test(main));

  const html = codeOnly(read('../index.html'));
  check('마크업에 토픽 버튼이 없다',
    !/data-topic=/.test(html) && !/>Grid</.test(html) && !/>Flex</.test(html),
    '마운트 지점만 둔다');
  check('인라인 onclick 0건', !/onclick=/i.test(html));
  check('마운트 지점이 radiogroup', /id="fgp-topics"/.test(html) && /role="radiogroup"/.test(html));
}

/* ==========================================================================
   상태 보존 — 토픽마다 따로 산다
   ========================================================================== */
section('상태 보존');

{
  const store = createStore(SCHEMAS);
  const flexDefaults = defaultsFrom(FLEX_SCHEMA, 'container');
  const gridDefaults = defaultsFrom(GRID_SCHEMA, 'container');

  const flexKey = Object.keys(flexDefaults)[0];
  const gridKey = Object.keys(gridDefaults)[0];
  const flexOther = FLEX_SCHEMA.find((e) => e.jsProp === flexKey).values.find((v) => v.val !== flexDefaults[flexKey]).val;

  const startCount = store.getState().items.length;
  store.dispatch({ container: { [flexKey]: flexOther } });
  store.dispatch({ items: [...store.getState().items, { ...store.getState().items[0], id: 99 }] });
  const flexSnapshot = JSON.stringify(store.getState());

  store.setTopic('grid');
  check('전환하면 그 토픽의 상태가 나온다', store.getState().topic === 'grid');
  // track-list 같은 값은 객체 배열이라 === 로 못 잰다
  check('Grid 상태는 Grid 스키마 기본값 전량',
    JSON.stringify(store.getState().container) === JSON.stringify(gridDefaults),
    `${Object.keys(gridDefaults).length}개 키`);
  check('Flex에서 만진 키가 Grid 상태에 없다', !(flexKey in store.getState().container));

  store.setTopic('flex');
  check('돌아오면 Flex 상태가 그대로', JSON.stringify(store.getState()) === flexSnapshot,
    `${flexKey}=${store.getState().container[flexKey]} · 아이템 ${store.getState().items.length}개`);

  // 히스토리도 토픽별이다
  store.setTopic('grid');
  check('Grid는 되돌릴 것이 없다', store.canUndo() === false);
  store.setTopic('flex');
  check('Flex는 되돌릴 것이 남아 있다', store.canUndo() === true);
  store.undo();
  check('undo는 그 토픽 히스토리만 건드린다',
    store.getState().items.length === startCount && store.getState().container[flexKey] === flexOther,
    `아이템 ${store.getState().items.length}개 (전환 전 ${startCount}) · ${flexKey}=${store.getState().container[flexKey]}`);

  // view 는 도구 설정이라 토픽을 넘나든다
  store.setView({ containerWidth: 640 });
  store.setTopic('grid');
  check('view는 토픽을 넘어 공유된다', store.getState().view.containerWidth === 640);
}

/* ==========================================================================
   컨트롤 — Grid 스키마 19개가 전부 선다
   ========================================================================== */
section('Grid 컨트롤');

{
  const scoped = partitionByScope(GRID_SCHEMA);
  check('Grid 속성 19개', GRID_SCHEMA.length === 19, `${GRID_SCHEMA.length}개`);
  check('container 12 · item 7', scoped.container.length === 12 && scoped.item.length === 7,
    `container ${scoped.container.length} · item ${scoped.item.length}`);

  const built = GRID_SCHEMA.map((entry) => {
    const { root } = createControl(entry, { value: entry.default, doc });
    return { entry, root };
  });

  check('19개가 전부 만들어진다', built.length === 19);
  check('누락 없이 전부 요소를 돌려준다', built.every((b) => b.root));
  check('속성 이름이 전부 붙어 있다',
    built.every((b) => b.root.getAttribute('data-prop') === b.entry.prop));

  const pending = built.filter((b) => walk(b.root).some((n) => n.getAttribute('data-pending') !== null));
  const live = built.filter((b) => !pending.includes(b));

  /**
   * M3 완료 기준 — "Grid 속성 19개 전부 조작 가능".
   *
   * 자리만 잡힌 것을 세지 않는다. 라벨이 있다고 조작이 되는 것은 아니다.
   * 실제로 누르거나 칠 수 있는 요소가 붙어 있는지를 본다.
   */
  const OPERABLE = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
  const operable = (root) => walk(root).filter((n) => OPERABLE.has(n.tagName) && !n.disabled);

  check('예정 표시 0건 — 19개가 전부 실물', pending.length === 0,
    pending.map((b) => `${b.entry.prop}(${b.entry.control})`).join(', ') || `동작 ${live.length}`);

  const mute = built.filter((b) => operable(b.root).length === 0);
  check('19개 전부 조작 수단을 갖는다', mute.length === 0,
    mute.map((b) => `${b.entry.prop}(${b.entry.control})`).join(', ')
      || built.map((b) => operable(b.root).length).join(' · '));

  check('쓰이는 control 종류 6가지가 전부 구현됐다',
    [...new Set(built.map((b) => b.entry.control))].every(
      (c) => ['enum', 'number', 'length', 'track-list', 'span', 'area-grid', 'text'].includes(c)),
    [...new Set(built.map((b) => b.entry.control))].join(' · '));

  const controlsSrc = codeOnly(read('../js/ui/controls.js'));
  check('PENDING_CONTROLS가 비었다', /PENDING_CONTROLS = new Set\(\)/.test(controlsSrc));

  check('전부 라벨을 갖는다 — 목록에서 빠지지 않는다',
    built.every((b) => walk(b.root).some((n) => n.textContent === b.entry.prop)));

  const flexBuilt = FLEX_SCHEMA.map((e) => ({ entry: e, root: createControl(e, { value: e.default, doc }).root }));
  check('Flex 12개도 그대로 선다', flexBuilt.length === 12);
  check('Flex 12개도 전부 조작 가능',
    flexBuilt.every((b) => operable(b.root).length > 0),
    flexBuilt.map((b) => operable(b.root).length).join(' · '));
}

/* ==========================================================================
   core 네 파일 — 토픽을 이미 알고 있는가
   ========================================================================== */
section('core 수정 불필요 확인');

{
  const store = createStore(SCHEMAS);

  // store
  check('store: 토픽별 상태·히스토리·전환을 이미 갖췄다',
    ['getTopic', 'getTopics', 'setTopic'].every((k) => typeof store[k] === 'function'));

  // codegen
  store.setTopic('grid');
  const gridCode = generateCode(store.getState(), GRID_SCHEMA);
  check('codegen: Grid에서 display: grid를 낸다',
    /display:\s*grid/.test(gridCode.css), gridCode.css.split('\n')[1]?.trim());
  store.setTopic('flex');
  check('codegen: Flex에서 display: flex를 낸다',
    /display:\s*flex/.test(generateCode(store.getState(), FLEX_SCHEMA).css));

  // renderer · controls 는 소스에서 토픽 처리를 확인한다 (DOM 없이 실행 불가)
  const renderer = read('../js/core/renderer.js');
  check('renderer: 토픽별 display 표를 갖고 있다',
    /DISPLAY_BY_TOPIC/.test(renderer) && /state\.topic/.test(renderer));
  check('renderer: 스키마를 토픽으로 찾는다', /schemas\[state\.topic\]/.test(renderer));

  const codegen = read('../js/core/codegen.js');
  check('codegen: 같은 표를 쓴다', /DISPLAY_BY_TOPIC/.test(codegen));

  const controls = read('../js/ui/controls.js');
  check('controls: 미구현 종류에 자리를 만든다', /data-pending/.test(controls));
  check('controls: 모르는 종류도 떨어뜨리지 않는다', /default:\s*\{/.test(codeOnly(controls)));

  /**
   * 토픽 이름이 아예 없어야 한다는 뜻은 아니다. renderer 와 codegen 의
   * DISPLAY_BY_TOPIC 은 "토픽 이름이 곧 display 값"이라는 표라서 제자리다.
   * 막아야 하는 것은 토픽으로 갈라지는 분기다 — 그게 생기면 토픽을 더할 때마다
   * core 를 고쳐야 한다.
   */
  const BRANCH = /(topic\s*[=!]==?\s*['"]|['"](?:flex|grid)['"]\s*[=!]==)/;
  [['store.js', '../js/core/store.js'], ['renderer.js', '../js/core/renderer.js'],
   ['codegen.js', '../js/core/codegen.js'], ['controls.js', '../js/ui/controls.js']].forEach(([label, rel]) => {
    const src = codeOnly(read(rel));
    check(`${label}에 토픽 분기가 없다`, !BRANCH.test(src),
      (src.match(BRANCH) ?? ['분기 0건'])[0]);
  });
}

/* ==========================================================================
   색상 · 하드코딩
   ========================================================================== */
section('색상 · 하드코딩');

{
  const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g;
  [['js/main.js', '../js/main.js'], ['css/components.css', '../css/components.css'],
   ['index.html', '../index.html']].forEach(([label, rel]) => {
    const hits = read(rel).match(COLOR) ?? [];
    check(`${label} 색상 0건`, hits.length === 0, hits.join(', ') || '0건');
  });

  const css = read('../css/components.css');
  check('토픽 버튼 스타일에 px 리터럴 없음',
    !/\.fgp-topic \{[^}]*\d+px/.test(css.replace(/1px solid/g, '')));
  check('components.css에 --p- 직접 참조 0건', !/var\(--p-/.test(css));
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
