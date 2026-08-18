/**
 * check-explain.mjs — 속성 설명 탭 확인
 *
 * jsdom을 쓰지 않는다. explain이 실제로 호출하는 DOM API만 최소 구현해 주입한다.
 *   node tools/check-explain.mjs
 */

import { readFileSync } from 'node:fs';
import { createExplain, NAV_ITEM_CLASS, CASE_CLASS, DEMO_CLASS, AXIS_CLASS } from '../js/ui/explain.js';
import { FLEX_EXPLAIN_NOTES, FLEX_EXPLAIN_SAMPLES, AXIS_LABELS } from '../js/topics/flex/explain.js';
import { FLEX_SCHEMA } from '../js/topics/flex/schema.js';
import { createStore } from '../js/core/store.js';

let failed = 0;

function check(label, ok, detail = '') {
  console.log(`  [${ok ? 'OK  ' : 'FAIL'}] ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ========================================================================== */

const stats = { innerHTML: 0 };

function createElement(tag) {
  const classes = new Set();
  const listeners = {};

  const el = {
    tagName: String(tag).toUpperCase(),
    className: '',
    children: [],
    parentNode: null,
    textContent: '',
    hidden: false,
    attrs: {},
    listeners,
    style: {
      _custom: new Map(),
      setProperty(n, v) { this._custom.set(n, v); },
      getPropertyValue(n) { return this._custom.get(n) ?? ''; },
    },
    classList: {
      add: (n) => classes.add(n),
      remove: (n) => classes.delete(n),
      contains: (n) => classes.has(n),
      toggle: (n, force) => (force ? classes.add(n) : classes.delete(n), Boolean(force)),
    },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    getAttribute(name) { return this.attrs[name] ?? null; },
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    focus() { this.focused = true; },
  };

  Object.defineProperty(el, 'innerHTML', { get: () => '', set: () => { stats.innerHTML++; } });
  return el;
}

const doc = { createElement, activeElement: null };

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

function walk(el, out = []) {
  out.push(el);
  el.children.forEach((c) => walk(c, out));
  return out;
}

const byClass = (root, cls) => walk(root).filter((el) => el.className.split(' ').includes(cls));
const textOf = (el) => walk(el).map((n) => n.textContent).join(' ');
/** 인라인 표기를 조각으로 나눠 붙이므로 조각 사이에 공백이 낀다. 비교 전에 지운다. */
const squeeze = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, '');

function build() {
  const root = createElement('section');
  const api = createExplain({
    schema: FLEX_SCHEMA,
    notes: FLEX_EXPLAIN_NOTES,
    samples: FLEX_EXPLAIN_SAMPLES,
    axisLabels: AXIS_LABELS,
    root,
    doc,
  });
  return { ...api, root, nav: byClass(root, NAV_ITEM_CLASS), details: byClass(root, 'fgp-explain__detail') };
}

/* ==========================================================================
   구조 규칙
   ========================================================================== */
section('구조 규칙');

{
  const ui = readFileSync(new URL('../js/ui/explain.js', import.meta.url), 'utf8');
  check('store를 import하지 않음', !/from\s+['"].*store\.js['"]/.test(ui));
  check('속성명 분기 없음', !/prop\s*===\s*['"]/.test(ui) && !/jsProp\s*===\s*['"]/.test(ui));
  check('innerHTML 미사용', !/\.innerHTML/.test(ui));
  check('색상 리터럴 0건', (ui.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? []).length === 0);

  // 설명 문장이 UI 코드에 없는지 — 스키마 문장이 하드코딩됐다면 걸린다
  const sentences = FLEX_SCHEMA.flatMap((e) => [e.desc, e.tip].filter(Boolean));
  check('설명 문장 하드코딩 0건', sentences.every((s) => !ui.includes(s.slice(0, 20))));

  const content = readFileSync(new URL('../js/topics/flex/explain.js', import.meta.url), 'utf8');
  check('보충 콘텐츠는 topics에 있음', /FLEX_EXPLAIN_NOTES/.test(content));
}

/* ==========================================================================
   속성 목록
   ========================================================================== */
section('속성 목록');

{
  const { nav, details } = build();

  check('속성 12개 전부 항목 있음', nav.length === FLEX_SCHEMA.length, `${nav.length}/${FLEX_SCHEMA.length}`);
  check('순서까지 스키마와 일치', eq(nav.map((b) => b.getAttribute('data-prop')), FLEX_SCHEMA.map((e) => e.prop)));
  check('상세도 12개', details.length === FLEX_SCHEMA.length);
  check('처음엔 첫 속성만 보임', details.filter((d) => !d.hidden).length === 1 && !details[0].hidden);
  check('선택 항목만 tabindex 0', nav.filter((b) => b.getAttribute('tabindex') === '0').length === 1);
  check('aria-current 하나만 true', nav.filter((b) => b.getAttribute('aria-current') === 'true').length === 1);
}

/* ==========================================================================
   값 수 = 스키마 values 길이
   ========================================================================== */
section('값별 데모');

{
  const { details } = build();

  const mismatch = [];
  FLEX_SCHEMA.forEach((entry, i) => {
    const cases = byClass(details[i], CASE_CLASS);
    const expected = entry.values?.length ?? FLEX_EXPLAIN_SAMPLES[entry.prop]?.length ?? 0;
    if (cases.length !== expected) mismatch.push(`${entry.prop} ${cases.length}/${expected}`);
  });
  check('값 수가 스키마·표본과 일치', mismatch.length === 0, mismatch.join(', ') || '12속성 전부 일치');

  const enums = FLEX_SCHEMA.filter((e) => e.values);
  check('enum 속성은 스키마 values 그대로',
    enums.every((entry) => {
      const i = FLEX_SCHEMA.indexOf(entry);
      const cases = byClass(details[i], CASE_CLASS);
      return eq(cases.map((c) => c.getAttribute('data-value')), entry.values.map((v) => String(v.val)));
    }),
    enums.map((e) => `${e.prop}:${e.values.length}`).join(' '));

  const nonEnum = FLEX_SCHEMA.filter((e) => !e.values);
  check('enum 아닌 속성은 표본에서', nonEnum.every((e) => FLEX_EXPLAIN_SAMPLES[e.prop]?.length > 0),
    nonEnum.map((e) => `${e.prop}:${FLEX_EXPLAIN_SAMPLES[e.prop]?.length ?? 0}`).join(' '));

  check('모든 케이스에 데모가 있음',
    details.every((d, i) => byClass(d, CASE_CLASS).every((c) => byClass(c, DEMO_CLASS).length >= 1)));

  // demo.itemCount 반영
  const wrapAt = FLEX_SCHEMA.findIndex((e) => e.prop === 'flex-wrap');
  const firstDemo = byClass(details[wrapAt], DEMO_CLASS)[0];
  check('demo.itemCount 반영', firstDemo.children.length === FLEX_SCHEMA[wrapAt].demo.itemCount,
    `${firstDemo.children.length}/${FLEX_SCHEMA[wrapAt].demo.itemCount}`);
}

/* ==========================================================================
   axisAware
   ========================================================================== */
section('axisAware 양쪽 데모');

{
  const { details } = build();

  const aware = FLEX_SCHEMA.filter((e) => e.axisAware);
  const plain = FLEX_SCHEMA.filter((e) => !e.axisAware);
  check('axisAware 속성이 있음', aware.length > 0 && aware.length + plain.length === FLEX_SCHEMA.length,
    `${aware.length}건 — ` + aware.map((e) => e.prop).join(', '));

  check('axisAware는 케이스마다 데모 2개',
    aware.every((entry) => {
      const d = details[FLEX_SCHEMA.indexOf(entry)];
      return byClass(d, CASE_CLASS).every((c) => byClass(c, DEMO_CLASS).length === 2);
    }));

  check('축 이름표도 2개',
    aware.every((entry) => {
      const d = details[FLEX_SCHEMA.indexOf(entry)];
      return byClass(d, CASE_CLASS).every((c) => byClass(c, AXIS_CLASS).length === 2);
    }));

  check('축 이름표는 topics의 문구',
    (() => {
      const d = details[FLEX_SCHEMA.indexOf(aware[0])];
      const labels = byClass(byClass(d, CASE_CLASS)[0], AXIS_CLASS).map((el) => el.textContent);
      return eq(labels, [AXIS_LABELS.row, AXIS_LABELS.column]);
    })());

  check('그 외 속성은 데모 1개',
    plain.every((entry) => {
      const d = details[FLEX_SCHEMA.indexOf(entry)];
      return byClass(d, CASE_CLASS).every((c) => byClass(c, DEMO_CLASS).length === 1);
    }));
}

/* ==========================================================================
   문장이 스키마에서 나오는지
   ========================================================================== */
section('설명 문장 출처');

{
  const { details } = build();

  const descMissing = FLEX_SCHEMA.filter((entry, i) => !squeeze(textOf(details[i])).includes(squeeze(entry.desc)));
  check('desc가 화면에 나옴', descMissing.length === 0, descMissing.map((e) => e.prop).join(', ') || '12속성');

  const tipMissing = FLEX_SCHEMA.filter((entry, i) => !squeeze(textOf(details[i])).includes(squeeze(entry.tip)));
  check('tip이 화면에 나옴', tipMissing.length === 0, tipMissing.map((e) => e.prop).join(', ') || '12속성');

  const valueDescMissing = [];
  FLEX_SCHEMA.forEach((entry, i) => {
    const list = entry.values ?? FLEX_EXPLAIN_SAMPLES[entry.prop] ?? [];
    const text = textOf(details[i]);
    list.forEach((v) => { if (v.desc && !squeeze(text).includes(squeeze(v.desc))) valueDescMissing.push(`${entry.prop}:${v.val}`); });
  });
  check('값 설명이 전부 나옴', valueDescMissing.length === 0, valueDescMissing.join(', ') || '전량');

  const noteProps = Object.keys(FLEX_EXPLAIN_NOTES);
  check('보충 note가 나옴',
    noteProps.every((prop) => {
      const i = FLEX_SCHEMA.findIndex((e) => e.prop === prop);
      return squeeze(textOf(details[i])).includes(squeeze(FLEX_EXPLAIN_NOTES[prop]));
    }),
    `${noteProps.length}건`);

  check('MDN 링크', FLEX_SCHEMA.every((entry, i) =>
    walk(details[i]).some((el) => el.getAttribute('href') === entry.mdn)));
}

/* ==========================================================================
   선택 · 키보드
   ========================================================================== */
section('선택과 키보드');

{
  const { nav, details, select, selected } = build();

  fire(nav[3], 'click');
  check('클릭으로 선택 이동', selected() === FLEX_SCHEMA[3].prop, selected());
  check('해당 상세만 보임', details.filter((d) => !d.hidden).length === 1 && !details[3].hidden);

  const e1 = fire(nav[3], 'keydown', { key: 'ArrowDown' });
  check('ArrowDown 다음 속성', selected() === FLEX_SCHEMA[4].prop);
  check('기본 동작 차단', e1.defaultPrevented);
  check('포커스 이동', nav[4].focused === true);

  fire(nav[4], 'keydown', { key: 'ArrowUp' });
  check('ArrowUp 이전 속성', selected() === FLEX_SCHEMA[3].prop);

  select(FLEX_SCHEMA[0].prop);
  fire(nav[0], 'keydown', { key: 'ArrowLeft' });
  check('처음에서 이전 → 마지막 순환', selected() === FLEX_SCHEMA.at(-1).prop);

  check('innerHTML 쓰기 0건', stats.innerHTML === 0);
}

/* ==========================================================================
   메인 store 불변
   ========================================================================== */
section('store 불변');

{
  const store = createStore({ flex: FLEX_SCHEMA });
  const before = JSON.stringify(store.getState());

  build();
  const { nav } = build();
  fire(nav[5], 'click');
  fire(nav[5], 'keydown', { key: 'ArrowRight' });

  check('상태가 그대로', JSON.stringify(store.getState()) === before);
  check('히스토리도 그대로', store.canUndo() === false && store.canRedo() === false);
}

/* ==========================================================================
   방어
   ========================================================================== */
section('방어');

{
  let threw = 0;
  try { createExplain({ schema: [], root: createElement('div'), doc }); } catch { threw++; }
  try { createExplain({ schema: FLEX_SCHEMA, doc }); } catch { threw++; }
  try { createExplain({ schema: FLEX_SCHEMA, root: createElement('div'), doc: null }); } catch { threw++; }
  check('잘못된 구성 3종 거부', threw === 3, `${threw}/3`);

  let ok = true;
  try { createExplain({ schema: FLEX_SCHEMA, root: createElement('div'), doc }); } catch { ok = false; }
  check('보충 콘텐츠 없어도 생성 가능', ok);
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
