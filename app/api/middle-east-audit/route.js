import {
  runMiddleEastMasterAudit,
} from '../../lib/ai/middle-east-master-audit-engine';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const noStore = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

function masterReportPath() {
  return path.join(
    process.cwd(),
    'library',
    'middle-east-library-expansion',
    'audit',
    'reports',
    'MIDDLE-EAST-MASTER-AUDIT-REPORT.json',
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'report';
  const file = masterReportPath();

  if (view === 'run') {
    const result = runMiddleEastMasterAudit({
      repairConnections: searchParams.get('repair') !== '0',
    });
    return Response.json(result.master, { headers: noStore });
  }

  if (!fs.existsSync(file)) {
    return Response.json(
      { error: 'AUDIT_REPORT_MISSING', hint: 'POST or GET ?view=run' },
      { status: 404, headers: noStore },
    );
  }

  return Response.json(JSON.parse(fs.readFileSync(file, 'utf8')), {
    headers: noStore,
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const result = runMiddleEastMasterAudit({
    repairConnections: body.repairConnections !== false,
  });
  return Response.json(result, { headers: noStore });
}
