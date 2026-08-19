/**
 * check-measured.mjs — 렌더 측정 판정 확인 (F-13 유형 B·C)
 *
 * 세 가지를 본다.
 *
 *   판정   스키마가 가리키는 측정 키가 참·거짓으로 바뀔 때 활성·비활성이 따라가는가.
 *   무해   측정이 렌더를 다시 유발하지 않는가 (PRD 8장 리스크). 렌더 횟수를 센다.
 *   설계   속성명 분기 없이 스키마 선언만으로 판정되는가.
 *
 * jsdom 을 쓰지 않는다. 측정은 renderer 가 DOM 을 재야 하므로, 여기서는 판정
 * 경로(schema-spec)와 선언(schema)을 재고 측정 자체는 renderer 소스로 확인한다.
 *
 *   node tools/check-measured.mjs
 */

import { readFileSync } from 'node:fs';
import {
  isInactive, inactiveValues, judgeMeasured, normalizeMeasured,
  MEASURED_KEYS, validateSchema, partitionByScope,
} from '../js/core/schema-spec.js';
import { EMPTY_MEASURED, createRenderer } from '../js/core/renderer.js';
import { createStore } from '../js/core/store.js';
import { FLEX_SCHEMA } from '../js/topics/flex/schema.js';
import { GRID_SCHEMA } from '../js/topics/grid/schema.js';
import { createControl } from '../js/ui/controls.js';

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
    focus() {},
  };
  Object.defineProperty(el, 'firstChild', { get: () => el.children[0] ?? null });
  Object.defineProperty(el, 'innerHTML', { get: () => '', set: () => {} });
  return el;
}

const doc = { createElement };
const walk = (el, out = []) => { out.push(el); el.children.forEach((c) => walk(c, out)); return out; };

/** 스키마에서 측정 선언을 전부 걷는다. 속성 단위와 값 단위 둘 다. */
function declarations() {
  const out = [];
  [['flex', FLEX_SCHEMA], ['grid', GRID_SCHEMA]].forEach(([topic, schema]) => {
    schema.forEach((entry) => {
      const own = normalizeMeasured(entry.measuredInactive);
      if (own) out.push({ topic, entry, scope: '속성', val: null, rule: own });
      (entry.values ?? []).forEach((v) => {
        const rule = normalizeMeasured(v.measuredInactive);
        if (rule) out.push({ topic, entry, scope: '값', val: v.val, rule });
      });
    });
  });
  return out;
}

const DECLS = declarations();

/* ==========================================================================
   선언 — PRD 5.5 의 8건
   ========================================================================== */
section('선언');

{
  check('선언 9건 (8건 · dense가 값 두 개)', DECLS.length === 9, `${DECLS.length}건`);

  const props = [...new Set(DECLS.map((d) => `${d.topic} ${d.entry.prop}`))];
  check('대상 속성 8개', props.length === 8, props.join(' · '));

  const expected = [
    ['flex', 'flex-grow', 'hasFreeSpace'],
    ['flex', 'flex-shrink', 'canShrink'],
    ['flex', 'align-items', 'crossAuto'],
    ['grid', 'justify-content', 'hasFreeSpace'],
    ['grid', 'align-content', 'hasCrossFreeSpace'],
    ['grid', 'grid-auto-columns', 'hasImplicitColumns'],
    ['grid', 'grid-auto-rows', 'hasImplicitRows'],
    ['grid', 'grid-auto-flow', 'hasPlacementGaps'],
  ];
  const missing = expected.filter(([t, p, k]) =>
    !DECLS.some((d) => d.topic === t && d.entry.prop === p && d.rule.key === k));
  check('8건이 각각 옳은 키를 가리킨다', missing.length === 0,
    missing.map(([t, p, k]) => `${t} ${p}→${k}`).join(', ') || expected.map(([, p]) => p).join(' · '));

  check('키가 전부 renderer가 재는 것', DECLS.every((d) => d.rule.key in MEASURED_KEYS),
    [...new Set(DECLS.map((d) => d.rule.key))].join(' · '));
  check('사유가 전부 있다 (F-13-3)', DECLS.every((d) => (d.rule.reason ?? '').trim().length > 0));

  // 유형 C 두 건은 해법까지 (F-13-5)
  const typeC = DECLS.filter((d) => ['canShrink', 'crossAuto'].includes(d.rule.key));
  check('유형 C 2건에 해법이 있다 (F-13-5)',
    typeC.length === 2 && typeC.every((d) => (d.rule.hint ?? '').trim().length > 0),
    typeC.map((d) => d.entry.prop).join(' · '));
  check('flex-shrink 해법이 min-* 을 짚는다',
    /min-width|min-height/.test(typeC.find((d) => d.rule.key === 'canShrink').rule.hint));

  check('값 단위는 둘 (stretch · dense 2종)',
    DECLS.filter((d) => d.scope === '값').map((d) => d.val).join(' · ') === 'stretch · row dense · column dense');

  check('두 스키마가 검증을 통과',
    validateSchema(FLEX_SCHEMA, 'flex').length === 0 && validateSchema(GRID_SCHEMA, 'grid').length === 0);
  check('속성 수는 그대로', FLEX_SCHEMA.length === 12 && GRID_SCHEMA.length === 19,
    '선언 추가지 항목 추가가 아니다');
}

