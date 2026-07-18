import {
  buildMiddleEastCompletionDashboard,
  buildMiddleEastExpansionQueue,
  middleEastExpansionStatus,
  persistMiddleEastCompletionDashboard,
  runMiddleEastLibraryExpansion,
} from '../../lib/ai/middle-east-library-expansion-engine';
import { rebuildMiddleEastLiveBookIndex } from '../../lib/student/middle-east-live-book-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'status';

  if (view === 'dashboard') {
    const dashboard = buildMiddleEastCompletionDashboard();
    persistMiddleEastCompletionDashboard(dashboard);
    return Response.json(dashboard);
  }
  if (view === 'queue') {
    return Response.json(buildMiddleEastExpansionQueue());
  }
  return Response.json(middleEastExpansionStatus());
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const action = body.action || 'expand';

  if (action === 'rebuild-index') {
    return Response.json(rebuildMiddleEastLiveBookIndex());
  }

  if (action === 'dashboard') {
    const dashboard = buildMiddleEastCompletionDashboard();
    const dashboardPath = persistMiddleEastCompletionDashboard(dashboard);
    return Response.json({ dashboard, dashboardPath });
  }

  if (action === 'expand') {
    const result = runMiddleEastLibraryExpansion({
      limit: body.limit,
      countries: body.countries || null,
      refreshExisting: Boolean(body.refreshExisting),
    });
    return Response.json(result);
  }

  return Response.json(
    { error: 'UNKNOWN_ACTION', allowed: ['expand', 'dashboard', 'rebuild-index'] },
    { status: 400 },
  );
}
