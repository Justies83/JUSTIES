# Blogspot 자동 발행

구글 실시간 검색어를 받아 Gemini로 글 한 편을 쓰고, Blogger의 "메일로 글쓰기"
주소로 보낸다. 2시간마다 GitHub Actions가 돌린다 — PC를 꺼 두어도 발행된다.

이 저장소의 다른 예약 실행들과 달리 **Claude 세션이 아니라 GitHub Actions가**
수행한다. 그래서 사람도 모델도 개입하지 않고, 실패해도 justies.net 배포에는
영향이 없다.

| | |
| --- | --- |
| 워크플로 | `.github/workflows/blogspot.yml` |
| 본체 | `scripts/blogspot/auto_post.py` (표준 라이브러리만 씀) |
| 발행 기록 | `scripts/blogspot/state/published.tsv` |
| 주기 | 2시간마다 (`7 */2 * * *` UTC) + 수동 실행 |

## 한 바퀴에 일어나는 일

1. `https://trends.google.com/trending/rss?geo=KR` 에서 검색어 10개와, 각
   검색어에 붙은 기사 제목·링크·사진을 받는다.
2. 아직 쓰지 않은 검색어 하나를 고른다. 판정은 두 곳을 본다 —
   `published.tsv` 의 기록과, `BLOG_FEED_URL` 이 설정돼 있으면 블로그에 실제로
   올라간 최근 글 50편의 제목.
3. 기사 제목을 근거로 Gemini에게 JSON 한 덩이(제목·요약·소제목별 문단·표·FAQ·
   태그)를 받는다. JSON이 깨져서 오면 응답 전체를 문단으로 나눠 싣는다.
4. 사진·표·FAQ·참고 기사 목록·자동 생성 고지를 붙여 HTML로 조립한다.
5. 메일로 보낸다. **제목이 글 제목이 되고 본문 HTML이 그대로 글이 된다.**
6. 발행에 성공한 회차만 `published.tsv` 에 한 줄을 남기고 커밋한다.

사진은 트렌드 RSS가 함께 주는 기사 썸네일을 쓴다. 별도 이미지 API 키가 필요
없고, 사진마다 원문 기사로 가는 링크를 캡션에 붙인다.

## 준비 — 네 가지

### 1. Blogger에서 이메일 발행을 켠다

Blogger → 설정 → 이메일 → **이메일을 사용하여 게시**. 원하는 비밀 단어를 넣으면
`계정이름.비밀단어@blogspot.com` 주소가 만들어진다. "이메일을 게시물로 게시"를
고른다(초안으로 저장을 고르면 발행되지 않고 초안함에 쌓인다).

받은 주소가 `BLOGGER_POST_EMAIL` 이다.

### 2. 발송용 메일 계정을 준비한다

**보내는 주소가 그 블로그의 작성자 또는 관리자로 등록돼 있어야 한다.** 아니면
메일이 조용히 버려진다. 가장 흔한 실패 원인이 이것이다.

