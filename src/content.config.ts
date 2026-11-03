import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Blog posts: src/content/blog/<slug>.md, published at /blog/<slug>/.
const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    // Also the excerpt on the blog index.
    description: z.string(),
    date: z.coerce.date(),
    author: z.string(),
  }),
});

export const collections = { blog };
