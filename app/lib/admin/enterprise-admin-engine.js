/**
 * ADMIN-01 — Enterprise Admin Engine
 *
 * Live metrics + CRUD. No fabricated KPI numbers in the UI layer —
 * all counts come from stores / Firestore / curriculum registries.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  ENTERPRISE_ADMIN_SCHEMA,
  ENTERPRISE_ADMIN_VERSION,
  ENTERPRISE_ADMIN_NAV,
  ENTERPRISE_ADMIN_NAV_GROUPS,
  getModuleSchema,
} from '../../data/enterprise-admin-nav.js';
import {
  ENTERPRISE_ADMIN_DEFAULT_ROLES,
  ENTERPRISE_ADMIN_PERMISSION_FLAGS,
  rolePermissionCount,
} from '../../data/enterprise-admin-rbac.js';
import { libraryStatus } from '../ai/library-store.js';
import { ERP_COLLECTION_NAMES } from './enterprise-erp-store.js';
import {
  erpAppendAudit,
  erpArchive,
  erpPermanentDelete,
  erpRestore,
  erpSoftDelete,
  erpSaveVersion,
} from './enterprise-erp-store.js';
import { ensureCommissionDefaults } from './enterprise-commission-engine.js';

const PERFORMANCE_CACHE_MS = 60_000;
let performanceCache = { at: 0, value: null };

function nowIso() {
  return new Date().toISOString();
}

function list(v) {
  return Array.isArray(v) ? v : [];
}

function text(v) {
  return String(v || '').trim();
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function rootDir() {
  return path.join(process.cwd(), 'library', 'enterprise-admin');
}

function collectionPath(name) {
  return path.join(rootDir(), 'collections', `${name}.json`);
}

function ensureStore() {
  fs.mkdirSync(path.join(rootDir(), 'collections'), { recursive: true });
  fs.mkdirSync(path.join(rootDir(), 'metrics'), { recursive: true });
  fs.mkdirSync(path.join(rootDir(), 'activity'), { recursive: true });

  if (!readJson(collectionPath('roles'))) {
    writeJson(collectionPath('roles'), {
      items: ENTERPRISE_ADMIN_DEFAULT_ROLES.map((r) => ({
        ...r,
        id: r.key,
        permissionCount: rolePermissionCount(r),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      })),
      updatedAt: nowIso(),
    });
  } else {
    // Merge newly introduced default roles without wiping Owner customizations
    const rolesDoc = readJson(collectionPath('roles'));
    const existing = list(rolesDoc.items);
    const byKey = new Map(existing.map((r) => [r.key, r]));
    let changed = false;
    for (const def of ENTERPRISE_ADMIN_DEFAULT_ROLES) {
      if (!byKey.has(def.key)) {
        byKey.set(def.key, {
          ...def,
          id: def.key,
          permissionCount: rolePermissionCount(def),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
        changed = true;
      }
    }
    if (changed) {
      writeJson(collectionPath('roles'), {
        items: [...byKey.values()],
        updatedAt: nowIso(),
      });
    }
  }

  for (const name of [
    'students',
    'teachers',
    'employees',
    'parents',
    'schools',
    'universities',
    'educational-centers',
    'recruitment-companies',
    'employers',
    'job-seekers',
    'partners',
    'courses',
    'notifications',
    'audit-logs',
    ...ERP_COLLECTION_NAMES,
  ]) {
    if (!readJson(collectionPath(name))) {
      writeJson(collectionPath(name), { items: [], updatedAt: nowIso() });
    }
  }

  ensureCommissionDefaults();

  if (!readJson(path.join(rootDir(), 'finance.json'))) {
    writeJson(path.join(rootDir(), 'finance.json'), {
      monthlySales: 0,
      annualSales: 0,
      revenue: 0,
      profit: 0,
      outstandingPayments: 0,
      refunds: 0,
      subscriptionRevenue: 0,
      teacherRevenue: 0,
      partnerRevenue: 0,
      invoices: [],
      payments: [],
      updatedAt: nowIso(),
    });
  }

  if (!readJson(path.join(rootDir(), 'activity', 'recent.json'))) {
    writeJson(path.join(rootDir(), 'activity', 'recent.json'), { items: [], updatedAt: nowIso() });
  }
}

function readCollection(name) {
  ensureStore();
  return readJson(collectionPath(name)) || { items: [], updatedAt: null };
}

function writeCollection(name, data) {
  ensureStore();
  const payload = { ...data, updatedAt: nowIso() };
  writeJson(collectionPath(name), payload);
  return payload;
}

function appendActivity(entry) {
  ensureStore();
  const file = path.join(rootDir(), 'activity', 'recent.json');
  const doc = readJson(file) || { items: [] };
  doc.items = [{ id: crypto.randomUUID(), at: nowIso(), ...entry }, ...list(doc.items)].slice(0, 100);
  doc.updatedAt = nowIso();
  writeJson(file, doc);
}

function _countByStatus(items, status) {
  return list(items).filter((i) => i.status === status).length;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function registrationsSince(items, iso) {
  return list(items).filter((i) => i.createdAt && i.createdAt >= iso).length;
}

/** Count book JSON files without parsing full curriculum payloads. */
function countLibraryBookFiles() {
  try {
    const dir = path.join(libraryStatus().root, 'books');
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).length;
  } catch {
    return 0;
  }
}

