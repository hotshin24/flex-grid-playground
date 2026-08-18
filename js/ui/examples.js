/**
 * examples.js — 실전 예제 탭 (F-08 / PRD 7.1 회귀 대상)
 *
 * 예제 목록과 카테고리는 전부 데이터에서 나온다. 이 파일에 카테고리 이름이 없고,
 * 예제 제목도 설명도 없다. 토픽별 examples.js 가 늘거나 줄면 화면이 따라간다.
 *
 * 프리뷰는 iframe srcdoc 이다. v0.1 이 쓰던 방식 그대로다. 예제 CSS 는 .card 나
 * .container 처럼 흔한 이름을 쓰므로, 한 문서 안에 18건을 풀어 놓으면 서로
 * 덮어쓰고 앱 스타일까지 건드린다. iframe 은 문서가 통째로 갈리므로 그럴 일이
 * 없고, html·body 를 겨냥한 규칙도 예제가 의도한 대로 먹는다.
 *
 * innerHTML 을 쓰지 않는다. srcdoc 은 이 문서가 아니라 액자 안 문서의 원본이다.
 * 스크립트는 sandbox 로 막아 둔다 — 예제는 CSS 와 마크업뿐이다.
 *
 * 카테고리 색은 데이터가 아니라 표시 방식이다. 순번만 data-category 에 실어
 * 주고 색은 components.css 가 고른다. 여기에 색 값이 없다.
 */

export const ROOT_CLASS = 'fgp-examples';
export const FILTER_CLASS = 'fgp-examples__filter';
export const FILTER_ITEM_CLASS = 'fgp-examples__filteritem';
export const COUNT_CLASS = 'fgp-examples__count';
export const LIST_CLASS = 'fgp-examples__list';
export const CARD_CLASS = 'fgp-example';
export const CAT_CLASS = 'fgp-example__cat';
export const FRAME_CLASS = 'fgp-example__frame';
export const CODE_CLASS = 'fgp-example__code';
export const SELECTED_CLASS = 'is-selected';

/** 필터를 끄는 자리. 카테고리가 아니라 UI 문구다. */
export const ALL = '전체';

/** components.css 가 준비해 둔 강조색 개수. 카테고리가 더 늘면 앞에서부터 돈다. */
const ACCENT_COUNT = 8;

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

/**
 * 액자 안 문서의 기준선. v0.1 이 쓰던 문장을 그대로 옮겼다 — 예제 CSS 가
 * 여백 0 을 전제로 짜여 있어 이걸 빼면 그림이 달라진다.
 *
 * 액자는 별개 문서라 토큰(--p-font-*)이 건너가지 않는다. 그래서 여기만은
 * 글꼴 이름을 글자로 적는다. 예제 콘텐츠의 일부이지 우리 스타일시트가 아니다.
 */
const FRAME_RESET = "*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif}";

/** 데이터에 나온 순서대로. 이름을 코드에 적지 않으려고 순번으로만 다룬다. */
export function categoriesFrom(examples) {
  return [...new Set(examples.map((ex) => ex.category))];
}

function frameDoc(example) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">`
    + `<style>${FRAME_RESET}${example.css}</style></head>`
    + `<body>${example.html}</body></html>`;
}

/* --------------------------------------------------------------------------
   카드
   -------------------------------------------------------------------------- */

function buildCode(example, kind, label, doc) {
  const box = doc.createElement('details');
  box.className = `${CODE_CLASS} ${CODE_CLASS}--${kind}`;

  const summary = doc.createElement('summary');
  summary.className = `${CODE_CLASS}__summary`;
  summary.textContent = label;
  box.appendChild(summary);

  const pre = doc.createElement('pre');
  pre.className = `${CODE_CLASS}__block`;

  const code = doc.createElement('code');
  code.textContent = example[kind];
  pre.appendChild(code);
  box.appendChild(pre);

  return box;
}

function buildCard(example, categoryIndex, doc) {
  const card = doc.createElement('article');
  card.className = CARD_CLASS;
  card.setAttribute('data-example', example.id);
  // 색이 아니라 순번이다. 어떤 색이 될지는 CSS 가 정한다.
  card.setAttribute('data-category', String((categoryIndex % ACCENT_COUNT) + 1));

  const head = doc.createElement('header');
  head.className = `${CARD_CLASS}__head`;

  const cat = doc.createElement('span');
  cat.className = CAT_CLASS;
  cat.textContent = example.category;
  head.appendChild(cat);

  const title = doc.createElement('h3');
  title.className = `${CARD_CLASS}__title`;
  title.textContent = example.title;
  head.appendChild(title);

  const tools = doc.createElement('div');
  tools.className = `${CARD_CLASS}__tools`;

  [['css', 'CSS 복사'], ['html', 'HTML 복사']].forEach(([kind, label]) => {
    const button = doc.createElement('button');
    button.className = 'fgp-btn fgp-btn--quiet';
    button.setAttribute('type', 'button');
    button.setAttribute('data-copy', kind);
    button.textContent = label;
    tools.appendChild(button);
  });

  head.appendChild(tools);
  card.appendChild(head);

  const desc = doc.createElement('p');
  desc.className = `${CARD_CLASS}__desc`;
  desc.textContent = example.desc;
  card.appendChild(desc);

  const frame = doc.createElement('iframe');
  frame.className = FRAME_CLASS;
  frame.setAttribute('title', `${example.title} 미리보기`);
  frame.setAttribute('loading', 'lazy');
  frame.setAttribute('sandbox', '');
  // 높이는 데이터가 정한다. HTML 속성으로 넘겨 인라인 스타일을 만들지 않는다.
  frame.setAttribute('height', String(example.previewHeight));
  frame.srcdoc = frameDoc(example);
  card.appendChild(frame);

  card.appendChild(buildCode(example, 'css', 'CSS', doc));
  card.appendChild(buildCode(example, 'html', 'HTML', doc));

  return card;
}

