/**
 * challenge.js — 챌린지 탭 (F-09 · F-10 / PRD 7.1 회귀 대상)
 *
 * 목표 레이아웃을 보고 컨테이너 속성을 맞히는 문제 8건.
 *
 * 컨트롤은 ui/controls.js 의 createControl 을 그대로 쓴다. 문제마다 어떤 속성을
 * 물을지는 데이터의 target 이 정하지만, 화면에 세우는 컨트롤은 스키마의
 * container scope 전량이다. 물어본 것만 보여 주면 답이 목록에 드러난다.
 *
 * 상태는 메인 플레이그라운드와 완전히 별개다. 이 파일은 store 를 만들지 않고
 * 주입받는다. main.js 가 별도 인스턴스를 넘기므로 여기서 값을 바꿔도 플레이
 * 그라운드 탭은 그대로다.
 *
 * 진행 상태는 localStorage 에 둔다. 저장이 막혀 있거나(사파리 비공개 모드)
 * 값이 깨져 있어도 화면은 살아야 한다. 읽기·쓰기 전부 감싸 두고, 읽어 온 값은
 * 실제 문제 id 와 대조해 걸러 낸다.
 *
 * 이 파일에 색 값이 없다. 목표 미리보기의 아이템 색은 데이터가 준 순번을
 * --fgp-item-N 별칭으로 옮길 뿐이다.
 */

import { createControl } from './controls.js';
import {
  PANE_CLASS, PANE_SIDE_CLASS, PANE_ITEM_CLASS, PANE_NAME_CLASS, PANE_META_CLASS, PANE_STAGE_CLASS,
} from './explain.js';
import {
  partitionByScope, defaultsFrom, isInactive, deriveState, CONTROL_TYPES,
} from '../core/schema-spec.js';

/**
 * 좌우 2열 틀은 속성 설명 탭이 기준이다. 클래스 이름을 여기 다시 적지 않고
 * 그쪽에서 가져온다 — 두 곳에 적어 두면 언젠가 갈라진다.
 */
export const ROOT_CLASS = 'fgp-challenge';
export const LIST_CLASS = 'fgp-challenge__list';
export const LIST_ITEM_CLASS = 'fgp-challenge__listitem';
export const WORK_CLASS = 'fgp-challenge__work';
export const GOAL_CLASS = 'fgp-challenge__goal';
export const GOAL_ITEM_CLASS = 'fgp-challenge__goalitem';
export const TAG_CLASS = 'fgp-challenge__tag';
export const CONTROLS_CLASS = 'fgp-challenge__controls';
export const PREVIEW_CLASS = 'fgp-challenge__preview';
export const HINT_CLASS = 'fgp-challenge__hint';
export const RESULT_CLASS = 'fgp-challenge__result';
export const PROGRESS_CLASS = 'fgp-challenge__progress';
export const SELECTED_CLASS = 'is-selected';
export const SOLVED_CLASS = 'is-solved';
export const MATCH_CLASS = 'is-match';
export const MISMATCH_CLASS = 'is-mismatch';

export const STORAGE_KEY = 'fgp.challenge.progress.v1';

/** 목표 미리보기의 색 단계. components.css 가 준비해 둔 만큼만 쓴다. */
const ACCENT_COUNT = 8;

/**
 * 답안 프리뷰 컨테이너가 넓어질 수 있는 한계.
 *
 * components.css 의 .fgp-challenge__preview .fgp-preview__container 가 같은 값으로
 * max-width 를 건다 (--sp-16 × 16 = 1024). 아이템 폭을 이 값에 맞춰 계산하므로
 * 둘은 짝이다. 한쪽만 바꾸면 줄 수가 어긋난다.
 */
const REFERENCE_WIDTH = 1024;

/** 줄 넘김 문제에서 최소한 이만큼은 줄이 나와야 한다. */
const MIN_ROWS = 2;

