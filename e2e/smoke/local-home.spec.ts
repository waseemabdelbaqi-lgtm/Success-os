import { expect, test } from "@playwright/test";

/**
 * Non-destructive local smoke — no login, no DB writes, no payments.
 */
test.describe("AIOS local smoke", () => {
  test("home page responds with title and visible app shell", async ({ page, baseURL }) => {
    const host = new URL(baseURL || "http://localhost:3000").hostname;
    const local = ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(host);
    if (!local && process.env.PLAYWRIGHT_ALLOW_REMOTE !== "true") {
      throw new Error(`REMOTE_TESTING_BLOCKED:${host}`);
    }

    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(res, "home response").toBeTruthy();
    const status = res!.status();
    expect(
      status < 500,
      `home should not be a server error (got ${status})`,
    ).toBeTruthy();

    const title = await page.title();
    expect(title.length, "document title").toBeGreaterThan(0);

    // Visible application root or navigation
    const shell = page.locator("body, main, nav, header, [data-app-root], #__next").first();
    await expect(shell).toBeVisible();
  });

  test("health API reports Ollama READY and Playwright not green without probe evidence", async ({
    request,
    baseURL,
  }) => {
    const host = new URL(baseURL || "http://localhost:3000").hostname;
    const local = ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(host);
    if (!local && process.env.PLAYWRIGHT_ALLOW_REMOTE !== "true") {
      throw new Error(`REMOTE_TESTING_BLOCKED:${host}`);
    }

    const res = await request.get("/api/ai-infrastructure");
    // Route may require auth in some envs — accept 200 or auth-gated responses.
    if (res.status() === 401 || res.status() === 403) {
      test.info().annotations.push({
        type: "limitation",
        description: "Admin/health API auth-gated; public home smoke still valid",
      });
      return;
    }
    expect(res.status(), `health API status ${res.status()}`).toBeLessThan(500);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const providers = json.providers || [];
    const ollama = providers.find(
      (p: { providerId?: string; id?: string }) =>
        p.providerId === "ollama" || p.id === "ollama",
    );
    const playwright = providers.find(
      (p: { providerId?: string; id?: string }) =>
        p.providerId === "playwright" || p.id === "playwright",
    );

    // If persisted state exists, Ollama should be READY when previously probed.
    if (ollama && ollama.Status !== "NOT_TESTED" && ollama.status !== "NOT_TESTED") {
      expect(
        ollama.Status === "READY" || ollama.status === "READY" || ollama.displayColor === "green",
        "Ollama should appear READY after successful live probe",
      ).toBeTruthy();
    }

    // Playwright green only with its own persisted live probe evidence.
    if (playwright) {
      const green =
        playwright.displayColor === "green" ||
        playwright.Status === "READY" ||
        playwright.status === "READY";
      if (green) {
        expect(
          playwright.liveProbe === "PASSED" ||
            playwright["Live Probe"] === "PASSED" ||
            playwright.liveProbeExecuted === true,
          "Playwright READY requires persisted live probe evidence",
        ).toBeTruthy();
      }
    }
  });

  test("admin AI infrastructure page is non-destructive when reachable", async ({ page }) => {
    const res = await page.goto("/admin/ai-infrastructure", {
      waitUntil: "domcontentloaded",
    });
    if (!res) {
      test.skip(true, "no response from admin route");
      return;
    }
    const status = res.status();
    if ([401, 403, 302, 307, 308].includes(status)) {
      test.info().annotations.push({
        type: "limitation",
        description: `Admin route auth/redirect status=${status}; skipped UI assertions`,
      });
      return;
    }
    if (status >= 500) {
      throw new Error(`ADMIN_ROUTE_SERVER_ERROR:${status}`);
    }
    await expect(page.locator("body")).toBeVisible();
    // Page should mention infrastructure or the Arabic green rule without requiring login secrets.
    const bodyText = await page.locator("body").innerText();
    expect(
      /AI Infrastructure|Ollama|أخضر|Live Probe|المزود/i.test(bodyText),
      "admin infrastructure page content",
    ).toBeTruthy();
  });
});
