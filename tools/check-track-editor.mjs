/**
 * check-track-editor.mjs — 트랙 편집기 확인 (GR-03)
 *
 * 요점은 두 가지다.
 *
 *   계약   값 변환을 새로 만들지 않았는가. 편집기가 내놓는 CSS 문자열이
 *          schema-spec.js 의 serialize 와 한 글자도 다르지 않아야 한다.
 *   무해   repeat() 축약은 표시일 뿐이다. 켜고 꺼도 상태가 달라지지 않아야 한다.
 *
 * jsdom 을 쓰지 않는다.
 *
 *   node tools/check-track-editor.mjs
 */

import { readFileSync } from 'node:fs';
import { CONTROL_TYPES, trackToCss, parseTrackList } from '../js/core/schema-spec.js';
import { GRID_SCHEMA } from '../js/topics/grid/schema.js';
import { createControl } from '../js/ui/controls.js';
import {
  createTrackEditor, toTracks, trackFor, toRepeatCss, previewOf, moveTrack,
  ROW_CLASS, PREVIEW_CLASS, LIST_CLASS,
} from '../js/ui/track-editor.js';

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

const SPEC = CONTROL_TYPES['track-list'];
const ENTRY = GRID_SCHEMA.find((e) => e.jsProp === 'gridTemplateColumns');
const ROWS_ENTRY = GRID_SCHEMA.find((e) => e.jsProp === 'gridTemplateRows');

/* ========================================================================== */

