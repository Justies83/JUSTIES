// Taxonomy has two independent axes:
//   category = what the entry is about
//   kind     = what shape it takes (clipped news / my opinion / reference note)
// Keeping them apart means a filter chip never has to become a folder.
//
// Adding a category is one line here. The home topic grid, /topics/<id>, the
// archive filters, the /admin dropdown and the search index all read from this
// list, so nothing else needs touching — and existing posts keep working, since
// a post's category is a field rather than a directory.

export const CATEGORIES = [
  { id: 'research', label: '연구', en: 'Research', blurb: '논문 · 방법론 · 실험 기록', glyph: '△', tint: '#16756a' },
  { id: 'science', label: '과학', en: 'Science', blurb: '생명과학 · 브리핑 · 리뷰', glyph: '✦', tint: '#2f6d4f' },
  { id: 'finance', label: '경제 · 산업', en: 'Finance', blurb: '시황 · 기업 · 거시 흐름', glyph: '◇', tint: '#8a5a2b' },
  { id: 'world', label: '국제 정세', en: 'World', blurb: '외교 · 정책 · 공급망', glyph: '◎', tint: '#3b5f8a' },
  { id: 'tech', label: 'IT · 기술', en: 'Tech', blurb: '도구 · 소프트웨어 · 실사용', glyph: '▣', tint: '#4a4f7a' },
  { id: 'review', label: '리뷰 · 소개', en: 'Review', blurb: '맛집 · 기기 · 장비', glyph: '☆', tint: '#a8562f' },
  { id: 'parenting', label: '육아', en: 'Parenting', blurb: '돌봄 · 성장 · 기록', glyph: '♡', tint: '#8a4a63' },
  { id: 'life', label: '일상', en: 'Life', blurb: '취미 · 관찰 · 메모', glyph: '○', tint: '#5f6b3a' },
] as const;

export const KINDS = [
  { id: 'news', label: '뉴스', en: 'News', blurb: '읽고 남긴 소식' },
  { id: 'opinion', label: '의견', en: 'Opinion', blurb: '내 해석과 판단' },
  { id: 'note', label: '정보', en: 'Note', blurb: '두고 참고할 기록' },
] as const;

/** Used by the generated cover art, one hue per section. */
export type CategoryId = (typeof CATEGORIES)[number]['id'];
export type KindId = (typeof KINDS)[number]['id'];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as unknown as [CategoryId, ...CategoryId[]];
export const KIND_IDS = KINDS.map((k) => k.id) as unknown as [KindId, ...KindId[]];

export const categoryOf = (id: string) => CATEGORIES.find((c) => c.id === id);
export const kindOf = (id: string) => KINDS.find((k) => k.id === id);