/**
 * Curriculum / performance counters from existing Success OS registries.
 * Prefer dashboard snapshots (fast, live) over scanning every book file.
 */
function collectPerformanceMetrics() {
  const now = Date.now();
  if (performanceCache.value && now - performanceCache.at < PERFORMANCE_CACHE_MS) {
    return performanceCache.value;
  }

  const g1Dash = readJson(
    path.join(process.cwd(), 'library', 'jordan-grade1-learning-ecosystem', 'dashboards', 'latest.json'),
  );
  const factory = readJson(
    path.join(process.cwd(), 'library', 'success-os-content-factory', 'dashboards', 'latest.json'),
  );
  const kg = readJson(
    path.join(process.cwd(), 'library', 'educational-knowledge-graph', 'dashboards', 'latest.json'),
  );
  const registry = readJson(
    path.join(process.cwd(), 'library', 'national-education-registry', 'dashboards', 'latest.json'),
  );

  const books = countLibraryBookFiles();
  const value = {
    lessonsCompleted: factory?.publishedLessons || g1Dash?.completedLessons || 0,
    recordedVideos: factory?.recordedVideos || g1Dash?.recordedVideos || 0,
    aiGeneratedLessons: factory?.aiGeneratedLessons || g1Dash?.completedLessons || 0,
    books,
    subjects: registry?.totalSubjects || g1Dash?.totalSubjects || 0,
    courses: readCollection('courses').items.length,
    exams: registry?.totalExams || factory?.exams || 0,
    questionBank: kg?.questions || factory?.questions || g1Dash?.totalQuestions || 0,
    certificatesIssued: readCollection('students').items.filter((s) => s.certificateIssued).length,
    grade1EcosystemComplete: Boolean(g1Dash?.grade1Complete),
    knowledgeGraphNodes: kg?.totalNodes || 0,
    knowledgeGraphEdges: kg?.totalEdges || 0,
  };

  performanceCache = { at: now, value };
  writeJson(path.join(rootDir(), 'metrics', 'performance.json'), {
    ...value,
    cachedAt: nowIso(),
  });
  return value;
}

