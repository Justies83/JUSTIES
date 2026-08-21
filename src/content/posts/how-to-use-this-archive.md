---
title: 이 아카이브에 글을 쓰는 방법
date: 2026-08-21
category: tech
kind: note
takeaway: 파일 하나를 추가하면 목록, 주제, 태그, 검색, RSS가 함께 갱신됩니다. 프론트매터의 여섯 줄만 기억하면 됩니다.
tags: [운영, 워크플로]
featured: false
visibility: private
---

이 사이트의 데이터베이스는 `src/content/posts/` 폴더입니다. 마크다운 파일 하나가 글 하나이고,
파일 이름이 주소가 됩니다. `how-to-use-this-archive.md` 는 `/posts/how-to-use-this-archive` 로 열립니다.

## 최소 형태

```markdown
---
title: 글 제목
date: 2026-08-21
category: research
kind: note
takeaway: 목록 카드에 보이는 한 줄 요약.
tags: [태그1, 태그2]
---

여기서부터 본문.
```

이 여섯 항목만 있으면 됩니다. `title`, `date`, `category`, `kind`, `takeaway` 는 필수이고
`tags` 는 없어도 됩니다. 형식이 틀리면 빌드가 **실패하면서 어느 파일의 어느 항목이 잘못됐는지**
알려 줍니다. 잘못된 글이 조용히 올라가는 일은 없습니다.

## 두 축으로 분류합니다

| 항목 | 뜻 | 가능한 값 |
| --- | --- | --- |
| `category` | 무엇에 대한 글인가 | `research` `science` `world` `finance` `tech` `life` |
| `kind` | 어떤 성격의 글인가 | `news` `opinion` `note` |

주제를 늘리고 싶으면 `src/data/taxonomy.ts` 에 한 줄을 추가합니다. 그러면 홈의 주제 카드,
`/topics/...` 페이지, 필터 칩이 한꺼번에 따라옵니다. 폴더를 만들 필요는 없습니다.

## 선택 항목

- `updated` — 내용을 고친 날. 넣으면 글 머리에 "갱신" 날짜가 붙습니다.
- `source` — 뉴스나 자료를 옮겨 적었을 때의 출처. `{ name, url }` 형태입니다.
- `cover` / `coverAlt` — 대표 이미지. `public/images/` 에 넣고 `/images/파일명` 으로 적습니다.
- `featured: true` — 홈 상단 "먼저 읽어 볼 글" 자리에 올립니다. 세 개까지 보입니다.
- `draft: true` — 개발 중에는 보이고, 배포된 사이트에서는 숨습니다.

## 쓰는 경로는 세 가지

1. **에디터에서 파일 추가** — 가장 빠르고, 아무 설정도 필요 없습니다.
2. **GitHub 웹/앱에서 추가** — 외출 중에 짧은 메모를 남길 때.
3. **`/admin` 편집 화면** — 폼으로 제목·주제·본문을 채우는 방식. 다음 단계에서 붙입니다.

세 경로 모두 결과물은 같은 마크다운 파일입니다. 그래서 나중에 NAS로 옮겨도
옮길 것은 이 폴더 하나뿐입니다.
