// 상도15구역 landing page: what is known about the zone, and the shape of the
// transaction file that a later collection script will write.
//
// Facts below were read from the cited pages on `checked`; the stage moves on
// every few months, so the page links the city's own tracker instead of
// pretending to be current.

export const ZONE = {
  name: '상도15구역',
  district: '서울 동작구 상도동 279번지 일대',
  method: '주택정비형 재개발 · 신탁방식',
  checked: '2026-10-25',
  facts: [
    { label: '구역면적', value: '약 14.1만㎡' },
    { label: '계획', value: '3,204가구 · 지하 8층~지상 35층' },
    { label: '사업시행자', value: '대신자산신탁' },
    { label: '시공사', value: '대우건설' },
  ],
  timeline: [
    { date: '2025-04-03', event: '정비구역 결정 고시' },
    { date: '2025-06', event: '신탁방식 사업시행자 승인' },
    { date: '2025-08', event: '정비사업위원회 구성' },
    { date: '2026-08', event: '대우건설 시공사 선정 보도. 연내 사업시행계획인가 신청 목표' },
  ],
  tracker: 'https://cleanup.seoul.go.kr',
  sources: [
    { title: '서울시 주택분야 누리집 — 상도15구역', href: 'https://news.seoul.go.kr/citybuild/archives/531609' },
    {
      title: '머니투데이방송 — 사업시행인가 채비',
      href: 'https://news.mtn.co.kr/news-detail/2026081917314029931',
    },
  ],
} as const;

export type TradeKind = '연립다세대' | '아파트' | '분양권전매';

export type Trade = {
  /** YYYY-MM-DD */
  date: string;
  kind: TradeKind;
  /** 건물명 or 지번 as the ministry publishes it. */
  where: string;
  /** 전용면적, ㎡ */
  area: number;
  floor: number | null;
  /** 만원 */
  price: number;
};

export type TradeFile = {
  /** ISO timestamp of the last collection run; null before the first. */
  updated: string | null;
  /** Cancelled (해제) deals are dropped before they are written. */
  trades: Trade[];
};
