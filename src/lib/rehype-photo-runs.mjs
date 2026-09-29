// Build-time structure for markdown pages (media rows style on any page;
// the other wrappers style only inside dwelling pages and are inert
// elsewhere — see global.css):
//  - runs of 2+ consecutive image-only paragraphs -> <div class="photo-run">
//  - a solitary image paragraph after a text paragraph -> <div class="media-row">
//    holding both, alternating sides via the media-row-flip class
//  - on dwelling pages only, an h2 + optional image + link-bearing paragraph
//    + optional link-only CTA paragraph -> cross-sell card with a facts line
//    when the link targets a dwelling; consecutive cards group into
//    <div class="cross-sell-row">
//  - remaining link-only paragraphs -> button-styled links
//  - every other photo -> button.lightbox-open feeding the site-wide
//    <dialog> viewer (LightboxViewer.astro)

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import {
  isElement,
  isWhitespace,
  textOf,
  el,
  text,
  soleChild,
  factIcon,
} from "./hast-utils.mjs";
import { factLabels } from "./dwelling-facts.mjs";

const isImageParagraph = (node) => isElement(node, "p") && !!soleChild(node, "img");

const isTextParagraph = (node) =>
  isElement(node, "p") && !isImageParagraph(node) && textOf(node).trim().length > 0;

const hasLink = (node) =>
  isElement(node, "a") || (node.children ?? []).some((c) => c.type === "element" && hasLink(c));

const div = (className, children) => el("div", { className: [className] }, children);

// A paragraph that is only a link: the card's call-to-action, styled as a
// button.
const isCtaParagraph = (node) => !!node && isElement(node, "p") && !!soleChild(node, "a");

const firstHref = (node) => {
  if (isElement(node, "a")) return node.properties?.href;
  for (const c of node.children ?? []) {
    const href = c.type === "element" && firstHref(c);
    if (href) return href;
  }
  return null;
};

// Sleeps/bedrooms/bathrooms for the page a link targets, read from that
// page's dwelling frontmatter so the numbers stay single-sourced. Null when
// the target is not a dwelling page. Cached per process: in dev, frontmatter
// fact edits need a server restart to show in cross-sell cards.
const factsCache = new Map();
const factsFor = (href) => {
  const slug = new URL(href, "http://x").pathname.replaceAll("/", "");
  if (factsCache.has(slug)) return factsCache.get(slug);
  const file = path.join(process.cwd(), "src/content/pages", `${slug}.md`);
  // Anchored to the leading delimiter so a --- inside the body or a
  // frontmatter string can't truncate the parse.
  const frontmatter = existsSync(file) && readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const d = frontmatter && parse(frontmatter[1]).dwelling;
  const facts = d ? { sleeps: d.sleeps, bedrooms: d.bedrooms.length, bathrooms: d.bathrooms } : null;
  factsCache.set(slug, facts);
  return facts;
};

const factsLine = (facts) =>
  el(
    "p",
    { className: ["facts-line"] },
    factLabels(facts).map(([icon, label]) =>
      el("span", {}, [factIcon(icon), text(` ${label}`)]),
    ),
  );

