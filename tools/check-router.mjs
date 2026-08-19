/**
 * check-router.mjs — URL 해시 직렬화 확인 (F-09 / PRD 4.5)
 *
 * 가장 중요한 것은 왕복이다. 주소에 적힌 값이 되읽었을 때 같은 값이 아니면
 * 공유한 주소가 다른 화면을 연다. 스키마의 urlKey 31개를 전부 한 번씩 태운다.
 *
 * 다음은 순환이다. 주소 갱신이 상태 변경을 부르고 그것이 다시 주소를 갱신하면
 * 멈추지 않는다. 호출 횟수를 세어 확인한다.
 *
 * 브라우저를 쓰지 않는다. window 는 필요한 만큼만 흉내 낸다.
 *   node tools/check-router.mjs
 */

import { readFileSync } from 'node:fs';
import {
  createRouter, serializeState, parseHash, RESERVED_KEYS, ITEM_SEPARATOR,
} from '../js/core/router.js';
import { createStore, TABS } from '../js/core/store.js';
import { CONTROL_TYPES, partitionByScope, MEASURED_KEYS } from '../js/core/schema-spec.js';
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

const SCHEMAS = { flex: FLEX_SCHEMA, grid: GRID_SCHEMA };
const ALL = [...FLEX_SCHEMA, ...GRID_SCHEMA];
const make = () => createStore(SCHEMAS);
const pristineOf = (topic) => createStore({ [topic]: SCHEMAS[topic] }).getState();
const write = (entry, v) => CONTROL_TYPES[entry.control].serialize(v);

const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const codeOnly = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/^\s*\/\/.*$/gm, ' ');

/**
 * 기본값과 다른 표본 하나를 스키마에서 만든다.
 *
 * 속성 이름으로 고르지 않는다 — 컨트롤 타입이 아는 만큼만 쓴다. 그래야 스키마에
 * 속성이 늘어도 이 파일을 고치지 않는다.
 */
function sampleFor(entry) {
  if (Array.isArray(entry.values) && entry.values.length > 0) {
    const other = entry.values.find((v) => String(v.val) !== write(entry, entry.default));
    return other ? CONTROL_TYPES[entry.control].parse(String(other.val)) : null;
  }
  if (typeof entry.default === 'number') {
    const step = entry.step ?? 1;
    const up = entry.default + step;
    return Number.isFinite(entry.max) && up > entry.max ? entry.default - step : up;
  }
  if (Array.isArray(entry.default)) {
    const unit = (entry.units ?? []).find((u) => u !== 'auto') ?? 'fr';
    return CONTROL_TYPES[entry.control].parse(`2${unit} 2${unit}`);
  }
  // 문자열 계열 — 단위가 있으면 수치를 바꾸고, 없으면 컨트롤이 읽을 수 있는 값을 쓴다
  if (Array.isArray(entry.units) && entry.units.length > 0) {
    const unit = entry.units.find((u) => u !== 'auto') ?? entry.units[0];
    return `24${unit === 'auto' ? '' : unit}`;
  }
  const guess = ['zone', 'span 2', '"a a" "b b"'];
  return guess.find((g) => {
    const round = write(entry, CONTROL_TYPES[entry.control].parse(g));
    return round !== '' && round !== write(entry, entry.default);
  }) ?? null;
}

/* ==========================================================================
   예약 키
   ========================================================================== */
section('예약 키');

{
  const reserved = Object.values(RESERVED_KEYS);
  check('예약 키 4종', reserved.length === 4, reserved.join(' '));

  const clash = ALL.filter((e) => reserved.includes(e.urlKey)).map((e) => `${e.urlKey}(${e.prop})`);
  check('스키마 urlKey 와 겹치지 않는다', clash.length === 0, clash.join(', ') || '겹침 0건');

  // 아이템 키는 구분자를 끼우므로 컨테이너 키와 같은 글자여도 갈라진다
  const dotted = ALL.some((e) => e.urlKey.includes(ITEM_SEPARATOR));
  check(`urlKey 에 구분자 '${ITEM_SEPARATOR}' 가 없다`, dotted === false);
}

/* ==========================================================================
   왕복 — urlKey 31개
   ========================================================================== */
section('왕복');

