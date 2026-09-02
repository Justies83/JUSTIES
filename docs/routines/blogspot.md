# Blogspot 자동 발행

구글 실시간 검색어를 받아 Gemini로 글 한 편을 쓰고, Blogger API로 발행한다.
2시간마다 GitHub Actions가 돌린다 — PC를 꺼 두어도 올라간다.

이 저장소의 다른 예약 실행들과 달리 **Claude 세션이 아니라 GitHub Actions가**
수행한다. 그래서 사람도 모델도 개입하지 않고, 실패해도 justies.net 배포에는
영향이 없다.

| | |
| --- | --- |
| 워크플로 | `.github/workflows/blogspot.yml` |
| 본체 | `scripts/blogspot/auto_post.py` (표준 라이브러리만 씀) |
| 토큰 발급 | `scripts/blogspot/get_refresh_token.py` (내 PC 에서 1회) |
| 대상 블로그 | <https://justrnafather.blogspot.com> |
| 발행 기록 | `scripts/blogspot/state/published.tsv` |
| 주기 | 2시간마다 (`7 */2 * * *` UTC) + 수동 실행 |

## 한 바퀴에 일어나는 일

1. `https://trends.google.com/trending/rss?geo=KR` 에서 검색어 10개와, 각
   검색어에 붙은 기사 제목·링크·사진을 받는다.
2. 아직 쓰지 않은 검색어 하나를 고른다. 판정은 두 곳을 본다 —
   `published.tsv` 의 기록과, 블로그 공개 피드에 실제로 올라간 최근 글 50편의
   제목. 러너는 매번 새로 뜨기 때문에 기록 파일 하나만으로는 커밋이 실패한
   회차에서 같은 글이 두 번 나간다.
3. 기사 제목을 근거로 Gemini에게 JSON 한 덩이(제목·요약·소제목별 문단·표·FAQ·
   태그)를 받는다. JSON이 깨져서 오면 응답 전체를 문단으로 나눠 싣는다.
4. 사진·표·FAQ·참고 기사 목록·자동 생성 고지를 붙여 HTML로 조립한다.
5. Blogger API v3로 발행한다. 태그가 라벨로 붙고, 발행된 글 주소가 로그에 남는다.
6. 발행에 성공한 회차만 `published.tsv` 에 한 줄을 남기고 커밋한다.

사진은 트렌드 RSS가 함께 주는 기사 썸네일을 쓴다. 별도 이미지 API 키가 필요
없고, 사진마다 원문 기사로 가는 링크를 캡션에 붙인다.

## 발행 방식 두 가지

`POST_METHOD` 로 고른다. 기본값은 `api` 다.

| | `api` (기본) | `mail` (예비) |
| --- | --- | --- |
| 준비 | Google Cloud OAuth, 15분쯤 | 앱 비밀번호 하나 |
| 실패를 아는가 | HTTP 응답으로 즉시. 로그에 원인이 찍힌다 | **모른다.** 메일이 버려져도 워크플로는 초록색 |
| 라벨 | 붙는다 | 안 붙는다 (본문 하단 텍스트로만) |
| 초안 저장 | `POST_AS_DRAFT=true` | 불가 |

`api` 를 권한다. 발행이 조용히 실패하는 상태가 이 자동화에서 가장 고치기
어려운 사고다.

## 준비 — API 방식

프로젝트는 이미 있는 것을 그대로 쓰면 된다 (이 저장소는 `Blogger-Bot`,
프로젝트 ID `blogger-bot-507305`). 새로 만들 이유는 없다.

### 1. Blogger API 를 켠다

**API 및 서비스 → 라이브러리 → "Blogger API v3" → 사용**.

### 2. 게시 상태를 "프로덕션" 으로 바꾼다 — 순서가 중요하다

**Google 인증 플랫폼 → 대상** (예전 이름은 OAuth 동의 화면). 사용자 유형은
"외부" 로 둔다.

게시 상태가 **"테스트 중"** 이면 여기서 발급되는 refresh token 이 **7일 만에
만료된다.** 자동화가 일주일쯤 멀쩡히 돌다가 어느 날 조용히 죽는 원인이
거의 항상 이것이다. 로그에는 `invalid_grant` 만 찍힌다.

