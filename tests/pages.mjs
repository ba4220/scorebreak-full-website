import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// The built site (`npm run build`); every test runs against it.
export const DIST = join(ROOT, 'dist');

// The built file behind a page URL: /about/ → about/index.html, /404.html → 404.html.
export const fileOf = (url) => (url.endsWith('/') ? `${url.slice(1)}index.html` : url.slice(1));

// Every published page, as its URL: /, /about/, /blog/<slug>/, plus /404.html.
export const PAGES = readdirSync(DIST, { recursive: true })
  .filter((f) => f.endsWith('.html') && !f.startsWith('_astro'))
  .map((f) => (f.endsWith('index.html') ? `/${f.slice(0, -'index.html'.length)}` : `/${f}`))
  .sort();

// /football/ doesn't load styles.css.
export const STANDALONE = new Set(['/football/']);
