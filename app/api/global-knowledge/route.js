import {
  runGlobalKnowledgeEngine,
  globalKnowledgeEngineStatus,
  buildGlobalKnowledgeQueue,
} from '../../lib/ai/global-knowledge-engine';
import {
  listLibraryBooks,
  listReports,
  listBaselines,
} from '../../lib/ai/library-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'status';

  if (view === 'queue') {
    return Response.json(buildGlobalKnowledgeQueue());
  }
  if (view === 'books') {
    return Response.json({ books: listLibraryBooks() });
  }
  if (view === 'reports') {
    return Response.json({ reports: listReports() });
  }
  if (view === 'baselines') {
    return Response.json({ baselines: listBaselines() });
  }

  return Response.json(globalKnowledgeEngineStatus());
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const report = await runGlobalKnowledgeEngine({
    countries: body.countries || null,
    generateBlueprints: Boolean(body.generateBlueprints),
    force: Boolean(body.force),
  });
  return Response.json(report);
}
