/**
 * area-editor.js — 영역 이름 편집기 (GR-04, 1차)
 *
 * grid-template-areas 를 편집한다. PRD 8장 리스크에 적힌 대로 이번에는 텍스트
 * 입력과 유효성 표시까지만이다. 셀을 끌어 영역을 그리는 시각 편집(PRD GR-04)은
 * v1.0 에서 만들지 않았다.
 *
 * 한 줄 표기와 줄바꿈 표기를 모두 받고 따옴표가 없어도 읽는다. 어느 쪽으로
 * 적어도 상태에는 계약이 정규화한 문자열이 들어간다.
 *
 * 값 변환을 하지 않는다. schema-spec.js 의 CONTROL_TYPES['area-grid'] 가 정한
 * parse · serialize 를 부른다. 검증도 마찬가지다 — parseAreaGrid 가 돌려주는
 * errors 를 그대로 화면에 옮긴다. 규칙을 여기서 다시 적지 않는다.
 *
 * store 를 모른다. 색·간격을 쓰지 않는다. 인라인 핸들러도 쓰지 않는다.
 */

import { CONTROL_TYPES } from '../core/schema-spec.js';

export const ROOT_CLASS = 'fgp-area';
export const MODE_CLASS = 'fgp-area__mode';
export const OPTION_CLASS = 'fgp-area__option';
export const INPUT_CLASS = 'fgp-area__input';
export const STATUS_CLASS = 'fgp-area__status';
export const ERRORS_CLASS = 'fgp-area__errors';
export const ERROR_CLASS = 'fgp-area__error';
export const NAMES_CLASS = 'fgp-area__names';
export const PREVIEW_CLASS = 'fgp-area__preview';
export const CHECKED_CLASS = 'is-checked';
export const INVALID_CLASS = 'is-invalid';

const SPEC = CONTROL_TYPES['area-grid'];

/**
 * 영역을 두지 않는다는 뜻의 키워드.
 *
 * 계약을 태우면 안 된다. parse('none') 은 'none' 이라는 이름의 칸 하나로 읽고
 * serialize 는 그것을 '"none"' 으로 되돌린다 — 따옴표가 붙는 순간 키워드가
 * 아니라 한 칸짜리 영역 이름이 된다. 그래서 이 값만 통과시킨다.
 */
export const NONE = 'none';

/** 빈 칸 표기. 이름 목록에서 뺀다. */
const EMPTY_CELL = '.';

/**
 * none 에서 직접 지정으로 넘어갈 때 넣어 주는 출발점.
 *
 * 빈 칸에서 시작하면 무엇을 어떻게 적어야 하는지 알 수 없다. 2행 2열짜리
 * 가장 작은 예를 깔아 두고 고쳐 쓰게 한다. 값이지 스키마가 아니다 —
 * 어떤 areas 속성이든 같은 출발점을 쓴다.
 */
const SEED = '"a a" "b c"';

export const MODES = [
  { id: NONE, label: 'none', hint: '영역을 두지 않습니다. 아이템은 라인 번호로 배치됩니다.' },
  { id: 'custom', label: '직접 지정', hint: '한 줄에 한 행씩 적습니다. 빈 칸은 마침표로 표시합니다.' },
];

/* --------------------------------------------------------------------------
   값 다루기 — 전부 순수 함수. DOM 을 모른다.
   -------------------------------------------------------------------------- */

export const isNone = (value) => value === undefined || value === null
  || String(value).trim() === '' || String(value).trim() === NONE;

/** 검증 결과. 계약이 준 것을 그대로 얹는다. */
export function inspect(value) {
  if (isNone(value)) return { none: true, rows: [], errors: [], css: NONE };

  const { rows, errors } = SPEC.parse(value);
  if (rows.length === 0) return { none: true, rows: [], errors: [], css: NONE };

  return { none: false, rows, errors, css: SPEC.serialize(rows) };
}

/**
 * 정의된 영역 이름. 순서는 나온 순서다.
 *
 * grid-area(control: 'text')가 이 이름들을 참조한다. 이번 단계에서 잇지는 않지만
 * 그쪽에서 부르면 되도록 순수 함수로 내놓는다 — 편집기 인스턴스가 없어도 쓸 수 있다.
 */
export function areaNamesFrom(value) {
  const { rows } = inspect(value);
  const seen = [];
  rows.forEach((row) => row.forEach((name) => {
    if (name !== EMPTY_CELL && !seen.includes(name)) seen.push(name);
  }));
  return seen;
}

/* --------------------------------------------------------------------------
   진입점
   -------------------------------------------------------------------------- */

/**
 * @param {Object}   entry            스키마 항목
 * @param {Object}   config
 * @param {*}        config.value     'none' 또는 areas 문자열
 * @param {Function} config.onChange  (jsProp, value) => void
 * @param {Document} [config.doc]
 * @returns {{root, sync, names, interactive}}
 */
