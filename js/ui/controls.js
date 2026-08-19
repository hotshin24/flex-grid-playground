/**
 * controls.js — 스키마 → 컨트롤 DOM (M1)
 *
 * 스키마 항목 하나를 받아 그에 맞는 컨트롤 요소를 만든다.
 * 속성별 버튼을 마크업에 하드코딩하지 않는 것이 이 파일의 존재 이유다.
 * 속성이 추가되면 schema.js만 고치고 여기는 손대지 않는다.
 *
 * store를 import하지 않는다. 값은 인자로 받고, 변경은 onChange로 알린다.
 * 상태를 어디에 어떻게 반영할지는 호출자가 정한다.
 *
 * 색·간격을 쓰지 않는다. 클래스만 붙이고 나머지는 components.css 몫이다.
 * 인라인 핸들러도 쓰지 않는다. 이벤트는 컨트롤 루트에 한 번만 위임한다.
 */

import { CONTROL_TYPES } from '../core/schema-spec.js';
import { createTrackEditor } from './track-editor.js';
import { createSpanEditor } from './span-editor.js';
import { createAreaEditor } from './area-editor.js';

/* --------------------------------------------------------------------------
   DOM 계약 — components.css가 받는 이름
   -------------------------------------------------------------------------- */

export const CONTROL_CLASS = 'fgp-control';
export const LABEL_CLASS = 'fgp-control__label';
export const PROP_CLASS = 'fgp-control__prop';
export const HINT_CLASS = 'fgp-control__hint';
export const VALUES_CLASS = 'fgp-control__values';
export const OPTION_CLASS = 'fgp-control__option';
export const FIELD_CLASS = 'fgp-control__field';
export const READOUT_CLASS = 'fgp-control__readout';
export const UNIT_CLASS = 'fgp-control__unit';
export const PENDING_CLASS = 'fgp-control--pending';
export const CHECKED_CLASS = 'is-checked';
export const INACTIVE_CLASS = 'is-inactive';
export const NOTE_CLASS = 'fgp-control__note';
export const REASON_CLASS = 'fgp-control__reason';
export const REMEDY_CLASS = 'fgp-control__remedy';

/** 숫자가 앞에 붙는 단위. 나머지(auto·content 등)는 키워드로 본다. */
const NUMERIC_UNITS = new Set(['px', 'rem', 'em', '%', 'fr', 'vh', 'vw', 'ch']);

/**
 * 아직 구현하지 않은 컨트롤. GR-03(track-list) · GR-02(span) · GR-04(area-grid)를
 * 지나며 비었다. 남겨 두는 이유는 새 control 타입이 계약에 먼저 들어오고
 * 편집기가 나중에 붙는 순서가 앞으로도 반복되기 때문이다.
 */
const PENDING_CONTROLS = new Set();

/** label 요소와 입력을 for/id로 잇기 위한 일련번호. */
let uid = 0;
const nextId = (prop) => `fgp-c${++uid}-${String(prop).replace(/[^a-z0-9-]/gi, '')}`;

/* --------------------------------------------------------------------------
   length 값 분해 / 조립
   -------------------------------------------------------------------------- */

/** '12px' → { num:'12', unit:'px' } · 'auto' → { num:'', unit:'auto' } */
export function splitLength(value, units) {
  const raw = value == null ? '' : String(value);

  if (units.includes(raw)) return { num: '', unit: raw };

  const m = raw.match(/^(-?[\d.]+)(.*)$/);
  if (!m) return { num: '', unit: units[0] };

  const unit = units.includes(m[2]) ? m[2] : units.find((u) => NUMERIC_UNITS.has(u)) ?? units[0];
  return { num: m[1], unit };
}

/**
 * 키워드 단위면 단위만, 아니면 수치와 붙여서 돌려준다.
 *
 * 수치가 비어 있으면 빈 문자열을 돌려준다. 예전에는 0으로 메웠는데, 그러면
 * 입력란을 비우는 순간 0px가 저장소로 나가고 그 값이 다시 입력란에 찍혀
 * 0을 지울 수 없었다. 90을 치면 090이 되던 것도 같은 원인이다.
 * "아직 값이 없다"와 "0이다"는 다른 상태다.
 */
export function joinLength(num, unit) {
  if (!NUMERIC_UNITS.has(unit)) return unit;
  if (String(num).trim() === '') return '';
  return `${num}${unit}`;
}

/* --------------------------------------------------------------------------
   컨트롤별 본문
   -------------------------------------------------------------------------- */

