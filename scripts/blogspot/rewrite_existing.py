#!/usr/bin/env python3
"""기존에 발행된 Blogspot 글을 한 번 다시 쓴다.

2026-09-11 사용자 요청 — 세 가지를 한 번의 갱신으로 처리한다.
  1. FAQ(자주 묻는 질문)를 없애고 그 정보를 해당 문단 서술로 녹인다.
  2. 삽화를 기사 원문에서 다시 받아온다 — 처음부터 없었거나 실패했던 글도
     다시 시도한다.
  3. 고정 카테고리(경제·국제·정치사회·과학기술·생활정보) 라벨을 붙인다.
  덧붙여 조회수 배지도 넣는다(auto_post.py 의 최신 render_html 이 이미 넣는다).

일회성 배치 도구다. cron 워크플로(.github/workflows/blogspot.yml)는 이 파일을
부르지 않는다 — 직접 실행해야 한다.

  python3 scripts/blogspot/rewrite_existing.py --list          # 대상만 나열
  python3 scripts/blogspot/rewrite_existing.py --only <postId>  # 한 편만 시험
  python3 scripts/blogspot/rewrite_existing.py                  # 전부 다시 쓴다

실행 전 각 글의 원본을 scripts/blogspot/state/backup-<타임스탬프>/<postId>.json
에 그대로 저장한다. 무엇이 잘못돼도 그 폴더에서 원문을 되돌릴 수 있다.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import auto_post as ap  # 토큰 발급, 모델 폴백, render_html 등을 그대로 쓴다


def list_all_posts(token: str, blog_id: str) -> list[dict]:
    posts: list[dict] = []
    page_token = ''
    while True:
        url = f'{ap.BLOGGER_API}/blogs/{blog_id}/posts?maxResults=50&fetchBodies=true'
        if page_token:
            url += f'&pageToken={page_token}'
        data = json.loads(ap.http_get(url, headers={'Authorization': f'Bearer {token}'}))
        posts.extend(data.get('items') or [])
        page_token = data.get('nextPageToken') or ''
        if not page_token:
            break
    return posts


def extract_references(body_html: str) -> list[ap.News]:
    """'참고한 기사' <ul> 안의 (제목, 주소, 매체) 를 뽑는다."""
    m = re.search(r'참고한 기사</h2>\s*<ul[^>]*>(.*?)</ul>', body_html, re.S)
    if not m:
        return []
    out = []
    for li in re.findall(r'<li>.*?</li>', m.group(1), re.S):
        a = re.search(r'<a href="([^"]+)"[^>]*>(.*?)</a>', li, re.S)
        if not a:
            continue
        src = re.search(r'·\s*([^<]+)</span>', li)
        out.append(ap.News(
            title=html.unescape(re.sub(r'<[^>]+>', '', a.group(2))).strip(),
            url=html.unescape(a.group(1)).strip(),
            source=html.unescape(src.group(1)).strip() if src else '',
            picture=''))
    return out


def flatten_body(body_html: str) -> str:
    """제목 아래 본문을 사람이 읽을 평문으로 바꾼다. 사진·참고 기사 목록·
    태그 줄은 뺀다 — 그건 따로 다시 만든다. FAQ 의 h3/p 는 그대로 남아
    본문 소재로 쓰인다."""
    text = body_html
    text = re.sub(r'<div style="margin:28px 0;text-align:center;">.*?</div>', '', text, flags=re.S)
    text = re.sub(r'참고한 기사</h2>\s*<ul[^>]*>.*?</ul>', '', text, flags=re.S)
    text = re.sub(r'<p style="margin-top:28px;color:#666[^>]*>.*?</p>', '', text, flags=re.S)
    text = re.sub(r'<h2[^>]*>', '\n\n## ', text)
    text = re.sub(r'<h3[^>]*>', '\n### ', text)
    text = re.sub(r'</h[23]>', '\n', text)
    text = re.sub(r'<tr>', '\n', text)
    text = re.sub(r'<t[hd][^>]*>', ' | ', text)
    text = re.sub(r'</t[hd]>', '', text)
    text = re.sub(r'<li[^>]*>', '\n- ', text)
    text = re.sub(r'<p[^>]*>', '\n', text)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = html.unescape(text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{2,}', '\n\n', text)
    return text.strip()


def build_restructure_prompt(title: str, old_body_text: str, refs: list[ap.News]) -> str:
    ref_lines = '\n'.join(f'- {n.title} ({n.source or "출처 미상"})' for n in refs) or '- (없음)'
    return f"""아래는 이미 발행된 블로그 글의 제목과 본문이다. 새 사실을 더하지
않고, 아래 지시대로 재구성만 한다.

제목: {title}

원래 근거 기사:
{ref_lines}

기존 본문(문답 코너가 있다면 그 안의 사실도 포함돼 있다):
{old_body_text}

지시
- **문답(질문/답) 코너를 만들지 않는다.** 그 안에 있던 사실은 없애지 말고
  관련 있는 절이나 문단 서술로 자연스럽게 옮긴다.
- 표가 있었다면 정보를 유지한다. 없애거나 사실을 빼지 않는다.
- 원문에 없는 숫자·날짜·발언을 새로 지어내지 않는다.
- **문장은 모두 "~습니다" 로 끝낸다.** "~했다", "~밝혔다" 로 남은 문장이
  있으면 이번에 고친다.
