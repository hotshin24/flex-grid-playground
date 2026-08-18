/**
 * check-examples.mjs — 실전 예제 확인 (F-08 / PRD 7.1 회귀 대상)
 *
 * 두 가지를 본다.
 *
 *   이관   v0.1 js/data.js 의 EXAMPLES 를 그대로 옮겼는가. 설명과 코드를
 *          새로 쓰지 않았는지 원본 파일과 글자 단위로 대조한다.
 *   파생   카테고리 · 색 · 필터가 데이터에서 나오는가. 카테고리 이름이 코드나
 *          마크업에 글자로 박히면 v0.1 이 실패한 자리로 되돌아간다.
 *
 * jsdom 을 쓰지 않는다. 최소 DOM 스텁으로 충분하다.
 *
 *   node tools/check-examples.mjs
 */

import { readFileSync } from 'node:fs';
import { FLEX_EXAMPLES } from '../js/topics/flex/examples.js';
import {
  createExamples, categoriesFrom, ALL,
  CARD_CLASS, CAT_CLASS, FRAME_CLASS, CODE_CLASS, FILTER_ITEM_CLASS, COUNT_CLASS,
} from '../js/ui/examples.js';

let failed = 0;

function check(label, ok, detail = '') {
  console.log(`  [${ok ? 'OK  ' : 'FAIL'}] ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');

/**
 * 주석을 걷어낸 본문. 하드코딩 판정은 코드에만 걸어야 한다 —
 * "카테고리 이름을 쓰지 않는다"고 적은 주석까지 위반으로 세면 곤란하다.
 */
const codeOnly = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/^\s*\/\/.*$/gm, ' ');

/** 색상 리터럴. tokens.css 밖에서는 0건이어야 한다 (CLAUDE.md 규칙 5) */
const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g;

/* ========================================================================== */

const stats = { innerHTML: 0 };

function createElement(tag) {
  const classes = new Set();
  const listeners = {};

  const el = {
    tagName: String(tag).toUpperCase(),
    className: '',
    children: [],
    parentNode: null,
    textContent: '',
    hidden: false,
    attrs: {},
    listeners,
    classList: {
      add: (n) => classes.add(n),
      contains: (n) => classes.has(n),
      toggle: (n, force) => (force ? classes.add(n) : classes.delete(n), Boolean(force)),
    },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    getAttribute(name) { return this.attrs[name] ?? null; },
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    focus() { this.focused = true; },
  };

  Object.defineProperty(el, 'innerHTML', { get: () => '', set: () => { stats.innerHTML++; } });
  return el;
}

const doc = { createElement };

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

function walk(el, out = []) {
  out.push(el);
  el.children.forEach((c) => walk(c, out));
  return out;
}

const byClass = (root, cls) => walk(root).filter((el) => el.className.split(' ').includes(cls));

function build(onCopy) {
  const root = createElement('section');
  const api = createExamples({ examples: FLEX_EXAMPLES, root, doc, onCopy });
  return { root, api };
}

/* ==========================================================================
   데이터
   ========================================================================== */
section('데이터');

const REQUIRED = ['id', 'title', 'category', 'desc', 'previewHeight', 'css', 'html'];

{
  check('예제 18건', FLEX_EXAMPLES.length === 18, `${FLEX_EXAMPLES.length}건`);
  check('id 유일', new Set(FLEX_EXAMPLES.map((e) => e.id)).size === FLEX_EXAMPLES.length);

  const missing = [];
  FLEX_EXAMPLES.forEach((ex) => {
    REQUIRED.forEach((key) => {
      const v = ex[key];
      if (v === undefined || v === null || v === '') missing.push(`${ex.id}.${key}`);
    });
  });
  check('필수 필드 전량 보유', missing.length === 0, missing.join(', ') || REQUIRED.join(' · '));

  check('previewHeight는 숫자', FLEX_EXAMPLES.every((e) => Number.isFinite(e.previewHeight)));

  check('categoryColor 필드 없음',
    FLEX_EXAMPLES.every((e) => !('categoryColor' in e)),
    '색은 데이터가 아니라 components.css가 정한다');

  const cats = categoriesFrom(FLEX_EXAMPLES);
  check('카테고리는 데이터에서 파생', cats.length > 0, `${cats.length}종 — ${cats.join(' · ')}`);
  check('카테고리 합이 예제 수와 같음',
    cats.reduce((n, c) => n + FLEX_EXAMPLES.filter((e) => e.category === c).length, 0) === FLEX_EXAMPLES.length);
}

/* ==========================================================================
   이관 — v0.1 원본과 글자 단위 대조
   ========================================================================== */
section('v0.1 이관');

{
  const v01 = read('../js/data.js');

  const notFound = [];
  FLEX_EXAMPLES.forEach((ex) => {
    ['title', 'desc', 'css', 'html'].forEach((key) => {
      if (!v01.includes(ex[key])) notFound.push(`${ex.id}.${key}`);
    });
  });
  check('제목·설명·css·html이 v0.1에 그대로 있음', notFound.length === 0,
    notFound.join(', ') || `${FLEX_EXAMPLES.length}건 × 4필드 일치`);

  const v01Ids = [...v01.matchAll(/^      id: '([^']+)',$/gm)].map((m) => m[1]);
  check('id 목록과 순서가 v0.1과 같음',
    JSON.stringify(FLEX_EXAMPLES.map((e) => e.id)) === JSON.stringify(v01Ids.slice(0, FLEX_EXAMPLES.length)),
    FLEX_EXAMPLES.map((e) => e.id).join(', '));

  check('v0.1 파일은 손대지 않았다 (categoryColor 18건 그대로)',
    (v01.match(/categoryColor:/g) ?? []).length === 18);
}

/* ==========================================================================
   색상 리터럴 (CLAUDE.md 규칙 5)

   css · html 필드는 사용자에게 보여 줄 예제 코드다. 우리 스타일시트가 아니므로
   규칙 5의 대상이 아니다. 나머지 필드와 우리 코드만 본다.
   ========================================================================== */
section('색상 리터럴');

{
  const META = REQUIRED.filter((k) => k !== 'css' && k !== 'html');
  const dirty = [];
  FLEX_EXAMPLES.forEach((ex) => {
    META.forEach((key) => {
      if (COLOR.test(String(ex[key]))) dirty.push(`${ex.id}.${key}`);
      COLOR.lastIndex = 0;
    });
  });
  check('예제 메타데이터에 색상 0건', dirty.length === 0, dirty.join(', ') || META.join(' · '));

  [['js/ui/examples.js', '../js/ui/examples.js'], ['css/components.css', '../css/components.css'],
   ['index-v1.html', '../index-v1.html'], ['js/main.js', '../js/main.js']].forEach(([label, rel]) => {
    const hits = read(rel).match(COLOR) ?? [];
    check(`${label} 색상 0건`, hits.length === 0, hits.join(', ') || '0건');
  });
}

/* ==========================================================================
   하드코딩 — 카테고리 이름이 코드·마크업에 없어야 한다
   ========================================================================== */
section('하드코딩');

{
  const cats = categoriesFrom(FLEX_EXAMPLES);
  const titles = FLEX_EXAMPLES.map((e) => e.title);

  [['js/ui/examples.js', '../js/ui/examples.js'], ['css/components.css', '../css/components.css'],
   ['index-v1.html', '../index-v1.html'], ['js/main.js', '../js/main.js']].forEach(([label, rel]) => {
    const src = codeOnly(read(rel));
    // 문장에 우연히 섞인 낱말이 아니라, 값으로 박아 둔 것만 본다
    const quoted = (v) => src.includes(`'${v}'`) || src.includes(`"${v}"`) || src.includes(`>${v}<`);
    const hitCats = cats.filter(quoted);
    const hitTitles = titles.filter(quoted);
    check(`${label}에 카테고리 이름 0건`, hitCats.length === 0, hitCats.join(', ') || `${cats.length}종 전부 없음`);
    check(`${label}에 예제 제목 0건`, hitTitles.length === 0, hitTitles.join(', ') || `${titles.length}건 전부 없음`);
  });

  const ui = codeOnly(read('../js/ui/examples.js'));
  check('예제 개수도 박혀 있지 않음', !/\b18\b/.test(ui));
  check('innerHTML 0건', !/innerHTML/.test(ui), 'srcdoc은 액자 안 문서의 원본이라 별개다');
  check('카테고리 판정이 실제로 잡는다',
    ['레이아웃'].every((v) => codeOnly(`const x = '${v}';`).includes(`'${v}'`)));
}

/* ==========================================================================
   화면
   ========================================================================== */
section('화면');

{
  const { root, api } = build();
  const cards = byClass(root, CARD_CLASS);

  check('카드 18개', cards.length === 18, `${cards.length}개`);
  check('전부 보임', cards.every((c) => c.hidden === false), `${api.visible()}건`);
  check('카드마다 프리뷰 액자', byClass(root, FRAME_CLASS).length === 18);
  check('카드마다 코드 블록 2개', byClass(root, CODE_CLASS).length === 36,
    `${byClass(root, CODE_CLASS).length}개 (CSS·HTML)`);
  check('카드마다 카테고리 표시', byClass(root, CAT_CLASS).length === 18);

  const frames = byClass(root, FRAME_CLASS);
  check('액자는 iframe', frames.every((f) => f.tagName === 'IFRAME'));
  check('액자에 스크립트 차단', frames.every((f) => f.getAttribute('sandbox') === ''));
  check('액자 높이는 데이터값',
    frames.every((f, i) => f.getAttribute('height') === String(FLEX_EXAMPLES[i].previewHeight)));
  check('액자에 예제 css·html이 실림',
    frames.every((f, i) => f.srcdoc.includes(FLEX_EXAMPLES[i].css) && f.srcdoc.includes(FLEX_EXAMPLES[i].html)));

  check('this 문서에는 innerHTML을 쓰지 않음', stats.innerHTML === 0, `${stats.innerHTML}회`);

  // 코드 블록은 textContent 로 넣는다. 원문 그대로여야 한다
  const codes = walk(root).filter((el) => el.tagName === 'CODE');
  check('코드 블록에 원문 그대로', codes.length === 36
    && FLEX_EXAMPLES.every((ex) => codes.some((c) => c.textContent === ex.css)
      && codes.some((c) => c.textContent === ex.html)));
}

/* ==========================================================================
   필터
   ========================================================================== */
section('필터');

{
  const cats = categoriesFrom(FLEX_EXAMPLES);
  const { root, api } = build();
  const chips = byClass(root, FILTER_ITEM_CLASS);
  const count = byClass(root, COUNT_CLASS)[0];

  check('칩은 전체 + 카테고리', chips.length === cats.length + 1, `${chips.length}개`);
  check('칩 이름이 데이터 순서 그대로',
    JSON.stringify(chips.map((c) => c.textContent)) === JSON.stringify([ALL, ...cats]));
  check('radiogroup', root.children[0].getAttribute('role') === 'radiogroup'
    && chips.every((c) => c.getAttribute('role') === 'radio'));
  check('처음에는 전체', api.selected() === ALL && chips[0].getAttribute('aria-checked') === 'true');

  cats.forEach((cat) => {
    const expected = FLEX_EXAMPLES.filter((e) => e.category === cat).length;
    api.filter(cat);
    const shown = byClass(root, CARD_CLASS).filter((c) => !c.hidden);
    check(`${cat} — ${expected}건`, shown.length === expected && api.visible() === expected,
      `${shown.length}건 · "${count.textContent}"`);
    check(`${cat} — 남은 카드는 전부 그 카테고리`,
      shown.every((c) => FLEX_EXAMPLES.find((e) => e.id === c.getAttribute('data-example')).category === cat));
  });

  api.filter(ALL);
  check('전체로 돌아오면 18건', api.visible() === 18, count.textContent);

  // 칩 클릭
  fire(chips[1], 'click', { target: chips[1] });
  check('칩 클릭이 먹는다', api.selected() === chips[1].textContent);
  check('선택된 칩만 aria-checked',
    chips.filter((c) => c.getAttribute('aria-checked') === 'true').length === 1);
  check('선택된 칩만 tabindex 0',
    chips.filter((c) => c.getAttribute('tabindex') === '0').length === 1);

  // 키보드
  fire(chips[1], 'keydown', { key: 'ArrowRight', target: chips[1] });
  check('오른쪽 화살표로 다음 칩', api.selected() === chips[2].textContent);
  fire(chips[2], 'keydown', { key: 'ArrowLeft', target: chips[2] });
  check('왼쪽 화살표로 이전 칩', api.selected() === chips[1].textContent);

  // 이동 기준은 focus 가 아니라 현재 선택이다. 전체로 되돌린 뒤 확인한다
  api.filter(ALL);
  fire(chips[0], 'keydown', { key: 'ArrowLeft', target: chips[0] });
  check('처음에서 왼쪽이면 끝으로 돈다', api.selected() === chips[chips.length - 1].textContent,
    api.selected());
  fire(chips[chips.length - 1], 'keydown', { key: 'ArrowRight', target: chips[chips.length - 1] });
  check('끝에서 오른쪽이면 처음으로 돈다', api.selected() === ALL);
}

/* ==========================================================================
   카테고리 색 — 순번만 넘긴다
   ========================================================================== */
section('카테고리 색');

{
  const cats = categoriesFrom(FLEX_EXAMPLES);
  const { root } = build();

  const cards = byClass(root, CARD_CLASS);
  const wrong = cards.filter((card, i) =>
    card.getAttribute('data-category') !== String((cats.indexOf(FLEX_EXAMPLES[i].category) % 8) + 1));
  check('카드의 순번이 카테고리와 맞음', wrong.length === 0, `${cards.length}개 일치`);

  const same = cats.map((c) => {
    const of = cards.filter((_, i) => FLEX_EXAMPLES[i].category === c).map((el) => el.getAttribute('data-category'));
    return new Set(of).size === 1;
  });
  check('같은 카테고리는 같은 순번', same.every(Boolean),
    'v0.1은 폼 두 건이 서로 다른 색이었다');

  const css = read('../css/components.css');
  const declared = [...css.matchAll(/\[data-category='(\d)'\]/g)].map((m) => Number(m[1]));
  check('CSS가 순번을 색으로 옮긴다', declared.length >= cats.length,
    `${declared.length}단계 준비 · 카테고리 ${cats.length}종`);
}

/* ==========================================================================
   복사
   ========================================================================== */
section('복사');

{
  const copied = [];
  const { root } = build((text, button) => copied.push({ text, button }));
  const cards = byClass(root, CARD_CLASS);

  const buttons = walk(cards[0]).filter((el) => el.getAttribute('data-copy'));
  check('카드마다 복사 버튼 2개', buttons.length === 2, buttons.map((b) => b.textContent).join(' · '));

  fire(buttons[0], 'click', { target: buttons[0] });
  check('CSS 복사가 그 예제의 css를 넘긴다',
    copied.length === 1 && copied[0].text === FLEX_EXAMPLES[0].css);

  fire(buttons[1], 'click', { target: buttons[1] });
  check('HTML 복사가 그 예제의 html을 넘긴다',
    copied.length === 2 && copied[1].text === FLEX_EXAMPLES[0].html);

  const other = walk(cards[7]).filter((el) => el.getAttribute('data-copy'));
  fire(other[0], 'click', { target: other[0] });
  check('다른 카드는 자기 코드를 넘긴다',
    copied.length === 3 && copied[2].text === FLEX_EXAMPLES[7].css);

  check('버튼도 함께 넘어간다 (라벨 되돌리기용)', copied.every((c) => c.button));
}

/* ==========================================================================
   방어
   ========================================================================== */
section('방어');

{
  let threw = 0;
  try { createExamples({ examples: [], root: createElement('div'), doc }); } catch { threw++; }
  try { createExamples({ examples: FLEX_EXAMPLES, root: null, doc }); } catch { threw++; }
  try { createExamples({ examples: FLEX_EXAMPLES, root: createElement('div'), doc: null }); } catch { threw++; }
  check('빈 목록·root 없음·document 없음을 막는다', threw === 3, `${threw}/3`);

  const { api } = build();
  api.filter('없는 카테고리');
  check('없는 카테고리는 무시', api.selected() === ALL && api.visible() === 18);
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
