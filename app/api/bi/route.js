/**
 * Business Intelligence API
 * GET  ?view=dashboard|stream|report|export|geo|kpis|forecasts|tick
 * POST { action, payload }
 */

import {
  BI_MODULE_IDS,
  buildCustomReport,
  ensureBiEngine,
  exportBiReport,
  getBiDashboard,
  getGeographicAnalytics,
  getKpiCenter,
  buildForecasts,
  mutateBiCenter,
  subscribeBiLive,
  takeBiSnapshot,
  evaluateBiAlerts,
} from '../../lib/admin/enterprise-bi-engine.js';

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

  ensureBiEngine();
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'dashboard') {
    return Response.json(getBiDashboard(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'geo') {
    return Response.json(getGeographicAnalytics(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'kpis') {
    return Response.json(getKpiCenter(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'forecasts') {
    return Response.json(buildForecasts(Number(searchParams.get('horizon') || 0) || undefined), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (view === 'report') {
    const metrics = (searchParams.get('metrics') || 'revenue,profit').split(',').filter(Boolean);
    return Response.json(
      buildCustomReport({
        metrics,
        groupBy: searchParams.get('groupBy') || 'country',
        chartType: searchParams.get('chartType') || 'table',
        name: searchParams.get('name') || 'Ad-hoc Report',
      }),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (view === 'export') {
    const result = exportBiReport(searchParams.get('format') || 'csv', {
      metrics: (searchParams.get('metrics') || 'revenue,profit').split(',').filter(Boolean),
      groupBy: searchParams.get('groupBy') || 'country',
      chartType: searchParams.get('chartType') || 'table',
      name: searchParams.get('name') || 'Export',
    }, { user: 'owner' });
    return new Response(result.body, {
      headers: {
        'Content-Type': `${result.contentType}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  if (view === 'tick') {
    const snapshot = takeBiSnapshot({ user: 'scheduler' });
    const alerts = evaluateBiAlerts({ user: 'scheduler' });
    return Response.json({ ok: true, snapshot, alerts }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'modules') {
    return Response.json({ ok: true, modules: BI_MODULE_IDS });
  }

  if (view === 'stream') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (payload) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };
        send({ type: 'hello', dashboard: getBiDashboard() });
        const unsubscribe = subscribeBiLive((event) => {
          send({ type: 'live', event, dashboard: getBiDashboard() });
        });
        const heartbeat = setInterval(() => {
          send({
            type: 'ping',
            at: new Date().toISOString(),
            executive: getBiDashboard().executive,
          });
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
    const result = await mutateBiCenter(body.action, body.payload || body, {
      user: body.user || 'owner',
    });
    return Response.json(result, { status: result.ok === false ? 400 : 200 });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || 'BI_FAILED' }, { status: 502 });
  }
}
