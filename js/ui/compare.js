/**
 * compare.js — Flex ↔ Grid 개념 대조 (GR-09 / PRD 5.4, P2)
 *
 * 같은 이름 속성이 두 모델에서 다르게 동작하는 지점을 나란히 둔다.
 *
 * ── 어디에 두는가 ─────────────────────────────────────────────────────────
 *
 * 속성 설명 탭 안이다. PRD 9번의 열린 결정 사항 3을 이렇게 닫았다.
 *
 * 5번째 탭으로 빼려면 store.js 의 TABS 와 tabs.js 를 건드려야 한다. 그보다
 * 판단의 근거는 성격이다 — 이 뷰는 조작이 없고 읽기만 하는 화면이라 속성 설명
 * 탭과 같은 물건이고, 대조하는 내용도 그 탭이 하나씩 설명하는 속성들이다.
 * P2 짜리를 최상위 탭으로 올리면 P0 기능과 같은 무게로 보이는 것도 맞지 않다.
 *
 * 다만 늘 펼쳐 두지는 않는다. 접힌 상태에서는 한 줄이고, 펼치면 두 열을 가로질러
 * 자리를 잡는다. 속성 설명을 읽으러 온 사람의 화면을 밀어내지 않는다.
 *
 * ── 무엇을 근거로 짝을 짓는가 ─────────────────────────────────────────────
 *
 * 스키마의 relatedTo 뿐이다. 이 파일에 속성 이름이 없다. 어느 쪽에서 걸었든
 * 짝이면 잡으므로(한쪽만 선언한 gap ↔ column-gap 도 나온다) 스키마가 늘면
 * 화면이 따라간다.
 *
 * 설명 문장도 스키마의 desc · tip 을 그대로 쓴다. 대조용 문장을 새로 쓰지
 * 않는다 — 같은 속성을 두 곳에서 다르게 설명하면 언젠가 갈라진다.
 *
 * ── 어떤 값으로 데모를 만드는가 ───────────────────────────────────────────
 *
 * 같은 값을 두 모델에 얹어야 "이름도 값도 같은데 결과가 다르다" 가 보인다.
 * 두 스키마의 values 에 모두 있는 값 중 양쪽 기본값이 아닌 첫 값이 1순위이고,
 * enum 이 아니어도 컨트롤 타입이 같으면 한쪽 기본값을 양쪽에 얹는다. 타입까지
 * 다른 짝만 각자의 기본값을 쓴다. 값 이름을 코드에 적지 않으므로 스키마가
 * 값을 바꾸면 데모도 따라간다. 자세한 순서는 sharedValue 주석에 있다.
 *
 * 상태를 건드리지 않는다. store 를 import 하지 않고, 데모는 정적 스냅숏이다.
 */

import { DEMO_CLASS, DEMO_ITEM_CLASS } from './explain.js';
import { toCssValue } from '../core/schema-spec.js';

export const ROOT_CLASS = 'fgp-compare';
export const SUMMARY_CLASS = 'fgp-compare__summary';
export const BODY_CLASS = 'fgp-compare__body';
export const PAIR_CLASS = 'fgp-compare__pair';
export const SIDE_CLASS = 'fgp-compare__side';
export const NAME_CLASS = 'fgp-compare__name';
export const VALUE_CLASS = 'fgp-compare__value';
export const TEXT_CLASS = 'fgp-compare__text';
export const NOTE_CLASS = 'fgp-compare__note';
export const HOST_CLASS = 'has-compare';

/** 데모 아이템 기본 크기. 속성 설명 탭의 default 와 같은 값이다. */
const ITEM = { w: 56, h: 44 };

/** 짝을 못 지은 relatedTo 를 알리는 자리. 화면에 사유를 그대로 적는다. */
const DANGLING = '짝을 찾지 못했습니다';

/* --------------------------------------------------------------------------
   문장 — desc · tip 에 <strong>·<code> 가 섞여 있다.

   innerHTML 을 쓰지 않으므로 태그를 열고 닫는 자리마다 요소를 만들어 붙인다.
   explain.js 가 같은 일을 하지만 그쪽은 내보내지 않는다. 옮겨 오는 대신
   여기서 다시 쓰는 이유는, 두 파일이 서로를 붙들지 않게 하기 위해서다 —
   대조 뷰는 속성 설명 탭 안에 놓일 뿐 그 구현에 매이지 않는다.
   -------------------------------------------------------------------------- */

function appendRich(target, text, doc) {
  const source = String(text ?? '');
  const pattern = /<(\/?)([a-z]+)>/gi;
  let at = 0;
  let open = null;

  const put = (chunk) => {
    if (chunk === '') return;
    const el = doc.createElement(open ?? 'span');
    el.textContent = chunk;
    target.appendChild(el);
  };

  let match = pattern.exec(source);
  while (match) {
    put(source.slice(at, match.index));
    const [, closing, tag] = match;
    open = closing ? null : tag.toLowerCase();
    at = match.index + match[0].length;
    match = pattern.exec(source);
  }
  put(source.slice(at));
  return target;
}