/**
 * 라벨은 두 줄이다.
 *   1행 CSS 속성명 — 이 도구에서 익혀야 할 대상이므로 주(主)로 둔다
 *   2행 우리말 설명 — 보조. entry.label이 없으면 생략한다
 *
 * aria-labelledby가 가리키는 것은 두 줄을 감싼 이 요소이므로,
 * 보조 설명까지 읽힌다.
 */
function buildLabel(entry, doc, state) {
  const label = doc.createElement(entry.control === 'enum' ? 'div' : 'label');
  label.className = LABEL_CLASS;
  label.setAttribute('id', state.labelId);
  if (entry.control !== 'enum') label.setAttribute('for', state.inputId);

  const prop = doc.createElement('code');
  prop.className = PROP_CLASS;
  prop.textContent = entry.prop;
  label.appendChild(prop);

  if (entry.label) {
    const hint = doc.createElement('span');
    hint.className = HINT_CLASS;
    hint.textContent = entry.label;
    label.appendChild(hint);
  }

  return label;
}

function buildEnum(entry, value, doc, state) {
  const group = doc.createElement('div');
  group.className = VALUES_CLASS;
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-labelledby', state.labelId);

  entry.values.forEach((v) => {
    const option = doc.createElement('button');
    option.className = OPTION_CLASS;
    option.setAttribute('type', 'button');
    option.setAttribute('role', 'radio');
    option.setAttribute('data-value', String(v.val));
    option.textContent = v.label ?? String(v.val);
    if (v.desc) option.setAttribute('title', v.desc);
    group.appendChild(option);
  });

  state.group = group;
  state.interactive = [group, ...group.children];
  return group;
}

/** enum의 선택 표시를 현재 값에 맞춘다. 선택된 것만 tab 순서에 남긴다. */
function syncEnum(state, value) {
  const options = state.group.children;
  let matched = false;

  for (const option of options) {
    const checked = option.getAttribute('data-value') === String(value);
    if (checked) matched = true;
    option.setAttribute('aria-checked', String(checked));
    option.setAttribute('tabindex', checked ? '0' : '-1');
    option.classList.toggle(CHECKED_CLASS, checked);
  }

  // 어떤 값과도 맞지 않으면 첫 옵션을 tab 진입점으로 남긴다
  if (!matched && options.length > 0) options[0].setAttribute('tabindex', '0');
  state.value = value;
}

function buildNumber(entry, value, doc, state) {
  const input = doc.createElement('input');
  input.className = FIELD_CLASS;
  input.setAttribute('type', 'range');
  input.setAttribute('id', state.inputId);
  input.setAttribute('min', String(entry.min));
  input.setAttribute('max', String(entry.max));
  input.setAttribute('step', String(entry.step ?? 1));
  input.value = String(value);

  const readout = doc.createElement('output');
  readout.className = READOUT_CLASS;
  readout.textContent = String(value);

  const wrap = doc.createElement('div');
  wrap.className = VALUES_CLASS;
  wrap.appendChild(input);
  wrap.appendChild(readout);

  state.input = input;
  state.readout = readout;
  state.interactive = [input];
  return wrap;
}

function buildLength(entry, value, doc, state) {
  const { num, unit } = splitLength(value, entry.units);

  const input = doc.createElement('input');
  input.className = FIELD_CLASS;
  input.setAttribute('type', 'number');
  input.setAttribute('id', state.inputId);
  input.value = num;
  if (!NUMERIC_UNITS.has(unit)) input.setAttribute('disabled', 'disabled');

  const select = doc.createElement('select');
  select.className = UNIT_CLASS;
  select.setAttribute('aria-label', `${entry.prop} 단위`);

  entry.units.forEach((u) => {
    const option = doc.createElement('option');
    option.setAttribute('value', u);
    option.textContent = u;
    select.appendChild(option);
  });

  select.value = unit;

  const wrap = doc.createElement('div');
  wrap.className = VALUES_CLASS;
  wrap.appendChild(input);
  wrap.appendChild(select);

  state.input = input;
  state.select = select;
  state.interactive = [input, select];
  return wrap;
}

/** M3 대상. 자리만 만들고 조작 수단은 두지 않는다. */
function buildPending(entry, doc) {
  const note = doc.createElement('div');
  note.className = VALUES_CLASS;
  note.setAttribute('data-pending', 'M3');
  note.textContent = `${entry.control} 컨트롤은 M3에서 구현`;
  return note;
}

/* --------------------------------------------------------------------------
   이벤트 — 컨트롤 루트에 한 번만 건다
   -------------------------------------------------------------------------- */

