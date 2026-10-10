// 10/9 미장 마감 차트: 3대 지수 금요일 종가 등락률 + 유가·국채금리 수준
// 수치: 이데일리(2026.10.10, 10월 9일 현지 종가 기준) · 세계일보(2026.10.10, AP/뉴시스)
import { writeFileSync } from 'node:fs';

const ink = '#20231f';
const soft = '#62655d';
const teal = '#16756a';
const coral = '#e0795b';
const line = 'rgba(32,35,31,.16)';
const paper = '#f4f1ea';
const font = "'IBM Plex Sans KR',-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif";
const mono = "'IBM Plex Mono',ui-monospace,monospace";

const W = 900, H = 520, pad = { l: 90, r: 90, t: 100, b: 92 };

const data = [
  { name: '다우존스', val: 51654.95, pct: 0.83, c: teal },
  { name: 'S&P 500', val: 7811.54, pct: 0.59, c: teal },
  { name: '나스닥', val: 27366.17, pct: 0.64, c: teal },
];

const maxPct = 1.0;
const chartW = W - pad.l - pad.r;
const barW = 92;
const gap = (chartW - barW * 3) / 2;
const zeroY = H - pad.b;
const y = (p) => zeroY - (p / maxPct) * (H - pad.t - pad.b);

let inner = `
  <text x="${pad.l}" y="46" font-family="${mono}" font-size="15" letter-spacing="3" fill="${soft}">10.09 (FRI) CLOSE · 종가 기준</text>
  <text x="${pad.l}" y="76" font-family="${font}" font-size="20" fill="${ink}">10월 9일 뉴욕증시 3대 지수 마감</text>
  <line x1="${pad.l}" y1="${zeroY}" x2="${W - pad.r}" y2="${zeroY}" stroke="${ink}" stroke-width="1.6"/>
  <line x1="${pad.l}" y1="${y(maxPct)}" x2="${W - pad.r}" y2="${y(maxPct)}" stroke="${line}" stroke-dasharray="2 5"/>
  <text x="${pad.l - 12}" y="${y(maxPct) + 5}" text-anchor="end" font-family="${mono}" font-size="14" fill="${soft}">+1.0%</text>
  <text x="${pad.l - 12}" y="${y(0.5) + 5}" text-anchor="end" font-family="${mono}" font-size="14" fill="${soft}">+0.5%</text>`;

data.forEach((d, i) => {
  const cx = pad.l + gap / 2 + i * (barW + gap) + barW / 2;
  const top = y(d.pct);
  inner += `
  <rect x="${cx - barW / 2}" y="${top}" width="${barW}" height="${zeroY - top}" fill="${d.c}"/>
  <text x="${cx}" y="${top - 16}" text-anchor="middle" font-family="${mono}" font-size="19" fill="${teal}">+${d.pct.toFixed(2)}%</text>
  <text x="${cx}" y="${top - 40}" text-anchor="middle" font-family="${mono}" font-size="18" fill="${ink}">${d.val.toLocaleString('en-US', { maximumFractionDigits: 2 })}</text>
  <text x="${cx}" y="${zeroY + 34}" text-anchor="middle" font-family="${font}" font-size="19" fill="${ink}">${d.name}</text>`;
});

inner += `
  <text x="${pad.l}" y="${H - 22}" font-family="${mono}" font-size="13" fill="${soft}">도표는 이데일리(2026.10.10)·세계일보(2026.10.10) 기사 수치로 직접 작성 · 브렌트유 $104.72 / WTI $91.85 / 美 10년물 5.243%</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
  <rect width="${W}" height="${H}" fill="${paper}"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="${line}"/>
  ${inner}
</svg>`;

writeFileSync('public/images/nyse-friday-close-chart-2026-10-10.svg', svg);
console.log('chart written');
