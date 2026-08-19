/**
 * check-challenges.mjs — 챌린지 확인 (F-09 · F-10 / PRD 7.1 회귀 대상)
 *
 * 가장 중요한 것은 target 키 대조다. 키에 오타가 있으면 사용자가 정답을 맞혀도
 * 영원히 통과하지 못하고, 화면에는 아무 단서도 남지 않는다. 스키마와 직접
 * 맞춰 본다.
 *
 * 다음은 ignore 다. ignore 가 실제로 무시되는지 확인하지 않으면 "정중앙 배치"가
 * gap 때문에 오답이 되는 일이 생긴다.
 *
 * jsdom 을 쓰지 않는다. store.js 는 순수 JS 라 진짜를 그대로 쓴다.
 *
 *   node tools/check-challenges.mjs
 */

import { readFileSync } from 'node:fs';
import { FLEX_CHALLENGES } from '../js/topics/flex/challenges.js';
import { FLEX_SCHEMA } from '../js/topics/flex/schema.js';
import { GRID_SCHEMA } from '../js/topics/grid/schema.js';
import { createStore } from '../js/core/store.js';
import { partitionByScope, defaultsFrom, CONTROL_TYPES } from '../js/core/schema-spec.js';
import {
  createChallenge, checkAnswer, normalizeValue, stretchesItems,
  readProgress, writeProgress, STORAGE_KEY,
  wrapsLines, itemWidthFor,
  LIST_ITEM_CLASS, TAG_CLASS, GOAL_CLASS, GOAL_ITEM_CLASS, PREVIEW_CLASS,
  HINT_CLASS, RESULT_CLASS, PROGRESS_CLASS, MATCH_CLASS, MISMATCH_CLASS, SOLVED_CLASS,
} from '../js/ui/challenge.js';

let failed = 0;

function check(label, ok, detail = '') {
  console.log(`  [${ok ? 'OK  ' : 'FAIL'}] ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g;

const codeOnly = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/^\s*\/\/.*$/gm, ' ');

const PROPS = new Map(FLEX_SCHEMA.map((e) => [e.jsProp, e]));

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
    disabled: false,
    value: '',
    attrs: {},
    listeners,
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

  Object.defineProperty(el, 'innerHTML', { get: () => '', set: () => { stats.innerHTML++; } });
  return el;
}

const doc = { createElement };

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

/** 진짜 localStorage 대신 쓸 것. 깨지는 흉내도 낼 수 있다. */
function fakeStorage(initial = {}, mode = 'ok') {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem(k) { if (mode === 'read-throws') throw new Error('보안 정책'); return map.get(k) ?? null; },
    setItem(k, v) { if (mode === 'write-throws') throw new Error('용량 초과'); map.set(k, v); },
  };
}

function build({ storage = fakeStorage(), store = createStore({ flex: FLEX_SCHEMA }) } = {}) {
  const root = createElement('section');
  const api = createChallenge({
    challenges: FLEX_CHALLENGES, schema: FLEX_SCHEMA, store, root, storage, doc,
  });
  return { root, api, store, storage };
}

/* ==========================================================================
   데이터
   ========================================================================== */
section('데이터');

const REQUIRED = ['id', 'title', 'difficulty', 'desc', 'hint', 'target', 'ignore', 'itemCount', 'accents', 'miniStyle'];

{
  check('챌린지 40건', FLEX_CHALLENGES.length === 40, `${FLEX_CHALLENGES.length}건`);
  check('id가 1부터 빠짐없이 이어짐',
    FLEX_CHALLENGES.every((c, i) => c.id === i + 1),
    `1~${FLEX_CHALLENGES[FLEX_CHALLENGES.length - 1].id}`);
  check('id 유일', new Set(FLEX_CHALLENGES.map((c) => c.id)).size === FLEX_CHALLENGES.length);

  const byDiff = FLEX_CHALLENGES.reduce((map, c) => map.set(c.difficulty, (map.get(c.difficulty) ?? 0) + 1), new Map());
  check('난이도가 셋으로 나뉨', byDiff.size === 3,
    [...byDiff].map(([d, n]) => `${d} ${n}건`).join(' · '));

  const missing = [];
  FLEX_CHALLENGES.forEach((ch) => {
    REQUIRED.forEach((key) => {
      const v = ch[key];
      if (v === undefined || v === null || v === '') missing.push(`#${ch.id}.${key}`);
    });
  });
  check('필수 필드 전량 보유', missing.length === 0, missing.join(', ') || REQUIRED.join(' · '));

  check('itemCount는 1 이상 정수',
    FLEX_CHALLENGES.every((c) => Number.isInteger(c.itemCount) && c.itemCount >= 1));
  check('accents 길이가 itemCount와 같음',
    FLEX_CHALLENGES.every((c) => c.accents.length === c.itemCount),
    FLEX_CHALLENGES.map((c) => `${c.accents.length}/${c.itemCount}`).join(' '));
  check('accents는 1~8 정수',
    FLEX_CHALLENGES.every((c) => c.accents.every((n) => Number.isInteger(n) && n >= 1 && n <= 8)));
  check('colors 필드 없음', FLEX_CHALLENGES.every((c) => !('colors' in c)),
    '색은 데이터가 아니라 components.css가 정한다');
}

/* ==========================================================================
   target · ignore — 스키마 대조

   여기가 이 게이트의 존재 이유다. 키 오타는 화면에 아무 단서도 남기지 않는다.
   ========================================================================== */
section('스키마 대조');

{
  const badKey = [];
  const badValue = [];
  const badIgnore = [];
  const notContainer = [];

  FLEX_CHALLENGES.forEach((ch) => {
    Object.entries(ch.target).forEach(([key, value]) => {
      const entry = PROPS.get(key);
      if (!entry) { badKey.push(`#${ch.id}.${key}`); return; }
      if (entry.scope !== 'container') notContainer.push(`#${ch.id}.${key}`);
      if (entry.values && !entry.values.some((v) => v.val === value)) badValue.push(`#${ch.id}.${key}=${value}`);
    });

    (ch.ignore ?? []).forEach((key) => {
      if (!PROPS.has(key)) badIgnore.push(`#${ch.id}.${key}`);
    });
  });

  check('target 키가 전부 스키마 jsProp', badKey.length === 0, badKey.join(', ') || '오타 0건');
  check('target 값이 전부 스키마 values에 있음', badValue.length === 0, badValue.join(', ') || '이상 0건');
  check('target 키가 전부 container scope', notContainer.length === 0, notContainer.join(', ') || '전량 container');
  check('ignore 키도 전부 스키마 jsProp', badIgnore.length === 0, badIgnore.join(', ') || '오타 0건');

  // 일부러 망가뜨려 검증이 실제로 잡는지
  const broken = { justifyContnet: 'center', justifyContent: '없는값' };
  check('키 오타를 실제로 잡는다', !PROPS.has('justifyContnet'));
  check('값 오류를 실제로 잡는다',
    !PROPS.get('justifyContent').values.some((v) => v.val === broken.justifyContent));

  check('target과 ignore가 겹치지 않음',
    FLEX_CHALLENGES.every((c) => (c.ignore ?? []).every((k) => !(k in c.target))),
    '겹치면 그 속성은 물어놓고 채점하지 않는 셈이다');
}

