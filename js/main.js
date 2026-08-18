/**
 * main.js — 부품 조립 (M1)
 *
 * store · renderer · controls를 이어 붙인다. 이 파일은 배선만 하고
 * 속성을 알지 못한다. 컨트롤 목록은 전량 스키마에서 나온다.
 *
 * 범위: Flex 토픽 · 플레이그라운드 탭만.
 * 코드 생성 · 탭 전환 · URL · 저장은 M1 범위 밖이다.
 *
 * 아이템 버튼의 이벤트 위임을 여기서 하는 것은 임시다. core/events.js가
 * 생기면 그쪽으로 옮긴다.
 */

import { createStore } from './core/store.js';
import { createRenderer } from './core/renderer.js';
import { createControl, createRangeControl } from './ui/controls.js';
import { FLEX_SCHEMA } from './topics/flex/schema.js';

const SCHEMAS = { flex: FLEX_SCHEMA };

/** 아이템 개수 한계. 스키마와 무관한 프리뷰 구성값이다. */
const MIN_ITEMS = 1;
const MAX_ITEMS = 20;

/**
 * 아이템 기하값 슬라이더 (개선 3).
 * width·height는 CSS 속성이 아니라 프리뷰 구성값이므로 스키마에 없다.
 * 선택된 아이템 하나에만 적용된다.
 */
const ITEM_SIZE_CONTROLS = [
  { key: 'width', label: '너비', min: 20, max: 400, step: 10 },
  { key: 'height', label: '높이', min: 20, max: 300, step: 10 },
];

/**
 * 뷰 설정 슬라이더 범위 (F-06). 스키마 항목이 아니므로 여기서 정의한다.
 * fallback은 값이 null일 때 슬라이더가 놓일 자리이며, 실제 적용값이 아니다 —
 * null이면 CSS 기본값(40vh / 46vh / 62vh)이 그대로 산다.
 */
const VIEW_CONTROLS = [
  { key: 'containerWidth', label: '너비', min: 240, max: 1200, step: 10, fallback: 800 },
  { key: 'containerHeight', label: '높이', min: 120, max: 900, step: 10, fallback: 400 },
];

/** view 값을 CSS 사용자 지정 속성으로 흘린다. null이면 지워서 기본값을 되살린다. */
const VIEW_CSS_PROP = {
  containerWidth: '--fgp-view-width',
  containerHeight: '--fgp-view-height',
};

const store = createStore(SCHEMAS);
const stage = document.getElementById('fgp-preview');

createRenderer({ store, schemas: SCHEMAS, root: stage });

/* --------------------------------------------------------------------------
   컨트롤 — 스키마의 container scope 항목에서 자동 생성
   여기에 속성 이름이 등장하지 않는다는 점이 이 설계의 전부다.
   -------------------------------------------------------------------------- */

const panel = document.getElementById('fgp-controls');
const initial = store.getState();

const containerControls = FLEX_SCHEMA
  .filter((entry) => entry.scope === 'container')
  .map((entry) => {
    const { root, sync } = createControl(entry, {
      value: initial.container[entry.jsProp],
      onChange: (jsProp, value) => store.dispatch({ container: { [jsProp]: value } }),
    });
    panel.appendChild(root);
    return { jsProp: entry.jsProp, sync };
  });

/** undo처럼 컨트롤 밖에서 상태가 바뀌면 패널도 따라가야 한다. */
function syncContainerControls(container) {
  containerControls.forEach(({ jsProp, sync }) => sync(container[jsProp]));
}

/* --------------------------------------------------------------------------
   프리뷰 크기 (F-06)

   스키마를 거치지 않는 별개 경로다. 토픽을 참조하지 않으므로 Grid에도 쓰인다.
   값은 인라인 스타일이 아니라 CSS 사용자 지정 속성으로 넘긴다. 그래야
   지정 안 한 항목에서 components.css의 반응형 기본값이 그대로 산다.
   -------------------------------------------------------------------------- */

const viewPanel = document.getElementById('fgp-view-controls');

const viewControls = VIEW_CONTROLS.map((config) => {
  const control = createRangeControl({
    ...config,
    nullText: '기본값',
    value: initial.view[config.key],
    onChange: (key, value) => store.setView({ [key]: value }),
  });
  viewPanel.appendChild(control.root);
  return { key: config.key, control };
});

function applyView(view) {
  for (const [key, cssProp] of Object.entries(VIEW_CSS_PROP)) {
    const value = view[key];
    if (value === null || value === undefined) stage.style.removeProperty(cssProp);
    else stage.style.setProperty(cssProp, `${value}px`);
  }
}

/** 저장소가 진실이다. 리셋처럼 UI 밖에서 바뀐 값도 슬라이더에 되비친다. */
function syncViewControls(view) {
  viewControls.forEach(({ key, control }) => control.sync(view[key]));
}

/* --------------------------------------------------------------------------
   아이템 추가 · 제거
   -------------------------------------------------------------------------- */

