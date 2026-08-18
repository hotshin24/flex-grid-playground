  // ── 상태 ──
  let container = {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    alignContent: 'normal',
    gap: '8px',
  };

  let items = [
    { id:1, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:60 },
    { id:2, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:60 },
    { id:3, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:60 },
    { id:4, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:60 },
  ];

  let nextId = 5;
  let selectedId = 1; // 초기에 아이템 1 자동 선택

  // ── 렌더 (DOM Diffing — 부드러운 트랜지션을 위해 요소 재사용) ──
  function render() {
    const fc = document.getElementById('flex-container');

    // 컨테이너 스타일 (in-place 업데이트 → 트랜지션 적용)
    Object.assign(fc.style, {
      flexDirection:  container.flexDirection,
      flexWrap:       container.flexWrap,
      justifyContent: container.justifyContent,
      alignItems:     container.alignItems,
      alignContent:   container.alignContent,
      gap:            container.gap,
    });

    // 아이템 수가 바뀌었을 때 DOM 요소 추가/제거
    while (fc.children.length < items.length) {
      const el = document.createElement('div');
      el.style.transition = 'all 0.35s cubic-bezier(0.4,0,0.2,1)';
      el.addEventListener('click', function() { selectItem(Number(this.dataset.itemId)); });
      fc.appendChild(el);
    }
    while (fc.children.length > items.length) {
      fc.removeChild(fc.lastChild);
    }

    // 각 아이템 스타일 in-place 업데이트 (transition 살아있음)
    items.forEach((item, i) => {
      const [bg] = COLORS[i % COLORS.length];
      const el = fc.children[i];
      const isSelected = item.id === selectedId;

      el.dataset.itemId = item.id;
      el.className = 'flex-item' + (isSelected ? ' selected-item' : '');
      el.textContent = i + 1;

      // flex 속성은 cssText 대신 개별 설정 (transition 유지)
      el.style.background    = bg + '33';
      el.style.borderColor   = isSelected ? '#fff' : bg;
      el.style.color         = bg;
      el.style.flexGrow      = item.flexGrow;
      el.style.flexShrink    = item.flexShrink;
      el.style.flexBasis     = item.flexBasis;
      el.style.alignSelf     = item.alignSelf;
      el.style.order         = item.order;
      el.style.width         = item.width + 'px';
      el.style.height        = item.height + 'px';
      el.style.borderWidth   = '2px';
      el.style.borderStyle   = 'solid';
      el.style.borderRadius  = '8px';
      el.style.display       = 'flex';
      el.style.alignItems    = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize      = '14px';
      el.style.fontWeight    = '700';
      el.style.cursor        = 'pointer';
      el.style.minWidth      = '40px';
      el.style.minHeight     = '40px';
      el.style.fontFamily    = 'monospace';
      el.style.boxShadow     = isSelected ? `0 0 0 2px ${bg}, 0 4px 20px ${bg}44` : '';
    });

    renderItemList();
    renderCode();
    updateItemPropPanel();
    updateSizeBadge();
    document.getElementById('item-count').textContent = `(${items.length}개)`;
  }

  function updateSizeBadge() {
    const fc = document.getElementById('flex-container');
    const r = fc.getBoundingClientRect();
    document.getElementById('size-badge').textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
  }

  function renderItemList() {
    const list = document.getElementById('item-list');
    list.innerHTML = '';
    items.forEach((item, i) => {
      const [bg] = COLORS[i % COLORS.length];
      const card = document.createElement('div');
      card.className = 'item-card' + (item.id === selectedId ? ' selected' : '');
      card.onclick = () => selectItem(item.id);
      card.innerHTML = `
        <div class="item-card-header">
          <span class="item-dot" style="background:${bg}"></span>
          <span class="item-card-title" style="color:${bg}">아이템 ${i+1}</span>
          <span style="font-size:10px;color:#475569">${item.width}×${item.height}</span>
        </div>
        <div style="font-size:10px;color:#475569;font-family:monospace;line-height:1.6">
          grow: ${item.flexGrow} · shrink: ${item.flexShrink} · basis: ${item.flexBasis}<br>
          order: ${item.order} · align-self: ${item.alignSelf}
        </div>
      `;
      list.appendChild(card);
    });
  }

  function renderCode() {
    document.getElementById('code-output-css').innerHTML  = cssCode();
    document.getElementById('code-output-html').innerHTML = htmlCode();
  }

  function cssCode() {
    const c = container;
    const gapVal = c.gap;

    let lines = [];
    lines.push(`<span class="c-selector">.container</span> <span class="c-punc">{</span>`);
    lines.push(`  <span class="c-prop">display</span><span class="c-punc">:</span> <span class="c-val">flex</span><span class="c-punc">;</span>`);
    if (c.flexDirection !== 'row')    lines.push(`  <span class="c-prop">flex-direction</span><span class="c-punc">:</span> <span class="c-val">${c.flexDirection}</span><span class="c-punc">;</span>`);
    if (c.flexWrap !== 'nowrap')      lines.push(`  <span class="c-prop">flex-wrap</span><span class="c-punc">:</span> <span class="c-val">${c.flexWrap}</span><span class="c-punc">;</span>`);
    if (c.justifyContent !== 'flex-start') lines.push(`  <span class="c-prop">justify-content</span><span class="c-punc">:</span> <span class="c-val">${c.justifyContent}</span><span class="c-punc">;</span>`);
    if (c.alignItems !== 'stretch')   lines.push(`  <span class="c-prop">align-items</span><span class="c-punc">:</span> <span class="c-val">${c.alignItems}</span><span class="c-punc">;</span>`);
    if (c.alignContent !== 'normal')  lines.push(`  <span class="c-prop">align-content</span><span class="c-punc">:</span> <span class="c-val">${c.alignContent}</span><span class="c-punc">;</span>`);
    if (gapVal !== '0px')             lines.push(`  <span class="c-prop">gap</span><span class="c-punc">:</span> <span class="c-val">${gapVal}</span><span class="c-punc">;</span>`);
    lines.push(`<span class="c-punc">}</span>`);

    items.forEach((item, i) => {
      const hasCustom = item.flexGrow !== 0 || item.flexShrink !== 1
        || item.flexBasis !== 'auto' || item.alignSelf !== 'auto'
        || item.order !== 0 || item.width !== 80 || item.height !== 60;
      if (!hasCustom) return;

      lines.push(``);
      lines.push(`<span class="c-selector">.item-${i+1}</span> <span class="c-punc">{</span> <span class="c-comment">/* 아이템 ${i+1} */</span>`);
      if (item.width !== 80)         lines.push(`  <span class="c-prop">width</span><span class="c-punc">:</span> <span class="c-val">${item.width}px</span><span class="c-punc">;</span>`);
      if (item.height !== 60)        lines.push(`  <span class="c-prop">height</span><span class="c-punc">:</span> <span class="c-val">${item.height}px</span><span class="c-punc">;</span>`);
      if (item.flexGrow !== 0)       lines.push(`  <span class="c-prop">flex-grow</span><span class="c-punc">:</span> <span class="c-val">${item.flexGrow}</span><span class="c-punc">;</span>`);
      if (item.flexShrink !== 1)     lines.push(`  <span class="c-prop">flex-shrink</span><span class="c-punc">:</span> <span class="c-val">${item.flexShrink}</span><span class="c-punc">;</span>`);
      if (item.flexBasis !== 'auto') lines.push(`  <span class="c-prop">flex-basis</span><span class="c-punc">:</span> <span class="c-val">${item.flexBasis}</span><span class="c-punc">;</span>`);
      if (item.alignSelf !== 'auto') lines.push(`  <span class="c-prop">align-self</span><span class="c-punc">:</span> <span class="c-val">${item.alignSelf}</span><span class="c-punc">;</span>`);
      if (item.order !== 0)          lines.push(`  <span class="c-prop">order</span><span class="c-punc">:</span> <span class="c-val">${item.order}</span><span class="c-punc">;</span>`);
      lines.push(`<span class="c-punc">}</span>`);
    });

    return lines.map(l => `<div class="code-line">${l}</div>`).join('');
  }

  function htmlCode() {
    const itemsHtml = items.map((_, i) =>
      `  &lt;<span class="c-selector">div</span> class=<span class="c-val">"item item-${i+1}"</span>&gt;${i+1}&lt;/<span class="c-selector">div</span>&gt;`
    ).join('\n');
    return `<div class="code-line">&lt;<span class="c-selector">div</span> class=<span class="c-val">"container"</span>&gt;</div>` +
      items.map((_, i) =>
        `<div class="code-line">  &lt;<span class="c-selector">div</span> class=<span class="c-val">"item item-${i+1}"</span>&gt;${i+1}&lt;/<span class="c-selector">div</span>&gt;</div>`
      ).join('') +
      `<div class="code-line">&lt;/<span class="c-selector">div</span>&gt;</div>`;
  }

  // ── 컨테이너 속성 설정 ──
  const propMap = {
    flexDirection: { lbl:'lbl-direction', grp:'grp-direction', css:'flex-direction' },
    flexWrap:      { lbl:'lbl-wrap',      grp:'grp-wrap',      css:'flex-wrap' },
    justifyContent:{ lbl:'lbl-justify',   grp:'grp-justify',   css:'justify-content' },
    alignItems:    { lbl:'lbl-alignItems',grp:'grp-alignItems',css:'align-items' },
    alignContent:  { lbl:'lbl-alignContent',grp:'grp-alignContent',css:'align-content' },
  };

  function setContainer(prop, val) {
    container[prop] = val;
    const info = propMap[prop];
    if (info) {
      document.getElementById(info.lbl).textContent = val;
      // 조작 탭 버튼 동기화
      document.querySelectorAll(`#${info.grp} button`).forEach(b => {
        b.classList.toggle('active', b.textContent === val);
      });
      // 챌린지 컨트롤 바 버튼 동기화
      const chGrp = document.getElementById('ch-' + info.grp);
      if (chGrp) {
        chGrp.querySelectorAll('button').forEach(b => {
          b.classList.toggle('active', b.textContent === val);
        });
      }
    }
    pushHistory();
    render();
  }

  function setGap(v) {
    container.gap = v + 'px';
    document.getElementById('lbl-gap').textContent = v + 'px';
    const chLbl = document.getElementById('ch-lbl-gap');
    if (chLbl) chLbl.textContent = v + 'px';
    const chRange = document.getElementById('ch-range-gap');
    if (chRange) chRange.value = v;
    pushHistory();
    render();
  }

  // ── 아이템 선택 ──
  function selectItem(id) {
    selectedId = id; // 항상 선택 유지 (토글 없음)
    render();
    syncItemPanelValues();
  }

  function syncItemPanelValues() {
    const item = items.find(i => i.id === selectedId);
    if (!item) return;

    const idx = items.indexOf(item);
    const lbl = document.getElementById('lbl-selected-item');
    if (lbl) lbl.textContent = `아이템 ${idx + 1}`;

    document.getElementById('lbl-grow').textContent    = item.flexGrow;
    document.getElementById('lbl-shrink').textContent  = item.flexShrink;
    document.getElementById('lbl-basis').textContent   = item.flexBasis;
    document.getElementById('lbl-alignSelf').textContent = item.alignSelf;
    document.getElementById('lbl-order').textContent   = item.order;
    document.getElementById('lbl-width').textContent   = item.width;
    document.getElementById('lbl-height').textContent  = item.height;

    document.getElementById('range-grow').value   = item.flexGrow;
    document.getElementById('range-shrink').value = item.flexShrink;
    document.getElementById('range-basis').value  = item.flexBasis === 'auto' ? 0 : parseInt(item.flexBasis);
    document.getElementById('lbl-basis-unit').textContent = item.flexBasis;
    document.getElementById('range-order').value  = item.order;
    document.getElementById('range-width').value  = item.width;
    document.getElementById('range-height').value = item.height;

    document.querySelectorAll('#grp-alignSelf button').forEach(b => {
      b.classList.toggle('active', b.textContent === item.alignSelf);
    });
  }

  function updateItemPropPanel() {
    syncItemPanelValues();
  }

  function setItem(prop, val) {
    if (!selectedId) return;
    const item = items.find(i => i.id === selectedId);
    if (!item) return;
    item[prop] = isNaN(val) ? val : Number(val);
    const lblMap = { flexGrow:'lbl-grow', flexShrink:'lbl-shrink', alignSelf:'lbl-alignSelf', order:'lbl-order' };
    if (lblMap[prop]) document.getElementById(lblMap[prop]).textContent = item[prop];

    if (prop === 'alignSelf') {
      document.querySelectorAll('#grp-alignSelf button').forEach(b => {
        b.classList.toggle('active', b.textContent === val);
      });
    }
    pushHistory();
    render();
  }

  function setItemBasis(v) {
    if (!selectedId) return;
    const item = items.find(i => i.id === selectedId);
    if (!item) return;
    item.flexBasis = v == 0 ? 'auto' : v + 'px';
    document.getElementById('lbl-basis').textContent = item.flexBasis;
    document.getElementById('lbl-basis-unit').textContent = item.flexBasis;
    pushHistory();
    render();
  }

  function setItemSize(prop, val) {
    if (!selectedId) return;
    const item = items.find(i => i.id === selectedId);
    if (!item) return;
    item[prop] = Number(val);
    document.getElementById('lbl-' + prop).textContent = val;
    pushHistory();
    render();
  }

  // ── 아이템 추가/제거 ──
  function addItem() {
    if (items.length >= 20) return;
    items.push({ id: nextId++, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:60 });
    pushHistory();
    render();
  }

  function removeItem() {
    if (items.length <= 1) return;
    const removedId = items[items.length - 1].id;
    items.pop();
    if (selectedId === removedId) selectedId = items[items.length - 1].id;
    pushHistory();
    render();
    syncItemPanelValues();
  }

  // ── 프리셋 ──
  function applyPreset(name) {
    const presets = {
      center: {
        container: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'center', alignItems:'center', alignContent:'normal', gap:'8px' },
        items: [
          { id:1, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:120, height:80 },
        ]
      },
      nav: {
        container: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'space-between', alignItems:'center', alignContent:'normal', gap:'8px' },
        items: [
          { id:1, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:100, height:50 },
          { id:2, flexGrow:1, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:50 },
          { id:3, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:50 },
        ]
      },
      card: {
        container: { flexDirection:'row', flexWrap:'wrap', justifyContent:'flex-start', alignItems:'flex-start', alignContent:'flex-start', gap:'12px' },
        items: [
          { id:1, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:110, height:90 },
          { id:2, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:110, height:90 },
          { id:3, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:110, height:90 },
          { id:4, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:110, height:90 },
          { id:5, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:110, height:90 },
        ]
      },
      sidebar: {
        container: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'flex-start', alignItems:'stretch', alignContent:'normal', gap:'0px' },
        items: [
          { id:1, flexGrow:0, flexShrink:0, flexBasis:'160px', alignSelf:'auto', order:0, width:160, height:60 },
          { id:2, flexGrow:1, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:60 },
        ]
      },
      space: {
        container: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'space-between', alignItems:'center', alignContent:'normal', gap:'0px' },
        items: [
          { id:1, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:60 },
          { id:2, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:60 },
          { id:3, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:60 },
        ]
      },
    };

    const preset = presets[name];
    container = { ...preset.container };
    nextId = preset.items.length + 1;
    items = preset.items.map(it => ({ ...it }));
    selectedId = items[0].id; // 첫 번째 아이템 자동 선택

    // 프리셋 버튼 활성 표시
    document.querySelectorAll('.preset-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('onclick').includes(`'${name}'`));
    });

    // UI 동기화
    Object.keys(propMap).forEach(prop => {
      const info = propMap[prop];
      document.getElementById(info.lbl).textContent = container[prop];
      document.querySelectorAll(`#${info.grp} button`).forEach(b => {
        b.classList.toggle('active', b.textContent === container[prop]);
      });
    });
    document.getElementById('lbl-gap').textContent = container.gap;
    document.getElementById('range-gap').value = parseInt(container.gap);
    syncChallengeControls();

    pushHistory();
    render();
    syncItemPanelValues();
  }

  // ── 코드 탭 ──
  // ── 복사 ──
  function copyPlaygroundCode(mode) {
    let text = '';
    if (mode === 'css') {
      const c = container;
      let lines = ['.container {', '  display: flex;'];
      if (c.flexDirection !== 'row')         lines.push(`  flex-direction: ${c.flexDirection};`);
      if (c.flexWrap !== 'nowrap')           lines.push(`  flex-wrap: ${c.flexWrap};`);
      if (c.justifyContent !== 'flex-start') lines.push(`  justify-content: ${c.justifyContent};`);
      if (c.alignItems !== 'stretch')        lines.push(`  align-items: ${c.alignItems};`);
      if (c.alignContent !== 'normal')       lines.push(`  align-content: ${c.alignContent};`);
      if (c.gap !== '0px')                   lines.push(`  gap: ${c.gap};`);
      lines.push('}');
      text = lines.join('\n');
    } else {
      text = '<div class="container">\n'
        + items.map((_, i) => `  <div class="item item-${i+1}">${i+1}</div>`).join('\n')
        + '\n</div>';
    }
    const btnId = mode === 'css' ? 'copy-btn-css' : 'copy-btn-html';
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById(btnId);
      btn.textContent = '복사됨!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = '복사'; btn.classList.remove('copied'); }, 1500);
    });
  }

  // 컨테이너 크기 변화 감지
  const ro = new ResizeObserver(updateSizeBadge);
  ro.observe(document.getElementById('flex-container'));

  // ── 속성 설명 뷰 ──
  let currentExplainKey = null;
  let explainAxisDir = 'row'; // justify-content 데모의 주축 방향 (row | column)

  function setExplainAxis(dir) {
    if (explainAxisDir === dir) return;
    explainAxisDir = dir;
    if (currentExplainKey) selectExplainProp(currentExplainKey);
  }

  function selectExplainProp(key) {
    currentExplainKey = key;

    // 왼쪽 nav 버튼 활성
    document.querySelectorAll('.ev-nav-btn').forEach(b => b.classList.remove('active'));
    const navBtn = document.getElementById('evnav-' + key);
    if (navBtn) navBtn.classList.add('active');

    // 오른쪽 설명 뷰 표시
    document.getElementById('playground-view').style.display = 'none';
    document.getElementById('example-view').style.display = 'none';
    document.getElementById('explain-view').style.display = 'flex';

    const data = EXPLAIN_DATA[key];
    if (!data) return;

    // 툴바 업데이트
    document.getElementById('expv-prop-name').textContent = data.prop;
    const catEl = document.getElementById('expv-category');
    catEl.textContent = data.type === 'container' ? '부모 요소' : '자식 요소';
    catEl.style.background = data.type === 'container' ? '#6c63ff22' : '#48b0f122';
    catEl.style.color       = data.type === 'container' ? '#a78bfa'   : '#7dd3fc';
    catEl.style.borderColor = data.type === 'container' ? '#6c63ff44' : '#48b0f144';

    // 본문 렌더
    const body = document.getElementById('expv-body');
    body.innerHTML = buildExplainBody(key, data);
    body.scrollTop = 0;
  }

  // 주축 방향에 따라 기준 축이 바뀌는 속성들 (row/column 데모를 모두 제공)
  const AXIS_TOGGLE_KEYS = ['wrap', 'justify', 'alignItems', 'alignContent'];

  const AXIS_HINTS = {
    wrap: {
      row:    '가로가 주축 — 너비를 넘치면 <strong>아래로</strong> 새 줄이 생깁니다',
      column: '세로가 주축 — 높이를 넘치면 <strong>옆으로</strong> 새 줄(칼럼)이 생깁니다',
    },
    justify: {
      row:    '가로가 주축 — justify-content가 <strong>좌/우</strong> 배치를 담당합니다',
      column: '세로가 주축 — justify-content가 <strong>위/아래</strong> 배치를 담당합니다',
    },
    alignItems: {
      row:    '가로가 주축 → 교차축은 세로 — align-items가 <strong>위/아래</strong> 정렬을 담당합니다',
      column: '세로가 주축 → 교차축은 가로 — align-items가 <strong>좌/우</strong> 정렬을 담당합니다 (baseline은 flex-start처럼 보입니다)',
    },
    alignContent: {
      row:    '가로가 주축 → 줄이 <strong>세로로</strong> 쌓임 — align-content가 줄 묶음의 위/아래 분배를 담당합니다',
      column: '세로가 주축 → 줄이 <strong>가로로</strong> 쌓임 — align-content가 줄 묶음의 좌/우 분배를 담당합니다',
    },
  };

  // column일 때 방향 표현이 달라지는 값 설명 (기본값은 row 기준으로 쓰여 있음)
  const AXIS_COL_VALDESC = {
    wrap: {
      'nowrap':       '줄 바꿈 없음, 한 칼럼에 강제 배치 (기본값)',
      'wrap':         '넘치면 오른쪽에 새 칼럼으로 바꿈',
      'wrap-reverse': '넘치면 왼쪽에 새 칼럼으로 역방향 바꿈',
    },
  };

  // column 데모에서 코드 예시에 함께 보여줄 전제 조건들
  const AXIS_COL_CODE = {
    wrap: [
      ['flex-direction', 'column', '주축이 세로'],
      ['height', '300px', '높이가 정해져야 줄이 나뉨'],
    ],
    justify: [
      ['flex-direction', 'column', '주축이 세로'],
      ['height', '300px', '세로 여백이 있어야 효과가 보임'],
    ],
    alignItems: [
      ['flex-direction', 'column', '주축이 세로 → 교차축은 가로'],
      ['width', '300px', '가로 여백이 있어야 효과가 보임'],
    ],
    alignContent: [
      ['flex-direction', 'column', '주축이 세로 → 줄이 가로로 쌓임'],
      ['flex-wrap', 'wrap', '줄이 2개 이상이어야 동작'],
      ['height', '300px', '높이가 정해져야 세로 방향에서 줄이 나뉨'],
    ],
  };

  function buildExplainBody(key, data) {
    const hasAxisToggle = AXIS_TOGGLE_KEYS.includes(key);
    const isCol = hasAxisToggle && explainAxisDir === 'column';

    let html = `
      <div class="expv-desc-block">
        <p class="expv-desc">${data.desc}</p>
        ${data.tip ? `<div class="expv-tip">💡 ${data.tip}</div>` : ''}
      </div>
    `;

    if (hasAxisToggle) {
      html += `
        <div class="expv-axis-toggle">
          <span class="expv-axis-label">주축 방향</span>
          <button class="expv-axis-btn${isCol ? '' : ' active'}" onclick="setExplainAxis('row')">
            <span class="expv-axis-icon">→</span> flex-direction: row
          </button>
          <button class="expv-axis-btn${isCol ? ' active' : ''}" onclick="setExplainAxis('column')">
            <span class="expv-axis-icon">↓</span> flex-direction: column
          </button>
          <span class="expv-axis-hint">${AXIS_HINTS[key][isCol ? 'column' : 'row']}</span>
        </div>
      `;
    }

    // column 모드에서는 방향 표현이 다른 값 설명을 갈아끼운다
    const valDesc = v => (isCol && AXIS_COL_VALDESC[key] && AXIS_COL_VALDESC[key][String(v.val)]) || v.desc;

    html += `
      <div class="expv-section-label">Values</div>
      <div class="expv-vals-grid">
    `;

    data.values.forEach(valData => {
      const displayVal = valData.label || String(valData.val);
      const demo = buildExpDemo(key, valData);
      const canApply = data.jsProp !== null;
      html += `
        <div class="expv-val-card">
          <div class="expv-val-demo">${demo}</div>
          <div class="expv-val-name">${displayVal}</div>
          <div class="expv-val-desc">${valDesc(valData)}</div>
          ${canApply ? `<button class="expv-apply-btn" onclick="applyExplainVal('${key}','${String(valData.val).replace(/'/g,'\\\'')}')" >↗ 플레이그라운드에서 확인</button>` : ''}
        </div>
      `;
    });

    html += `</div>`;

    // flex-direction은 축 자체를 정하는 속성 → row/column에서 축이 어떻게 바뀌는지 따로 설명
    if (key === 'direction') html += buildAxisGuide();

    // 코드 예시
    html += `<div class="expv-section-label" style="margin-top:8px">코드 예시</div>
      <div class="expv-code-block">
        <div class="code-line"><span class="c-selector">${data.type === 'container' ? '.container' : '.item'}</span> <span class="c-punc">{</span></div>`;
    if (isCol) {
      AXIS_COL_CODE[key].forEach(([prop, val, comment]) => {
        html += `<div class="code-line">  <span class="c-prop">${prop}</span><span class="c-punc">:</span> <span class="c-val">${val}</span><span class="c-punc">;</span>  <span class="c-comment">/* ${comment} */</span></div>`;
      });
    }
    data.values.slice(0, 4).forEach(v => {
      const displayV = v.label ? v.label.split(': ')[1] : String(v.val);
      html += `<div class="code-line">  <span class="c-prop">${data.prop}</span><span class="c-punc">:</span> <span class="c-val">${displayV}</span><span class="c-punc">;</span>  <span class="c-comment">/* ${valDesc(v)} */</span></div>`;
    });
    html += `<div class="code-line"><span class="c-punc">}</span></div></div>`;

    return html;
  }

  // row/column에서 주축·교차축이 어떻게 뒤바뀌는지 보여주는 다이어그램 + 대조표
  function buildAxisGuide() {
    const MAIN = '#6c63ff', CROSS = '#48b0f1', BOX = '#f16c48';

    const arrowDefs = (id, color) =>
      `<marker id="${id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
         <path d="M0,0 L8,4 L0,8 z" fill="${color}"/>
       </marker>`;

    const box = (x, y, w, h, n) =>
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${BOX}22" stroke="${BOX}" stroke-width="1.5"/>
       <text x="${x + w / 2}" y="${y + h / 2 + 3.5}" text-anchor="middle" font-size="9" font-weight="800" fill="${BOX}" font-family="monospace">${n}</text>`;

    const rowSvg = `
      <svg viewBox="0 0 230 116" width="100%" role="img" aria-label="row 방향의 주축과 교차축">
        <defs>${arrowDefs('ah-main-row', MAIN)}${arrowDefs('ah-cross-row', CROSS)}</defs>
        ${box(40, 20, 46, 30, 1)}${box(94, 20, 46, 30, 2)}${box(148, 20, 46, 30, 3)}
        <line x1="40" y1="68" x2="196" y2="68" stroke="${MAIN}" stroke-width="2" marker-end="url(#ah-main-row)"/>
        <text x="118" y="84" text-anchor="middle" font-size="10" font-weight="700" fill="${MAIN}">주축 (main axis) →</text>
        <line x1="22" y1="14" x2="22" y2="56" stroke="${CROSS}" stroke-width="2" marker-end="url(#ah-cross-row)"/>
        <text x="16" y="35" text-anchor="middle" font-size="10" font-weight="700" fill="${CROSS}" transform="rotate(-90 16 35)">교차축 ↓</text>
        <text x="118" y="104" text-anchor="middle" font-size="9.5" fill="#64748b">아이템이 가로로 나열</text>
      </svg>`;

    const colSvg = `
      <svg viewBox="0 0 230 116" width="100%" role="img" aria-label="column 방향의 주축과 교차축">
        <defs>${arrowDefs('ah-main-col', MAIN)}${arrowDefs('ah-cross-col', CROSS)}</defs>
        ${box(84, 10, 62, 22, 1)}${box(84, 36, 62, 22, 2)}${box(84, 62, 62, 22, 3)}
        <line x1="66" y1="10" x2="66" y2="84" stroke="${MAIN}" stroke-width="2" marker-end="url(#ah-main-col)"/>
        <text x="56" y="47" text-anchor="middle" font-size="10" font-weight="700" fill="${MAIN}" transform="rotate(-90 56 47)">주축 ↓</text>
        <line x1="84" y1="94" x2="148" y2="94" stroke="${CROSS}" stroke-width="2" marker-end="url(#ah-cross-col)"/>
        <text x="156" y="97.5" text-anchor="start" font-size="10" font-weight="700" fill="${CROSS}">교차축 →</text>
        <text x="115" y="112" text-anchor="middle" font-size="9.5" fill="#64748b">아이템이 세로로 나열</text>
      </svg>`;

    const rows = [
      ['주축 (main axis)',  '가로 (좌 → 우)',        '<strong>세로 (위 → 아래)</strong>'],
      ['교차축 (cross axis)', '세로',                 '<strong>가로</strong>'],
      ['justify-content',   '좌 / 우 배치',          '<strong>위 / 아래</strong> 배치'],
      ['align-items',       '위 / 아래 정렬',        '<strong>좌 / 우</strong> 정렬'],
      ['flex-wrap 새 줄',   '아래로 쌓임',           '<strong>옆으로</strong> 쌓임'],
      ['효과를 보려면',     'width에 여유 필요',     '<strong>height 지정</strong>이 거의 필수'],
    ];

    return `
      <div class="expv-section-label" style="margin-top:8px">row vs column — 축이 통째로 바뀝니다</div>
      <div class="expv-axis-guide">
        <div class="expv-axis-diagram">
          <div class="expv-axis-diagram-title">flex-direction: row <span>기본값</span></div>
          ${rowSvg}
        </div>
        <div class="expv-axis-diagram">
          <div class="expv-axis-diagram-title">flex-direction: column</div>
          ${colSvg}
        </div>
      </div>
      <table class="expv-axis-table">
        <thead><tr><th></th><th>row</th><th>column</th></tr></thead>
        <tbody>
          ${rows.map(([label, r, c]) => `<tr><th>${label}</th><td>${r}</td><td>${c}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="expv-tip" style="margin-top:2px">
        💡 <code>column</code>으로 바꿨는데 <code>justify-content</code>가 안 먹는다면, 대부분 컨테이너에
        <code>height</code>가 없어서입니다. 세로로 남는 공간이 있어야 배치할 여백이 생깁니다.
      </div>
    `;
  }

  function buildExpDemo(key, valData) {
    const val = valData.val;
    const C = ['#6c63ff', '#48b0f1', '#f16c48'];
    const dot = (n, w, h, extra = '') =>
      `<div style="min-width:${w};max-width:${w};height:${h};background:${C[n % 3]}22;border:1.5px solid ${C[n % 3]};border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:${C[n % 3]};font-family:monospace;flex-shrink:0;box-sizing:border-box;${extra}">${n + 1}</div>`;
    const wrap = (style, children, extra = '') =>
      `<div style="display:flex;${style};padding:7px;background:#0f1117;border-radius:6px;border:1px solid #2d3152;box-sizing:border-box;width:100%;${extra}">${children}</div>`;

    switch (key) {
      case 'direction': {
        const isCol = String(val).startsWith('column');
        return wrap(
          `flex-direction:${val};gap:4px;align-items:center;justify-content:center;min-height:72px;flex-wrap:wrap`,
          [0, 1, 2].map(i => dot(i, isCol ? '38px' : '26px', isCol ? '22px' : '30px')).join('')
        );
      }
      case 'wrap':
        if (explainAxisDir === 'column') {
          // 주축이 세로 — 높이가 꽉 차면 옆으로 새 줄(칼럼)이 생김.
          // nowrap은 한 줄에 밀어넣느라 아이템이 세로로 찌그러진다.
          const squeeze = val === 'nowrap' ? 'flex-shrink:1;min-height:0;' : '';
          return wrap(
            `flex-direction:column;flex-wrap:${val};gap:3px;height:96px;`,
            [0, 1, 2, 3, 4].map(i => dot(i, '34px', '22px', squeeze)).join('')
          );
        }
        return wrap(
          `flex-wrap:${val};gap:3px;`,
          [0, 1, 2, 3, 4].map(i => dot(i, '34px', '22px')).join(''),
          'max-width:120px;'
        );
      case 'justify':
        if (explainAxisDir === 'column') {
          // 주축이 세로 — justify-content가 위/아래 배치를 담당
          return wrap(
            `flex-direction:column;justify-content:${val};gap:4px;align-items:center;height:116px;`,
            [0, 1, 2].map(i => dot(i, '46px', '20px')).join('')
          );
        }
        return wrap(
          `justify-content:${val};gap:4px;align-items:center;`,
          [0, 1, 2].map(i => dot(i, '24px', '28px')).join('')
        );
      case 'alignItems': {
        if (explainAxisDir === 'column') {
          // 주축이 세로 — 교차축(가로)에서 폭이 다른 아이템을 정렬
          const ws = ['66px', '34px', '50px'];
          const isStretch = val === 'stretch';
          return wrap(
            `flex-direction:column;justify-content:center;gap:4px;align-items:${val};height:92px;`,
            [0, 1, 2].map(i => dot(i, isStretch ? '' : ws[i], '20px', isStretch ? 'align-self:stretch;' : '')).join('')
          );
        }
        const hs = ['42px', '26px', '34px'];
        return wrap(
          `justify-content:center;gap:4px;align-items:${val};height:64px;`,
          [0, 1, 2].map(i => dot(i, '26px', val === 'stretch' ? '' : hs[i], val === 'stretch' ? 'height:auto;align-self:stretch;' : '')).join('')
        );
      }
      case 'alignContent': {
        // stretch/normal은 줄이 교차축을 채우는 게 핵심 — 교차축 크기를 고정하지 않아야 보임
        const fills = val === 'stretch' || val === 'normal';
        if (explainAxisDir === 'column') {
          // 주축이 세로 — 줄(칼럼)이 가로로 쌓이고, align-content가 그 줄들을 좌/우로 분배
          return wrap(
            `flex-direction:column;flex-wrap:wrap;align-content:${val};gap:3px;height:82px;`,
            [0, 1, 2, 3, 4, 5].map(i => dot(i, fills ? '' : '34px', '20px')).join('')
          );
        }
        return wrap(
          `flex-wrap:wrap;align-content:${val};gap:3px;height:80px;`,
          [0, 1, 2, 3, 4, 5].map(i => dot(i, '34px', fills ? '' : '20px')).join('')
        );
      }
      case 'gap':
        return wrap(
          `justify-content:center;gap:${val};align-items:center;`,
          [0, 1, 2].map(i => dot(i, '26px', '26px')).join('')
        );
      case 'grow': {
        const gv = Number(val);
        return wrap(
          `gap:4px;align-items:center;`,
          [0, 1, 2].map(i => {
            const g = i === 0 ? gv : 1;
            const hl = i === 0 ? `border-color:${C[0]};box-shadow:0 0 0 1px ${C[0]}44;` : '';
            return dot(i, 'auto', '30px', `flex-grow:${g};min-width:8px;${hl}`);
          }).join('')
        );
      }
      case 'shrink': {
        const sv = Number(val);
        return wrap(
          `gap:3px;align-items:center;`,
          [0, 1, 2].map(i => {
            const s = i === 0 ? sv : 1;
            const hl = i === 0 ? `border-color:${C[0]};box-shadow:0 0 0 1px ${C[0]}44;` : '';
            return dot(i, '58px', '30px', `flex-shrink:${s};${hl}`);
          }).join(''),
          'max-width:150px;overflow:hidden;'
        );
      }
      case 'basis':
        return wrap(
          `gap:4px;align-items:center;`,
          [0, 1, 2].map(i => {
            if (i === 0) return dot(i, 'auto', '30px', `flex-basis:${val};flex-shrink:0;border-color:${C[0]};box-shadow:0 0 0 1px ${C[0]}44;`);
            return dot(i, '48px', '30px');
          }).join('')
        );
      case 'flexShorthand': {
        const fv = val;
        return wrap(
          `gap:4px;align-items:center;`,
          [0, 1, 2].map(i => {
            const fp = i === 0 ? `flex:${fv};` : 'flex:1;';
            const hl = i === 0 ? `border-color:${C[0]};box-shadow:0 0 0 1px ${C[0]}44;` : '';
            return dot(i, 'auto', '30px', `${fp}min-width:8px;${hl}`);
          }).join('')
        );
      }
      case 'alignSelf':
        return wrap(
          `justify-content:center;gap:4px;align-items:flex-start;height:70px;`,
          [0, 1, 2].map(i => {
            if (i === 1) return dot(i, '26px', '30px', `align-self:${val};border-color:${C[1]};box-shadow:0 0 0 1px ${C[1]}44;`);
            return dot(i, '26px', '30px');
          }).join('')
        );
      case 'order': {
        const ov = Number(val);
        return wrap(
          `gap:4px;align-items:center;justify-content:center;`,
          [0, 1, 2].map(i => {
            const ord = i === 1 ? ov : 0;
            const hl = i === 1 ? `border-color:${C[1]};box-shadow:0 0 0 1px ${C[1]}44;` : '';
            return dot(i, '26px', '30px', `order:${ord};${hl}`);
          }).join('')
        );
      }
      default:
        return '';
    }
  }

  function applyExplainVal(key, val) {
    const data = EXPLAIN_DATA[key];
    if (!data || !data.jsProp) return;

    if (data.type === 'container') {
      // 데모에서 고른 주축 방향까지 함께 적용해야 같은 결과가 보임
      if (AXIS_TOGGLE_KEYS.includes(key) && container.flexDirection !== explainAxisDir) {
        setContainer('flexDirection', explainAxisDir);
      }
      // align-content는 줄이 2개 이상일 때만 효과가 있으므로 wrap도 함께 켜준다
      if (key === 'alignContent' && container.flexWrap === 'nowrap') {
        setContainer('flexWrap', 'wrap');
      }
      if (key === 'gap') {
        const gapNum = parseInt(val) || 0;
        setGap(gapNum);
        document.getElementById('range-gap').value = gapNum;
      } else {
        setContainer(data.jsProp, String(val));
      }
    } else if (data.type === 'item') {
      if (key === 'basis') {
        if (!selectedId) return;
        const item = items.find(i => i.id === selectedId);
        if (!item) return;
        item.flexBasis = String(val);
        document.getElementById('lbl-basis').textContent = String(val);
        document.getElementById('lbl-basis-unit').textContent = String(val);
        document.getElementById('range-basis').value = val === 'auto' ? 0 : (parseInt(val) || 0);
        pushHistory();
        render();
      } else {
        setItem(data.jsProp, val);
      }
    }
    // 조작 탭으로 전환해서 플레이그라운드에서 효과 확인
    switchPanelTab('control');
  }

  // ── 실전 예제 그리드 뷰 (우측 패널) ──
  let exgvBuilt = false;
  let exgvFilter = 'all';

  function buildExamplesGridView() {
    if (exgvBuilt) return;
    exgvBuilt = true;

    const body = document.getElementById('exgv-body');
    const filterRow = document.getElementById('exgv-filter-row');

    // 카테고리 필터 버튼 (툴바에)
    const categories = ['전체', ...new Set(EXAMPLES.map(e => e.category))];
    filterRow.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'exgv-filter-btn' + (cat === '전체' ? ' active' : '');
      btn.textContent = cat;
      btn.onclick = () => filterExGrid(cat === '전체' ? 'all' : cat);
      filterRow.appendChild(btn);
    });

    // 예제 카드 그리드
    const grid = document.createElement('div');
    grid.className = 'exgv-grid';
    grid.id = 'exgv-grid';

    EXAMPLES.forEach(ex => {
      const card = document.createElement('div');
      card.className = 'exgv-card';
      card.dataset.category = ex.category;
      card.onclick = () => showExampleView(ex.id);

      card.innerHTML = `
        <div class="exgv-preview">
          <iframe id="exgv-iframe-${ex.id}" class="exgv-iframe"
            style="width:100%;height:${ex.previewHeight || 80}px;border:none;display:block;pointer-events:none"
            frameborder="0"></iframe>
        </div>
        <div class="exgv-info">
          <span class="exgv-cat-badge" style="background:${ex.categoryColor}22;color:${ex.categoryColor};border:1px solid ${ex.categoryColor}33">${ex.category}</span>
          <span class="exgv-title">${ex.title}</span>
          <p class="exgv-desc">${ex.desc}</p>
          <button class="exgv-open-btn" onclick="event.stopPropagation();showExampleView('${ex.id}')">⤢ 크게 보기</button>
        </div>
      `;
      grid.appendChild(card);
    });

    body.appendChild(grid);

    // IntersectionObserver로 iframe 지연 로딩
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const iframe = entry.target;
        if (iframe.srcdoc) return;
        const exId = iframe.id.replace('exgv-iframe-', '');
        const ex = EXAMPLES.find(e => e.id === exId);
        if (ex) {
          iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8">
            <style>*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif}
            html,body{width:100%;height:100%}${ex.css}</style></head><body>${ex.html}</body></html>`;
        }
        observer.unobserve(iframe);
      });
    }, { root: body, rootMargin: '120px' });

    document.querySelectorAll('.exgv-iframe').forEach(el => observer.observe(el));
  }

  function filterExGrid(cat) {
    exgvFilter = cat;
    document.querySelectorAll('.exgv-filter-btn').forEach(btn => {
      btn.classList.toggle('active', (btn.textContent === '전체' ? 'all' : btn.textContent) === cat);
    });
    document.querySelectorAll('.exgv-card').forEach(card => {
      card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
    });
  }

  // ── 실전 예제 렌더 ──
  const exCodeMode = {};  // {id: 'css'|'html'}

  let exCurrentFilter = 'all';

  function buildExamplesPanel() {
    const wrap = document.getElementById('panel-examples');
    wrap.innerHTML = '';

    // 카테고리 필터 행
    const categories = ['전체', ...new Set(EXAMPLES.map(e => e.category))];
    const filterRow = document.createElement('div');
    filterRow.className = 'ex-filter-row';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'ex-filter-btn' + (cat === '전체' ? ' active' : '');
      btn.textContent = cat;
      btn.onclick = () => filterExamples(cat === '전체' ? 'all' : cat);
      filterRow.appendChild(btn);
    });
    wrap.appendChild(filterRow);

    // 카드 목록
    const listDiv = document.createElement('div');
    listDiv.id = 'ex-card-list';
    EXAMPLES.forEach(ex => {
      exCodeMode[ex.id] = 'css';

      const card = document.createElement('div');
      card.className = 'ex-card';
      card.id = 'ex-card-' + ex.id;

      card.innerHTML = `
        <div class="ex-card-header" onclick="showExampleView('${ex.id}')">
          <span class="ex-category" style="background:${ex.categoryColor}22;color:${ex.categoryColor};border:1px solid ${ex.categoryColor}33">${ex.category}</span>
          <span class="ex-title">${ex.title}</span>
          <button class="ex-expand-btn" onclick="event.stopPropagation(); showExampleView('${ex.id}')">⤢ 크게 보기</button>
        </div>
      `;
      listDiv.appendChild(card);
    });
    wrap.appendChild(listDiv);
  }

  function filterExamples(cat) {
    exCurrentFilter = cat;
    // 필터 버튼 활성 상태
    document.querySelectorAll('.ex-filter-btn').forEach(btn => {
      const btnCat = btn.textContent === '전체' ? 'all' : btn.textContent;
      btn.classList.toggle('active', btnCat === cat);
    });
    // 카드 표시/숨김
    document.querySelectorAll('.ex-card').forEach(card => {
      const ex = EXAMPLES.find(e => 'ex-card-' + e.id === card.id);
      if (!ex) return;
      card.style.display = (cat === 'all' || ex.category === cat) ? '' : 'none';
    });
  }

  function toggleExCard(id) {
    const card = document.getElementById('ex-card-' + id);
    const isOpen = card.classList.contains('open');
    // 모두 닫기
    document.querySelectorAll('.ex-card').forEach(c => c.classList.remove('open'));
    if (!isOpen) {
      card.classList.add('open');
      renderExCode(id);
      // iframe 주입
      const ex = EXAMPLES.find(e => e.id === id);
      const iframe = document.getElementById('ex-iframe-' + id);
      const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif}${ex.css}</style></head><body>${ex.html}</body></html>`;
      iframe.srcdoc = doc;
    }
  }

  function switchExCode(id, mode) {
    exCodeMode[id] = mode;
    document.getElementById('extab-css-' + id).classList.toggle('active', mode === 'css');
    document.getElementById('extab-html-' + id).classList.toggle('active', mode === 'html');
    renderExCode(id);
  }

  function renderExCode(id) {
    const ex = EXAMPLES.find(e => e.id === id);
    const mode = exCodeMode[id] || 'css';
    const raw  = mode === 'css' ? ex.css : ex.html;
    document.getElementById('ex-code-' + id).innerHTML = syntaxHighlight(raw, mode);
  }

  function syntaxHighlight(code, mode) {
    if (mode === 'css') {
      const esc = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return esc
        .replace(/\/\*.*?\*\//gs, m => `<span class="c-comment">${m}</span>`)
        .replace(/([.#]?[\w-]+)\s*\{/g, (_, sel) => `<span class="c-selector">${sel}</span> {`)
        .replace(/([\w-]+)(\s*:\s*)([^;{}\n]+)(;)/g,
          (_, prop, colon, val, semi) =>
            `<span class="c-prop">${prop}</span><span class="c-punc">${colon}</span><span class="c-val">${val}</span><span class="c-punc">${semi}</span>`
        )
        .split('\n').map(l => `<div class="code-line">${l}</div>`).join('');
    } else {
      return syntaxHighlightHtml(code);
    }
  }

  function syntaxHighlightHtml(raw) {
    const e = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    let out = '';
    let i = 0;

    while (i < raw.length) {
      if (raw[i] !== '<') {
        // 텍스트 노드
        let j = i;
        while (j < raw.length && raw[j] !== '<') j++;
        out += e(raw.slice(i, j));
        i = j;
        continue;
      }

      // '<' 발견 — 태그 끝('>')까지 수집 (따옴표 안의 > 무시)
      let j = i + 1;
      let inQ = false, qCh = '';
      while (j < raw.length) {
        const c = raw[j];
        if (!inQ && (c === '"' || c === "'")) { inQ = true;  qCh = c; }
        else if (inQ && c === qCh)             { inQ = false; }
        else if (!inQ && c === '>')            { break; }
        j++;
      }

      const inner = raw.slice(i + 1, j); // < 와 > 사이 내용

      // 주석
      if (inner.startsWith('!--')) {
        out += `<span class="c-comment">${e('<' + inner + '>')}</span>`;
        i = j + 1;
        continue;
      }

      // 닫는 태그
      if (inner.startsWith('/')) {
        const tagName = inner.slice(1).trim();
        out += `<span class="c-punc">&lt;/</span><span class="c-selector">${e(tagName)}</span><span class="c-punc">&gt;</span>`;
        i = j + 1;
        continue;
      }

      // 여는 태그 — 태그명과 속성 분리
      const spaceIdx = inner.search(/[\s/]/);
      const tagName  = spaceIdx === -1 ? inner : inner.slice(0, spaceIdx);
      const attrRaw  = spaceIdx === -1 ? '' : inner.slice(spaceIdx);

      // 속성 문자열을 토큰 단위로 파싱
      let coloredAttrs = '';
      let k = 0;
      while (k < attrRaw.length) {
        // 공백
        if (/\s/.test(attrRaw[k])) { coloredAttrs += attrRaw[k++]; continue; }
        // self-close 슬래시
        if (attrRaw[k] === '/') { coloredAttrs += `<span class="c-punc">/</span>`; k++; continue; }

        // 속성명
        let nameStart = k;
        while (k < attrRaw.length && !/[\s=>/]/.test(attrRaw[k])) k++;
        const attrName = attrRaw.slice(nameStart, k);
        if (!attrName) { coloredAttrs += e(attrRaw[k]); k++; continue; }
        coloredAttrs += `<span class="c-prop">${e(attrName)}</span>`;

        // 공백 건너뜀
        while (k < attrRaw.length && attrRaw[k] === ' ') { coloredAttrs += ' '; k++; }

        // '=' 처리
        if (attrRaw[k] === '=') {
          coloredAttrs += `<span class="c-punc">=</span>`;
          k++;
          while (k < attrRaw.length && attrRaw[k] === ' ') { coloredAttrs += ' '; k++; }

          if (attrRaw[k] === '"' || attrRaw[k] === "'") {
            const q = attrRaw[k]; k++;
            let valStart = k;
            while (k < attrRaw.length && attrRaw[k] !== q) k++;
            const val = attrRaw.slice(valStart, k); k++;
            coloredAttrs += `<span class="c-val">"${e(val)}"</span>`;
          }
        }
      }

      out += `<span class="c-punc">&lt;</span><span class="c-selector">${e(tagName)}</span>${coloredAttrs}<span class="c-punc">&gt;</span>`;
      i = j + 1;
    }

    return out.split('\n').map(l => `<div class="code-line">${l}</div>`).join('');
  }

  function copyExCode(id) {
    const ex   = EXAMPLES.find(e => e.id === id);
    const mode = exCodeMode[id] || 'css';
    navigator.clipboard.writeText(mode === 'css' ? ex.css : ex.html).then(() => {
      const btn = document.querySelector(`#ex-card-${id} .ex-copy-btn`);
      btn.textContent = '복사됨!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = '복사'; btn.classList.remove('copied'); }, 1500);
    });
  }

  // ── 오른쪽 크게 보기 ──
  let exViewCurrentId = null;

  function showExampleView(id) {
    exViewCurrentId = id;
    const ex = EXAMPLES.find(e => e.id === id);

    // 오른쪽 뷰 전환
    document.getElementById('playground-view').style.display     = 'none';
    document.getElementById('examples-grid-view').style.display  = 'none';
    document.getElementById('explain-view').style.display        = 'none';
    document.getElementById('example-view').style.display        = 'flex';

    // 툴바 정보
    document.getElementById('ex-view-title').textContent = ex.title;
    const catEl = document.getElementById('ex-view-category');
    catEl.textContent = ex.category;
    catEl.style.cssText = `background:${ex.categoryColor}22;color:${ex.categoryColor};border:1px solid ${ex.categoryColor}33;border-radius:100px;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px`;

    // iframe 주입
    document.getElementById('ex-view-iframe').srcdoc =
      `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif}
      html,body{width:100%;height:100%}${ex.css}</style></head><body>${ex.html}</body></html>`;

    // CSS / HTML 동시 렌더
    document.getElementById('ex-view-code-css').innerHTML  = syntaxHighlight(ex.css,  'css');
    document.getElementById('ex-view-code-html').innerHTML = syntaxHighlight(ex.html, 'html');

    // 카드 viewing 표시
    document.querySelectorAll('.ex-card').forEach(c => c.classList.remove('viewing'));
    const card = document.getElementById('ex-card-' + id);
    if (card) card.classList.add('viewing');
  }

  function closeExampleView() {
    document.getElementById('example-view').style.display = 'none';
    document.querySelectorAll('.ex-card').forEach(c => c.classList.remove('viewing'));
    exViewCurrentId = null;
    // 실전 예제 탭이 활성 중이면 그리드로, 아니면 플레이그라운드로 복원
    if (document.getElementById('tab-examples').classList.contains('active')) {
      document.getElementById('examples-grid-view').style.display = 'flex';
    } else {
      document.getElementById('playground-view').style.display = 'contents';
    }
  }

  function copyExViewCode(mode) {
    if (!exViewCurrentId) return;
    const ex  = EXAMPLES.find(e => e.id === exViewCurrentId);
    const txt = mode === 'css' ? ex.css : ex.html;
    const btnId = mode === 'css' ? 'ex-view-copy-css' : 'ex-view-copy-html';
    navigator.clipboard.writeText(txt).then(() => {
      const btn = document.getElementById(btnId);
      btn.textContent = '복사됨!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = '복사'; btn.classList.remove('copied'); }, 1500);
    });
  }

  // ── 패널 탭 전환 ──
  // 챌린지 컨트롤 바를 현재 container 상태에 맞게 동기화
  function syncChallengeControls() {
    Object.keys(propMap).forEach(prop => {
      const info = propMap[prop];
      const chGrp = document.getElementById('ch-' + info.grp);
      if (chGrp) {
        chGrp.querySelectorAll('button').forEach(b => {
          b.classList.toggle('active', b.textContent === container[prop]);
        });
      }
    });
    const chLbl = document.getElementById('ch-lbl-gap');
    if (chLbl) chLbl.textContent = container.gap;
    const chRange = document.getElementById('ch-range-gap');
    if (chRange) chRange.value = parseInt(container.gap);
  }

  function switchPanelTab(tab) {
    document.getElementById('panel-control').style.display   = tab === 'control'   ? 'contents' : 'none';
    document.getElementById('panel-explain').style.display   = tab === 'explain'   ? 'flex'      : 'none';
    document.getElementById('panel-examples').style.display  = tab === 'examples'  ? 'flex'      : 'none';
    document.getElementById('panel-challenge').style.display = tab === 'challenge' ? 'flex'      : 'none';
    ['control','explain','examples','challenge'].forEach(t =>
      document.getElementById('tab-' + t).classList.toggle('active', t === tab)
    );
    if (tab === 'examples'  && !document.querySelector('.ex-card'))     buildExamplesPanel();
    if (tab === 'challenge' && !document.querySelector('.challenge-card')) buildChallengePanel();

    // 오른쪽 패널 뷰 전환
    const showPlayground = tab === 'control' || tab === 'challenge';
    const showExplain    = tab === 'explain';
    const showExGrid     = tab === 'examples';
    const isChallenge    = tab === 'challenge';

    document.getElementById('playground-view').style.display     = showPlayground ? 'contents' : 'none';
    document.getElementById('explain-view').style.display         = showExplain    ? 'flex'     : 'none';
    document.getElementById('examples-grid-view').style.display   = showExGrid     ? 'flex'     : 'none';
    // example-view는 showExampleView()로만 열림 — 탭 전환 시 닫기
    if (!showExGrid) document.getElementById('example-view').style.display = 'none';

    // 챌린지 탭: 컨트롤 바 표시 / 코드 패널 숨김
    const chBar    = document.getElementById('ch-control-bar');
    const codePnl  = document.getElementById('pg-code-panels');
    if (chBar)   chBar.style.display   = isChallenge ? 'flex'  : 'none';
    if (codePnl) codePnl.style.display = isChallenge ? 'none'  : 'flex';

    // 툴바 텍스트 전환
    const pgTitle = document.getElementById('pg-toolbar-title');
    const pgHint  = document.getElementById('pg-toolbar-hint');
    if (pgTitle) pgTitle.textContent = isChallenge ? '챌린지 미리보기' : '미리보기';
    if (pgHint)  pgHint.textContent  = isChallenge ? '위 컨트롤로 속성을 조작해 목표 레이아웃을 맞춰보세요!' : '아이템 클릭 → 개별 속성 변경';

    if (isChallenge) syncChallengeControls();
    if (showExGrid)  buildExamplesGridView();
  }

  // ── 설명 아코디언 토글 ──
  function toggleExp(key) {
    const btn    = document.querySelector(`[onclick="toggleExp('${key}')"]`);
    const detail = document.getElementById('exp-' + key);
    const isOpen = detail.classList.contains('open');
    // 모두 닫기
    document.querySelectorAll('.exp-detail').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.exp-prop-btn').forEach(b => b.classList.remove('open'));
    // 클릭한 것만 열기 (토글)
    if (!isOpen) {
      detail.classList.add('open');
      btn.classList.add('open');
    }
  }

  // ── 설명 탭에서 값 바로 적용 ──
  function applyVal(prop, val) {
    switchPanelTab('control');
    setContainer(prop === 'flexDirection'   ? 'flexDirection'   :
                 prop === 'flexWrap'        ? 'flexWrap'        :
                 prop === 'justifyContent'  ? 'justifyContent'  :
                 prop === 'alignItems'      ? 'alignItems'      :
                 prop === 'alignContent'    ? 'alignContent'    : prop, val);
  }

  // ── Undo / Redo ──
  const history = [];
  let historyIdx = -1;

  function snapshotState() {
    return {
      container: { ...container },
      items: items.map(it => ({ ...it })),
      selectedId,
      nextId,
    };
  }

  function pushHistory() {
    history.splice(historyIdx + 1);
    history.push(snapshotState());
    if (history.length > 80) { history.shift(); } else { historyIdx++; }
    // 실제 인덱스 동기화
    historyIdx = history.length - 1;
    updateUndoRedoBtns();
  }

  function updateUndoRedoBtns() {
    const u = document.getElementById('btn-undo');
    const r = document.getElementById('btn-redo');
    if (u) u.disabled = historyIdx <= 0;
    if (r) r.disabled = historyIdx >= history.length - 1;
  }

  function restoreFromHistory(state) {
    container  = { ...state.container };
    items      = state.items.map(it => ({ ...it }));
    selectedId = state.selectedId;
    nextId     = state.nextId;
    // UI 전체 동기화
    Object.keys(propMap).forEach(prop => {
      const info = propMap[prop];
      document.getElementById(info.lbl).textContent = container[prop];
      document.querySelectorAll(`#${info.grp} button`).forEach(b => {
        b.classList.toggle('active', b.textContent === container[prop]);
      });
    });
    document.getElementById('lbl-gap').textContent = container.gap;
    document.getElementById('range-gap').value = parseInt(container.gap);
    syncChallengeControls();
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    render();
    syncItemPanelValues();
    updateUndoRedoBtns();
  }

  function undo() {
    if (historyIdx <= 0) return;
    historyIdx--;
    restoreFromHistory(history[historyIdx]);
  }

  function redo() {
    if (historyIdx >= history.length - 1) return;
    historyIdx++;
    restoreFromHistory(history[historyIdx]);
  }

  // ── 컨테이너 너비 슬라이더 ──
  function setContainerWidth(v) {
    const inner = document.querySelector('.preview-container > div');
    if (!inner) return;
    inner.style.maxWidth = v + 'px';
    const pct = Math.round(v / 8);
    document.getElementById('container-width-lbl').textContent =
      v >= 800 ? '100%' : v + 'px';
  }

  // ── 초기화 ──
  function resetAll() {
    container = { flexDirection:'row', flexWrap:'nowrap', justifyContent:'flex-start', alignItems:'stretch', alignContent:'normal', gap:'8px' };
    items = [
      { id:1, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:60 },
      { id:2, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:60 },
      { id:3, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:60 },
      { id:4, flexGrow:0, flexShrink:1, flexBasis:'auto', alignSelf:'auto', order:0, width:80, height:60 },
    ];
    nextId = 5;
    selectedId = 1;
    Object.keys(propMap).forEach(prop => {
      const info = propMap[prop];
      document.getElementById(info.lbl).textContent = container[prop];
      document.querySelectorAll(`#${info.grp} button`).forEach(b => {
        b.classList.toggle('active', b.textContent === container[prop]);
      });
    });
    document.getElementById('lbl-gap').textContent = container.gap;
    document.getElementById('range-gap').value = parseInt(container.gap);
    syncChallengeControls();
    // 너비 슬라이더 초기화
    const slider = document.getElementById('container-width-slider');
    if (slider) { slider.value = 800; setContainerWidth(800); }
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    pushHistory();
    render();
    syncItemPanelValues();
  }

  const challengeSolved = new Set();
  const challengeHintShown = new Set();

  function buildChallengePanel() {
    const list = document.getElementById('challenge-list');
    list.innerHTML = '';

    CHALLENGES.forEach(ch => {
      const card = document.createElement('div');
      card.className = 'challenge-card';
      card.id = 'ch-card-' + ch.id;

      const miniItems = ch.colors.map((col, i) => {
        const w = ch.itemWidths ? ch.itemWidths[i] : '24px';
        const grow = ch.itemGrows ? ch.itemGrows[i] : 0;
        return `<div class="ch-mini-item" style="background:${col};width:${w};flex-grow:${grow};height:24px">${i+1}</div>`;
      }).join('');

      const miniStyle = Object.entries(ch.miniStyle || {})
        .map(([k,v]) => `${k.replace(/([A-Z])/g,'-$1').toLowerCase()}:${v}`)
        .join(';');

      const propTags = Object.entries(ch.target)
        .filter(([k]) => !(ch.ignore || []).includes(k))
        .map(([k,v]) => {
          const cssProp = k.replace(/([A-Z])/g, '-$1').toLowerCase();
          return `<span class="ch-prop-tag" id="ch-tag-${ch.id}-${k}">${cssProp}: ${v}</span>`;
        }).join('');

      card.innerHTML = `
        <div class="ch-header" onclick="toggleChallenge(${ch.id})">
          <span class="ch-num">#${ch.id}</span>
          <span class="ch-title">${ch.title}</span>
          <span class="ch-diff">${ch.difficulty}</span>
        </div>
        <div class="ch-desc">${ch.desc}</div>
        <div class="ch-target-preview">
          <div class="ch-target-label">목표 레이아웃</div>
          <div class="ch-mini-flex" style="${miniStyle};gap:4px">${miniItems}</div>
        </div>
        <div class="ch-props">${propTags}</div>
        <div class="ch-actions">
          <button class="ch-submit-btn" onclick="submitChallenge(${ch.id})">✓ 제출</button>
          <button class="ch-hint-btn" onclick="toggleHint(${ch.id})">💡 힌트</button>
          <span id="ch-status-${ch.id}" style="font-size:11px;color:#475569;margin-left:auto"></span>
        </div>
        <div class="ch-hint-box" id="ch-hint-${ch.id}">${ch.hint}</div>
        <div id="ch-result-${ch.id}"></div>
      `;
      list.appendChild(card);
    });
    updateChBadge();
  }

  function toggleChallenge(id) {
    const card = document.getElementById('ch-card-' + id);
    const wasActive = card.classList.contains('active');
    document.querySelectorAll('.challenge-card').forEach(c => c.classList.remove('active'));
    if (!wasActive) card.classList.add('active');
  }

  function toggleHint(id) {
    const hintEl = document.getElementById('ch-hint-' + id);
    const shown = hintEl.style.display === 'block';
    hintEl.style.display = shown ? 'none' : 'block';
    challengeHintShown.add(id);
  }

  function submitChallenge(id) {
    const ch = CHALLENGES.find(c => c.id === id);
    const resultEl = document.getElementById('ch-result-' + id);
    const statusEl = document.getElementById('ch-status-' + id);

    const checkKeys = Object.keys(ch.target).filter(k => !(ch.ignore || []).includes(k));
    let correct = 0;

    checkKeys.forEach(prop => {
      const tag = document.getElementById(`ch-tag-${id}-${prop}`);
      const matches = container[prop] === ch.target[prop];
      if (tag) {
        tag.className = 'ch-prop-tag ' + (matches ? 'match' : 'mismatch');
      }
      if (matches) correct++;
    });

    const total = checkKeys.length;
    const pct   = Math.round((correct / total) * 100);

    if (correct === total) {
      challengeSolved.add(id);
      const card = document.getElementById('ch-card-' + id);
      card.classList.remove('active');
      card.classList.add('solved');
      statusEl.textContent = '✅ 클리어!';
      statusEl.style.color = '#48f1b0';
      resultEl.innerHTML = `<div class="ch-result success">🎉 정답입니다! 모든 속성이 일치합니다.</div>`;
      updateChBadge();
    } else {
      statusEl.textContent = `${correct}/${total}`;
      statusEl.style.color = '#f1c948';
      resultEl.innerHTML = `
        <div class="ch-result fail">
          ${correct}/${total} 일치 — 빨간 태그를 확인하고 다시 시도하세요.
          <div class="ch-score-bar"><div class="ch-score-fill" style="width:${pct}%"></div></div>
        </div>`;
    }
  }

  function updateChBadge() {
    const badge = document.getElementById('ch-badge');
    if (!badge) return;
    const solved = challengeSolved.size;
    if (solved > 0) {
      badge.textContent = solved + '/' + CHALLENGES.length;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  // ── 키보드 단축키 ──
  document.addEventListener('keydown', e => {
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    }
  });

  // 초기 렌더
  render();
  syncItemPanelValues();
  pushHistory(); // 초기 상태를 히스토리에 저장
