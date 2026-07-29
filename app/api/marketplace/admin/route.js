import {
  listCommissionAudit,
  listReviewQueue,
  transitionCourseStatus,
  upsertCommissionRule,
} from '../../../lib/marketplace/admin-review.js';
import {
  advanceS4sCourseProductionJob,
  createS4sCourseProductionJob,
  S4S_INTELLIGENCE_COURSE_PRODUCTION,
} from '../../../../enterprise-ai/src/pipelines/s4s-intelligence-course-production.js';
import { mem } from '../../../lib/marketplace/in-memory-store.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'review-queue';
  if (view === 'review-queue') {
    return Response.json(await listReviewQueue(searchParams.get('status') || null), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (view === 'commission-audit') {
    return Response.json(listCommissionAudit(), { headers: { 'Cache-Control': 'no-store' } });
  }
  if (view === 'aios-jobs') {
    return Response.json(
      { ok: true, taskType: S4S_INTELLIGENCE_COURSE_PRODUCTION, items: mem().aiosJobs },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
  return Response.json({ ok: false, error: 'UNKNOWN_VIEW' }, { status: 400 });
}

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  if (body.action === 'transition') {
    const result = await transitionCourseStatus(body);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  }
  if (body.action === 'upsert-commission-rule') {
    const result = await upsertCommissionRule(body);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  }
  if (body.action === 'create-s4s-production-job') {
    const job = createS4sCourseProductionJob({
      courseId: body.courseId || null,
      requestedBy: body.actorId || null,
      provider: body.provider || null,
    });
    mem().aiosJobs.push(job);
    return Response.json({ ok: true, job }, { status: 201 });
  }
  if (body.action === 'advance-s4s-production-job') {
    const job = mem().aiosJobs.find((j) => j.id === body.jobId);
    if (!job) return Response.json({ ok: false, error: 'JOB_NOT_FOUND' }, { status: 404 });
    const result = advanceS4sCourseProductionJob(job, {
      approveMedia: body.approveMedia === true,
      approvePublish: body.approvePublish === true,
    });
    if (result.ok) {
      const idx = mem().aiosJobs.findIndex((j) => j.id === body.jobId);
      mem().aiosJobs[idx] = result.job;
    }
    return Response.json(result, { status: result.ok ? 200 : 400 });
  }

  return Response.json({ ok: false, error: 'UNKNOWN_ACTION' }, { status: 400 });
}
