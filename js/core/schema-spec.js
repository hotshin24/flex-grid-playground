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

/** span 계약의 '자동 배치' 값. 문자열 하나를 여러 곳에 적지 않는다. */
export const AUTO = 'auto';

/** 영역을 두지 않는다는 키워드. 빈 행 목록이 CSS 로 나갈 때의 값이다. */
export const AREA_NONE = 'none';

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
    // parse 가 { rows, errors } 를 주므로 둘 다 받는다. 이래야 다른 컨트롤처럼
    // serialize(parse(x)) 가 바로 물린다 — 채점이 컨트롤 타입만 보고 값을
    // 정규형으로 옮길 수 있으려면 여덟 타입이 같은 모양이어야 한다.
    serialize: (value) => {
      const rows = Array.isArray(value) ? value : (value?.rows ?? []);
      return rows.length === 0 ? AREA_NONE : rows.map((r) => `"${r.join(' ')}"`).join('\n');
    },
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
    serialize: (v) => spanToCss(v),
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
     values:    [{ val, label?, desc, measuredInactive? }]   // control === 'enum'
                                          // measuredInactive 는 아래 값 단위 설명 참조
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
     inactiveWhen: {             // 유형 A. 렌더 전에 알 수 있는 값만으로 판정한다
       source: 'container',      // 'container'(기본) | 'state'
                                 //   container — 같은 스키마의 다른 속성 값
                                 //   state     — INACTIVE_STATE_KEYS 의 파생 상태
       prop:   'flexWrap',       // source 에 따라 jsProp 또는 상태 키
       equals: 'nowrap',         // equals | notEquals | in 중 정확히 하나
       reason: '...',            // 비활성 사유 문장. 화면에 그대로 나간다
       hint:   '...'             // 선택. 해결 방법 안내
     }
     measuredInactive: {                // 유형 B·C. renderer 측정 키 이름만 담는다.
       key:    'hasFreeSpace',          // 이 키가 참이어야 속성이 일한다.
                                        //   MEASURED_KEYS 에 없는 이름은 검증에서 걸린다
       reason: '...',                   // 거짓일 때 화면에 나갈 사유 (F-13-3)
       hint:   '...'                    // 선택. 유형 C 는 해법까지 적는다 (F-13-5)
     }
     // 키만 쓰는 옛 표기('hasFreeSpace')도 받는다. 사유가 없을 뿐이다.
   }

   ── 값 단위 조건 (유형 B·C 중 일부) ────────────────────────────────────

   조건이 속성 전체가 아니라 값 하나에만 걸리는 경우가 있다. PRD 5.5 가 대상을
   'align-items: stretch' · 'dense' 처럼 값으로 적어 둔 것들이다.

     values: [
       { val: 'stretch', desc: '...', measuredInactive: { key, reason, hint } },
       { val: 'flex-start', desc: '...' },        // 이 값은 늘 동작한다
     ]

   속성 단위로 걸면 같은 컨트롤의 flex-start · center 나 row · column 까지 회색이
   되어 못 쓰는 것처럼 보인다. 그 값들은 언제나 제대로 동작한다.

   판정은 inactiveValues(entry, measured) 가 따로 하고 { [val]: verdict } 를
   돌려준다. 표시도 따로다 — createControl 의 setValueInactive 가 버튼 하나에만
   붙이고, 속성 자체의 aria-disabled 는 건드리지 않는다.

   ── 두 선언의 관계 ─────────────────────────────────────────────────────

   inactiveWhen 과 measuredInactive 는 같은 항목에 함께 쓸 수 없다 (유형 A vs B·C).
   검증이 막는다. 값 단위 measuredInactive 는 속성 단위와 무관하므로 함께 쓸 수 있다.

   판정 주체가 셋으로 나뉜다는 점이 이 계약의 요점이다.
     스키마      어떤 속성이 어떤 조건에 매여 있는지
     renderer   그 조건을 무엇으로 재는지 (MEASURED_KEYS)
     schema-spec 둘을 이어 참·거짓을 판정으로 옮기는 것
   셋 어디에도 속성 이름 분기가 없다.
