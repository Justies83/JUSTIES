// One-off generator for the default social image (public/og.png).
//
// Run it only when the brand art changes:
//   node scripts/make-og.mjs
//
// The output PNG is committed, so no host ever needs a font installed at build
// time. Text here is deliberately Latin-only: social platforms render the
// Korean title from `og:title` themselves, and rasterising Hangul would mean
// shipping a CJK font just for this one image.
import sharp from 'sharp';

const W = 1200;
const H = 630;

const paper = '#f4f1ea';
const ink = '#20231f';
const soft = '#62655d';
const teal = '#16756a';
const coral = '#e0795b';

const glyphs = ['△', '✦', '◎', '◇', '▣', '♡'];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="grain" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.6" fill="${ink}" fill-opacity="0.07"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="${paper}"/>
  <rect width="${W}" height="${H}" fill="url(#grain)"/>
  <rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none"
        stroke="${ink}" stroke-opacity="0.16"/>

  <!-- corner marks -->
  <path d="M26 86 L86 86 M86 26 L86 86" stroke="${coral}" stroke-width="2" fill="none"/>
  <path d="M${W - 26} ${H - 86} L${W - 86} ${H - 86} M${W - 86} ${H - 26} L${W - 86} ${H - 86}"
        stroke="${teal}" stroke-width="2" fill="none"/>

  <text x="86" y="146" font-family="DejaVu Sans Mono" font-size="20" letter-spacing="6"
        fill="${soft}">PERSONAL ARCHIVE</text>

  <text x="84" y="286" font-family="DejaVu Serif" font-weight="bold" font-size="118"
        letter-spacing="-2" fill="${ink}">JUSTIES</text>
  <text x="86" y="344" font-family="DejaVu Sans" font-size="30" fill="${teal}">
    Questions collected. Thoughts kept.
  </text>

  <line x1="86" y1="404" x2="${W - 86}" y2="404" stroke="${ink}" stroke-opacity="0.16"/>

  <text x="86" y="456" font-family="DejaVu Sans" font-size="22" fill="${soft}">
    Research · Science · World · Finance · Tech · Life
  </text>

  ${glyphs
    .map(
      (g, i) =>
        `<text x="${86 + i * 46}" y="536" font-family="DejaVu Sans" font-size="30" fill="${teal}" fill-opacity="0.75">${g}</text>`
    )
    .join('\n  ')}

  <text x="${W - 86}" y="536" text-anchor="end" font-family="DejaVu Sans Mono" font-size="18"
        letter-spacing="4" fill="${soft}">JUSTIES SHALL BE DONE.</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(
  new URL('../public/og.png', import.meta.url).pathname
);
console.log('wrote public/og.png');
