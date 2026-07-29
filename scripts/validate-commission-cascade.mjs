#!/usr/bin/env node
import assert from 'node:assert/strict';
import { resolveCommissionCascade } from '../app/lib/admin/commission-cascade.js';

const rules = [
  {
    id: 'camp',
    overrideLayer: 'special_campaign',
    campaignId: 'X',
    percent: 10,
    priority: 1,
    status: 'active',
  },
  {
    id: 'course',
    overrideLayer: 'course_override',
    courseId: 'C1',
    percent: 15,
    priority: 1,
    status: 'active',
  },
  {
    id: 'teacher',
    overrideLayer: 'teacher_override',
    teacherId: 'T1',
    partnerType: 'teacher',
    percent: 20,
    priority: 1,
    status: 'active',
  },
];

const r = resolveCommissionCascade({
  globalCommissionPercent: 30,
  rules,
  context: {
    teacherId: 'T1',
    courseId: 'C1',
    campaignId: 'X',
    partnerType: 'teacher',
    sourceType: 'TEACHER_RECORDED',
  },
  teacherPrice: 100,
});
assert.equal(r.finalCommissionPercent, 10);
assert.equal(r.winnerLayer, 'special_campaign');

console.log(JSON.stringify({ ok: true, winner: r.winnerLayer, percent: r.finalCommissionPercent }, null, 2));
