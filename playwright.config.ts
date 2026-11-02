import { defineConfig, devices } from "@playwright/test";

const PORT = 3020;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const isCI = Boolean(process.env.CI);

/**
 * End-to-end tests. Mobile runs first because most buyers shop on mid-range Android phones
 * (kickoff brief, "Performance targets"). CI builds once and serves the production bundle;
 * locally the dev server is reused if it is already running.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
  },
  projects: [
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: isCI ? "npm run start" : "npm run dev",
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 180_000,
        stdout: "pipe",
      },
});