/* --------------------------------------------------------------------------
   진입점
   -------------------------------------------------------------------------- */

/**
 * @param {Object}   config
 * @param {Array}    config.examples          토픽 예제 목록
 * @param {Element}  config.root
 * @param {Function} [config.onCopy]          (text, button) => void
 * @param {Document} [config.doc]
 * @returns {{root, filter, selected, visible}}
 */
export function createExamples(config) {
  const { examples, root, onCopy, doc = globalThis.document } = config;

  if (!Array.isArray(examples) || examples.length === 0) throw new Error('createExamples: 예제 목록이 필요합니다');
  if (!root) throw new Error('createExamples: root 요소가 필요합니다');
  if (!doc) throw new Error('createExamples: document를 찾을 수 없습니다');

  root.classList.add(ROOT_CLASS);

  const categories = categoriesFrom(examples);
  const choices = [ALL, ...categories];

  /* 필터 */
  const bar = doc.createElement('div');
  bar.className = FILTER_CLASS;
  bar.setAttribute('role', 'radiogroup');
  bar.setAttribute('aria-label', '카테고리');
  root.appendChild(bar);

  const chips = choices.map((name) => {
    const button = doc.createElement('button');
    button.className = FILTER_ITEM_CLASS;
    button.setAttribute('type', 'button');
    button.setAttribute('role', 'radio');
    button.setAttribute('data-filter', name);
    // 전체는 순번 밖이다. 카테고리만 색을 받는다.
    if (name !== ALL) button.setAttribute('data-category', String((categories.indexOf(name) % ACCENT_COUNT) + 1));
    button.textContent = name;
    bar.appendChild(button);
    return button;
  });

  const count = doc.createElement('output');
  count.className = COUNT_CLASS;
  bar.appendChild(count);

  /* 목록 */
  const list = doc.createElement('div');
  list.className = LIST_CLASS;
  root.appendChild(list);

  const cards = examples.map((example) => {
    const card = buildCard(example, categories.indexOf(example.category), doc);
    list.appendChild(card);
    return { example, card };
  });

  let current = ALL;

  function filter(name) {
    if (!choices.includes(name)) return;
    current = name;

    chips.forEach((chip) => {
      const on = chip.getAttribute('data-filter') === name;
      chip.setAttribute('aria-checked', on ? 'true' : 'false');
      chip.setAttribute('tabindex', on ? '0' : '-1');
      chip.classList.toggle(SELECTED_CLASS, on);
    });

    let shown = 0;
    cards.forEach(({ example, card }) => {
      const on = name === ALL || example.category === name;
      card.hidden = !on;
      if (on) shown += 1;
    });

    count.textContent = `${examples.length}건 중 ${shown}건`;
  }

  const closest = (target, attr, stop) => {
    let node = target;
    while (node && node !== stop) {
      if (node.getAttribute && node.getAttribute(attr) !== null) return node;
      node = node.parentNode;
    }
    return null;
  };

  bar.addEventListener('click', (e) => {
    const chip = closest(e.target, 'data-filter', bar);
    if (chip) filter(chip.getAttribute('data-filter'));
  });

  bar.addEventListener('keydown', (e) => {
    if (!NEXT_KEYS.has(e.key) && !PREV_KEYS.has(e.key)) return;

    const at = choices.indexOf(current);
    const step = NEXT_KEYS.has(e.key) ? 1 : -1;
    const next = (at + step + choices.length) % choices.length;

    if (e.preventDefault) e.preventDefault();
    filter(choices[next]);
    if (typeof chips[next].focus === 'function') chips[next].focus();
  });

  list.addEventListener('click', (e) => {
    const button = closest(e.target, 'data-copy', list);
    if (!button || !onCopy) return;

    const card = closest(button, 'data-example', list);
    const found = cards.find(({ card: el }) => el === card);
    if (found) onCopy(found.example[button.getAttribute('data-copy')], button);
  });

  filter(current);

  return { root, filter, selected: () => current, visible: () => cards.filter(({ card }) => !card.hidden).length };
}

export default createExamples;
