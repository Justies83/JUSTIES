import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_IDS, KIND_IDS } from './data/taxonomy';

// Posts live as plain Markdown files under src/content/posts.
// That is the whole database: portable, diffable, and greppable.
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.enum(CATEGORY_IDS),
    kind: z.enum(KIND_IDS).default('note'),
    // One-line takeaway shown on cards and in search results.
    takeaway: z.string(),
    tags: z.array(z.string()).default([]),
    // Where a clipped item came from. Omit for original writing.
    source: z
      .object({ name: z.string(), url: z.string().url() })
      .optional(),
    cover: z.string().optional(),
    coverAlt: z.string().default(''),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
