import { test, expect } from "@playwright/test";

for (const path of ["/", "/hillside-house/", "/hillside-villa/", "/contact-us/", "/location/", "/404.html"]) {
  test(`every booking link on ${path} carries the Umami event`, async ({ page }) => {
    await page.goto(path);
    const links = page.locator('a[href^="/book/"]');
    expect(await links.count()).toBeGreaterThan(0);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute("data-umami-event", "booking-click");
    }
  });
}
