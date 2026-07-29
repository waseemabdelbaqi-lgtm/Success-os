import {
  createTeacherCourse,
  getTeacherEarnings,
  listTeacherCourses,
  previewTeacherPricing,
  submitTeacherCourseForReview,
  updateTeacherCourse,
} from '../../../../lib/marketplace/teacher-courses.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');
  if (!teacherId) {
    return Response.json({ ok: false, error: 'TEACHER_REQUIRED' }, { status: 400 });
  }
  if (searchParams.get('view') === 'earnings') {
    return Response.json(await getTeacherEarnings(teacherId), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (searchParams.get('view') === 'pricing-preview') {
    return Response.json(
      {
        ok: true,
        pricingPreview: await previewTeacherPricing(
          Number(searchParams.get('price') || 0),
          searchParams.get('currency') || 'USD',
          teacherId,
          searchParams.get('courseId') || null,
        ),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
  return Response.json(await listTeacherCourses(teacherId), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const teacherId = body.teacherId;
  if (!teacherId) {
    return Response.json({ ok: false, error: 'TEACHER_REQUIRED' }, { status: 400 });
  }

  if (body.action === 'submit') {
    const result = await submitTeacherCourseForReview(teacherId, body.courseId, body);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  }
  if (body.action === 'update') {
    const result = await updateTeacherCourse(teacherId, body.courseId, body);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  }

  const result = await createTeacherCourse(teacherId, body);
  return Response.json(result, { status: result.ok ? 201 : 400 });
}
