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

/* --------------------------------------------------------------------------
   DOM 계약 — components.css가 받는 이름
   -------------------------------------------------------------------------- */

export const CONTROL_CLASS = 'fgp-control';
export const LABEL_CLASS = 'fgp-control__label';
export const VALUES_CLASS = 'fgp-control__values';
export const OPTION_CLASS = 'fgp-control__option';
export const FIELD_CLASS = 'fgp-control__field';
export const READOUT_CLASS = 'fgp-control__readout';
export const UNIT_CLASS = 'fgp-control__unit';
export const PENDING_CLASS = 'fgp-control--pending';
export const CHECKED_CLASS = 'is-checked';

/** 숫자가 앞에 붙는 단위. 나머지(auto·content 등)는 키워드로 본다. */
const NUMERIC_UNITS = new Set(['px', 'rem', 'em', '%', 'fr', 'vh', 'vw', 'ch']);

/** M3에서 구현할 컨트롤. 분기 자리만 잡아 둔다. */
const PENDING_CONTROLS = new Set(['track-list', 'area-grid', 'span']);

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

/** 키워드 단위면 단위만, 아니면 수치와 붙여서 돌려준다. */
export function joinLength(num, unit) {
  if (!NUMERIC_UNITS.has(unit)) return unit;
  return `${num === '' ? 0 : num}${unit}`;
}

/* --------------------------------------------------------------------------
   컨트롤별 본문
   -------------------------------------------------------------------------- */

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
  select.setAttribute('aria-label', `${state.labelText} 단위`);

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
   진입점
   -------------------------------------------------------------------------- */

/**
 * @param {Object}   entry               스키마 항목
 * @param {Object}   config
 * @param {*}        config.value        현재 값. 없으면 entry.default
 * @param {Function} config.onChange     (jsProp, value) => void
 * @param {Document} [config.doc]        문서 객체. 테스트에서 대체 가능
 * @returns {Element} 컨트롤 루트
 */
export function createControl(entry, { value, onChange, doc = globalThis.document } = {}) {
  if (!entry) throw new Error('createControl: 스키마 항목이 필요합니다');
  if (!doc) throw new Error('createControl: document를 찾을 수 없습니다');
  if (!CONTROL_TYPES[entry.control]) {
    throw new Error(`createControl: 알 수 없는 control '${entry.control}' (${entry.prop})`);
  }

  const current = value === undefined ? entry.default : value;
  const labelText = entry.label ?? entry.prop;

  const root = doc.createElement('div');
  root.className = `${CONTROL_CLASS} ${CONTROL_CLASS}--${entry.control}`;
  root.setAttribute('data-prop', entry.prop);
  root.setAttribute('data-control', entry.control);

  const state = {
    labelId: nextId(`${entry.prop}-label`),
    inputId: nextId(entry.prop),
    labelText,
    value: current,
  };

  const label = doc.createElement(entry.control === 'enum' ? 'div' : 'label');
  label.className = LABEL_CLASS;
  label.setAttribute('id', state.labelId);
  label.textContent = labelText;
  if (entry.control !== 'enum') label.setAttribute('for', state.inputId);
  root.appendChild(label);

  if (PENDING_CONTROLS.has(entry.control)) {
    root.appendChild(buildPending(entry, doc));
    return root;
  }

  const notify = typeof onChange === 'function' ? onChange : () => {};

  switch (entry.control) {
    case 'enum': {
      root.appendChild(buildEnum(entry, current, doc, state));
      syncEnum(state, current);
      bindEnum(root, entry, state, notify);
      break;
    }
    case 'number': {
      root.appendChild(buildNumber(entry, current, doc, state));
      bindNumber(root, entry, state, notify);
      break;
    }
    case 'length': {
      root.appendChild(buildLength(entry, current, doc, state));
      bindLength(root, entry, state, notify);
      break;
    }
    default: {
      // text 등 계약에는 있으나 이번 범위 밖인 타입
      root.appendChild(buildPending(entry, doc));
    }
  }

  return root;
}

export default createControl;
