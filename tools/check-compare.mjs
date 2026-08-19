/**
 * check-compare.mjs — Flex ↔ Grid 개념 대조 확인 (GR-09 / PRD 5.4)
 *
 * 이 뷰는 스키마의 relatedTo 만 보고 짝을 짓고 desc · tip 을 그대로 읽는다.
 * 그러므로 확인할 것은 둘이다.
 *
 *   파생   짝도 문장도 스키마에서 나오는가. 속성 이름이나 대조용 문장이 코드에
 *          박히면 스키마가 늘어도 화면이 따라오지 못한다.
 *   무해   상태를 건드리지 않는가. 대조는 읽기만 하는 화면이라 store 가
 *          한 번이라도 움직이면 설계가 틀린 것이다.
 *
 * jsdom 을 쓰지 않는다. 최소 DOM 스텁으로 충분하다.
 *
 *   node tools/check-compare.mjs
 */

import { readFileSync } from 'node:fs';
import { FLEX_SCHEMA } from '../js/topics/flex/schema.js';
import { GRID_SCHEMA } from '../js/topics/grid/schema.js';
import { createStore } from '../js/core/store.js';
import {
  createCompare, pairsFrom, danglingFrom, sharedValue,
  ROOT_CLASS, SUMMARY_CLASS, PAIR_CLASS, SIDE_CLASS, NAME_CLASS,
  VALUE_CLASS, TEXT_CLASS, NOTE_CLASS, HOST_CLASS,
} from '../js/ui/compare.js';
import { DEMO_CLASS, DEMO_ITEM_CLASS, PANE_CLASS } from '../js/ui/explain.js';
import { GRID_EXPLAIN_DEMOS } from '../js/topics/grid/explain.js';

let failed = 0;

