/**
 * grid-overlay.js — 그리드 라인 번호 오버레이 (GR-05)
 *
 * 프리뷰 위에 라인 번호를 겹쳐 보여 준다. span 컨트롤에 '1 / 3' 을 넣었을 때
 * 왜 두 칸인지는 라인 번호를 봐야 읽힌다. 컨트롤은 되는데 결과를 읽을 수단이
 * 없던 자리를 메운다.
 *
 * 프리뷰 DOM 을 그리지 않는다. renderer 가 그려 놓은 컨테이너를 읽어 위치만
 * 잡는다. 그래서 renderer 를 고칠 일이 없다 — getContainer() 하나만 받는다.
 *
 * 잰 값을 상태에 올리지 않는다. 라인 위치를 알려면 실제 DOM 을 재야 하는데,
 * 그 결과를 store 에 넣으면 렌더가 다시 유발되어 무한 루프가 된다
 * (PRD 8장 리스크). 여기서만 쓰고 밖으로 내보내지 않는다.
 *
 * 토픽을 묻지 않는다. 라인이 있는지로 판정한다 — 브라우저가 계산한
 * grid-template-columns 가 'none' 이면 그리드 서식 문맥이 아니라는 뜻이고,
 * 그때는 오버레이가 스스로 사라진다. Flex 에서 라인 개념이 없다는 사실을
 * 코드가 아니라 브라우저가 말해 준다.
 *
 * 색은 tokens.css 의 --fgp-grid-line-* 를 쓴다. 이 파일에 색이 없다.
 */

import { parseTrackList } from '../core/schema-spec.js';

export const ROOT_CLASS = 'fgp-gridlines';
export const AXIS_CLASS = 'fgp-gridlines__axis';
export const LABEL_CLASS = 'fgp-gridlines__label';
export const TOGGLE_CLASS = 'fgp-gridlines__toggle';
export const IMPLICIT_CLASS = 'is-implicit';

/** 축 두 개. 이름은 CSS 축이 아니라 화면상의 방향이다. */
const AXES = [
  { id: 'columns', prop: 'gridTemplateColumns', side: 'top' },
  { id: 'rows', prop: 'gridTemplateRows', side: 'left' },
];

/** 그리드가 아닐 때 브라우저가 돌려주는 값. */
const NO_TRACKS = 'none';

/* --------------------------------------------------------------------------
   계산 — 전부 순수 함수. DOM 을 모른다.
   -------------------------------------------------------------------------- */

/** 브라우저가 계산해 준 트랙 목록을 px 배열로. 계산값은 늘 px 로 풀려 있다. */
export function trackSizes(computed) {
  const raw = String(computed ?? '').trim();
  if (raw === '' || raw === NO_TRACKS) return [];
  return raw.split(/\s+/).map(Number.parseFloat).filter(Number.isFinite);
}

/** 스키마가 정한 명시 트랙 수. renderer 가 얹어 둔 인라인 값에서 센다. */
export function explicitCount(inline) {
  const raw = String(inline ?? '').trim();
  if (raw === '' || raw === NO_TRACKS) return 0;
  return parseTrackList(raw).length;
}

/**
 * 라인 목록.
 *
 * 트랙이 n 개면 라인은 n+1 개다. 양수는 1..n+1, 음수는 -(n+1)..-1 이고
 * 같은 라인이 두 이름을 갖는다 — 열이 3개면 1번 라인이 -4번 라인이다.
 *
 * 명시 트랙보다 뒤에 있는 라인은 암시적이다. 자동 배치가 만들어 낸 트랙의
 * 경계이므로 다른 표시를 준다 (GR-06 과 같은 구분).
 */
export function linesFrom(computed, inline) {
  const sizes = trackSizes(computed);
  if (sizes.length === 0) return [];

  const explicit = explicitCount(inline);
  const total = sizes.length;

  let offset = 0;
  return Array.from({ length: total + 1 }, (_, i) => {
    const at = offset;
    if (i < total) offset += sizes[i];
    return {
      index: i + 1,
      positive: i + 1,
      // 라인이 n+1 개이므로 k번 라인의 음수 이름은 k - (n+2) 다.
      // 열 3개면 1번이 -4번, 4번이 -1번이다.
      negative: i - total - 1,
      offset: at,
      explicit: i + 1 <= explicit + 1,
    };
  });
}

/* --------------------------------------------------------------------------
   진입점
   -------------------------------------------------------------------------- */

/**
 * @param {Object}   config
 * @param {Function} config.getContainer  renderer가 그린 컨테이너를 돌려주는 함수
 * @param {Element}  config.root          오버레이를 붙일 자리 (컨테이너의 조상)
 * @param {Element}  [config.toolbar]     토글 버튼을 붙일 자리
 * @param {boolean}  [config.visible]     처음 상태
 * @param {Function} [config.getStyle]    계산된 스타일을 읽는 함수 (검증에서 대체)
 * @param {Function} [config.getRect]     요소의 사각형을 읽는 함수 (검증에서 대체)
 * @param {Document} [config.doc]
 * @returns {{root, refresh, toggle, isVisible, hasLines, lines}}
 */