/** 마지막 아이템을 복제해 새 id를 준다. 기하값과 속성은 그대로 이어받는다. */
function appendItem(items) {
  const last = items[items.length - 1];
  const nextId = items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  return [...items, { ...last, id: nextId }];
}

function changeItemCount(step) {
  const { items, selectedId } = store.getState();
  const count = items.length;

  if (step > 0 && count >= MAX_ITEMS) return;
  if (step < 0 && count <= MIN_ITEMS) return;

  const next = step > 0 ? appendItem(items) : items.slice(0, -1);
  const patch = { items: next };

  // 선택된 아이템이 사라졌으면 선택을 마지막으로 옮긴다
  if (!next.some((item) => item.id === selectedId)) {
    patch.selectedId = next[next.length - 1].id;
  }

  store.dispatch(patch);
}

const itembar = document.getElementById('fgp-itembar');

/**
 * 버튼 동작은 패널 전체에 한 번만 위임한다.
 * core/events.js가 생기면 이 표와 위임을 그쪽으로 옮긴다.
 */
const ACTIONS = {
  'item-add': () => changeItemCount(1),
  'item-remove': () => changeItemCount(-1),
  'view-reset': () => store.resetView(),
  'undo': () => store.undo(),
  'redo': () => store.redo(),
};

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  const action = button && ACTIONS[button.dataset.action];
  if (action) action();
});

/* --------------------------------------------------------------------------
   키보드 단축키 (F-07)
   -------------------------------------------------------------------------- */

/** 글자를 입력하는 자리인가. 여기서는 브라우저 기본 undo를 건드리지 않는다. */
const TEXT_INPUT_TYPES = new Set(['text', 'number', 'search', 'url', 'tel', 'email', 'password']);

function isTextEntry(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName !== 'INPUT') return false;
  return TEXT_INPUT_TYPES.has((el.getAttribute('type') || 'text').toLowerCase());
}

document.addEventListener('keydown', (event) => {
  if (!(event.metaKey || event.ctrlKey)) return;
  if (event.key.toLowerCase() !== 'z') return;
  if (isTextEntry(document.activeElement)) return;

  event.preventDefault();
  if (event.shiftKey) store.redo();
  else store.undo();
});

/* --------------------------------------------------------------------------
   아이템 크기 — 선택된 아이템 하나에만 적용 (개선 3)

   컨테이너 크기(뷰 설정)와 달리 이쪽은 상태의 items에 들어 있는 값이라
   dispatch로 흐르고 undo 대상이 된다.
   -------------------------------------------------------------------------- */

const itemSizePanel = document.getElementById('fgp-item-size');

function selectedItem(state) {
  return state.items.find((item) => item.id === state.selectedId) ?? state.items[0];
}

function setSelectedItemSize(key, value) {
  const state = store.getState();
  const target = selectedItem(state);
  if (!target) return;

  store.dispatch({
    items: state.items.map((item) => (item.id === target.id ? { ...item, [key]: value } : item)),
  });
}

const itemSizeControls = ITEM_SIZE_CONTROLS.map((config) => {
  const control = createRangeControl({
    ...config,
    value: selectedItem(initial)?.[config.key],
    onChange: setSelectedItemSize,
  });
  itemSizePanel.appendChild(control.root);
  return { key: config.key, control };
});

const itemSizeLabel = document.getElementById('fgp-item-selected');

function syncItemSize(state) {
  const target = selectedItem(state);
  itemSizeLabel.textContent = target ? `${state.items.indexOf(target) + 1}번` : '없음';
  itemSizeControls.forEach(({ key, control }) => control.sync(target?.[key] ?? null));
}

/* --------------------------------------------------------------------------
   아이템 선택 — 프리뷰를 눌러 고른다 (F-05)
   -------------------------------------------------------------------------- */

stage.addEventListener('click', (event) => {
  const el = event.target.closest('[data-item-id]');
  if (!el) return;
  store.dispatch({ selectedId: Number(el.dataset.itemId) });
});

/* --------------------------------------------------------------------------
   상태 표시
   -------------------------------------------------------------------------- */

const countEl = document.getElementById('fgp-item-count');
const addBtn = itembar.querySelector('[data-action="item-add"]');
const removeBtn = itembar.querySelector('[data-action="item-remove"]');

function syncItembar(state) {
  const count = state.items.length;
  countEl.textContent = `${count}개`;
  addBtn.disabled = count >= MAX_ITEMS;
  removeBtn.disabled = count <= MIN_ITEMS;
}

const undoBtn = document.querySelector('[data-action="undo"]');
const redoBtn = document.querySelector('[data-action="redo"]');

function syncHistoryButtons() {
  undoBtn.disabled = !store.canUndo();
  redoBtn.disabled = !store.canRedo();
}

function sync(state) {
  syncItembar(state);
  syncItemSize(state);
  applyView(state.view);
  syncViewControls(state.view);
  syncContainerControls(state.container);
  syncHistoryButtons();
}

store.subscribe(sync);
sync(store.getState());

document.getElementById('fgp-topic-badge').textContent = `display: ${store.getTopic()}`;
