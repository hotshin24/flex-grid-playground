/**
 * check-controls.mjs — controls.js 동작 확인
 *
 * jsdom을 쓰지 않는다. check-renderer.mjs와 같은 방식으로, controls가 실제로
 * 호출하는 DOM API만 이 파일 안에서 최소 구현해 주입한다.
 * 이벤트는 스텁이 버블링을 흉내 내 위임 핸들러까지 전달한다.
 *
 *   node tools/check-controls.mjs
 */

import { readFileSync } from 'node:fs';
import {
  createControl, splitLength, joinLength,
  CONTROL_CLASS, LABEL_CLASS, OPTION_CLASS, VALUES_CLASS, CHECKED_CLASS,
} from '../js/ui/controls.js';
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
   최소 DOM 스텁
   ========================================================================== */

const stats = { styleWrites: 0 };

function makeStyle() {
  return new Proxy({}, {
    set(t, k, v) { stats.styleWrites++; t[k] = v; return true; },
  });
}

function createElement(tag) {
  const classes = new Set();
  const listeners = {};

  const el = {
    tagName: String(tag).toUpperCase(),
    className: '',
    children: [],
    parentNode: null,
    textContent: '',
    value: '',
    style: makeStyle(),
    attrs: {},
    listeners,
    classList: {
      add: (n) => classes.add(n),
      remove: (n) => classes.delete(n),
      contains: (n) => classes.has(n),
      toggle: (n, force) => (force ? classes.add(n) : classes.delete(n), Boolean(force)),
    },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    removeChild(child) {
      const i = this.children.indexOf(child);
      this.children.splice(i, 1);
      child.parentNode = null;
      return child;
    },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    getAttribute(name) { return this.attrs[name] ?? null; },
    removeAttribute(name) { delete this.attrs[name]; },
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    focus() { this.focused = true; },
  };

  Object.defineProperty(el, 'innerHTML', { get: () => '', set: () => { stats.innerHTML = true; } });
  return el;
}

const doc = { createElement };

/** target에서 위로 올라가며 등록된 핸들러를 호출한다 (버블링 흉내). */
function fire(el, type, props = {}) {
  const e = { type, target: el, defaultPrevented: false, ...props };
  e.preventDefault = () => { e.defaultPrevented = true; };

  let node = el;
  while (node) {
    (node.listeners?.[type] ?? []).slice().forEach((fn) => fn(e));
    node = node.parentNode;
  }
  return e;
}

/** 트리를 훑어 조건에 맞는 요소를 모은다. */
function walk(el, out = []) {
  out.push(el);
  el.children.forEach((c) => walk(c, out));
  return out;
}

const findByClass = (root, cls) => walk(root).filter((el) => el.className.split(' ').includes(cls));
const optionsOf = (root) => findByClass(root, OPTION_CLASS);

function build(entry, value) {
  const calls = [];
  const root = createControl(entry, {
    value,
    onChange: (jsProp, v) => calls.push([jsProp, v]),
    doc,
  });
  return { root, calls };
}

const byProp = (schema, prop) => schema.find((e) => e.prop === prop);

/* ==========================================================================
   구조 규칙
   ========================================================================== */
section('구조 규칙');