/** target에서 위로 올라가며 data-value를 가진 옵션을 찾는다. */
function closestOption(target, root) {
  let node = target;
  while (node && node !== root) {
    if (node.getAttribute && node.getAttribute('data-value') != null) return node;
    node = node.parentNode;
  }
  return null;
}

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

function bindEnum(root, entry, state, onChange) {
  const values = entry.values.map((v) => String(v.val));

  const commit = (value) => {
    if (value === state.value) return;
    syncEnum(state, value);
    onChange(entry.jsProp, CONTROL_TYPES.enum.parse(value));
  };

  root.addEventListener('click', (e) => {
    const option = closestOption(e.target, root);
    if (option) commit(option.getAttribute('data-value'));
  });

  root.addEventListener('keydown', (e) => {
    if (!NEXT_KEYS.has(e.key) && !PREV_KEYS.has(e.key)) return;

    const current = values.indexOf(String(state.value));
    const step = NEXT_KEYS.has(e.key) ? 1 : -1;
    const next = (current + step + values.length) % values.length;

    if (e.preventDefault) e.preventDefault();
    commit(values[next]);

    const focused = state.group.children[next];
    if (focused && typeof focused.focus === 'function') focused.focus();
  });
}

function bindNumber(root, entry, state, onChange) {
  root.addEventListener('input', (e) => {
    if (e.target !== state.input) return;
    const parsed = CONTROL_TYPES.number.parse(state.input.value);
    state.readout.textContent = String(parsed);
    state.value = parsed;
    onChange(entry.jsProp, parsed);
  });
}

function bindLength(root, entry, state, onChange) {
  const commit = () => {
    const unit = state.select.value;
    const keyword = !NUMERIC_UNITS.has(unit);

    if (keyword) state.input.setAttribute('disabled', 'disabled');
    else state.input.removeAttribute('disabled');

    const value = joinLength(state.input.value, unit);

    // 수치가 비었다. auto에서 px로 막 바꿨거나, 새로 치려고 지운 상태다.
    // 저장소로 보낼 유효한 길이가 없으므로 아무것도 보내지 않는다. 이전 값이
    // 그대로 살아 있고, 입력란은 비운 채로 둔다. pendingUnit은 그 사이
    // sync가 단위를 되돌려 놓지 못하게 막는 표식이다.
    if (value === '') {
      state.pendingUnit = unit;
      return;
    }

    state.pendingUnit = null;
    state.value = value;
    onChange(entry.jsProp, CONTROL_TYPES.length.parse(value));
  };

  root.addEventListener('input', (e) => {
    if (e.target === state.input || e.target === state.select) commit();
  });

  root.addEventListener('change', (e) => {
    if (e.target === state.select) commit();
  });
}

/* --------------------------------------------------------------------------
   조건부 비활성 표시 (F-13 유형 A)

   이 파일은 판정하지 않는다. 어떤 속성이 왜 죽는지는 스키마가 정하고 판정은
   isInactive()가 한다. 여기는 그 결과를 받아 화면에 옮길 뿐이라, 속성 이름을
   알지 못한다.

   disabled 를 걸지 않는 것이 핵심이다. 눌러도 아무 일이 없다는 사실을 직접
   확인한 뒤 사유를 읽어야 개념이 남는다. 막아 버리면 "왜 안 눌리지"에서
   멈춘다. (PRD 5.5 설계 원칙)
   -------------------------------------------------------------------------- */

function buildNote(doc, id) {
  const note = doc.createElement('p');
  note.className = NOTE_CLASS;
  note.setAttribute('id', id);
  note.setAttribute('role', 'note');
  note.hidden = true;

  const reason = doc.createElement('span');
  reason.className = REASON_CLASS;
  note.appendChild(reason);

  const remedy = doc.createElement('span');
  remedy.className = REMEDY_CLASS;
  remedy.hidden = true;
  note.appendChild(remedy);

  return { note, reason, remedy };
}

/**
 * 판정 결과를 컨트롤에 반영한다.
 *
 * @param {Object} parts   { root, note, reason, remedy, interactive[] }
 * @param {Object} verdict isInactive() 결과 { inactive, reason?, hint? }
 */