async function tryFirestoreUserStats() {
  try {
    const { getAdminFirestore, COLLECTIONS } = await import('../../../lib/firebase/firestore');
    const db = getAdminFirestore();
    const snap = await db.collection(COLLECTIONS.USERS).get();
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const today = startOfToday();
    const month = startOfMonth();
    const byRole = {};
    for (const u of users) {
      const role = u.role || 'unknown';
      byRole[role] = (byRole[role] || 0) + 1;
    }
    return {
      source: 'firestore',
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status !== 'suspended' && u.disabled !== true).length,
      onlineUsers: users.filter((u) => u.presence === 'online' || u.isOnline === true).length,
      newRegistrationsToday: users.filter((u) => (u.createdAt || '') >= today).length,
      monthlyRegistrations: users.filter((u) => (u.createdAt || '') >= month).length,
      byRole,
    };
  } catch {
    return null;
  }
}

function localUserStats() {
  const students = readCollection('students').items;
  const teachers = readCollection('teachers').items;
  const parents = readCollection('parents').items;
  const employees = readCollection('employees').items;
  const schools = readCollection('schools').items;
  const universities = readCollection('universities').items;
  const centers = readCollection('educational-centers').items;
  const employers = readCollection('employers').items;
  const recruitment = readCollection('recruitment-companies').items;
  const seekers = readCollection('job-seekers').items;
  const partners = readCollection('partners').items;

  const allPeople = [
    ...students.map((s) => ({ ...s, role: 'student' })),
    ...teachers.map((t) => ({ ...t, role: 'teacher' })),
    ...parents.map((p) => ({ ...p, role: 'parent' })),
    ...employees.map((e) => ({ ...e, role: 'employee' })),
  ];

  return {
    source: 'enterprise-admin-store',
    totalUsers: allPeople.length,
    activeUsers: allPeople.filter((u) => u.status === 'active' || !u.status).length,
    onlineUsers: allPeople.filter((u) => u.online === true).length,
    newRegistrationsToday: registrationsSince(allPeople, startOfToday()),
    monthlyRegistrations: registrationsSince(allPeople, startOfMonth()),
    studentGrowth: students.length,
    teacherGrowth: teachers.length,
    schools: schools.length,
    universities: universities.length,
    educationalCenters: centers.length,
    employers: employers.length,
    recruitmentCompanies: recruitment.length,
    jobSeekers: seekers.length,
    parents: parents.length,
    partners: partners.length,
  };
}

export async function buildHomeDashboard() {
  ensureStore();
  const firestoreStats = await tryFirestoreUserStats();
  const local = localUserStats();
  const users = firestoreStats
    ? {
        ...local,
        totalUsers: firestoreStats.totalUsers,
        activeUsers: firestoreStats.activeUsers,
        onlineUsers: firestoreStats.onlineUsers,
        newRegistrationsToday: firestoreStats.newRegistrationsToday,
        monthlyRegistrations: firestoreStats.monthlyRegistrations,
        byRole: firestoreStats.byRole,
        source: firestoreStats.source,
      }
    : local;

  const finance = readJson(path.join(rootDir(), 'finance.json'));
  const performance = collectPerformanceMetrics();
  const activity = readJson(path.join(rootDir(), 'activity', 'recent.json')) || { items: [] };

  const home = {
    schema: ENTERPRISE_ADMIN_SCHEMA,
    version: ENTERPRISE_ADMIN_VERSION,
    generatedAt: nowIso(),
    users: {
      totalUsers: users.totalUsers,
      activeUsers: users.activeUsers,
      onlineUsers: users.onlineUsers,
      newRegistrationsToday: users.newRegistrationsToday,
      monthlyRegistrations: users.monthlyRegistrations,
      studentGrowth: users.studentGrowth ?? readCollection('students').items.length,
      teacherGrowth: users.teacherGrowth ?? readCollection('teachers').items.length,
      schools: users.schools ?? readCollection('schools').items.length,
      universities: users.universities ?? readCollection('universities').items.length,
      educationalCenters: users.educationalCenters ?? readCollection('educational-centers').items.length,
      employers: users.employers ?? readCollection('employers').items.length,
      recruitmentCompanies:
        users.recruitmentCompanies ?? readCollection('recruitment-companies').items.length,
      jobSeekers: users.jobSeekers ?? readCollection('job-seekers').items.length,
      parents: users.parents ?? readCollection('parents').items.length,
      partners: users.partners ?? readCollection('partners').items.length,
      source: users.source,
    },
    finance: {
      monthlySales: finance.monthlySales,
      annualSales: finance.annualSales,
      revenue: finance.revenue,
      profit: finance.profit,
      outstandingPayments: finance.outstandingPayments,
      refunds: finance.refunds,
      subscriptionRevenue: finance.subscriptionRevenue,
      teacherRevenue: finance.teacherRevenue,
      partnerRevenue: finance.partnerRevenue,
    },
    performance,
    recentActivity: list(activity.items).slice(0, 20),
    nav: ENTERPRISE_ADMIN_NAV,
    navGroups: ENTERPRISE_ADMIN_NAV_GROUPS,
  };

  writeJson(path.join(rootDir(), 'metrics', 'home.json'), home);
  return home;
}

