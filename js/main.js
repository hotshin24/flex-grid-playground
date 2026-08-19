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
import { createCompare } from './ui/compare.js';
import { createExamples } from './ui/examples.js';
import { createChallenge, storageKeyFor } from './ui/challenge.js';
import { createGridOverlay } from './ui/grid-overlay.js';
import { FLEX_EXPLAIN_NOTES, FLEX_EXPLAIN_SAMPLES, AXIS_LABELS } from './topics/flex/explain.js';
import { GRID_EXPLAIN_NOTES, GRID_EXPLAIN_SAMPLES, GRID_EXPLAIN_DEMOS, GRID_DISPLAY } from './topics/grid/explain.js';
import { FLEX_PRESETS } from './topics/flex/presets.js';
import { GRID_PRESETS } from './topics/grid/presets.js';
import { FLEX_EXAMPLES } from './topics/flex/examples.js';
import { GRID_EXAMPLES } from './topics/grid/examples.js';
import { FLEX_CHALLENGES } from './topics/flex/challenges.js';
import { GRID_CHALLENGES } from './topics/grid/challenges.js';
import { isInactive, inactiveValues, deriveState, partitionByScope, defaultsFrom } from './core/schema-spec.js';
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

/** 대조 뷰의 접힘 줄 문구. 뒤에 붙는 쌍 수는 데이터가 센다. */
const COMPARE_TITLE = '같은 이름, 다른 동작';

/** 프리뷰 아이템 묶음의 접근명. listbox 에는 이름이 있어야 한다. */
const PREVIEW_LABEL = '프리뷰 아이템';

/** 토픽에서 주입받는다. M3의 Grid는 자기 목록을 여기에 더한다. */
const EXPLAIN = {
  flex: {
    schema: FLEX_SCHEMA,
    notes: FLEX_EXPLAIN_NOTES,
    samples: FLEX_EXPLAIN_SAMPLES,
    axisLabels: AXIS_LABELS,
  },
  grid: {
    schema: GRID_SCHEMA,
    notes: GRID_EXPLAIN_NOTES,
    samples: GRID_EXPLAIN_SAMPLES,
    demos: GRID_EXPLAIN_DEMOS,
    display: GRID_DISPLAY,
  },
};
const PRESETS = { flex: FLEX_PRESETS, grid: GRID_PRESETS };
const EXAMPLES = { flex: FLEX_EXAMPLES, grid: GRID_EXAMPLES };
const CHALLENGES = { flex: FLEX_CHALLENGES, grid: GRID_CHALLENGES };

/** 아이템 개수 한계. 스키마와 무관한 프리뷰 구성값이다. */
const MIN_ITEMS = 1;
const MAX_ITEMS = 20;

/**
 * 아이템 기하값 슬라이더 (개선 3).
 * width·height는 CSS 속성이 아니라 프리뷰 구성값이므로 스키마에 없다.
 * 선택된 아이템 하나에만 적용된다.
 */
/**
 * 아이템 기하값 슬라이더의 범위와 문구.
 *
 * nullText 는 값이 null 일 때 readout 에 적을 말이다. 프리셋이 크기를 null 로
 * 두면(칸을 채우는 프리셋이 그렇다) renderer 가 크기를 얹지 않아 CSS 의
 * width·height: auto 가 산다. 그때 슬라이더 최솟값인 20px 을 적으면 실제로는
 * 자동인 것을 20px 이라고 말하는 셈이라 화면이 거짓말을 한다.
 *
 * 뷰 설정의 '기본값' 과 문구를 나눈 이유는 뜻이 다르기 때문이다. 그쪽은
 * 컨테이너 크기를 정하지 않아 CSS 기본값(vh)이 산다는 뜻이고, 이쪽은 크기가
 * auto 라는 뜻이다 — 늘리는 정렬을 만나면 칸을 채우고 아니면 내용만큼이 된다.
 * 결과가 판에 따라 달라지므로 "칸 채움" 이라 적지 않고 auto 를 그대로 옮긴다.
 */
const ITEM_SIZE_CONTROLS = [
  { key: 'width', label: '너비', min: 20, max: 400, step: 10, nullText: '자동' },
  { key: 'height', label: '높이', min: 20, max: 300, step: 10, nullText: '자동' },
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

const renderer = createRenderer({
  store, schemas: SCHEMAS, root: stage, selectable: true, label: PREVIEW_LABEL,
});

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
  new ResizeObserver(() => {
    overlay.refresh();
    applyMeasured(renderer.remeasure());
  }).observe(stage);
}

