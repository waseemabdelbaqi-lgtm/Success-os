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

/**
 * Lightweight smoke navigation — never used to bypass auth/CAPTCHA.
 */
export async function playwrightSmoke(url = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000") {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return { provider: "playwright", ok: false, detail: "playwright not installed" };
  }
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    return {
      provider: "playwright",
      ok: Boolean(res && res.ok()),
      status: res?.status() || 0,
      url,
      title: await page.title().catch(() => ""),
    };
  } finally {
    await browser.close().catch(() => undefined);
  }
}