export function listModuleItems(moduleId, options = {}) {
  ensureStore();
  const schema = getModuleSchema(moduleId);
  const collectionName = schema.collection || moduleId;
  const doc = readCollection(collectionName);
  let items = list(doc.items);

  // Recycle bin shows deleted snapshots; elsewhere hide soft-deleted / archived unless requested
  if (moduleId === 'recycle-bin') {
    items = list(doc.items);
  } else if (options.includeDeleted === '1' || options.includeDeleted === true) {
    /* keep all */
  } else {
    items = items.filter((i) => !i.deletedAt && !i.archivedAt);
  }

  const q = text(options.q || options.search).toLowerCase();
  if (q) {
    const keys = schema.searchable || ['name'];
    items = items.filter((row) =>
      keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)),
    );
  }
  if (options.status) {
    items = items.filter((row) => row.status === options.status);
  }

  const sortKey = options.sort || 'updatedAt';
  const dir = options.dir === 'asc' ? 1 : -1;
  items = [...items].sort((a, b) => {
    const av = a[sortKey] ?? a.at ?? '';
    const bv = b[sortKey] ?? b.at ?? '';
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  const page = Math.max(1, Number(options.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(options.pageSize) || 25));
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    moduleId,
    schema,
    total: items.length,
    page,
    pageSize,
    items: pageItems,
    updatedAt: doc.updatedAt,
  };
}

