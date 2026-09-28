# The Hillside Retreat (thehillside.com.au)

Static site for a two-dwelling holiday accommodation business on Tamborine Mountain, QLD. Built with Astro, deployed on Cloudflare Workers, and maintained through an AI-assisted editing workflow where a human approves every change.

## Stack

- **Astro**: static output. Pages render from markdown at build time and no client-side JS frameworks ship.
- **Content**: markdown in `src/content/pages/`, a content collection whose frontmatter is schema-validated by `src/content.config.ts`. The homepage is composed from components in `src/components/` with copy from `index.md` frontmatter.
- **Layout**: a single base layout carries the nav (dropdowns grouped Accommodation / Your Stay), footer, and `LodgingBusiness` JSON-LD for search engines and AI answer engines.
- **Styles**: plain CSS with custom properties (brand palette tokens); Fraunces variable font.
- **Images**: sources in `src/assets/images/`, processed by Astro's asset pipeline with sharp at build time.
- **Hosting**: Cloudflare Workers (GitHub-connected), which runs `npm run build` and serves `dist/`. Staging: https://the-hillside.github-e53.workers.dev/ — dev worker https://the-hillside-dev.github-e53.workers.dev/ deploys on every push to `dev` via GitHub Actions.
- **Analytics**: Umami, loaded from the base layout; booking CTAs fire a `booking-click` event.
- **Tests**: Playwright in `tests/`, run against the production build and on every PR to `dev` and `main`.
- **Booking**: SiteMinder/Little Hotelier booking widget on `/book/`; renders only on SiteMinder-whitelisted domains (production domain and Workers staging URL are whitelisted).

## Structure

```
src/
  assets/images/     Image sources by category: house, villa, external, drone, amenities, location
  components/        Homepage sections (Hero, Arrival, DwellingCards, …), DwellingLayout, FactsLine, LightboxViewer
  content/
    pages/           Page content as markdown; index.md holds homepage copy
    gallery.yaml     Gallery images with alt text
    reviews.yaml     Guest reviews
    review-sources.yaml  Review platform rating badges
  layouts/           Base.astro — nav, footer, JSON-LD
  lib/               Rehype plugins (photo runs, FAQ, policy pages), dwelling-facts wording, shared helpers
  pages/             Routes: index.astro, [...slug].astro, book, gallery, reviews, 404
  styles/            global.css with brand palette tokens
  content.config.ts  Content schemas
public/              Favicons, robots.txt, _redirects, _headers (asset caching, security headers, staging and dev noindex)
scripts/             make-icons.mjs — regenerates favicons from the emblem
tests/               Playwright specs
.github/workflows/   claude.yml (agent on @claude mentions, client-request triage), deploy-dev.yml, test.yml, mirror.yml, notify-client.yml
```

## Why this architecture

The previous site was on Squarespace, on a subscription tier without code injection, which meant no structured data and every edit went through the dashboard.

This setup replaces the subscription with hosting that costs nothing on Cloudflare's free tier, JSON-LD emitted by the layout with no plan upgrade needed, and git as the content database. Every change is a reviewable, revertable commit, and the owner's wording lives in version control instead of CMS state.

## AI-assisted editing workflow

An AI coding agent maintains the content under human control. Four rules make that safe:

1. **Approval**: git is the gate. The agent proposes changes as commits and PRs, a human reviews and merges, and the deploy pipeline builds only from `main`.
2. **Provenance**: AI-assisted commits carry a `Co-Authored-By` trailer.
3. **Instructions**: the agent follows checked-in rules. `CLAUDE.md` defines them (`AGENTS.md` is a symlink to it) and is versioned.
4. **Validation**: `npm run build` validates all content frontmatter.

The pipeline: the non-technical owner emails a change request → GitHub issue → the triage job posts a plan and waits for an `@claude` go → agent drafts a PR → human approves and merges to `dev` → the dev worker deploys for remote review → promotion to `main` deploys production. Each arrow is an explicit gate.

## Development

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | `astro check` + static build to `dist/`, validates content schema |
| `npm run preview` | Build, then serve the production build via `wrangler dev` |
| `npm test` | Build, serve via `wrangler dev` on port 8787, run Playwright tests |

## Content editing

- Content lives in `src/content/pages/*.md`; files map to routes by filename. Homepage copy is frontmatter in `index.md`.
- Images go in `src/assets/images/<category>/` (`house`, `villa`, `external`, `drone`, `amenities`, `location`), named `<descriptive-name>.<ext>` and pre-resized to 2000px or less. The hero video is served from the `hillside-media` R2 bucket at `media.thehillside.com.au`, which answers the byte-range requests iOS Safari needs.
- Dwelling pages (House, Villa, House & Villa) carry `dwelling:` frontmatter — name, hero, sleeps, bedrooms, bathrooms, amenities, optional `cta` — which drives the facts strip and Accommodation JSON-LD.
- Legacy Squarespace paths (`/home`, `/further-inform`) redirect via `public/_redirects`.
