#!/usr/bin/env python3
"""Blogger API 용 refresh token 을 받는다. 내 PC 에서 딱 한 번만 돌린다.

한 번 받은 refresh token 은 저장소 시크릿(GOOGLE_REFRESH_TOKEN)에 넣어 두면
GitHub Actions 가 그것으로 매번 access token 을 새로 발급받는다.

먼저 준비할 것 (Google Cloud Console):
  1. 프로젝트를 하나 만든다.
  2. API 및 서비스 → 라이브러리 → "Blogger API v3" 사용 설정.
  3. Google 인증 플랫폼 → 대상 (예전 이름은 OAuth 동의 화면) → 사용자 유형
     "외부".
     ★ 게시 상태를 "프로덕션" 으로 바꾼 뒤에 이 스크립트를 돌린다.
       "테스트 중" 상태에서 받은 refresh token 은 7일 만에 만료되고, 나중에
       프로덕션으로 바꿔도 그 토큰은 되살아나지 않는다. 게시가 먼저다.
       "앱 게시" 버튼이 회색이면 브랜딩 페이지에서 앱 이름과 이메일 두 개를
       채운다. 로고는 올리지 않는다 (인증 심사 대상이 된다).
  4. 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID →
     애플리케이션 유형 "데스크톱 앱". 여기서 나온 클라이언트 ID 와
     보안 비밀번호를 아래에 넣는다.

실행:
  python3 scripts/blogspot/get_refresh_token.py --secrets client_secret_....json
  python3 scripts/blogspot/get_refresh_token.py          # 직접 붙여넣기
  python3 scripts/blogspot/get_refresh_token.py --port 8765

--secrets 는 콘솔의 클라이언트 목록에서 받은 JSON 파일이다. 클라이언트 ID 와
보안 비밀번호를 손으로 옮기다 틀리는 일이 없어진다.

브라우저가 열리고 계정을 고르면 끝난다. "이 앱은 확인되지 않았습니다" 경고가
나오면 고급 → 안전하지 않은 페이지로 이동을 누른다. 본인이 만든 앱이다.
"""
from __future__ import annotations

import argparse
import getpass
import http.server
import json
import os
import secrets
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from pathlib import Path

AUTH = 'https://accounts.google.com/o/oauth2/v2/auth'
TOKEN = 'https://oauth2.googleapis.com/token'
SCOPE = 'https://www.googleapis.com/auth/blogger'

received: dict[str, str] = {}


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        # 브라우저는 /favicon.ico 같은 것을 먼저 물어보기도 한다. 그것을
        # 응답으로 세고 서버를 닫으면 정작 인증 코드를 받지 못한다.
        if 'code' not in query and 'error' not in query:
            self.send_response(204)
            self.end_headers()
            return

        received.update({k: v[0] for k, v in query.items()})
        ok = 'code' in received
        message = ('인증됐다. 이 창을 닫고 터미널로 돌아간다.' if ok
                   else f'인증 실패: {received.get("error", "알 수 없는 오류")}')
        body = f'<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;padding:40px">{message}</body>'
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(body.encode('utf-8'))
        threading.Thread(target=self.server.shutdown, daemon=True).start()

    def log_message(self, *args):  # 요청 로그를 찍지 않는다.
        pass


def read_secrets_file(path: str) -> tuple[str, str]:
    """콘솔에서 받은 client_secret_*.json 에서 ID 와 비밀번호를 꺼낸다."""
    try:
        data = json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as exc:
        print(f'JSON 을 읽지 못했다: {exc}')
        return '', ''
    # 데스크톱 앱은 "installed", 웹 앱은 "web" 아래에 들어 있다.
    node = data.get('installed') or data.get('web') or data
    return str(node.get('client_id', '')).strip(), str(node.get('client_secret', '')).strip()


def main() -> int:
    ap = argparse.ArgumentParser(description='Blogger refresh token 받기')
    ap.add_argument('--secrets', default='', metavar='JSON',
                    help='콘솔에서 받은 client_secret_*.json 경로')
    ap.add_argument('--port', type=int, default=8765, help='되돌아올 로컬 포트')
    args = ap.parse_args()

    if args.secrets:
        client_id, client_secret = read_secrets_file(args.secrets)
        if client_id:
            print(f'JSON 에서 읽었다: {client_id}')
    else:
        client_id = os.environ.get('GOOGLE_CLIENT_ID') or input('클라이언트 ID: ').strip()
        client_secret = os.environ.get('GOOGLE_CLIENT_SECRET') or getpass.getpass('클라이언트 보안 비밀번호: ').strip()
    if not client_id or not client_secret:
        print('클라이언트 ID 와 보안 비밀번호가 둘 다 있어야 한다.')
        return 1

    redirect = f'http://localhost:{args.port}'
    state = secrets.token_urlsafe(16)
    url = AUTH + '?' + urllib.parse.urlencode({
        'client_id': client_id,
        'redirect_uri': redirect,
        'response_type': 'code',
        'scope': SCOPE,
        # offline + consent 라야 refresh token 이 함께 온다. 이미 동의한
        # 계정이면 consent 없이는 access token 만 오고 끝난다.
        'access_type': 'offline',
        'prompt': 'consent',
        'state': state,
    })

    print(f'\n브라우저에서 아래 주소를 연다 (자동으로 열리지 않으면 복사해서 붙여넣는다):\n\n{url}\n')
    try:
        webbrowser.open(url)
    except Exception:
        pass

    print(f'{redirect} 에서 응답을 기다린다...')
    with http.server.HTTPServer(('127.0.0.1', args.port), Handler) as server:
        server.serve_forever()

    if received.get('state') != state:
        print('state 가 맞지 않는다. 다시 시도한다.')
        return 1
    if 'code' not in received:
        print(f'인증 코드를 받지 못했다: {received}')
        return 1

    data = urllib.parse.urlencode({
        'code': received['code'],
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect,
        'grant_type': 'authorization_code',
    }).encode('utf-8')
    req = urllib.request.Request(TOKEN, data=data, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            tokens = json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f'토큰 교환 실패 ({e.code}): {e.read().decode("utf-8", "replace")[:400]}')
        return 1

    refresh = tokens.get('refresh_token')
    if not refresh:
        print('refresh token 이 오지 않았다. 이미 동의한 계정이면 '
              'https://myaccount.google.com/permissions 에서 이 앱의 액세스를 '
              '지운 뒤 다시 실행한다.')
        return 1

    print('\n' + '─' * 60)
    print('저장소 시크릿에 넣을 값 (Settings → Secrets and variables → Actions)')
    print('─' * 60)
    print(f'GOOGLE_CLIENT_ID       {client_id}')
    print('GOOGLE_CLIENT_SECRET   (방금 입력한 값)')
    print(f'GOOGLE_REFRESH_TOKEN   {refresh}')
    print('─' * 60)
    print('이 값은 비밀번호와 같다. 채팅이나 파일에 붙여 두지 않는다.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
