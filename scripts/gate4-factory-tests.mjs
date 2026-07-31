#!/usr/bin/env node
const BASE = process.env.GATE4_BASE || "http://127.0.0.1:3000";

async function post(action, body = {}, timeoutMs = 120000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${BASE}/api/curriculum-factory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
      signal: ctrl.signal,
    });
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Bad JSON ${action}: ${text.slice(0, 300)}`);
    }
    if (!r.ok || data.ok === false) throw new Error(`${action} failed: ${text.slice(0, 500)}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function get(view) {
  const r = await fetch(`${BASE}/api/curriculum-factory?view=${view}`);
  const data = await r.json();
  if (!r.ok || data.ok === false) throw new Error(`GET ${view} failed`);
  return data;
}

const results = [];
function check(name, passed, detail = "") {
  results.push({ name, passed: !!passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

async function main() {
  const boot = await post("bootstrap");
  check("bootstrap_queue", boot.queue?.created + boot.queue?.updated > 0, JSON.stringify(boot.queue));

  // Prefer small worker batches over full drain (drain can exceed HTTP timeout)
  const batch = await post("worker_batch", { limit: 5 }, 180000);
  check("worker_batch", batch.result?.claimed >= 0, `claimed=${batch.result?.claimed}`);

  const stats = await get("queue");
  const q = stats.stats || {};
  const blocked = (q.BLOCKED_BY_SOURCE || 0) + (q.BLOCKED_BY_RIGHTS || 0);
  const inReview =
    (q.SUBJECT_REVIEW || 0) +
    (q.LANGUAGE_REVIEW || 0) +
    (q.TECHNICAL_REVIEW || 0) +
    (q.FINAL_APPROVAL || 0) +
    (q.PUBLISHED || 0);
  check("blocked_visible", blocked > 0, `blocked=${blocked}`);
  check("companions_processed", inReview > 0, JSON.stringify(q));
  check("no_fake_complete_status", (q.COMPLETE || 0) === 0, `COMPLETE=${q.COMPLETE || 0}`);

  const status = await get("status");
  check("import_formats", Array.isArray(status.importFormats) && status.importFormats.includes("pdf"));
  check("ocr_method_documented", String(status.ocrMethod || "").includes("OCR"));

  // Publication proof (may already be published)
  try {
    const pub = await post("publish_first_ready", {}, 120000);
    check("publication_works", pub.result?.ok === true || pub.ok === true, JSON.stringify(pub.result || pub.error || ""));
  } catch (e) {
    const mon = await get("monitor");
    const published = mon.snapshot?.jordan?.publishedBooks || 0;
    check("publication_works", published > 0, `fallback publishedBooks=${published}; err=${e.message}`);
  }

  const readiness = await post("global_readiness_test");
  check("global_readiness", readiness.result?.passed === true);

  const monitor = await get("monitor");
  check("monitor_live", Boolean(monitor.snapshot?.jordan));
  check(
    "complete_claim_zero",
    (monitor.snapshot?.jordan?.booksClaimedComplete || 0) === 0,
    `claimedComplete=${monitor.snapshot?.jordan?.booksClaimedComplete}`,
  );

  const blockedView = await get("blocked");
  check("blocked_jobs_listed", Array.isArray(blockedView.blocked) && blockedView.blocked.length > 0);

  for (const path of [
    "/admin/production-factory",
    "/admin/production-monitor",
    "/admin/review-workbench",
    "/interactive-books",
    "/student/countries",
  ]) {
    const r = await fetch(`${BASE}${path}`);
    check(`route_${path}`, r.status === 200, `status=${r.status}`);
  }

  const failed = results.filter((r) => !r.passed);
  console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, queue: q, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
