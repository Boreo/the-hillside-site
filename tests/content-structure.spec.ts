import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const pages = ["/", "/hillside-house/", "/hillside-villa/", "/house-and-villa/", "/faq/", "/guest-info/", "/location/", "/reviews/", "/gallery/"];

for (const path of pages) {
  test(`${path} has unique element ids and contents links that resolve`, async ({ page }) => {
    await page.goto(path);
    const ids = await page.locator("[id]").evaluateAll((els) => els.map((e) => e.id));
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    const targets = await page.locator(".policy-toc a").evaluateAll((as) => as.map((a) => a.getAttribute("href")!.slice(1)));
    for (const id of targets) expect(ids).toContain(id);
  });
}

test("reviews and rating badges follow the yaml file order", async ({ page }) => {
  const reviews = parse(readFileSync("src/content/reviews.yaml", "utf8")) as { author: string; featured?: string }[];
  const sources = parse(readFileSync("src/content/review-sources.yaml", "utf8")) as { platform: string; rating: number | null; count: number | null }[];
  await page.goto("/reviews/");
  const firstCard = page.locator(".review-card").first();
  await expect(firstCard).toContainText(reviews.find((r) => !r.featured)!.author);
  const shown = sources.filter((s) => s.rating !== null && s.count !== null);
  const badges = page.locator(".source-badge .source-meta");
  for (const [i, s] of shown.entries()) await expect(badges.nth(i)).toContainText(s.platform);
});
