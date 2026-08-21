#!/usr/bin/env python3
"""Convert saved dr-park-blog post pages into this site's Markdown files.

The old blog kept posts in a D1 table (title, slug, category, content,
cover_image) and rendered `content` as HTML. The D1 API is outside the scope of
the deploy token, so this reads the rendered public pages instead and turns the
body HTML back into Markdown. Only the tag set that blog actually emitted is
handled — headings, paragraphs, lists, tables, emphasis, links, images, code,
blockquotes — and anything unexpected raises rather than being dropped silently.

Usage:  python3 scripts/migrate-dr-park.py <saved.html> [...]
Writes: src/content/posts/<date>-<slug>.md
"""
from __future__ import annotations

import html
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS = ROOT / "src" / "content" / "posts"

# Old blog category -> (this site's category id, kind)
CATEGORY_MAP = {
    "과학": ("science", "news"),
    "경제": ("finance", "opinion"),
    "정책": ("world", "news"),
    "IT": ("tech", "note"),
    "육아": ("parenting", "note"),
    "취미": ("life", "note"),
}

INLINE = {"strong", "b", "em", "i", "code", "a", "br", "span", "del", "s"}
BLOCK = {"h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "li", "blockquote",
         "pre", "table", "thead", "tbody", "tr", "th", "td", "img", "hr", "div"}


