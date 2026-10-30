# AI-Tells Audit: ScoreBreak Website

**Date:** 2026-10-29
**Type:** Read-only audit. No site files were changed.
**Scope:** 22 live pages (14 root pages + `blog/index.html` + 7 blog posts) and `styles.css`.
**Excluded:** `_football_before.html` (backup copy of football.html), `recruiting-optin-prototype.html` (prototype), and `_archive/`.

Line numbers refer to the files as they stand today. Each finding is tagged with its category number (1–14) from the brief.

---

## Summary

| # | Category | Result |
|---|---|---|
| 1 | Pill-style labels | 31 on live pages: 26 decorative labels, 5 status/plan badges |
| 2 | Icon-in-tinted-square card grids | 9 icon-card groups (four are 3×2 grids) plus several icon-bullet lists |
| 3 | Glows / radial gradients / blurred blobs | Behind 12 heroes (incl. all 8 blog pages), 4 section visuals, 2 blurred device shadows |
| 4 | Gradient text | **None found** |
| 5 | Hover lift / scale / glow | 10 card hover effects (2 are 3D image tilts), plus sitewide button lift and glow |
| 6 | Glassmorphism | Nav bar only (sitewide), plus football confirmation overlay |
| 7 | Uniform section layouts | Strongest on index, lacrosse, software, recruiting-network |
| 8 | Emoji as icons | **None found** (only the ✕ close glyph on modals) |
| 9 | Fragment headlines | 12 headlines across 7 pages |
| 10 | Spaced hyphens / em dashes | 2 sitewide " - " lines on every page + about 70 more in body copy, plus about 30 em dashes |
| 11 | Generic marketing words | About 35 uses on main pages: worst are "unlocked", "effortless", "purpose-built", "made simple", "game changer" |
| 12 | Banned voice phrases | 2 found (about.html, football.html) |
| 13 | Rule-of-three lists | About 75 three-item lists on main pages; heaviest on leagues, software, index, basketball |
| 14 | Heading capitalization | Title Case and sentence case mixed on most pages; trailing periods inconsistent |

---

## Findings by category

### 1. Pill-style labels

All use a rounded (999px) tinted background and/or border. The target replacement style already exists: `.section-label` in `styles.css:418` (plain uppercase blue text, no background).

**Decorative labels (candidates to convert to plain text)**

| Page | Element | Text |
|---|---|---|
| software.html:370 | `.split-hero-eyebrow` (styles.css:827) | Team Software |
| recruiting-network.html:312 | `.split-hero-eyebrow` | Recruiting Network |
| basketball.html:283 | `.split-hero-eyebrow--orange` | Basketball |
| basketball.html:327 | `.bball-feature-eyebrow` | Film Analysis |
| basketball.html:373 | `.bball-feature-eyebrow` | Bench Replay |
| basketball.html:416 | `.bball-feature-eyebrow` | Officiating Replay |
| airborne.html:641 | `.ab-hero-eyebrow` | Airborne™ |
| airborne.html:699 | `.ab-solution-badge` | Rapid Deployable |
| airborne.html:712 | `.ab-solution-badge` | Installed |
| airborne.html:796 | `.ab-prod-badge` | Installed Stadium Solution |
| airborne.html:880 | inline-styled pill | Officiating Replay |
| leagues.html:391 | `.lg-hero-badge` (with a blue dot) | League Solutions |
| other-sports.html:452 | `.os-badge` | What's Included |
| other-sports.html:516 | `.os-airborne-badge` | Sideline Replay |
| football.html:877–954 | `.feature-tag` ×12 (two per card) | Context-Aware, Auto-Indexed Film, Live Video + Data, Instant Post-Game, AI-Generated, Playbook-Linked, Auto-Built, Halftime Ready, Team Chat, Instant Sharing, Auto-Indexed, Searchable |

**Status / plan badges (keep, or handle separately)**

| Page | Element | Text |
|---|---|---|
| index.html:667 | `.sport-card-tag` | Coming Soon - Gridiron |
| football.html:823 | `.hero-badge` | Now accepting early access applications |
| software.html:556 | `.pricing-badge` | Most Popular |
| recruiting-network.html:456 | `.pricing-badge` | Team Plan |
| software.html:495 | `.handoff-badge` | Premium Service |

