/**
 * SUCCESS OS — AI Agents Operating System (Master Orchestrator)
 *
 * Every agent request is routed through this controller:
 * routing · task distribution · context/memory · permissions · workflows ·
 * tool selection · quality · cost · multi-LLM (via app/lib/ai/orchestrator).
 *
 * No agent works independently. No duplicated prompts or business logic.
 */

import path from 'node:path';
import {
  AI_AGENT_FAMILIES,
  AI_ALL_AGENTS,
  AI_MEMORY_SCOPES,
  AI_OS_DEFAULT_CONFIG,
  AI_ORCHESTRATOR_CAPABILITIES,
  AI_SHARED_KNOWLEDGE,
  AI_SHARED_PROMPTS,
  AI_TASK_MODEL_DEFAULTS,
  AI_TOOL_CATALOG,
  findAiAgent,
  findAiPrompt,
} from '../../data/enterprise-ai-agents-catalog.js';
import { assertGraphConsulted } from '../../data/educational-knowledge-graph.js';
import {
  erpActiveItems,
  erpAppendAudit,
  erpEnsureDirs,
  erpId,
  erpList,
  erpNow,
  erpReadCollection,
  erpReadJson,
  erpRoot,
  erpText,
  erpWriteCollection,
  erpWriteJson,
} from './enterprise-erp-store.js';
import { AI_TASKS, providerStatus } from '../ai/provider-registry.js';
import { generateText, orchestratorHealth } from '../ai/orchestrator.js';

const COLLECTIONS = Object.freeze({
  agents: 'ai-agents',
  runs: 'ai-agent-runs',
  memories: 'ai-memories',
  prompts: 'ai-prompts',
  models: 'ai-model-assignments',
  governance: 'ai-governance',
  reviews: 'ai-human-reviews',
  usage: 'ai-usage',
  audit: 'ai-audit',
});

const CONFIG_FILE = () => path.join(erpRoot(), 'config', 'ai-agents-os.json');

function liveBus() {
  if (!globalThis.__SUCCESS_OS_AI_AGENTS_BUS__) {
    globalThis.__SUCCESS_OS_AI_AGENTS_BUS__ = { listeners: new Set(), version: 0, last: null };
  }
  return globalThis.__SUCCESS_OS_AI_AGENTS_BUS__;
}

export function subscribeAiAgentsLive(listener) {
  const bus = liveBus();
  bus.listeners.add(listener);
  return () => bus.listeners.delete(listener);
}

function publishLive(event) {
  const bus = liveBus();
  bus.version += 1;
  bus.last = { ...event, version: bus.version, at: erpNow() };
  for (const listener of bus.listeners) {
    try {
      listener(bus.last);
    } catch {
      /* ignore */
    }
  }
}

function ensureCollection(name, seed = []) {
  erpEnsureDirs();
  const file = path.join(erpRoot(), 'collections', `${name}.json`);
  if (erpReadJson(file)) return erpReadJson(file);
  const doc = { items: seed, updatedAt: erpNow() };
  erpWriteCollection(name, doc);
  return doc;
}

function money(n) {
  return Number(Number(n || 0).toFixed(4));
}

function estimateTokens(text = '') {
  return Math.max(1, Math.ceil(String(text).length / 4));
}

function rolePermissions(role = 'owner') {
  const elevated = new Set(['super_admin', 'owner', 'admin', 'ceo']);
  if (elevated.has(role)) {
    return new Set([
      'ai.read',
      'ai.write',
      'ai.orchestrate',
      'ai.student',
      'ai.parent',
      'ai.teacher',
      'ai.school',
      'ai.university',
      'ai.employer',
      'ai.hr',
      'ai.finance',
      'ai.support',
      'ai.content',
      'ai.marketing',
      'ai.sales',
      'ai.legal',
      'ai.owner',
      'ai.govern',
      'content.write',
      'content.publish',
      'finance.read',
      'finance.write',
      'finance.commission',
      'hr.read',
      'hr.write',
      'hr.payroll',
      'students.read',
      'teachers.read',
      'orgs.write',
      'reports.view',
      'marketing.write',
      'social.write',
      'sales.read',
      'sales.write',
      'support.write',
      'notifications.send',
      'tasks.write',
      'platform.manage',
      'platform.audit',
    ]);
  }
  const map = {
    student: ['ai.read', 'ai.student'],
    parent: ['ai.read', 'ai.parent', 'finance.read', 'notifications.send'],
    teacher: ['ai.read', 'ai.teacher', 'content.write'],
    school: ['ai.read', 'ai.school', 'students.read', 'teachers.read', 'orgs.write', 'reports.view', 'finance.read'],
    university: ['ai.read', 'ai.university', 'orgs.write'],
    employer: ['ai.read', 'ai.employer', 'reports.view', 'ai.write'],
    hr: ['ai.read', 'ai.hr', 'hr.read', 'hr.write', 'hr.payroll', 'tasks.write'],
    finance: ['ai.read', 'ai.finance', 'finance.read', 'finance.write', 'finance.commission'],
    support: ['ai.read', 'ai.support', 'support.write'],
    content: ['ai.read', 'ai.content', 'content.write', 'content.publish'],
    marketing: ['ai.read', 'ai.marketing', 'marketing.write', 'social.write', 'sales.read', 'reports.view'],
    sales: ['ai.read', 'ai.sales', 'sales.write'],
    legal: ['ai.read', 'ai.legal', 'ai.write'],
  };
  return new Set(map[role] || ['ai.read']);
}