function applyInactive(parts, verdict = {}) {
  const inactive = Boolean(verdict.inactive);
  const { root, note, reason, remedy, interactive, noteId } = parts;

  root.classList.toggle(INACTIVE_CLASS, inactive);
  root.setAttribute('aria-disabled', String(inactive));

  // 조작 수단에도 상태만 알린다. disabled 는 걸지 않는다
  interactive.forEach((el) => {
    el.setAttribute('aria-disabled', String(inactive));
    if (inactive) el.setAttribute('aria-describedby', noteId);
    else el.removeAttribute('aria-describedby');
  });

  note.hidden = !inactive;
  reason.textContent = inactive ? (verdict.reason ?? '') : '';

  const hasHint = inactive && Boolean(verdict.hint);
  remedy.hidden = !hasHint;
  remedy.textContent = hasHint ? verdict.hint : '';
}

/* --------------------------------------------------------------------------
   뷰 설정 컨트롤 (F-06)

   컨테이너 크기는 학습 대상 CSS 속성이 아니라 도구의 뷰 설정이다. 스키마에
   없으므로 createControl()을 거치지 않는 별개 경로다. 토픽을 모르므로 Grid에도
   그대로 쓰인다.

   값이 null이면 "사용자가 안 건드림"이고 CSS 기본값이 산다. 슬라이더는 그때
   기준점을 보여줄 수 없으므로 readout에 '기본값'이라고 적는다.
   -------------------------------------------------------------------------- */

export const VIEW_DEFAULT_TEXT = '기본값';

/**
 * 스키마 밖의 수치 컨트롤. 뷰 설정과 아이템 기하값이 같은 모양이라 함께 쓴다.
 *
 * @param {Object}   config
 * @param {string}   config.key       상태 필드 이름 (containerWidth · width 등)
 * @param {string}   config.label     표시 이름
 * @param {number}   config.min
 * @param {number}   config.max
 * @param {number}   [config.step]
 * @param {number}   [config.fallback] 값이 null일 때 슬라이더가 가리킬 위치
 * @param {string}   [config.nullText] 값이 null일 때 readout에 적을 말.
 *                                     없으면 null을 허용하지 않는 컨트롤이다
 * @param {number|null} config.value
 * @param {Function} config.onChange  (key, Number) => void
 * @param {Document} [config.doc]
 */
export function createRangeControl(config) {
  const {
    key, label, min, max, step = 1, fallback, nullText,
    value, onChange, doc = globalThis.document,
  } = config;

  if (!key) throw new Error('createRangeControl: key가 필요합니다');
  if (!doc) throw new Error('createRangeControl: document를 찾을 수 없습니다');

  const root = doc.createElement('div');
  root.className = `${CONTROL_CLASS} ${CONTROL_CLASS}--range`;
  root.setAttribute('data-range-key', key);

  const inputId = nextId(key);

  const labelEl = doc.createElement('label');
  labelEl.className = LABEL_CLASS;
  labelEl.setAttribute('for', inputId);
  const name = doc.createElement('span');
  name.className = HINT_CLASS;
  name.textContent = label;
  labelEl.appendChild(name);
  root.appendChild(labelEl);

  const input = doc.createElement('input');
  input.className = FIELD_CLASS;
  input.setAttribute('type', 'range');
  input.setAttribute('id', inputId);
  input.setAttribute('min', String(min));
  input.setAttribute('max', String(max));
  input.setAttribute('step', String(step));

  const readout = doc.createElement('output');
  readout.className = READOUT_CLASS;

  const wrap = doc.createElement('div');
  wrap.className = VALUES_CLASS;
  wrap.appendChild(input);
  wrap.appendChild(readout);
  root.appendChild(wrap);

  /** 저장소 값에 UI를 맞춘다. null이면 슬라이더는 기준점에 두고 표시만 바꾼다. */
  function sync(next) {
    const isDefault = (next === null || next === undefined) && nullText !== undefined;
    const shown = isDefault ? (fallback ?? min) : Number(next ?? fallback ?? min);
    input.value = String(shown);
    readout.textContent = isDefault ? nullText : `${shown}px`;
    root.setAttribute('data-default', String(isDefault));
  }

  const notify = typeof onChange === 'function' ? onChange : () => {};

  root.addEventListener('input', (e) => {
    if (e.target !== input) return;
    const parsed = Number(input.value);
    sync(parsed);
    notify(key, parsed);
  });

  sync(value ?? null);

  return { root, sync };
}

/* --------------------------------------------------------------------------
   진입점
   -------------------------------------------------------------------------- */

/**
 * @param {Object}   entry               스키마 항목
 * @param {Object}   config
 * @param {*}        config.value        현재 값. 없으면 entry.default
 * @param {Function} config.onChange     (jsProp, value) => void
 * @param {Document} [config.doc]        문서 객체. 테스트에서 대체 가능
 * @returns {{root: Element, sync: Function, setInactive: Function}}
 *          sync(value)는 저장소 값에 UI를 맞춘다. undo처럼 컨트롤 밖에서
 *          상태가 바뀌었을 때 호출한다. 호출해도 onChange는 불리지 않는다.
 *          setInactive(verdict)는 isInactive() 결과를 화면에 옮긴다.
 */
