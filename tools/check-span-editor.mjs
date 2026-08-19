/**
 * check-span-editor.mjs — 라인 좌표 편집기 확인 (GR-02)
 *
 * 요점은 "브라우저가 실제로 받아들이는 값만 나가는가" 다. M0 계약이 쌍('1 / 3')을
 * 냈고 개별 속성은 그것을 거부한다 — 그 오류를 다시 만들지 않는지 본다.
 *
 * jsdom 을 쓰지 않는다.
 *
 *   node tools/check-span-editor.mjs
 */

import { readFileSync } from 'node:fs';
import { CONTROL_TYPES, parseSpan, spanToCss, AUTO, validateSchema } from '../js/core/schema-spec.js';
import { toCssValue } from '../js/core/renderer.js';
import { GRID_SCHEMA } from '../js/topics/grid/schema.js';
import { createControl } from '../js/ui/controls.js';
import {
  createSpanEditor, modeOf, valueForMode, MODES,
  OPTION_CLASS, FIELD_CLASS, PREVIEW_CLASS, HINT_CLASS, CHECKED_CLASS,
} from '../js/ui/span-editor.js';

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

const SPEC = CONTROL_TYPES.span;
const ENTRIES = GRID_SCHEMA.filter((e) => e.control === 'span');
const ENTRY = ENTRIES[0];

/**
 * 브라우저가 개별 속성에 받아 주는 형태.
 * auto · 정수(음수 포함) · span n 셋뿐이다. 슬래시가 들어간 순간 선언이 버려진다.
 * 실제 브라우저에서 확인한 결과를 옮겨 둔 것이다.
 */
const VALID = /^(auto|-?\d+|span\s-?\d+)$/;

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
const optionsOf = (root) => byClass(root, OPTION_CLASS);
const fieldOf = (root) => byClass(root, FIELD_CLASS)[0];
const previewOf = (root) => byClass(root, PREVIEW_CLASS)[0].textContent;

function build(entry = ENTRY, value = entry.default) {
  const calls = [];
  const api = createSpanEditor(entry, {
    value, doc, onChange: (prop, v) => calls.push([prop, v]),
  });
  return { ...api, calls, last: () => calls[calls.length - 1] };
}

/* ==========================================================================
   왕복 — 네 형태
   ========================================================================== */
section('왕복');

{
  const CASES = ['auto', '3', '-1', 'span 2'];

  const trips = CASES.map((raw) => [raw, SPEC.serialize(SPEC.parse(raw))]);
  check('네 형태가 왕복한다', trips.every(([a, b]) => a === b),
    trips.map(([a, b]) => `${a}→${b}`).join(' · '));

  check('두 번 돌려도 같다',
    CASES.every((raw) => SPEC.serialize(SPEC.parse(SPEC.serialize(SPEC.parse(raw)))) === raw));

  check('객체를 넣어도 그대로', SPEC.serialize(SPEC.parse({ line: -3 })) === '-3');
  check('spanToCss와 serialize가 같은 함수',
    CASES.every((raw) => spanToCss(SPEC.parse(raw)) === SPEC.serialize(SPEC.parse(raw))));

  check('큰 음수 라인도 읽는다', SPEC.serialize(SPEC.parse('-12')) === '-12');
  check('span 큰 수도 읽는다', SPEC.serialize(SPEC.parse('span 9')) === 'span 9');

  // 쌍 형태는 더 이상 읽지 않는다 — 계약 정정으로 뺐다
  check('쌍 형태는 auto로 떨어진다', SPEC.serialize(SPEC.parse('1 / 3')) === AUTO,
    '스키마의 어떤 속성도 쌍을 갖지 않는다');
  check('알 수 없는 값도 auto로 떨어진다',
    ['', 'abc', '3px', null, undefined].every((v) => SPEC.serialize(SPEC.parse(v ?? AUTO)) === AUTO));
}

/* ==========================================================================
   브라우저가 받는 형태인가
   ========================================================================== */
section('유효한 CSS 값');

{
  const produced = [
    ...['auto', '3', '-1', 'span 2', '-12', 'span 9'].map((v) => SPEC.serialize(SPEC.parse(v))),
    ...MODES.map((m) => SPEC.serialize(valueForMode(m.id, '2'))),
    ...[{ line: AUTO }, { line: 0 }, { span: 1 }].map((v) => SPEC.serialize(v)),
  ];

  check('내놓는 값이 전부 유효한 형태', produced.every((v) => VALID.test(v)),
    produced.filter((v) => !VALID.test(v)).join(', ') || `${produced.length}건`);
  check('슬래시가 섞이지 않는다', produced.every((v) => !v.includes('/')),
    '개별 속성에 쌍을 넣으면 브라우저가 선언을 버린다');

  // 렌더러를 통해도 같아야 한다
  const viaRenderer = [{ line: 3 }, { line: -1 }, { span: 2 }, { line: AUTO }, 'auto']
    .map((v) => toCssValue(ENTRY, v));
  check('renderer의 toCssValue도 같은 형태', viaRenderer.every((v) => VALID.test(v)),
    viaRenderer.join(' · '));

  // 스키마 기본값도 검사를 통과해야 한다
  check('스키마 span 기본값 4개가 유효', ENTRIES.every((e) => VALID.test(String(e.default))),
    ENTRIES.map((e) => `${e.prop}=${e.default}`).join(' · '));
  check('validateSchema가 쌍 형태를 잡는다',
    validateSchema([{ prop: 'x', jsProp: 'x', scope: 'item', control: 'span', default: '1 / 3' }], 't')
      .some((m) => m.includes('쌍 형태')));
  check('Grid 스키마는 검증을 통과', validateSchema(GRID_SCHEMA, 'grid').length === 0);
}

