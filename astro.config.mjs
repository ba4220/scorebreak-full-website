import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { features } from './src/data/features.ts';

export default defineConfig({
  site: 'https://scorebreak.io',
  // /sitemap-index.xml (linked from public/robots.txt): every page except 404 and redirect stubs.
  integrations: [sitemap({ filter: (url) => !url.endsWith('/404/') && (features.football || !url.endsWith('/football/')) })],
  // Clean URLs that a Google Cloud Storage website bucket can serve: about.astro → about/index.html at /about/.
  // The bucket serves <dir>/index.html (MainPageSuffix) and redirects /about to /about/; dev accepts both.
  build: { format: 'directory' },
  trailingSlash: 'ignore',
  // <Image width={N}> = the largest CSS width it renders at; srcset then covers up to 2x for retina.
  // Sizing stays in the site CSS (responsiveStyles off).
  image: { layout: 'constrained' },
  // Scope page <style>s with :where(), which adds no specificity, so page rules weigh what they did unscoped.
  scopedStyleStrategy: 'where',
  // Copy is edited by hand: keep straight quotes as written.
  markdown: { smartypants: false },
  // No inline scripts in the output: every script is a hashed file under /_astro/.
  vite: { build: { assetsInlineLimit: 0 } },
});
