import { defineConfig, devices } from "@playwright/test";

const port = 8787;

export default defineConfig({
  testDir: "tests",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${port}` },
  // Tests run against the production build served the way Workers serves it,
  // so _headers and _redirects apply.
  webServer: {
    command: `astro build && wrangler dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
