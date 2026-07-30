import { defineConfig, devices } from "@playwright/test";

const rawBase = (process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000").trim();
const allowRemote = process.env.PLAYWRIGHT_ALLOW_REMOTE === "true";

function assertSafeBaseUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`PLAYWRIGHT_BASE_URL_INVALID:${url}`);
  }
  const host = parsed.hostname.toLowerCase();
  const local =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1";
  if (!local && !allowRemote) {
    throw new Error(
      `REMOTE_TESTING_BLOCKED: ${host} requires PLAYWRIGHT_ALLOW_REMOTE=true`,
    );
  }
  return parsed.origin;
}

const baseURL = assertSafeBaseUrl(rawBase);

/**
 * Safe AIOS smoke config — Chromium only, local by default, no video,
 * screenshots on failure, trace on first retry. No production/destructive tests.
 */
export default defineConfig({
  testDir: "./e2e/smoke",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["json", { outputFile: "data/master-ai-orchestrator/health/playwright-smoke-report.json" }]],
  use: {
    baseURL,
    headless: true,
    screenshot: "only-on-failure",
    video: "off",
    trace: "on-first-retry",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Dev server is started externally for AIOS health / CI when needed.
  // webServer optional — smoke can also hit an already-running local app.
  webServer: process.env.PLAYWRIGHT_START_SERVER === "true"
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
});
