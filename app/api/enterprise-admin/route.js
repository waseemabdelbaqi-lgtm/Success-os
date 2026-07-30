import {
  buildHomeDashboard,
  exportModuleCsv,
  getEnterpriseAdminMeta,
  getPermissionsMatrix,
  listModuleItems,
  mutateModule,
  mutatePermissions,
} from '../../lib/admin/enterprise-admin-engine.js';
import {
  getCommissionDefaults,
  listCommissionRules,
  mutateCommissionRule,
  previewCommission,
  previewCommissionCascade,
  previewTeacherPriceSplit,
  setCommissionDefaults,
} from '../../lib/admin/enterprise-commission-engine.js';
import {
  getFinanceSummary,
  mutatePayout,
  processSuccessfulPayment,
  PAYOUT_METHODS,
} from '../../lib/admin/enterprise-payment-engine.js';

const ELEVATED = new Set(['super_admin', 'owner', 'admin']);

async function assertEnterpriseAdminAccess() {
  if (process.env.FEATURE_AUTH_ENABLED !== 'true') {
    return null;
  }

  try {
    const { getSessionFromCookies } = await import('../../../lib/auth/session');
    const session = await getSessionFromCookies();
    if (!session) {
      return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (!ELEVATED.has(session.role)) {
      return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    return null;
  } catch {
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
}

export async function GET(request) {
  const denied = await assertEnterpriseAdminAccess();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'home';

  if (view === 'meta') {
    return Response.json(getEnterpriseAdminMeta(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'home') {
    const home = await buildHomeDashboard();
    return Response.json(home, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'module') {
    const moduleId = searchParams.get('module');
    if (!moduleId) {
      return Response.json({ error: 'MODULE_REQUIRED' }, { status: 400 });
    }
    return Response.json(
      listModuleItems(moduleId, {
        q: searchParams.get('q') || '',
        status: searchParams.get('status') || '',
        lessonSource: searchParams.get('lessonSource') || 'ALL',
        country: searchParams.get('country') || 'all',
        educationalSystem: searchParams.get('educationalSystem') || 'all',
        curriculum: searchParams.get('curriculum') || 'all',
        qualification: searchParams.get('qualification') || 'all',
        grade: searchParams.get('grade') || 'all',
        subjectFamily: searchParams.get('subjectFamily') || 'all',
        subject: searchParams.get('subject') || 'all',
        teacherGender: searchParams.get('teacherGender') || 'all',
        language: searchParams.get('language') || 'all',
        subtitleLanguage: searchParams.get('subtitleLanguage') || 'all',
        price: searchParams.get('price') || 'all',
        rating: searchParams.get('rating') || 'all',
        duration: searchParams.get('duration') || 'all',
        level: searchParams.get('level') || 'all',
        catalogSort: searchParams.get('catalogSort') || searchParams.get('sort') || 'newest',
        sort: searchParams.get('sort') || (moduleId === 'recorded-lessons' ? 'newest' : 'updatedAt'),
        dir: searchParams.get('dir') || 'desc',
        page: searchParams.get('page'),
        pageSize: searchParams.get('pageSize'),
        includeDeleted: searchParams.get('includeDeleted'),
      }),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (view === 'teacher-price-split') {
    return Response.json(
      {
        ok: true,
        split: previewTeacherPriceSplit({
          teacherPrice: searchParams.get('teacherPrice') || searchParams.get('price') || 0,
          commissionPercent: searchParams.get('commissionPercent') || undefined,
          currency: searchParams.get('currency') || undefined,
          service: searchParams.get('service') || 'recorded-lesson',
          partnerId: searchParams.get('partnerId') || undefined,
          teacherId: searchParams.get('teacherId') || undefined,
          courseId: searchParams.get('courseId') || undefined,
          partnerType: searchParams.get('partnerType') || undefined,
          promotionId: searchParams.get('promotionId') || undefined,
          campaignId: searchParams.get('campaignId') || undefined,
          sourceType: searchParams.get('sourceType') || 'TEACHER_RECORDED',
        }),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (view === 'commission-cascade') {
    return Response.json(
      {
        ok: true,
        cascade: previewCommissionCascade({
          teacherPrice: searchParams.get('teacherPrice') || searchParams.get('price') || 50,
          currency: searchParams.get('currency') || undefined,
          service: searchParams.get('service') || 'recorded-lesson',
          partnerId: searchParams.get('partnerId') || undefined,
          teacherId: searchParams.get('teacherId') || undefined,
          courseId: searchParams.get('courseId') || undefined,
          partnerType: searchParams.get('partnerType') || undefined,
          promotionId: searchParams.get('promotionId') || undefined,
          campaignId: searchParams.get('campaignId') || undefined,
          globalCommissionPercent: searchParams.get('globalCommissionPercent') || undefined,
          sourceType: searchParams.get('sourceType') || 'TEACHER_RECORDED',
        }),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (view === 'permissions') {
    return Response.json(getPermissionsMatrix(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'commission') {
    return Response.json(listCommissionRules({ q: searchParams.get('q') || '' }), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (view === 'commission-defaults') {
    return Response.json(getCommissionDefaults(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'finance-summary') {
    return Response.json(getFinanceSummary(), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'payout-methods') {
    return Response.json({ methods: PAYOUT_METHODS }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (view === 'export') {
    const moduleId = searchParams.get('module');
    if (!moduleId) {
      return Response.json({ error: 'MODULE_REQUIRED' }, { status: 400 });
    }
    const file = exportModuleCsv(moduleId, {
      q: searchParams.get('q') || '',
      status: searchParams.get('status') || '',
    });
    return new Response(file.csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  if (view === 'stream') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = async () => {
          const home = await buildHomeDashboard();
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                at: home.generatedAt,
                users: home.users,
                finance: home.finance,
                performance: home.performance,
              })}\n\n`,
            ),
          );
        };
        await send();
        const timer = setInterval(() => {
          send().catch(() => clearInterval(timer));
        }, 5000);
        setTimeout(() => {
          clearInterval(timer);
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
  const denied = await assertEnterpriseAdminAccess();
  if (denied) return denied;

  try {
    const body = await request.json();
    const { action, moduleId, payload } = body;

    if (action === 'home') {
      return Response.json(await buildHomeDashboard());
    }

    if (action === 'setCommissionDefaults') {
      return Response.json(setCommissionDefaults(payload || body, { user: body.user || 'owner' }));
    }

    if (action === 'previewCommission') {
      return Response.json({ ok: true, preview: previewCommission(payload || body) });
    }

    if (moduleId === 'commission-rules' && (action === 'create' || action === 'add' || action === 'update' || action === 'edit')) {
      return Response.json(mutateCommissionRule(action, payload || {}, { user: body.user || 'admin' }));
    }

    if (action === 'processPayment') {
      return Response.json(processSuccessfulPayment(payload || body, { user: body.user || 'system' }));
    }

    if (moduleId === 'payouts' && ['approve', 'reject', 'markTransferred'].includes(action)) {
      return Response.json(mutatePayout(action, payload || {}, { user: body.user || 'admin' }));
    }

    if (
      moduleId === 'permissions' ||
      action?.startsWith('role') ||
      action === 'createRole' ||
      action === 'assignPermissions' ||
      action === 'togglePermission' ||
      action === 'deleteRole' ||
      action === 'updateRolePermissions'
    ) {
      return Response.json(mutatePermissions(action, payload || body));
    }

    if (!moduleId) {
      return Response.json({ error: 'MODULE_REQUIRED' }, { status: 400 });
    }

    const result = mutateModule(moduleId, action, payload || {});
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return Response.json(
      { error: error.message || 'ENTERPRISE_ADMIN_FAILED' },
      { status: 502 },
    );
  }
}
