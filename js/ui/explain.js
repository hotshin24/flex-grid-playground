/**
 * explain.js — 속성 설명 탭 (F-02 / PRD 7.1 회귀 대상)
 *
 * 속성 목록과 값별 데모를 스키마에서 만든다. 설명 문장은 schema.js의
 * desc · tip · values[].desc 를 그대로 쓰고, 스키마에 없는 보충만
 * 토픽별 explain.js 에서 받는다. 이 파일에 문장이 없다.
 *
 * 데모는 renderer.js를 쓰지 않는다. 근거는 아래 buildDemo 주석에 적었다.
 * 값 → CSS 문자열 변환만 renderer의 toCssValue를 재사용해, 데모와 프리뷰가
 * 같은 표기를 내도록 맞춘다.
 *
 * store를 import하지 않는다. 데모는 메인 상태와 무관한 정적 스냅숏이다.
 */

import { toCssValue } from '../core/renderer.js';

export const ROOT_CLASS = 'fgp-explain';
export const NAV_CLASS = 'fgp-explain__nav';
export const NAV_ITEM_CLASS = 'fgp-explain__navitem';

/** 좌우 2열 탭 공통 틀. 실전 예제 · 챌린지가 같은 클래스를 쓴다 */
export const PANE_CLASS = 'fgp-pane';
export const PANE_SIDE_CLASS = 'fgp-pane__side';
export const PANE_ITEM_CLASS = 'fgp-pane__item';
export const PANE_NAME_CLASS = 'fgp-pane__item__name';
export const PANE_META_CLASS = 'fgp-pane__item__meta';
export const PANE_STAGE_CLASS = 'fgp-pane__stage';
export const DETAIL_CLASS = 'fgp-explain__detail';
export const CASE_CLASS = 'fgp-explain__case';
export const DEMO_CLASS = 'fgp-explain__demo';
export const DEMO_ITEM_CLASS = 'fgp-explain__demoitem';
export const AXIS_CLASS = 'fgp-explain__axis';
export const LINES_CLASS = 'fgp-explain__lines';
export const LINE_CLASS = 'fgp-explain__line';
export const RATIO_CLASS = 'fgp-explain__demo--ratio';
export const SELECTED_CLASS = 'is-selected';

/** 데모 아이템 크기 갈래. 스키마 demo.itemSizes 가 고른다. */
const ITEM_SIZES = {
  default: [{ w: 56, h: 44 }],
  wide: [{ w: 92, h: 40 }],
  varied: [{ w: 56, h: 28 }, { w: 56, h: 52 }, { w: 56, h: 40 }],
};

const AXES = ['row', 'column'];

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

/* --------------------------------------------------------------------------
   문장 — 스키마의 desc·tip 에는 <strong>·<code> 같은 인라인 표기가 섞여 있다.
   innerHTML 없이 그 강조를 살리려고 최소 파서를 둔다.
   -------------------------------------------------------------------------- */

const INLINE_TAGS = new Set(['strong', 'code', 'em', 'b', 'i']);

function appendRich(target, text, doc) {
  const source = String(text ?? '');
  const pattern = /<(\/?)([a-z]+)>/gi;
  let at = 0;
  let open = null;

  const put = (chunk) => {
    if (chunk === '') return;
    if (open) {
      const el = doc.createElement(open);
      el.textContent = chunk;
      target.appendChild(el);
    } else {
      const span = doc.createElement('span');
      span.textContent = chunk;
      target.appendChild(span);
    }
  };

  let match = pattern.exec(source);
  while (match) {
    put(source.slice(at, match.index));
    const [, closing, tag] = match;
    if (INLINE_TAGS.has(tag.toLowerCase())) open = closing ? null : tag.toLowerCase();
    at = match.index + match[0].length;
    match = pattern.exec(source);
  }
  put(source.slice(at));

  return target;
}