class BodyToMarkdown(HTMLParser):
    """Streams the post body into Markdown blocks."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.blocks: list[str] = []
        self.buf: list[str] = []
        self.stack: list[str] = []
        self.list_stack: list[tuple[str, int]] = []
        self.row: list[str] = []
        self.table: list[list[str]] = []
        self.table_head = False
        self.unknown: set[str] = set()

    # -- helpers ---------------------------------------------------------
    def flush(self, prefix: str = "") -> None:
        text = re.sub(r"[ \t]+", " ", "".join(self.buf)).strip()
        self.buf = []
        if text:
            self.blocks.append(prefix + text)

    def emit_table(self) -> None:
        if not self.table:
            return
        width = max(len(r) for r in self.table)
        rows = [r + [""] * (width - len(r)) for r in self.table]
        head, body = (rows[0], rows[1:]) if self.table_head else ([""] * width, rows)
        lines = ["| " + " | ".join(head) + " |",
                 "| " + " | ".join(["---"] * width) + " |"]
        lines += ["| " + " | ".join(r) + " |" for r in body]
        self.blocks.append("\n".join(lines))
        self.table, self.table_head = [], False

    # -- parser callbacks ------------------------------------------------
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag not in INLINE and tag not in BLOCK:
            self.unknown.add(tag)
            return

        if tag in {"strong", "b"}:
            self.buf.append("**")
        elif tag in {"em", "i"}:
            self.buf.append("*")
        elif tag in {"del", "s"}:
            self.buf.append("~~")
        elif tag == "code" and "pre" not in self.stack:
            self.buf.append("`")
        elif tag == "a":
            self.buf.append("[")
            self.stack.append("a:" + (a.get("href") or ""))
            return
        elif tag == "br":
            self.buf.append("  \n")
        elif tag == "img":
            src, alt = a.get("src", ""), a.get("alt", "")
            if "p" in self.stack or "li" in self.stack:
                self.buf.append(f"![{alt}]({src})")
            else:
                self.flush()
                self.blocks.append(f"![{alt}]({src})")
        elif tag == "hr":
            self.flush()
            self.blocks.append("---")
        elif tag in {"ul", "ol"}:
            self.flush()
            self.list_stack.append((tag, 0))
        elif tag == "li":
            self.flush()
        elif tag in {"table"}:
            self.flush()
        elif tag == "thead":
            self.table_head = True
        elif tag == "tr":
            self.row = []
        elif tag in {"th", "td"}:
            self.buf = []
        elif tag in {"p", "blockquote", "pre", "div"} or re.fullmatch(r"h[1-6]", tag):
            self.flush()

        self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag not in INLINE and tag not in BLOCK:
            return
        if tag in {"strong", "b"}:
            self.buf.append("**")
        elif tag in {"em", "i"}:
            self.buf.append("*")
        elif tag in {"del", "s"}:
            self.buf.append("~~")
        elif tag == "code" and "pre" not in self.stack:
            self.buf.append("`")
        elif tag == "a":
            href = ""
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i].startswith("a:"):
                    href = self.stack.pop(i)[2:]
                    break
            self.buf.append(f"]({href})")
            return
        elif m := re.fullmatch(r"h([1-6])", tag):
            # The old blog started its body at h2; keep that level.
            self.flush("#" * int(m.group(1)) + " ")
        elif tag == "p":
            self.flush()
        elif tag == "blockquote":
            self.flush("> ")
        elif tag == "pre":
            text = "".join(self.buf).strip("\n")
            self.buf = []
            if text:
                self.blocks.append(f"```\n{text}\n```")
        elif tag == "li":
            kind, n = self.list_stack[-1] if self.list_stack else ("ul", 0)
            n += 1
            if self.list_stack:
                self.list_stack[-1] = (kind, n)
            indent = "  " * (len(self.list_stack) - 1)
            marker = "- " if kind == "ul" else f"{n}. "
            self.flush(indent + marker)
        elif tag in {"ul", "ol"}:
            if self.list_stack:
                self.list_stack.pop()
        elif tag in {"th", "td"}:
            self.row.append(re.sub(r"\s+", " ", "".join(self.buf)).strip())
            self.buf = []
        elif tag == "tr":
            if self.row:
                self.table.append(self.row)
            self.row = []
        elif tag == "table":
            self.emit_table()
        elif tag == "div":
            self.flush()

        while self.stack and self.stack[-1].startswith("a:"):
            self.stack.pop()
        if tag in self.stack:
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i] == tag:
                    del self.stack[i]
                    break

    def handle_data(self, data):
        if data.strip() or self.buf:
            self.buf.append(data)

    def result(self) -> str:
        self.flush()
        # Lists must not be split by blank lines between their own items.
        out: list[str] = []
        for block in self.blocks:
            if out and _is_item(block) and _is_item(out[-1]):
                out[-1] += "\n" + block
            else:
                out.append(block)
        return "\n\n".join(out).strip() + "\n"


def _is_item(block: str) -> bool:
    return bool(re.match(r"^(- |\d+\. |  )", block))


def extract(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    art = re.search(r'<article class="post-detail">(.*?)</article>', raw, re.S)
    if not art:
        raise SystemExit(f"{path}: no post-detail article")
    art = art.group(1)

    def one(pattern: str, default: str | None = None) -> str | None:
        m = re.search(pattern, art, re.S)
        return html.unescape(m.group(1)).strip() if m else default

    body = re.search(r'<div class="post-body">(.*)</div>\s*$', art, re.S)
    if not body:
        raise SystemExit(f"{path}: no post-body")

    parser = BodyToMarkdown()
    parser.feed(body.group(1))
    if parser.unknown:
        raise SystemExit(f"{path}: unhandled tags {sorted(parser.unknown)}")

    return {
        "category_label": one(r'<span class="pill">(.*?)</span>') or "",
        "title": one(r"<h1>(.*?)</h1>") or "",
        "date": one(r'<div class="meta">(.*?)</div>') or "",
        "cover": one(r'<img class="cover" src="(.*?)"'),
        "body": parser.result(),
    }


def slugify(title: str) -> str:
    s = re.sub(r"[^0-9A-Za-z가-힣]+", "-", title).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    for arg in sys.argv[1:]:
        post = extract(Path(arg))
        label = post["category_label"]
        if label not in CATEGORY_MAP:
            raise SystemExit(f"unknown category {label!r}")
        category, kind = CATEGORY_MAP[label]
        name = f"{post['date']}-{slugify(post['title'])}.md"
        print(f"{arg} -> {name}  [{category}/{kind}]  cover={post['cover']}")
        (POSTS / f".draft-{name}").write_text(post["body"], encoding="utf-8")
        print(f"  body written to .draft-{name} ({len(post['body'])} chars)")


if __name__ == "__main__":
    main()
