import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// The built site (`npm run build`); every test runs against it.
export const DIST = join(ROOT, 'dist');

// Every published page: root *.html plus blog/*.html.
export const PAGES = [
  ...readdirSync(DIST).filter((f) => f.endsWith('.html')),
  ...readdirSync(join(DIST, 'blog')).filter((f) => f.endsWith('.html')).map((f) => `blog/${f}`),
].sort();

// football.html doesn't load styles.css.
export const STANDALONE = new Set(['football.html']);
