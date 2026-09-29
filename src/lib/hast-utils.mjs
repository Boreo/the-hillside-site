// Shared hast helpers for the rehype plugins in this directory.

import GithubSlugger from "github-slugger";
import { FACT_ICON_PATHS } from "./fact-icon-paths.mjs";

export const isElement = (node, tag) => node.type === "element" && node.tagName === tag;

export const isWhitespace = (node) => node.type === "text" && !node.value.trim();

export const textOf = (node) => {
  if (node.type === "text") return node.value;
  return (node.children ?? []).map(textOf).join("");
};

// Gives every heading the id Astro's heading pass would, so contents links
// can target them before that pass runs (it keeps ids already set).
export const assignHeadingIds = (tree) => {
  const slugger = new GithubSlugger();
  const visit = (node) => {
    if (node.type === "element" && /^h[1-6]$/.test(node.tagName)) {
      node.properties ??= {};
      if (typeof node.properties.id !== "string") node.properties.id = slugger.slug(textOf(node));
    }
    node.children?.forEach(visit);
  };
  visit(tree);
};

export const el = (tagName, properties, children) => ({
  type: "element",
  tagName,
  properties,
  children,
});

export const text = (value) => ({ type: "text", value });

// The node's single non-whitespace child, if it's an element of the given
// tag; otherwise null.
export const soleChild = (parent, tag) => {
  const kids = (parent.children ?? []).filter((c) => !isWhitespace(c));
  return kids.length === 1 && isElement(kids[0], tag) ? kids[0] : null;
};

export const factIcon = (name) =>
  el("svg", { className: ["fact-icon"], viewBox: "0 0 256 256", ariaHidden: "true" }, [
    el("path", { fill: "currentColor", d: FACT_ICON_PATHS[name] }, []),
  ]);

// Quick-glance chip strip quoting short facts verbatim from the page body.
// Each rule's chip quotes the first paragraph matching its pattern — the
// capture group if the pattern has one, otherwise the whole paragraph — so
// the strip never invents wording; if the wording changes and no longer
// matches, the chip drops out rather than drifting from the content. With
// no matches at all the strip is omitted.
export const chipStrip = (nodes, rules) => {
  const paragraphs = nodes.filter((n) => isElement(n, "p")).map((n) => textOf(n).trim());
  const chips = rules.flatMap((rule) => {
    for (const p of paragraphs) {
      const match = p.match(rule.pattern);
      if (match) {
        const phrase = (match[1] ?? p).replace(/\.$/, "");
        return [
          el("span", { className: ["policy-chip"] }, [
            factIcon(rule.icon),
            text(phrase.charAt(0).toUpperCase() + phrase.slice(1)),
          ]),
        ];
      }
    }
    return [];
  });
  return chips.length ? [el("p", { className: ["policy-chips"] }, chips)] : [];
};

// Sticky "On this page" contents list linking to the given headings' ids
// (set by assignHeadingIds).
export const tocNav = (headings, ariaLabel) =>
  el("nav", { className: ["policy-toc"], ariaLabel }, [
    el("p", { className: ["policy-toc-label"] }, [text("On this page")]),
    el(
      "ol",
      {},
      headings.map((h) =>
        el("li", {}, [el("a", { href: `#${h.properties.id}` }, [text(textOf(h))])]),
      ),
    ),
  ]);

// Split a node list into a leading chunk plus one chunk per heading of the
// given tag; each chunk is [heading, ...content up to the next heading].
export const splitAt = (nodes, tag) => {
  const chunks = [[]];
  for (const node of nodes) {
    if (isElement(node, tag)) chunks.push([]);
    chunks[chunks.length - 1].push(node);
  }
  return chunks;
};
