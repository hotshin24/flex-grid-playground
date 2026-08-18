/**
 * tools/validate-schema.mjs — 스키마 계약 검증
 *
 * 빌드 도구가 없으므로 이 스크립트가 유일한 자동 방어선이다.
 * 스키마를 수정한 뒤 반드시 실행할 것:  node tools/validate-schema.mjs
 * 종료 코드가 0이 아니면 계약 위반이다.
 */
import { validateSchema, partitionByScope, defaultsFrom, parseAreaGrid } from '../js/core/schema-spec.js';
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

console.log(failures === 0 ? '\n전체 통과\n' : `\n실패 ${failures}건\n`);
process.exit(failures === 0 ? 0 : 1);
