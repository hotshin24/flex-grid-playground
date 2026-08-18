/**
 * challenge.js — 챌린지 탭 (F-09 · F-10 / PRD 7.1 회귀 대상)
 *
 * 목표 레이아웃을 보고 컨테이너 속성을 맞히는 문제 8건.
 *
 * 컨트롤은 ui/controls.js 의 createControl 을 그대로 쓴다. 문제마다 어떤 속성을
 * 물을지는 데이터의 target 이 정하지만, 화면에 세우는 컨트롤은 스키마의
 * container scope 전량이다. 물어본 것만 보여 주면 답이 목록에 드러난다.
 * ignore 가 있는 이유도 그것이다 — 만지긴 하되 채점하지 않는 속성이 있다.
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
import { partitionByScope, defaultsFrom } from '../core/schema-spec.js';

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

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

/* --------------------------------------------------------------------------
   채점

   ignore 에 든 키는 target 에 값이 있어도 보지 않는다. 예를 들어 '정중앙 배치'는
   align-content 와 gap 이 무엇이든 통과해야 한다 — 정중앙이라는 목표와 무관한
   속성이기 때문이다.
   -------------------------------------------------------------------------- */

/**
 * @param {Object} challenge
 * @param {Object} container   지금 답안의 컨테이너 값
 * @returns {{results: Array, correct: number, total: number, solved: boolean}}
 */
export function checkAnswer(challenge, container = {}) {
  const ignore = new Set(challenge.ignore ?? []);

  const results = Object.entries(challenge.target)
    .filter(([key]) => !ignore.has(key))
    .map(([key, expected]) => ({ key, expected, actual: container[key], ok: container[key] === expected }));

  const correct = results.filter((r) => r.ok).length;
  return { results, correct, total: results.length, solved: results.length > 0 && correct === results.length };
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

  const entries = partitionByScope(schema).container;
  const byProp = new Map(schema.map((e) => [e.jsProp, e]));
  const ids = challenges.map((c) => c.id);
  const solved = new Set(readProgress(storage, ids));

  /* ---- 문제 목록 ---- */
  const nav = doc.createElement('nav');
  nav.className = LIST_CLASS;
  nav.setAttribute('aria-label', '문제 목록');
  root.appendChild(nav);

  const listItems = challenges.map((challenge) => {
    const button = doc.createElement('button');
    button.className = LIST_ITEM_CLASS;
    button.setAttribute('type', 'button');
    button.setAttribute('data-challenge', String(challenge.id));

    const num = doc.createElement('span');
    num.className = `${LIST_ITEM_CLASS}__num`;
    num.textContent = `#${challenge.id}`;
    button.appendChild(num);

    const title = doc.createElement('span');
    title.className = `${LIST_ITEM_CLASS}__title`;
    title.textContent = challenge.title;
    button.appendChild(title);

    const diff = doc.createElement('span');
    diff.className = `${LIST_ITEM_CLASS}__diff`;
    diff.textContent = challenge.difficulty;
    button.appendChild(diff);

    nav.appendChild(button);
    return button;
  });

  /* ---- 작업 영역 ---- */
  const work = doc.createElement('section');
  work.className = WORK_CLASS;
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

  function itemsFor(challenge) {
    const base = defaultsFrom(schema, 'item');
    return Array.from({ length: challenge.itemCount }, (_, i) => ({ ...base, id: i + 1, width: 80, height: 60 }));
  }

  /** 문제를 열 때마다 답안을 기본값으로 되돌린다. 앞 문제의 답이 남으면 곤란하다. */
  function load(challenge) {
    store.dispatch({
      container: defaultsFrom(schema, 'container'),
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
        // 표시 이름도 스키마에서 온다. 카멜케이스를 손으로 되돌리지 않는다.
        tag.textContent = `${byProp.get(key)?.prop ?? key}: ${challenge.target[key]}`;
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
    const verdict = checkAnswer(current, store.getState().container);

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

  /** 컨트롤 밖에서 값이 바뀌어도 패널이 따라간다. */
  function sync(state) {
    controls.forEach(({ entry, control }) => control.sync(state.container[entry.jsProp]));
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