/* --------------------------------------------------------------------------
   데모

   renderer.js를 쓰지 않는 이유:
   renderer는 store를 구독해 값이 바뀔 때마다 DOM을 재사용하며 갱신하는 물건이다.
   여기 데모는 값이 고정된 스냅숏이라 구독도 diffing도 필요 없고, 재사용하려면
   데모 하나마다 store를 하나씩 만들어야 한다. 속성 12개 × 값 3~7개 × 축 2개면
   store가 100개 가까이 생긴다. 게다가 renderer는 컨테이너 크기 같은 메인 프리뷰
   전용 상태를 함께 다룬다. 정적 스냅숏에는 맞지 않는 도구다.
   -------------------------------------------------------------------------- */

/**
 * 이 값이 남거나 모자란 공간의 배분에 끼어드는가.
 *
 * 배분에 참여하는 아이템이 대상 하나뿐이면 비율이 1이든 2이든 혼자 다 가져가
 * 결과가 같아진다. flex-grow의 "1과 2를 주면 1:2로 나눠 갖습니다"를 보여주려면
 * 형제도 기준선을 들고 있어야 한다.
 *
 * 어느 속성이 그런지는 코드에 적지 않는다. 빈 요소에 값을 넣어보고 브라우저가
 * flex-grow·flex-shrink로 풀어내는지 CSS 파서에 직접 묻는다. 단축 속성이든
 * 개별 속성이든, 나중에 무엇이 늘든 같은 방식으로 판정된다.
 */
function sharesFreeSpace(entry, value, doc) {
  if (entry.scope !== 'item') return false;

  const probe = doc.createElement('div');
  if (!probe.style) return false;

  try {
    probe.style[entry.jsProp] = toCssValue(entry, value);
  } catch {
    return false;
  }

  return Boolean(probe.style.flexGrow || probe.style.flexShrink);
}

function sizeAt(kind, index) {
  const set = ITEM_SIZES[kind] ?? ITEM_SIZES.default;
  return set[index % set.length];
}

/**
 * 라인 번호 띠 (GR-05 를 데모에 옮긴 것).
 *
 * grid-overlay.js 를 재사용하지 않는다. 그쪽은 살아 있는 컨테이너를 재고 프레임을
 * 미뤄 다시 그리는 물건인데, 여기 데모는 값이 고정된 정적 스냅숏이다 —
 * renderer 를 재사용하지 않는 것과 같은 이유다.
 *
 * 대신 데모가 쓰는 트랙 목록을 그대로 써서 번호를 배치한다. 재지 않고도 자리가
 * 정확한 이유는, 띠가 데모와 같은 격자를 쓰고 각 번호를 트랙 경계에 붙이기
 * 때문이다. n번 라인은 n번 트랙의 시작, 마지막 라인은 마지막 트랙의 끝이다.
 */
/**
 * 트랙 목록에 트랙이 몇 개인가.
 *
 * repeat(3, 1fr) 은 토큰 두 개지만 트랙 셋이고, minmax(120px, 1fr) 은 공백이
 * 들어 있어도 트랙 하나다. 라인 번호를 매기려면 이 둘을 풀어야 한다.
 * 계약의 parseTrackList 는 repeat 를 읽지 않으므로 여기서 세는 만큼만 푼다 —
 * 화면에 번호를 찍기 위한 계산이고 상태로 나가지 않는다.
 */
export function trackCount(template) {
  const tokens = String(template ?? '').trim().match(/[^\s()]+\([^)]*\)|[^\s()]+/g) ?? [];

  return tokens.reduce((total, token) => {
    const repeat = token.match(/^repeat\(\s*(\d+)\s*,(.*)\)$/);
    if (!repeat) return total + 1;

    const inner = repeat[2].trim().match(/[^\s()]+\([^)]*\)|[^\s()]+/g) ?? [];
    return total + Number(repeat[1]) * inner.length;
  }, 0);
}

