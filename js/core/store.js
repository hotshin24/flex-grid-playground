/**
 * store.js — 상태 저장소 (M1)
 *
 * PRD 4.4 상태 모델을 토픽별로 독립 보관한다.
 *
 *   { topic, tab, container, items, selectedId, view }
 *
 * container·items의 속성 값은 전부 defaultsFrom(schema, scope)에서 나온다.
 * 이 파일에 CSS 속성 이름이나 기본값이 리터럴로 등장하지 않는다.
 * 속성을 추가하려면 토픽 schema.js만 고치면 되고 여기는 손대지 않는다.
 *
 * core는 topics를 import하지 않는다. 스키마 레지스트리를 주입받아
 * 어떤 토픽 조합으로도 동작한다.
 *
 *   const store = createStore({ flex: FLEX_SCHEMA, grid: GRID_SCHEMA });
 */

import { defaultsFrom } from './schema-spec.js';

/* --------------------------------------------------------------------------
   스키마에서 파생되지 않는 기본값
   CSS 속성이 아니라 프리뷰 구성값이므로 스키마에 없다. 여기서만 정의한다.
   -------------------------------------------------------------------------- */

export const TABS = ['playground', 'explain', 'examples', 'challenge'];

const DEFAULT_TAB = TABS[0];
const DEFAULT_ITEM_COUNT = 4;
const DEFAULT_ITEM_WIDTH = 80;
const DEFAULT_ITEM_HEIGHT = 60;
/**
 * 뷰 설정의 초기값은 null이다 — "사용자가 아직 안 건드림"을 뜻하며,
 * 이때 components.css의 반응형 기본 크기가 그대로 산다. (PRD 4.4)
 */
const VIEW_KEYS = ['containerWidth', 'containerHeight'];

/** 손대지 않은 뷰 설정. 전 키가 null이다. */
const initialView = () => Object.fromEntries(VIEW_KEYS.map((k) => [k, null]));

/** 히스토리 스택 상한. 넘으면 가장 오래된 항목부터 버린다. */
const HISTORY_LIMIT = 50;

/* --------------------------------------------------------------------------
   내부 헬퍼
   -------------------------------------------------------------------------- */

const clone = (v) => structuredClone(v);

/**
 * 아이템 하나를 만든다.
 * 스키마의 item scope 기본값 + 프리뷰 기하값(width·height).
 */
function makeItem(schema, id) {
  const item = defaultsFrom(schema, 'item');
  item.id = id;
  item.width = DEFAULT_ITEM_WIDTH;
  item.height = DEFAULT_ITEM_HEIGHT;
  return item;
}

/**
 * 토픽 하나의 초기 상태를 스키마에서 생성한다.
 * 상태 객체 리터럴을 쓰지 않으므로, 스키마가 바뀌면 초기 상태도 따라 바뀐다.
 */
function initialState(topic, schema) {
  const state = {};
  state.topic = topic;
  state.tab = DEFAULT_TAB;
  state.container = defaultsFrom(schema, 'container');
  state.items = Array.from({ length: DEFAULT_ITEM_COUNT }, (_, i) => makeItem(schema, i + 1));
  state.selectedId = state.items.length > 0 ? state.items[0].id : null;
  return state;
}

/**
 * patch를 상태에 병합한다.
 * container는 한 겹 병합한다 — dispatch({container:{gap:'20px'}})가
 * 나머지 속성을 지우면 안 되기 때문이다.
 * items는 배열이므로 통째로 교체한다.
 */
function merge(state, patch) {
  const next = clone(state);

  for (const [key, value] of Object.entries(patch)) {
    if (key === 'container') {
      Object.assign(next.container, clone(value));
    } else {
      next[key] = clone(value);
    }
  }

  return next;
}

/* --------------------------------------------------------------------------
   저장소
   -------------------------------------------------------------------------- */

/**
 * @param {Object} schemas  { [topic]: schema[] } — 최소 1개
 * @param {Object} [options]
 * @param {string} [options.topic]  시작 토픽. 기본은 schemas의 첫 키
 */