**앱 게시** 버튼이 회색이고 "앱의 OAuth 구성이 완료되지 않았습니다" 경고가
떠 있다면, **브랜딩** 페이지에서 네 가지를 채워야 한다. 프로덕션 전환에는
홈페이지와 개인정보처리방침 URL 이 **필수**다 — 테스트 중일 때는 비워 둬도
넘어가기 때문에 여기서 처음 걸린다.

| 칸 | 값 |
| --- | --- |
| 앱 이름 | 아무거나 (`Blogger-Bot`) |
| 사용자 지원 이메일 | 본인 주소 |
| 개발자 연락처 이메일 | 본인 주소 |
| 애플리케이션 홈페이지 | `https://justies.net` |
| 애플리케이션 개인정보처리방침 링크 | `https://justies.net/privacy` |
| 승인된 도메인 → 도메인 추가 | `justies.net` |

서비스 약관 링크는 요구하지 않으므로 비워 둔다. 승인된 도메인이 거부되면
Search Console 에 `justies.net` 을 같은 구글 계정으로 등록한다 — 확인 코드는
`src/data/site.ts` 에 이미 들어 있다.

**앱 로고는 올리지 않는다.** 로고를 올리는 순간 Google 의 브랜드 인증 심사
대상이 되어 절차가 길어진다. 필수도 아니다.

저장한 뒤 **대상 → 앱 게시**. "확인되지 않은 앱" 경고는 그대로 진행한다 —
사용자 한도 100명 안에서 정상 동작하고, 여기 사용자는 1명이다.

> **★ 게시를 먼저, 토큰은 그다음.** 만료 특성은 토큰을 발급받던 시점의 게시
> 상태를 따라간다. "테스트 중" 일 때 받아 둔 토큰은 나중에 프로덕션으로
> 바꿔도 7일 뒤에 죽는다. 순서를 거꾸로 하면 같은 사고를 한 번 더 겪는다.

### 3. OAuth 클라이언트를 확인한다

**사용자 인증 정보** 에 이미 클라이언트가 있으면 그대로 쓴다.

| 상황 | 할 일 |
| --- | --- |
| 타입이 "데스크톱 앱" 이고 보안 비밀번호를 안다 | 재사용 |
| 타입이 "웹 애플리케이션" | 리디렉션 URI 에 `http://localhost:8765` 를 넣거나, 데스크톱 앱으로 새로 만든다 |
| 보안 비밀번호를 모른다 | 새로 만든다. Google 은 생성 시점 이후 비밀번호를 다시 보여주지 않는다. 클라이언트를 새로 만드는 것은 프로젝트를 새로 만드는 것과 다르다 — 같은 프로젝트 안에서 몇 초면 된다 |

없으면 **사용자 인증 정보 만들기 → OAuth 클라이언트 ID → "데스크톱 앱"**.

### 4. 내 PC 에서 refresh token 을 한 번 받는다

```bash
python3 scripts/blogspot/get_refresh_token.py
```

브라우저가 열리고 계정을 고르면 끝난다. "이 앱은 확인되지 않았습니다" 경고는
**고급 → 안전하지 않은 페이지로 이동**을 누른다 — 본인이 만든 앱이다.

끝나면 시크릿에 넣을 세 값이 터미널에 찍힌다. 이 값은 비밀번호와 같다.
채팅이나 파일에 붙여 두지 않는다.

### 5. Gemini API 키를 받는다

<https://aistudio.google.com/apikey> 에서 발급.

### 6. 저장소에 넣는다

GitHub → Settings → Secrets and variables → Actions → **Secrets**:

| 이름 | 값 |
| --- | --- |
| `GEMINI_API_KEY` | AI Studio 키 |
| `GOOGLE_CLIENT_ID` | 3단계의 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | 같은 클라이언트의 보안 비밀번호 |
| `GOOGLE_REFRESH_TOKEN` | 4단계에서 받은 값 |

