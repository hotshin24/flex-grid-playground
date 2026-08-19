/**
 * core/router.js — URL 해시 직렬화 (F-09 / PRD 4.5)
 *
 * 주소 하나로 화면을 되살린다. 정적 호스팅에 얹혀 있으므로 경로가 아니라
 * 해시만 쓴다.
 *
 *   #/grid/playground?tc=1fr+1fr+1fr&rg=20px&n=6&sel=2&ig.2=3
 *
 * 앞의 두 칸은 토픽과 탭이고, 물음표 뒤는 기본값과 다른 속성뿐이다.
 * 기본값과 같으면 적지 않는다 — 주소가 짧아지고, 스키마의 기본값이 바뀌면
 * 옛 주소도 새 기본값을 따라간다.
 *
 * ── 키는 전부 스키마에서 온다 ──────────────────────────────────────────
 *
 * 속성 이름을 이 파일에 적지 않는다. 컨테이너 속성은 `urlKey`, 아이템 속성은
 * `urlKey.<아이템 id>` 다. 스키마에 속성을 하나 더하면 주소도 저절로 따라온다.
 * 값 변환은 CONTROL_TYPES 의 serialize·parse 를 그대로 쓴다. 여기서 문자열을
 * 자르거나 붙이지 않는다.
 *
 * 예약 키는 넷이다 — n(아이템 수) · sel(고른 아이템) · iw·ih(아이템 크기).
 * 스키마의 urlKey 와 겹치면 안 되고, tools/check-router.mjs 가 그것을 지킨다.
 *
 * ── 무엇을 담지 않는가 ─────────────────────────────────────────────────
 *
 * view(프리뷰 크기)는 담지 않는다. PRD 4.4 가 도구 뷰 설정으로 분류했고
 * codegen 출력에서도 빠지는 값이다. 보는 사람의 화면 사정이지 학습 내용이 아니다.
 * measured 도 담지 않는다. renderer 가 렌더 결과를 재서 넣는 값이라 주소로
 * 옮겨 봐야 다음 렌더에 덮어쓰인다.
 *
 * ── replaceState 를 쓴다 ───────────────────────────────────────────────
 *
 * pushState 가 아니다. 슬라이더는 input 이벤트마다 dispatch 하므로 pushState
 * 라면 드래그 한 번이 히스토리 수십 칸을 만든다. 그러면 뒤로 가기가 페이지를
 * 떠나지 못하고 드래그 중간값들을 되짚는다. 되돌리기는 이 도구가 자기 undo 로
 * 이미 제공한다. 주소창은 "지금 화면을 가리키는 공유용 주소" 로만 둔다.
 *
 * 부수로 순환도 끊긴다 — replaceState 는 hashchange 를 일으키지 않는다.
 * 사람이 주소를 고치거나 뒤로 가기를 눌렀을 때만 hashchange 가 오고, 그때도
 * 방금 쓴 문자열과 같으면 아무 일도 하지 않는다.
 */

import { CONTROL_TYPES, partitionByScope } from './schema-spec.js';
import { createStore, TABS } from './store.js';

/** 스키마 밖의 값이 쓰는 키. urlKey 와 겹쳐선 안 된다. */
export const RESERVED_KEYS = {
  count: 'n',
  selected: 'sel',
  itemWidth: 'iw',
  itemHeight: 'ih',
};

/** 아이템 속성 키와 아이템 id 를 잇는 글자. */
export const ITEM_SEPARATOR = '.';

const spec = (entry) => CONTROL_TYPES[entry.control];

/**
 * 상태가 담은 값을 문자열 하나로. 컨트롤 타입이 아는 방식 그대로다.
 *
 * 문자열은 파서를 한 번 태우고 나서 적는다. serialize 가 파싱 결과 모양만
 * 받아들이는 컨트롤이 있어서다 — 상태에는 CSS 문자열이 들어 있는데 그대로
 * 넘기면 "값 없음" 으로 읽히고 주소에서 통째로 사라진다.
 */
