import {
  buildJordanNormalizationDashboard,
  normalizeJordanCurriculum,
  readUniversalEducationModel,
  runJordanCurriculumNormalization,
} from '../../lib/ai/jordan-curriculum-normalization-engine.js';
import { UEM_ENTITY_KINDS, UEM_VERSION } from '../../data/universal-education-model.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'model') {
    return Response.json(readUniversalEducationModel() || { missing: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return Response.json(
    {
      phase: 'JO-08',
      uemVersion: UEM_VERSION,
      entityKinds: UEM_ENTITY_KINDS,
      dashboard: buildJordanNormalizationDashboard(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'normalize' || body.action === 'rebuild') {
      return Response.json(runJordanCurriculumNormalization(body.options || {}));
    }
    if (body.action === 'dashboard') {
      return Response.json(buildJordanNormalizationDashboard());
    }
    if (body.action === 'normalize-raw') {
      return Response.json(normalizeJordanCurriculum(body.options || {}));
    }
    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error.message || 'JO_08_FAILED', details: error.details || null },
      { status: 502 },
    );
  }
}
