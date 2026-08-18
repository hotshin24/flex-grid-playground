/**
 * topics/flex/challenges.js — 챌린지 8건 (F-09)
 *
 * v0.1 js/data.js 의 CHALLENGES 를 옮겼다. 제목 · 난이도 · 설명 · 힌트 ·
 * target · ignore · itemCount · miniStyle 은 한 글자도 고치지 않았다.
 * 회귀 검증(PRD 7.1)에서 v0.1 화면과 나란히 대조해야 한다.
 *
 * colors 만 accents 로 바꿨다. v0.1 은 아이템 색을 hex 배열로 들고 있어
 * CLAUDE.md 규칙 5 를 어긴다. 다행히 그 값들은 전부 tokens.css 의
 * --p-item-1..8 과 같은 색이었다 — v0.1 의 COLORS 배열이 그대로 토큰이 된 것이다.
 * 그래서 색을 버리지 않고 순번으로 옮겼다. 화면에 나오는 색은 v0.1 과 똑같고,
 * 어느 색인지는 css/components.css 가 --fgp-item-N 으로 고른다.
 *
 * 8번의 itemWidths · itemGrows 는 그 문제에만 있는 값이다. 목표 미리보기에서
 * 사이드바 폭 고정과 본문 확장을 보여 주므로 함께 옮겼다.
 *
 * target 의 키는 스키마의 jsProp 이다. 오타가 나면 정답을 맞혀도 통과하지
 * 못하므로 tools/check-challenges.mjs 가 실제 스키마와 대조한다.
 */

export const FLEX_CHALLENGES = [
    {
      id: 1, title: '정중앙 배치', difficulty: '⭐',
      desc: '아이템 3개를 컨테이너 정중앙(가로 & 세로 모두)에 배치하세요.',
      hint: 'justify-content: center + align-items: center 를 동시에 설정하세요.',
      target: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'center', alignItems:'center' },
      ignore: ['alignContent', 'gap'],
      itemCount: 3,
      accents: [1,2,3],
      miniStyle: { justifyContent:'center', alignItems:'center', height:'54px' },
    },
    {
      id: 2, title: '양끝 정렬 (네비게이션)', difficulty: '⭐',
      desc: '아이템을 좌우 양끝으로 나눠 배치하세요.',
      hint: 'justify-content: space-between 을 사용하세요.',
      target: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'space-between', alignItems:'center' },
      ignore: ['alignContent', 'gap'],
      itemCount: 3,
      accents: [1,5,2],
      miniStyle: { justifyContent:'space-between', alignItems:'center', height:'40px' },
    },
    {
      id: 3, title: '세로 쌓기 (열 방향)', difficulty: '⭐',
      desc: '아이템들이 세로로 쌓이도록 방향을 바꿔보세요.',
      hint: 'flex-direction: column 을 설정하세요.',
      target: { flexDirection:'column', flexWrap:'nowrap', justifyContent:'flex-start', alignItems:'stretch' },
      ignore: ['alignContent', 'gap'],
      itemCount: 3,
      accents: [1,2,3],
      miniStyle: { flexDirection:'column', alignItems:'stretch', gap:'4px', height:'70px' },
    },
    {
      id: 4, title: '줄 바꿈 그리드', difficulty: '⭐⭐',
      desc: '아이템이 넘치면 다음 줄로 내려가게 하세요.',
      hint: 'flex-wrap: wrap 을 설정하세요.',
      target: { flexDirection:'row', flexWrap:'wrap', justifyContent:'flex-start', alignItems:'flex-start' },
      ignore: ['alignContent', 'gap'],
      itemCount: 3,
      accents: [1,2,3],
      miniStyle: { flexWrap:'wrap', alignItems:'flex-start', gap:'4px', height:'auto' },
    },
    {
      id: 5, title: '균등 분배', difficulty: '⭐⭐',
      desc: '아이템 사이 간격을 포함해 모두 동일하게 분배하세요.',
      hint: 'justify-content: space-evenly 를 사용하세요.',
      target: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'space-evenly', alignItems:'center' },
      ignore: ['alignContent', 'gap'],
      itemCount: 4,
      accents: [1,2,3,4],
      miniStyle: { justifyContent:'space-evenly', alignItems:'center', height:'44px' },
    },
    {
      id: 6, title: '역방향 배치', difficulty: '⭐⭐',
      desc: '아이템이 오른쪽에서 왼쪽 순서로 나타나게 하세요.',
      hint: 'flex-direction: row-reverse 를 설정하세요.',
      target: { flexDirection:'row-reverse', flexWrap:'nowrap', justifyContent:'flex-start', alignItems:'center' },
      ignore: ['alignContent', 'gap'],
      itemCount: 3,
      accents: [1,2,3],
      miniStyle: { flexDirection:'row-reverse', alignItems:'center', height:'44px' },
    },
    {
      id: 7, title: '하단 정렬', difficulty: '⭐⭐⭐',
      desc: '아이템을 컨테이너 아래쪽에 붙여 배치하세요.',
      hint: 'align-items: flex-end 를 사용하세요. (주축이 row일 때 교차축이 세로입니다)',
      target: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'flex-start', alignItems:'flex-end' },
      ignore: ['alignContent', 'gap'],
      itemCount: 3,
      accents: [1,2,3],
      miniStyle: { alignItems:'flex-end', height:'60px' },
    },
    {
      id: 8, title: '사이드바 레이아웃', difficulty: '⭐⭐⭐',
      desc: '첫 아이템은 고정 너비, 두 번째 아이템은 남은 공간을 채우게 하세요.',
      hint: 'align-items: stretch + (아이템2에 flex-grow:1 적용)',
      target: { flexDirection:'row', flexWrap:'nowrap', justifyContent:'flex-start', alignItems:'stretch' },
      ignore: ['alignContent', 'gap'],
      itemCount: 2,
      accents: [1,2],
      miniStyle: { alignItems:'stretch', height:'52px' },
      itemWidths: ['40px','auto'],
      itemGrows: [0, 1],
    },
];

export default FLEX_CHALLENGES;
