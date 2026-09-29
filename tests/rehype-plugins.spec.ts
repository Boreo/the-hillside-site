import { test, expect } from "@playwright/test";
import rehypePhotoRuns from "../src/lib/rehype-photo-runs.mjs";
import rehypePolicyPage from "../src/lib/rehype-policy-page.mjs";

type Node = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: Node[] };

const el = (tagName: string, properties: Record<string, unknown>, children: Node[]): Node => ({ type: "element", tagName, properties, children });
const text = (value: string): Node => ({ type: "text", value });
const root = (children: Node[]): Node => ({ type: "root", children });
const file = (frontmatter: Record<string, unknown>) => ({ path: "test.md", data: { astro: { frontmatter } } });

// h2 + text paragraph + link-only paragraph: the cross-sell card shape.
const crossSell = (href: string) => [
  el("h2", {}, [text("Next door")]),
  el("p", {}, [text("A short line about the place.")]),
  el("p", {}, [el("a", { href }, [text("See it")])]),
];

const classesIn = (node: Node): string[] => [
  ...((node.properties?.className as string[] | undefined) ?? []),
  ...(node.children ?? []).flatMap(classesIn),
];

test("cross-sell cards only form on dwelling pages", () => {
  const tree = root(crossSell("/hillside-house/"));
  rehypePhotoRuns()(tree, file({}));
  expect(classesIn(tree)).not.toContain("cross-sell-card");
});

test("cross-sell cards to non-dwelling or hashed links build without crashing", () => {
  const tree = root([...crossSell("/contact-us/"), ...crossSell("/hillside-villa/#courtyard")]);
  rehypePhotoRuns()(tree, file({ dwelling: {} }));
  const classes = classesIn(tree);
  expect(classes.filter((c) => c === "cross-sell-card")).toHaveLength(2);
  expect(classes.filter((c) => c === "facts-line")).toHaveLength(1);
});

test("policy page fails the build when policyTerms matches no section", () => {
  const tree = root([el("h2", {}, [text("House rules")]), el("p", {}, [text("Be nice.")])]);
  expect(() => rehypePolicyPage()(tree, file({ policyPage: true, policyTerms: "Terms" }))).toThrow(/policyTerms/);
});

test("policy page omits the chip strip when no rule matches", () => {
  const tree = root([el("h2", {}, [text("House rules")]), el("p", {}, [text("Be nice.")])]);
  rehypePolicyPage()(tree, file({ policyPage: true }));
  expect(classesIn(tree)).not.toContain("policy-chips");
});
