/**
 * Playwright browser fallback — public catalog pages only.
 * Never bypasses login, CAPTCHA, or security controls.
 */
export async function fetchPublicHtmlWithBrowser(url, { timeoutMs = 45000 } = {}) {
  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    return { ok: false, reason: "PLAYWRIGHT_NOT_INSTALLED", html: null };
  }
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(Math.min(timeoutMs, 300000));
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    if (!res) return { ok: false, reason: "NO_RESPONSE", html: null };
    if (res.status() >= 400) return { ok: false, reason: `HTTP_${res.status()}`, html: null };
    const html = await page.content();
    // Soft detect auth/captcha walls — do not attempt bypass.
    if (/captcha|recaptcha|cloudflare|login|تسجيل الدخول/i.test(html) && html.length < 5000) {
      return { ok: false, reason: "SOURCE_ACCESS_BLOCKED:AUTH_OR_CAPTCHA_WALL", html: null };
    }
    return { ok: true, reason: null, html };
  } catch (err) {
    return { ok: false, reason: `SOURCE_ACCESS_BLOCKED:${String(err?.message || err)}`, html: null };
  } finally {
    await browser.close().catch(() => undefined);
  }
}