/* ==========================================================================
   모양 판정과 전환
   ========================================================================== */
section('모양');

{
  check('modeOf가 셋을 가른다',
    modeOf('auto') === AUTO && modeOf('3') === 'line' && modeOf('-1') === 'line' && modeOf('span 2') === 'span',
    `${modeOf('auto')} · ${modeOf('-1')} · ${modeOf('span 2')}`);
  check('모양은 셋뿐', MODES.length === 3, MODES.map((m) => m.id).join(', '));
  check('모양마다 안내 문구가 있다', MODES.every((m) => m.hint && m.label));

  check('auto에서 라인으로 가면 숫자가 생긴다', SPEC.serialize(valueForMode('line', 'auto')) === '1');
  check('라인 숫자를 span으로 이어받는다', SPEC.serialize(valueForMode('span', '3')) === 'span 3');
  check('span 숫자를 라인으로 이어받는다', SPEC.serialize(valueForMode('line', 'span 4')) === '4');
  check('어디서든 auto로 돌아간다',
    ['3', '-1', 'span 2'].every((v) => SPEC.serialize(valueForMode(AUTO, v)) === AUTO));
  check('음수는 span으로 갈 때도 살아 있다', SPEC.serialize(valueForMode('span', '-2')) === 'span -2');
}

/* ==========================================================================
   조작
   ========================================================================== */
section('조작');

{
  const { root, calls, last } = build(ENTRY, 'auto');

  check('시작은 auto', previewOf(root) === AUTO && fieldOf(root).hidden === true);
  check('안내 문구가 나온다', byClass(root, HINT_CLASS)[0].textContent.length > 0,
    byClass(root, HINT_CLASS)[0].textContent);

  const lineBtn = optionsOf(root).find((b) => b.getAttribute('data-mode') === 'line');
  fire(lineBtn, 'click', { target: lineBtn });
  check('라인으로 바꾸면 숫자 칸이 열린다', fieldOf(root).hidden === false && previewOf(root) === '1');
  check('onChange가 (jsProp, 값)으로 온다',
    last()[0] === ENTRY.jsProp && last()[1] === '1', JSON.stringify(last()));

  const field = fieldOf(root);
  field.value = '3';
  fire(field, 'input', { target: field });
  check('숫자를 넣으면 반영된다', previewOf(root) === '3' && last()[1] === '3');

  field.value = '-1';
  fire(field, 'input', { target: field });
  check('음수도 넣힌다', previewOf(root) === '-1' && last()[1] === '-1');

  const spanBtn = optionsOf(root).find((b) => b.getAttribute('data-mode') === 'span');
  fire(spanBtn, 'click', { target: spanBtn });
  check('span으로 바꾸면 span n', previewOf(root) === 'span -1', previewOf(root));

  field.value = '2';
  fire(field, 'input', { target: field });
  check('칸 수를 넣으면 span 2', previewOf(root) === 'span 2' && last()[1] === 'span 2');

  const autoBtn = optionsOf(root).find((b) => b.getAttribute('data-mode') === AUTO);
  fire(autoBtn, 'click', { target: autoBtn });
  check('auto로 돌아가면 숫자 칸이 닫힌다', previewOf(root) === AUTO && fieldOf(root).hidden === true);

  check('알린 값이 전부 유효한 형태', calls.every(([, v]) => VALID.test(v)),
    calls.map(([, v]) => v).join(' · '));
  check('알린 첫 인자가 전부 jsProp', calls.every(([p]) => p === ENTRY.jsProp));

  // 범위를 막지 않는다
  const wide = build(ENTRY, 'auto');
  const wideLine = optionsOf(wide.root).find((b) => b.getAttribute('data-mode') === 'line');
  fire(wideLine, 'click', { target: wideLine });
  const wideField = fieldOf(wide.root);
  wideField.value = '99';
  fire(wideField, 'input', { target: wideField });
  check('트랙 수보다 큰 라인도 막지 않는다', previewOf(wide.root) === '99',
    '범위 밖 값은 암시적 트랙을 만든다 — CSS의 실제 동작이다');
  check('입력 칸에 min·max가 없다',
    wideField.getAttribute('min') === null && wideField.getAttribute('max') === null);
}

