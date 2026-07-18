import {
  buildJordanContentFactoryDashboard,
  getJordanContentFactoryMeta,
  jordanContentFactoryAdminAction,
  listJordanContentFactoryQueue,
  readJordanContentFactoryLesson,
  runJordanContentFactory,
} from '../../lib/ai/jordan-content-factory-engine.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';
  const recordId = searchParams.get('recordId');

  if (view === 'meta') {
    return Response.json(getJordanContentFactoryMeta(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (view === 'queue') {
    return Response.json(
      { queue: listJordanContentFactoryQueue(searchParams.get('status') || 'Admin Review') },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if (view === 'lesson' && recordId) {
    return Response.json(readJordanContentFactoryLesson(recordId) || { missing: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return Response.json(
    {
      phase: 'JO-09',
      ...getJordanContentFactoryMeta(),
      dashboard: buildJordanContentFactoryDashboard(),
      queue: listJordanContentFactoryQueue('Admin Review').slice(0, 40),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'run' || body.action === 'enroll') {
      return Response.json(runJordanContentFactory(body.options || {}));
    }
    if (body.action === 'dashboard') {
      return Response.json(buildJordanContentFactoryDashboard());
    }
    if (
      [
        'preview',
        'edit',
        'comment',
        'requestRevision',
        'approve',
        'reject',
        'republish',
        'publish',
        'archive',
      ].includes(body.action)
    ) {
      if (!body.recordId) {
        return Response.json({ error: 'RECORD_ID_REQUIRED' }, { status: 400 });
      }
      const result = jordanContentFactoryAdminAction(body.recordId, body.action, {
        by: body.by || 'admin',
        comment: body.comment || '',
      });
      return Response.json(result, { status: result.ok ? 200 : 400 });
    }
    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error.message || 'JO_09_FAILED', details: error.details || null },
      { status: 502 },
    );
  }
}