function createElement(tag) {
  const classes = new Set();
  const listeners = {};
  const el = {
    tagName: String(tag).toUpperCase(),
    className: '', children: [], parentNode: null, textContent: '',
    hidden: false, disabled: false, checked: false, value: '', attrs: {}, listeners,
    style: { setProperty() {}, getPropertyValue() { return ''; }, removeProperty() {} },
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
const rowsOf = (root) => byClass(root, ROW_CLASS);
const previewOfDom = (root) => byClass(root, PREVIEW_CLASS)[0].textContent;
const fieldIn = (row, name) => walk(row).find((el) => el.getAttribute('data-field') === name);
const buttonIn = (row, action) => walk(row).find((el) => el.getAttribute('data-track-action') === action);

function build(entry = ENTRY, value = entry.default) {
  const calls = [];
  const api = createTrackEditor(entry, {
    value, doc, onChange: (prop, tracks) => calls.push([prop, tracks]),
  });
  return { ...api, calls, last: () => calls[calls.length - 1] };
}

/* ==========================================================================
   계약 — 변환을 새로 만들지 않았다
   ========================================================================== */
section('계약');

{
  const src = codeOnly(read('../js/ui/track-editor.js'));
  check('CONTROL_TYPES를 가져다 쓴다', /CONTROL_TYPES\['track-list'\]/.test(src));
  check('trackToCss를 다시 만들지 않았다', !/function trackToCss/.test(src) && !/minmax\(\$\{/.test(src));
  check('parseTrackList를 다시 만들지 않았다', !/function parseTrackList/.test(src));
  check('정규식으로 CSS를 뜯지 않는다', !/match\(\/\^/.test(src));

  const tracks = toTracks(ENTRY.default);
  check('toTracks는 계약의 parse와 같다',
    JSON.stringify(tracks) === JSON.stringify(parseTrackList(ENTRY.default)));
  check('미리보기는 계약의 serialize와 같다',
    previewOf(tracks, false) === SPEC.serialize(tracks), previewOf(tracks, false));
  check('문자열도 받는다',
    JSON.stringify(toTracks('100px 1fr auto')) === JSON.stringify(parseTrackList('100px 1fr auto')));
}

/* ==========================================================================
   단위 7종
   ========================================================================== */
section('단위 7종');

{
  check('스키마가 7종을 준다', ENTRY.units.length === 7, ENTRY.units.join(' · '));

  const { root, last, calls } = build();
  const results = {};

  ENTRY.units.forEach((unit) => {
    const before = calls.length;
    const select = fieldIn(rowsOf(root)[0], 'unit');
    select.value = unit;
    fire(select, 'change', { target: select });

    const [prop, tracks] = last();
    results[unit] = { prop, css: SPEC.serialize([tracks[0]]), dom: previewOfDom(root).split(' ')[0], 알림: calls.length - before };
  });

  const expected = {
    fr: '1fr', px: '1px', '%': '1%',
    auto: 'auto', 'min-content': 'min-content', 'max-content': 'max-content',
    minmax: 'minmax(100px,',
  };
  const wrong = ENTRY.units.filter((u) => !results[u].css.startsWith(expected[u]));
  check('7종 전부 올바른 CSS를 낸다', wrong.length === 0,
    wrong.join(', ') || ENTRY.units.map((u) => results[u].css).join(' · '));
  check('7종 전부 onChange를 한 번씩 부른다', ENTRY.units.every((u) => results[u].알림 === 1));
  check('onChange의 첫 인자는 jsProp', ENTRY.units.every((u) => results[u].prop === ENTRY.jsProp),
    ENTRY.jsProp);
  check('화면 미리보기도 같은 값', ENTRY.units.every((u) => results[u].css.startsWith(results[u].dom.replace(/,$/, ''))
    || results[u].css.startsWith(results[u].dom)));

  // 키워드 단위는 수치 칸을 두지 않는다
  const keyword = build(ENTRY, [{ unit: 'auto' }]);
  check('키워드 단위에는 수치 칸이 없다', !fieldIn(rowsOf(keyword.root)[0], 'size'));
  const numeric = build(ENTRY, [{ size: 2, unit: 'fr' }]);
  check('수치 단위에는 수치 칸이 있다', Boolean(fieldIn(rowsOf(numeric.root)[0], 'size')));
}

/* ==========================================================================
   minmax
   ========================================================================== */
section('minmax');

{
  const { root, last } = build(ENTRY, [{ unit: 'minmax', min: '100px', max: '1fr' }]);
  const row = rowsOf(root)[0];

  check('최소·최대 두 칸', Boolean(fieldIn(row, 'min')) && Boolean(fieldIn(row, 'max')));
  check('두 칸이 값을 들고 있다',
    fieldIn(row, 'min').value === '100px' && fieldIn(row, 'max').value === '1fr');
  check('CSS로 두 값이 그대로 나온다', previewOfDom(root) === 'minmax(100px, 1fr)', previewOfDom(root));

  const min = fieldIn(row, 'min');
  min.value = '20%';
  fire(min, 'input', { target: min });
  check('최소를 고치면 반영된다', previewOfDom(root) === 'minmax(20%, 1fr)', previewOfDom(root));

  const max = fieldIn(rowsOf(root)[0], 'max');
  max.value = 'max-content';
  fire(max, 'input', { target: max });
  const [, tracks] = last();
  check('최대를 고치면 반영된다', SPEC.serialize(tracks) === 'minmax(20%, max-content)', SPEC.serialize(tracks));
  check('trackToCss와 같은 결과', trackToCss(tracks[0]) === 'minmax(20%, max-content)');

  check('minmax는 계약이 되읽는다',
    JSON.stringify(parseTrackList('minmax(100px, 1fr)')) === JSON.stringify([{ unit: 'minmax', min: '100px', max: '1fr' }]));
}

/* ==========================================================================
   추가 · 삭제 · 순서
   ========================================================================== */
section('추가 · 삭제 · 순서');

{
  const { root, last, calls } = build(ENTRY, [{ size: 1, unit: 'fr' }]);
  const add = walk(root).find((el) => el.getAttribute('data-track-action') === 'add');

  check('시작은 1줄', rowsOf(root).length === 1);
  fire(add, 'click', { target: add });
  check('추가하면 2줄', rowsOf(root).length === 2);
  check('추가 후 CSS', previewOfDom(root) === '1fr 1fr', previewOfDom(root));
  check('추가도 onChange를 부른다', last()[0] === ENTRY.jsProp && last()[1].length === 2);

  fire(add, 'click', { target: add });
  const third = fieldIn(rowsOf(root)[2], 'unit');
  third.value = 'px';
  fire(third, 'change', { target: third });
  const size = fieldIn(rowsOf(root)[2], 'size');
  size.value = '240';
  fire(size, 'input', { target: size });
  check('3줄 · 마지막만 px', previewOfDom(root) === '1fr 1fr 240px', previewOfDom(root));

  const up = buttonIn(rowsOf(root)[2], 'up');
  fire(up, 'click', { target: up });
  check('위로 옮기면 순서가 바뀐다', previewOfDom(root) === '1fr 240px 1fr', previewOfDom(root));

  const down = buttonIn(rowsOf(root)[1], 'down');
  fire(down, 'click', { target: down });
  check('아래로 옮기면 되돌아온다', previewOfDom(root) === '1fr 1fr 240px', previewOfDom(root));

  const remove = buttonIn(rowsOf(root)[0], 'remove');
  fire(remove, 'click', { target: remove });
  check('삭제하면 그 줄만 빠진다', previewOfDom(root) === '1fr 240px', previewOfDom(root));

  // 마지막 한 줄은 지울 수 없다
  const one = build(ENTRY, [{ size: 1, unit: 'fr' }]);
  const onlyRemove = buttonIn(rowsOf(one.root)[0], 'remove');
  check('한 줄만 남으면 삭제 버튼이 잠긴다', onlyRemove.disabled === true);
  fire(onlyRemove, 'click', { target: onlyRemove });
  check('눌러도 비지 않는다', rowsOf(one.root).length === 1 && one.calls.length === 0);

  check('첫 줄의 위 버튼은 잠긴다', buttonIn(rowsOf(root)[0], 'up').disabled === true);
  check('끝 줄의 아래 버튼은 잠긴다',
    buttonIn(rowsOf(root)[rowsOf(root).length - 1], 'down').disabled === true);

  // 순수 함수도 따로
  check('moveTrack은 범위를 벗어나면 그대로',
    moveTrack([{ unit: 'auto' }], 0, -1).length === 1 && moveTrack([{ unit: 'auto' }], 0, 5).length === 1);
}

/* ==========================================================================
   repeat() 축약 — 표시일 뿐이다
   ========================================================================== */
section('repeat 축약');

{
  check('연속 3개를 묶는다', toRepeatCss(parseTrackList('1fr 1fr 1fr')) === 'repeat(3, 1fr)');
  check('하나뿐이면 묶지 않는다', toRepeatCss(parseTrackList('1fr')) === '1fr');
  check('붙어 있지 않으면 묶지 않는다',
    toRepeatCss(parseTrackList('1fr auto 1fr')) === '1fr auto 1fr');
  check('중간 묶음도 잡는다',
    toRepeatCss(parseTrackList('auto 1fr 1fr 100px')) === 'auto repeat(2, 1fr) 100px',
    toRepeatCss(parseTrackList('auto 1fr 1fr 100px')));
  check('minmax도 묶는다',
    toRepeatCss(parseTrackList('minmax(100px, 1fr) minmax(100px, 1fr)')) === 'repeat(2, minmax(100px, 1fr))');

  const { root, calls } = build(ENTRY, parseTrackList('1fr 1fr 1fr'));
  const toggle = walk(root).find((el) => el.getAttribute('data-track-action') === 'repeat');

  const 펼침 = previewOfDom(root);
  toggle.checked = true;
  fire(toggle, 'change', { target: toggle });
  const 접힘 = previewOfDom(root);
  toggle.checked = false;
  fire(toggle, 'change', { target: toggle });
  const 되펼침 = previewOfDom(root);

  check('켜면 접히고 끄면 펴진다', 펼침 === '1fr 1fr 1fr' && 접힘 === 'repeat(3, 1fr)' && 되펼침 === 펼침,
    `${펼침} ↔ ${접힘}`);
  check('토글은 상태를 건드리지 않는다', calls.length === 0, `onChange ${calls.length}회`);
  check('두 표기가 같은 트랙을 가리킨다',
    JSON.stringify(parseTrackList(펼침)) === JSON.stringify(parseTrackList('1fr 1fr 1fr')));

  // 접은 상태에서 편집해도 값은 펼친 배열이다
  toggle.checked = true;
  fire(toggle, 'change', { target: toggle });
  const add = walk(root).find((el) => el.getAttribute('data-track-action') === 'add');
  fire(add, 'click', { target: add });
  check('접힌 채로 추가해도 상태는 펼친 배열',
    calls[calls.length - 1][1].length === 4 && previewOfDom(root) === 'repeat(4, 1fr)',
    previewOfDom(root));
}

/* ==========================================================================
   controls.js 연결
   ========================================================================== */
section('controls.js 연결');

{
  const controls = codeOnly(read('../js/ui/controls.js'));
  check('PENDING_CONTROLS에서 빠졌다', !/PENDING_CONTROLS[^;]*'track-list'/.test(controls));
  check('area-grid는 아직 남아 있다',
    /PENDING_CONTROLS = new Set\(\['area-grid'\]\)/.test(controls),
    'span은 GR-02에서 빠졌다');
  check('control 값으로만 분기한다 — 토픽을 모른다',
    !/topic/.test(controls), '토픽 이름도 topic 변수도 없다');

  const calls = [];
  const { root, sync } = createControl(ENTRY, {
    value: ENTRY.default, doc, onChange: (p, v) => calls.push([p, v]),
  });

  check('예정 표시가 사라졌다', walk(root).every((n) => n.getAttribute('data-pending') === null));
  check('트랙 줄이 선다', rowsOf(root).length === 3);
  check('data-control이 track-list', root.getAttribute('data-control') === 'track-list');
  check('라벨은 그대로', walk(root).some((n) => n.textContent === ENTRY.prop));

  const select = fieldIn(rowsOf(root)[0], 'unit');
  select.value = 'auto';
  fire(select, 'change', { target: select });
  check('createControl을 통해서도 onChange가 온다',
    calls.length === 1 && calls[0][0] === ENTRY.jsProp, JSON.stringify(calls[0]?.[0]));
  check('그 값이 계약대로 직렬화된다', SPEC.serialize(calls[0][1]) === 'auto 1fr 1fr',
    SPEC.serialize(calls[0][1]));

  sync(parseTrackList('50% 50%'));
  check('sync로 밖에서 바꾼 값이 되비친다',
    rowsOf(root).length === 2 && previewOfDom(root) === '50% 50%', previewOfDom(root));

  // 행 스키마도 같은 경로를 탄다
  const rows = createControl(ROWS_ENTRY, { value: ROWS_ENTRY.default, doc });
  check('grid-template-rows도 같은 편집기', byClass(rows.root, LIST_CLASS).length === 1);
}

/* ==========================================================================
   접근성 · 하드코딩
   ========================================================================== */
section('접근성 · 하드코딩');

{
  const { root } = build();
  const rows = rowsOf(root);
  const buttons = rows.flatMap((r) => ['up', 'down', 'remove'].map((a) => buttonIn(r, a)));

  check('행마다 버튼 3개', buttons.length === rows.length * 3 && buttons.every(Boolean));
  check('버튼은 전부 button 요소', buttons.every((b) => b.tagName === 'BUTTON'
    && b.getAttribute('type') === 'button'));
  check('버튼에 이름이 붙어 있다', buttons.every((b) => (b.getAttribute('aria-label') ?? '').length > 0),
    buttons[0].getAttribute('aria-label'));
  check('입력 칸에도 이름이 붙어 있다',
    rows.every((r) => walk(r).filter((n) => n.getAttribute('data-field'))
      .every((n) => (n.getAttribute('aria-label') ?? '').length > 0)));
  check('단위는 select — 키보드로 고른다',
    rows.every((r) => fieldIn(r, 'unit').tagName === 'SELECT'));

  const src = read('../js/ui/track-editor.js');
  check('인라인 onclick 0건', !/onclick/i.test(src));
  check('이벤트는 루트에 위임', (src.match(/root\.addEventListener/g) ?? []).length === 3,
    'click · change · input');
  check('innerHTML 0건', !/innerHTML/.test(codeOnly(src)));

  const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g;
  [['js/ui/track-editor.js', '../js/ui/track-editor.js'],
   ['js/ui/controls.js', '../js/ui/controls.js'],
   ['css/components.css', '../css/components.css']].forEach(([label, rel]) => {
    const hits = read(rel).match(COLOR) ?? [];
    check(`${label} 색상 0건`, hits.length === 0, hits.join(', ') || '0건');
  });

  const css = read('../css/components.css');
  const block = css.slice(css.indexOf('.fgp-track {'), css.indexOf('토픽 전환 (F-01)'));
  /**
   * 간격·크기는 --sp-* 토큰만 쓴다. 두 가지는 예외이고 이 파일의 기존 관례다 —
   * 테두리 두께 1px 과 미디어 쿼리의 브레이크포인트. 둘 다 토큰으로 표현할 수
   * 있는 값이 아니다.
   */
  const strayPx = (block.match(/\d+px/g) ?? [])
    .filter((_, i) => true);
  const noConvention = block
    .replace(/border(-[a-z]+)?:\s*1px/g, '')
    .replace(/@media[^{]*\{/g, '')
    .match(/\d+px/g) ?? [];
  check('트랙 편집기 CSS에 px 리터럴 없음', noConvention.length === 0,
    noConvention.join(', ') || `예외만 남음: ${strayPx.join(', ')}`);
  check('트랙 편집기 CSS에 --p- 참조 없음', !/var\(--p-/.test(block));
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
