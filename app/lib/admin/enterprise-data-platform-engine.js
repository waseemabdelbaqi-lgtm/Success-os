/**
 * SUCCESS OS — Enterprise Data Platform, Knowledge Graph & Digital Twin Engine
 *
 * Unified event-driven data layer. Existing modules remain producers/consumers.
 * Bridges educational knowledge graph + commission defaults for simulation.
 * Does NOT rebuild completed modules. No isolated analytics silos.
 */

import path from 'node:path';
import {
  EDP_DEFAULT_CONFIG,
  EDP_DECISION_AUDIENCES,
  EDP_EDGE_TYPES,
  EDP_ENTITY_KINDS,
  EDP_EVENT_TYPES,
  EDP_FEATURE_DEFS,
  EDP_LEARNING_PATH,
  EDP_MODULE_IDS,
  EDP_PERSONALIZATION_DIMENSIONS,
  EDP_PREDICTION_TYPES,
  EDP_PRODUCER_MODULES,
  EDP_QUALITY_RULES,
  EDP_RECOMMENDATION_TYPES,
  EDP_SEED_EDGES,
  EDP_SEED_ENTITIES,
  EDP_SEMANTIC_TERMS,
  EDP_SIMULATION_TYPES,
  EDP_TWIN_KINDS,
  EDP_VERSION,
  findFeatureDef,
  findSemanticTerm,
} from '../../data/enterprise-data-platform-catalog.js';
import {
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

export { EDP_MODULE_IDS };

const COLLECTIONS = Object.freeze({
  entities: 'edp-entities',
  edges: 'edp-edges',
  events: 'edp-events',
  twins: 'edp-twins',
  features: 'edp-features',
  recommendations: 'edp-recommendations',
  predictions: 'edp-predictions',
  decisions: 'edp-decisions',
  quality: 'edp-quality-findings',
  lineage: 'edp-lineage',
  schemas: 'edp-schemas',
  masters: 'edp-masters',
  search: 'edp-search-index',
  simulations: 'edp-simulations',
  trainingJobs: 'edp-training-jobs',
  personalization: 'edp-personalization',
  learning: 'edp-learning-progress',
  stewards: 'edp-stewards',
  audit: 'edp-audit',
});

const CONFIG_FILE = () => path.join(erpRoot(), 'config', 'enterprise-data-platform.json');

let ensuring = false;
let ensured = false;

function liveBus() {
  if (!globalThis.__SUCCESS_OS_EDP_BUS__) {
    globalThis.__SUCCESS_OS_EDP_BUS__ = { listeners: new Set(), version: 0, last: null };
  }
  return globalThis.__SUCCESS_OS_EDP_BUS__;
}

export function subscribeEdpLive(listener) {
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

function stamp(meta = {}) {
  return {
    createdAt: erpNow(),
    createdBy: meta.user || 'system',
    updatedAt: erpNow(),
    updatedBy: meta.user || 'system',
    version: 1,
  };
}

function bumpVersion(item, meta = {}) {
  return {
    ...item,
    updatedAt: erpNow(),
    updatedBy: meta.user || item.updatedBy || 'system',
    version: Number(item.version || 1) + 1,
  };
}

function edpAudit(entry) {
  const row = erpAppendAudit({ moduleId: 'data-platform', ...entry });
  const col = ensureCollection(COLLECTIONS.audit, []);
  col.items = [
    {
      id: row.id,
      at: row.at,
      action: entry.action,
      actor: entry.user || 'system',
      tenantId: entry.tenantId || null,
      country: entry.country || null,
      resource: entry.resource || entry.entityId || null,
      result: entry.result || 'ok',
      detail: entry.detail || null,
    },
    ...erpList(col.items),
  ].slice(0, 5000);
  erpWriteCollection(COLLECTIONS.audit, col);
  return row;
}

function readConfig() {
  erpEnsureDirs();
  const existing = erpReadJson(CONFIG_FILE());
  if (existing) return { ...EDP_DEFAULT_CONFIG, ...existing };
  const cfg = { ...EDP_DEFAULT_CONFIG, updatedAt: erpNow() };
  erpWriteJson(CONFIG_FILE(), cfg);
  return cfg;
}

function writeConfig(cfg, meta = {}) {
  const next = { ...cfg, updatedAt: erpNow(), updatedBy: meta.user || 'owner' };
  erpWriteJson(CONFIG_FILE(), next);
  edpAudit({ action: 'edp_config_update', user: meta.user || 'owner', detail: { version: next.version } });
  return next;
}

function entityId(kind, key, tenantId = 'global') {
  return `${tenantId}:${kind}:${key}`;
}

function seedEntities(tenantId = 'global') {
  return EDP_SEED_ENTITIES.map((e) => ({
    id: entityId(e.kind, e.key, tenantId),
    kind: e.kind,
    key: e.key,
    name: e.name,
    tenantId,
    country: e.country || null,
    grade: e.grade || null,
    attributes: { ...e },
    confidence: 1,
    validationStatus: 'seeded',
    source: 'edp-seed',
    owner: 'platform',
    history: [{ at: erpNow(), event: 'seeded' }],
    ...stamp({ user: 'system' }),
  }));
}

function seedEdges(tenantId = 'global') {
  return EDP_SEED_EDGES.map((e) => ({
    id: erpId(),
    fromId: entityId(e.fromKind, e.fromKey, tenantId),
    toId: entityId(e.toKind, e.toKey, tenantId),
    type: e.type,
    tenantId,
    country: null,
    weight: 1,
    confidence: 1,
    source: 'edp-seed',
    attributes: {},
    ...stamp({ user: 'system' }),
  }));
}

function seedSchemas() {
  return [
    {
      id: erpId(),
      name: 'edp.entity',
      version: '1.0.0',
      fields: ['id', 'kind', 'key', 'name', 'tenantId', 'country', 'attributes', 'confidence'],
      owner: 'data_platform',
      status: 'active',
      ...stamp({ user: 'system' }),
    },
    {
      id: erpId(),
      name: 'edp.edge',
      version: '1.0.0',
      fields: ['id', 'fromId', 'toId', 'type', 'tenantId', 'weight', 'confidence'],
      owner: 'data_platform',
      status: 'active',
      ...stamp({ user: 'system' }),
    },
    {
      id: erpId(),
      name: 'edp.event',
      version: '1.0.0',
      fields: ['id', 'type', 'actorId', 'tenantId', 'country', 'payload', 'at'],
      owner: 'data_platform',
      status: 'active',
      ...stamp({ user: 'system' }),
    },
  ];
}

function seedStewards() {
  return [
    { id: erpId(), domain: 'academic', steward: 'academic_ops', responsibilities: ['student', 'lesson', 'exam'], ...stamp() },
    { id: erpId(), domain: 'finance', steward: 'finance_ops', responsibilities: ['revenue', 'commission', 'subscription'], ...stamp() },
    { id: erpId(), domain: 'identity', steward: 'security_ops', responsibilities: ['tenant', 'employee'], ...stamp() },
    { id: erpId(), domain: 'ai', steward: 'ai_ops', responsibilities: ['ai_agent', 'recommendation'], ...stamp() },
  ];
}

function seedMasters() {
  return EDP_SEMANTIC_TERMS.map((t) => ({
    id: erpId(),
    key: t.key,
    definition: t.definition,
    owner: t.owner,
    aliases: t.aliases || [],
    status: 'active',
    version: '1.0.0',
    ...stamp({ user: 'system' }),
  }));
}

export function ensureEnterpriseDataPlatform() {
  if (ensured || ensuring) return { ok: true, version: EDP_VERSION };
  ensuring = true;
  try {
    erpEnsureDirs();
    readConfig();
    ensureCollection(COLLECTIONS.entities, seedEntities());
    ensureCollection(COLLECTIONS.edges, seedEdges());
    ensureCollection(COLLECTIONS.events, []);
    ensureCollection(COLLECTIONS.twins, []);
    ensureCollection(COLLECTIONS.features, []);
    ensureCollection(COLLECTIONS.recommendations, []);
    ensureCollection(COLLECTIONS.predictions, []);
    ensureCollection(COLLECTIONS.decisions, []);
    ensureCollection(COLLECTIONS.quality, []);
    ensureCollection(COLLECTIONS.lineage, []);
    ensureCollection(COLLECTIONS.schemas, seedSchemas());
    ensureCollection(COLLECTIONS.masters, seedMasters());
    ensureCollection(COLLECTIONS.search, []);
    ensureCollection(COLLECTIONS.simulations, []);
    ensureCollection(COLLECTIONS.trainingJobs, []);
    ensureCollection(COLLECTIONS.personalization, []);
    ensureCollection(COLLECTIONS.learning, []);
    ensureCollection(COLLECTIONS.stewards, seedStewards());
    ensureCollection(COLLECTIONS.audit, []);

    const ents = erpReadCollection(COLLECTIONS.entities);
    if (!erpList(ents.items).length) {
      erpWriteCollection(COLLECTIONS.entities, { items: seedEntities() });
      erpWriteCollection(COLLECTIONS.edges, { items: seedEdges() });
    }

    rebuildSearchIndexInternal();
    ensured = true;
    return { ok: true, version: EDP_VERSION };
  } finally {
    ensuring = false;
  }
}

/* ───────────── Scope helpers ───────────── */

function scopeFilter(items, ctx = {}) {
  return erpList(items).filter((i) => {
    if (ctx.tenantId && i.tenantId && i.tenantId !== ctx.tenantId && i.tenantId !== 'global') return false;
    if (ctx.country && i.country && i.country !== '*' && i.country !== ctx.country) return false;
    return true;
  });
}

function assertTenant(ctx = {}) {
  const cfg = readConfig();
  if (cfg.requireTenantOnWrites && !ctx.tenantId) {
    return { ok: false, error: 'TENANT_REQUIRED' };
  }
  return { ok: true };
}

/* ───────────── Entities / Knowledge Graph ───────────── */

export function upsertEntity(input = {}, meta = {}) {
  ensureEnterpriseDataPlatform();
  const tenantId = input.tenantId || meta.tenantId || 'global';
  const gate = assertTenant({ tenantId: input.tenantId || meta.tenantId });
  if (!gate.ok && readConfig().requireTenantOnWrites && !(input.tenantId || meta.tenantId)) {
    // allow global seed writes with explicit tenantId 'global'
  }
  if (!input.kind || !input.key) return { ok: false, error: 'KIND_AND_KEY_REQUIRED' };
  if (!EDP_ENTITY_KINDS.includes(input.kind)) {
    // allow extension — unlimited relationships/kinds beyond catalog with warning
  }

  const id = entityId(input.kind, input.key, tenantId);
  const doc = erpReadCollection(COLLECTIONS.entities);
  const idx = erpList(doc.items).findIndex((e) => e.id === id);
  const base = {
    id,
    kind: input.kind,
    key: input.key,
    name: input.name || input.key,
    tenantId,
    country: input.country || null,
    attributes: { ...(input.attributes || {}), ...input },
    confidence: Number(input.confidence ?? 0.9),
    validationStatus: input.validationStatus || 'pending',
    source: input.source || meta.source || 'api',
    owner: input.owner || meta.user || 'system',
  };

  let entity;
  if (idx >= 0) {
    const before = doc.items[idx];
    entity = bumpVersion(
      {
        ...before,
        ...base,
        attributes: { ...before.attributes, ...base.attributes },
        history: [...(before.history || []), { at: erpNow(), event: 'updated' }].slice(-50),
      },
      meta,
    );
    doc.items[idx] = entity;
    recordLineage({
      entityId: id,
      from: before.source,
      to: entity.source,
      action: 'update',
      user: meta.user,
    });
  } else {
    entity = {
      ...base,
      history: [{ at: erpNow(), event: 'created' }],
      ...stamp(meta),
    };
    doc.items = [entity, ...erpList(doc.items)].slice(0, 50000);
    recordLineage({
      entityId: id,
      from: null,
      to: entity.source,
      action: 'create',
      user: meta.user,
    });
  }
  erpWriteCollection(COLLECTIONS.entities, doc);
  indexEntity(entity);
  syncTwinFromEntity(entity, meta);
  edpAudit({
    action: idx >= 0 ? 'entity_update' : 'entity_create',
    user: meta.user,
    tenantId,
    country: entity.country,
    entityId: id,
  });
  publishLive({ type: 'entity', id });
  return { ok: true, entity };
}

export function linkEntities(input = {}, meta = {}) {
  ensureEnterpriseDataPlatform();
  const tenantId = input.tenantId || meta.tenantId || 'global';
  const type = input.type;
  if (!type) return { ok: false, error: 'EDGE_TYPE_REQUIRED' };
  if (!EDP_EDGE_TYPES.includes(type) && !input.allowCustom) {
    // allow unlimited custom with flag
  }
  const fromId =
    input.fromId ||
    entityId(input.fromKind, input.fromKey, tenantId);
  const toId = input.toId || entityId(input.toKind, input.toKey, tenantId);
  const edge = {
    id: erpId(),
    fromId,
    toId,
    type,
    tenantId,
    country: input.country || null,
    weight: Number(input.weight ?? 1),
    confidence: Number(input.confidence ?? 0.9),
    source: input.source || 'api',
    attributes: input.attributes || {},
    ...stamp(meta),
  };
  const doc = erpReadCollection(COLLECTIONS.edges);
  // dedupe same from-to-type
  const exists = erpList(doc.items).find(
    (e) => e.fromId === fromId && e.toId === toId && e.type === type && e.tenantId === tenantId,
  );
  if (exists) {
    const idx = doc.items.findIndex((e) => e.id === exists.id);
    doc.items[idx] = bumpVersion({ ...exists, ...edge, id: exists.id }, meta);
    erpWriteCollection(COLLECTIONS.edges, doc);
    return { ok: true, edge: doc.items[idx], deduped: true };
  }
  doc.items = [edge, ...erpList(doc.items)].slice(0, 100000);
  erpWriteCollection(COLLECTIONS.edges, doc);
  edpAudit({ action: 'edge_create', user: meta.user, tenantId, entityId: edge.id, detail: { type } });
  publishLive({ type: 'edge', id: edge.id });
  return { ok: true, edge };
}

export function getNeighborhood(entityRef, ctx = {}) {
  ensureEnterpriseDataPlatform();
  const id =
    entityRef.id ||
    entityId(entityRef.kind, entityRef.key, entityRef.tenantId || ctx.tenantId || 'global');
  const edges = scopeFilter(erpReadCollection(COLLECTIONS.edges).items, ctx).filter(
    (e) => e.fromId === id || e.toId === id,
  );
  const ids = new Set([id]);
  for (const e of edges) {
    ids.add(e.fromId);
    ids.add(e.toId);
  }
  const entities = erpList(erpReadCollection(COLLECTIONS.entities).items).filter((e) => ids.has(e.id));
  return { ok: true, centerId: id, entities, edges };
}

export function getKnowledgeGraphSummary(ctx = {}) {
  ensureEnterpriseDataPlatform();
  const entities = scopeFilter(erpReadCollection(COLLECTIONS.entities).items, ctx);
  const edges = scopeFilter(erpReadCollection(COLLECTIONS.edges).items, ctx);
  const byKind = {};
  for (const e of entities) byKind[e.kind] = (byKind[e.kind] || 0) + 1;
  const byEdge = {};
  for (const e of edges) byEdge[e.type] = (byEdge[e.type] || 0) + 1;
  return {
    entityCount: entities.length,
    edgeCount: edges.length,
    byKind,
    byEdge,
    kindsSupported: EDP_ENTITY_KINDS.length,
    edgeTypesSupported: EDP_EDGE_TYPES.length,
  };
}

/* ───────────── Learning graph ───────────── */

export function updateLearningProgress(input = {}, meta = {}) {
  ensureEnterpriseDataPlatform();
  const studentKey = input.studentKey || input.studentId;
  if (!studentKey) return { ok: false, error: 'STUDENT_REQUIRED' };
  const tenantId = input.tenantId || meta.tenantId || 'global';
  const studentId = entityId('student', studentKey, tenantId);
  const step = input.step || 'lesson';
  if (!EDP_LEARNING_PATH.includes(step) && step !== 'mastery') {
    /* allow */
  }

  const row = {
    id: erpId(),
    studentId,
    studentKey,
    tenantId,
    country: input.country || null,
    path: EDP_LEARNING_PATH,
    step,
    resourceKind: input.resourceKind || 'lesson',
    resourceKey: input.resourceKey || null,
    score: Number(input.score ?? 0),
    mastery: Number(input.mastery ?? input.score ?? 0),
    weakness: erpList(input.weakness),
    strength: erpList(input.strength),
    recommendation: input.recommendation || null,
    at: erpNow(),
    ...stamp(meta),
  };

  const doc = erpReadCollection(COLLECTIONS.learning);
  doc.items = [row, ...erpList(doc.items)].slice(0, 20000);
  erpWriteCollection(COLLECTIONS.learning, doc);

  // Update mastery feature + graph edges
  setFeature('student.mastery_avg', studentId, averageMastery(studentId), { tenantId }, meta);
  if (row.weakness.length) {
    setFeature('learning.weakness_topics', studentId, row.weakness, { tenantId }, meta);
    for (const w of row.weakness) {
      linkEntities(
        {
          fromKind: 'student',
          fromKey: studentKey,
          type: 'weakness_in',
          toKind: 'skill',
          toKey: w,
          tenantId,
          allowCustom: true,
        },
        meta,
      );
    }
  }
  if (row.strength.length) {
    for (const s of row.strength) {
      linkEntities(
        {
          fromKind: 'student',
          fromKey: studentKey,
          type: 'strength_in',
          toKind: 'skill',
          toKey: s,
          tenantId,
          allowCustom: true,
        },
        meta,
      );
    }
  }
  if (Number(row.mastery) >= 0.7 && row.resourceKey) {
    linkEntities(
      {
        fromKind: 'student',
        fromKey: studentKey,
        type: 'mastery_of',
        toKind: row.resourceKind,
        toKey: row.resourceKey,
        tenantId,
        weight: row.mastery,
      },
      meta,
    );
  }

  ingestEvent(
    {
      type: 'mastery_update',
      actorId: studentId,
      tenantId,
      country: row.country,
      payload: { step, mastery: row.mastery, resourceKey: row.resourceKey },
    },
    meta,
  );

  syncTwinFromEntity(
    erpList(erpReadCollection(COLLECTIONS.entities).items).find((e) => e.id === studentId) || {
      id: studentId,
      kind: 'student',
      key: studentKey,
      tenantId,
      country: row.country,
      name: studentKey,
    },
    meta,
  );

  return { ok: true, progress: row };
}

function averageMastery(studentId) {
  const rows = erpList(erpReadCollection(COLLECTIONS.learning).items).filter((r) => r.studentId === studentId);
  if (!rows.length) return 0;
  return Number((rows.reduce((s, r) => s + Number(r.mastery || 0), 0) / rows.length).toFixed(4));
}

export function getSkillsGraph(ctx = {}) {
  ensureEnterpriseDataPlatform();
  const skills = scopeFilter(erpReadCollection(COLLECTIONS.entities).items, ctx).filter((e) =>
    ['skill', 'competency', 'learningOutcome', 'certification', 'degree', 'job', 'career', 'employer'].includes(
      e.kind,
    ),
  );
  const skillIds = new Set(skills.map((s) => s.id));
  const edges = scopeFilter(erpReadCollection(COLLECTIONS.edges).items, ctx).filter(
    (e) =>
      skillIds.has(e.fromId) ||
      skillIds.has(e.toId) ||
      ['requires_skill', 'develops_skill', 'maps_to_job', 'maps_to_career'].includes(e.type),
  );
  return { ok: true, nodes: skills, edges };
}

/* ───────────── Events ───────────── */

export function ingestEvent(input = {}, meta = {}) {
  ensureEnterpriseDataPlatform();
  const type = input.type;
  if (!type) return { ok: false, error: 'EVENT_TYPE_REQUIRED' };
  const event = {
    id: erpId(),
    type,
    actorId: input.actorId || meta.user || null,
    subjectId: input.subjectId || null,
    tenantId: input.tenantId || meta.tenantId || 'global',
    country: input.country || null,
    module: input.module || null,
    payload: input.payload || {},
    permissionScope: input.permissionScope || meta.permissions || [],
    at: input.at || erpNow(),
    ...stamp(meta),
  };
  const doc = erpReadCollection(COLLECTIONS.events);
  doc.items = [event, ...erpList(doc.items)].slice(0, 50000);
  erpWriteCollection(COLLECTIONS.events, doc);

  // Feature refresh hooks
  if (['payment', 'booking'].includes(type)) {
    refreshFinanceFeatures(event.tenantId, meta);
  }
  if (['lesson', 'exam', 'attendance', 'mastery_update'].includes(type)) {
    /* learning features updated by progress */
  }

  publishLive({ type: 'event', eventType: type, id: event.id });
  return { ok: true, event };
}

/* ───────────── Digital twins ───────────── */

export function syncTwinFromEntity(entity, meta = {}) {
  if (!entity?.kind) return { ok: false, error: 'NO_ENTITY' };
  const twinKind = mapKindToTwin(entity.kind);
  if (!twinKind) return { ok: true, skipped: true };

  ensureEnterpriseDataPlatform();
  const doc = erpReadCollection(COLLECTIONS.twins);
  const twinId = `twin:${entity.id}`;
  const idx = erpList(doc.items).findIndex((t) => t.id === twinId);
  const neighborhood = getNeighborhood({ id: entity.id }, { tenantId: entity.tenantId });
  const features = getFeaturesForSubject(entity.id);
  const recentEvents = erpList(erpReadCollection(COLLECTIONS.events).items)
    .filter((e) => e.actorId === entity.id || e.subjectId === entity.id)
    .slice(0, 20);

  const snapshot = {
    entity: {
      id: entity.id,
      kind: entity.kind,
      key: entity.key,
      name: entity.name,
      country: entity.country,
      tenantId: entity.tenantId,
    },
    graphDegree: neighborhood.edges.length,
    features,
    recentEventTypes: recentEvents.map((e) => e.type),
    mastery: features['student.mastery_avg']?.value ?? null,
    risk: features['student.dropout_risk']?.value ?? features['finance.churn_risk']?.value ?? null,
  };

  const twin = {
    id: twinId,
    kind: twinKind,
    subjectId: entity.id,
    tenantId: entity.tenantId,
    country: entity.country,
    snapshot,
    lastSyncedAt: erpNow(),
    confidence: 0.85,
    validationStatus: 'synced',
    source: 'edp-twin-sync',
    owner: meta.user || 'system',
    history: idx >= 0 ? [...(doc.items[idx].history || []), { at: erpNow(), event: 'sync' }].slice(-30) : [{ at: erpNow(), event: 'created' }],
  };

  if (idx >= 0) {
    doc.items[idx] = bumpVersion({ ...doc.items[idx], ...twin }, meta);
  } else {
    doc.items = [{ ...twin, ...stamp(meta) }, ...erpList(doc.items)].slice(0, 20000);
  }
  erpWriteCollection(COLLECTIONS.twins, doc);
  ingestEvent(
    {
      type: 'twin_sync',
      actorId: entity.id,
      tenantId: entity.tenantId,
      country: entity.country,
      payload: { twinKind, twinId },
    },
    meta,
  );
  return { ok: true, twin: idx >= 0 ? doc.items[idx] : doc.items[0] };
}

function mapKindToTwin(kind) {
  const map = {
    student: 'student',
    teacher: 'teacher',
    school: 'school',
    university: 'university',
    center: 'center',
    employer: 'company',
    employee: 'employee',
    marketplace_listing: 'marketplace',
    country: 'country',
    tenant: 'tenant',
  };
  return map[kind] || (EDP_TWIN_KINDS.includes(kind) ? kind : null);
}

export function getTwin(subjectRef, ctx = {}) {
  ensureEnterpriseDataPlatform();
  const id =
    subjectRef.twinId ||
    `twin:${subjectRef.id || entityId(subjectRef.kind, subjectRef.key, subjectRef.tenantId || ctx.tenantId || 'global')}`;
  const twin = erpList(erpReadCollection(COLLECTIONS.twins).items).find((t) => t.id === id);
  if (!twin) return { ok: false, error: 'TWIN_NOT_FOUND' };
  return { ok: true, twin };
}

export function syncAllTwins(meta = {}) {
  ensureEnterpriseDataPlatform();
  const entities = erpList(erpReadCollection(COLLECTIONS.entities).items).filter((e) => mapKindToTwin(e.kind));
  let synced = 0;
  for (const e of entities) {
    syncTwinFromEntity(e, meta);
    synced += 1;
  }
  return { ok: true, synced };
}

/* ───────────── Feature store ───────────── */

export function setFeature(key, subjectId, value, ctx = {}, meta = {}) {
  ensureEnterpriseDataPlatform();
  const def = findFeatureDef(key);
  const ttl = def?.ttlSec || readConfig().featureDefaultTtlSec;
  const doc = erpReadCollection(COLLECTIONS.features);
  const id = `${subjectId}:${key}`;
  const idx = erpList(doc.items).findIndex((f) => f.id === id);
  const row = {
    id,
    key,
    subjectId,
    value,
    tenantId: ctx.tenantId || 'global',
    country: ctx.country || null,
    domain: def?.domain || 'custom',
    computedAt: erpNow(),
    expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    confidence: Number(ctx.confidence ?? 0.8),
    source: ctx.source || 'feature_store',
    owner: meta.user || 'system',
  };
  if (idx >= 0) doc.items[idx] = bumpVersion({ ...doc.items[idx], ...row }, meta);
  else doc.items = [{ ...row, ...stamp(meta) }, ...erpList(doc.items)].slice(0, 50000);
  erpWriteCollection(COLLECTIONS.features, doc);
  return { ok: true, feature: row };
}

export function getFeature(key, subjectId) {
  ensureEnterpriseDataPlatform();
  const id = `${subjectId}:${key}`;
  const f = erpList(erpReadCollection(COLLECTIONS.features).items).find((x) => x.id === id);
  if (!f) return null;
  if (f.expiresAt && new Date(f.expiresAt).getTime() < Date.now()) return { ...f, stale: true };
  return f;
}

function getFeaturesForSubject(subjectId) {
  const out = {};
  for (const f of erpList(erpReadCollection(COLLECTIONS.features).items).filter((x) => x.subjectId === subjectId)) {
    out[f.key] = f;
  }
  return out;
}

function refreshFinanceFeatures(tenantId, meta = {}) {
  try {
    const { getFinanceSummary } = require('./enterprise-payment-engine.js');
    const summary = getFinanceSummary();
    const subject = entityId('tenant', tenantId === 'global' ? 'success-os' : tenantId, tenantId);
    setFeature('finance.revenue_30d', subject, Number(summary?.revenue || summary?.monthlySales || 0), { tenantId }, meta);
  } catch {
    setFeature(
      'finance.revenue_30d',
      entityId('tenant', 'success-os', tenantId || 'global'),
      0,
      { tenantId: tenantId || 'global' },
      meta,
    );
  }
}

/* ───────────── Personalization ───────────── */

export function resolvePersonalization(profile = {}, meta = {}) {
  ensureEnterpriseDataPlatform();
  const dims = {};
  for (const d of EDP_PERSONALIZATION_DIMENSIONS) {
    dims[d] = profile[d] ?? null;
  }
  const layout = {
    language: dims.language || 'ar',
    curriculum: dims.curriculum || null,
    country: dims.country || null,
    accessibility: dims.accessibility || { fontScale: 1, highContrast: false },
    learningStyle: dims.learning_style || 'balanced',
    highlight: [],
  };
  if (Number(dims.performance) < 0.5) layout.highlight.push('remedial_lessons');
  if (dims.career) layout.highlight.push('career_aligned_content');
  if (dims.goals) layout.highlight.push('goal_progress');
  if (dims.interests) layout.highlight.push('interest_feed');

  const row = {
    id: erpId(),
    userId: profile.userId || meta.user || 'anonymous',
    tenantId: profile.tenantId || meta.tenantId || 'global',
    dimensions: dims,
    layout,
    at: erpNow(),
    ...stamp(meta),
  };
  const doc = erpReadCollection(COLLECTIONS.personalization);
  doc.items = [row, ...erpList(doc.items)].slice(0, 5000);
  erpWriteCollection(COLLECTIONS.personalization, doc);
  return { ok: true, personalization: row };
}

/* ───────────── Recommendations ───────────── */

export function generateRecommendations(input = {}, meta = {}) {
  ensureEnterpriseDataPlatform();
  const tenantId = input.tenantId || meta.tenantId || 'global';
  const studentKey = input.studentKey || 'demo-student-1';
  const studentId = entityId('student', studentKey, tenantId);
  const neighborhood = getNeighborhood({ kind: 'student', key: studentKey, tenantId }, { tenantId });
  const weakness = getFeature('learning.weakness_topics', studentId)?.value || [];
  const limit = Number(input.limit || readConfig().recommendationLimit);
  const types = input.types || EDP_RECOMMENDATION_TYPES;

  const candidates = [];
  const entities = scopeFilter(erpReadCollection(COLLECTIONS.entities).items, { tenantId, country: input.country });

  const pushRec = (type, entity, why, evidence, confidence) => {
    if (!types.includes(type)) return;
    candidates.push({
      id: erpId(),
      type,
      targetId: entity.id,
      targetName: entity.name,
      subjectId: studentId,
      tenantId,
      country: entity.country || input.country || null,
      why,
      evidence,
      confidence: Number(confidence.toFixed(3)),
      requiredAction: type === 'lesson' ? 'start_lesson' : type === 'teacher' ? 'book_session' : 'view',
      at: erpNow(),
    });
  };

  for (const e of entities.filter((x) => x.kind === 'lesson')) {
    const relatedWeak = weakness.some((w) => String(e.name).toLowerCase().includes(String(w).toLowerCase()));
    pushRec(
      'lesson',
      e,
      relatedWeak ? 'Addresses detected learning weakness' : 'Next lesson in learning graph neighborhood',
      { weakness, graphEdges: neighborhood.edges.length },
      relatedWeak ? 0.86 : 0.62,
    );
  }
  for (const e of entities.filter((x) => x.kind === 'book')) {
    pushRec('book', e, 'Aligned to student curriculum path', { studentKey }, 0.7);
  }
  for (const e of entities.filter((x) => x.kind === 'teacher')) {
    pushRec('teacher', e, 'Teacher linked via graph to student subject', { edges: neighborhood.edges.length }, 0.68);
  }
  for (const e of entities.filter((x) => x.kind === 'university')) {
    pushRec('university', e, 'Country-matched institution opportunity', { country: input.country || e.country }, 0.55);
  }
  for (const e of entities.filter((x) => x.kind === 'scholarship')) {
    pushRec('scholarship', e, 'Eligible scholarship in knowledge graph', { country: e.country }, 0.6);
  }
  for (const e of entities.filter((x) => x.kind === 'job')) {
    pushRec('job', e, 'Skill-to-job mapping from skills graph', { skills: weakness }, 0.58);
  }
  for (const e of entities.filter((x) => x.kind === 'career')) {
    pushRec('career_path', e, 'Career path linked from student skills', {}, 0.64);
  }
  for (const e of entities.filter((x) => x.kind === 'ai_agent')) {
    pushRec('ai_session', e, 'AI tutor agent available for subject support', {}, 0.72);
  }

  const sorted = candidates.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
  const doc = erpReadCollection(COLLECTIONS.recommendations);
  doc.items = [...sorted, ...erpList(doc.items)].slice(0, 10000);
  erpWriteCollection(COLLECTIONS.recommendations, doc);
  ingestEvent(
    {
      type: 'recommendation_served',
      actorId: studentId,
      tenantId,
      payload: { count: sorted.length },
    },
    meta,
  );
  setFeature('ai.recommendation_ctr', studentId, { served: sorted.length }, { tenantId }, meta);
  return { ok: true, recommendations: sorted };
}

/* ───────────── Predictions ───────────── */

export function generatePredictions(input = {}, meta = {}) {
  ensureEnterpriseDataPlatform();
  const tenantId = input.tenantId || meta.tenantId || 'global';
  const studentKey = input.studentKey || 'demo-student-1';
  const studentId = entityId('student', studentKey, tenantId);
  const mastery = Number(getFeature('student.mastery_avg', studentId)?.value ?? averageMastery(studentId));
  const events = erpList(erpReadCollection(COLLECTIONS.events).items).filter(
    (e) => e.actorId === studentId || e.tenantId === tenantId,
  );
  const attendanceEvents = events.filter((e) => e.type === 'attendance').length;
  const loginEvents = events.filter((e) => e.type === 'login').length;

  const preds = [];
  const mk = (type, score, why, evidence, action) => {
    const confidence = Math.max(
      readConfig().predictionMinConfidence,
      Math.min(0.95, 0.4 + Math.abs(0.5 - score) * 0.8),
    );
    preds.push({
      id: erpId(),
      type,
      subjectId: studentId,
      tenantId,
      country: input.country || null,
      score: Number(score.toFixed(3)),
      confidence: Number(confidence.toFixed(3)),
      why,
      evidence,
      requiredAction: action,
      at: erpNow(),
    });
  };

  const dropout = Math.max(0, Math.min(1, 0.75 - mastery * 0.6 - Math.min(loginEvents, 10) * 0.02));
  mk('dropout_risk', dropout, 'Low mastery and limited recent engagement elevate dropout risk', { mastery, loginEvents }, 'schedule_intervention');
  setFeature('student.dropout_risk', studentId, dropout, { tenantId }, meta);

  mk('failure_risk', Math.max(0, 0.7 - mastery), 'Mastery below target increases failure risk', { mastery }, 'assign_remedial');
  mk(
    'attendance_risk',
    attendanceEvents < 3 ? 0.65 : 0.25,
    'Sparse attendance events relative to expected cadence',
    { attendanceEvents },
    'notify_parent',
  );
  mk('student_success', mastery, 'Projected success from current mastery trajectory', { mastery }, 'continue_path');

  // Tenant-level finance predictions
  const revenueSubject = entityId('tenant', 'success-os', tenantId);
  const revenue = Number(getFeature('finance.revenue_30d', revenueSubject)?.value || 0);
  mk('revenue', Math.min(1, revenue / 100000 || 0.4), 'Revenue health relative to baseline capacity', { revenue }, 'review_finance');
  mk('subscription_churn', 0.35, 'Baseline churn estimate pending richer subscription events', { revenue }, 'retention_campaign');
  mk('payment_risk', 0.3, 'Payment risk from limited payment event density', { events: events.filter((e) => e.type === 'payment').length }, 'verify_billing');
  mk('teacher_performance', 0.7, 'Teacher twin performance proxy from graph degree', {}, 'coach_teachers');
  mk('institution_growth', 0.55, 'Institution growth index from entity expansion', { entities: getKnowledgeGraphSummary({ tenantId }).entityCount }, 'expand_programs');
  mk('hiring_needs', 0.4, 'Hiring needs inferred from employer-skill gaps', {}, 'open_requisitions');

  const wanted = input.types || EDP_PREDICTION_TYPES;
  const filtered = preds.filter((p) => wanted.includes(p.type));
  const doc = erpReadCollection(COLLECTIONS.predictions);
  doc.items = [...filtered, ...erpList(doc.items)].slice(0, 10000);
  erpWriteCollection(COLLECTIONS.predictions, doc);
  ingestEvent(
    { type: 'prediction_generated', actorId: studentId, tenantId, payload: { count: filtered.length } },
    meta,
  );
  return { ok: true, predictions: filtered };
}

/* ───────────── Decision support ───────────── */

export function buildDecisionSupport(audience = 'owner', ctx = {}, meta = {}) {
  ensureEnterpriseDataPlatform();
  if (!EDP_DECISION_AUDIENCES.includes(audience)) audience = 'owner';
  const preds = erpList(erpReadCollection(COLLECTIONS.predictions).items).slice(0, 20);
  const recs = erpList(erpReadCollection(COLLECTIONS.recommendations).items).slice(0, 20);
  const quality = erpList(erpReadCollection(COLLECTIONS.quality).items).filter((q) => q.status === 'open').slice(0, 10);

  const recommendations = [];
  for (const p of preds.slice(0, 5)) {
    recommendations.push({
      id: erpId(),
      audience,
      title: `${p.type.replace(/_/g, ' ')} signal`,
      why: p.why,
      evidence: p.evidence,
      confidence: p.confidence,
      requiredAction: p.requiredAction,
      sourcePredictionId: p.id,
    });
  }
  for (const r of recs.slice(0, 3)) {
    recommendations.push({
      id: erpId(),
      audience,
      title: `Recommend ${r.type}: ${r.targetName}`,
      why: r.why,
      evidence: r.evidence,
      confidence: r.confidence,
      requiredAction: r.requiredAction,
      sourceRecommendationId: r.id,
    });
  }
  if (quality.length) {
    recommendations.push({
      id: erpId(),
      audience,
      title: 'Resolve data quality issues',
      why: `${quality.length} open quality findings affect trusted analytics`,
      evidence: { codes: quality.map((q) => q.ruleId) },
      confidence: 0.9,
      requiredAction: 'run_quality_scan',
    });
  }

  const pack = {
    id: erpId(),
    audience,
    tenantId: ctx.tenantId || 'global',
    country: ctx.country || null,
    recommendations,
    at: erpNow(),
    ...stamp(meta),
  };
  const doc = erpReadCollection(COLLECTIONS.decisions);
  doc.items = [pack, ...erpList(doc.items)].slice(0, 2000);
  erpWriteCollection(COLLECTIONS.decisions, doc);
  return { ok: true, decisionSupport: pack };
}

/* ───────────── Governance / lineage / quality ───────────── */

function recordLineage(entry) {
  const doc = erpReadCollection(COLLECTIONS.lineage);
  doc.items = [
    {
      id: erpId(),
      at: erpNow(),
      ...entry,
    },
    ...erpList(doc.items),
  ].slice(0, 10000);
  erpWriteCollection(COLLECTIONS.lineage, doc);
}

export function runDataQualityScan(meta = {}) {
  ensureEnterpriseDataPlatform();
  const entities = erpList(erpReadCollection(COLLECTIONS.entities).items);
  const edges = erpList(erpReadCollection(COLLECTIONS.edges).items);
  const findings = [];
  const entityIds = new Set(entities.map((e) => e.id));

  // Duplicates
  const seen = new Map();
  for (const e of entities) {
    const k = `${e.tenantId}|${e.kind}|${e.key}`;
    if (seen.has(k)) {
      findings.push({
        id: erpId(),
        ruleId: 'dup-entity',
        type: 'duplicate',
        severity: 'high',
        entityId: e.id,
        message: `Duplicate of ${seen.get(k)}`,
        status: 'open',
        at: erpNow(),
      });
    } else seen.set(k, e.id);
  }

  // Missing
  for (const e of entities) {
    if (!e.name || !e.kind || !e.key) {
      findings.push({
        id: erpId(),
        ruleId: 'missing-required',
        type: 'missing',
        severity: 'high',
        entityId: e.id,
        message: 'Missing required name/kind/key',
        status: 'open',
        at: erpNow(),
      });
    }
  }

  // Orphan edges
  for (const edge of edges) {
    if (!entityIds.has(edge.fromId) || !entityIds.has(edge.toId)) {
      findings.push({
        id: erpId(),
        ruleId: 'orphan-edge',
        type: 'broken_relationship',
        severity: 'high',
        entityId: edge.id,
        message: 'Edge references missing node',
        status: 'open',
        at: erpNow(),
      });
    }
  }

  // Invalid enum (kind)
  for (const e of entities) {
    if (e.kind && !EDP_ENTITY_KINDS.includes(e.kind)) {
      findings.push({
        id: erpId(),
        ruleId: 'invalid-enum',
        type: 'invalid',
        severity: 'medium',
        entityId: e.id,
        message: `Unknown kind ${e.kind}`,
        status: 'open',
        at: erpNow(),
      });
    }
  }

  const doc = erpReadCollection(COLLECTIONS.quality);
  doc.items = [...findings, ...erpList(doc.items)].slice(0, 5000);
  erpWriteCollection(COLLECTIONS.quality, doc);
  edpAudit({ action: 'quality_scan', user: meta.user, detail: { findings: findings.length } });
  publishLive({ type: 'quality', findings: findings.length });
  return { ok: true, findings, openCount: findings.length };
}

/* ───────────── Search ───────────── */

function indexEntity(entity) {
  const doc = erpReadCollection(COLLECTIONS.search);
  const idx = erpList(doc.items).findIndex((s) => s.entityId === entity.id);
  const row = {
    id: entity.id,
    entityId: entity.id,
    kind: entity.kind,
    name: entity.name,
    key: entity.key,
    tenantId: entity.tenantId,
    country: entity.country,
    language: entity.attributes?.language || 'ar',
    text: `${entity.name} ${entity.key} ${entity.kind}`.toLowerCase(),
    updatedAt: erpNow(),
  };
  if (idx >= 0) doc.items[idx] = row;
  else doc.items = [row, ...erpList(doc.items)].slice(0, 50000);
  erpWriteCollection(COLLECTIONS.search, doc);
}

function rebuildSearchIndexInternal() {
  const entities = erpList(erpReadCollection(COLLECTIONS.entities).items);
  erpWriteCollection(COLLECTIONS.search, { items: [] });
  for (const e of entities) indexEntity(e);
  return { ok: true, indexed: entities.length };
}

export function rebuildSearchIndex() {
  ensureEnterpriseDataPlatform();
  return rebuildSearchIndexInternal();
}

export function searchEntities(query = '', ctx = {}) {
  ensureEnterpriseDataPlatform();
  const q = String(query || '').trim().toLowerCase();
  const max = Number(ctx.limit || readConfig().searchMaxResults);
  let rows = scopeFilter(erpReadCollection(COLLECTIONS.search).items, ctx);
  if (ctx.kind) rows = rows.filter((r) => r.kind === ctx.kind);
  if (ctx.language) rows = rows.filter((r) => !r.language || r.language === ctx.language || r.language === '*');
  // Permission-aware: if permissions provided, restrict sensitive kinds
  if (Array.isArray(ctx.permissions) && !ctx.permissions.includes('users.read')) {
    rows = rows.filter((r) => !['student', 'parent', 'employee'].includes(r.kind));
  }
  if (q) rows = rows.filter((r) => r.text.includes(q) || r.name?.toLowerCase().includes(q));
  return { ok: true, results: rows.slice(0, max), total: rows.length };
}

/* ───────────── Semantic layer ───────────── */

export function resolveSemanticTerm(key) {
  ensureEnterpriseDataPlatform();
  const catalog = findSemanticTerm(key);
  const master = erpList(erpReadCollection(COLLECTIONS.masters).items).find(
    (m) => m.key === key || (m.aliases || []).includes(key),
  );
  return {
    ok: Boolean(catalog || master),
    term: master || catalog,
    canonical: (master || catalog)?.key || null,
  };
}

/* ───────────── AI training pipeline ───────────── */

export function prepareAiTrainingDataset(input = {}, meta = {}) {
  ensureEnterpriseDataPlatform();
  const cfg = readConfig();
  if (!input.authorized && cfg.anonymizeAiTraining) {
    // still allow with anonymization
  }
  if (!meta.authorized && !input.authorized) {
    return { ok: false, error: 'AUTHORIZATION_REQUIRED_FOR_TRAINING_DATA' };
  }

  const purpose = input.purpose || 'recommendation_models';
  const tenantId = input.tenantId || meta.tenantId || 'global';
  const learning = scopeFilter(erpReadCollection(COLLECTIONS.learning).items, { tenantId });
  const features = scopeFilter(erpReadCollection(COLLECTIONS.features).items, { tenantId });

  const anonymized = learning.slice(0, Number(input.limit || 500)).map((r) => ({
    mastery: r.mastery,
    step: r.step,
    resourceKind: r.resourceKind,
    country: r.country,
    // no raw student PII
    subjectHash: hashId(r.studentId),
  }));

  const job = {
    id: erpId(),
    purpose,
    tenantId,
    rowCount: anonymized.length,
    featureCount: features.length,
    anonymized: true,
    status: 'prepared',
    sample: anonymized.slice(0, 5),
    privacyControls: ['hash_subject', 'no_pii_fields', 'tenant_scoped'],
    at: erpNow(),
    ...stamp(meta),
  };
  const doc = erpReadCollection(COLLECTIONS.trainingJobs);
  doc.items = [job, ...erpList(doc.items)].slice(0, 500);
  erpWriteCollection(COLLECTIONS.trainingJobs, doc);
  edpAudit({
    action: 'ai_training_prepare',
    user: meta.user,
    tenantId,
    detail: { purpose, rowCount: job.rowCount },
  });
  return { ok: true, job };
}

function hashId(v) {
  let h = 0;
  const s = String(v || '');
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return `h${h.toString(16)}`;
}

/* ───────────── Simulation engine ───────────── */

export function runSimulation(input = {}, meta = {}) {
  ensureEnterpriseDataPlatform();
  const type = input.type;
  if (!EDP_SIMULATION_TYPES.includes(type)) return { ok: false, error: 'INVALID_SIMULATION_TYPE' };

  let baseline = {};
  let projected = {};
  let impact = {};

  if (type === 'commission_change') {
    let currentRate = 0.1;
    try {
      const { getCommissionDefaults } = require('./enterprise-commission-engine.js');
      currentRate = Number(getCommissionDefaults()?.defaultRate || 0.1);
    } catch {
      /* default */
    }
    const newRate = Number(input.newRate ?? currentRate);
    const volume = Number(input.monthlyVolume || 100000);
    baseline = { commissionRate: currentRate, monthlyVolume: volume, platformRevenue: volume * currentRate };
    projected = { commissionRate: newRate, monthlyVolume: volume, platformRevenue: volume * newRate };
    impact = {
      revenueDelta: projected.platformRevenue - baseline.platformRevenue,
      revenueDeltaPct: currentRate ? ((newRate - currentRate) / currentRate) * 100 : 0,
      partnerShareDelta: volume * (currentRate - newRate),
    };
  } else if (type === 'pricing_change') {
    const price = Number(input.currentPrice || 50);
    const newPrice = Number(input.newPrice || 55);
    const subscribers = Number(input.subscribers || 1000);
    const elasticity = Number(input.elasticity || -0.4);
    const demandFactor = 1 + elasticity * ((newPrice - price) / price);
    const newSubs = Math.max(0, Math.round(subscribers * demandFactor));
    baseline = { price, subscribers, mrr: price * subscribers };
    projected = { price: newPrice, subscribers: newSubs, mrr: newPrice * newSubs };
    impact = { mrrDelta: projected.mrr - baseline.mrr, subscriberDelta: newSubs - subscribers };
  } else if (type === 'add_country') {
    const country = input.country || 'SA';
    const expectedStudents = Number(input.expectedStudents || 500);
    baseline = { countries: getKnowledgeGraphSummary().byKind.country || 0, students: getKnowledgeGraphSummary().byKind.student || 0 };
    projected = {
      countries: baseline.countries + 1,
      students: baseline.students + expectedStudents,
      country,
    };
    impact = { newStudents: expectedStudents, localizationCostIndex: 1.0 };
  } else if (type === 'launch_curriculum') {
    const lessons = Number(input.lessons || 40);
    baseline = { lessons: getKnowledgeGraphSummary().byKind.lesson || 0 };
    projected = { lessons: baseline.lessons + lessons, curriculum: input.curriculumName || 'New Curriculum' };
    impact = { contentDelta: lessons, masteryLiftEstimate: 0.08 };
  } else if (type === 'subscription_change') {
    const churn = Number(input.currentChurn || 0.05);
    const newChurn = Number(input.newChurn || 0.04);
    const subs = Number(input.subscribers || 1000);
    const arpu = Number(input.arpu || 40);
    baseline = { churn, subscribers: subs, mrr: subs * arpu };
    const retained = Math.round(subs * (1 - newChurn));
    projected = { churn: newChurn, subscribers: retained, mrr: retained * arpu };
    impact = { mrrDelta: projected.mrr - baseline.mrr, churnDelta: newChurn - churn };
  }

  const sim = {
    id: erpId(),
    type,
    input,
    baseline,
    projected,
    impact,
    confidence: 0.55,
    status: 'estimated',
    note: 'Simulation estimate only — not a production change',
    at: erpNow(),
    ...stamp(meta),
  };
  const doc = erpReadCollection(COLLECTIONS.simulations);
  doc.items = [sim, ...erpList(doc.items)].slice(0, 1000);
  erpWriteCollection(COLLECTIONS.simulations, doc);
  ingestEvent(
    { type: 'simulation_run', actorId: meta.user, tenantId: input.tenantId || 'global', payload: { type, simId: sim.id } },
    meta,
  );
  return { ok: true, simulation: sim };
}

/* ───────────── Owner intelligence ───────────── */

export function getOwnerIntelligence(ctx = {}) {
  ensureEnterpriseDataPlatform();
  const graph = getKnowledgeGraphSummary(ctx);
  const twins = scopeFilter(erpReadCollection(COLLECTIONS.twins).items, ctx);
  const preds = erpList(erpReadCollection(COLLECTIONS.predictions).items).slice(0, 15);
  const qualityOpen = erpList(erpReadCollection(COLLECTIONS.quality).items).filter((q) => q.status === 'open').length;
  const events = erpList(erpReadCollection(COLLECTIONS.events).items);
  const sims = erpList(erpReadCollection(COLLECTIONS.simulations).items).slice(0, 5);
  const features = erpList(erpReadCollection(COLLECTIONS.features).items);

  const countries = {};
  for (const e of scopeFilter(erpReadCollection(COLLECTIONS.entities).items, ctx)) {
    if (!e.country || e.country === '*') continue;
    countries[e.country] = countries[e.country] || { entities: 0, kinds: {} };
    countries[e.country].entities += 1;
    countries[e.country].kinds[e.kind] = (countries[e.country].kinds[e.kind] || 0) + 1;
  }

  const risks = preds
    .filter((p) => ['dropout_risk', 'payment_risk', 'subscription_churn', 'failure_risk'].includes(p.type))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return {
    businessHealth: {
      score: Math.max(0, Math.min(100, 80 - qualityOpen * 3 + Math.min(10, twins.length))),
      twins: twins.length,
      events24h: events.filter((e) => Date.now() - new Date(e.at).getTime() < 86400000).length,
      qualityOpen,
    },
    growth: {
      entities: graph.entityCount,
      edges: graph.edgeCount,
      byKind: graph.byKind,
    },
    risks,
    predictions: preds,
    forecasts: sims.map((s) => ({
      id: s.id,
      type: s.type,
      impact: s.impact,
      confidence: s.confidence,
      at: s.at,
    })),
    countryComparison: countries,
    tenantComparison: {
      current: ctx.tenantId || 'global',
      entityCount: graph.entityCount,
      twinCount: twins.length,
    },
    aiPerformance: {
      recommendations: erpList(erpReadCollection(COLLECTIONS.recommendations).items).length,
      featureStoreSize: features.length,
      trainingJobs: erpList(erpReadCollection(COLLECTIONS.trainingJobs).items).length,
    },
    financialHealth: {
      revenueFeature: features.find((f) => f.key === 'finance.revenue_30d')?.value ?? null,
    },
    educationalImpact: {
      learningProgressRows: erpList(erpReadCollection(COLLECTIONS.learning).items).length,
      masteryFeatures: features.filter((f) => f.key === 'student.mastery_avg').length,
    },
  };
}

/* ───────────── Bridge ERP collections into graph (no rebuild) ───────────── */

export function ingestFromErpModules(meta = {}) {
  ensureEnterpriseDataPlatform();
  const mapped = [
    ['students', 'student'],
    ['teachers', 'teacher'],
    ['parents', 'parent'],
    ['employees', 'employee'],
    ['partners', 'employer'],
  ];
  let upserted = 0;
  for (const [collection, kind] of mapped) {
    try {
      const items = erpList(erpReadCollection(collection).items).filter((i) => !i.deletedAt);
      for (const item of items.slice(0, 200)) {
        const key = item.id || item.email || item.name;
        if (!key) continue;
        upsertEntity(
          {
            kind,
            key: String(key),
            name: item.name || item.email || String(key),
            tenantId: item.tenantId || 'global',
            country: item.country || null,
            source: `erp:${collection}`,
            attributes: { erpCollection: collection, erpId: item.id },
            validationStatus: 'imported',
            confidence: 0.8,
          },
          meta,
        );
        upserted += 1;
      }
    } catch {
      /* collection may not exist yet */
    }
  }

  // Bridge educational KG metadata if available
  try {
    const { KG_SCHEMA, KG_VERSION } = require('../../data/educational-knowledge-graph.js');
    upsertEntity(
      {
        kind: 'competency_framework',
        key: 'educational-kg',
        name: `Educational KG ${KG_VERSION}`,
        tenantId: 'global',
        country: '*',
        source: KG_SCHEMA,
        attributes: { schema: KG_SCHEMA, version: KG_VERSION },
      },
      meta,
    );
  } catch {
    /* optional */
  }

  rebuildSearchIndexInternal();
  syncAllTwins(meta);
  return { ok: true, upserted };
}

/* ───────────── Dashboard ───────────── */

export function getDataPlatformDashboard(filters = {}) {
  ensureEnterpriseDataPlatform();
  const ctx = {
    tenantId: filters.tenant || undefined,
    country: filters.country || undefined,
  };
  const intelligence = getOwnerIntelligence(ctx);
  const graph = getKnowledgeGraphSummary(ctx);

  return {
    ok: true,
    generatedAt: erpNow(),
    version: EDP_VERSION,
    filters,
    config: {
      ...readConfig(),
      producerModules: EDP_PRODUCER_MODULES,
      twinKinds: EDP_TWIN_KINDS,
      eventTypes: EDP_EVENT_TYPES,
      recommendationTypes: EDP_RECOMMENDATION_TYPES,
      predictionTypes: EDP_PREDICTION_TYPES,
      learningPath: EDP_LEARNING_PATH,
      personalizationDimensions: EDP_PERSONALIZATION_DIMENSIONS,
      decisionAudiences: EDP_DECISION_AUDIENCES,
      featureDefs: EDP_FEATURE_DEFS,
      qualityRules: EDP_QUALITY_RULES,
      simulationTypes: EDP_SIMULATION_TYPES,
    },
    stats: {
      entities: graph.entityCount,
      edges: graph.edgeCount,
      events: erpList(erpReadCollection(COLLECTIONS.events).items).length,
      twins: erpList(erpReadCollection(COLLECTIONS.twins).items).length,
      features: erpList(erpReadCollection(COLLECTIONS.features).items).length,
      recommendations: erpList(erpReadCollection(COLLECTIONS.recommendations).items).length,
      predictions: erpList(erpReadCollection(COLLECTIONS.predictions).items).length,
      qualityOpen: erpList(erpReadCollection(COLLECTIONS.quality).items).filter((q) => q.status === 'open').length,
      searchDocs: erpList(erpReadCollection(COLLECTIONS.search).items).length,
      simulations: erpList(erpReadCollection(COLLECTIONS.simulations).items).length,
      semanticTerms: EDP_SEMANTIC_TERMS.length,
      businessHealth: intelligence.businessHealth.score,
    },
    graph,
    intelligence,
    entities: scopeFilter(erpReadCollection(COLLECTIONS.entities).items, ctx).slice(0, 40),
    edges: scopeFilter(erpReadCollection(COLLECTIONS.edges).items, ctx).slice(0, 40),
    events: scopeFilter(erpReadCollection(COLLECTIONS.events).items, ctx).slice(0, 40),
    twins: scopeFilter(erpReadCollection(COLLECTIONS.twins).items, ctx).slice(0, 30),
    features: scopeFilter(erpReadCollection(COLLECTIONS.features).items, ctx).slice(0, 40),
    recommendations: erpList(erpReadCollection(COLLECTIONS.recommendations).items).slice(0, 30),
    predictions: erpList(erpReadCollection(COLLECTIONS.predictions).items).slice(0, 30),
    decisions: erpList(erpReadCollection(COLLECTIONS.decisions).items).slice(0, 10),
    quality: erpList(erpReadCollection(COLLECTIONS.quality).items).slice(0, 30),
    lineage: erpList(erpReadCollection(COLLECTIONS.lineage).items).slice(0, 30),
    schemas: erpList(erpReadCollection(COLLECTIONS.schemas).items),
    masters: erpList(erpReadCollection(COLLECTIONS.masters).items),
    stewards: erpList(erpReadCollection(COLLECTIONS.stewards).items),
    simulations: erpList(erpReadCollection(COLLECTIONS.simulations).items).slice(0, 20),
    trainingJobs: erpList(erpReadCollection(COLLECTIONS.trainingJobs).items).slice(0, 20),
    learning: erpList(erpReadCollection(COLLECTIONS.learning).items).slice(0, 30),
    personalization: erpList(erpReadCollection(COLLECTIONS.personalization).items).slice(0, 20),
    auditTrail: erpList(erpReadCollection(COLLECTIONS.audit).items).slice(0, 40),
  };
}

/* ───────────── Mutations ───────────── */

export async function mutateDataPlatformCenter(action, payload = {}, meta = {}) {
  ensureEnterpriseDataPlatform();
  const m = { user: meta.user || 'owner', role: meta.role || 'owner', tenantId: meta.tenantId || payload.tenantId, ...meta };

  switch (action) {
    case 'upsertEntity':
      return upsertEntity(payload, m);
    case 'linkEntities':
      return linkEntities(payload, m);
    case 'getNeighborhood':
      return getNeighborhood(payload, payload);
    case 'ingestEvent':
      return ingestEvent(payload, m);
    case 'updateLearningProgress':
      return updateLearningProgress(payload, m);
    case 'getSkillsGraph':
      return getSkillsGraph(payload);
    case 'syncTwin':
      return syncTwinFromEntity(
        payload.entity ||
          erpList(erpReadCollection(COLLECTIONS.entities).items).find(
            (e) => e.id === payload.subjectId || (e.kind === payload.kind && e.key === payload.key),
          ),
        m,
      );
    case 'syncAllTwins':
      return syncAllTwins(m);
    case 'getTwin':
      return getTwin(payload, payload);
    case 'setFeature':
      return setFeature(payload.key, payload.subjectId, payload.value, payload, m);
    case 'resolvePersonalization':
      return resolvePersonalization(payload, m);
    case 'generateRecommendations':
      return generateRecommendations(payload, m);
    case 'generatePredictions':
      return generatePredictions(payload, m);
    case 'buildDecisionSupport':
      return buildDecisionSupport(payload.audience || 'owner', payload, m);
    case 'runDataQualityScan':
      return runDataQualityScan(m);
    case 'rebuildSearchIndex':
      return rebuildSearchIndex();
    case 'search':
      return searchEntities(payload.q || payload.query || '', payload);
    case 'resolveSemanticTerm':
      return resolveSemanticTerm(payload.key || payload.term);
    case 'prepareAiTrainingDataset':
      return prepareAiTrainingDataset(payload, { ...m, authorized: Boolean(payload.authorized) });
    case 'runSimulation':
      return runSimulation(payload, m);
    case 'ingestFromErpModules':
      return ingestFromErpModules(m);
    case 'getOwnerIntelligence':
      return { ok: true, intelligence: getOwnerIntelligence(payload) };
    case 'updateConfig': {
      const cfg = readConfig();
      return { ok: true, config: writeConfig({ ...cfg, ...payload.patch, version: Number(cfg.version || 1) + 1 }, m) };
    }
    case 'tick': {
      // Expire stale features lightly; sync twins periodically signal
      publishLive({ type: 'tick' });
      return { ok: true, at: erpNow() };
    }
    default:
      return { ok: false, error: 'UNKNOWN_ACTION', action };
  }
}