function buildLines(template, count, doc) {
  const strip = doc.createElement('div');
  strip.className = LINES_CLASS;
  strip.style.gridTemplateColumns = template;

  for (let i = 1; i <= count + 1; i += 1) {
    const label = doc.createElement('span');
    label.className = LINE_CLASS;
    // 같은 라인의 두 이름을 함께 적는다. 음수가 어디를 가리키는지 바로 읽힌다.
    label.textContent = `${i} / ${i - count - 2}`;
    label.style.gridColumn = String(Math.min(i, count));
    label.setAttribute('data-edge', i > count ? 'end' : 'start');
    strip.appendChild(label);
  }

  return strip;
}

function buildDemo(entry, value, axis, doc, config = {}) {
  const base = { ...(entry.demo ?? {}), ...(config.demos?.[entry.prop] ?? {}) };

  /**
   * 값 하나에만 다른 판을 쓸 수 있다.
   *
   * 대개는 같은 판에서 값만 갈아 끼우는 것이 옳다 — 그래야 무엇이 달라졌는지
   * 값 탓이라고 읽힌다. 다만 값이 요구하는 조건이 서로 달라 한 판에 담기지
   * 않는 경우가 있다. grid-auto-flow 의 dense 가 그렇다: 행 흐름의 구멍은
   * 열을 스팬하는 아이템이, 열 흐름의 구멍은 행을 스팬하는 아이템이 만든다.
   * 한 판에 둘을 같이 두면 어느 쪽에도 구멍이 안 생긴다.
   *
   * 짝끼리는 같은 판을 쓴다. row 와 row dense 가 한 판, column 과 column dense
   * 가 다른 한 판이다. 비교는 짝 안에서 일어나므로 공정하다.
   */
  const demo = { ...base, ...(base.byValue?.[String(value)] ?? {}) };
  const count = demo.itemCount ?? 3;

  const box = doc.createElement('div');
  // 비율 속성이면 형제도 배분에 참여시킨다. 나머지 데모는 형제가 고정이라야
  // 대상 하나만 달라지는 것이 보이므로 기본값을 그대로 둔다.
  box.className = sharesFreeSpace(entry, value, doc) ? `${DEMO_CLASS} ${RATIO_CLASS}` : DEMO_CLASS;

  // 컨테이너 스타일: 토픽 기본 → 데모 설정 → 축 → 속성 값 순으로 얹는다
  if (config.display) box.style.display = config.display;
  Object.entries(demo.containerStyle ?? {}).forEach(([k, v]) => { box.style[k] = v; });
  if (axis) box.style.flexDirection = axis;
  if (entry.scope === 'container') box.style[entry.jsProp] = toCssValue(entry, value);

  for (let i = 0; i < count; i += 1) {
    const item = doc.createElement('div');
    item.className = DEMO_ITEM_CLASS;
    item.textContent = String(i + 1);

    /**
     * 'fill' 은 크기를 주지 않는다는 뜻이다.
     *
     * 아이템에 크기가 박혀 있으면 stretch 계열 값이 할 일이 없다 — Flex 의
     * align-items: stretch 가 죽는 것과 같은 이유다. 칸을 채우는 모습을 보여야
     * 하는 데모에서는 크기를 비워 둔다.
     */
    if (demo.itemSizes !== 'fill') {
      const { w, h } = sizeAt(demo.itemSizes, i);
      item.style.width = `${w}px`;
      item.style.height = `${h}px`;
    }
    item.style.setProperty('--fgp-item-accent', `var(--fgp-item-${(i % 8) + 1})`);

    // 데모가 특정 아이템에 자리를 지정해야 하는 경우 (dense 처럼 빈 칸이 필요할 때)
    Object.entries(demo.itemStyles?.[i] ?? {}).forEach(([k, v]) => { item.style[k] = v; });

    // 아이템 속성은 첫 아이템에만 준다. 전부 같은 값을 주면 비교가 되지 않는다.
    if (entry.scope === 'item' && i === 0) {
      item.style[entry.jsProp] = toCssValue(entry, value);
      item.setAttribute('data-target', 'true');
    }

    box.appendChild(item);
  }

  // 라인 번호가 필요한 속성은 데모 설정이 말한다. 속성 이름을 여기 적지 않는다.
  if (!demo.lines) return box;

  const wrap = doc.createElement('div');
  wrap.className = `${DEMO_CLASS}-wrap`;

  const template = demo.containerStyle?.gridTemplateColumns ?? `repeat(${count}, 1fr)`;
  wrap.appendChild(buildLines(template, trackCount(template), doc));
  wrap.appendChild(box);
  return wrap;
}