/** 줄이 넘어갈 일이 없는 문제의 아이템 크기. v0.1 부터 쓰던 값이다. */
const PLAIN_ITEM = { width: 80, height: 60 };

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

/* --------------------------------------------------------------------------
   채점

   값을 정규형 문자열로 옮겨 놓고 비교한다. 원시값을 그대로 === 하면 두 가지가
   깨진다. track-list 는 객체 배열이라 참조 비교가 되어 값이 같아도 늘 실패하고,
   areas 는 같은 판을 한 줄로 적었느냐 줄바꿈으로 적었느냐에 따라 갈린다.

   정규화는 컨트롤 타입이 이미 들고 있는 parse · serialize 짝을 부르는 것이
   전부다. 여기에 속성 이름이 등장하지 않는다 — 어떤 타입이 오든 CONTROL_TYPES
   가 답하고, 새 컨트롤 타입이 생겨도 이 함수는 그대로다.

   같은 값을 태그 표시에도 쓴다. 배열을 그대로 찍으면 [object Object] 가 나온다.

   ── ignore 에 대하여 ──────────────────────────────────────────────────────

   ignore 는 target 에 있는 키를 채점에서 빼는 장치다. 그런데 target 에 없는
   키는 애초에 채점되지 않으므로, target 에 없는 키만 담은 ignore 는 아무 일도
   하지 않는다. Flex 40 건이 전부 그런 상태다 — 실제로 걸러지는 항목이 0 건이다.

   남겨 둔 이유는 지우려면 데이터 40 건을 건드려야 하고 얻는 것이 없어서다.
   새로 쓰는 데이터에는 넣지 않는다. 채점에서 빼고 싶은 속성은 target 에서
   빼면 된다.
   -------------------------------------------------------------------------- */

/**
 * 값을 그 컨트롤 타입의 정규형 문자열로 옮긴다.
 *
 * 스키마 항목을 못 찾으면 문자열화만 한다. 그래야 스키마를 넘기지 않고 부른
 * 옛 호출도 enum 문제에서는 예전과 똑같이 동작한다.
 *
 * @param {Object|undefined} entry   스키마 항목
 * @param {*} value                  상태값 또는 데이터에 적힌 정답값
 * @returns {string}
 */
export function normalizeValue(entry, value) {
  const spec = CONTROL_TYPES[entry?.control];
  if (!spec) return String(value ?? '');

  try {
    return String(spec.serialize(spec.parse(value)));
  } catch {
    // 계약이 읽지 못하는 값은 적힌 대로 둔다. 여기서 던지면 채점이 멈춘다.
    return String(value ?? '');
  }
}

/**
 * @param {Object} challenge
 * @param {Object} container   지금 답안의 컨테이너 값
 * @param {Array}  [schema]    토픽 스키마. 없으면 문자열 비교로 떨어진다
 * @returns {{results: Array, correct: number, total: number, solved: boolean}}
 */
export function checkAnswer(challenge, container = {}, schema = []) {
  const ignore = new Set(challenge.ignore ?? []);
  const byProp = new Map(schema.map((e) => [e.jsProp, e]));

  const results = Object.entries(challenge.target)
    .filter(([key]) => !ignore.has(key))
    .map(([key, expected]) => {
      const entry = byProp.get(key);
      const want = normalizeValue(entry, expected);
      const got = normalizeValue(entry, container[key]);
      return { key, expected: want, actual: got, ok: got === want };
    });

  const correct = results.filter((r) => r.ok).length;
  return { results, correct, total: results.length, solved: results.length > 0 && correct === results.length };
}

