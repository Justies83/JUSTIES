// Charts drawn from cited figures, so posts carry a visual without borrowing a
// news photo. SVG rather than PNG: the browser supplies the Korean font, which
// a server-side rasteriser here cannot.
//
//   node scripts/make-charts.mjs
import { writeFileSync } from 'node:fs';

const ink = '#20231f';
const soft = '#62655d';
const teal = '#16756a';
const coral = '#e0795b';
const line = 'rgba(32,35,31,.16)';
const paper = '#f4f1ea';

const font = "'IBM Plex Sans KR',-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif";
const mono = "'IBM Plex Mono',ui-monospace,monospace";

const frame = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
  <rect width="${w}" height="${h}" fill="${paper}"/>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="${line}"/>
  ${inner}
</svg>`;

/* ------------------------------------------------------------------ *
 * 1. KOSPI / KOSDAQ, 8/18 - 8/21
 *    Figures: 국제뉴스, 아시아경제 (8/21 and the 8/20 recap).
 *    8/20 and 8/21 are intraday readings, not closes — labelled as such.
 * ------------------------------------------------------------------ */
function marketChart() {
  const W = 900;
  const H = 520;
  const pad = { l: 74, r: 74, t: 92, b: 74 };
  const days = ['8/18', '8/19', '8/20', '8/21'];
  const kospi = [6869.83, 6471.17, 6871.56, 6836.97];
  const kosdaq = [834.2, 824.46, 841.15, 803.21];

  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (days.length - 1);
  const scale = (vals) => {
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const span = hi - lo || 1;
    return (v) => H - pad.b - ((v - lo) / span) * (H - pad.t - pad.b);
  };
  const yk = scale(kospi);
  const yq = scale(kosdaq);

  const path = (vals, y) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ');
  const dots = (vals, y, color) =>
    vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="${paper}" stroke="${color}" stroke-width="2.5"/>`).join('');
  const labels = (vals, y, color, dy) =>
    vals
      .map(
        (v, i) =>
          `<text x="${x(i)}" y="${y(v) + dy}" text-anchor="middle" font-family="${mono}" font-size="15" fill="${color}">${v.toLocaleString('en-US')}</text>`
      )
      .join('');

  return frame(
    W,
    H,
    `
  <text x="${pad.l}" y="44" font-family="${mono}" font-size="15" letter-spacing="3" fill="${soft}">KOSPI / KOSDAQ · 2026.08.18–21</text>
  <text x="${pad.l}" y="70" font-family="${font}" font-size="17" fill="${ink}">사흘 만에 되돌린 지수</text>

  ${days.map((d, i) => `<line x1="${x(i)}" y1="${pad.t - 10}" x2="${x(i)}" y2="${H - pad.b + 8}" stroke="${line}" stroke-dasharray="2 5"/>`).join('')}
  ${days.map((d, i) => `<text x="${x(i)}" y="${H - pad.b + 34}" text-anchor="middle" font-family="${mono}" font-size="16" fill="${soft}">${d}</text>`).join('')}

  <path d="${path(kospi, yk)}" fill="none" stroke="${teal}" stroke-width="2.6"/>
  <path d="${path(kosdaq, yq)}" fill="none" stroke="${coral}" stroke-width="2.6" stroke-dasharray="7 5"/>
  ${dots(kospi, yk, teal)}${dots(kosdaq, yq, coral)}
  ${labels(kospi, yk, teal, -16)}${labels(kosdaq, yq, coral, 26)}

  <g font-family="${mono}" font-size="15">
    <rect x="${W - pad.r - 168}" y="36" width="12" height="3" fill="${teal}"/>
    <text x="${W - pad.r - 148}" y="42" fill="${soft}">KOSPI</text>
    <rect x="${W - pad.r - 168}" y="60" width="12" height="3" fill="${coral}"/>
    <text x="${W - pad.r - 148}" y="66" fill="${soft}">KOSDAQ</text>
  </g>

  <text x="${pad.l}" y="${H - 24}" font-family="${mono}" font-size="13" fill="${soft}">8/20 · 8/21 은 장중 수치 (종가 아님) — 두 지수의 축은 서로 다름</text>`
  );
}

