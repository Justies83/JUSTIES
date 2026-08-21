import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { categoryOf, kindOf } from '../data/taxonomy';
import { getPublishedPosts, postUrl } from '../lib/posts';

export const GET: APIRoute = async (context) => {
  const posts = await getPublishedPosts();
  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? 'http://localhost:4321',
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.takeaway,
      pubDate: post.data.date,
      link: postUrl(post),
      categories: [categoryOf(post.data.category)?.label, kindOf(post.data.kind)?.label, ...post.data.tags].filter(
        (v): v is string => Boolean(v)
      ),
    })),
    customData: `<language>ko-kr</language>`,
  });
};
