/**
 * SUCCESS OS — Business Automation Engine
 * Central nervous system: workflows, approvals, rules, scheduler, templates,
 * escalations, internal comms, integrations, and immutable run logs.
 */

import path from 'node:path';
import {
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_APPROVAL_TYPES,
  AUTOMATION_DEFAULT_CONFIG,
  AUTOMATION_EVENT_TYPES,
  AUTOMATION_INTEGRATION_PROVIDERS,
  AUTOMATION_RULE_OPERATORS,
  AUTOMATION_SEED_RULES,
  AUTOMATION_SEED_SCHEDULES,
  AUTOMATION_SEED_TEMPLATES,
  AUTOMATION_SEED_WORKFLOWS,
  AUTOMATION_TEMPLATE_CHANNELS,
} from '../../data/enterprise-automation-catalog.js';
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

const COLLECTIONS = Object.freeze({
  workflows: 'automation-workflows',
  runs: 'automation-runs',
  approvals: 'automation-approvals',
  rules: 'automation-rules',
  schedules: 'automation-schedules',
  templates: 'automation-templates',
  messages: 'automation-messages',
  escalations: 'automation-escalations',
  integrations: 'automation-integrations',
  events: 'automation-events',
});

const CONFIG_FILE = () => path.join(erpRoot(), 'config', 'automation-engine.json');

function liveBus() {
  if (!globalThis.__SUCCESS_OS_AUTOMATION_BUS__) {
    globalThis.__SUCCESS_OS_AUTOMATION_BUS__ = {
      listeners: new Set(),
      lastEvent: null,
      version: 0,
    };
  }
  return globalThis.__SUCCESS_OS_AUTOMATION_BUS__;
}

export function subscribeAutomationLive(listener) {
  const bus = liveBus();
  bus.listeners.add(listener);
  return () => bus.listeners.delete(listener);
}

function publishLive(event) {
  const bus = liveBus();
  bus.version += 1;
  bus.lastEvent = { ...event, version: bus.version, at: erpNow() };
  for (const listener of bus.listeners) {
    try {
      listener(bus.lastEvent);
    } catch {
      /* ignore broken listeners */
    }
  }
}

function ensureCollection(name, seedItems = []) {
  erpEnsureDirs();
  const existing = erpReadJson(path.join(erpRoot(), 'collections', `${name}.json`));
  if (existing) return existing;
  const doc = { items: seedItems, updatedAt: erpNow() };
  erpWriteCollection(name, doc);
  return doc;
}

function upsertByKey(collection, key, factory) {
  const doc = erpReadCollection(collection);
  const items = erpList(doc.items);
  const found = items.find((i) => i.key === key && !i.deletedAt);
  if (found) return { item: found, created: false, doc };
  const item = factory();
  items.unshift(item);
  const next = { items, updatedAt: erpNow() };
  erpWriteCollection(collection, next);
  return { item, created: true, doc: next };
}

export function getAutomationConfig() {
  erpEnsureDirs();
  const existing = erpReadJson(CONFIG_FILE());
  if (existing) return { ...AUTOMATION_DEFAULT_CONFIG, ...existing };
  const seeded = { ...AUTOMATION_DEFAULT_CONFIG, updatedAt: erpNow(), updatedBy: 'system' };
  erpWriteJson(CONFIG_FILE(), seeded);
  return seeded;
}

export function setAutomationConfig(patch = {}, meta = {}) {
  const before = getAutomationConfig();
  const next = {
    ...before,
    ...patch,
    updatedAt: erpNow(),
    updatedBy: meta.user || 'owner',
  };
  erpWriteJson(CONFIG_FILE(), next);
  erpAppendAudit({
    action: 'automation_config',
    moduleId: 'business-automation',
    user: meta.user || 'owner',
    oldValue: before,
    newValue: next,
    reason: meta.reason || 'update_automation_config',
  });
  publishLive({ type: 'config.updated', config: next });
  return { ok: true, config: next };
}

