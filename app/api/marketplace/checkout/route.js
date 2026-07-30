import { purchaseRecordedCourse } from '../../../lib/marketplace/checkout.js';
import { detectPaymentMode } from '../../../lib/marketplace/payment-provider.js';
import { assertNoServiceRoleInPublicEnv } from '../../../lib/marketplace/supabase-server.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const mode = detectPaymentMode();
  return Response.json({
    ok: true,
    paymentMode: mode.mode,
    provider: mode.provider,
    live: mode.live,
    note: mode.live
      ? 'Live provider detected — marketplace live charge wiring requires explicit enablement.'
      : 'TEST_MODE or sandbox — not claiming live payments are active.',
  });
}

export async function POST(request) {
  try {
    assertNoServiceRoleInPublicEnv();
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  // Never trust client price — pass through only for audit discard
  const result = await purchaseRecordedCourse({
    studentId: body.studentId,
    courseId: body.courseId,
    couponCode: body.couponCode || null,
    clientPrice: body.price ?? body.paidAmount ?? null,
    paymentReference: body.paymentReference || null,
  });

  if (!result.ok) {
    const status =
      result.error === 'DUPLICATE_ACTIVE_ENROLMENT'
        ? 409
        : result.error === 'COURSE_NOT_FOUND_OR_UNPUBLISHED'
          ? 404
          : 400;
    return Response.json(result, { status });
  }

  return Response.json(result, { status: 201 });
}
