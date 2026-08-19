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
