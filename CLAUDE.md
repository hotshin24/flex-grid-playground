# CLAUDE.md

Flex & Grid Playground v1.0 작업 규칙. 코드를 쓰기 전에 이 문서를 먼저 읽는다.

## 프로젝트

CSS Flexbox와 Grid를 값 단위로 조작하며 익히는 정적 학습 사이트.
빌드 도구 없음. 의존성 없음. 소스가 곧 배포본이다 — 컴파일도 번들링도 거치지 않는다.

**정적 서버 하나는 필요하다.** 규칙 2가 ES 모듈을 요구하는데 ES 모듈은 CORS 를 타고
`file://` 은 출처가 없어 `import` 가 막힌다. 실측 — `file://` 로 열면 `fgp-booting`
클래스가 벗겨지지 않고 컨트롤이 0개다. `http://localhost` 로 열면 정상이다.
"파일을 열면 바로 동작한다" 는 일반 스크립트를 쓰던 v0.1 의 전제였다.
무의존성은 그대로다 — 빌드 도구도 패키지도 여전히 없고, 늘어난 것은 서버 한 줄뿐이다
(아래 「로컬 실행」).

상세 명세는 `docs/PRD_flex-grid-playground_v1.0.md`에 있다. 기능 ID(F-01, GR-05 등)는
그 문서를 기준으로 한다. PRD와 이 문서가 충돌하면 PRD가 우선한다.

## v0.1 코드의 지위

레포에 남아 있는 `index.html` · `js/app.js` · `js/data.js` · `css/style.css`는
**참조 전용**이다. v1.0은 이 코드를 고치는 작업이 아니라 다시 쓰는 작업이다.

- v0.1 파일을 수정하지 않는다.
- v0.1 함수를 복사해 오지 않는다. 구조가 바뀌었으므로 그대로 옮기면 깨진다.
- 단, `js/data.js`의 **콘텐츠**(EXAMPLES 18건 · CHALLENGES 8건 · EXPLAIN_DATA 설명문)는
  신규 스키마로 변환해 재사용한다.
- **설명 문장은 이관이 기본이다.** 그대로 옮길 수 있으면 옮긴다. 다만 더 나은 문장을
  쓸 수 있으면 다시 써도 된다. 넘지 말아야 할 선은 하나다 — **v0.1 이 담고 있던 정보가
  빠지지 않을 것.** 값 하나, 단서 하나가 사라지면 그건 개선이 아니라 손실이다.
  다시 쓴 자리는 작업 보고에 남긴다.

  > 실제로 그렇게 됐다. M0 스키마 작성에서 값 설명 34개 중 29개, 속성 desc·tip
  > 24문장 중 19개를 새로 썼다. 값 슬롯 34개는 하나도 빠지지 않았고 여러 자리가
  > 더 정확해졌다 — `align-items: stretch` 의 "아이템에 크기가 없을 때만 동작",
  > `flex: auto` 의 "= 1 1 auto", `order` 의 접근성 경고는 v0.1 에 없던 것이다.
  > 되돌리지 않는다. 규칙을 실제에 맞춘다.
- 전 마일스톤 완료 후 v0.1 파일을 일괄 삭제한다. 그 전에는 지우지 않는다.
- v1.0 진입점은 `index.html`이다. M7 파일 정리 절차(PRD 7.2)의 4번에서
  v0.1 진입점을 지우고 `index-v1.html`이 그 이름을 받았다. 회귀 검증이 끝난
  뒤였고, v0.1 화면은 `v0.1-archive` 태그로 되짚는다.

## 진입점

진입점은 `index.html` 하나다. PRD 7.2 절차의 **4번**에서 교체를 마쳤다 —
회귀 검증(1) · `v0.1-archive` 태그(2) · `js/data.js` 이관 확인(3)을 끝낸 뒤
v0.1 진입점을 지우고 `index-v1.html`이 그 이름을 받았다.

남은 것은 절차 **5번**, v0.1 파일 삭제다 (`js/app.js` · `js/data.js` ·
`css/style.css`). 그때까지 이 셋은 참조 전용이며 수정 금지다.

## 절대 규칙

1. **의존성 0.** npm 패키지, CDN 스크립트, 폰트 CDN 모두 금지. jQuery 절대 금지.
2. **ES 모듈만.** `<script type="module">`. 전역 함수 노출 금지. IIFE 패턴 금지.
3. **인라인 `onclick=` 금지.** 마크업에 핸들러를 적지 않는다. 이벤트는 각 UI 모듈이
   자기 뿌리에 하나씩 걸고 `e.target`에서 거슬러 올라가 어느 항목인지 가려내는
   위임으로 바인딩한다 (`data-*` 속성이 그 표지다). 모듈이 자기 것만 알면 되므로
   중앙 파일을 두지 않는다.
