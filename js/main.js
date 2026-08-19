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

import { createStore, TABS } from './core/store.js';
import { createRenderer } from './core/renderer.js';
import { createControl, createRangeControl } from './ui/controls.js';
import { createTabs, panelId } from './ui/tabs.js';
import { createExplain } from './ui/explain.js';
import { createExamples } from './ui/examples.js';
import { createChallenge } from './ui/challenge.js';
import { createGridOverlay } from './ui/grid-overlay.js';
import { FLEX_EXPLAIN_NOTES, FLEX_EXPLAIN_SAMPLES, AXIS_LABELS } from './topics/flex/explain.js';
import { FLEX_PRESETS } from './topics/flex/presets.js';
import { FLEX_EXAMPLES } from './topics/flex/examples.js';
import { FLEX_CHALLENGES } from './topics/flex/challenges.js';
import { isInactive, deriveState, partitionByScope, defaultsFrom } from './core/schema-spec.js';
import { generateCode } from './core/codegen.js';
import { FLEX_SCHEMA } from './topics/flex/schema.js';
import { GRID_SCHEMA } from './topics/grid/schema.js';

/**
 * 토픽 레지스트리. store 는 이 키들로 상태와 히스토리를 따로 관리하고,
 * 토픽 목록도 여기서 나온다 — 화면에 토픽 이름을 적어 두지 않는다.
 */
const SCHEMAS = { flex: FLEX_SCHEMA, grid: GRID_SCHEMA };

/** 토픽 버튼에 붙일 표시 이름. 목록 자체는 store.getTopics()가 정한다. */
const TOPIC_LABELS = { flex: 'Flex', grid: 'Grid' };

/** 토픽에서 주입받는다. M3의 Grid는 자기 목록을 여기에 더한다. */
const EXPLAIN = {
  flex: {
    schema: FLEX_SCHEMA,
    notes: FLEX_EXPLAIN_NOTES,
    samples: FLEX_EXPLAIN_SAMPLES,
    axisLabels: AXIS_LABELS,
  },
};
const PRESETS = { flex: FLEX_PRESETS };
const EXAMPLES = { flex: FLEX_EXAMPLES };
const CHALLENGES = { flex: FLEX_CHALLENGES };

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

/**
 * 탭 표시 이름. 탭 목록 자체는 store의 TABS가 정하고 여기는 이름만 붙인다.
 * 없는 탭은 이름 그대로 나오므로 TABS가 늘어나도 화면이 비지 않는다.
 */
const TAB_LABELS = {
  playground: '플레이그라운드',
  explain: '속성 설명',
  examples: '실전 예제',
  challenge: '챌린지',
};

/** view 값을 CSS 사용자 지정 속성으로 흘린다. null이면 지워서 기본값을 되살린다. */
const VIEW_CSS_PROP = {
  containerWidth: '--fgp-view-width',
  containerHeight: '--fgp-view-height',
};

const store = createStore(SCHEMAS);
const stage = document.getElementById('fgp-preview');

const renderer = createRenderer({ store, schemas: SCHEMAS, root: stage });

/* --------------------------------------------------------------------------
   라인 번호 오버레이 (GR-05)

   renderer 가 그린 결과를 읽어 그 위에 겹친다. 프리뷰 DOM 을 만들지 않으므로
   renderer 를 고칠 일이 없다. 잰 값은 오버레이 안에만 남는다 — store 에 넣으면
   렌더가 다시 유발돼 무한 루프가 된다.

   토픽을 묻지 않는다. 브라우저가 계산한 grid-template-columns 가 'none' 이면
   그리드가 아니라는 뜻이고 그때 스스로 사라진다. Flex 에 라인 개념이 없다는
   사실을 코드가 아니라 브라우저가 말해 준다.

   처음부터 켜 둔다. 이 기능이 있는 이유가 "결과를 읽을 수단이 없다" 이므로,
   꺼진 채로 두면 필요한 사람이 있는 줄도 모른다. Grid 에서만 나타나므로
   Flex 화면이 시끄러워질 일도 없다.
   -------------------------------------------------------------------------- */

