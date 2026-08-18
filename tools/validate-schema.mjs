/**
 * tools/validate-schema.mjs — 스키마 계약 검증
 *
 * 빌드 도구가 없으므로 이 스크립트가 유일한 자동 방어선이다.
 * 스키마를 수정한 뒤 반드시 실행할 것:  node tools/validate-schema.mjs
 * 종료 코드가 0이 아니면 계약 위반이다.
 */
import {
  validateSchema, partitionByScope, defaultsFrom, parseAreaGrid,
  isInactive, deriveState, INACTIVE_STATE_KEYS,
} from '../js/core/schema-spec.js';
import FLEX from '../js/topics/flex/schema.js';
import GRID from '../js/topics/grid/schema.js';

let failures = 0;
const check = (label, pass, note = '') => {
  if (!pass) failures++;
  console.log(`  [${pass ? 'OK  ' : 'FAIL'}] ${label}${note ? ' — ' + note : ''}`);
};

const EXPECTED = {
  flex: { total: 12, container: 6, item: 6 },
  grid: { total: 19, container: 12, item: 7 },
};

for (const [name, schema] of [['flex', FLEX], ['grid', GRID]]) {
  console.log(`\n── ${name} 스키마 ──`);
  const exp = EXPECTED[name];
  const p = partitionByScope(schema);

  check(`속성 수 ${schema.length}/${exp.total}`, schema.length === exp.total);
  check(`container ${p.container.length}/${exp.container}`, p.container.length === exp.container);
  check(`item ${p.item.length}/${exp.item}`, p.item.length === exp.item);
  check('urlKey 유일성', new Set(schema.map((e) => e.urlKey)).size === schema.length);
  check('MDN 링크 전량 보유', schema.every((e) => e.mdn));
  check('학습 팁 전량 보유', schema.every((e) => e.tip));

  const errs = validateSchema(schema, name);
  check(`계약 검증 (오류 ${errs.length}건)`, errs.length === 0);
  errs.forEach((e) => console.log('         ✗ ' + e));

  const defs = { ...defaultsFrom(schema, 'container'), ...defaultsFrom(schema, 'item') };
  check(`기본 상태 생성 (${Object.keys(defs).length}키)`, Object.keys(defs).length === exp.total);

  const declared = schema.filter((e) => e.inactiveWhen);
  const measured = schema.filter((e) => e.measuredInactive);
  check(
    `inactiveWhen 선언 ${declared.length}건 · measuredInactive ${measured.length}건`,
    validateSchema(schema, name).length === 0,
    declared.map((e) => e.prop).join(', ') || '선언 없음 — 선택 필드이므로 정상'
  );
  check(
    '선언 없는 속성은 전부 활성',
    schema.filter((e) => !e.inactiveWhen).every((e) => isInactive(e).inactive === false),
    `${schema.length - declared.length}개 확인`
  );

  console.log(`         컨트롤 타입: ${[...new Set(schema.map((e) => e.control))].sort().join(', ')}`);
}

console.log('\n── grid-template-areas 유효성 검증기 ──');
const AREA_CASES = [
  ['"hd hd" "sd mn"',  true,  '한 줄 표기'],
  ['"hd hd"\n"sd mn"', true,  '줄바꿈 표기'],
  ['"hd hd" ". mn"',   true,  '빈 칸(.) 포함'],
  ['"hd hd" "sd hd"',  false, 'L자 영역'],
  ['"a b" "c"',        false, '행 길이 불일치'],
  ['"a b" "b a"',      false, '분리된 동일 이름'],
];
for (const [input, shouldPass, label] of AREA_CASES) {
  const r = parseAreaGrid(input);
  check(label, (r.errors.length === 0) === shouldPass, r.errors[0] ?? '');
}
const same = JSON.stringify(parseAreaGrid('"hd hd" "sd mn"').rows)
          === JSON.stringify(parseAreaGrid('"hd hd"\n"sd mn"').rows);
