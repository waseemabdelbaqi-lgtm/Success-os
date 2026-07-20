/**
 * ADMIN-NEXT — Enterprise ERP store helpers.
 * Soft-delete / archive / restore / recycle bin. Never hard-delete by default.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function erpNow() {
  return new Date().toISOString();
}

export function erpRoot() {
  return path.join(process.cwd(), 'library', 'enterprise-admin');
}

export function erpWriteJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function erpReadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function erpList(v) {
  return Array.isArray(v) ? v : [];
}

export function erpText(v) {
  return String(v || '').trim();
}

export function erpId() {
  return crypto.randomUUID();
}

export function erpCollectionPath(name) {
  return path.join(erpRoot(), 'collections', `${name}.json`);
}

export function erpEnsureDirs() {
  fs.mkdirSync(path.join(erpRoot(), 'collections'), { recursive: true });
  fs.mkdirSync(path.join(erpRoot(), 'config'), { recursive: true });
  fs.mkdirSync(path.join(erpRoot(), 'ledger'), { recursive: true });
  fs.mkdirSync(path.join(erpRoot(), 'audit'), { recursive: true });
  fs.mkdirSync(path.join(erpRoot(), 'recycle-bin'), { recursive: true });
  fs.mkdirSync(path.join(erpRoot(), 'versions'), { recursive: true });
}

/** Immutable forever audit (append-only JSONL). */
export function erpAppendAudit(entry) {
  erpEnsureDirs();
  const day = (entry.at || erpNow()).slice(0, 10);
  const file = path.join(erpRoot(), 'audit', `${day}.jsonl`);
  const row = {
    id: erpId(),
    at: erpNow(),
    ...entry,
  };
  fs.appendFileSync(file, `${JSON.stringify(row)}\n`, 'utf8');

  // Also mirror into searchable collection (capped for UI; forever file remains in jsonl)
  const colFile = erpCollectionPath('audit-logs');
  const doc = erpReadJson(colFile) || { items: [] };
  doc.items = [row, ...erpList(doc.items)].slice(0, 5000);
  doc.updatedAt = erpNow();
  erpWriteJson(colFile, doc);
  return row;
}

export function erpReadCollection(name) {
  erpEnsureDirs();
  const file = erpCollectionPath(name);
  if (!erpReadJson(file)) {
    erpWriteJson(file, { items: [], updatedAt: erpNow() });
  }
  return erpReadJson(file) || { items: [], updatedAt: null };
}

export function erpWriteCollection(name, data) {
  erpEnsureDirs();
  const payload = { ...data, updatedAt: erpNow() };
  erpWriteJson(erpCollectionPath(name), payload);
  return payload;
}

/** Active (non-deleted, non-archived) items for normal lists. */
export function erpActiveItems(items) {
  return erpList(items).filter((i) => !i.deletedAt && !i.archivedAt);
}

export function erpSaveVersion(collection, item) {
  if (!item?.id) return;
  erpEnsureDirs();
  const file = path.join(erpRoot(), 'versions', collection, `${item.id}.json`);
  const doc = erpReadJson(file) || { id: item.id, versions: [] };
  doc.versions = [
    { at: erpNow(), snapshot: item },
    ...erpList(doc.versions),
  ].slice(0, 100);
  erpWriteJson(file, doc);
}

export function erpSoftDelete(collection, id, meta = {}) {
  const doc = erpReadCollection(collection);
  const idx = erpList(doc.items).findIndex((i) => i.id === id);
  if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
  const before = doc.items[idx];
  erpSaveVersion(collection, before);
  const after = {
    ...before,
    deletedAt: erpNow(),
    deletedBy: meta.user || meta.actor || 'system',
    deleteReason: meta.reason || null,
    updatedAt: erpNow(),
  };
  doc.items[idx] = after;
  erpWriteCollection(collection, doc);

  const bin = erpReadCollection('recycle-bin');
  bin.items = [
    {
      id: erpId(),
      collection,
      entityId: id,
      snapshot: after,
      deletedAt: after.deletedAt,
      deletedBy: after.deletedBy,
      reason: after.deleteReason,
      name: after.name || after.title || after.email || id,
      status: 'deleted',
    },
    ...erpList(bin.items),
  ].slice(0, 10000);
  erpWriteCollection('recycle-bin', bin);

  erpAppendAudit({
    action: 'soft_delete',
    moduleId: collection,
    entityId: id,
    user: after.deletedBy,
    oldValue: before,
    newValue: { deletedAt: after.deletedAt },
    reason: meta.reason || null,
    ip: meta.ip || null,
    device: meta.device || null,
  });

  return { ok: true, item: after };
}

