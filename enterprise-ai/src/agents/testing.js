import { playwrightSmoke, playwrightConfigured } from "../providers/playwright.js";

export const TESTING_AGENT = {
  id: "testing",
  label: "Testing Agent",
  responsibilities: ["Playwright", "UI Testing", "Integration Testing", "End-to-End Testing"],
};

export async function runTestingAgent(task) {
  const started = Date.now();
  const configured = await playwrightConfigured();
  let smoke = null;
  if (configured && task.context?.runSmoke !== false) {
    try {
      smoke = await playwrightSmoke(task.context?.url);
    } catch (err) {
      smoke = { ok: false, detail: String(err?.message || err) };
    }
  }
  return {
    agent: TESTING_AGENT.id,
    provider: configured ? "playwright" : "unconfigured",
    model: null,
    durationMs: Date.now() - started,
    stub: !configured,
    output: {
      summary: configured
        ? "Playwright available for UI/E2E checks."
        : "Testing Agent ready; install playwright to activate browser tests.",
      smoke,
      checks: [
        { name: "playwright_module", ok: configured },
        { name: "smoke_navigation", ok: Boolean(smoke?.ok), detail: smoke },
      ],
      nextSteps: configured
        ? ["Expand smoke suite for critical Success OS journeys"]
        : ["npm i -D playwright && npx playwright install chromium"],
    },
  };
}