Notes:
- "Team Plan" and "Premium Service" are borderline. They name a plan or service tier rather than a status, so they could go either way.
- Unused pill CSS with no visible effect: `.hero-eyebrow` (index.html:49) and `.portal-stat-badge` (recruiting-network.html:56).

### 2. Icon-in-tinted-square card grids

The shared tile is `.feature-icon` (styles.css:549): a 44×44 rounded square, `var(--blue-dim)` background, blue line icon. Several pages copy that pattern under other class names.

| Page | Section | Grid |
|---|---|---|
| recruiting-network.html:333–401 | How the Recruiting Network Works | 6 identical icon cards (3×2) |
| index.html:752–816 | Purpose-Built for Coaches, Players, and Leagues | 6 identical icon cards (3×2) |
| football.html:861+ | A glimpse at what we're building. | 6 icon cards (3×2), each also carrying 2 pills |
| other-sports.html:453+ | Everything your staff needs. Nothing you don't. | 6 icon cards (`.os-feature-icon`) |
| lacrosse.html:446–517 | Purpose-Built for Coaches, Players, and Leagues | 5 icon cards (`.purpose-feature-icon`) |
| index.html:685–737 | Three core products. | 3 product cards with icon tiles (`.product-icon`) |
| support.html:338–369 | Help Center / Downloads / Contact Support | 3 icon cards (`.support-card-icon`) |
| demo.html | Benefits list | 4 icon tiles (`.demo-benefit-icon`) |
| leagues.html:586–599 | Integrations | 3 rows with inline 44px tinted icon squares |

Smaller icon bullets in the same style: basketball.html (12 × `.bball-bullet-icon`), leagues.html (11 × `.lg-check-icon`), airborne.html:885–897 (3 inline 22px tinted squares), recruiting-network.html (`.phone-bullet-icon`).

### 3. Glows, radial gradients, blurred blobs

**Behind heroes**

| Page | Rule |
|---|---|
| index.html:37 | `.hero::before`: blue radial glow, rgba(86,199,255,.07) |
| leagues.html:27 | `.lg-hero::before`: same blue radial glow |
| support.html:25 | `.support-hero::before`: same blue radial glow |
| blog/index.html + all 7 posts (line 25) | `.blog-hero::before`: same blue radial glow |
| football.html:123 | `.hero::after`: stronger blue radial glow (.12), "blue radial glow" in a code comment |
| football.html:113 | `.hero::before`: radial mask over a football-field pattern (more distinctive; lower priority) |

**Behind sections and visuals**

| Page | Rule |
|---|---|
| recruiting-network.html:96 | `.support-section::before`: blue radial glow |
| software.html:148 | `.handoff-visual::after`: blue radial glow (.14) |
| software.html:243 | `.fed-visual::after`: blue radial glow (.13) |
| other-sports.html:235 | `.os-airborne-visual::after`: blue radial glow (.12) |
| airborne.html:530 | `.ab-glow-shadow`: blurred (10px) glow under the device image |
| recruiting-network.html:207 | `.phone-glow-shadow`: blurred (10px) glow under the phone |
| software.html:138, leagues.html:159, recruiting-network.html:188, about.html:141 | Blue-tinted box-shadows on images |

`.page-hero::before` in styles.css:781 defines another glow, but no page uses `.page-hero`, so it has no visible effect.

### 4. Gradient text

None found. No `background-clip: text` or `text-fill-color` anywhere.

### 5. Hover lift, scale, glow

| Page | Rule | Effect |
|---|---|---|
| index.html:264 | `.sport-card:hover` | Lift 4px, arrow nudges |
| index.html:345 | `.product-card:hover` | Lift 3px + shadow |
| lacrosse.html:70 | `.product-card:hover` | Lift 3px + shadow; link slides in |
| other-sports.html:97, :117 | `.os-sport-card:hover` | Lift 3px + shadow; image scales 1.04 |
| airborne.html:181 | `.ab-solution-card:hover` | Lift 3px + shadow |
| football.html:342 | `.feature-card:hover` | Lift 4px |
| software.html:45 | `.film-card:hover` | Lift + blue glow shadow |
| airborne.html:518 | `.ab-scene:hover` | 3D perspective tilt of device image |
| recruiting-network.html:185 | `.phone-scene:hover` | 3D perspective tilt of phone image |
| support.html:63, :91 | `.phone-display:hover`, `.support-card:hover` | Blue glow / shadow |
| styles.css:464, :471 | `.btn:hover`, `.btn-primary:hover` | Every button lifts 1px; primary gets a blue glow |
| styles.css:235 | `.nav-gridiron:hover` | Lift 1px |
| styles.css:507 | `.card:hover` | Shadow |
| football.html:226 | `.btn-primary:hover` | Lift 2px + large blue glow |