/* ==========================================================================
   채점 — ignore 를 실제로 무시하는가
   ========================================================================== */
section('채점');

{
  const defaults = defaultsFrom(FLEX_SCHEMA, 'container');

  FLEX_CHALLENGES.forEach((ch) => {
    const answer = { ...defaults, ...ch.target };
    const verdict = checkAnswer(ch, answer, FLEX_SCHEMA);
    check(`#${ch.id} — 정답이 통과`, verdict.solved && verdict.correct === verdict.total,
      `${verdict.correct}/${verdict.total}`);
  });

  // ignore 속성을 아무 값으로 바꿔도 결과가 같아야 한다
  const ignoreProof = FLEX_CHALLENGES.map((ch) => {
    const answer = { ...defaults, ...ch.target };
    const messed = { ...answer };
    (ch.ignore ?? []).forEach((key) => {
      const entry = PROPS.get(key);
      const other = entry.values?.find((v) => v.val !== answer[key])?.val ?? '999px';
      messed[key] = other;
    });
    return checkAnswer(ch, messed, FLEX_SCHEMA).solved;
  });
  check('ignore 속성을 틀리게 해도 통과', ignoreProof.every(Boolean),
    `${ignoreProof.filter(Boolean).length}/${FLEX_CHALLENGES.length}건`);

  // ignore 속성이 채점 목록에 들어가지 않는다
  const leaked = FLEX_CHALLENGES.flatMap((ch) =>
    checkAnswer(ch, defaults, FLEX_SCHEMA).results.map((r) => r.key).filter((k) => (ch.ignore ?? []).includes(k)));
  check('채점 목록에 ignore 키가 없음', leaked.length === 0, leaked.join(', ') || '누출 0건');

  // 채점 대상 하나만 틀려도 오답
  const strict = FLEX_CHALLENGES.map((ch) => {
    const answer = { ...defaults, ...ch.target };
    const key = Object.keys(ch.target).find((k) => !(ch.ignore ?? []).includes(k));
    const entry = PROPS.get(key);
    answer[key] = entry.values.find((v) => v.val !== ch.target[key]).val;
    const verdict = checkAnswer(ch, answer, FLEX_SCHEMA);
    return !verdict.solved && verdict.correct === verdict.total - 1;
  });
  check('채점 대상 하나가 틀리면 오답', strict.every(Boolean));

  check('빈 답안은 전부 통과하지 않음',
    FLEX_CHALLENGES.filter((ch) => checkAnswer(ch, {}, FLEX_SCHEMA).solved).length === 0);
}

/* ==========================================================================
   정규화 채점 — 값을 컨트롤 타입의 정규형으로 옮겨 놓고 비교한다

   원시값 === 은 두 곳에서 깨진다. track-list 는 객체 배열이라 참조 비교가 되어
   값이 같아도 늘 실패하고, areas 는 한 줄 표기와 줄바꿈 표기가 갈린다.
   Flex 40 건은 전부 enum 문자열이라 정규형이 곧 원래 값이어야 한다.
   ========================================================================== */
section('정규화 채점 — Flex 회귀');

{
  const defaults = defaultsFrom(FLEX_SCHEMA, 'container');

  /** 바뀌기 전 판정. 원시값을 그대로 === 한다. */
  const before = (ch, container) => {
    const ignore = new Set(ch.ignore ?? []);
    const rows = Object.entries(ch.target)
      .filter(([key]) => !ignore.has(key))
      .map(([key, expected]) => container[key] === expected);
    return rows.length > 0 && rows.every(Boolean);
  };

  const CASES = [
    ['정답', (ch) => ({ ...defaults, ...ch.target })],
    ['기본값', () => ({ ...defaults })],
    ['빈 답안', () => ({})],
  ];

  CASES.forEach(([label, make]) => {
    const diff = FLEX_CHALLENGES.filter((ch) => {
      const c = make(ch);
      return before(ch, c) !== checkAnswer(ch, c, FLEX_SCHEMA).solved;
    });
    check(`${label} — 40건 전부 이전과 같은 판정`, diff.length === 0,
      diff.map((c) => `#${c.id}`).join(', ') || `${FLEX_CHALLENGES.length}건 일치`);
  });

  // 개별 결과까지 같아야 한다. solved 만 같고 correct 가 어긋나면 태그 표시가 달라진다
  const rowDiff = FLEX_CHALLENGES.filter((ch) => {
    const c = { ...defaults, ...ch.target };
    const v = checkAnswer(ch, c, FLEX_SCHEMA);
    return v.results.some((r) => r.ok !== (c[r.key] === ch.target[r.key]));
  });
  check('키별 결과도 이전과 같음', rowDiff.length === 0, `${FLEX_CHALLENGES.length}건`);

  // enum 값은 정규형이 원래 값 그대로여야 한다
  const moved = FLEX_CHALLENGES.flatMap((ch) => Object.entries(ch.target)
    .filter(([key, v]) => normalizeValue(PROPS.get(key), v) !== v)
    .map(([key, v]) => `#${ch.id}.${key}=${v}`));
  check('enum 정답값이 정규화로 움직이지 않음', moved.length === 0,
    moved.join(', ') || `${FLEX_CHALLENGES.reduce((n, c) => n + Object.keys(c.target).length, 0)}개 값 그대로`);

  // 스키마를 안 넘긴 옛 호출도 enum 에서는 예전과 같아야 한다
  const noSchema = FLEX_CHALLENGES.every((ch) => {
    const c = { ...defaults, ...ch.target };
    return checkAnswer(ch, c).solved === checkAnswer(ch, c, FLEX_SCHEMA).solved;
  });
  check('스키마 없이 부른 옛 호출도 같은 결과', noSchema, '문자열 비교로 떨어진다');
}

