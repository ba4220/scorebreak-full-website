# AI-Tells Audit: ScoreBreak Website

**Original audit:** 2026-10-29, against the static-HTML site.
**Re-checked:** 2026-11-02, against the Astro site (`src/`, built `dist/`), branch `sb-4314-astro-images`.
**Scope:** every published page (14 site pages, the blog index, 7 posts) plus the shared components and stylesheets.

Every item that's still open is a copy or design decision, so it's Ben's call. Code-side cleanups already done are listed at the end. Line numbers are current `src/` lines.

---

## Summary

| # | Category | Oct 29 | Now |
|---|---|---|---|
| 1 | Pill-style labels | 31 | **Open.** 31 pills in markup (26 decorative, 5 status/plan) |
| 2 | Icon-in-tinted-square card grids | 9 groups | **Open.** Same groups |
| 3 | Glows / radial gradients / blurred blobs | 12 heroes + 6 sections | **Mostly fixed.** Hero glows gone; 3 section glows, 1 blurred shadow left |
| 4 | Gradient text | none | None |
| 5 | Hover lift / scale / glow | 10 cards + buttons | **Mostly fixed.** Card lifts, image tilts and float animations gone; button lifts remain |
| 6 | Glassmorphism | nav + football overlay | **Open (low).** Unchanged |
| 7 | Uniform section layouts | index, lacrosse, software, recruiting-network | **Open.** Unchanged |
| 8 | Emoji as icons | none | None |
| 9 | Fragment headlines | 12 | **Open.** 7 left |
| 10 | Spaced hyphens / em dashes | ~75 + 2 sitewide, ~30 em | **Partly fixed.** Sitewide footer/modal fixed; 72 spaced hyphens + 27 em dashes in page copy |
| 11 | Generic marketing words | ~35 | **Open.** Similar counts |
| 12 | Banned voice phrases | 2 | **Open.** Both still there |
| 13 | Rule-of-three lists | ~75 | **Open.** Not re-counted; copy unchanged |
| 14 | Heading capitalization and periods | mixed | **Open.** 14 Title Case h1/h2s; 42 of 81 end with a period |

---

## Open items

### 1. Pill-style labels
Decorative (candidates for plain `.section-label` text):
- `.split-hero-eyebrow`: software, recruiting-network, basketball (3)
- `.bball-feature-eyebrow`: basketball feature rows (3)
- `.ab-hero-eyebrow` (1), `.ab-solution-badge` (2), `.ab-prod-badge` (1), and the "Officiating Replay" label (`.ab-off-label`, `src/pages/airborne.astro:263`): airborne
- `.lg-hero-badge`: leagues (1)
- `.os-badge`, `.os-airborne-badge`: other-sports (2)
- `.feature-tag`: football, two per card (12)

Status or plan badges (keep, maybe one shared style): `.sport-card-tag` "Coming Soon" (index), `.hero-badge` (football), `.pricing-badge` (software, recruiting-network), `.handoff-badge` (software).

### 2. Icon-in-tinted-square grids
`.feature-icon` 3×2 grids on index ("Purpose-Built…", now the `PurposeBuilt` component) and recruiting-network; football's 6 cards; `.os-feature-icon` (other-sports, 6); `.product-icon` (index, 3); `.support-card-icon` (3); `.demo-benefit-icon` (4); `.lg-integration-icon` (leagues, 3). Smaller icon bullets: `.bball-bullet-icon` (12), `.lg-check-icon` (7), `.ab-off-icon` (3).

### 3. Glows
- Section glows: `.os-airborne-visual::after` (`src/pages/other-sports.astro:373`), `.handoff-visual::after` and `.fed-visual::after` (`src/pages/software.astro:388`, `:445`).
- Blurred glow under the Airborne device images (`.ab-glow-shadow`, `src/pages/airborne.astro:747`); it no longer moves.
- Football's hero `::before` uses a radial mask over its field pattern (distinctive; lower priority).

