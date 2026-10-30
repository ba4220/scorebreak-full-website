# ScoreBreak Website Audit

**Date:** October 29, 2026
**Scope:** all 23 HTML pages (15 top-level pages, `blog/` index + 7 posts, `recruiting-optin-prototype.html`), `styles.css`, and every referenced asset.
**Method:** static parsing of every `href`/`src`/CSS `url()`, a text pass over all visible copy, and a headless-browser pass of every page at 1440, 1024, 768 and 390px (horizontal scroll, overflow, clipped text, overlaps, line wrapping, image sizing, alignment). No project files were changed; this report is the only file added.

`recruiting-optin-prototype.html` is an internal prototype (no site nav/footer, `Internal Only` label). It is excluded from consistency findings unless noted.

---

## Priority summary

Fix first. These are visible to users or will break in production:

| # | Issue | Where |
|---|---|---|
| 1 | Image path uses the wrong case: `airborne r/UMD_ipad.png` but the folder is `Airborne R/`. Works on macOS, **404s on Netlify/Linux** | `index.html:648` |
| 2 | Homepage says **"Three core products"**; All Solutions says **"Four solutions."** The homepage button under it ("Explore Solutions →") leads straight to the page that says four | `index.html:685`, `solutions.html:210` |
| 3 | "Learn More about Handoff →" goes to the **demo form**, not Handoff info | `software.html:498` |
| 4 | Basketball page still says **"sideline replay"** in three places after the hero and stats moved to "bench replay" | `basketball.html:373, ~386, 472` |
| 5 | Other Sports hero text starts **248px right of the container edge** used by every other section (x=400 vs 152 at 1440px) | `other-sports.html` hero |
| 6 | Homepage hero at 390px: the decorative glow is clipped into a **hard vertical edge** on the right side of the hero | `index.html` `.hero::before` |
| 7 | Football's mobile menu is missing **About Us** (it's a separate inline-styled copy of the menu) | `football.html:~781` |
| 8 | Basketball hero photo is **blurry on retina screens**: the file is 619px wide but displays at 449px (needs ~900px) and 704px on tablet | `Basketball/scorebreak-basketball.png` |
| 9 | 8.9 MB image displayed at 424px on the homepage (and other multi-MB images shown small) | see §4.4 |
| 10 | Portal hero headline sits **40px lower** than basketball/software at 1440×900 (taller phone, text centered against it), so the three split heroes no longer share a vertical start | `portal.html` |

---

## 1. Links and assets

