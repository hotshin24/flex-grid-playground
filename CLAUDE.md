# CLAUDE.md

Flex & Grid Playground v1.0 작업 규칙. 코드를 쓰기 전에 이 문서를 먼저 읽는다.

## 프로젝트

CSS Flexbox와 Grid를 값 단위로 조작하며 익히는 정적 학습 사이트.
빌드 도구 없음. 의존성 없음. 파일을 열면 바로 동작해야 한다.

상세 명세는 `docs/PRD_flex-grid-playground_v1.0.md`에 있다. 기능 ID(F-01, GR-05 등)는
그 문서를 기준으로 한다. PRD와 이 문서가 충돌하면 PRD가 우선한다.

## v0.1 코드의 지위

레포에 남아 있는 `index.html` · `js/app.js` · `js/data.js` · `css/style.css`는
**참조 전용**이다. v1.0은 이 코드를 고치는 작업이 아니라 다시 쓰는 작업이다.

- v0.1 파일을 수정하지 않는다.
- v0.1 함수를 복사해 오지 않는다. 구조가 바뀌었으므로 그대로 옮기면 깨진다.
- 단, `js/data.js`의 **콘텐츠**(EXAMPLES 18건 · CHALLENGES 8건 · EXPLAIN_DATA 설명문)는
  신규 스키마로 변환해 재사용한다. 설명 문장은 새로 쓰지 말고 이관한다.
- 전 마일스톤 완료 후 v0.1 파일을 일괄 삭제한다. 그 전에는 지우지 않는다.
- v1.0 진입점은 `index-v1.html`이다. 기존 `index.html`을 덮어쓰거나 수정하지 않는다.
  M2 회귀 검증에서 두 화면을 나란히 띄워 비교해야 하므로 둘 다 살아 있어야 한다.

## 진입점

v1.0 진입점은 `index-v1.html`이다. 기존 `index.html`은 v0.1 참조 화면이며
M2 회귀 검증에서 나란히 띄워 비교하는 용도이므로 수정·덮어쓰기 금지.
M7 완료 시 `index-v1.html`을 `index.html`로 교체한다.

## 절대 규칙

1. **의존성 0.** npm 패키지, CDN 스크립트, 폰트 CDN 모두 금지. jQuery 절대 금지.
2. **ES 모듈만.** `<script type="module">`. 전역 함수 노출 금지. IIFE 패턴 금지.
3. **인라인 `onclick=` 금지.** 이벤트는 `core/events.js`의 위임으로만 바인딩한다.
4. **인라인 `style=` 금지.** 예외는 프리뷰 아이템에 사용자 설정값을 적용하는 경우뿐이며,
   이건 `core/renderer.js` 안에서만 일어난다.
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

컨트롤 UI · 코드 생성 · 챌린지 정답 검증 · 속성 설명 데모는 전부
`js/topics/*/schema.js`에서 파생된다.

- **속성을 추가할 때 마크업을 건드리지 않는다.** 스키마 항목만 추가한다.
- `index-v1.html`에 속성별 버튼을 하드코딩하면 이 설계가 무너진다. v0.1이 실패한 지점이다.
- 초기 상태는 `defaultsFrom(schema, scope)`로 만든다. 상태 객체 리터럴을 코드에 쓰지 않는다.
- 새 컨트롤 타입이 필요하면 `CONTROL_TYPES`에 등록하고 `ui/controls.js`에 렌더러를 추가한다.
- 조건부 비활성 판정을 코드에 하드코딩하지 않는다. 유형 A는 스키마의 `inactiveWhen`,
  유형 B·C는 `renderer.js`의 측정 키로만 선언한다. `if (prop === 'align-content')`
  같은 분기가 등장하면 설계가 무너진 것이다.

## 검증 게이트

스키마를 수정했으면 반드시 실행한다.

```bash
node tools/validate-schema.mjs   # 종료 코드 0이어야 한다
```

실패한 상태로 커밋하지 않는다. 검증 통과 여부를 작업 보고에 포함한다.

## 파일 구조

```
index.html              v0.1 참조 화면. 수정 금지
index-v1.html           v1.0 진입점. 셸만 — 탭 컨테이너와 마운트 지점 외 마크업 없음
css/
  tokens.css            토큰 (완료 — 수정 시 사유를 남길 것)
  base.css              리셋 · 타이포그래피
  layout.css            셸 · 반응형 (브레이크포인트 599 / 1023)
  components.css        컨트롤 · 카드 · 패널
js/
  core/
    schema-spec.js      계약 · 검증기 · 파서 (완료)
    store.js            상태 · 구독 · undo/redo 히스토리
    renderer.js         프리뷰 DOM (요소 재사용 diffing — 트랜지션 유지)
    codegen.js          CSS · HTML 코드 생성
    router.js           URL 해시 직렬화
    storage.js          localStorage
    events.js           이벤트 위임
  ui/
    controls.js         스키마 → 컨트롤 DOM
    tabs.js             탭 전환
    track-editor.js     GR-03
    area-editor.js      GR-04
  topics/
    flex/  schema.js(완료) explain.js examples.js challenges.js
    grid/  schema.js(완료) explain.js examples.js challenges.js
tools/
  validate-schema.mjs   (완료)
```

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
