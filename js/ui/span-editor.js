/**
 * span-editor.js — 라인 좌표 편집기 (GR-02)
 *
 * grid-column-start · grid-column-end · grid-row-start · grid-row-end 를 편집한다.
 * 넷 다 값을 하나만 갖는다. 세 가지 모양 중 하나다.
 *
 *   auto      자동 배치에 맡긴다
 *   정수      라인 번호. 음수는 끝에서부터 세며 -1 이 마지막 라인이다
 *   span n    끝 라인 대신 몇 칸을 차지할지로 지정한다
 *
 * 값 변환을 하지 않는다. schema-spec.js 의 CONTROL_TYPES['span'] 이 정한
 * serialize · parse 를 부른다. 파서를 하나 더 만들면 두 곳이 언젠가 갈라진다 —
 * 이 컨트롤이 늦어진 이유가 정확히 그 어긋남이었다.
 *
 * 라인 번호에 범위를 두지 않는다. 유효 범위는 지금 트랙 수에 따라 달라지는데,
 * 범위 밖 값을 막으면 암시적 트랙이 생기는 장면을 볼 수 없게 된다. 그건 CSS 의
 * 실제 동작이고 grid-auto-columns · grid-auto-rows 를 배우는 통로다.
 * 대신 스키마의 tip 이 "열이 3개면 라인은 4개" 를 이미 알려 준다.
 *
 * store 를 모른다. 색·간격을 쓰지 않는다. 인라인 핸들러도 쓰지 않는다.
 */

import { CONTROL_TYPES, AUTO } from '../core/schema-spec.js';

export const ROOT_CLASS = 'fgp-span';
export const MODE_CLASS = 'fgp-span__mode';
export const OPTION_CLASS = 'fgp-span__option';
export const FIELD_CLASS = 'fgp-span__field';
export const HINT_CLASS = 'fgp-span__hint';
export const PREVIEW_CLASS = 'fgp-span__preview';
export const CHECKED_CLASS = 'is-checked';

const SPEC = CONTROL_TYPES.span;

/**
 * 고를 수 있는 세 모양. 값이 아니라 입력 방식이라 스키마에 둘 것이 아니다 —
 * 어떤 span 속성이든 셋이 같고, 스키마가 늘어도 달라지지 않는다.
 */
export const MODES = [
  { id: AUTO, label: 'auto', hint: '자동 배치에 맡깁니다.' },
  { id: 'line', label: '라인', hint: '라인 번호입니다. 음수는 끝에서부터 세며 -1이 마지막 라인입니다.' },
  { id: 'span', label: 'span', hint: '끝 라인 대신 차지할 칸 수입니다.' },
];

/** 값이 어느 모양인지. 계약이 만든 객체만 보고 판단한다. */
export function modeOf(value) {
  const parsed = SPEC.parse(value ?? AUTO);
  if (parsed.span !== undefined && parsed.span !== null) return 'span';
  if (parsed.line === AUTO || parsed.line === undefined || parsed.line === null) return AUTO;
  return 'line';
}

/** 모양을 바꿀 때 넘어갈 값. 숫자는 이어받아 auto ↔ 라인 ↔ span 이 이어진다. */
export function valueForMode(mode, previous) {
  const parsed = SPEC.parse(previous ?? AUTO);
  const carried = parsed.span ?? (typeof parsed.line === 'number' ? parsed.line : 1);

  if (mode === AUTO) return { line: AUTO };
  if (mode === 'span') return { span: carried };
  return { line: carried };
}

/* --------------------------------------------------------------------------
   진입점
   -------------------------------------------------------------------------- */

/**
 * @param {Object}   entry             스키마 항목
 * @param {Object}   config
 * @param {*}        config.value      'auto' | '3' | 'span 2' 또는 계약 객체
 * @param {Function} config.onChange   (jsProp, value) => void
 * @param {Document} [config.doc]
 * @returns {{root, sync, interactive}}
 */
