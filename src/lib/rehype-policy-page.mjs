// Build-time structure for the guest-info page (styling lives under the
// .policy- classes in global.css; the plugin is a no-op on every other page):
//  - a key-facts chip strip after the h1, each chip quoting a one-line rule
//    verbatim from the body (check-in/out, children, smoking, pets, parties)
//  - each h2 and its following content -> <section class="policy-section">
//  - inside the practical section, each h3 topic -> a card in a
//    <div class="policy-topics"> grid; "Check-in:"/"Check-out:" lines get a
//    clock icon and emphasis
//  - the section whose h2 matches `policyTerms` frontmatter renders as a
//    two-column layout: a sticky
//    "On this page" contents list built from its h3s beside the prose,
//    with CSS-numbered clauses
//  - blockquotes and the "Effective ..." date line are styled via CSS only

import {
  isElement,
  isWhitespace,
  textOf,
  assignHeadingIds,
  el,
  factIcon as icon,
  splitAt,
  chipStrip,
  tocNav,
} from "./hast-utils.mjs";

// Quick-glance rules surfaced as chips at the top of the page. Each chip
// quotes the first body paragraph matching its pattern verbatim (see
// chipStrip in hast-utils.mjs).
const CHIP_RULES = [
  { icon: "clock", pattern: /^check-in:/i },
  { icon: "clock", pattern: /^check-out:/i },
  { icon: "baby", pattern: /^children of any age/i },
  { icon: "cigarette-slash", pattern: /^smoking is not allowed/i },
  { icon: "paw-print", pattern: /^pets are not allowed/i },
  { icon: "confetti", pattern: /^parties\/events are not allowed/i },
];

export default function rehypePolicyPage() {
  return (tree, file) => {
    const frontmatter = file.data?.astro?.frontmatter;
    if (!frontmatter?.policyPage) return;

    assignHeadingIds(tree);
    const nodes = tree.children.filter((c) => !isWhitespace(c));
    const [lead, ...sections] = splitAt(nodes, "h2");
    const terms = frontmatter.policyTerms;
    if (terms && !sections.some(([h2]) => textOf(h2).trim() === terms)) {
      throw new Error(`policyTerms "${terms}" matches no h2 in ${file.path}`);
    }

    tree.children = [
      ...lead,
      ...chipStrip(nodes, CHIP_RULES),
      ...sections.map(([h2, ...body]) =>
        textOf(h2).trim() === terms ? termsSection(h2, body) : practicalSection(h2, body),
      ),
    ];
  };
}

// Practical stay info: each h3 topic becomes a card in a grid.
function practicalSection(h2, body) {
  const [intro, ...topics] = splitAt(body, "h3");
  for (const topic of topics) {
    for (const node of topic) {
      const t = textOf(node).trim();
      if (isElement(node, "p") && /^check-(in|out):/i.test(t)) {
        node.properties = { ...node.properties, className: ["policy-time"] };
        node.children = [icon("clock"), ...node.children];
      }
    }
  }
  return el("section", { className: ["policy-section"] }, [
    h2,
    ...intro,
    el(
      "div",
      { className: ["policy-topics"] },
      topics.map((topic) => el("div", { className: ["policy-topic"] }, topic)),
    ),
  ]);
}

// Terms and conditions: contents list beside long-form prose.
function termsSection(h2, body) {
  const headings = [];
  for (const node of body) {
    if (isElement(node, "h3")) headings.push(node);
    if (isElement(node, "p") && /^effective /i.test(textOf(node).trim())) {
      node.properties = { ...node.properties, className: ["policy-effective"] };
    }
  }
  return el("section", { className: ["policy-section", "policy-legal"] }, [
    h2,
    tocNav(headings, "Policy contents"),
    el("div", { className: ["policy-legal-body"] }, body),
  ]);
}