const overlay = createGridOverlay({
  getContainer: renderer.getContainer,
  root: stage,
  toolbar: document.getElementById('fgp-preview-tools'),
});

// 레이아웃만 달라져도 라인 자리가 바뀐다. 상태 변화로는 잡히지 않는 경로다.
if (typeof ResizeObserver === 'function') {
  new ResizeObserver(() => overlay.refresh()).observe(stage);
}

/* --------------------------------------------------------------------------
   컨트롤 — 스키마의 container scope 항목에서 자동 생성
   여기에 속성 이름이 등장하지 않는다는 점이 이 설계의 전부다.
   -------------------------------------------------------------------------- */

const panel = document.getElementById('fgp-controls');
const initial = store.getState();

/**
 * 컨트롤은 토픽이 바뀔 때마다 다시 만든다.
 *
 * 속성 목록도 컨트롤 종류도 스키마가 정하므로, 여기서 하는 일은 "지금 토픽의
 * 스키마를 다시 순회한다" 하나뿐이다. Flex 6개든 Grid 12개든 코드가 같다.
 * 아직 구현하지 않은 컨트롤 종류(track-list · area-grid · span · text)는
 * controls.js 가 자리만 만들어 data-pending 을 붙인다 — 누락이 아니라 예정이다.
 */
let containerControls = [];
let itemControls = [];

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function buildContainerControls(topic, state) {
  clear(panel);
  containerControls = partitionByScope(SCHEMAS[topic]).container.map((entry) => {
    const { root, sync, setInactive } = createControl(entry, {
      value: state.container[entry.jsProp],
      onChange: (jsProp, value) => store.dispatch({ container: { [jsProp]: value } }),
    });
    panel.appendChild(root);
    return { entry, sync, setInactive };
  });
}

/**
 * undo처럼 컨트롤 밖에서 상태가 바뀌면 패널도 따라가야 한다.
 *
 * 조건부 비활성(F-13 유형 A)도 여기서 갱신한다. 판정은 isInactive가 하고
 * 컨트롤은 결과만 받으므로, 이 파일에도 controls.js에도 속성명 분기가 없다.
 * flex-wrap을 wrap으로 바꾸면 align-content가 즉시 살아나는 것은 이 한 줄
 * 덕분이다.
 */
function syncContainerControls(state) {
  const derived = deriveState(state);

  containerControls.forEach(({ entry, sync, setInactive }) => {
    sync(state.container[entry.jsProp]);
    setInactive(isInactive(entry, { container: state.container, state: derived }));
  });
}

/* --------------------------------------------------------------------------
   아이템 속성 — 선택된 아이템 하나에 적용 (M2)

   컨테이너와 같은 경로다. createControl로 만들고, 차이는 값을 어디서 읽고
   어디에 쓰는지뿐이다. 스키마의 item scope를 그대로 순회하므로 속성이 늘어도
   여기는 손대지 않는다.
   -------------------------------------------------------------------------- */

const itemPanel = document.getElementById('fgp-item-controls');
const itemPanelSection = itemPanel.closest('.fgp-panel__section');
const itemTargetLabel = document.getElementById('fgp-item-props-target');

function buildItemControls(topic, state) {
  clear(itemPanel);
  itemControls = partitionByScope(SCHEMAS[topic]).item.map((entry) => {
    const { root, sync, setInactive } = createControl(entry, {
      value: selectedItem(state)?.[entry.jsProp],
      onChange: patchSelectedItem,
    });
    itemPanel.appendChild(root);
    return { entry, sync, setInactive };
  });
}

