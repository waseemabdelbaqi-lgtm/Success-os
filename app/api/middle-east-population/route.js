import {
  runMiddleEastContentPopulation,
  approveMiddleEastBook,
  buildPopulationDashboard,
  listAdminReviews,
  populateOneMiddleEastBook,
} from '../../lib/ai/middle-east-content-population-engine';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const noStore = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

function dashboardPath() {
  return path.join(
    process.cwd(),
    'library',
    'middle-east-content-population',
    'dashboards',
    'MIDDLE-EAST-CONTENT-POPULATION-DASHBOARD.json',
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';
  if (view === 'reviews') {
    return Response.json({ reviews: listAdminReviews() }, { headers: noStore });
  }
  if (view === 'run') {
    const result = runMiddleEastContentPopulation({
      limit: Number(searchParams.get('limit') || 1),
      countryCode: searchParams.get('country') || undefined,
      bookId: searchParams.get('bookId') || undefined,
    });
    return Response.json(result, { headers: noStore });
  }
  if (view === 'refresh') {
    return Response.json(buildPopulationDashboard(), { headers: noStore });
  }
  const file = dashboardPath();
  if (!fs.existsSync(file)) {
    return Response.json(buildPopulationDashboard(), { headers: noStore });
  }
  return Response.json(JSON.parse(fs.readFileSync(file, 'utf8')), {
    headers: noStore,
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (body.action === 'approve') {
    return Response.json(approveMiddleEastBook(body.bookId, body), {
      headers: noStore,
    });
  }
  if (body.action === 'populateOne' && body.bookId) {
    return Response.json(populateOneMiddleEastBook(body.bookId, body), {
      headers: noStore,
    });
  }
  const result = runMiddleEastContentPopulation({
    limit: body.limit || 1,
    countryCode: body.countryCode,
    bookId: body.bookId,
    force: Boolean(body.force),
  });
  return Response.json(result, { headers: noStore });
}