/* ------------------------------------------------------------------ *
 * 2. The bandwidth wall.
 *    Figures: SK하이닉스 via 디일렉 — compute ~3x per 2 years,
 *    interconnect bandwidth ~1.4x. Plotted as relative growth from 1.
 * ------------------------------------------------------------------ */
function bandwidthChart() {
  const W = 900;
  const H = 520;
  const pad = { l: 84, r: 96, t: 96, b: 78 };
  const steps = 4; // 0, 2, 4, 6 years
  const compute = Array.from({ length: steps }, (_, i) => 3 ** i);
  const link = Array.from({ length: steps }, (_, i) => 1.4 ** i);

  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (steps - 1);
  // Log scale, or the interconnect line flattens into the axis.
  const hi = Math.log(Math.max(...compute));
  const y = (v) => H - pad.b - (Math.log(v) / hi) * (H - pad.t - pad.b);

  const path = (vals) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ');
  const gap = `M${x(steps - 1)} ${y(compute[steps - 1])} L${x(steps - 1)} ${y(link[steps - 1])}`;

  return frame(
    W,
    H,
    `
  <text x="${pad.l}" y="44" font-family="${mono}" font-size="15" letter-spacing="3" fill="${soft}">THE BANDWIDTH WALL</text>
  <text x="${pad.l}" y="72" font-family="${font}" font-size="17" fill="${ink}">연산은 2년에 3배, 연결은 1.4배 — 벌어지는 격차</text>

  ${Array.from({ length: steps }, (_, i) => `<text x="${x(i)}" y="${H - pad.b + 34}" text-anchor="middle" font-family="${mono}" font-size="16" fill="${soft}">+${i * 2}년</text>`).join('')}
  <line x1="${pad.l}" y1="${H - pad.b}" x2="${W - pad.r}" y2="${H - pad.b}" stroke="${line}"/>

  <path d="${gap}" stroke="${ink}" stroke-width="1.5" stroke-dasharray="3 4" opacity=".5"/>
  <path d="${path(compute)}" fill="none" stroke="${teal}" stroke-width="2.8"/>
  <path d="${path(link)}" fill="none" stroke="${coral}" stroke-width="2.8" stroke-dasharray="7 5"/>

  ${compute.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="${paper}" stroke="${teal}" stroke-width="2.5"/>`).join('')}
  ${link.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="${paper}" stroke="${coral}" stroke-width="2.5"/>`).join('')}

  <text x="${x(steps - 1) + 12}" y="${y(compute[steps - 1]) + 6}" font-family="${mono}" font-size="15" fill="${teal}">연산 ×27</text>
  <text x="${x(steps - 1) + 12}" y="${y(link[steps - 1]) + 6}" font-family="${mono}" font-size="15" fill="${coral}">연결 ×2.7</text>

  <text x="${pad.l}" y="${H - 24}" font-family="${mono}" font-size="13" fill="${soft}">로그 축 · 증가율(2년당 3배 / 1.4배)을 1에서 출발시켜 계산한 상대값</text>`
  );
}

/* ------------------------------------------------------------------ *
 * 3. Kakao's split, in the two numbers that matter.
 *    Left  — the split ratio resolved by the board on 2026-08-21.
 *    Right — the sell-side SOTP consensus against the recent market cap.
 *    Figures: 뉴스핌 / 인베스트조선 (ratio), CEO매거진 (SOTP, market cap).
 * ------------------------------------------------------------------ */
