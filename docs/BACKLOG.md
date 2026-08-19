# 백로그

v1.0 범위 밖으로 미룬 것. 각 항목은 왜 지금 못 하는지와 무엇을 풀어야 하는지를
함께 적는다. PRD 에 없는 것은 여기에 적고, 착수 전에 승인을 받는다.

## M6 이후

### 챌린지 탭의 아이템 속성 확장

**지금 상태.** 챌린지 탭은 컨테이너 스코프 속성만 다룬다.
`ui/challenge.js` 가 컨트롤을 `partitionByScope(schema).container` 로만 세우고,
`checkAnswer` 도 `container` 만 본다. Flex 는 아이템 속성 6종, Grid 는 7종
(span 4 · text 1 · enum 2)이 챌린지에서 빠져 있다.

**그래서 못 낸 문제.** Grid 챌린지에서 두 개념을 뺐다 (2026-08-19, GR-08).

| 개념 | 왜 성립하지 않았는가 | 실측 |
| --- | --- | --- |
| `grid-template-areas` | 이름 붙인 칸에 아이템을 넣으려면 아이템에 `grid-area` 가 필요하다. 이름만 있고 아이템이 안 들어간 행은 높이 0으로 접힌다 | `"head head" / ". body"` → 트랙 `60px 0px` |
| `dense` | 메울 빈 칸을 만들려면 아이템에 `span` 이 필요하다. 빈 칸이 없으면 `dense` 는 아무 일도 하지 않는다 | `row dense` 와 `row` 의 아이템 배치가 여섯 칸 전부 동일 |

정답 판정 자체는 정상이었지만 맞혀도 화면이 답을 보여 주지 못했다. 틀린 것을
가르치는 상태라 다른 문제로 갈아 끼웠다. 두 개념은 속성 설명 탭이 전용 데모로
다루므로 학습 경로는 끊기지 않는다.

**확장하려면 무엇을 풀어야 하는가.**

1. `ui/challenge.js` 가 아이템 컨트롤을 함께 세운다. 어느 아이템을 고쳤는지
   고르는 수단이 필요하다 — 플레이그라운드의 `selectedId` 와 같은 개념이다.
2. `checkAnswer` 가 `items` 를 본다. 아이템마다 값이 다를 수 있으므로 target 이
   `{ container, items }` 두 층을 갖는 모양으로 바뀐다. 지금은 컨테이너 값
   하나뿐이라 계약 변경이다.
3. 정규화는 그대로 쓸 수 있다. `normalizeValue` 가 컨트롤 타입만 보므로
   span·text 도 이미 처리된다.
4. 채점 태그가 어느 아이템의 값인지 표시해야 한다.

**되살릴 수 있는 것.** areas 4건과 dense 2건. 각각 `grid-area` 와
`grid-column: span N` 을 아이템에 줄 수 있으면 desc 가 말하는 그림이 나온다.

### grid-area 정밀 판정 (F-13 옵션 C)

지금 잡는 것은 **"판에 이름이 하나도 없을 때"** 뿐이다. `grid-template-areas` 가
`none` 이면 `grid-area` 컨트롤이 흐려진다.

잡지 못하는 것: `grid-area: header` 인데 판이 `"hd hd"` 인 경우. 이름이 판에
없어 아이템이 자동 배치로 떨어지는데 화면에는 단서가 없다.

구현하려면 셋이 필요하다.

1. **네 번째 종류의 연산자** (`notNamedIn` 같은 것). 지금 연산자 넷
   (`equals`·`notEquals`·`in`·`equalsSelf`)은 전부 **값 하나와의 비교**다.
   이건 areas 문자열을 파싱해 **이름 목록을 뽑아** 그 안에 있는지를 본다 —
   종류가 다르다. `schema-spec.js` 의 `INACTIVE_OPERATORS` 주석이 그 선을
   긋고 있다: 목록·파싱이 필요하면 연산자로 만들지 않는다.
2. **`areaNamesFrom` 을 `js/ui/area-editor.js` 에서 `schema-spec.js` 로 이동.**
   순수 함수이고 이미 `parseAreaGrid` 위에 얹혀 있다. `toCssValue` 를 옮겼을
   때와 같은 상황이다. import 3곳이 따라온다.
3. **core 에 컨트롤 타입 분기.** "상대가 `area-grid` 컨트롤이면 이름 목록을
   뽑는다" 는 판단이 `isInactive` 안에 생긴다. 속성 이름 분기는 아니지만
   타입 지식이 core 로 들어오는 첫 자리다.

이득이 상대적으로 작아 미뤘다 — areas 편집기가 이미 정의된 이름 목록을 화면에
보여 주고 있어, 오타는 그쪽을 보면 드러난다.

### justify-self 의 속성 설명 탭 사례 부재

`GRID_EXPLAIN_SAMPLES` 에 enum 7속성(`justify-items` · `align-items` ·
`justify-content` · `align-content` · `grid-auto-flow` · `justify-self` ·
`align-self`)의 항목이 없다. `values[].desc` 로 사례가 자동 생성되는지 확인이
필요하다.

`justify-self` 는 대조 뷰(GR-09)에도 챌린지에도 없어, 자동 생성이 안 되고
있다면 그 속성만 학습 경로가 비어 있는 셈이다. M6 남은 작업에서 확인한다.

### 슬라이더 드래그의 히스토리 병합

`store.dispatch` 는 부르는 족족 히스토리를 하나씩 쌓고 병합하지 않는다. 슬라이더는
`input` 이벤트마다 dispatch 하므로 **한 번의 드래그가 `HISTORY_LIMIT` 50 을 거의
채운다.** 실측 — 너비 슬라이더를 20 에서 400 까지 끌면(38단계) 되돌리기 40회를
눌러도 드래그 이전 상태에 닿지 못하고, 그 사이에 있던 프리셋 적용 시점이 밀려
나간다.

해당하는 컨트롤: 컨테이너 너비·높이, 아이템 너비·높이, `flex-grow`,
`flex-shrink`, `order`.

고치려면 `store.js` 를 건드려야 한다 — 같은 키에 연달아 들어오는 dispatch 를
한 항목으로 접거나(디바운스·트랜잭션), 컨트롤 쪽에서 `change` 로만 커밋하고
`input` 은 표시만 갱신하게 나눠야 한다. 뒤쪽이 store 를 안 건드리지만 프리뷰가
드래그 중에 따라 움직이지 않게 되어 이 도구의 요점을 해친다.

위험도가 한 단계 높다. 히스토리는 undo·redo·프리셋·토픽 전환이 모두 기대는
자리라, 접는 규칙이 틀리면 되돌리기가 엉뚱한 지점으로 간다.

### 답안 프리뷰 아이템의 최소 폭

`stretch` 가 정답인 문제에서 아이템 크기를 빼면 (renderer 가 유한한 수일 때만
크기를 얹는다) 교차축은 채워지지만 주축은 내용 너비로 줄어든다. Flex `row` +
`align-items: stretch` 인 문제에서 아이템이 12px 폭 머리카락처럼 보인다.

`css/components.css` 의 `.fgp-challenge__preview .fgp-preview__item` 에 최소 폭을
주면 해소된다. 축을 가려 한쪽만 푸는 방법은 속성마다 분기해야 해서 쓰지 않았다.

## v1.1 후보

PRD 가 명시적으로 v1.0 범위 밖으로 둔 것.

- Subgrid
- Container Query