### 1.1 Internal links and asset paths
- **No missing files.** Every internal `href`, `src`, and CSS `url()` resolves to a file that exists.
- **No broken anchors.** Every `#id` link (including `airborne.html#airborne-stadium`, `#features`, `#film-analysis`, `#waitlist`) has a matching `id`.
- **Case mismatch (will break live):** `index.html:648` → `airborne r/UMD_ipad.png`. The folder on disk is `Airborne R`. macOS is case-insensitive so it works locally; Netlify serves from a case-sensitive file system, so the image will 404 in production.
- **Mixed URL encoding:** `index.html:604` and `:629` → `NCAA D1/Saint%20Joseph's.png` (raw space in the folder, `%20` in the filename). It works, but it's inconsistent.
- **Encoding style across the site** (both work, but should be one convention):

  | Folder | Raw space | `%20` |
  |---|---|---|
  | `NCAA D1/` | 61 refs | 4 refs (`index.html` marquee: NBA Academy, Saint Joseph's; `leagues.html`) |
  | `Airborne R/`, `Airborne Stadium/`, `Logos/white word logo.png` | all raw | none |

  Folder names with spaces (`NCAA D1`, `Airborne R`, `Airborne Stadium`, `Logos/white word logo.png`, `ScoreBreak Logo - LB@3x.png`) are the root cause; renaming to hyphenated lowercase (e.g. `ncaa-d1/`) would remove the whole class of problem.

### 1.2 External links
13 unique external URLs: app.scorebreak.io, the federation live example, App Store, Apple badge SVG, Pexels photo, Intercom help center, Instagram, YouTube channel, X, scorebreak.io (+ `/privacy`, `/terms`), and a YouTube video. (They were not fetched over the network; reachability was not verified.)

`target="_blank"` / `rel="noopener"` consistency:
- **Nav "Log In"** (`https://app.scorebreak.io`) has `target="_blank"` but **no `rel="noopener"`** on 21 pages: about:270, airborne:633, basketball:274, blog/index:153, all 7 blog posts (:207), demo:290, index:543, lacrosse:370, leagues:382, other-sports:385, portal:301, resources:172, software:355, solutions:200, support:307. Football's copy (`football.html:769`) *does* have `rel="noopener"`.
- `https://www.scorebreak.io` links in two blog posts have **no `target`/`rel`** (opens in the same tab, unlike every other external link): `blog/scorebreak-version-60-recordable-film-sessions.html:233`, `blog/scorebreak-web-v4.html:232`.
- The rest (footer socials, Privacy/Terms, Help Center, App Store, YouTube) are consistent.

### 1.3 Dead buttons / links
- No `href="#"` link lacks a handler. All 16 "Contact Us" buttons and the footer "Contact Us" call `sbOpenModal()`, which is defined on every page that uses it.
- Hotlinked asset: the Other Sports hero background is loaded from `images.pexels.com`. If Pexels changes or rate-limits the URL the hero goes blank; it should be downloaded into the project.

### 1.4 Files nothing references
About **100 files (~2.1 GB on disk)** are not referenced by any page or stylesheet. (`Airborne R/UMD_ipad.png` is excluded from this list; it's used, just with the wrong case, see 1.1.)

| Category | Files | Size |
|---|---|---|
| Old/raw demo videos | `website_demo.mp4`, `website_demo2–8.mp4`, `website_demo3/4/5/6/7_optimized.mp4`, `hero-video.mp4`, `index-hero.mp4`, `scorebreak_demo.mp4`, `scorebreak_site_demo.mp4`, `scorebreak_walk_through_basketball.mp4`, `Website_demo.gif`, `Screen Recording 2026-07-28 … .mov` | ~2.0 GB |
| Page-design screenshots | `Homepage.png`, `Lacrosse Landing/Software/Portal/Airborne/Airborne R/Airborne Stadium Page.png` | ~12 MB |
| Backups/duplicates | `Airborne_ipad_in_use.png` + `_ORIGINAL_BACKUP.png` (13 MB each), `Basketball/Officiating-replay-unrivaled.png`, `Software/Collage-image-Software-Hero-light mode on mac.PNG` (5 MB) | ~35 MB |
| Superseded software images | `Software/AI-location-charting.png`, `film-sharing-software.png`, `interactive-stats-software.png`, `interactive_stats_basketball.png` (raw), `basketball_film_playlist.png`, `basketball_film_storage.png`, `final_software_airborne_mockup.png`, `new_mockup_software.png`, `software-home-page.jpg` | ~10 MB |
| Logo variants | 40+ in `NCAA D1/` (e.g. `Air Force copy/2/3.png`, `Army2/4`, `Brown3`, `Canisius 1–3`, `Duke`, `Duke3`, `Harvard2/3`, `Stony Brook 1–3`, `Towson copy`, `WNEU 1–2`, `penn-state.*`, `OSU.webp`, `OSU_good.jpeg`, all four Unrivaled files, `American-conference`, `Daktronics_logo.png`), `Logos/3_black.png`, `3_white.svg`, `4-dark.svg`, `4.png`, `4.svg`, `logo-nav.png`, `solutions-logos.png`, `ScoreBreak Logo - LB@3x.png` | ~4 MB |
| Portal leftovers | `Portal/ScoreBreak_mockup_L2/L3/L4.png`, `portal-profile.png`, `portal-profile-sample.png` | ~4 MB |
| Misc | `FERWABA.jpeg`, `Genius_sports_logo.png`, `PLL_blurred.png`, `Airborne R/Airborne Dual SDI.png`, `Airborne R_no logos.png`, `Airborne_locker_room-removebg-preview.png` | ~2 MB |
| Confidential | `Resources/…SOC 2 Type II Report….pdf` (intentionally unlinked and git-ignored; fine) | 0.6 MB |

Note: `logo-nav.png` is unused as an image but is referenced in `og:image` meta tags on several pages, so check before deleting.

---

## 2. Consistency across pages

### 2.1 Nav and footer
- **Desktop nav:** identical on all 22 site pages (same links, labels, order).
- **Mobile nav:** identical on 21 pages. **Football** uses its own inline-styled menu (`#sbMob`, `football.html:781`). It works, but it is **missing "About Us"** and duplicates ~40 inline style attributes.
- **Footer:** identical on the 21 standard pages; the **Legal column is gone everywhere** and Privacy/Terms sit in the bottom bar. **Football** has a different single-row footer: no Solutions/Company/Support columns and **no Privacy Policy or Terms links at all**.
- **Label drift between the three menus** (same destination, different words):

  | Destination | Desktop nav | Mobile nav | Footer |
  |---|---|---|---|
  | `about.html` | About | About Us | About Us |
  | `airborne.html` | Airborne Sideline Replay | Airborne Sideline Replay | **Airborne** |
  | `solutions.html` | All Solutions | **Solutions** (section label) *and* All Solutions | All Solutions |
  | `football.html` | Football *and* Gridiron (button) | Football *and* Gridiron | Football |

- The footer **Support** column has no link to `support.html` (Help Center, Downloads, Resources only).

### 2.2 Product names
| Product | Variants found |
|---|---|
| Team Software | "Team Software" (nav, cards, solutions), **"SCOREBREAK Software"** (homepage badge, `index.html:~688`), "Team Software & Breakdown Services" (lacrosse card), "film analysis software"/"ScoreBreak software" in body copy |
| Airborne | "Airborne", "Airborne™" (hero eyebrow, lacrosse, index), "Airborne™ R" / "Airborne™ Stadium" in airborne h2s vs "Airborne R" / "Airborne Stadium" everywhere else, "Airborne Sideline Replay" (nav/solutions/index card), "Airborne: Sideline Video Replay" (lacrosse card), **"ScoreBreak Airborne"** (basketball body) |
| Recruiting Network | No standalone "Portal" in visible copy. But the homepage card describes it as **"The recruiting platform for high school and club teams"** (`index.html:~737`), and the file is still `portal.html` (URL only) |
| League Solutions | "League Solutions", **"Federations and Leagues"** (software h2) vs **"Leagues and Federations"** (leagues h1), "Film Exchange" / "film exchange" (capitalization varies) |
| Handoff | "Handoff", "ScoreBreak Handoff", "ScoreBreak Handoff™" (software only), "Handoff breakdown service", "Handoff breakdowns" |

### 2.3 Headline capitalization (Title Case where sentence case is the standard)
35 headings use Title Case. Site-section headings to fix:
- `about.html:280` "Built for the Coaches Who Demand More." · `:296` "Founded from Inside the Locker Room Out."
- `airborne.html:642` "See the Game Differently." · `:692` "Choose the Right Airborne for You" · `:733` "Airborne™ R: Rapid Deployable Sideline Replay" · `:800` "Airborne™ Stadium: Installed Multi-Angle Replay" · `:881` "Built for Officiating Replay."
- `blog/index.html:163` "Make the Change."
- `demo.html:302` "See ScoreBreak in Action." · `:346` "Request a Demo"
- `football.html:852` "The Future of Football Film Analysis is Coming" (also mixes: "is" lowercase)
- `index.html:752` and `lacrosse.html:446` "Purpose-Built for Coaches, Players, and Leagues" · `index.html:764` "Game Film Analysis" · `:786` "Scouting & Team Preparation"
- `lacrosse.html:378` "End to End Lacrosse." · `:461` "Analysis & Reporting" · `:476` "Scouting & Team Preparation" · `:490` "Integrated Sideline Replay" · **`:531` "What Coaches Are Saying"** (index and basketball use "What coaches are saying")
- `leagues.html:395` "The Complete Platform for Leagues and Federations."
- `portal.html:333` "How the Recruiting Network Works" · `:345–401` card titles ("Recruiting Profiles, Unlocked", "Easy Clipping for Athletes", "College Coach Discovery", "Full Game Film Access", "Share Profiles Anywhere")
- `software.html:367` "A Complete Film Solution" · `:387` "Film Analysis Made Simple"
- `support.html:314` "Support That Shows Up When It Counts."
- Blog post titles (`v6 - Recordable Film Sessions`, the press-release h2) are historical copy; lower priority.

### 2.4 Button labels
- **Primary CTA is consistent:** "Contact Us" everywhere (opens the modal).
- **Secondary CTA varies with no pattern:** "Request a Demo" (4), "Request a Demo →" (5), "Explore Software", "Explore Team Software →", "Explore Solutions →", "Learn More ↓", "Learn About Airborne →", "Explore Airborne →", "See Airborne Stadium →", "Explore League Solutions →", "Explore the Recruiting Network →".
  - **Arrow use is inconsistent:** "Request a Demo" with and without "→"; "Explore Software" (no arrow) vs "Explore Team Software →".
  - **Verbs vary for the same action:** "Explore Airborne →" vs "Learn About Airborne →".
- **Label ≠ destination:** "Learn More about Handoff →" → `demo.html` (`software.html:498`).
- **Duplicate on one page:** basketball has "Explore Software" in the hero and the bottom CTA, both to `software.html`, plus "Explore Team Software →" mid-page (three buttons, same destination, two labels).
- "Explore Solutions →" (`index.html:934`) follows "Three core products" but lands on "Four solutions" (see Priority #2).

### 2.5 Eyebrow labels that repeat their heading or the page name
- `airborne.html:~799` "INSTALLED STADIUM SOLUTION" → "Airborne™ Stadium: Installed Multi-Angle Replay" (repeats "Stadium", "Installed")
- `airborne.html:712` card badge "INSTALLED" → card title "Airborne Stadium" + description saying "permanent install"
- `airborne.html:641` hero eyebrow "AIRBORNE™" on the Airborne page (restates page/nav)
- `leagues.html:391` hero pill "LEAGUE SOLUTIONS" on the League Solutions page
- `resources.html:181` "RESOURCES" on the Resources page; `blog/index.html:162` "BLOG" on the Blog page
- `index.html:830`, `basketball.html:452` "TESTIMONIALS" → "What coaches are saying" (the heading already says it)
- `portal.html:415` "WHAT COACHES ARE SAYING" → "Trusted by coaches and programs nationwide" (two headlines for one section)
- `software.html:366` "TEAM SOFTWARE" on the Team Software page (requested as the split-hero pill; noting for completeness)
- `solutions.html` row eyebrows ("TEAM SOFTWARE", "AIRBORNE SIDELINE REPLAY", …) are useful on a multi-product page; keep.

### 2.6 Split heroes
- `basketball.html`, `software.html`, `portal.html` all use the shared `.split-hero` component: identical text left (152px at 1440 / 82 at 1300 / 32 tablet / 20 mobile), pill, font sizes, gaps (28/24/32px) and buttons.
- **Portal's headline starts 40px lower** at 1440×900 (y=244 vs 204) because the `--portrait` phone is taller than the text and the text centers against it (by design per the last change, but it breaks "same vertical start").
- **The homepage hero is also a split layout (text + video) but does not use the component:** h1 64px vs 51px, text starts at x=60 vs 152 (the homepage overrides `.container` to 1400px), different grid.
- Other-sports hero: text at x=400 while its content sections start at x=152 (§4.1).

### 2.7 Numbers and terms
- **Latency:** "<6s Bench Replay Latency" (basketball stats), "Under 6-second live delay" (basketball), "6-second latency" / "Ultra-low 6-second latency" / "6-Second Ultra-Low Latency" (airborne, lacrosse), "within 6 seconds" (solutions). One claim, five phrasings.
- **Sideline vs bench (basketball):** the hero and stats say "bench replay", but the eyebrow `basketball.html:373` "SIDELINE REPLAY", the body "broadcast-quality sideline replay to basketball arenas", and the bottom CTA "film analysis and sideline replay tools" still say sideline.
- **D1:** "D1" (about, lacrosse) vs **"Division 1"** (`about.html` Mission paragraph). No "Division I".
- **Percent:** "85%+" vs "65%" in the same sentence (`lacrosse.html:379`); one has a plus, one doesn't. If intentional, fine; otherwise make both "85%+" / "65%+" or neither.
- **Counts:** homepage "Three core products" (and three badges/cards: Software, Airborne, Recruiting Network) vs All Solutions "Four solutions" (adds League Solutions); the airborne page "Two Solutions" eyebrow is a different, valid count.

### 2.8 Dashes and spacing
- The site mixes two dash styles in visible copy: **spaced hyphen " - "** (~77 occurrences) and **em dash "—"** (~21).
  - **Pages mixing both:** basketball (4 hyphen / 7 em), index (8 / 4), software (12 / 1), support (1 / 1), blog posts.
  - **Hyphen only:** about, airborne, demo, football, lacrosse, leagues, portal, solutions.
  - **Em dash only:** other-sports, resources.
- The spaced hyphens are written in source as **double-spaced `"  -  "`** (about 140 instances across 22 files). Browsers collapse the spaces, so it isn't visible, but it confirms these are stand-ins for dashes.
- No visible double spaces in rendered text.

---

## 3. Redundancy

### 3.1 Repeated phrases (non-blog pages)
| Phrase | Count | Heaviest pages |
|---|---|---|
| "platform" | 30 | leagues (8), index (6), lacrosse (5), basketball (3) |
| "built for" | 14 | airborne (3), index (3), about/basketball/lacrosse (2 each) |
| "one platform" | 6 | leagues (3: h1 "Complete Platform", h3 "One platform. Every team. Every game.", body) |
| "complete" | 6 | software (2), about, index, leagues, other-sports |
| "professional-grade" | 5 | about (3) |
| "purpose-built" | 5 | airborne (2), index (2), lacrosse |
| "every level" / "at every level" | 4 / 3 | index, lacrosse, leagues, other-sports |
| "powerful", "effortless", "easy-to-use", "intuitive", "built to fit your system" | 2–4 each | |

### 3.2 Same thing said twice
- **Same page:**
  - `other-sports.html`: the h1 **and** the closing CTA h2 are both "ScoreBreak works for your sport."
  - `index.html`: the hero says "Everything your coaching staff needs - in one platform"; the next section's headline is "Everything your program needs."
  - `basketball.html`: "One cloud platform." in the h1, then the stats bar opens with "100% Cloud-Based Software".
  - `leagues.html`: "The Complete Platform…" (h1) + "One platform. Every team. Every game." (h3) + "one platform" in body.
- **Across pages:**
  - `index.html` and `lacrosse.html` share the heading "Purpose-Built for Coaches, Players, and Leagues" and the same three testimonials (Mikey Thompson, Jana Drummond, and the "10,000x a day" quote).
  - `lacrosse.html` and `portal.html` share the Ryan Danehy testimonial.
  - "built to fit your system" appears on basketball and other-sports.

### 3.3 CSS
- **Duplicate selectors in `styles.css`** (outside media queries): `.logo-dark` (2×), `.logo-light` (2×), `.sb-form-group textarea` (2×).
- **Classes defined in `styles.css` but used nowhere (9):** `card`, `card-img`, `divider`, `drop-icon`, `img-placeholder`, `page-hero`, `section-lg`, `stats-grid`, `testimonial-avatar`.
- **Page `<style>` classes unused on their own page:**
  - portal 17 (an entire removed "phone showcase", stats and support section)
  - software 11 (`hv-*`, `fv-*` hero/fed visual placeholders)
  - football 10
  - airborne 6 (`*-visual-inner/icon/label` placeholders)
  - basketball 5 (`vs-table`, `vs-check`, `vs-x`, `highlight`, `bball-feature-visual-placeholder`)
  - about 3 (`sport-cards`, `sport-card-eyebrow`, `sport-card-link`)
  - index 2 (`hero-eyebrow`, `testimonials-scroll`)
  - lacrosse 2
  - demo 2
  - other-sports 1, support 1
- **Repeated inline styles that should be classes:**
  - `border:none;border-top:1px solid rgba(255,255,255,.08);margin:6px 0;` (the nav divider `<hr>`) ×44 on 22 pages. It's also hard-coded white, so it's nearly invisible in light mode.
  - `color:var(--blue);font-weight:700;` (the "All Solutions" link) ×42 on 21 pages.
  - `background:linear-gradient(135deg,var(--blue) 0%,#0080CC 100%);color:#fff;text-align:center;` (mobile Gridiron button) ×21, duplicating `.nav-gridiron`.
  - `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;` ×15 (software film cards, etc.).
  - `height:36px;width:auto;object-fit:contain;flex-shrink:0;` ×11 (testimonial logos).
  - `padding-bottom:4rem;` ×7.
  - Inline style attributes per page: football 67, leagues 43, airborne 34, index 24, basketball 23, software 23, lacrosse 22.

---

## 4. Formatting and layout

Checked every page at **1440, 1024, 768, 390px**. **No horizontal scrolling on any page/width, no clipped text, no overlapping elements** (the only overlaps detected are Other Sports' hero text over its own background photo, which is intended).

### 4.1 Alignment
- **Other Sports hero:** text block at x=400 (1440) / 192 (1024) / 74 (768) while every following section starts at x=152 / 32 / 32.
- **Homepage:** overrides `.container` to max-width 1400px, so its content edge (x=60 at 1440) differs from every other page (x=152).
- **Hero vertical starts vary:** h1 top at 120 (index), 144 (lacrosse, solutions, support), 172 (demo), 196 (about, resources, blog, other-sports), 204 (basketball, software, airborne, leagues), 244 (portal).
- **Hero headline sizes vary:** 80px (lacrosse, airborne, solutions), 70px (other-sports), 64px (index, leagues), 54px (about, resources, blog), 51px (split heroes, support), 42px (demo).
- **Mobile:** the homepage sport cards extend 6px past the screen at 390px (hidden by `overflow`, so no scrollbar, but the right edge is cut).

### 4.2 Section padding
15 different top/bottom padding combinations are in use at 1440px. Most common: 60/60 (12 pages), 144/48 (7), 48/48 (5), 144/64 (3), 0/60 (3), then one-offs (16/60, 36/80, 40/40, 64/64, 80/60, 128/72, 136/64, 0/48, 0/0, 144/0). Hero bottom padding alone varies 0 / 48 / 60 / 64 / 72 / 80px.

### 4.3 Cards and images
- Card rows are even everywhere except intentional two-column layouts (`demo.html` text vs form; `support.html` contact block).
- Border radii mix 8px, 10px, 12px (`--radius`), 16px, 20px (`--radius-lg`) and several hard-coded values in inline styles.

### 4.4 Image quality and weight
**Blurry on retina (file smaller than ~2× display width):**
- `Basketball/scorebreak-basketball.png` (619px): shown 449px on basketball and 424px on index at 1440; 704/688px at 768.
- `Basketball/Basketball.png` (1112px) shown 702px at 768.
- `Airborne R/Airborne-r-camera-case.png` (827px) shown 540–704px; `Airborne R/ipad--sideline-in-use.png` (960px) shown 556px; `Airborne Stadium/camera-installation-airborne-stadium.png` (896px) shown 540–704px; `Airborne R/Airborne-home-page.png` (976px) shown 591–704px.
- Software film cards (592px files) shown 338px at 768 (tablet); `Handoff/handoff.png` (1120px) shown 702px at 768; `league_site_mockup.png` (1200px) shown 704px at 768.

**Far heavier than needed:**
- `Airborne R/UMD_ipad.png` **8.9 MB** (3492px) shown 424px (index).
- `Airborne Stadium/AirborneStadium_example-interface.png` **5.2 MB** shown 363px.
- `Basketball/Officiating-replay-unrivaled-enhanced.png` 2.9 MB shown 536px; `Airborne R/Airborne-R.png` 2.8 MB shown 556px; `camera-installation-airborne-stadium.png` 1.7 MB.
- `Portal/recruiting.png` 1.1 MB and `Portal/portal-player.png` 0.8 MB shown 264px (lacrosse cards).
- **Logos:** many marquee/testimonial logos are 1,000–4,000px source files displayed at ~36–90px, e.g. `new_towson.png` 4096², `alabama.png` 3840px, `oregon.png` 3840px, `Mercer.png` 2880px, `cornell.png` 2400px (389 KB), `northwestern.png`, `Syracuse.png` 1920px, `NBA-Academy-Logo.png` 2400px, `CC.png` 827px.

### 4.5 Text wrapping (orphans and awkward breaks)
Single-word last lines found by the browser pass (worth fixing where it's a headline):
- **1440:**
  - about h2 "…Locker Room / Out."
  - airborne h1 "See the Game / Differently."
  - basketball h2 "…efficiency and / customization."
  - blog index card "…Recordable Film / Sessions"
  - demo h1 "See ScoreBreak in / Action."
  - leagues h2 "Connect your existing / infrastructure."
  - resources h1 "…compliance / documents." and h3 "…Accessibility / Template"
  - software hero paragraph "…more time / coaching."
  - index subtitle "…reach the next / level."
  - portal subtitle "…College coaches discover / talent."
- **1024:**
  - about h1 "…Who Demand / More."
  - leagues h2 "…for your / league."
  - software h2 "Federations and / Leagues"
  - solutions h2s "…custom / workflows.", "…leagues and / events."
- **390 (mobile):** most pages have 2–6 single-word headline endings, e.g.:
  - index "What coaches are / saying"
  - lacrosse "End to End / Lacrosse."
  - airborne "Talk to our team about / Airborne."
  - leagues has six of them
  - solutions "We'll / help."
  - football "…is / Coming"
- **Visible clipping:** the homepage hero glow at 390px (Priority #6).

---

## 5. Copy quality

### 5.1 Errors
- **"principals" → "principles"**: `blog/v6-recordable-film-sessions.html` ("a base layer of understanding for the principals which will be reviewed in film"). Also needs a comma before "which".
- **"End to End Lacrosse."** should be hyphenated as a compound modifier: "End-to-end lacrosse." (`lacrosse.html:378`).
- **Press-release subhead** (`blog/scorebreak-version-60-…html:228`): "Version 6 of iOS iPadOS macOS Software" is missing commas ("iOS, iPadOS, and macOS").
- **Blog titles use a spaced hyphen as a dash**: "v6 - Recordable Film Sessions" (title and listing).
- **"Built-in officiating replay."** (leagues) vs **"Built for Officiating Replay."** (airborne): near-identical headlines with different casing.
- The demo confirmation h3 renders "Thanks, !" until JavaScript fills the name; that's fine if JS runs, but a no-JS or slow load shows the empty name.

### 5.2 Headline punctuation
45 h1/h2 headings end with a period and 32 do not, sometimes on the same page:
- `index.html`: "Three core products. / Everything your program needs." (periods) vs "Built for your sport", "Purpose-Built for Coaches, Players, and Leagues", "What coaches are saying" (none).
- `airborne.html`: "See the Game Differently." / "What is Airborne?" / "Built for Officiating Replay." vs "Choose the Right Airborne for You" / both product h2s (none).
- `software.html`: no periods ("A Complete Film Solution", "Film Analysis Made Simple", "Simple, team-based pricing", "Federations and Leagues"), while basketball, leagues and solutions use periods throughout.
- `portal.html`: hero h1 has periods; "How the Recruiting Network Works", "Trusted by…", "Simple team pricing" don't.

### 5.3 Vague or inflated language
- "The ultimate film analysis platform" (`index.html` Team Software card).
- "Revolutionary" (×3 in the v6 press release and post).
- "Scout like the pros", "Support That Shows Up When It Counts", "Built for the Coaches Who Demand More", "See the Game Differently": slogan headlines that don't say what the product does.
- "professional-grade" ×5, "purpose-built" ×5, "powerful" ×4, "effortless" ×3: these lean on adjectives where a concrete detail (time saved, what's included) would land harder.
- "A Complete Film Solution" / "The Complete Platform for Leagues and Federations": "complete" is unsupported claim language.
- Football: "a new alternative to Hudl" names a competitor in the subhead; deliberate positioning, but worth a conscious decision (the homepage `<title>` also says "A Modern Hudl Alternative").

---

## Suggested order of work
1. Fix the `airborne r/` case bug and the "Three"/"Four" contradiction (both quick, both user-visible).
2. Basketball "sideline" → "bench" leftovers; Handoff button destination; football mobile menu "About Us" and footer legal links.
3. Other Sports hero alignment and the homepage 390px glow edge.
4. Re-export the blurry hero/feature images at 2× and compress the multi-MB images and oversized logos.
5. Pick one dash style, one headline-period rule, sentence case, and one secondary-CTA pattern; then do a single copy pass.
6. Housekeeping: move or delete the ~2 GB of unused media, remove dead CSS, and turn the repeated inline styles into classes.
