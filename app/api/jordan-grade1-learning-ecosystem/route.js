import {
  buildGrade1EcosystemDashboard,
  listGrade1EcosystemPackages,
  runJordanGrade1LearningEcosystem,
} from '../../lib/ai/jordan-grade1-learning-ecosystem-engine.js';
import {
  G1_COMPLETION_CHECKLIST,
  G1_OFFICIAL_CATALOG_URL,
  G1_OFFICIAL_SUBJECTS,
  G1_ECOSYSTEM_VERSION,
} from '../../data/jordan-grade1-learning-ecosystem.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'list') {
    return Response.json(
      { packages: listGrade1EcosystemPackages(searchParams.get('subject')) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return Response.json(
    {
      phase: 'JO-01.2',
      version: G1_ECOSYSTEM_VERSION,
      officialCatalogUrl: G1_OFFICIAL_CATALOG_URL,
      subjects: G1_OFFICIAL_SUBJECTS,
      checklistSize: G1_COMPLETION_CHECKLIST.length,
      checklist: G1_COMPLETION_CHECKLIST,
      dashboard: buildGrade1EcosystemDashboard(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'run' || body.action === 'produce') {
      return Response.json(
        runJordanGrade1LearningEcosystem(body.options || {}),
      );
    }
    if (body.action === 'dashboard') {
      return Response.json(buildGrade1EcosystemDashboard());
    }
    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error.message || 'JO_01_2_FAILED' },
      { status: 502 },
    );
  }
}
