import { test, expect } from "@playwright/test";

test("dwelling card facts lines carry sleeps/bedrooms icons", async ({ page }) => {
  await page.goto("/");
  const factsLines = page.locator(".dwellings .facts-line");
  await expect(factsLines).toHaveCount(3); // two cards + combined
  for (const line of await factsLines.all()) {
    await expect(line.locator("svg.fact-icon")).toHaveCount(3);
    await expect(line).toContainText(/Sleeps \d/);
    await expect(line).toContainText(/bedroom/i);
  }
});

test("review band shows three attributed quotes and links to reviews", async ({ page }) => {
  await page.goto("/");
  const band = page.locator(".review-band");
  await expect(band).toHaveCount(1);
  const quotes = band.locator("blockquote");
  await expect(quotes).toHaveCount(3);
  for (const q of await quotes.all()) {
    await expect(q.locator("footer")).toContainText(/—\s.+,\s.+/);
  }
  await expect(band.locator('a[href="/reviews/"]')).toHaveCount(1);
});

test("hero video stays paused under reduced motion and the toggle plays it", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const video = page.locator(".hero-video");
  const toggle = page.locator(".hero-toggle");
  await expect(toggle).toHaveAttribute("aria-label", "Play video");
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-label", "Pause video");
  await context.close();
});
