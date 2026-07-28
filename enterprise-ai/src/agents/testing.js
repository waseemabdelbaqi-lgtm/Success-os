import { playwrightSmoke, playwrightConfigured, playwrightRouteAudit } from "../providers/playwright.js";

export const TESTING_AGENT = {
  id: "testing",
  label: "Testing Agent",
  responsibilities: ["Playwright", "UI Testing", "Integration Testing", "End-to-End Testing"],
};

export async function runTestingAgent(task) {
  const started = Date.now();
  const configured = await playwrightConfigured();
  let smoke = null;
  let routes = null;
  if (configured && task.context?.runSmoke !== false) {
    try {
      smoke = await playwrightSmoke(task.context?.url);
    } catch (err) {
      smoke = { ok: false, detail: String(err?.message || err) };
    }
    try {
      routes = await playwrightRouteAudit();
    } catch (err) {
      routes = { ok: false, detail: String(err?.message || err) };
    }
  }
  return {
    agent: TESTING_AGENT.id,
    provider: configured ? "playwright" : "local",
    model: null,
    durationMs: Date.now() - started,
    stub: !configured,
    output: {
      summary: configured
        ? `Playwright checks complete. smoke=${Boolean(smoke?.ok)} routes=${Boolean(routes?.ok)}`
        : "Testing Agent ready; install playwright to activate browser tests.",
      smoke,
      routes,
      checks: [
        { name: "playwright_module", ok: configured },
        { name: "smoke_navigation", ok: Boolean(smoke?.ok), detail: smoke },
        { name: "route_audit", ok: Boolean(routes?.ok), detail: routes },
      ],
      filesProposed: [],
      testsRequired: ["playwright_smoke", "route_audit"],
      risks: consoleRisks(smoke),
      nextSteps: configured
        ? ["Review Playwright route audit for console/network failures"]
        : ["npm i -D playwright && npx playwright install chromium"],
      status: configured ? "completed" : "needs_review",
    },
  };
}

function consoleRisks(smoke) {
  const risks = [];
  if (smoke?.consoleErrors?.length) risks.push(`console_errors=${smoke.consoleErrors.length}`);
  if (smoke?.failedRequests?.length) risks.push(`failed_requests=${smoke.failedRequests.length}`);
  return risks;
}
