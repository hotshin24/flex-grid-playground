/**
 * codegen.js — 상태 → 복사해 갈 수 있는 CSS · HTML (F-04)
 *
 * 스키마의 prop과 상태 값만 보고 만든다. 토픽을 구분하지 않으므로 M3의 Grid도
 * 같은 코드를 탄다. 속성 이름으로 분기하는 곳이 한 군데도 없다.
 *
 * 기본값과 같은 속성은 내보내지 않는다. 판단 기준은 스키마의 default이며,
 * 이 파일에 기본값이 리터럴로 등장하지 않는다.
 *
 * 도구 뷰 설정(view)은 출력 대상이 아니다. 프리뷰를 얼마나 크게 볼지는
 * 학습자가 가져갈 CSS와 무관하다 (PRD 4.4).
 */

import { toCssValue } from './schema-spec.js';

/* --------------------------------------------------------------------------
   출력 계약
   -------------------------------------------------------------------------- */

export const CONTAINER_CLASS = 'container';
export const ITEM_CLASS = 'item';

const INDENT = '  ';

/**
 * 토픽 이름이 곧 display 값이다. 다른 이름을 쓰는 토픽이 생기면 여기에 적는다.
 * 속성 이름 분기가 아니라 토픽 매핑이므로 스키마 주도 원칙과 충돌하지 않는다.
 */
const DISPLAY_BY_TOPIC = { flex: 'flex', grid: 'grid' };

/**
 * 스키마에 없는 아이템 기하값. CSS 속성이지만 학습 대상이 아니라 프리뷰
 * 구성값이라 schema.js에 넣지 않았다. 기본값 비교 없이 항상 내보낸다 —
 * 크기를 빼면 복사한 코드가 화면과 달라진다.
 *
 * 다만 크기가 없을 수도 있다. 값이 null 이면 "크기를 정하지 않는다" 는 뜻이고
 * renderer 도 그때는 크기를 얹지 않는다. 판정을 renderer 와 같은 말로 맞춘다 —
 * 유한한 수일 때만 선언을 만든다. null · undefined · NaN 이 전부 여기서 걸린다.
 */
const GEOMETRY = [
  { key: 'width', prop: 'width' },
  { key: 'height', prop: 'height' },
];

/** 내보낼 값이 없다는 표시. spread 가 이 자리를 건너뛴다. */
const NO_VALUE = null;

/* --------------------------------------------------------------------------
   조각
   -------------------------------------------------------------------------- */

const declare = (prop, value) => `${INDENT}${prop}: ${value};`;

/**
 * 자바스크립트가 값 대신 흘려보내는 토큰. CSS 에는 이런 낱말이 없다.
 *
 * 문자열 이어 붙이기가 만든다. `${item.width}px` 는 width 가 null 이면
 * "nullpx" 가 되고, 트랙의 size 가 비면 "undefinedfr" 이 된다. 붙어 있어도
 * 잡아야 하므로 낱말 경계를 걸지 않는다.
 */
const GARBAGE = /null|undefined|NaN/;

/**
 * 선언으로 내보낼 수 있는 값인가.
 *
 * 빈 문자열은 "prop: ;" 를 만들고, NO_VALUE 는 애초에 값이 없다는 표시이며,
 * 쓰레기 토큰은 복사해 가면 그대로 깨지는 코드가 된다. 셋 다 선언 자체를
 * 만들지 않는다 — 학습자가 가져가는 것은 실행되는 CSS 여야 한다.
 *
 * 값의 모양만 본다. 어느 속성인지 묻지 않으므로 속성 이름 분기가 생기지 않는다.
 */
const usable = (value) => value !== NO_VALUE && value !== '' && !GARBAGE.test(String(value));

const block = (selector, decls) =>
  (decls.length === 0 ? '' : `${selector} {\n${decls.join('\n')}\n}`);

/** 기본값과 같은지 본다. 비교는 직렬화 결과로 해야 트랙 배열도 다뤄진다. */
const isDefault = (entry, value) =>
  toCssValue(entry, value) === toCssValue(entry, entry.default);