const write = (entry, value) => (typeof value === 'string'
  ? spec(entry).serialize(spec(entry).parse(value))
  : spec(entry).serialize(value));

/**
 * 문자열을 상태가 담는 모양으로.
 *
 * 컨트롤마다 상태에 담기는 모양이 다르다 — track-list 는 배열, number 는 숫자,
 * area-grid 는 문자열이다. 그 모양을 알려 주는 것이 기본값이다. 상태의 초기값이
 * 기본값에서 나오므로, parse 결과가 기본값과 같은 모양이면 그대로 쓰고 아니면
 * 한 번 더 직렬화해 문자열로 맞춘다. 컨트롤 이름도 속성 이름도 보지 않는다.
 */
function read(entry, raw) {
  const parsed = spec(entry).parse(raw);
  if (Array.isArray(parsed?.errors) && parsed.errors.length > 0) return undefined;

  const sameShape = Array.isArray(parsed) === Array.isArray(entry.default)
    && typeof parsed === typeof entry.default;
  const value = sameShape ? parsed : spec(entry).serialize(parsed);

  // 적힌 글자가 정규형 그대로여야 받는다.
  //
  // 파서는 관대해서 이상한 값도 읽어 낸다 — 따옴표가 열린 채 끝난 areas 를
  // 이름 하나로 삼는 식이다. 오류라 하지 않으니 오류 목록으로는 못 거른다.
  // 대신 우리가 적을 때 쓰는 글자와 대 본다. 주소를 쓰는 쪽도 이 함수의 짝인
  // write 를 쓰므로, 우리가 만든 주소는 언제나 통과하고 손으로 흘려 쓴 값만
  // 걸린다. 걸린 값은 기본값에 자리를 내준다 (PRD 4.5).
  return write(entry, value) === raw ? value : undefined;
}

/**
 * 읽어 들인 값을 받아들일지 판단한다.
 *
 * 주소는 사람이 손으로 고칠 수 있는 자리라 무엇이든 들어온다. 판단 근거도
 * 스키마에서만 가져온다 — 값 목록이 있으면 그 안에 있는지, 숫자면 범위 안인지,
 * 그 밖에는 빈 값이 아닌지를 본다.
 */
function acceptable(entry, value) {
  if (value === undefined || value === null) return false;

  if (Array.isArray(entry.values) && entry.values.length > 0) {
    return entry.values.some((v) => String(v.val) === write(entry, value));
  }

  if (typeof entry.default === 'number') {
    if (!Number.isFinite(value)) return false;
    if (Number.isFinite(entry.min) && value < entry.min) return false;
    if (Number.isFinite(entry.max) && value > entry.max) return false;
    return true;
  }

  if (Array.isArray(entry.default)) return Array.isArray(value) && value.length > 0;

  return write(entry, value) !== '';
}

/* --------------------------------------------------------------------------
   기준 상태

   "기본값과 같으면 생략" 을 판단하려면 손대지 않은 상태가 필요하다. 상수를
   여기에 다시 적지 않고 저장소에게 하나 더 만들어 달라고 한다. 아이템의
   width·height 처럼 스키마에 없는 기본값까지 한 곳에서 온다.
   -------------------------------------------------------------------------- */

function pristineFactory(schemas) {
  const cache = new Map();
  return (topic) => {
    if (!cache.has(topic)) {
      cache.set(topic, createStore({ [topic]: schemas[topic] }).getState());
    }
    return cache.get(topic);
  };
}

/* --------------------------------------------------------------------------
   직렬화
   -------------------------------------------------------------------------- */

/**
 * 상태 → 해시 문자열. 앞에 '#' 이 붙어 돌아온다.
 *
 * @param {Object} state    store.getState() 결과
 * @param {Array}  schema   그 토픽의 스키마
 * @param {Object} pristine 손대지 않은 같은 토픽의 상태
 */
