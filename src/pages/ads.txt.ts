import type { APIRoute } from 'astro';
import { site } from '../data/site';

/**
 * ads.txt — the IAB file Google reads to confirm this domain authorises
 * AdSense to sell its inventory. Missing or wrong, AdSense reports the site as
 * unauthorised and holds back some demand.
 *
 * Generated rather than committed as a static file so it stays in step with
 * the publisher id in site.ts: no id, no file worth serving, so an empty
 * placeholder ships instead of a line naming a publisher that does not exist.
 */
export const GET: APIRoute = () => {
  const id = site.adsensePublisherId.trim();
  const body = id
    ? `google.com, ${id.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`
    : '# No AdSense publisher id configured yet — see site.ts\n';

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
