import { listPublishedCourses, getPublishedCourse } from '../../../lib/marketplace/catalog.js';
import { assertNoServiceRoleInPublicEnv } from '../../../lib/marketplace/supabase-server.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    assertNoServiceRoleInPublicEnv();
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('id');
  if (courseId) {
    const course = await getPublishedCourse(courseId);
    if (!course) {
      return Response.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
    }
    return Response.json({ ok: true, course }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const catalog = await listPublishedCourses({
    q: searchParams.get('q') || '',
    lessonSource: searchParams.get('lessonSource') || 'ALL',
    country: searchParams.get('country') || 'all',
    educationalSystem: searchParams.get('educationalSystem') || 'all',
    curriculum: searchParams.get('curriculum') || 'all',
    qualification: searchParams.get('qualification') || 'all',
    grade: searchParams.get('grade') || 'all',
    subjectFamily: searchParams.get('subjectFamily') || 'all',
    subject: searchParams.get('subject') || 'all',
    teacherGender: searchParams.get('teacherGender') || 'all',
    language: searchParams.get('language') || 'all',
    subtitleLanguage: searchParams.get('subtitleLanguage') || 'all',
    price: searchParams.get('price') || 'all',
    rating: searchParams.get('rating') || 'all',
    duration: searchParams.get('duration') || 'all',
    level: searchParams.get('level') || 'all',
    sort: searchParams.get('sort') || 'newest',
  });

  return Response.json(catalog, { headers: { 'Cache-Control': 'no-store' } });
}
