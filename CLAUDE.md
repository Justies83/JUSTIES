# 제의 / JUSTIES — 저장소 안내

개인 뉴스·기록 아카이브. <https://justies.net>

## 배포 브랜치는 하나뿐이다

```
claude/personal-editable-homepage-31hofg
```

사이트는 **이 브랜치에 push될 때만** 배포된다 (GitHub Actions). 다른 브랜치에
커밋하면 글이 올라가지 않는다. Cloudflare 토큰은 필요 없다.

## 글을 썼으면 반드시 push하고 끝낸다

이 저장소에서 가장 자주 났던 사고는 **글을 다 써 놓고 커밋하지 않은 채 실행이
끝나는 것**이다. 예약 실행이 두 번 연속(2026-08-25, 08-26) 각각 13분·17분 동안
조사와 작성을 하고도 커밋을 하나도 남기지 못했다.

그래서 규칙은 하나다.

**한 편을 완성할 때마다 그 자리에서 빌드 → 커밋 → push한다.**
여러 편을 모아 두었다가 마지막에 한꺼번에 커밋하지 않는다.

```bash
npm run build      # 프론트매터가 틀리면 여기서 실패한다
npx astro check
git add src/content/posts/<글>.md
git commit -m "<제목>"
git push -u origin claude/personal-editable-homepage-31hofg
```

작업을 끝내기 전에 `git status --short` 로 커밋되지 않은 글이 남아 있지 않은지,
`git log origin/claude/personal-editable-homepage-31hofg --oneline -5` 로 실제로
올라갔는지 확인한다.

## 개발

```bash
npm ci
npm run dev        # draft: true 인 글도 여기서는 보인다
npm run build
npx astro check
```

셋 다 통과한 뒤에만 커밋한다.

## 글은 어디에 있나

| 경로 | 내용 |
| --- | --- |
| `src/content/posts/` | 발행되는 글. Astro는 이 폴더만 읽는다 |
| `src/data/site.ts` | 사이트 제목·소개·검증 코드·AdSense ID |
| `src/data/taxonomy.ts` | 섹션(`category`)과 형식(`kind`) 정의 |
| `docs/daily-brief.md` | 자동 발행의 편집 규칙 — 무엇을 어떻게 쓸지 |
| `docs/routines/` | 예약 실행 두 개의 배선 |
| `gate/index.js` | 비밀번호 게이트 + 조회수 API |

## 자주 났던 마크다운 사고 둘

한국어 본문에서 반복해서 걸린 것이라 글을 쓸 때마다 확인한다. 자세한 예시는
`docs/daily-brief.md` 에 있다.

1. **물결표는 escape 한다** — 한 단락에 `~` 가 둘이면 그 사이가 취소선이 된다.
   `6\~12억원` 처럼 쓴다.
2. **볼드가 문장부호로 끝나고 조사가 붙으면 깨진다** — `**47.2%**를` 는 별표가
   그대로 보인다. `**47.2**%를` 또는 조사까지 볼드 안에 넣는다.

## 디자인

라이트/다크 토글은 없다. 눈에 부담이 적은 베이지 고정 팔레트(`--paper #f4f1ea`)
하나만 쓴다. 색은 `src/styles/global.css` 최상단의 토큰으로만 바꾼다.