*/

const REQUIRED_FIELDS = ['prop', 'jsProp', 'scope', 'control', 'default', 'desc', 'urlKey'];
const VALID_SCOPES = ['container', 'item'];

/** inactiveWhen 이 가질 수 있는 비교 연산자. 정확히 하나만 쓴다. */
const INACTIVE_OPERATORS = ['equals', 'notEquals', 'in'];

/** inactiveWhen 에 허용된 키. 오타를 잡기 위해 화이트리스트로 검사한다. */
const INACTIVE_FIELDS = ['source', 'prop', ...INACTIVE_OPERATORS, 'reason', 'hint'];

/** measuredInactive 에 허용된 키. */
const MEASURED_FIELDS = ['key', 'reason', 'hint'];

/**
 * renderer 가 재는 키 목록.
 *
 * 스키마가 참조할 수 있는 이름을 여기에 모아 둔다. 오타는 판정이 영원히 거짓이
 * 되는 방식으로 조용히 틀리므로 화이트리스트로 잡는다. inactiveWhen 의
 * INACTIVE_STATE_KEYS 와 같은 이유다.
 *
 * 값의 뜻은 전부 "그 속성이 일할 조건" 이다. 참이면 활성, 거짓이면 비활성이다.
 */
export const MEASURED_KEYS = {
  lineCount: '실제 줄 수',
  hasFreeSpace: '주축에 남는 공간이 있는가',
  hasCrossFreeSpace: '교차축에 남는 공간이 있는가',
  isOverflowing: '아이템이 컨테이너를 넘쳤는가',
  shrinkBlocked: '하한에 막혀 더 줄지 못하는가',
  canShrink: '넘쳤고 아직 더 줄 수 있는가',
  crossAuto: '아이템이 교차축 크기를 스스로 정하지 않았는가',
  hasImplicitColumns: '암시적 열이 생겼는가',
  hasImplicitRows: '암시적 행이 생겼는가',
  hasPlacementGaps: '배치되지 않은 빈 칸이 있는가',
};

/** 키만 쓴 옛 표기도 받는다. 안쪽에서는 늘 객체로 다룬다. */
export function normalizeMeasured(rule) {
  if (rule === undefined || rule === null) return null;
  if (typeof rule === 'string') return { key: rule };
  return rule;
}

/** inactiveWhen.source 가 가질 수 있는 값. 생략하면 'container'. */
const INACTIVE_SOURCES = ['container', 'state'];
const DEFAULT_INACTIVE_SOURCE = 'container';

/**
 * source: 'state' 가 참조할 수 있는 파생 상태 키.
 *
 * 스키마 속성이 아니지만 렌더 전에 알 수 있는 값들이다. 연산자는 3종
 * (equals·notEquals·in)으로 고정하고, "아이템이 2개 이상인가" 같은 판정은
 * 이쪽에서 Boolean 으로 계산해 넘긴다. 연산자를 늘리기 시작하면 케이스마다
 * 계속 부풀기 때문이다.
 *
 * 키를 늘릴 때는 여기에 한 줄, deriveState 에 한 줄만 더한다.
 * (예정: hasNamedAreas — grid-area 가 grid-template-areas 의 이름을 참조하는지)
 */
