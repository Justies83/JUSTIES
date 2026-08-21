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

## 배포

주소는 `SITE_URL` 환경변수 하나로만 결정됩니다. 코드에 절대 URL은 없습니다.

### Cloudflare Pages (현재)

| 항목 | 값 |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Output directory | `dist` |
| 환경변수 | `SITE_URL` = 배포 주소 (예: `https://justies.pages.dev`) |

GitHub에 push하면 자동으로 다시 빌드됩니다.

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
- 주소는 `SITE_URL` 한 곳에서만 결정됩니다.
- 런타임은 정적 파일 서버. 필요해지면 `@astrojs/node` 어댑터로 SSR 전환이 가능합니다.

## 다음 단계

- [ ] `/admin` 브라우저 편집 화면 (Sveltia CMS — 지금은 Cloudflare Worker OAuth, NAS에서는 로컬 백엔드)
- [ ] OG 이미지 자동 생성
- [ ] 이전 두 사이트(field-notes-atelier, dr-park-blog)의 글 이관