export function erpArchive(collection, id, meta = {}) {
  const doc = erpReadCollection(collection);
  const idx = erpList(doc.items).findIndex((i) => i.id === id);
  if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
  const before = doc.items[idx];
  erpSaveVersion(collection, before);
  const after = {
    ...before,
    archivedAt: erpNow(),
    archivedBy: meta.user || 'system',
    updatedAt: erpNow(),
  };
  doc.items[idx] = after;
  erpWriteCollection(collection, doc);
  erpAppendAudit({
    action: 'archive',
    moduleId: collection,
    entityId: id,
    user: meta.user || 'system',
    oldValue: { archivedAt: before.archivedAt || null },
    newValue: { archivedAt: after.archivedAt },
  });
  return { ok: true, item: after };
}

export function erpRestore(collection, id, meta = {}) {
  const doc = erpReadCollection(collection);
  const idx = erpList(doc.items).findIndex((i) => i.id === id);
  if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
  const before = doc.items[idx];
  const after = {
    ...before,
    deletedAt: null,
    archivedAt: null,
    restoredAt: erpNow(),
    restoredBy: meta.user || 'system',
    updatedAt: erpNow(),
  };
  doc.items[idx] = after;
  erpWriteCollection(collection, doc);

  const bin = erpReadCollection('recycle-bin');
  bin.items = erpList(bin.items).filter((b) => !(b.collection === collection && b.entityId === id));
  erpWriteCollection('recycle-bin', bin);

  erpAppendAudit({
    action: 'restore',
    moduleId: collection,
    entityId: id,
    user: meta.user || 'system',
    oldValue: { deletedAt: before.deletedAt, archivedAt: before.archivedAt },
    newValue: { restoredAt: after.restoredAt },
  });
  return { ok: true, item: after };
}

/**
 * Permanent delete — Owner only, multi-step confirmation required.
 * confirmation must equal "PERMANENTLY_DELETE" and confirmSteps >= 2.
 */
export function erpPermanentDelete(collection, id, meta = {}) {
  if (meta.role !== 'owner' && meta.role !== 'super_admin') {
    return { ok: false, error: 'OWNER_ONLY' };
  }
  if (meta.confirmation !== 'PERMANENTLY_DELETE' || Number(meta.confirmSteps) < 2) {
    return { ok: false, error: 'MULTI_STEP_CONFIRMATION_REQUIRED' };
  }
  const doc = erpReadCollection(collection);
  const before = erpList(doc.items).find((i) => i.id === id);
  if (!before) return { ok: false, error: 'NOT_FOUND' };
  erpSaveVersion(collection, before);
  doc.items = erpList(doc.items).filter((i) => i.id !== id);
  erpWriteCollection(collection, doc);
  const bin = erpReadCollection('recycle-bin');
  bin.items = erpList(bin.items).filter((b) => !(b.collection === collection && b.entityId === id));
  erpWriteCollection('recycle-bin', bin);
  erpAppendAudit({
    action: 'permanent_delete',
    moduleId: collection,
    entityId: id,
    user: meta.user || 'owner',
    oldValue: before,
    newValue: null,
    reason: meta.reason || 'owner_confirmed_permanent_delete',
  });
  return { ok: true, permanentlyDeleted: id };
}

export const ERP_COLLECTION_NAMES = Object.freeze([
  // HR
  'hr-departments',
  'hr-positions',
  'employees',
  'hr-contracts',
  'hr-payroll',
  'hr-attendance',
  'hr-leave',
  'hr-performance',
  'hr-bonuses',
  'hr-penalties',
  'hr-notes',
  'hr-documents',
  'hr-signatures',
  'hr-bank-accounts',
  // Tasks / workflow
  'tasks',
  'teams',
  'workflow-approvals',
  // Partners (typed)
  'partners',
  'partner-contracts',
  'partner-subscriptions',
  // Commission / payments / payouts
  'commission-rules',
  'commission-rule-versions',
  'payment-splits',
  'invoices',
  'receipts',
  'ledger',
  'settlements',
  'payouts',
  'refunds',
  'expenses',
  // Social / notifications
  'social-accounts',
  'social-campaigns',
  'social-posts',
  'notification-jobs',
  // System
  'recycle-bin',
  'temporary-permissions',
  'department-permissions',
  'country-permissions',
  // Enterprise Data Platform
  'edp-entities',
  'edp-edges',
  'edp-events',
  'edp-twins',
  'edp-features',
  'edp-recommendations',
  'edp-predictions',
  'edp-decisions',
  'edp-quality-findings',
  'edp-lineage',
  'edp-schemas',
  'edp-masters',
  'edp-search-index',
  'edp-simulations',
  'edp-training-jobs',
  'edp-personalization',
  'edp-learning-progress',
  'edp-stewards',
  'edp-audit',
]);