function check(label, ok, detail = '') {
  console.log(`  [${ok ? 'OK  ' : 'FAIL'}] ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g;

const codeOnly = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/^\s*\/\/.*$/gm, ' ');

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
    open: false,
    attrs: {},
    style: {
      _custom: new Map(),
      setProperty(n, v) { this._custom.set(n, v); },
      getPropertyValue(n) { return this._custom.get(n) ?? ''; },
    },
    classList: {
      add: (n) => classes.add(n),
      contains: (n) => classes.has(n),
      toggle: (n, force) => (force ? classes.add(n) : classes.delete(n), Boolean(force)),
    },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    insertBefore(child, ref) {
      const at = ref ? this.children.indexOf(ref) : -1;
      child.parentNode = this;
      if (at < 0) this.children.push(child); else this.children.splice(at, 0, child);
      return child;
    },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    getAttribute(name) { return this.attrs[name] ?? null; },
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
  };

  Object.defineProperty(el, 'firstChild', { get: () => el.children[0] ?? null });
  Object.defineProperty(el, 'innerHTML', { get: () => '', set: () => { stats.innerHTML++; } });
  return el;
}

const doc = { createElement };

function walk(el, out = []) {
  out.push(el);
  el.children.forEach((c) => walk(c, out));
  return out;
}

const byClass = (root, cls) => walk(root).filter((el) => el.className.split(' ').includes(cls));
const textOf = (el) => walk(el).map((n) => n.textContent).join('');

const TOPICS = {
  flex: { key: 'flex', label: 'Flex', schema: FLEX_SCHEMA },
  grid: { key: 'grid', label: 'Grid', schema: GRID_SCHEMA, display: 'grid', demos: GRID_EXPLAIN_DEMOS },
};

function build(left = 'flex', right = 'grid', host = createElement('section')) {
  const api = createCompare({
    left: TOPICS[left], right: TOPICS[right], host, title: '대조', doc,
  });
  return { host, api };
}

/* ==========================================================================
   짝 짓기 — relatedTo 가 전부 화면에 오르는가
   ========================================================================== */
section('짝 짓기');

const PAIRS = pairsFrom(FLEX_SCHEMA, GRID_SCHEMA);
const DANGLING = danglingFrom(FLEX_SCHEMA, GRID_SCHEMA);

{
  const declared = (schema) => schema.reduce((n, e) => n + (e.relatedTo?.length ?? 0), 0);
  const flexDecl = declared(FLEX_SCHEMA);
  const gridDecl = declared(GRID_SCHEMA);

  check('relatedTo 선언이 양쪽에 있다', flexDecl > 0 && gridDecl > 0,
    `Flex ${flexDecl}건 · Grid ${gridDecl}건`);
  check('짝이 하나 이상', PAIRS.length > 0,
    PAIRS.map((p) => `${p.left.prop}↔${p.right.prop}`).join(' · '));

  // 선언 합 = 짝 + 중복(양쪽이 같은 짝을 건 것) + 상대가 없는 것
  const both = PAIRS.filter((p) => (p.left.relatedTo ?? []).includes(p.right.prop)
    && (p.right.relatedTo ?? []).includes(p.left.prop));
  check('선언 수가 짝·양방향·짝없음으로 남김없이 갈린다',
    flexDecl + gridDecl === PAIRS.length + both.length + DANGLING.length,
    `${flexDecl + gridDecl} = 짝 ${PAIRS.length} + 양방향 ${both.length} + 짝없음 ${DANGLING.length}`);

  check('한쪽만 선언한 짝도 잡는다', PAIRS.length > both.length,
    PAIRS.filter((p) => !both.includes(p)).map((p) => `${p.left.prop}↔${p.right.prop}`).join(' · ') || '없음');

  check('같은 짝이 두 번 나오지 않는다',
    new Set(PAIRS.map((p) => `${p.left.prop}|${p.right.prop}`)).size === PAIRS.length);

  check('짝의 양쪽이 실제 스키마 항목',
    PAIRS.every((p) => FLEX_SCHEMA.includes(p.left) && GRID_SCHEMA.includes(p.right)));

  // 순서를 바꿔도 같은 짝이 나온다
  const flipped = pairsFrom(GRID_SCHEMA, FLEX_SCHEMA);
  check('토픽 순서를 바꿔도 짝 수가 같다', flipped.length === PAIRS.length,
    `${flipped.length}쌍`);
  check('뒤집으면 좌우가 뒤바뀐다',
    flipped.every((p) => GRID_SCHEMA.includes(p.left) && FLEX_SCHEMA.includes(p.right)));

  // 판정이 실제로 잡는지 — 없는 이름을 건 가짜 스키마
  const fake = [{ prop: 'a', relatedTo: ['없는속성'] }];
  const mate = [{ prop: 'b' }];
  check('상대 없는 relatedTo 는 짝이 되지 않는다', pairsFrom(fake, mate).length === 0);
  check('그런 선언은 짝없음으로 남는다',
    JSON.stringify(danglingFrom(fake, mate)) === JSON.stringify([{ topic: 'left', prop: 'a', wanted: '없는속성' }]));
  check('짝없음은 양쪽 방향을 다 본다',
    danglingFrom(mate, fake).length === 1 && danglingFrom(mate, fake)[0].topic === 'right');
}

/* ==========================================================================
   짝을 못 지은 선언 — 조용히 버리지 않는다
   ========================================================================== */
section('짝 없는 선언');

{
  check('짝없음 목록을 낸다', Array.isArray(DANGLING),
    DANGLING.map((d) => `${d.prop} → ${d.wanted}`).join(' · ') || '0건');

  const orphan = DANGLING.every((d) => {
    const other = d.topic === 'left' ? GRID_SCHEMA : FLEX_SCHEMA;
    return !other.some((e) => e.prop === d.wanted);
  });
  check('짝없음은 상대 스키마에 정말 없는 것뿐', orphan);

  if (DANGLING.length > 0) {
    const { host } = build();
    const note = byClass(host, NOTE_CLASS)[0];
    check('화면에 사유가 나온다', Boolean(note) && note.textContent.length > 0, note?.textContent);
    check('사유에 속성 이름이 들어 있다',
      DANGLING.every((d) => note.textContent.includes(d.prop) && note.textContent.includes(d.wanted)));
  } else {
    check('짝없음이 없으면 안내도 없다', byClass(build().host, NOTE_CLASS).length === 0);
  }
}

/* ==========================================================================
   함께 얹는 값
   ========================================================================== */
section('데모 값');

{
  const picked = PAIRS.map((p) => ({ p, v: sharedValue(p.left, p.right) }));

  const shared = picked.filter(({ v }) => v.shared);
  check('대부분의 짝이 같은 값을 얹는다', shared.length > picked.length / 2,
    picked.map(({ p, v }) => `${p.left.prop}=${JSON.stringify(v.left)}${v.shared ? '' : '*'}`).join(' · '));

  check('같은 값을 얹는 짝은 좌우 값이 같다',
    shared.every(({ v }) => JSON.stringify(v.left) === JSON.stringify(v.right)));

  const enums = picked.filter(({ p }) => p.left.values && p.right.values);
  check('enum 짝은 값이 양쪽 values 에 있다',
    enums.every(({ p, v }) => p.left.values.some((x) => x.val === v.left)
      && p.right.values.some((x) => x.val === v.right)),
    `${enums.length}쌍`);

  check('enum 짝은 기본값을 피한다',
    enums.every(({ p, v }) => v.left !== p.left.default || v.left !== p.right.default),
    '기본값이면 두 데모가 초기 상태와 같아 보인다');

  // 타입이 다르면 억지로 맞추지 않는다
  const mixed = picked.filter(({ p }) => p.left.control !== p.right.control);
  check('컨트롤 타입이 다른 짝은 각자의 기본값',
    mixed.every(({ p, v }) => JSON.stringify(v.left) === JSON.stringify(p.left.default)
      && JSON.stringify(v.right) === JSON.stringify(p.right.default)),
    mixed.map(({ p }) => `${p.left.prop}(${p.left.control})↔${p.right.prop}(${p.right.control})`).join(' · ') || '0쌍');

  // 판정이 실제로 잡는지
  const A = { control: 'enum', default: 'x', values: [{ val: 'x' }, { val: 'y' }] };
  const B = { control: 'enum', default: 'x', values: [{ val: 'x' }, { val: 'y' }] };
  check('공통값 중 기본값이 아닌 것을 고른다', sharedValue(A, B).left === 'y');
  check('공통값이 기본값뿐이면 그것을 쓴다',
    sharedValue({ ...A, values: [{ val: 'x' }] }, { ...B, values: [{ val: 'x' }] }).left === 'x');
  check('타입이 같고 values 가 없으면 왼쪽 기본값을 양쪽에',
    (() => { const v = sharedValue({ control: 'length', default: '8px' }, { control: 'length', default: '12px' });
      return v.left === '8px' && v.right === '8px' && v.shared === true; })());
  check('타입이 다르면 각자 기본값',
    (() => { const v = sharedValue({ control: 'length', default: '8px' }, { control: 'track-list', default: [] });
      return v.left === '8px' && v.shared === false; })());
}

/* ==========================================================================
   화면
   ========================================================================== */
section('화면');

{
  const { host, api } = build();
  const root = byClass(host, ROOT_CLASS)[0];

  check('속성 설명 패널 안에 붙는다', Boolean(root) && root.parentNode === host);
  check('맨 앞에 붙는다', host.children[0] === root, '목록·본문보다 위');
  check('패널에 표시 클래스를 남긴다', host.classList.contains(HOST_CLASS),
    '두 열을 가로지르는 행을 CSS 가 잡는다');
  check('접힌 채로 시작', root.open === false, '속성 설명을 읽으러 온 화면을 밀지 않는다');
  check('details 로 접는다', root.tagName === 'DETAILS' && byClass(root, SUMMARY_CLASS)[0].tagName === 'SUMMARY');

  const pairs = byClass(host, PAIR_CLASS);
  check(`짝 ${PAIRS.length}개가 전부 화면에`, pairs.length === PAIRS.length, `${pairs.length}개`);
  check('짝마다 두 패널', pairs.every((p) => byClass(p, SIDE_CLASS).length === 2));
  check('패널마다 데모', byClass(host, DEMO_CLASS).length === PAIRS.length * 2);
  check('패널마다 값 표시', byClass(host, VALUE_CLASS).length === PAIRS.length * 2);

  check('짝 표식이 두 속성 이름', pairs.every((p, i) =>
    p.getAttribute('data-pair') === `${PAIRS[i].left.prop}|${PAIRS[i].right.prop}`));
  check('패널마다 토픽 표식',
    pairs.every((p) => {
      const [a, b] = byClass(p, SIDE_CLASS);
      return a.getAttribute('data-topic') === 'flex' && b.getAttribute('data-topic') === 'grid';
    }), '같은 이름이 두 번 나오므로 이것만이 구분이다');

  const items = byClass(host, DEMO_ITEM_CLASS);
  const countOf = (entry, demos) => (demos?.[entry.prop]?.itemCount ?? entry.demo?.itemCount ?? 3);
  const expected = PAIRS.reduce((n, p) =>
    n + countOf(p.left, TOPICS.flex.demos) + countOf(p.right, TOPICS.grid.demos), 0);
  check('데모 아이템 수가 판 설정을 따른다', items.length === expected,
    `${items.length}개 / 기대 ${expected}개`);
  check('토픽의 demos 가 스키마 demo 를 덮는다',
    PAIRS.some((p) => TOPICS.grid.demos?.[p.right.prop]),
    '속성 설명 탭과 같은 판을 쓴다');

  check('아이템 속성은 첫 아이템에만',
    pairs.every((p, i) => [PAIRS[i].left, PAIRS[i].right].every((entry, side) => {
      if (entry.scope !== 'item') return true;
      const demo = byClass(byClass(p, SIDE_CLASS)[side], DEMO_CLASS)[0];
      return demo.children.filter((c) => c.getAttribute('data-target')).length === 1;
    })), '전부 같은 값을 주면 비교가 되지 않는다');

  check('innerHTML 0건', stats.innerHTML === 0, `${stats.innerHTML}회`);

  // 접기·펴기
  check('open(true) 로 펼쳐진다', api.open(true) === true && root.open === true);
  check('open(false) 로 접힌다', api.open(false) === false);

  // 요약 줄의 건수는 데이터가 센다
  check('요약 줄에 짝 수가 실린다', byClass(host, SUMMARY_CLASS)[0].textContent.includes(String(PAIRS.length)),
    byClass(host, SUMMARY_CLASS)[0].textContent);

  // 토픽을 바꿔 세우면 왼쪽이 바뀐다
  const flipped = build('grid', 'flex');
  const first = byClass(flipped.host, SIDE_CLASS)[0];
  check('보는 토픽이 왼쪽에 온다', first.getAttribute('data-topic') === 'grid');
}

/* ==========================================================================
   문장 — 전부 스키마에서 나온다
   ========================================================================== */
section('문장 파생');

{
  const { host } = build();
  const sides = byClass(host, SIDE_CLASS);

  const flat = (s) => String(s).replace(/<\/?[a-z]+>/gi, '');

  const texts = sides.map((side) => byClass(side, TEXT_CLASS).map(textOf).join(' '));
  const entries = PAIRS.flatMap((p) => [p.left, p.right]);

  check('패널마다 desc 가 실린다',
    entries.every((entry, i) => texts[i].includes(flat(entry.desc))),
    `${entries.length}개`);

  const withTip = entries.filter((e) => e.tip);
  check('tip 이 있으면 함께 실린다',
    withTip.every((entry) => {
      const at = entries.indexOf(entry);
      return texts[at].includes(flat(entry.tip));
    }), `${withTip.length}개`);

  check('속성 이름은 스키마의 prop 그대로',
    byClass(host, NAME_CLASS).every((n, i) => n.textContent.includes('') && textOf(n).includes(entries[i].prop)));

  // 하드코딩 — 대조용 문장이나 속성 이름이 코드에 없어야 한다
  const src = codeOnly(read('../js/ui/compare.js'));
  const props = [...new Set([...FLEX_SCHEMA, ...GRID_SCHEMA].map((e) => e.prop))];
  const quoted = (v) => src.includes(`'${v}'`) || src.includes(`"${v}"`) || src.includes(`\`${v}\``);
  const hitProps = props.filter(quoted);
  check('compare.js 에 속성 이름 0건', hitProps.length === 0, hitProps.join(', ') || `${props.length}개 전부 없음`);

  const values = [...new Set([...FLEX_SCHEMA, ...GRID_SCHEMA]
    .flatMap((e) => (e.values ?? []).map((v) => String(v.val))))];
  const hitValues = values.filter(quoted);
  check('compare.js 에 속성 값 0건', hitValues.length === 0, hitValues.join(', ') || `${values.length}개 전부 없음`);

  const sentences = [...new Set([...FLEX_SCHEMA, ...GRID_SCHEMA]
    .flatMap((e) => [e.desc, e.tip]).filter(Boolean))];
  const hitText = sentences.filter((s) => src.includes(s.slice(0, 20)));
  check('compare.js 에 설명 문장 0건', hitText.length === 0,
    hitText.join(' / ') || `${sentences.length}개 전부 없음`);

  check('compare.js 색상 리터럴 0건', (read('../js/ui/compare.js').match(COLOR) ?? []).length === 0);
  check('인라인 onclick 0건', !/onclick/i.test(read('../js/ui/compare.js'))
    && !/onclick/i.test(read('../index.html')));
  check('마크업에 대조 문구 없음', !read('../index.html').includes('대조'));
}