/* --------------------------------------------------------------------------
   Grid 값 타입 — 아직 데이터는 없지만 판정은 지금 서 있어야 한다
   -------------------------------------------------------------------------- */
section('정규화 채점 — Grid 값 타입');

{
  const state = {
    ...defaultsFrom(GRID_SCHEMA, 'container'),
    gridTemplateColumns: [{ size: 200, unit: 'px' }, { size: 1, unit: 'fr' }],
    gridTemplateAreas: '"hd hd"\n"sd mn"',
  };
  const judge = (target) => checkAnswer({ target }, state, GRID_SCHEMA).solved;

  check('track-list — 배열로 적어도 통과',
    judge({ gridTemplateColumns: [{ size: 200, unit: 'px' }, { size: 1, unit: 'fr' }] }),
    '참조가 달라도 값이 같으면 통과');
  check('track-list — CSS 문자열로 적어도 통과', judge({ gridTemplateColumns: '200px 1fr' }));
  check('track-list — 값이 다르면 실패', !judge({ gridTemplateColumns: '1fr 1fr' }));
  check('track-list — 순서가 다르면 실패', !judge({ gridTemplateColumns: '1fr 200px' }));

  check('areas — 한 줄 표기로 적어도 통과', judge({ gridTemplateAreas: '"hd hd" "sd mn"' }));
  check('areas — 줄바꿈 표기도 통과', judge({ gridTemplateAreas: '"hd hd"\n"sd mn"' }));
  check('areas — 여분 공백도 통과', judge({ gridTemplateAreas: '  "hd  hd"   "sd mn" ' }));
  check('areas — 따옴표 없이 적어도 통과', judge({ gridTemplateAreas: 'hd hd\nsd mn' }));
  check('areas — 판이 다르면 실패', !judge({ gridTemplateAreas: '"hd hd" ". mn"' }));

  check('length — 같은 문자열은 통과', judge({ rowGap: '12px' }));
  check('length — 단위가 다르면 실패', !judge({ rowGap: '0.75rem' }),
    '12px 과 0.75rem 은 루트 글꼴이 16px 일 때만 같다. 계산하지 않는다');

  check('enum — 그대로 동작', judge({ alignItems: 'stretch' }) && !judge({ alignItems: 'center' }));

  // 여러 키를 함께 물어도 하나만 어긋나면 오답
  const many = { gridTemplateColumns: '200px 1fr', gridTemplateAreas: '"hd hd" "sd mn"', alignItems: 'stretch' };
  check('여러 키를 함께 물어도 동작', judge(many));
  check('그중 하나만 어긋나도 오답', !judge({ ...many, alignItems: 'center' }));
}

/* --------------------------------------------------------------------------
   태그 표시 — 배열을 그대로 찍으면 [object Object] 가 나온다
   -------------------------------------------------------------------------- */
section('태그 표시');