function kakaoSplitChart() {
  const W = 900;
  const H = 520;
  const mid = 452;

  // Left: split ratio as one stacked bar.
  const barX = 74;
  const barW = 300;
  const barY = 214;
  const barH = 56;
  const xShare = 0.6351463;
  const xW = Math.round(barW * xShare);

  // Right: two columns on a shared scale.
  const colBase = 400;
  const colTop = 176;
  const scale = (v) => colBase - (v / 34.2) * (colBase - colTop);
  const c1 = mid + 78;
  const c2 = mid + 238;
  const colW = 74;

  return frame(
    W,
    H,
    `
  <text x="${barX}" y="52" font-family="${mono}" font-size="15" letter-spacing="3" fill="${soft}">KAKAO SPLIT · 2026.08.21</text>
  <text x="${barX}" y="80" font-family="${font}" font-size="17" fill="${ink}">쪼개는 비율과, 시장이 매기던 값</text>
  <line x1="${mid}" y1="120" x2="${mid}" y2="${H - 74}" stroke="${line}" stroke-dasharray="3 6"/>

  <text x="${barX}" y="150" font-family="${mono}" font-size="14" letter-spacing="2" fill="${soft}">분할비율 (순자산 장부가액 기준)</text>
  <text x="${barX}" y="192" font-family="${font}" font-size="15" fill="${ink}">존속 카카오X <tspan font-family="${mono}" fill="${teal}">63.5%</tspan>  ·  신설 카카오AI <tspan font-family="${mono}" fill="${coral}">36.5%</tspan></text>
  <rect x="${barX}" y="${barY}" width="${xW}" height="${barH}" fill="${teal}" rx="3"/>
  <rect x="${barX + xW}" y="${barY}" width="${barW - xW}" height="${barH}" fill="${coral}" rx="3"/>
  <text x="${barX + 14}" y="${barY + 35}" font-family="${mono}" font-size="16" fill="${paper}">카카오X</text>
  <text x="${barX + xW + 10}" y="${barY + 35}" font-family="${mono}" font-size="14" fill="${paper}">AI</text>
  <text x="${barX}" y="${barY + barH + 34}" font-family="${font}" font-size="14" fill="${soft}">카카오AI로 이전되는 순자산 2조 9,149억원</text>
  <text x="${barX}" y="${barY + barH + 56}" font-family="${font}" font-size="14" fill="${soft}">분할기일 2027.01.01 · 기존 주주는 양쪽을 모두 배정</text>

  <text x="${mid + 34}" y="150" font-family="${mono}" font-size="14" letter-spacing="2" fill="${soft}">잠재가치와 시가총액 (조원)</text>
  <line x1="${mid + 34}" y1="${colBase}" x2="${W - 44}" y2="${colBase}" stroke="${line}"/>

  <rect x="${c1}" y="${scale(34.2)}" width="${colW}" height="${colBase - scale(34.2)}" fill="${teal}" rx="3"/>
  <text x="${c1 + colW / 2}" y="${scale(34.2) - 12}" text-anchor="middle" font-family="${mono}" font-size="17" fill="${teal}">34.2</text>
  <text x="${c1 + colW / 2}" y="${colBase + 26}" text-anchor="middle" font-family="${font}" font-size="14" fill="${soft}">증권가 SOTP</text>

  <rect x="${c2}" y="${scale(16.8)}" width="${colW}" height="${colBase - scale(16.8)}" fill="${coral}" rx="3"/>
  <text x="${c2 + colW / 2}" y="${scale(16.8) - 12}" text-anchor="middle" font-family="${mono}" font-size="17" fill="${coral}">16.8</text>
  <text x="${c2 + colW / 2}" y="${colBase + 26}" text-anchor="middle" font-family="${font}" font-size="14" fill="${soft}">3개월 평균 시총</text>

  <path d="M${c1 + colW + 12} ${scale(34.2)} L${c2 - 12} ${scale(34.2)}" stroke="${ink}" stroke-width="1.2" stroke-dasharray="3 4" opacity=".45"/>
  <path d="M${c2 + colW / 2} ${scale(16.8) - 34} L${c2 + colW / 2} ${scale(34.2) + 6}" stroke="${ink}" stroke-width="1.2" stroke-dasharray="3 4" opacity=".45"/>
  <text x="${mid + 34}" y="${colBase + 62}" font-family="${font}" font-size="14" fill="${ink}">차이 <tspan font-family="${mono}">17.4조원</tspan> — 분할 발표일 주가는 <tspan font-family="${mono}" fill="${coral}">-12.1%</tspan></text>

  <text x="${barX}" y="${H - 28}" font-family="${mono}" font-size="13" fill="${soft}">분할비율: 뉴스핌·인베스트조선 / SOTP·시총: CEO매거진 (2026.08 기준) — 수치로 직접 작성</text>`
  );
}

writeFileSync(new URL('../public/images/kakao-split-2026-08-21.svg', import.meta.url), kakaoSplitChart());
writeFileSync(new URL('../public/images/market-2026-08-21.svg', import.meta.url), marketChart());
writeFileSync(new URL('../public/images/bandwidth-wall-2026-08-21.svg', import.meta.url), bandwidthChart());
console.log('wrote market-2026-08-21.svg, bandwidth-wall-2026-08-21.svg, kakao-split-2026-08-21.svg');