/* ==========================================================================
   무해 — store 를 건드리지 않는다
   ========================================================================== */
section('상태 무해');

{
  const store = createStore({ flex: FLEX_SCHEMA, grid: GRID_SCHEMA });
  const before = JSON.stringify(store.getState());
  let notified = 0;
  store.subscribe(() => { notified++; });

  const { api } = build();
  api.open(true);
  api.open(false);

  check('상태가 그대로', JSON.stringify(store.getState()) === before);
  check('구독 통지 0회', notified === 0, `${notified}회`);
  check('undo 할 것이 없다', store.canUndo() === false);
  check('토픽도 그대로', store.getTopic() === 'flex');

  const src = codeOnly(read('../js/ui/compare.js'));
  check('compare.js 가 store 를 import 하지 않는다', !/from '.*store\.js'/.test(src));
  check('compare.js 에 dispatch 가 없다', !/dispatch/.test(src));
  check('compare.js 가 renderer 에서 값 변환만 가져온다',
    !/createRenderer/.test(src) && /toCssValue/.test(src));
}

/* ==========================================================================
   배선 — 속성 설명 탭 안에 산다
   ========================================================================== */
section('배선');

{
  const src = codeOnly(read('../js/main.js'));
  check('main.js 가 대조를 세운다', /createCompare\(/.test(src));
  check('속성 설명 패널에 붙인다', /host:\s*explainRoot/.test(src));
  check('토픽이 바뀌면 다시 짓는다', /buildCompare\(topic\)/.test(src));
  check('상대 토픽을 store 목록에서 찾는다', /getTopics\(\)/.test(src));
  check('토픽 이름을 코드에 적지 않는다',
    !/'grid'|"grid"|'flex'|"flex"/.test(src.slice(src.indexOf('function buildCompare'))),
    'buildCompare 안');

  const tabs = read('../js/core/store.js');
  check('탭을 늘리지 않았다', (tabs.match(/'playground'|'explain'|'examples'|'challenge'/g) ?? []).length === 4,
    'TABS 4개 그대로 — store.js 는 손대지 않았다');

  const css = read('../css/components.css');
  check('두 열을 가로지르는 규칙이 있다', /\.fgp-compare\s*\{[^}]*grid-column:\s*1 \/ -1/.test(css));
  check('행 크기를 못 박아 안쪽 스크롤을 지킨다',
    /\.fgp-pane\.has-compare\s*\{[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\)/.test(css));
  check('모바일에서 두 패널을 쌓는다',
    /max-width: 599px[\s\S]*\.fgp-compare__pair\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/.test(css));
  check('펼친 본문에 높이 상한과 자체 스크롤이 있다',
    /min-width: 600px\)\s*\{\s*\.fgp-compare__body\s*\{[^}]*max-height:[^}]*overflow-y:\s*auto/.test(css),
    '상한이 없으면 아래쪽 짝이 잘린 채 닿을 수 없다');
  check('상한을 접힘 줄이 아니라 본문에 건다',
    !/\.fgp-compare\s*\{[^}]*max-height/.test(css), '스크롤 중에도 다시 접을 수 있어야 한다');
  check('공통 틀 클래스를 그대로 쓴다', css.includes(`.${PANE_CLASS}.${HOST_CLASS}`));
}

/* ==========================================================================
   방어
   ========================================================================== */
section('방어');

{
  let threw = 0;
  try { createCompare({ left: TOPICS.flex, right: { schema: [] }, host: createElement('div'), doc }); } catch { threw++; }
  try { createCompare({ left: TOPICS.flex, right: TOPICS.grid, host: null, doc }); } catch { threw++; }
  try { createCompare({ left: TOPICS.flex, right: TOPICS.grid, host: createElement('div'), doc: null }); } catch { threw++; }
  check('빈 스키마·host 없음·document 없음을 막는다', threw === 3, `${threw}/3`);

  check('relatedTo 가 없는 스키마면 짝 0개',
    pairsFrom([{ prop: 'a' }], [{ prop: 'b' }]).length === 0);
  check('빈 배열을 넣어도 죽지 않는다',
    pairsFrom().length === 0 && danglingFrom().length === 0);
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
