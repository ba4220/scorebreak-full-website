// CSS refactor safety net: snapshot every element's computed style + box, and every CSS rule, then compare.
//   npm run build && node tests/style-snapshot.mjs save      # before a refactor
//   npm run build && node tests/style-snapshot.mjs compare   # after: lists every difference
// Snapshots go to .style-snapshot/ (git-ignored). Pass page paths after the command to limit it: compare /about/ /
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import { chromium } from 'playwright';
import { ROOT, DIST, PAGES, fileOf } from './pages.mjs';

const [mode, ...only] = process.argv.slice(2);
if (!['save', 'compare'].includes(mode)) {
  console.error('usage: node tests/style-snapshot.mjs save|compare [page paths…]');
  process.exit(2);
}
const pages = only.length ? only : PAGES;
const OUT = join(ROOT, '.style-snapshot');

// No margins: Chrome resolves `auto` margins inconsistently between runs; the element's box (always recorded) catches margin changes.
const PROPS = `display position top right bottom left z-index float clear box-sizing width height min-width min-height
max-width max-height padding-top padding-right padding-bottom padding-left
border-top-width border-right-width border-bottom-width border-left-width border-top-style border-right-style
border-bottom-style border-left-style border-top-color border-right-color border-bottom-color border-left-color
border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius outline-style
outline-width outline-color flex-direction flex-wrap flex-grow flex-shrink flex-basis justify-content justify-items
align-items align-self align-content order row-gap column-gap grid-template-columns grid-template-rows grid-column-start
grid-column-end grid-row-start grid-row-end grid-auto-flow overflow-x overflow-y color background-color background-image
background-size background-position background-repeat opacity visibility box-shadow transform transform-origin filter
backdrop-filter font-family font-size font-weight font-style line-height letter-spacing text-align text-transform
text-decoration-line text-shadow white-space word-break overflow-wrap text-overflow object-fit object-position
aspect-ratio cursor pointer-events transition-property transition-duration animation-name animation-duration
animation-iteration-count content mask-image clip-path list-style-type vertical-align isolation mix-blend-mode
-webkit-line-clamp`.split(/\s+/);

