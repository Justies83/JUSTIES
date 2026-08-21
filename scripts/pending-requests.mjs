// Lists the post requests still waiting, so a scheduled run can find its work
// without guessing at the folder layout.
//
//   node scripts/pending-requests.mjs          # 대기 중인 요청만
//   node scripts/pending-requests.mjs --all    # 전부 (상태 포함)
//
// Exit code 0 with no output means nothing is pending — that is a normal result.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../content/requests/', import.meta.url));
const showAll = process.argv.includes('--all');

/** Front matter only, and only the flat scalars/lists this form produces. */
function parse(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const data = {};
  let key = null;
  for (const raw of match[1].split(/\r?\n/)) {
    const item = raw.match(/^\s*-\s+(.*)$/);
    if (item && key) {
      (data[key] ||= []).push(strip(item[1]));
      continue;
    }
    const pair = raw.match(/^([^\s:][^:]*):\s*(.*)$/);
    if (!pair) continue;
    key = pair[1].trim();
    const value = pair[2].trim();
    data[key] = value === '' ? '' : value === '[]' ? [] : strip(value);
  }
  return data;
}

const strip = (v) => v.replace(/^['"]|['"]$/g, '').trim();

let files;
try {
  files = readdirSync(DIR).filter((f) => f.endsWith('.md') && f !== 'README.md');
} catch {
  console.error(`요청 폴더가 없습니다: ${DIR}`);
  process.exit(0);
}

const rows = [];
for (const file of files.sort()) {
  const data = parse(readFileSync(DIR + file, 'utf8'));
  if (!data) continue;
  const status = data['상태'] || '대기';
  if (!showAll && status !== '대기') continue;
  rows.push({ file, status, data });
}

if (rows.length === 0) {
  console.log(showAll ? '요청이 없습니다.' : '대기 중인 요청이 없습니다.');
  process.exit(0);
}

console.log(`${rows.length}건\n`);
for (const { file, status, data } of rows) {
  console.log(`--- content/requests/${file}`);
  console.log(`  상태      ${status}`);
  console.log(`  주제      ${data['주제'] ?? '(없음)'}`);
  if (data['지시사항']) console.log(`  지시사항  ${data['지시사항']}`);
  const links = Array.isArray(data['참고링크']) ? data['참고링크'] : [];
  if (links.length) console.log(`  참고링크  ${links.join('\n            ')}`);
  if (data['섹션']) console.log(`  섹션      ${data['섹션']}`);
  if (data['형식']) console.log(`  형식      ${data['형식']}`);
  if (data['초안으로만'] === 'true') console.log('  초안으로만  예 — draft: true 로 저장할 것');
  if (data['결과']) console.log(`  결과      ${data['결과']}`);
  console.log();
}