### 6. Glassmorphism

| Page | Rule |
|---|---|
| styles.css:85 | `.site-nav`: `backdrop-filter` blur on the sticky nav (every page) |
| football.html:44, :482 | Nav and `#confirmation` overlay use `backdrop-filter` |

A frosted sticky nav is a common pattern and low priority. No frosted content cards were found.

### 7. Overly uniform layouts

| Page | Pattern |
|---|---|
| index.html | 4 of 6 sections are centered headline + subhead + card grid: Built for your sport (3 cards), Three core products (3 cards), Purpose-Built… (6 icon cards), What coaches are saying (3 cards). |
| lacrosse.html | 4-card product row → centered "Purpose-Built…" + 5 icon cards → centered testimonials grid. |
| recruiting-network.html | All 3 sections after the hero are centered head + grid: 6 icon cards, testimonials, pricing. |
| software.html | Centered "Film Analysis Made Simple" + 8 identical cards, then centered pricing cards. |
| football.html | Centered "A glimpse…" + 6 identical icon cards. |

Exact duplicates across pages make the template feel stronger:
- "Purpose-Built for Coaches, Players, and Leagues" + icon grid on both index.html:752 and lacrosse.html:446.
- "See what ScoreBreak can do for your program." CTA on index.html:930, basketball.html:472, about.html:360.
- "ScoreBreak works for your sport." used twice on other-sports.html (h1 at :396 and h2 at :532).
- "What coaches are saying" testimonial block on index, basketball, lacrosse.

Pages that already break the pattern well: basketball.html, leagues.html, airborne.html and solutions.html alternate text and image rows.

### 8. Emoji as icons

None found. The only symbol is the ✕ close button on the contact modal (every page), which is fine. The prototype file uses ✓ characters but is excluded.

### 9. Fragment headlines

| Page | Level | Text |
|---|---|---|
| index.html:554 | h1 | See every play. / Analyze every moment. / Scout like the pros. |
| index.html:685 | h2 | Three core products. / Everything your program needs. |
| basketball.html:284 | h1 | Custom film analysis. / Live bench replay. / One cloud platform. |
| basketball.html:374 | h2 | Real-time replay in the gym. No delays, no excuses. |
| recruiting-network.html:313 | h1 | Get in front of college coaches. / On the platform they already use. |
| about.html:313 | h2 | Professional tools. Built for everyone. |
| leagues.html:417 | h3 | One platform. Every team. Every game. |
| leagues.html:423 | h3 | Every game. Fully broken down. No extra work. |
| leagues.html:455 | h2 | Every team in the league. On the same page. |
| other-sports.html:453 | h2 | Everything your staff needs. / Nothing you don't. |
| solutions.html:265 | h2 | Every athlete. A recruiting profile. Accessible to every college coach. |
| solutions.html:303 | h2 | Not sure where to start? We'll help. |

Related short, slogan-style headlines: "See the Game Differently." (airborne.html:642), "Make the Change." (blog/index.html:163), "End to End Lacrosse." (lacrosse.html:378), "Secure your spot." (football.html:970), "Built for the Coaches Who Demand More." (about.html:280).

### 10. Spaced hyphens and em dashes

**Spaced hyphens (" - " used as a dash)**

There are about 75 uses in visible page copy. Two appear on every page:
- Footer tagline (22 pages, e.g. about.html:380): "We are ScoreBreak - the sports technology company…"
- Contact modal (22 pages, e.g. about.html:452): "Have questions? We're happy to help - no commitment required."

