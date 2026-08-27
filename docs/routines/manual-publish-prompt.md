# 새 창에서 직접 돌리는 발행 프롬프트

예약 실행이 커밋을 남기지 못할 때, 깨끗한 세션에 아래 내용을 그대로 붙여 넣어
사람이 지켜보며 돌린다. 예약과 달리 도구 호출과 에러가 화면에 보이므로,
어디서 막히는지 눈으로 확인할 수 있다.

프롬프트는 `--- 여기부터 ---` 아래부터 끝까지다.

--- 여기부터 ---

저장소 `Justies83/JUSTIES` — 개인 뉴스 아카이브 <https://justies.net> 입니다.
오늘자 뉴스 브리핑을 써서 발행해 주세요.

## 0단계 — 먼저 환경부터 확인하고 그 결과를 보고하세요

글을 쓰기 전에 아래를 실행하고, **각 명령의 실제 출력을 보여 주세요.**
여기서 문제가 있으면 글은 쓰지 말고 그 사실부터 알려 주세요.

```bash
pwd && git remote -v && git branch --show-current
git fetch origin claude/personal-editable-homepage-31hofg
git checkout claude/personal-editable-homepage-31hofg
git pull origin claude/personal-editable-homepage-31hofg
npm ci
```

그다음 **push가 실제로 되는지 지금 시험하세요.** 이것이 되는지 모르는 채로
글을 쓰기 시작하면 안 됩니다.

```bash
date -u > docs/push-check.txt
git add docs/push-check.txt
git commit -m "push 확인"
git push -u origin claude/personal-editable-homepage-31hofg
```

push가 실패하면 **에러 원문을 그대로 보여 주고 거기서 멈추세요.** 성공하면
그 파일을 지우는 커밋을 하나 더 올리고(`git rm docs/push-check.txt`) 다음으로
넘어갑니다.

## 1단계 — 규칙을 읽으세요

`docs/daily-brief.md` 가 이 아카이브의 편집 규칙입니다. 대상 섹션, 원문 확인
의무, 사실/해석/미확인 분리, 이미지 저작권, 마크다운 주의사항이 전부 그 안에
있습니다. **그 문서에 없는 규칙을 새로 만들지 마세요.**

`src/content/posts/` 의 최근 글 몇 편을 열어 문체와 구성을 확인하세요.
최근 3일 안에 다룬 주제는 다시 쓰지 않습니다.

## 2단계 — 한 편씩, 쓰고 바로 올리세요

**이것이 가장 중요합니다.** 여러 편을 써 두었다가 마지막에 한꺼번에 커밋하지
마세요. 지금까지 예약 실행이 세 번 연속으로 그렇게 하다가 커밋을 하나도 남기지
못했습니다.

한 편마다 이 순서를 끝까지 마치고 다음 편으로 갑니다.

1. 글 한 편을 `src/content/posts/YYYY-MM-DD-<영문-슬러그>.md` 로 씁니다.
2. `npm run build` — 프론트매터가 틀리면 여기서 실패합니다.
3. `npx astro check`
4. 통과하면 **바로**:
   ```bash
   git add src/content/posts/<이번-글>.md
   git commit -m "<이번 글 제목>"
   git push -u origin claude/personal-editable-homepage-31hofg
   ```
5. push된 것을 확인한 뒤 다음 편으로.

빌드가 실패하면 그 글만 고칩니다. 안 고쳐지면 그 글은 버리고 다음으로 넘어가세요
— 한 편 때문에 나머지를 못 올리면 안 됩니다.

**세 편에서 멈춰도 괜찮습니다.** 그 세 편은 이미 사이트에 올라가 있으니까요.
한 편도 못 올린 채 끝나는 것이 최악입니다.

## 3단계 — 무엇을 쓸지

대상 섹션은 넷뿐입니다. 각각 한 편씩, 총 3~5편을 목표로 합니다.

| 섹션 | `category` |
| --- | --- |
| 경제 · 산업 | `finance` |
| IT · 기술 | `tech` |
| 과학 | `science` — 주요 언론이 크게 다룬 것만. 프리프린트 요약은 쓰지 않습니다 |
| 국제 정세 | `world` |

전날 미국 정규장이 열렸고 오늘 국내 증시가 개장하는 날이면, 미국 마감 정리와
국내 종목 영향 예측을 담은 특별판을 경제 섹션 몫으로 씁니다. 자세한 조건은
`docs/daily-brief.md` 의 "절차 0-A" 에 있습니다.

**하루 최소 한 편.** 네 섹션 모두 재료가 없다고 판단되면, 기준을 너무 좁게 잡은
것이 아닌지 먼저 의심하세요. 증시 마감·환율은 매일 확인 가능합니다.

## 프론트매터 형식

```yaml
---
title: 글 제목
date: 2026-08-27
category: finance        # finance | tech | science | world
kind: news               # news | note | brief | review 등
takeaway: 카드와 검색에 보이는 한 줄 요약.
tags: [태그1, 태그2]
source:
  name: 매체명 (2026.08.27)
  url: https://...
---
```

`cover` 는 비워 두면 자동 생성되므로 넣지 않아도 됩니다.

## 한국어 마크다운에서 반복해서 깨진 것 둘 — 매번 확인하세요

1. **물결표는 escape.** 한 단락에 `~` 가 둘이면 그 사이가 취소선이 됩니다.
   `6\~12억원`, `2027\~2028년` 처럼 씁니다. 실제로 그렇게 발행된 적 있습니다.
2. **볼드가 문장부호로 끝나고 조사가 붙으면 별표가 그대로 보입니다.**
   `**47.2%**를` → `**47.2**%를` 또는 `**47.2%를**`.
   `**"전혀 없다"**고` → `**"전혀 없다"고**`.

## 원문 확인은 생략하지 마세요

검색 결과 요약만 보고 쓰지 않습니다. 원문을 열어 **발행 날짜**와 수치를
확인하세요. 검색은 오래된 기사를 최신처럼 보여 줍니다 — 1월 기사를 오늘
소식으로 착각한 적이 있습니다. 날짜가 확인되지 않으면 버립니다.

## 끝내기 전에

```bash
git status --short
git log origin/claude/personal-editable-homepage-31hofg --oneline -8
```

커밋 안 된 글이 남아 있으면 지금 올리세요. 마지막에 **무엇을 발행했는지 커밋
해시와 함께**, 무엇을 왜 버렸는지 보고해 주세요. 배포는 GitHub Actions가 하므로
push하면 몇 분 뒤 justies.net 에 반영됩니다.

--- 여기까지 ---