function syncItemControls(state) {
  const target = selectedItem(state);
  const derived = deriveState(state);

  // 고를 아이템이 없으면 보여줄 것도 없다. UI로는 도달하지 않지만
  // 상태만 놓고 보면 가능한 경우라 막아 둔다 (최소 개수는 아래에서 지킨다).
  itemPanelSection.hidden = !target;
  if (!target) return;

  itemTargetLabel.textContent = `${state.items.indexOf(target) + 1}번 아이템`;

  itemControls.forEach(({ entry, sync, setInactive }) => {
    sync(target[entry.jsProp]);
    setInactive(isInactive(entry, { container: state.container, state: derived }));
  });
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
   프리셋 (F-11)

   한 번의 dispatch로 끝낸다. 속성을 하나씩 넣으면 히스토리가 그만큼 쌓여
   undo를 여러 번 눌러야 원래대로 돌아간다.
   -------------------------------------------------------------------------- */

const presetBar = document.getElementById('fgp-presets');

/**
 * 프리셋의 아이템을 상태에 넣을 형태로 만든다.
 *
 * 스키마 기본값 위에 프리셋을 얹는다. 프리셋이 빠뜨린 키를 그대로 두면
 * 값이 undefined 인 채로 렌더러에 들어가고, 그게 단축 속성이면 앞서 넣은
 * 개별 속성까지 지운다. 실제로 v0.1에서 옮겨온 프리셋에 flex 키가 없어
 * flex-grow·shrink·basis 가 전부 무효가 됐다.
 *
 * id 체계는 상태가 쥐고 프리셋은 모른다.
 */
function itemsFrom(preset, fallback) {
  const source = preset.items ?? [];
  const count = preset.itemCount ?? source.length;
  if (count === 0) return fallback;

  const base = { ...defaultsFrom(SCHEMAS[store.getTopic()], 'item'), ...(fallback[0] ?? {}) };

  return Array.from({ length: count }, (_, i) => ({
    ...base,
    ...(source[i] ?? source[source.length - 1] ?? {}),
    id: i + 1,
  }));
}

function applyPreset(preset) {
  const state = store.getState();
  const items = itemsFrom(preset, state.items);

  store.dispatch({
    container: preset.container ?? {},
    items,
    selectedId: items[0]?.id ?? null,
  });
}

const presetSection = presetBar.closest('.fgp-panel__section');

/** 프리셋도 토픽 것이다. 없는 토픽에서는 칸 자체를 접는다. */
function buildPresets(topic) {
  clear(presetBar);
  const list = PRESETS[topic] ?? [];
  presetSection.hidden = list.length === 0;

  list.forEach((preset) => {
    const button = document.createElement('button');
    button.className = 'fgp-preset';
    button.type = 'button';
    button.dataset.preset = preset.id;
    button.title = preset.desc;

    const label = document.createElement('span');
    label.className = 'fgp-preset__label';
    label.textContent = preset.label;
    button.appendChild(label);

    const desc = document.createElement('span');
    desc.className = 'fgp-preset__desc';
    desc.textContent = preset.desc;
    button.appendChild(desc);

    presetBar.appendChild(button);
  });
}

presetBar.addEventListener('click', (event) => {
  const button = event.target.closest('[data-preset]');
  if (!button) return;

  const preset = PRESETS[store.getTopic()]?.find((p) => p.id === button.dataset.preset);
  if (preset) applyPreset(preset);
});

/* --------------------------------------------------------------------------
   토픽 전환 (F-01)

   목록은 store.getTopics()가 준다. 이 파일에 토픽 이름을 적어 두지 않으므로
   레지스트리에 하나 더 넣으면 버튼도 따라 늘어난다.

   role="radiogroup" + aria-checked 에 roving tabindex 를 얹는다. 탭 · 카테고리
   필터와 같은 짜임이라 키보드 습관이 화면마다 달라지지 않는다.
   -------------------------------------------------------------------------- */

const topicBar = document.getElementById('fgp-topics');
const TOPICS = store.getTopics();

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

const topicButtons = TOPICS.map((topic) => {
  const button = document.createElement('button');
  button.className = 'fgp-topic';
  button.type = 'button';
  button.setAttribute('role', 'radio');
  button.dataset.topic = topic;
  button.textContent = TOPIC_LABELS[topic] ?? topic;
  topicBar.appendChild(button);
  return button;
});

topicBar.addEventListener('click', (event) => {
  const button = event.target.closest('[data-topic]');
  if (button) store.setTopic(button.dataset.topic);
});

topicBar.addEventListener('keydown', (event) => {
  if (!NEXT_KEYS.has(event.key) && !PREV_KEYS.has(event.key)) return;

  const at = TOPICS.indexOf(store.getTopic());
  const step = NEXT_KEYS.has(event.key) ? 1 : -1;
  const next = (at + step + TOPICS.length) % TOPICS.length;

  event.preventDefault();
  store.setTopic(TOPICS[next]);
  topicButtons[next].focus();
});

function syncTopics(state) {
  topicButtons.forEach((button, i) => {
    const on = TOPICS[i] === state.topic;
    button.setAttribute('aria-checked', on ? 'true' : 'false');
    button.setAttribute('tabindex', on ? '0' : '-1');
    button.classList.toggle('is-selected', on);
  });
  document.getElementById('fgp-topic-badge').textContent = `display: ${state.topic}`;
}

/* --------------------------------------------------------------------------
   탭 (F-02)

   목록은 store의 TABS에서 나온다. 패널은 마크업에 있고, 여기서는 어느 것을
   보일지만 정한다. 탭이 늘면 TABS와 마크업에 패널 하나를 더하면 된다.
   -------------------------------------------------------------------------- */

const tabPanels = new Map(TABS.map((name) => [name, document.getElementById(panelId(name))]));

const tabs = createTabs({
  tabs: TABS,
  labels: TAB_LABELS,
  value: initial.tab,
  root: document.getElementById('fgp-tabs'),
  onSelect: (tab) => store.dispatch({ tab }),
});

/**
 * 속성 설명 탭. 한 번만 만들고 이후에는 손대지 않는다 — 데모는 정적이며
 * 메인 상태와 무관하다. store를 건드리지 않는다.
 *
 * Flex 콘텐츠만 있다. Grid 것은 M3 후속 단계에서 만들고, 그때까지는
 * syncTabs 가 안내 문구로 덮는다.
 */
createExplain({
  ...EXPLAIN[initial.topic],
  root: document.getElementById(panelId('explain')),
});

/**
 * 토픽 데이터가 아직 없는 탭에 붙일 안내.
 *
 * 속성 설명 · 실전 예제 · 챌린지는 Flex 콘텐츠로 한 번만 지어 두었다. Grid 로
 * 바꿨을 때 그 화면이 그대로 남아 있으면 Grid 설명인 줄 읽게 된다. 콘텐츠가
 * 없는 토픽에서는 패널의 원래 내용을 감추고 이 문구만 보인다.
 *
 * 어느 탭에 콘텐츠가 있는지는 레지스트리가 답한다 — 탭 이름을 코드에 적지 않는다.
 */
const TAB_CONTENT = { explain: EXPLAIN, examples: EXAMPLES, challenge: CHALLENGES };

const pendingNotes = new Map(Object.keys(TAB_CONTENT).map((name) => {
  const host = tabPanels.get(name);
  const note = document.createElement('p');
  note.className = 'fgp-topic-pending';
  host.appendChild(note);
  return [name, note];
}));

function syncTabs(state) {
  tabs.sync(state.tab);
  tabPanels.forEach((panel, name) => {
    if (panel) panel.hidden = name !== state.tab;
  });

  pendingNotes.forEach((note, name) => {
    const ready = Boolean(TAB_CONTENT[name][state.topic]);
    note.textContent = ready ? '' : `${TOPIC_LABELS[state.topic] ?? state.topic} 콘텐츠는 M3 후속 단계에서 만듭니다.`;
    tabPanels.get(name).classList.toggle('is-topic-pending', !ready);
  });
}

/* --------------------------------------------------------------------------
   코드 출력 (F-04)

   상태가 바뀔 때마다 다시 만든다. 어떤 속성을 넣고 뺄지는 codegen이 스키마를
   보고 정하므로 여기는 문자열을 붙여 넣는 일만 한다.
   -------------------------------------------------------------------------- */

const codeOut = {
  css: document.getElementById('fgp-code-css'),
  html: document.getElementById('fgp-code-html'),
};

let lastCode = { css: '', html: '' };

function syncCode(state) {
  lastCode = generateCode(state, SCHEMAS[state.topic]);
  codeOut.css.textContent = lastCode.css;
  codeOut.html.textContent = lastCode.html;
}

/**
 * 클립보드 API는 보안 컨텍스트에서만 쓸 수 있다. 태블릿은 http로 접속하므로
 * 그쪽에서는 쓸 수 없어 선택 영역을 이용한 예전 방식으로 넘어간다.
 */
async function copyText(text, button) {
  let ok = false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      ok = true;
    }
  } catch {
    ok = false;
  }

  if (!ok) {
    const holder = document.createElement('textarea');
    holder.value = text;
    holder.setAttribute('readonly', 'readonly');
    holder.classList.add('fgp-visually-hidden');
    document.body.appendChild(holder);
    holder.select();
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(holder);
  }

  const label = button.textContent;
  button.textContent = ok ? '복사됨' : '복사 실패';
  setTimeout(() => { button.textContent = label; }, 1200);
}

