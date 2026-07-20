/**
 * Multi-Tenant & White Label Platform API
 * GET  ?view=dashboard|stream|analytics|tick|context
 * POST { action, payload }
 */

import {
  MT_MODULE_IDS,
  ensureMultiTenantEngine,
  getMultiTenantDashboard,
  getGlobalMtAnalytics,
  mutateMultiTenantCenter,
  resolveTenantContext,
  runBillingTick,
  subscribeMtLive,
} from '../../lib/admin/enterprise-multi-tenant-engine.js';

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

  ensureMultiTenantEngine();
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'dashboard') {
    return Response.json(getMultiTenantDashboard(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'analytics') {
    return Response.json(getGlobalMtAnalytics(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'modules') {
    return Response.json({ ok: true, modules: MT_MODULE_IDS });
  }

  if (view === 'context') {
    return Response.json(
      resolveTenantContext({
        tenantId: searchParams.get('tenantId') || undefined,
        subdomain: searchParams.get('subdomain') || undefined,
        domain: searchParams.get('domain') || undefined,
        role: searchParams.get('role') || 'tenant_admin',
      }),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (view === 'tick') {
    const billing = runBillingTick({ user: 'scheduler' });
    return Response.json({ ok: true, ...billing }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'stream') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (payload) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };
        send({ type: 'hello', dashboard: getMultiTenantDashboard() });
        const unsubscribe = subscribeMtLive((event) => {
          send({ type: 'live', event, stats: getMultiTenantDashboard().stats });
        });
        const heartbeat = setInterval(() => {
          send({ type: 'ping', at: new Date().toISOString(), stats: getMultiTenantDashboard().stats });
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

  ensureMultiTenantEngine();
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const action = body.action;
  const payload = body.payload || body;
  const result = await mutateMultiTenantCenter(action, payload, {
    user: body.user || 'owner',
    role: body.role || 'owner',
  });
  return Response.json(result, { status: result.ok === false ? 400 : 200 });
}