같은 화면의 **Variables** 는 전부 선택 사항이다. 비워 두면 아래 기본값으로 돈다.

| 이름 | 기본값 | 뜻 |
| --- | --- | --- |
| `POST_METHOD` | `api` | `mail` 로 바꾸면 메일 방식 |
| `BLOG_URL` | `https://justrnafather.blogspot.com` | 대상 블로그. 이 주소로 blog ID 를 자동 조회한다 |
| `BLOG_ID` | (자동 조회) | 숫자 ID 를 직접 지정하고 싶을 때만 |
| `POST_AS_DRAFT` | `false` | `true` 면 발행하지 않고 초안함에 쌓는다 |
| `BLOG_FEED_URL` | `BLOG_URL` + `/feeds/posts/default` | 중복 판정에 쓰는 공개 피드 |
| `GEMINI_MODELS` | 아래 참조 | 쉼표로 구분한 모델 후보 |
| `TRENDS_GEO` | `KR` | 트렌드 지역 코드 |

키를 파일에 적지 않는다. `auto_post.py` 는 환경변수만 읽는다.

## 준비 — 메일 방식으로 되돌릴 때

`POST_METHOD=mail` 로 두고 시크릿 세 개를 더 넣는다.

1. Blogger → 설정 → 이메일 → **이메일을 사용하여 게시**에서 비밀 단어를 정하면
   `계정이름.비밀단어@blogspot.com` 주소가 생긴다. **"이메일을 게시물로 게시"**
   를 고른다 (초안 저장을 고르면 발행되지 않는다) → `BLOGGER_POST_EMAIL`
2. 보내는 계정은 **그 블로그의 작성자 또는 관리자로 등록돼 있어야 한다.**
   아니면 메일이 조용히 버려진다 → `SMTP_USER`
3. Gmail 은 2단계 인증을 켠 뒤 [앱 비밀번호](https://myaccount.google.com/apppasswords)
   를 발급받는다. 계정 비밀번호로는 로그인되지 않는다 → `SMTP_PASSWORD`
   - Gmail: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`
   - 네이버: `SMTP_HOST=smtp.naver.com`, `SMTP_PORT=465`

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
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
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
| `invalid_grant` / 일주일 만에 멈췄다 | OAuth 동의 화면이 "테스트" 상태다. "프로덕션"으로 바꾸고 토큰을 다시 받는다 |
| `403 insufficientPermissions` | 인증한 구글 계정이 그 블로그의 작성자가 아니다 |
| blog ID 조회 실패 | `BLOG_URL` 이 실제 주소와 다르다. 끝의 `/` 유무는 상관없다 |
| (mail) 메일은 나갔는데 글이 없다 | 보내는 주소가 블로그 작성자가 아니거나, Blogger 설정이 "초안으로 저장"이다 |
| (mail) SMTP 인증 실패 | 계정 비밀번호를 넣었다. 앱 비밀번호여야 한다 |
| 같은 주제가 또 올라왔다 | `published.tsv` 커밋이 실패했다. `BLOG_FEED_URL` 을 채우면 기록 파일과 무관하게 막힌다 |
| (mail) 본문 끝에 메일 서명이 붙는다 | 메일 본문 끝의 `#end` 뒤는 Blogger가 잘라낸다. 잘리지 않았다면 HTML이 아니라 평문으로 갔는지 본다 |
| 예약이 안 돈다 | 기본 브랜치에 없다. 위 "예약이 언제부터 도는가" 참조 |

## 이 자동화가 하지 않는 것

- justies.net 에는 아무것도 올리지 않는다. Blogspot 전용이다.
- 사실 확인을 하지 않는다. 기사 **제목**만 근거로 쓰기 때문에, 본문 끝에 자동
  생성 고지를 붙이고 원문 링크를 함께 싣는다.
- 사실 확인 없이 라벨만 단다. `api` 방식에서는 Gemini가 뽑은 태그가 그대로
  블로그 라벨이 된다 — 라벨 체계를 따로 관리하고 싶다면 사람이 손봐야 한다.
  `mail` 방식에서는 라벨을 지정할 수 없어 본문 하단 텍스트로만 들어간다.
