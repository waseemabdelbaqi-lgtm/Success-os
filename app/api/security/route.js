/**
 * Enterprise Security, Privacy, Compliance & Trust API
 * GET  ?view=dashboard|stream|tick|modules
 * POST { action, payload }
 */

import {
  SEC_MODULE_IDS,
  bindActorFromSession,
  ensureSecurityTrustEngine,
  getSecurityTrustDashboard,
  mutateSecurityTrustCenter,
  subscribeSecLive,
} from '../../lib/admin/enterprise-security-trust-engine.js';

const ELEVATED = new Set(['super_admin', 'owner', 'admin', 'security']);

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

  ensureSecurityTrustEngine();
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'dashboard') {
    const filters = {
      severity: searchParams.get('severity') || undefined,
      tenant: searchParams.get('tenant') || undefined,
      country: searchParams.get('country') || undefined,
      module: searchParams.get('module') || undefined,
    };
    return Response.json(getSecurityTrustDashboard(filters), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (view === 'modules') {
    return Response.json({ ok: true, modules: SEC_MODULE_IDS });
  }

  if (view === 'tick') {
    const result = await mutateSecurityTrustCenter('tick', {}, { user: 'cron', role: 'system' });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'stream') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (payload) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };
        send({ type: 'hello', dashboard: getSecurityTrustDashboard() });
        const unsubscribe = subscribeSecLive((event) => {
          send({ type: 'live', event, stats: getSecurityTrustDashboard().stats });
        });
        const heartbeat = setInterval(() => {
          send({
            type: 'ping',
            at: new Date().toISOString(),
            stats: getSecurityTrustDashboard().stats,
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

  ensureSecurityTrustEngine();
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const actor = bindActorFromSession(access && !(access instanceof Response) ? access : null, body);
  const result = await mutateSecurityTrustCenter(body.action, body.payload || body, {
    user: actor.user,
    role: actor.role,
    permissions: actor.permissions,
    unbound: actor.unbound,
  });
  return Response.json(result, { status: result.ok === false ? 400 : 200 });
}