/* --------------------------------------------------------------------------
   상세
   -------------------------------------------------------------------------- */

function buildCase(entry, sample, axisLabels, doc, config) {
  const wrap = doc.createElement('div');
  wrap.className = CASE_CLASS;
  wrap.setAttribute('data-value', String(sample.val));

  const name = doc.createElement('code');
  name.className = `${CASE_CLASS}__name`;
  name.textContent = sample.label ?? `${entry.prop}: ${sample.val}`;
  wrap.appendChild(name);

  // axisAware 속성은 주축 방향별로 결과가 달라진다. 양쪽을 나란히 둔다.
  const axes = entry.axisAware ? AXES : [null];

  axes.forEach((axis) => {
    if (axis) {
      const label = doc.createElement('p');
      label.className = AXIS_CLASS;
      label.textContent = axisLabels[axis] ?? axis;
      wrap.appendChild(label);
    }
    wrap.appendChild(buildDemo(entry, sample.val, axis, doc, config));
  });

  const desc = doc.createElement('p');
  desc.className = `${CASE_CLASS}__desc`;
  appendRich(desc, sample.desc, doc);
  wrap.appendChild(desc);

  return wrap;
}

function buildDetail(entry, config, doc) {
  const { notes = {}, samples = {}, axisLabels = {} } = config;

  const detail = doc.createElement('section');
  detail.className = DETAIL_CLASS;
  detail.setAttribute('aria-labelledby', `fgp-explain-${entry.urlKey}`);

  const heading = doc.createElement('h3');
  heading.className = `${DETAIL_CLASS}__heading`;
  heading.setAttribute('id', `fgp-explain-${entry.urlKey}`);

  const propName = doc.createElement('code');
  propName.textContent = entry.prop;
  heading.appendChild(propName);

  if (entry.label) {
    const label = doc.createElement('span');
    label.className = `${DETAIL_CLASS}__label`;
    label.textContent = entry.label;
    heading.appendChild(label);
  }
  detail.appendChild(heading);

  const desc = doc.createElement('p');
  desc.className = `${DETAIL_CLASS}__desc`;
  appendRich(desc, entry.desc, doc);
  detail.appendChild(desc);

  if (entry.tip) {
    const tip = doc.createElement('p');
    tip.className = `${DETAIL_CLASS}__tip`;
    appendRich(tip, entry.tip, doc);
    detail.appendChild(tip);
  }

  const note = notes[entry.prop];
  if (note) {
    const el = doc.createElement('p');
    el.className = `${DETAIL_CLASS}__note`;
    el.textContent = note;
    detail.appendChild(el);
  }

  if (entry.mdn) {
    const link = doc.createElement('a');
    link.className = `${DETAIL_CLASS}__mdn`;
    link.setAttribute('href', entry.mdn);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noreferrer');
    link.textContent = `MDN에서 ${entry.prop} 보기`;
    detail.appendChild(link);
  }

  const cases = doc.createElement('div');
  cases.className = `${DETAIL_CLASS}__cases`;

  // enum이면 스키마의 values, 아니면 explain.js가 준 표본
  const list = entry.values ?? samples[entry.prop] ?? [];
  list.forEach((sample) => cases.appendChild(buildCase(entry, sample, axisLabels, doc, config)));
  detail.appendChild(cases);

  return detail;
}

