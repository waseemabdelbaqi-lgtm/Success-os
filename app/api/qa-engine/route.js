import {
  buildGlobalQaDashboard,
  reviewSingleLibraryBook,
  runQaEngineBootstrap,
  successOsQaStatus,
  validateQaEngineProductionReady,
} from '../../lib/ai/success-os-qa-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'status';

  if (view === 'dashboard') {
    return Response.json(buildGlobalQaDashboard());
  }
  if (view === 'validation') {
    return Response.json(validateQaEngineProductionReady());
  }
  return Response.json(successOsQaStatus());
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const action = body.action || 'bootstrap';

  if (action === 'bootstrap') {
    return Response.json(
      runQaEngineBootstrap({
        sampleLimit: Math.min(5, Number(body.sampleLimit) || 0),
      }),
    );
  }

  if (action === 'review-one') {
    if (!body.bookId) {
      return Response.json({ error: 'BOOK_ID_REQUIRED' }, { status: 400 });
    }
    return Response.json(reviewSingleLibraryBook(body.bookId));
  }

  return Response.json(
    { error: 'UNKNOWN_ACTION', allowed: ['bootstrap', 'review-one'] },
    { status: 400 },
  );
}
