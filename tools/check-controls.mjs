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
  createControl, createRangeControl, splitLength, joinLength,
  CONTROL_CLASS, LABEL_CLASS, PROP_CLASS, HINT_CLASS, OPTION_CLASS, VALUES_CLASS, CHECKED_CLASS,
  INACTIVE_CLASS, NOTE_CLASS, REASON_CLASS, REMEDY_CLASS,
} from '../js/ui/controls.js';
import { isInactive, deriveState } from '../js/core/schema-spec.js';
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
  const { root, sync, setInactive } = createControl(entry, {
    value,
    onChange: (jsProp, v) => calls.push([jsProp, v]),
    doc,
  });
  return { root, sync, setInactive, calls };
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

  const props = roots.map((r) => findByClass(r, PROP_CLASS)[0]);
  const hints = roots.map((r) => findByClass(r, HINT_CLASS)[0]);

  check('1행은 CSS 속성명',
    props.every((el, i) => el && el.textContent === targets[i].prop),
    props.map((el) => el.textContent).slice(0, 3).join(', ') + ' …');
  check('1행은 code 요소', props.every((el) => el.tagName === 'CODE'));
  check('2행은 스키마 label',
    hints.every((el, i) => el && el.textContent === targets[i].label),
    hints.map((el) => el.textContent).slice(0, 3).join(', ') + ' …');
  check('두 줄 모두 라벨 요소 안에',
    roots.every((r) => {
      const label = findByClass(r, LABEL_CLASS)[0];
      return label.children.length === 2 &&
        label.children[0].className === PROP_CLASS &&
        label.children[1].className === HINT_CLASS;
    }));

  const noLabel = { ...byProp(FLEX_SCHEMA, 'gap') };
  delete noLabel.label;
  const fallback = build(noLabel).root;
  check('label 없으면 속성명만', findByClass(fallback, PROP_CLASS)[0].textContent === 'gap');
  check('label 없으면 2행 생략', findByClass(fallback, HINT_CLASS).length === 0);
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
  const labelEl = findByClass(root, LABEL_CLASS)[0];
  check('aria-labelledby가 라벨 id', group.getAttribute('aria-labelledby') === labelEl.getAttribute('id'));
  check('가리키는 요소가 속성명과 설명을 모두 포함',
    findByClass(labelEl, PROP_CLASS).length === 1 && findByClass(labelEl, HINT_CLASS).length === 1);
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
  check('라벨은 그대로 생성', roots.every((r) => findByClass(r, PROP_CLASS)[0].textContent.length > 0));
}

/* ==========================================================================
   sync — 컨트롤 밖에서 상태가 바뀌었을 때 (undo 등)
   ========================================================================== */
section('sync');

{
  const entry = byProp(FLEX_SCHEMA, 'justify-content');
  const { root, sync, calls } = build(entry, 'flex-start');
  const options = optionsOf(root);
  const checked = () => options.find((o) => o.getAttribute('aria-checked') === 'true').getAttribute('data-value');

  sync('space-around');
  check('enum 선택 이동', checked() === 'space-around', checked());
  check('sync는 onChange를 부르지 않음', calls.length === 0, `${calls.length}회`);
  check('tabindex도 따라감',
    options.find((o) => o.getAttribute('data-value') === 'space-around').getAttribute('tabindex') === '0');

  fire(options[0], 'click');
  check('sync 후에도 클릭이 정상 동작', eq(calls[0], ['justifyContent', 'flex-start']), JSON.stringify(calls[0]));
}

{
  const { root, sync, calls } = build(byProp(FLEX_SCHEMA, 'flex-grow'), 0);
  sync(4);
  check('number 슬라이더 갱신', findByClass(root, 'fgp-control__field')[0].value === '4');
  check('number readout 갱신', findByClass(root, 'fgp-control__readout')[0].textContent === '4');
  check('number sync는 통지 없음', calls.length === 0);
}

