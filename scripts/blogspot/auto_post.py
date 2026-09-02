#!/usr/bin/env python3
"""Blogspot 자동 발행기 — 구글 실시간 검색어 → Gemini 초고 → 메일 발행.

한 번 실행하면 글 한 편이 올라간다.

  1. 구글 트렌드 RSS(기본 geo=KR)에서 지금 뜨는 검색어와 그 검색어에 붙은
     기사 목록·사진을 받아 온다.
  2. 아직 쓴 적 없는 검색어 하나를 고른다. 중복 판정은 두 곳을 본다 —
     저장소에 커밋된 발행 기록(state/published.tsv)과, BLOG_FEED_URL 이
     설정돼 있으면 블로그의 공개 피드에 실제로 올라간 최근 글 제목.
  3. Gemini 로 한국어 본문을 만든다. 모델은 GEMINI_MODELS 순서대로
     시도하고, 응답이 오지 않으면 다음 모델로 넘어간다.
  4. 이미지·표·FAQ·출처를 붙여 HTML 한 덩이로 조립한다.
  5. Blogger API v3 로 발행한다(POST_METHOD=api, 기본값). 라벨이 붙고,
     발행된 글 주소가 로그에 남는다. POST_METHOD=mail 로 두면 대신 Blogger 의
     "메일로 글쓰기"(Mail2Blogger) 주소로 보낸다 — 예비 경로다.

표준 라이브러리만 쓴다. pip install 이 필요 없다.

  python3 scripts/blogspot/auto_post.py --dry-run       # 보내지 않고 확인만
  python3 scripts/blogspot/auto_post.py                  # 1회 발행
  python3 scripts/blogspot/auto_post.py --loop 120       # 120분마다 반복

필요한 환경변수는 docs/routines/blogspot.md 에 정리돼 있다.
"""
from __future__ import annotations

import argparse
import html
import json
import os
import random
import re
import smtplib
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
STATE = HERE / 'state' / 'published.tsv'
KST = timezone(timedelta(hours=9))
UA = 'JustiesBlogspotBot/1.0 (+https://justies.net)'
DEFAULT_BLOG_URL = 'https://justrnafather.blogspot.com'
BLOGGER_API = 'https://www.googleapis.com/blogger/v3'

# 1순위는 사용자가 지정한 모델을 그대로 둔다. 뒤는 실측으로 정했다 —
# 2026-09-02 실행에서 gemini-2.5-flash 는 "더 이상 신규 사용자에게 제공되지
# 않는다. gemini-3.6-flash 를 쓰라" 는 404 를 돌려주었고, 3-flash·2.0-flash·
# 1.5-flash 는 이 키의 모델 목록에 아예 없었다.
DEFAULT_MODELS = 'gemini-3.7-flash,gemini-3.6-flash,gemini-2.5-flash'

# 생각이 긴 모델은 첫 응답까지 1분을 넘긴다. gemini-3.7-flash 가 60초에서
# 잘렸다.
GEN_TIMEOUT = 120


# ── 환경변수 ────────────────────────────────────────────────────────────────

def load_dotenv() -> None:
    """로컬 실행 편의를 위해 .env 를 읽는다. 이미 있는 값은 덮지 않는다."""
    for path in (HERE / '.env', REPO / '.env'):
        if not path.exists():
            continue
        for line in path.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, value = line.partition('=')
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def env(name: str, default: str = '') -> str:
    return (os.environ.get(name) or default).strip()


# ── HTTP ────────────────────────────────────────────────────────────────────

def http_get(url: str, timeout: int = 30, headers: dict | None = None) -> bytes:
    head = {'User-Agent': UA, 'Accept': '*/*', **(headers or {})}
    req = urllib.request.Request(url, headers=head)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read()


def http_post_form(url: str, data: dict, timeout: int = 30) -> dict:
    body = urllib.parse.urlencode(data).encode('utf-8')
    req = urllib.request.Request(url, data=body, method='POST', headers={
        'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded'})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode('utf-8'))


