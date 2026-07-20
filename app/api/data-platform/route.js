/**
 * Enterprise Data Platform API
 * GET  ?view=dashboard|stream|tick|modules
 * POST { action, payload }
 */

import {
  EDP_MODULE_IDS,
  ensureEnterpriseDataPlatform,
  getDataPlatformDashboard,
  mutateDataPlatformCenter,
  subscribeEdpLive,
} from '../../lib/admin/enterprise-data-platform-engine.js';

const ELEVATED = new Set(['super_admin', 'owner', 'admin']);

async function assertAccess() {
  const isProduction = process.env.NEXT_PUBLIC_APP_ENV === 'production';
  if (process.env.FEATURE_AUTH_ENABLED !== 'true') {
    if (isProduction) {
      return Response.json({ error: 'AUTH_REQUIRED_IN_PRODUCTION' }, { status: 401 });
    }
    return null;
  }
  try {
    const { getSessionFromCookies } = await import('../../../lib/auth/session');
    const session = await getSessionFromCookies();
    if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    if (!ELEVATED.has(session.role)) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    return session;
  } catch {
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
}

export async function GET(request) {
  const access = await assertAccess();
  if (access instanceof Response) return access;

  ensureEnterpriseDataPlatform();
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'dashboard') {
    const filters = {
      tenant: searchParams.get('tenant') || undefined,
      country: searchParams.get('country') || undefined,
    };
    return Response.json(getDataPlatformDashboard(filters), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (view === 'modules') {
    return Response.json({ ok: true, modules: EDP_MODULE_IDS });
  }

  if (view === 'tick') {
    const result = await mutateDataPlatformCenter('tick', {}, { user: 'cron', role: 'system' });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'stream') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (payload) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };
        send({ type: 'hello', dashboard: getDataPlatformDashboard() });
        const unsubscribe = subscribeEdpLive((event) => {
          send({ type: 'live', event, stats: getDataPlatformDashboard().stats });
        });
        const heartbeat = setInterval(() => {
          send({
            type: 'ping',
            at: new Date().toISOString(),
            stats: getDataPlatformDashboard().stats,
          });
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
  const access = await assertAccess();
  if (access instanceof Response) return access;

  ensureEnterpriseDataPlatform();
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const session = access && !(access instanceof Response) ? access : null;
  const result = await mutateDataPlatformCenter(body.action, body.payload || body, {
    user: session?.uid || body.user || 'owner',
    role: session?.role || body.role || 'owner',
    permissions: session?.permissions || body.permissions,
    tenantId: body.tenantId || body.payload?.tenantId,
  });
  return Response.json(result, { status: result.ok === false ? 400 : 200 });
}
