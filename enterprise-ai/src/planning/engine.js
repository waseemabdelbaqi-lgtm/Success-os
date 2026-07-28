/**
 * Planning Engine — understand objective, estimate complexity, split subtasks.
 */
import { randomUUID } from "node:crypto";
import { listAgents } from "../agents/registry.js";

const RULES = [
  { agent: "engineering", re: /arch|engineer|implement|refactor|bug|code|module|system|aios/i },
  { agent: "backend", re: /backend|api|server|auth|endpoint|route.?handler/i },
  { agent: "frontend", re: /frontend|ui|component|page|layout|css|react/i },
  { agent: "database", re: /database|sql|postgres|schema|migration|supabase/i },
  { agent: "security", re: /security|owasp|secret|vulnerab|sanitize|authz/i },
  { agent: "performance", re: /perf|latency|scale|optim|bundle|cache/i },
  { agent: "curriculum", re: /lesson|book|curriculum|assessment|question|objective|مناهج|درس|كتاب/i },
  { agent: "research", re: /research|verify|official|dataset|textbook|مصدر|بحث|تحقق/i },
  { agent: "video", re: /video|animation|media|فيديو/i },
  { agent: "voice", re: /voice|speech|narrat|tts|صوت/i },
  { agent: "translation", re: /translat|i18n|locale|arabic|english|ترجمة/i },
  { agent: "testing", re: /test|playwright|e2e|qa|اختبار/i },
  { agent: "accessibility", re: /a11y|accessib|wcag|aria/i },
  { agent: "documentation", re: /doc|readme|adr|changelog|توثيق/i },
  { agent: "deployment", re: /deploy|release|fly|railway|docker|ci/i },
  { agent: "monitoring", re: /monitor|observ|alert|slo|metric/i },
];

function estimateComplexity(text, agentCount) {
  const len = text.length;
  if (agentCount >= 8 || len > 400) return { level: "high", score: 8, parallelRecommended: true };
  if (agentCount >= 4 || len > 160) return { level: "medium", score: 5, parallelRecommended: true };
  return { level: "low", score: 2, parallelRecommended: agentCount > 1 };
}

export function planRequest(userRequest, { context = {} } = {}) {
  const text = String(userRequest || "").trim();
  if (!text) throw new Error("EMPTY_USER_REQUEST");

  const matched = new Set();
  for (const rule of RULES) {
    if (rule.re.test(text)) matched.add(rule.agent);
  }

  // Default enterprise parallel core when request is broad
  if (!matched.size) {
    ["engineering", "research", "curriculum", "testing", "documentation", "security"].forEach((a) =>
      matched.add(a),
    );
  }

  // Quality companions
  if ([...matched].some((a) => ["engineering", "backend", "frontend", "database"].includes(a))) {
    matched.add("testing");
    matched.add("security");
  }
  if (matched.has("frontend")) matched.add("accessibility");
  if (matched.size >= 3) matched.add("documentation");

  const known = new Set(listAgents().map((a) => a.id));
  const agents = [...matched].filter((a) => known.has(a));
  const complexity = estimateComplexity(text, agents.length);

  const tasks = agents.map((agent, index) => ({
    id: `task_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    index,
    agent,
    title: `${agent} :: ${text.slice(0, 72)}`,
    goal: text,
    complexity: complexity.level,
    context,
    status: "QUEUED",
    parallel: complexity.parallelRecommended,
  }));

  return {
    planId: `plan_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    objective: text,
    userRequest: text,
    createdAt: new Date().toISOString(),
    complexity,
    strategy: "parallel-specialists-then-validate",
    tasks,
  };
}

// Back-compat export used by older CLI path
export function planTasks(userRequest, opts) {
  return planRequest(userRequest, opts);
}
