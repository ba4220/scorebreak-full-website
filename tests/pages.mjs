import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// The built site (`npm run build`); every test runs against it.
export const DIST = join(ROOT, 'dist');

// The built file behind a page URL: /about/ → about/index.html, /404.html → 404.html.
export const fileOf = (url) => (url.endsWith('/') ? `${url.slice(1)}index.html` : url.slice(1));

const BUILT = readdirSync(DIST, { recursive: true })
  .filter((f) => f.endsWith('.html') && !f.startsWith('_astro'))
  .map((f) => (f.endsWith('index.html') ? `/${f.slice(0, -'index.html'.length)}` : `/${f}`))
  .sort();
const isRedirect = (url) => readFileSync(join(DIST, fileOf(url)), 'utf8').includes('http-equiv="refresh"');

// Every published page, as its URL: /, /about/, /blog/<slug>/, plus /404.html. Redirect stubs are in REDIRECTS.
export const PAGES = BUILT.filter((url) => !isRedirect(url));
export const REDIRECTS = BUILT.filter(isRedirect);

// /football/ doesn't load styles.css.
export const STANDALONE = new Set(['/football/']);

// The football switch in src/data/features.ts: when false, no football links and built /football/ redirects to /.
export const FOOTBALL = /football:\s*true/.test(readFileSync(join(ROOT, 'src/data/features.ts'), 'utf8'));