{
  const src = readFileSync(new URL('../js/ui/controls.js', import.meta.url), 'utf8');
  check('store를 import하지 않음', !/from\s+['"].*store\.js['"]/.test(src));
  check('색상 리터럴 0건', (src.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g) ?? []).length === 0);
  check('!important 0건', !src.includes('!important'));
  check('innerHTML 미사용', !/\.innerHTML/.test(src));
}

/* ==========================================================================
   Flex 스키마 전량 생성
   ========================================================================== */
section('Flex 스키마 12개 생성');

{
  const targets = FLEX_SCHEMA.filter((e) => ['enum', 'number', 'length'].includes(e.control));
  check('대상 항목 수', targets.length === 12, `${targets.length}/12 (enum·number·length)`);

  const errors = [];
  const roots = targets.map((entry) => {
    try {
      return build(entry).root;
    } catch (err) {
      errors.push(`${entry.prop}: ${err.message}`);
      return null;
    }
  });

  check('전부 오류 없이 생성', errors.length === 0, errors.join(' / ') || '오류 0건');
  check('전부 루트 클래스 보유', roots.every((r) => r && r.className.startsWith(CONTROL_CLASS)));
  check('data-prop 반영', roots.every((r, i) => r.getAttribute('data-prop') === targets[i].prop));
  check('data-control 반영', roots.every((r, i) => r.getAttribute('data-control') === targets[i].control));

  const labels = roots.map((r) => findByClass(r, LABEL_CLASS)[0]);
  check('라벨은 스키마 label 사용',
    labels.every((l, i) => l.textContent === targets[i].label),
    labels.map((l) => l.textContent).slice(0, 3).join(', ') + ' …');

  const noLabel = { ...byProp(FLEX_SCHEMA, 'gap') };
  delete noLabel.label;
  const fallback = build(noLabel).root;
  check('label 없으면 prop으로 대체', findByClass(fallback, LABEL_CLASS)[0].textContent === 'gap');
}

/* ==========================================================================
   enum
   ========================================================================== */
section('enum 컨트롤');

{
  const enums = FLEX_SCHEMA.filter((e) => e.control === 'enum');
  const mismatches = enums.filter((entry) => optionsOf(build(entry).root).length !== entry.values.length);
  check('옵션 수 = values 길이', mismatches.length === 0,
    enums.map((e) => `${e.prop}:${e.values.length}`).join(' '));

  const entry = byProp(FLEX_SCHEMA, 'justify-content');
  const { root } = build(entry);
  const group = findByClass(root, VALUES_CLASS)[0];

  check('role=radiogroup', group.getAttribute('role') === 'radiogroup');
  check('aria-labelledby가 라벨 id', group.getAttribute('aria-labelledby') === findByClass(root, LABEL_CLASS)[0].getAttribute('id'));
  check('옵션 role=radio', optionsOf(root).every((o) => o.getAttribute('role') === 'radio'));
  check('옵션 type=button', optionsOf(root).every((o) => o.getAttribute('type') === 'button'));
}

/* ==========================================================================
   aria-checked
   ========================================================================== */
section('aria-checked 일치');

{
  const entry = byProp(FLEX_SCHEMA, 'justify-content');
  const { root, calls } = build(entry, 'center');
  const options = optionsOf(root);
  const checkedOf = () => options.filter((o) => o.getAttribute('aria-checked') === 'true');

  check('현재 값 하나만 true', checkedOf().length === 1 && checkedOf()[0].getAttribute('data-value') === 'center',
    checkedOf().map((o) => o.getAttribute('data-value')).join(','));
  check('나머지는 false', options.filter((o) => o.getAttribute('aria-checked') === 'false').length === options.length - 1);
  check('선택 항목만 tabindex 0',
    options.filter((o) => o.getAttribute('tabindex') === '0').length === 1 &&
    checkedOf()[0].getAttribute('tabindex') === '0');
  check('선택 클래스 반영', checkedOf()[0].classList.contains(CHECKED_CLASS));

  fire(options[5], 'click');
  check('클릭 후 aria-checked 이동',
    checkedOf().length === 1 && checkedOf()[0].getAttribute('data-value') === entry.values[5].val,
    checkedOf()[0].getAttribute('data-value'));
  check('클릭 후 tabindex도 이동', options[5].getAttribute('tabindex') === '0' && options[1].getAttribute('tabindex') === '-1');
  check('onChange 1회', calls.length === 1);
}

/* ==========================================================================
   onChange 인자
   ========================================================================== */
section('onChange (jsProp, 값)');

{
  const entry = byProp(FLEX_SCHEMA, 'justify-content');
  const { root, calls } = build(entry);
  fire(optionsOf(root)[2], 'click');
  check('enum 클릭', eq(calls[0], ['justifyContent', 'center']), JSON.stringify(calls[0]));

  fire(optionsOf(root)[2], 'click');
  check('같은 값 재클릭은 통지 없음', calls.length === 1, `${calls.length}회`);
}

{
  const entry = byProp(FLEX_SCHEMA, 'flex-grow');
  const { root, calls } = build(entry);
  const input = findByClass(root, 'fgp-control__field')[0];

  check('range 속성', input.getAttribute('type') === 'range' &&
    input.getAttribute('min') === '0' && input.getAttribute('max') === '5' && input.getAttribute('step') === '1');

  input.value = '3';
  fire(input, 'input');
  check('number onChange', eq(calls[0], ['flexGrow', 3]), JSON.stringify(calls[0]));
  check('숫자 타입으로 변환', typeof calls[0][1] === 'number');
  check('readout 갱신', findByClass(root, 'fgp-control__readout')[0].textContent === '3');
}

{
  const entry = byProp(FLEX_SCHEMA, 'gap');
  const { root, calls } = build(entry, '8px');
  const input = findByClass(root, 'fgp-control__field')[0];
  const select = findByClass(root, 'fgp-control__unit')[0];

  check('값 분해', input.value === '8' && select.value === 'px', `${input.value} / ${select.value}`);
  check('단위 옵션 수', select.children.length === entry.units.length, `${select.children.length}/${entry.units.length}`);

  input.value = '16';
  fire(input, 'input');
  check('length onChange', eq(calls[0], ['gap', '16px']), JSON.stringify(calls[0]));

  select.value = 'rem';
  fire(select, 'change');
  check('단위 변경 반영', eq(calls[1], ['gap', '16rem']), JSON.stringify(calls[1]));
}

{
  const entry = byProp(FLEX_SCHEMA, 'flex-basis');
  const { root, calls } = build(entry, 'auto');
  const input = findByClass(root, 'fgp-control__field')[0];
  const select = findByClass(root, 'fgp-control__unit')[0];

  check('키워드 단위 인식', select.value === 'auto' && input.value === '');
  check('키워드일 때 수치 입력 비활성', input.getAttribute('disabled') === 'disabled');

  select.value = 'px';
  input.value = '140';
  fire(select, 'change');
  check('키워드 → 수치 전환', eq(calls[0], ['flexBasis', '140px']), JSON.stringify(calls[0]));
  check('전환 시 입력 활성화', input.getAttribute('disabled') === null);

  select.value = 'content';
  fire(select, 'change');
  check('수치 → 키워드 전환', eq(calls[1], ['flexBasis', 'content']), JSON.stringify(calls[1]));
}

/* ==========================================================================
   키보드
   ========================================================================== */
section('키보드 조작');

{
  const entry = byProp(FLEX_SCHEMA, 'justify-content');
  const { root, calls } = build(entry, 'flex-start');
  const options = optionsOf(root);
  const checked = () => options.find((o) => o.getAttribute('aria-checked') === 'true').getAttribute('data-value');

  const e1 = fire(options[0], 'keydown', { key: 'ArrowRight' });
  check('ArrowRight 다음 값', checked() === entry.values[1].val, checked());
  check('기본 동작 차단', e1.defaultPrevented);
  check('이동한 옵션에 포커스', options[1].focused === true);

  fire(options[1], 'keydown', { key: 'ArrowDown' });
  check('ArrowDown도 다음 값', checked() === entry.values[2].val, checked());

  fire(options[2], 'keydown', { key: 'ArrowLeft' });
  check('ArrowLeft 이전 값', checked() === entry.values[1].val, checked());

  fire(options[1], 'keydown', { key: 'ArrowUp' });
  check('ArrowUp도 이전 값', checked() === entry.values[0].val, checked());

  fire(options[0], 'keydown', { key: 'ArrowLeft' });
  check('처음에서 이전 → 마지막으로 순환', checked() === entry.values.at(-1).val, checked());

  const before = calls.length;
  fire(options[0], 'keydown', { key: 'Enter' });
  check('그 외 키는 무시', calls.length === before);
}

/* ==========================================================================
   인라인 핸들러 · 스타일
   ========================================================================== */
section('인라인 onclick · style 0건');

{
  stats.styleWrites = 0;
  const roots = FLEX_SCHEMA
    .filter((e) => ['enum', 'number', 'length'].includes(e.control))
    .map((entry) => build(entry).root);

  const all = roots.flatMap((r) => walk(r));
  const onclicks = all.filter((el) => Object.keys(el.attrs).some((a) => a.toLowerCase().startsWith('on')));
  const styleAttrs = all.filter((el) => el.attrs.style !== undefined);

  check('요소 수', all.length > 0, `${all.length}개 검사`);
  check('인라인 on* 속성 0건', onclicks.length === 0, `${onclicks.length}건`);
  check('style 속성 0건', styleAttrs.length === 0, `${styleAttrs.length}건`);
  check('style 프로퍼티 쓰기 0건', stats.styleWrites === 0, `${stats.styleWrites}회`);
  check('innerHTML 쓰기 없음', stats.innerHTML === undefined);
}

/* ==========================================================================
   M3 보류 컨트롤
   ========================================================================== */
section('M3 보류 컨트롤');

{
  const pending = ['track-list', 'area-grid', 'span'];
  const entries = pending.map((c) => GRID_SCHEMA.find((e) => e.control === c));
  check('grid 스키마에서 3종 확보', entries.every(Boolean), entries.map((e) => e?.prop).join(', '));

  const roots = entries.map((entry) => build(entry).root);
  check('오류 없이 자리만 생성', roots.every((r) => r && r.children.length === 2));
  check('data-pending=M3 표시', roots.every((r) => findByClass(r, VALUES_CLASS)[0].getAttribute('data-pending') === 'M3'));
  check('조작 요소 없음', roots.every((r) => optionsOf(r).length === 0));
  check('라벨은 그대로 생성', roots.every((r) => findByClass(r, LABEL_CLASS)[0].textContent.length > 0));
}

/* ==========================================================================
   길이 값 헬퍼
   ========================================================================== */
section('length 분해·조립');

{
  const units = ['auto', 'px', '%', 'rem', 'content'];
  check("'12px'", eq(splitLength('12px', units), { num: '12', unit: 'px' }));
  check("'auto'", eq(splitLength('auto', units), { num: '', unit: 'auto' }));
  check("'50%'", eq(splitLength('50%', units), { num: '50', unit: '%' }));
  check("'-3px'", eq(splitLength('-3px', units), { num: '-3', unit: 'px' }));
  check('조립 수치', joinLength('16', 'px') === '16px');
  check('조립 키워드', joinLength('16', 'auto') === 'auto');
  check('빈 수치는 0', joinLength('', 'px') === '0px');
}

/* ==========================================================================
   방어
   ========================================================================== */
section('방어');

{
  let threw = 0;
  try { createControl(null, { doc }); } catch { threw++; }
  try { createControl({ prop: 'x', control: '없는타입' }, { doc }); } catch { threw++; }
  try { createControl(byProp(FLEX_SCHEMA, 'gap'), { doc: null }); } catch { threw++; }
  check('잘못된 입력 3종 거부', threw === 3, `${threw}/3`);

  const entry = byProp(FLEX_SCHEMA, 'gap');
  let ok = true;
  try { createControl(entry, { doc }); } catch { ok = false; }
  check('onChange 없어도 생성 가능', ok);
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
