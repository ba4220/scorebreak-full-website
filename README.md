# ScoreBreak Website

Marketing site for ScoreBreak: film analysis software, Airborne sideline replay hardware, the Recruiting Network, and league solutions.

**Contact:** Ben Abraham, ben@scorebreak.io

## Overview

- Built with [Astro](https://astro.build) and TypeScript into a fully static site: `npm run build` writes plain HTML, CSS, JS and assets to `dist/`, which any static host can serve. Pages have clean URLs with a trailing slash (`/about/`, `/blog/notes-all-over/`), built as `about/index.html` etc.; every internal link and asset path is site-root absolute (`/demo/`, `/logos/…`).
- Layout:
  - `src/pages/`: one `.astro` file per page. Each sets its `seo` (title, description, social tags; see `src/components/Seo.astro`) and wraps its content in `src/layouts/Layout.astro`. Its own CSS goes in a `<style>` at the end of the file: Astro scopes it to that page (`scopedStyleStrategy: 'where'`, so no added specificity), bundles it after the shared stylesheets, and `:global(...)` reaches markup outside the file (the theme attribute on `<html>`, child components, Markdown, script-created elements).
  - `src/layouts/Layout.astro`: the shared `<head>`, nav, footer, contact modal and site script. Edit those once there and every page gets the change.
  - `src/components/`: `Nav` (sets `aria-current="page"` automatically), `Footer`, `ContactModal`, `Seo`, `Testimonial` / `TestimonialCarousel`, `CtaSection` (the closing "Contact Us" band), `PurposeBuilt` (the "Purpose-Built for Coaches, Players, and Leagues" section on index and lacrosse; each page passes its own items).
  - `src/data/`: `testimonials.ts` (every coach quote, used by id on index, lacrosse, basketball and recruiting-network; edit a quote once) and `school-logos.ts` (homepage logo marquee).
  - `src/content/blog/`: one Markdown file per post (`title`, `description`, `date`, `author` frontmatter). `src/pages/blog/[slug].astro` publishes each at `/blog/<slug>/` through `src/layouts/BlogPost.astro`; the blog index and the Newer/Older links are generated, newest first. To add a post, add a Markdown file. Straight quotes stay straight (smart quotes are off).
  - `src/styles/`: `styles.css` (shared styles) and `components.css` (what the football page also needs: design tokens, nav, footer, modals and modal forms). `football.astro` passes `sharedStyles={false}` to skip `styles.css`.
  - `src/scripts/`: TypeScript, bundled by Astro. See [JavaScript](#javascript).
  - `src/assets/`: every image the pages show. Import it and render it with `<Image src={img} width={N} … />` from `astro:assets`, where `N` is the largest CSS width it displays at. The build resizes it to WebP and writes a `srcset` up to 2× `N` (`image.layout: 'constrained'` in `astro.config.mjs`), so originals can stay full-size.
  - `public/`: files served as-is at a fixed URL: video, PDFs, the favicon and `og-image.png` (the 1200×630 link-preview image, same as the app's).
- Pages contain no inline scripts or `onclick`-style handlers (enforced by `npm run test:static`).
- Production is a Google Cloud Storage bucket (see [Hosting](#hosting-google-cloud-storage)). Netlify only builds deploy previews for PRs on this repo, configured in `netlify.toml`; drop both when the repo moves to ScoreBreak's GitHub.

## Hosting (Google Cloud Storage)

The site is hosted from a Google Cloud Storage bucket configured as a static website.

**Staging:** `npm run deploy:staging` builds and publishes to `gs://scorebreak-marketing-site-staging` (another bucket: `BUCKET=gs://… npm run deploy:staging`). It asks before uploading and before deleting anything, and needs `gsutil` logged in. On top of a plain upload it:

- builds against the staging API (`PUBLIC_API_HOST=https://staging-api2.scorebreak.io`)
- adds `<meta name="robots" content="noindex, nofollow">` to every page, so search engines skip staging (on a copy; `dist/` stays clean)
- uploads every page a second time without the trailing slash (`/support` as well as `/support/index.html`), so `/support` loads directly instead of redirecting to `/support/index.html`
- sets `Cache-Control: no-cache` on HTML and `public, max-age=31536000, immutable` on `/_astro/`
- sets the bucket's main page to `index.html` and its 404 page to `404.html`
- lists objects in the bucket that aren't in the build and deletes them only if you answer `y`

It uses plain `gsutil cp` rather than `gsutil rsync`, which skipped changed files against this bucket, and runs gsutil single-process, since its multiprocessing crashes Python on macOS.

**Production:** no script yet. The staging one minus the `noindex` step and with the production API host (a plain `npm run build`) is the starting point.

- `index.html` as the main page suffix is what makes clean URLs work: `/about/` serves `about/index.html`. Without the trailing slash GCS redirects `/about` to `/about/index.html`, which is why the staging script also uploads slash-less copies. This only applies when the bucket is reached through its website endpoint (a custom domain via a load balancer, or a `c.storage.googleapis.com` CNAME), not through `storage.googleapis.com/<bucket>/…` links.
- Files under `/_astro/` have content hashes in their names, so they can be cached for a long time (`Cache-Control: public, max-age=31536000, immutable`); HTML is `no-cache` so updates show up at once (a CDN in front can still hold an hour-old copy from before that header was set).
- A bucket can't redirect old URLs (e.g. a live `/portal`); that needs the load balancer's URL map or a small stub page.

## Testing

One-time setup: `npm install && npx playwright install chromium`. Node 22.12+.

- `npm run dev`: dev server with live reload at http://localhost:4321. Restart it after changing `src/content.config.ts` (it is only read at startup; until then the blog shows no posts).
- `npm run build`: builds the site into `dist/`. `npm run preview` serves the build.
- `npm run check`: type-checks the `.astro` and `.ts` files.

Both test suites run against `dist/`, so build first (`npm test` does it for you):

- `npm run test:static`: under a second, no browser. Broken or wrong-case file paths (they 404 on Linux hosts), file naming in `public/`, every page loading only bundled scripts, no inline JavaScript, `data-*` hooks pointing at real elements, footer/modal CSS living only in `components.css`, `aria-current="page"` on exactly the nav links to that page, and balanced CSS comments.
- `npm run test:browser`: about a minute, headless Chromium. On every page: no script errors or broken files, nav dropdown, mobile menu, contact modal (open, close, Escape, backdrop) and its form, footer layout, and no sideways scroll on phones. Every form: blocked when invalid (including spaces-only input), the exact email message sent, its confirmation shown; a failed send keeps the input and outlines the submit button red until a retry succeeds; honeypots send nothing. Plus the carousels and hero video.
- `npm test` runs `check`, `build`, then both suites.

For CSS refactors that must not change the look: `npm run snapshot:save` on the built site before, `npm run snapshot:compare` after (about 35 s; pass page paths to limit it, e.g. `npm run snapshot:compare -- /about/`). It records every element's computed style and box on every page at 1440/1024/768/390, dark and light, plus the open nav dropdown, contact modal and mobile menu, and fails on any difference. It also lists every CSS rule added or removed (Astro's scoping stripped), which is how `:hover` rules and media queries between those widths are reviewed. Snapshots live in `.style-snapshot/` (git-ignored).

## JavaScript

All in `src/scripts/`. Pages load them with `<script>import '../scripts/<name>';</script>`; Astro bundles them into hashed files under `/_astro/`. `site.ts` also exposes everything on `window.SB` (`SB.api`, `SB.forms`, `SB.modal`, `SB.config`) for page scripts and tests.

| File | Loaded by | What it does |
|---|---|---|
| `api.ts` | every page (via `site.ts`) | **The one place form data leaves the page.** Turns each submission into an email request and POSTs it to the ScoreBreak API in `SB.api.send`. |
| `site.ts` | every page (`Layout.astro`) | Nav dropdowns, mobile menu, modals, and form handling, driven by `data-*` attributes (documented at the top of the file). |
| `carousel.ts` | `index`, `lacrosse` | Testimonial carousels (`[data-carousel]`). |
| `hero-video.ts` | `index` | Homepage hero video speed, fade and end card. |
| `waitlist.ts` | `football` | Waitlist validation and the referral-link confirmation overlay. |

Every form has `data-form="<name>"`. On submit, `SB.api.send` POSTs one JSON object to `<API_HOST>/api/marketing_site/mails` (no login, CORS open):

```js
{
  type: 'general',                      // inbox: general → ben@, support → support@, test → radek@
  title: 'Demo request: Test Academy',  // email subject, at most 200 characters
  body: 'First Name: Test\nLast Name: User\n…\n\nSent from: https://…/demo/',  // plain text, at most 10000 characters
  email: 'test@example.com',            // the submitter's email, sent as Reply-To
  token: '…'                            // Cloudflare Turnstile token, see Bot protection
}
```

The body has one `Label: value` line per field, using the labels visitors see (and an option's text, not its code); messages go on their own lines and empty optional fields show `—`. Types and titles are set per form in the `MAIL` table in `src/scripts/api.ts`, and `npm run test:static` fails if a form has no entry there. Inputs are capped at 100 characters and textareas at 8000 (`maxlength`, also checked by `test:static`), and `api.ts` still clips the title and body to the API's limits.

Where it goes, per build:

| Build | API host | Inbox |
|---|---|---|
| `npm run dev` | `https://staging-api2.scorebreak.io` | `test` (radek@) for every form; each request and response is logged to the console |
| `npm run deploy:staging` | `https://staging-api2.scorebreak.io` | per form, below |
| `npm run build` (production) | `https://api2.scorebreak.io` | per form, below |

`PUBLIC_API_HOST=… npm run build` overrides the host. A failed send keeps the form filled, outlines the submit button red and shows a short reason under it: too many requests (429), verification failed (422 token), invalid email (422 email), check your details (other 422), or "Something went wrong. Please try again later." for anything else.

| Form | `data-form` | Type | Title | Fields |
|---|---|---|---|---|
| Contact modal ("Get in Touch", every page) | `contact-sales` | `general` | Contact request: *first last* | `firstName`, `lastName`, `email`, `message` |
| SOC 2 request modal (`/resources/`) | `soc2-request` | `general` | SOC 2 report request: *email* | `email` |
| Demo request (`/demo/`) | `demo-request` | `general` | Demo request: *organization* | `firstName`, `lastName`, `email`, `phone`, `organization`, `sport`, `role`, `message` |
| Support form (`/support/`) | `support-request` | `support` | Support request: *name* | `name`, `email`, `message` |
| Gridiron waitlist (`/football/`) | `waitlist` | `general` | Gridiron waitlist: *first last, school* | `first_name`, `last_name`, `email`, `school`, `position` |

## Bot protection

Two layers on every form:

- **Honeypot**: a hidden `bot-field` input (off-screen, skipped by Tab, ignored by autofill). If it's filled, the visitor sees the normal success message and nothing is sent.
- **Cloudflare Turnstile**: `site.ts` loads Cloudflare's script the first time someone uses a form, runs an invisible check on submit, and adds the resulting token to the message. Visitors only see a "Verify you are human" box if Cloudflare asks for interaction.

Setup:

1. The Turnstile widget in the Cloudflare dashboard lists every hostname the site runs on: production, staging (with and without `www`) and `localhost`. A new hostname has to be added there, or the check fails before anything is sent.
2. Its **site key** is `config.turnstileSiteKey` in `src/scripts/api.ts` (`0x4AAAAAAFsh1-4bXRbaMMU5`), the same in every build.
3. The **secret key** lives only on the API (`TURNSTILE_SECRET_KEY`), which verifies every `token` with Cloudflare's Siteverify before sending. If it's missing or wrong, every send fails with 500 "Captcha verification failed" and the Cloudflare dashboard warns that Siteverify isn't being called. Tokens are single-use and expire after 5 minutes; the site gets a fresh one on every send.

Turnstile is a third-party script from `challenges.cloudflare.com`, which may need a mention in the privacy policy.

## Pages

Source files are `src/pages/<name>.astro`; each builds `<name>/index.html`, served at `/<name>/`.

| File | Page |
|---|---|
| `/` | Homepage (hero demo video with end card) |
| `/lacrosse/`, `/basketball/` | Sport pages |
| `/football/` | ScoreBreak Gridiron (football, coming soon / early access). Hidden for now: see below |
| `/other-sports/` | Soccer, ice hockey, field hockey, and other sports |
| `/solutions/` | All solutions overview |
| `/software/` | Team Software |
| `/airborne/` | Airborne sideline replay (Airborne R portable, Airborne Stadium installed) |
| `/recruiting-network/` | Recruiting Network (formerly `portal.html`) |
| `/leagues/` | League solutions |
| `/about/`, `/demo/`, `/support/`, `/resources/` | Company, demo request, support, documents |
| `/blog/` | Blog index and 7 posts (posts are in `src/content/blog/`) |
| `/404.html` | Not-found page; the bucket serves it for any unknown URL |

## Brand

- The current page is marked with `aria-current="page"` on its nav links (desktop and mobile); `components.css` highlights it in blue.

- Dark mode only.
- Navy background `#0A0E1A` (`var(--bg)`), blue accent `#56C7FF` (`var(--blue)`), white text.
- Font: the system font stack (`var(--font)` in `styles.css`: San Francisco on Apple devices, Segoe UI on Windows). Lexend Exa was the intended display font but isn't loaded anywhere yet.
- Section labels are plain uppercase blue text (`.section-label`), not pills. Pill badges are kept only for statuses like "Coming Soon" and "Most Popular."

## To do

**Football.** `football: false` in `src/data/features.ts` hides every Football/Gridiron link (nav dropdown, Gridiron pill, mobile menu, footer) and the homepage card (the sports grid drops to two columns), and built sites turn `/football/` into an instant redirect to `/`. `npm run dev` still shows the page. The football page and waitlist browser tests are skipped while it's off. Set it to `true` to launch. The Gridiron waitlist sends to ben@ for now; its confirmation shows a referral link (`scorebreakgridiron.com/ref/<code>`) whose code is random and isn't stored anywhere.

**Forms API in production.** The mail endpoint is only on the staging API so far; production forms fail until it reaches `api2.scorebreak.io`.

**Redirects.** `portal.html` was renamed to `/recruiting-network/`. If the current live ScoreBreak site has a /portal URL, please redirect it to the new page.

**Known issues**
- The football page doesn't load the shared `styles.css` (it was removed to resolve CSS conflicts with football's own styles). It uses the same nav, footer and modals as every other page via `Layout.astro` and `components.css`; its own colour variables that differ from the site's are prefixed `--gridiron-`. `npm test` checks it at desktop and phone widths. Keep this in mind when changing shared styles.
- `AUDIT.md` and `AI-TELLS-AUDIT.md` list the findings still open (re-checked against the Astro site on 2026-11-02), each tagged code or copy/design, plus what has been fixed.

**File names.** Files and folders in `public/` use lowercase-hyphenated names (no spaces, capitals, or characters like `'`, `+`, `( )`) so paths behave the same on every host; `npm run test:static` enforces this. Keep the same convention in `src/assets/`.

## Notes on content

- Copy has been carefully edited. Please check with Ben before changing any wording.
- Screenshots such as `software/reports-screenshot-edited.png` use made-up player names on purpose. Don't replace them with screenshots containing real player data.
- The Josh Arruda testimonial on the basketball page mentions HUDL Sportscode. That is intentional. Competitors are not named anywhere else on the site.

## Repo

Work from `main`. The repo will move from Ben's personal GitHub to ScoreBreak's GitHub. You're welcome to handle that move once you're set up; please add Ben as a collaborator on the new repo.
