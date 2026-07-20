/**
 * Enterprise Communication Platform API
 * GET  ?view=dashboard|stream|search|directory|tick
 * POST { action, payload }
 */

import {
  COMMUNICATION_MODULE_IDS,
  ensureCommunicationEngine,
  getCommunicationDashboard,
  globalSearch,
  listCommDirectory,
  mutateCommunicationCenter,
  subscribeCommLive,
  sweepCommSla,
} from '../../lib/admin/enterprise-communication-engine.js';

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

  ensureCommunicationEngine();
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'dashboard') {
    return Response.json(getCommunicationDashboard(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'directory') {
    return Response.json({ ok: true, directory: listCommDirectory() }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'search') {
    return Response.json(globalSearch(searchParams.get('q') || ''), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'modules') {
    return Response.json({ ok: true, modules: COMMUNICATION_MODULE_IDS });
  }

  if (view === 'tick') {
    return Response.json(sweepCommSla({ user: 'scheduler' }), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'stream') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (payload) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };
        send({ type: 'hello', dashboard: getCommunicationDashboard() });
        const unsubscribe = subscribeCommLive((event) => {
          send({ type: 'live', event, stats: getCommunicationDashboard().stats });
        });
        const heartbeat = setInterval(() => {
          send({ type: 'ping', at: new Date().toISOString(), stats: getCommunicationDashboard().stats });
        }, 4000);
        setTimeout(() => {
          clearInterval(heartbeat);
          unsubscribe();
          try {
            controller.close();
          } catch {
            /* ignore */
          }
        }, 120000);
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

  return Response.json({ error: 'UNKNOWN_VIEW' }, { status: 400 });
}

export async function POST(request) {
  const denied = await assertAccess();
  if (denied) return denied;

  try {
    const body = await request.json();
    const result = await mutateCommunicationCenter(body.action, body.payload || body, {
      user: body.user || 'owner',
      role: body.role || 'owner',
    });
    return Response.json(result, { status: result.ok === false ? 400 : 200 });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || 'COMM_FAILED' }, { status: 502 });
  }
}
