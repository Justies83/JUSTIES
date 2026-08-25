import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** 0 for `2026-08-21-slug`, 1 for `slug`. Lower sorts first. */
const datedFilename = (id: string) => (/^\d{4}-\d{2}-\d{2}-/.test(id) ? 0 : 1);

/** Everything on the public site reads this. Private posts never appear here. */
export async function getPublishedPosts(): Promise<Post[]> {
  return (await getAllPosts()).filter((p) => p.data.visibility !== 'private');
}

/** Only reachable under /private, behind the password gate. */
export async function getPrivatePosts(): Promise<Post[]> {
  return (await getAllPosts()).filter((p) => p.data.visibility === 'private');
}

/** Drafts are visible while developing, hidden in a production build. */
async function getAllPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort(
    (a, b) =>
      // Newest first.
      b.data.date.valueOf() - a.data.date.valueOf() ||
      // Several posts share a date. Among them, a date-prefixed filename is the
      // day's writing — that is what /admin and the scheduled runs produce —
      // while a bare filename is a standing guide that merely carries that date.
      // The day's writing goes first, or a guide would sit on the front page.
      datedFilename(a.id) - datedFilename(b.id) ||
      // Then stable, so the home page does not reshuffle between builds.
      a.id.localeCompare(b.id)
  );
}

export const postUrl = (post: Post) => `/posts/${post.id}`;

/**
 * The image to show for a post. A real photograph wins; otherwise fall back to
 * the plate generated at /covers/<id>.svg. Private posts have no generated
 * plate — that URL would be public — so they keep the inline seal.
 */
export const coverFor = (post: Post): string | undefined =>
  post.data.cover ?? (post.data.visibility === 'private' ? undefined : `/covers/${post.id}.svg`);

/**
 * The image to hand to social platforms and to structured data.
 *
 * Covers here are often SVG — the charts, and every generated plate — and
 * KakaoTalk, X and Facebook do not render SVG in a share card, nor does Google
 * accept it for a rich result. So a raster cover is used when there is one, and
 * otherwise the brand card, which is a PNG. Silently shipping an SVG here means
 * a shared link shows no picture at all.
 */
const RASTER = /\.(png|jpe?g|webp|gif)$/i;
export const socialImage = (post: Post): string =>
  post.data.cover && RASTER.test(post.data.cover) ? post.data.cover : '/og.png';

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

export function collectTags(posts: Post[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'ko'));
}

/** Same category first, then shared tags, then recency. */
export function relatedPosts(current: Post, all: Post[], limit = 3): Post[] {
  const score = (p: Post) => {
    let s = p.data.category === current.data.category ? 3 : 0;
    s += p.data.tags.filter((t) => current.data.tags.includes(t)).length;
    return s;
  };
  return all
    .filter((p) => p.id !== current.id)
    .sort((a, b) => score(b) - score(a) || b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, limit);
}
