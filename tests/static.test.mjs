// Fast checks over the HTML source. No browser, no dependencies: `npm run test:static`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { ROOT, PAGES, STANDALONE } from './pages.mjs';

const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const html = Object.fromEntries(PAGES.map((p) => [p, read(p)]));
const css = read('styles.css');

// Matches a file path exactly, segment by segment, so wrong-case paths fail here
// the way they would on a case-sensitive (Linux) host, even when run on macOS.
function existsExact(relPath) {
  let dir = ROOT;
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

const section = (source, start, end) => {
  const i = source.indexOf(start);
  if (i === -1) {
    return null;
  }
  return source.slice(i, source.indexOf(end, i) + end.length);
};
// Blog pages prefix shared paths with ../; strip that so all copies compare equal.
const normalizePaths = (s) => s.replaceAll('../', '');

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
  for (const ref of localRefs(css)) {
    if (!existsExact(ref)) {
      missing.push(`styles.css → ${ref}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('published file and folder names are lowercase-hyphenated', () => {
  const SKIP = new Set(['_archive', 'node_modules', 'tests', 'test-results', 'playwright-report']);
  const bad = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const rel = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.name.startsWith('.') || SKIP.has(rel) || /\.md$/.test(rel)) {
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

test('every page loads js/api.js then js/site.js, before any page-specific script', () => {
  for (const page of PAGES) {
    const prefix = page.startsWith('blog/') ? '../' : '';
    const srcs = [...html[page].matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
    assert.deepEqual(srcs.slice(0, 2), [`${prefix}js/api.js`, `${prefix}js/site.js`], page);
  }
});

test('no JavaScript inside the HTML: no inline <script>, on* handlers or javascript: URLs', () => {
  for (const page of PAGES) {
    assert.doesNotMatch(html[page], /<script(?![^>]*\bsrc=)[^>]*>/, `${page} has an inline <script>`);
    assert.doesNotMatch(html[page], /\son[a-z]+\s*=/i, `${page} has an inline event handler`);
    assert.doesNotMatch(html[page], /javascript:/i, `${page} has a javascript: URL`);
  }
});

test('every js/ file parses', () => {
  for (const file of readdirSync(join(ROOT, 'js'))) {
    assert.doesNotThrow(() => new Function(read(`js/${file}`)), file);
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

test('every page except football links styles.css', () => {
  for (const page of PAGES.filter((p) => !STANDALONE.has(p))) {
    assert.match(html[page], /<link rel="stylesheet" href="(\.\.\/)?styles\.css"/, page);
  }
});

for (const [name, start, end] of [
  ['footer', '<footer', '</footer>'],
  ['contact modal', 'id="sbContactModal"', '</form>'],
]) {
  test(`${name} markup is identical on every page`, () => {
    const reference = normalizePaths(section(html['lacrosse.html'], start, end)).replace(/\s+/g, ' ');
    for (const page of PAGES) {
      const copy = section(html[page], start, end);
      assert.ok(copy, `${page} has no ${name}`);
      assert.equal(normalizePaths(copy).replace(/\s+/g, ' '), reference, `${page} ${name} drifted from lacrosse.html`);
    }
  });
}

test('every page links components.css (football too, which skips styles.css)', () => {
  for (const page of PAGES) {
    assert.match(html[page], /<link rel="stylesheet" href="(\.\.\/)?components\.css" \/>/, page);
  }
});

test('footer, modal and modal-form rules live only in components.css', () => {
  const SHARED = /(^|[\s,}])\.(site-footer|footer-[\w-]+|sb-modal[\w-]*|sb-form[\w-]*|sb-hidden-field)\b[^{}]*\{/m;
  assert.doesNotMatch(css, SHARED, 'styles.css');
  for (const page of PAGES) {
    const styles = [...html[page].matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
    assert.doesNotMatch(styles, SHARED, page);
  }
});

test('every form on the site has a MAIL entry (category + title) in js/api.js', () => {
  const api = read('js/api.js');
  const forms = new Set(PAGES.flatMap((p) => [...html[p].matchAll(/data-form="([a-z0-9-]+)"/g)].map((m) => m[1])));
  for (const name of forms) {
    assert.match(api, new RegExp(`'${name}':\\s*\\{\\s*category: '[a-z-]+',\\s*title:`), `js/api.js has no MAIL entry for "${name}"`);
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
    const prefix = page.startsWith('blog/') ? '../' : '';
    assert.ok(html[page].includes(`<link rel="icon" type="image/png" href="${prefix}favicon.png" />`), page);
  }
});

test('CSS comments are balanced (an orphaned "*/" silently drops the next rule)', () => {
  const sources = { 'styles.css': css, 'components.css': read('components.css') };
  for (const page of PAGES) {
    [...html[page].matchAll(/<style>([\s\S]*?)<\/style>/g)].forEach((m, i) => { sources[`${page} <style> #${i + 1}`] = m[1]; });
  }
  for (const [name, source] of Object.entries(sources)) {
    const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!stripped.includes('*/') && !stripped.includes('/*'), `${name} has an unmatched comment delimiter`);
  }
});

test('the nav is identical on every page, except aria-current on links to that page', () => {
  const navOf = (page) => {
    const source = html[page];
    const start = source.indexOf('<nav');
    const end = source.indexOf('<div class="nav-mobile-section nav-mobile-actions">', start);
    return source.slice(start, source.indexOf('</div>', end) + 6);
  };
  const reference = navOf('index.html').replace(/ aria-current="page"/g, '');
  for (const page of PAGES) {
    const nav = navOf(page);
    assert.equal(normalizePaths(nav).replace(/ aria-current="page"/g, ''), reference, `${page} nav drifted`);
    const self = page.split('/').pop();
    for (const [, href, current] of nav.matchAll(/<a href="([^"]+)"( aria-current="page")?/g)) {
      const isSelf = !page.startsWith('blog/') && href === self;
      assert.equal(Boolean(current), isSelf, `${page}: link to ${href} ${isSelf ? 'lacks' : 'wrongly has'} aria-current`);
    }
  }
});