export function serializeState(state, schema, pristine) {
  const { container, item } = partitionByScope(schema);
  const params = new URLSearchParams();

  for (const entry of container) {
    const now = write(entry, state.container[entry.jsProp]);
    if (now !== write(entry, pristine.container[entry.jsProp])) params.set(entry.urlKey, now);
  }

  const items = state.items ?? [];
  if (items.length !== pristine.items.length) {
    params.set(RESERVED_KEYS.count, String(items.length));
  }

  const base = pristine.items[0];
  for (const it of items) {
    for (const entry of item) {
      const now = write(entry, it[entry.jsProp]);
      if (now !== write(entry, base[entry.jsProp])) {
        params.set(`${entry.urlKey}${ITEM_SEPARATOR}${it.id}`, now);
      }
    }
    if (it.width !== base.width) {
      params.set(`${RESERVED_KEYS.itemWidth}${ITEM_SEPARATOR}${it.id}`, geometry(it.width));
    }
    if (it.height !== base.height) {
      params.set(`${RESERVED_KEYS.itemHeight}${ITEM_SEPARATOR}${it.id}`, geometry(it.height));
    }
  }

  if (state.selectedId !== pristine.selectedId) {
    params.set(RESERVED_KEYS.selected, String(state.selectedId));
  }

  const query = params.toString();
  return `#/${state.topic}/${state.tab}${query ? `?${query}` : ''}`;
}

