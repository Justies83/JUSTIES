# CMS 인증 Worker

`/admin` 편집 화면이 GitHub으로 로그인할 때 쓰는 프록시입니다.
브라우저는 GitHub client secret을 가질 수 없으므로, 그 교환만 이 Worker가 대신합니다.

**글은 이 Worker를 거치지 않습니다.** 로그인 절차에만 관여하므로, NAS로 옮긴 뒤에는
로컬 편집 모드를 쓰고 이 Worker를 그냥 버려도 됩니다.

## 1. GitHub OAuth App 만들기

<https://github.com/settings/developers> → **New OAuth App**

| 항목 | 값 |
| --- | --- |
| Application name | `JUSTIES CMS` |
| Homepage URL | `https://justies.justies.workers.dev` |
| Authorization callback URL | `https://justies-cms-auth.justies.workers.dev/callback` |

만든 뒤 **Client ID**를 복사하고, **Generate a new client secret** 으로 secret을 만들어 둡니다.
secret은 이 화면을 벗어나면 다시 볼 수 없습니다.

> GitHub **App** 이 아니라 **OAuth App** 입니다. 메뉴가 둘 다 있어 헷갈리기 쉽습니다.

## 2. Worker 배포

```bash
cd worker

# wrangler.toml 의 GITHUB_CLIENT_ID 와 ALLOWED_ORIGINS 를 실제 값으로 수정
npx wrangler secret put GITHUB_CLIENT_SECRET     # 1단계의 secret 붙여넣기
npx wrangler deploy
```

배포된 주소(`https://justies-cms-auth.justies.workers.dev`)를 확인하고,
1단계의 callback URL과 정확히 일치하는지 다시 봅니다. 여기가 가장 자주 틀리는 지점입니다.

```bash
curl https://justies-cms-auth.justies.workers.dev/health   # -> ok
```

## 3. 사이트에 연결

`public/admin/config.yml` 의 `backend.base_url` 을 배포된 Worker 주소로 맞춥니다.
`ALLOWED_ORIGINS` 에 없는 주소에서 열면 토큰을 내주지 않습니다 — 의도된 동작입니다.

## 무료 한도

Workers 무료 플랜은 하루 10만 요청입니다. 이 Worker는 로그인할 때만 두 번 호출되므로
사실상 소진되지 않습니다.

## NAS로 옮긴 뒤

로그인 없이 파일을 직접 편집하는 모드로 바꿉니다.

1. `public/admin/config.yml` 에서 `backend` 블록을 지우거나 주석 처리
2. `local_backend: true` 유지
3. NAS에서 `npm run dev` → `/admin` → **Work with Local Repository**

이 시점부터 GitHub도, 이 Worker도 필요하지 않습니다.
