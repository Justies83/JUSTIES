# 제의 / JUSTIES — 개인 아카이브

뉴스 · 의견 · 정보를 직접 기록하는 개인 홈페이지입니다.
정적 사이트(Astro)로 만들어져 **글은 전부 마크다운 파일**이고, 호스팅은 어디로든 옮길 수 있습니다.

```
src/content/posts/*.md   ← 데이터베이스 (글 하나 = 파일 하나)
src/data/taxonomy.ts     ← 주제 · 형식 분류
src/data/site.ts         ← 제목, 메뉴, "지금 관찰 중", 원칙 등 문구
```

## 명령

| 명령 | 설명 |
| --- | --- |
| `npm install` | 처음 한 번 |
| `npm run dev` | 개발 서버 (http://localhost:4321) — 초안(`draft: true`)도 보입니다 |
| `npm run build` | `dist/` 로 정적 파일 생성 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run check` | 프론트매터 · 타입 검사 |
| `npm run og` | 기본 소셜 이미지(`public/og.png`) 다시 생성 — 브랜드 아트가 바뀔 때만 |
| `npm run requests` | 대기 중인 글 요청 목록 |
| `npm run preprints 2026-08-20` | 그날 bioRxiv 프리프린트 조회 |

## 글 쓰기

`src/content/posts/` 에 `.md` 파일을 만듭니다. 파일 이름이 주소가 됩니다.

```markdown
---
title: 글 제목
date: 2026-08-21
category: review        # research | science | finance | world | tech | review | parenting | life
kind: note              # news | opinion | note
takeaway: 목록 카드에 보이는 한 줄 요약.
tags: [태그1, 태그2]
# --- 선택 항목 ---
# updated: 2026-08-25
# source: { name: 출처 이름, url: https://... }
# cover: /images/example.jpg
# coverAlt: 이미지 설명
# gallery:                        # 본문 아래 사진 격자
#   - { image: /images/a.jpg, caption: 설명 }
#   - { image: /images/b.jpg, caption: '' }
# featured: true        # 홈 상단으로 끌어올림 (없으면 그냥 최신순)
# draft: true           # 배포된 사이트에서는 숨김
---

본문은 마크다운.
```

필수는 `title` `date` `category` `kind` `takeaway` 다섯 개입니다.
형식이 틀리면 빌드가 실패하면서 어느 파일의 어느 항목이 문제인지 알려 줍니다.

파일 하나를 추가하면 홈 목록, 주제 페이지, 태그 페이지, 검색 색인, RSS, 사이트맵이 함께 갱신됩니다.

홈 상단 세 칸은 **최신 글**입니다. `featured: true` 는 순서를 앞으로 당기는 핀일 뿐,
자리를 계속 차지하지 않습니다 — 오래된 글이 고정된 채 첫 화면에 남지 않습니다.
같은 날짜의 글이 여럿이면 날짜가 붙은 파일명(`2026-08-21-...`)이 먼저 옵니다.
그날 쓴 글이 상시 안내 글보다 앞에 오게 하기 위한 규칙입니다.

### 분류 늘리기 · 쪼개기

`src/data/taxonomy.ts` 의 `CATEGORIES` 에 한 줄을 추가하면 홈의 주제 카드, 필터 칩,
`/topics/<id>` 페이지, `/admin` 드롭다운, 검색 색인, 푸터 목록이 **한꺼번에** 따라옵니다.
폴더를 만들 필요가 없습니다.

분류는 폴더가 아니라 글의 **항목**이므로, 나중에 쪼개도 기존 글이 깨지지 않습니다.
예를 들어 `life` 안에 쌓인 육아 글을 분리하려면 `parenting` 을 한 줄 추가하고
해당 글들의 `category` 값만 바꾸면 됩니다 — 홈의 새 글 목록에는 그 글의 사진과
분류 이름이 그대로 함께 나옵니다.

### 이미지 · 사진 여러 장

`public/images/` 에 넣고 `/images/파일명` 으로 참조합니다.
사진이 여러 장인 글은 `gallery` 항목을 쓰면 본문 아래에 격자로 놓입니다.
본문 중간에 넣을 사진은 마크다운 이미지 문법(또는 편집 화면의 이미지 버튼)을 씁니다. 외부 CDN을 쓰지 않기 때문에
저장소만 옮기면 이미지도 함께 따라옵니다.

`cover` 를 비워 두면 **표지가 자동으로 생성됩니다** (`/covers/<파일명>.svg`).
분류가 색을, 파일명 해시가 문양을 정하므로 글마다 다른 그림이 나오고, 다시 빌드해도
같은 그림이 유지됩니다. 커밋되는 파일은 없습니다 — 빌드가 만들어 냅니다.
사진이나 도표를 `cover` 에 넣으면 그것이 우선합니다.

카카오톡·트위터 등에 공유될 때 쓰이는 기본 카드 이미지는 `public/og.png` 입니다.
글에 `cover` 가 있으면 그 이미지가, 없으면 이 기본 카드가 쓰입니다. 제목과 요약은
`og:title` / `og:description` 으로 따로 전달되므로 이미지에 한글을 새길 필요는 없습니다.

## `/admin` — 브라우저에서 글쓰기

푸터의 **편집** 링크로 들어갑니다. 관문이 두 겹입니다.

| 단계 | 무엇을 막는가 | 어디서 검사하는가 |
| --- | --- | --- |
| **1. 비밀번호** | 편집 화면을 *보는* 것 | Cloudflare 엣지 (`gate/index.js`) |
| **2. GitHub 인증** | 저장소에 *쓰는* 것 | 편집기 ↔ GitHub |

1단계 비밀번호는 Cloudflare secret(`ADMIN_PASSWORD`)에 있고 브라우저로 내려가지
않습니다. 통과하지 못하면 편집 화면의 HTML 자체가 전달되지 않습니다. 통과하면 30일간
유효한 서명 쿠키를 받습니다. 비밀번호를 바꾸면 기존 세션이 모두 무효가 됩니다.

```bash
npx wrangler secret put ADMIN_PASSWORD    # 비밀번호 변경
```

로그아웃은 `/admin/__logout` 입니다.

`run_worker_first` 로 `/admin` 경로만 이 스크립트를 지나가고, 공개 페이지는 정적
자산에서 곧바로 나갑니다 — 관문이 사이트 속도에 영향을 주지 않습니다.

2단계 로그인 방식은 세 가지이고, 모두 같은 마크다운 파일을 씁니다.

| 방식 | 쓰는 곳 | 필요한 것 |
| --- | --- | --- |
| **토큰 붙여넣기** | 원격 저장소에 커밋 | GitHub 토큰 1개. **기본 권장** |
| **로컬 저장소** | 내 디스크의 파일을 직접 | `npm run dev` 뿐. 네트워크 불필요 |
| GitHub 원클릭 로그인 | 원격 저장소에 커밋 | OAuth App + 인증 Worker (`worker/README.md`) |

혼자 쓰는 사이트라면 세 번째는 필요 없습니다. 토큰을 한 번 붙여넣으면 브라우저가
기억하고, 편의성 차이는 최초 로그인 한 번뿐입니다.

### 토큰 만들기

<https://github.com/settings/personal-access-tokens> → **Generate new token**

| 항목 | 값 |
| --- | --- |
| Repository access | Only select repositories → `Justies83/JUSTIES` |
| Permissions → Contents | **Read and write** |
| Expiration | 원하는 기간 (만료되면 다시 발급) |

`/admin` → **Sign In Using Access Token** 에 붙여넣습니다. 이 토큰은 이 저장소의
파일을 고칠 수 있을 뿐이며, 계정 전체 권한이 아닙니다.

NAS로 옮긴 뒤에는 로컬 저장소 방식만 쓰면 되고, 토큰도 Worker도 버려도 됩니다.
편집 화면 자체(`public/admin/sveltia-cms.js`)는 npm 패키지에서 복사해 넣기 때문에
CDN에 의존하지 않습니다 — `npm run build` 가 알아서 처리합니다.

폼의 항목과 `src/content.config.ts` 의 스키마는 **한 쌍**입니다. 항목을 늘릴 때는
`public/admin/config.yml` 과 스키마를 함께 고쳐야 합니다.

새 글의 파일 이름에는 날짜가 붙습니다(`2026-08-24-주간-브리핑.md`). 주간 브리핑처럼
같은 제목이 반복되는 글에서 이름이 겹치지 않게 하기 위한 것입니다.

## 주제만 던져 두고 글을 받기

`/admin` 에 **글 요청** 이라는 두 번째 항목이 있다. 주제 한 줄만 넣어 저장하면
`content/requests/` 에 파일이 하나 생기고, 예약 실행이 그것을 읽어 글을 쓴다.

| 입력 | 뜻 |
| --- | --- |
| **무엇에 대해 쓸까요** | 필수. `8월 CPI 발표 정리` 처럼 한 줄 |
| 덧붙일 말 | 강조할 점, 빼야 할 내용, 관점 |
| 참고 링크 | 근거로 쓸 주소. 넣으면 반드시 그 원문을 열고 쓴다 |
| 섹션 · 형식 | 비워 두면 주제에 맞게 고른다 |
| 초안으로만 | 켜면 `draft: true` 로 저장 — 검토 후 직접 발행 |

처리 주기는 두 가지다.

- **3시간마다** — 요청만 확인한다. 없으면 아무것도 하지 않는다
- **매일 06:00** — 요청을 먼저 처리하고, 그다음 뉴스 브리핑

요청은 사이트에 발행되지 않는다. Astro는 `src/content/posts/` 만 읽는다.
처리가 끝나면 예약 실행이 그 요청 파일의 `상태` 를 `완료` 로 바꾸고 `결과` 에 글 주소를
적으므로, 같은 요청이 두 번 처리되지 않고 이력이 남는다.

뉴스 브리핑과 달리 **요청은 섹션 제한이 없다.** 리뷰나 육아 주제를 요청해도 쓴다.
다만 직접 겪어야 아는 것(맛집 방문기, 기기 실사용)은 자료로 대신할 수 없으니,
그런 요청은 무엇이 필요한지 보고하고 남겨 둔다.

## 배포

주소는 `astro.config.mjs` 의 `PRODUCTION_URL` 한 줄에서 결정됩니다.
코드의 다른 어디에도 절대 URL은 없습니다.

1. `SITE_URL` 환경변수 — 있으면 최우선 (NAS, 일회성 빌드)
2. `CF_PAGES_URL` — Cloudflare **Pages** 가 자동으로 넣는 값. Workers 배포에는 없음
3. `PRODUCTION_URL` (빌드) / `http://localhost:4321` (`npm run dev`)

### Cloudflare Workers (현재)

**https://justies.net** (`justies.justies.workers.dev` 도 계속 살아 있습니다)

도메인은 루트 `wrangler.toml` 의 `[[routes]] custom_domain = true` 한 줄로 붙습니다.
Cloudflare가 DNS 레코드와 인증서를 그 줄에서 직접 만들기 때문에 대시보드에서
누를 것이 없습니다. 도메인을 바꿀 때 함께 고쳐야 하는 곳은 세 군데입니다 —
`wrangler.toml` 의 route, `astro.config.mjs` 의 `PRODUCTION_URL`,
그리고 `worker/wrangler.toml` 의 `ALLOWED_ORIGINS`. 마지막 하나를 빠뜨리면
사이트는 열리지만 `/admin` 의 GitHub 로그인만 조용히 거부됩니다.

Pages 대신 Workers를 쓰는 것이 현재 권장 경로입니다. Cloudflare는 정적 자산과 SSR을
모두 Workers가 처리하게 되면서 **신규 프로젝트는 Workers로 시작할 것**을 권하고 있고,
앞으로의 투자와 기능 개발도 Workers에 집중한다고 밝혔습니다(Pages는 계속 지원).
정적 사이트는 Workers에서도 무료입니다.

이 사이트에는 Workers여야 하는 이유가 하나 더 있습니다 — `/admin` 비밀번호 관문이
`run_worker_first` 로 동작합니다. Pages로 옮기면 이 관문을 Pages Functions 미들웨어로
다시 써야 합니다.

대시보드의 저장소 가져오기 흐름은 Pages 프로젝트가 아니라 **정적 자산을 가진 Worker**
를 만들고, push마다 `wrangler deploy` 를 실행합니다. 배포 설정은 저장소 루트의
`wrangler.toml` 에 있습니다 — 후행 슬래시 처리와 404 페이지가 여기서 정해집니다.

| 항목 | 값 |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| 환경변수 | 없음 |

`www.justies.net` 은 연결돼 있지 않습니다. 붙이려면 대시보드에서 Redirect Rule
하나(www → apex)를 만들어야 하고, 이 저장소가 쓰는 API 토큰에는 DNS·Zone 권한이
없어 코드에서 처리할 수 없습니다. 사이트 안의 어떤 링크도 www를 쓰지 않으므로
없어도 동작에는 문제가 없습니다.

`public/_headers` 는 Workers 정적 자산 배포에서도 적용됩니다 — 라이브 응답에
`x-frame-options`, `referrer-policy`, `x-content-type-options`, `permissions-policy`
가 실려 오는 것으로 확인했습니다. NAS(nginx)에서는 같은 헤더를 `docker/nginx.conf`
가 설정합니다.

## 배포는 GitHub Actions가 합니다

`.github/workflows/deploy.yml` 이 이 브랜치로의 push마다 빌드하고 배포합니다.
`/admin` 에서 저장한 글이 사이트에 나타나는 것도 이 경로입니다 — CMS가 커밋하면
Actions가 배포합니다.

필요한 것은 저장소 비밀값 하나입니다.

> 저장소 → **Settings** → **Secrets and variables** → **Actions** →
> **New repository secret** → 이름 `CLOUDFLARE_API_TOKEN`

대시보드의 Git 빌드는 `wrangler` 로 직접 배포하기 시작한 뒤 더 이상 발동하지 않습니다
(`last_deployed_from: wrangler`). 배포 경로를 Actions 한 곳으로 모아 두는 편이
누가 push했든 동일하게 동작해서 낫습니다.

수동 배포가 필요하면:

```bash
npm run build
CLOUDFLARE_API_TOKEN=... npx wrangler deploy
```

새 자산은 즉시 반영되지만 **이미 캐시된 경로는 엣지 캐시가 남습니다.** 배포 직후
확인할 때 옛 응답(404·307)이 보이면 `?cb=1` 처럼 쿼리를 붙여 우회해 보세요.

### NAS (이식)

```bash
SITE_URL=https://notes.example.com docker compose up --build -d
# -> http://<nas>:8080
```

`docker-compose.yml` 에 `cloudflared` 서비스가 주석으로 준비돼 있습니다. 주석을 풀고
Cloudflare Zero Trust에서 만든 터널 토큰을 `.env` 에 넣으면 **공유기 포트 개방·DDNS·인증서 없이**
외부에 공개됩니다. 관리자 화면만 Cloudflare Access로 잠글 수 있습니다.

옮길 때 실제로 이동하는 것은 이 저장소 하나입니다. 데이터베이스 마이그레이션이 없습니다.

## 설계 원칙 (이식성)

- 글은 마크다운 파일. 외부 CMS·DB에 데이터를 두지 않습니다.
- 검색은 빌드 시 만든 정적 JSON 색인. 검색 서비스에 의존하지 않습니다.
- 이미지는 저장소 안에. 외부 이미지 CDN을 쓰지 않습니다.
- 주소는 `astro.config.mjs` 한 곳에서만 결정됩니다.
- 런타임은 정적 파일 서버. 필요해지면 `@astrojs/node` 어댑터로 SSR 전환이 가능합니다.

## 남은 수작업

코드는 준비돼 있고, 아래는 계정 권한이 필요해 대시보드에서 직접 해야 하는 일입니다.

- [x] Cloudflare 배포 — https://justies.net
- [ ] GitHub 토큰 발급 → `/admin` 로그인
- [ ] 이전 두 사이트(field-notes-atelier, dr-park-blog)의 글 이관

선택 사항 — 매번 토큰을 붙여넣는 대신 원클릭 로그인을 원할 때만:

- [ ] GitHub OAuth App 생성 + 인증 Worker 배포 (`worker/README.md`)
- [ ] `public/admin/config.yml` 의 `base_url` · `auth_endpoint` 주석 해제
