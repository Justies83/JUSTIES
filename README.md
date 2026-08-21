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

## 글 쓰기

`src/content/posts/` 에 `.md` 파일을 만듭니다. 파일 이름이 주소가 됩니다.

```markdown
---
title: 글 제목
date: 2026-08-21
category: research      # research | science | world | finance | tech | life
kind: note              # news | opinion | note
takeaway: 목록 카드에 보이는 한 줄 요약.
tags: [태그1, 태그2]
# --- 선택 항목 ---
# updated: 2026-08-25
# source: { name: 출처 이름, url: https://... }
# cover: /images/example.jpg
# coverAlt: 이미지 설명
# featured: true        # 홈 상단 3칸
# draft: true           # 배포된 사이트에서는 숨김
---

본문은 마크다운.
```

필수는 `title` `date` `category` `kind` `takeaway` 다섯 개입니다.
형식이 틀리면 빌드가 실패하면서 어느 파일의 어느 항목이 문제인지 알려 줍니다.

파일 하나를 추가하면 홈 목록, 주제 페이지, 태그 페이지, 검색 색인, RSS, 사이트맵이 함께 갱신됩니다.

### 분류 늘리기

`src/data/taxonomy.ts` 의 `CATEGORIES` 에 한 줄을 추가하면 주제 카드 · 필터 · `/topics/...`
페이지가 자동으로 생깁니다. 폴더를 만들 필요는 없습니다.

### 이미지

`public/images/` 에 넣고 `/images/파일명` 으로 참조합니다. 외부 CDN을 쓰지 않기 때문에
저장소만 옮기면 이미지도 함께 따라옵니다.

카카오톡·트위터 등에 공유될 때 쓰이는 기본 카드 이미지는 `public/og.png` 입니다.
글에 `cover` 가 있으면 그 이미지가, 없으면 이 기본 카드가 쓰입니다. 제목과 요약은
`og:title` / `og:description` 으로 따로 전달되므로 이미지에 한글을 새길 필요는 없습니다.

## `/admin` — 브라우저에서 글쓰기

`/admin` 에서 폼으로 제목 · 주제 · 형식 · 본문을 채우고 저장하면 마크다운 파일이
커밋되고, 1~2분 뒤 사이트에 반영됩니다. 마크다운 문법을 몰라도 됩니다.

로그인 방식은 세 가지이고, 모두 같은 마크다운 파일을 씁니다.

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

## 배포

주소는 `astro.config.mjs` 의 `PRODUCTION_URL` 한 줄에서 결정됩니다.
코드의 다른 어디에도 절대 URL은 없습니다.

1. `SITE_URL` 환경변수 — 있으면 최우선 (NAS, 일회성 빌드)
2. `CF_PAGES_URL` — Cloudflare **Pages** 가 자동으로 넣는 값. Workers 배포에는 없음
3. `PRODUCTION_URL` (빌드) / `http://localhost:4321` (`npm run dev`)

### Cloudflare Workers (현재)

**https://justies.justies.workers.dev**

대시보드의 저장소 가져오기 흐름은 Pages 프로젝트가 아니라 **정적 자산을 가진 Worker**
를 만들고, push마다 `wrangler deploy` 를 실행합니다. 배포 설정은 저장소 루트의
`wrangler.toml` 에 있습니다 — 후행 슬래시 처리와 404 페이지가 여기서 정해집니다.

| 항목 | 값 |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| 환경변수 | 없음 |

커스텀 도메인을 연결하면 `astro.config.mjs` 의 `PRODUCTION_URL` 을 그 도메인으로
바꿔 주세요. 그때부터 canonical 주소와 공유 카드가 도메인을 가리킵니다.

`public/_headers` 는 Pages 전용 기능이라 Workers 배포에서는 적용되지 않습니다.
NAS(nginx)에서는 같은 헤더를 `docker/nginx.conf` 가 직접 설정합니다.

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

- [x] Cloudflare 배포 — https://justies.justies.workers.dev
- [ ] GitHub 토큰 발급 → `/admin` 로그인
- [ ] 이전 두 사이트(field-notes-atelier, dr-park-blog)의 글 이관

선택 사항 — 매번 토큰을 붙여넣는 대신 원클릭 로그인을 원할 때만:

- [ ] GitHub OAuth App 생성 + 인증 Worker 배포 (`worker/README.md`)
- [ ] `public/admin/config.yml` 의 `base_url` · `auth_endpoint` 주석 해제
