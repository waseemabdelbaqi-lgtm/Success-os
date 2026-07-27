/**
 * Browser E2E: open /ai-lessons/g1-math, answer wrong twice, then correct, continue.
 * Run: node scripts/e2e-g1-math-browser.mjs
 */
import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3055";
const URL = `${BASE}/ai-lessons/g1-math`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const report = { steps: [] };

try {
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  report.steps.push({ open: URL, title: await page.title() });

  // Must be HTML interactive class, not video
  const contentTypeHint = await page.locator("text=هذا ليس فيديو MP4").count();
  assert.ok(contentTypeHint > 0, "missing interactive warning banner");

  // Start class
  const start = page.getByRole("button", { name: /ابدأ الحصة|Start class|متابعة|Continue/i });
  await start.first().click({ timeout: 15000 });
  report.steps.push({ action: "start" });

  // Skip waiting full 28s demo — jump with Next if allowed, else wait for interaction
  // Demo is auto; wait until question appears (up to 35s)
  const question = page.locator(".il-q");
  await question.waitFor({ state: "visible", timeout: 45000 });
  report.steps.push({ pausedForQuestion: await question.innerText() });

  // Wrong answer → hint
  await page.getByRole("button", { name: /^4$/ }).click();
  await page.locator(".il-feedback").waitFor({ state: "visible", timeout: 10000 });
  const hintText = await page.locator(".il-feedback").innerText();
  report.steps.push({ firstWrong: hintText });
  assert.match(hintText, /قفز|jump|3/i);

  // Dismiss hint / try again
  const tryAgain = page.getByRole("button", { name: /حاول مجدداً|Try again/i });
  if (await tryAgain.count()) await tryAgain.click();

  // Second wrong → reexplain (feedback stays visible with easier explanation)
  await page.getByRole("button", { name: /^6$/ }).click();
  await page.waitForTimeout(500);
  const second = await page.locator(".il-feedback").innerText();
  report.steps.push({ secondWrong: second });
  assert.match(second, /5|ناتج|answer/i);

  // Wait for reexplain animation to finish and choices to return
  await page.getByRole("button", { name: /^5$/ }).waitFor({ state: "visible", timeout: 25000 });
  report.steps.push({ reexplainDone: true });

  // Correct
  await page.getByRole("button", { name: /^5$/ }).click();
  await page.locator("button.il-continue").waitFor({ state: "visible", timeout: 10000 });
  const praise = await page.locator(".il-feedback").innerText();
  report.steps.push({ correct: praise });

  await page.locator("button.il-continue").click();
  report.steps.push({ continued: true });

  // Progress saved in localStorage
  const saved = await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter((k) => k.includes("interactive-lesson"));
    return keys.map((k) => ({ k, v: localStorage.getItem(k) }));
  });
  report.steps.push({ localStorageKeys: saved.map((s) => s.k) });
  assert.ok(saved.length > 0, "progress not saved");

  // Old mp4 URL must land on HTML
  const resp = await page.goto(`${BASE}/ai-lessons/g1-math/lesson.mp4`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  const finalUrl = page.url();
  report.steps.push({ mp4RedirectTo: finalUrl, status: resp?.status() });
  assert.ok(finalUrl.includes("/ai-lessons/g1-math"));
  assert.ok(!finalUrl.endsWith(".mp4"));
  assert.ok((await page.locator("text=هذا ليس فيديو MP4").count()) > 0);

  console.log(JSON.stringify({ ok: true, report }, null, 2));
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: String(err), report }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