/* ==========================================================================
   판정 — 조건 충족·미충족
   ========================================================================== */
section('판정');

{
  check('아직 재지 않았으면 활성',
    DECLS.every((d) => isInactive(d.entry, {}).inactive === false),
    '첫 화면에서 멀쩡한 컨트롤이 회색으로 뜨지 않게 한다');

  // 속성 단위 — 키가 거짓이면 비활성, 참이면 활성
  const own = DECLS.filter((d) => d.scope === '속성');
  const offAll = { ...EMPTY_MEASURED };

  own.forEach((d) => {
    const off = isInactive(d.entry, { measured: { ...offAll, [d.rule.key]: false } });
    const on = isInactive(d.entry, { measured: { ...offAll, [d.rule.key]: true } });
    check(`${d.topic} ${d.entry.prop} — 조건 미충족 시 비활성`,
      off.inactive === true && off.reason === d.rule.reason, d.rule.key);
    check(`${d.topic} ${d.entry.prop} — 조건 충족 시 활성으로 돌아온다`, on.inactive === false);
  });

  // 값 단위
  const vals = DECLS.filter((d) => d.scope === '값');
  vals.forEach((d) => {
    const off = inactiveValues(d.entry, { ...offAll, [d.rule.key]: false });
    const on = inactiveValues(d.entry, { ...offAll, [d.rule.key]: true });
    check(`${d.topic} ${d.entry.prop}: ${d.val} — 조건 미충족 시 그 값만 비활성`,
      off[d.val]?.inactive === true && Object.keys(on).length === 0,
      `죽는 값 ${Object.keys(off).join(', ')}`);
    check(`${d.topic} ${d.entry.prop}: ${d.val} — 다른 값은 멀쩡하다`,
      d.entry.values.filter((v) => !off[v.val]).length === d.entry.values.length - Object.keys(off).length,
      d.entry.values.map((v) => v.val).filter((v) => !off[v]).join(' · '));
    check(`${d.topic} ${d.entry.prop} — 속성 자체는 죽지 않는다`,
      isInactive(d.entry, { measured: { ...offAll, [d.rule.key]: false } }).inactive === false);
  });

  check('모르는 키는 활성으로 둔다',
    judgeMeasured({ key: '없는키', reason: 'r' }, EMPTY_MEASURED).inactive === false);
  check('유형 A는 measured와 무관하게 그대로',
    isInactive(FLEX_SCHEMA.find((e) => e.prop === 'align-content'),
      { container: { flexWrap: 'nowrap' }, measured: EMPTY_MEASURED }).inactive === true);
}

/* ==========================================================================
   컨트롤 연결
   ========================================================================== */
section('컨트롤 연결');

{
  const entry = FLEX_SCHEMA.find((e) => e.prop === 'align-items');
  const { root, setInactive, setValueInactive } = createControl(entry, { value: 'stretch', doc });

  check('enum 컨트롤이 값 단위 표시를 받는다', typeof setValueInactive === 'function');

  const options = walk(root).filter((n) => n.getAttribute('data-value'));
  setValueInactive(inactiveValues(entry, { ...EMPTY_MEASURED, crossAuto: false }));

  const dead = options.filter((o) => o.getAttribute('data-inactive') === 'true');
  check('죽은 값만 표시된다', dead.length === 1 && dead[0].getAttribute('data-value') === 'stretch',
    dead.map((o) => o.getAttribute('data-value')).join(', '));
  check('죽은 값에 사유가 실린다', /늘어날 여지/.test(dead[0].getAttribute('title')));
  check('죽은 값도 disabled 는 아니다', dead[0].disabled !== true, 'F-13-2 — 눌러 볼 수 있어야 한다');

  setValueInactive(inactiveValues(entry, { ...EMPTY_MEASURED, crossAuto: true }));
  check('조건이 풀리면 표시가 걷힌다',
    options.every((o) => o.getAttribute('data-inactive') === 'false'));

  // 속성 단위 표시는 기존 경로 그대로
  const grow = FLEX_SCHEMA.find((e) => e.prop === 'flex-grow');
  const built = createControl(grow, { value: 0, doc });
  built.setInactive(isInactive(grow, { measured: { ...EMPTY_MEASURED, hasFreeSpace: false } }));
  check('속성 단위는 aria-disabled 로', built.root.getAttribute('aria-disabled') === 'true');
  built.setInactive(isInactive(grow, { measured: { ...EMPTY_MEASURED, hasFreeSpace: true } }));
  check('풀리면 되돌아온다', built.root.getAttribute('aria-disabled') === 'false');
}

