import {
  buildJordanKnowledgeDashboard,
  buildJordanNationalKnowledgeDatabase,
  harvestNccdCatalogues,
  isJordanBookGenerationAllowed,
  readJordanKnowledgeStatus,
  runJordanNationalKnowledgeEngine,
} from '../../lib/ai/jordan-national-knowledge-engine.js';
import {
  JO_EXCLUDED_CURRICULA,
  JO_PRIORITY_1_SOURCES,
  JO_VERIFICATION_GATE,
} from '../../data/jordan-national-knowledge-sources.js';

export async function GET() {
  const status = readJordanKnowledgeStatus();
  const dashboard = buildJordanKnowledgeDashboard();
  return Response.json(
    {
      phase: 'JO-01',
      gatePercent: JO_VERIFICATION_GATE,
      bookGenerationAllowed: isJordanBookGenerationAllowed(),
      excludedCurricula: JO_EXCLUDED_CURRICULA,
      priority1Sources: JO_PRIORITY_1_SOURCES,
      status,
      dashboard,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'status') {
      return Response.json(readJordanKnowledgeStatus() || { missing: true });
    }
    if (body.action === 'dashboard') {
      return Response.json(buildJordanKnowledgeDashboard());
    }
    if (body.action === 'harvest-nccd') {
      const results = await harvestNccdCatalogues({
        grades: body.grades || undefined,
      });
      const rebuilt = runJordanNationalKnowledgeEngine();
      return Response.json({ harvest: results, rebuild: rebuilt });
    }
    if (body.action === 'build' || body.action === 'rebuild') {
      const result = buildJordanNationalKnowledgeDatabase(body.options || {});
      return Response.json({
        verifiedCompletionPercent: result.database.verification.verifiedCompletionPercent,
        bookGenerationAllowed: result.database.verification.bookGenerationAllowed,
        totals: result.database.totals,
        status: result.status,
      });
    }
    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    return Response.json(
      {
        error: error.message || 'JO_01_ENGINE_FAILED',
        details: error.details || null,
      },
      { status: 502 },
    );
  }
}
