/**
 * track-editor.js — 트랙 목록 편집기 (GR-03)
 *
 * grid-template-columns · grid-template-rows 를 편집한다. 트랙 하나가 한 줄이고,
 * 줄마다 단위를 고르고 값을 넣고 순서를 바꾸거나 지운다.
 *
 * 값 변환은 하지 않는다. 상태에 넣는 모양도 CSS 문자열로 바꾸는 일도 전부
 * schema-spec.js 의 CONTROL_TYPES['track-list'] 가 이미 정해 두었다. 여기서는
 * serialize 를 불러 미리보기를 찍고, 상태에는 트랙 배열을 그대로 넘긴다.
 * 파서를 하나 더 만들면 두 곳이 언젠가 갈라진다.
 *
 * repeat() 는 표시에만 쓴다. 상태는 늘 펼친 배열이다 — 같은 트랙이 몇 개인지
 * 세는 것은 보여 주기 위한 계산이고, 접었다 펴도 값이 달라지지 않아야 한다.
 * parseTrackList 가 repeat() 를 읽지 못하는 것과도 맞물린다.
 *
 * store 를 모른다. 값은 인자로 받고 변경은 onChange 로 알린다.
 * 색·간격을 쓰지 않는다. 인라인 핸들러도 쓰지 않는다 — 루트에 한 번만 위임한다.
 */

import { CONTROL_TYPES } from '../core/schema-spec.js';

export const ROOT_CLASS = 'fgp-track';
export const LIST_CLASS = 'fgp-track__list';
export const ROW_CLASS = 'fgp-track__row';
export const NUM_CLASS = 'fgp-track__num';
export const UNIT_CLASS = 'fgp-track__unit';
export const SIZE_CLASS = 'fgp-track__size';
export const RANGE_CLASS = 'fgp-track__range';
export const BAR_CLASS = 'fgp-track__bar';
export const PREVIEW_CLASS = 'fgp-track__preview';
export const TOGGLE_CLASS = 'fgp-track__toggle';

/** 숫자가 앞에 붙는 단위. 나머지는 키워드이므로 수치 칸이 필요 없다. */
const NUMERIC_UNITS = new Set(['fr', 'px', '%', 'em', 'rem', 'vw', 'vh']);

/** 트랙 목록은 비울 수 없다. 빈 값은 그리드가 아니다. */
const MIN_TRACKS = 1;

/** minmax 의 기본 최소·최대. 새 트랙을 만들 때만 쓰는 출발점이다. */
const MINMAX_DEFAULT = { min: '100px', max: '1fr' };

const serialize = CONTROL_TYPES['track-list'].serialize;

/* --------------------------------------------------------------------------
   값 다루기 — 전부 순수 함수. DOM 을 모른다.
   -------------------------------------------------------------------------- */

/** 배열이 아니면 계약의 parse 에 맡긴다. 여기서 문자열을 뜯지 않는다. */
export function toTracks(value) {
  return CONTROL_TYPES['track-list'].parse(value ?? []);
}

/** 단위를 바꾸면 그 단위가 요구하는 모양으로 갈아입는다. */
export function trackFor(unit, previous = {}) {
  if (unit === 'minmax') {
    return { unit, min: previous.min ?? MINMAX_DEFAULT.min, max: previous.max ?? MINMAX_DEFAULT.max };
  }
  if (!NUMERIC_UNITS.has(unit)) return { unit };
  return { unit, size: Number.isFinite(previous.size) ? previous.size : 1 };
}

/**
 * 연달아 같은 트랙을 repeat(n, X) 로 묶는다. 표시 전용이다.
 *
 * 붙어 있는 같은 트랙만 묶는다. repeat(2, 100px 1fr) 처럼 묶음 단위가 되풀이되는
 * 경우는 다루지 않는다 — 그 축약은 읽는 사람에게 오히려 어렵고, 여기서 만들면
 * parseTrackList 가 되읽지 못한다.
 */
export function toRepeatCss(tracks) {
  const parts = [];
  let i = 0;

  while (i < tracks.length) {
    const css = serialize([tracks[i]]);
    let n = 1;
    while (i + n < tracks.length && serialize([tracks[i + n]]) === css) n += 1;
    parts.push(n > 1 ? `repeat(${n}, ${css})` : css);
    i += n;
  }

  return parts.join(' ');
}

