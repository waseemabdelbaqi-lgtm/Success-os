import { runMiddleEastProductionReadiness } from '../../lib/ai/middle-east-production-readiness-engine';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const noStore = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

function reportPath() {
  return path.join(
    process.cwd(),
    'library',
    'middle-east-library-expansion',
    'production',
    'reports',
    'MIDDLE-EAST-PRODUCTION-READINESS-REPORT.json',
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('view') === 'run') {
    const result = runMiddleEastProductionReadiness({
      repairConnections: searchParams.get('repair') !== '0',
    });
    return Response.json(result.report, { headers: noStore });
  }
  const file = reportPath();
  if (!fs.existsSync(file)) {
    return Response.json(
      { error: 'PRODUCTION_REPORT_MISSING', hint: 'POST or GET ?view=run' },
      { status: 404, headers: noStore },
    );
  }
  return Response.json(JSON.parse(fs.readFileSync(file, 'utf8')), {
    headers: noStore,
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const result = runMiddleEastProductionReadiness({
    repairConnections: body.repairConnections !== false,
  });
  return Response.json(result, { headers: noStore });
}
