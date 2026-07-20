/**
 * Global Integration Platform API
 * GET  ?view=dashboard|stream|monitoring|tick
 * POST { action, payload }
 */

import {
  GIP_MODULE_IDS,
  ensureGipEngine,
  getGipDashboard,
  getGipMonitoring,
  mutateGipCenter,
  runHealthChecks,
  subscribeGipLive,
} from '../../lib/admin/enterprise-gip-engine.js';

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

  ensureGipEngine();
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'dashboard') {
    return Response.json(getGipDashboard(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'monitoring') {
    return Response.json(getGipMonitoring(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'modules') {
    return Response.json({ ok: true, modules: GIP_MODULE_IDS });
  }

  if (view === 'tick') {
    const health = runHealthChecks({ user: 'scheduler' });
    return Response.json({ ok: true, ...health }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'stream') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (payload) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };
        send({ type: 'hello', dashboard: getGipDashboard() });
        const unsubscribe = subscribeGipLive((event) => {
          send({ type: 'live', event, stats: getGipDashboard().stats });
        });
        const heartbeat = setInterval(() => {
          send({ type: 'ping', at: new Date().toISOString(), stats: getGipDashboard().stats });
        }, 4000);
        const close = () => {
          clearInterval(heartbeat);
          unsubscribe();
          try {
            controller.close();
          } catch {
            /* ignore */
          }
        };
        request.signal?.addEventListener?.('abort', close);
        setTimeout(close, 25 * 60 * 1000);
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store, no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  return Response.json({ error: 'UNKNOWN_VIEW' }, { status: 400 });
}

export async function POST(request) {
  const denied = await assertAccess();
  if (denied) return denied;

  ensureGipEngine();
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const action = body.action;
  const payload = body.payload || body;
  const result = await mutateGipCenter(action, payload, {
    user: body.user || 'owner',
    role: body.role || 'owner',
    moduleId: body.moduleId || 'gip',
  });
  return Response.json(result, { status: result.ok === false ? 400 : 200 });
}
