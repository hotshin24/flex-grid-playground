/**
 * check-explain.mjs — 속성 설명 탭 확인
 *
 * jsdom을 쓰지 않는다. explain이 실제로 호출하는 DOM API만 최소 구현해 주입한다.
 *   node tools/check-explain.mjs
 */

import { readFileSync } from 'node:fs';
import { createExplain, trackCount, NAV_ITEM_CLASS, CASE_CLASS, DEMO_CLASS, AXIS_CLASS, LINES_CLASS, LINE_CLASS } from '../js/ui/explain.js';
import { FLEX_EXPLAIN_NOTES, FLEX_EXPLAIN_SAMPLES, AXIS_LABELS } from '../js/topics/flex/explain.js';
import { FLEX_SCHEMA } from '../js/topics/flex/schema.js';
import { GRID_SCHEMA } from '../js/topics/grid/schema.js';
import { GRID_EXPLAIN_NOTES, GRID_EXPLAIN_SAMPLES, GRID_EXPLAIN_DEMOS, GRID_DISPLAY }
  from '../js/topics/grid/explain.js';
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

/* ==========================================================================
   Grid 속성 설명 (M4)

   M3 완료 기준이 "19개 전부 조작 가능" 이었다면 M4 는 "19개 전부 설명 존재" 다.
   ========================================================================== */
section('Grid — 항목');

const gridApi = (() => {
  const root = createElement('section');
  const api = createExplain({
    schema: GRID_SCHEMA,
    notes: GRID_EXPLAIN_NOTES,
    samples: GRID_EXPLAIN_SAMPLES,
    demos: GRID_EXPLAIN_DEMOS,
    display: GRID_DISPLAY,
    root,
    doc,
  });
  return { ...api, root, nav: byClass(root, NAV_ITEM_CLASS), details: byClass(root, 'fgp-explain__detail') };
})();

{
  check('속성 19개 전부 목록에', gridApi.nav.length === 19, `${gridApi.nav.length}개`);
  check('본문도 19개', gridApi.details.length === 19);
  check('스키마 순서 그대로',
    gridApi.nav.every((b, i) => b.getAttribute('data-prop') === GRID_SCHEMA[i].prop));
  check('전부 설명 문장을 갖는다',
    gridApi.details.every((d) => byClass(d, 'fgp-explain__detail__desc')[0]?.children.length > 0));
  check('전부 MDN 링크를 갖는다',
    gridApi.details.every((d) => byClass(d, 'fgp-explain__detail__mdn')[0]
      ?.getAttribute('href')?.startsWith('https://developer.mozilla.org')));

  const empty = GRID_SCHEMA.filter((e, i) => byClass(gridApi.details[i], CASE_CLASS).length === 0);
  check('사례 없는 속성 0건', empty.length === 0, empty.map((e) => e.prop).join(', ') || '19개 전부');
}

section('Grid — 값 수');

{
  const rows = GRID_SCHEMA.map((entry, i) => ({
    entry,
    cases: byClass(gridApi.details[i], CASE_CLASS).length,
    want: (entry.values ?? GRID_EXPLAIN_SAMPLES[entry.prop] ?? []).length,
  }));

  const enums = rows.filter((r) => r.entry.control === 'enum');
  const others = rows.filter((r) => r.entry.control !== 'enum');

  check('enum 7개', enums.length === 7, enums.map((r) => r.entry.prop).join(', '));
  check('enum은 스키마 values 길이와 같다',
    enums.every((r) => r.cases === r.entry.values.length),
    enums.map((r) => `${r.entry.prop} ${r.cases}/${r.entry.values.length}`).join(' · '));

  check('비-enum 12개', others.length === 12);
  check('비-enum은 전부 대표 사례를 갖는다',
    others.every((r) => r.cases >= 2),
    others.map((r) => `${r.entry.prop} ${r.cases}`).join(' · '));
  check('사례 수가 선언한 만큼 나온다', rows.every((r) => r.cases === r.want));
  check('사례마다 설명이 붙어 있다',
    Object.values(GRID_EXPLAIN_SAMPLES).every((list) => list.every((v) => (v.desc ?? '').trim().length > 0)));
}

section('Grid — 데모 판');