{
  let round = 0;
  const bad = [];
  const noSample = [];

  for (const topic of Object.keys(SCHEMAS)) {
    const schema = SCHEMAS[topic];
    const { container, item } = partitionByScope(schema);
    const pristine = pristineOf(topic);

    for (const entry of container) {
      const sample = sampleFor(entry);
      if (sample === null) { noSample.push(entry.prop); continue; }

      const store = make();
      store.setTopic(topic);
      store.dispatch({ container: { [entry.jsProp]: sample } });

      const hash = serializeState(store.getState(), schema, pristine);
      const back = parseHash(hash, SCHEMAS, { pristineOf });
      const got = back?.patch?.container?.[entry.jsProp];

      round++;
      if (got === undefined || write(entry, got) !== write(entry, sample)) {
        bad.push(`${entry.prop}: ${write(entry, sample)} → ${got === undefined ? '없음' : write(entry, got)}`);
      }
    }

    for (const entry of item) {
      const sample = sampleFor(entry);
      if (sample === null) { noSample.push(entry.prop); continue; }

      const store = make();
      store.setTopic(topic);
      const items = store.getState().items.map((it, i) => (i === 1 ? { ...it, [entry.jsProp]: sample } : it));
      store.dispatch({ items });

      const hash = serializeState(store.getState(), schema, pristine);
      const back = parseHash(hash, SCHEMAS, { pristineOf });
      const got = back?.patch?.items?.[1]?.[entry.jsProp];

      round++;
      if (got === undefined || write(entry, got) !== write(entry, sample)) {
        bad.push(`${entry.prop}: ${write(entry, sample)} → ${got === undefined ? '없음' : write(entry, got)}`);
      }
    }
  }

  check('표본을 못 만든 속성 없음', noSample.length === 0, noSample.join(', ') || '전부 생성');
  check(`urlKey ${ALL.length}개가 전부 왕복`, round === ALL.length && bad.length === 0,
    bad.length ? bad.join(' / ') : `${round}개 왕복`);
}

/* ==========================================================================
   기본값 생략
   ========================================================================== */
section('기본값 생략');

{
  for (const topic of Object.keys(SCHEMAS)) {
    const store = make();
    store.setTopic(topic);
    const hash = serializeState(store.getState(), SCHEMAS[topic], pristineOf(topic));
    check(`${topic} — 손대지 않은 상태는 물음표가 없다`, hash === `#/${topic}/playground`, hash);
  }

  // 값을 바꿨다 되돌리면 다시 사라진다
  const store = make();
  const entry = FLEX_SCHEMA.find((e) => e.scope === 'container' && Array.isArray(e.values));
  store.dispatch({ container: { [entry.jsProp]: sampleFor(entry) } });
  const dirty = serializeState(store.getState(), FLEX_SCHEMA, pristineOf('flex'));
  store.dispatch({ container: { [entry.jsProp]: entry.default } });
  const clean = serializeState(store.getState(), FLEX_SCHEMA, pristineOf('flex'));
  check('기본값으로 되돌리면 키가 빠진다',
    dirty.includes(`${entry.urlKey}=`) && !clean.includes(`${entry.urlKey}=`), `${dirty} → ${clean}`);

  // 아이템 수·선택도 기본과 같으면 적지 않는다
  const p = pristineOf('flex');
  check('기본 아이템 수·선택은 생략',
    !clean.includes(`${RESERVED_KEYS.count}=`) && !clean.includes(`${RESERVED_KEYS.selected}=`),
    `기본 ${p.items.length}개 · 선택 ${p.selectedId}`);

  const more = make();
  more.dispatch({ items: [...more.getState().items, { ...more.getState().items[0], id: 5 }] });
  const grown = serializeState(more.getState(), FLEX_SCHEMA, p);
  check('아이템 수가 다르면 적는다', grown.includes(`${RESERVED_KEYS.count}=5`), grown);
}

/* ==========================================================================
   view · measured 는 담지 않는다
   ========================================================================== */
section('담지 않는 것');

{
  const store = make();
  store.setView({ containerWidth: 640, containerHeight: 480 });
  const hash = serializeState(store.getState(), FLEX_SCHEMA, pristineOf('flex'));
  check('view 를 바꿔도 주소가 그대로', hash === '#/flex/playground', hash);
  check('주소에 640·480 이 없다', !hash.includes('640') && !hash.includes('480'));

  const src = codeOnly(read('../js/core/router.js'));
  check('router 가 view 를 읽지 않는다', !/\bstate\.view\b|containerWidth|containerHeight/.test(src));

  const measuredKeys = Object.keys(MEASURED_KEYS);
  const leaked = measuredKeys.filter((k) => src.includes(k));
  check(`measured 키 ${measuredKeys.length}개가 router 에 없다`, leaked.length === 0, leaked.join(', ') || '0건');

  // 주소에서 억지로 밀어 넣어도 상태에 들어가지 않는다
  const forced = parseHash('#/flex/playground?containerWidth=999&lineCount=3', SCHEMAS, { pristineOf });
  check('주소로 밀어 넣은 view·measured 는 무시', forced !== null && !JSON.stringify(forced.patch).includes('999'),
    JSON.stringify(forced?.patch ?? null));
}

/* ==========================================================================
   깨진 주소
   ========================================================================== */
section('깨진 주소');

