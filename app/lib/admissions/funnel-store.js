/**
 * Server-side admission funnel store.
 * Uses in-memory Map with optional JSON persistence under .data/ when writable.
 * Swap for Firestore collections when Admin SDK credentials are live:
 *   admission_profiles | admission_payments | admission_applications | admission_notifications
 */

import { promises as fs } from 'fs';
import path from 'path';

const ROOT = path.join(process.cwd(), '.data', 'admission-funnel');

/** @type {Map<string, any>} */
const payments = new Map();
/** @type {Map<string, any>} */
const applications = new Map();
/** @type {Map<string, any>} */
const notifications = new Map();

let hydrated = false;

async function ensureDir() {
  try {
    await fs.mkdir(ROOT, { recursive: true });
  } catch {
    /* ignore */
  }
}

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  await ensureDir();
  for (const [name, map] of [
    ['payments.json', payments],
    ['applications.json', applications],
    ['notifications.json', notifications],
  ]) {
    try {
      const raw = await fs.readFile(path.join(ROOT, name), 'utf8');
      const rows = JSON.parse(raw);
      if (Array.isArray(rows)) {
        for (const row of rows) {
          if (row?.id) map.set(row.id, row);
        }
      }
    } catch {
      /* first run */
    }
  }
}

async function persist(name, map) {
  await ensureDir();
  try {
    await fs.writeFile(
      path.join(ROOT, name),
      JSON.stringify([...map.values()], null, 2),
      'utf8',
    );
  } catch {
    /* ephemeral environments may be read-only */
  }
}

export async function createPayment(record) {
  await hydrate();
  payments.set(record.id, record);
  await persist('payments.json', payments);
  return record;
}

export async function getPayment(id) {
  await hydrate();
  return payments.get(id) || null;
}

export async function markPaymentPaid(id, patch = {}) {
  await hydrate();
  const current = payments.get(id);
  if (!current) return null;
  const next = {
    ...current,
    ...patch,
    status: 'paid',
    paidAt: new Date().toISOString(),
  };
  payments.set(id, next);
  await persist('payments.json', payments);
  return next;
}

export async function saveApplication(record) {
  await hydrate();
  applications.set(record.id, record);
  await persist('applications.json', applications);
  return record;
}

export async function getApplication(id) {
  await hydrate();
  return applications.get(id) || null;
}

export async function listApplicationsByInstitution(institutionId) {
  await hydrate();
  return [...applications.values()].filter((a) => a.institutionId === institutionId);
}

export async function pushNotifications(rows = []) {
  await hydrate();
  for (const row of rows) {
    notifications.set(row.id, row);
  }
  await persist('notifications.json', notifications);
  return rows;
}

export async function listNotificationsForRole(role) {
  await hydrate();
  return [...notifications.values()].filter((n) => !role || n.to === role);
}