{
  const demoOf = (prop) => {
    const i = GRID_SCHEMA.findIndex((e) => e.prop === prop);
    return byClass(gridApi.details[i], DEMO_CLASS)[0];
  };

  check('데모가 그리드로 선다', demoOf('justify-items').style.display === GRID_DISPLAY,
    '기본값 flex로 두면 트랙이 서지 않는다');

  /**
   * 조건부 5건 (F-13 유형 B). 조건이 판에 심겨 있어야 값 차이가 보인다.
   * 값을 바꿔도 그림이 같다면 판이 틀린 것이다.
   */
  const CONDITIONS = [
    ['justify-content', (st) => /px/.test(st.gridTemplateColumns ?? ''), '트랙이 px라야 가로 여백이 생긴다'],
    ['align-content', (st) => Boolean(st.height) && Boolean(st.gridTemplateRows), '높이와 행 트랙이 있어야 줄 뭉치가 움직인다'],
    ['grid-auto-columns', (st) => st.gridAutoFlow === 'column', '자동 배치가 열 방향이라야 암시적 열이 생긴다'],
    ['grid-auto-rows', (st) => Boolean(st.gridTemplateRows) && Boolean(st.height), '선언한 행보다 아이템이 많아야 암시적 행이 생긴다'],
  ];

  CONDITIONS.forEach(([prop, ok, why]) => {
    const st = { ...(GRID_SCHEMA.find((e) => e.prop === prop).demo?.containerStyle ?? {}),
      ...(GRID_EXPLAIN_DEMOS[prop]?.containerStyle ?? {}) };
    check(`${prop} — 조건이 판에 있다`, ok(st), why);
  });

  const flow = GRID_EXPLAIN_DEMOS['grid-auto-flow'];
  check('dense — 빈 칸을 만드는 아이템이 있다',
    (flow.itemStyles ?? []).some((s) => /span/.test(s.gridColumn ?? '')),
    '메울 자리가 없으면 dense가 할 일이 없다');
  check('dense — 아이템이 칸보다 적다',
    flow.itemCount < 3 * 3, `아이템 ${flow.itemCount}개`);

  // 라인 번호
  const lineProps = Object.entries(GRID_EXPLAIN_DEMOS).filter(([, d]) => d.lines).map(([p]) => p);
  check('라인 좌표 속성에 번호 띠', lineProps.length === 5, lineProps.join(', '));
  const spanDemo = demoOf('grid-column-start');
  const strip = byClass(gridApi.details[GRID_SCHEMA.findIndex((e) => e.prop === 'grid-column-start')], LINES_CLASS)[0];
  check('번호 띠가 실제로 그려진다', Boolean(strip));
  check('트랙 3개면 번호 4개', byClass(strip, LINE_CLASS).length === 4,
    byClass(strip, LINE_CLASS).map((n) => n.textContent).join('  '));
  check('repeat()를 풀어 센다',
    trackCount('repeat(3, 1fr)') === 3 && trackCount('repeat(2, 60px 1fr)') === 4,
    'repeat(3, 1fr)은 토큰 둘이지만 트랙 셋이다');
  check('minmax()는 하나로 센다', trackCount('minmax(120px, 1fr) 1fr') === 2);
  check('양수와 음수를 함께 적는다',
    byClass(strip, LINE_CLASS).every((n) => /^\d+ \/ -\d+$/.test(n.textContent)));
  check('데모와 같은 격자를 쓴다',
    strip.style.gridTemplateColumns === GRID_EXPLAIN_DEMOS['grid-column-start'].containerStyle.gridTemplateColumns);
  void spanDemo;

  check('stretch를 보여야 하는 데모는 아이템 크기를 비운다',
    ['justify-items', 'align-items', 'justify-self', 'align-self']
      .every((p) => GRID_EXPLAIN_DEMOS[p].itemSizes === 'fill'),
    '크기가 박혀 있으면 stretch가 할 일이 없다');
}

section('Grid — 문장 출처와 무해');

{
  const src = readFileSync(new URL('../js/topics/grid/explain.js', import.meta.url), 'utf8');
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

  const descs = GRID_SCHEMA.map((e) => e.desc).filter(Boolean);
  const tips = GRID_SCHEMA.map((e) => e.tip).filter(Boolean);
  check('스키마 desc를 베껴 두지 않았다', !descs.some((d) => stripped.includes(d)));
  check('스키마 tip도 베껴 두지 않았다', !tips.some((t) => stripped.includes(t)));
  check('값 설명도 베끼지 않았다',
    !GRID_SCHEMA.flatMap((e) => e.values ?? []).map((v) => v.desc).filter(Boolean)
      .some((d) => stripped.includes(d)));

  const uiSrc = readFileSync(new URL('../js/ui/explain.js', import.meta.url), 'utf8');
  const uiStripped = uiSrc.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  const names = [...new Set([...FLEX_SCHEMA, ...GRID_SCHEMA].flatMap((e) => [e.prop, e.jsProp]))];
  const hits = names.filter((n) => uiStripped.includes(`'${n}'`) || uiStripped.includes(`"${n}"`));
  check('ui/explain.js에 속성명 0건', hits.length === 0, hits.join(', ') || `${names.length}개 전부 없음`);
  check('ui/explain.js가 store를 모른다', !/from '.*store/.test(uiSrc));

  // 메인 store 를 건드리지 않는다
  const store = createStore({ flex: FLEX_SCHEMA, grid: GRID_SCHEMA });
  let notified = 0;
  store.subscribe(() => { notified += 1; });
  const before = JSON.stringify(store.getState());

  const probe = createElement('section');
  createExplain({
    schema: GRID_SCHEMA, notes: GRID_EXPLAIN_NOTES, samples: GRID_EXPLAIN_SAMPLES,
    demos: GRID_EXPLAIN_DEMOS, display: GRID_DISPLAY, root: probe, doc,
  });
  GRID_SCHEMA.forEach((e) => gridApi.select(e.prop));

  check('설명 탭을 지어도 store 통지 0', notified === 0, `${notified}회`);
  check('상태가 한 글자도 바뀌지 않는다', JSON.stringify(store.getState()) === before);
  check('innerHTML 0건', stats.innerHTML === 0, `${stats.innerHTML}회`);
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
