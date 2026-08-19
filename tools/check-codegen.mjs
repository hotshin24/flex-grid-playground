/**
 * check-codegen.mjs — codegen.js 동작 확인
 *
 * 의존성 없는 순수 node 스크립트. 실패가 하나라도 있으면 종료 코드 1.
 *   node tools/check-codegen.mjs
 */

import { readFileSync } from 'node:fs';
import { generateCss, generateHtml, generateCode } from '../js/core/codegen.js';
import { createStore } from '../js/core/store.js';
import { FLEX_SCHEMA } from '../js/topics/flex/schema.js';
import { GRID_SCHEMA } from '../js/topics/grid/schema.js';
import { FLEX_PRESETS } from '../js/topics/flex/presets.js';
import { GRID_PRESETS } from '../js/topics/grid/presets.js';
import { defaultsFrom, partitionByScope } from '../js/core/schema-spec.js';

let failed = 0;

function check(label, ok, detail = '') {
  console.log(`  [${ok ? 'OK  ' : 'FAIL'}] ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

const store = (schemas, opts) => createStore(schemas, opts);
const flexStore = () => store({ flex: FLEX_SCHEMA });
const gridStore = () => store({ grid: GRID_SCHEMA });

/** 선택자 하나의 선언만 뽑는다. */
function ruleOf(css, selector) {
  const m = css.match(new RegExp(`\\${selector} \\{\\n([\\s\\S]*?)\\n\\}`));
  return m ? m[1].split('\n').map((l) => l.trim()) : null;
}

const propsOf = (decls) => (decls ?? []).map((d) => d.split(':')[0].trim());

/* ==========================================================================
   구조 규칙
   ========================================================================== */
section('구조 규칙');

{
  const src = readFileSync(new URL('../js/core/codegen.js', import.meta.url), 'utf8');
  check('속성명 분기 없음', !/prop\s*===\s*['"]/.test(src) && !/jsProp\s*===\s*['"]/.test(src));
  check('색상 리터럴 0건', (src.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? []).length === 0);
  check('토픽 전용 로직 없음', !/FLEX_SCHEMA|GRID_SCHEMA/.test(src));
}

/* ==========================================================================
   기본 상태 — 기본값은 나오지 않는다
   ========================================================================== */
section('기본값 생략');

{
  const s = flexStore().getState();
  const css = generateCss(s, FLEX_SCHEMA);
  const container = ruleOf(css, '.container');

  check('컨테이너 규칙은 display 하나뿐', container.length === 1 && container[0] === 'display: flex;', container.join(' '));

  const containerProps = FLEX_SCHEMA.filter((e) => e.scope === 'container').map((e) => e.prop);
  check('기본값인 컨테이너 속성 6개 전부 생략',
    containerProps.every((p) => !container.some((d) => d.startsWith(`${p}:`))),
    containerProps.join(', '));

  const item = ruleOf(css, '.item');
  check('아이템 공통 규칙은 기하값만', propsOf(item).join(',') === 'width,height', propsOf(item).join(', '));

  const itemProps = FLEX_SCHEMA.filter((e) => e.scope === 'item').map((e) => e.prop);
  check('기본값인 아이템 속성 6개 전부 생략',
    itemProps.every((p) => !css.includes(`${p}:`)),
    itemProps.join(', '));

  check('개별 규칙 없음', !/\.item-\d/.test(css));
}

/* ==========================================================================
   바꾼 속성만 나온다
   ========================================================================== */
section('변경분만 출력');

{
  const st = flexStore();
  st.dispatch({ container: { justifyContent: 'center', gap: '24px' } });
  const css = generateCss(st.getState(), FLEX_SCHEMA);
  const container = ruleOf(css, '.container');

  check('바꾼 두 속성이 나옴',
    container.includes('justify-content: center;') && container.includes('gap: 24px;'),
    container.join(' '));
  check('안 바꾼 속성은 그대로 생략', propsOf(container).sort().join(',') === 'display,gap,justify-content');

  st.dispatch({ container: { justifyContent: 'flex-start' } });
  check('기본값으로 되돌리면 다시 사라짐',
    !ruleOf(generateCss(st.getState(), FLEX_SCHEMA), '.container').some((d) => d.startsWith('justify-content')));
}

/* ==========================================================================
   view 는 출력 대상이 아니다
   ========================================================================== */
section('view 제외');

{
  const st = flexStore();
  st.setView({ containerWidth: 420, containerHeight: 240 });
  const css = generateCss(st.getState(), FLEX_SCHEMA);
  const container = ruleOf(css, '.container');

  check('컨테이너에 width·height 없음',
    !container.some((d) => /^(width|height|max-width|min-height):/.test(d)),
    container.join(' '));
  check('뷰 수치가 CSS 어디에도 없음', !css.includes('420px') && !css.includes('240px'));
  check('containerWidth 이름도 안 나감', !css.includes('containerWidth') && !css.includes('containerHeight'));

  // 아이템 기하값(80x60)은 뷰 설정이 아니라 실제 아이템 크기다
  check('아이템 크기는 정상 출력', css.includes('width: 80px;') && css.includes('height: 60px;'));
}

/* ==========================================================================
   아이템 공통 / 개별 분리
   ========================================================================== */
section('아이템 규칙 분리');

{
  const st = flexStore();
  const items = st.getState().items;

  // 전 아이템 같은 값 → 공통
  st.dispatch({ items: items.map((it) => ({ ...it, flexGrow: 1 })) });
  let css = generateCss(st.getState(), FLEX_SCHEMA);
  check('전부 같으면 공통 규칙으로', ruleOf(css, '.item').includes('flex-grow: 1;'));
  check('공통일 때 개별 규칙 없음', !/\.item-\d/.test(css));

  // 하나만 다른 값 → 그 속성만 개별로
  const mixed = st.getState().items.map((it, i) => ({ ...it, flexGrow: i === 1 ? 3 : 1 }));
  st.dispatch({ items: mixed });
  css = generateCss(st.getState(), FLEX_SCHEMA);

  check('다르면 공통에서 빠짐', !ruleOf(css, '.item').some((d) => d.startsWith('flex-grow')));
  check('2번만 flex-grow 3', ruleOf(css, '.item-2').includes('flex-grow: 3;'));
  check('1번은 flex-grow 1', ruleOf(css, '.item-1').includes('flex-grow: 1;'));
  check('기본값과 같은 아이템은 생략',
    (() => {
      const four = st.getState().items.map((it, i) => ({ ...it, flexGrow: i === 1 ? 3 : 0 }));
      const c = generateCss({ ...st.getState(), items: four }, FLEX_SCHEMA);
      return ruleOf(c, '.item-1') === null && ruleOf(c, '.item-2').includes('flex-grow: 3;');
    })());

  check('기하값은 여전히 공통', ruleOf(css, '.item').join(',').includes('width: 80px;'));

  // HTML은 개별 규칙이 있는 아이템에만 번호 클래스를 준다
  const html = generateHtml(st.getState(), FLEX_SCHEMA);
  check('개별 규칙 있는 아이템에 번호 클래스', html.includes('class="item item-2"'));
  check('아이템 수만큼 생성', (html.match(/<div class="item/g) ?? []).length === 4);
  check('컨테이너로 감쌈', html.startsWith('<div class="container">') && html.trim().endsWith('</div>'));
}

/* ==========================================================================
   Grid 스키마 — 토픽 무관
   ========================================================================== */
section('Grid 스키마');

{
  const st = gridStore();
  let css = '';
  let threw = null;
  try { css = generateCss(st.getState(), GRID_SCHEMA); } catch (e) { threw = e.message; }

  check('오류 없이 생성', threw === null, threw ?? '');
  check('display: grid', ruleOf(css, '.container')?.includes('display: grid;'));

  st.dispatch({ container: { gridAutoFlow: 'column', rowGap: '24px' } });
  css = generateCss(st.getState(), GRID_SCHEMA);
  const container = ruleOf(css, '.container');
  check('바꾼 grid 속성 출력', container.includes('grid-auto-flow: column;') && container.includes('row-gap: 24px;'));

  // 트랙 배열이 CSS 문자열로 직렬화되는지
  st.dispatch({ container: { gridTemplateColumns: [{ size: 1, unit: 'fr' }, { size: 200, unit: 'px' }] } });
  css = generateCss(st.getState(), GRID_SCHEMA);
  check('track-list 직렬화',
    ruleOf(css, '.container').includes('grid-template-columns: 1fr 200px;'),
    ruleOf(css, '.container').find((d) => d.startsWith('grid-template-columns')) ?? '없음');

  check('grid도 기본값은 생략', !css.includes('justify-items:') && !css.includes('align-items:'));

  const { html } = generateCode(st.getState(), GRID_SCHEMA);
  check('generateCode가 둘 다 반환', typeof css === 'string' && html.includes('<div class="container">'));
}

/* ==========================================================================
   쓰레기 값 — 복사해 가는 코드에는 실행되는 CSS 만 있어야 한다

   "빈 선언 없음"(:\s*;) 검사만으로는 부족했다. width 가 null 일 때
   `${item.width}px` 가 "nullpx" 를 만들어도 그 검사는 통과한다. 값이 비었는지가
   아니라 값의 모양이 CSS 인지를 봐야 한다.
   ========================================================================== */
section('쓰레기 값');

/** 자바스크립트가 값 대신 흘려보내는 토큰. 붙어 있어도 잡아야 한다. */
const GARBAGE = /null|undefined|NaN/;
const EMPTY_DECL = /:\s*;/;

const clean = (css) => !GARBAGE.test(css) && !EMPTY_DECL.test(css);

/** 상태 하나를 손으로 짓는다. store 를 거치지 않아야 이상한 값을 넣을 수 있다. */
const stateWith = (topic, schema, { container = {}, items }) => ({
  topic,
  container: { ...defaultsFrom(schema, 'container'), ...container },
  items,
  selectedId: items[0]?.id ?? null,
});

const itemWith = (schema, over) => ({ ...defaultsFrom(schema, 'item'), id: 1, width: 80, height: 60, ...over });

{
  /* 기하값이 null 이면 선언 자체가 나오지 않는다 */
  const allAuto = stateWith('grid', GRID_SCHEMA, {
    items: [itemWith(GRID_SCHEMA, { width: null, height: null }),
      itemWith(GRID_SCHEMA, { id: 2, width: null, height: null })],
  });
  const autoCss = generateCss(allAuto, GRID_SCHEMA);
  check('기하값이 null 이면 선언이 없다', !/width|height/.test(autoCss), autoCss.replace(/\n/g, ' '));
  check('그래도 CSS 는 깨끗하다', clean(autoCss));

  /* 아이템마다 다르면 값이 있는 쪽에만 붙는다 */
  const mixed = stateWith('grid', GRID_SCHEMA, {
    items: [itemWith(GRID_SCHEMA), itemWith(GRID_SCHEMA, { id: 2, width: null, height: null })],
  });
  const mixedCss = generateCss(mixed, GRID_SCHEMA);
  check('크기가 있는 아이템에만 선언이 붙는다',
    propsOf(ruleOf(mixedCss, '.item-1')).join(',') === 'width,height'
    && ruleOf(mixedCss, '.item-2') === null,
    'item-1 에만 · item-2 규칙 자체가 없다');
  check('공통 규칙으로 묶이지 않는다', ruleOf(mixedCss, '.item') === null,
    '하나만 값을 가지면 공통이 아니다');
  check('섞여도 CSS 는 깨끗하다', clean(mixedCss));

  /* 전부 같은 값이면 공통 규칙 하나 */
  const same = stateWith('grid', GRID_SCHEMA, {
    items: [itemWith(GRID_SCHEMA), itemWith(GRID_SCHEMA, { id: 2 })],
  });
  check('전부 같으면 공통 규칙 하나',
    propsOf(ruleOf(generateCss(same, GRID_SCHEMA), '.item')).join(',') === 'width,height');

  /* null 말고도 값이 아닌 것들 */
  [['undefined', undefined], ['NaN', Number.NaN], ['문자열', 'auto']].forEach(([label, bad]) => {
    const st = stateWith('grid', GRID_SCHEMA, { items: [itemWith(GRID_SCHEMA, { width: bad })] });
    const css = generateCss(st, GRID_SCHEMA);
    check(`너비가 ${label} 이면 선언이 없다`, !/width:/.test(css) && clean(css),
      (css.match(/width:[^;]*;/) ?? ['선언 없음'])[0]);
  });

  check('0 은 값이므로 나온다', (() => {
    const st = stateWith('grid', GRID_SCHEMA, { items: [itemWith(GRID_SCHEMA, { width: 0 })] });
    return /width: 0px;/.test(generateCss(st, GRID_SCHEMA));
  })(), '0 과 "없음" 은 다른 상태다');

  check('음수도 값이므로 나온다', (() => {
    const st = stateWith('grid', GRID_SCHEMA, { items: [itemWith(GRID_SCHEMA, { width: -5 })] });
    return /width: -5px;/.test(generateCss(st, GRID_SCHEMA));
  })());
}

/* --------------------------------------------------------------------------
   스키마 값 전반 — 어느 속성에 무엇이 들어와도 새지 않아야 한다
   -------------------------------------------------------------------------- */

{
  const BAD = [['null', null], ['undefined', undefined], ['NaN', Number.NaN], ['빈 문자열', '']];

  [['flex', FLEX_SCHEMA], ['grid', GRID_SCHEMA]].forEach(([topic, schema]) => {
    const scoped = partitionByScope(schema);
    const leaks = [];

    BAD.forEach(([label, bad]) => {
      scoped.container.forEach((entry) => {
        const st = stateWith(topic, schema, {
          container: { [entry.jsProp]: bad }, items: [itemWith(schema)],
        });
        if (!clean(generateCss(st, schema))) leaks.push(`${entry.prop}=${label}`);
      });

      scoped.item.forEach((entry) => {
        const st = stateWith(topic, schema, { items: [itemWith(schema, { [entry.jsProp]: bad })] });
        if (!clean(generateCss(st, schema))) leaks.push(`${entry.prop}=${label}`);
      });
    });

    // 트랙 원소가 깨진 경우. 배열 안쪽이라 위 검사가 닿지 않는다
    scoped.container.filter((e) => e.control === 'track-list').forEach((entry) => {
      [[{ size: null, unit: 'px' }], [{ unit: 'fr' }]].forEach((bad) => {
        const st = stateWith(topic, schema, {
          container: { [entry.jsProp]: bad }, items: [itemWith(schema)],
        });
        if (!clean(generateCss(st, schema))) leaks.push(`${entry.prop}=깨진 트랙`);
      });
    });

    const props = scoped.container.length + scoped.item.length;
    check(`${topic} — 속성 ${props}종 × 이상한 값에서 새지 않는다`, leaks.length === 0,
      leaks.join(', ') || `${props * BAD.length}가지 조합`);
  });

  // 검사가 실제로 잡는지
  check('쓰레기 판정이 붙어 있는 토큰도 잡는다',
    GARBAGE.test('  width: nullpx;') && GARBAGE.test('  width: undefinedfr;') && GARBAGE.test('  width: NaNpx;'));
  check('멀쩡한 CSS 는 잡지 않는다',
    clean('  width: 80px;\n  grid-template-areas: "hd hd";\n  align-items: stretch;'));
}

/* --------------------------------------------------------------------------
   프리셋 10종 — 실제로 쓰는 데이터로 확인한다
   -------------------------------------------------------------------------- */

{
  const applyPreset = (topic, schema, preset) => {
    const source = preset.items ?? [];
    const count = preset.itemCount ?? source.length;
    const base = { ...defaultsFrom(schema, 'item'), width: 80, height: 60 };
    const items = Array.from({ length: count }, (_, i) => ({
      ...base, ...(source[i] ?? source[source.length - 1] ?? {}), id: i + 1,
    }));
    return stateWith(topic, schema, { container: preset.container, items });
  };

  [['flex', FLEX_SCHEMA, FLEX_PRESETS], ['grid', GRID_SCHEMA, GRID_PRESETS]].forEach(([topic, schema, presets]) => {
    const dirty = presets.filter((p) => {
      const { css, html } = generateCode(applyPreset(topic, schema, p), schema);
      return !clean(css) || !clean(html);
    });
    check(`${topic} 프리셋 ${presets.length}종의 생성 코드가 깨끗하다`, dirty.length === 0,
      dirty.map((p) => p.id).join(', ') || presets.map((p) => p.id).join(' '));
  });

  // 크기를 null 로 둔 프리셋이 실제로 있어야 이 검사가 의미를 갖는다
  const autoPresets = GRID_PRESETS.filter((p) => (p.items ?? []).some((it) => it.width === null));
  check('크기를 null 로 둔 Grid 프리셋이 있다', autoPresets.length > 0,
    autoPresets.map((p) => p.id).join(' '));
  check('그 프리셋의 CSS 에 width·height 가 없다',
    autoPresets.every((p) => !/width:|height:/.test(generateCss(applyPreset('grid', GRID_SCHEMA, p), GRID_SCHEMA))),
    '자동 크기는 선언하지 않는다');
}

/* ==========================================================================
   방어
   ========================================================================== */
section('방어');

{
  let ok = true;
  try {
    generateCss({ topic: 'flex', container: {}, items: [] }, FLEX_SCHEMA);
    generateHtml({ topic: 'flex', items: [] }, FLEX_SCHEMA);
    generateCss({ topic: 'flex' }, FLEX_SCHEMA);
  } catch { ok = false; }
  check('빈 상태에서도 죽지 않음', ok);

  const css = generateCss({ topic: 'flex', container: {}, items: [] }, FLEX_SCHEMA);
  check('아이템이 없으면 아이템 규칙도 없음', !css.includes('.item'));
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
