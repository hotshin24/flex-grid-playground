/**
 * schema-spec.js — 속성 스키마 계약
 *
 * 이 프로젝트의 단일 진실 공급원(SSOT)은 토픽별 schema.js다.
 * 컨트롤 UI · 코드 생성 · 챌린지 정답 검증 · 속성 설명 데모가 모두
 * 스키마에서 파생된다. 속성 추가 = 스키마 항목 추가. 마크업 수정 없음.
 *
 * 이 파일은 스키마의 형태를 정의하고 검증한다. 값은 담지 않는다.
 */

/* ==========================================================================
   컨트롤 타입 레지스트리
   ui/controls.js 가 type을 보고 어떤 DOM을 그릴지 결정한다.
   ========================================================================== */

export const CONTROL_TYPES = {
  /** 고정 값 버튼 그룹. values[] 필수. */
  enum: {
    requires: ['values'],
    serialize: (v) => String(v),
    parse: (raw) => raw,
  },

  /** 정수 슬라이더. min·max 필수, step 기본 1. */
  number: {
    requires: ['min', 'max'],
    serialize: (v) => String(v),
    parse: (raw) => Number(raw),
  },

  /** 수치 + 단위. units[] 필수. 예: gap, flex-basis */
  length: {
    requires: ['units'],
    serialize: (v) => String(v),
    parse: (raw) => raw,
  },

  /** 자유 문자열. 유효성은 validate()에 위임. */
  text: {
    requires: [],
    serialize: (v) => String(v),
    parse: (raw) => raw,
  },

  /* --- 아래 3종은 Grid를 위해 신규 도입. v0.1 구조로는 구현 불가했던 부분 --- */

  /**
   * 트랙 목록 편집기 (GR-03).
   * 내부 값은 트랙 배열, CSS 출력은 문자열.
   *   [{size:1, unit:'fr'}, {size:200, unit:'px'}] → "1fr 200px"
   * repeat() 축약은 렌더 시점에 codegen이 판단한다.
   */
  'track-list': {
    requires: ['units'],
    serialize: (tracks) => tracks.map((t) => trackToCss(t)).join(' '),
    parse: (raw) => parseTrackList(raw),
  },

  /**
   * 영역 매트릭스 편집기 (GR-04).
   * 내부 값은 2차원 이름 배열, CSS 출력은 따옴표 묶음 문자열.
   *   [['hd','hd'],['sd','mn']] → '"hd hd" "sd mn"'
   * v1.0 1차는 텍스트 입력 + 검증만, 시각 편집은 M5 이후.
   */
  'area-grid': {
    requires: [],
    serialize: (rows) => rows.map((r) => `"${r.join(' ')}"`).join('\n'),
    parse: (raw) => parseAreaGrid(raw),
  },

  /**
   * 라인 좌표 (GR-02).
   * 시작/끝 라인 번호 또는 span. 음수 라인 허용.
   *   {start:1, end:3} → "1 / 3"
   *   {start:1, span:2} → "1 / span 2"
   */
  span: {
    requires: [],
    serialize: (v) => (v.span != null ? `${v.start} / span ${v.span}` : `${v.start} / ${v.end}`),
    parse: (raw) => parseSpan(raw),
  },
};

/* ==========================================================================
   스키마 항목 계약
   ==========================================================================

   {
     prop:      'justify-content',   // CSS 속성명. 코드 생성에 그대로 출력
     jsProp:    'justifyContent',    // element.style 키
     scope:     'container' | 'item',
     control:   CONTROL_TYPES 의 키
     default:   초기값. URL 직렬화 시 이 값과 같으면 생략
     label:     컨트롤 라벨 (미지정 시 prop 사용)
     values:    [{ val, label?, desc }]   // control === 'enum'
     units:     ['px','fr',...]            // length / track-list
     min,max,step:                          // number
     desc:      속성 설명 (속성 설명 탭 본문)
     tip:       학습 팁
     axisAware: true       // 주축/방향에 따라 결과가 달라짐 → row·column 데모 양쪽 제공
     mdn:       'https://developer.mozilla.org/...'
     urlKey:    'j'        // URL 해시 축약 키. 토픽 내 유일해야 함
     demo:      { itemCount, itemSizes?, containerStyle? }  // 속성 설명 탭 데모 설정
     relatedTo: ['align-items']  // 대조 뷰(GR-09)에서 연결할 속성

     // --- 조건부 비활성 (F-13) — 둘 다 선택 필드 ---
     inactiveWhen: {             // 유형 A. 다른 속성의 값만으로 판정한다
       prop:   'flexWrap',       // 판정 대상 속성의 jsProp. 같은 스키마 안에 있어야 한다
       equals: 'nowrap',         // equals | notEquals | in 중 정확히 하나
       reason: '...',            // 비활성 사유 문장. 화면에 그대로 나간다
       hint:   '...'             // 선택. 해결 방법 안내
     }
     measuredInactive: 'hasFreeSpace'   // 유형 B·C. renderer 측정 키 이름만 담는다.
                                        // 판정 로직은 renderer가 소유하며 스키마는 키만 안다
   }
*/