{
  const broken = [
    ['빈 문자열', ''],
    ['해시만', '#'],
    ['경로 없음', '#playground'],
    ['없는 토픽', '#/svelte/playground?j=center'],
    ['없는 탭', '#/flex/없는탭'],
    ['없는 키', '#/flex/playground?zzz=1'],
    ['값이 목록 밖', '#/flex/playground?j=bogus'],
    ['숫자 자리에 글자', '#/flex/playground?n=abc'],
    ['음수 아이템 수', '#/flex/playground?n=-3'],
    ['없는 아이템 id', `#/flex/playground?ig${ITEM_SEPARATOR}99=2`],
    ['없는 선택 id', '#/flex/playground?sel=99'],
    ['값 없는 키', '#/flex/playground?j='],
    ['물음표만', '#/flex/playground?'],
    ['깨진 트랙', '#/grid/playground?tc=%%%'],
    ['깨진 areas', '#/grid/playground?ta=" unclosed'],
  ];

  const warn = console.warn, err = console.error;
  let noise = 0;
  console.warn = () => { noise++; };
  console.error = () => { noise++; };

  const survived = [];
  for (const [label, hash] of broken) {
    let threw = false;
    let result = null;
    try { result = parseHash(hash, SCHEMAS, { pristineOf }); } catch { threw = true; }
    if (threw) survived.push(`${label}: 던짐`);
    // 값이 살아남아 기본값을 덮으면 안 되는 것들
    const json = JSON.stringify(result?.patch ?? {});
    if (/bogus|abc|zzz|999|unclosed/.test(json)) survived.push(`${label}: ${json}`);
  }
  console.warn = warn; console.error = err;

  check(`깨진 주소 ${broken.length}종이 던지지도 새지도 않는다`, survived.length === 0,
    survived.join(' / ') || `${broken.length}종`);
  check('경고를 남기지 않는다 (PRD 4.5)', noise === 0, `${noise}건`);

  // 폴백은 "기본 상태" 다 — 적용해 보고 확인한다
  const store = make();
  const win = fakeWindow('#/flex/playground?j=bogus&g=999zz');
  const router = createRouter({ store, schemas: SCHEMAS, win });
  router.start();
  const s = store.getState();
  const j = FLEX_SCHEMA.find((e) => e.prop === 'justify-content');
  check('읽히지 않는 값은 기본값 그대로', s.container[j.jsProp] === j.default, String(s.container[j.jsProp]));
  router.stop();
}

/* ==========================================================================
   순환 — 주소 갱신이 상태 변경을 다시 부르지 않는다
   ========================================================================== */
section('순환');

function fakeWindow(hash = '') {
  const listeners = {};
  return {
    location: { pathname: '/index.html', search: '', hash },
    history: {
      calls: 0,
      pushCalls: 0,
      replaceState(_s, _t, url) {
        this.calls++;
        const at = String(url).indexOf('#');
        listeners.hashchange?.forEach(() => {});   // replaceState 는 hashchange 를 일으키지 않는다
        this.location.hash = at < 0 ? '' : String(url).slice(at);
      },
      pushState() { this.pushCalls++; },
    },
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    removeEventListener(type, fn) {
      listeners[type] = (listeners[type] ?? []).filter((f) => f !== fn);
    },
    fire(type) { (listeners[type] ?? []).forEach((fn) => fn()); },
    listeners,
  };
}

{
  const win = fakeWindow('');
  win.history.location = win.location;
  const store = make();

  let notifies = 0;
  store.subscribe(() => { notifies++; });

  const router = createRouter({ store, schemas: SCHEMAS, win });
  router.start();

  const afterStart = { notifies, writes: win.history.calls };

  // 상태를 한 번 바꾸면 주소도 한 번 바뀐다
  store.dispatch({ container: { justifyContent: 'center' } });
  check('상태 1회 변경 → 주소 1회 갱신', win.history.calls === afterStart.writes + 1,
    `${afterStart.writes} → ${win.history.calls}`);
  check('그 변경이 알림을 한 번만 냈다', notifies === afterStart.notifies + 1,
    `${afterStart.notifies} → ${notifies}`);

  // 같은 값을 다시 넣으면 상태 알림은 오지만 주소는 그대로다
  const before = win.history.calls;
  store.dispatch({ container: { justifyContent: 'center' } });
  check('같은 값 재설정은 주소를 다시 쓰지 않는다', win.history.calls === before, `${before} → ${win.history.calls}`);

  // 우리가 쓴 해시로 hashchange 가 와도 상태를 건드리지 않는다
  const notifiesBefore = notifies;
  win.fire('hashchange');
  check('자기가 쓴 해시에는 반응하지 않는다', notifies === notifiesBefore, `${notifiesBefore} → ${notifies}`);

  // 사람이 주소를 고친 경우 — 한 번만 반영되고 되울리지 않는다
  const writesBefore = win.history.calls;
  win.location.hash = '#/flex/playground?j=flex-end';
  win.fire('hashchange');
  const jc = FLEX_SCHEMA.find((e) => e.prop === 'justify-content');
  check('바깥에서 바뀐 해시는 상태에 반영된다', store.getState().container[jc.jsProp] === 'flex-end');
  check('반영 뒤 주소를 다시 쓰지 않는다', win.history.calls === writesBefore,
    `${writesBefore} → ${win.history.calls}`);

  // 여러 번 흔들어도 늘지 않는다
  const settled = win.history.calls;
  for (let i = 0; i < 5; i++) win.fire('hashchange');
  check('같은 해시로 5번 흔들어도 갱신 0회', win.history.calls === settled, `${settled} → ${win.history.calls}`);

  check('pushState 를 쓰지 않는다', win.history.pushCalls === 0, `${win.history.pushCalls}회`);
  router.stop();

  const afterStop = win.history.calls;
  store.dispatch({ container: { justifyContent: 'flex-start' } });
  check('stop 뒤에는 주소를 쓰지 않는다', win.history.calls === afterStop);
}

