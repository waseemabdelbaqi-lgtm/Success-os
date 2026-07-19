/**
 * Business Automation Engine API
 * GET  ?view=dashboard|stream|module&module=
 * POST { action, payload }
 */

import {
  AUTOMATION_MODULE_IDS,
  ensureAutomationEngine,
  getAutomationDashboard,
  listAutomationModule,
  mutateAutomationCenter,
  subscribeAutomationLive,
  tickAutomationScheduler,
} from '../../lib/admin/enterprise-automation-engine.js';

const ELEVATED = new Set(['super_admin', 'owner', 'admin']);

async function assertAccess() {
  if (process.env.FEATURE_AUTH_ENABLED !== 'true') return null;
  try {
    const { getSessionFromCookies } = await import('../../../lib/auth/session');
    const session = await getSessionFromCookies();
    if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    if (!ELEVATED.has(session.role)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    return null;
  } catch {
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
}

export async function GET(request) {
  const denied = await assertAccess();
  if (denied) return denied;

  ensureAutomationEngine();
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'dashboard') {
    return Response.json(getAutomationDashboard(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'module') {
    const moduleId = searchParams.get('module') || 'business-automation';
    if (!AUTOMATION_MODULE_IDS.includes(moduleId) && moduleId !== 'business-automation') {
      return Response.json({ error: 'UNKNOWN_MODULE' }, { status: 400 });
    }
    return Response.json(
      listAutomationModule(moduleId, {
        q: searchParams.get('q') || '',
        status: searchParams.get('status') || '',
        pageSize: searchParams.get('pageSize'),
      }),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (view === 'stream') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (payload) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };
        send({ type: 'hello', dashboard: getAutomationDashboard() });
        const unsubscribe = subscribeAutomationLive((event) => {
          send({ type: 'live', event, stats: getAutomationDashboard().stats });
        });
        const heartbeat = setInterval(() => {
          send({ type: 'ping', at: new Date().toISOString(), stats: getAutomationDashboard().stats });
        }, 4000);
        const closer = setTimeout(() => {
          clearInterval(heartbeat);
          unsubscribe();
          try {
            controller.close();
          } catch {
            /* ignore */
          }
        }, 120000);
        controller._cleanup = () => {
          clearInterval(heartbeat);
          clearTimeout(closer);
          unsubscribe();
        };
      },
      cancel() {
        /* listeners cleaned by timeout */
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  if (view === 'tick') {
    // Secure cron-style tick (also usable manually from Owner dashboard).
    const result = await tickAutomationScheduler({ user: 'scheduler' });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  }

  return Response.json({ error: 'UNKNOWN_VIEW' }, { status: 400 });
}

export async function POST(request) {
  const denied = await assertAccess();
  if (denied) return denied;

  try {
    const body = await request.json();
    const action = body.action;
    const payload = body.payload || body;
    const result = await mutateAutomationCenter(action, payload, {
      user: body.user || 'owner',
      note: body.note || payload.note || '',
      reason: body.reason || payload.reason || '',
    });
    return Response.json(result, { status: result.ok === false ? 400 : 200 });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || 'AUTOMATION_FAILED' }, { status: 502 });
  }
}
