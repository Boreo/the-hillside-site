import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import GithubSlugger from "github-slugger";

// Question and group counts come from the markdown so the test tracks
// content edits. Groups are h2s; the closing h2 has no questions under it.
const faqMd = readFileSync("src/content/pages/faq.md", "utf8");
const questions = faqMd.match(/^### (.+)$/gm)!.map((l) => l.slice(4).trim());
const groups = faqMd.split(/^## /m).slice(1).filter((g) => /^### /m.test(g));
const slugOf = (t: string) => new GithubSlugger().slug(t);

test("faq groups questions with a quick-answers chip strip", async ({ page }) => {
  await page.goto("/faq/");
  await expect(page.locator("main h1")).toHaveText("Frequently Asked Questions");
  const chips = page.locator(".policy-chips .policy-chip");
  await expect(chips).toHaveCount(5);
  await expect(chips.first()).toContainText("Sleeps up to 8 guests");
  await expect(page.locator(".faq-group")).toHaveCount(groups.length);
  await expect(page.locator(".faq-item")).toHaveCount(questions.length);
  await expect(page.locator(".faq-closing h2")).toContainText("Still wondering");
  const toc = page.locator(".faq-layout .policy-toc");
  await expect(toc.locator("li a")).toHaveCount(questions.length);
  await expect(toc.locator("li a").first()).toHaveAttribute(
    "href",
    `#${slugOf(questions[0])}`,
  );
});

test("faq questions deep-link by heading id", async ({ page }) => {
  await page.goto("/faq/#are-pets-allowed");
  const item = page.locator(".faq-item").filter({ has: page.locator("#are-pets-allowed") });
  await expect(item.locator(".faq-q")).toHaveText("Are pets allowed?");
  await expect(item.locator(".faq-a")).toContainText("pet-free");
});

test("faq page emits FAQPage JSON-LD matching the questions", async ({ page }) => {
  await page.goto("/faq/");
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const faq = blocks.map((b) => JSON.parse(b)).find((d) => d["@type"] === "FAQPage");
  expect(faq).toBeTruthy();
  const names = faq.mainEntity.map((q: { name: string }) => q.name);
  expect(names).toEqual(questions);
  // Group headings are not questions.
  expect(names).not.toContain("The property");
  expect(names).not.toContain("Still wondering about something?");
  for (const q of faq.mainEntity) {
    expect(q.acceptedAnswer.text.length).toBeGreaterThan(20);
  }
});
