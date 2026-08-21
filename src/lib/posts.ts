import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** Drafts are visible while developing, hidden in a production build. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const postUrl = (post: Post) => `/posts/${post.id}`;

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

/** Korean prose runs ~500 characters a minute; close enough for a hint. */
export function readingTime(body: string | undefined): number {
  const chars = (body ?? '').replace(/\s+/g, '').length;
  return Math.max(1, Math.round(chars / 500));
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
