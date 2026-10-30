import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://scorebreak.io',
  // Clean URLs that a Google Cloud Storage website bucket can serve: about.astro → about/index.html at /about/.
  // The bucket serves <dir>/index.html (MainPageSuffix) and redirects /about to /about/; dev accepts both.
  build: { format: 'directory' },
  trailingSlash: 'ignore',
  // Copy is edited by hand: keep straight quotes as written.
  markdown: { smartypants: false },
  // No inline scripts in the output: every script is a hashed file under /_astro/.
  vite: { build: { assetsInlineLimit: 0 } },
});
