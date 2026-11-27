# 논문 소개 코너(`/papers`) 작성 · 저작권 준수 프레임워크

`justies.net`에 논문 PDF와 연구자(운영자)의 해석을 바탕으로 글을 정리·발행할 때 반드시 따르는 표준 작업 지침(SOP)이다.

## 1. 접수 경로 3가지
1. **Antigravity 채팅 직접 전달**: 채팅에 논문 PDF를 첨부하거나 로컬 경로(`inbox/papers/*.pdf`)를 지정하고 내 해석을 함께 적는다.
2. **텔레그램 봇(`@justiesdotnet_bot` / `t.me/justiesdotnet_bot`)**:
   - PDF 파일에 해석을 **캡션**으로 적어 전송 (비공개 초안은 캡션 첫 줄에 `/draft` 표기).
   - 또는 PDF만 먼저 전송한 뒤 봇 안내에 따라 해석 텍스트를 이어서 전송(`/paper <해석>` 또는 일반 메시지).
3. **로컬 CLI (`D:\AI tools\javis\tools\paper_intake.py`)**:
   - `python -I tools/paper_intake.py --pdf "<PDF경로>" --note "<내 해석>" [--draft]`

## 2. 저작권 · 시각 자료 게이트 (CRITICAL)
- **원문 PDF 비공개 원칙**:
  - 원본 PDF 파일은 절대 `public/` 아래에 두거나 Git에 커밋하지 않는다.
  - PDF는 `inbox/papers/` 또는 `D:\AI tools\javis\state\paper_inbox/`(모두 gitignored)에만 보관하며 Antigravity의 `read_file` 도구로 직접 읽는다.
- **라이선스 판별 및 그림(Figure) 처리**:
  - PDF 바닥글·첫 페이지·DOI 페이지에서 라이선스를 확인한다.
  - **`CC-BY-NC`, `CC-BY-ND`, `Subscription`(구독형 저널), `Preprint`(별도 CC BY 명시 없음), `Unknown`인 경우:**
    - 원문 Figure·사진·표 스크린샷을 **절대 캡처·추출·트레이싱하지 않는다.**
    - `paper.figurePolicy`를 반드시 `redrawn` 또는 `data-chart`로 설정한다.
    - 논문에 공개된 메커니즘과 수치만을 바탕으로, 블로그 톤(`#f8f7f4`·`#ffffff`·`#1f514c`·`#2c4257`)에 맞춘 **자체 SVG 모식도·비교 도표** 1\~2장(`public/images/YYYY-MM-DD-<slug>-schematic.svg`, `-chart.svg`, `viewBox="0 0 880 460"`)을 직접 작도하고, 캡션에 `"모식도/도표는 원문(Author et al., Year)의 공개된 기전과 수치를 바탕으로 직접 재작성했다."`를 명시한다.
  - **`CC-BY` (`CC BY 4.0`)가 명확히 확인된 경우:**
    - 가능하면 한국어 독자에 맞춰 자체 SVG 재도식화를 우선하되, 원문 현미경·구조 사진 인용이 꼭 필요할 때만 저자·제목·저널·DOI·라이선스(`CC BY 4.0`)를 캡션에 정확히 밝힌다 (`figurePolicy: original-cc-by`).
- **원문 직역 금지**:
  - 초록이나 본문 문단을 문장 단위로 직역·번역하지 않는다. 반드시 한국어 1인칭 연구자 에세이 문체(`~한다 / ~했다 / ~인 셈이다`)로 구조 자체를 새로 짠다.

## 3. 글 구조 & 해석 통합 규칙
1. **Frontmatter 필수 항목**:
   - `category`: `research`(방법론·도구 중심) 또는 `science`(생명과학·기전·임상 중심)
   - `kind`: `opinion`(해석 중심) 또는 `note`
   - `cover`: 직접 작도한 SVG 경로(`/images/YYYY-MM-DD-<slug>-schematic.svg`) 또는 저작권 안전 이미지
   - `paper:` 블록:
     ```yaml
     paper:
       title: "Original English Paper Title"
       authors: "First Author, ..., Last Author"
       journal: "Journal Name"
       year: "2026"
       doi: "10.xxxx/..."
       url: https://doi.org/10.xxxx/...
       license: CC-BY-NC # CC-BY | CC-BY-NC | CC-BY-ND | Subscription | Preprint | Public-Domain | Unknown
       figurePolicy: redrawn # redrawn | data-chart | original-cc-by | text-only
       ownerNote: "운영자가 제공한 핵심 해석을 1~2문장으로 압축한 요약"
     ```
2. **본문 전개 5단계** (`## 요약` 같은 기계적 제목 대신 자연스러운 논지형 소제목 사용):
   - ① 이 논문을 펼쳐 든 이유와 핵심 질문
   - ② 실험 설계(고정 조건 vs 변수, 모델, 대조군)와 핵심 정량 수치
   - ③ 자체 재도식화(Redrawn SVG) 모식도/차트 해설
   - ④ **내 해석과 비평**: 운영자가 준 해석(`해석`)을 단순 덧붙임이 아니라 글의 중심 논지로 풀어내고, 객관적 논문 데이터와 연구자 개인 가설·판단을 구분해 서술한다.
   - ⑤ 한계점과 다음으로 확인해야 할 질문
3. **마크다운 사고 방지**:
   - 한 단락 안 짝수 물결표는 `\~`로 escape 한다 (`6\~12개월`).
   - `**47.2%**를` 처럼 문장부호 직후 조사 앞 볼드를 쓰지 않고 `**47.2**%를`로 쓴다.
   - UTF-8(BOM 없음)로 저장한다.

## 4. 검증 및 배포
1. `npx astro check` 및 `npm run build` 실행 후 0 errors 확인.
2. `git status --short`로 `.pdf` 파일이 포함되지 않았는지 확인.
3. `git fetch origin && git merge --ff-only origin/claude/personal-editable-homepage-31hofg` 후 커밋 & push.