export function mutateModule(moduleId, action, payload = {}) {
  ensureStore();
  const schema = getModuleSchema(moduleId);
  const collectionName = schema.collection || moduleId;
  const doc = readCollection(collectionName);
  let items = list(doc.items);

  const audit = (detail) => {
    appendActivity({ moduleId, action, detail });
    const audits = readCollection('audit-logs');
    audits.items = [
      {
        id: crypto.randomUUID(),
        moduleId,
        action,
        detail,
        at: nowIso(),
      },
      ...list(audits.items),
    ].slice(0, 500);
    writeCollection('audit-logs', audits);
  };

  if (action === 'add' || action === 'create') {
    const id = crypto.randomUUID();
    const row = {
      id,
      status: payload.status || 'active',
      ...payload,
      id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      deletedAt: null,
      archivedAt: null,
    };
    if (moduleId === 'teachers' && payload.subjects && !Array.isArray(payload.subjects)) {
      row.subjects = String(payload.subjects)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .join(', ');
    }
    if (moduleId === 'tasks') {
      row.title = payload.title || row.name;
      row.name = row.title;
      row.progress = Number(payload.progress || 0);
      row.comments = list(payload.comments);
      row.completionHistory = list(payload.completionHistory);
      row.notifications = list(payload.notifications);
    }
    items.push(row);
    writeCollection(collectionName, { items });
    audit({ id, name: row.name || row.title });
    erpAppendAudit({
      action: 'create',
      moduleId,
      entityId: id,
      user: payload._actor || 'admin',
      newValue: row,
    });
    return { ok: true, item: row };
  }

  if (action === 'edit' || action === 'update') {
    const id = payload.id;
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    erpSaveVersion(collectionName, items[idx]);
    const before = items[idx];
    items[idx] = {
      ...items[idx],
      ...payload,
      id,
      updatedAt: nowIso(),
    };
    writeCollection(collectionName, { items });
    audit({ id, name: items[idx].name });
    erpAppendAudit({
      action: 'edit',
      moduleId,
      entityId: id,
      user: payload._actor || 'admin',
      oldValue: before,
      newValue: items[idx],
    });
    return { ok: true, item: items[idx] };
  }

  if (action === 'delete') {
    return erpSoftDelete(collectionName, payload.id, {
      user: payload._actor || 'admin',
      reason: payload.reason,
      ip: payload._ip,
      device: payload._device,
    });
  }

  if (action === 'archive') {
    return erpArchive(collectionName, payload.id, { user: payload._actor || 'admin' });
  }

  if (action === 'restore') {
    if (moduleId === 'recycle-bin') {
      const binItem = items.find((i) => i.id === payload.id);
      if (!binItem) return { ok: false, error: 'NOT_FOUND' };
      return erpRestore(binItem.collection, binItem.entityId, { user: payload._actor || 'admin' });
    }
    return erpRestore(collectionName, payload.id, { user: payload._actor || 'admin' });
  }

  if (action === 'permanentDelete') {
    if (moduleId === 'recycle-bin') {
      const binItem = items.find((i) => i.id === payload.id);
      if (!binItem) return { ok: false, error: 'NOT_FOUND' };
      return erpPermanentDelete(binItem.collection, binItem.entityId, {
        role: payload._role || 'owner',
        user: payload._actor || 'owner',
        confirmation: payload.confirmation,
        confirmSteps: payload.confirmSteps,
        reason: payload.reason,
      });
    }
    return erpPermanentDelete(collectionName, payload.id, {
      role: payload._role || 'owner',
      user: payload._actor || 'owner',
      confirmation: payload.confirmation,
      confirmSteps: payload.confirmSteps,
      reason: payload.reason,
    });
  }

  if (action === 'suspend') {
    const id = payload.id;
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    items[idx] = { ...items[idx], status: 'suspended', updatedAt: nowIso() };
    writeCollection(collectionName, { items });
    audit({ id, status: 'suspended' });
    return { ok: true, item: items[idx] };
  }

  if (action === 'activate') {
    const id = payload.id;
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    items[idx] = { ...items[idx], status: 'active', updatedAt: nowIso() };
    writeCollection(collectionName, { items });
    audit({ id, status: 'active' });
    return { ok: true, item: items[idx] };
  }

  if (action === 'transfer' && moduleId === 'students') {
    const id = payload.id;
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    items[idx] = {
      ...items[idx],
      schoolId: payload.schoolId || items[idx].schoolId,
      grade: payload.grade || items[idx].grade,
      transferNote: payload.note || null,
      updatedAt: nowIso(),
    };
    writeCollection(collectionName, { items });
    audit({ id, transfer: true });
    return { ok: true, item: items[idx] };
  }

  if (action === 'assignSubjects' && moduleId === 'teachers') {
    const id = payload.id;
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    items[idx] = {
      ...items[idx],
      subjects: payload.subjects,
      updatedAt: nowIso(),
    };
    writeCollection(collectionName, { items });
    audit({ id, assignSubjects: payload.subjects });
    return { ok: true, item: items[idx] };
  }

  if (action === 'assignClasses' && moduleId === 'teachers') {
    const id = payload.id;
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    items[idx] = {
      ...items[idx],
      classes: payload.classes,
      updatedAt: nowIso(),
    };
    writeCollection(collectionName, { items });
    audit({ id, assignClasses: payload.classes });
    return { ok: true, item: items[idx] };
  }

  if (action === 'verify' && (moduleId === 'partners' || collectionName === 'partners')) {
    const idx = items.findIndex((i) => i.id === payload.id);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    items[idx] = {
      ...items[idx],
      verification: payload.verification || 'verified',
      updatedAt: nowIso(),
    };
    writeCollection(collectionName, { items });
    erpAppendAudit({
      action: 'approval',
      moduleId,
      entityId: payload.id,
      newValue: { verification: items[idx].verification },
    });
    return { ok: true, item: items[idx] };
  }

  if (action === 'approve' || action === 'reject') {
    const idx = items.findIndex((i) => i.id === payload.id);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    items[idx] = {
      ...items[idx],
      status: action === 'approve' ? 'approved' : 'rejected',
      approvalHistory: [
        ...(list(items[idx].approvalHistory) || []),
        { at: nowIso(), action, by: payload._actor || 'admin' },
      ],
      updatedAt: nowIso(),
    };
    writeCollection(collectionName, { items });
    erpAppendAudit({ action: 'approval', moduleId, entityId: payload.id, newValue: { status: items[idx].status } });
    return { ok: true, item: items[idx] };
  }

  if (action === 'complete' && moduleId === 'tasks') {
    const idx = items.findIndex((i) => i.id === payload.id);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    items[idx] = {
      ...items[idx],
      status: 'completed',
      progress: 100,
      completionHistory: [
        ...list(items[idx].completionHistory),
        { at: nowIso(), by: payload._actor || 'admin', note: payload.note || null },
      ],
      updatedAt: nowIso(),
    };
    writeCollection(collectionName, { items });
    return { ok: true, item: items[idx] };
  }

  if (action === 'comment' && moduleId === 'tasks') {
    const idx = items.findIndex((i) => i.id === payload.id);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    items[idx] = {
      ...items[idx],
      comments: [
        ...list(items[idx].comments),
        { id: crypto.randomUUID(), at: nowIso(), by: payload._actor || 'admin', body: payload.body || '' },
      ],
      updatedAt: nowIso(),
    };
    writeCollection(collectionName, { items });
    return { ok: true, item: items[idx] };
  }

  if (action === 'notify' && (moduleId === 'tasks' || moduleId === 'notification-jobs' || moduleId === 'notifications')) {
    const idx = items.findIndex((i) => i.id === payload.id);
    if (idx < 0 && moduleId === 'tasks') return { ok: false, error: 'NOT_FOUND' };
    if (moduleId === 'tasks') {
      items[idx] = {
        ...items[idx],
        notifications: [
          ...list(items[idx].notifications),
          {
            id: crypto.randomUUID(),
            at: nowIso(),
            channel: payload.channel || 'in_app',
            message: payload.message || `Task update: ${items[idx].title}`,
          },
        ],
        updatedAt: nowIso(),
      };
      writeCollection(collectionName, { items });
      return { ok: true, item: items[idx] };
    }
    if (idx >= 0) {
      items[idx] = { ...items[idx], status: 'sent', sentAt: nowIso(), updatedAt: nowIso() };
      writeCollection(collectionName, { items });
      erpAppendAudit({ action: 'system_change', moduleId, entityId: payload.id, newValue: { status: 'sent' } });
      return { ok: true, item: items[idx] };
    }
  }

  if (action === 'send') {
    const idx = items.findIndex((i) => i.id === payload.id);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    items[idx] = { ...items[idx], status: 'sent', sentAt: nowIso(), updatedAt: nowIso() };
    writeCollection(collectionName, { items });
    return { ok: true, item: items[idx] };
  }

  if (action === 'markPaid' && moduleId === 'hr-payroll') {
    const idx = items.findIndex((i) => i.id === payload.id);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    items[idx] = { ...items[idx], status: 'paid', paidAt: nowIso(), updatedAt: nowIso() };
    writeCollection(collectionName, { items });
    return { ok: true, item: items[idx] };
  }

  if (action === 'bulkDelete') {
    const ids = list(payload.ids);
    for (const id of ids) {
      erpSoftDelete(collectionName, id, { user: payload._actor || 'admin', reason: 'bulk_delete' });
    }
    return { ok: true, deleted: ids };
  }

  return { ok: false, error: 'UNKNOWN_ACTION', action };
}

