import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://scorebreak.io',
  // Keep the existing .html URLs: about.astro → about.html, blog/index.astro → blog/index.html.
  build: { format: 'preserve' },
  // No inline scripts in the output: every script is a hashed file under /_astro/.
  vite: { build: { assetsInlineLimit: 0 } },
});