/* ==========================================================================
   복원 — 주소를 열면 그 화면이 선다
   ========================================================================== */
section('복원');

{
  const source = make();
  source.setTopic('grid');
  source.dispatch({ tab: 'explain' });
  const tc = GRID_SCHEMA.find((e) => e.prop === 'grid-template-columns');
  source.dispatch({ container: { [tc.jsProp]: sampleFor(tc) } });
  const items = source.getState().items.slice(0, 3).map((it, i) => ({ ...it, id: i + 1 }));
  items[2] = { ...items[2], width: 140, height: null };
  source.dispatch({ items, selectedId: 3 });

  const hash = source.getState();
  const url = serializeState(hash, GRID_SCHEMA, pristineOf('grid'));

  const target = make();
  const win = fakeWindow(url);
  const router = createRouter({ store: target, schemas: SCHEMAS, win, maxItems: 20 });
  router.start();

  const a = source.getState();
  const b = target.getState();
  check('토픽 복원', b.topic === a.topic, `${b.topic}`);
  check('탭 복원', b.tab === a.tab, `${b.tab}`);
  check('컨테이너 복원', JSON.stringify(b.container) === JSON.stringify(a.container));
  check('아이템 수 복원', b.items.length === a.items.length, `${b.items.length}개`);
  check('아이템 크기 복원 (수·자동 둘 다)',
    b.items[2].width === 140 && b.items[2].height === null,
    `${b.items[2].width} × ${b.items[2].height}`);
  check('선택 복원', b.selectedId === a.selectedId, String(b.selectedId));
  check('주소가 같은 문자열로 다시 나온다', router.hashFor(b) === url, url);
  router.stop();

  // 상한을 넘는 아이템 수는 잘린다
  const capped = make();
  const win2 = fakeWindow('#/flex/playground?n=999');
  const r2 = createRouter({ store: capped, schemas: SCHEMAS, win: win2, maxItems: 20 });
  r2.start();
  check('maxItems 를 넘는 n 은 무시', capped.getState().items.length === pristineOf('flex').items.length,
    `${capped.getState().items.length}개`);
  r2.stop();
}

/* ==========================================================================
   속성명 하드코딩
   ========================================================================== */
section('속성명 하드코딩');

{
  const src = codeOnly(read('../js/core/router.js'));

  check('prop 비교 분기 없음', !/\bprop\s*===/.test(src) && !/jsProp\s*===\s*['"]/.test(src));

  const props = [...new Set(ALL.flatMap((e) => [e.prop, e.jsProp]))];
  const found = props.filter((p) => new RegExp(`['"\`]${p}['"\`]`).test(src));
  check(`CSS 속성명·jsProp ${props.length}개가 코드에 없다`, found.length === 0, found.join(', ') || '0건');

  const keys = [...new Set(ALL.map((e) => e.urlKey))];
  const hardKeys = keys.filter((k) => new RegExp(`['"\`]${k}['"\`]`).test(src));
  check(`urlKey ${keys.length}개가 코드에 없다`, hardKeys.length === 0, hardKeys.join(', ') || '0건');

  const topics = Object.keys(SCHEMAS);
  const hardTopics = topics.filter((t) => new RegExp(`['"\`]${t}['"\`]`).test(src));
  check('토픽 이름이 코드에 없다', hardTopics.length === 0, hardTopics.join(', ') || '0건');

  const hardTabs = TABS.filter((t) => new RegExp(`['"\`]${t}['"\`]`).test(src));
  check('탭 이름이 코드에 없다', hardTabs.length === 0, hardTabs.join(', ') || '0건');
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
