/**
 * check-mdn-links.mjs — MDN 링크 확인 (수동 실행)
 *
 * ★ 게이트가 아니다. 게이트 목록에 넣지 않는다.
 *
 * 이 스크립트는 네트워크를 쓴다. 오프라인이거나 MDN 이 잠깐 죽어 있으면 실패하는데,
 * 그때 커밋이 막히면 곤란하다. 링크 상태는 코드의 옳고 그름이 아니라 바깥 세상의
 * 사정이므로 필요할 때 사람이 돌려 본다.
 *
 * 무엇을 잡나 — M4 완료 확인에서 /ko/ 경로 31건 중 16건이 404 였다. 한국어 번역이
 * 없는 문서를 MDN 이 영어로 폴백하지 않고 404 로 돌려주기 때문이다. 그래서 전부
 * /en-US/ 로 옮겼고, 이 스크립트는 그 상태가 유지되는지 확인한다.
 *
 *   node tools/check-mdn-links.mjs
 *   node tools/check-mdn-links.mjs --timeout 15
 */

import { FLEX_SCHEMA } from '../js/topics/flex/schema.js';
import { GRID_SCHEMA } from '../js/topics/grid/schema.js';

const argOf = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at === -1 ? fallback : Number(process.argv[at + 1]) || fallback;
};

const TIMEOUT = argOf('timeout', 10) * 1000;

const TARGETS = [
  ...FLEX_SCHEMA.map((e) => ({ topic: 'flex', prop: e.prop, url: e.mdn })),
  ...GRID_SCHEMA.map((e) => ({ topic: 'grid', prop: e.prop, url: e.mdn })),
];

async function statusOf(url) {
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), TIMEOUT);
  try {
    // HEAD 를 막는 배포가 있어 GET 으로 묻되 본문은 읽지 않는다
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: control.signal });
    return { code: res.status, final: res.url };
  } catch (err) {
    return { code: 0, final: '', error: err.name === 'AbortError' ? '시간 초과' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

console.log(`MDN 링크 ${TARGETS.length}건 확인 (제한 ${TIMEOUT / 1000}초)\n`);

const rows = [];
for (const target of TARGETS) {
  // 한꺼번에 던지지 않는다. 공개 문서 사이트에 예의를 지킨다.
  const result = await statusOf(target.url);
  rows.push({ ...target, ...result });
  const mark = result.code === 200 ? 'OK  ' : 'FAIL';
  console.log(`  [${mark}] ${String(result.code || result.error).padEnd(6)} ${target.topic.padEnd(5)} ${target.prop}`);
}

const bad = rows.filter((r) => r.code !== 200);
const wrongLocale = rows.filter((r) => !/\/en-US\//.test(r.url));

console.log('');
console.log(`  200      ${rows.length - bad.length}건`);
console.log(`  그 외    ${bad.length}건${bad.length ? ` — ${bad.map((r) => `${r.prop}(${r.code || r.error})`).join(', ')}` : ''}`);
console.log(`  en-US 아닌 것 ${wrongLocale.length}건${wrongLocale.length ? ` — ${wrongLocale.map((r) => r.prop).join(', ')}` : ''}`);

const redirected = rows.filter((r) => r.final && r.final !== r.url);
if (redirected.length) {
  console.log(`  리디렉션 ${redirected.length}건`);
  redirected.forEach((r) => console.log(`    ${r.prop}: → ${r.final}`));
}

console.log(bad.length === 0 && wrongLocale.length === 0 ? '\n전체 통과\n' : `\n확인 필요 ${bad.length + wrongLocale.length}건\n`);
process.exit(bad.length === 0 && wrongLocale.length === 0 ? 0 : 1);
