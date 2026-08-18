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
import { FLEX_SCHEMA } from '../js/topics/flex/schema.js';
import { partitionByScope, defaultsFrom } from '../js/core/schema-spec.js';
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

  const html = readFileSync(new URL('../index-v1.html', import.meta.url), 'utf8');
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
  check('main.js가 토픽 레지스트리로 받음', /PRESETS\s*=\s*\{\s*flex:/.test(src));
  check('토픽 키로 조회', /PRESETS\[/.test(src));

  const presetSrc = readFileSync(new URL('../js/topics/flex/presets.js', import.meta.url), 'utf8');
  check('색상 리터럴 0건', (presetSrc.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? []).length === 0);
  check('presets.js는 store를 모른다', !/store/i.test(presetSrc));
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
