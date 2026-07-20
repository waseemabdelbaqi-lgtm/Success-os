/**
 * Global Marketplace API
 * GET  ?view=dashboard|stream|search|analytics|tick
 * POST { action, payload }
 */

import {
  MARKETPLACE_MODULE_IDS,
  ensureMarketplaceEngine,
  getMarketplaceDashboard,
  getMarketplaceAnalytics,
  mutateMarketplaceCenter,
  searchMarketplace,
  subscribeMarketLive,
  syncListingsFromErp,
} from '../../lib/admin/enterprise-marketplace-engine.js';

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

  ensureMarketplaceEngine();
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'dashboard') {
    return Response.json(getMarketplaceDashboard(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'analytics') {
    return Response.json(getMarketplaceAnalytics(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'search') {
    const filters = Object.fromEntries(searchParams.entries());
    delete filters.view;
    return Response.json(searchMarketplace(filters), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'modules') {
    return Response.json({ ok: true, modules: MARKETPLACE_MODULE_IDS });
  }

  if (view === 'tick') {
    const synced = syncListingsFromErp({ user: 'scheduler' });
    return Response.json({ ok: true, synced }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'stream') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (payload) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };
        send({ type: 'hello', dashboard: getMarketplaceDashboard() });
        const unsubscribe = subscribeMarketLive((event) => {
          send({ type: 'live', event, stats: getMarketplaceDashboard().stats });
        });
        const heartbeat = setInterval(() => {
          send({ type: 'ping', at: new Date().toISOString(), stats: getMarketplaceDashboard().stats });
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
    const result = await mutateMarketplaceCenter(body.action, body.payload || body, {
      user: body.user || 'owner',
      role: body.role || 'owner',
    });
    return Response.json(result, { status: result.ok === false ? 400 : 200 });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || 'MARKET_FAILED' }, { status: 502 });
  }
}
