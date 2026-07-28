#!/usr/bin/env node
import assert from 'node:assert/strict';
import { resolveCommissionCascade } from '../app/lib/admin/commission-cascade.js';
import {
  ensureCommissionDefaults,
  mutateCommissionRule,
  previewCommissionCascade,
  setCommissionDefaults,
} from '../app/lib/admin/enterprise-commission-engine.js';

setCommissionDefaults(
  {
    globalCommissionPercent: 30,
    recordedLessonCommissionPercent: 30,
  },
  { user: 'test' },
);

const defaults = ensureCommissionDefaults();
assert.equal(Number(defaults.globalCommissionPercent), 30);

const base = previewCommissionCascade({
  teacherPrice: 50,
  service: 'recorded-lesson',
  partnerType: 'teacher',
});
assert.equal(base.finalCommissionPercent, 30);
assert.equal(base.winnerLayer, 'global');
assert.deepEqual(
  base.cascadeSteps.map((s) => s.label),
  [
    'Global Commission',
    'Teacher Override',
    'Center Override',
    'Special Campaign',
    'Final Commission',
  ],
);
assert.equal(base.teacherReceives, 35);
assert.equal(base.successOs, 15);

const teacherRule = mutateCommissionRule('add', {
  name: 'Teacher VIP',
  overrideLayer: 'teacher_override',
  partnerType: 'teacher',
  partnerId: 'teacher-1',
  pricingType: 'percentage',
  percent: 20,
  status: 'active',
});
assert.equal(teacherRule.ok, true, teacherRule.error);

const withTeacher = previewCommissionCascade({
  teacherPrice: 50,
  service: 'recorded-lesson',
  partnerType: 'teacher',
  partnerId: 'teacher-1',
  teacherId: 'teacher-1',
});
assert.equal(withTeacher.finalCommissionPercent, 20);
assert.equal(withTeacher.winnerLayer, 'teacher_override');
assert.equal(withTeacher.teacherReceives, 40);
assert.equal(withTeacher.successOs, 10);

const centerRule = mutateCommissionRule('add', {
  name: 'Center Deal',
  overrideLayer: 'center_override',
  partnerType: 'center',
  partnerId: 'center-9',
  pricingType: 'percentage',
  percent: 15,
  status: 'active',
});
assert.equal(centerRule.ok, true);

const withCenter = previewCommissionCascade({
  teacherPrice: 50,
  service: 'recorded-lesson',
  partnerType: 'center',
  centerId: 'center-9',
  partnerId: 'center-9',
});
assert.equal(withCenter.finalCommissionPercent, 15);
assert.equal(withCenter.winnerLayer, 'center_override');

const campaignRule = mutateCommissionRule('add', {
  name: 'Launch Campaign',
  overrideLayer: 'special_campaign',
  promotionId: 'camp-100',
  pricingType: 'percentage',
  percent: 10,
  status: 'active',
});
assert.equal(campaignRule.ok, true);

const withCampaign = previewCommissionCascade({
  teacherPrice: 50,
  service: 'recorded-lesson',
  partnerType: 'teacher',
  partnerId: 'teacher-1',
  promotionId: 'camp-100',
});
assert.equal(withCampaign.finalCommissionPercent, 10);
assert.equal(withCampaign.winnerLayer, 'special_campaign');
assert.equal(withCampaign.teacherReceives, 45);
assert.equal(withCampaign.successOs, 5);

const pure = resolveCommissionCascade({
  globalCommissionPercent: 30,
  rules: [],
  teacherPrice: 50,
});
assert.equal(pure.finalCommissionPercent, 30);

console.log(
  JSON.stringify(
    {
      ok: true,
      cascade: [
        'Global Commission 30%',
        'Teacher Override',
        'Center Override',
        'Special Campaign',
        'Final Commission',
      ],
      examples: {
        globalOnly: { final: base.finalCommissionPercent, teacher: base.teacherReceives, os: base.successOs },
        teacherOverride: {
          final: withTeacher.finalCommissionPercent,
          teacher: withTeacher.teacherReceives,
          os: withTeacher.successOs,
        },
        centerOverride: { final: withCenter.finalCommissionPercent },
        specialCampaign: {
          final: withCampaign.finalCommissionPercent,
          teacher: withCampaign.teacherReceives,
          os: withCampaign.successOs,
        },
      },
    },
    null,
    2,
  ),
);