/** 화면에 찍을 문자열. 접기 여부만 다르고 가리키는 트랙은 같다. */
export function previewOf(tracks, repeat) {
  return repeat ? toRepeatCss(tracks) : serialize(tracks);
}

export function moveTrack(tracks, from, to) {
  if (to < 0 || to >= tracks.length || from === to) return tracks;
  const next = [...tracks];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/* --------------------------------------------------------------------------
   행 하나
   -------------------------------------------------------------------------- */

function textField(doc, className, value, role, label) {
  const input = doc.createElement('input');
  input.className = className;
  input.setAttribute('type', 'text');
  input.setAttribute('data-field', role);
  input.setAttribute('aria-label', label);
  input.value = String(value ?? '');
  return input;
}

function buildRow(entry, track, index, total, doc) {
  const row = doc.createElement('div');
  row.className = ROW_CLASS;
  row.setAttribute('data-track', String(index));

  const num = doc.createElement('span');
  num.className = NUM_CLASS;
  num.textContent = String(index + 1);
  row.appendChild(num);

  const select = doc.createElement('select');
  select.className = UNIT_CLASS;
  select.setAttribute('data-field', 'unit');
  select.setAttribute('aria-label', `${index + 1}번 트랙 단위`);
  entry.units.forEach((unit) => {
    const option = doc.createElement('option');
    option.setAttribute('value', unit);
    option.textContent = unit;
    select.appendChild(option);
  });
  select.value = track.unit;
  row.appendChild(select);

  if (track.unit === 'minmax') {
    const range = doc.createElement('div');
    range.className = RANGE_CLASS;
    range.appendChild(textField(doc, SIZE_CLASS, track.min, 'min', `${index + 1}번 트랙 최소`));
    range.appendChild(textField(doc, SIZE_CLASS, track.max, 'max', `${index + 1}번 트랙 최대`));
    row.appendChild(range);
  } else if (NUMERIC_UNITS.has(track.unit)) {
    const size = doc.createElement('input');
    size.className = SIZE_CLASS;
    size.setAttribute('type', 'number');
    size.setAttribute('step', 'any');
    size.setAttribute('data-field', 'size');
    size.setAttribute('aria-label', `${index + 1}번 트랙 크기`);
    size.value = String(track.size ?? 1);
    row.appendChild(size);
  }

  [['up', '↑', '위로', index === 0],
   ['down', '↓', '아래로', index === total - 1],
   ['remove', '✕', '삭제', total <= MIN_TRACKS]].forEach(([action, glyph, name, off]) => {
    const button = doc.createElement('button');
    button.className = 'fgp-btn fgp-btn--quiet';
    button.setAttribute('type', 'button');
    button.setAttribute('data-track-action', action);
    button.setAttribute('aria-label', `${index + 1}번 트랙 ${name}`);
    button.textContent = glyph;
    if (off) button.disabled = true;
    row.appendChild(button);
  });

  return row;
}

/* --------------------------------------------------------------------------
   진입점
   -------------------------------------------------------------------------- */

/**
 * @param {Object}   entry              스키마 항목 (units 필수)
 * @param {Object}   config
 * @param {*}        config.value       트랙 배열 또는 CSS 문자열
 * @param {Function} config.onChange    (jsProp, tracks) => void
 * @param {Document} [config.doc]
 * @returns {{root, sync, interactive}}
 */
export function createTrackEditor(entry, { value, onChange, doc = globalThis.document } = {}) {
  if (!entry) throw new Error('createTrackEditor: 스키마 항목이 필요합니다');
  if (!Array.isArray(entry.units) || entry.units.length === 0) {
    throw new Error(`createTrackEditor: units가 필요합니다 (${entry.prop})`);
  }
  if (!doc) throw new Error('createTrackEditor: document를 찾을 수 없습니다');

  const notify = typeof onChange === 'function' ? onChange : () => {};

  const root = doc.createElement('div');
  root.className = ROOT_CLASS;

  const list = doc.createElement('div');
  list.className = LIST_CLASS;
  root.appendChild(list);

  const bar = doc.createElement('div');
  bar.className = BAR_CLASS;
  root.appendChild(bar);

  const addButton = doc.createElement('button');
  addButton.className = 'fgp-btn fgp-btn--quiet';
  addButton.setAttribute('type', 'button');
  addButton.setAttribute('data-track-action', 'add');
  addButton.textContent = '트랙 추가';
  bar.appendChild(addButton);

  const toggleLabel = doc.createElement('label');
  toggleLabel.className = TOGGLE_CLASS;

  const toggle = doc.createElement('input');
  toggle.setAttribute('type', 'checkbox');
  toggle.setAttribute('data-track-action', 'repeat');
  toggleLabel.appendChild(toggle);

  const toggleText = doc.createElement('span');
  toggleText.textContent = 'repeat() 축약';
  toggleLabel.appendChild(toggleText);
  bar.appendChild(toggleLabel);

  const preview = doc.createElement('code');
  preview.className = PREVIEW_CLASS;
  root.appendChild(preview);

  let tracks = toTracks(value ?? entry.default);
  let repeat = false;

  function paint() {
    while (list.firstChild) list.removeChild(list.firstChild);
    tracks.forEach((track, i) => list.appendChild(buildRow(entry, track, i, tracks.length, doc)));
    preview.textContent = previewOf(tracks, repeat);
  }

  /** 상태를 바꾸는 유일한 통로. 그려 놓고 알린다. */
  function commit(next) {
    tracks = next;
    paint();
    notify(entry.jsProp, tracks);
  }

  const rowIndex = (target) => {
    let node = target;
    while (node && node !== root) {
      const at = node.getAttribute?.('data-track');
      if (at !== null && at !== undefined) return Number(at);
      node = node.parentNode;
    }
    return -1;
  };

  const actionOf = (target) => {
    let node = target;
    while (node && node !== root) {
      const action = node.getAttribute?.('data-track-action');
      if (action) return { action, node };
      node = node.parentNode;
    }
    return null;
  };

  root.addEventListener('click', (event) => {
    const hit = actionOf(event.target);
    if (!hit || hit.node.disabled) return;

    const at = rowIndex(event.target);

    if (hit.action === 'add') {
      commit([...tracks, trackFor(entry.units[0])]);
      return;
    }
    if (hit.action === 'remove' && tracks.length > MIN_TRACKS && at >= 0) {
      commit(tracks.filter((_, i) => i !== at));
      return;
    }
    if (hit.action === 'up' && at > 0) commit(moveTrack(tracks, at, at - 1));
    if (hit.action === 'down' && at >= 0) commit(moveTrack(tracks, at, at + 1));
  });

  /** 축약은 보여 주는 방식일 뿐이다. 값도 건드리지 않고 알리지도 않는다. */
  root.addEventListener('change', (event) => {
    const hit = actionOf(event.target);
    if (hit?.action === 'repeat') {
      repeat = Boolean(event.target.checked);
      preview.textContent = previewOf(tracks, repeat);
      return;
    }

    const at = rowIndex(event.target);
    if (at < 0 || event.target.getAttribute?.('data-field') !== 'unit') return;
    commit(tracks.map((t, i) => (i === at ? trackFor(event.target.value, t) : t)));
  });

  root.addEventListener('input', (event) => {
    const field = event.target.getAttribute?.('data-field');
    if (field !== 'size' && field !== 'min' && field !== 'max') return;

    const at = rowIndex(event.target);
    if (at < 0) return;

    const raw = event.target.value;
    const next = tracks.map((t, i) => {
      if (i !== at) return t;
      if (field === 'size') return { ...t, size: raw === '' ? 0 : Number(raw) };
      return { ...t, [field]: raw };
    });

    // 입력 중에는 다시 그리지 않는다. 커서가 튀고 자릿수가 끼어든다.
    tracks = next;
    preview.textContent = previewOf(tracks, repeat);
    notify(entry.jsProp, tracks);
  });

  /** 저장소가 진실이다. undo 처럼 밖에서 바뀐 값도 되비친다. */
  function sync(next) {
    const incoming = toTracks(next ?? []);
    if (serialize(incoming) === serialize(tracks)) return;
    tracks = incoming;
    paint();
  }

  paint();

  return { root, sync, interactive: [addButton, toggle] };
}

export default createTrackEditor;
