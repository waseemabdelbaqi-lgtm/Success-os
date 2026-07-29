/**
 * Server-side checkout + enrolment for Recorded Lessons Marketplace.
 *
 * Flow:
 * 1. Reload authoritative course price
 * 2. Validate promotion
 * 3. Resolve commission
 * 4. Payment provider / TEST_MODE
 * 5. Purchase record
 * 6. Immutable financial snapshot
 * 7. Teacher payout ledger (if applicable)
 * 8. Enrolment grant
 */

import {
  buildFinancialSnapshot,
  resolveMarketplaceCommission,
} from './commission-engine.js';
import { getPublishedCourse, listCommissionRules } from './catalog.js';
import { mem, memCreateId, memNow } from './in-memory-store.js';
import {
  confirmMarketplacePayment,
  createMarketplacePayment,
  detectPaymentMode,
} from './payment-provider.js';
import {
  getMarketplaceServiceClient,
  marketplaceSupabaseConfigured,
} from './supabase-server.js';

const issuedIntents = new Set();

function effectivePrice(course, at = new Date()) {
  const now = at instanceof Date ? at : new Date(at);
  const promo = Number(course.promotional_price ?? course.promotionalPrice);
  const start = course.promotion_start_at || course.promotionStartAt;
  const end = course.promotion_end_at || course.promotionEndAt;
  const base = Number(course.price || 0);
  if (Number.isFinite(promo) && promo >= 0 && promo < base) {
    if (start && now < new Date(start)) return { original: base, paid: base, discount: 0 };
    if (end && now > new Date(end)) return { original: base, paid: base, discount: 0 };
    return { original: base, paid: promo, discount: Number((base - promo).toFixed(2)) };
  }
  return { original: base, paid: base, discount: 0 };
}