/* ==========================================================================
   controls.js 연결
   ========================================================================== */
section('controls.js 연결');

{
  const controls = codeOnly(read('../js/ui/controls.js'));
  check('PENDING_CONTROLS에서 빠졌다', !/PENDING_CONTROLS[^;]*'span'/.test(controls));
  check('PENDING_CONTROLS가 비었다', /PENDING_CONTROLS = new Set\(\)/.test(controls),
    'area-grid는 GR-04에서 빠졌다');
  check('토픽을 모른다', !/topic/.test(controls));

  ENTRIES.forEach((entry) => {
    const calls = [];
    const { root, sync } = createControl(entry, {
      value: entry.default, doc, onChange: (p, v) => calls.push([p, v]),
    });

    const pending = walk(root).some((n) => n.getAttribute('data-pending') !== null);
    const btn = optionsOf(root).find((b) => b.getAttribute('data-mode') === 'span');
    fire(btn, 'click', { target: btn });

    sync('-2');
    check(`${entry.prop}`, !pending && calls.length === 1 && calls[0][0] === entry.jsProp
      && VALID.test(calls[0][1]) && previewOf(root) === '-2',
      `알림 ${JSON.stringify(calls[0])} · sync 후 ${previewOf(root)}`);
  });

  const { root } = createControl(ENTRY, { value: ENTRY.default, doc });
  check('data-control이 span', root.getAttribute('data-control') === 'span');
  check('라벨은 그대로', walk(root).some((n) => n.textContent === ENTRY.prop));
}

/* ==========================================================================
   접근성 · 하드코딩
   ========================================================================== */
section('접근성 · 하드코딩');

{
  const { root } = build();
  const options = optionsOf(root);

  check('radiogroup + radio', byClass(root, 'fgp-span__mode')[0].getAttribute('role') === 'radiogroup'
    && options.every((b) => b.getAttribute('role') === 'radio'));
  check('버튼은 전부 button 요소',
    options.every((b) => b.tagName === 'BUTTON' && b.getAttribute('type') === 'button'));
  check('선택된 것만 aria-checked',
    options.filter((b) => b.getAttribute('aria-checked') === 'true').length === 1);
  check('선택된 것만 tabindex 0',
    options.filter((b) => b.getAttribute('tabindex') === '0').length === 1);
  check('선택된 것에 표시 클래스', options.filter((b) => b.classList.contains(CHECKED_CLASS)).length === 1);
  check('입력 칸에 이름이 붙어 있다', (fieldOf(root).getAttribute('aria-label') ?? '').length > 0,
    fieldOf(root).getAttribute('aria-label'));
  check('모드 묶음에도 이름이 붙어 있다',
    (byClass(root, 'fgp-span__mode')[0].getAttribute('aria-label') ?? '').length > 0);

  // 화살표로 옮겨진다
  const bar = byClass(root, 'fgp-span__mode')[0];
  fire(bar, 'keydown', { key: 'ArrowRight', target: options[0] });
  check('오른쪽 화살표로 다음 모양', previewOf(root) === '1', previewOf(root));
  fire(bar, 'keydown', { key: 'ArrowLeft', target: options[1] });
  check('왼쪽 화살표로 이전 모양', previewOf(root) === AUTO);
  fire(bar, 'keydown', { key: 'ArrowLeft', target: options[0] });
  check('처음에서 왼쪽이면 끝으로 돈다', modeOf(previewOf(root)) === 'span', previewOf(root));

  const src = read('../js/ui/span-editor.js');
  check('인라인 onclick 0건', !/onclick/i.test(src));
  check('이벤트는 위임으로만', (src.match(/addEventListener/g) ?? []).length === 3,
    'click · keydown · input');
  check('innerHTML 0건', !/innerHTML/.test(codeOnly(src)));
  check('자체 변환을 만들지 않았다',
    !/function parseSpan/.test(src) && !/match\(\/\^/.test(src) && /CONTROL_TYPES\.span/.test(src));

  const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g;
  [['js/ui/span-editor.js', '../js/ui/span-editor.js'],
   ['css/components.css', '../css/components.css']].forEach(([label, rel]) => {
    const hits = read(rel).match(COLOR) ?? [];
    check(`${label} 색상 0건`, hits.length === 0, hits.join(', ') || '0건');
  });

  const css = read('../css/components.css');
  const block = css.slice(css.indexOf('.fgp-span {'), css.indexOf('토픽 전환 (F-01)'));
  const stray = block.replace(/border(-[a-z]+)?:\s*1px/g, '').match(/\d+px/g) ?? [];
  check('span 편집기 CSS에 px 리터럴 없음', stray.length === 0, stray.join(', ') || '테두리 1px만');
  check('span 편집기 CSS에 --p- 참조 없음', !/var\(--p-/.test(block));
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