Uses per page in body copy (excluding the two above, meta tags and alt text): software 10, lacrosse 9, football 9, leagues 8, index 8, airborne 8, recruiting-network 7, basketball 4, about 3, solutions 2, demo 2, support 1, blog 3.

Representative examples:
- index.html:644: "Purpose-built platforms for lacrosse and basketball programs - with football coming soon…"
- index.html:712: "The ultimate film analysis platform - interactive stats, custom tagging workflows…"
- software.html:403: "Tag live stats during games with no custom setup - the interface is ready…"
- leagues.html:396: "From film exchange to public stats sites - ScoreBreak gives leagues…"
- recruiting-network.html:369: "College coaches search and filter by class, position, and status (such as uncommitted) - so the right coaches find you."
- airborne.html:660: "No internet required - runs on its own local network"
- basketball.html:381: "Under 6-second live delay - coach with real video, not your memory"

Also in meta descriptions (search snippets) on index, lacrosse, software, leagues, airborne, solutions, support, football (about 18 tags). Image alt text: about.html:292, leagues.html:450, leagues.html:536.

Note: the source often uses two spaces each side ("  -  "). Browsers collapse this to " - ".

**Em dashes (—)**

| Page | Where |
|---|---|
| basketball.html:335–359 | 5 feature bullets start with "—" after a bold label |
| basketball.html:461 | Testimonial attribution |
| index.html:776, :797, :807, :931 | Body copy ("…at any venue — portable…", "…no commitment required.") |
| other-sports.html:397, :454, :472, :488, :496, :518 | Body copy, 6 uses |
| software.html:447 | Data Reporting card |
| support.html:353 | Downloads card |
| resources.html:205 | "VPAT — Voluntary Product Accessibility Template" (a title; acceptable) |
| Meta descriptions | other-sports.html:7, software.html:7 |
| Blog posts | 7 uses across 6 posts (older dated content) |

### 11. Generic marketing words

| Word / phrase | Where |
|---|---|
| unlocked / unlock | recruiting-network.html:345 (h3 "Recruiting Profiles, Unlocked"), :466; lacrosse.html:420; software.html:536; recruiting-network meta tags :7, :10, :16 |
| effortless | index.html:796 (h3 "Effortless Communication"), lacrosse.html:517 (same h3), football.html:874 ("Effortless In-Game Reporting") |
| made simple | software.html:391 (h2 "Film Analysis Made Simple") |
| purpose-built | index.html:644, :752; lacrosse.html:446; airborne.html:655, :900 |
| streamline(s) | leagues.html:396, :430, plus meta :10 |
| whether you're | airborne.html:693, leagues.html:643 |
| powerful | airborne.html:643 (hero sub), index.html:725, football.html:833, about.html:342 |
| comprehensive | basketball.html:328 (h2), leagues.html:490, support.html:315, :339 |
| transform | airborne.html:801 ("Transform your home venue…") |
| next level | index.html:832 ("…used ScoreBreak to reach the next level.") |
| all in one place | index.html:753; recruiting-network meta |
| intuitive | basketball.html:285, software.html:372 |
| ultimate | index.html:712 ("The ultimate film analysis platform") |
| one stop shop | basketball.html:456 (inside a coach testimonial) |
| game changer | index.html:865, lacrosse.html:552, lacrosse.html:630, recruiting-network.html:432 (all inside customer testimonials) |
| revolutionize / revolutionary | blog/v6-recordable-film-sessions.html:227; blog/scorebreak-version-60-recordable-film-sessions.html:228, :230, :231 (press-release copy) |

Not found: seamless, elevate, empower, cutting-edge, robust.

### 12. Banned voice-rule phrases

| Page | Text |
|---|---|
| about.html:281 | "…giving teams the tools to **outperform** on film and on the field…" |
| football.html:862 | "**Built around how** your staff **actually works** - on the sideline, in the film room, and everything in between." |

None found: "actually use", "outcoach", "outprepare".

### 13. Rule-of-three rhythm

About 75 three-item lists in main page copy (plus about 20 in the blog). The repetition shows most where several triples sit back to back:

