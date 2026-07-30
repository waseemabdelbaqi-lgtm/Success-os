import { resolveChat, parseJsonLoose } from "./base.js";

export const GPT_ENGINEERING_AGENT = {
  id: "gpt-engineering",
  label: "GPT Engineering Agent",
  responsibilities: [
    "Architecture",
    "Backend",
    "Frontend",
    "APIs",
    "Database",
    "Performance",
    "Security",
    "Bug fixing",
  ],
};

export async function runGptEngineeringAgent(task) {
  const started = Date.now();
  const system = `You are the Success OS GPT Engineering Agent.
Return JSON only: {"summary":"","proposedFiles":[],"risks":[],"securityNotes":[],"performanceNotes":[],"nextSteps":[]}.
Do not invent completed code changes. Propose actionable engineering plans only.`;
  const user = JSON.stringify({
    taskId: task.id,
    title: task.title,
    goal: task.goal,
    context: task.context || {},
  });
  const chat = await resolveChat(["openai", "ollama-local"], { system, user });
  const data = parseJsonLoose(chat.text) || {
    summary: chat.text.slice(0, 800),
    proposedFiles: [],
    risks: chat.stub ? ["PROVIDER_KEYS_MISSING"] : [],
    securityNotes: [],
    performanceNotes: [],
    nextSteps: ["Add OPENAI_API_KEY to activate live GPT Engineering Agent"],
  };
  return {
    agent: GPT_ENGINEERING_AGENT.id,
    provider: chat.provider,
    model: chat.model,
    durationMs: Date.now() - started,
    stub: Boolean(chat.stub),
    output: data,
    tried: chat.tried,
  };
}
