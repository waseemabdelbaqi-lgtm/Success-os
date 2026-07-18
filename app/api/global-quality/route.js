import {
  globalQualityStatus,
  runGlobalQualityEngine,
} from '../../lib/ai/global-quality-engine';
import {
  listQualityReviews,
  listFinalBookVersions,
} from '../../lib/ai/library-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'status';

  if (view === 'reviews') {
    return Response.json({ reviews: listQualityReviews() });
  }
  if (view === 'final-versions') {
    return Response.json({ books: listFinalBookVersions() });
  }
  return Response.json(globalQualityStatus());
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const report = await runGlobalQualityEngine({
    includeFixtures: Boolean(body.includeFixtures),
  });
  return Response.json(report);
}