- **leagues.html (12):** :396 "standardize film, streamline game day operations, and create a professional…" next to "coaches, officials, and scouts alike"; :418 "Standardize the experience, reduce operational overhead, and give every team access…"; :424 "Scout opponents, review your own performance, and prepare…"; :472 "scouting, prep, and review"; :515 "fans, coaches, and scouts"; :643 "coaches, fans, and scouts".
- **index.html (11):** :555 hero subhead "film analysis, sideline replay, and recruiting tools"; :686 "connect athletes with coaches, support game-day performance, and drive recruiting results"; :738 "players build optimized profiles, college coaches discover talent, and connections happen…"; :752–753 "Coaches, Players, and Leagues" then "coaches, players, and organizations".
- **software.html (11):** :372 "Tagging, playback, sharing, and collaboration"; :392 "Cut, organize, and share film…"; :425 two triples in one card; :458 "Pause, mark up, and give feedback"; :469 "practice, scrimmage, and game"; :480 "clips, notes, and feedback".
- **basketball.html (10):** :285 hero subhead; :335–359 every feature bullet carries a triple.
- **Headline triples:** the 3-fragment h1s on index.html:554 and basketball.html:284; leagues.html:417 "One platform. Every team. Every game."; solutions.html:210 "Solutions for teams, athletes, and leagues."; lacrosse.html:379 "Coaching, recruiting, and league tools…".

### 14. Heading capitalization and punctuation

Most pages mix Title Case and sentence case at the same heading level:

| Page | Title Case | Sentence case |
|---|---|---|
| index.html | "Purpose-Built for Coaches, Players, and Leagues", "Game Film Analysis", "Effortless Communication" | "Built for your sport", "What coaches are saying", "See what ScoreBreak can do for your program." |
| lacrosse.html | "What Coaches Are Saying" | (index and basketball use "What coaches are saying") |
| about.html | "Built for the Coaches Who Demand More.", "Founded from Inside the Locker Room Out." | "Professional tools. Built for everyone.", "What we stand for." |
| software.html | "Film Analysis Made Simple", "ScoreBreak Handoff", "Federations and Leagues" | "Simple, team-based pricing" |
| recruiting-network.html | "How the Recruiting Network Works", all six h3s | "Trusted by coaches and programs nationwide", "Simple team pricing" |
| airborne.html | All Title Case, including "Built for Officiating Replay." | "Talk to our team about Airborne." |
| leagues.html | h1 "The Complete Platform for Leagues and Federations." | All h2s in sentence case |
| support.html | h1 "Support That Shows Up When It Counts." | "We're here to help", "Send us a message" |
| football.html | h1 "The Future of Football Film Analysis is Coming", "You're in, Coach!" | "A glimpse at what we're building.", "Secure your spot." |
| blog/ | Post titles mix "ScoreBreak Chat v2", "Notes all over", "v6 - Recordable Film Sessions" | |
| Sitewide | "Get in Touch" (modal, every page) | |

Trailing periods are also inconsistent. Many h1/h2s end with a period ("End to End Lacrosse.", "Secure your spot."); many don't ("Built for your sport", "Simple team pricing"). Sometimes this happens on the same page (index, about, leagues, support).

---

## Priority grouping

### High: most noticeable, fix first

1. **Fragment headlines in heroes and section heads (9):** the index, basketball and recruiting-network h1s; index "Three core products. Everything your program needs."; about "Professional tools. Built for everyone."; other-sports "Everything your staff needs. Nothing you don't."; the four leagues.html headings; solutions.html:265 and :303.
2. **Pill eyebrows above hero headlines (1):** software, recruiting-network, basketball, airborne, leagues. They sit at the top of every product page.
3. **3×2 icon-tile card grids (2):** recruiting-network, index "Purpose-Built…", football, other-sports; plus lacrosse's 5-card version.
4. **Spaced hyphens in sitewide copy (10):** the footer tagline and contact-modal line appear on all 22 pages, plus 7–10 more on each main product page.
5. **Banned phrases (12):** about.html:281 "outperform"; football.html:862 "Built around how your staff actually works".
6. **Buzzwords in headings (11):** "Film Analysis Made Simple", "Effortless Communication" (×2 pages), "Recruiting Profiles, Unlocked", "Effortless In-Game Reporting", "Purpose-Built for Coaches, Players, and Leagues" (×2 pages).

### Medium

