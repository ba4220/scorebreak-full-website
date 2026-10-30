// Fast checks over the built HTML in dist/ (run `npm run build` first). No browser: `npm run test:static`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { ROOT, DIST, PAGES, STANDALONE } from './pages.mjs';

const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const html = Object.fromEntries(PAGES.map((p) => [p, readFileSync(join(DIST, p), 'utf8')]));
const builtCss = readdirSync(join(DIST, '_astro')).filter((f) => f.endsWith('.css'));
const SITE_CSS = { 'src/styles/styles.css': read('src/styles/styles.css'), 'src/styles/components.css': read('src/styles/components.css') };
const pageStyles = (page) => [...html[page].matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);

// Matches a file path exactly, segment by segment, so wrong-case paths fail here
// the way they would on a case-sensitive (Linux) host, even when run on macOS.
function existsExact(relPath) {
  let dir = DIST;
  for (const seg of normalize(relPath).split('/')) {
    if (!existsSync(dir) || !readdirSync(dir).includes(seg)) {
      return false;
    }
    dir = join(dir, seg);
  }
  return true;
}

const REF = /\b(?:src|href|poster)\s*=\s*(?:"([^"]*)"|'([^']*)')|url\(\s*(?:"([^"]*)"|'([^']*)'|([^"')]+))\s*\)/g;
const EXTERNAL = /^(?:[a-z]+:|#|\/\/)/i;

function localRefs(source) {
  const refs = new Set();
  for (const m of source.matchAll(REF)) {
    const raw = m.slice(1).find((g) => g !== undefined).trim();
    if (!raw || EXTERNAL.test(raw)) {
      continue;
    }
    const path = decodeURIComponent(raw.split(/[?#]/)[0]);
    if (path) {
      refs.add(path);
    }
  }
  return refs;
}

test('every local href/src/url() points at a file that exists (case-sensitive)', () => {
  const missing = [];
  for (const page of PAGES) {
    for (const ref of localRefs(html[page])) {
      const target = ref.startsWith('/') ? ref.slice(1) : join(dirname(page), ref);
      if (!existsExact(target)) {
        missing.push(`${page} → ${ref}`);
      }
    }
  }
  for (const file of builtCss) {
    for (const ref of localRefs(readFileSync(join(DIST, '_astro', file), 'utf8'))) {
      if (!existsExact(ref.startsWith('/') ? ref.slice(1) : `_astro/${ref}`)) {
        missing.push(`${file} → ${ref}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test('published file and folder names in public/ are lowercase-hyphenated', () => {
  const bad = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, 'public', dir), { withFileTypes: true })) {
      const rel = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.name.startsWith('.')) {
        continue;
      }
      if (!/^[a-z0-9][a-z0-9.-]*$/.test(entry.name)) {
        bad.push(rel);
      }
      if (entry.isDirectory()) {
        walk(rel);
      }
    }
  };
  walk('');
  assert.deepEqual(bad, []);
});

test('every page loads the shared site script, and only bundled module scripts', () => {
  const shared = html['index.html'].match(/<script type="module" src="(\/_astro\/Layout\.[^"]+\.js)"><\/script>/);
  assert.ok(shared, 'index.html has no Layout script');
  for (const page of PAGES) {
    const scripts = [...html[page].matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
    assert.ok(scripts.includes(`<script type="module" src="${shared[1]}">`), `${page} lacks the shared site script`);
    for (const tag of scripts) {
      assert.match(tag, /^<script type="module" src="\/_astro\/[^"]+\.js">$/, `${page}: ${tag}`);
    }
  }
});

test('no JavaScript inside the HTML: no inline <script>, on* handlers or javascript: URLs', () => {
  for (const page of PAGES) {
    assert.doesNotMatch(html[page], /<script(?![^>]*\bsrc=)[^>]*>/, `${page} has an inline <script>`);
    assert.doesNotMatch(html[page], /\son[a-z]+\s*=/i, `${page} has an inline event handler`);
    assert.doesNotMatch(html[page], /javascript:/i, `${page} has a javascript: URL`);
  }
});

test('data-* hooks point at elements that exist on the same page', () => {
  for (const page of PAGES) {
    const source = html[page];
    const ids = new Set([...source.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const [, id] of source.matchAll(/data-modal-open="([^"]+)"/g)) {
      assert.match(source, new RegExp(`id="${id}"[^>]*\\bdata-modal\\b`), `${page}: [data-modal-open="${id}"] has no matching [data-modal]`);
    }
    for (const [, sel] of source.matchAll(/data-form-(?:confirm|hide)="#([^"]+)"/g)) {
      assert.ok(ids.has(sel), `${page}: #${sel} referenced by a form does not exist`);
    }
    for (const [tag] of source.matchAll(/<form\b[^>]*>/g)) {
      assert.match(tag, /\sdata-form="[a-z0-9-]+"/, `${page}: form without data-form: ${tag}`);
    }
  }
});

test('every page except football links styles.css; every page links components.css after it', () => {
  for (const page of PAGES) {
    const links = [...html[page].matchAll(/<link rel="stylesheet" href="\/_astro\/([a-z]+)\.[\w-]+\.css">/g)].map((m) => m[1]);
    assert.deepEqual(links, STANDALONE.has(page) ? ['components'] : ['styles', 'components'], page);
  }
});

test('footer, modal and modal-form rules live only in components.css', () => {
  const SHARED = /(^|[\s,}])\.(site-footer|footer-[\w-]+|sb-modal[\w-]*|sb-form[\w-]*|sb-hidden-field)\b[^{}]*\{/m;
  assert.doesNotMatch(SITE_CSS['src/styles/styles.css'], SHARED, 'styles.css');
  for (const page of PAGES) {
    assert.doesNotMatch(pageStyles(page).join('\n'), SHARED, page);
  }
});

test('every form on the site has a MAIL entry (category + title) in src/scripts/api.ts', () => {
  const api = read('src/scripts/api.ts');
  const forms = new Set(PAGES.flatMap((p) => [...html[p].matchAll(/data-form="([a-z0-9-]+)"/g)].map((m) => m[1])));
  for (const name of forms) {
    assert.match(api, new RegExp(`'${name}':\\s*\\{\\s*category: '[a-z-]+',\\s*title:`), `api.ts has no MAIL entry for "${name}"`);
  }
});

test('every form has the honeypot, unfocusable by Tab and ignored by autofill', () => {
  const HONEYPOT = `<p class="sb-hidden-field"><label>Don't fill this out if you're human: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>`;
  for (const page of PAGES) {
    for (const [form] of html[page].matchAll(/<form\b[\s\S]*?<\/form>/g)) {
      assert.ok(form.includes(HONEYPOT), `${page}: ${form.slice(0, 80)}… has no hardened honeypot`);
    }
  }
});

test('every page links the favicon', () => {
  for (const page of PAGES) {
    assert.ok(html[page].includes('<link rel="icon" type="image/png" href="/favicon.png">'), page);
  }
});

test('CSS comments are balanced (an orphaned "*/" silently drops the next rule)', () => {
  const sources = { ...SITE_CSS };
  for (const page of PAGES) {
    pageStyles(page).forEach((s, i) => { sources[`${page} <style> #${i + 1}`] = s; });
  }
  for (const [name, source] of Object.entries(sources)) {
    const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!stripped.includes('*/') && !stripped.includes('/*'), `${name} has an unmatched comment delimiter`);
  }
});

test('nav links carry aria-current="page" exactly when they point at the current page', () => {
  for (const page of PAGES) {
    const source = html[page];
    const actions = source.indexOf('<div class="nav-mobile-section nav-mobile-actions">');
    const nav = source.slice(source.indexOf('<nav'), source.indexOf('</div>', actions));
    const self = `/${page}`;
    for (const [, href, current] of nav.matchAll(/<a href="([^"]+)"( aria-current="page")?/g)) {
      assert.equal(Boolean(current), href === self, `${page}: link to ${href} ${current ? 'wrongly has' : 'lacks'} aria-current`);
    }
  }
});