check('한 줄 / 줄바꿈 파싱 결과 동일', same);


/* ==========================================================================
   조건부 비활성 (F-13 유형 A)

   현재 스키마에는 선언이 없다. 그래서 "게이트가 통과한다"는 사실만으로는
   검증기가 동작하는지 알 수 없다. 잘못된 선언을 일부러 만들어 실제로 잡히는지
   확인한다.
   ========================================================================== */

console.log('\n── inactiveWhen 검증기 ──');

/** 최소한의 유효한 2항목 스키마. 여기에 결함을 하나씩 심는다. */
const fixture = (inactiveWhen, extra = {}) => ([
  {
    prop: 'flex-wrap', jsProp: 'flexWrap', scope: 'container', control: 'enum',
    default: 'nowrap', desc: '줄 넘김', urlKey: 'w',
    values: [{ val: 'nowrap', desc: '한 줄' }, { val: 'wrap', desc: '여러 줄' }],
  },
  {
    prop: 'align-content', jsProp: 'alignContent', scope: 'container', control: 'enum',
    default: 'normal', desc: '여러 줄 정렬', urlKey: 'a',
    values: [{ val: 'normal', desc: '기본' }],
    ...(inactiveWhen ? { inactiveWhen } : {}),
    ...extra,
  },
]);

const REASON = 'flex-wrap이 nowrap이라 줄이 하나뿐입니다';

/** 결함을 심은 스키마가 기대한 오류를 내는지 본다. */
const catches = (label, schema, needle) => {
  const errs = validateSchema(schema, 'fixture');
  const hit = errs.some((e) => e.includes(needle));
  check(label, hit, hit ? `잡음: ${errs.find((e) => e.includes(needle))}` : `놓침 (오류 ${errs.length}건)`);
};

// 정상 선언은 통과해야 한다 — 검증기가 무조건 실패하는 게 아님을 먼저 보인다
check(
  '올바른 선언은 오류 없음',
  validateSchema(fixture({ prop: 'flexWrap', equals: 'nowrap', reason: REASON, hint: 'wrap으로 바꿔보세요' }), 'fixture').length === 0
);

catches('없는 prop 참조',
  fixture({ prop: '없는속성', equals: 'nowrap', reason: REASON }), '스키마에 없음');

catches('equals 와 in 동시 지정',
  fixture({ prop: 'flexWrap', equals: 'nowrap', in: ['wrap'], reason: REASON }), '정확히 하나가 필요함');

catches('연산자 누락',
  fixture({ prop: 'flexWrap', reason: REASON }), '정확히 하나가 필요함');

catches('values 에 없는 값 비교',
  fixture({ prop: 'flexWrap', equals: '없는값', reason: REASON }), 'values 에 없음');

catches('in 안에 없는 값 섞임',
  fixture({ prop: 'flexWrap', in: ['wrap', '없는값'], reason: REASON }), 'values 에 없음');

catches('reason 누락',
  fixture({ prop: 'flexWrap', equals: 'nowrap' }), 'reason 이 비어 있음');

catches('reason 이 공백뿐',
  fixture({ prop: 'flexWrap', equals: 'nowrap', reason: '   ' }), 'reason 이 비어 있음');

catches('prop 누락',
  fixture({ equals: 'nowrap', reason: REASON }), 'inactiveWhen.prop 이 없음');

catches('자기 자신 참조',
  fixture({ prop: 'alignContent', equals: 'normal', reason: REASON }), '자기 자신');

catches('알 수 없는 필드 (오타)',
  fixture({ prop: 'flexWrap', equal: 'nowrap', reason: REASON }), "알 수 없는 필드 'equal'");

catches('in 이 배열이 아님',
  fixture({ prop: 'flexWrap', in: 'wrap', reason: REASON }), '배열이어야 함');

catches('inactiveWhen 이 객체가 아님',
  fixture('nowrap'), '객체여야 함');