4. **인라인 `style=` 금지.** 예외는 **값이 데이터에서 오는 미리보기**뿐이다.
   스키마의 `demo` · 챌린지의 `miniStyle` 처럼 CSS 파일에 미리 적을 수 없는 값이
   해당한다. 허용 파일은 여섯이다 —

   | 파일 | 무엇을 얹는가 |
   |---|---|
   | `core/renderer.js` | 사용자가 고른 속성값과 아이템 크기 |
   | `ui/explain.js` | 스키마 `demo` 의 값 |
   | `ui/compare.js` | 대조 데모의 값 |
   | `ui/challenge.js` | 챌린지 `miniStyle` |
   | `main.js` | 뷰 설정의 프리뷰 무대 크기 |
   | `ui/grid-overlay.js` | 실측한 라인·트랙 좌표 (CSS 변수로) |

   이 밖의 파일에 인라인 스타일이 생기면 규칙 위반이다.
   허용 파일이 늘어야 한다고 판단되면 먼저 보고할 것.
5. **색상 리터럴 금지.** `css/tokens.css` 밖에 hex·rgb·hsl 값이 존재해선 안 된다.
   컴포넌트는 `--fgp-*` semantic 토큰만 참조한다. `--p-*` primitive 직접 참조도 금지.
6. **`!important` 금지.**
7. **간격은 `--sp-*` 토큰.** px 리터럴 금지.

## 절대 규칙의 적용 범위

절대 규칙 1~7은 **v1.0 신규 코드에만** 적용된다.

v0.1 파일(`index.html` · `js/app.js` · `js/data.js` · `css/style.css`)은 참조 전용이므로
위반 집계 대상이 아니며, 수정해서 해소하려 해서도 안 된다. 이 파일들은 M7 완료 시
일괄 삭제로 정리된다.

감사 보고 시 v0.1 수치는 "참조(비적용)"으로 분리해 기재한다.

## 스키마가 단일 진실 공급원

아래가 전부 `js/topics/*/schema.js`에서 파생된다.

| 무엇 | 스키마의 무엇에서 |
|---|---|
| 컨트롤 UI | `control` · `values` · `units` · `min`/`max` |
| 코드 생성 | `prop` · `default` (기본값과 같으면 선언을 만들지 않는다) |
| 챌린지 정답 검증 | `CONTROL_TYPES`의 `parse`·`serialize` 정규형 |
| 속성 설명 데모 | `values` · `demo` · `axisAware` |
| Flex↔Grid 대조 뷰 | `relatedTo` (`pairsFrom`이 짝을 만든다) |
| 조건부 비활성 판정 | `inactiveWhen` (유형 A) · `measuredInactive` (유형 B·C) |
| URL 직렬화 | `urlKey` (`core/router.js`) |

- **속성을 추가할 때 마크업을 건드리지 않는다.** 스키마 항목만 추가한다.
- `index.html`에 속성별 버튼을 하드코딩하면 이 설계가 무너진다. v0.1이 실패한 지점이다.
- 초기 상태는 `defaultsFrom(schema, scope)`로 만든다. 상태 객체 리터럴을 코드에 쓰지 않는다.
- 새 컨트롤 타입이 필요하면 `CONTROL_TYPES`에 등록하고 `ui/controls.js`에 렌더러를 추가한다.
- 조건부 비활성 판정을 코드에 하드코딩하지 않는다. 유형 A는 스키마의 `inactiveWhen`,
  유형 B·C는 `renderer.js`의 측정 키로만 선언한다. `if (prop === 'align-content')`
  같은 분기가 등장하면 설계가 무너진 것이다.

## 검증 게이트

`tools/` 아래 게이트 **18종**이 있다. 전부 순수 node 스크립트이고, 실패하면
종료 코드가 0이 아니다. 커밋 전에 전체를 돌린다.

```bash
for f in tools/check-*.mjs tools/validate-*.mjs; do
  case "$f" in *check-mdn-links*) continue;; esac
  node "$f" >/dev/null || echo "FAIL $f"
done
```

스키마를 고쳤으면 `validate-schema.mjs` 하나로 끝나지 않는다. 스키마가 단일 진실
공급원이므로 파생되는 쪽이 함께 깨진다 — `check-controls` · `check-codegen` ·
`check-challenges` · `check-explain` · `check-router` · `check-measured` 가
그 자리다. 그래서 전체를 돌린다.

`tools/check-mdn-links.mjs`는 **게이트가 아니다.** 위 명령이 그것만 건너뛴다.
네트워크를 쓰기 때문이다 — 오프라인이거나 MDN이 잠깐 죽으면 실패하는데, 링크
상태는 코드의 옳고 그름이 아니라 바깥 사정이라 그때 커밋이 막히면 곤란하다.
필요할 때 사람이 따로 돌린다.

