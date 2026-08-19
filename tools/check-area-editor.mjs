/**
 * check-area-editor.mjs — 영역 이름 편집기 확인 (GR-04, 1차)
 *
 * 요점은 세 가지다.
 *
 *   검증   parseAreaGrid 가 준 errors 를 그대로 옮기는가. 규칙을 여기서 다시
 *          적지 않았는가.
 *   none   키워드를 계약에 태우지 않는가. parse('none') 은 'none' 이라는 이름의
 *          칸 하나로 읽히고 serialize 는 '"none"' 을 돌려준다 — 따옴표가 붙는
 *          순간 키워드가 아니다.
 *   무해   오류가 있어도 입력을 막지 않되, 깨진 값을 상태에 넣지 않는가.
 *
 * jsdom 을 쓰지 않는다.
 *
 *   node tools/check-area-editor.mjs
 */

import { readFileSync } from 'node:fs';
import { CONTROL_TYPES, parseAreaGrid } from '../js/core/schema-spec.js';
import { toCssValue } from '../js/core/renderer.js';
import { GRID_SCHEMA } from '../js/topics/grid/schema.js';
import { createControl } from '../js/ui/controls.js';
import {
  createAreaEditor, inspect, areaNamesFrom, isNone, NONE, MODES,
  OPTION_CLASS, INPUT_CLASS, STATUS_CLASS, ERRORS_CLASS, ERROR_CLASS,
  NAMES_CLASS, PREVIEW_CLASS, INVALID_CLASS, CHECKED_CLASS,
} from '../js/ui/area-editor.js';

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
  .replace(/^\s*\/\/.*$/gm, ' ');

const SPEC = CONTROL_TYPES['area-grid'];
const ENTRY = GRID_SCHEMA.find((e) => e.control === 'area-grid');

/* ========================================================================== */

