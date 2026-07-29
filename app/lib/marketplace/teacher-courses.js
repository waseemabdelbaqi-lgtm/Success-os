/**
 * Teacher recorded-course CRUD + earnings (server-side).
 * Teachers set public price; cannot change commission.
 */

import { resolveMarketplaceCommission } from './commission-engine.js';
import { listCommissionRules } from './catalog.js';
import { mem, memCreateId, memNow } from './in-memory-store.js';
import { validateTeacherRightsDeclaration } from './rights.js';
import {
  getMarketplaceServiceClient,
  marketplaceSupabaseConfigured,
} from './supabase-server.js';

const EDITABLE = new Set(['DRAFT', 'CHANGES_REQUESTED']);

export async function listTeacherCourses(teacherId) {
  if (!teacherId) return { ok: false, error: 'TEACHER_REQUIRED', items: [] };
  if (marketplaceSupabaseConfigured() && getMarketplaceServiceClient()) {
    const client = getMarketplaceServiceClient();
    const { data, error } = await client
      .from('recorded_courses')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('updated_at', { ascending: false });
    if (error) return { ok: false, error: error.message, items: [] };
    return { ok: true, items: data || [] };
  }
  return {
    ok: true,
    items: mem().courses.filter((c) => c.teacher_id === teacherId),
  };
}

export async function createTeacherCourse(teacherId, payload = {}) {
  if (!teacherId) return { ok: false, error: 'TEACHER_REQUIRED' };
  const title = String(payload.title || '').trim();
  if (!title) return { ok: false, error: 'TITLE_REQUIRED' };

  const price = Number(payload.price);
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: 'INVALID_PRICE' };

  const now = memNow();
  const row = {
    id: memCreateId(),
    owner_type: 'TEACHER',
    teacher_id: teacherId,
    source_type: 'TEACHER_RECORDED',
    title,
    description: String(payload.description || ''),
    country: payload.country || null,
    educational_system: payload.educationalSystem || payload.educational_system || null,
    curriculum: payload.curriculum || null,
    qualification: payload.qualification || null,
    grade_level: payload.grade || payload.gradeLevel || payload.grade_level || null,
    subject_family: payload.subjectFamily || payload.subject_family || null,
    subject: payload.subject || null,
    language: payload.language || null,
    subtitle_languages: payload.subtitleLanguages || payload.subtitle_languages || [],
    course_level: payload.level || payload.courseLevel || null,
    price,
    currency: payload.currency || 'USD',
    promotional_price: payload.promotionalPrice ?? payload.promotional_price ?? null,
    promotion_start_at: payload.promotionStartAt || null,
    promotion_end_at: payload.promotionEndAt || null,
    publication_status: 'DRAFT',
    rating_average: 0,
    rating_count: 0,
    enrolment_count: 0,
    total_lessons: 0,
    total_duration_minutes: 0,
    cover_asset_url: payload.coverAssetUrl || null,
    preview_enabled: Boolean(payload.previewEnabled),
    teacher_display_name: payload.teacherDisplayName || payload.teacherName || null,
    teacher_verified: Boolean(payload.teacherVerified),
    teacher_image_url: payload.teacherImageUrl || null,
    teacher_gender: payload.teacherGender || 'not_specified',
    copyright_declaration_accepted: Boolean(payload.copyrightDeclarationAccepted),
    rights_policy_flags: payload.rightsPolicyFlags || {},
    units: payload.units || [],
    created_at: now,
    updated_at: now,
    published_at: null,
  };

  if (marketplaceSupabaseConfigured() && getMarketplaceServiceClient()) {
    const client = getMarketplaceServiceClient();
    const { units, ...dbRow } = row;
    void units;
    const { data, error } = await client.from('recorded_courses').insert(dbRow).select('*').single();
    if (error) return { ok: false, error: error.message };
    const preview = await previewTeacherPricing(price, row.currency, teacherId, data.id);
    return { ok: true, course: data, pricingPreview: preview };
  }

  mem().courses.push(row);
  mem().workflows.push({
    id: memCreateId(),
    course_id: row.id,
    status: 'DRAFT',
    reviewer_id: null,
    notes: null,
    created_at: now,
    updated_at: now,
  });
  const preview = await previewTeacherPricing(price, row.currency, teacherId, row.id);
  return { ok: true, course: row, pricingPreview: preview };
}

export async function previewTeacherPricing(price, currency = 'USD', teacherId = null, courseId = null) {
  const rules = await listCommissionRules();
  const resolution = resolveMarketplaceCommission({
    originalPrice: price,
    discountAmount: 0,
    currency,
    sourceType: 'TEACHER_RECORDED',
    teacherId,
    courseId,
    partnerType: 'teacher',
    rules,
  });
  return {
    coursePrice: resolution.originalPrice,
    platformCommissionPercentage: resolution.effectiveCommissionPercentage,
    platformCommissionAmount: resolution.platformCommissionAmount,
    teacherEstimatedGrossShare: resolution.teacherGrossShare,
    currency: resolution.currency,
    // Teachers cannot change commission — exposed read-only
    commissionEditableByTeacher: false,
  };
}