/** 아이템 크기는 수 아니면 "자동" 이다. null 을 그대로 적으면 되읽을 수 없다. */
const AUTO = 'auto';
const geometry = (v) => (Number.isFinite(v) ? String(v) : AUTO);
const readGeometry = (raw) => {
  if (raw === AUTO) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/* --------------------------------------------------------------------------
   파싱
   -------------------------------------------------------------------------- */

/**
 * 해시 문자열 → { topic, tab, patch }. 읽어낼 것이 없으면 null.
 *
 * 실패해도 던지지 않고 경고도 남기지 않는다 (PRD 4.5). 읽히는 만큼만 읽고
 * 나머지는 기본값이 그대로 산다. 잘못된 항목 하나가 주소 전체를 버리게 하지
 * 않는다 — 사람이 손으로 고치다 한 글자 틀린 주소도 최대한 살려 낸다.
 */
export function parseHash(hash, schemas, options = {}) {
  try {
    return readHash(hash, schemas, options);
  } catch {
    return null;
  }
}

function readHash(hash, schemas, { maxItems = Infinity, pristineOf } = {}) {
  const raw = String(hash ?? '').replace(/^#/, '');
  if (!raw.startsWith('/')) return null;

  const [path, query = ''] = raw.split('?');
  const [, topic, tab] = path.split('/');

  if (!topic || !Object.prototype.hasOwnProperty.call(schemas, topic)) return null;

  const schema = schemas[topic];
  const pristine = pristineOf ? pristineOf(topic) : createStore({ [topic]: schema }).getState();
  const params = new URLSearchParams(query);

  const result = { topic, tab: TABS.includes(tab) ? tab : pristine.tab, patch: {} };

  const { container, item } = partitionByScope(schema);

  /* 컨테이너 */
  const containerPatch = {};
  for (const entry of container) {
    if (!params.has(entry.urlKey)) continue;
    const value = read(entry, params.get(entry.urlKey));
    if (acceptable(entry, value)) containerPatch[entry.jsProp] = value;
  }
  if (Object.keys(containerPatch).length > 0) result.patch.container = containerPatch;

  /* 아이템 수 — 먼저 정해야 어느 id 까지 받아들일지 알 수 있다 */
  let count = pristine.items.length;
  if (params.has(RESERVED_KEYS.count)) {
    const n = Number(params.get(RESERVED_KEYS.count));
    if (Number.isInteger(n) && n >= 1 && n <= maxItems) count = n;
  }

  const template = pristine.items[0];
  const items = Array.from({ length: count }, (_, i) => ({ ...template, id: i + 1 }));
  const byId = new Map(items.map((it) => [it.id, it]));
  let touched = count !== pristine.items.length;

  const itemByKey = new Map(item.map((entry) => [entry.urlKey, entry]));

  for (const [key, value] of params) {
    const at = key.indexOf(ITEM_SEPARATOR);
    if (at < 0) continue;

    const id = Number(key.slice(at + 1));
    const target = byId.get(id);
    if (!target) continue;

    const head = key.slice(0, at);

    if (head === RESERVED_KEYS.itemWidth || head === RESERVED_KEYS.itemHeight) {
      const size = readGeometry(value);
      if (size === undefined) continue;
      target[head === RESERVED_KEYS.itemWidth ? 'width' : 'height'] = size;
      touched = true;
      continue;
    }

    const entry = itemByKey.get(head);
    if (!entry) continue;
    const parsed = read(entry, value);
    if (!acceptable(entry, parsed)) continue;
    target[entry.jsProp] = parsed;
    touched = true;
  }

  if (touched) result.patch.items = items;

  /* 고른 아이템 — 없는 id 는 버린다 */
  if (params.has(RESERVED_KEYS.selected)) {
    const sel = Number(params.get(RESERVED_KEYS.selected));
    if (byId.has(sel)) result.patch.selectedId = sel;
  }

  return result;
}

/* --------------------------------------------------------------------------
   저장소에 붙이기
   -------------------------------------------------------------------------- */

/**
 * @param {Object}   config
 * @param {Object}   config.store     createStore 결과
 * @param {Object}   config.schemas   { [topic]: schema[] }
 * @param {number}   [config.maxItems]  아이템 수 상한. 주소로 넘어온 n 을 자른다
 * @param {Object}   [config.win]     window 호환 객체 (테스트에서 갈아 끼운다)
 * @returns {{start, stop, read, write, hashFor}}
 */
export function createRouter({ store, schemas, maxItems = Infinity, win = globalThis } = {}) {
  if (!store) throw new Error('createRouter: store가 필요합니다');
  if (!schemas) throw new Error('createRouter: schemas가 필요합니다');

  const pristineOf = pristineFactory(schemas);

  /** 방금 우리가 쓴 해시. hashchange 가 이 값이면 우리 글씨라 무시한다. */
  let lastWritten = null;
  /** 주소를 상태에 옮기는 중. 그때 오는 알림에는 주소를 다시 쓰지 않는다. */
  let applying = false;

  function hashFor(state) {
    return serializeState(state, schemas[state.topic], pristineOf(state.topic));
  }

  /** 상태 → 주소. 달라졌을 때만 쓴다. */
  function writeHash(state) {
    if (applying) return null;

    const next = hashFor(state);
    if (next === lastWritten) return null;

    const url = `${win.location.pathname}${win.location.search}${next}`;
    win.history.replaceState(null, '', url);
    lastWritten = next;
    return next;
  }

  /** 주소 → 상태. 읽을 것이 없으면 아무것도 하지 않는다. */
  function readHashInto(hash) {
    const parsed = parseHash(hash, schemas, { maxItems, pristineOf });
    if (!parsed) return null;

    applying = true;
    try {
      if (parsed.topic !== store.getTopic()) store.setTopic(parsed.topic);

      const patch = { ...parsed.patch };
      if (parsed.tab !== store.getState().tab) patch.tab = parsed.tab;

      if (Object.keys(patch).length > 0) store.dispatch(patch);
    } finally {
      applying = false;
    }

    lastWritten = hashFor(store.getState());
    return parsed;
  }

  let unsubscribe = null;
  let onHashChange = null;

  function start() {
    const restored = readHashInto(win.location.hash);
    if (!restored) writeHash(store.getState());

    unsubscribe = store.subscribe(writeHash);

    onHashChange = () => {
      if (win.location.hash === lastWritten) return;
      readHashInto(win.location.hash);
    };
    win.addEventListener('hashchange', onHashChange);

    return restored;
  }

  function stop() {
    if (unsubscribe) unsubscribe();
    if (onHashChange) win.removeEventListener('hashchange', onHashChange);
    unsubscribe = null;
    onHashChange = null;
  }

  return { start, stop, read: readHashInto, write: writeHash, hashFor };
}

export default createRouter;
