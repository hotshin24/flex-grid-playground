/**
 * check-presets.mjs — 프리셋 확인 (F-11)
 *
 * 프리셋의 키는 스키마의 jsProp 이어야 한다. 오타는 조용히 무시되므로
 * 화면에서는 "적용했는데 아무 일도 없다"로만 보인다. 여기서 잡는다.
 *
 *   node tools/check-presets.mjs
 */

import { readFileSync } from 'node:fs';
import { FLEX_PRESETS } from '../js/topics/flex/presets.js';
import { GRID_PRESETS } from '../js/topics/grid/presets.js';
import { FLEX_SCHEMA } from '../js/topics/flex/schema.js';
import { GRID_SCHEMA } from '../js/topics/grid/schema.js';
import { partitionByScope, defaultsFrom, CONTROL_TYPES } from '../js/core/schema-spec.js';
import { generateCss } from '../js/core/codegen.js';
import { createStore } from '../js/core/store.js';

let failed = 0;

function check(label, ok, detail = '') {
  console.log(`  [${ok ? 'OK  ' : 'FAIL'}] ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const SCOPED = partitionByScope(FLEX_SCHEMA);
const containerProps = new Map(SCOPED.container.map((e) => [e.jsProp, e]));
const itemProps = new Map(SCOPED.item.map((e) => [e.jsProp, e]));
const GEOMETRY = ['width', 'height'];

/** main.js가 적용하는 것과 같은 방식. dispatch 한 번으로 끝낸다. */
function itemsFrom(preset, fallback) {
  const source = preset.items ?? [];
  const count = preset.itemCount ?? source.length;
  if (count === 0) return fallback;

  const base = { ...defaultsFrom(FLEX_SCHEMA, 'item'), ...(fallback[0] ?? {}) };

  return Array.from({ length: count }, (_, i) => ({
    ...base,
    ...(source[i] ?? source[source.length - 1] ?? {}),
    id: i + 1,
  }));
}

function apply(store, preset) {
  const state = store.getState();
  const items = itemsFrom(preset, state.items);
  store.dispatch({ container: preset.container ?? {}, items, selectedId: items[0]?.id ?? null });
}

/* ==========================================================================
   목록
   ========================================================================== */
section('프리셋 목록');

{
  check('5종 있음', FLEX_PRESETS.length === 5, `${FLEX_PRESETS.length}종`);
  check('id 유일', new Set(FLEX_PRESETS.map((p) => p.id)).size === FLEX_PRESETS.length);
  check('v0.1의 5종과 id 일치',
    eq(FLEX_PRESETS.map((p) => p.id).sort(), ['card', 'center', 'nav', 'sidebar', 'space']),
    FLEX_PRESETS.map((p) => p.id).join(', '));
  check('label·desc 전량 보유', FLEX_PRESETS.every((p) => p.label?.trim() && p.desc?.trim()));
  check('container 전량 보유', FLEX_PRESETS.every((p) => p.container && typeof p.container === 'object'));

  const src = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  check('main.js에 설정값 하드코딩 없음',
    !/justifyContent:\s*'(center|space-between|flex-start)'/.test(src) && !/flexBasis:\s*'160px'/.test(src));

  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  check('마크업에 프리셋 라벨 없음', FLEX_PRESETS.every((p) => !html.includes(p.label)));
}

/* ==========================================================================
   스키마 정합성
   ========================================================================== */
section('스키마 정합성');

{
  const badContainer = [];
  const badItem = [];
  const badValue = [];

  FLEX_PRESETS.forEach((preset) => {
    Object.entries(preset.container ?? {}).forEach(([key, value]) => {
      const entry = containerProps.get(key);
      if (!entry) { badContainer.push(`${preset.id}.${key}`); return; }
      if (entry.values && !entry.values.some((v) => v.val === value)) {
        badValue.push(`${preset.id}.${key}=${value}`);
      }
    });

    (preset.items ?? []).forEach((item, i) => {
      Object.entries(item).forEach(([key, value]) => {
        if (GEOMETRY.includes(key)) {
          if (!Number.isFinite(value)) badItem.push(`${preset.id}[${i}].${key} 는 숫자여야 함`);
          return;
        }
        const entry = itemProps.get(key);
        if (!entry) { badItem.push(`${preset.id}[${i}].${key}`); return; }
        if (entry.values && !entry.values.some((v) => v.val === value)) {
          badValue.push(`${preset.id}[${i}].${key}=${value}`);
        }
      });
    });
  });

  check('container 키가 전부 스키마 jsProp', badContainer.length === 0, badContainer.join(', ') || '오타 0건');
  check('items 키가 전부 스키마 jsProp 또는 기하값', badItem.length === 0, badItem.join(', ') || '오타 0건');
  check('enum 값이 전부 스키마 values에 있음', badValue.length === 0, badValue.join(', ') || '이상 0건');

  check('프리셋에 id 필드를 넣지 않음',
    FLEX_PRESETS.every((p) => (p.items ?? []).every((it) => it.id === undefined)),
    'id는 적용 시점에 붙인다');

  // 일부러 망가뜨려 검증이 실제로 잡는지
  const broken = { id: 'x', label: 'x', desc: 'x', container: { justifyContnet: 'center' } };
  const caught = Object.keys(broken.container).some((k) => !containerProps.has(k));
  check('오타 키를 실제로 잡는다', caught, 'justifyContnet');
}

/* ==========================================================================
   적용
   ========================================================================== */
section('적용');

{
  FLEX_PRESETS.forEach((preset) => {
    const store = createStore({ flex: FLEX_SCHEMA });
    apply(store, preset);
    const state = store.getState();

    const containerOk = Object.entries(preset.container).every(([k, v]) => state.container[k] === v);
    const countOk = state.items.length === (preset.itemCount ?? preset.items.length);
    const itemOk = (preset.items ?? []).every((expected, i) =>
      Object.entries(expected).every(([k, v]) => state.items[i][k] === v));

    check(`${preset.id} 적용`, containerOk && countOk && itemOk,
      `container ${containerOk ? 'OK' : 'X'} · 개수 ${state.items.length} · items ${itemOk ? 'OK' : 'X'}`);
  });

  const store = createStore({ flex: FLEX_SCHEMA });
  apply(store, FLEX_PRESETS[1]);
  const state = store.getState();
  check('아이템 id는 1부터 연번', eq(state.items.map((i) => i.id), [1, 2, 3]));
  check('선택은 첫 아이템', state.selectedId === state.items[0].id);
}

/* ==========================================================================
   빠진 키 — 프리셋이 스키마 속성을 빠뜨려도 상태는 온전해야 한다

   v0.1 프리셋에는 flex 키가 없었다. 그대로 넣으면 값이 undefined 인 채
   렌더러에 들어가고, flex 는 단축 속성이라 앞서 넣은 grow·shrink·basis 를
   전부 지운다. 생성 CSS 에도 "flex: ;" 가 나온다.
   ========================================================================== */
section('빠진 키 보정');

{
  const itemKeys = Object.keys(defaultsFrom(FLEX_SCHEMA, 'item'));
  const missing = [];
  FLEX_PRESETS.forEach((p) => {
    (p.items ?? []).forEach((item, i) => {
      itemKeys.filter((k) => !(k in item)).forEach((k) => missing.push(`${p.id}[${i}].${k}`));
    });
  });
  check('프리셋이 빠뜨린 키가 있음 (보정 대상)', missing.length > 0, missing.join(', ') || '없음');

  FLEX_PRESETS.forEach((preset) => {
    const store = createStore({ flex: FLEX_SCHEMA });
    apply(store, preset);
    const state = store.getState();

    const complete = state.items.every((item) => itemKeys.every((k) => item[k] !== undefined));
    check(`${preset.id} — 상태 아이템에 빈 키 없음`, complete);

    const css = generateCss(state, FLEX_SCHEMA);
    check(`${preset.id} — 생성 CSS에 빈 선언 없음`, !/:\s*;/.test(css),
      (css.match(/^.*:\s*;.*$/m) ?? ['없음'])[0].trim());
  });

  // 단축 속성이 개별 속성을 지우지 않는지
  const store = createStore({ flex: FLEX_SCHEMA });
  apply(store, FLEX_PRESETS.find((p) => p.id === 'sidebar'));
  const first = store.getState().items[0];
  check('sidebar 첫 아이템의 basis·shrink 유지', first.flexBasis === '160px' && first.flexShrink === 0,
    `basis=${first.flexBasis} shrink=${first.flexShrink}`);
  check('빠졌던 flex는 스키마 기본값으로', first.flex === FLEX_SCHEMA.find((e) => e.jsProp === 'flex').default,
    String(first.flex));
}

/* ==========================================================================
   히스토리 — dispatch 1회, undo 1회
   ========================================================================== */
section('히스토리');

{
  FLEX_PRESETS.forEach((preset) => {
    const store = createStore({ flex: FLEX_SCHEMA });
    const before = JSON.stringify(store.getState());

    let notified = 0;
    store.subscribe(() => notified++);

    apply(store, preset);
    check(`${preset.id} — dispatch 1회`, notified === 1, `${notified}회 통지`);

    store.undo();
    check(`${preset.id} — undo 1회로 원복`, JSON.stringify(store.getState()) === before);
    check(`${preset.id} — 되돌린 뒤 더 되돌릴 것 없음`, store.canUndo() === false);
  });

  // 조작을 섞어도 프리셋은 한 칸이다
  const store = createStore({ flex: FLEX_SCHEMA });
  store.dispatch({ container: { gap: '24px' } });
  const mid = JSON.stringify(store.getState());
  apply(store, FLEX_PRESETS[3]);
  store.undo();
  check('앞선 조작 상태로 정확히 복귀', JSON.stringify(store.getState()) === mid);
  check('redo로 프리셋이 다시 온다',
    (() => { store.redo(); return store.getState().container.flexBasis === undefined && store.getState().items.length === 2; })());
}

/* ==========================================================================
   토픽 분리
   ========================================================================== */
section('토픽 분리');

{
  const src = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  check('main.js가 토픽 레지스트리로 받음', /PRESETS\s*=\s*\{[^}]*flex:[^}]*grid:/.test(src));
  check('토픽 키로 조회', /PRESETS\[/.test(src));

  const presetSrc = readFileSync(new URL('../js/topics/flex/presets.js', import.meta.url), 'utf8');
  check('색상 리터럴 0건', (presetSrc.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? []).length === 0);
  check('presets.js는 store를 모른다', !/store/i.test(presetSrc));
}

/* ==========================================================================
   Grid 프리셋 (F-11)

   Flex 5종은 v0.1 이관이라 원본과 대조하지만 Grid 5종은 신규 작성이라 대조할
   원본이 없다. 대신 스키마 정합성과, 빠뜨렸을 때 조용히 틀리는 것들을 본다.
   ========================================================================== */
section('Grid 프리셋 — 목록');

const G_SCOPED = partitionByScope(GRID_SCHEMA);
const G_CONTAINER = new Map(G_SCOPED.container.map((e) => [e.jsProp, e]));
const G_ITEM = new Map(G_SCOPED.item.map((e) => [e.jsProp, e]));

{
  check('Grid 프리셋 5종', GRID_PRESETS.length === 5, `${GRID_PRESETS.length}종`);
  check('id 유일', new Set(GRID_PRESETS.map((p) => p.id)).size === GRID_PRESETS.length);

  const clash = GRID_PRESETS.map((p) => p.id).filter((id) => FLEX_PRESETS.some((f) => f.id === id));
  check('Flex 프리셋과 id 충돌 없음', clash.length === 0,
    clash.join(', ') || `${GRID_PRESETS.length + FLEX_PRESETS.length}종 전부 다름`);

  check('label·desc 전량 보유', GRID_PRESETS.every((p) => p.label?.trim() && p.desc?.trim()));
  check('label 중복 없음', new Set(GRID_PRESETS.map((p) => p.label)).size === GRID_PRESETS.length);

  const src = readFileSync(new URL('../js/topics/grid/presets.js', import.meta.url), 'utf8');
  check('색상 리터럴 0건', (src.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? []).length === 0);
  check('store 를 모른다', !/\bstore\b/i.test(src));
  check('신규 작성이라는 성격이 주석에 남아 있다', /v1\.0 신규 작성/.test(src));
}

/* --------------------------------------------------------------------------
   컨테이너 — 12키를 전부 적어야 한다

   빠뜨린 키는 이전 프리셋의 값이 그대로 남는다. 무엇을 눌렀느냐가 아니라 그
   전에 무엇을 눌렀느냐에 따라 그림이 달라지는, 재현되지 않는 상태가 된다.
   -------------------------------------------------------------------------- */
section('Grid 프리셋 — 컨테이너');

{
  const keys = [...G_CONTAINER.keys()];
  check('스키마 컨테이너 속성이 12개', keys.length === 12, `${keys.length}개`);

  const missing = GRID_PRESETS.flatMap((p) => keys.filter((k) => !(k in p.container)).map((k) => `${p.id}.${k}`));
  check('5종이 12키를 전부 명시', missing.length === 0,
    missing.join(', ') || `${GRID_PRESETS.length}종 × ${keys.length}키`);

  const extra = GRID_PRESETS.flatMap((p) => Object.keys(p.container)
    .filter((k) => !G_CONTAINER.has(k)).map((k) => `${p.id}.${k}`));
  check('스키마에 없는 키 0건', extra.length === 0, extra.join(', ') || '오타 0건');

  const badEnum = GRID_PRESETS.flatMap((p) => Object.entries(p.container)
    .filter(([k, v]) => {
      const entry = G_CONTAINER.get(k);
      return entry?.values && !entry.values.some((x) => x.val === v);
    })
    .map(([k, v]) => `${p.id}.${k}=${v}`));
  check('enum 값이 전부 스키마 values 에 있음', badEnum.length === 0, badEnum.join(', ') || '이상 0건');

  // track-list 는 배열이어야 한다. 문자열로 적으면 렌더러가 그대로 얹어 버린다
  const TRACKS = ['gridTemplateColumns', 'gridTemplateRows'];
  const notArray = GRID_PRESETS.flatMap((p) => TRACKS
    .filter((k) => !Array.isArray(p.container[k])).map((k) => `${p.id}.${k}`));
  check('track-list 값이 배열', notArray.length === 0, notArray.join(', ') || TRACKS.join(' · '));

  /* 명시 행이 auto 인데 gridAutoRows 가 고정 크기면 첫 줄만 내용 높이로
     주저앉는다. 아이템 크기가 박혀 있을 때는 그 크기가 가려 주지만, 칸을
     채우는 프리셋에서는 첫 줄만 납작해진 그림이 그대로 드러난다. */
  const AUTO_ROW = 'auto';
  const rowMismatch = GRID_PRESETS.filter((p) => {
    const explicit = p.container.gridTemplateRows ?? [];
    const onlyAuto = explicit.length > 0 && explicit.every((t) => t.unit === AUTO_ROW);
    return onlyAuto && p.container.gridAutoRows !== AUTO_ROW;
  });
  check('명시 행과 gridAutoRows 가 어긋나지 않음', rowMismatch.length === 0,
    rowMismatch.map((p) => `${p.id}: rows auto · auto-rows ${p.container.gridAutoRows}`).join(', ')
      || `${GRID_PRESETS.length}종`);

  const rep = GRID_PRESETS.filter((p) => JSON.stringify(p.container).includes('repeat('));
  check('repeat() 0건', rep.length === 0,
    rep.map((p) => p.id).join(', ') || '파서가 트랙 수를 잃는다');

  // 트랙 원소가 계약이 읽는 모양인가
  const badTrack = GRID_PRESETS.flatMap((p) => TRACKS.flatMap((k) => (p.container[k] ?? [])
    .filter((t) => !t || typeof t !== 'object' || !t.unit)
    .map(() => `${p.id}.${k}`)));
  check('트랙 원소가 { size, unit } 모양', badTrack.length === 0, badTrack.join(', ') || '이상 0건');
}

/* --------------------------------------------------------------------------
   아이템 — 스키마 7키 + 기하값, id 는 없다
   -------------------------------------------------------------------------- */
section('Grid 프리셋 — 아이템');

{
  const keys = [...G_ITEM.keys()];
  const GEOMETRY = ['width', 'height'];
  check('스키마 아이템 속성이 7개', keys.length === 7, `${keys.length}개`);

  const missing = GRID_PRESETS.flatMap((p) => (p.items ?? []).flatMap((it, i) =>
    keys.filter((k) => !(k in it)).map((k) => `${p.id}[${i}].${k}`)));
  check('아이템이 7키를 전부 명시', missing.length === 0, missing.join(', ') || `${keys.length}키`);

  /* width·height 는 숫자 또는 null 이다. null 은 "크기를 정하지 않는다" 는 뜻이고,
     renderer 가 유한한 수일 때만 크기를 얹으므로 아이템이 자기 칸을 채운다.
     키를 아예 빼면 앞 프리셋의 값을 물려받으므로 반드시 적어야 한다. */
  const geoBad = GRID_PRESETS.flatMap((p) => (p.items ?? []).flatMap((it, i) =>
    GEOMETRY.filter((k) => !(k in it) || (it[k] !== null && !Number.isFinite(it[k])))
      .map((k) => `${p.id}[${i}].${k}=${it[k]}`)));
  check('width·height 가 숫자 또는 null', geoBad.length === 0,
    geoBad.join(', ') || 'null 은 자동 크기를 뜻한다');

  /* stretch 로 정렬하면서 크기를 박아 두면 stretch 가 할 일이 없다. 영역을 두
     칸으로 잡아 놓고도 아이템은 그 안에 작게 놓인다 — 화면에는 "고장 난 것
     같은 그림" 만 남고 오류는 어디에도 나오지 않는다. */
  const STRETCH = 'stretch';
  const stretched = GRID_PRESETS.filter((p) =>
    p.container.justifyItems === STRETCH || p.container.alignItems === STRETCH);
  const sized = stretched.filter((p) => (p.items ?? [])
    .some((it) => GEOMETRY.some((k) => Number.isFinite(it[k]))));
  check(`stretch 로 정렬하는 ${stretched.length}종의 크기가 전부 null`, sized.length === 0,
    sized.map((p) => p.id).join(', ') || stretched.map((p) => p.id).join(' '));

  /* 반대로 center 계열은 크기가 있어야 한다. 비우면 아이템이 글자 너비로 줄어
     가운데 정렬이 보이지 않는다. */
  const centered = GRID_PRESETS.filter((p) =>
    p.container.justifyItems === 'center' && p.container.alignItems === 'center');
  const unsized = centered.filter((p) => (p.items ?? [])
    .some((it) => GEOMETRY.some((k) => it[k] === null)));
  check(`가운데 정렬하는 ${centered.length}종은 크기를 갖는다`, unsized.length === 0,
    unsized.map((p) => p.id).join(', ') || centered.map((p) => p.id).join(' '));

  const extra = GRID_PRESETS.flatMap((p) => (p.items ?? []).flatMap((it, i) =>
    Object.keys(it).filter((k) => !G_ITEM.has(k) && !GEOMETRY.includes(k)).map((k) => `${p.id}[${i}].${k}`)));
  check('스키마·기하값 밖의 키 0건', extra.length === 0, extra.join(', ') || '오타 0건');

  const hasId = GRID_PRESETS.filter((p) => (p.items ?? []).some((it) => it.id !== undefined));
  check('아이템에 id 를 넣지 않음', hasId.length === 0,
    hasId.map((p) => p.id).join(', ') || 'id 는 적용 시점에 붙는다');

  const badEnum = GRID_PRESETS.flatMap((p) => (p.items ?? []).flatMap((it, i) =>
    Object.entries(it).filter(([k, v]) => {
      const entry = G_ITEM.get(k);
      return entry?.values && !entry.values.some((x) => x.val === v);
    }).map(([k, v]) => `${p.id}[${i}].${k}=${v}`)));
  check('아이템 enum 값이 스키마에 있음', badEnum.length === 0, badEnum.join(', ') || '이상 0건');

  // span 값은 계약이 읽는 형태여야 한다
  const SPAN_KEYS = [...G_ITEM.entries()].filter(([, e]) => e.control === 'span').map(([k]) => k);
  const badSpan = GRID_PRESETS.flatMap((p) => (p.items ?? []).flatMap((it, i) =>
    SPAN_KEYS.filter((k) => {
      const round = CONTROL_TYPES.span.serialize(CONTROL_TYPES.span.parse(it[k]));
      return round !== String(it[k]);
    }).map((k) => `${p.id}[${i}].${k}=${it[k]}`)));
  check('span 값이 계약을 그대로 왕복', badSpan.length === 0, badSpan.join(', ') || SPAN_KEYS.join(' · '));
}

/* --------------------------------------------------------------------------
   areas — 이름과 판이 맞아야 한다

   어긋나면 아이템이 자동 배치로 떨어지고 이름만 남은 행이 0px 로 접힌다.
   화면에는 "고장 난 것 같은 그림" 만 남고 오류는 어디에도 나오지 않는다.
   -------------------------------------------------------------------------- */
section('Grid 프리셋 — areas');

{
  const withAreas = GRID_PRESETS.filter((p) => p.container.gridTemplateAreas !== 'none');
  check('areas 를 쓰는 프리셋이 있다', withAreas.length > 0,
    withAreas.map((p) => p.id).join(', '));

  withAreas.forEach((p) => {
    const parsed = CONTROL_TYPES['area-grid'].parse(p.container.gridTemplateAreas);
    const cols = p.container.gridTemplateColumns.length;
    const rows = p.container.gridTemplateRows.length;

    check(`${p.id} — 계약 검증 통과`, parsed.errors.length === 0, parsed.errors.join(' / ') || '오류 0건');
    check(`${p.id} — areas 행 수 = 행 트랙 수`, parsed.rows.length === rows,
      `areas ${parsed.rows.length}행 · rows ${rows}트랙`);
    check(`${p.id} — 행마다 칸 수 = 열 트랙 수`,
      parsed.rows.every((r) => r.length === cols),
      `칸 ${[...new Set(parsed.rows.map((r) => r.length))].join(',')} · 열 ${cols}`);

    const names = new Set(parsed.rows.flat().filter((n) => n !== '.'));
    const used = (p.items ?? []).map((it) => it.gridArea).filter((a) => a && a !== 'auto');
    const orphan = used.filter((n) => !names.has(n));
    check(`${p.id} — 아이템의 gridArea 가 판에 있는 이름`, orphan.length === 0,
      orphan.join(', ') || `${used.length}개 · 판의 이름 ${[...names].join(' ')}`);

    const unused = [...names].filter((n) => !used.includes(n));
    check(`${p.id} — 판의 이름이 전부 쓰인다`, unused.length === 0,
      unused.join(', ') || '빈 영역 없음');
  });

  // areas 가 none 인 프리셋은 gridArea 도 auto 여야 한다
  const plain = GRID_PRESETS.filter((p) => p.container.gridTemplateAreas === 'none');
  const stray = plain.flatMap((p) => (p.items ?? [])
    .filter((it) => it.gridArea && it.gridArea !== 'auto').map((it) => `${p.id}=${it.gridArea}`));
  check('판이 없으면 gridArea 도 auto', stray.length === 0,
    stray.join(', ') || `${plain.length}종`);
}

/* --------------------------------------------------------------------------
   적용 — dispatch 1회 · undo 1회
   -------------------------------------------------------------------------- */
section('Grid 프리셋 — 적용');

{
  /** main.js 와 같은 방식. 토픽 스키마의 기본값 위에 프리셋을 얹는다. */
  const applyGrid = (store, preset) => {
    const state = store.getState();
    const source = preset.items ?? [];
    const count = preset.itemCount ?? source.length;
    const base = { ...defaultsFrom(GRID_SCHEMA, 'item'), ...(state.items[0] ?? {}) };
    const items = Array.from({ length: count }, (_, i) => ({
      ...base, ...(source[i] ?? source[source.length - 1] ?? {}), id: i + 1,
    }));
    store.dispatch({ container: preset.container, items, selectedId: items[0]?.id ?? null });
  };

  const itemKeys = Object.keys(defaultsFrom(GRID_SCHEMA, 'item'));

  GRID_PRESETS.forEach((preset) => {
    const store = createStore({ grid: GRID_SCHEMA });
    const before = JSON.stringify(store.getState());

    let notified = 0;
    store.subscribe(() => { notified++; });

    applyGrid(store, preset);
    const state = store.getState();

    const containerOk = Object.entries(preset.container)
      .every(([k, v]) => JSON.stringify(state.container[k]) === JSON.stringify(v));
    const countOk = state.items.length === preset.items.length;
    const itemOk = preset.items.every((expected, i) =>
      Object.entries(expected).every(([k, v]) => state.items[i][k] === v));
    const complete = state.items.every((it) => itemKeys.every((k) => it[k] !== undefined));

    check(`${preset.id} — 적용`, containerOk && countOk && itemOk && complete,
      `container ${containerOk ? 'OK' : 'X'} · 개수 ${state.items.length} · items ${itemOk ? 'OK' : 'X'} · 빈 키 ${complete ? '없음' : '있음'}`);
    check(`${preset.id} — dispatch 1회`, notified === 1, `${notified}회 통지`);

    check(`${preset.id} — 아이템 id 는 1부터 연번`,
      eq(state.items.map((it) => it.id), state.items.map((_, i) => i + 1)));
    check(`${preset.id} — 선택은 첫 아이템`, state.selectedId === 1);

    const css = generateCss(state, GRID_SCHEMA);
    check(`${preset.id} — 생성 CSS에 빈 선언 없음`, !/:\s*;/.test(css),
      (css.match(/^.*:\s*;.*$/m) ?? ['없음'])[0].trim());

    store.undo();
    check(`${preset.id} — undo 1회로 원복`, JSON.stringify(store.getState()) === before);
    check(`${preset.id} — 되돌린 뒤 더 되돌릴 것 없음`, store.canUndo() === false);
  });

  // 토픽이 섞이지 않는다
  const store = createStore({ flex: FLEX_SCHEMA, grid: GRID_SCHEMA });
  store.setTopic('grid');
  applyGrid(store, GRID_PRESETS[0]);
  store.setTopic('flex');
  check('Grid 프리셋이 Flex 상태를 건드리지 않는다',
    JSON.stringify(store.getState().container) === JSON.stringify(defaultsFrom(FLEX_SCHEMA, 'container')));
  store.setTopic('grid');
  check('토픽을 오가도 Grid 상태는 그대로',
    JSON.stringify(store.getState().container.gridTemplateAreas)
    === JSON.stringify(GRID_PRESETS[0].container.gridTemplateAreas));
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
