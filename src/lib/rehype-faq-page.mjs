// Build-time structure for the FAQ page (styling lives under the .faq-
// classes in global.css; the plugin is a no-op on every other page):
//  - a quick-answers chip strip after the intro, each chip quoting a short
//    fact verbatim from an answer (capacity, check-in/out, minimum stay,
//    pets) so the strip never invents wording
//  - each h2 and its following content -> <section class="faq-group"> with
//    the h2 as an eyebrow label
//  - inside a group, each h3 question and its answer -> an
//    <article class="faq-item">; the h3 id serves deep links (/faq/#are-pets-allowed)
//  - a trailing h2 section with no h3s beneath it renders as the
//    <section class="faq-closing"> contact card

import {
  isElement,
  isWhitespace,
  textOf,
  assignHeadingIds,
  el,
  splitAt,
  chipStrip,
  tocNav,
} from "./hast-utils.mjs";

// Each chip captures a phrase verbatim from the first answer paragraph that
// matches (see chipStrip in hast-utils.mjs).
const CHIP_RULES = [
  { icon: "users", pattern: /(sleeps up to 8 guests)/i },
  { icon: "clock", pattern: /(check-in is from \S+m)/i },
  { icon: "clock", pattern: /(check-out is by \S+m)/i },
  { icon: "calendar", pattern: /(2 night minimum stay)/i },
  { icon: "paw-print", pattern: /(we keep the property pet-free)/i },
];

// A trailing h2 section with no questions beneath it: the contact card.
const faqClosing = (h2, body) =>
  el("section", { className: ["faq-closing"] }, [
    h2,
    el("div", { className: ["faq-closing-body"] }, body),
  ]);

// An h2 topic group: each h3 question and its answer becomes an article;
// pairs are also pushed onto faqItems for the FAQPage JSON-LD.
const faqGroup = (h2, questions, faqItems) =>
  el("section", { className: ["faq-group"] }, [
    h2,
    el(
      "div",
      { className: ["faq-list"] },
      questions.map(([h3, ...answer]) => {
        faqItems.push({
          question: textOf(h3).trim(),
          answer: answer.map(textOf).join(" ").replace(/\s+/g, " ").trim(),
        });
        h3.properties = { ...h3.properties, className: ["faq-q"] };
        return el("article", { className: ["faq-item"] }, [
          h3,
          el("div", { className: ["faq-a"] }, answer),
        ]);
      }),
    ),
  ]);

export default function rehypeFaqPage() {
  return (tree, file) => {
    const frontmatter = file.data?.astro?.frontmatter;
    if (!frontmatter?.faqSchema) return;

    // Question/answer pairs collected while restructuring, exposed to the
    // page via remarkPluginFrontmatter so the FAQPage JSON-LD is built from
    // the same parse as the markup.
    const faqItems = [];

    assignHeadingIds(tree);
    const nodes = tree.children.filter((c) => !isWhitespace(c));
    const [lead, ...groups] = splitAt(nodes, "h2");

    // Sticky "On this page" contents list of every question, sharing the
    // guest-info toc styling. Links target the question headings' ids.
    const toc = tocNav(
      nodes.filter((n) => isElement(n, "h3")),
      "Questions on this page",
    );

    // The h1, intro and chip strip span the page like every other page;
    // below them the contents list sits beside the question column, which
    // keeps a readable measure without looking cut off.
    tree.children = [
      ...lead,
      ...chipStrip(nodes, CHIP_RULES),
      el("div", { className: ["faq-layout"] }, [
        toc,
        el(
          "div",
          { className: ["faq-wrap"] },
          groups.map(([h2, ...body]) => {
            const [, ...questions] = splitAt(body, "h3");
            if (questions.length === 0) return faqClosing(h2, body);
            return faqGroup(h2, questions, faqItems);
          }),
        ),
      ]),
    ];

    frontmatter.faqItems = faqItems;
  };
}
