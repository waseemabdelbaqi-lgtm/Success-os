#!/usr/bin/env node
const BASE = process.env.GATE5_BASE || "http://127.0.0.1:3000";

async function post(action, body = {}, timeoutMs = 300000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${BASE}/api/gate5`, {
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
      throw new Error(`Bad JSON ${action}: ${text.slice(0, 400)}`);
    }
    if (!r.ok || data.ok === false) throw new Error(`${action} failed: ${text.slice(0, 600)}`);
    return data;
  } finally {
    clearTimeout(t);
  }
}

async function get(view) {
  const r = await fetch(`${BASE}/api/gate5?view=${view}`);
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
  const status = await get("status");
  check("gate5_status", status.gate === 5, JSON.stringify(status.totals));

  // Advance a batch of eligible companions (may already be processed)
  const adv = await post("advance_eligible", { limit: 15 }, 300000);
  check("advance_eligible", adv.result?.attempted >= 0, JSON.stringify(adv.result));

  const final = await post("run_final_audit", { publishLimit: 10 }, 300000);
  const report = final.report || {};
  check("final_audit_ran", Boolean(report.readiness?.verdict), report.readiness?.verdict);
  check("no_fake_complete", (report.totals?.completeClaimBooks || 0) === 0, `complete=${report.totals?.completeClaimBooks}`);
  check(
    "blockers_documented",
    (report.gapCounts?.EDITION_UNCERTAIN || 0) > 0 || (report.totals?.blockedJobs || 0) > 0,
    JSON.stringify(report.gapCounts),
  );
  check(
    "not_ready_while_blockers",
    report.readiness?.verdict === "NOT_READY_FOR_THE_NEXT_COUNTRY",
    report.readiness?.verdict,
  );

  const criticalFails = [];
  for (const group of Object.values(report.tests || {})) {
    if (!Array.isArray(group)) continue;
    for (const t of group) {
      if (t.severity === "critical" && !t.passed) criticalFails.push(t.name);
    }
  }
  if (report.tests?.backup && !report.tests.backup.passed) criticalFails.push("backup");
  check("no_critical_test_failures", criticalFails.length === 0, criticalFails.join(",") || "none");

  for (const path of ["/admin/gate5-final", "/admin/production-factory", "/interactive-books", "/student/countries"]) {
    const r = await fetch(`${BASE}${path}`);
    check(`route_${path}`, r.status === 200, `status=${r.status}`);
  }

  const failed = results.filter((r) => !r.passed);
  console.log(
    JSON.stringify(
      {
        passed: results.length - failed.length,
        failed: failed.length,
        verdict: report.readiness?.verdict,
        totals: report.totals,
        gapCounts: report.gapCounts,
        results,
      },
      null,
      2,
    ),
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