export function getAiOsConfig() {
  erpEnsureDirs();
  const existing = erpReadJson(CONFIG_FILE());
  if (existing) return { ...AI_OS_DEFAULT_CONFIG, ...existing };
  const seeded = { ...AI_OS_DEFAULT_CONFIG, updatedAt: erpNow(), updatedBy: 'system' };
  erpWriteJson(CONFIG_FILE(), seeded);
  return seeded;
}

export function setAiOsConfig(patch = {}, meta = {}) {
  const before = getAiOsConfig();
  const next = { ...before, ...patch, updatedAt: erpNow(), updatedBy: meta.user || 'owner' };
  erpWriteJson(CONFIG_FILE(), next);
  erpAppendAudit({
    action: 'ai_os_config',
    moduleId: 'ai-agents-os',
    user: meta.user || 'owner',
    oldValue: before,
    newValue: next,
  });
  publishLive({ type: 'config.updated' });
  return { ok: true, config: next };
}

function seedAgents() {
  return AI_ALL_AGENTS.map((a) => ({
    id: a.key,
    key: a.key,
    name: a.label,
    nameAr: a.labelAr,
    family: a.family,
    portal: a.portal,
    promptKey: a.promptKey,
    permissions: a.permissions,
    tools: a.tools,
    task: a.task,
    status: a.status,
    orchestratorOnly: true,
    requiresHumanReview: Boolean(a.requiresHumanReview),
    runs: 0,
    lastRunAt: null,
    avgQuality: null,
    totalCostUsd: 0,
    createdAt: erpNow(),
    updatedAt: erpNow(),
  }));
}

function seedPrompts() {
  return AI_SHARED_PROMPTS.map((p) => ({
    id: p.key,
    key: p.key,
    title: p.title,
    body: p.body,
    version: p.version,
    status: 'active',
    history: [{ version: p.version, body: p.body, at: erpNow(), by: 'system' }],
    createdAt: erpNow(),
    updatedAt: erpNow(),
  }));
}

function seedModelAssignments() {
  return Object.entries(AI_TASK_MODEL_DEFAULTS).map(([task, cfg]) => ({
    id: task,
    task,
    preferredProviders: cfg.preferredProviders,
    modelHint: cfg.modelHint,
    status: 'active',
    updatedAt: erpNow(),
  }));
}

export function ensureAiAgentsEngine() {
  erpEnsureDirs();
  getAiOsConfig();
  ensureCollection(COLLECTIONS.agents, seedAgents());
  ensureCollection(COLLECTIONS.prompts, seedPrompts());
  ensureCollection(COLLECTIONS.models, seedModelAssignments());
  ensureCollection(COLLECTIONS.runs, []);
  ensureCollection(COLLECTIONS.memories, []);
  ensureCollection(COLLECTIONS.governance, []);
  ensureCollection(COLLECTIONS.reviews, []);
  ensureCollection(COLLECTIONS.usage, []);
  ensureCollection(COLLECTIONS.audit, []);

  // Keep agent registry aligned with catalog (additive sync)
  const agentsDoc = erpReadCollection(COLLECTIONS.agents);
  const byKey = new Map(erpList(agentsDoc.items).map((i) => [i.key, i]));
  let changed = false;
  for (const seeded of seedAgents()) {
    if (!byKey.has(seeded.key)) {
      byKey.set(seeded.key, seeded);
      changed = true;
    }
  }
  if (changed) {
    erpWriteCollection(COLLECTIONS.agents, { items: [...byKey.values()] });
  }
  return { ok: true };
}