function seedWorkflows() {
  const items = AUTOMATION_SEED_WORKFLOWS.map((wf) => ({
    id: erpId(),
    key: wf.key,
    name: wf.name,
    nameAr: wf.nameAr,
    status: 'active',
    trigger: wf.trigger,
    mode: wf.mode || 'sequential',
    steps: wf.steps || [],
    escalation: {
      afterMinutes: getAutomationConfig().approvalEscalateMinutes,
      toRoles: ['owner', 'admin'],
      notifyChannels: ['push', 'email'],
    },
    rollback: { enabled: true },
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
  return items;
}

function seedRules() {
  return AUTOMATION_SEED_RULES.map((rule) => ({
    id: erpId(),
    ...rule,
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
}

function seedSchedules() {
  return AUTOMATION_SEED_SCHEDULES.map((job) => ({
    id: erpId(),
    ...job,
    lastRunAt: null,
    nextRunAt: null,
    failureCount: 0,
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
}

function seedTemplates() {
  return AUTOMATION_SEED_TEMPLATES.map((tpl) => ({
    id: erpId(),
    ...tpl,
    status: 'active',
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
}

function seedIntegrations() {
  return AUTOMATION_INTEGRATION_PROVIDERS.map((p) => ({
    id: erpId(),
    key: p.key,
    name: p.label,
    status: p.key === 'future' ? 'planned' : 'ready',
    connected: false,
    config: {},
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
}

/** Idempotent bootstrap of all automation collections. */
export function ensureAutomationEngine() {
  getAutomationConfig();
  ensureCollection(COLLECTIONS.workflows, seedWorkflows());
  ensureCollection(COLLECTIONS.runs, []);
  ensureCollection(COLLECTIONS.approvals, []);
  ensureCollection(COLLECTIONS.rules, seedRules());
  ensureCollection(COLLECTIONS.schedules, seedSchedules());
  ensureCollection(COLLECTIONS.templates, seedTemplates());
  ensureCollection(COLLECTIONS.messages, []);
  ensureCollection(COLLECTIONS.escalations, []);
  ensureCollection(COLLECTIONS.integrations, seedIntegrations());
  ensureCollection(COLLECTIONS.events, []);
  // Keep legacy workflow-approvals collection warm for ERP recycle tools.
  ensureCollection('workflow-approvals', []);
  return { ok: true };
}

function renderTemplate(body, vars = {}) {
  return String(body || '').replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = vars[key];
    return value == null ? '' : String(value);
  });
}

function getTemplate(templateKey, lang) {
  const items = erpActiveItems(erpReadCollection(COLLECTIONS.templates).items);
  if (lang) {
    const localized = items.find((t) => t.key === templateKey && t.lang === lang);
    if (localized) return localized;
  }
  return items.find((t) => t.key === templateKey) || null;
}

function compareValue(left, op, right) {
  const lNum = Number(left);
  const rNum = Number(right);
  const bothNum = Number.isFinite(lNum) && Number.isFinite(rNum) && left !== '' && right !== '';
  switch (op) {
    case 'eq':
      return bothNum ? lNum === rNum : String(left) === String(right);
    case 'neq':
      return bothNum ? lNum !== rNum : String(left) !== String(right);
    case 'gt':
      return bothNum ? lNum > rNum : String(left) > String(right);
    case 'gte':
      return bothNum ? lNum >= rNum : String(left) >= String(right);
    case 'lt':
      return bothNum ? lNum < rNum : String(left) < String(right);
    case 'lte':
      return bothNum ? lNum <= rNum : String(left) <= String(right);
    case 'contains':
      return String(left || '').toLowerCase().includes(String(right || '').toLowerCase());
    case 'exists':
      return left != null && left !== '';
    default:
      return false;
  }
}

function evalConditions(conditions = [], payload = {}) {
  if (!conditions.length) return true;
  return conditions.every((c) => compareValue(payload[c.field], c.op, c.value));
}

function pushCollectionItem(collection, item) {
  const doc = erpReadCollection(collection);
  const items = [item, ...erpList(doc.items)].slice(0, 5000);
  erpWriteCollection(collection, { items });
  return item;
}

function updateCollectionItem(collection, id, patch) {
  const doc = erpReadCollection(collection);
  const items = erpList(doc.items).map((item) =>
    item.id === id ? { ...item, ...patch, updatedAt: erpNow() } : item,
  );
  erpWriteCollection(collection, { items });
  return items.find((i) => i.id === id) || null;
}

async function executeAction(actionKey, params = {}, ctx = {}) {
  const started = Date.now();
  const payload = { ...(ctx.eventPayload || {}), ...params };
  const vars = {
    name: payload.name || payload.userName || payload.email || 'User',
    email: payload.email || '',
    amount: payload.grossAmount ?? payload.amount ?? '',
    currency: payload.currency || 'USD',
    daysLeft: payload.daysLeft ?? 7,
    approvalType: payload.approvalType || '',
    partyName: payload.partyName || payload.name || 'Partner',
    date: erpNow().slice(0, 10),
    invoiceNumber: payload.invoiceNumber || `INV-${Date.now()}`,
    receiptNumber: payload.receiptNumber || `RCP-${Date.now()}`,
    courseName: payload.courseName || payload.title || 'Course',
    ...payload,
  };

  const result = { actionKey, ok: true, artifacts: [], message: '' };

  switch (actionKey) {
    case 'create_account': {
      const account = {
        id: erpId(),
        email: payload.email || `${erpId().slice(0, 8)}@success-os.local`,
        name: vars.name,
        role: payload.role || 'student',
        status: 'created',
        createdAt: erpNow(),
        source: 'automation',
      };
      pushCollectionItem('students', {
        id: account.id,
        name: account.name,
        email: account.email,
        status: 'active',
        createdAt: erpNow(),
        updatedAt: erpNow(),
        source: 'automation',
      });
      result.artifacts.push({ type: 'account', id: account.id });
      result.message = 'Account created';
      break;
    }
    case 'assign_role':
    case 'assign_permissions': {
      result.artifacts.push({
        type: actionKey,
        role: payload.role || 'student',
        permissions: payload.permissions || [],
      });
      result.message = `${actionKey} applied`;
      break;
    }
    case 'generate_contract': {
      const tpl = getTemplate(params.templateKey || 'contract_standard', params.lang);
      const contract = {
        id: erpId(),
        employeeName: vars.partyName,
        type: payload.contractType || 'standard',
        status: 'generated',
        body: renderTemplate(tpl?.body || 'Contract for {{partyName}}', vars),
        createdAt: erpNow(),
        updatedAt: erpNow(),
        source: 'automation',
      };
      pushCollectionItem('hr-contracts', contract);
      pushCollectionItem('partner-contracts', {
        id: erpId(),
        name: contract.employeeName,
        status: 'active',
        createdAt: erpNow(),
        updatedAt: erpNow(),
        source: 'automation',
      });
      result.artifacts.push({ type: 'contract', id: contract.id });
      break;
    }
    case 'generate_invoice': {
      const tpl = getTemplate(params.templateKey || 'invoice_standard', params.lang);
      const invoice = {
        id: erpId(),
        number: vars.invoiceNumber,
        amount: Number(vars.amount) || 0,
        currency: vars.currency,
        status: 'issued',
        body: renderTemplate(tpl?.body || '', vars),
        createdAt: erpNow(),
        updatedAt: erpNow(),
        source: 'automation',
        runId: ctx.runId,
      };
      pushCollectionItem('invoices', invoice);
      result.artifacts.push({ type: 'invoice', id: invoice.id, number: invoice.number });
      break;
    }
    case 'generate_receipt': {
      const tpl = getTemplate(params.templateKey || 'receipt_standard', params.lang);
      const receipt = {
        id: erpId(),
        number: vars.receiptNumber,
        amount: Number(vars.amount) || 0,
        currency: vars.currency,
        status: 'issued',
        body: renderTemplate(tpl?.body || '', vars),
        createdAt: erpNow(),
        updatedAt: erpNow(),
        source: 'automation',
        runId: ctx.runId,
      };
      pushCollectionItem('receipts', receipt);
      result.artifacts.push({ type: 'receipt', id: receipt.id });
      break;
    }
    case 'generate_certificate': {
      const tpl = getTemplate(params.templateKey || 'certificate_completion', params.lang);
      const cert = {
        id: erpId(),
        name: vars.name,
        courseName: vars.courseName,
        status: 'issued',
        body: renderTemplate(tpl?.body || '', vars),
        createdAt: erpNow(),
        updatedAt: erpNow(),
        source: 'automation',
      };
      pushCollectionItem('certificates', cert);
      result.artifacts.push({ type: 'certificate', id: cert.id });
      break;
    }
    case 'generate_notification':
    case 'generate_email':
    case 'generate_welcome':
    case 'send_reminder':
    case 'send_sms':
    case 'send_whatsapp':
    case 'send_push':
    case 'notify_finance':
    case 'notify_academic':
    case 'notify_students': {
      const channel =
        actionKey === 'generate_email' || actionKey === 'generate_welcome'
          ? 'email'
          : actionKey === 'send_sms'
            ? 'sms'
            : actionKey === 'send_whatsapp'
              ? 'whatsapp'
              : 'push';
      const tpl = getTemplate(params.templateKey || (actionKey === 'generate_welcome' ? 'welcome_student' : 'approval_pending'), params.lang || 'ar');
      const job = {
        id: erpId(),
        name: params.title || actionKey,
        channel,
        audience: params.audience || payload.audience || 'system',
        subject: renderTemplate(tpl?.subject || actionKey, vars),
        body: renderTemplate(tpl?.body || actionKey, vars),
        status: 'queued',
        createdAt: erpNow(),
        updatedAt: erpNow(),
        source: 'automation',
        runId: ctx.runId,
      };
      pushCollectionItem('notification-jobs', job);
      if (['notify_finance', 'notify_academic', 'generate_welcome'].includes(actionKey)) {
        pushCollectionItem(COLLECTIONS.messages, {
          id: erpId(),
          type: actionKey === 'notify_finance' ? 'department' : 'announcement',
          department: actionKey === 'notify_finance' ? 'finance' : actionKey === 'notify_academic' ? 'academic' : 'general',
          title: job.subject,
          body: job.body,
          mentions: params.mentions || [],
          status: 'unread',
          createdAt: erpNow(),
          updatedAt: erpNow(),
          runId: ctx.runId,
        });
      }
      result.artifacts.push({ type: 'notification', id: job.id, channel });
      result.message = `${channel} queued`;
      break;
    }
    case 'assign_task':
    case 'assign_manager':
    case 'assign_academic_supervisor': {
      const task = {
        id: erpId(),
        title: params.title || actionKey,
        assignee: params.assignee || payload.manager || payload.supervisor || 'owner',
        status: 'open',
        priority: params.priority || 'normal',
        dueAt: params.dueAt || null,
        createdAt: erpNow(),
        updatedAt: erpNow(),
        source: 'automation',
        runId: ctx.runId,
      };
      pushCollectionItem('tasks', task);
      result.artifacts.push({ type: 'task', id: task.id });
      break;
    }
    case 'create_dashboard': {
      result.artifacts.push({
        type: 'dashboard',
        href: payload.dashboardPath || `/dashboard/${payload.role || 'student'}`,
        role: payload.role || 'student',
      });
      result.message = 'Dashboard provisioned';
      break;
    }
    case 'assign_curriculum': {
      result.artifacts.push({
        type: 'curriculum',
        curriculumId: payload.curriculumId || 'default-national',
        grade: payload.grade || null,
      });
      break;
    }
    case 'activate_account':
    case 'publish_profile':
    case 'enable_bookings': {
      result.artifacts.push({ type: 'account_flag', flag: actionKey, value: true });
      break;
    }
    case 'split_revenue':
    case 'queue_payout': {
      if (actionKey === 'queue_payout') {
        const payout = {
          id: erpId(),
          amount: Number(vars.amount) || 0,
          currency: vars.currency,
          status: 'queued',
          partnerId: payload.partnerId || null,
          createdAt: erpNow(),
          updatedAt: erpNow(),
          source: 'automation',
          runId: ctx.runId,
        };
        pushCollectionItem('payouts', payout);
        result.artifacts.push({ type: 'payout', id: payout.id });
      } else {
        result.artifacts.push({
          type: 'split',
          grossAmount: Number(vars.amount) || 0,
          note: 'Revenue split recorded by automation',
        });
      }
      break;
    }
    case 'update_analytics': {
      result.artifacts.push({ type: 'analytics', updated: true, at: erpNow() });
      break;
    }
    case 'suspend_partner': {
      const partners = erpReadCollection('partners');
      const partnerId = payload.partnerId;
      if (partnerId) {
        const items = erpList(partners.items).map((p) =>
          p.id === partnerId ? { ...p, status: 'suspended', updatedAt: erpNow(), suspendedBy: 'automation' } : p,
        );
        erpWriteCollection('partners', { items });
      }
      result.artifacts.push({ type: 'partner', id: partnerId || null, status: 'suspended' });
      break;
    }
    case 'escalate': {
      const esc = {
        id: erpId(),
        reason: params.reason || payload.reason || 'escalation',
        target: params.target || 'owner',
        entityType: params.entityType || 'approval',
        entityId: params.entityId || payload.approvalId || null,
        status: 'open',
        createdAt: erpNow(),
        updatedAt: erpNow(),
        runId: ctx.runId,
      };
      pushCollectionItem(COLLECTIONS.escalations, esc);
      result.artifacts.push({ type: 'escalation', id: esc.id });
      break;
    }
    case 'integration_call': {
      const provider = params.provider || 'future';
      result.artifacts.push({
        type: 'integration',
        provider,
        status: 'queued',
        payload: params.payload || {},
      });
      result.message = `Integration ${provider} queued`;
      break;
    }
    default: {
      result.ok = false;
      result.message = `Unknown action: ${actionKey}`;
    }
  }

  result.executionMs = Date.now() - started;
  return result;
}

async function runStep(stepDef, ctx) {
  const startedAt = erpNow();
  const startedMs = Date.now();
  const base = {
    stepId: stepDef.id,
    type: stepDef.type,
    name: stepDef.name,
    startedAt,
    status: 'running',
  };

  try {
    if (stepDef.type === 'timer') {
      // Timers are recorded; scheduler/job runner advances delayed work.
      return {
        ...base,
        status: 'completed',
        finishedAt: erpNow(),
        executionMs: Date.now() - startedMs,
        result: { delayed: true, delayMs: stepDef.delayMs || 0, params: stepDef.params || {} },
      };
    }

    if (stepDef.type === 'condition') {
      const pass = evalConditions(stepDef.condition ? [stepDef.condition] : [], ctx.eventPayload || {});
      const branch = pass ? stepDef.thenSteps || [] : stepDef.elseSteps || [];
      const branchResults = [];
      for (const child of branch) {
        branchResults.push(await runStep(child, ctx));
      }
      return {
        ...base,
        status: 'completed',
        finishedAt: erpNow(),
        executionMs: Date.now() - startedMs,
        result: { conditionPassed: pass, branchResults },
      };
    }

    if (stepDef.type === 'parallel') {
      const kids = stepDef.parallelSteps || [];
      const branchResults = await Promise.all(kids.map((child) => runStep(child, ctx)));
      const failed = branchResults.some((r) => r.status === 'failed');
      return {
        ...base,
        status: failed ? 'failed' : 'completed',
        finishedAt: erpNow(),
        executionMs: Date.now() - startedMs,
        result: { branchResults },
        error: failed ? 'One or more parallel steps failed' : null,
      };
    }

    if (stepDef.type === 'approval') {
      const approval = {
        id: erpId(),
        approvalType: stepDef.approvalType || 'system_settings',
        title: stepDef.name || stepDef.approvalType,
        status: 'pending',
        assignees: stepDef.assignees || ['owner', 'admin'],
        requestedBy: ctx.user || 'system',
        payload: ctx.eventPayload || {},
        workflowId: ctx.workflow.id,
        workflowKey: ctx.workflow.key,
        runId: ctx.runId,
        stepId: stepDef.id,
        notes: [],
        escalateAfterMinutes: stepDef.escalateAfterMinutes || getAutomationConfig().approvalEscalateMinutes,
        createdAt: erpNow(),
        updatedAt: erpNow(),
      };
      pushCollectionItem(COLLECTIONS.approvals, approval);
      pushCollectionItem('workflow-approvals', {
        id: approval.id,
        name: approval.title,
        type: approval.approvalType,
        status: 'pending',
        createdAt: approval.createdAt,
        updatedAt: approval.updatedAt,
      });
      pushCollectionItem(COLLECTIONS.messages, {
        id: erpId(),
        type: 'approval_note',
        title: `Approval required · ${approval.approvalType}`,
        body: 'A workflow is waiting for manual approval.',
        approvalId: approval.id,
        status: 'unread',
        createdAt: erpNow(),
        updatedAt: erpNow(),
      });
      publishLive({ type: 'approval.created', approvalId: approval.id });
      return {
        ...base,
        status: 'waiting_approval',
        finishedAt: erpNow(),
        executionMs: Date.now() - startedMs,
        result: { approvalId: approval.id, approvalType: approval.approvalType },
      };
    }

    // Automatic action (with retries)
    const retries = Number(stepDef.retries ?? getAutomationConfig().maxRetries) || 1;
    let lastError = null;
    for (let attempt = 1; attempt <= retries; attempt += 1) {
      const actionResult = await executeAction(stepDef.actionKey, stepDef.params || {}, ctx);
      if (actionResult.ok) {
        return {
          ...base,
          status: 'completed',
          finishedAt: erpNow(),
          executionMs: Date.now() - startedMs,
          result: { ...actionResult, attempt },
        };
      }
      lastError = actionResult.message || 'ACTION_FAILED';
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, getAutomationConfig().retryDelayMs || 200));
      }
    }

    if (stepDef.onFailure === 'escalate') {
      await executeAction('escalate', {
        reason: lastError,
        entityType: 'step',
        entityId: stepDef.id,
      }, ctx);
    }

    return {
      ...base,
      status: 'failed',
      finishedAt: erpNow(),
      executionMs: Date.now() - startedMs,
      error: lastError,
    };
  } catch (error) {
    return {
      ...base,
      status: 'failed',
      finishedAt: erpNow(),
      executionMs: Date.now() - startedMs,
      error: error.message || 'STEP_FAILED',
    };
  }
}

async function executeWorkflow(workflow, eventPayload = {}, meta = {}) {
  const runId = erpId();
  const startedAt = erpNow();
  const startedMs = Date.now();
  const ctx = {
    runId,
    workflow,
    eventPayload,
    user: meta.user || 'system',
  };

  const stepResults = [];
  let status = 'completed';
  let waitingApproval = false;

  if (workflow.mode === 'parallel') {
    const results = await Promise.all((workflow.steps || []).map((s) => runStep(s, ctx)));
    stepResults.push(...results);
  } else {
    for (const s of workflow.steps || []) {
      const result = await runStep(s, ctx);
      stepResults.push(result);
      if (result.status === 'waiting_approval') {
        waitingApproval = true;
        status = 'waiting_approval';
        break;
      }
      if (result.status === 'failed') {
        status = 'failed';
        break;
      }
    }
  }

  if (!waitingApproval && stepResults.some((r) => r.status === 'failed')) {
    status = 'failed';
  } else if (!waitingApproval && stepResults.every((r) => r.status === 'completed' || r.status === 'waiting_approval')) {
    status = waitingApproval ? 'waiting_approval' : 'completed';
  }

  const run = {
    id: runId,
    workflowId: workflow.id,
    workflowKey: workflow.key,
    workflowName: workflow.name,
    trigger: meta.trigger || workflow.trigger?.eventKey || 'manual',
    eventKey: meta.eventKey || workflow.trigger?.eventKey || null,
    actions: stepResults.map((s) => s.name || s.stepId),
    status,
    startedAt,
    finishedAt: erpNow(),
    executionMs: Date.now() - startedMs,
    user: meta.user || 'system',
    eventPayload,
    steps: stepResults,
    errors: stepResults.filter((s) => s.error).map((s) => ({ stepId: s.stepId, error: s.error })),
    rollback: {
      enabled: Boolean(workflow.rollback?.enabled),
      available: status === 'failed',
      info: status === 'failed' ? 'Artifacts remain; owner can reverse via recycle/audit tools.' : null,
    },
    createdAt: startedAt,
    updatedAt: erpNow(),
  };

  pushCollectionItem(COLLECTIONS.runs, run);
  erpAppendAudit({
    action: 'automation_run',
    moduleId: 'business-automation',
    user: run.user,
    newValue: { runId, workflowKey: workflow.key, status },
    reason: run.trigger,
  });
  publishLive({ type: 'workflow.finished', runId, status, workflowKey: workflow.key });
  return run;
}

function listActiveWorkflows() {
  return erpActiveItems(erpReadCollection(COLLECTIONS.workflows).items).filter((w) => w.status === 'active');
}

function listActiveRules() {
  return erpActiveItems(erpReadCollection(COLLECTIONS.rules).items).filter((r) => r.status === 'active');
}

async function applySmartRules(eventKey, payload, meta = {}) {
  const matched = [];
  for (const rule of listActiveRules()) {
    if (rule.eventKey && rule.eventKey !== eventKey) continue;
    if (!evalConditions(rule.conditions || [], payload)) continue;
    const actionResults = [];
    for (const action of rule.actions || []) {
      actionResults.push(await executeAction(action.actionKey, action.params || {}, {
        runId: meta.runId || null,
        eventPayload: payload,
        user: meta.user || 'system',
      }));
    }
    matched.push({ ruleKey: rule.key, actionResults });
    publishLive({ type: 'rule.matched', ruleKey: rule.key, eventKey });
  }
  return matched;
}

/** Emit a domain event — triggers matching workflows + smart rules. */
export async function emitAutomationEvent(eventKey, payload = {}, meta = {}) {
  ensureAutomationEngine();
  const event = {
    id: erpId(),
    eventKey,
    payload,
    user: meta.user || 'system',
    at: erpNow(),
  };
  pushCollectionItem(COLLECTIONS.events, event);
  publishLive({ type: 'event', eventKey, eventId: event.id });

  const ruleMatches = await applySmartRules(eventKey, payload, meta);
  const runs = [];
  for (const workflow of listActiveWorkflows()) {
    if (workflow.trigger?.type === 'event' && workflow.trigger.eventKey === eventKey) {
      runs.push(await executeWorkflow(workflow, payload, {
        user: meta.user || 'system',
        trigger: eventKey,
        eventKey,
      }));
    }
  }

  return {
    ok: true,
    event,
    runs,
    ruleMatches,
    dashboardBump: true,
  };
}

export async function runWorkflowByKey(workflowKey, payload = {}, meta = {}) {
  ensureAutomationEngine();
  const workflow = listActiveWorkflows().find((w) => w.key === workflowKey || w.id === workflowKey);
  if (!workflow) return { ok: false, error: 'WORKFLOW_NOT_FOUND' };
  const run = await executeWorkflow(workflow, payload, {
    user: meta.user || 'owner',
    trigger: 'manual',
    eventKey: 'manual.trigger',
  });
  return { ok: true, run };
}

export async function decideApproval(approvalId, decision, meta = {}) {
  ensureAutomationEngine();
  const approval = updateCollectionItem(COLLECTIONS.approvals, approvalId, {
    status: decision === 'approve' ? 'approved' : 'rejected',
    decidedBy: meta.user || 'owner',
    decisionNote: meta.note || '',
    decidedAt: erpNow(),
  });
  if (!approval) return { ok: false, error: 'APPROVAL_NOT_FOUND' };

  updateCollectionItem('workflow-approvals', approvalId, {
    status: approval.status,
  });

  pushCollectionItem(COLLECTIONS.messages, {
    id: erpId(),
    type: 'approval_note',
    title: `Approval ${approval.status}`,
    body: meta.note || `Decision: ${approval.status}`,
    approvalId,
    status: 'unread',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  });

  // Continue post-approval automation for approved requests.
  if (decision === 'approve') {
    await emitAutomationEvent(
      approval.approvalType === 'teacher_registration' ? 'teacher.approved' : 'manual.trigger',
      {
        ...approval.payload,
        approvalId,
        approvalType: approval.approvalType,
        approved: true,
      },
      { user: meta.user || 'owner' },
    );
  }

  // Resume parent run status
  if (approval.runId) {
    updateCollectionItem(COLLECTIONS.runs, approval.runId, {
      status: decision === 'approve' ? 'completed' : 'rejected',
      approvalDecision: approval.status,
    });
  }

  publishLive({ type: 'approval.decided', approvalId, status: approval.status });
  erpAppendAudit({
    action: 'automation_approval',
    moduleId: 'approval-center',
    user: meta.user || 'owner',
    newValue: { approvalId, status: approval.status },
    reason: meta.note || decision,
  });

  return { ok: true, approval };
}

export function createAutomationMessage(payload = {}, meta = {}) {
  ensureAutomationEngine();
  const message = {
    id: erpId(),
    type: payload.type || 'inbox',
    department: payload.department || 'general',
    title: erpText(payload.title) || 'Message',
    body: erpText(payload.body) || '',
    mentions: payload.mentions || [],
    taskId: payload.taskId || null,
    approvalId: payload.approvalId || null,
    from: meta.user || 'owner',
    status: 'unread',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushCollectionItem(COLLECTIONS.messages, message);
  publishLive({ type: 'message.created', messageId: message.id });
  return { ok: true, message };
}

export function mutateAutomationEntity(collectionKey, action, payload = {}, meta = {}) {
  ensureAutomationEngine();
  const collection = COLLECTIONS[collectionKey] || collectionKey;
  if (action === 'create' || action === 'add') {
    const item = {
      id: erpId(),
      status: payload.status || 'active',
      ...payload,
      createdAt: erpNow(),
      updatedAt: erpNow(),
      createdBy: meta.user || 'owner',
    };
    pushCollectionItem(collection, item);
    publishLive({ type: `${collectionKey}.created`, id: item.id });
    return { ok: true, item };
  }
  if (action === 'update' || action === 'edit') {
    const item = updateCollectionItem(collection, payload.id, payload);
    if (!item) return { ok: false, error: 'NOT_FOUND' };
    publishLive({ type: `${collectionKey}.updated`, id: item.id });
    return { ok: true, item };
  }
  if (action === 'delete') {
    const item = updateCollectionItem(collection, payload.id, {
      deletedAt: erpNow(),
      status: 'deleted',
    });
    return { ok: Boolean(item), item };
  }
  return { ok: false, error: 'UNKNOWN_ACTION' };
}

function dueForCadence(job, now = new Date()) {
  if (!job.lastRunAt) return true;
  const last = new Date(job.lastRunAt).getTime();
  const ageMs = now.getTime() - last;
  switch (job.cadence) {
    case 'daily':
      return ageMs >= 20 * 60 * 60 * 1000;
    case 'weekly':
      return ageMs >= 6 * 24 * 60 * 60 * 1000;
    case 'monthly':
      return ageMs >= 27 * 24 * 60 * 60 * 1000;
    case 'yearly':
      return ageMs >= 360 * 24 * 60 * 60 * 1000;
    case 'cron':
      return ageMs >= 60 * 60 * 1000;
    default:
      return ageMs >= 24 * 60 * 60 * 1000;
  }
}

async function runScheduledJob(job, meta = {}) {
  const started = Date.now();
  try {
    if (job.jobKey === 'escalation_sweep') {
      await sweepEscalations(meta);
    } else if (job.jobKey === 'inactive_partners') {
      await emitAutomationEvent('partner.inactive', { inactiveDays: getAutomationConfig().partnerInactiveGraceDays }, meta);
    } else if (job.jobKey === 'payroll_prep') {
      await emitAutomationEvent('payroll.run', { phase: 'prep' }, meta);
    } else if (job.jobKey === 'yearly_archive') {
      // Soft marker only — runs stay in collection with archive flag on older rows.
      const runs = erpReadCollection(COLLECTIONS.runs);
      const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
      const items = erpList(runs.items).map((r) =>
        new Date(r.createdAt || 0).getTime() < cutoff ? { ...r, archivedAt: erpNow() } : r,
      );
      erpWriteCollection(COLLECTIONS.runs, { items });
    } else {
      await emitAutomationEvent('manual.trigger', { scheduledJob: job.key }, meta);
    }
    updateCollectionItem(COLLECTIONS.schedules, job.id, {
      lastRunAt: erpNow(),
      failureCount: 0,
      lastError: null,
      lastDurationMs: Date.now() - started,
    });
    return { ok: true, jobKey: job.jobKey };
  } catch (error) {
    updateCollectionItem(COLLECTIONS.schedules, job.id, {
      failureCount: Number(job.failureCount || 0) + 1,
      lastError: error.message || 'JOB_FAILED',
      lastDurationMs: Date.now() - started,
    });
    return { ok: false, error: error.message || 'JOB_FAILED', jobKey: job.jobKey };
  }
}

export async function sweepEscalations(meta = {}) {
  ensureAutomationEngine();
  const config = getAutomationConfig();
  const now = Date.now();
  const created = [];

  const approvals = erpActiveItems(erpReadCollection(COLLECTIONS.approvals).items).filter((a) => a.status === 'pending');
  for (const approval of approvals) {
    const ageMin = (now - new Date(approval.createdAt).getTime()) / 60000;
    const limit = approval.escalateAfterMinutes || config.approvalEscalateMinutes;
    if (ageMin >= limit) {
      const esc = {
        id: erpId(),
        reason: 'pending_approval',
        target: 'owner',
        entityType: 'approval',
        entityId: approval.id,
        status: 'open',
        createdAt: erpNow(),
        updatedAt: erpNow(),
      };
      pushCollectionItem(COLLECTIONS.escalations, esc);
      created.push(esc);
      await executeAction('generate_notification', {
        templateKey: 'approval_pending',
        audience: 'owner',
      }, { user: meta.user || 'system', eventPayload: { approvalType: approval.approvalType } });
    }
  }

  const tasks = erpActiveItems(erpReadCollection('tasks').items).filter((t) =>
    ['open', 'pending_approval', 'in_progress'].includes(t.status),
  );
  for (const task of tasks) {
    if (!task.dueAt) continue;
    if (new Date(task.dueAt).getTime() >= now) continue;
    const esc = {
      id: erpId(),
      reason: 'late_task',
      target: task.assignee || 'owner',
      entityType: 'task',
      entityId: task.id,
      status: 'open',
      createdAt: erpNow(),
      updatedAt: erpNow(),
    };
    pushCollectionItem(COLLECTIONS.escalations, esc);
    created.push(esc);
  }

  publishLive({ type: 'escalation.sweep', count: created.length });
  return { ok: true, created: created.length, items: created };
}

/** Tick scheduler — daily/weekly/monthly/yearly/cron with retries + failure recovery. */
export async function tickAutomationScheduler(meta = {}) {
  ensureAutomationEngine();
  const jobs = erpActiveItems(erpReadCollection(COLLECTIONS.schedules).items).filter((j) => j.status === 'active');
  const results = [];
  for (const job of jobs) {
    if (!dueForCadence(job)) continue;
    // Failure recovery: retry failed jobs up to maxRetries
    if (Number(job.failureCount || 0) >= (getAutomationConfig().maxRetries || 3)) {
      results.push({ jobKey: job.jobKey, skipped: true, reason: 'max_failures' });
      continue;
    }
    results.push(await runScheduledJob(job, meta));
  }
  publishLive({ type: 'scheduler.tick', results });
  return { ok: true, results, timezone: getAutomationConfig().defaultTimezone };
}

export function getAutomationDashboard() {
  ensureAutomationEngine();
  const workflows = erpActiveItems(erpReadCollection(COLLECTIONS.workflows).items);
  const runs = erpList(erpReadCollection(COLLECTIONS.runs).items);
  const approvals = erpActiveItems(erpReadCollection(COLLECTIONS.approvals).items);
  const rules = erpActiveItems(erpReadCollection(COLLECTIONS.rules).items);
  const schedules = erpActiveItems(erpReadCollection(COLLECTIONS.schedules).items);
  const templates = erpActiveItems(erpReadCollection(COLLECTIONS.templates).items);
  const messages = erpActiveItems(erpReadCollection(COLLECTIONS.messages).items);
  const escalations = erpActiveItems(erpReadCollection(COLLECTIONS.escalations).items);
  const integrations = erpActiveItems(erpReadCollection(COLLECTIONS.integrations).items);
  const events = erpList(erpReadCollection(COLLECTIONS.events).items);

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const openEscalations = escalations.filter((e) => e.status === 'open');
  const recentRuns = runs.slice(0, 25);
  const failedRuns = runs.filter((r) => r.status === 'failed').slice(0, 10);

  return {
    ok: true,
    generatedAt: erpNow(),
    config: getAutomationConfig(),
    catalog: {
      events: AUTOMATION_EVENT_TYPES,
      actions: AUTOMATION_ACTION_TYPES,
      approvalTypes: AUTOMATION_APPROVAL_TYPES,
      operators: AUTOMATION_RULE_OPERATORS,
      templateChannels: AUTOMATION_TEMPLATE_CHANNELS,
      integrations: AUTOMATION_INTEGRATION_PROVIDERS,
    },
    stats: {
      workflows: workflows.length,
      activeWorkflows: workflows.filter((w) => w.status === 'active').length,
      runs: runs.length,
      pendingApprovals: pendingApprovals.length,
      rules: rules.length,
      schedules: schedules.length,
      templates: templates.length,
      unreadMessages: messages.filter((m) => m.status === 'unread').length,
      openEscalations: openEscalations.length,
      integrations: integrations.length,
      events: events.length,
      failedRuns: failedRuns.length,
    },
    workflows: workflows.slice(0, 200),
    runs: recentRuns,
    approvals: pendingApprovals.concat(approvals.filter((a) => a.status !== 'pending')).slice(0, 100),
    rules,
    schedules,
    templates,
    messages: messages.slice(0, 100),
    escalations: openEscalations.concat(escalations.filter((e) => e.status !== 'open')).slice(0, 100),
    integrations,
    events: events.slice(0, 50),
    liveVersion: liveBus().version,
    lastLiveEvent: liveBus().lastEvent,
  };
}

export function listAutomationModule(moduleId, query = {}) {
  ensureAutomationEngine();
  const map = {
    'business-automation': null,
    'approval-center': COLLECTIONS.approvals,
    'automation-workflows': COLLECTIONS.workflows,
    'automation-runs': COLLECTIONS.runs,
    'automation-rules': COLLECTIONS.rules,
    'automation-schedules': COLLECTIONS.schedules,
    'automation-templates': COLLECTIONS.templates,
    'automation-inbox': COLLECTIONS.messages,
    'automation-escalations': COLLECTIONS.escalations,
    'automation-integrations': COLLECTIONS.integrations,
  };

  if (moduleId === 'business-automation') {
    return getAutomationDashboard();
  }

  const collection = map[moduleId];
  if (!collection) return { ok: false, error: 'UNKNOWN_AUTOMATION_MODULE' };

  let items = erpActiveItems(erpReadCollection(collection).items);
  const q = erpText(query.q).toLowerCase();
  const status = erpText(query.status);
  if (q) {
    items = items.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }
  if (status) {
    items = items.filter((item) => item.status === status);
  }
  return {
    ok: true,
    moduleId,
    total: items.length,
    items: items.slice(0, Number(query.pageSize) || 200),
    generatedAt: erpNow(),
  };
}

export async function mutateAutomationCenter(action, payload = {}, meta = {}) {
  ensureAutomationEngine();
  switch (action) {
    case 'emitEvent':
      return emitAutomationEvent(payload.eventKey, payload.payload || payload.data || {}, meta);
    case 'runWorkflow':
      return runWorkflowByKey(payload.workflowKey || payload.id, payload.payload || {}, meta);
    case 'approve':
      return decideApproval(payload.id || payload.approvalId, 'approve', meta);
    case 'reject':
      return decideApproval(payload.id || payload.approvalId, 'reject', meta);
    case 'tickScheduler':
      return tickAutomationScheduler(meta);
    case 'sweepEscalations':
      return sweepEscalations(meta);
    case 'setConfig':
      return setAutomationConfig(payload, meta);
    case 'createMessage':
      return createAutomationMessage(payload, meta);
    case 'saveWorkflow':
      return mutateAutomationEntity('workflows', payload.id ? 'update' : 'create', payload, meta);
    case 'saveRule':
      return mutateAutomationEntity('rules', payload.id ? 'update' : 'create', payload, meta);
    case 'saveSchedule':
      return mutateAutomationEntity('schedules', payload.id ? 'update' : 'create', payload, meta);
    case 'saveTemplate':
      return mutateAutomationEntity('templates', payload.id ? 'update' : 'create', payload, meta);
    case 'saveIntegration':
      return mutateAutomationEntity('integrations', payload.id ? 'update' : 'create', payload, meta);
    case 'seed':
      // Force re-seed missing keys only
      for (const wf of AUTOMATION_SEED_WORKFLOWS) {
        upsertByKey(COLLECTIONS.workflows, wf.key, () => ({
          id: erpId(),
          key: wf.key,
          name: wf.name,
          nameAr: wf.nameAr,
          status: 'active',
          trigger: wf.trigger,
          mode: wf.mode || 'sequential',
          steps: wf.steps || [],
          createdAt: erpNow(),
          updatedAt: erpNow(),
          source: 'seed',
        }));
      }
      return { ok: true, seeded: true, dashboard: getAutomationDashboard() };
    default:
      return { ok: false, error: 'UNKNOWN_AUTOMATION_ACTION' };
  }
}

export const AUTOMATION_MODULE_IDS = Object.freeze([
  'business-automation',
  'approval-center',
  'automation-workflows',
  'automation-runs',
  'automation-rules',
  'automation-schedules',
  'automation-templates',
  'automation-inbox',
  'automation-escalations',
  'automation-integrations',
]);
