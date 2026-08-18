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
import { createStore } from '../js/core/store.js';
import { partitionByScope, defaultsFrom } from '../js/core/schema-spec.js';
import {
  createChallenge, checkAnswer, readProgress, writeProgress, STORAGE_KEY,
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
    const verdict = checkAnswer(ch, answer);
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
    return checkAnswer(ch, messed).solved;
  });
  check('ignore 속성을 틀리게 해도 통과', ignoreProof.every(Boolean),
    `${ignoreProof.filter(Boolean).length}/${FLEX_CHALLENGES.length}건`);

  // ignore 속성이 채점 목록에 들어가지 않는다
  const leaked = FLEX_CHALLENGES.flatMap((ch) =>
    checkAnswer(ch, defaults).results.map((r) => r.key).filter((k) => (ch.ignore ?? []).includes(k)));
  check('채점 목록에 ignore 키가 없음', leaked.length === 0, leaked.join(', ') || '누출 0건');

  // 채점 대상 하나만 틀려도 오답
  const strict = FLEX_CHALLENGES.map((ch) => {
    const answer = { ...defaults, ...ch.target };
    const key = Object.keys(ch.target).find((k) => !(ch.ignore ?? []).includes(k));
    const entry = PROPS.get(key);
    answer[key] = entry.values.find((v) => v.val !== ch.target[key]).val;
    const verdict = checkAnswer(ch, answer);
    return !verdict.solved && verdict.correct === verdict.total - 1;
  });
  check('채점 대상 하나가 틀리면 오답', strict.every(Boolean));

  check('빈 답안은 전부 통과하지 않음',
    FLEX_CHALLENGES.filter((ch) => checkAnswer(ch, {}).solved).length === 0);
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