실패한 상태로 커밋하지 않는다. 검증 통과 여부를 작업 보고에 포함한다.

## 파일 구조

```
index.html              진입점. 셸만 — 탭 컨테이너와 마운트 지점 외 마크업 없음
README.md · LICENSE
css/
  tokens.css            토큰 (완료 — 수정 시 사유를 남길 것)
  base.css              리셋 · 타이포그래피
  layout.css            셸 · 반응형 (브레이크포인트 599 / 1023) · 부팅 게이트
  components.css        컨트롤 · 카드 · 패널
  style.css             v0.1 참조. 수정 금지
js/
  main.js               부품 조립 · 프리셋 · 뷰 설정 · 아이템 조작 · 구독
  app.js · data.js      v0.1 참조. 수정 금지
  core/
    schema-spec.js      계약 · 검증기 · 파서 · CONTROL_TYPES · isInactive
    store.js            상태 · 구독 · undo/redo 히스토리 (토픽별)
    renderer.js         프리뷰 DOM (요소 재사용 diffing — 트랜지션 유지) · 측정
    codegen.js          CSS · HTML 코드 생성
    router.js           URL 해시 직렬화 (F-09)
  ui/
    controls.js         스키마 → 컨트롤 DOM
    tabs.js             탭 전환
    explain.js          속성 설명 탭
    compare.js          Flex↔Grid 대조 뷰 (GR-09)
    examples.js         실전 예제 탭
    challenge.js        챌린지 탭 · 정답 판정 · 진행률(localStorage)
    track-editor.js     GR-03
    area-editor.js      GR-04
    span-editor.js      GR-02
    grid-overlay.js     GR-05 · GR-06
  topics/
    flex/  schema.js explain.js examples.js challenges.js presets.js
    grid/  schema.js explain.js examples.js challenges.js presets.js
tools/                  게이트 18종 + check-mdn-links.mjs (게이트 아님)
docs/
  PRD_flex-grid-playground_v1.0.md
  BACKLOG.md
```

두 스키마와 `schema-spec.js` · `tokens.css`는 M0에서 확정된 파일이다. 고쳐야
한다고 판단되면 사유를 커밋 본문에 남긴다.

`core/storage.js`와 `core/events.js`는 M0 계획에는 있었으나 만들지 않았다.
진행률 저장은 `ui/challenge.js`가 자기 것만 다루고, 이벤트는 규칙 3대로 각
모듈이 위임으로 건다. 둘 다 중앙 파일을 둘 이유가 생기지 않았다.

## 프리뷰 렌더링 주의

아이템 개수가 바뀔 때 컨테이너를 통째로 다시 그리면 CSS 트랜지션이 끊긴다.
**속성 변화가 눈에 보이는 것이 이 도구의 존재 이유**이므로 트랜지션은 기능이다.

- DOM 요소를 재사용하고 스타일만 in-place 갱신한다.
- `innerHTML` 전체 교체 금지.
- 개수 변경 시에만 요소를 추가·제거한다.

## 접근성

- 전 인터랙티브 요소에 보이는 포커스 링. `outline: none` 단독 사용 금지.
- 컨트롤 버튼 그룹은 `role="radiogroup"` + `aria-checked`.
- 키보드만으로 모든 기능이 동작해야 한다.
- `prefers-reduced-motion` 존중 (토큰에 이미 반영됨).
- Grid 명시/암시 트랙 구분은 색상 + 선 스타일 둘 다로 표현한다. 색상 단독 금지.

## 커밋

Conventional Commits.

```
feat(core): 스키마 기반 상태 저장소 구현
fix(grid): areas 파서가 한 줄 표기를 행 하나로 읽던 문제
refactor(ui): 컨트롤 생성을 스키마 주도로 전환
docs(prd): M2 회귀 체크리스트 추가
```

한 커밋은 한 가지 일만 한다. 마일스톤 전체를 한 커밋에 담지 않는다.

## 작업 보고

- **실측값만 쓴다.** "약", "대략", "~정도" 금지. 세지 않았으면 세고 나서 쓴다.
- 미완성을 완료로 보고하지 않는다. 못 한 것은 못 했다고 쓴다.
- 규칙을 어겼으면 어긴 사실과 이유를 먼저 보고한다.
- 스스로 판단해 PRD 범위를 넓히지 않는다. 필요해 보이면 제안하고 승인을 기다린다.

## 하지 않을 것

- 프레임워크 도입 (React 등)
- 빌드 도구 도입 (Vite, esbuild 등)
- TypeScript 전환
- 백엔드 · 계정 · 서버
- Subgrid · Container Query (v1.1 후보)
- 다국어
- 테스트 프레임워크 도입 (`tools/validate-schema.mjs` 방식의 순수 node 스크립트는 허용)

## 로컬 실행

```bash
python3 .claude/serve.py 7788
```
