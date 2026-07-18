import {
  createSingleBookShell,
  digitalBookFactoryStatus,
  requestMassBookGeneration,
  validateAndPersistBookFactory,
} from '../../lib/ai/digital-book-factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'status';

  if (view === 'validate') {
    return Response.json(validateAndPersistBookFactory());
  }

  return Response.json(digitalBookFactoryStatus());
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const action = body.action || 'validate-template';

  if (action === 'validate-template') {
    return Response.json(validateAndPersistBookFactory());
  }

  if (action === 'shell-preview') {
    return Response.json(
      createSingleBookShell(body.subject || {}, {
        persist: Boolean(body.persist),
      }),
    );
  }

  if (action === 'request-mass-generation') {
    return Response.json(
      requestMassBookGeneration({
        confirmMassGeneration: Boolean(body.confirmMassGeneration),
      }),
    );
  }

  return Response.json(
    { error: 'UNKNOWN_ACTION', allowed: ['validate-template', 'shell-preview', 'request-mass-generation'] },
    { status: 400 },
  );
}
