import { categoryOf, kindOf } from '../data/taxonomy';
import type { Post } from './posts';

/**
 * Cover art for a post that has no photograph.
 *
 * Every post gets a distinct plate: the hue comes from its section, the motif
 * and its parameters come from a hash of the filename. Same post, same picture
 * on every build — nothing to commit, and a post written tomorrow is covered
 * without anyone drawing anything.
 *
 * Composition is centre-weighted on purpose. The same file is shown at 16:9 on
 * a post page, 16:10 in the lead card and 4:3 in a list thumbnail, and only the
 * middle survives all three crops.
 */

const W = 1200;
const H = 675;
const PAPER = '#f4f1ea';
const INK = '#20231f';
const SOFT = '#62655d';

/** FNV-1a. Small, stable, and enough to spread a few dozen filenames. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — deterministic, so the art never changes under a post. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Draw = (rand: () => number, tint: string) => string;

const arcs: Draw = (rand, tint) => {
  const cx = rand() < 0.5 ? -40 : W + 40;
  const cy = rand() < 0.5 ? -40 : H + 40;
  const step = 46 + rand() * 34;
  return Array.from({ length: 16 }, (_, i) => {
    const r = step * (i + 1);
    return `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="${tint}" stroke-opacity="${(0.46 - i * 0.02).toFixed(3)}" stroke-width="${(2.5 + rand() * 3).toFixed(1)}"/>`;
  }).join('');
};

const stripes: Draw = (rand, tint) => {
  const lean = rand() < 0.5 ? 1 : -1;
  let x = -H;
  const out: string[] = [];
  while (x < W + H) {
    const w = 4 + rand() * 26;
    out.push(
      `<path d="M${x.toFixed(1)} ${lean > 0 ? H : 0} L${(x + H * 0.6).toFixed(1)} ${lean > 0 ? 0 : H}" stroke="${tint}" stroke-opacity="${(0.12 + rand() * 0.22).toFixed(3)}" stroke-width="${w.toFixed(1)}"/>`
    );
    x += w + 12 + rand() * 26;
  }
  return out.join('');
};

const dots: Draw = (rand, tint) => {
  const fx = rand() * W;
  const fy = rand() * H;
  const gap = 26 + rand() * 12;
  const out: string[] = [];
  for (let y = gap / 2; y < H; y += gap) {
    for (let x = gap / 2; x < W; x += gap) {
      const d = Math.hypot(x - fx, y - fy) / Math.hypot(W, H);
      const r = Math.max(0.6, (1 - d) * 6.4);
      out.push(
        `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(2)}" fill="${tint}" fill-opacity="${(0.55 * (1 - d)).toFixed(3)}"/>`
      );
    }
  }
  return out.join('');
};

const rings: Draw = (rand, tint) => {
  const n = 5 + Math.floor(rand() * 4);
  return Array.from({ length: n }, () => {
    const r = 60 + rand() * 260;
    return `<circle cx="${(rand() * W).toFixed(0)}" cy="${(rand() * H).toFixed(0)}" r="${r.toFixed(0)}" fill="none" stroke="${tint}" stroke-opacity="${(0.18 + rand() * 0.22).toFixed(3)}" stroke-width="${(2 + rand() * 4).toFixed(1)}"/>`;
  }).join('');
};

const bars: Draw = (rand, tint) => {
  const cols = 22 + Math.floor(rand() * 14);
  const w = W / cols;
  return Array.from({ length: cols }, (_, i) => {
    const h = (0.18 + rand() * 0.72) * H;
    return `<rect x="${(i * w).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${(w - 3).toFixed(1)}" height="${h.toFixed(1)}" fill="${tint}" fill-opacity="${(0.10 + rand() * 0.22).toFixed(3)}"/>`;
  }).join('');
};

const mesh: Draw = (rand, tint) => {
  const n = 14 + Math.floor(rand() * 8);
  const pts = Array.from({ length: n }, () => [rand() * W, rand() * H] as const);
  const out: string[] = [];
  for (let i = 0; i < pts.length; i += 1) {
    for (let j = i + 1; j < pts.length; j += 1) {
      if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) > 420) continue;
      out.push(
        `<line x1="${pts[i][0].toFixed(0)}" y1="${pts[i][1].toFixed(0)}" x2="${pts[j][0].toFixed(0)}" y2="${pts[j][1].toFixed(0)}" stroke="${tint}" stroke-opacity="0.24" stroke-width="2"/>`
      );
    }
  }
  out.push(
    ...pts.map(
      ([x, y]) =>
        `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="4.5" fill="${PAPER}" stroke="${tint}" stroke-opacity="0.5" stroke-width="2"/>`
    )
  );
  return out.join('');
};

const MOTIFS: Draw[] = [arcs, stripes, dots, rings, bars, mesh];

export function coverSvg(post: Post): string {
  const category = categoryOf(post.data.category);
  const kind = kindOf(post.data.kind);
  const tint = category?.tint ?? '#16756a';

  const seed = hash(post.id);
  const rand = rng(seed);
  const motif = MOTIFS[seed % MOTIFS.length];

  const label = `${(category?.en ?? 'NOTE').toUpperCase()} / ${(kind?.en ?? '').toUpperCase()}`;
  const plateW = 460;
  const plateH = 214;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <!-- A wash under the motif, so a thumbnail reads as a coloured plate rather
       than blank paper. -->
  <rect width="${W}" height="${H}" fill="${tint}" fill-opacity="0.09"/>
  ${motif(rand, tint)}
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="${INK}" stroke-opacity="0.16"/>
  <g transform="translate(${(W - plateW) / 2} ${(H - plateH) / 2})">
    <rect width="${plateW}" height="${plateH}" rx="14" fill="${PAPER}" fill-opacity="0.9"
          stroke="${INK}" stroke-opacity="0.14"/>
    <text x="${plateW / 2}" y="118" text-anchor="middle" font-size="104" fill="${tint}">${category?.glyph ?? '·'}</text>
    <text x="${plateW / 2}" y="164" text-anchor="middle"
          font-family="'IBM Plex Mono',ui-monospace,monospace" font-size="22"
          letter-spacing="5" fill="${SOFT}">${label}</text>
  </g>
</svg>`;
}
