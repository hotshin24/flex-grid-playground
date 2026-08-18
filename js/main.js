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
import { createControl } from './ui/controls.js';
import { FLEX_SCHEMA } from './topics/flex/schema.js';

const SCHEMAS = { flex: FLEX_SCHEMA };

/** 아이템 개수 한계. 스키마와 무관한 프리뷰 구성값이다. */
const MIN_ITEMS = 1;
const MAX_ITEMS = 12;

const store = createStore(SCHEMAS);

createRenderer({
  store,
  schemas: SCHEMAS,
  root: document.getElementById('fgp-preview'),
});

/* --------------------------------------------------------------------------
   컨트롤 — 스키마의 container scope 항목에서 자동 생성
   여기에 속성 이름이 등장하지 않는다는 점이 이 설계의 전부다.
   -------------------------------------------------------------------------- */

const panel = document.getElementById('fgp-controls');
const initial = store.getState();

FLEX_SCHEMA
  .filter((entry) => entry.scope === 'container')
  .forEach((entry) => {
    panel.appendChild(
      createControl(entry, {
        value: initial.container[entry.jsProp],
        onChange: (jsProp, value) => store.dispatch({ container: { [jsProp]: value } }),
      })
    );
  });

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

itembar.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  if (button.dataset.action === 'item-add') changeItemCount(1);
  if (button.dataset.action === 'item-remove') changeItemCount(-1);
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

store.subscribe(syncItembar);
syncItembar(store.getState());

document.getElementById('fgp-topic-badge').textContent = `display: ${store.getTopic()}`;
