import { test, expect } from "@playwright/test";

const isMobile = (projectName: string) => projectName === "mobile";

test("accommodation anchor target exists on homepage", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#accommodation")).toHaveCount(1);
});

test("dropdown children link to the right pages", async ({ page }) => {
  await page.goto("/");
  const accomMenu = page.locator(".nav-drop", { hasText: "Accommodation" }).locator(".drop-menu");
  await expect(accomMenu.locator("a")).toHaveText([
    "Hillside House",
    "Hillside Villa",
    "House & Villa",
  ]);
});

test("desktop: hover opens menu, click on parent follows anchor", async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo.project.name), "desktop only");
  await page.goto("/");
  const drop = page.locator(".nav-drop", { hasText: "Accommodation" });
  const menu = drop.locator(".drop-menu");

  await expect(menu).toBeHidden();
  await drop.locator(".nav-parent").hover();
  await expect(menu).toBeVisible();

  await drop.locator(".nav-parent").click();
  await expect(page).toHaveURL(/\/#accommodation$/);
});

test("desktop: menu stays open crossing gap and child navigates", async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo.project.name), "desktop only");
  await page.goto("/");
  const drop = page.locator(".nav-drop", { hasText: "Your Stay" });
  await drop.locator(".nav-parent").hover();
  const link = drop.locator(".drop-menu a", { hasText: "Location" });
  await link.hover();
  await link.click();
  await expect(page).toHaveURL(/\/location\/$/);
});

test("mobile: nav hidden until hamburger tapped, panel shows sub-links inline", async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo.project.name), "mobile only");
  await page.goto("/");
  const nav = page.locator("header nav");
  const toggle = page.locator(".nav-toggle");

  await expect(nav).toBeHidden();
  await expect(toggle).toBeVisible();
  await toggle.tap();
  await expect(nav).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".drop-menu a", { hasText: "Hillside Villa" })).toBeVisible();
});

test("mobile: tapping a child link navigates", async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo.project.name), "mobile only");
  await page.goto("/");
  await page.locator(".nav-toggle").tap();
  await page.locator(".drop-menu a", { hasText: "Hillside Villa" }).tap();
  await expect(page).toHaveURL(/\/hillside-villa\/$/);
});

test("mobile: parent link navigates on first tap", async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo.project.name), "mobile only");
  await page.goto("/");
  await page.locator(".nav-toggle").tap();
  await page.locator(".nav-parent", { hasText: "Accommodation" }).tap();
  await expect(page).toHaveURL(/\/#accommodation$/);
});

test("mobile: book button visible without opening the menu", async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo.project.name), "mobile only");
  await page.goto("/");
  await expect(page.locator("header .nav-book")).toBeVisible();
});

test("mobile: hamburger toggles panel closed again", async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo.project.name), "mobile only");
  await page.goto("/");
  const toggle = page.locator(".nav-toggle");
  await toggle.tap();
  await expect(page.locator("header nav")).toBeVisible();
  await toggle.tap();
  await expect(page.locator("header nav")).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("desktop: caret button discloses the menu and Escape returns focus", async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo.project.name), "desktop only");
  await page.goto("/");
  const drop = page.locator(".nav-drop", { hasText: "Your Stay" });
  const button = drop.locator(".drop-toggle");
  const menu = drop.locator(".drop-menu");

  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(menu.locator("a").first()).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
});

test("desktop: Escape dismisses a hovered menu", async ({ page }, testInfo) => {
  test.skip(isMobile(testInfo.project.name), "desktop only");
  await page.goto("/");
  const drop = page.locator(".nav-drop", { hasText: "Accommodation" });
  await drop.locator(".nav-parent").hover();
  await expect(drop.locator(".drop-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drop.locator(".drop-menu")).toBeHidden();
});

test("section parent is marked current, not the page", async ({ page }) => {
  await page.goto("/guest-info/");
  await expect(page.locator(".nav-parent", { hasText: "Your Stay" })).toHaveAttribute("aria-current", "true");
});

test("mobile: Tab moves from the toggle into the open menu, Escape closes it", async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo.project.name), "mobile only");
  await page.goto("/");
  const toggle = page.locator(".nav-toggle");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.locator("header nav a").first()).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.locator("header nav")).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});