export async function updateTeacherCourse(teacherId, courseId, patch = {}) {
  const list = await listTeacherCourses(teacherId);
  const course = (list.items || []).find((c) => c.id === courseId);
  if (!course) return { ok: false, error: 'NOT_FOUND' };
  if (!EDITABLE.has(course.publication_status)) {
    return { ok: false, error: 'COURSE_NOT_EDITABLE_IN_CURRENT_STATUS' };
  }
  // Strip commission fields — teachers cannot change commission
  const {
    commissionPercent,
    commission_percent,
    effectiveCommissionPercentage,
    ...safePatch
  } = patch;
  void commissionPercent;
  void commission_percent;
  void effectiveCommissionPercentage;

  if (safePatch.price != null) {
    const price = Number(safePatch.price);
    if (!Number.isFinite(price) || price < 0) return { ok: false, error: 'INVALID_PRICE' };
    course.price = price;
  }
  for (const key of [
    'title',
    'description',
    'country',
    'curriculum',
    'subject',
    'language',
    'currency',
  ]) {
    if (safePatch[key] != null) course[key] = safePatch[key];
  }
  if (safePatch.grade != null) course.grade_level = safePatch.grade;
  if (safePatch.units != null) course.units = safePatch.units;
  course.updated_at = memNow();

  if (marketplaceSupabaseConfigured() && getMarketplaceServiceClient()) {
    const client = getMarketplaceServiceClient();
    const { error } = await client
      .from('recorded_courses')
      .update({
        title: course.title,
        description: course.description,
        price: course.price,
        currency: course.currency,
        grade_level: course.grade_level,
        subject: course.subject,
        curriculum: course.curriculum,
        country: course.country,
        language: course.language,
        updated_at: course.updated_at,
      })
      .eq('id', courseId)
      .eq('teacher_id', teacherId);
    if (error) return { ok: false, error: error.message };
  }

  const pricingPreview = await previewTeacherPricing(
    course.price,
    course.currency,
    teacherId,
    courseId,
  );
  return { ok: true, course, pricingPreview };
}

export async function submitTeacherCourseForReview(teacherId, courseId, declaration = {}) {
  const list = await listTeacherCourses(teacherId);
  const course = (list.items || []).find((c) => c.id === courseId);
  if (!course) return { ok: false, error: 'NOT_FOUND' };
  if (!EDITABLE.has(course.publication_status)) {
    return { ok: false, error: 'INVALID_STATUS_TRANSITION' };
  }

  const rights = validateTeacherRightsDeclaration({
    ...declaration,
    copyrightDeclarationAccepted:
      declaration.copyrightDeclarationAccepted ?? course.copyright_declaration_accepted,
    rightsPolicyFlags: declaration.rightsPolicyFlags ?? course.rights_policy_flags,
  });
  if (!rights.ok) return rights;

  // Teacher cannot approve or publish own course
  course.copyright_declaration_accepted = true;
  course.publication_status = 'SUBMITTED';
  course.updated_at = memNow();

  const workflow = {
    id: memCreateId(),
    course_id: courseId,
    status: 'SUBMITTED',
    reviewer_id: null,
    notes: null,
    submitted_at: course.updated_at,
    created_at: course.updated_at,
    updated_at: course.updated_at,
  };

  if (marketplaceSupabaseConfigured() && getMarketplaceServiceClient()) {
    const client = getMarketplaceServiceClient();
    await client
      .from('recorded_courses')
      .update({
        publication_status: 'SUBMITTED',
        copyright_declaration_accepted: true,
        updated_at: course.updated_at,
      })
      .eq('id', courseId)
      .eq('teacher_id', teacherId);
    await client.from('teacher_course_review_workflow').insert(workflow);
  } else {
    mem().workflows.push(workflow);
  }

  const pricingPreview = await previewTeacherPricing(
    course.price,
    course.currency,
    teacherId,
    courseId,
  );
  return { ok: true, course, workflow, pricingPreview };
}

export async function getTeacherEarnings(teacherId) {
  const payouts = marketplaceSupabaseConfigured() && getMarketplaceServiceClient()
    ? await (async () => {
        const client = getMarketplaceServiceClient();
        const { data } = await client
          .from('teacher_payout_ledger')
          .select('*')
          .eq('teacher_id', teacherId);
        return data || [];
      })()
    : mem().payouts.filter((p) => p.teacher_id === teacherId);

  const snapshots = marketplaceSupabaseConfigured() && getMarketplaceServiceClient()
    ? await (async () => {
        const client = getMarketplaceServiceClient();
        const { data } = await client
          .from('course_financial_snapshots')
          .select('*')
          .eq('teacher_id', teacherId);
        return data || [];
      })()
    : mem().snapshots.filter((s) => s.teacher_id === teacherId);

  const gross = snapshots.reduce((a, s) => a + Number(s.teacher_gross_share || 0), 0);
  const platform = snapshots.reduce((a, s) => a + Number(s.platform_commission_amount || 0), 0);
  const net = payouts.reduce((a, p) => a + Number(p.net_payable || 0), 0);
  const pending = payouts
    .filter((p) => p.payout_status === 'PENDING')
    .reduce((a, p) => a + Number(p.net_payable || 0), 0);
  const available = payouts
    .filter((p) => p.payout_status === 'AVAILABLE')
    .reduce((a, p) => a + Number(p.net_payable || 0), 0);
  const paid = payouts
    .filter((p) => p.payout_status === 'PAID')
    .reduce((a, p) => a + Number(p.net_payable || 0), 0);

  return {
    ok: true,
    salesCount: snapshots.length,
    grossRevenue: Number(gross.toFixed(2)),
    platformCommission: Number(platform.toFixed(2)),
    estimatedNetEarnings: Number(net.toFixed(2)),
    pendingBalance: Number(pending.toFixed(2)),
    availableBalance: Number(available.toFixed(2)),
    paidBalance: Number(paid.toFixed(2)),
    payouts,
    refunds: snapshots.filter((s) => Number(s.refund_amount || 0) > 0),
  };
}