async function findActiveEnrolment(studentId, courseId) {
  if (marketplaceSupabaseConfigured() && getMarketplaceServiceClient()) {
    const client = getMarketplaceServiceClient();
    const { data } = await client
      .from('recorded_course_enrolments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('status', 'ACTIVE')
      .maybeSingle();
    return data;
  }
  return mem().enrolments.find(
    (e) => e.student_id === studentId && e.course_id === courseId && e.status === 'ACTIVE',
  );
}

async function findPurchaseByPaymentRef(provider, reference) {
  if (marketplaceSupabaseConfigured() && getMarketplaceServiceClient()) {
    const client = getMarketplaceServiceClient();
    const { data } = await client
      .from('recorded_course_purchases')
      .select('*')
      .eq('payment_provider', provider)
      .eq('payment_reference', reference)
      .maybeSingle();
    return data;
  }
  return mem().purchases.find(
    (p) => p.payment_provider === provider && p.payment_reference === reference,
  );
}

/**
 * Complete a marketplace purchase securely.
 * Ignores any client-supplied price.
 */
export async function purchaseRecordedCourse({
  studentId,
  courseId,
  couponCode = null,
  clientPrice = null, // ignored — anti-manipulation
  paymentReference = null,
} = {}) {
  if (!studentId) return { ok: false, error: 'STUDENT_REQUIRED' };
  if (!courseId) return { ok: false, error: 'COURSE_REQUIRED' };

  // Client price must never influence server totals
  void clientPrice;

  const course = await getPublishedCourse(courseId);
  if (!course) return { ok: false, error: 'COURSE_NOT_FOUND_OR_UNPUBLISHED' };

  const existingEnrolment = await findActiveEnrolment(studentId, courseId);
  if (existingEnrolment) {
    return { ok: false, error: 'DUPLICATE_ACTIVE_ENROLMENT', enrolment: existingEnrolment };
  }

  const pricing = effectivePrice(course);
  // Coupon placeholder — server validates; unknown coupons rejected
  let discount = pricing.discount;
  if (couponCode) {
    return { ok: false, error: 'COUPON_NOT_SUPPORTED_OR_INVALID' };
  }

  const rules = await listCommissionRules();
  const resolution = resolveMarketplaceCommission({
    originalPrice: pricing.original,
    discountAmount: discount,
    currency: course.currency || 'USD',
    sourceType: course.sourceType || course.source_type || course.lessonSource,
    teacherId: course.teacher_id || course.teacherId || null,
    courseId: course.id,
    studentId,
    partnerType: 'teacher',
    rules,
  });

  const paymentMode = detectPaymentMode();
  let intent;
  if (paymentReference) {
    const prior = await findPurchaseByPaymentRef(paymentMode.provider, paymentReference);
    if (prior) return { ok: false, error: 'REPLAYED_PAYMENT_CALLBACK', purchase: prior };
    const confirmed = await confirmMarketplacePayment({
      paymentReference,
      expectedAmount: resolution.paidAmount,
      currency: resolution.currency,
      issuedIntents,
    });
    if (!confirmed.ok) return confirmed;
    intent = {
      ok: true,
      status: 'PAID',
      paymentProvider: paymentMode.provider,
      paymentMode: paymentMode.mode,
      live: paymentMode.live,
      paymentReference,
    };
  } else {
    intent = await createMarketplacePayment({
      amount: resolution.paidAmount,
      currency: resolution.currency,
      studentId,
      courseId,
    });
    if (!intent.ok) return intent;
    issuedIntents.add(intent.paymentReference);
    // TEST_MODE auto-confirms after intent issuance (server-side only)
    if (intent.paymentMode === 'TEST_MODE' || intent.paymentMode === 'TEST_PROVIDER') {
      intent.status = 'PAID';
    }
  }

  if (intent.status !== 'PAID' && intent.status !== 'AUTHORIZED') {
    return { ok: false, error: 'PAYMENT_NOT_CONFIRMED', intent };
  }

  const purchaseId = memCreateId();
  const purchasedAt = memNow();
  const purchase = {
    id: purchaseId,
    student_id: studentId,
    course_id: courseId,
    payment_status: 'PAID',
    payment_provider: intent.paymentProvider,
    payment_reference: intent.paymentReference,
    currency: resolution.currency,
    original_price: resolution.originalPrice,
    discount_amount: resolution.discountAmount,
    paid_amount: resolution.paidAmount,
    purchased_at: purchasedAt,
    created_at: purchasedAt,
  };

  const snapshotPayload = buildFinancialSnapshot({
    purchaseId,
    courseId,
    studentId,
    teacherId: course.teacher_id || course.teacherId || null,
    sourceType: resolution.sourceType,
    resolution,
  });
  const snapshot = {
    id: memCreateId(),
    ...snapshotPayload,
    created_at: purchasedAt,
  };

  const enrolment = {
    id: memCreateId(),
    student_id: studentId,
    course_id: courseId,
    purchase_id: purchaseId,
    status: 'ACTIVE',
    enrolled_at: purchasedAt,
    completed_at: null,
    progress_percentage: 0,
    last_accessed_at: purchasedAt,
  };

  let payout = null;
  if (
    resolution.sourceType === 'TEACHER_RECORDED' &&
    (course.teacher_id || course.teacherId) &&
    resolution.teacherFinalPayable > 0
  ) {
    payout = {
      id: memCreateId(),
      teacher_id: course.teacher_id || course.teacherId,
      purchase_id: purchaseId,
      financial_snapshot_id: snapshot.id,
      gross_teacher_share: resolution.teacherGrossShare,
      deductions: 0,
      net_payable: resolution.teacherFinalPayable,
      currency: resolution.currency,
      payout_status: 'PENDING',
      payout_reference: null,
      payable_at: purchasedAt,
      paid_at: null,
      created_at: purchasedAt,
    };
  }

  if (marketplaceSupabaseConfigured() && getMarketplaceServiceClient()) {
    const client = getMarketplaceServiceClient();
    const { error: pErr } = await client.from('recorded_course_purchases').insert(purchase);
    if (pErr) return { ok: false, error: pErr.message };
    const { error: sErr } = await client.from('course_financial_snapshots').insert(snapshot);
    if (sErr) return { ok: false, error: sErr.message };
    if (payout) {
      const { error: lErr } = await client.from('teacher_payout_ledger').insert(payout);
      if (lErr) return { ok: false, error: lErr.message };
    }
    const { error: eErr } = await client.from('recorded_course_enrolments').insert(enrolment);
    if (eErr) {
      if (String(eErr.message || '').includes('uq_recorded_course_enrolments_active')) {
        return { ok: false, error: 'DUPLICATE_ACTIVE_ENROLMENT' };
      }
      return { ok: false, error: eErr.message };
    }
  } else {
    // TEST_MODE / local persistence (not permanent production DB)
    if (
      mem().snapshots.some((s) => s.id === snapshot.id) ||
      mem().purchases.some(
        (p) =>
          p.payment_provider === purchase.payment_provider &&
          p.payment_reference === purchase.payment_reference,
      )
    ) {
      return { ok: false, error: 'REPLAYED_PAYMENT_CALLBACK' };
    }
    mem().purchases.push(purchase);
    Object.freeze(snapshot);
    mem().snapshots.push(snapshot);
    if (payout) mem().payouts.push(payout);
    mem().enrolments.push(enrolment);
    const courseRow = mem().courses.find((c) => c.id === courseId);
    if (courseRow) {
      courseRow.enrolment_count = Number(courseRow.enrolment_count || 0) + 1;
      courseRow.updated_at = purchasedAt;
    }
  }

  return {
    ok: true,
    livePayments: Boolean(paymentMode.live),
    paymentMode: intent.paymentMode || paymentMode.mode,
    purchase,
    snapshot,
    enrolment,
    payout,
    resolution,
  };
}

/**
 * Attempt to mutate a snapshot — must fail (immutability guard for tests / memory).
 */
export function attemptMutateSnapshot(snapshotId, patch = {}) {
  const snap = mem().snapshots.find((s) => s.id === snapshotId);
  if (!snap) return { ok: false, error: 'NOT_FOUND' };
  if (Object.isFrozen(snap)) {
    return { ok: false, error: 'SNAPSHOT_IMMUTABLE' };
  }
  try {
    Object.assign(snap, patch);
    return { ok: false, error: 'SNAPSHOT_SHOULD_BE_IMMUTABLE' };
  } catch {
    return { ok: false, error: 'SNAPSHOT_IMMUTABLE' };
  }
}

export function listStudentEnrolments(studentId) {
  return mem().enrolments.filter((e) => e.student_id === studentId);
}

export { issuedIntents };
