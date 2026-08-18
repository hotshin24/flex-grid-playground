/**
 * check-store.mjs — store.js 동작 확인
 *
 * 의존성 없는 순수 node 스크립트. 실패가 하나라도 있으면 종료 코드 1.
 *   node tools/check-store.mjs
 */

import { createStore, TABS } from '../js/core/store.js';
import { defaultsFrom } from '../js/core/schema-spec.js';
import { FLEX_SCHEMA } from '../js/topics/flex/schema.js';
import { GRID_SCHEMA } from '../js/topics/grid/schema.js';

let failed = 0;

function check(label, ok, detail = '') {
  const mark = ok ? 'OK  ' : 'FAIL';
  console.log(`  [${mark}] ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const make = () => createStore({ flex: FLEX_SCHEMA, grid: GRID_SCHEMA });

/* ========================================================================== */
section('초기 상태 (PRD 4.4)');

{
  const store = make();
  const s = store.getState();

  check(
    '상태 키 집합',
    eq(Object.keys(s).sort(), ['container', 'containerWidth', 'items', 'selectedId', 'tab', 'topic']),
    Object.keys(s).join(', ')
  );
  check('시작 토픽 flex', s.topic === 'flex' && store.getTopic() === 'flex');
  check('시작 탭 playground', s.tab === 'playground' && TABS.includes(s.tab));
  check('토픽 목록', eq(store.getTopics(), ['flex', 'grid']));
  check('selectedId가 첫 아이템', s.selectedId === s.items[0].id, `selectedId=${s.selectedId}`);
  check('containerWidth 숫자', typeof s.containerWidth === 'number', `${s.containerWidth}`);
}

/* ========================================================================== */
section('스키마 파생 — 리터럴 초기 상태 없음');

{
  const store = make();
  const s = store.getState();
  const cDefaults = defaultsFrom(FLEX_SCHEMA, 'container');
  const iDefaults = defaultsFrom(FLEX_SCHEMA, 'item');

  check('container가 defaultsFrom과 동일', eq(s.container, cDefaults), `${Object.keys(s.container).length}키`);
  check(
    'item이 defaultsFrom + 기하값',
    eq(Object.keys(s.items[0]).sort(), [...Object.keys(iDefaults), 'height', 'id', 'width'].sort()),
    `${Object.keys(s.items[0]).length}키`
  );
  check('아이템 id가 1부터 연번', eq(s.items.map((i) => i.id), [1, 2, 3, 4]));

  const grid = createStore({ grid: GRID_SCHEMA });
  const g = grid.getState();
  check(
    'grid도 동일 경로로 생성',
    eq(g.container, defaultsFrom(GRID_SCHEMA, 'container')),
    `${Object.keys(g.container).length}키`
  );
  check(
    'grid 중첩 기본값 유지 (트랙 배열)',
    Array.isArray(g.container.gridTemplateColumns) && g.container.gridTemplateColumns.length === 3
  );
}

/* ========================================================================== */
section('dispatch / getState');

{
  const store = make();

  store.dispatch({ container: { justifyContent: 'center' } });
  check('container 값 반영', store.getState().container.justifyContent === 'center');
  check(
    'container 나머지 키 보존',
    store.getState().container.flexDirection === 'row',
    `${Object.keys(store.getState().container).length}키 유지`
  );

  store.dispatch({ tab: 'explain', selectedId: 3 });
  const s = store.getState();
  check('최상위 키 병합', s.tab === 'explain' && s.selectedId === 3);
  check('직전 patch 유지', s.container.justifyContent === 'center');

  const items = s.items.slice(0, 2);
  store.dispatch({ items });
  check('items는 통째 교체', store.getState().items.length === 2);

  let threw = false;
  try { store.dispatch(null); } catch { threw = true; }
  check('잘못된 patch 거부', threw);
}

/* ========================================================================== */
section('getState 불변성');

{
  const store = make();
  const s = store.getState();

  s.container.justifyContent = 'MUTATED';
  s.items[0].width = 999;
  check('반환값 수정이 저장소에 영향 없음',
    store.getState().container.justifyContent !== 'MUTATED' && store.getState().items[0].width !== 999);
  check('호출마다 새 객체', store.getState() !== store.getState());
}

/* ========================================================================== */
section('subscribe');

{
  const store = make();
  const seen = [];
  const off = store.subscribe((s) => seen.push(s.container.justifyContent));

  store.dispatch({ container: { justifyContent: 'center' } });
  store.dispatch({ container: { justifyContent: 'flex-end' } });
  check('dispatch마다 통지', eq(seen, ['center', 'flex-end']));

  off();
  store.dispatch({ container: { justifyContent: 'space-between' } });
  check('해제 후 통지 없음', seen.length === 2);

  const store2 = make();
  let undoNotified = 0;
  store2.subscribe(() => undoNotified++);
  store2.dispatch({ tab: 'explain' });
  store2.undo();
  store2.redo();
  store2.setTopic('grid');
  check('undo·redo·setTopic도 통지', undoNotified === 4, `${undoNotified}회`);
}

/* ========================================================================== */
section('undo / redo');

{
  const store = make();
  check('초기 canUndo false', store.canUndo() === false && store.canRedo() === false);

  store.dispatch({ container: { justifyContent: 'center' } });
  store.dispatch({ container: { justifyContent: 'flex-end' } });

  check('canUndo true', store.canUndo());
  store.undo();
  check('undo 1회', store.getState().container.justifyContent === 'center');
  store.undo();
  check('undo 2회 → 기본값', store.getState().container.justifyContent === 'flex-start');
  check('바닥에서 canUndo false', store.canUndo() === false);
  store.undo();
  check('바닥에서 undo는 무해', store.getState().container.justifyContent === 'flex-start');

  store.redo();
  check('redo 1회', store.getState().container.justifyContent === 'center');
  store.redo();
  check('redo 2회', store.getState().container.justifyContent === 'flex-end');
  check('꼭대기에서 canRedo false', store.canRedo() === false);

  store.undo();
  store.dispatch({ container: { justifyContent: 'space-evenly' } });
  check('새 dispatch가 redo 스택을 비움', store.canRedo() === false);
}

/* ========================================================================== */
section('토픽별 독립 보관');

{
  const store = make();

  store.dispatch({ container: { justifyContent: 'center' }, tab: 'explain' });
  store.setTopic('grid');

  const g = store.getState();
  check('grid는 자기 기본값', eq(g.container, defaultsFrom(GRID_SCHEMA, 'container')));
  check('grid 탭은 영향 없음', g.tab === 'playground');
  check('topic 필드 갱신', g.topic === 'grid' && store.getTopic() === 'grid');

  store.dispatch({ container: { gridAutoFlow: 'column' } });
  store.setTopic('flex');

  const f = store.getState();
  check('flex 복귀 시 값 보존', f.container.justifyContent === 'center' && f.tab === 'explain');
  check('flex에 grid 속성 유입 없음', f.container.gridAutoFlow === undefined);

  store.setTopic('grid');
  check('grid 값도 보존', store.getState().container.gridAutoFlow === 'column');
}

/* ========================================================================== */
section('히스토리 토픽별 분리');

{
  const store = make();

  store.dispatch({ container: { justifyContent: 'center' } });
  store.setTopic('grid');
  check('grid 히스토리는 비어 있음', store.canUndo() === false);

  store.dispatch({ container: { gridAutoFlow: 'column' } });
  store.undo();
  check('grid undo가 grid에만 적용', store.getState().container.gridAutoFlow === 'row');

  store.setTopic('flex');
  check('flex 히스토리 살아 있음', store.canUndo() === true);
  store.undo();
  check('flex undo 정상', store.getState().container.justifyContent === 'flex-start');

  store.setTopic('grid');
  check('grid redo 스택 보존', store.canRedo() === true);
}

/* ========================================================================== */
section('히스토리 깊은 복사 (grid 중첩 값)');

{
  const store = createStore({ grid: GRID_SCHEMA });
  const before = store.getState().container.gridTemplateColumns;

  const tracks = store.getState().container.gridTemplateColumns;
  tracks.push({ size: 200, unit: 'px' });
  store.dispatch({ container: { gridTemplateColumns: tracks } });
  check('트랙 추가 반영', store.getState().container.gridTemplateColumns.length === 4);

  store.undo();
  check('undo가 중첩 배열까지 복원',
    eq(store.getState().container.gridTemplateColumns, before),
    `${store.getState().container.gridTemplateColumns.length}트랙`);
}

/* ========================================================================== */
section('방어');

{
  let threw = 0;
  try { createStore({}); } catch { threw++; }
  try { createStore({ flex: FLEX_SCHEMA }, { topic: 'grid' }); } catch { threw++; }
  try { make().setTopic('없는토픽'); } catch { threw++; }
  try { make().subscribe('함수아님'); } catch { threw++; }
  check('잘못된 입력 4종 거부', threw === 4, `${threw}/4`);
}

/* ========================================================================== */
console.log(failed === 0 ? '\n전체 통과\n' : `\n실패 ${failed}건\n`);
process.exit(failed === 0 ? 0 : 1);