export function createStore(schemas, options = {}) {
  const topics = Object.keys(schemas);

  if (topics.length === 0) {
    throw new Error('createStore: 스키마 레지스트리가 비어 있습니다');
  }

  const startTopic = options.topic ?? topics[0];

  if (!topics.includes(startTopic)) {
    throw new Error(`createStore: 알 수 없는 토픽 '${startTopic}'`);
  }

  /** 토픽별 현재 상태 */
  const states = {};
  /** 토픽별 undo/redo 스택 — 토픽 전환으로 섞이지 않는다 */
  const histories = {};

  for (const topic of topics) {
    states[topic] = initialState(topic, schemas[topic]);
    histories[topic] = { past: [], future: [] };
  }

  /**
   * 뷰 설정은 토픽별로 나누지 않고 하나만 둔다.
   *
   * 프리뷰 크기는 학습 내용이 아니라 사용자가 자기 화면에 맞춰 잡는 값이다.
   * Flex에서 맞춰 놓은 크기가 Grid로 갔다고 되돌아가면 고장으로 읽힌다.
   * container·items와 달리 토픽마다 다른 값을 가질 이유가 없다.
   *
   * getState()는 PRD 4.4대로 view를 상태에 실어 돌려준다. 보관만 공유다.
   */
  const view = initialView();

  let activeTopic = startTopic;
  const listeners = new Set();

  function notify() {
    const snapshot = getState();
    listeners.forEach((fn) => fn(snapshot));
  }

  /** 현재 토픽의 상태 사본. 반환값을 고쳐도 저장소는 영향받지 않는다. */
  function getState() {
    const snapshot = clone(states[activeTopic]);
    snapshot.view = clone(view);
    return snapshot;
  }

  function getTopic() {
    return activeTopic;
  }

  function getTopics() {
    return [...topics];
  }

  /**
   * 상태를 갱신하고 이전 상태를 히스토리에 쌓는다.
   * 새 분기가 생기므로 redo 스택은 비운다.
   */
  function dispatch(patch) {
    if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
      throw new TypeError('dispatch: patch는 객체여야 합니다');
    }
    if ('view' in patch) {
      throw new TypeError('dispatch: view는 setView·resetView로만 바꿉니다');
    }

    const history = histories[activeTopic];
    const previous = states[activeTopic];

    states[activeTopic] = merge(previous, patch);

    history.past.push(previous);
    if (history.past.length > HISTORY_LIMIT) history.past.shift();
    history.future.length = 0;

    notify();
    return getState();
  }

  /** 토픽 전환. 각 토픽의 상태와 히스토리는 그대로 남는다. */
  function setTopic(topic) {
    if (!topics.includes(topic)) {
      throw new Error(`setTopic: 알 수 없는 토픽 '${topic}'`);
    }
    if (topic === activeTopic) return getState();

    activeTopic = topic;
    notify();
    return getState();
  }

  function canUndo() {
    return histories[activeTopic].past.length > 0;
  }

  function canRedo() {
    return histories[activeTopic].future.length > 0;
  }

  function undo() {
    const history = histories[activeTopic];
    if (history.past.length === 0) return getState();

    history.future.push(states[activeTopic]);
    states[activeTopic] = history.past.pop();

    notify();
    return getState();
  }

  function redo() {
    const history = histories[activeTopic];
    if (history.future.length === 0) return getState();

    history.past.push(states[activeTopic]);
    states[activeTopic] = history.future.pop();

    notify();
    return getState();
  }

  /**
   * 뷰 설정을 바꾼다. 히스토리에 쌓지 않는다.
   *
   * undo는 학습 대상인 속성 조작을 되돌리는 수단이다. 여기에 프리뷰 크기까지
   * 섞이면 Ctrl+Z가 방금 바꾼 속성 대신 창 크기를 되돌려 예측이 어긋난다.
   * 게다가 view는 토픽 공유이고 히스토리는 토픽별이라, 넣으면 flex에서 undo한
   * 결과가 grid에도 나타나는 모순이 생긴다.
   *
   * @param {Object} patch  { containerWidth?: Number|null, containerHeight?: Number|null }
   */
  function setView(patch) {
    if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
      throw new TypeError('setView: patch는 객체여야 합니다');
    }

    for (const [key, value] of Object.entries(patch)) {
      if (!VIEW_KEYS.includes(key)) {
        throw new Error(`setView: 알 수 없는 뷰 설정 '${key}'`);
      }
      if (value !== null && !Number.isFinite(value)) {
        throw new TypeError(`setView: '${key}'는 숫자이거나 null이어야 합니다`);
      }
      view[key] = value;
    }

    notify();
    return getState();
  }

  /** 전 항목을 null로 되돌린다. CSS 기본값이 다시 산다. */
  function resetView() {
    Object.assign(view, initialView());
    notify();
    return getState();
  }

  /** 구독 해제 함수를 돌려준다. */
  function subscribe(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('subscribe: 함수가 필요합니다');
    }
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return {
    getState,
    getTopic,
    getTopics,
    dispatch,
    setTopic,
    setView,
    resetView,
    subscribe,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

export default createStore;
