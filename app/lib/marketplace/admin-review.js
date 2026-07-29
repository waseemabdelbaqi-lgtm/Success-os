/**
 * Admin course review + commission management for Recorded Lessons Marketplace.
 */

import { mem, memCreateId, memNow } from './in-memory-store.js';
import {
  getMarketplaceServiceClient,
  marketplaceSupabaseConfigured,
} from './supabase-server.js';

const ADMIN_TRANSITIONS = Object.freeze({
  SUBMITTED: ['UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'ARCHIVED'],
  UNDER_REVIEW: ['CHANGES_REQUESTED', 'APPROVED', 'SUSPENDED', 'ARCHIVED'],
  CHANGES_REQUESTED: ['SUBMITTED', 'ARCHIVED'],
  APPROVED: ['PUBLISHED', 'SUSPENDED', 'ARCHIVED'],
  PUBLISHED: ['SUSPENDED', 'ARCHIVED'],
  SUSPENDED: ['PUBLISHED', 'ARCHIVED', 'UNDER_REVIEW'],
  ARCHIVED: [],
  DRAFT: ['ARCHIVED'],
});

export function allowedPublicationTransitions(from) {
  return ADMIN_TRANSITIONS[from] || [];
}

export async function listReviewQueue(status = null) {
  const items = marketplaceSupabaseConfigured() && getMarketplaceServiceClient()
    ? await (async () => {
        const client = getMarketplaceServiceClient();
        let q = client.from('recorded_courses').select('*').neq('publication_status', 'DRAFT');
        if (status) q = q.eq('publication_status', status);
        const { data, error } = await q.order('updated_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data || [];
      })()
    : mem().courses.filter((c) =>
        status ? c.publication_status === status : c.publication_status !== 'DRAFT',
      );

  return { ok: true, items };
}

/**
 * Admin status transition. Teachers cannot call this for self-approval.
 */
export async function transitionCourseStatus({
  courseId,
  actorId,
  actorRole,
  toStatus,
  notes = '',
  teacherIdOfCourse = null,
} = {}) {
  const role = String(actorRole || '').toLowerCase();
  const isAdmin = ['admin', 'master-admin', 'master_admin', 'finance-admin', 'finance_admin', 'owner'].includes(
    role,
  );
  if (!isAdmin) return { ok: false, error: 'ADMIN_REQUIRED' };

  // Teacher cannot approve/publish own course even if they somehow hold dual role without admin flag
  if (teacherIdOfCourse && teacherIdOfCourse === actorId && ['APPROVED', 'PUBLISHED'].includes(toStatus)) {
    return { ok: false, error: 'TEACHER_CANNOT_APPROVE_OWN_COURSE' };
  }

  let course;
  if (marketplaceSupabaseConfigured() && getMarketplaceServiceClient()) {
    const client = getMarketplaceServiceClient();
    const { data } = await client.from('recorded_courses').select('*').eq('id', courseId).maybeSingle();
    course = data;
  } else {
    course = mem().courses.find((c) => c.id === courseId);
  }
  if (!course) return { ok: false, error: 'NOT_FOUND' };

  // Self-approval guard using course.teacher_id
  if (
    course.teacher_id === actorId &&
    ['APPROVED', 'PUBLISHED'].includes(toStatus)
  ) {
    return { ok: false, error: 'TEACHER_CANNOT_APPROVE_OWN_COURSE' };
  }

  const allowed = allowedPublicationTransitions(course.publication_status);
  if (!allowed.includes(toStatus)) {
    return {
      ok: false,
      error: 'INVALID_STATUS_TRANSITION',
      from: course.publication_status,
      to: toStatus,
      allowed,
    };
  }

  // Manual publication only — never auto-publish
  const now = memNow();
  course.publication_status = toStatus;
  course.updated_at = now;
  if (toStatus === 'PUBLISHED') course.published_at = now;

  const workflow = {
    id: memCreateId(),
    course_id: courseId,
    status: toStatus,
    reviewer_id: actorId,
    notes: notes || null,
    reviewed_at: now,
    approved_at: toStatus === 'APPROVED' || toStatus === 'PUBLISHED' ? now : null,
    published_at: toStatus === 'PUBLISHED' ? now : null,
    created_at: now,
    updated_at: now,
  };

  if (marketplaceSupabaseConfigured() && getMarketplaceServiceClient()) {
    const client = getMarketplaceServiceClient();
    await client
      .from('recorded_courses')
      .update({
        publication_status: toStatus,
        updated_at: now,
        published_at: course.published_at,
      })
      .eq('id', courseId);
    await client.from('teacher_course_review_workflow').insert(workflow);
  } else {
    mem().workflows.push(workflow);
  }

  return { ok: true, course, workflow };
}

export async function upsertCommissionRule({
  actorId,
  actorRole,
  rule = {},
  reason = '',
} = {}) {
  const role = String(actorRole || '').toLowerCase();
  const allowed = ['finance-admin', 'finance_admin', 'master-admin', 'master_admin', 'owner'].includes(
    role,
  );
  if (!allowed) return { ok: false, error: 'FINANCE_ADMIN_REQUIRED' };
  if (!reason) return { ok: false, error: 'REASON_REQUIRED' };

  const percentage = Number(rule.percentage ?? rule.percent);
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    return { ok: false, error: 'INVALID_PERCENTAGE' };
  }

  const now = memNow();
  let previous = null;
  let next;

  if (rule.id) {
    const existing = mem().commissionRules.find((r) => r.id === rule.id);
    previous = existing ? { ...existing } : null;
    if (!existing) return { ok: false, error: 'RULE_NOT_FOUND' };
    Object.assign(existing, {
      scope: rule.scope || existing.scope,
      source_type: rule.sourceType || rule.source_type || existing.source_type,
      partner_type: rule.partnerType || rule.partner_type || existing.partner_type,
      teacher_id: rule.teacherId || rule.teacher_id || existing.teacher_id,
      course_id: rule.courseId || rule.course_id || existing.course_id,
      campaign_id: rule.campaignId || rule.campaign_id || existing.campaign_id,
      percentage,
      priority: Number(rule.priority ?? existing.priority ?? 0),
      status: rule.status || existing.status,
      effective_start_at: rule.effectiveStartAt || existing.effective_start_at,
      effective_end_at: rule.effectiveEndAt || existing.effective_end_at,
      reason,
      updated_at: now,
    });
    next = existing;
  } else {
    next = {
      id: memCreateId(),
      scope: rule.scope || 'global',
      source_type: rule.sourceType || rule.source_type || null,
      partner_type: rule.partnerType || rule.partner_type || null,
      teacher_id: rule.teacherId || rule.teacher_id || null,
      course_id: rule.courseId || rule.course_id || null,
      campaign_id: rule.campaignId || rule.campaign_id || null,
      percentage,
      priority: Number(rule.priority || 0),
      status: rule.status || 'ACTIVE',
      effective_start_at: rule.effectiveStartAt || null,
      effective_end_at: rule.effectiveEndAt || null,
      created_by: actorId,
      reason,
      created_at: now,
      updated_at: now,
    };
    mem().commissionRules.push(next);
  }

  const audit = {
    id: memCreateId(),
    rule_id: next.id,
    previous_value: previous,
    new_value: { ...next },
    scope: next.scope,
    reason,
    changed_by: actorId,
    effective_date: next.effective_start_at || now,
    created_at: now,
  };
  mem().commissionAudit.push(audit);

  if (marketplaceSupabaseConfigured() && getMarketplaceServiceClient()) {
    const client = getMarketplaceServiceClient();
    if (previous) {
      await client.from('course_commission_rules').update(next).eq('id', next.id);
    } else {
      await client.from('course_commission_rules').insert(next);
    }
    await client.from('course_commission_rule_audit').insert(audit);
  }

  return { ok: true, rule: next, audit };
}

export function listCommissionAudit() {
  return { ok: true, items: [...mem().commissionAudit].reverse() };
}
