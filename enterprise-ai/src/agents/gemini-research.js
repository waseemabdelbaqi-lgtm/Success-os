import { resolveChat, parseJsonLoose } from "./base.js";

export const GEMINI_RESEARCH_AGENT = {
  id: "gemini-research",
  label: "Gemini Research Agent",
  responsibilities: [
    "Official curriculum research",
    "Knowledge verification",
    "Educational datasets",
    "Textbook collection indexing",
    "Content validation",
  ],
};

export async function runGeminiResearchAgent(task) {
  const started = Date.now();
  const system = `You are the Success OS Gemini Research Agent.
Return JSON only: {"summary":"","officialSources":[],"verificationChecks":[],"datasetCandidates":[],"confidence":"UNVERIFIED|PARTIAL|VERIFIED","nextSteps":[]}.
Never recommend pirated sources or Wayback captures of protected textbooks.`;
  const user = JSON.stringify({
    taskId: task.id,
    title: task.title,
    goal: task.goal,
    researchScope: task.context || {},
  });
  const chat = await resolveChat(["gemini", "ollama-local"], { system, user });
  const data = parseJsonLoose(chat.text) || {
    summary: chat.text.slice(0, 800),
    officialSources: [],
    verificationChecks: [],
    datasetCandidates: [],
    confidence: "UNVERIFIED",
    nextSteps: [
      "Set GEMINI_API_KEY and MASTER_ORCHESTRATOR_ALLOW_GEMINI=true if Gemini should be enabled",
    ],
  };
  return {
    agent: GEMINI_RESEARCH_AGENT.id,
    provider: chat.provider,
    model: chat.model,
    durationMs: Date.now() - started,
    stub: Boolean(chat.stub),
    output: data,
    tried: chat.tried,
  };
}
