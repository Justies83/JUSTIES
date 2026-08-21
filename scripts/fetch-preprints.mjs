// Pulls preprints for a date range straight from the bioRxiv/medRxiv public API.
//
// The scheduled morning session has no MCP tools, so the science brief cannot
// depend on them. This uses the public REST endpoint over plain fetch, which
// also means the date, DOI and category come from the source rather than from a
// news write-up.
//
//   node scripts/fetch-preprints.mjs 2026-08-20                     # one day
//   node scripts/fetch-preprints.mjs 2026-08-19 2026-08-20           # a range
//   node scripts/fetch-preprints.mjs 2026-08-20 2026-08-20 medrxiv   # medRxiv
//
// Output: one block per preprint, grouped by category, newest first.

const [from, to = from, server = 'biorxiv'] = process.argv.slice(2);

if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
  console.error('usage: node scripts/fetch-preprints.mjs <YYYY-MM-DD> [YYYY-MM-DD] [biorxiv|medrxiv]');
  process.exit(1);
}

const PAGE = 100; // the API caps a page at 100 and reports the true total

async function page(cursor) {
  const url = `https://api.biorxiv.org/details/${server}/${from}/${to}/${cursor}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

const all = [];
let cursor = 0;
let total = Infinity;

// Guard the loop: a malformed total should not spin forever.
for (let guard = 0; cursor < total && guard < 40; guard += 1) {
  const data = await page(cursor);
  const message = data.messages?.[0] ?? {};
  total = Number(message.total ?? 0);
  const batch = data.collection ?? [];
  all.push(...batch);
  if (batch.length === 0) break;
  cursor += batch.length;
}

// One DOI can appear twice when a revision lands in the same window; keep the
// latest version only.
const latest = new Map();
for (const p of all) {
  const seen = latest.get(p.doi);
  if (!seen || Number(p.version) > Number(seen.version)) latest.set(p.doi, p);
}

const byCategory = new Map();
for (const p of latest.values()) {
  const list = byCategory.get(p.category) ?? [];
  list.push(p);
  byCategory.set(p.category, list);
}

const sorted = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length);

console.log(`${server} ${from}..${to} — ${latest.size}편 (분야 ${sorted.length}개)\n`);

for (const [category, items] of sorted) {
  console.log(`\n### ${category} (${items.length})`);
  for (const p of items) {
    console.log(`\n- ${p.title}`);
    console.log(`  DOI   https://doi.org/${p.doi}`);
    console.log(`  날짜  ${p.date}  v${p.version}  ${p.type ?? ''}`);
    console.log(`  교신  ${p.author_corresponding ?? '-'} (${p.author_corresponding_institution ?? '-'})`);
    const abstract = (p.abstract ?? '').replace(/\s+/g, ' ').trim();
    if (abstract) console.log(`  초록  ${abstract.slice(0, 400)}${abstract.length > 400 ? '…' : ''}`);
  }
}
