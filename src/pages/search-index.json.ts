import type { APIRoute } from 'astro';
import { categoryOf, kindOf } from '../data/taxonomy';
import { formatDate, getPublishedPosts, postUrl } from '../lib/posts';

// A flat JSON index, fetched lazily the first time the search dialog opens.
// Small enough to scan with String.includes; no search service involved.
export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const entries = posts.map((post) => {
    const category = categoryOf(post.data.category)?.label ?? '';
    const kind = kindOf(post.data.kind)?.label ?? '';
    return {
      title: post.data.title,
      takeaway: post.data.takeaway,
      url: postUrl(post),
      category,
      kind,
      tags: post.data.tags,
      date: formatDate(post.data.date),
      text: [post.data.title, post.data.takeaway, category, kind, ...post.data.tags, post.body ?? '']
        .join(' ')
        .toLowerCase(),
    };
  });

  return new Response(JSON.stringify(entries), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
