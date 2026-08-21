import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_IDS, KIND_IDS } from './data/taxonomy';

// The /admin form writes a key for every field the editor left blank, so the
// schema has to read "" and {} as "absent" rather than rejecting the file.
const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalText = z.preprocess(blankToUndefined, z.string().optional());

const optionalSource = z.preprocess(
  (value) => {
    if (!value || typeof value !== 'object') return undefined;
    const { name, url } = value as { name?: string; url?: string };
    return name?.trim() && url?.trim() ? { name, url } : undefined;
  },
  z.object({ name: z.string(), url: z.string().url() }).optional()
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
    cover: optionalText,
    coverAlt: z.string().default(''),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
