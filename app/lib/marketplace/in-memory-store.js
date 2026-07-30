/**
 * In-memory marketplace store for TEST_MODE / unit tests when Supabase is unavailable.
 * Not a permanent financial database — production must use Supabase.
 */

import crypto from 'node:crypto';

function id() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

const g = globalThis;
if (!g.__MARKETPLACE_MEM__) {
  g.__MARKETPLACE_MEM__ = {
    courses: [],
    units: [],
    lessons: [],
    commissionRules: [
      {
        id: id(),
        scope: 'lesson_source',
        source_type: 'TEACHER_RECORDED',
        percentage: 15,
        priority: 0,
        status: 'ACTIVE',
        reason: 'Default recorded teacher course commission: 15% platform / 85% teacher gross',
        created_at: now(),
        updated_at: now(),
      },
    ],
    commissionAudit: [],
    purchases: [],
    snapshots: [],
    enrolments: [],
    payouts: [],
    reviews: [],
    workflows: [],
    aiosJobs: [],
  };
}

export function mem() {
  return g.__MARKETPLACE_MEM__;
}

export function memReset() {
  g.__MARKETPLACE_MEM__ = {
    courses: [],
    units: [],
    lessons: [],
    commissionRules: [
      {
        id: id(),
        scope: 'lesson_source',
        source_type: 'TEACHER_RECORDED',
        percentage: 15,
        priority: 0,
        status: 'ACTIVE',
        reason: 'Default recorded teacher course commission: 15% platform / 85% teacher gross',
        created_at: now(),
        updated_at: now(),
      },
    ],
    commissionAudit: [],
    purchases: [],
    snapshots: [],
    enrolments: [],
    payouts: [],
    reviews: [],
    workflows: [],
    aiosJobs: [],
  };
  return g.__MARKETPLACE_MEM__;
}

export function memCreateId() {
  return id();
}

export function memNow() {
  return now();
}
