/**
 * GitHub OAuth proxy for the /admin editing screen.
 *
 * The CMS runs entirely in the browser, and a browser cannot hold a GitHub
 * client secret. This Worker is the only piece that does: it swaps the OAuth
 * code for a token server-side and hands the token back to the opener window.
 *
 * Routes
 *   GET /auth      -> redirect to GitHub's consent screen
 *   GET /callback  -> exchange the code, post the token to the opener
 *   GET /health    -> liveness
 *
 * Bindings (see wrangler.toml)
 *   GITHUB_CLIENT_ID      var
 *   GITHUB_CLIENT_SECRET  secret  (wrangler secret put GITHUB_CLIENT_SECRET)
 *   ALLOWED_ORIGINS       var, comma-separated site origins allowed to receive
 *                              a token. Anything else is refused.
 */

const STATE_COOKIE = 'justies_oauth_state';
const ORIGIN_COOKIE = 'justies_oauth_origin';
const SCOPE = 'repo,user';

const html = (body, status = 200) =>
  new Response(`<!doctype html><meta charset="utf-8">${body}`, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });

const allowedOrigins = (env) =>
  (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);

const cookie = (name, value, maxAge) =>
  `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

const readCookie = (request, name) => {
  const header = request.headers.get('cookie') ?? '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
};

/** Escapes a value before it is interpolated into an inline script. */
const jsonForScript = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

function handleAuth(request, env) {
  const url = new URL(request.url);
  const origins = allowedOrigins(env);

  if (!env.GITHUB_CLIENT_ID || origins.length === 0) {
    return html('<p>Worker is not configured: set GITHUB_CLIENT_ID and ALLOWED_ORIGINS.</p>', 500);
  }

  // Which site is asking. Default to the first allowed origin so a plain
  // /auth visit still works, but never trust an origin we do not know.
  const referrer = request.headers.get('referer');
  const asked = url.searchParams.get('site_id') ?? (referrer ? new URL(referrer).origin : null);
  const origin = origins.includes((asked ?? '').replace(/\/$/, '')) ? asked : origins[0];

  const state = crypto.randomUUID();
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', `${url.origin}/callback`);
  authorize.searchParams.set('scope', url.searchParams.get('scope') ?? SCOPE);
  authorize.searchParams.set('state', state);

  const headers = new Headers({ location: authorize.toString() });
  headers.append('set-cookie', cookie(STATE_COOKIE, state, 600));
  headers.append('set-cookie', cookie(ORIGIN_COOKIE, encodeURIComponent(origin), 600));
  return new Response(null, { status: 302, headers });
}

/** The handshake the CMS listens for on window.opener. */
function postToOpener(payload, targetOrigin) {
  const message = jsonForScript(`authorization:github:${payload.type}:${JSON.stringify(payload.body)}`);
  return html(`<title>인증 처리 중…</title>
<p style="font:16px system-ui;padding:2rem">창을 닫아도 됩니다.</p>
<script>
  (function () {
    var message = ${message};
    var target = ${jsonForScript(targetOrigin)};
    function send() { window.opener && window.opener.postMessage(message, target); }
    // The CMS answers with "authorizing:github" once its listener is ready.
    window.addEventListener('message', function (event) {
      if (event.origin === target) send();
    }, false);
    send();
    setTimeout(function () { window.close(); }, 3000);
  })();
</script>`);
}

async function handleCallback(request, env) {
  const url = new URL(request.url);
  const origins = allowedOrigins(env);
  const savedOrigin = readCookie(request, ORIGIN_COOKIE);
  const target = savedOrigin ? decodeURIComponent(savedOrigin) : origins[0];

  if (!origins.includes((target ?? '').replace(/\/$/, ''))) {
    return html('<p>Unknown origin.</p>', 403);
  }

  const state = url.searchParams.get('state');
  if (!state || state !== readCookie(request, STATE_COOKIE)) {
    return postToOpener({ type: 'error', body: { message: 'state mismatch' } }, target);
  }

  const code = url.searchParams.get('code');
  if (!code) {
    return postToOpener({ type: 'error', body: { message: 'missing code' } }, target);
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/callback`,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    return postToOpener(
      { type: 'error', body: { message: data.error_description ?? 'token exchange failed' } },
      target
    );
  }

  return postToOpener(
    { type: 'success', body: { token: data.access_token, provider: 'github' } },
    target
  );
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/health') {
      return new Response('ok', { headers: { 'cache-control': 'no-store' } });
    }
    if (pathname === '/auth') return handleAuth(request, env);
    if (pathname === '/callback') return handleCallback(request, env);

    return html('<p>제의 / JUSTIES — CMS auth. Nothing to see here.</p>', 404);
  },
};
