# The Hillside Retreat (thehillside.com.au)

Static Astro site for a two-dwelling holiday accommodation business on Tamborine Mountain, QLD. Hillside House sleeps 6 across 3 bedrooms, Hillside Villa sleeps 2, and the two combine for groups of up to 8.

## Stack

- Astro with static output, no client JS frameworks.
- Content is markdown in `src/content/pages/` (collection `pages`, schemas in `src/content.config.ts`). `src/pages/[...slug].astro` renders each entry; entries with `dwelling:` frontmatter render through `src/components/DwellingLayout.astro` (hero, facts strip, amenity chips, Accommodation JSON-LD). All three dwelling pages (House, Villa, House & Villa) use it.
- Build-time rehype plugins in `src/lib/` (wired in `astro.config.mjs` alongside `remark-deflist`): `rehype-photo-runs.mjs` turns consecutive image paragraphs into photo runs, text+image pairs into alternating media rows, and h2+image+link blocks into cross-sell cards (fact wording from `dwelling-facts.mjs`, icons from `fact-icon-paths.mjs`); `rehype-faq-page.mjs` groups the FAQ into Q&A sections; `rehype-policy-page.mjs` lays out guest info as policy cards. Shared HAST helpers live in `hast-utils.mjs`. All photos open in the shared `<dialog>` viewer, `src/components/LightboxViewer.astro`, with prev/next.
- The homepage is `src/pages/index.astro`, composed from `src/components/` (Hero, Arrival, DwellingCards, ReviewBand, PhotoBand, PullQuote, Closing; FactsLine/FactIcon render the sleeps/bedrooms/bathrooms facts line, wording shared via `src/lib/dwelling-facts.mjs`) with copy from `src/content/pages/index.md` frontmatter.
- Standalone routes in `src/pages/`: `book.astro` (SiteMinder embed), `gallery.astro` and `reviews.astro` (driven by `src/content/gallery.yaml`, `reviews.yaml` and `review-sources.yaml`), `404.astro`.
- `src/layouts/Base.astro` carries the nav (dropdowns grouped Accommodation / Your Stay; hamburger menu on mobile), footer, `LodgingBusiness` JSON-LD with the full business details, the booking URL constant, and Umami analytics (booking CTAs carry `data-umami-event="booking-click"`). New pages must be added to a nav group.
- Styles are plain CSS with custom properties (brand palette tokens) in `src/styles/global.css`; body font is Fraunces via `@fontsource-variable/fraunces`.
- Images live in `src/assets/images/<category>/` (`house`, `villa`, `external`, `drone`, `amenities`, `location`; emblem and hero poster at root), named `<descriptive-name>.<ext>` and pre-resized to 2000px or less. They go through Astro's asset pipeline (schemas use `image()`, components use `<Image>`; sharp runs at build time via `imageService: 'compile'` in the Cloudflare adapter). `public/` holds the favicons (regenerate with `scripts/make-icons.mjs`), `robots.txt` and `_headers` (security headers, staging and dev noindex). The hero drone video (720p and 1080p, AV1 and H.264) is in the `hillside-media` R2 bucket, served from `https://media.thehillside.com.au/videos/`. Upload replacements with `wrangler r2 object put hillside-media/videos/<file> --file <path> --content-type video/mp4 --remote`.

## Development

- Dev server: run in background mode with `astro dev --background`; manage with `astro dev stop|status|logs`.
- `npm run build` runs `astro check` then a static build to `dist/`; it validates content schema and types. Treat any `astro check` output as a defect.
- `npm run preview` builds then serves via `wrangler dev`.
- `npm test` runs Playwright tests in `tests/`.

## Hosting

- Cloudflare Workers, GitHub-connected; deploys build from `main`.
- Staging: https://the-hillside.github-e53.workers.dev/
- Dev worker: https://the-hillside-dev.github-e53.workers.dev/ — deployed by `.github/workflows/deploy-dev.yml` on every push to `dev`; the workflow comments the preview URL on the merged PR.
- `.github/workflows/claude.yml` runs Claude on `@claude` mentions; its triage job posts a plan comment on `client-request` issues and waits for an `@claude` go before implementing.

## Business facts (public information)

- Address: 25 Leona Court, Tamborine Mountain QLD 4272
- Phone: (+61) 0466 990 185. Email: stay@thehillside.com.au
- Booking engine widget renders only on SiteMinder-whitelisted domains (thehillside.com.au and the Workers staging URL are whitelisted).
- House and Villa combined bookings are direct only (email or phone), not via the booking engine.

## Editing rules

- Content edits go in `src/content/pages/*.md` and `src/content/{gallery,reviews}.yaml` only. Guest-facing copy follows the `.claude/skills/hillside-voice` profile; owner-supplied wording is raw material to polish into that voice (fix grammar, trim repetition), not text to reproduce verbatim.
- Dwelling facts (sleeps, bedrooms, bathrooms, amenities) live in `dwelling:` frontmatter on the dwelling pages, where they drive the facts strip and Accommodation JSON-LD. Update facts there, not in prose, because prose should not restate these numbers.
- Every image needs meaningful alt text. The gallery schema enforces this.
- Legacy Squarespace paths `/home` and `/further-inform` redirect via `astro.config.mjs`. Keep them.
- Comments must stand alone: a comment states a constraint or non-obvious why in present terms, understandable from the current file only. No references to prior versions or rejected alternatives ("now uses X", "instead of Y"), and no restating what the adjacent code already says. Fix a bad comment by rewriting it, not blank-deleting, when it carries a real why.

## Working from GitHub issues

- Commit messages: subject is imperative, capitalised, no prefixes (no `feat:`/`fix:`), no trailing period, ~50 chars; name the concrete change ("Soften hero scrim"), compound with commas if needed. Single-change commits stop there — no body. When a commit bundles several distinct changes, add a body of dash bullets, one per change: capitalised terse fragments, no trailing periods, naming the component or file involved, with a why only when non-obvious ("overflow-x: clip guards against Chromium snapshot overflow"). Typically 3–5 bullets; the subject summarises, the bullets itemise.
- Branch from `dev`; never push to `main` or `dev` directly. After pushing the branch, open a PR yourself with `gh pr create` (base `dev`, short title matching the commit style, body summarising the change and linking the issue). Merging to `dev` deploys the dev worker for remote review; promotion to `main` is the owner's call.
- Run `npm run build` before pushing — `astro check` output is a defect and must be clean.
- Issue comments: brief and plain. Lead with what changed or what you found; no headers or boilerplate for small answers.

## Documentation

- `docs/siteminder-widget.md` — booking widget parameters (room_rate preselect, currency), rate IDs, and how to re-inspect the SiteMinder embed. Read before touching `/book/` or booking CTAs.

Astro docs: https://docs.astro.build (routing, content collections, styling).
