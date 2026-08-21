// Everything an editor might want to change without touching a component.
export const site = {
  title: '제의 / JUSTIES',
  shortTitle: 'JUSTIES',
  seal: 'JUSTIES SHALL BE DONE.',
  tagline: '질문을 모으고, 생각을 남깁니다.',
  description:
    '연구와 세계, 금융과 기술, 취미와 돌봄 사이에서 오래 들여다본 것을 기록하는 개인 아카이브입니다.',
  keywords: ['제의', 'JUSTIES', '연구', '국제 정세', '금융', 'IT 정보', '육아', '개인 홈페이지'],
  locale: 'ko-KR',
  established: 2026,
  author: '제의 / JUSTIES',

  nav: [
    { href: '/', label: '홈' },
    { href: '/archive', label: '기록' },
    { href: '/topics', label: '주제' },
    { href: '/about', label: '소개' },
  ],

  // "지금 무엇을 보고 있나" — 완결된 글이 되기 전의 메모.
  now: {
    updated: '2026.08',
    items: [
      { verb: 'READING', text: '연구 재현성에 관한 긴 논문 한 편' },
      { verb: 'TESTING', text: '작은 메모를 오래 남기는 도구들' },
      { verb: 'WATCHING', text: 'AI 인프라와 전력 수요의 접점' },
      { verb: 'COLLECTING', text: '작은 인터랙션과 경험 설계의 사례' },
    ],
  },

  principles: [
    '직접 읽고, 확인한 것을 남깁니다.',
    '사실과 해석을 구분합니다.',
    '취향에도 이유를 붙입니다.',
  ],

  disclaimers: [
    '글에는 가능한 한 출처와 갱신일을 남깁니다.',
    '시장 관련 기록은 연구·학습 목적이며 투자 권유가 아닙니다.',
  ],
};
