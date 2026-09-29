import { test, expect } from "@playwright/test";

test("legacy Squarespace paths redirect permanently", async ({ request }) => {
  for (const [from, to] of [
    ["/home", "/"],
    ["/further-inform", "/location/"],
  ]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(new URL(res.headers()["location"], "http://x").pathname).toBe(to);
  }
});

test("hashed assets are cached as immutable and pages carry security headers", async ({ request, page }) => {
  await page.goto("/");
  const css = await page.locator('link[rel="stylesheet"][href^="/_astro/"]').first().getAttribute("href");
  const asset = await request.get(css!);
  expect(asset.headers()["cache-control"]).toContain("immutable");

  const home = await request.get("/");
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  expect(home.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
});