- Gmail: 2단계 인증을 켠 뒤 [앱 비밀번호](https://myaccount.google.com/apppasswords)를
  발급받는다. 계정 비밀번호로는 로그인되지 않는다.
  `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`
- 네이버: 메일 설정에서 SMTP를 켜고 발급받은 비밀번호를 쓴다.
  `SMTP_HOST=smtp.naver.com`, `SMTP_PORT=465`

### 3. Gemini API 키를 받는다

[Google AI Studio](https://aistudio.google.com/apikey) 에서 발급 → `GEMINI_API_KEY`.

### 4. 저장소에 넣는다

GitHub → Settings → Secrets and variables → Actions → **Secrets**:

| 이름 | 값 |
| --- | --- |
| `GEMINI_API_KEY` | AI Studio 키 |
| `SMTP_USER` | 발송 계정 주소 |
| `SMTP_PASSWORD` | 앱 비밀번호 |
| `BLOGGER_POST_EMAIL` | `계정이름.비밀단어@blogspot.com` |
| `SMTP_HOST` · `SMTP_PORT` | Gmail 이 아니면 |

같은 화면의 **Variables** 에는 비밀이 아닌 것을 둔다:

| 이름 | 기본값 | 뜻 |
| --- | --- | --- |
| `BLOG_FEED_URL` | (없음) | `https://블로그주소/feeds/posts/default` — 넣으면 중복 판정이 정확해진다 |
| `GEMINI_MODELS` | 아래 참조 | 쉼표로 구분한 모델 후보 |
| `TRENDS_GEO` | `KR` | 트렌드 지역 코드 |

키를 파일에 적지 않는다. `auto_post.py` 는 환경변수만 읽는다.

## 예약이 언제부터 도는가

**GitHub Actions의 `schedule` 은 기본 브랜치에서만 발동한다.** 이 저장소의 기본
브랜치는 `claude/personal-editable-homepage-31hofg` 이므로, `blogspot.yml` 이 그
브랜치에 들어가기 전까지는 시각표대로 돌지 않는다. 작업 브랜치에 있는 동안에는
Actions 탭의 수동 실행(Run workflow) 버튼도 보이지 않는다.

병합 뒤 첫 확인은 Actions → blogspot → Run workflow → `dry_run` 을 켠 채 한 번
돌려 보는 것이다. 메일을 보내지 않고 생성 결과만 `preview.html` 아티팩트로
남긴다.

## 내 PC에서 돌리기

`scripts/blogspot/.env` 를 만들고(이 경로는 `.gitignore` 에 걸려 커밋되지 않는다):

```
GEMINI_API_KEY=...
SMTP_USER=...
SMTP_PASSWORD=...
BLOGGER_POST_EMAIL=계정이름.비밀단어@blogspot.com
```

그다음:

```bash
python3 scripts/blogspot/auto_post.py --dry-run --out preview.html   # 확인만
python3 scripts/blogspot/auto_post.py                                 # 1회 발행
python3 scripts/blogspot/auto_post.py --loop 120                      # 120분마다
```

윈도우는 `scripts\blogspot\run_now.bat` 를 더블 클릭하면 1회 발행,
`run_now.bat 120` 이면 120분마다 반복한다.

로컬 반복 실행은 GitHub Actions와 **중복 발행을 만든다.** 둘 중 하나만 쓴다.

## 모델 후보

기본 순서는 이렇다.

```
gemini-3.7-flash, gemini-3-flash, gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash
```

없는 모델 이름은 404를 받고 그대로 다음 후보로 넘어가므로, 목록에 남겨 두어도
발행이 멈추지 않는다. 429(쿼터)와 5xx는 8초 뒤 한 번만 다시 시도하고 넘어간다.
어느 모델이 실제로 답했는지는 실행 로그의 `· 본문 생성: ...` 줄에 찍힌다 —
첫 실행 뒤 이 줄을 보고 목록을 정리하면 된다. 목록은 `GEMINI_MODELS` 변수로
코드 수정 없이 바꿀 수 있다.

## 종료 코드

| 코드 | 뜻 | 워크플로 |
| --- | --- | --- |
| 0 | 발행함 | 기록을 커밋한다 |
| 3 | 발행할 것이 없었다 (새 검색어 없음 / 모델 전부 실패) | 초록. `::notice::` 만 남긴다 |
| 1 | 오류 | 빨강 |

며칠째 3만 나온다면 검색어가 아니라 API 쪽을 본다. 로그에 모델별 응답 코드가
그대로 찍혀 있다.

## 자주 나는 사고

| 증상 | 원인 |
| --- | --- |
| 메일은 나갔는데 글이 없다 | 보내는 주소가 블로그 작성자가 아니거나, Blogger 설정이 "초안으로 저장"이다 |
| SMTP 인증 실패 | 계정 비밀번호를 넣었다. 앱 비밀번호여야 한다 |
| 같은 주제가 또 올라왔다 | `published.tsv` 커밋이 실패했다. `BLOG_FEED_URL` 을 채우면 기록 파일과 무관하게 막힌다 |
| 본문 끝에 메일 서명이 붙는다 | 본문 마지막의 `#end` 뒤는 Blogger가 잘라낸다. 잘리지 않았다면 HTML이 아니라 평문으로 갔는지 본다 |
| 예약이 안 돈다 | 기본 브랜치에 없다. 위 "예약이 언제부터 도는가" 참조 |

## 이 자동화가 하지 않는 것

- justies.net 에는 아무것도 올리지 않는다. Blogspot 전용이다.
- 사실 확인을 하지 않는다. 기사 **제목**만 근거로 쓰기 때문에, 본문 끝에 자동
  생성 고지를 붙이고 원문 링크를 함께 싣는다.
- 라벨(태그)을 달지 않는다. 메일 발행으로는 라벨을 지정할 수 없어, 태그는 본문
  맨 아래 텍스트로만 들어간다.