/* --------------------------------------------------------------------------
   실전 예제 (F-08)

   속성 설명 탭과 같다. 한 번 만들고 두지 않는다 — 예제는 고정 콘텐츠라
   store 와 무관하다. 복사는 플레이그라운드와 같은 copyText 를 쓴다.
   -------------------------------------------------------------------------- */

createExamples({
  examples: EXAMPLES[initial.topic],
  root: document.getElementById(panelId('examples')),
  onCopy: (text, button) => copyText(text, button),
});

/* --------------------------------------------------------------------------
   챌린지 (F-09 · F-10)

   저장소를 하나 더 만든다. 챌린지에서 속성을 만져도 플레이그라운드 탭은 그대로
   여야 하므로, 같은 인스턴스를 나눠 쓸 수 없다. 프리뷰는 같은 renderer 를
   붙인다 — 그리는 규칙은 어느 탭이든 같아야 한다.
   -------------------------------------------------------------------------- */

const challengeStore = createStore(SCHEMAS);

const challenge = createChallenge({
  challenges: CHALLENGES[initial.topic],
  schema: SCHEMAS[initial.topic],
  store: challengeStore,
  root: document.getElementById(panelId('challenge')),
});

createRenderer({ store: challengeStore, schemas: SCHEMAS, root: challenge.previewRoot });

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
  'copy-css': (button) => copyText(lastCode.css, button),
  'copy-html': (button) => copyText(lastCode.html, button),
};

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  const action = button && ACTIONS[button.dataset.action];
  if (action) action(button);
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