const VIEWPORTS = [1440, 1024, 768, 390];
const THEMES = ['dark', 'light'];
// Extra open states, captured in dark mode only.
const STATES = {
  dropdown: { vw: 1440, open: (p) => p.locator('[data-dropdown-toggle]').first().click() },
  modal: { vw: 1440, open: (p) => p.evaluate(() => document.querySelector('[data-modal-open="sbContactModal"]').click()) },
  menu: { vw: 390, open: (p) => p.locator('[data-nav-toggle]').click() },
};

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = join(DIST, url.endsWith('/') ? `${url}index.html` : url);
  if (!file.startsWith(DIST) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

async function settle(page) {
  await page.evaluate(async () => {
    scrollTo(0, 0);
    const imgs = [...document.images];
    imgs.forEach((i) => { i.loading = 'eager'; });
    await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
    await document.fonts.ready;
    for (const a of document.getAnimations()) {
      a.pause();
      a.currentTime = 0;
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

// One line per element (and per rendered ::before/::after): a readable key, then its box and PROPS values.
const captureStyles = (page) => page.evaluate((props) => {
  const lines = [];
  const keyOf = (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + [...el.classList].map((c) => `.${c}`).join('');
  // Without a layout box, used values (auto margins, sizes, offsets) are leftovers from an earlier layout: skip them.
  const LAYOUT = /^(width|height|top|right|bottom|left|margin-.*|padding-.*|min-.*|max-.*|flex-basis|transform-origin|grid-template-.*)$/;
  const row = (key, cs, rect, boxless) => `${key}\t${rect}\t${props.map((p) => (boxless && LAYOUT.test(p) ? '~' : cs.getPropertyValue(p))).join('\t')}`;
  for (const el of [document.documentElement, ...document.querySelectorAll('html *')]) {
    if (el.closest('head, script, style, template, noscript')) {
      continue;
    }
    const r = el.getBoundingClientRect();
    const rect = [r.x + scrollX, r.y + scrollY, r.width, r.height].map((n) => Math.round(n * 2) / 2).join(',');
    const boxless = el.getClientRects().length === 0;
    lines.push(row(keyOf(el), getComputedStyle(el), rect, boxless));
    for (const pseudo of ['::before', '::after']) {
      const cs = getComputedStyle(el, pseudo);
      if (cs.content !== 'none' && cs.content !== 'normal') {
        lines.push(row(keyOf(el) + pseudo, cs, '-', boxless));
      }
    }
  }
  return lines;
}, PROPS);

// Every CSS declaration on the page as "context | selector | longhand: value", so a minifier's reordering,
// selector merging or media-query rewriting doesn't count as a change; Astro's scoping hooks are stripped.
const captureRules = (page) => page.evaluate(() => {
  const out = [];
  // A scope hook standing alone (Astro's rewrite of `*`) becomes `*` again; attached to a compound it just goes.
  const SCOPE = /\[data-astro-cid-[\w-]+\]|:where\(\.astro-[\w-]+\)/g;
  const clean = (s) => s.replace(new RegExp(`(^|[\\s>+~(,])(?:${SCOPE.source})`, 'g'), '$1*').replace(SCOPE, '').replace(/\s+/g, ' ').trim();
  const media = (s) => clean(s).toLowerCase()
    .replace(/\(\s*max-width\s*:\s*([^)]+)\)/g, '(width <= $1)')
    .replace(/\(\s*min-width\s*:\s*([^)]+)\)/g, '(width >= $1)');
  // Split a selector list on top-level commas only (not inside :is(), :not(), …).
  const selectors = (text) => {
    const parts = [];
    let depth = 0;
    let cur = '';
    for (const ch of text) {
      depth += ch === '(' ? 1 : ch === ')' ? -1 : 0;
      if (ch === ',' && depth === 0) {
        parts.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    return [...parts, cur].map(clean);
  };
  const walk = (rules, ctx) => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        // Longhands set through a var() shorthand serialize as ''; record those shorthands from cssText instead.
        const decls = [];
        for (const prop of rule.style) {
          const value = rule.style.getPropertyValue(prop);
          if (value) {
            decls.push(`${prop}: ${clean(value)}${rule.style.getPropertyPriority(prop) ? ' !important' : ''}`);
          }
        }
        for (const d of rule.style.cssText.split(/;(?![^(]*\))/)) {
          const m = d.match(/^\s*([\w-]+)\s*:\s*(.*\bvar\(.*)$/s);
          if (m && !decls.some((x) => x.startsWith(`${m[1]}:`))) {
            decls.push(`${m[1]}: ${clean(m[2])}`);
          }
        }
        for (const sel of selectors(rule.selectorText)) {
          for (const d of decls) {
            out.push(`${ctx}${sel} | ${d}`);
          }
        }
      } else if (rule instanceof CSSKeyframesRule) {
        out.push(`${ctx}${clean(rule.cssText)}`);
      } else if (rule.cssRules) {
        const cond = rule.conditionText ?? rule.media?.mediaText ?? rule.name ?? '';
        walk(rule.cssRules, `${ctx}@${rule.constructor.name.replace(/^CSS|Rule$/g, '').toLowerCase()} ${media(cond)} > `);
      } else {
        out.push(`${ctx}${clean(rule.cssText)}`);
      }
    }
  };
  for (const sheet of document.styleSheets) {
    walk(sheet.cssRules, '');
  }
  return out.sort();
});

const save = (name, data) => writeFileSync(join(OUT, `${name}.json.gz`), gzipSync(JSON.stringify(data)));
const load = (name) => {
  const f = join(OUT, `${name}.json.gz`);
  return existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f))) : null;
};
const slug = (p) => (p === '/' ? 'index' : p.replace(/^\/|\/$/g, '').replace(/[/.]/g, '_'));

// Top-level comma split (colors like rgba() contain commas).
const splitTop = (s) => {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    depth += ch === '(' ? 1 : ch === ')' ? -1 : 0;
    if (ch === ',' && depth === 0) {
      parts.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  return [...parts, cur.trim()];
};
// linear-gradient(to top, A 0%, B 60%) is linear-gradient(B 40%, A 100%) (the minifier's form): rewrite the former.
const flipToTop = (s) => s.replace(/linear-gradient\(to top, ((?:[^()]|\([^()]*\))*)\)/g, (m, body) => {
  const stops = splitTop(body).map((stop) => stop.match(/^(.*) (\d+(?:\.\d+)?)%$/));
  if (stops.some((x) => !x)) {
    return m;
  }
  return `linear-gradient(${stops.reverse().map(([, c, p]) => `${c} ${+(100 - p).toFixed(4)}%`).join(', ')})`;
});
// Spellings the CSS minifier rewrites to that mean exactly the same thing.
const canon = (s) => flipToTop(s)
  .replace(/\bto top\b/g, '0deg').replace(/\bto right\b/g, '90deg').replace(/\bto bottom\b/g, '180deg').replace(/\bto left\b/g, '270deg')
  .replace(/\btransparent\b/g, 'rgba(0, 0, 0, 0)')
  .replace(/\btranslateX\(([^)]*)\)/g, 'translate($1)')
  .replace(/linear-gradient\(180deg, /g, 'linear-gradient(')
  .replace(/:nth-child\(1\)/g, ':first-child')
  .replace(/\b0% 0%/g, '0px 0px');

function diffStyles(label, before, after) {
  const problems = [];
  if (before.length !== after.length) {
    const i = before.findIndex((l, n) => l.split('\t')[0] !== after[n]?.split('\t')[0]);
    problems.push(`element count ${before.length} → ${after.length}; first mismatch at #${i}: ${before[i]?.split('\t')[0]} vs ${after[i]?.split('\t')[0]}`);
    return problems;
  }
  before.forEach((line, n) => {
    if (line === after[n] || canon(line) === canon(after[n])) {
      return;
    }
    const [key, rect, ...vals] = line.split('\t');
    const [, rect2, ...vals2] = after[n].split('\t');
    if (rect !== rect2) {
      problems.push(`${key}: box ${rect} → ${rect2}`);
    }
    vals.forEach((v, i) => {
      if (canon(v) !== canon(vals2[i])) {
        problems.push(`${key}: ${PROPS[i]} ${v} → ${vals2[i]}`);
      }
    });
  });
  return problems.map((p) => `  [${label}] ${p}`);
}

function diffRules(before, after) {
  const count = (list) => list.reduce((m, r) => m.set(r, (m.get(r) ?? 0) + 1), new Map());
  const [b, a] = [count(before.map(canon)), count(after.map(canon))];
  const lines = [];
  for (const [r, n] of b) {
    if ((a.get(r) ?? 0) < n) {
      lines.push(`  - ${r}`);
    }
  }
  for (const [r, n] of a) {
    if ((b.get(r) ?? 0) < n) {
      lines.push(`  + ${r}`);
    }
  }
  return lines;
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
let failures = 0;
for (const path of pages) {
  const results = {};
  const runs = [
    ...VIEWPORTS.flatMap((vw) => THEMES.map((theme) => ({ name: `${vw}-${theme}`, vw, theme }))),
    ...Object.entries(STATES).map(([name, s]) => ({ name, vw: s.vw, theme: 'dark', open: s.open })),
  ];
  let rules;
  for (const run of runs) {
    const page = await browser.newPage({ viewport: { width: run.vw, height: 900 } });
    await page.addInitScript(() => {
      window.setInterval = () => 0;
      window.turnstile = { render: () => '0', execute() {}, reset() {}, remove() {} };
    });
    await page.route(/\.mp4$|challenges\.cloudflare\.com/, (r) => r.abort());
    await page.goto(BASE + path, { waitUntil: 'load' });
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, run.theme);
    if (run.open) {
      await settle(page);
      await run.open(page);
    }
    await settle(page);
    results[run.name] = await captureStyles(page);
    rules ??= await captureRules(page);
    await page.close();
  }
  const name = slug(path);
  if (mode === 'save') {
    save(name, { styles: results, rules });
    console.log(`saved ${path}`);
    continue;
  }
  const base = load(name);
  if (!base) {
    console.log(`${path}: no snapshot (run save first)`);
    failures++;
    continue;
  }
  const styleDiffs = Object.keys(results).flatMap((k) => diffStyles(k, base.styles[k] ?? [], results[k]));
  const ruleDiffs = diffRules(base.rules, rules);
  if (!styleDiffs.length && !ruleDiffs.length) {
    console.log(`${path}: identical`);
    continue;
  }
  if (styleDiffs.length) {
    failures++;
  }
  console.log(`${path}: ${styleDiffs.length} computed-style differences, ${ruleDiffs.length} rule changes`);
  console.log(styleDiffs.slice(0, 40).join('\n'));
  if (styleDiffs.length > 40) {
    console.log(`  … ${styleDiffs.length - 40} more`);
  }
  if (ruleDiffs.length) {
    console.log('  rules (- removed, + added):');
    console.log(ruleDiffs.join('\n'));
  }
}
await browser.close();
server.close();
process.exit(failures ? 1 : 0);