export function createGridOverlay(config) {
  const {
    getContainer, root, toolbar,
    visible = true,
    getStyle = (el) => globalThis.getComputedStyle(el),
    getRect = (el) => el?.getBoundingClientRect?.() ?? null,
    doc = globalThis.document,
  } = config;

  if (typeof getContainer !== 'function') throw new Error('createGridOverlay: getContainer가 필요합니다');
  if (!root) throw new Error('createGridOverlay: root 요소가 필요합니다');
  if (!doc) throw new Error('createGridOverlay: document를 찾을 수 없습니다');

  const layer = doc.createElement('div');
  layer.className = ROOT_CLASS;
  // 아이템 클릭을 가로막지 않는다. 실제 차단은 components.css 의
  // pointer-events: none 이 하고, 보조 기술에도 알려 둔다.
  layer.setAttribute('aria-hidden', 'true');
  root.appendChild(layer);

  const axes = new Map(AXES.map((axis) => {
    const el = doc.createElement('div');
    el.className = `${AXIS_CLASS} ${AXIS_CLASS}--${axis.id}`;
    layer.appendChild(el);
    return [axis.id, el];
  }));

  let toggleButton = null;
  if (toolbar) {
    toggleButton = doc.createElement('button');
    toggleButton.className = `fgp-btn fgp-btn--quiet ${TOGGLE_CLASS}`;
    toggleButton.setAttribute('type', 'button');
    toggleButton.setAttribute('data-overlay-action', 'toggle');
    toolbar.appendChild(toggleButton);

    toolbar.addEventListener('click', (event) => {
      let node = event.target;
      while (node && node !== toolbar) {
        if (node.getAttribute?.('data-overlay-action') === 'toggle') { toggle(); return; }
        node = node.parentNode;
      }
    });
  }

  let shown = Boolean(visible);
  let current = { columns: [], rows: [] };

  function buildAxis(el, lines, side) {
    while (el.firstChild) el.removeChild(el.firstChild);

    lines.forEach((line) => {
      const label = doc.createElement('span');
      label.className = LABEL_CLASS;
      label.classList.toggle(IMPLICIT_CLASS, !line.explicit);
      // 같은 라인의 두 이름을 함께 적는다. 음수가 어디를 가리키는지 바로 읽힌다.
      label.textContent = `${line.positive} / ${line.negative}`;
      label.style.setProperty('--fgp-gridline-offset', `${line.offset}px`);
      label.setAttribute('data-line', String(line.positive));
      label.setAttribute('data-side', side);
      el.appendChild(label);
    });
  }

  /**
   * 트랙 크기는 컨테이너의 콘텐츠 상자 기준이다. 오버레이의 원점은 스테이지
   * 안쪽이라 둘이 어긋난다 — 컨테이너의 테두리와 안쪽 여백만큼이다.
   * 그 차이를 재서 축을 옮겨 놓는다. 재기만 하고 어디에도 올리지 않는다.
   */
  function placeAxes(container, computed) {
    const box = getRect(container);
    const base = getRect(layer);
    if (!box || !base) return;

    const edge = (side) => (Number.parseFloat(computed[`border${side}Width`]) || 0)
      + (Number.parseFloat(computed[`padding${side}`]) || 0);

    const x = box.left - base.left + edge('Left');
    const y = box.top - base.top + edge('Top');

    axes.forEach((el) => {
      el.style.setProperty('--fgp-gridlines-x', `${x}px`);
      el.style.setProperty('--fgp-gridlines-y', `${y}px`);
    });
  }

  /** 읽기만 한다. store 도 renderer 도 건드리지 않는다. */
  function refresh() {
    const container = getContainer?.();
    if (!container) return current;

    const computed = getStyle(container) ?? {};

    current = AXES.reduce((acc, axis) => {
      acc[axis.id] = linesFrom(computed[axis.prop], container.style?.[axis.prop]);
      return acc;
    }, { columns: [], rows: [] });

    const has = hasLines();

    AXES.forEach((axis) => buildAxis(axes.get(axis.id), has && shown ? current[axis.id] : [], axis.side));
    if (has && shown) placeAxes(container, computed);

    layer.hidden = !(has && shown);
    if (toggleButton) {
      toggleButton.hidden = !has;
      toggleButton.setAttribute('aria-pressed', String(shown));
      toggleButton.textContent = shown ? '라인 번호 끄기' : '라인 번호 보기';
    }

    return current;
  }

  /** 라인이 있는가. 토픽을 묻지 않고 브라우저가 계산한 결과로 판정한다. */
  function hasLines() {
    return current.columns.length > 0 || current.rows.length > 0;
  }

  function toggle(force) {
    shown = force === undefined ? !shown : Boolean(force);
    refresh();
    return shown;
  }

  refresh();

  return {
    root: layer,
    refresh,
    toggle,
    isVisible: () => shown && hasLines(),
    hasLines,
    lines: () => current,
  };
}

export default createGridOverlay;
