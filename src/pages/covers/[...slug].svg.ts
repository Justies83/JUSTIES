import type { APIRoute, GetStaticPaths } from 'astro';
import { coverSvg } from '../../lib/cover';
import { getPublishedPosts, type Post } from '../../lib/posts';

// One SVG per public post, built alongside the pages. Private posts are left
// out on purpose: their art would sit on a public URL and give away the
// section and existence of a post the gate is meant to hide.
export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
};

export const GET: APIRoute = ({ props }) =>
  new Response(coverSvg((props as { post: Post }).post), {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      // Filename is stable and so is the art, but a post's section can be
      // edited — let a browser revalidate rather than hold it for a year.
      'cache-control': 'public, max-age=3600',
    },
  });
