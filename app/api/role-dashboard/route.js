import {
  buildRoleControlDashboard,
  listUserControlDashboards,
} from '../../lib/admin/role-permission-bridge.js';

const ELEVATED = new Set(['super_admin', 'owner', 'admin']);

async function assertAccess(requestedRole) {
  if (process.env.FEATURE_AUTH_ENABLED !== 'true') {
    return { ok: true, preview: true };
  }

  try {
    const { getSessionFromCookies } = await import('../../../lib/auth/session');
    const session = await getSessionFromCookies();
    if (!session) {
      return { ok: false, response: Response.json({ error: 'UNAUTHORIZED' }, { status: 401 }) };
    }
    if (ELEVATED.has(session.role) || session.role === requestedRole) {
      return { ok: true, preview: ELEVATED.has(session.role) && session.role !== requestedRole };
    }
    return { ok: false, response: Response.json({ error: 'FORBIDDEN' }, { status: 403 }) };
  } catch {
    return { ok: false, response: Response.json({ error: 'UNAUTHORIZED' }, { status: 401 }) };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'role';
  const lang = searchParams.get('lang') || 'ar';

  if (view === 'directory') {
    const access = await assertAccess('admin');
    if (!access.ok) return access.response;
    return Response.json(listUserControlDashboards({ lang }), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const role = searchParams.get('role');
  if (!role) {
    return Response.json({ error: 'ROLE_REQUIRED' }, { status: 400 });
  }

  const access = await assertAccess(role);
  if (!access.ok) return access.response;

  const payload = buildRoleControlDashboard(role, { lang });
  return Response.json(
    { ...payload, previewMode: Boolean(access.preview) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