function createElement(tag) {
  const classes = new Set();
  const listeners = {};
  const el = {
    tagName: String(tag).toUpperCase(),
    className: '', children: [], parentNode: null, textContent: '',
    hidden: false, disabled: false, value: '', attrs: {}, listeners,
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
const inputOf = (root) => byClass(root, INPUT_CLASS)[0];
const previewOf = (root) => byClass(root, PREVIEW_CLASS)[0].textContent;
const statusOf = (root) => byClass(root, STATUS_CLASS)[0].textContent;
const errorsOf = (root) => byClass(root, ERROR_CLASS).map((n) => n.textContent);

function build(value = ENTRY.default) {
  const calls = [];
  const api = createAreaEditor(ENTRY, { value, doc, onChange: (p, v) => calls.push([p, v]) });
  return { ...api, calls, last: () => calls[calls.length - 1] };
}

/** 타이핑을 흉내낸다. */
function type(root, text) {
  const input = inputOf(root);
  input.value = text;
  fire(input, 'input', { target: input });
}

/* ==========================================================================
   계약 확인 — span 때와 같은 어긋남이 있는가
   ========================================================================== */
section('계약');

{
  const src = codeOnly(read('../js/ui/area-editor.js'));
  check('CONTROL_TYPES를 가져다 쓴다', /CONTROL_TYPES\['area-grid'\]/.test(src));
  check('parseAreaGrid를 다시 만들지 않았다', !/function parseAreaGrid/.test(src));
  check('검증 규칙을 다시 적지 않았다',
    !/직사각형/.test(src.replace(/errors/g, '')) && !/셀 개수/.test(src),
    '문구는 계약이 만든 것을 그대로 옮긴다');

  /**
   * parse 는 { rows, errors } 를 준다. errors 를 함께 돌려주기 위한 모양이지만
   * serialize 가 배열과 { rows } 를 모두 받으므로 serialize(parse(x)) 가 바로
   * 물린다. 챌린지 채점이 컨트롤 타입만 보고 값을 정규형으로 옮기려면 여덟
   * 타입이 같은 모양이어야 해서 맞춘 것이다. 예전에는 이 자리가 던졌다.
   */
  check('serialize(parse(x))가 바로 물린다',
    SPEC.serialize(SPEC.parse('"a a" "b c"')) === '"a a"\n"b c"',
    SPEC.serialize(SPEC.parse('"a a" "b c"')).replace(/\n/g, ' ⏎ '));
  check('.rows를 벗겨 넘겨도 같다',
    SPEC.serialize(SPEC.parse('"a a" "b c"').rows) === '"a a"\n"b c"');

  // 왕복 — 두 번 돌려도 같다
  const round = (v) => SPEC.serialize(SPEC.parse(v).rows);
  ['"hd hd" "sd mn"', 'hd hd\nsd mn', '"hd hd" ". mn"'].forEach((v) => {
    check(`왕복 일치 — ${JSON.stringify(v)}`, round(round(v)) === round(v), round(v).replace(/\n/g, ' ⏎ '));
  });
}

/* ==========================================================================
   none — 키워드를 계약에 태우지 않는다
   ========================================================================== */
section('none');

{
  check('스키마 기본값이 none', ENTRY.default === NONE);
  check('계약도 none을 키워드로 되돌린다',
    SPEC.serialize(SPEC.parse(NONE)) === NONE,
    '행이 아니라 키워드다 — 예전에는 "none" 이라는 이름의 1×1 판이 되었다');
  check('따옴표를 붙여 적으면 이름으로 읽는다',
    SPEC.serialize(SPEC.parse('"none"')) === '"none"',
    'none이라는 이름을 가진 판은 그대로 둔다');
  check('빈 행 목록도 키워드로 나간다', SPEC.serialize([]) === NONE);

  check('isNone이 걸러낸다',
    [NONE, '', '   ', null, undefined].every(isNone) && !isNone('"a a" "b b"'));
  check('inspect가 none을 그대로 낸다', inspect(NONE).css === NONE && inspect(NONE).none === true);
  check('빈 문자열도 none', inspect('').css === NONE);
  check('renderer도 none을 그대로 낸다', toCssValue(ENTRY, NONE) === NONE);

  const { root, calls } = build(NONE);
  check('처음에는 none', previewOf(root) === NONE && inputOf(root).hidden === true);
  check('알림 없이 시작한다', calls.length === 0);

  const custom = byClass(root, OPTION_CLASS).find((b) => b.getAttribute('data-mode') === 'custom');
  fire(custom, 'click', { target: custom });
  check('직접 지정으로 넘어가면 출발점이 깔린다',
    inputOf(root).hidden === false && previewOf(root).includes('"a a"'), previewOf(root).replace(/\n/g, ' ⏎ '));

  const noneBtn = byClass(root, OPTION_CLASS).find((b) => b.getAttribute('data-mode') === NONE);
  fire(noneBtn, 'click', { target: noneBtn });
  check('none으로 돌아온다', previewOf(root) === NONE && inputOf(root).hidden === true);
  check('알린 값이 전부 유효', calls.every(([, v]) => v === NONE || /^"/.test(v)),
    calls.map(([, v]) => JSON.stringify(v)).join(' · '));
}

/* ==========================================================================
   유효한 입력 3종
   ========================================================================== */
section('유효한 입력');

{
  const CASES = [
    ['한 줄 표기', '"hd hd" "sd mn"', '"hd hd"\n"sd mn"', ['hd', 'sd', 'mn']],
    ['줄바꿈 표기', 'hd hd\nsd mn', '"hd hd"\n"sd mn"', ['hd', 'sd', 'mn']],
    ['빈 칸 포함', '"hd hd" ". mn"', '"hd hd"\n". mn"', ['hd', 'mn']],
  ];

  CASES.forEach(([label, input, expected, names]) => {
    const { root, last } = build(NONE);
    const custom = byClass(root, OPTION_CLASS).find((b) => b.getAttribute('data-mode') === 'custom');
    fire(custom, 'click', { target: custom });
    type(root, input);

    const ok = previewOf(root) === expected
      && errorsOf(root).length === 0
      && !root.classList.contains(INVALID_CLASS)
      && last()[0] === ENTRY.jsProp && last()[1] === expected;

    check(`${label}`, ok, `${previewOf(root).replace(/\n/g, ' ⏎ ')} · 오류 ${errorsOf(root).length}`);
    check(`${label} — 영역 이름`, JSON.stringify(areaNamesFrom(input)) === JSON.stringify(names),
      areaNamesFrom(input).join(' · '));
    check(`${label} — 행·열을 알려 준다`, /\d+행 × \d+열/.test(statusOf(root)), statusOf(root));
  });

  check('두 표기가 같은 값이 된다',
    SPEC.serialize(SPEC.parse('"hd hd" "sd mn"').rows) === SPEC.serialize(SPEC.parse('hd hd\nsd mn').rows));
}

/* ==========================================================================
   무효한 입력 3종 — 막지 않되 알린다
   ========================================================================== */
section('무효한 입력');

{
  const CASES = [
    ['행 길이 불일치', '"a a" "b"', '셀 개수'],
    ['L자 영역', '"a a" "a b" "a a"', '직사각형'],
    ['분리된 이름', '"a b" "b a"', '직사각형'],
  ];

  CASES.forEach(([label, input, keyword]) => {
    const { root, calls } = build(NONE);
    const custom = byClass(root, OPTION_CLASS).find((b) => b.getAttribute('data-mode') === 'custom');
    fire(custom, 'click', { target: custom });

    const before = calls.length;
    const applied = previewOf(root);
    type(root, input);

    check(`${label} — 오류를 보여 준다`,
      errorsOf(root).length > 0 && errorsOf(root).some((m) => m.includes(keyword)),
      errorsOf(root).join(' / '));
    check(`${label} — 계약이 만든 문구 그대로`,
      errorsOf(root).join('|') === parseAreaGrid(input).errors.join('|'));
    check(`${label} — 입력은 그대로 남는다`, inputOf(root).value === input,
      '고칠 곳을 보여 주되 지우지 않는다');
    check(`${label} — 깨진 값을 상태에 넣지 않는다`,
      calls.length === before && previewOf(root) === applied, statusOf(root));
    check(`${label} — 오류 표시 클래스`, root.classList.contains(INVALID_CLASS));
  });

  // 고치면 다시 흐른다
  const { root, last } = build(NONE);
  const custom = byClass(root, OPTION_CLASS).find((b) => b.getAttribute('data-mode') === 'custom');
  fire(custom, 'click', { target: custom });
  type(root, '"a a" "b"');
  check('오류 상태', root.classList.contains(INVALID_CLASS));
  type(root, '"a a" "b b"');
  check('고치면 오류가 사라지고 값이 흐른다',
    !root.classList.contains(INVALID_CLASS) && errorsOf(root).length === 0
    && last()[1] === '"a a"\n"b b"', previewOf(root).replace(/\n/g, ' ⏎ '));
}

/* ==========================================================================
   grid-area 연결 준비 (주의 2)
   ========================================================================== */
section('grid-area 연결 준비');

{
  check('이름 목록을 순수 함수로 낸다', typeof areaNamesFrom === 'function');
  check('편집기 없이도 부를 수 있다',
    JSON.stringify(areaNamesFrom('"hd hd" "sd mn"')) === JSON.stringify(['hd', 'sd', 'mn']));
  check('빈 칸은 이름이 아니다', !areaNamesFrom('"hd ." ". mn"').includes('.'));
  check('중복은 한 번만', JSON.stringify(areaNamesFrom('"a a" "a a"')) === JSON.stringify(['a']));
  check('none이면 빈 목록', areaNamesFrom(NONE).length === 0);

  const { root, names } = build('"hd hd" "sd mn"');
  check('편집기도 이름을 내놓는다', JSON.stringify(names()) === JSON.stringify(['hd', 'sd', 'mn']));
  check('화면에도 이름을 보여 준다',
    byClass(root, NAMES_CLASS)[0].textContent.includes('hd'), byClass(root, NAMES_CLASS)[0].textContent);

  const text = GRID_SCHEMA.find((e) => e.control === 'text');
  check('grid-area는 아직 잇지 않았다', text.prop === 'grid-area',
    '이번 범위 밖. areaNamesFrom을 부르면 된다');
}

/* ==========================================================================
   controls.js 연결
   ========================================================================== */
section('controls.js 연결');

{
  const controls = codeOnly(read('../js/ui/controls.js'));
  check('PENDING_CONTROLS가 비었다', /PENDING_CONTROLS = new Set\(\)/.test(controls),
    'GR-02 · GR-03 · GR-04 를 지나며 셋 다 빠졌다');
  check('토픽을 모른다', !/topic/.test(controls));

  const calls = [];
  const { root, sync } = createControl(ENTRY, {
    value: ENTRY.default, doc, onChange: (p, v) => calls.push([p, v]),
  });

  check('예정 표시가 사라졌다', walk(root).every((n) => n.getAttribute('data-pending') === null));
  check('data-control이 area-grid', root.getAttribute('data-control') === 'area-grid');
  check('라벨은 그대로', walk(root).some((n) => n.textContent === ENTRY.prop));
  check('처음에는 none', previewOf(root) === NONE);

  const custom = byClass(root, OPTION_CLASS).find((b) => b.getAttribute('data-mode') === 'custom');
  fire(custom, 'click', { target: custom });
  type(root, '"a b" "c d"');
  check('createControl을 통해서도 onChange가 온다',
    calls[calls.length - 1][0] === ENTRY.jsProp && calls[calls.length - 1][1] === '"a b"\n"c d"',
    JSON.stringify(calls[calls.length - 1]));

  sync(NONE);
  check('sync로 밖에서 바꾼 값이 되비친다', previewOf(root) === NONE && inputOf(root).hidden === true);
  sync('"x x" "y y"');
  check('sync가 문자열도 정규화한다', previewOf(root) === '"x x"\n"y y"',
    previewOf(root).replace(/\n/g, ' ⏎ '));
}

/* ==========================================================================
   접근성 · 하드코딩
   ========================================================================== */
section('접근성 · 하드코딩');

{
  const { root } = build();
  const options = byClass(root, OPTION_CLASS);

  check('모양은 둘', MODES.length === 2, MODES.map((m) => m.id).join(', '));
  check('radiogroup + radio',
    byClass(root, 'fgp-area__mode')[0].getAttribute('role') === 'radiogroup'
    && options.every((b) => b.getAttribute('role') === 'radio'));
  check('버튼은 전부 button 요소',
    options.every((b) => b.tagName === 'BUTTON' && b.getAttribute('type') === 'button'));
  check('선택된 것만 aria-checked · tabindex 0 · 표시 클래스',
    options.filter((b) => b.getAttribute('aria-checked') === 'true').length === 1
    && options.filter((b) => b.getAttribute('tabindex') === '0').length === 1
    && options.filter((b) => b.classList.contains(CHECKED_CLASS)).length === 1);
  check('입력 칸은 textarea', inputOf(root).tagName === 'TEXTAREA');
  check('입력 칸과 묶음에 이름이 붙어 있다',
    (inputOf(root).getAttribute('aria-label') ?? '').length > 0
    && (byClass(root, 'fgp-area__mode')[0].getAttribute('aria-label') ?? '').length > 0);
  check('상태 문구는 role=status', byClass(root, STATUS_CLASS)[0].getAttribute('role') === 'status',
    '고쳐진 내용이 스크린리더에 전달된다');
  check('오류는 목록으로', byClass(root, ERRORS_CLASS)[0].tagName === 'UL');

  const bar = byClass(root, 'fgp-area__mode')[0];
  fire(bar, 'keydown', { key: 'ArrowRight', target: options[0] });
  check('화살표로 모양이 바뀐다', previewOf(root) !== NONE, previewOf(root).replace(/\n/g, ' ⏎ '));
  fire(bar, 'keydown', { key: 'ArrowLeft', target: options[1] });
  check('되돌아온다', previewOf(root) === NONE);

  const src = read('../js/ui/area-editor.js');
  check('인라인 onclick 0건', !/onclick/i.test(src));
  check('이벤트는 위임으로만', (src.match(/addEventListener/g) ?? []).length === 3,
    'click · keydown · input');
  check('innerHTML 0건', !/innerHTML/.test(codeOnly(src)));

  const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g;
  [['js/ui/area-editor.js', '../js/ui/area-editor.js'],
   ['css/components.css', '../css/components.css']].forEach(([label, rel]) => {
    const hits = read(rel).match(COLOR) ?? [];
    check(`${label} 색상 0건`, hits.length === 0, hits.join(', ') || '0건');
  });

  const css = read('../css/components.css');
  const block = css.slice(css.indexOf('.fgp-area {'), css.indexOf('토픽 전환 (F-01)'));
  const stray = block.replace(/border(-[a-z]+)?:\s*1px/g, '').match(/\d+px/g) ?? [];
  check('영역 편집기 CSS에 px 리터럴 없음', stray.length === 0, stray.join(', ') || '테두리 1px만');
  check('영역 편집기 CSS에 --p- 참조 없음', !/var\(--p-/.test(block));
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
