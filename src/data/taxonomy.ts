// Taxonomy has two independent axes:
//   category = what the entry is about
//   kind     = what shape it takes (clipped news / my opinion / reference note)
// Keeping them apart means a filter chip never has to become a folder.

export const CATEGORIES = [
  { id: 'research', label: '연구', en: 'Research', blurb: '논문 · 방법론 · 실험 기록', glyph: '△' },
  { id: 'science', label: '과학', en: 'Science', blurb: '생명과학 · 브리핑 · 리뷰', glyph: '✦' },
  { id: 'world', label: '국제 정세', en: 'World', blurb: '외교 · 정책 · 공급망', glyph: '◎' },
  { id: 'finance', label: '금융 · 산업', en: 'Finance', blurb: '기업 · 시황 · 거시 흐름', glyph: '◇' },
  { id: 'tech', label: 'IT 정보', en: 'Tech', blurb: '도구 · 기술 · 실사용', glyph: '▣' },
  { id: 'life', label: '일상 · 육아', en: 'Life', blurb: '돌봄 · 취미 · 관찰', glyph: '♡' },
] as const;

export const KINDS = [
  { id: 'news', label: '뉴스', en: 'News', blurb: '읽고 남긴 소식' },
  { id: 'opinion', label: '의견', en: 'Opinion', blurb: '내 해석과 판단' },
  { id: 'note', label: '정보', en: 'Note', blurb: '두고 참고할 기록' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];
export type KindId = (typeof KINDS)[number]['id'];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as unknown as [CategoryId, ...CategoryId[]];
export const KIND_IDS = KINDS.map((k) => k.id) as unknown as [KindId, ...KindId[]];

export const categoryOf = (id: string) => CATEGORIES.find((c) => c.id === id);
export const kindOf = (id: string) => KINDS.find((k) => k.id === id);
