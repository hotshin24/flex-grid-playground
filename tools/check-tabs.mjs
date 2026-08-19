/**
 * check-tabs.mjs — tabs.js 동작 확인
 *
 * jsdom을 쓰지 않는다. tabs가 실제로 호출하는 DOM API만 이 파일 안에서 최소
 * 구현해 주입하고, 버블링을 흉내 내 위임 핸들러까지 전달한다.
 *
 *   node tools/check-tabs.mjs
 */

import { readFileSync } from 'node:fs';
import { createTabs, tabId, panelId, TAB_CLASS, SELECTED_CLASS } from '../js/ui/tabs.js';
import { TABS } from '../js/core/store.js';

let failed = 0;

function check(label, ok, detail = '') {
  console.log(`  [${ok ? 'OK  ' : 'FAIL'}] ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ==========================================================================
   최소 DOM 스텁
   ========================================================================== */

const stats = { styleWrites: 0, innerHTML: 0 };

function createElement(tag) {
  const classes = new Set();
  const listeners = {};

  const el = {
    tagName: String(tag).toUpperCase(),
    className: '',
    children: [],
    parentNode: null,
    textContent: '',
    attrs: {},
    listeners,
    style: new Proxy({}, { set(t, k, v) { stats.styleWrites++; t[k] = v; return true; } }),
    classList: {
      add: (n) => classes.add(n),
      remove: (n) => classes.delete(n),
      contains: (n) => classes.has(n),
      toggle: (n, force) => (force ? classes.add(n) : classes.delete(n), Boolean(force)),
    },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    getAttribute(name) { return this.attrs[name] ?? null; },
    removeAttribute(name) { delete this.attrs[name]; },
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    focus() { this.focused = true; doc.activeElement = this; },
  };

  Object.defineProperty(el, 'innerHTML', { get: () => '', set: () => { stats.innerHTML++; } });
  return el;
}

const doc = { createElement, activeElement: null };

function fire(el, type, props = {}) {
  const e = { type, target: el, defaultPrevented: false, ...props };
  e.preventDefault = () => { e.defaultPrevented = true; };
  let node = el;
  while (node) {
    (node.listeners?.[type] ?? []).slice().forEach((fn) => fn(e));
    node = node.parentNode;
  }
  return e;
}

const LABELS = {
  playground: '플레이그라운드',
  explain: '속성 설명',
  examples: '실전 예제',
  challenge: '챌린지',
};

function build(value = TABS[0]) {
  const picked = [];
  const root = doc.createElement('nav');
  root.setAttribute('role', 'tablist');
  const api = createTabs({
    tabs: TABS, labels: LABELS, value, root, doc,
    onSelect: (tab) => picked.push(tab),
  });
  return { ...api, root, picked, buttons: root.children };
}

const selectedOf = (buttons) => buttons.filter((b) => b.getAttribute('aria-selected') === 'true');

/* ==========================================================================
   구조 규칙
   ========================================================================== */
section('구조 규칙');

{
  const src = readFileSync(new URL('../js/ui/tabs.js', import.meta.url), 'utf8');
  check('store를 import하지 않음', !/from\s+['"].*store\.js['"]/.test(src));
  check('탭 이름을 하드코딩하지 않음', !/playground|challenge/.test(src));
  check('색상 리터럴 0건', (src.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? []).length === 0);
  check('innerHTML 미사용', !/\.innerHTML/.test(src));

  const raw = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  // 주석을 걷어내고 센다. 구조를 설명한 주석에 role="tabpanel" 이 적혀 있으면
  // 세는 쪽이 한 건 더 잡는다 — 실제로 그렇게 어긋났다.
  const html = raw.replace(/<!--[\s\S]*?-->/g, ' ');
  check('마크업에 인라인 onclick 0건', !/onclick=/i.test(raw));
  check('탭 수만큼 패널이 있음',
    TABS.every((t) => html.includes(`id="${panelId(t)}"`)),
    TABS.map(panelId).join(', '));
  check('패널에 role=tabpanel', (html.match(/role="tabpanel"/g) ?? []).length === TABS.length);

  /* 본문 랜드마크. 패널마다 role="tabpanel" 이 붙어 암시 역할을 덮으므로
     main 은 패널 바깥에 있어야 한다. 안쪽에 두면 문서에 본문이 없어진다. */
  check('main 이 하나 있다', (html.match(/<main\b/g) ?? []).length === 1);
  check('main 에 role 이 없다', !/<main[^>]*role=/.test(html),
    'role 을 얹으면 암시 역할이 덮인다');
  check('패널 넷이 전부 main 안에 있다', (() => {
    const at = html.indexOf('<main');
    const end = html.indexOf('</main>');
    const inside = html.slice(at, end);
    return TABS.every((t) => inside.includes(`id="${panelId(t)}"`));
  })(), TABS.map(panelId).join(', '));
  check('main 자체는 패널이 아니다', !/<main[^>]*id="fgp-panel-/.test(html));
}

/* ==========================================================================
   TABS 상수에서 생성
   ========================================================================== */
section('탭 생성');

{
  const { root, buttons } = build();

  check('탭 개수 = TABS 길이', buttons.length === TABS.length, `${buttons.length}/${TABS.length}`);
  check('순서까지 일치', eq(buttons.map((b) => b.getAttribute('data-tab')), TABS));
  check('표시 이름 반영', eq(buttons.map((b) => b.textContent), TABS.map((t) => LABELS[t])));
  check('root는 role=tablist', root.getAttribute('role') === 'tablist');
  check('전부 role=tab', buttons.every((b) => b.getAttribute('role') === 'tab'));
  check('전부 type=button', buttons.every((b) => b.getAttribute('type') === 'button'));
  check('클래스 부여', buttons.every((b) => b.className === TAB_CLASS));

  check('id 규칙', eq(buttons.map((b) => b.getAttribute('id')), TABS.map(tabId)));
  check('aria-controls가 패널을 가리킴', eq(buttons.map((b) => b.getAttribute('aria-controls')), TABS.map(panelId)));

  // 라벨이 없는 탭은 이름 그대로
  const bare = doc.createElement('nav');
  createTabs({ tabs: ['alpha', 'beta'], value: 'alpha', root: bare, doc });
  check('라벨 없으면 탭 이름 그대로', eq(bare.children.map((b) => b.textContent), ['alpha', 'beta']));
  check('TABS 밖의 목록도 그대로 생성', bare.children.length === 2);
}

/* ==========================================================================
   선택 상태
   ========================================================================== */
section('aria-selected');

{
  const { buttons, sync, picked } = build(TABS[0]);

  check('처음엔 첫 탭만 선택', selectedOf(buttons).length === 1 && selectedOf(buttons)[0].getAttribute('data-tab') === TABS[0]);
  check('선택된 탭만 tabindex 0',
    buttons.filter((b) => b.getAttribute('tabindex') === '0').length === 1 &&
    selectedOf(buttons)[0].getAttribute('tabindex') === '0');
  check('나머지는 tabindex -1', buttons.filter((b) => b.getAttribute('tabindex') === '-1').length === TABS.length - 1);
  check('선택 클래스', selectedOf(buttons)[0].classList.contains(SELECTED_CLASS));

  fire(buttons[2], 'click');
  check('클릭 후에도 선택은 하나뿐', selectedOf(buttons).length === 1, `${selectedOf(buttons).length}개`);
  check('클릭한 탭이 선택됨', selectedOf(buttons)[0].getAttribute('data-tab') === TABS[2]);
  check('onSelect 통지', eq(picked, [TABS[2]]), JSON.stringify(picked));
  check('tabindex도 따라감', buttons[2].getAttribute('tabindex') === '0' && buttons[0].getAttribute('tabindex') === '-1');

  fire(buttons[2], 'click');
  check('같은 탭 재클릭은 통지 없음', picked.length === 1, `${picked.length}회`);

  // 밖에서 상태가 바뀐 경우 (undo 등)
  sync(TABS[1]);
  check('sync로 선택 이동', selectedOf(buttons)[0].getAttribute('data-tab') === TABS[1]);
  check('sync는 통지하지 않음', picked.length === 1);
}

/* ==========================================================================
   키보드
   ========================================================================== */
section('화살표 이동');

{
  const { buttons, picked } = build(TABS[0]);
  const current = () => selectedOf(buttons)[0].getAttribute('data-tab');

  const e1 = fire(buttons[0], 'keydown', { key: 'ArrowRight' });
  check('ArrowRight 다음 탭', current() === TABS[1], current());
  check('기본 동작 차단', e1.defaultPrevented);
  check('이동한 탭에 포커스', buttons[1].focused === true);

  fire(buttons[1], 'keydown', { key: 'ArrowDown' });
  check('ArrowDown도 다음', current() === TABS[2]);

  fire(buttons[2], 'keydown', { key: 'ArrowLeft' });
  check('ArrowLeft 이전', current() === TABS[1]);

  fire(buttons[1], 'keydown', { key: 'ArrowUp' });
  check('ArrowUp도 이전', current() === TABS[0]);

  fire(buttons[0], 'keydown', { key: 'ArrowLeft' });
  check('처음에서 이전 → 마지막으로 순환', current() === TABS.at(-1), current());

  fire(buttons[TABS.length - 1], 'keydown', { key: 'ArrowRight' });
  check('마지막에서 다음 → 처음으로 순환', current() === TABS[0]);

  const before = picked.length;
  fire(buttons[0], 'keydown', { key: 'Enter' });
  check('그 외 키는 무시', picked.length === before);
  check('이동할 때마다 통지', before === 6, `${before}회`);
}

/* ==========================================================================
   생성물에 인라인 흔적이 없다
   ========================================================================== */
section('인라인 onclick · style');

{
  stats.styleWrites = 0;
  const { buttons, root } = build();
  const all = [root, ...buttons];

  check('on* 속성 0건', all.filter((el) => Object.keys(el.attrs).some((a) => a.toLowerCase().startsWith('on'))).length === 0);
  check('style 속성 0건', all.filter((el) => el.attrs.style !== undefined).length === 0);
  check('style 프로퍼티 쓰기 0건', stats.styleWrites === 0, `${stats.styleWrites}회`);
  check('innerHTML 쓰기 0건', stats.innerHTML === 0);
}

/* ==========================================================================
   방어
   ========================================================================== */
section('방어');

{
  let threw = 0;
  try { createTabs({ tabs: [], root: doc.createElement('nav'), doc }); } catch { threw++; }
  try { createTabs({ tabs: TABS, doc }); } catch { threw++; }
  try { createTabs({ tabs: TABS, root: doc.createElement('nav'), doc: null }); } catch { threw++; }
  check('잘못된 구성 3종 거부', threw === 3, `${threw}/3`);

  let ok = true;
  try { createTabs({ tabs: TABS, value: TABS[0], root: doc.createElement('nav'), doc }); } catch { ok = false; }
  check('onSelect 없어도 생성 가능', ok);
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
