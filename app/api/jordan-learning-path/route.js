import {
  buildJordanLearningPathDashboard,
  buildJordanLearningPaths,
  completeJordanLesson,
  getJordanLearningAnalytics,
  getJordanLearningPath,
  getJordanStudentProgression,
  recommendJordanNextLesson,
  updateJordanLessonMastery,
} from '../../lib/ai/jordan-learning-path-engine.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';
  const bookId = searchParams.get('bookId');
  const studentId = searchParams.get('studentId') || 'demo-student-jo';

  if (view === 'path' && bookId) {
    return Response.json(getJordanLearningPath(bookId) || { missing: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (view === 'progress' && bookId) {
    return Response.json(getJordanStudentProgression(studentId, bookId), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (view === 'next' && bookId) {
    return Response.json(recommendJordanNextLesson(studentId, bookId), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (view === 'analytics') {
    return Response.json(getJordanLearningAnalytics(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return Response.json(
    {
      phase: 'JO-07',
      dashboard: buildJordanLearningPathDashboard(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'build') {
      return Response.json(buildJordanLearningPaths());
    }
    if (body.action === 'dashboard') {
      return Response.json(buildJordanLearningPathDashboard());
    }
    if (body.action === 'complete') {
      return Response.json(
        completeJordanLesson(body.studentId || 'demo-student-jo', body.bookId, body.lessonId, body.meta || {}),
      );
    }
    if (body.action === 'set-state') {
      return Response.json(
        updateJordanLessonMastery(
          body.studentId || 'demo-student-jo',
          body.bookId,
          body.lessonId,
          body.state,
          body.meta || {},
        ),
      );
    }
    if (body.action === 'progress') {
      return Response.json(
        getJordanStudentProgression(body.studentId || 'demo-student-jo', body.bookId),
      );
    }
    if (body.action === 'recommend') {
      return Response.json(
        recommendJordanNextLesson(body.studentId || 'demo-student-jo', body.bookId),
      );
    }
    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error.message || 'JO_07_FAILED', details: error.details || null },
      { status: 502 },
    );
  }
}