{
  const { root, sync, calls } = build(byProp(FLEX_SCHEMA, 'flex-basis'), 'auto');
  const input = findByClass(root, 'fgp-control__field')[0];
  const select = findByClass(root, 'fgp-control__unit')[0];

  sync('140px');
  check('length 수치·단위 갱신', input.value === '140' && select.value === 'px');
  check('length sync가 입력을 활성화', input.getAttribute('disabled') === null);

  sync('auto');
  check('키워드로 되돌리면 다시 비활성', input.getAttribute('disabled') === 'disabled' && input.value === '');
  check('length sync는 통지 없음', calls.length === 0);
}

/* ==========================================================================
   createRangeControl — 스키마 밖 수치 컨트롤
   ========================================================================== */
section('createRangeControl');

{
  const calls = [];
  const { root, sync } = createRangeControl({
    key: 'containerHeight', label: '높이', min: 120, max: 900, step: 10,
    fallback: 400, nullText: '기본값', value: null,
    onChange: (k, v) => calls.push([k, v]), doc,
  });

  const input = findByClass(root, 'fgp-control__field')[0];
  const readout = findByClass(root, 'fgp-control__readout')[0];

  check('data-range-key 반영', root.getAttribute('data-range-key') === 'containerHeight');
  check('null이면 nullText 표시', readout.textContent === '기본값', readout.textContent);
  check('null이면 슬라이더는 fallback 위치', input.value === '400', input.value);
  check('data-default 표시', root.getAttribute('data-default') === 'true');
  check('range 속성', input.getAttribute('min') === '120' && input.getAttribute('max') === '900' && input.getAttribute('step') === '10');

  input.value = '240';
  fire(input, 'input');
  check('조작 시 onChange', eq(calls[0], ['containerHeight', 240]), JSON.stringify(calls[0]));
  check('숫자 타입', typeof calls[0][1] === 'number');
  check('조작 후 readout', readout.textContent === '240px');
  check('조작 후 data-default 해제', root.getAttribute('data-default') === 'false');

  sync(null);
  check('sync(null)로 기본값 복귀', readout.textContent === '기본값' && root.getAttribute('data-default') === 'true');
  check('sync는 통지 없음', calls.length === 1);
}

{
  // 아이템 기하값처럼 null을 쓰지 않는 용례
  const calls = [];
  const { root, sync } = createRangeControl({
    key: 'width', label: '너비', min: 20, max: 400, step: 10, value: 80,
    onChange: (k, v) => calls.push([k, v]), doc,
  });
  const readout = findByClass(root, 'fgp-control__readout')[0];

  check('nullText 없으면 항상 수치 표시', readout.textContent === '80px', readout.textContent);
  check('data-default는 false', root.getAttribute('data-default') === 'false');
  sync(160);
  check('sync로 값 갱신', readout.textContent === '160px' && findByClass(root, 'fgp-control__field')[0].value === '160');
  check('sync 통지 없음', calls.length === 0);

  let threw = 0;
  try { createRangeControl({ label: 'x', min: 0, max: 1, doc }); } catch { threw++; }
  try { createRangeControl({ key: 'w', min: 0, max: 1, doc: null }); } catch { threw++; }
  check('잘못된 구성 2종 거부', threw === 2, `${threw}/2`);
}

/* ==========================================================================
   조건부 비활성 표시 (F-13 유형 A)

   판정은 schema-spec 이 하고 controls 는 결과만 그린다. 여기서는 실제 스키마
   선언으로 끝에서 끝까지 확인한다.
   ========================================================================== */
section('조건부 비활성 표시');

const ariaOf = (el) => el.getAttribute('aria-disabled');
const noteOf = (root) => findByClass(root, NOTE_CLASS)[0];