/* --------------------------------------------------------------------------
   답안이 아이템을 늘리는가

   크기가 박힌 아이템에는 stretch 가 먹지 않는다. 높이가 60px 로 정해져 있으면
   align-items 를 stretch 로 두든 start 로 두든 같은 그림이라 문제가 성립하지
   않는다. 그런 문제는 아이템 크기를 풀어 주어야 한다.

   판정은 wrapsLines 와 같은 방식이다 — 정답값을 빈 요소에 얹고 CSS 파서에게
   무엇으로 풀렸는지 되묻는다. 속성 이름은 데이터가 준 키를 그대로 쓰므로
   코드에 등장하지 않는다. 코드에 적히는 것은 stretch 라는 낱말 하나인데,
   이건 속성이 아니라 "크기를 스스로 정하지 않는다" 는 뜻의 CSS 키워드다.
   wrapsLines 가 nowrap 을 적어 둔 것과 같은 자리다.

   어느 축이 늘어나는지는 묻지 않는다. Grid 에서 justify-items 는 가로,
   align-items 는 세로를 늘리고 Flex 는 주축이 무엇이냐에 따라 갈린다. 축을
   따지려면 속성마다 갈라야 하므로, 늘어나는 답이면 두 축을 함께 푼다.
   -------------------------------------------------------------------------- */

/** 크기를 스스로 정하지 않겠다는 CSS 키워드. */
const STRETCH = 'stretch';

/**
 * @param {Object}   target        문제의 정답값 묶음
 * @param {Array}    [schema]      정규화용 토픽 스키마
 * @param {Document} [doc]
 * @returns {boolean}
 */
export function stretchesItems(target = {}, schema = [], doc = globalThis.document) {
  const probe = doc?.createElement?.('div');
  if (!probe?.style) return false;

  const byProp = new Map(schema.map((e) => [e.jsProp, e]));

  return Object.entries(target).some(([key, value]) => {
    try { probe.style[key] = normalizeValue(byProp.get(key), value); } catch { return false; }
    return probe.style[key] === STRETCH;
  });
}

/* --------------------------------------------------------------------------
   진행 상태 — 저장이 실패해도 앱은 살아야 한다
   -------------------------------------------------------------------------- */

/** 읽어 온 값은 믿지 않는다. 모양이 틀리거나 없는 id 면 조용히 버린다. */
export function readProgress(storage, validIds = []) {
  const allowed = new Set(validIds);

  let raw = null;
  try {
    raw = storage?.getItem?.(STORAGE_KEY) ?? null;
  } catch {
    return [];
  }
  if (typeof raw !== 'string' || raw === '') return [];

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const list = Array.isArray(parsed) ? parsed : parsed?.solved;
  if (!Array.isArray(list)) return [];

  return [...new Set(list.filter((id) => allowed.has(id)))];
}

/** 용량이 찼거나 저장이 막혀 있으면 그냥 못 남긴다. 화면은 계속 돈다. */
export function writeProgress(storage, solved) {
  if (typeof storage?.setItem !== 'function') return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ solved: [...solved] }));
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------------------
   답안 프리뷰의 아이템 크기

   줄 넘김을 묻는 문제인데 아이템이 좁으면 한 줄에 다 들어가 버린다. 그러면
   flex-wrap 을 켜도 그림이 그대로고, align-content 는 정렬할 줄 뭉치가 없어
   문제 자체가 성립하지 않는다. 그래서 그런 문제만 아이템을 넓게 잡는다.
   -------------------------------------------------------------------------- */

/**
 * 이 문제의 정답이 줄을 넘기는가.
 *
 * 속성 이름을 코드에 적지 않는다. 정답값을 빈 요소에 넣어 보고 브라우저가
 * flex-wrap 을 무엇으로 푸는지 CSS 파서에 직접 묻는다. ui/explain.js 가
 * 비율 속성을 가려낼 때 쓴 것과 같은 방법이다.
 */
export function wrapsLines(target = {}, doc = globalThis.document) {
  const probe = doc?.createElement?.('div');
  if (!probe?.style) return false;

  Object.entries(target).forEach(([key, value]) => {
    try { probe.style[key] = value; } catch { /* 알 수 없는 키는 무시한다 */ }
  });

  const wrap = probe.style.flexWrap;
  return Boolean(wrap) && wrap !== 'nowrap';
}

