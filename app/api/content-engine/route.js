import {
  contentEngineStatus,
  generateSubjectDraftContent,
  runContentEngineBootstrap,
  validateContentEngineProductionReady,
} from '../../lib/ai/educational-content-generation-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'status';

  if (view === 'validation') {
    return Response.json(validateContentEngineProductionReady());
  }
  return Response.json(contentEngineStatus());
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const action = body.action || 'validate';

  if (action === 'validate') {
    return Response.json(runContentEngineBootstrap({ generateSampleSubject: false }));
  }

  if (action === 'generate-sample-subject') {
    return Response.json(
      generateSubjectDraftContent(body.subject || {
        countryId: 'JO',
        country: 'Jordan',
        curriculum: 'Jordan National Curriculum',
        curriculumId: 'jo-national',
        subject: 'الرياضيات',
        grade: 'الصف 5',
        language: 'ar',
        authority: 'Ministry of Education — Jordan',
        source: 'https://moe.gov.jo/',
      }, { persist: Boolean(body.persist ?? true) }),
    );
  }

  if (action === 'mass-generate-library') {
    return Response.json(
      {
        allowed: false,
        error: 'MASS_LIBRARY_GENERATION_BLOCKED',
        reason:
          'Phase 8 stores drafts only. Full library generation requires explicit later approval.',
      },
      { status: 403 },
    );
  }

  return Response.json(
    {
      error: 'UNKNOWN_ACTION',
      allowed: ['validate', 'generate-sample-subject'],
    },
    { status: 400 },
  );
}
