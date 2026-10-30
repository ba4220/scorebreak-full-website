# ScoreBreak Website

Marketing site for ScoreBreak: film analysis software, Airborne sideline replay hardware, the Recruiting Network, and league solutions.

**Contact:** Ben Abraham, ben@scorebreak.io

## Overview

- Built with [Astro](https://astro.build) and TypeScript into a fully static site: `npm run build` writes plain HTML, CSS, JS and assets to `dist/`, which any static host can serve. URLs keep their `.html` names (`about.html`, `blog/index.html`).
- Layout:
  - `src/pages/`: one `.astro` file per page. Each sets its `seo` (title, description, social tags; see `src/components/Seo.astro`) and wraps its content in `src/layouts/Layout.astro`, passing its page-specific `<style is:inline>` block in `slot="head"`.
  - `src/layouts/Layout.astro`: the shared `<head>`, nav, footer, contact modal and site script. Edit those once there and every page gets the change.
  - `src/components/`: `Nav` (sets `aria-current="page"` automatically), `Footer`, `ContactModal`, `Seo`, `Testimonial` / `TestimonialCarousel`, `CtaSection` (the closing "Contact Us" band).
  - `src/data/`: `testimonials.ts` (every coach quote, used by id on index, lacrosse, basketball and recruiting-network; edit a quote once) and `school-logos.ts` (homepage logo marquee).
  - `src/content/blog/`: one Markdown file per post (`title`, `description`, `date`, `author` frontmatter). `src/pages/blog/[slug].astro` publishes each as `blog/<slug>.html` through `src/layouts/BlogPost.astro`; the blog index and the Newer/Older links are generated, newest first. To add a post, add a Markdown file. Straight quotes stay straight (smart quotes are off).
  - `src/styles/`: `styles.css` (shared styles) and `components.css` (what `football.html` also needs: design tokens, nav, footer, modals and modal forms). `football.astro` passes `sharedStyles={false}` to skip `styles.css`.
  - `src/scripts/`: TypeScript, bundled by Astro. See [JavaScript](#javascript).
  - `public/`: images, video, PDFs and the favicon, copied to the site root as-is.
- Pages contain no inline scripts or `onclick`-style handlers (enforced by `npm run test:static`).
- Netlify was used for prototyping only; the site will not be hosted on Netlify. The Netlify GitHub app still builds deploy previews for PRs, configured in `netlify.toml`.

## Testing

One-time setup: `npm install && npx playwright install chromium`. Node 22.12+.

- `npm run dev`: dev server with live reload at http://localhost:4321.
- `npm run build`: builds the site into `dist/`. `npm run preview` serves the build.
- `npm run check`: type-checks the `.astro` and `.ts` files.

Both test suites run against `dist/`, so build first (`npm test` does it for you):

- `npm run test:static`: under a second, no browser. Broken or wrong-case file paths (they 404 on Linux hosts), file naming in `public/`, every page loading only bundled scripts, no inline JavaScript, `data-*` hooks pointing at real elements, footer/modal CSS living only in `components.css`, `aria-current="page"` on exactly the nav links to that page, and balanced CSS comments.
- `npm run test:browser`: about a minute, headless Chromium. On every page: no script errors or broken files, nav dropdown, mobile menu, contact modal (open, close, Escape, backdrop) and its form, footer layout, and no sideways scroll on phones. Every form: blocked when invalid (including spaces-only input), the exact email message sent, its confirmation shown; a failed send keeps the input and outlines the submit button red until a retry succeeds; honeypots send nothing. Plus the carousels and hero video.
- `npm test` runs `check`, `build`, then both suites.

## JavaScript

All in `src/scripts/`. Pages load them with `<script>import '../scripts/<name>';</script>`; Astro bundles them into hashed files under `/_astro/`. `site.ts` also exposes everything on `window.SB` (`SB.api`, `SB.forms`, `SB.modal`, `SB.config`) for page scripts and tests.

| File | Loaded by | What it does |
|---|---|---|
| `api.ts` | every page (via `site.ts`) | **The one place form data leaves the page.** Turns each submission into a ready-to-send email and hands it to `SB.api.send`, currently a fake that logs and resolves; wire the real API there. |
| `site.ts` | every page (`Layout.astro`) | Nav dropdowns, mobile menu, modals, and form handling, driven by `data-*` attributes (documented at the top of the file). |
| `carousel.ts` | `index`, `lacrosse` | Testimonial carousels (`[data-carousel]`). |
| `hero-video.ts` | `index` | Homepage hero video speed, fade and end card. |
| `waitlist.ts` | `football` | Waitlist validation and the referral-link confirmation overlay. |

Every form has `data-form="<name>"`. On submit, the API receives one JSON-ready object:

```js
{
  form: 'demo-request',                 // which form
  category: 'sales',                    // which ScoreBreak inbox it lands in
  title: 'Demo request: Test Academy',  // email subject
  replyTo: 'test@example.com',          // the submitter's email
  body: 'First Name: Test\nLast Name: User\n…\n\nSent from: https://…/demo.html',  // plain-text email body
  fields: { firstName: 'Test', … },     // raw values, keyed by input name
  turnstileToken: '…'                   // Cloudflare Turnstile token, see Bot protection
}
```

The body has one `Label: value` line per field, using the labels visitors see (and an option's text, not its code); messages go on their own lines and empty optional fields show `—`. Categories and titles are set per form in the `MAIL` table in `src/scripts/api.ts`, and `npm run test:static` fails if a form has no entry there.

| Form | `data-form` | Category | Title | Fields |
|---|---|---|---|---|
| Contact modal ("Get in Touch", every page) | `contact-sales` | `sales` | Contact request: *first last* | `firstName`, `lastName`, `email`, `message` |
| SOC 2 request modal (`resources.html`) | `soc2-request` | `sales` | SOC 2 report request: *email* | `email` |
| Demo request (`demo.html`) | `demo-request` | `sales` | Demo request: *organization* | `firstName`, `lastName`, `email`, `phone`, `organization`, `sport`, `role`, `message` |
| Support form (`support.html`) | `support-request` | `support` | Support request: *name* | `name`, `email`, `message` |
| Gridiron waitlist (`football.html`) | `waitlist` | `gridiron-waitlist` | Gridiron waitlist: *first last, school* | `first_name`, `last_name`, `email`, `school`, `position` |

## Bot protection

Two layers on every form:

- **Honeypot**: a hidden `bot-field` input (off-screen, skipped by Tab, ignored by autofill). If it's filled, the visitor sees the normal success message and nothing is sent.
- **Cloudflare Turnstile**: `site.ts` loads Cloudflare's script the first time someone uses a form, runs an invisible check on submit, and adds the resulting token to the message. Visitors only see a "Verify you are human" box if Cloudflare asks for interaction.

Setup when wiring the real API:

1. Create a Turnstile widget in the Cloudflare dashboard (free, no Cloudflare hosting needed) with the site's hostnames, including any test bucket's domain.
2. Its **site key** is set in `config.turnstileSiteKey` in `src/scripts/api.ts` (`0x4AAAAAAFsh1-4bXRbaMMU5`). On `localhost`/`127.0.0.1` the site switches to Cloudflare's always-passing test key automatically, because the real key only works on the hostnames registered for the widget. A test deploy on any other hostname needs that hostname added to the widget (or its own widget).
3. Keep the **secret key** on the API only. For every message, the API must verify `turnstileToken` with Cloudflare's Siteverify endpoint (and check the returned hostname) before sending any email. Without this server-side check, Turnstile gives no protection. Tokens are single-use and expire after 5 minutes; the site gets a fresh one on every send.

Turnstile is a third-party script from `challenges.cloudflare.com`, which may need a mention in the privacy policy.

## Pages

Source files are `src/pages/<name>.astro`; each builds `<name>.html`.

| File | Page |
|---|---|
| `index.html` | Homepage (hero demo video with end card) |
| `lacrosse.html`, `basketball.html` | Sport pages |
| `football.html` | ScoreBreak Gridiron (football, coming soon / early access) |
| `other-sports.html` | Soccer, ice hockey, field hockey, and other sports |
| `solutions.html` | All solutions overview |
| `software.html` | Team Software |
| `airborne.html` | Airborne sideline replay (Airborne R portable, Airborne Stadium installed) |
| `recruiting-network.html` | Recruiting Network (formerly `portal.html`) |
| `leagues.html` | League solutions |
| `about.html`, `demo.html`, `support.html`, `resources.html` | Company, demo request, support, documents |
| `blog/` | Blog index and 7 posts (posts are in `src/content/blog/`) |

## Brand

- The current page is marked with `aria-current="page"` on its nav links (desktop and mobile); `components.css` highlights it in blue.

- Dark mode only.
- Navy background `#0A0E1A` (`var(--bg)`), blue accent `#56C7FF` (`var(--blue)`), white text.
- Font: the system font stack (`var(--font)` in `styles.css`: San Francisco on Apple devices, Segoe UI on Windows). Lexend Exa was the intended display font but isn't loaded anywhere yet.
- Section labels are plain uppercase blue text (`.section-label`), not pills. Pill badges are kept only for statuses like "Coming Soon" and "Most Popular."

## To do

**Forms.** Every form builds its email in `src/scripts/api.ts` and hands it to `SB.api.send`, which is currently a fake (nothing is sent). Wire it to the real API, which maps each category to an inbox:

| Form | Send to |
|---|---|
| Support form (`support.html`) | support@scorebreak.io |
| Demo request (`demo.html`) | ben@scorebreak.io |
| Contact modal ("Get in Touch", every page) | ben@scorebreak.io |
| SOC 2 request modal (`resources.html`) | ben@scorebreak.io |
| Gridiron waitlist (`football.html`) | Not decided yet. Its confirmation shows a referral link (`scorebreakgridiron.com/ref/<code>`) whose code is random and isn't stored anywhere. |

**Redirects.** `portal.html` was renamed to `recruiting-network.html`. If the current live ScoreBreak site has a /portal URL, please redirect it to the new page.

**Known issues**
- Open Graph image path (`logos/logo-nav.png`) needs checking.
- `football.html` doesn't load the shared `styles.css` (it was removed to resolve CSS conflicts with football's own styles). It uses the same nav, footer and modals as every other page via `Layout.astro` and `components.css`; its own colour variables that differ from the site's are prefixed `--gridiron-`. `npm test` checks it at desktop and phone widths. Keep this in mind when changing shared styles.
- `AUDIT.md` and `AI-TELLS-AUDIT.md` list further findings. Many copy and design items in `AI-TELLS-AUDIT.md` have already been addressed.

**File names.** Asset files and folders in `public/` use lowercase-hyphenated names (no spaces, capitals, or characters like `'`, `+`, `( )`) so paths behave the same on every host; `npm run test:static` enforces this. Images are still split between the `public/` root and folders. Feel free to reorganize, but update all paths if you do.

## Notes on content

- Copy has been carefully edited. Please check with Ben before changing any wording.
- Screenshots such as `software/reports-screenshot-edited.png` use made-up player names on purpose. Don't replace them with screenshots containing real player data.
- The Josh Arruda testimonial on `basketball.html` mentions HUDL Sportscode. That is intentional. Competitors are not named anywhere else on the site.

## Repo

Work from `main`. The repo will move from Ben's personal GitHub to ScoreBreak's GitHub. You're welcome to handle that move once you're set up; please add Ben as a collaborator on the new repo.