/**
 * 측정 결과를 컨트롤 표시에만 옮긴다 (F-13 유형 B·C).
 *
 * ★ 여기서 dispatch 를 부르지 않는다. 부르면 구독자가 반응해 다시 렌더하고
 * 다시 재는 고리가 생긴다 (PRD 8장 리스크). 이 함수가 건드리는 것은 컨트롤의
 * 클래스와 속성뿐이고, 그것들은 렌더를 유발하지 않는다.
 *
 * 어떤 속성이 어떤 측정에 매여 있는지는 스키마가 정하고 판정은 isInactive 가
 * 한다. 이 파일에도 속성명 분기가 없다.
 */
function applyMeasured(measured) {
  const state = store.getState();
  syncContainerControls(state, measured);
  syncItemControls(state, measured);
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
    const { root, sync, setInactive, setValueInactive } = createControl(entry, {
      value: state.container[entry.jsProp],
      onChange: (jsProp, value) => store.dispatch({ container: { [jsProp]: value } }),
    });
    panel.appendChild(root);
    return { entry, sync, setInactive, setValueInactive };
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
function syncContainerControls(state, measured = renderer.getMeasured()) {
  const derived = deriveState(state);

  containerControls.forEach(({ entry, sync, setInactive, setValueInactive }) => {
    sync(state.container[entry.jsProp]);
    setInactive(isInactive(entry, { container: state.container, state: derived, measured }));
    setValueInactive(inactiveValues(entry, measured));
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
    const { root, sync, setInactive, setValueInactive } = createControl(entry, {
      value: selectedItem(state)?.[entry.jsProp],
      onChange: patchSelectedItem,
    });
    itemPanel.appendChild(root);
    return { entry, sync, setInactive, setValueInactive };
  });
}

function syncItemControls(state, measured = renderer.getMeasured()) {
  const target = selectedItem(state);
  const derived = deriveState(state);

  // 고를 아이템이 없으면 보여줄 것도 없다. UI로는 도달하지 않지만
  // 상태만 놓고 보면 가능한 경우라 막아 둔다 (최소 개수는 아래에서 지킨다).
  itemPanelSection.hidden = !target;
  if (!target) return;

  itemTargetLabel.textContent = `${state.items.indexOf(target) + 1}번 아이템`;

  itemControls.forEach(({ entry, sync, setInactive, setValueInactive }) => {
    sync(target[entry.jsProp]);
    setInactive(isInactive(entry, { container: state.container, state: derived, measured }));
    setValueInactive(inactiveValues(entry, measured));
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
 * 속성 설명 탭. 토픽이 바뀌면 다시 짓는다.
 *
 * 데모는 정적 스냅숏이라 store 를 건드리지 않는다. 콘텐츠가 통째로 달라지므로
 * 갱신이 아니라 새로 만드는 편이 맞다 — 스키마도 사례도 판 설정도 전부 바뀐다.
 */
const explainRoot = document.getElementById(panelId('explain'));

function buildExplain(topic) {
  const config = EXPLAIN[topic];
  resetPanel('explain');
  if (!config) return;
  createExplain({ ...config, root: explainRoot });
  buildCompare(topic);
}

/**
 * Flex ↔ Grid 대조 (GR-09).
 *
 * 속성 설명 탭 안에 접힌 채로 붙는다. PRD 9번 열린 결정 사항 3을 그렇게 닫았다 —
 * 근거는 compare.js 머리말에 적었다.
 *
 * 지금 보는 토픽이 왼쪽에 온다. 어느 토픽에서 들어와도 자기 쪽이 먼저 보이는
 * 편이 읽기 쉽다. 짝은 relatedTo 가 정하므로 순서만 바뀐다.
 *
 * store 를 건드리지 않는다. 값이 고정된 정적 스냅숏이다.
 */
function buildCompare(topic) {
  const other = store.getTopics().find((name) => name !== topic);
  if (!other || !EXPLAIN[other]) return;

  // 속성 설명 탭이 쓰는 판 설정을 그대로 넘긴다. 두 화면이 같은 그림을 쓴다.
  const side = (key) => ({
    key,
    label: TOPIC_LABELS[key] ?? key,
    schema: SCHEMAS[key],
    display: EXPLAIN[key].display,
    demos: EXPLAIN[key].demos,
  });

  createCompare({
    left: side(topic),
    right: side(other),
    host: explainRoot,
    title: COMPARE_TITLE,
  });
}

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

/**
 * 콘텐츠를 다시 짓기 전에 패널을 비운다.
 *
 * 안내 문구는 패널의 직계 자식이어야 한다 — components.css 가
 * `.is-topic-pending > .fgp-topic-pending` 으로 고른다. 그냥 비우면 문구까지
 * 딸려 나가고, 그 뒤로는 떨어져 나간 노드에 글자만 넣게 되어 안내가 영영
 * 뜨지 않는다. 비운 자리에 도로 붙인다.
 */
function resetPanel(name) {
  const host = tabPanels.get(name);
  clear(host);
  host.appendChild(pendingNotes.get(name));
}

function syncTabs(state) {
  tabs.sync(state.tab);
  tabPanels.forEach((panel, name) => {
    if (panel) panel.hidden = name !== state.tab;
  });

  pendingNotes.forEach((note, name) => {
    const ready = Boolean(TAB_CONTENT[name][state.topic]);
    note.textContent = ready ? '' : `${TOPIC_LABELS[state.topic] ?? state.topic} 콘텐츠는 후속 단계에서 만듭니다.`;
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
   실전 예제 (F-08 · GR-07)

   속성 설명 탭과 같다. 토픽이 바뀌면 다시 짓는다 — 예제는 고정 콘텐츠라
   store 와 무관하고, 목록도 카테고리 필터도 통째로 갈리므로 갱신할 것이
   없다. 복사는 플레이그라운드와 같은 copyText 를 쓴다.

   카테고리 목록은 넘겨받은 예제에서 나온다. 여기에도 ui/examples.js 에도
   카테고리 이름이 없으므로, 토픽이 다른 카테고리를 쓰더라도 이 줄은 그대로다.
   -------------------------------------------------------------------------- */

const examplesRoot = document.getElementById(panelId('examples'));

function buildExamples(topic) {
  const examples = EXAMPLES[topic];
  resetPanel('examples');
  if (!examples) return;
  createExamples({ examples, root: examplesRoot, onCopy: (text, button) => copyText(text, button) });
}

/* --------------------------------------------------------------------------
   챌린지 (F-09 · F-10 · GR-08)

   저장소를 하나 더 만든다. 챌린지에서 속성을 만져도 플레이그라운드 탭은 그대로
   여야 하므로, 같은 인스턴스를 나눠 쓸 수 없다. 프리뷰는 같은 renderer 를
   붙인다 — 그리는 규칙은 어느 탭이든 같아야 한다.

   토픽이 바뀌면 다시 짓는다. 문제도 스키마도 컨트롤도 통째로 갈리므로 갱신할
   것이 없다. 프리뷰 마운트 지점이 새로 생기니 renderer 도 함께 갈아 끼운다 —
   옛 것을 destroy 하지 않으면 사라진 DOM 을 붙든 구독이 쌓인다.

   진행 기록은 토픽별 키로 나눈다. 한 키를 나눠 쓰면 Flex #1 을 푼 기록이
   Grid #1 에도 클리어로 나타난다.
   -------------------------------------------------------------------------- */

const challengeStore = createStore(SCHEMAS, { topic: initial.topic });
const challengeRoot = document.getElementById(panelId('challenge'));

let challenge = null;
let challengeRenderer = null;

function buildChallenge(topic) {
  challengeRenderer?.destroy();
  challengeRenderer = null;
  challenge = null;

  resetPanel('challenge');

  const challenges = CHALLENGES[topic];
  if (!challenges) return;

  // 컨트롤을 세우기 전에 저장소를 옮긴다. 아니면 앞 토픽의 값으로 그린다.
  challengeStore.setTopic(topic);

  challenge = createChallenge({
    challenges,
    schema: SCHEMAS[topic],
    store: challengeStore,
    root: challengeRoot,
    storageKey: storageKeyFor(topic),
  });

  challengeRenderer = createRenderer({
    store: challengeStore, schemas: SCHEMAS, root: challenge.previewRoot,
  });
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
   아이템 선택 — 눌러서 고르고, 화살표로 옮겨 다닌다 (F-05)

   아이템 속성 여섯~일곱 종과 크기 슬라이더가 전부 고른 아이템 하나를 대상으로
   한다. 고르는 길이 마우스뿐이면 키보드만 쓰는 사람은 1번에 갇혀 나머지
   아이템에 어떤 값도 줄 수 없다.

   ── 화살표를 시각 순서가 아니라 DOM 순서에 맞춘 이유 ─────────────────────

   프리뷰의 시각 순서는 flex-direction · grid-auto-flow · wrap-reverse 에 따라
   뒤집힌다. 그런데 그 속성들이야말로 지금 학습자가 만지고 있는 대상이다.
   화살표를 시각 순서에 묶으면, row 에서 오른쪽이던 "다음" 이 column 으로
   바꾸는 순간 아래로 옮겨간다 — 속성을 배우려고 값을 바꿀 때마다 조작 규칙
   자체가 흔들린다.

   아이템에는 1부터 번호가 찍혀 있고 컨트롤 패널도 "선택된 아이템 3" 이라고
   적는다. 사용자의 머릿속 순서는 그 번호이지 픽셀 자리가 아니다. 그래서
   번호 순서, 곧 DOM 순서로 간다.

   대신 방향을 하나로 묶지 않는다. 오른쪽·아래가 다음, 왼쪽·위가 이전이다.
   세로로 쌓인 판에서는 아래 화살표가, 가로로 늘어선 판에서는 오른쪽 화살표가
   자연스럽게 "다음" 으로 읽힌다. controls.js 의 enum 컨트롤과 같은 규칙이다.
   Home · End 도 받는다 — 스무 개에서 끝으로 가는 데 열아홉 번을 누를 수는 없다.
   -------------------------------------------------------------------------- */

const NEXT_ITEM_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREV_ITEM_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

const itemElAt = (target) => (typeof target?.closest === 'function'
  ? target.closest('[data-item-id]')
  : null);

/** 고른 아이템으로 포커스를 옮긴다. 렌더가 끝난 뒤라야 tabindex 가 0 이다. */
function focusItem(id) {
  const el = stage.querySelector(`[data-item-id="${id}"]`);
  if (el && typeof el.focus === 'function') el.focus();
}

stage.addEventListener('click', (event) => {
  const el = itemElAt(event.target);
  if (!el) return;
  store.dispatch({ selectedId: Number(el.dataset.itemId) });
});

stage.addEventListener('keydown', (event) => {
  if (!itemElAt(event.target)) return;

  const { items, selectedId } = store.getState();
  if (items.length === 0) return;

  const at = items.findIndex((item) => item.id === selectedId);
  const from = at === -1 ? 0 : at;

  let next = null;
  if (NEXT_ITEM_KEYS.has(event.key)) next = (from + 1) % items.length;
  else if (PREV_ITEM_KEYS.has(event.key)) next = (from - 1 + items.length) % items.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = items.length - 1;
  else return;

  // 방향키가 페이지를 스크롤하지 않게 막는다. 프리뷰 안에서만 움직인다.
  event.preventDefault();

  const id = items[next].id;
  store.dispatch({ selectedId: id });
  focusItem(id);
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
  buildExplain(state.topic);
  buildExamples(state.topic);
  buildChallenge(state.topic);
}

/**
 * 다음 프레임에 한 번 더 재고 그린다.
 *
 * 상태가 바뀐 직후에는 배치가 아직 끝나지 않았다. 컨테이너 폭에 트랜지션이
 * 걸려 있어 토픽을 갈아탄 순간에 잰 값은 옛 것이고, 그러면 라인 오버레이가
 * 어긋난 자리에 서고 F-13 측정도 한 프레임 뒤처진 판정을 낸다. 두 증상의
 * 원인이 같아 한자리에서 처리한다.
 *
 * 여기서도 dispatch 를 부르지 않는다. 다시 재고 컨트롤 표시만 갈아 끼운다.
 * 프레임 하나에 여러 번 불려도 한 번만 돈다.
 */
let queuedFrame = 0;

function measureAfterPaint() {
  if (typeof requestAnimationFrame !== 'function') return;
  if (queuedFrame) cancelAnimationFrame(queuedFrame);
  queuedFrame = requestAnimationFrame(() => {
    queuedFrame = 0;
    applyMeasured(renderer.remeasure());
  });
}

function sync(state) {
  rebuildForTopic(state);
  // 읽기만 한다. 여기서 dispatch 하면 그대로 무한 루프다.
  overlay.refreshSoon();
  measureAfterPaint();
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

/**
 * 측정 통지 구독. store 구독과 별개 경로다.
 *
 * 순서가 중요하다 — 컨트롤이 세워진 뒤에 걸어야 첫 통지가 헛돌지 않는다.
 * onMeasure 는 등록 즉시 지금 값으로 한 번 부른다.
 */
renderer.onMeasure(applyMeasured);
