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
  { id: 'research', label: '바이오 · 연구', en: 'Bio & Research', blurb: '논문 · 방법론 · 실험 도구', glyph: '△', tint: '#0f766e' },
  { id: 'science', label: '바이오 · 과학', en: 'Bio & Science', blurb: '생명과학 · 의학 · 기초과학', glyph: '✦', tint: '#0d9488' },
  { id: 'finance', label: '경제 · 인사이트', en: 'Economy & Insight', blurb: '기업 · 산업 · 거시 구조', glyph: '◇', tint: '#2563eb' },
  { id: 'world', label: '국제 정세', en: 'Global Insight', blurb: '외교 · 통상 · 기후 · 공급망', glyph: '◎', tint: '#3b82f6' },
  { id: 'tech', label: 'IT · 기술', en: 'Tech & AI', blurb: '반도체 · AI 인프라 · 보안', glyph: '▣', tint: '#4f46e5' },
  { id: 'review', label: '리뷰 · 실사용', en: 'Review', blurb: '장비 · 기기 · 일상 체험', glyph: '☆', tint: '#d97706' },
  { id: 'parenting', label: '육아 · 기록', en: 'Parenting', blurb: '관찰 · 성장 메모', glyph: '♡', tint: '#db2777' },
  { id: 'life', label: '일상', en: 'Life', blurb: '취미 · 관찰 · 메모', glyph: '○', tint: '#64748b' },
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