/**
 * 줄 넘김 문제의 아이템 폭.
 *
 * 한 줄에 ceil(개수 / 2) 개가 들어가게 잡는다. 폭이 두 값 사이에 있어야 한다 —
 * 그만큼이 딱 차는 폭(상한)과 하나 더 들어가 버리는 폭(하한)이다. 상한에 붙이면
 * 컨테이너가 기준보다 조금만 좁아도 한 줄에 한 개씩 서서 세로 줄처럼 보이므로
 * 가운데를 쓴다. 여유가 양쪽으로 생겨 네 구간 어디서도 두 줄 이상이 나온다.
 *
 * 화면이 좁아지면 한 줄에 더 적게 들어가 줄 수가 늘어난다. 줄어들지는 않는다.
 */
export function itemWidthFor(itemCount, gap, reference = REFERENCE_WIDTH) {
  const perRow = Math.max(1, Math.ceil(itemCount / MIN_ROWS));
  const upper = (reference - (perRow - 1) * gap) / perRow;
  const lower = (reference - perRow * gap) / (perRow + 1);
  return Math.floor((upper + lower) / 2);
}

/* --------------------------------------------------------------------------
   목표 미리보기
   -------------------------------------------------------------------------- */

function buildGoal(challenge, doc) {
  const box = doc.createElement('div');
  box.className = GOAL_CLASS;

  // 문제마다 다른 판이다. 데이터가 준 값을 그대로 얹는다.
  Object.entries(challenge.miniStyle ?? {}).forEach(([key, value]) => { box.style[key] = value; });

  (challenge.accents ?? []).forEach((accent, i) => {
    const item = doc.createElement('div');
    item.className = GOAL_ITEM_CLASS;
    item.textContent = String(i + 1);
    // 색이 아니라 순번이다. 어느 색인지는 tokens.css 의 별칭이 정한다.
    item.style.setProperty('--fgp-item-accent', `var(--fgp-item-${((accent - 1) % ACCENT_COUNT) + 1})`);

    if (challenge.itemWidths?.[i]) item.style.width = challenge.itemWidths[i];
    if (challenge.itemGrows?.[i] !== undefined) item.style.flexGrow = String(challenge.itemGrows[i]);

    box.appendChild(item);
  });

  return box;
}

/* --------------------------------------------------------------------------
   진입점
   -------------------------------------------------------------------------- */

/**
 * @param {Object}   config
 * @param {Array}    config.challenges
 * @param {Array}    config.schema        토픽 스키마
 * @param {Object}   config.store         챌린지 전용 저장소 (메인과 별개 인스턴스)
 * @param {Element}  config.root
 * @param {Object}   [config.storage]     localStorage 호환 객체
 * @param {Document} [config.doc]
 * @returns {{root, previewRoot, select, selected, submit, toggleHint, solved, persisted}}
 */