export function createSpanEditor(entry, { value, onChange, doc = globalThis.document } = {}) {
  if (!entry) throw new Error('createSpanEditor: 스키마 항목이 필요합니다');
  if (!doc) throw new Error('createSpanEditor: document를 찾을 수 없습니다');

  const notify = typeof onChange === 'function' ? onChange : () => {};

  const root = doc.createElement('div');
  root.className = ROOT_CLASS;

  const modeBar = doc.createElement('div');
  modeBar.className = MODE_CLASS;
  modeBar.setAttribute('role', 'radiogroup');
  modeBar.setAttribute('aria-label', `${entry.label ?? entry.prop} 지정 방식`);
  root.appendChild(modeBar);

  const options = MODES.map((mode) => {
    const button = doc.createElement('button');
    button.className = OPTION_CLASS;
    button.setAttribute('type', 'button');
    button.setAttribute('role', 'radio');
    button.setAttribute('data-mode', mode.id);
    button.textContent = mode.label;
    modeBar.appendChild(button);
    return button;
  });

  const field = doc.createElement('input');
  field.className = FIELD_CLASS;
  field.setAttribute('type', 'number');
  field.setAttribute('step', '1');
  field.setAttribute('data-field', 'number');
  field.setAttribute('aria-label', `${entry.label ?? entry.prop} 값`);
  root.appendChild(field);

  const hint = doc.createElement('p');
  hint.className = HINT_CLASS;
  root.appendChild(hint);

  const preview = doc.createElement('code');
  preview.className = PREVIEW_CLASS;
  root.appendChild(preview);

  let current = SPEC.parse(value ?? entry.default ?? AUTO);

  function paint() {
    const mode = modeOf(current);
    const spec = MODES.find((m) => m.id === mode);

    options.forEach((button) => {
      const on = button.getAttribute('data-mode') === mode;
      button.setAttribute('aria-checked', on ? 'true' : 'false');
      button.setAttribute('tabindex', on ? '0' : '-1');
      button.classList.toggle(CHECKED_CLASS, on);
    });

    // auto 는 넣을 숫자가 없다. 칸을 없애지 않고 잠가 두어 자리가 흔들리지 않게 한다.
    field.hidden = mode === AUTO;
    if (mode !== AUTO) field.value = String(current.span ?? current.line ?? 1);

    hint.textContent = spec?.hint ?? '';
    preview.textContent = SPEC.serialize(current);
  }

  function commit(next) {
    current = next;
    paint();
    notify(entry.jsProp, SPEC.serialize(current));
  }

  const closest = (target, attr) => {
    let node = target;
    while (node && node !== root) {
      const found = node.getAttribute?.(attr);
      if (found) return { value: found, node };
      node = node.parentNode;
    }
    return null;
  };

  modeBar.addEventListener('click', (event) => {
    const hit = closest(event.target, 'data-mode');
    if (hit) commit(valueForMode(hit.value, current));
  });

  modeBar.addEventListener('keydown', (event) => {
    const next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!next) return;

    const at = MODES.findIndex((m) => m.id === modeOf(current));
    const to = (at + next + MODES.length) % MODES.length;

    if (event.preventDefault) event.preventDefault();
    commit(valueForMode(MODES[to].id, current));
    if (typeof options[to].focus === 'function') options[to].focus();
  });

  root.addEventListener('input', (event) => {
    if (event.target.getAttribute?.('data-field') !== 'number') return;

    const raw = event.target.value;
    const num = raw === '' || raw === '-' ? 0 : Number(raw);
    if (!Number.isFinite(num)) return;

    const mode = modeOf(current);
    if (mode === AUTO) return;

    // 입력 중에는 다시 그리지 않는다. 커서가 튀고 자릿수가 끼어든다.
    current = mode === 'span' ? { span: num } : { line: num };
    preview.textContent = SPEC.serialize(current);
    notify(entry.jsProp, SPEC.serialize(current));
  });

  /** 저장소가 진실이다. undo 처럼 밖에서 바뀐 값도 되비친다. */
  function sync(next) {
    const incoming = SPEC.parse(next ?? AUTO);
    if (SPEC.serialize(incoming) === SPEC.serialize(current)) return;
    current = incoming;
    paint();
  }

  paint();

  return { root, sync, interactive: [...options, field] };
}

export default createSpanEditor;
