import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The public address, resolved in order of how specific it is:
//   1. SITE_URL      — set it once a custom domain exists, or on the NAS
//   2. CF_PAGES_URL  — injected by Cloudflare Pages, so a fresh project needs
//                      no configuration at all to get correct canonical URLs
//   3. localhost      — development
// Never hardcode an absolute URL anywhere else; canonical tags, RSS, the
// sitemap and the social card all read from here.
const site = process.env.SITE_URL || process.env.CF_PAGES_URL || 'http://localhost:4321';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: true },
  },
});