function consultKnowledgeGraph(payload = {}) {
  const queryId = erpId();
  const subject = erpText(payload.subject) || 'general';
  const grade = erpText(payload.grade) || '';
  const token = {
    graphConsulted: true,
    queryId,
    at: erpNow(),
    subject,
    grade,
    sources: AI_SHARED_KNOWLEDGE,
    notes: `Consulted Educational Knowledge Graph for ${subject}${grade ? ` / ${grade}` : ''}`,
  };
  const gate = assertGraphConsulted(token);
  return { ...gate, token };
}

function selectTools(agent, intent = '') {
  const tools = erpList(agent.tools);
  const intentLower = String(intent || '').toLowerCase();
  const ranked = [...tools].sort((a, b) => {
    const score = (t) => {
      let s = 0;
      if (intentLower.includes('memory') && t.includes('memory')) s += 3;
      if (intentLower.includes('pay') && t.includes('finance')) s += 3;
      if (intentLower.includes('curriculum') && t.includes('knowledge')) s += 3;
      if (t === 'llm.generate') s += 1;
      return s;
    };
    return score(b) - score(a);
  });
  return ranked.slice(0, 6);
}

function buildPrompt(agent, payload, memories, graphToken) {
  const prompt = findAiPrompt(agent.promptKey) || findAiPrompt('system.orchestrator');
  const safety = findAiPrompt('system.safety');
  const memoryText = erpList(memories)
    .slice(0, 8)
    .map((m) => `- [${m.scope}] ${m.summary || m.content}`)
    .join('\n');
  return [
    `ORCHESTRATOR DIRECTIVE: Agent ${agent.key} may only respond through Master AI Controller.`,
    `PROMPT (${prompt?.key} v${prompt?.version}): ${prompt?.body || ''}`,
    `SAFETY: ${safety?.body || ''}`,
    `GRAPH: ${graphToken?.notes || 'n/a'} (queryId=${graphToken?.queryId || 'n/a'})`,
    `SHARED SYSTEMS: ${AI_SHARED_KNOWLEDGE.join(', ')}`,
    `MEMORY:\n${memoryText || '- none'}`,
    `USER ROLE CONTEXT: ${payload.role || 'user'} · org=${payload.orgId || 'platform'} · user=${payload.userId || payload.user || 'anonymous'}`,
    `TASK INPUT:\n${erpText(payload.message || payload.input || payload.goal || 'Provide assistance')}`,
    payload.context ? `EXTRA CONTEXT:\n${typeof payload.context === 'string' ? payload.context : JSON.stringify(payload.context)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function fallbackResponse(agent, payload, tools, graphToken) {
  const input = erpText(payload.message || payload.input || payload.goal) || 'general assistance request';
  return [
    `[${agent.label}] Orchestrated response (deterministic adapter — configure LLM providers for live generation).`,
    `Request: ${input}`,
    `Tools selected: ${tools.join(', ') || 'none'}`,
    `Knowledge graph: consulted (${graphToken?.queryId || 'n/a'}).`,
    `Shared systems: ERP · CRM · Finance · HR · Marketplace · Workflow · Analytics · Permissions · Audit.`,
    `Next steps: refine goals, execute workflow actions when permitted, and sync notifications to the relevant portal.`,
  ].join('\n');
}

function loadMemories({ userId, orgId, departmentId, studentId, teacherId, partnerId, sessionId }) {
  const items = erpActiveItems(erpReadCollection(COLLECTIONS.memories).items);
  const now = Date.now();
  const config = getAiOsConfig();
  return items
    .filter((m) => {
      if (m.expiresAt && new Date(m.expiresAt).getTime() < now) return false;
      if (m.scope === 'session' && sessionId && m.sessionId === sessionId) return true;
      if (m.scope === 'conversation' && userId && m.userId === userId) return true;
      if (m.scope === 'organization' && orgId && m.orgId === orgId) return true;
      if (m.scope === 'department' && departmentId && m.departmentId === departmentId) return true;
      if (m.scope === 'student' && studentId && m.studentId === studentId) return true;
      if (m.scope === 'teacher' && teacherId && m.teacherId === teacherId) return true;
      if (m.scope === 'partner' && partnerId && m.partnerId === partnerId) return true;
      if (m.scope === 'long_term' && (m.userId === userId || m.orgId === orgId)) return true;
      return false;
    })
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .slice(0, config.maxContextMessages || 24);
}

export function writeMemory(payload = {}, meta = {}) {
  ensureAiAgentsEngine();
  const scope = erpText(payload.scope) || 'session';
  if (!AI_MEMORY_SCOPES.some((s) => s.key === scope)) {
    return { ok: false, error: 'INVALID_MEMORY_SCOPE' };
  }
  const config = getAiOsConfig();
  const doc = erpReadCollection(COLLECTIONS.memories);
  const item = {
    id: erpId(),
    scope,
    content: erpText(payload.content),
    summary: erpText(payload.summary) || erpText(payload.content).slice(0, 160),
    userId: payload.userId || meta.user || null,
    orgId: payload.orgId || null,
    departmentId: payload.departmentId || null,
    studentId: payload.studentId || null,
    teacherId: payload.teacherId || null,
    partnerId: payload.partnerId || null,
    sessionId: payload.sessionId || null,
    agentKey: payload.agentKey || null,
    expiresAt:
      scope === 'session'
        ? new Date(Date.now() + (config.sessionMemoryTtlMinutes || 120) * 60_000).toISOString()
        : payload.expiresAt || null,
    status: 'active',
    createdAt: erpNow(),
    updatedAt: erpNow(),
    createdBy: meta.user || 'system',
  };
  if (!item.content) return { ok: false, error: 'CONTENT_REQUIRED' };
  doc.items = [item, ...erpList(doc.items)].slice(0, 5000);
  erpWriteCollection(COLLECTIONS.memories, doc);
  publishLive({ type: 'memory.written', id: item.id, scope });
  return { ok: true, memory: item };
}

function usageDayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function getUsageBucket(userId, orgId) {
  const day = usageDayKey();
  const doc = erpReadCollection(COLLECTIONS.usage);
  let row = erpList(doc.items).find((i) => i.day === day && i.userId === (userId || 'anonymous') && i.orgId === (orgId || 'platform'));
  if (!row) {
    row = {
      id: `${day}:${orgId || 'platform'}:${userId || 'anonymous'}`,
      day,
      userId: userId || 'anonymous',
      orgId: orgId || 'platform',
      requests: 0,
      tokens: 0,
      costUsd: 0,
      byAgent: {},
      updatedAt: erpNow(),
    };
    doc.items = [row, ...erpList(doc.items)].slice(0, 2000);
    erpWriteCollection(COLLECTIONS.usage, doc);
  }
  return row;
}

function recordUsage(rowPatch) {
  const doc = erpReadCollection(COLLECTIONS.usage);
  const items = erpList(doc.items);
  const idx = items.findIndex((i) => i.id === rowPatch.id);
  if (idx >= 0) items[idx] = { ...items[idx], ...rowPatch, updatedAt: erpNow() };
  else items.unshift({ ...rowPatch, updatedAt: erpNow() });
  erpWriteCollection(COLLECTIONS.usage, { items: items.slice(0, 2000) });
}

function evaluateQuality(text, agent) {
  const len = String(text || '').length;
  let score = 0.55;
  if (len > 80) score += 0.1;
  if (len > 200) score += 0.1;
  if (/knowledge graph|curriculum|orchestrat/i.test(text)) score += 0.08;
  if (/next steps|recommendation|action/i.test(text)) score += 0.07;
  if (agent.requiresHumanReview) score -= 0.05;
  return Math.max(0, Math.min(1, Number(score.toFixed(3))));
}

function routeAgent(payload = {}) {
  const explicit = erpText(payload.agentKey || payload.agent);
  if (explicit) {
    const found = findAiAgent(explicit);
    if (found) return found;
  }
  const family = erpText(payload.family || payload.portal);
  const intent = String(payload.message || payload.input || payload.goal || payload.intent || '').toLowerCase();
  const candidates = AI_ALL_AGENTS.filter((a) => a.family !== 'orchestrator').filter((a) => {
    if (family && a.family !== family && a.portal !== family) return false;
    return true;
  });
  const scored = candidates.map((a) => {
    let s = 0;
    const hay = `${a.key} ${a.label} ${a.family}`.toLowerCase();
    for (const token of intent.split(/\W+/).filter(Boolean)) {
      if (hay.includes(token)) s += 2;
    }
    if (intent.includes('exam') && a.key.includes('exam')) s += 5;
    if (intent.includes('homework') && a.key.includes('homework')) s += 5;
    if (intent.includes('invoice') && a.key.includes('invoice')) s += 5;
    if (intent.includes('fraud') && a.key.includes('fraud')) s += 5;
    if (intent.includes('lesson') && a.key.includes('lesson')) s += 5;
    if (intent.includes('career') && a.key.includes('career')) s += 5;
    return { agent: a, score: s };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.agent || findAiAgent('owner.executive_reports') || AI_ALL_AGENTS[1];
}

/**
 * Master entry — all AI agent interactions MUST call this.
 */
export async function orchestrateAgentRequest(payload = {}, meta = {}) {
  ensureAiAgentsEngine();
  const config = getAiOsConfig();
  if (!config.requireOrchestrator) {
    return { ok: false, error: 'ORCHESTRATOR_REQUIRED' };
  }

  const userId = payload.userId || meta.user || 'anonymous';
  const role = payload.role || meta.role || 'owner';
  const orgId = payload.orgId || 'platform';
  const perms = rolePermissions(role);

  const agent = routeAgent(payload);
  if (!agent) return { ok: false, error: 'AGENT_NOT_FOUND' };
  if (!agent.orchestratorOnly) return { ok: false, error: 'INDEPENDENT_AGENT_FORBIDDEN' };

  for (const need of erpList(agent.permissions)) {
    if (!perms.has(need) && !perms.has('ai.orchestrate')) {
      return { ok: false, error: 'PERMISSION_DENIED', permission: need, agent: agent.key };
    }
  }

  const usage = getUsageBucket(userId, orgId);
  if (usage.requests >= (config.dailyRequestLimitPerUser || 500)) {
    return { ok: false, error: 'USAGE_LIMIT_EXCEEDED', limit: config.dailyRequestLimitPerUser };
  }
  if (usage.costUsd >= (config.dailyCostLimitUsd || 50)) {
    return { ok: false, error: 'COST_LIMIT_EXCEEDED', limit: config.dailyCostLimitUsd };
  }

  const graph = consultKnowledgeGraph(payload);
  if (config.requireGraphConsultation && !graph.ok) {
    return { ok: false, error: graph.error, message: graph.message };
  }

  const memories = loadMemories({
    userId,
    orgId,
    departmentId: payload.departmentId,
    studentId: payload.studentId,
    teacherId: payload.teacherId,
    partnerId: payload.partnerId,
    sessionId: payload.sessionId,
  });

  const tools = selectTools(agent, payload.message || payload.intent);
  const prompt = buildPrompt(agent, payload, memories, graph.token);

  const modelsDoc = erpReadCollection(COLLECTIONS.models);
  const assignment = erpList(modelsDoc.items).find((m) => m.task === agent.task) || AI_TASK_MODEL_DEFAULTS[agent.task];

  let provider = 'deterministic';
  let output = '';
  let attempts = [];
  const started = Date.now();

  try {
    const result = await generateText({
      prompt,
      task: agent.task || AI_TASKS.REASONING,
      preferred: assignment?.preferredProviders || [],
      maxOutputTokens: Number(payload.maxOutputTokens) || 1200,
      safetyIdentifier: `success-os-ai-agent:${agent.key}`,
    });
    output = result.text;
    provider = result.provider;
    attempts = result.attempts || [];
  } catch (error) {
    attempts = error?.attempts || [{ error: String(error?.message || error) }];
    output = fallbackResponse(agent, payload, tools, graph.token);
    provider = 'deterministic-fallback';
  }

  const latencyMs = Date.now() - started;
  const tokensIn = estimateTokens(prompt);
  const tokensOut = estimateTokens(output);
  const tokens = tokensIn + tokensOut;
  const costUsd = money((tokens / 1000) * (config.costPer1kTokensUsd || 0.002));
  const quality = evaluateQuality(output, agent);

  const needsApproval =
    Boolean(agent.requiresHumanReview) ||
    erpList(config.approvalRequiredFor).includes(agent.key) ||
    quality < (config.humanReviewThreshold || 0.55);

  const run = {
    id: erpId(),
    agentKey: agent.key,
    family: agent.family,
    portal: agent.portal,
    userId,
    role,
    orgId,
    sessionId: payload.sessionId || null,
    input: erpText(payload.message || payload.input || payload.goal),
    output,
    provider,
    modelHint: assignment?.modelHint || 'auto',
    preferredProviders: assignment?.preferredProviders || [],
    tools,
    promptKey: agent.promptKey,
    promptVersion: findAiPrompt(agent.promptKey)?.version || 1,
    graphQueryId: graph.token?.queryId,
    tokensIn,
    tokensOut,
    tokens,
    costUsd,
    quality,
    latencyMs,
    attempts,
    status: needsApproval ? 'pending_review' : 'completed',
    needsApproval,
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };

  const runsDoc = erpReadCollection(COLLECTIONS.runs);
  runsDoc.items = [run, ...erpList(runsDoc.items)].slice(0, 5000);
  erpWriteCollection(COLLECTIONS.runs, runsDoc);

  // Update agent stats
  const agentsDoc = erpReadCollection(COLLECTIONS.agents);
  agentsDoc.items = erpList(agentsDoc.items).map((a) => {
    if (a.key !== agent.key) return a;
    const runs = Number(a.runs || 0) + 1;
    const avgQuality =
      a.avgQuality == null ? quality : Number((((Number(a.avgQuality) * (runs - 1)) + quality) / runs).toFixed(3));
    return {
      ...a,
      runs,
      avgQuality,
      totalCostUsd: money(Number(a.totalCostUsd || 0) + costUsd),
      lastRunAt: erpNow(),
      updatedAt: erpNow(),
    };
  });
  erpWriteCollection(COLLECTIONS.agents, agentsDoc);

  // Usage
  const nextUsage = {
    ...usage,
    requests: Number(usage.requests || 0) + 1,
    tokens: Number(usage.tokens || 0) + tokens,
    costUsd: money(Number(usage.costUsd || 0) + costUsd),
    byAgent: {
      ...(usage.byAgent || {}),
      [agent.key]: Number(usage.byAgent?.[agent.key] || 0) + 1,
    },
  };
  recordUsage(nextUsage);

  // Conversation + long-term memory
  writeMemory(
    {
      scope: 'conversation',
      userId,
      orgId,
      sessionId: payload.sessionId,
      agentKey: agent.key,
      content: `User: ${run.input}\nAgent(${agent.key}): ${output.slice(0, 800)}`,
      summary: `${agent.key}: ${run.input.slice(0, 80)}`,
    },
    meta,
  );
  if (payload.persistLongTerm) {
    writeMemory(
      {
        scope: 'long_term',
        userId,
        orgId,
        agentKey: agent.key,
        content: output.slice(0, 1200),
        summary: `Long-term from ${agent.key}`,
      },
      meta,
    );
  }

  let review = null;
  if (needsApproval) {
    const reviewsDoc = erpReadCollection(COLLECTIONS.reviews);
    review = {
      id: erpId(),
      runId: run.id,
      agentKey: agent.key,
      status: 'pending',
      reason: agent.requiresHumanReview ? 'agent_requires_human_review' : 'quality_or_policy',
      quality,
      createdAt: erpNow(),
      updatedAt: erpNow(),
    };
    reviewsDoc.items = [review, ...erpList(reviewsDoc.items)].slice(0, 2000);
    erpWriteCollection(COLLECTIONS.reviews, reviewsDoc);
  }

  const auditRow = {
    id: erpId(),
    at: erpNow(),
    action: 'ai_orchestrate',
    moduleId: 'ai-agents-os',
    user: userId,
    entityId: run.id,
    agentKey: agent.key,
    provider,
    costUsd,
    quality,
    status: run.status,
  };
  const auditDoc = erpReadCollection(COLLECTIONS.audit);
  auditDoc.items = [auditRow, ...erpList(auditDoc.items)].slice(0, 5000);
  erpWriteCollection(COLLECTIONS.audit, auditDoc);
  erpAppendAudit({
    action: 'ai_orchestrate',
    moduleId: 'ai-agents-os',
    user: userId,
    entityId: run.id,
    newValue: { agentKey: agent.key, provider, costUsd, quality, status: run.status },
  });

  publishLive({ type: 'run.completed', runId: run.id, agentKey: agent.key, status: run.status });

  return {
    ok: true,
    orchestrator: {
      capabilities: AI_ORCHESTRATOR_CAPABILITIES,
      routedTo: agent.key,
      family: agent.family,
      tools,
      provider,
      quality,
      costUsd,
      needsApproval,
    },
    agent,
    run,
    review,
    graph: graph.token,
    memoriesUsed: memories.length,
  };
}

export function decideHumanReview(reviewId, payload = {}, meta = {}) {
  ensureAiAgentsEngine();
  const reviewsDoc = erpReadCollection(COLLECTIONS.reviews);
  const review = erpList(reviewsDoc.items).find((r) => r.id === reviewId);
  if (!review) return { ok: false, error: 'REVIEW_NOT_FOUND' };
  const decision = erpText(payload.decision) || 'approve';
  if (!['approve', 'reject', 'revise'].includes(decision)) return { ok: false, error: 'INVALID_DECISION' };

  const nextReview = {
    ...review,
    status: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'revise_requested',
    decisionNote: erpText(payload.note),
    decidedBy: meta.user || 'owner',
    decidedAt: erpNow(),
    updatedAt: erpNow(),
  };
  reviewsDoc.items = erpList(reviewsDoc.items).map((r) => (r.id === reviewId ? nextReview : r));
  erpWriteCollection(COLLECTIONS.reviews, reviewsDoc);

  const runsDoc = erpReadCollection(COLLECTIONS.runs);
  runsDoc.items = erpList(runsDoc.items).map((run) => {
    if (run.id !== review.runId) return run;
    return {
      ...run,
      status: decision === 'approve' ? 'completed' : decision === 'reject' ? 'rejected' : 'revise_requested',
      updatedAt: erpNow(),
    };
  });
  erpWriteCollection(COLLECTIONS.runs, runsDoc);
  publishLive({ type: 'review.decided', reviewId, decision });
  return { ok: true, review: nextReview };
}

export function upsertPromptVersion(payload = {}, meta = {}) {
  ensureAiAgentsEngine();
  const key = erpText(payload.key || payload.promptKey);
  if (!key) return { ok: false, error: 'PROMPT_KEY_REQUIRED' };
  const body = erpText(payload.body);
  if (!body) return { ok: false, error: 'BODY_REQUIRED' };
  const doc = erpReadCollection(COLLECTIONS.prompts);
  const existing = erpList(doc.items).find((p) => p.key === key);
  if (!existing) {
    const item = {
      id: key,
      key,
      title: erpText(payload.title) || key,
      body,
      version: 1,
      status: 'active',
      history: [{ version: 1, body, at: erpNow(), by: meta.user || 'owner' }],
      createdAt: erpNow(),
      updatedAt: erpNow(),
    };
    doc.items = [item, ...erpList(doc.items)];
    erpWriteCollection(COLLECTIONS.prompts, doc);
    publishLive({ type: 'prompt.created', key });
    return { ok: true, prompt: item };
  }
  const version = Number(existing.version || 1) + 1;
  const next = {
    ...existing,
    title: erpText(payload.title) || existing.title,
    body,
    version,
    history: [{ version, body, at: erpNow(), by: meta.user || 'owner' }, ...erpList(existing.history)].slice(0, 50),
    updatedAt: erpNow(),
  };
  doc.items = erpList(doc.items).map((p) => (p.key === key ? next : p));
  erpWriteCollection(COLLECTIONS.prompts, doc);
  publishLive({ type: 'prompt.versioned', key, version });
  return { ok: true, prompt: next };
}

export function assignModelToTask(payload = {}, meta = {}) {
  ensureAiAgentsEngine();
  const task = erpText(payload.task);
  if (!task) return { ok: false, error: 'TASK_REQUIRED' };
  const preferredProviders = erpList(payload.preferredProviders).map(String).filter(Boolean);
  const doc = erpReadCollection(COLLECTIONS.models);
  const existing = erpList(doc.items).find((m) => m.task === task);
  const next = {
    id: task,
    task,
    preferredProviders: preferredProviders.length ? preferredProviders : existing?.preferredProviders || ['openai', 'gemini'],
    modelHint: erpText(payload.modelHint) || existing?.modelHint || 'auto',
    status: 'active',
    updatedAt: erpNow(),
    updatedBy: meta.user || 'owner',
  };
  if (existing) {
    doc.items = erpList(doc.items).map((m) => (m.task === task ? next : m));
  } else {
    doc.items = [next, ...erpList(doc.items)];
  }
  erpWriteCollection(COLLECTIONS.models, doc);
  publishLive({ type: 'model.assigned', task });
  return { ok: true, assignment: next };
}

export function setAgentStatus(agentKey, status = 'active', meta = {}) {
  ensureAiAgentsEngine();
  const doc = erpReadCollection(COLLECTIONS.agents);
  const agent = erpList(doc.items).find((a) => a.key === agentKey);
  if (!agent) return { ok: false, error: 'AGENT_NOT_FOUND' };
  const next = { ...agent, status, updatedAt: erpNow(), updatedBy: meta.user || 'owner' };
  doc.items = erpList(doc.items).map((a) => (a.key === agentKey ? next : a));
  erpWriteCollection(COLLECTIONS.agents, doc);
  publishLive({ type: 'agent.status', agentKey, status });
  return { ok: true, agent: next };
}

export function getAiAgentsAnalytics() {
  ensureAiAgentsEngine();
  const runs = erpActiveItems(erpReadCollection(COLLECTIONS.runs).items);
  const agents = erpActiveItems(erpReadCollection(COLLECTIONS.agents).items);
  const usage = erpList(erpReadCollection(COLLECTIONS.usage).items);
  const reviews = erpActiveItems(erpReadCollection(COLLECTIONS.reviews).items);
  const byFamily = {};
  const byProvider = {};
  let cost = 0;
  let qualitySum = 0;
  for (const run of runs) {
    byFamily[run.family] = (byFamily[run.family] || 0) + 1;
    byProvider[run.provider] = (byProvider[run.provider] || 0) + 1;
    cost += Number(run.costUsd || 0);
    qualitySum += Number(run.quality || 0);
  }
  const topAgents = [...agents]
    .sort((a, b) => Number(b.runs || 0) - Number(a.runs || 0))
    .slice(0, 10)
    .map((a) => ({ key: a.key, name: a.name, runs: a.runs, avgQuality: a.avgQuality, totalCostUsd: a.totalCostUsd }));

  return {
    totalRuns: runs.length,
    totalAgents: agents.length,
    activeAgents: agents.filter((a) => a.status === 'active').length,
    pendingReviews: reviews.filter((r) => r.status === 'pending').length,
    totalCostUsd: money(cost),
    avgQuality: runs.length ? Number((qualitySum / runs.length).toFixed(3)) : null,
    byFamily,
    byProvider,
    topAgents,
    usageToday: usage.filter((u) => u.day === usageDayKey()),
    llmProviders: providerStatus(),
    orchestratorHealth: orchestratorHealth(),
  };
}

export function getAiAgentsDashboard() {
  ensureAiAgentsEngine();
  const agents = erpActiveItems(erpReadCollection(COLLECTIONS.agents).items);
  const runs = erpActiveItems(erpReadCollection(COLLECTIONS.runs).items).slice(0, 50);
  const memories = erpActiveItems(erpReadCollection(COLLECTIONS.memories).items).slice(0, 40);
  const prompts = erpActiveItems(erpReadCollection(COLLECTIONS.prompts).items);
  const models = erpActiveItems(erpReadCollection(COLLECTIONS.models).items);
  const reviews = erpActiveItems(erpReadCollection(COLLECTIONS.reviews).items).slice(0, 40);
  const usage = erpList(erpReadCollection(COLLECTIONS.usage).items).slice(0, 30);
  const audit = erpActiveItems(erpReadCollection(COLLECTIONS.audit).items).slice(0, 40);
  const analytics = getAiAgentsAnalytics();

  return {
    ok: true,
    generatedAt: erpNow(),
    config: getAiOsConfig(),
    catalog: {
      families: AI_AGENT_FAMILIES.map((f) => ({
        key: f.key,
        label: f.label,
        labelAr: f.labelAr,
        portal: f.portal,
        agentCount: f.agents.length,
      })),
      memoryScopes: AI_MEMORY_SCOPES,
      sharedKnowledge: AI_SHARED_KNOWLEDGE,
      tools: AI_TOOL_CATALOG,
      orchestratorCapabilities: AI_ORCHESTRATOR_CAPABILITIES,
    },
    stats: {
      agents: agents.length,
      activeAgents: agents.filter((a) => a.status === 'active').length,
      runs: analytics.totalRuns,
      pendingReviews: analytics.pendingReviews,
      memories: erpActiveItems(erpReadCollection(COLLECTIONS.memories).items).length,
      prompts: prompts.length,
      costUsd: analytics.totalCostUsd,
      avgQuality: analytics.avgQuality,
      providersConfigured: analytics.llmProviders.filter((p) => p.configured).length,
    },
    agents,
    runs,
    memories,
    prompts,
    models,
    reviews,
    usage,
    audit,
    analytics,
    providers: analytics.llmProviders,
    health: analytics.orchestratorHealth,
  };
}

export async function mutateAiAgentsCenter(action, payload = {}, meta = {}) {
  ensureAiAgentsEngine();
  switch (action) {
    case 'orchestrate':
    case 'runAgent':
    case 'chat':
      return orchestrateAgentRequest(payload, meta);
    case 'writeMemory':
      return writeMemory(payload, meta);
    case 'decideReview':
      return decideHumanReview(payload.reviewId || payload.id, payload, meta);
    case 'upsertPrompt':
      return upsertPromptVersion(payload, meta);
    case 'assignModel':
      return assignModelToTask(payload, meta);
    case 'setAgentStatus':
      return setAgentStatus(payload.agentKey || payload.key, payload.status || 'active', meta);
    case 'setConfig':
      return setAiOsConfig(payload, meta);
    case 'analytics':
      return { ok: true, analytics: getAiAgentsAnalytics() };
    case 'sync':
      return ensureAiAgentsEngine();
    default:
      return { ok: false, error: 'UNKNOWN_ACTION', action };
  }
}

export const AI_AGENTS_MODULE_IDS = Object.freeze([
  'ai-agents-os',
  'ai-orchestrator',
  'ai-student',
  'ai-parent',
  'ai-teacher',
  'ai-school',
  'ai-university',
  'ai-employer',
  'ai-hr',
  'ai-finance',
  'ai-support',
  'ai-content-agents',
  'ai-marketing',
  'ai-sales',
  'ai-legal',
  'ai-owner',
  'ai-memory',
  'ai-governance',
  'ai-providers',
]);
