// Turns a post in src/content/posts/ into a copy-and-paste package for the
// Naver editor. Naver ended its publishing API in 2020 and its terms bar
// automated posting, so the editor work stays a human step — this only removes
// the retyping.
//
//   node scripts/naver-blog/make-package.mjs src/content/posts/<글>.md
//   npm run naver -- src/content/posts/<글>.md
//
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const args = process.argv.slice(2);
const source = args.find((a) => !a.startsWith('--'));
if (!source) {
  console.error('사용법: node scripts/naver-blog/make-package.mjs <src/content/posts/글.md>');
  process.exit(1);
}

const outRoot = args.find((a) => a.startsWith('--out='))?.slice(6) ?? 'naver-package';
const slug = basename(source, '.md');
const text = readFileSync(source, 'utf8');

const split = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
if (!split) {
  console.error(`프론트매터를 찾지 못했다: ${source}`);
  process.exit(1);
}

/** Front matter only, and only the flat scalars/lists these posts use. */
function parseFront(block) {
  const data = {};
  for (const raw of block.split(/\r?\n/)) {
    const pair = raw.match(/^([^\s:][^:]*):\s*(.*)$/);
    if (!pair) continue;
    const value = pair[2].trim();
    const list = value.match(/^\[(.*)\]$/);
    data[pair[1].trim()] = list
      ? list[1].split(',').map((v) => v.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
      : value.replace(/^['"]|['"]$/g, '');
  }
  return data;
}

const front = parseFront(split[1]);
const links = [];
const images = [];

// The archive escapes ~ so markdown does not read a pair as strikethrough.
// Naver's editor is not markdown, so the backslash would show up literally.
const unescape = (s) => s.replace(/\\([~*_`[\]])/g, '$1');

function inline(s) {
  return unescape(
    s
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
        images.push({ alt, src });
        return '';
      })
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
        links.push({ label, url });
        return label;
      })
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
      .replace(/`([^`]+)`/g, '$1'),
  );
}

const isList = (line) => /^\s*(?:[-*]\s+|\d+\.\s+)/.test(line);
const headings = [];

// Posts are hard-wrapped at ~90 columns. Pasting that into Naver keeps every
// line break, so paragraphs have to be joined back into single lines.
function toPlainText(markdown) {
  const out = [];
  let fenced = false;
  for (const block of markdown.trim().split(/\r?\n\s*\r?\n/)) {
    const lines = block.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l !== '');
    if (lines.length === 0) continue;

    if (lines[0].startsWith('```')) fenced = !fenced;
    if (fenced || lines[0].startsWith('```')) {
      out.push(lines.join('\n')); // 코드는 한 글자도 바꾸지 않는다
      continue;
    }
    if (lines[0].startsWith('|')) {
      // 표 구조는 사람이 편집기에서 다시 만든다. 칸 안의 마크다운만 걷어낸다.
      out.push(lines.map(inline).join('\n'));
      continue;
    }
    if (/^#{1,6}\s/.test(lines[0])) {
      const heading = inline(lines[0].replace(/^#{1,6}\s*/, ''));
      headings.push(heading);
      out.push(heading);
      continue;
    }
    if (lines.some(isList)) {
      // A wrapped list item continues on the next line; fold it back first, or
      // markup spanning the break (**…\n…**) survives into the paste.
      const items = [];
      for (const line of lines) {
        if (isList(line) || items.length === 0) items.push(line);
        else items[items.length - 1] += ` ${line.trim()}`;
      }
      out.push(
        items
          .map((l) => inline(l.replace(/^\s*[-*]\s+/, '· ').replace(/^\s*(\d+\.)\s+/, '$1 ')))
          .join('\n'),
      );
      continue;
    }
    out.push(inline(lines.map((l) => l.replace(/^>\s?/, '')).join(' ')));
  }
  return out.join('\n\n') + '\n';
}

const body = toPlainText(split[2]);
const tags = Array.isArray(front.tags) ? front.tags : [];

const outDir = join(outRoot, slug);
mkdirSync(outDir, { recursive: true });

const write = (name, content) => writeFileSync(join(outDir, name), content, 'utf8');

write('01_title.txt', `${front.title ?? slug}\n`);
write('02_body.txt', body);
write('03_tags.txt', tags.length ? tags.map((t) => `#${t}`).join(' ') + '\n' : '');
write(
  '04_references.txt',
  links.length ? links.map((l) => `${l.label} — ${l.url}`).join('\n') + '\n' : '',
);

const warnings = [];
if (/```|^\|/m.test(split[2])) warnings.push('코드블록 또는 표가 있다 — 네이버 편집기에서 직접 다시 만든다');
if (images.length) warnings.push(`이미지 ${images.length}개는 직접 업로드한다: ${images.map((i) => i.src).join(', ')}`);
if (front.category === 'finance') warnings.push('시장 글이다 — 투자 권유가 아니라는 고지를 본문 끝에 남긴다');

write(
  'publish-checklist.md',
  [
    `# ${front.title ?? slug} — 발행 전 확인`,
    '',
    `- 원문: ${source}`,
    `- 분류: ${front.category ?? '(없음)'} / ${front.kind ?? '(없음)'}`,
    '',
    '## 붙여넣기',
    '',
    '1. `01_title.txt` → 제목',
    '2. `02_body.txt` → 본문 (붙여넣은 뒤 소제목·굵게 서식은 직접 지정)',
    '3. `03_tags.txt` → 태그',
    '4. `04_references.txt` → 본문 끝 출처 목록',
    '',
    '## 소제목으로 지정할 줄',
    '',
    ...(headings.length ? headings.map((h) => `- ${h}`) : ['- (없음)']),
    '',
    '## 사람이 확인할 것',
    '',
    '- [ ] 사실 / 해석 / 아직 확인되지 않은 것이 본문에서 구분되어 있다',
    '- [ ] 수치에 기준 시점과 출처가 붙어 있다',
    '- [ ] 언론사 사진·기업 배포 자료를 쓰지 않았다',
    '- [ ] 카테고리와 공개 설정을 확인했다',
    ...warnings.map((w) => `- [ ] ${w}`),
    '',
    '## 발행',
    '',
    '발행 버튼은 사람이 직접 누른다. 자동화하지 않는다 — `docs/naver-blog.md` 참고.',
    '',
  ].join('\n'),
);

console.log(`${outDir}/`);
console.log(`  01_title.txt        ${front.title ?? slug}`);
console.log(`  02_body.txt         ${body.split('\n\n').length}개 문단`);
console.log(`  03_tags.txt         ${tags.length}개`);
console.log(`  04_references.txt   링크 ${links.length}개`);
console.log('  publish-checklist.md');
for (const w of warnings) console.log(`  ! ${w}`);