/** 선택된 아이템 하나의 필드를 갈아끼운다. 속성이든 기하값이든 경로는 같다. */
function patchSelectedItem(key, value) {
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
    onChange: patchSelectedItem,
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

/**
 * 토픽이 바뀌면 스키마가 통째로 달라진다. 컨트롤과 프리셋을 다시 짓는다.
 *
 * 나머지는 손대지 않는다 — renderer 는 상태의 topic 을 보고 display 를 정하고,
 * codegen 도 같은 표를 쓰며, store 는 토픽별 상태와 히스토리를 이미 따로
 * 들고 있다. 이 파일만 고치면 되는 것이 M0~M1 설계의 요점이다.
 */
let builtTopic = null;

function rebuildForTopic(state) {
  if (state.topic === builtTopic) return;
  builtTopic = state.topic;

  buildContainerControls(state.topic, state);
  buildItemControls(state.topic, state);
  buildPresets(state.topic);
}

function sync(state) {
  rebuildForTopic(state);
  // 읽기만 한다. 여기서 dispatch 하면 그대로 무한 루프다.
  overlay.refresh();
  syncTopics(state);
  syncItembar(state);
  syncItemSize(state);
  syncItemControls(state);
  applyView(state.view);
  syncViewControls(state.view);
  syncContainerControls(state);
  syncHistoryButtons();
  syncCode(state);
  syncTabs(state);
}

store.subscribe(sync);
sync(store.getState());
