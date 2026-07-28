/**
 * Planning Engine — objective understanding, complexity, dependency-aware task graph.
 */
import { randomUUID } from "node:crypto";
import { listAgents } from "../agents/registry.js";

const RULES = [
  { agent: "engineering", re: /arch|engineer|implement|refactor|bug|code|module|system|aios|security review/i },
  { agent: "backend", re: /backend|api|server|auth|endpoint/i },
  { agent: "frontend", re: /frontend|ui|component|page|layout|react/i },
  { agent: "database", re: /database|sql|postgres|schema|migration|supabase/i },
  { agent: "security", re: /security|owasp|secret|vulnerab|sanitize|authz/i },
  { agent: "performance", re: /perf|latency|scale|optim|bundle|cache|scalability/i },
  { agent: "curriculum", re: /lesson|book|curriculum|assessment|question|objective|مناهج|درس|كتاب|orchestration clarity/i },
  { agent: "research", re: /research|verify|official|dataset|textbook|مصدر|بحث|تحقق|routing|task routing/i },
  { agent: "video", re: /video|animation|media|فيديو/i },
  { agent: "voice", re: /voice|speech|narrat|tts|صوت/i },
  { agent: "translation", re: /translat|i18n|locale|ترجمة/i },
  { agent: "testing", re: /test|playwright|e2e|qa|اختبار|console failures|starts/i },
  { agent: "accessibility", re: /a11y|accessib|wcag|aria/i },
  { agent: "documentation", re: /doc|readme|adr|changelog|توثيق|documentation/i },
  { agent: "deployment", re: /deploy|release|fly|railway|docker|ci/i },
  { agent: "monitoring", re: /monitor|observ|alert|slo|metric/i },
];

/** Simple dependency rules: testing after engineering/frontend; docs after specialists */
const DEPENDENCY_RULES = [
  { agent: "testing", dependsOnAny: ["engineering", "frontend", "backend"] },
  { agent: "documentation", dependsOnAny: ["engineering", "curriculum", "research", "security"] },
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
  if (!matched.size) {
    ["engineering", "research", "curriculum", "testing", "documentation", "security"].forEach((a) =>
      matched.add(a),
    );
  }
  if ([...matched].some((a) => ["engineering", "backend", "frontend", "database"].includes(a))) {
    matched.add("testing");
    matched.add("security");
  }
  if (matched.has("frontend")) matched.add("accessibility");
  if (matched.size >= 3) matched.add("documentation");

  const known = new Set(listAgents().map((a) => a.id));
  const agents = [...matched].filter((a) => known.has(a));
  const complexity = estimateComplexity(text, agents.length);

  const tasks = agents.map((agent, index) => {
    const deps = [];
    for (const rule of DEPENDENCY_RULES) {
      if (rule.agent !== agent) continue;
      for (const d of rule.dependsOnAny) {
        if (agents.includes(d)) deps.push(d);
      }
    }
    return {
      id: `task_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
      index,
      agent,
      title: `${agent} :: ${text.slice(0, 72)}`,
      goal: text,
      complexity: complexity.level,
      dependsOn: deps,
      context,
      status: "QUEUED",
      parallel: deps.length === 0,
    };
  });

  // Wave assignment for dependency graph
  const waves = [];
  const remaining = new Set(tasks.map((t) => t.agent));
  const done = new Set();
  while (remaining.size) {
    const wave = tasks.filter(
      (t) => remaining.has(t.agent) && t.dependsOn.every((d) => done.has(d) || !remaining.has(d) && done.has(d) || t.dependsOn.every((x) => done.has(x))),
    ).filter((t) => remaining.has(t.agent) && t.dependsOn.every((d) => done.has(d)));
    const batch = wave.length ? wave : tasks.filter((t) => remaining.has(t.agent)).slice(0, 1);
    waves.push(batch.map((t) => t.agent));
    for (const t of batch) {
      remaining.delete(t.agent);
      done.add(t.agent);
    }
  }

  return {
    planId: `plan_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    objective: text,
    userRequest: text,
    createdAt: new Date().toISOString(),
    complexity,
    strategy: "dependency-waves-then-parallel-within-wave",
    dependencyWaves: waves,
    tasks,
  };
}

export function planTasks(userRequest, opts) {
  return planRequest(userRequest, opts);
}
