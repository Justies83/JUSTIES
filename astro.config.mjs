import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL is the single knob that follows the site across hosts:
//   Cloudflare Pages -> https://<project>.pages.dev
//   custom domain    -> https://example.com
//   NAS (tunnel/LAN) -> https://notes.example.com or http://nas.local:8080
// Never hardcode an absolute URL anywhere else; canonical tags, RSS and
// OG images all read from here.
const site = process.env.SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: true },
  },
});
