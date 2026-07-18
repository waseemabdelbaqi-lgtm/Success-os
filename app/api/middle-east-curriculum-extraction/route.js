import {
  runMiddleEastCurriculumKnowledgeExtraction,
} from '../../lib/ai/middle-east-curriculum-knowledge-extraction-engine';
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
    'middle-east-curriculum-extraction',
    'reports',
    'MIDDLE-EAST-CURRICULUM-KNOWLEDGE-EXTRACTION-REPORT.json',
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('view') === 'run') {
    const result = runMiddleEastCurriculumKnowledgeExtraction();
    return Response.json(result.master, { headers: noStore });
  }
  const file = reportPath();
  if (!fs.existsSync(file)) {
    return Response.json(
      { error: 'EXTRACTION_REPORT_MISSING', hint: 'POST or GET ?view=run' },
      { status: 404, headers: noStore },
    );
  }
  return Response.json(JSON.parse(fs.readFileSync(file, 'utf8')), {
    headers: noStore,
  });
}

export async function POST() {
  const result = runMiddleEastCurriculumKnowledgeExtraction();
  return Response.json(result, { headers: noStore });
}
