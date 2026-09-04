#!/usr/bin/env python3
"""네이버 블로그 글쓰기 화면에 제목·본문을 채워 넣는 도우미.

발행 버튼은 누르지 않는다 — 사람이 화면을 보고 카테고리·태그·대표사진을
확인한 뒤 직접 발행한다. 완전 자동화가 아니라 "타이핑 대신 해주는" 도구다.

**반드시 사용자 자신의 PC에서 실행한다.** 원격 세션이나 CI에서는 실행하지
않는다 — 첫 로그인은 사람이 브라우저 창에서 직접 하고(캡차·2단계 인증
포함), 그 세션을 로컬에 저장해 재사용하는 구조이기 때문이다. 자세한 준비
과정은 docs/naver-blog.md 를 본다.
"""
import argparse
import re
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit(
        "playwright가 없다.\n"
        "  pip install -r scripts/naver-blog/requirements.txt\n"
        "  python3 -m playwright install chromium\n"
        "를 먼저 실행한다."
    )

PROFILE_DIR = Path(__file__).parent / ".profile"


def parse_post(path: Path) -> tuple[str, str]:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        sys.exit(f"프론트매터를 찾지 못했다: {path}")
    front, body = m.group(1), m.group(2)
    fields: dict[str, str] = {}
    for line in front.splitlines():
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        fields[key.strip()] = value.strip().strip('"')
    title = fields.get("title", path.stem)
    return title, body.strip()


def markdown_to_paragraphs(body: str) -> list[str]:
    """아주 단순한 변환 — 마크다운 문법을 걷어내고 문단 텍스트만 남긴다.

    스마트에디터의 서식(굵게·목록 등)까지 그대로 옮기지는 않는다. 서식이
    중요한 글은 채워 넣은 뒤 사람이 직접 다듬는 것을 전제로 한다.
    """
    paragraphs = []
    for block in re.split(r"\n\s*\n", body):
        block = block.strip()
        if not block:
            continue
        block = re.sub(r"^#+\s*", "", block)
        block = re.sub(r"\*\*(.+?)\*\*", r"\1", block)
        block = re.sub(r"^[-*]\s+", "", block, flags=re.M)
        paragraphs.append(block)
    return paragraphs


def dismiss_resume_dialog(frame) -> None:
    """"이어서 작성하시겠습니까?" 팝업이 뜨면 새로 쓰기를 고른다. 없으면 넘어간다."""
    for label in ["취소", "새로 작성", "작성취소"]:
        try:
            frame.get_by_role("button", name=label).click(timeout=1500)
            return
        except Exception:
            continue


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("file", help="src/content/posts/*.md 경로")
    ap.add_argument("--blog-id", required=True, help="네이버 블로그 ID (blog.naver.com/<id>)")
    ap.add_argument(
        "--headless",
        action="store_true",
        help="창을 띄우지 않는다. 첫 로그인이나 문제 확인 중에는 쓰지 않는다.",
    )
    args = ap.parse_args()

    title, body = parse_post(Path(args.file))
    paragraphs = markdown_to_paragraphs(body)
    if not paragraphs:
        sys.exit("본문이 비어 있다.")

    PROFILE_DIR.mkdir(exist_ok=True)

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            str(PROFILE_DIR),
            headless=args.headless,
            args=["--lang=ko-KR"],
        )
        page = context.pages[0] if context.pages else context.new_page()
        write_url = f"https://blog.naver.com/{args.blog_id}?Redirect=Write"
        page.goto(write_url)

        if "nid.naver.com" in page.url:
            print("로그인 창이 떴다. 브라우저에서 직접 로그인한다(자동 입력 없음).")
            input("로그인을 마치고 글쓰기 화면이 보이면 여기서 Enter...")
            page.goto(write_url)

        page.wait_for_timeout(2000)
        frame = page.frame(name="mainFrame")
        if frame is None:
            context.close()
            sys.exit(
                "mainFrame을 찾지 못했다. --headless 없이 실행해 화면을 직접 보고\n"
                "구조가 바뀌었는지 확인한다 (docs/naver-blog.md '실패하면' 참고)."
            )

        dismiss_resume_dialog(frame)

        try:
            frame.locator(".se-title-text, [data-placeholder='제목']").first.click(timeout=5000)
        except Exception:
            context.close()
            sys.exit("제목 입력란을 찾지 못했다. 셀렉터가 바뀐 것으로 보인다.")
        page.keyboard.type(title)

        try:
            frame.locator(".se-text-paragraph").first.click(timeout=5000)
        except Exception:
            context.close()
            sys.exit("본문 입력란을 찾지 못했다. 셀렉터가 바뀐 것으로 보인다.")

        for para in paragraphs:
            page.keyboard.type(para)
            page.keyboard.press("Enter")

        print()
        print("제목·본문을 채웠다. 이제부터는 직접 확인한다:")
        print("  - 카테고리·태그·대표 이미지")
        print("  - 문단 서식(이 도구는 굵게/목록 서식을 옮기지 않는다)")
        print("  - 확인이 끝나면 '발행' 버튼은 직접 누른다 — 이 스크립트는 누르지 않는다")
        input("\n끝났으면 Enter (브라우저 창을 닫는다)...")
        context.close()


if __name__ == "__main__":
    main()