/* ==========================================================================
   무해 — 측정이 렌더를 다시 유발하지 않는다 (PRD 8장 리스크)
   ========================================================================== */
section('무한 루프 방지');

{
  const store = createStore({ flex: FLEX_SCHEMA, grid: GRID_SCHEMA });
  const root = createElement('div');

  let renders = 0;
  const renderer = createRenderer({ store, schemas: { flex: FLEX_SCHEMA, grid: GRID_SCHEMA }, root, doc });
  const wrapped = renderer.render;
  // 렌더 횟수를 세기 위해 store 통지를 직접 잡는다
  let notified = 0;
  store.subscribe(() => { notified += 1; });

  const before = notified;
  let measures = 0;
  renderer.onMeasure(() => { measures += 1; });
  const afterSubscribe = notified;

  check('구독만으로 상태가 흔들리지 않는다', afterSubscribe === before, `${afterSubscribe - before}회`);
  check('등록 즉시 지금 값으로 한 번 부른다', measures === 1);

  for (let i = 0; i < 30; i += 1) renderer.remeasure();
  check('30회 다시 재도 store 통지 0', notified === afterSubscribe, `${notified - afterSubscribe}회`);
  check('통지는 잰 횟수만큼만', measures === 31, `${measures}회`);

  const stateBefore = JSON.stringify(store.getState());
  renderer.remeasure();
  check('상태가 한 글자도 바뀌지 않는다', JSON.stringify(store.getState()) === stateBefore);

  const rendererSrc = codeOnly(read('../js/core/renderer.js'));
  check('renderer가 dispatch·setView를 부르지 않는다', !/dispatch\(|setView\(/.test(rendererSrc));
  check('measured를 store에 넣지 않는다', !/store\.[a-z]*measured/i.test(rendererSrc));

  const mainSrc = codeOnly(read('../js/main.js'));
  const applyStart = mainSrc.indexOf('function applyMeasured');
  const applyBlock = mainSrc.slice(applyStart, mainSrc.indexOf('\n}', applyStart) + 2);
  check('applyMeasured 안에 dispatch가 없다', !/dispatch\(|setView\(/.test(applyBlock),
    '여기서 상태를 건드리면 그대로 무한 루프다');
  check('측정 구독이 store 구독과 별개 경로', /renderer\.onMeasure\(/.test(mainSrc));

  check('EMPTY_MEASURED가 모든 키를 갖는다',
    Object.keys(MEASURED_KEYS).every((k) => k in EMPTY_MEASURED),
    `${Object.keys(EMPTY_MEASURED).length}개`);
  void wrapped; void renders;
}

/* ==========================================================================
   속성명 하드코딩 0건 (주의 2)
   ========================================================================== */
section('하드코딩');

{
  const NAMES = [...new Set([...FLEX_SCHEMA, ...GRID_SCHEMA].flatMap((e) => [e.prop, e.jsProp]))];
  const quoted = (src, v) => src.includes(`'${v}'`) || src.includes(`"${v}"`);

  /**
   * DISPLAY_BY_TOPIC 표는 뺀다. 거기 적힌 'flex' 는 속성 이름이 아니라 display 값이고,
   * 스키마의 flex 단축 속성과 글자만 같다. renderer 와 codegen 이 공유하는 표다.
   */
  const stripDisplayTable = (src) => src
    .replace(/DISPLAY_BY_TOPIC[\s\S]*?\};/, ' ')
    .replace(/DEFAULT_DISPLAY[^;]*;/, ' ');

  [['js/core/renderer.js', '../js/core/renderer.js'],
   ['js/core/schema-spec.js', '../js/core/schema-spec.js'],
   ['js/ui/controls.js', '../js/ui/controls.js'],
   ['js/main.js', '../js/main.js']].forEach(([label, rel]) => {
    const src = stripDisplayTable(codeOnly(read(rel)));
    const hits = NAMES.filter((n) => quoted(src, n));
    check(`${label}에 속성명 0건`, hits.length === 0, hits.join(', ') || `${NAMES.length}개 전부 없음`);
  });

  const specSrc = codeOnly(read('../js/core/schema-spec.js'));
  check('판정이 키 이름만 본다', /rule\.key/.test(specSrc) && !/=== 'hasFreeSpace'/.test(specSrc));

  const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g;
  ['../js/core/renderer.js', '../js/ui/controls.js', '../css/components.css', '../js/main.js']
    .forEach((rel) => {
      const hits = read(rel).match(COLOR) ?? [];
      check(`${rel.replace('../', '')} 색상 0건`, hits.length === 0, hits.join(', ') || '0건');
    });
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
