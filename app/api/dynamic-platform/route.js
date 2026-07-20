/**
 * Global Dynamic Platform Engine API
 * GET  ?view=dashboard|stream|resolve|tick
 * POST { action, payload }
 */

import {
  DPE_MODULE_IDS,
  ensureDynamicPlatformEngine,
  getDynamicPlatformDashboard,
  getResolvedContextBundle,
  mutateDynamicPlatformCenter,
  subscribeDpeLive,
} from '../../lib/admin/enterprise-dynamic-platform-engine.js';

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

  ensureDynamicPlatformEngine();
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'dashboard') {
    return Response.json(getDynamicPlatformDashboard(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'modules') {
    return Response.json({ ok: true, modules: DPE_MODULE_IDS });
  }

  if (view === 'resolve') {
    const context = {
      userType: searchParams.get('userType') || undefined,
      role: searchParams.get('role') || 'owner',
      country: searchParams.get('country') || undefined,
      language: searchParams.get('language') || 'ar',
      institutionType: searchParams.get('institutionType') || undefined,
      tenant: searchParams.get('tenant') || undefined,
      subscriptionPlan: searchParams.get('subscriptionPlan') || undefined,
      user_name: searchParams.get('user_name') || 'Owner',
      surface: searchParams.get('surface') || 'sidebar',
    };
    return Response.json(getResolvedContextBundle(context), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'tick') {
    ensureDynamicPlatformEngine();
    return Response.json({ ok: true, synced: true, at: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'stream') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (payload) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };
        send({ type: 'hello', dashboard: getDynamicPlatformDashboard() });
        const unsubscribe = subscribeDpeLive((event) => {
          send({ type: 'live', event, stats: getDynamicPlatformDashboard().stats });
        });
        const heartbeat = setInterval(() => {
          send({ type: 'ping', at: new Date().toISOString(), stats: getDynamicPlatformDashboard().stats });
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

  ensureDynamicPlatformEngine();
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const result = await mutateDynamicPlatformCenter(body.action, body.payload || body, {
    user: body.user || 'owner',
    role: body.role || 'owner',
  });
  return Response.json(result, { status: result.ok === false ? 400 : 200 });
}
