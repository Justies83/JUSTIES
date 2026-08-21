import type { APIRoute } from 'astro';

// The Sitemap directive has to be an absolute URL — a path is not valid per the
// robots.txt spec, and this file was shipping one. Generating it means the URL
// follows whatever host the build is for, including a custom domain later.
export const GET: APIRoute = ({ site, url }) => {
  const origin = (site ?? new URL(url.origin)).origin;
  const body = [
    'User-agent: *',
    'Allow: /',
    // Password-gated. Not secret, but nothing to index.
    'Disallow: /admin',
    'Disallow: /private',
    // A build artefact for the search box, not a page.
    'Disallow: /search-index.json',
    '',
    `Sitemap: ${origin}/sitemap-index.xml`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
