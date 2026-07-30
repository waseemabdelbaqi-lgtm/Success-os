/**
 * Playwright integration — smoke + structured route checks for existing app.
 */
export async function playwrightConfigured() {
  try {
    await import("playwright");
    return true;
  } catch {
    try {
      await import("@playwright/test");
      return true;
    } catch {
      return false;
    }
  }
}

async function detectBaseUrl() {
  const candidates = [
    process.env.PLAYWRIGHT_BASE_URL,
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ].filter(Boolean);
  for (const url of candidates) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if (res.ok || res.status === 307 || res.status === 308 || res.status === 401 || res.status === 403) {
        return url;
      }
    } catch {
      /* try next */
    }
  }
  return candidates[0] || "http://127.0.0.1:3000";
}

export async function playwrightSmoke(url) {
  const base = url || (await detectBaseUrl());
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return { provider: "playwright", ok: false, detail: "playwright not installed", baseUrl: base };
  }
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const failedRequests = [];
  try {
    const page = await browser.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 200));
    });
    page.on("requestfailed", (req) => {
      failedRequests.push({ url: req.url().slice(0, 200), error: req.failure()?.errorText || "failed" });
    });
    const res = await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
    return {
      provider: "playwright",
      ok: Boolean(res && (res.ok() || [401, 403, 307, 308].includes(res.status()))),
      status: res?.status() || 0,
      url: base,
      title: await page.title().catch(() => ""),
      consoleErrors: consoleErrors.slice(0, 10),
      failedRequests: failedRequests.slice(0, 10),
    };
  } finally {
    await browser.close().catch(() => undefined);
  }
}

/**
 * Verify only routes that are known to exist (homepage + a few public paths).
 * Auth redirects are not treated as broken.
 */
export async function playwrightRouteAudit({ routes } = {}) {
  const base = await detectBaseUrl();
  const configured = await playwrightConfigured();
  if (!configured) {
    return { ok: false, detail: "playwright not installed", baseUrl: base, results: [] };
  }
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const targets = routes || ["/", "/login", "/admin"];
  const results = [];
  try {
    const page = await browser.newPage();
    for (const route of targets) {
      const url = new URL(route, base).toString();
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 160));
      });
      try {
        const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
        const status = res?.status() || 0;
        const authRedirectOk = [301, 302, 303, 307, 308, 401, 403].includes(status);
        results.push({
          route,
          status,
          ok: Boolean(res && (res.ok() || authRedirectOk)),
          authRedirectOk,
          consoleErrors: consoleErrors.slice(0, 5),
          finalUrl: page.url(),
        });
      } catch (err) {
        results.push({ route, ok: false, error: String(err?.message || err).slice(0, 160) });
      }
    }
  } finally {
    await browser.close().catch(() => undefined);
  }
  return {
    ok: results.every((r) => r.ok),
    baseUrl: base,
    results,
  };
}