const REQUIRED_FIELDS = ['prop', 'jsProp', 'scope', 'control', 'default', 'desc', 'urlKey'];
const VALID_SCOPES = ['container', 'item'];

/** inactiveWhen 이 가질 수 있는 비교 연산자. 정확히 하나만 쓴다. */
const INACTIVE_OPERATORS = ['equals', 'notEquals', 'in'];

/** inactiveWhen 에 허용된 키. 오타를 잡기 위해 화이트리스트로 검사한다. */
const INACTIVE_FIELDS = ['prop', ...INACTIVE_OPERATORS, 'reason', 'hint'];

/**
 * 스키마 전체를 검증한다. 실패 항목을 배열로 반환하며, 빈 배열이면 통과.
 * 빌드 도구가 없으므로 이 검증이 유일한 방어선이다.
 */
export function validateSchema(schema, topicName) {
  const errors = [];
  const seenUrlKeys = new Map();
  const seenProps = new Set();
  const byJsProp = new Map(schema.filter((e) => e.jsProp).map((e) => [e.jsProp, e]));

  schema.forEach((entry, i) => {
    const at = `${topicName}[${i}] ${entry.prop ?? '(prop 없음)'}`;

    REQUIRED_FIELDS.forEach((f) => {
      if (entry[f] === undefined) errors.push(`${at}: 필수 필드 '${f}' 누락`);
    });

    if (entry.scope && !VALID_SCOPES.includes(entry.scope)) {
      errors.push(`${at}: scope '${entry.scope}' 는 container|item 이 아님`);
    }

    const ctrl = CONTROL_TYPES[entry.control];
    if (!ctrl) {
      errors.push(`${at}: 알 수 없는 control '${entry.control}'`);
    } else {
      ctrl.requires.forEach((f) => {
        if (entry[f] === undefined) {
          errors.push(`${at}: control '${entry.control}' 에 '${f}' 필요`);
        }
      });
    }

    if (entry.control === 'enum' && Array.isArray(entry.values)) {
      const vals = entry.values.map((v) => v.val);
      if (!vals.includes(entry.default)) {
        errors.push(`${at}: default '${entry.default}' 가 values 에 없음`);
      }
      entry.values.forEach((v) => {
        if (!v.desc) errors.push(`${at}: 값 '${v.val}' 에 desc 없음`);
      });
    }

    if (entry.urlKey) {
      if (seenUrlKeys.has(entry.urlKey)) {
        errors.push(`${at}: urlKey '${entry.urlKey}' 가 ${seenUrlKeys.get(entry.urlKey)} 와 중복`);
      }
      seenUrlKeys.set(entry.urlKey, entry.prop);
    }

    if (entry.prop) {
      if (seenProps.has(entry.prop)) errors.push(`${at}: prop 중복`);
      seenProps.add(entry.prop);
    }

    validateInactive(entry, at, byJsProp, errors);
  });

  return errors;
}

/**
 * 조건부 비활성 선언을 검사한다 (F-13 유형 A).
 *
 * 선택 필드이므로 없으면 아무것도 하지 않는다. 선언이 있으면 참조 무결성까지
 * 본다 — 없는 속성을 가리키거나 enum에 없는 값을 비교하면 판정이 영원히
 * 거짓이 되고, 그건 화면에 아무 증상 없이 조용히 틀린다.
 */
