import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_IDS, KIND_IDS } from './data/taxonomy';

// The /admin form writes a key for every field the editor left blank, so the
// schema has to read "" and {} as "absent" rather than rejecting the file.
const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export const PAPER_LICENSES = [
  'CC-BY',
  'CC-BY-NC',
  'CC-BY-ND',
  'Subscription',
  'Preprint',
  'Public-Domain',
  'Unknown',
] as const;

export const PAPER_FIGURE_POLICIES = [
  'redrawn',
  'data-chart',
  'original-cc-by',
  'text-only',
] as const;

const optionalText = z.preprocess(blankToUndefined, z.string().optional());
const optionalUrl = z.preprocess(blankToUndefined, z.string().url().optional());

const optionalSource = z.preprocess(
  (value) => {
    if (!value || typeof value !== 'object') return undefined;
    const { name, url } = value as { name?: string; url?: string };
    return name?.trim() && url?.trim() ? { name, url } : undefined;
  },
  z.object({ name: z.string(), url: z.string().url() }).optional()
);

const optionalPaper = z.preprocess(
  (value) => {
    if (!value || typeof value !== 'object') return undefined;
    const obj = value as Record<string, unknown>;
    const hasAny = Object.values(obj).some((v) => typeof v === 'string' && v.trim() !== '');
    return hasAny ? value : undefined;
  },
  z
    .object({
      title: optionalText,
      authors: optionalText,
      journal: optionalText,
      year: optionalText,
      doi: optionalText,
      url: optionalUrl,
      license: z.preprocess(blankToUndefined, z.enum(PAPER_LICENSES).optional()),
      figurePolicy: z.preprocess(blankToUndefined, z.enum(PAPER_FIGURE_POLICIES).optional()),
      ownerNote: optionalText,
    })
    .optional()
);

// Posts live as plain Markdown files under src/content/posts.
// That is the whole database: portable, diffable, and greppable.
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    updated: z.preprocess(blankToUndefined, z.coerce.date().optional()),
    category: z.enum(CATEGORY_IDS),
    kind: z.enum(KIND_IDS).default('note'),
    // One-line takeaway shown on cards and in search results.
    takeaway: z.string().min(1),
    tags: z.array(z.string()).default([]),
    // Where a clipped item came from. Omitted for original writing.
    source: optionalSource,
    // Primary research paper metadata for the /papers corner.
    paper: optionalPaper,
    cover: optionalText,
    coverAlt: z.string().default(''),
    // Extra photos shown as a grid under the body — restaurant and gear
    // write-ups usually carry several. Inline images still work in the body.
    gallery: z
      .array(
        z.object({
          image: z.string(),
          caption: z.string().default(''),
        })
      )
      .default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    // 'private' keeps a post off the public site entirely — no home, archive,
    // topic, tag, feed, sitemap or search entry. It is readable only under
    // /private, behind the same password gate as the editor.
    visibility: z.enum(['public', 'private']).default('public'),
  }),
});

export const collections = { posts };
