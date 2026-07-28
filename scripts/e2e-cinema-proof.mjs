/**
 * Browser E2E for Approach C cinema proof.
 * Uses ?t=43 to skip near end of narration, then answers the paused question.
 */
import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3055";
const URL = `${BASE}/ai-lessons/g1-math?t=43`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const report = { steps: [] };

try {
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  report.steps.push({ open: URL, title: await page.title() });
  assert.match(await page.title(), /سينمائي|ثلاثي/);

  await page.getByRole("button", { name: /ابدأ الحصة/ }).click({ timeout: 20000 });
  report.steps.push({ started: true });

  // Wait for interactive question after seeked audio ends
  await page.getByRole("button", { name: /^5$/ }).waitFor({ state: "visible", timeout: 25000 });
  report.steps.push({ pausedForQuestion: true });

  await page.getByRole("button", { name: /^4$/ }).click();
  await page.locator(".cine-fb").waitFor({ state: "visible", timeout: 10000 });
  report.steps.push({ hint: await page.locator(".cine-fb").innerText() });

  await page.getByRole("button", { name: /حاول مجدداً/ }).click();
  await page.getByRole("button", { name: /^6$/ }).click();
  await page.waitForTimeout(1200);
  report.steps.push({ reexplainVisible: (await page.locator(".cine-fb").count()) > 0 });

  await page.getByRole("button", { name: /^5$/ }).waitFor({ state: "visible", timeout: 10000 });
  await page.getByRole("button", { name: /^5$/ }).click();
  await page.getByRole("button", { name: /متابعة/ }).waitFor({ state: "visible", timeout: 10000 });
  report.steps.push({ correct: await page.locator(".cine-fb").innerText() });
  await page.getByRole("button", { name: /متابعة/ }).click();
  await page.getByRole("heading", { name: /أحسنت/ }).waitFor({ state: "visible", timeout: 10000 });

  const saved = await page.evaluate(() => localStorage.getItem("success-os:cinema-proof:g1-math"));
  assert.ok(saved && saved.includes("done"));
  report.steps.push({ progressSaved: true });

  // Ensure WebGL canvas exists
  const canvas = await page.locator("canvas").count();
  assert.ok(canvas >= 1, "missing WebGL canvas");
  report.steps.push({ canvasCount: canvas });

  console.log(JSON.stringify({ ok: true, report }, null, 2));
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: String(err), report }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