- 검색어·검색량·실시간 순위, "이 글에서는" 류의 자기 언급, "주목받고
  있습니다" 같은 속 빈 상투어는 쓰지 않는다.
- 분량은 본문 1500~2500자.

아래 JSON 형식으로만 답한다. 코드펜스나 설명 문장을 앞뒤에 붙이지 않는다.

{{
  "title": "{title}",
  "summary": "글 전체를 한 문단(2~3문장)으로 요약",
  "sections": [
    {{"heading": "소제목", "paragraphs": ["문단", "문단"]}}
  ],
  "table": {{
    "caption": "표 제목",
    "headers": ["항목", "내용"],
    "rows": [["행1-1", "행1-2"]]
  }},
  "category": "{' / '.join(ap.CATEGORIES)} 중 하나",
  "tags": ["태그", "태그"]
}}

sections 는 3~6개로 만든다. table 은 원래 있었을 때만 채운다."""


def rewrite_one(token: str, blog_id: str, post: dict, backup_dir: Path, dry_run: bool) -> bool:
    post_id, title, url = post['id'], post['title'], post.get('url', '')
    old_body = post.get('content', '')
    print(f'\n--- {title} ({url}) ---')

    backup_dir.mkdir(parents=True, exist_ok=True)
    (backup_dir / f'{post_id}.json').write_text(
        json.dumps(post, ensure_ascii=False, indent=2), encoding='utf-8')

    refs = extract_references(old_body)
    flat = flatten_body(old_body)
    if not flat:
        print('  · 본문을 읽지 못했다. 건너뜀.')
        return False

    api_key = ap.env('GEMINI_API_KEY')
    models = ap.choose_models(api_key, [m.strip() for m in
              ap.env('GEMINI_MODELS', ap.DEFAULT_MODELS).split(',') if m.strip()])
    prompt = build_restructure_prompt(title, flat, refs)
    result = ap.call_gemini(prompt, api_key, models)
    if result is None:
        print('  · 모든 모델 후보 실패. 건너뜀.')
        return False
    _, raw = result
    article = ap.extract_json(raw)
    if not article or not article.get('sections'):
        print('  · JSON 파싱 실패. 건너뜀.')
        return False

    print('  · 사진을 원문에서 다시 받아온다')
    images = ap.collect_images(ap.Topic(keyword=title), refs)

    body = ap.render_html(ap.Topic(keyword=title), article, refs, images)
    body = ap.finalize_body(body, url)

    category = str(article.get('category') or '').strip()
    if category not in ap.CATEGORIES:
        category = ap.CATEGORIES[-1]
    tags = [str(t).strip() for t in (article.get('tags') or []) if str(t).strip()]
    labels = [category] + [t for t in tags if t != category]
    print(f'  · 분류: {category} | 태그: {", ".join(tags)} | 사진 {len(images)}장')

    if dry_run:
        out = backup_dir / f'{post_id}.preview.html'
        out.write_text(body, encoding='utf-8')
        print(f'  · [dry-run] 저장만 함: {out}')
        return True

    ap.update_post_via_api(post_id, title, body, labels)
    print('  · 갱신 완료')
    return True


def main() -> int:
    p = argparse.ArgumentParser(description='기존 발행 글 재작성')
    p.add_argument('--list', action='store_true', help='대상만 나열하고 끝낸다')
    p.add_argument('--only', default='', help='이 post id 만 처리한다 (쉼표로 여러 개)')
    p.add_argument('--dry-run', action='store_true', help='새 본문을 만들되 올리지 않는다')
    args = p.parse_args()

    ap.load_dotenv()
    token = ap.blogger_access_token()
    blog_id = ap.blogger_blog_id(token)
    posts = list_all_posts(token, blog_id)
    print(f'전체 글 {len(posts)}편')

    if args.list:
        for post in posts:
            print(f"  {post['id']}  {post.get('published', '')[:10]}  {post['title']}")
        return 0

    if args.only:
        wanted = {s.strip() for s in args.only.split(',') if s.strip()}
        posts = [p for p in posts if p['id'] in wanted]
        if not posts:
            print('그 id 를 찾지 못했다.')
            return 1

    stamp = datetime.now(ap.KST).strftime('%Y%m%d-%H%M%S')
    backup_dir = Path(__file__).resolve().parent / 'state' / f'backup-{stamp}'
    print(f'원본 백업: {backup_dir}')

    ok, fail = 0, []
    for i, post in enumerate(posts, 1):
        print(f'\n[{i}/{len(posts)}]', end='')
        try:
            if rewrite_one(token, blog_id, post, backup_dir, args.dry_run):
                ok += 1
            else:
                fail.append(post['title'])
        except SystemExit as exc:
            print(f'  · 오류: {exc}')
            fail.append(post['title'])
        time.sleep(2)  # Blogger·Gemini 를 몰아치지 않는다.

    print(f'\n완료 — 성공 {ok}편, 실패 {len(fail)}편')
    if fail:
        print('실패한 글:')
        for t in fail:
            print(f'  - {t}')
    return 1 if fail else 0


if __name__ == '__main__':
    sys.exit(main())