### 5. Hover effects
Buttons still lift 1px (`.btn:hover`, `src/styles/styles.css:85`; `.nav-gridiron:hover`; demo's submit) and football's primary button lifts 2px with a large blue glow. Card lifts, the 3D image tilts and all float animations are gone.

### 6. Glassmorphism
The frosted sticky nav (`src/styles/components.css:68`) and football's confirmation overlay. Common pattern; low priority.

### 7. Uniform layouts and duplicates
- Index and lacrosse both use the same "Purpose-Built for Coaches, Players, and Leagues" heading (now one component with different items per page).
- "See what ScoreBreak can do for your program." closes index (`:213`), about (`:99`) and basketball (`:201`).
- "ScoreBreak works for your sport." is both the Other Sports h1 and its closing h2 (`src/pages/other-sports.astro:26`, `:159`).
- The Mikey Thompson, Jana Drummond and Jon Torpey testimonials are on both index and lacrosse; the "total game changer" quote is on both.

### 9. Fragment headlines (7)
- h1s: "Custom film analysis. Live bench replay. One cloud platform." (`src/pages/basketball.astro:26`); "Get in front of college coaches. On the platform they already use." (`src/pages/recruiting-network.astro:23`).
- h2s: "Professional tools. Built for everyone." (`src/pages/about.astro:55`); "Every athlete. A recruiting profile. Accessible to every college coach." (`src/pages/solutions.astro:78`); "Every team in the league. On the same page." (`src/pages/leagues.astro:54`); "Real-time replay in the gym. No delays, no excuses." (`src/pages/basketball.astro:116`).
- Slogan-style: "See the Game Differently.", "Make the Change.", "End to End Lacrosse.", "Built for the Coaches Who Demand More."

The homepage h1 is now one sentence ("Powerful film analysis and sideline replay for every level."), but see #11 for "Powerful".

### 10. Spaced hyphens and em dashes
The footer tagline and contact-modal line are fixed. Visible page copy still has 72 spaced hyphens (" - ") and 27 em dashes:

| Page | " - " | — |
|---|---|---|
| software | 12 | 1 |
| football | 10 | 0 |
| lacrosse | 9 | 0 |
| airborne | 8 | 0 |
| leagues | 7 | 0 |
| recruiting-network | 7 | 0 |
| index | 5 | 4 |
| basketball | 4 | 6 |
| about | 3 | 0 |
| demo, solutions | 2 each | 0 |
| support | 1 | 1 |
| other-sports | 0 | 5 |
| resources | 0 | 1 |
| blog (index + posts) | 2 | 9 |

Meta descriptions and some alt text also use " - " (visible in search results).

### 11. Generic marketing words (visible copy, all pages)
"platform" 53, "comprehensive" 5, "professional-grade" 5, "unlocked"/"unlock" 4 (incl. the h3 "Recruiting Profiles, Unlocked", `src/pages/recruiting-network.astro:48`), "purpose-built" 4, "powerful" 4, "effortless" 3 (h3 "Effortless Communication" on index and lacrosse), "intuitive" 3, "streamline" 2, "made simple" 1, "whether you're" 1, "transform" 1, "revolutionary"/"revolutionize" 2 each (blog press release). "Game changer" appears twice, inside customer quotes (`src/data/testimonials.ts`); don't edit quotes, but avoid repeating the same one.

### 12. Banned voice phrases
- "outperform": `src/pages/about.astro:23`.
- "Built around how your staff actually works": `src/pages/football.astro:81`.

### 14. Heading case and periods
Title Case h1/h2s (14): "Purpose-Built for Coaches, Players, and Leagues" (index, lacrosse), "Built for the Coaches Who Demand More." (about), "Choose the Right Airborne for You", "Airborne™ R: Portable Sideline Replay", "Airborne™ Stadium: Installed Multi-Angle Replay", "Built for Officiating Replay." (airborne), "The Future of Football Film Analysis is Coming" (football), "An All-in-One Platform for Leagues and Federations." (leagues), "How the Recruiting Network Works" (recruiting-network), "A Complete Film Solution" (software), "Support That Shows Up When It Counts." (support), "v6 - Recordable Film Sessions" (blog index and post). The contact modal's "Get in Touch" (`src/components/ContactModal.astro:4`) is Title Case on every page. 42 of 81 h1/h2s end with a period.

---

## Fixed since Oct 29

- **Glows:** the blue radial glow behind the index, leagues, support and blog heroes; recruiting-network's support-section glow (with the dead section); the blurred phone glow.
- **Motion:** card hover lifts (index, lacrosse, other-sports, airborne, software, support), the 3D image tilts (airborne, recruiting-network) and every float animation (airborne, leagues, software).
- **Sitewide dashes:** the footer tagline and contact-modal line.
- **Unused CSS from the original list:** `.hero-eyebrow`, `.portal-stat-badge` and `.page-hero::before` are deleted, along with the rest of the dead CSS.
- **Fragment headlines:** the homepage h1 and "Three core products. Everything your program needs." are gone; other-sports' "Everything your staff needs. Nothing you don't." is now one sentence.