export function createChallenge(config) {
  const {
    challenges, schema, store, root,
    storage = globalThis.localStorage, doc = globalThis.document,
  } = config;

  if (!Array.isArray(challenges) || challenges.length === 0) throw new Error('createChallenge: 문제 목록이 필요합니다');
  if (!Array.isArray(schema) || schema.length === 0) throw new Error('createChallenge: 스키마가 필요합니다');
  if (!store) throw new Error('createChallenge: 저장소가 필요합니다');
  if (!root) throw new Error('createChallenge: root 요소가 필요합니다');
  if (!doc) throw new Error('createChallenge: document를 찾을 수 없습니다');

  root.classList.add(ROOT_CLASS);
  root.classList.add(PANE_CLASS);

  const entries = partitionByScope(schema).container;
  const byProp = new Map(schema.map((e) => [e.jsProp, e]));
  const ids = challenges.map((c) => c.id);
  const solved = new Set(readProgress(storage, ids));

  /* ---- 문제 목록 ---- */
  const nav = doc.createElement('nav');
  nav.className = `${PANE_SIDE_CLASS} ${LIST_CLASS}`;
  nav.setAttribute('aria-label', '문제 목록');
  root.appendChild(nav);

  const listItems = challenges.map((challenge) => {
    const button = doc.createElement('button');
    button.className = `${PANE_ITEM_CLASS} ${LIST_ITEM_CLASS}`;
    button.setAttribute('type', 'button');
    button.setAttribute('data-challenge', String(challenge.id));

    // 이름 줄과 설명 줄. 속성 설명 탭과 같은 두 줄 구조다.
    const name = doc.createElement('span');
    name.className = PANE_NAME_CLASS;
    name.textContent = `#${challenge.id} ${challenge.title}`;
    button.appendChild(name);

    const meta = doc.createElement('span');
    meta.className = PANE_META_CLASS;
    meta.textContent = challenge.difficulty;
    button.appendChild(meta);

    nav.appendChild(button);
    return button;
  });

  /* ---- 작업 영역 ---- */
  const work = doc.createElement('section');
  work.className = `${PANE_STAGE_CLASS} ${WORK_CLASS}`;
  root.appendChild(work);

  const head = doc.createElement('header');
  head.className = `${WORK_CLASS}__head`;
  work.appendChild(head);

  const heading = doc.createElement('h3');
  heading.className = `${WORK_CLASS}__title`;
  head.appendChild(heading);

  const progress = doc.createElement('output');
  progress.className = PROGRESS_CLASS;
  head.appendChild(progress);

  const desc = doc.createElement('p');
  desc.className = `${WORK_CLASS}__desc`;
  work.appendChild(desc);

  const goalWrap = doc.createElement('div');
  goalWrap.className = `${GOAL_CLASS}-wrap`;
  const goalLabel = doc.createElement('p');
  goalLabel.className = `${GOAL_CLASS}__label`;
  goalLabel.textContent = '목표 레이아웃';
  goalWrap.appendChild(goalLabel);
  work.appendChild(goalWrap);

  const tagBar = doc.createElement('div');
  tagBar.className = `${TAG_CLASS}bar`;
  work.appendChild(tagBar);

  const controlBar = doc.createElement('div');
  controlBar.className = CONTROLS_CLASS;
  work.appendChild(controlBar);

  // 답안 프리뷰. 그리는 일은 main.js 가 붙이는 renderer 가 한다.
  const previewRoot = doc.createElement('div');
  previewRoot.className = PREVIEW_CLASS;
  work.appendChild(previewRoot);

  const actions = doc.createElement('div');
  actions.className = `${WORK_CLASS}__actions`;
  work.appendChild(actions);

  const makeButton = (action, label, variant) => {
    const button = doc.createElement('button');
    button.className = variant ? `fgp-btn ${variant}` : 'fgp-btn';
    button.setAttribute('type', 'button');
    // main.js 의 data-action 위임과 섞이지 않게 이름을 따로 쓴다
    button.setAttribute('data-challenge-action', action);
    button.textContent = label;
    actions.appendChild(button);
    return button;
  };

  const submitBtn = makeButton('submit', '제출');
  const hintBtn = makeButton('hint', '힌트 보기', 'fgp-btn--quiet');
  makeButton('reset', '처음부터', 'fgp-btn--quiet');

  const hintBox = doc.createElement('p');
  hintBox.className = HINT_CLASS;
  hintBox.hidden = true;
  work.appendChild(hintBox);

  const resultBox = doc.createElement('p');
  resultBox.className = RESULT_CLASS;
  resultBox.setAttribute('role', 'status');
  work.appendChild(resultBox);

  /* ---- 컨트롤 (controls.js 재사용) ---- */
  const controls = entries.map((entry) => {
    const control = createControl(entry, {
      value: store.getState().container[entry.jsProp],
      onChange: (jsProp, value) => store.dispatch({ container: { [jsProp]: value } }),
      doc,
    });
    controlBar.appendChild(control.root);
    return { entry, control };
  });

  /* ---- 상태 ---- */
  let current = challenges[0];
  let goalBox = null;
  let tags = [];

  const containerDefaults = defaultsFrom(schema, 'container');
  const previewGap = Number.parseFloat(containerDefaults.gap) || 0;

  /**
   * 이 문제의 답안 아이템 크기.
   *
   * 크기 키를 아예 빼면 renderer 가 크기를 얹지 않아 auto 가 된다.
   *
   * 둘이 겹치면 줄 넘김이 정한 폭을 남긴다. 줄이 넘어가려면 주축 크기가
   * 정해져 있어야 하고, stretch 가 늘리는 것은 교차축이라 서로 다른 축이다.
   * 폭까지 빼 버리면 아이템이 글자 너비로 줄어 한 줄에 다 들어가고, 그러면
   * 줄 넘김 문제가 성립하지 않는다.
   */
  function sizeFor(challenge) {
    const wraps = wrapsLines(challenge.target, doc);
    const stretches = stretchesItems(challenge.target, schema, doc);

    if (wraps) {
      const width = itemWidthFor(challenge.itemCount, previewGap);
      return stretches ? { width } : { width, height: PLAIN_ITEM.height };
    }

    return stretches ? {} : PLAIN_ITEM;
  }

  function itemsFor(challenge) {
    const base = defaultsFrom(schema, 'item');
    const size = sizeFor(challenge);
    return Array.from({ length: challenge.itemCount }, (_, i) => ({ ...base, id: i + 1, ...size }));
  }

  /** 문제를 열 때마다 답안을 기본값으로 되돌린다. 앞 문제의 답이 남으면 곤란하다. */
  function load(challenge) {
    store.dispatch({
      container: { ...containerDefaults },
      items: itemsFor(challenge),
      selectedId: 1,
    });
  }

  function paintProgress() {
    progress.textContent = `${solved.size}/${challenges.length} 클리어`;
    listItems.forEach((button, i) => {
      button.classList.toggle(SOLVED_CLASS, solved.has(challenges[i].id));
    });
  }

  function buildTags(challenge) {
    tags.forEach((tag) => tagBar.removeChild(tag));

    const ignore = new Set(challenge.ignore ?? []);
    tags = Object.keys(challenge.target)
      .filter((key) => !ignore.has(key))
      .map((key) => {
        const tag = doc.createElement('span');
        tag.className = TAG_CLASS;
        tag.setAttribute('data-target-key', key);
        // 표시 이름도 값도 스키마에서 온다. 카멜케이스를 손으로 되돌리지 않고,
        // 값은 채점과 같은 정규형을 쓴다 — 배열을 그대로 찍으면 [object Object] 다.
        const entry = byProp.get(key);
        tag.textContent = `${entry?.prop ?? key}: ${normalizeValue(entry, challenge.target[key])}`;
        tagBar.appendChild(tag);
        return tag;
      });
  }

  function select(id) {
    const challenge = challenges.find((c) => c.id === id);
    if (!challenge) return;
    current = challenge;

    listItems.forEach((button, i) => {
      const on = challenges[i].id === id;
      button.setAttribute('aria-current', on ? 'true' : 'false');
      button.setAttribute('tabindex', on ? '0' : '-1');
      button.classList.toggle(SELECTED_CLASS, on);
    });

    heading.textContent = `#${challenge.id} ${challenge.title} ${challenge.difficulty}`;
    desc.textContent = challenge.desc;
    hintBox.textContent = challenge.hint;
    hintBox.hidden = true;
    hintBtn.textContent = '힌트 보기';
    resultBox.textContent = solved.has(challenge.id) ? '이미 클리어한 문제입니다.' : '';
    resultBox.className = RESULT_CLASS;

    if (goalBox) goalWrap.removeChild(goalBox);
    goalBox = buildGoal(challenge, doc);
    goalWrap.appendChild(goalBox);

    buildTags(challenge);
    load(challenge);
    paintProgress();
  }

  function submit() {
    const verdict = checkAnswer(current, store.getState().container, schema);

    tags.forEach((tag) => {
      const hit = verdict.results.find((r) => r.key === tag.getAttribute('data-target-key'));
      tag.classList.toggle(MATCH_CLASS, Boolean(hit?.ok));
      tag.classList.toggle(MISMATCH_CLASS, Boolean(hit) && !hit.ok);
    });

    if (verdict.solved) {
      solved.add(current.id);
      writeProgress(storage, solved);
      resultBox.textContent = '정답입니다. 모든 속성이 일치합니다.';
      resultBox.className = `${RESULT_CLASS} ${MATCH_CLASS}`;
    } else {
      resultBox.textContent = `${verdict.correct}/${verdict.total} 일치 — 어긋난 태그를 확인하고 다시 시도하세요.`;
      resultBox.className = `${RESULT_CLASS} ${MISMATCH_CLASS}`;
    }

    paintProgress();
    return verdict;
  }

  function toggleHint(force) {
    const show = force === undefined ? hintBox.hidden : Boolean(force);
    hintBox.hidden = !show;
    hintBtn.textContent = show ? '힌트 숨기기' : '힌트 보기';
    return show;
  }

  /**
   * 컨트롤 밖에서 값이 바뀌어도 패널이 따라간다.
   *
   * 조건부 비활성(F-13 유형 A)도 여기서 갱신한다. 플레이그라운드와 같은 판정을
   * 같은 함수로 한다 — align-content 를 묻는 문제를 nowrap 상태로 열면 그 컨트롤이
   * 왜 죽어 있는지 사유까지 화면에 나온다. 판정은 isInactive 가 하므로 이 파일에
   * 속성명 분기가 없다.
   */
  function sync(state) {
    const derived = deriveState(state);
    controls.forEach(({ entry, control }) => {
      control.sync(state.container[entry.jsProp]);
      control.setInactive(isInactive(entry, { container: state.container, state: derived }));
    });
  }

  const closest = (target, attr, stop) => {
    let node = target;
    while (node && node !== stop) {
      if (node.getAttribute && node.getAttribute(attr) !== null) return node;
      node = node.parentNode;
    }
    return null;
  };

  nav.addEventListener('click', (e) => {
    const button = closest(e.target, 'data-challenge', nav);
    if (button) select(Number(button.getAttribute('data-challenge')));
  });

  nav.addEventListener('keydown', (e) => {
    if (!NEXT_KEYS.has(e.key) && !PREV_KEYS.has(e.key)) return;

    const at = challenges.findIndex((c) => c.id === current.id);
    const step = NEXT_KEYS.has(e.key) ? 1 : -1;
    const next = (at + step + challenges.length) % challenges.length;

    if (e.preventDefault) e.preventDefault();
    select(challenges[next].id);
    if (typeof listItems[next].focus === 'function') listItems[next].focus();
  });

  const ACTIONS = {
    submit: () => submit(),
    hint: () => toggleHint(),
    reset: () => { load(current); resultBox.textContent = ''; resultBox.className = RESULT_CLASS; },
  };

  work.addEventListener('click', (e) => {
    const button = closest(e.target, 'data-challenge-action', work);
    const action = button && ACTIONS[button.getAttribute('data-challenge-action')];
    if (action) action();
  });

  store.subscribe(sync);
  select(current.id);

  return {
    root, previewRoot, select, submit, toggleHint,
    selected: () => current,
    solved: () => [...solved],
    persisted: () => readProgress(storage, ids),
  };
}

export default createChallenge;
