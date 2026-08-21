/**
 * Password gate in front of /admin and /private.
 *
 * The site is a Worker serving static assets, and `run_worker_first` in
 * wrangler.toml routes only those paths through this script — every other
 * request goes straight to the asset store and never pays for this code.
 *
 * /admin is the editor. /private holds posts marked `visibility: private`,
 * which the public build leaves out of every list, feed, sitemap and search
 * index. One password covers both.
 *
 * The password lives as a Cloudflare secret and is compared here, on the edge,
 * so it is never shipped to a browser. Without the cookie the editor's HTML is
 * not served at all. This gate is separate from, and on top of, the GitHub
 * authentication the editor itself performs: this one decides who may see the
 * screen, GitHub decides who may write to the repository.
 *
 * Bindings (wrangler.toml)
 *   ASSETS           the static asset store
 *   ADMIN_PASSWORD   secret; also the HMAC key, so changing the password
 *                    immediately invalidates every existing session
 */

const COOKIE = 'justies_admin';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const LOGIN_PATH = '/admin/__login';
const LOGOUT_PATH = '/admin/__logout';

// Path prefixes this gate stands in front of. Must stay in step with
// `run_worker_first` in wrangler.toml — a prefix listed there but not here
// would be served without a check.
const PROTECTED = ['/admin', '/private'];
const isProtected = (pathname) =>
  PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const enc = new TextEncoder();

/** Constant-time comparison, so a wrong password leaks no timing signal. */
function timingSafeEqual(a, b) {
  const x = enc.encode(a);
  const y = enc.encode(b);
  // Compare a fixed number of bytes either way; length still differs, which is
  // unavoidable and not sensitive here.
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i += 1) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

async function sign(value, key) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(value));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function issueCookie(password) {
  const expires = Date.now() + MAX_AGE * 1000;
  const token = `${expires}.${await sign(String(expires), password)}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

async function cookieIsValid(request, password) {
  const header = request.headers.get('cookie') ?? '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return false;

  const [expires, mac] = match[1].split('.');
  if (!expires || !mac) return false;
  if (Number(expires) < Date.now()) return false;
  return timingSafeEqual(mac, await sign(expires, password));
}

function loginPage({ error = false, next = '/admin' } = {}) {
  const forPrivate = next.startsWith('/private');
  const body = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${forPrivate ? '숨긴 기록' : '편집 화면'} · 제의 / JUSTIES</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
  :root {
    --paper:#f4f1ea; --ink:#20231f; --soft:#62655d; --teal:#16756a;
    --line:rgba(32,35,31,.16); --card:#fbf9f4; --coral:#e0795b;
  }
  @media (prefers-color-scheme: dark) {
    :root { --paper:#171a18; --ink:#eae6dd; --soft:#a4aba5; --teal:#7fc9ab;
            --line:rgba(234,230,221,.16); --card:#1f2321; --coral:#f0a184; }
  }
  *{box-sizing:border-box}
  body {
    margin:0; min-height:100dvh; display:grid; place-items:center; padding:1.5rem;
    background-color:var(--paper);
    background-image:radial-gradient(rgba(128,128,128,.09) .55px, transparent .7px);
    background-size:8px 8px;
    color:var(--ink);
    font-family:'IBM Plex Sans KR',-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;
  }
  form {
    width:min(23rem,100%); display:grid; gap:.9rem;
    border:1px solid var(--line); border-radius:14px; background:var(--card);
    padding:1.6rem 1.4rem;
    box-shadow:0 1px 2px rgba(0,0,0,.04), 0 14px 30px -20px rgba(0,0,0,.4);
  }
  .mark {
    width:38px; height:38px; display:grid; place-items:center;
    border:1px solid var(--line); border-radius:11px;
    font-family:Georgia,serif; color:var(--teal);
  }
  h1 { margin:.3rem 0 0; font-size:1.25rem; font-family:Georgia,'Noto Serif KR',serif; font-weight:600; }
  p { margin:0; font-size:.88rem; color:var(--soft); line-height:1.6; }
  label { font-family:ui-monospace,monospace; font-size:.68rem; letter-spacing:.14em;
          text-transform:uppercase; color:var(--soft); }
  input {
    width:100%; font:inherit; font-size:1rem; padding:.7rem .8rem; color:var(--ink);
    background:var(--paper); border:1px solid var(--line); border-radius:9px;
  }
  input:focus-visible { outline:2px solid var(--teal); outline-offset:2px; }
  button {
    font:inherit; font-size:.95rem; font-weight:500; cursor:pointer;
    padding:.7rem 1rem; min-height:46px; border-radius:999px;
    background:var(--ink); color:var(--paper); border:1px solid var(--ink);
  }
  button:hover { background:var(--teal); border-color:var(--teal); color:#fff; }
  .error { color:var(--coral); font-size:.85rem; }
  a { color:var(--soft); font-size:.82rem; }
</style>
</head>
<body>
  <form method="POST" action="${LOGIN_PATH}">
    <span class="mark" aria-hidden="true">제</span>
    <h1>${forPrivate ? '숨긴 기록' : '편집 화면'}</h1>
    <p>${forPrivate ? '비공개 기록을 보려면' : '기록을 작성하려면'} 비밀번호를 입력하세요.</p>
    <input type="hidden" name="next" value="${next}">
    <label for="pw">PASSWORD</label>
    <input id="pw" name="password" type="password" autocomplete="current-password"
           autofocus required>
    ${error ? '<p class="error">비밀번호가 맞지 않습니다.</p>' : ''}
    <button type="submit">들어가기</button>
    <a href="/">← 사이트로 돌아가기</a>
  </form>
</body>
</html>`;

  return new Response(body, {
    status: error ? 401 : 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

/** Only protected same-origin paths, so the form is not an open redirect. */
function safeNext(value) {
  return typeof value === 'string' && isProtected(value) ? value : '/admin';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const password = env.ADMIN_PASSWORD;

    // Refuse rather than fall open if the secret was never set.
    if (!password) {
      return new Response('ADMIN_PASSWORD is not configured.', {
        status: 503,
        headers: { 'cache-control': 'no-store' },
      });
    }

    if (url.pathname === LOGOUT_PATH) {
      return new Response(null, {
        status: 302,
        headers: {
          location: '/',
          'set-cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
          'cache-control': 'no-store',
        },
      });
    }

    if (url.pathname === LOGIN_PATH) {
      if (request.method !== 'POST') return loginPage();
      const form = await request.formData();
      const next = safeNext(form.get('next'));
      if (!timingSafeEqual(String(form.get('password') ?? ''), password)) {
        // Blunts trivial online guessing without any shared state.
        await new Promise((resolve) => setTimeout(resolve, 700));
        return loginPage({ error: true, next });
      }
      return new Response(null, {
        status: 302,
        headers: {
          location: next,
          'set-cookie': await issueCookie(password),
          'cache-control': 'no-store',
        },
      });
    }

    if (!(await cookieIsValid(request, password))) {
      return loginPage({ next: url.pathname });
    }

    // Past the gate: hand the request to the static files behind it.
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('cache-control', 'no-store');
    headers.set('x-robots-tag', 'noindex, nofollow');
    return new Response(response.body, { status: response.status, headers });
  },
};