export function createControl(entry, { value, onChange, doc = globalThis.document } = {}) {
  if (!entry) throw new Error('createControl: 스키마 항목이 필요합니다');
  if (!doc) throw new Error('createControl: document를 찾을 수 없습니다');
  if (!CONTROL_TYPES[entry.control]) {
    throw new Error(`createControl: 알 수 없는 control '${entry.control}' (${entry.prop})`);
  }

  const current = value === undefined ? entry.default : value;

  const root = doc.createElement('div');
  root.className = `${CONTROL_CLASS} ${CONTROL_CLASS}--${entry.control}`;
  root.setAttribute('data-prop', entry.prop);
  root.setAttribute('data-control', entry.control);

  const state = {
    labelId: nextId(`${entry.prop}-label`),
    inputId: nextId(entry.prop),
    value: current,
  };

  root.appendChild(buildLabel(entry, doc, state));

  const noop = () => {};

  if (PENDING_CONTROLS.has(entry.control)) {
    root.appendChild(buildPending(entry, doc));
    return { root, sync: noop, setInactive: noop };
  }

  const notify = typeof onChange === 'function' ? onChange : noop;
  let sync = noop;

  switch (entry.control) {
    case 'enum': {
      root.appendChild(buildEnum(entry, current, doc, state));
      syncEnum(state, current);
      bindEnum(root, entry, state, notify);
      sync = (next) => syncEnum(state, next);
      break;
    }
    case 'number': {
      root.appendChild(buildNumber(entry, current, doc, state));
      bindNumber(root, entry, state, notify);
      sync = (next) => {
        state.value = next;
        state.input.value = String(next);
        state.readout.textContent = String(next);
      };
      break;
    }
    case 'length': {
      root.appendChild(buildLength(entry, current, doc, state));
      bindLength(root, entry, state, notify);
      sync = (next) => {
        const { num, unit } = splitLength(next, entry.units);
        state.value = next;

        // 수치를 치는 중이면 건드리지 않는다. 저장소에는 아직 옛 값(키워드)이
        // 남아 있어서, 그대로 반영하면 방금 고른 단위가 되돌아간다.
        if (state.pendingUnit && !NUMERIC_UNITS.has(unit)) return;
        state.pendingUnit = null;

        state.select.value = unit;
        if (NUMERIC_UNITS.has(unit)) state.input.removeAttribute('disabled');
        else state.input.setAttribute('disabled', 'disabled');

        // 입력 중인 칸은 덮어쓰지 않는다. 다른 컨트롤이 상태를 바꿀 때마다
        // 커서가 튀거나 자릿수가 끼어드는 것을 막는다.
        if (doc.activeElement === state.input) return;
        state.input.value = num;
      };
      break;
    }
    case 'track-list': {
      // 편집기는 따로 산다. 값 변환은 하지 않고 계약의 serialize·parse를 쓴다.
      const editor = createTrackEditor(entry, { value: current, onChange: notify, doc });
      root.appendChild(editor.root);
      state.interactive = editor.interactive;
      sync = editor.sync;
      break;
    }
    case 'span': {
      // 트랙 편집기와 같은 짜임이다. 값 변환은 계약에 맡긴다.
      const editor = createSpanEditor(entry, { value: current, onChange: notify, doc });
      root.appendChild(editor.root);
      state.interactive = editor.interactive;
      sync = editor.sync;
      break;
    }
    case 'area-grid': {
      // 1차는 텍스트 입력 + 검증까지다. 시각 편집은 M5 이후.
      const editor = createAreaEditor(entry, { value: current, onChange: notify, doc });
      root.appendChild(editor.root);
      state.interactive = editor.interactive;
      sync = editor.sync;
      break;
    }
    default: {
      // text 등 계약에는 있으나 이번 범위 밖인 타입
      root.appendChild(buildPending(entry, doc));
    }
  }

  const noteId = nextId(`${entry.prop}-note`);
  const { note, reason, remedy } = buildNote(doc, noteId);
  root.appendChild(note);

  const parts = { root, note, reason, remedy, noteId, interactive: state.interactive ?? [] };
  const setInactive = (verdict) => applyInactive(parts, verdict);
  setInactive({ inactive: false });

  return { root, sync, setInactive };
}

export default createControl;