def http_post_json(url: str, payload: dict, headers: dict, timeout: int = 60):
    body = json.dumps(payload).encode('utf-8')
    head = {'User-Agent': UA, 'Content-Type': 'application/json', **headers}
    req = urllib.request.Request(url, data=body, headers=head, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')[:400]
    except (urllib.error.URLError, OSError, json.JSONDecodeError) as e:
        # 타임아웃·연결 실패는 상태 코드가 없다. 0 으로 돌려주어 호출부가
        # 다음 후보로 넘어갈 수 있게 한다 — 예외로 새어 나가면 폴백이 통째로
        # 무산된다.
        return 0, f'{type(e).__name__}: {e}'


# ── 1. 트렌드 수집 ──────────────────────────────────────────────────────────

@dataclass
class News:
    title: str
    url: str
    source: str
    picture: str
    snippet: str = ''


@dataclass
class Topic:
    keyword: str
    traffic: str = ''
    picture: str = ''
    news: list[News] = field(default_factory=list)


def fetch_trends(geo: str) -> list[Topic]:
    url = f'https://trends.google.com/trending/rss?geo={urllib.parse.quote(geo)}'
    root = ET.fromstring(http_get(url))
    ns = {'ht': 'https://trends.google.com/trending/rss'}
    topics: list[Topic] = []
    for item in root.iterfind('./channel/item'):
        keyword = (item.findtext('title') or '').strip()
        if not keyword:
            continue
        topic = Topic(
            keyword=keyword,
            traffic=(item.findtext('ht:approx_traffic', default='', namespaces=ns) or '').strip(),
            picture=(item.findtext('ht:picture', default='', namespaces=ns) or '').strip(),
        )
        for node in item.iterfind('ht:news_item', ns):
            title = (node.findtext('ht:news_item_title', default='', namespaces=ns) or '').strip()
            link = (node.findtext('ht:news_item_url', default='', namespaces=ns) or '').strip()
            if not title or not link:
                continue
            topic.news.append(News(
                title=html.unescape(title),
                url=link,
                source=(node.findtext('ht:news_item_source', default='', namespaces=ns) or '').strip(),
                picture=(node.findtext('ht:news_item_picture', default='', namespaces=ns) or '').strip(),
                snippet=html.unescape((node.findtext('ht:news_item_snippet', default='', namespaces=ns) or '').strip()),
            ))
        topics.append(topic)
    return topics


def fetch_news_context(keyword: str, limit: int = 6) -> list[News]:
    """트렌드 RSS 의 기사 목록이 빈약할 때 구글 뉴스 검색으로 보충한다."""
    q = urllib.parse.quote(keyword)
    url = f'https://news.google.com/rss/search?q={q}&hl=ko&gl=KR&ceid=KR:ko'
    try:
        root = ET.fromstring(http_get(url))
    except Exception as exc:  # 보조 경로다. 실패해도 발행은 계속한다.
        print(f'  · 뉴스 검색 보충 실패: {exc}')
        return []
    out: list[News] = []
    for item in list(root.iterfind('./channel/item'))[:limit]:
        title = (item.findtext('title') or '').strip()
        link = (item.findtext('link') or '').strip()
        if not title or not link:
            continue
        source = (item.findtext('source') or '').strip()
        out.append(News(title=html.unescape(title), url=link, source=source, picture=''))
    return out


# ── 2. 중복 방지 ────────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    return re.sub(r'\s+', '', text).lower()


def load_history() -> list[tuple[str, str, str]]:
    if not STATE.exists():
        return []
    rows = []
    for line in STATE.read_text(encoding='utf-8').splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        parts = line.split('\t')
        if len(parts) >= 3:
            rows.append((parts[0], parts[1], parts[2]))
    return rows


def append_history(keyword: str, title: str, keep: int = 500) -> None:
    rows = load_history()
    rows.append((datetime.now(KST).isoformat(timespec='seconds'), keyword, title))
    rows = rows[-keep:]
    STATE.parent.mkdir(parents=True, exist_ok=True)
    header = '# 발행 기록 — 시각(KST)\t검색어\t제목. auto_post.py 가 중복을 피하려고 읽는다.\n'
    STATE.write_text(header + '\n'.join('\t'.join(r) for r in rows) + '\n', encoding='utf-8')


def feed_url() -> str:
    """BLOG_FEED_URL 이 있으면 그것을, 없으면 BLOG_URL 에서 만들어 쓴다."""
    explicit = env('BLOG_FEED_URL')
    if explicit:
        return explicit
    return env('BLOG_URL', DEFAULT_BLOG_URL).rstrip('/') + '/feeds/posts/default'


def fetch_published_titles(feed_url: str, limit: int = 50) -> list[str]:
    """블로그 공개 피드에서 최근 글 제목을 읽는다. 기록 파일보다 이쪽이 진실이다."""
    if not feed_url:
        return []
    sep = '&' if '?' in feed_url else '?'
    url = f'{feed_url}{sep}alt=json&max-results={limit}'
    try:
        data = json.loads(http_get(url).decode('utf-8'))
    except Exception as exc:
        print(f'  · 블로그 피드를 읽지 못했다(기록 파일만으로 판정): {exc}')
        return []
    entries = data.get('feed', {}).get('entry', []) or []
    return [e.get('title', {}).get('$t', '') for e in entries]


def pick_topic(topics: list[Topic], history_keys: set[str], published: list[str]) -> Topic | None:
    published_blob = normalize(' '.join(published))
    for topic in topics:
        key = normalize(topic.keyword)
        if key in history_keys:
            continue
        if key and len(key) >= 2 and key in published_blob:
            continue
        return topic
    return None


# ── 3. Gemini ───────────────────────────────────────────────────────────────

def build_prompt(topic: Topic, news: list[News]) -> str:
    lines = [f'- {n.title} ({n.source or "출처 미상"})' for n in news[:8]]
    headlines = '\n'.join(lines) if lines else '- (관련 기사 목록을 받지 못했다)'
    today = datetime.now(KST).strftime('%Y년 %m월 %d일')
    return f"""당신은 한국어 시사·생활 정보 블로그의 필자다. 아래 자료만 근거로
독자에게 도움이 되는 글 한 편을 쓴다.

오늘 날짜: {today}
지금 뜨는 검색어: "{topic.keyword}" (검색량 {topic.traffic or '집계 중'})

이 검색어에 붙은 실제 기사 제목:
{headlines}

요구사항
- 왜 지금 이 검색어가 뜨는지부터 설명한다. 배경을 모르는 독자가 읽는다고 가정한다.
- 기사 제목에 없는 사실(숫자, 날짜, 발언, 인용)을 지어내지 않는다. 확실하지
  않으면 "보도에 따르면", "아직 확인되지 않았다" 처럼 불확실성을 드러낸다.
- 분량은 본문 1500~2500자. 문단은 3~5문장으로 끊는다.
- 문체는 담백한 평서문. 과장된 수식어와 낚시성 표현을 쓰지 않는다.

아래 JSON 형식으로만 답한다. 코드펜스나 설명 문장을 앞뒤에 붙이지 않는다.

{{
  "title": "검색어를 포함한 30자 내외의 제목",
  "summary": "글 전체를 한 문단(2~3문장)으로 요약",
  "sections": [
    {{"heading": "소제목", "paragraphs": ["문단", "문단"]}}
  ],
  "table": {{
    "caption": "표 제목",
    "headers": ["항목", "내용"],
    "rows": [["행1-1", "행1-2"], ["행2-1", "행2-2"]]
  }},
  "faq": [
    {{"q": "독자가 실제로 검색할 법한 질문", "a": "2~3문장 답변"}}
  ],
  "tags": ["태그", "태그"]
}}

sections 는 3~5개, faq 는 3~5개, table 의 rows 는 3~6개로 만든다."""


def extract_json(text: str) -> dict | None:
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*|\s*```$', '', text, flags=re.S)
    start, end = text.find('{'), text.rfind('}')
    if start < 0 or end <= start:
        return None
    try:
        return json.loads(text[start:end + 1])
    except json.JSONDecodeError:
        # 마지막 요소 뒤의 쉼표 정도는 흔한 실수라 한 번 고쳐 본다.
        patched = re.sub(r',(\s*[}\]])', r'\1', text[start:end + 1])
        try:
            return json.loads(patched)
        except json.JSONDecodeError:
            return None


def list_available_models(api_key: str) -> list[str]:
    """이 키로 generateContent 를 부를 수 있는 모델 이름들. 실패하면 빈 목록."""
    url = 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200'
    try:
        data = json.loads(http_get(url, timeout=30, headers={'x-goog-api-key': api_key}))
    except Exception as exc:
        print(f'  · 모델 목록을 받지 못했다(후보를 그대로 시도한다): {exc}')
        return []
    out = []
    for m in data.get('models') or []:
        name = str(m.get('name', '')).removeprefix('models/')
        methods = m.get('supportedGenerationMethods') or m.get('supportedActions') or []
        if name and (not methods or 'generateContent' in methods):
            out.append(name)
    return out


def choose_models(api_key: str, wanted: list[str]) -> list[str]:
    """후보 중 실제로 존재하는 것만 남긴다.

    없는 이름에 매번 요청을 날리면 404 로 끝나면 다행이고, 응답이 오지 않으면
    타임아웃만큼 시간을 버린다. 한 번 물어보고 거르는 편이 싸다.
    """
    available = list_available_models(api_key)
    if not available:
        return wanted
    known = [m for m in wanted if m in available]
    missing = [m for m in wanted if m not in available]
    if missing:
        print(f'  · 이 키로 쓸 수 없는 모델은 건너뛴다: {", ".join(missing)}')
    # 지정한 후보가 전부 실패해도 굴러가도록, 목록에 살아 있는 flash 계열을
    # 뒤에 덧붙인다. 모델 이름은 계속 바뀌고(2.5-flash 가 그렇게 사라졌다),
    # 그때마다 코드를 고치러 오는 대신 목록을 믿는 편이 낫다.
    extra = [m for m in available
             if 'flash' in m and 'thinking' not in m and m not in known]
    extra.sort(reverse=True)  # 대체로 새 버전이 뒤 숫자가 크다
    tail = extra[:2]
    if tail:
        print(f'  · 예비로 뒤에 붙인다: {", ".join(tail)}')
    picked = known + tail
    if not picked:
        picked = available[:3]
        print(f'  · 쓸 만한 후보가 없다. 목록 앞에서 고른다: {", ".join(picked)}')
    return picked


def call_gemini(prompt: str, api_key: str, models: list[str]) -> tuple[str, str] | None:
    """(모델명, 응답 텍스트) 를 돌려준다. 모든 후보가 실패하면 None."""
    payload = {
        'contents': [{'role': 'user', 'parts': [{'text': prompt}]}],
        'generationConfig': {'temperature': 0.7, 'maxOutputTokens': 4000},
    }
    headers = {'x-goog-api-key': api_key}
    for model in models:
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
        for attempt in (1, 2):
            status, body = http_post_json(url, payload, headers, timeout=GEN_TIMEOUT)
            if status == 200:
                try:
                    parts = body['candidates'][0]['content']['parts']
                    text = ''.join(p.get('text', '') for p in parts).strip()
                except (KeyError, IndexError, TypeError):
                    print(f'  · {model}: 200 이지만 본문이 비어 있다. 다음 모델로.')
                    break
                if text:
                    print(f'  · 본문 생성: {model}')
                    return model, text
                print(f'  · {model}: 빈 응답. 다음 모델로.')
                break
            # 429·5xx 는 잠깐 뒤 한 번만 다시 시도한다. 404·400 은 그 모델이
            # 없거나 요청이 틀린 것이라 재시도해도 같다.
            if status in (0, 429, 500, 502, 503, 504) and attempt == 1:
                why = '응답 없음' if status == 0 else status
                print(f'  · {model}: {why} — 8초 뒤 한 번 더.')
                time.sleep(8)
                continue
            detail = re.sub(r'\s+', ' ', str(body))[:160]
            print(f'  · {model}: {status or "응답 없음"} — 다음 모델로. {detail}')
            break
    return None


# ── 4. HTML 조립 ────────────────────────────────────────────────────────────

def esc(text) -> str:
    return html.escape(str(text or ''), quote=True)


def collect_images(topic: Topic, limit: int = 3) -> list[tuple[str, str, str]]:
    """(이미지 URL, 설명, 출처 링크) 목록. 트렌드 RSS 가 주는 것만 쓴다."""
    seen: set[str] = set()
    out: list[tuple[str, str, str]] = []
    if topic.picture:
        seen.add(topic.picture)
        out.append((topic.picture, topic.keyword, ''))
    for n in topic.news:
        if len(out) >= limit:
            break
        if n.picture and n.picture not in seen:
            seen.add(n.picture)
            out.append((n.picture, n.title, n.url))
    return out[:limit]


def figure(image: tuple[str, str, str]) -> str:
    url, caption, link = image
    credit = f' · <a href="{esc(link)}" rel="nofollow noopener">기사 보기</a>' if link else ''
    return (
        '<div style="margin:28px 0;text-align:center;">'
        f'<img src="{esc(url)}" alt="{esc(caption)}" '
        'style="max-width:100%;height:auto;border-radius:8px;" />'
        f'<div style="font-size:13px;color:#666;margin-top:8px;">{esc(caption)}{credit}</div>'
        '</div>'
    )


def render_html(topic: Topic, article: dict, news: list[News], images: list) -> str:
    parts: list[str] = []
    summary = article.get('summary') or ''
    if summary:
        parts.append(
            '<p style="background:#f4f1ea;border-left:4px solid #c9c2b0;'
            f'padding:14px 18px;margin:0 0 24px;"><strong>요약</strong> — {esc(summary)}</p>'
        )
    if images:
        parts.append(figure(images[0]))

    sections = article.get('sections') or []
    for i, section in enumerate(sections):
        heading = section.get('heading') or ''
        if heading:
            parts.append(f'<h2 style="margin:32px 0 12px;">{esc(heading)}</h2>')
        for para in section.get('paragraphs') or []:
            parts.append(f'<p style="line-height:1.8;">{esc(para)}</p>')
        # 남은 이미지를 본문 사이에 하나씩 끼운다.
        idx = i + 1
        if idx < len(images) and i < len(sections) - 1:
            parts.append(figure(images[idx]))

    table = article.get('table') or {}
    headers = table.get('headers') or []
    rows = table.get('rows') or []
    if headers and rows:
        cap = table.get('caption') or '한눈에 보기'
        cells = ''.join(f'<th style="border:1px solid #ddd;padding:10px;background:#f4f1ea;text-align:left;">{esc(h)}</th>' for h in headers)
        body = ''.join(
            '<tr>' + ''.join(f'<td style="border:1px solid #ddd;padding:10px;">{esc(c)}</td>' for c in row) + '</tr>'
            for row in rows if isinstance(row, list)
        )
        parts.append(
            f'<h2 style="margin:32px 0 12px;">{esc(cap)}</h2>'
            '<table style="width:100%;border-collapse:collapse;font-size:15px;">'
            f'<thead><tr>{cells}</tr></thead><tbody>{body}</tbody></table>'
        )

    faq = article.get('faq') or []
    if faq:
        parts.append('<h2 style="margin:32px 0 12px;">자주 묻는 질문</h2>')
        for qa in faq:
            parts.append(
                f'<h3 style="margin:20px 0 6px;">Q. {esc(qa.get("q"))}</h3>'
                f'<p style="line-height:1.8;">A. {esc(qa.get("a"))}</p>'
            )

    if news:
        links = ''.join(
            f'<li><a href="{esc(n.url)}" rel="nofollow noopener">{esc(n.title)}</a>'
            + (f' <span style="color:#666;">· {esc(n.source)}</span>' if n.source else '')
            + '</li>'
            for n in news[:8]
        )
        parts.append(f'<h2 style="margin:32px 0 12px;">참고한 기사</h2><ul style="line-height:1.9;">{links}</ul>')

    tags = [t for t in (article.get('tags') or []) if t]
    if tags:
        parts.append(
            '<p style="margin-top:28px;color:#666;font-size:14px;">'
            + ' '.join(f'#{esc(t)}' for t in tags) + '</p>'
        )

    stamp = datetime.now(KST).strftime('%Y-%m-%d %H:%M')
    parts.append(
        '<hr style="margin:36px 0 16px;border:0;border-top:1px solid #e5e0d4;" />'
        '<p style="font-size:13px;color:#777;line-height:1.7;">'
        f'이 글은 {stamp} (KST) 구글 실시간 검색어 “{esc(topic.keyword)}” 와 위에 링크한 '
        '기사 제목을 근거로 자동 작성한 초안입니다. 사실 확인이 필요한 내용은 원문 기사를 '
        '확인해 주세요.</p>'
    )

    return '<div style="max-width:760px;margin:0 auto;font-size:16px;color:#222;">' + ''.join(parts) + '</div>'


# ── 5. 발송 ────────────────────────────────────────────────────────────────

def blogger_access_token() -> str:
    """refresh token 으로 1시간짜리 access token 을 받는다."""
    client_id = env('GOOGLE_CLIENT_ID')
    client_secret = env('GOOGLE_CLIENT_SECRET')
    refresh = env('GOOGLE_REFRESH_TOKEN')
    missing = [n for n, v in (('GOOGLE_CLIENT_ID', client_id),
                              ('GOOGLE_CLIENT_SECRET', client_secret),
                              ('GOOGLE_REFRESH_TOKEN', refresh)) if not v]
    if missing:
        raise SystemExit(f'환경변수가 비어 있다: {", ".join(missing)}\n'
                         '토큰을 받는 법은 docs/routines/blogspot.md 를 본다.')
    try:
        data = http_post_form('https://oauth2.googleapis.com/token', {
            'client_id': client_id, 'client_secret': client_secret,
            'refresh_token': refresh, 'grant_type': 'refresh_token'})
    except urllib.error.HTTPError as e:
        detail = re.sub(r'\s+', ' ', e.read().decode('utf-8', 'replace'))[:300]
        # invalid_grant 은 대개 동의 화면이 "테스트" 상태라 7일 만에 토큰이
        # 만료된 것이다. 이 안내가 없으면 원인을 찾는 데 한참 걸린다.
        hint = ''
        if 'invalid_grant' in detail:
            hint = ('\n  → refresh token 이 만료됐거나 취소됐다. OAuth 동의 화면이 '
                    '"테스트" 상태면 7일마다 만료된다. "프로덕션"으로 바꾸고 '
                    'scripts/blogspot/get_refresh_token.py 로 다시 받는다.')
        raise SystemExit(f'access token 발급 실패 ({e.code}): {detail}{hint}')
    token = data.get('access_token')
    if not token:
        raise SystemExit(f'access token 이 응답에 없다: {data}')
    return token


def blogger_blog_id(token: str) -> str:
    """숫자 blog ID. 지정돼 있지 않으면 블로그 주소로 조회한다."""
    explicit = env('BLOG_ID')
    if explicit:
        return explicit
    url = env('BLOG_URL', DEFAULT_BLOG_URL).rstrip('/')
    query = f'{BLOGGER_API}/blogs/byurl?url={urllib.parse.quote(url, safe="")}'
    try:
        data = json.loads(http_get(query, headers={'Authorization': f'Bearer {token}'}))
    except urllib.error.HTTPError as e:
        detail = re.sub(r'\s+', ' ', e.read().decode('utf-8', 'replace'))[:300]
        raise SystemExit(f'blog ID 조회 실패 ({e.code}) — {url}: {detail}')
    blog_id = data.get('id')
    if not blog_id:
        raise SystemExit(f'blog ID 를 찾지 못했다: {data}')
    return blog_id


def send_via_api(title: str, body_html: str, labels: list[str]) -> str:
    """Blogger API v3 로 발행하고 글 주소를 돌려준다."""
    token = blogger_access_token()
    blog_id = blogger_blog_id(token)
    draft = env('POST_AS_DRAFT', 'false').lower() in ('1', 'true', 'yes')
    url = f'{BLOGGER_API}/blogs/{blog_id}/posts/?isDraft={"true" if draft else "false"}'
    payload = {'kind': 'blogger#post', 'title': title, 'content': body_html}
    if labels:
        payload['labels'] = labels[:20]
    status, body = http_post_json(url, payload, {'Authorization': f'Bearer {token}'})
    if status not in (200, 201):
        detail = re.sub(r'\s+', ' ', str(body))[:400]
        raise SystemExit(f'발행 실패 ({status}): {detail}')
    if draft:
        print('  · 초안으로 저장했다 (POST_AS_DRAFT)')
    return body.get('url') or ''


def send_mail(subject: str, body_html: str) -> None:
    host = env('SMTP_HOST', 'smtp.gmail.com')
    port = int(env('SMTP_PORT', '465'))
    user = env('SMTP_USER')
    password = env('SMTP_PASSWORD')
    to = env('BLOGGER_POST_EMAIL')
    sender = env('SMTP_FROM', user)

    missing = [n for n, v in (('SMTP_USER', user), ('SMTP_PASSWORD', password),
                              ('BLOGGER_POST_EMAIL', to)) if not v]
    if missing:
        raise SystemExit(f'환경변수가 비어 있다: {", ".join(missing)}')

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = formataddr(('JUSTIES 자동 발행', sender))
    msg['To'] = to
    msg.set_content('HTML 을 지원하는 환경에서 열어 주세요.')
    # Blogger 는 #end 뒤를 잘라낸다. 메일 서명이 글에 딸려 들어가는 것을 막는다.
    msg.add_alternative(body_html + '\n#end', subtype='html')

    context = ssl.create_default_context()
    if port == 465:
        with smtplib.SMTP_SSL(host, port, context=context, timeout=60) as s:
            s.login(user, password)
            s.send_message(msg)
    else:
        with smtplib.SMTP(host, port, timeout=60) as s:
            s.starttls(context=context)
            s.login(user, password)
            s.send_message(msg)


# ── 한 바퀴 ────────────────────────────────────────────────────────────────

def run_once(args) -> bool:
    api_key = env('GEMINI_API_KEY')
    if not api_key:
        raise SystemExit('환경변수 GEMINI_API_KEY 가 비어 있다.')
    models = [m.strip() for m in env('GEMINI_MODELS', DEFAULT_MODELS).split(',') if m.strip()]

    print('1) 구글 실시간 검색어를 받는다')
    topics = fetch_trends(args.geo)
    print(f'  · {len(topics)}개 수집')
    if not topics:
        print('검색어를 받지 못했다. 이번 회차는 건너뛴다.')
        return False

    print('2) 이미 쓴 주제를 걸러낸다')
    history_keys = {normalize(k) for _, k, _ in load_history()}
    published = fetch_published_titles(feed_url())
    if published:
        print(f'  · 블로그에 올라간 최근 글 {len(published)}편과 대조')
    topic = pick_topic(topics, history_keys, published)
    if topic is None:
        print('새로 쓸 검색어가 없다. 다음 회차를 기다린다.')
        return False
    print(f'  · 고른 주제: {topic.keyword} (검색량 {topic.traffic or "집계 중"})')

    news = list(topic.news)
    if len(news) < 3:
        news += fetch_news_context(topic.keyword, limit=6 - len(news))
    print(f'  · 참고 기사 {len(news)}건')

    print('3) 본문을 생성한다')
    result = call_gemini(build_prompt(topic, news), api_key, choose_models(api_key, models))
    if result is None:
        print('모든 모델 후보가 실패했다. 이번 회차는 발행하지 않는다.')
        return False
    _, raw = result

    article = extract_json(raw)
    if not article or not article.get('sections'):
        print('  · JSON 파싱 실패 — 응답을 문단으로 나눠 그대로 싣는다.')
        paragraphs = [p.strip() for p in re.split(r'\n{2,}', raw) if p.strip()]
        article = {
            'title': f'{topic.keyword}, 지금 무슨 일인가',
            'summary': paragraphs[0] if paragraphs else '',
            'sections': [{'heading': '', 'paragraphs': paragraphs[1:] or paragraphs}],
            'faq': [], 'table': {}, 'tags': [topic.keyword],
        }

    title = (article.get('title') or f'{topic.keyword}, 지금 무슨 일인가').strip()
    body = render_html(topic, article, news, collect_images(topic))

    if args.out:
        Path(args.out).write_text(f'<!-- {title} -->\n{body}', encoding='utf-8')
        print(f'  · 미리보기 저장: {args.out}')

    if args.dry_run:
        print(f'\n[dry-run] 발행하지 않았다. 제목: {title}')
        return False

    method = env('POST_METHOD', 'api').lower()
    labels = [str(t).strip() for t in (article.get('tags') or []) if str(t).strip()]
    print(f'4) 블로그로 보낸다 (방식: {method})')
    if method == 'mail':
        send_mail(title, body)
        print(f'발행 완료 — {title}')
    else:
        posted = send_via_api(title, body, labels)
        print(f'발행 완료 — {title}')
        if posted:
            print(f'  · {posted}')
    append_history(topic.keyword, title)
    return True


def main() -> int:
    load_dotenv()
    p = argparse.ArgumentParser(description='구글 트렌드 → Gemini → Blogspot 자동 발행')
    p.add_argument('--geo', default=env('TRENDS_GEO', 'KR'), help='트렌드 지역 코드 (기본 KR)')
    p.add_argument('--dry-run', action='store_true', help='메일을 보내지 않고 결과만 확인')
    p.add_argument('--out', default='', help='생성한 HTML 을 이 경로에 저장')
    p.add_argument('--loop', type=int, default=0, metavar='MINUTES',
                   help='이 분 간격으로 계속 반복 (0이면 1회만)')
    args = p.parse_args()

    # 종료 코드: 0 발행함 / 3 발행할 것이 없었음(정상) / 1 오류.
    # 예약 실행이 조용히 며칠씩 아무것도 안 올리는 상태를 로그에서 구분하려는 것이다.
    if not args.loop:
        try:
            return 0 if run_once(args) else 3
        except SystemExit:
            raise
        except Exception as exc:
            print(f'실패: {exc}')
            return 1

    print(f'{args.loop}분 간격 반복 시작. 멈추려면 Ctrl+C.')
    while True:
        print(f'\n=== {datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S")} KST ===')
        try:
            run_once(args)
        except KeyboardInterrupt:
            print('중단했다.')
            return 0
        except Exception as exc:
            print(f'이번 회차 실패(다음 회차에 다시 시도한다): {exc}')
        # 여러 대가 같은 분에 몰리지 않도록 약간 흔든다.
        time.sleep(args.loop * 60 + random.randint(0, 90))


if __name__ == '__main__':
    sys.exit(main())