function validateInactive(entry, at, byJsProp, errors) {
  if (entry.measuredInactive !== undefined) {
    if (typeof entry.measuredInactive !== 'string' || entry.measuredInactive.trim() === '') {
      errors.push(`${at}: measuredInactive 는 비어 있지 않은 문자열이어야 함`);
    }
    if (entry.inactiveWhen !== undefined) {
      errors.push(`${at}: inactiveWhen 과 measuredInactive 를 함께 쓸 수 없음 (유형 A vs B·C)`);
    }
  }

  const rule = entry.inactiveWhen;
  if (rule === undefined) return;

  if (rule === null || typeof rule !== 'object' || Array.isArray(rule)) {
    errors.push(`${at}: inactiveWhen 은 객체여야 함`);
    return;
  }

  Object.keys(rule).forEach((k) => {
    if (!INACTIVE_FIELDS.includes(k)) {
      errors.push(`${at}: inactiveWhen 에 알 수 없는 필드 '${k}'`);
    }
  });

  if (typeof rule.reason !== 'string' || rule.reason.trim() === '') {
    errors.push(`${at}: inactiveWhen.reason 이 비어 있음`);
  }

  if (rule.hint !== undefined && (typeof rule.hint !== 'string' || rule.hint.trim() === '')) {
    errors.push(`${at}: inactiveWhen.hint 는 비어 있지 않은 문자열이어야 함`);
  }

  const used = INACTIVE_OPERATORS.filter((op) => rule[op] !== undefined);
  if (used.length !== 1) {
    errors.push(
      `${at}: inactiveWhen 에 ${INACTIVE_OPERATORS.join(' | ')} 중 정확히 하나가 필요함 (현재 ${used.length}개${used.length ? ': ' + used.join(', ') : ''})`
    );
  }

  if (typeof rule.prop !== 'string' || rule.prop.trim() === '') {
    errors.push(`${at}: inactiveWhen.prop 이 없음`);
    return;
  }

  if (rule.prop === entry.jsProp) {
    errors.push(`${at}: inactiveWhen.prop 이 자기 자신을 가리킴`);
    return;
  }

  const target = byJsProp.get(rule.prop);
  if (!target) {
    errors.push(`${at}: inactiveWhen.prop '${rule.prop}' 가 스키마에 없음`);
    return;
  }

  if (rule.in !== undefined && !Array.isArray(rule.in)) {
    errors.push(`${at}: inactiveWhen.in 은 배열이어야 함`);
    return;
  }
  if (Array.isArray(rule.in) && rule.in.length === 0) {
    errors.push(`${at}: inactiveWhen.in 이 비어 있음`);
    return;
  }

  // 비교 대상이 enum이면 실재하는 값인지까지 본다
  if (target.control === 'enum' && Array.isArray(target.values)) {
    const allowed = target.values.map((v) => v.val);
    const compared = [];
    if (rule.equals !== undefined) compared.push(rule.equals);
    if (rule.notEquals !== undefined) compared.push(rule.notEquals);
    if (Array.isArray(rule.in)) compared.push(...rule.in);

    compared.forEach((v) => {
      if (!allowed.includes(v)) {
        errors.push(`${at}: inactiveWhen 이 비교하는 값 '${v}' 가 '${target.prop}' 의 values 에 없음`);
      }
    });
  }
}

/* ==========================================================================
   조건부 비활성 판정 (F-13 유형 A)
   ========================================================================== */

/**
 * 스키마 선언만으로 비활성 여부를 판정한다.
 *
 * 속성명 분기가 이 함수 안에 없다는 점이 핵심이다. 어떤 속성이 어떤 조건에서
 * 죽는지는 전적으로 schema.js 의 inactiveWhen 이 정한다. 여기에
 * if (prop === 'align-content') 같은 줄이 생기면 설계가 무너진 것이다.
 *
 * 유형 B·C(measuredInactive)는 렌더 측정이 필요하므로 renderer 가 판정한다.
 * 이 함수는 관여하지 않는다.
 *
 * @param {Object} entry           스키마 항목
 * @param {Object} [containerState] 판정 근거가 되는 현재 값들 { [jsProp]: value }
 * @returns {{inactive: boolean, reason?: string, hint?: string}}
 */
export function isInactive(entry, containerState = {}) {
  const rule = entry?.inactiveWhen;
  if (!rule) return { inactive: false };

  const actual = containerState[rule.prop];
  let matched = false;

  if (rule.equals !== undefined) matched = actual === rule.equals;
  else if (rule.notEquals !== undefined) matched = actual !== rule.notEquals;
  else if (Array.isArray(rule.in)) matched = rule.in.includes(actual);

  if (!matched) return { inactive: false };

  const result = { inactive: true, reason: rule.reason };
  if (rule.hint !== undefined) result.hint = rule.hint;
  return result;
}