export function createAreaEditor(entry, { value, onChange, doc = globalThis.document } = {}) {
  if (!entry) throw new Error('createAreaEditor: 스키마 항목이 필요합니다');
  if (!doc) throw new Error('createAreaEditor: document를 찾을 수 없습니다');

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

  const input = doc.createElement('textarea');
  input.className = INPUT_CLASS;
  input.setAttribute('rows', '3');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('data-field', 'areas');
  input.setAttribute('aria-label', `${entry.label ?? entry.prop} 값`);
  root.appendChild(input);

  const status = doc.createElement('p');
  status.className = STATUS_CLASS;
  status.setAttribute('role', 'status');
  root.appendChild(status);

  const errorList = doc.createElement('ul');
  errorList.className = ERRORS_CLASS;
  root.appendChild(errorList);

  const names = doc.createElement('p');
  names.className = NAMES_CLASS;
  root.appendChild(names);

  const preview = doc.createElement('code');
  preview.className = PREVIEW_CLASS;
  root.appendChild(preview);

  /** 화면에 적힌 글자. 상태와 다를 수 있다 — 오류 중에는 적용하지 않는다. */
  let draft = isNone(value ?? entry.default) ? '' : String(value ?? entry.default);
  let applied = isNone(value ?? entry.default) ? NONE : inspect(value ?? entry.default).css;

  function paintModes(none) {
    options.forEach((button) => {
      const on = (button.getAttribute('data-mode') === NONE) === none;
      button.setAttribute('aria-checked', on ? 'true' : 'false');
      button.setAttribute('tabindex', on ? '0' : '-1');
      button.classList.toggle(CHECKED_CLASS, on);
    });
    input.hidden = none;
  }

  function paint({ typing = false } = {}) {
    const verdict = inspect(draft);
    const none = verdict.none;

    paintModes(none);
    if (!typing) input.value = draft;

    while (errorList.firstChild) errorList.removeChild(errorList.firstChild);
    verdict.errors.forEach((message) => {
      const li = doc.createElement('li');
      li.className = ERROR_CLASS;
      li.textContent = message;
      errorList.appendChild(li);
    });

    const bad = verdict.errors.length > 0;
    root.classList.toggle(INVALID_CLASS, bad);
    errorList.hidden = !bad;

    const spec = MODES.find((m) => m.id === (none ? NONE : 'custom'));
    if (bad) status.textContent = '고칠 곳이 있어 프리뷰에 적용하지 않았습니다.';
    else status.textContent = none ? spec.hint : `${verdict.rows.length}행 × ${verdict.rows[0].length}열`;

    const list = areaNamesFrom(draft);
    names.hidden = list.length === 0;
    names.textContent = list.length ? `영역 이름: ${list.join(' · ')}` : '';

    preview.textContent = applied;
  }

  /** 오류가 있으면 상태를 건드리지 않는다. 입력은 막지 않는다. */
  function commit({ typing = false } = {}) {
    const verdict = inspect(draft);

    if (verdict.errors.length === 0) {
      const next = verdict.none ? NONE : verdict.css;
      if (next !== applied) {
        applied = next;
        notify(entry.jsProp, applied);
      }
    }

    paint({ typing });
  }

  const closest = (target, attr) => {
    let node = target;
    while (node && node !== root) {
      const found = node.getAttribute?.(attr);
      if (found) return found;
      node = node.parentNode;
    }
    return null;
  };

  modeBar.addEventListener('click', (event) => {
    const mode = closest(event.target, 'data-mode');
    if (!mode) return;
    draft = mode === NONE ? '' : (draft || SPEC.serialize(inspect(SEED).rows));
    commit();
  });

  modeBar.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;

    const at = MODES.findIndex((m) => m.id === (inspect(draft).none ? NONE : 'custom'));
    const to = (at + step + MODES.length) % MODES.length;

    if (event.preventDefault) event.preventDefault();
    draft = MODES[to].id === NONE ? '' : (draft || SPEC.serialize(inspect(SEED).rows));
    commit();
    if (typeof options[to].focus === 'function') options[to].focus();
  });

  root.addEventListener('input', (event) => {
    if (event.target.getAttribute?.('data-field') !== 'areas') return;
    draft = event.target.value;
    // 입력 중에는 글자를 되쓰지 않는다. 커서가 튀고 줄바꿈이 사라진다.
    commit({ typing: true });
  });

  /** 저장소가 진실이다. undo 처럼 밖에서 바뀐 값도 되비친다. */
  function sync(next) {
    const incoming = isNone(next) ? NONE : inspect(next).css;
    if (incoming === applied) return;
    applied = incoming;
    draft = incoming === NONE ? '' : incoming;
    paint();
  }

  paint();

  return { root, sync, names: () => areaNamesFrom(draft), interactive: [...options, input] };
}

export default createAreaEditor;