/* --------------------------------------------------------------------------
   진입점
   -------------------------------------------------------------------------- */

/**
 * @param {Object}   config
 * @param {Array}    config.schema      토픽 스키마
 * @param {Object}   [config.notes]     { [prop]: 보충 문장 }
 * @param {Object}   [config.samples]   { [prop]: [{val, desc, label?}] } — enum 아닌 속성
 * @param {Object}   [config.axisLabels]
 * @param {Element}  config.root
 * @param {Document} [config.doc]
 * @returns {{root, select, selected}}
 */
export function createExplain(config) {
  const { schema, root, doc = globalThis.document } = config;

  if (!Array.isArray(schema) || schema.length === 0) throw new Error('createExplain: 스키마가 필요합니다');
  if (!root) throw new Error('createExplain: root 요소가 필요합니다');
  if (!doc) throw new Error('createExplain: document를 찾을 수 없습니다');

  root.classList.add(ROOT_CLASS);
  root.classList.add(PANE_CLASS);

  const nav = doc.createElement('nav');
  nav.className = `${PANE_SIDE_CLASS} ${NAV_CLASS}`;
  nav.setAttribute('aria-label', '속성 목록');
  root.appendChild(nav);

  const stage = doc.createElement('div');
  stage.className = `${PANE_STAGE_CLASS} ${DETAIL_CLASS}-stage`;
  root.appendChild(stage);

  const buttons = schema.map((entry) => {
    const button = doc.createElement('button');
    button.className = `${PANE_ITEM_CLASS} ${NAV_ITEM_CLASS}`;
    button.setAttribute('type', 'button');
    button.setAttribute('data-prop', entry.prop);

    // 이름 줄과 설명 줄. 세 탭이 같은 두 줄 구조를 쓴다.
    const name = doc.createElement('code');
    name.className = PANE_NAME_CLASS;
    name.textContent = entry.prop;
    button.appendChild(name);

    if (entry.label) {
      const label = doc.createElement('span');
      label.className = PANE_META_CLASS;
      label.textContent = entry.label;
      button.appendChild(label);
    }

    nav.appendChild(button);
    return button;
  });

  // 상세는 미리 만들어 두고 보이기만 바꾼다. 고를 때마다 다시 만들면 데모
  // 수십 개를 매번 새로 그리게 된다.
  const details = schema.map((entry) => {
    const detail = buildDetail(entry, config, doc);
    stage.appendChild(detail);
    return detail;
  });

  let current = schema[0].prop;

  function select(prop) {
    const at = schema.findIndex((e) => e.prop === prop);
    if (at === -1) return;
    current = prop;

    buttons.forEach((button, i) => {
      const on = i === at;
      button.setAttribute('aria-current', on ? 'true' : 'false');
      button.setAttribute('tabindex', on ? '0' : '-1');
      button.classList.toggle(SELECTED_CLASS, on);
    });

    details.forEach((detail, i) => { detail.hidden = i !== at; });
  }

  const closestItem = (target) => {
    let node = target;
    while (node && node !== nav) {
      if (node.getAttribute && node.getAttribute('data-prop')) return node;
      node = node.parentNode;
    }
    return null;
  };

  nav.addEventListener('click', (e) => {
    const button = closestItem(e.target);
    if (button) select(button.getAttribute('data-prop'));
  });

  nav.addEventListener('keydown', (e) => {
    if (!NEXT_KEYS.has(e.key) && !PREV_KEYS.has(e.key)) return;

    const at = schema.findIndex((entry) => entry.prop === current);
    const step = NEXT_KEYS.has(e.key) ? 1 : -1;
    const next = (at + step + schema.length) % schema.length;

    if (e.preventDefault) e.preventDefault();
    select(schema[next].prop);
    if (typeof buttons[next].focus === 'function') buttons[next].focus();
  });

  select(current);

  return { root, select, selected: () => current };
}

export default createExplain;
