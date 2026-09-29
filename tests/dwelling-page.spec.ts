import { test, expect } from "@playwright/test";

const isMobile = (projectName: string) => projectName === "mobile";

test("hillside-house split header carries name, facts, amenities and book button", async ({ page }) => {
  await page.goto("/hillside-house/");
  const header = page.locator(".dwelling-header");
  await expect(header).toHaveCount(1);
  await expect(header.locator("h1")).toHaveText("Hillside House");
  const line = header.locator(".facts-line");
  await expect(line.locator("svg.fact-icon")).toHaveCount(3);
  await expect(line).toContainText("Sleeps 6");
  await expect(line).toContainText("3 bedrooms");
  await expect(header.locator(".amenities-line")).toContainText("Wood fireplace");
  await expect(header.locator('a.btn[href^="/book/"]')).toHaveText("Book with us");
  await expect(header.locator("img")).toHaveCount(1);
});

test("booking CTA links render as buttons", async ({ page }) => {
  await page.goto("/hillside-house/");
  const ctas = page.locator('.dwelling-body > p > a[href^="/book/"]');
  await expect(ctas).toHaveCount(1);
  // A real .btn (the rehype plugin adds the class), not a plain prose link.
  await expect(ctas.first()).toHaveClass(/\bbtn\b/);
});

test("prose images pair into alternating media rows", async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo.project.name), "desktop layout only");
  await page.goto("/hillside-house/");
  const rows = page.locator(".dwelling-body .media-row");
  expect(await rows.count()).toBeGreaterThanOrEqual(2);
  // Text and image share a row.
  const first = rows.first();
  const text = await first.locator("p").first().boundingBox();
  const img = await first.locator("img").boundingBox();
  expect(text && img && Math.abs(text.y + (text.height / 2) - (img.y + img.height / 2)) < img!.height).toBe(true);
  // Sides alternate: second row is flipped.
  await expect(rows.nth(1)).toHaveClass(/media-row-flip/);
});

test("consecutive photos group into two-up photo runs with no orphan column", async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo.project.name), "desktop layout only");
  await page.goto("/hillside-house/");
  const runs = page.locator(".dwelling-body .photo-run");
  expect(await runs.count()).toBeGreaterThan(0);
  const gallery = runs.last();
  const imgs = gallery.locator("img");
  const count = await imgs.count();
  expect(count).toBeGreaterThan(10);
  const a = await imgs.nth(0).boundingBox();
  const b = await imgs.nth(1).boundingBox();
  expect(a && b && Math.abs(a.y - b.y) < 5).toBe(true); // same row
  if (count % 2 === 1) {
    const last = await imgs.nth(count - 1).boundingBox();
    const runBox = await gallery.boundingBox();
    expect(last && runBox && last.width > runBox.width * 0.9).toBe(true);
  }
});

test("clicking a photo opens the dialog viewer and close hides it again", async ({ page }) => {
  await page.goto("/hillside-house/");
  const opener = page.locator(".dwelling-body .photo-run .lightbox-open").first();
  const viewer = page.locator(".gallery-viewer");
  await expect(viewer).toBeHidden();
  await opener.click();
  await expect(viewer).toBeVisible();
  const alt = await opener.locator("img").getAttribute("alt");
  await expect(viewer.locator(".viewer-caption")).toHaveText(alt!);
  await viewer.locator(".viewer-close").click();
  await expect(viewer).toBeHidden();
});

test("cross-sell sections render as side-by-side cards above the gallery", async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo.project.name), "desktop layout only");
  await page.goto("/hillside-house/");
  const row = page.locator(".dwelling-body .cross-sell-row");
  await expect(row).toHaveCount(1);
  await expect(row.locator(".cross-sell-card")).toHaveCount(2);
  // Each card mirrors the homepage dwelling cards: photo, heading, icon
  // facts line, text, button.
  await expect(row.locator(".cross-sell-card img")).toHaveCount(2);
  await expect(row.locator(".cross-sell-card .facts-line svg.fact-icon")).toHaveCount(6);
  await expect(row.locator(".cross-sell-card .cross-sell-cta a")).toHaveCount(2);
  await expect(row.locator(".facts-line").nth(1)).toContainText("Sleeps 8");
  const rowBox = await row.boundingBox();
  const galleryBox = await page.locator(".dwelling-body .photo-run").last().boundingBox();
  expect(rowBox && galleryBox && rowBox.y < galleryBox.y).toBe(true);
});