catches('measuredInactive 와 동시 선언',
  fixture({ prop: 'flexWrap', equals: 'nowrap', reason: REASON }, { measuredInactive: 'hasFreeSpace' }),
  '함께 쓸 수 없음');

catches('measuredInactive 가 빈 문자열',
  fixture(null, { measuredInactive: '' }), 'measuredInactive');

// --- source: 'state' ---

check(
  "source: 'state' 정상 선언 통과",
  validateSchema(fixture({ source: 'state', prop: 'hasMultipleItems', equals: false, reason: REASON }), 'fixture').length === 0
);

catches('화이트리스트에 없는 상태 키',
  fixture({ source: 'state', prop: '없는상태키', equals: true, reason: REASON }), '허용된 상태 키가 아님');

catches('Boolean 상태 키에 문자열 비교',
  fixture({ source: 'state', prop: 'hasMultipleItems', equals: 'false', reason: REASON }), 'Boolean 이므로');

catches('알 수 없는 source',
  fixture({ source: 'measured', prop: 'hasMultipleItems', equals: false, reason: REASON }), 'container | state 중 하나여야 함');

check(
  "source 생략 시 container 로 동작",
  validateSchema(fixture({ prop: 'flexWrap', equals: 'nowrap', reason: REASON }), 'fixture').length === 0
);

catches("source 생략 시 상태 키를 쓰면 잡힘",
  fixture({ prop: 'hasMultipleItems', equals: false, reason: REASON }), '스키마에 없음');

check(
  '화이트리스트가 키를 추가할 수 있는 모양인가',
  Object.entries(INACTIVE_STATE_KEYS).every(([, v]) => v.type && v.desc && typeof v.from === 'function'),
  Object.keys(INACTIVE_STATE_KEYS).join(', ')
);

console.log('\n── isInactive 판정 ──');

const ENTRY = (rule) => ({ prop: 'align-content', jsProp: 'alignContent', inactiveWhen: rule });

check('선언 없으면 항상 활성', isInactive({ prop: 'gap' }, { flexWrap: 'nowrap' }).inactive === false);

{
  const e = ENTRY({ prop: 'flexWrap', equals: 'nowrap', reason: REASON, hint: 'wrap으로 바꿔보세요' });
  const hit = isInactive(e, { container: { flexWrap: 'nowrap' } });
  const miss = isInactive(e, { container: { flexWrap: 'wrap' } });
  check('equals 일치 → 비활성', hit.inactive === true && hit.reason === REASON);
  check('사유와 함께 힌트도 전달', hit.hint === 'wrap으로 바꿔보세요');
  check('equals 불일치 → 활성', miss.inactive === false);
  check('활성일 때는 사유를 싣지 않음', miss.reason === undefined);
}

{
  const e = ENTRY({ prop: 'flexWrap', notEquals: 'wrap', reason: REASON });
  check('notEquals — 다르면 비활성', isInactive(e, { container: { flexWrap: 'nowrap' } }).inactive === true);
  check('notEquals — 같으면 활성', isInactive(e, { container: { flexWrap: 'wrap' } }).inactive === false);
  check('hint 없으면 결과에도 없음', isInactive(e, { container: { flexWrap: 'nowrap' } }).hint === undefined);
}

{
  const e = ENTRY({ prop: 'flexWrap', in: ['nowrap', 'wrap-reverse'], reason: REASON });
  check('in — 포함되면 비활성', isInactive(e, { container: { flexWrap: 'wrap-reverse' } }).inactive === true);
  check('in — 빠지면 활성', isInactive(e, { container: { flexWrap: 'wrap' } }).inactive === false);
}

check('참조 값이 없으면 활성', isInactive(ENTRY({ prop: 'flexWrap', equals: 'nowrap', reason: REASON }), { container: {} }).inactive === false);
check('인자를 안 넘겨도 죽지 않음', isInactive(ENTRY({ prop: 'flexWrap', equals: 'nowrap', reason: REASON })).inactive === false);