export const INACTIVE_STATE_KEYS = {
  hasMultipleItems: {
    type: 'boolean',
    desc: '아이템이 2개 이상인가',
    from: (state) => (state.items?.length ?? 0) >= 2,
  },
};

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

    /**
     * span 기본값이 계약을 왕복하는지 본다.
     *
     * M0 에서 이 검사가 없어, 단축 속성 기준으로 쓴 계약이 개별 속성 4개짜리
     * 스키마와 어긋난 채로 검증을 통과했다. 왕복이 깨지면 화면에 나가는 값이
     * 스키마가 적어 둔 값과 달라진다.
     */
    if (entry.control === 'span' && entry.default !== undefined) {
      const round = CONTROL_TYPES.span.serialize(CONTROL_TYPES.span.parse(entry.default));
      if (round !== String(entry.default)) {
        errors.push(`${at}: span default '${entry.default}' 가 계약을 왕복하지 못함 (→ '${round}')`);
      }
      if (/\//.test(String(entry.default))) {
        errors.push(`${at}: span default '${entry.default}' 는 쌍 형태 — 개별 속성은 값을 하나만 갖는다`);
      }
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

/** measuredInactive 선언 하나를 검사한다. 키 오타와 빠진 사유를 잡는다. */
function validateMeasured(rule, at, errors) {
  const normalized = normalizeMeasured(rule);

  if (typeof rule === 'string') {
    if (rule.trim() === '') errors.push(`${at}: measuredInactive 가 비어 있음`);
  } else if (normalized === null || typeof normalized !== 'object' || Array.isArray(normalized)) {
    errors.push(`${at}: measuredInactive 는 문자열이거나 객체여야 함`);
    return;
  } else {
    Object.keys(normalized).forEach((k) => {
      if (!MEASURED_FIELDS.includes(k)) errors.push(`${at}: measuredInactive 에 알 수 없는 필드 '${k}'`);
    });
    if (typeof normalized.reason !== 'string' || normalized.reason.trim() === '') {
      errors.push(`${at}: measuredInactive.reason 이 비어 있음 (F-13-3)`);
    }
  }

  const key = normalized?.key;
  if (typeof key !== 'string' || key.trim() === '') {
    errors.push(`${at}: measuredInactive.key 가 비어 있음`);
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(MEASURED_KEYS, key)) {
    errors.push(`${at}: measuredInactive.key '${key}' 는 renderer가 재지 않는 키`);
  }
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
    validateMeasured(entry.measuredInactive, at, errors);
    if (entry.inactiveWhen !== undefined) {
      errors.push(`${at}: inactiveWhen 과 measuredInactive 를 함께 쓸 수 없음 (유형 A vs B·C)`);
    }
  }

  // 값 하나에만 걸리는 선언(유형 B·C 중 값 단위)도 같은 규칙으로 본다
  (entry.values ?? []).forEach((v) => {
    if (v.measuredInactive !== undefined) {
      validateMeasured(v.measuredInactive, `${at} 값 '${v.val}'`, errors);
    }
  });

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

  const source = rule.source ?? DEFAULT_INACTIVE_SOURCE;
  if (!INACTIVE_SOURCES.includes(source)) {
    errors.push(`${at}: inactiveWhen.source '${source}' 는 ${INACTIVE_SOURCES.join(' | ')} 중 하나여야 함`);
    return;
  }

  if (typeof rule.prop !== 'string' || rule.prop.trim() === '') {
    errors.push(`${at}: inactiveWhen.prop 이 없음`);
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

  const compared = [];
  if (rule.equals !== undefined) compared.push(rule.equals);
  if (rule.notEquals !== undefined) compared.push(rule.notEquals);
  if (Array.isArray(rule.in)) compared.push(...rule.in);

  if (source === 'state') {
    const spec = INACTIVE_STATE_KEYS[rule.prop];
    if (!spec) {
      errors.push(
        `${at}: inactiveWhen.prop '${rule.prop}' 는 허용된 상태 키가 아님 (허용: ${Object.keys(INACTIVE_STATE_KEYS).join(', ')})`
      );
      return;
    }
    if (spec.type === 'boolean') {
      compared.forEach((v) => {
        if (typeof v !== 'boolean') {
          errors.push(`${at}: 상태 키 '${rule.prop}' 는 Boolean 이므로 '${v}' 와 비교할 수 없음`);
        }
      });
    }
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
    compared.forEach((v) => {
      if (!allowed.includes(v)) {
        errors.push(`${at}: inactiveWhen 이 비교하는 값 '${v}' 가 '${target.prop}' 의 values 에 없음`);
      }
    });
  }
}

/* ==========================================================================
   측정 판정 (F-13 유형 B·C)
   ========================================================================== */

/**
 * 키가 가리키는 것은 "그 속성이 일할 조건" 이다. 참이면 활성, 거짓이면 비활성이다.
 *
 * 아직 재지 않았으면(measured 가 없으면) 활성으로 둔다 — 재기 전에 죽여 놓으면
 * 첫 화면에서 멀쩡한 컨트롤이 회색으로 뜬다.
 *
 * 속성명 분기가 없다. 어떤 속성이 어떤 키에 매여 있는지는 스키마가 정하고,
 * 그 키를 무엇으로 재는지는 renderer 가 정한다. 이 함수는 둘을 잇기만 한다.
 */
export function judgeMeasured(rule, measured) {
  if (!rule || !measured || !(rule.key in measured)) return { inactive: false };
  if (measured[rule.key]) return { inactive: false };
  return { inactive: true, reason: rule.reason, hint: rule.hint };
}

/**
 * 값 하나에만 걸리는 측정 판정.
 *
 * align-items 의 stretch 와 grid-auto-flow 의 dense 는 속성이 아니라 값 하나가
 * 죽는다. 속성 전체를 회색으로 만들면 같은 컨트롤의 다른 값(flex-start · row)까지
 * 못 쓰는 것처럼 보인다. 그래서 값 단위로 따로 판정한다.
 *
 * @returns {Object} { [val]: {inactive, reason?, hint?} } — 죽은 값만 담긴다
 */
export function inactiveValues(entry, measured) {
  const out = {};
  (entry?.values ?? []).forEach((v) => {
    const rule = normalizeMeasured(v.measuredInactive);
    if (!rule) return;
    const verdict = judgeMeasured(rule, measured);
    if (verdict.inactive) out[v.val] = verdict;
  });
  return out;
}

/* ==========================================================================
   조건부 비활성 판정 (F-13 유형 A)
   ========================================================================== */

/**
 * 상태에서 파생 값을 계산한다.
 *
 * 화이트리스트 바로 옆에 두는 이유는 둘이 어긋나면 판정이 조용히 실패하기
 * 때문이다. 키를 늘릴 때 한 곳만 보면 되게 한다.
 *
 * 파생값은 store 에 담지 않는다. items 로부터 언제든 계산되는 값이라
 * 상태에 넣으면 진실이 둘이 되고 어긋날 수 있다. PRD 4.4 상태 모델도
 * 그대로 유지된다.
 *
 * @param {Object} state  store.getState() 결과
 * @returns {Object} { [상태 키]: 값 }
 */
export function deriveState(state = {}) {
  const out = {};
  for (const [key, spec] of Object.entries(INACTIVE_STATE_KEYS)) {
    out[key] = spec.from(state);
  }
  return out;
}

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
 * 두 번째 인자는 source 와 같은 모양으로 받는다. 'container'는 container,
 * 'state'는 state를 본다. 위치 인자를 늘리는 대신 이렇게 둔 것은, 참조원이
 * 더 생겨도 호출부 모양이 바뀌지 않기 때문이다.
 *
 * @param {Object} entry   스키마 항목
 * @param {Object} [scopes]
 * @param {Object} [scopes.container] { [jsProp]: value }
 * @param {Object} [scopes.state]     deriveState() 결과
 * @returns {{inactive: boolean, reason?: string, hint?: string}}
 */
export function isInactive(entry, { container = {}, state = {}, measured = null } = {}) {
  // 유형 B·C 가 먼저다. 계약상 inactiveWhen 과 함께 쓸 수 없으므로 겹치지 않는다.
  const measuredRule = normalizeMeasured(entry?.measuredInactive);
  if (measuredRule) return judgeMeasured(measuredRule, measured);

  const rule = entry?.inactiveWhen;
  if (!rule) return { inactive: false };

  const source = rule.source ?? DEFAULT_INACTIVE_SOURCE;
  const actual = source === 'state' ? state[rule.prop] : container[rule.prop];
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

/** areas 2차원 배열 → '"hd hd" "sd mn"' */
function areasToCss(rows) {
  return rows.map((row) => `"${row.join(' ')}"`).join(' ');
}

/**
 * 스키마 항목 하나의 상태값을 CSS 값으로 바꾼다.
 *
 * 문자열·숫자는 그대로 통과하므로 enum·length·number·text 는 분기가 없다.
 * CONTROL_TYPES 의 serialize 와 겹쳐 보이지만 쓰임이 다르다 — 그쪽은 편집기가
 * 값을 주고받는 정규형이고, 이쪽은 element.style 에 바로 얹을 CSS 값이다.
 * areas 만 그 차이가 드러난다: 정규형은 행마다 줄을 바꾸고, 여기서는 한 줄로 잇는다.
 */
export function toCssValue(entry, raw) {
  if (raw === undefined || raw === null) return '';

  if (entry.control === 'track-list' && Array.isArray(raw)) {
    return raw.map(trackToCss).join(' ');
  }

  if (entry.control === 'area-grid' && Array.isArray(raw)) {
    return areasToCss(raw);
  }

  if (entry.control === 'span' && typeof raw === 'object') {
    return spanToCss(raw);
  }

  return String(raw);
}

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

  // 키워드는 행이 아니다. 따옴표 없이 none 만 온 경우만 걸러 낸다 —
  // '"none"' 은 none 이라는 이름을 가진 1×1 판이므로 그대로 읽는다.
  if (String(raw).trim() === AREA_NONE) return { rows: [], errors: [] };

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

/**
 * 라인 좌표 하나를 CSS 값으로 바꾼다.
 *
 * 이 계약이 다루는 것은 grid-column-start · grid-column-end · grid-row-start ·
 * grid-row-end 넷이고, 넷 다 값을 하나만 갖는다. 'auto' · 정수 · 'span n' 이다.
 * 쌍('1 / 3')은 단축 속성 grid-column · grid-row 의 값이며 스키마에 없다.
 */
export function spanToCss(v) {
  if (v === null || v === undefined) return AUTO;
  if (typeof v !== 'object') return String(v);
  if (v.span !== undefined && v.span !== null) return `span ${v.span}`;
  if (v.line !== undefined && v.line !== null) return String(v.line);
  return AUTO;
}

/**
 * 'auto' | '3' | '-1' | 'span 2' 를 읽는다.
 *
 * 쌍 형태('1 / 3')는 읽지 않는다. 스키마의 어떤 속성도 그 값을 갖지 않고,
 * 개별 속성에 넣으면 브라우저가 선언을 통째로 버린다. 단축 속성을 스키마에
 * 들이는 날 그때 다시 넣는다 — 지금 남겨 두면 serialize 가 표현하지 못하는
 * 모양이 파서에서만 나오게 된다.
 *
 * 읽지 못한 문자열은 auto 로 떨어진다. 라인 번호에 상한도 하한도 두지 않는다 —
 * 범위 밖 값은 암시적 트랙을 만들며, 그게 CSS 의 실제 동작이다.
 */
export function parseSpan(raw) {
  if (typeof raw === 'object' && raw !== null) return raw;

  const s = String(raw).trim();
  if (s === AUTO || s === '') return { line: AUTO };

  const spanMatch = s.match(/^span\s+(-?\d+)$/);
  if (spanMatch) return { span: Number(spanMatch[1]) };

  const lineMatch = s.match(/^-?\d+$/);
  if (lineMatch) return { line: Number(s) };

  return { line: AUTO };
}