/* --------------------------------------------------------------------------
   짝 짓기
   -------------------------------------------------------------------------- */

/**
 * relatedTo 로 이어진 짝 목록.
 *
 * 양쪽 어디서 걸었든 한 번만 나온다. 선언이 한쪽에만 있어도 상대가 있으면
 * 짝으로 친다 — gap ↔ column-gap 이 그렇다.
 *
 * @param {Array} left    기준 토픽 스키마
 * @param {Array} right   상대 토픽 스키마
 * @returns {Array<{left, right}>}
 */
export function pairsFrom(left = [], right = []) {
  const byProp = (schema) => new Map(schema.map((e) => [e.prop, e]));
  const L = byProp(left);
  const R = byProp(right);
  const seen = new Set();
  const out = [];

  const add = (a, b) => {
    const key = `${a.prop}|${b.prop}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ left: a, right: b });
  };

  left.forEach((entry) => {
    (entry.relatedTo ?? []).forEach((name) => {
      const mate = R.get(name);
      if (mate) add(entry, mate);
    });
  });

  right.forEach((entry) => {
    (entry.relatedTo ?? []).forEach((name) => {
      const mate = L.get(name);
      if (mate) add(mate, entry);
    });
  });

  return out;
}

/**
 * 짝을 찾지 못한 relatedTo. 화면 아래에 사유를 적는다.
 *
 * 조용히 버리면 스키마의 오타나 한쪽에만 있는 속성이 영영 드러나지 않는다.
 * PRD 5.4 가 요구한 항목이 빠져 있는 것도 여기서 보인다.
 */
export function danglingFrom(left = [], right = []) {
  const names = (schema) => new Set(schema.map((e) => e.prop));
  const scan = (schema, other, topic) => {
    const known = names(other);
    return schema.flatMap((entry) => (entry.relatedTo ?? [])
      .filter((name) => !known.has(name))
      .map((name) => ({ topic, prop: entry.prop, wanted: name })));
  };
  return [...scan(left, right, 'left'), ...scan(right, left, 'right')];
}

/**
 * 두 항목에 함께 얹을 값.
 *
 * 1. 양쪽 values 에 모두 있고 어느 쪽 기본값도 아닌 첫 값
 * 2. 그런 값이 없으면 공통값 아무거나
 * 3. 공통값이 없어도 컨트롤 타입이 같으면 왼쪽 기본값을 양쪽에 얹는다
 *    — gap ↔ column-gap 처럼 enum 이 아닌 짝이 여기 걸린다. 같은 8px 을 두
 *      모델에 주어야 "아이템 사이" 와 "트랙 사이" 의 차이가 값 탓이 아니라고
 *      읽힌다. 각자의 기본값(8px · 12px)을 쓰면 간격 차이가 값 차이로 보인다.
 * 4. 타입까지 다르면 각자의 기본값. 애초에 같은 값을 얹을 수 없는 짝이다
 *    — flex-basis(길이) ↔ grid-template-columns(트랙 목록)이 그렇다.
 */
export function sharedValue(a, b) {
  const vals = (e) => (e.values ?? []).map((v) => v.val);
  const left = vals(a);
  const right = new Set(vals(b));
  const common = left.filter((v) => right.has(v));

  if (common.length > 0) {
    const fresh = common.find((v) => v !== a.default && v !== b.default);
    const pick = fresh ?? common[0];
    return { left: pick, right: pick, shared: true };
  }

  if (a.control === b.control) return { left: a.default, right: a.default, shared: true };

  return { left: a.default, right: b.default, shared: false };
}

/* --------------------------------------------------------------------------
   데모 — 값 하나를 얹은 정적 스냅숏
   -------------------------------------------------------------------------- */

function buildDemo(entry, value, topic, doc) {
  /**
   * 판 설정은 세 겹이다.
   *   스키마의 demo      속성이 스스로 요구하는 최소 조건
   *   토픽의 demos       속성 설명 탭이 그 속성에 맞춰 다듬어 둔 판
   *   byValue            값 하나가 다른 판을 요구할 때
   *
   * 속성 설명 탭이 쓰는 것과 같은 판을 쓴다. 대조에서만 다른 판을 쓰면 두 화면이
   * 어긋나고, 무엇보다 그 판들이 이미 "이 값이 보이려면 무엇이 필요한가" 를
   * 담고 있다 — grid-auto-flow 의 column 이 행을 요구하는 것이 그런 예다.
   */
  const base = { ...(entry.demo ?? {}), ...(topic.demos?.[entry.prop] ?? {}) };
  const demo = { ...base, ...(base.byValue?.[String(value)] ?? {}) };
  const count = demo.itemCount ?? 3;

  const box = doc.createElement('div');
  box.className = DEMO_CLASS;

  if (topic.display) box.style.display = topic.display;
  Object.entries(demo.containerStyle ?? {}).forEach(([k, v]) => { box.style[k] = v; });
  if (entry.scope === 'container') box.style[entry.jsProp] = toCssValue(entry, value);

  for (let i = 0; i < count; i += 1) {
    const item = doc.createElement('div');
    item.className = DEMO_ITEM_CLASS;
    item.textContent = String(i + 1);

    // 'fill' 은 크기를 주지 않는다는 뜻이다. 크기가 박혀 있으면 칸을 채우는
    // 값(stretch 계열)이 할 일이 없어진다.
    if (demo.itemSizes !== 'fill') {
      item.style.width = `${ITEM.w}px`;
      item.style.height = `${ITEM.h}px`;
    }
    item.style.setProperty('--fgp-item-accent', `var(--fgp-item-${(i % 8) + 1})`);

    Object.entries(demo.itemStyles?.[i] ?? {}).forEach(([k, v]) => { item.style[k] = v; });

    // 아이템 속성은 첫 아이템에만 준다. 전부 같으면 무엇이 달라졌는지 안 보인다.
    if (entry.scope === 'item' && i === 0) {
      item.style[entry.jsProp] = toCssValue(entry, value);
      item.setAttribute('data-target', 'true');
    }

    box.appendChild(item);
  }

  return box;
}

/* --------------------------------------------------------------------------
   한 쪽 패널
   -------------------------------------------------------------------------- */

function buildSide(entry, value, topic, doc) {
  const side = doc.createElement('div');
  side.className = SIDE_CLASS;
  side.setAttribute('data-topic', topic.key);

  const head = doc.createElement('p');
  head.className = NAME_CLASS;

  const label = doc.createElement('span');
  label.className = `${NAME_CLASS}__topic`;
  label.textContent = topic.label;
  head.appendChild(label);

  const prop = doc.createElement('code');
  prop.textContent = entry.prop;
  head.appendChild(prop);
  side.appendChild(head);

  const applied = doc.createElement('code');
  applied.className = VALUE_CLASS;
  applied.textContent = `${entry.prop}: ${toCssValue(entry, value)}`;
  side.appendChild(applied);

  side.appendChild(buildDemo(entry, value, topic, doc));

  const desc = doc.createElement('p');
  desc.className = TEXT_CLASS;
  appendRich(desc, entry.desc, doc);
  side.appendChild(desc);

  if (entry.tip) {
    const tip = doc.createElement('p');
    tip.className = `${TEXT_CLASS} ${TEXT_CLASS}--tip`;
    appendRich(tip, entry.tip, doc);
    side.appendChild(tip);
  }

  return side;
}

/* --------------------------------------------------------------------------
   진입점
   -------------------------------------------------------------------------- */

/**
 * @param {Object}   config
 * @param {Object}   config.left      { key, label, schema, display?, demos? }
 * @param {Object}   config.right     같은 모양
 * @param {Element}  config.host      마운트할 패널. 속성 설명 탭의 root
 * @param {string}   config.title     접힘 줄에 적을 문구
 * @param {Document} [config.doc]
 * @returns {{root, pairs, dangling, open}}
 */
export function createCompare(config) {
  const { left, right, host, title, doc = globalThis.document } = config;

  if (!left?.schema?.length || !right?.schema?.length) throw new Error('createCompare: 두 토픽 스키마가 필요합니다');
  if (!host) throw new Error('createCompare: host 요소가 필요합니다');
  if (!doc) throw new Error('createCompare: document를 찾을 수 없습니다');

  const pairs = pairsFrom(left.schema, right.schema);
  const dangling = danglingFrom(left.schema, right.schema);

  const root = doc.createElement('details');
  root.className = ROOT_CLASS;

  const summary = doc.createElement('summary');
  summary.className = SUMMARY_CLASS;
  // 건수는 데이터에서 나온다. 문구에 숫자를 적어 두지 않는다.
  summary.textContent = `${title} — ${pairs.length}쌍`;
  root.appendChild(summary);

  const body = doc.createElement('div');
  body.className = BODY_CLASS;
  root.appendChild(body);

  pairs.forEach(({ left: a, right: b }) => {
    const pair = doc.createElement('section');
    pair.className = PAIR_CLASS;
    pair.setAttribute('data-pair', `${a.prop}|${b.prop}`);

    const value = sharedValue(a, b);
    pair.setAttribute('data-shared', value.shared ? 'true' : 'false');

    pair.appendChild(buildSide(a, value.left, left, doc));
    pair.appendChild(buildSide(b, value.right, right, doc));
    body.appendChild(pair);
  });

  if (dangling.length > 0) {
    const note = doc.createElement('p');
    note.className = NOTE_CLASS;
    const side = (d) => (d.topic === 'left' ? left : right).label;
    note.textContent = `${DANGLING}: `
      + dangling.map((d) => `${side(d)} ${d.prop} → ${d.wanted}`).join(' · ');
    body.appendChild(note);
  }

  // 속성 설명 목록보다 위에 둔다. 펼치기 전에는 한 줄이라 방해가 되지 않는다.
  host.classList.add(HOST_CLASS);
  host.insertBefore(root, host.firstChild);

  return {
    root,
    pairs,
    dangling,
    open: (on) => { root.open = Boolean(on); return root.open; },
  };
}

export default createCompare;
