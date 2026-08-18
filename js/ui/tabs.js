/**
 * tabs.js — 탭 전환 (F-02)
 *
 * 탭 목록을 인자로 받는다. store를 import하지 않으므로 어떤 토픽이든, 탭이
 * 늘거나 줄어도 이 파일은 그대로다. controls.js와 같은 자세다.
 *
 * 선택 상태는 호출자가 쥔다. 여기서는 눌린 사실을 알리고, 지시받은 값에
 * 맞춰 표시를 고칠 뿐이다.
 *
 * 키보드 조작은 enum 컨트롤과 같은 방식이다 — 선택된 탭만 tab 순서에 남기고
 * 화살표로 옮긴다. 탭이 넷이면 tab 키를 네 번 눌러야 내용에 닿는 일이 없도록.
 */

export const TABLIST_CLASS = 'fgp-tabs';
export const TAB_CLASS = 'fgp-tab';
export const SELECTED_CLASS = 'is-selected';

/** 탭 버튼과 패널을 잇는 id 규칙. 마크업의 패널 id와 맞춰야 한다. */
export const tabId = (name) => `fgp-tab-${name}`;
export const panelId = (name) => `fgp-panel-${name}`;

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

/**
 * @param {Object}   config
 * @param {string[]} config.tabs      탭 이름 목록 (store의 TABS)
 * @param {Object}   [config.labels]  { [탭]: 표시 이름 }. 없으면 탭 이름 그대로
 * @param {string}   config.value     현재 탭
 * @param {Function} config.onSelect  (탭) => void
 * @param {Element}  config.root      role="tablist" 를 가진 마운트 지점
 * @param {Document} [config.doc]
 * @returns {{root: Element, sync: Function}}
 */
export function createTabs(config) {
  const { tabs, labels = {}, value, onSelect, root, doc = globalThis.document } = config;

  if (!Array.isArray(tabs) || tabs.length === 0) {
    throw new Error('createTabs: 탭 목록이 필요합니다');
  }
  if (!root) throw new Error('createTabs: root 요소가 필요합니다');
  if (!doc) throw new Error('createTabs: document를 찾을 수 없습니다');

  const notify = typeof onSelect === 'function' ? onSelect : () => {};
  let current = value ?? tabs[0];

  const buttons = tabs.map((name) => {
    const button = doc.createElement('button');
    button.className = TAB_CLASS;
    button.textContent = labels[name] ?? name;
    button.setAttribute('type', 'button');
    button.setAttribute('role', 'tab');
    button.setAttribute('id', tabId(name));
    button.setAttribute('aria-controls', panelId(name));
    button.setAttribute('data-tab', name);
    root.appendChild(button);
    return button;
  });

  /** 표시를 현재 값에 맞춘다. 선택된 것만 tab 순서에 남긴다. */
  function sync(next) {
    current = next ?? current;

    buttons.forEach((button, i) => {
      const selected = tabs[i] === current;
      button.setAttribute('aria-selected', String(selected));
      button.setAttribute('tabindex', selected ? '0' : '-1');
      button.classList.toggle(SELECTED_CLASS, selected);
    });
  }

  const select = (name) => {
    if (name === current) return;
    sync(name);
    notify(name);
  };

  /** target에서 위로 올라가며 탭 버튼을 찾는다. */
  const closestTab = (target) => {
    let node = target;
    while (node && node !== root) {
      if (node.getAttribute && node.getAttribute('data-tab')) return node;
      node = node.parentNode;
    }
    return null;
  };

  root.addEventListener('click', (e) => {
    const button = closestTab(e.target);
    if (button) select(button.getAttribute('data-tab'));
  });

  root.addEventListener('keydown', (e) => {
    if (!NEXT_KEYS.has(e.key) && !PREV_KEYS.has(e.key)) return;

    const at = tabs.indexOf(current);
    const step = NEXT_KEYS.has(e.key) ? 1 : -1;
    const next = (at + step + tabs.length) % tabs.length;

    if (e.preventDefault) e.preventDefault();
    select(tabs[next]);

    const focused = buttons[next];
    if (focused && typeof focused.focus === 'function') focused.focus();
  });

  sync(current);

  return { root, sync };
}

export default createTabs;
