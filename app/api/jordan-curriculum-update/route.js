import {
  approveJordanUpdateDraft,
  buildJordanUpdateDashboard,
  getJordanCurriculumUpdateEngine,
  listJordanUpdateNotifications,
  rejectJordanUpdateDraft,
  registerJordanCurriculumNotice,
  runJordanCurriculumUpdateMonitor,
} from '../../lib/ai/jordan-curriculum-update-engine.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'notifications') {
    return Response.json({
      notifications: listJordanUpdateNotifications({
        unreadOnly: searchParams.get('unread') === '1',
      }),
    });
  }
  if (view === 'drafts') {
    return Response.json({ drafts: getJordanCurriculumUpdateEngine().listDrafts() });
  }

  return Response.json(
    {
      phase: 'JO-06',
      dashboard: buildJordanUpdateDashboard(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'monitor' || body.action === 'run') {
      return Response.json(
        runJordanCurriculumUpdateMonitor({ detectOnly: Boolean(body.detectOnly) }),
      );
    }
    if (body.action === 'dashboard') {
      return Response.json(buildJordanUpdateDashboard());
    }
    if (body.action === 'approve') {
      if (!body.draftId) return Response.json({ error: 'DRAFT_ID_REQUIRED' }, { status: 400 });
      return Response.json(approveJordanUpdateDraft(body.draftId, body));
    }
    if (body.action === 'reject') {
      if (!body.draftId) return Response.json({ error: 'DRAFT_ID_REQUIRED' }, { status: 400 });
      return Response.json(rejectJordanUpdateDraft(body.draftId, body));
    }
    if (body.action === 'notice') {
      return Response.json(registerJordanCurriculumNotice(body));
    }
    if (body.action === 'mark-read') {
      getJordanCurriculumUpdateEngine().markNotificationRead(body.id);
      return Response.json({ ok: true });
    }
    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error.message || 'JO_06_FAILED', details: error.details || null },
      { status: 502 },
    );
  }
}