export function getPermissionsMatrix() {
  ensureStore();
  const doc = readCollection('roles');
  return {
    flags: ENTERPRISE_ADMIN_PERMISSION_FLAGS,
    roles: list(doc.items).map((r) => ({
      ...r,
      permissionCount: rolePermissionCount(r),
    })),
    updatedAt: doc.updatedAt,
  };
}

export function mutatePermissions(action, payload = {}) {
  ensureStore();
  const doc = readCollection('roles');
  let items = list(doc.items);

  if (action === 'createRole') {
    const key = text(payload.key || payload.name)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '_');
    if (!key) return { ok: false, error: 'KEY_REQUIRED' };
    if (items.some((r) => r.key === key)) return { ok: false, error: 'ROLE_EXISTS' };
    const role = {
      id: key,
      key,
      name: payload.name || key,
      description: payload.description || '',
      permissions: list(payload.permissions),
      permissionCount: list(payload.permissions).length,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    items.push(role);
    writeCollection('roles', { items });
    appendActivity({ moduleId: 'permissions', action: 'createRole', detail: { key } });
    return { ok: true, role };
  }

  if (action === 'assignPermissions' || action === 'updateRolePermissions') {
    const key = payload.key || payload.id;
    const idx = items.findIndex((r) => r.key === key || r.id === key);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    const permissions = list(payload.permissions).filter((p) =>
      ENTERPRISE_ADMIN_PERMISSION_FLAGS.includes(p),
    );
    items[idx] = {
      ...items[idx],
      permissions,
      permissionCount: permissions.length,
      updatedAt: nowIso(),
    };
    writeCollection('roles', { items });
    appendActivity({
      moduleId: 'permissions',
      action: 'assignPermissions',
      detail: { key, count: permissions.length },
    });
    return { ok: true, role: items[idx] };
  }

  if (action === 'togglePermission') {
    const key = payload.key || payload.id;
    const flag = payload.permission;
    const idx = items.findIndex((r) => r.key === key || r.id === key);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    if (!ENTERPRISE_ADMIN_PERMISSION_FLAGS.includes(flag)) {
      return { ok: false, error: 'UNKNOWN_PERMISSION' };
    }
    const set = new Set(list(items[idx].permissions));
    if (set.has(flag)) set.delete(flag);
    else set.add(flag);
    const permissions = [...set];
    items[idx] = {
      ...items[idx],
      permissions,
      permissionCount: permissions.length,
      updatedAt: nowIso(),
    };
    writeCollection('roles', { items });
    return { ok: true, role: items[idx] };
  }

  if (action === 'deleteRole') {
    const key = payload.key || payload.id;
    if (['super_admin', 'owner', 'admin'].includes(key)) {
      return { ok: false, error: 'PROTECTED_ROLE' };
    }
    items = items.filter((r) => r.key !== key && r.id !== key);
    writeCollection('roles', { items });
    return { ok: true, deleted: key };
  }

  return { ok: false, error: 'UNKNOWN_ACTION' };
}

export function exportModuleCsv(moduleId, options = {}) {
  const result = listModuleItems(moduleId, { ...options, page: 1, pageSize: 10000 });
  const cols = result.schema.columns || [];
  const header = cols.map((c) => c.label).join(',');
  const lines = result.items.map((row) =>
    cols
      .map((c) => {
        const v = row[c.key] ?? '';
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      })
      .join(','),
  );
  return {
    filename: `${moduleId}-${Date.now()}.csv`,
    csv: [header, ...lines].join('\n'),
    total: result.total,
  };
}

export function getEnterpriseAdminMeta() {
  return {
    schema: ENTERPRISE_ADMIN_SCHEMA,
    version: ENTERPRISE_ADMIN_VERSION,
    nav: ENTERPRISE_ADMIN_NAV,
    navGroups: ENTERPRISE_ADMIN_NAV_GROUPS,
  };
}
