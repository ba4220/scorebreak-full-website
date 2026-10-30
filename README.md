# ScoreBreak Website

Marketing site for ScoreBreak: film analysis software, Airborne sideline replay hardware, the Recruiting Network, and league solutions.

**Contact:** Ben Abraham, ben@scorebreak.io

## Overview

- Static HTML, CSS, and JavaScript. No framework or build step.
- Shared styles live in `styles.css`. Many pages also have page-specific styles in a `<style>` block in the page itself.
- The site was built and edited with Claude Code. Netlify was used for prototyping only. The site will not be hosted on Netlify.

## Pages

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
| `blog/` | Blog index and 7 posts |

## Brand

- Dark mode only.
- Navy background `#0A0E1A` (`var(--bg)`), blue accent `#56C7FF` (`var(--blue)`), white text.
- Font: the system font stack (`var(--font)` in `styles.css`: San Francisco on Apple devices, Segoe UI on Windows). Lexend Exa was the intended display font but isn't loaded anywhere yet.
- Section labels are plain uppercase blue text (`.section-label`), not pills. Pill badges are kept only for statuses like "Coming Soon" and "Most Popular."

## To do

**Forms.** All forms were built as Netlify forms and will not submit on our host. Please set each one up to email submissions, keeping the current designs:

| Form | Send to |
|---|---|
| Support form (`support.html`) | support@scorebreak.io |
| Demo request (`demo.html`) | ben@scorebreak.io |
| Contact modal ("Get in Touch", every page) | ben@scorebreak.io |
| SOC 2 request modal (`resources.html`) | ben@scorebreak.io |

**Redirects.** `portal.html` was renamed to `recruiting-network.html`. If the current live ScoreBreak site has a /portal URL, please redirect it to the new page.

**Known issues**
- Nav dropdown: `aria-expanded` doesn't toggle when the Solutions menu opens and closes.
- Open Graph image path (`Logos/logo-nav.png`) needs checking.
- `football.html` doesn't load the shared `styles.css` (it was removed to resolve CSS conflicts with football's own styles). The mobile menu styles it needs were added to the page itself, and the page has been checked at desktop and phone widths. Keep this in mind when changing shared styles.
- `AUDIT.md` and `AI-TELLS-AUDIT.md` list further findings. Many copy and design items in `AI-TELLS-AUDIT.md` have already been addressed.

**Optional cleanup.** Some file names contain spaces (e.g. `field hockey.jpg`), and images are split between the root and folders. Feel free to reorganize, but update all paths if you do.

## Notes on content

- Copy has been carefully edited. Please check with Ben before changing any wording.
- Screenshots such as `reports_screenshot_edited.png` use made-up player names on purpose. Don't replace them with screenshots containing real player data.
- The Josh Arruda testimonial on `basketball.html` mentions HUDL Sportscode. That is intentional. Competitors are not named anywhere else on the site.

## Repo

Work from `main`. The repo will move from Ben's personal GitHub to ScoreBreak's GitHub. You're welcome to handle that move once you're set up; please add Ben as a collaborator on the new repo.
