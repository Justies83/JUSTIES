import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Where the site is published. Change this line when a custom domain or the
// NAS takes over; nothing else in the codebase holds an absolute URL.
const PRODUCTION_URL = 'https://justies.justies.workers.dev';

// Resolved in order of how specific the source is:
//   1. SITE_URL      — explicit override (NAS, or any one-off build)
//   2. CF_PAGES_URL  — injected by Cloudflare Pages. Workers Builds does NOT
//                      set it, which is why a default below is required
//   3. PRODUCTION_URL / localhost
const isDev = process.env.npm_lifecycle_event === 'dev';
const site =
  process.env.SITE_URL ||
  process.env.CF_PAGES_URL ||
  (isDev ? 'http://localhost:4321' : PRODUCTION_URL);

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: true },
  },
});