7. **Blue radial glow behind heroes (3):** index, leagues, support, blog index and all 7 posts, football (stronger). Also section glows on software (×2), other-sports and recruiting-network; blurred glow shadows on airborne and recruiting-network.
8. **Card hover lifts and 3D tilts (5):** index, lacrosse, other-sports, airborne, football, software; the 3D tilt on airborne and recruiting-network images.
9. **Inconsistent heading case and trailing periods (14):** on most pages.
10. **Uniform centered head + grid sections and duplicate headings (7):** index, lacrosse, recruiting-network, software. Duplicated "Purpose-Built…", "See what ScoreBreak can do for your program." and "ScoreBreak works for your sport."
11. **Rule-of-three density (13):** leagues, index, software, basketball (especially stacked triples in hero subheads and feature bullets).
12. **Remaining pill labels (1):** the 12 football `.feature-tag` pills, basketball feature eyebrows, airborne solution badges, other-sports badges.
13. **Buzzwords in body copy (11):** "unlocked" (×4 + meta), "streamlines", "whether you're" (×2), "Transform your home venue", "reach the next level", "all in one place", "The ultimate film analysis platform", "Powerful sideline replay".
14. **Em dashes in body copy (10):** other-sports (6), index (4), basketball feature bullets (5), software, support.

### Low

15. **Status / plan badges (1):** "Coming Soon - Gridiron", "Now accepting early access applications", "Most Popular", "Team Plan", "Premium Service". Keep these, but consider one consistent badge style for them.
16. **Button hover lift and blue glow (5):** sitewide in styles.css. Subtle; keep or reduce the glow.
17. **Frosted sticky nav (6):** a standard pattern.
18. **Spaced hyphens and em dashes in meta descriptions and alt text (10):** not visible on the page, but visible in search results.
19. **"Game changer" / "one stop shop" in testimonials (11):** these are customer quotes, so don't edit them, but avoid putting the same "total game changer" quote on both index and lacrosse.
20. **Blog press-release language (11, 10):** "revolutionize" / "revolutionary" and dashes in dated posts. Low priority because they are archived news.
21. **Unused CSS (1, 3):** `.hero-eyebrow` (index.html:49), `.portal-stat-badge` (recruiting-network.html:56) and `.page-hero::before` (styles.css:781). No visible effect; safe cleanup only.

---

## Top 10 recommended fixes

1. **Rewrite the fragment h1s** on index, basketball and recruiting-network as one plain sentence that says what the product does (e.g. "Film analysis, sideline replay, and recruiting for lacrosse and basketball programs").
2. **Convert decorative pills to plain eyebrow text.** Use the existing `.section-label` style (uppercase blue text, no background) for every hero and section eyebrow; keep pills only for real status badges.
3. **Replace " - " with real punctuation sitewide.** Start with the footer tagline and the contact-modal line (22 pages each). Then do software, lacrosse, football, leagues, index and airborne, using commas, periods or colons.
4. **Break up the 3×2 icon grids.** On recruiting-network and index, turn "How it works" into a numbered step list or a text-plus-screenshot layout, and drop the tinted icon squares.
5. **Remove the banned phrases.** Reword about.html:281 (drop "outperform") and football.html:862 (drop "Built around how… actually works").
6. **Replace the buzzword headings.** Change "Film Analysis Made Simple", "Effortless Communication", "Recruiting Profiles, Unlocked" and "Purpose-Built for Coaches, Players, and Leagues" to plain, specific headings (e.g. "Messaging built into the app").
7. **Pick one heading style and apply it everywhere.** Sentence case with no trailing period is the most common choice; that includes the "Get in Touch" modal and the "What coaches are saying" variants.
8. **Remove or tone down the blue radial hero glows.** Index, leagues, support and the blog all share the same `::before` glow; deleting it, or keeping it only on the homepage, removes a strong template signal.
9. **Drop the card hover lifts and the 3D image tilts.** Keep a simple border or color change on hover for clickable cards; non-clickable feature cards need no hover state.
10. **De-duplicate repeated sections and trim stacked triples.** Give lacrosse its own heading instead of index's "Purpose-Built…" block, vary the three identical "See what ScoreBreak can do for your program." CTAs, and cut hero subheads on index, basketball and leagues down to one or two items instead of three.