const byScope = (schema, scope) => schema.filter((e) => e.scope === scope);

/* --------------------------------------------------------------------------
   컨테이너
   -------------------------------------------------------------------------- */

function containerDecls(state, schema) {
  const decls = [declare('display', DISPLAY_BY_TOPIC[state.topic] ?? state.topic)];

  byScope(schema, 'container').forEach((entry) => {
    const value = state.container?.[entry.jsProp];
    if (value === undefined || isDefault(entry, value)) return;

    const css = toCssValue(entry, value);
    if (!usable(css)) return;

    decls.push(declare(entry.prop, css));
  });

  return decls;
}

/* --------------------------------------------------------------------------
   아이템

   전 아이템이 같은 값이면 공통 규칙 하나로 묶고, 하나라도 다르면 그 속성만
   아이템별 규칙으로 뺀다. 같은 선언을 아이템 수만큼 반복하면 읽을 수 없다.
   -------------------------------------------------------------------------- */

function itemDecls(state, schema) {
  const items = state.items ?? [];
  const common = [];
  const individual = items.map(() => []);

  /**
   * 값을 공통 규칙과 개별 규칙으로 가른다.
   *
   * 내보낼 수 없는 값(NO_VALUE · 빈 문자열)은 그 아이템에서만 빠진다. 아이템
   * 하나가 크기를 갖고 다른 하나가 자동이면, 앞엣것에만 선언이 붙고 뒤엣것은
   * 아무 선언도 얻지 않는다 — 그것이 화면과 같은 코드다. 전부 내보낼 수
   * 없으면 공통 규칙도 만들지 않는다.
   */
  const spread = (prop, values, skipDefault) => {
    if (values.length === 0) return;

    const omit = (v) => !usable(v) || Boolean(skipDefault && skipDefault(v));
    const same = values.every((v) => v === values[0]);

    if (same) {
      if (!omit(values[0])) common.push(declare(prop, values[0]));
      return;
    }

    values.forEach((v, i) => {
      if (omit(v)) return;
      individual[i].push(declare(prop, v));
    });
  };

  byScope(schema, 'item').forEach((entry) => {
    const values = items.map((item) => toCssValue(entry, item[entry.jsProp]));
    spread(entry.prop, values, (v) => v === toCssValue(entry, entry.default));
  });

  GEOMETRY.forEach((g) => {
    spread(g.prop, items.map((item) => (Number.isFinite(item[g.key]) ? `${item[g.key]}px` : NO_VALUE)));
  });

  return { common, individual };
}

/* --------------------------------------------------------------------------
   진입점
   -------------------------------------------------------------------------- */

/** @returns {string} 복사해 갈 CSS */
export function generateCss(state, schema) {
  const { common, individual } = itemDecls(state, schema);

  const blocks = [
    block(`.${CONTAINER_CLASS}`, containerDecls(state, schema)),
    block(`.${ITEM_CLASS}`, common),
    ...individual.map((decls, i) => block(`.${ITEM_CLASS}-${i + 1}`, decls)),
  ];

  return blocks.filter(Boolean).join('\n\n');
}

/** @returns {string} 프리뷰와 같은 구조의 HTML */
export function generateHtml(state, schema) {
  const { individual } = itemDecls(state, schema);

  const rows = (state.items ?? []).map((item, i) => {
    // 개별 규칙이 있는 아이템에만 번호 클래스를 붙인다. 쓰지 않는 클래스를
    // 마크업에 남기면 복사한 쪽에서 지워야 할 것이 늘어난다.
    const classes = individual[i].length > 0 ? `${ITEM_CLASS} ${ITEM_CLASS}-${i + 1}` : ITEM_CLASS;
    return `${INDENT}<div class="${classes}">${i + 1}</div>`;
  });

  return [`<div class="${CONTAINER_CLASS}">`, ...rows, '</div>'].join('\n');
}

/** @returns {{css: string, html: string}} */
export function generateCode(state, schema) {
  return {
    css: generateCss(state, schema),
    html: generateHtml(state, schema),
  };
}

export default generateCode;