/* ==========================================================================
   실제 스키마에 선언된 조건부 비활성 (F-13 2단계)

   합성 fixture가 아니라 flex/schema.js 의 실제 선언으로 판정을 확인한다.
   선언은 있는데 판정이 어긋나면 화면에 아무 증상 없이 조용히 틀린다.
   ========================================================================== */

console.log('\n── 실제 선언 판정 ──');

const declaredInactive = [...FLEX, ...GRID].filter((e) => e.inactiveWhen);
check(`선언된 항목 ${declaredInactive.length}건`, declaredInactive.length > 0,
  declaredInactive.map((e) => `${e.prop} ← ${e.inactiveWhen.prop}`).join(', '));

check('전 선언에 reason 존재', declaredInactive.every((e) => e.inactiveWhen.reason?.trim()));

{
  const ac = FLEX.find((e) => e.prop === 'align-content');
  check('align-content 에 선언 있음', Boolean(ac?.inactiveWhen));

  const nowrap = isInactive(ac, { container: { flexWrap: 'nowrap' } });
  check('flex-wrap: nowrap → 비활성', nowrap.inactive === true);
  check('사유 전달', Boolean(nowrap.reason), nowrap.reason);
  check('힌트 전달', Boolean(nowrap.hint), nowrap.hint);

  check('flex-wrap: wrap → 활성', isInactive(ac, { container: { flexWrap: 'wrap' } }).inactive === false);
  check('flex-wrap: wrap-reverse → 활성', isInactive(ac, { container: { flexWrap: 'wrap-reverse' } }).inactive === false);

  const defaults = defaultsFrom(FLEX, 'container');
  check('기본 상태(nowrap)에서는 비활성', isInactive(ac, { container: defaults }).inactive === true,
    `flexWrap=${defaults.flexWrap}`);
}

{
  const order = FLEX.find((e) => e.prop === 'order');
  check('order 에 선언 있음', Boolean(order?.inactiveWhen));
  check("order 는 source: 'state'", order.inactiveWhen.source === 'state');

  const one = deriveState({ items: [{ id: 1 }] });
  const two = deriveState({ items: [{ id: 1 }, { id: 2 }] });
  check('deriveState — 아이템 1개면 hasMultipleItems false', one.hasMultipleItems === false);
  check('deriveState — 아이템 2개면 true', two.hasMultipleItems === true);
  check('deriveState — 빈 상태도 죽지 않음', deriveState({}).hasMultipleItems === false);

  const hit = isInactive(order, { state: one });
  check('아이템 1개 → 비활성', hit.inactive === true);
  check('사유 전달', Boolean(hit.reason), hit.reason);
  check('힌트 전달', Boolean(hit.hint), hit.hint);
  check('아이템 2개 → 활성', isInactive(order, { state: two }).inactive === false);
  check('아이템 4개 → 활성', isInactive(order, { state: deriveState({ items: [1, 2, 3, 4] }) }).inactive === false);

  check('container 만 넘기면 상태 참조는 활성으로 떨어짐',
    isInactive(order, { container: { flexWrap: 'nowrap' } }).inactive === false);
}

check('선언이 항목 수를 늘리지 않음', FLEX.length === EXPECTED.flex.total, `${FLEX.length}/${EXPECTED.flex.total}`);
check('선언 없는 속성은 여전히 활성 (기존 무영향)',
  [...FLEX, ...GRID].filter((e) => !e.inactiveWhen)
    .every((e) => isInactive(e, { container: defaultsFrom(FLEX, 'container'), state: deriveState({ items: [1] }) }).inactive === false),
  `${[...FLEX, ...GRID].filter((e) => !e.inactiveWhen).length}개 확인`);

console.log(failures === 0 ? '\n전체 통과\n' : `\n실패 ${failures}건\n`);
process.exit(failures === 0 ? 0 : 1);