export default function rehypePhotoRuns() {
  return (tree, file) => {
    const isDwelling = !!file.data.astro?.frontmatter?.dwelling;
    const walk = (parent) => {
      if (!parent.children) return;
      // Whitespace between block elements is insignificant; dropping it
      // makes adjacency checks reliable.
      const nodes = parent.children.filter((c) => !isWhitespace(c));
      nodes.forEach(walk);

      // Group consecutive image paragraphs into photo runs.
      const grouped = [];
      let run = [];
      const flushRun = () => {
        if (run.length >= 2) grouped.push(div("photo-run", run));
        else grouped.push(...run);
        run = [];
      };
      for (const node of nodes) {
        if (isImageParagraph(node)) run.push(node);
        else {
          flushRun();
          grouped.push(node);
        }
      }
      flushRun();

      // Pair a remaining solitary image with the text paragraph
      // before it, alternating sides.
      const paired = [];
      let flip = false;
      for (const node of grouped) {
        const prev = paired[paired.length - 1];
        if (isImageParagraph(node) && prev && isTextParagraph(prev)) {
          paired.pop();
          const row = el(
            "div",
            { className: flip ? ["media-row", "media-row-flip"] : ["media-row"] },
            [prev, node],
          );
          paired.push(row);
          flip = !flip;
        } else {
          paired.push(node);
        }
      }

      // h2 + optional image paragraph + link-bearing paragraph +
      // optional link-only CTA paragraph -> cross-sell card, rebuilt as a
      // horizontal photo-beside-text row (the homepage combined-card
      // treatment); consecutive cards stack into one band.
      const carded = [];
      for (let i = 0; i < paired.length; i++) {
        const node = paired[i];
        const image = paired[i + 1] && isImageParagraph(paired[i + 1]) ? paired[i + 1] : null;
        let j = i + (image ? 2 : 1);
        const next = paired[j];
        const cta = isCtaParagraph(paired[j + 1]) ? paired[j + 1] : null;
        if (cta) j++;
        const after = paired[j + 1];
        if (
          isDwelling &&
          isElement(node, "h2") &&
          next &&
          isTextParagraph(next) &&
          (cta || hasLink(next)) &&
          (!after || !isTextParagraph(after))
        ) {
          // The combined House & Villa stay books by enquiry only, so its
          // card renders demoted (smaller, outline CTA) wherever it appears.
          const dest = firstHref(cta ?? next);
          const secondary = dest === "/house-and-villa/";
          // The photo and heading link to the card's page, styled like the
          // homepage dwelling cards (card-photo brighten, title underline).
          if (image) {
            const img = soleChild(image, "img");
            image.children = [
              el(
                "a",
                { href: dest, className: ["card-photo"], ariaLabel: textOf(node).trim() },
                [img],
              ),
            ];
          }
          node.children = [
            el("a", { href: dest, className: ["card-title", "slide-underline"] }, node.children),
          ];
          const body = [node, next];
          if (cta) {
            cta.properties = { ...cta.properties, className: ["cross-sell-cta"] };
            const a = soleChild(cta, "a");
            a.properties = {
              ...a.properties,
              className: secondary ? ["btn", "btn-outline"] : ["btn"],
            };
            const facts = factsFor(firstHref(cta));
            if (facts) body.splice(1, 0, factsLine(facts));
            body.push(cta);
          }
          const children = [image, div("cross-sell-body", body)].filter(Boolean);
          const card = div("cross-sell-card", children);
          if (secondary) card.properties.className.push("cross-sell-secondary");
          const prev = carded[carded.length - 1];
          if (prev && prev.type === "element" && prev.properties?.className?.[0] === "cross-sell-row") {
            prev.children.push(card);
          } else {
            const row = el("div", { className: ["cross-sell-row", "full-bleed", "full-bleed-pad"] }, [card]);
            // An h2 directly before the first card is the section's
            // header; pull it into the band spanning the full row.
            const before = carded[carded.length - 1];
            if (before && isElement(before, "h2")) {
              carded.pop();
              before.properties = { ...before.properties, className: ["cross-sell-heading"] };
              row.children.unshift(before);
            }
            carded.push(row);
          }
          i = j;
        } else {
          carded.push(node);
        }
      }

      // Link-only paragraphs not absorbed into a cross-sell card (e.g.
      // "Book with us") render as buttons.
      for (const node of carded) {
        if (isCtaParagraph(node)) {
          const a = soleChild(node, "a");
          a.properties = { ...a.properties, className: ["btn"] };
        }
      }

      parent.children = carded;
    };
    walk(tree);

    const tagBookingLinks = (node) => {
      if (isElement(node, "a") && String(node.properties.href ?? "").startsWith("/book/")) {
        node.properties.dataUmamiEvent = "booking-click";
      }
      node.children?.forEach(tagBookingLinks);
    };
    tagBookingLinks(tree);

    // Upper bounds: each layout's share of main's 72rem max-width, ignoring padding and gaps.
    const SIZES = {
      "photo-run": "(max-width: 40rem) 100vw, min(36rem, 50vw)",
      "media-row": "(max-width: 40rem) 100vw, min(34rem, 46vw)",
      "cross-sell-card": "(max-width: 40rem) 100vw, min(39rem, 54vw)",
      full: "(max-width: 72rem) 100vw, 72rem",
    };
    const applySizes = (parent, ctx) => {
      const elems = (parent.children ?? []).filter((n) => n.type === "element");
      elems.forEach((node, i) => {
        if (isElement(node, "img")) {
          node.properties.sizes = SIZES[ctx];
          return;
        }
        const classes = node.properties?.className ?? [];
        let next = Object.keys(SIZES).find((k) => classes.includes(k)) ?? ctx;
        // An odd photo run's last image spans both columns (global.css).
        const inRun = (parent.properties?.className ?? []).includes("photo-run");
        if (inRun && elems.length % 2 === 1 && i === elems.length - 1) next = "full";
        applySizes(node, next);
      });
    };
    applySizes(tree, "full");

    // Wrap each photo in a button feeding the site-wide <dialog> viewer
    // (LightboxViewer.astro), which shows the widest file in its srcset.
    // Cross-sell card photos link to the card's page instead (wrapped
    // above), so the pass skips those rows.
    const enlarge = (parent) => {
      if (!parent.children) return;
      const classes = parent.properties?.className ?? [];
      if (classes.includes("cross-sell-row")) return;
      for (const node of parent.children) {
        if (isImageParagraph(node)) {
          const img = soleChild(node, "img");
          node.children = [
            el(
              "button",
              {
                type: "button",
                className: ["lightbox-open"],
                ariaLabel: `Enlarge photo: ${img.properties?.alt ?? ""}`,
              },
              [img],
            ),
          ];
        } else {
          enlarge(node);
        }
      }
    };
    // Pages can opt out of the viewer with `lightbox: false` frontmatter
    // (e.g. the hosts portrait has nothing to enlarge).
    if (file.data.astro?.frontmatter?.lightbox !== false) enlarge(tree);

    // On content pages the first image sits at or near the top, so load it
    // eagerly instead of Astro's lazy default. Dwelling pages open with the
    // DwellingLayout hero, which carries the priority instead.
    if (isDwelling) return;
    const firstImg = (parent) => {
      for (const node of parent.children ?? []) {
        if (isElement(node, "img")) return node;
        const found = node.type === "element" ? firstImg(node) : null;
        if (found) return found;
      }
      return null;
    };
    const lead = firstImg(tree);
    if (lead) {
      lead.properties.loading = "eager";
      lead.properties.fetchPriority = "high";
    }
  };
}