{
  const entry = byProp(FLEX_SCHEMA, 'align-content');
  check('스키마에 inactiveWhen 선언 있음', Boolean(entry.inactiveWhen));

  const { root, setInactive } = build(entry);
  const note = noteOf(root);

  // 초기 상태 — 판정 전
  check('만들 때는 활성', ariaOf(root) === 'false' && !root.classList.contains(INACTIVE_CLASS));
  check('사유 영역은 숨김', note.hidden === true);

  // 조건 충족 — flex-wrap: nowrap
  setInactive(isInactive(entry, { container: { flexWrap: 'nowrap' } }));
  check('조건 충족 → aria-disabled="true"', ariaOf(root) === 'true');
  check('비활성 클래스 부여', root.classList.contains(INACTIVE_CLASS));
  check('사유 영역 노출', note.hidden === false);
  check('reason 문구가 DOM에 들어감',
    findByClass(root, REASON_CLASS)[0].textContent === entry.inactiveWhen.reason,
    findByClass(root, REASON_CLASS)[0].textContent);
  check('hint 문구가 DOM에 들어감',
    findByClass(root, REMEDY_CLASS)[0].textContent === entry.inactiveWhen.hint);
  check('옵션에도 상태 전달', optionsOf(root).every((o) => ariaOf(o) === 'true'));
  check('사유를 aria-describedby로 연결',
    optionsOf(root).every((o) => o.getAttribute('aria-describedby') === note.getAttribute('id')));

  // 조건 미충족 — flex-wrap: wrap
  setInactive(isInactive(entry, { container: { flexWrap: 'wrap' } }));
  check('조건 미충족 → aria-disabled="false"', ariaOf(root) === 'false');
  check('비활성 클래스 해제', !root.classList.contains(INACTIVE_CLASS));
  check('사유 영역 다시 숨김', note.hidden === true);
  check('사유 문구 비움', findByClass(root, REASON_CLASS)[0].textContent === '');
  check('describedby 해제', optionsOf(root).every((o) => o.getAttribute('aria-describedby') === null));
}

{
  // 상태 참조 선언 (order) — 아이템 개수로 판정
  const entry = byProp(FLEX_SCHEMA, 'order');
  const { root, setInactive } = build(entry);

  setInactive(isInactive(entry, { state: deriveState({ items: [1] }) }));
  check('아이템 1개 → 비활성', ariaOf(root) === 'true');
  check('사유 문구 표시', findByClass(root, REASON_CLASS)[0].textContent === entry.inactiveWhen.reason);
  check('number 컨트롤의 입력에도 상태 전달',
    findByClass(root, 'fgp-control__field').every((el) => ariaOf(el) === 'true'));

  setInactive(isInactive(entry, { state: deriveState({ items: [1, 2] }) }));
  check('아이템 2개 → 활성', ariaOf(root) === 'false');
}

{
  // 선언이 없는 속성은 언제나 활성
  const entry = byProp(FLEX_SCHEMA, 'justify-content');
  const { root, setInactive } = build(entry);
  setInactive(isInactive(entry, { container: { flexWrap: 'nowrap' } }));
  check('선언 없으면 항상 활성', ariaOf(root) === 'false' && noteOf(root).hidden === true);
}

{
  // 막지 않는다 — 비활성이어도 조작이 그대로 동작해야 한다
  const entry = byProp(FLEX_SCHEMA, 'align-content');
  const { root, setInactive, calls } = build(entry);
  setInactive(isInactive(entry, { container: { flexWrap: 'nowrap' } }));

  const all = walk(root);
  check('disabled 속성 0건', all.filter((el) => el.attrs.disabled !== undefined).length === 0);

  fire(optionsOf(root)[2], 'click');
  check('비활성이어도 클릭이 동작', calls.length === 1, JSON.stringify(calls[0]));

  fire(optionsOf(root)[2], 'keydown', { key: 'ArrowRight' });
  check('비활성이어도 키보드가 동작', calls.length === 2, JSON.stringify(calls[1]));
}

{
  // 전 컨트롤에 disabled 가 없어야 한다 (length 의 키워드 단위 제외)
  const roots = FLEX_SCHEMA
    .filter((e) => ['enum', 'number'].includes(e.control))
    .map((entry) => {
      const b = build(entry);
      b.setInactive({ inactive: true, reason: 'x' });
      return b.root;
    });
  const withDisabled = roots.flatMap((r) => walk(r)).filter((el) => el.attrs.disabled !== undefined);
  check('비활성 처리한 전 컨트롤에 disabled 0건', withDisabled.length === 0, `${withDisabled.length}건`);
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
