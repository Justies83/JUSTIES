// Everything an editor might want to change without touching a component.
export const site = {
  title: '제의 / JUSTIES',
  shortTitle: 'JUSTIES',
  seal: 'JUSTIES SHALL BE DONE.',
  tagline: '바이오 연구의 시선으로 읽는 과학과 세계 경제',
  description:
    '생명과학 연구자의 시선으로 바이오·의학 논문과 경제·산업·국제 정세의 구조를 직접 읽고 정리하는 개인 인사이트 블로그입니다.',
  keywords: [
    '제의',
    'JUSTIES',
    '바이오',
    '생명과학',
    '연구',
    '의학',
    '경제 인사이트',
    '국제 정세',
    '반도체',
    'AI',
    '논문 리뷰',
    '개인 블로그',
  ],
  locale: 'ko-KR',
  established: 2026,
  author: '제의 / JUSTIES',

  // Paste the codes the two consoles hand out; leaving one empty omits its tag.
  //   Google  → Search Console → 소유권 확인 → HTML 태그
  //   Naver   → 서치어드바이저 → 사이트 소유확인 → HTML 태그
  verification: {
    google: 'ergy5mBkvkAmIqBCskjpLwCwFC6ueE_v0BjKrW5XZ3w',
    naver: '0ca582aea8ea2e8effe92a134c5c44a84b84f6ce',
  },

  // Shown on /privacy when set. Left empty on purpose — publishing an address
  // is a decision for its owner, not a default. AdSense wants a way to be
  // contacted, so fill this in before applying.
  contact: 'justrnafather@gmail.com',

  // Google AdSense. Paste the publisher id here (the "ca-pub-0000000000000000"
  // AdSense shows after it accepts the site) and two things switch on at once:
  // the loader script in <head>, and /ads.txt — which Google checks to confirm
  // this domain is allowed to sell its own inventory. An empty string ships
  // neither, so nothing about ads reaches a reader until the id is real.
  adsensePublisherId: 'ca-pub-3148481877619822',

  nav: [
    { href: '/', label: '홈' },
    { href: '/papers', label: '논문' },
    { href: '/archive', label: '기록' },
    { href: '/topics', label: '주제' },
    { href: '/tools', label: 'Tools' },
    { href: '/about', label: '소개' },
    { href: '/contact', label: '연락처' },
  ],

  principles: [
    '원문을 직접 열어 보고 씁니다.',
    '사실과 제 해석을 따로 적습니다.',
    '확인 못 한 것은 확인 못 했다고 적습니다.',
  ],

  disclaimers: [
    '글에는 출처와 날짜를 남깁니다.',
    '시장 관련 글은 기록이지 투자 권유가 아닙니다.',
  ],
};