/** scope 별로 나눈다. controls.js 가 패널을 그릴 때 사용. */
export function partitionByScope(schema) {
  return {
    container: schema.filter((e) => e.scope === 'container'),
    item: schema.filter((e) => e.scope === 'item'),
  };
}

/** 기본 상태 객체를 스키마에서 생성한다. 하드코딩된 초기 상태는 존재하지 않는다. */
export function defaultsFrom(schema, scope) {
  return schema
    .filter((e) => e.scope === scope)
    .reduce((acc, e) => {
      acc[e.jsProp] = e.default;
      return acc;
    }, {});
}

/* ==========================================================================
   값 파서 / 직렬화 헬퍼
   ========================================================================== */

export function trackToCss(t) {
  if (t.unit === 'auto' || t.unit === 'min-content' || t.unit === 'max-content') return t.unit;
  if (t.unit === 'minmax') return `minmax(${t.min}, ${t.max})`;
  return `${t.size}${t.unit}`;
}

export function parseTrackList(raw) {
  if (Array.isArray(raw)) return raw;
  return String(raw)
    .trim()
    .split(/\s+(?![^(]*\))/)
    .filter(Boolean)
    .map((tok) => {
      if (/^(auto|min-content|max-content)$/.test(tok)) return { unit: tok };
      const mm = tok.match(/^minmax\(([^,]+),\s*([^)]+)\)$/);
      if (mm) return { unit: 'minmax', min: mm[1].trim(), max: mm[2].trim() };
      const m = tok.match(/^(-?[\d.]+)(fr|px|%|em|rem|vw|vh)$/);
      return m ? { size: Number(m[1]), unit: m[2] } : { size: 1, unit: 'fr' };
    });
}

/**
 * areas 문자열을 2차원 배열로 파싱하고 유효성을 검사한다.
 * CSS 사양상 각 영역은 직사각형이어야 하며, 행 길이가 모두 같아야 한다.
 * 반환: { rows, errors }
 */
export function parseAreaGrid(raw) {
  if (Array.isArray(raw)) return { rows: raw, errors: [] };

  // 행은 따옴표로 구분된다. 줄바꿈 여부와 무관하게 동작해야 한다.
  //   '"hd hd"\n"sd mn"'  와  '"hd hd" "sd mn"'  는 같은 결과여야 한다.
  const src = String(raw);
  const quoted = [...src.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  const lines = quoted.length > 0 ? quoted : src.split('\n');

  const rows = lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(/\s+/));

  const errors = [];
  if (rows.length === 0) return { rows, errors };

  const width = rows[0].length;
  if (rows.some((r) => r.length !== width)) {
    errors.push('모든 행의 셀 개수가 같아야 합니다.');
    return { rows, errors };
  }

  // 각 이름이 직사각형을 이루는지 확인 (. 은 빈 칸이므로 제외)
  const bounds = new Map();
  rows.forEach((row, y) => {
    row.forEach((name, x) => {
      if (name === '.') return;
      const b = bounds.get(name) ?? { x1: x, x2: x, y1: y, y2: y, count: 0 };
      b.x1 = Math.min(b.x1, x); b.x2 = Math.max(b.x2, x);
      b.y1 = Math.min(b.y1, y); b.y2 = Math.max(b.y2, y);
      b.count += 1;
      bounds.set(name, b);
    });
  });

  bounds.forEach((b, name) => {
    const area = (b.x2 - b.x1 + 1) * (b.y2 - b.y1 + 1);
    if (area !== b.count) errors.push(`'${name}' 영역이 직사각형이 아닙니다.`);
  });

  return { rows, errors };
}

export function parseSpan(raw) {
  if (typeof raw === 'object' && raw !== null) return raw;
  const s = String(raw).trim();
  const spanMatch = s.match(/^(-?\d+)\s*\/\s*span\s+(\d+)$/);
  if (spanMatch) return { start: Number(spanMatch[1]), span: Number(spanMatch[2]) };
  const pairMatch = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (pairMatch) return { start: Number(pairMatch[1]), end: Number(pairMatch[2]) };
  return { start: 'auto', end: 'auto' };
}
