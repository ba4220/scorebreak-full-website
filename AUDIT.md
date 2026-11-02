# ScoreBreak Website Audit

**Original audit:** October 29, 2026, against the static-HTML site.
**Re-checked:** November 2, 2026, against the Astro site (`src/`, built `dist/`), branch `sb-4314-astro-images`.
**Method of the re-check:** every finding re-tested against the current source and build: greps over `src/`, visible-text counts over `dist/`, and headless-browser measurements at 1440, 1024, 768 and 390px. Line numbers below are current `src/` lines.

Owner tags: **[code]** can be fixed without touching copy or design; **[Ben]** is a copy or design decision.

---

## Status of the original priority list

| # | Finding (Oct 29) | Now |
|---|---|---|
| 1 | Wrong-case image path `airborne r/UMD_ipad.png` | **Fixed.** Assets renamed lowercase-hyphenated; `npm run test:static` checks paths case-sensitively. |
| 2 | "Three core products" vs "Four solutions" | **Fixed.** Neither phrase is on the site any more. |
| 3 | "Learn More about Handoff →" goes to the demo form | **Open [Ben].** `src/pages/software.astro:162` still links to `/demo/`. |
| 4 | Basketball still says "sideline replay" | **Mostly fixed.** Visible copy says "bench replay". Still "Sideline Replay" in the page's SEO title/description/keywords and social tags (`src/pages/basketball.astro:10-16`) and the image alt text (`:147`). **[Ben]** |
| 5 | Other Sports hero text 248px right of the content edge | **Open [Ben: design].** Re-measured: hero text at x=400 vs 152 for every other section (1440px), 192 vs 32 (1024), 74 vs 32 (768); aligned at 390. Cause: `.os-hero` is `display: flex`, so its `.container` shrinks to its content and is centered by `margin: 0 auto` (`src/pages/other-sports.astro:175`). Possibly intentional; if not, `.os-hero > .container { width: 100%; }` aligns it. |
| 6 | Homepage hero glow clipped into a hard edge at 390px | **Fixed.** The homepage hero has no `::before` glow any more. |
| 7 | Football mobile menu missing About Us | **Fixed.** Every page, football included, uses the shared `Nav` and `Footer` components. |
| 8 | Basketball hero photo blurry on retina | **Partly fixed.** All images now go through `astro:assets` with a 2× `srcset`, which fixes every image whose source file is large enough. `basketball/scorebreak-basketball.png` is only 619px wide but displays up to 704px (768px viewport) and 449px at 1440, so it still needs a ~1400px source file. **[Ben: asset]** |
| 9 | 8.9 MB image shown at 424px (and other multi-MB images) | **Fixed.** Images are resized to their display size and served as WebP: image bytes per page on a 2× laptop went from 12.3 MB to 0.2 MB (home) and 16.9 MB to 0.7 MB (Airborne). |
| 10 | Recruiting Network hero headline 40px lower than the other split heroes | **Open [Ben: design].** Re-measured h1 tops at 1440×900: basketball 196px, software 214px, recruiting-network 240px, so now all three differ. Cause: `.split-hero-inner { align-items: center }` (`src/styles/styles.css:331`) centres each text column against an image of a different height. Fix needs a rule: top-align the text, or give the images one height. |

---

## Open: code

None.

## Open: assets [Ben]

- `basketball/scorebreak-basketball.png` needs a ~1400px-wide source (priority #8).

## Open: copy and design [Ben]

### Errors
- **"principals" → "principles"** (plus a comma before "which"): `src/content/blog/v6-recordable-film-sessions.md:14`.
- **"End to End Lacrosse."** should be "End-to-end lacrosse.": `src/pages/lacrosse.astro:34`.
- **Press-release subhead** "Version 6 of iOS iPadOS macOS Software" is missing commas: `src/content/blog/scorebreak-version-60-recordable-film-sessions.md:10`.
- **Blog title uses a spaced hyphen as a dash**: "v6 - Recordable Film Sessions" (`src/content/blog/v6-recordable-film-sessions.md:2`).
- **Demo confirmation** renders "Thanks, !" until the script fills the name (`src/pages/demo.astro:132`); fine with JavaScript, empty without it.

### Consistency
- **Nav/footer label drift**: About (desktop) vs About Us (mobile, footer); Airborne Sideline Replay (nav) vs Airborne (footer); Football vs Gridiron (button). `src/components/Nav.astro`, `src/components/Footer.astro`.
- **Product names** still vary: Team Software / ScoreBreak software; Airborne / Airborne™ / ScoreBreak Airborne; Handoff / ScoreBreak Handoff™; "Federations and Leagues" vs "Leagues and Federations".
- **Headline case**: 14 h1/h2s are still Title Case where the rest are sentence case, e.g. "Built for the Coaches Who Demand More." (about), "A Complete Film Solution" (software), "Support That Shows Up When It Counts." (support), "How the Recruiting Network Works", "Purpose-Built for Coaches, Players, and Leagues" (index, lacrosse), "Choose the Right Airborne for You" and both Airborne product h2s.
- **Headline periods**: 42 of 81 h1/h2s end with a period; the rest don't, often on the same page.
- **Secondary buttons**: "Request a Demo" with and without "→"; "Explore Airborne →" vs "Learn About Airborne →".
- **Numbers and terms**: the 6-second latency claim has several phrasings; "D1" vs "Division 1"; "85%+" vs "65%" in one sentence (`src/pages/lacrosse.astro:35`).
- **Dashes**: 72 spaced hyphens (" - ") and 27 em dashes in visible page copy (none left in the shared footer or contact modal). Heaviest: software 12, football 10, lacrosse 9, airborne 8, leagues 7, recruiting-network 7, basketball 4 + 6 em dashes, other-sports 5 em dashes.
- **Same thing said twice**: "ScoreBreak works for your sport." is both the Other Sports h1 (`:26`) and its closing h2 (`:159`); "See what ScoreBreak can do for your program." closes index, about and basketball; the Mikey Thompson / Jana Drummond / Jon Torpey testimonials appear on both index and lacrosse.

### Layout
- **Other Sports hero text sits right of the page's content edge** (priority #5).
- **Split heroes don't share a vertical start** (priority #10).
- **Hero headline sizes and starting heights vary page to page**, and the homepage hero is a split layout that doesn't use the shared `.split-hero` component. Design consistency, not a bug.
- **Single-word last lines** in several headlines at 1440 and 390 (not re-measured; rendering is unchanged from Oct 29).

---

## Fixed since Oct 29 (for the record)

- Link previews use `public/og-image.png`, the 1200×630 share image from the ScoreBreak app (SBWeb), with `og:image:width`/`height` and `twitter:image`; the wide transparent nav logo is no longer used.
- Footer Support column links to `/support/` ("Support Page").
- Blog links to scorebreak.io opening in the same tab: accepted as is.

- All internal links and assets resolve, case-sensitively, enforced by `npm run test:static`.
- "Log In" links carry `rel="noopener"`.
- The Pexels hero is a local, optimized file.
- About 2 GB of unused media and `_archive/` are gone; every image in `src/assets/` is used.
- Shared nav, footer, contact modal and testimonials are components; football uses them too, so its menu and footer match the rest (including About Us and the legal links).
- CSS: page styles are scoped and bundled; 630 lines of dead CSS removed (all nine classes listed in §3.3 of the original, plus page leftovers); no inline `style=""` attributes left; the nav divider and "All Solutions" link are classes.
- Homepage sport cards fit at 390px; no page scrolls sideways at 390px.
- Image sharpness and weight (see priority #8, #9).
