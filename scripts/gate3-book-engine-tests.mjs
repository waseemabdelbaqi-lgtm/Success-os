#!/usr/bin/env node
/**
 * Gate 3 automated checks against local Next server.
 * Uses incremental actions (full companion reprocess is optional).
 */
const BASE = process.env.GATE3_BASE || "http://127.0.0.1:3000";

async function post(action, body = {}) {
  const r = await fetch(`${BASE}/api/global-curriculum`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Bad JSON for ${action}: ${text.slice(0, 200)}`);
  }
  if (!r.ok || data.ok === false) throw new Error(`${action} failed: ${text.slice(0, 400)}`);
  return data;
}

async function get(view) {
  const r = await fetch(`${BASE}/api/global-curriculum?view=${view}`);
  const data = await r.json();
  if (!r.ok || data.ok === false) throw new Error(`GET ${view} failed`);
  return data;
}

const results = [];
function check(name, passed, detail = "") {
  results.push({ name, passed: Boolean(passed), detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

async function main() {
  const seed = await post("seed_jordan");
  check("seed_jordan", seed.result?.inventoryCells > 0, `cells=${seed.result?.inventoryCells}`);

  const authored = await post("import_authored");
  check("import_authored", authored.result?.imported > 0, `books=${authored.result?.imported}`);

  const queue = await post("rebuild_queue");
  check("rebuild_queue", queue.result?.created > 0, `created=${queue.result?.created} blocked=${queue.result?.blocked}`);

  const processResult = await post("process_queue", { limit: 5 });
  check(
    "process_queue_batch",
    processResult.result?.processed >= 0 && Array.isArray(processResult.result?.errors),
    `processed=${processResult.result?.processed}`,
  );

  const readiness = await post("global_readiness_test");
  check("global_readiness_test", readiness.result?.passed === true, (readiness.result?.failures || []).join("; "));

  const audit = await post("final_audit");
  check("audit_exists", Boolean(audit.report?.verdict), `verdict=${audit.report?.verdict}`);
  check("complete_books_zero_or_honest", audit.report?.totals?.completeBooks === 0, `complete=${audit.report?.totals?.completeBooks}`);
  check("next_country_not_ready", audit.report?.nextCountryReady === false, `next=${audit.report?.nextCountryReady}`);
  check("edition_blockers_recorded", audit.report?.blockers?.editionUnverifiedOfficial > 0, `n=${audit.report?.blockers?.editionUnverifiedOfficial}`);

  const status = await get("status");
  check(
    "jordan_country_active",
    (status.countries || []).some((c) => c.iso_code === "JO" && Number(c.student_visible) === 1),
  );

  for (const path of [
    "/admin/country-wizard",
    "/admin/jordan-coverage",
    "/admin/global-curriculum-matrix",
    "/admin/country-readiness",
    "/student/countries",
    "/interactive-books",
    "/jordan-books",
  ]) {
    const r = await fetch(`${BASE}${path}`);
    check(`route_${path}`, r.status === 200, `status=${r.status}`);
  }

  const failed = results.filter((r) => !r.passed);
  console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