{
  const entry = GRID_SCHEMA.find((e) => e.jsProp === 'gridTemplateColumns');
  const areas = GRID_SCHEMA.find((e) => e.jsProp === 'gridTemplateAreas');

  check('track-list 배열이 CSS 글자로 나온다',
    normalizeValue(entry, [{ size: 1, unit: 'fr' }, { size: 200, unit: 'px' }]) === '1fr 200px',
    normalizeValue(entry, [{ size: 1, unit: 'fr' }, { size: 200, unit: 'px' }]));
  check('스키마 기본값도 글자로 나온다',
    normalizeValue(entry, entry.default) === '1fr 1fr 1fr', normalizeValue(entry, entry.default));
  check('[object Object] 가 나오지 않는다',
    !normalizeValue(entry, entry.default).includes('[object'),
    `고치기 전: ${String(entry.default)}`);
  check('areas 도 한 가지 꼴로 나온다',
    normalizeValue(areas, '"hd hd" "sd mn"') === '"hd hd"\n"sd mn"');
  check('none 도 키워드 그대로', normalizeValue(areas, 'none') === 'none');

  // 실제 태그 문자열을 만드는 자리가 같은 함수를 쓰는지
  const src = codeOnly(read('../js/ui/challenge.js'));
  check('태그가 normalizeValue 를 거친다', /tag\.textContent\s*=[^;]*normalizeValue\(/.test(src));
  check('채점도 같은 함수를 쓴다', /normalizeValue\(entry, expected\)/.test(src));
  check('속성 이름 분기가 없다', !/if\s*\(\s*(key|prop|jsProp)\s*===\s*['"]/.test(src));
}

/* --------------------------------------------------------------------------
   target 무손실 — 파서가 조용히 다른 값으로 바꾸지 않는가

   parseTrackList 는 아는 형태가 아닌 토큰을 조용히 {size:1, unit:'fr'} 로
   떨어뜨린다. repeat(3, 1fr) 을 적으면 오류 없이 1fr 한 칸이 된다. 파서에서
   던지게 만들면 트랙 편집기가 글자를 치는 도중마다 터지므로, 데이터를 받는
   이 자리에서 잡는다.

   규칙: 문자열로 적은 target 값은 파서를 지나도 (공백을 빼면) 그대로여야 한다.
   -------------------------------------------------------------------------- */
section('target 무손실');

{
  const flat = (v) => String(v).replace(/\s+/g, ' ').trim();
  const lossless = (entry, value) => typeof value !== 'string'
    || flat(normalizeValue(entry, value)) === flat(value);

  const lost = FLEX_CHALLENGES.flatMap((ch) => Object.entries(ch.target)
    .filter(([key, v]) => !lossless(PROPS.get(key), v))
    .map(([key, v]) => `#${ch.id}.${key}=${v} → ${normalizeValue(PROPS.get(key), v)}`));
  check('Flex 40건 target 이 전부 무손실', lost.length === 0, lost.join(', ') || '손실 0건');

  const track = GRID_SCHEMA.find((e) => e.jsProp === 'gridTemplateColumns');

  check('repeat() 를 잡는다', !lossless(track, 'repeat(3, 1fr)'),
    `repeat(3, 1fr) → ${normalizeValue(track, 'repeat(3, 1fr)')} — 펼쳐 적을 것`);
  check('공백 없는 repeat() 도 잡는다', !lossless(track, 'repeat(3,1fr)'));
  check('모르는 토큰을 잡는다', !lossless(track, 'garbage'),
    `garbage → ${normalizeValue(track, 'garbage')}`);
  check('단위 없는 숫자를 잡는다', !lossless(track, '3'),
    `3 → ${normalizeValue(track, '3')}`);

  check('펼쳐 적은 값은 통과', lossless(track, '1fr 1fr 1fr') && lossless(track, '200px 1fr'));
  check('minmax 는 통과', lossless(track, 'minmax(120px, 1fr)'));
  check('키워드 트랙도 통과', lossless(track, 'auto') && lossless(track, 'min-content'));
  check('배열은 검사 대상이 아님', lossless(track, [{ size: 1, unit: 'fr' }]),
    '배열은 이미 정규형이다');

  // areas 는 표기 차이를 흡수하므로 한 줄로 적어도 무손실이어야 한다
  const areas = GRID_SCHEMA.find((e) => e.jsProp === 'gridTemplateAreas');
  check('areas 한 줄 표기는 무손실', lossless(areas, '"hd hd" "sd mn"'));
  // 판 모양이 틀린 것은 손실이 아니라 오류다. 계약이 errors 로 따로 답한다
  const areaErrors = (v) => CONTROL_TYPES['area-grid'].parse(v).errors;
  check('areas 셀 수가 어긋나면 계약이 오류를 낸다', areaErrors('"hd hd" "sd"').length > 0,
    areaErrors('"hd hd" "sd"').join(' / '));
  check('areas 이름이 직사각형이 아니면 오류를 낸다', areaErrors('"a b" "b a"').length > 0,
    areaErrors('"a b" "b a"').join(' / '));
  check('멀쩡한 판은 오류 0건', areaErrors('"hd hd" "sd mn"').length === 0);

  // 모든 컨트롤 타입이 serialize(parse(x)) 를 받는가 — area-grid 가 예외였다
  const shapes = Object.entries(CONTROL_TYPES).map(([name, spec]) => {
    try { spec.serialize(spec.parse(name === 'number' ? '3' : 'auto')); return null; } catch { return name; }
  }).filter(Boolean);
  check('컨트롤 8종 전부 serialize(parse(x)) 가 물린다', shapes.length === 0,
    shapes.join(', ') || Object.keys(CONTROL_TYPES).join(' · '));
}

/* --------------------------------------------------------------------------
   아이템 크기 판정 — 답이 아이템을 늘리는가

   크기가 박힌 아이템에는 stretch 가 먹지 않는다. 그런 문제는 크기를 풀어
   주어야 하고, 그 판정을 속성 이름 없이 세운 것이 stretchesItems 다.
   -------------------------------------------------------------------------- */
section('아이템 크기 판정');

{
  const probe = (target, schema) => stretchesItems(target, schema, doc);

  check('Grid — align-items: stretch 를 잡는다', probe({ alignItems: 'stretch' }, GRID_SCHEMA));
  check('Grid — justify-items: stretch 도 잡는다', probe({ justifyItems: 'stretch' }, GRID_SCHEMA));
  check('Grid — start·center 는 잡지 않는다',
    !probe({ alignItems: 'start', justifyItems: 'center' }, GRID_SCHEMA));
  check('Grid — 트랙 정의는 잡지 않는다',
    !probe({ gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto' }, GRID_SCHEMA));
  check('Grid — 배열 값에도 터지지 않는다',
    !probe({ gridTemplateColumns: [{ size: 1, unit: 'fr' }] }, GRID_SCHEMA));
  check('Grid — 여럿 중 하나만 stretch 여도 잡는다',
    probe({ gridTemplateColumns: '1fr 1fr', alignItems: 'stretch' }, GRID_SCHEMA));

  check('Flex — align-items: stretch 를 잡는다', probe({ alignItems: 'stretch' }, FLEX_SCHEMA));
  const flexHits = FLEX_CHALLENGES.filter((ch) => probe(ch.target, FLEX_SCHEMA));
  check('Flex 40건 중 걸리는 문제를 센다', flexHits.length > 0,
    `${flexHits.length}건 — ${flexHits.map((c) => `#${c.id}`).join(' ')}`);

  check('빈 target·document 없음을 막지 않고 false 를 낸다',
    !probe({}, GRID_SCHEMA) && !stretchesItems({ alignItems: 'stretch' }, GRID_SCHEMA, null));

  const src = codeOnly(read('../js/ui/challenge.js'));
  check('판정에 속성 이름이 적혀 있지 않다',
    !/(alignItems|justifyItems|align-items|justify-items)/.test(src),
    '데이터가 준 키를 그대로 쓴다');

  // 아직 배선하지 않았다는 사실을 사실대로 확인한다
  check('itemsFor 가 이 판정을 쓴다', /stretchesItems\(/.test(src.split('export function stretchesItems')[1] ?? ''),
    'renderer 가 유한한 수일 때만 크기를 얹으므로 크기 키를 빼면 auto 가 된다');
}

/* --------------------------------------------------------------------------
   ignore — 지금 아무 일도 하지 않는다는 사실을 못 박는다
   -------------------------------------------------------------------------- */
section('ignore');

{
  const effective = FLEX_CHALLENGES.flatMap((ch) =>
    (ch.ignore ?? []).filter((key) => key in ch.target).map((key) => `#${ch.id}.${key}`));
  check('Flex 40건의 ignore 가 실제로 거르는 항목 0건', effective.length === 0,
    effective.join(', ') || 'target 에 없는 키만 담고 있다');

  check('ignore 가 무효라는 사실이 주석에 남아 있다',
    /아무 일도[\s\S]{0,20}하지 않는다/.test(read('../js/ui/challenge.js')),
    '새 데이터에 넣지 않는다는 것까지 적어 둔다');
  check('새 데이터 방침도 적혀 있다',
    /새로 쓰는 데이터에는 넣지 않는다/.test(read('../js/ui/challenge.js')));

  // 그래도 장치 자체는 살아 있어야 한다 — target 에 있는 키는 실제로 빠진다
  const ch = { target: { alignItems: 'center', justifyContent: 'center' }, ignore: ['alignItems'] };
  const v = checkAnswer(ch, { alignItems: 'start', justifyContent: 'center' }, FLEX_SCHEMA);
  check('target 에 있는 키를 ignore 하면 실제로 빠진다', v.solved && v.total === 1, `${v.correct}/${v.total}`);
}

/* ==========================================================================
   저장 — 실패해도 죽지 않는다
   ========================================================================== */
section('저장');

{
  const ids = FLEX_CHALLENGES.map((c) => c.id);

  check('빈 저장소는 빈 목록', readProgress(fakeStorage(), ids).length === 0);
  check('정상 값을 읽는다',
    JSON.stringify(readProgress(fakeStorage({ [STORAGE_KEY]: '{"solved":[1,3]}' }), ids)) === '[1,3]');

  const corrupt = [
    ['JSON이 아님', '}{not json'],
    ['빈 문자열', ''],
    ['배열도 객체도 아님', '42'],
    ['solved가 배열이 아님', '{"solved":"1,2"}'],
    ['solved가 없음', '{"other":[1]}'],
    ['null', 'null'],
  ];
  corrupt.forEach(([label, raw]) => {
    let out = null;
    let threw = false;
    try { out = readProgress(fakeStorage({ [STORAGE_KEY]: raw }), ids); } catch { threw = true; }
    check(`손상 복구 — ${label}`, !threw && Array.isArray(out) && out.length === 0);
  });

  check('없는 id는 걸러진다',
    JSON.stringify(readProgress(fakeStorage({ [STORAGE_KEY]: '{"solved":[1,99,"3",7]}' }), ids)) === '[1,7]',
    '99와 문자열 "3"은 버린다');
  check('중복 id는 한 번만',
    readProgress(fakeStorage({ [STORAGE_KEY]: '{"solved":[2,2,2]}' }), ids).length === 1);
  check('맨 배열 형태도 읽는다',
    JSON.stringify(readProgress(fakeStorage({ [STORAGE_KEY]: '[4,5]' }), ids)) === '[4,5]');

  let threw = false;
  let out = null;
  try { out = readProgress(fakeStorage({}, 'read-throws'), ids); } catch { threw = true; }
  check('읽기가 막혀 있어도 죽지 않음', !threw && Array.isArray(out) && out.length === 0);

  threw = false;
  let ok = null;
  try { ok = writeProgress(fakeStorage({}, 'write-throws'), new Set([1])); } catch { threw = true; }
  check('쓰기가 막혀 있어도 죽지 않음', !threw && ok === false);

  check('저장소가 아예 없어도 죽지 않음',
    readProgress(undefined, ids).length === 0 && writeProgress(undefined, new Set([1])) === false,
    '못 남겼으면 false를 돌려준다');
}

/* ==========================================================================
   화면
   ========================================================================== */
section('화면');

{
  const { root, api, store } = build();

  check(`문제 목록 ${FLEX_CHALLENGES.length}개`,
    byClass(root, LIST_ITEM_CLASS).length === FLEX_CHALLENGES.length);
  check('처음에는 1번', api.selected().id === 1);
  check('목표 미리보기 있음', byClass(root, GOAL_CLASS).length === 1);
  check('목표 아이템이 itemCount만큼',
    byClass(root, GOAL_ITEM_CLASS).length === FLEX_CHALLENGES[0].itemCount);
  check('답안 프리뷰 마운트 지점', byClass(root, PREVIEW_CLASS).length === 1 && Boolean(api.previewRoot));
  check('innerHTML 0건', stats.innerHTML === 0, `${stats.innerHTML}회`);

  // 컨트롤은 스키마의 container 전량이다 — 물어본 것만 세우면 답이 드러난다
  const entries = partitionByScope(FLEX_SCHEMA).container;
  const labels = walk(root).filter((el) => el.className.includes('fgp-control__prop'));
  check('컨트롤이 container scope 전량', labels.length === entries.length,
    `${labels.length}개 · 스키마 ${entries.length}개`);
  check('물어본 속성보다 컨트롤이 많다',
    entries.length > Object.keys(FLEX_CHALLENGES[0].target).length,
    `컨트롤 ${entries.length} · 물음 ${Object.keys(FLEX_CHALLENGES[0].target).length}`);

  const tags = byClass(root, TAG_CLASS);
  const asked = Object.keys(FLEX_CHALLENGES[0].target).filter((k) => !FLEX_CHALLENGES[0].ignore.includes(k));
  check('태그는 채점 대상만', tags.length === asked.length, `${tags.length}개`);
  check('태그 이름은 스키마의 CSS 속성명',
    tags.every((t) => t.textContent.startsWith(`${PROPS.get(t.getAttribute('data-target-key')).prop}: `)),
    tags.map((t) => t.textContent).join(' · '));

  // 문제를 열면 답안이 기본값으로 돌아온다
  store.dispatch({ container: { justifyContent: 'center' } });
  api.select(2);
  check('문제를 바꾸면 답안이 초기화',
    store.getState().container.justifyContent === defaultsFrom(FLEX_SCHEMA, 'container').justifyContent);
  check('아이템 개수가 문제를 따라간다',
    store.getState().items.length === FLEX_CHALLENGES[1].itemCount,
    `${store.getState().items.length}개`);

  api.select(1);
  const nav = root.children[0];
  const buttons = byClass(nav, LIST_ITEM_CLASS);
  fire(buttons[3], 'click', { target: buttons[3] });
  check('목록 클릭이 먹는다', api.selected().id === 4);
  fire(buttons[3], 'keydown', { key: 'ArrowDown', target: buttons[3] });
  check('화살표로 다음 문제', api.selected().id === 5);
  api.select(1);
  fire(buttons[0], 'keydown', { key: 'ArrowUp', target: buttons[0] });
  check('처음에서 위로 가면 끝으로 돈다',
    api.selected().id === FLEX_CHALLENGES[FLEX_CHALLENGES.length - 1].id,
    `#${api.selected().id}`);
}

/* ==========================================================================
   풀이
   ========================================================================== */
section('풀이');

{
  const storage = fakeStorage();
  const { root, api, store } = build({ storage });

  const hint = byClass(root, HINT_CLASS)[0];
  const result = byClass(root, RESULT_CLASS)[0];
  const progress = byClass(root, PROGRESS_CLASS)[0];
  const work = root.children[1];
  const actionOf = (name) => walk(work).find((el) => el.getAttribute('data-challenge-action') === name);

  const total = FLEX_CHALLENGES.length;
  check('진행 표시가 0부터', progress.textContent === `0/${total} 클리어`, progress.textContent);
  check('힌트는 처음에 감춰져 있음', hint.hidden === true);

  fire(actionOf('hint'), 'click', { target: actionOf('hint') });
  check('힌트 버튼이 연다', hint.hidden === false && hint.textContent === FLEX_CHALLENGES[0].hint);
  fire(actionOf('hint'), 'click', { target: actionOf('hint') });
  check('한 번 더 누르면 닫힌다', hint.hidden === true);

  // 틀린 답 제출
  fire(actionOf('submit'), 'click', { target: actionOf('submit') });
  check('틀리면 클리어로 세지 않음', api.solved().length === 0);
  check('틀린 태그에 표시',
    byClass(root, TAG_CLASS).some((t) => t.classList.contains(MISMATCH_CLASS)));
  check('결과 문구가 몇 개 맞았는지 알려 줌', /\d+\/\d+ 일치/.test(result.textContent), result.textContent);

  // 정답 제출
  store.dispatch({ container: FLEX_CHALLENGES[0].target });
  const verdict = api.submit();
  check('정답이면 통과', verdict.solved === true);
  check('클리어 목록에 들어감', api.solved().includes(1));
  check('모든 태그가 일치 표시',
    byClass(root, TAG_CLASS).every((t) => t.classList.contains(MATCH_CLASS)));
  check('진행 표시가 올라감', progress.textContent === `1/${total} 클리어`, progress.textContent);
  check('목록에 클리어 표식',
    byClass(root, LIST_ITEM_CLASS)[0].classList.contains(SOLVED_CLASS));
  check('localStorage에 남는다', JSON.stringify(api.persisted()) === '[1]',
    storage.map.get(STORAGE_KEY));

  // 다시 풀기
  fire(actionOf('reset'), 'click', { target: actionOf('reset') });
  check('처음부터가 답안을 되돌린다',
    store.getState().container.justifyContent === defaultsFrom(FLEX_SCHEMA, 'container').justifyContent);
  check('클리어 기록은 지워지지 않음', api.solved().includes(1));

  // ignore 속성을 틀리게 두고도 통과
  const target = FLEX_CHALLENGES[0].target;
  const ignored = FLEX_CHALLENGES[0].ignore[0];
  const entry = PROPS.get(ignored);
  const wrong = entry.values?.find((v) => v.val !== undefined)?.val ?? '99px';
  store.dispatch({ container: { ...target, [ignored]: wrong } });
  check(`ignore(${ignored})가 달라도 통과`, api.submit().solved === true, `${ignored}=${wrong}`);
}

/* ==========================================================================
   줄 넘김 — 답안 프리뷰에서 실제로 줄이 넘어가는가

   아이템이 좁으면 한 줄에 다 들어가 flex-wrap 을 켜도 그림이 그대로다.
   align-content 를 묻는 문제는 정렬할 줄 뭉치가 없어 문제 자체가 성립하지 않는다.
   ========================================================================== */
section('줄 넘김');

{
  const GAP = Number.parseFloat(defaultsFrom(FLEX_SCHEMA, 'container').gap) || 0;
  const REFERENCE = 1024;

  /** 폭 cw 인 컨테이너에 그 아이템들이 몇 줄로 서는가 */
  const rowsAt = (count, width, cw) => {
    const perRow = Math.max(1, Math.floor((cw + GAP) / (width + GAP)));
    return Math.ceil(count / perRow);
  };

  const wrapping = FLEX_CHALLENGES.filter((ch) => wrapsLines(ch.target, doc));
  const plain = FLEX_CHALLENGES.filter((ch) => !wrapsLines(ch.target, doc));

  check('줄 넘김 문제를 골라낸다', wrapping.length === 12,
    wrapping.map((c) => c.id).join(', '));
  check('나머지는 줄이 넘어가지 않는 문제', plain.length === FLEX_CHALLENGES.length - wrapping.length,
    `${plain.length}건`);

  // 네 구간의 답안 프리뷰 컨테이너 실측 폭. 좁아질수록 줄이 늘어난다.
  const WIDTHS = [['1280', 967], ['1024', 711], ['768', 736], ['375', 311]];

  const short = [];
  wrapping.forEach((ch) => {
    const width = itemWidthFor(ch.itemCount, GAP, REFERENCE);
    WIDTHS.forEach(([label, cw]) => {
      const rows = rowsAt(ch.itemCount, width, cw);
      if (rows < 2) short.push(`#${ch.id}@${label} ${rows}줄`);
    });
    // 기준 폭에서도 두 줄이어야 한다. 그보다 넓어지지 않도록 CSS 가 막는다.
    if (rowsAt(ch.itemCount, width, REFERENCE) < 2) short.push(`#${ch.id}@기준폭 1줄`);
  });
  check('줄 넘김 문제 12건이 네 구간 + 기준폭에서 2줄 이상', short.length === 0,
    short.join(', ') || `${wrapping.length}건 × 5폭`);

  const ac = FLEX_CHALLENGES.filter((ch) => 'alignContent' in ch.target);
  const acShort = ac.filter((ch) =>
    WIDTHS.some(([, cw]) => rowsAt(ch.itemCount, itemWidthFor(ch.itemCount, GAP, REFERENCE), cw) < 2));
  check('align-content 문제 6건이 전부 2줄 이상', ac.length === 6 && acShort.length === 0,
    acShort.map((c) => `#${c.id}`).join(', ') || ac.map((c) => `#${c.id}`).join(', '));
  check('align-content 문제는 전부 줄 넘김 문제', ac.every((ch) => wrapsLines(ch.target, doc)));

  // 줄이 넘어가지 않는 문제의 아이템은 예전 크기 그대로여야 한다
  const store = createStore({ flex: FLEX_SCHEMA });
  const { api } = build({ store });
  const sizes = {};
  FLEX_CHALLENGES.forEach((ch) => {
    api.select(ch.id);
    const first = store.getState().items[0];
    sizes[ch.id] = { w: first.width, h: first.height, n: store.getState().items.length };
  });
  const stretching = FLEX_CHALLENGES.filter((ch) => stretchesItems(ch.target, FLEX_SCHEMA, doc));
  const gone = (v) => !Number.isFinite(v);

  check('늘어나는 답이 8건', stretching.length === 8,
    stretching.map((c) => `#${c.id}`).join(' '));

  // 줄도 안 넘고 늘지도 않는 문제만 예전 크기 그대로다
  const stillPlain = plain.filter((ch) => !stretching.includes(ch));
  check('줄 넘김도 늘어남도 아닌 문제는 80×60 그대로',
    stillPlain.every((ch) => sizes[ch.id].w === 80 && sizes[ch.id].h === 60),
    stillPlain.filter((ch) => sizes[ch.id].w !== 80).map((c) => `#${c.id}`).join(', ') || `${stillPlain.length}건`);

  const onlyStretch = stretching.filter((ch) => !wrapping.includes(ch));
  check('늘어나기만 하는 문제는 두 축을 다 뺀다',
    onlyStretch.every((ch) => gone(sizes[ch.id].w) && gone(sizes[ch.id].h)),
    onlyStretch.map((c) => `#${c.id}`).join(' '));

  const bothWays = stretching.filter((ch) => wrapping.includes(ch));
  check('줄도 넘고 늘어나기도 하면 폭은 남긴다',
    bothWays.length > 0
      && bothWays.every((ch) => sizes[ch.id].w === itemWidthFor(ch.itemCount, GAP, REFERENCE) && gone(sizes[ch.id].h)),
    bothWays.map((c) => `#${c.id}:${sizes[c.id].w}×${sizes[c.id].h}`).join(' '));

  check('줄 넘김 문제는 아이템이 넓어짐',
    wrapping.every((ch) => sizes[ch.id].w === itemWidthFor(ch.itemCount, GAP, REFERENCE)),
    wrapping.map((ch) => `#${ch.id}:${sizes[ch.id].w}`).join(' '));

  // 문제를 오가도 크기가 남지 않는다. 요소를 재사용하므로 이게 깨지면
  // 앞 문제의 60px 이 stretch 문제에 그대로 남는다
  api.select(1);
  api.select(3);
  const after = store.getState().items[0];
  api.select(1);
  const back = store.getState().items[0];
  check('문제를 오가도 크기가 따라온다',
    gone(after.width) && gone(after.height) && back.width === 80 && back.height === 60,
    `#3 ${after.width}×${after.height} → #1 ${back.width}×${back.height}`);
  check('아이템 개수는 문제를 따라간다',
    FLEX_CHALLENGES.every((ch) => sizes[ch.id].n === ch.itemCount));

  // 판정이 이름 분기가 아니라 CSS 파서에서 온다
  check('sizeFor 가 두 판정을 함께 본다',
    /const wraps = wrapsLines\(/.test(read('../js/ui/challenge.js'))
    && /const stretches = stretchesItems\(/.test(read('../js/ui/challenge.js')));
  check('wrapsLines는 nowrap을 걸러낸다', wrapsLines({ flexWrap: 'nowrap' }, doc) === false);
  check('wrapsLines는 wrap·wrap-reverse를 잡는다',
    wrapsLines({ flexWrap: 'wrap' }, doc) && wrapsLines({ flexWrap: 'wrap-reverse' }, doc));
  check('wrapsLines는 관계없는 속성에 반응하지 않음',
    wrapsLines({ justifyContent: 'center', alignItems: 'baseline' }, doc) === false);

  const css = read('../css/components.css');
  check('CSS가 컨테이너 폭에 상한을 건다',
    /\.fgp-challenge__preview \.fgp-preview__container \{[^}]*max-width: calc\(var\(--sp-16\) \* 16\)/.test(css),
    '--sp-16 × 16 = 1024 = REFERENCE_WIDTH');
}

/* ==========================================================================
   조건부 비활성 (F-13 유형 A) — 플레이그라운드와 같아야 한다
   ========================================================================== */
section('조건부 비활성');

{
  const store = createStore({ flex: FLEX_SCHEMA });
  const { root } = build({ store });

  const controlOf = (prop) => walk(root).find((el) =>
    el.className.split(' ').includes('fgp-control')
    && walk(el).some((n) => n.className.split(' ').includes('fgp-control__prop') && n.textContent === prop));

  const entry = FLEX_SCHEMA.find((e) => e.inactiveWhen && e.scope === 'container');
  check('스키마에 조건부 비활성 컨테이너 속성이 있다', Boolean(entry), entry?.prop);

  const target = controlOf(entry.prop);
  check('그 컨트롤이 챌린지 탭에 있다', Boolean(target));

  const cond = entry.inactiveWhen;
  const source = FLEX_SCHEMA.find((e) => e.jsProp === cond.prop);

  store.dispatch({ container: { [cond.prop]: cond.equals } });
  check(`${entry.prop} — 조건 충족 시 aria-disabled="true"`,
    target.getAttribute('aria-disabled') === 'true',
    `${source.prop}=${cond.equals}`);
  check('사유와 안내가 화면에 나온다',
    walk(target).some((n) => n.textContent === cond.reason)
    && walk(target).some((n) => n.textContent === cond.hint));

  const other = source.values.find((v) => v.val !== cond.equals).val;
  store.dispatch({ container: { [cond.prop]: other } });
  check(`${entry.prop} — 조건이 풀리면 aria-disabled="false"`,
    target.getAttribute('aria-disabled') === 'false', `${source.prop}=${other}`);

  check('disabled 속성은 쓰지 않는다',
    walk(target).every((n) => n.disabled !== true),
    '눌러도 아무 일이 없다는 것을 직접 보여 준다');

  // 문제를 고를 때마다 갱신된다 — 답안이 기본값으로 돌아가므로 다시 죽어야 한다
  const acChallenge = FLEX_CHALLENGES.find((ch) => 'alignContent' in ch.target);
  const api2 = build({ store: createStore({ flex: FLEX_SCHEMA }) });
  const t2 = walk(api2.root).find((el) =>
    el.className.split(' ').includes('fgp-control')
    && walk(el).some((n) => n.className.split(' ').includes('fgp-control__prop') && n.textContent === entry.prop));
  api2.api.select(acChallenge.id);
  check('align-content 문제를 열면 그 컨트롤이 죽어 있다',
    t2.getAttribute('aria-disabled') === 'true',
    `#${acChallenge.id} — 답안이 ${source.prop}=${cond.equals} 로 시작한다`);

  api2.store.dispatch({ container: { [cond.prop]: acChallenge.target[cond.prop] } });
  check('정답 방향으로 바꾸면 살아난다', t2.getAttribute('aria-disabled') === 'false',
    `${source.prop}=${acChallenge.target[cond.prop]}`);

  const src = codeOnly(read('../js/ui/challenge.js'));
  check('판정을 직접 하지 않고 isInactive에 맡긴다',
    /isInactive\(/.test(src) && !/inactiveWhen/.test(src));
}

/* ==========================================================================
   이어 하기 · 독립성
   ========================================================================== */
section('이어 하기 · 독립성');

{
  const storage = fakeStorage({ [STORAGE_KEY]: '{"solved":[2,5]}' });
  const { root, api } = build({ storage });
  check('저장된 진행을 이어받는다', JSON.stringify(api.solved().sort()) === '[2,5]');
  check('이어받은 것이 목록에 표시',
    byClass(root, LIST_ITEM_CLASS).filter((b) => b.classList.contains(SOLVED_CLASS)).length === 2);

  // 저장이 막혀 있어도 화면은 돈다
  const blocked = fakeStorage({}, 'write-throws');
  const b = build({ storage: blocked });
  b.store.dispatch({ container: FLEX_CHALLENGES[0].target });
  let threw = false;
  try { b.api.submit(); } catch { threw = true; }
  check('저장이 막혀도 제출이 죽지 않음', !threw && b.api.solved().includes(1));
  check('막힌 저장소에는 안 남는다', b.api.persisted().length === 0);

  // 메인 저장소와 별개
  const main = createStore({ flex: FLEX_SCHEMA });
  const own = createStore({ flex: FLEX_SCHEMA });
  build({ store: own, storage: fakeStorage() });
  own.dispatch({ container: { justifyContent: 'space-evenly' } });
  check('챌린지 조작이 메인 상태를 건드리지 않음',
    main.getState().container.justifyContent === defaultsFrom(FLEX_SCHEMA, 'container').justifyContent,
    `메인 ${main.getState().container.justifyContent} · 챌린지 ${own.getState().container.justifyContent}`);
  check('메인 조작이 챌린지를 건드리지 않음',
    (main.dispatch({ container: { alignItems: 'baseline' } }),
      own.getState().container.alignItems !== 'baseline'));
}

/* ==========================================================================
   v0.1 이관
   ========================================================================== */
section('v0.1 이관');

{
  const v01 = read('../js/data.js');

  // v0.1에서 옮겨온 것은 1~8뿐이다. 9번부터는 v1.0에서 새로 쓴 문제다.
  const v01Ids = [...v01.matchAll(/^      id: (\d+), title: '([^']+)'/gm)].map((m) => Number(m[1]));
  const ported = FLEX_CHALLENGES.filter((c) => v01Ids.includes(c.id));
  const added = FLEX_CHALLENGES.filter((c) => !v01Ids.includes(c.id));

  check('v0.1 원본은 8건', v01Ids.length === 8, v01Ids.join(', '));
  check('이관분과 신규분의 합이 전체', ported.length + added.length === FLEX_CHALLENGES.length,
    `이관 ${ported.length}건 · 신규 ${added.length}건`);

  const notFound = [];
  ported.forEach((ch) => {
    ['title', 'desc', 'hint'].forEach((key) => {
      if (!v01.includes(ch[key])) notFound.push(`#${ch.id}.${key}`);
    });
  });
  check('이관분의 제목·설명·힌트가 v0.1에 그대로 있음', notFound.length === 0,
    notFound.join(', ') || `${ported.length}건 × 3필드 일치`);

  const collided = added.filter((ch) => v01.includes(ch.title));
  check('신규분 제목이 v0.1과 겹치지 않음', collided.length === 0,
    collided.map((c) => c.title).join(', ') || `${added.length}건`);

  check('v0.1 파일은 손대지 않았다 (colors 8건 그대로)',
    (v01.match(/^\s+colors: \[/gm) ?? []).length === 8);

  // v0.1 COLORS 팔레트와 accents 순번이 같은 색을 가리키는가
  const tokens = read('../css/tokens.css');
  const palette = [...tokens.matchAll(/--p-item-(\d): (#[0-9a-f]{6});/g)]
    .reduce((map, m) => map.set(Number(m[1]), m[2]), new Map());
  const v01Colors = [...v01.matchAll(/^\s+colors: \[(.+)\],$/gm)]
    .map((m) => m[1].split(',').map((s) => s.trim().replace(/'/g, '')));
  check('이관분의 accents가 v0.1의 색을 그대로 가리킨다',
    ported.every((ch, i) => ch.accents.every((n, j) => palette.get(n) === v01Colors[i][j])),
    `${v01Colors.flat().length}개 색 일치`);
  check('신규분의 accents도 팔레트 안에 있다',
    added.every((ch) => ch.accents.every((n) => palette.has(n))),
    `${added.reduce((n, c) => n + c.accents.length, 0)}개`);
}

/* ==========================================================================
   색상 리터럴 · 하드코딩
   ========================================================================== */
section('색상 리터럴 · 하드코딩');

{
  const META = REQUIRED.filter((k) => k !== 'target' && k !== 'ignore' && k !== 'miniStyle');
  const dirty = [];
  FLEX_CHALLENGES.forEach((ch) => {
    META.forEach((key) => {
      if (COLOR.test(JSON.stringify(ch[key]))) dirty.push(`#${ch.id}.${key}`);
      COLOR.lastIndex = 0;
    });
    if (COLOR.test(JSON.stringify(ch.miniStyle))) dirty.push(`#${ch.id}.miniStyle`);
    COLOR.lastIndex = 0;
  });
  check('챌린지 데이터에 색상 0건', dirty.length === 0, dirty.join(', ') || `${META.length + 1}개 필드`);

  [['js/ui/challenge.js', '../js/ui/challenge.js'], ['css/components.css', '../css/components.css'],
   ['index-v1.html', '../index-v1.html'], ['js/main.js', '../js/main.js']].forEach(([label, rel]) => {
    const hits = read(rel).match(COLOR) ?? [];
    check(`${label} 색상 0건`, hits.length === 0, hits.join(', ') || '0건');
  });

  const ui = codeOnly(read('../js/ui/challenge.js'));
  const titles = FLEX_CHALLENGES.map((c) => c.title);
  const quoted = (v) => ui.includes(`'${v}'`) || ui.includes(`"${v}"`);
  check('challenge.js에 문제 제목 0건', !titles.some(quoted));
  check('challenge.js에 속성 이름 분기 없음', !/prop\s*===|jsProp\s*===/.test(ui),
    '판정은 데이터의 target·ignore가 한다');
  check('challenge.js에 문제 수가 박혀 있지 않음', !/\b8\b/.test(ui.replace(/ACCENT_COUNT = 8|% 8|item-8|1\.\.8/g, '')));
  check('challenge.js가 controls.js를 재사용', /createControl/.test(ui));
}

/* ==========================================================================
   방어
   ========================================================================== */
section('방어');

{
  let threw = 0;
  const store = createStore({ flex: FLEX_SCHEMA });
  const base = { challenges: FLEX_CHALLENGES, schema: FLEX_SCHEMA, store, root: createElement('div'), doc };
  try { createChallenge({ ...base, challenges: [] }); } catch { threw++; }
  try { createChallenge({ ...base, schema: [] }); } catch { threw++; }
  try { createChallenge({ ...base, store: null }); } catch { threw++; }
  try { createChallenge({ ...base, root: null }); } catch { threw++; }
  try { createChallenge({ ...base, doc: null }); } catch { threw++; }
  check('빈 목록·빈 스키마·저장소/root/document 없음을 막는다', threw === 5, `${threw}/5`);

  const { api } = build();
  api.select(999);
  check('없는 문제 번호는 무시', api.selected().id === 1);
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
