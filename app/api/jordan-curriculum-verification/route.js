import {
  adminApproveJordanBook,
  adminEditJordanBook,
  adminRejectJordanBook,
  adminRegenerateJordanBook,
  buildJo03Dashboard,
  compareBookWithCurriculum,
  previewJordanBook,
  verifyAllJordanBooks,
  verifyJordanBook,
} from '../../lib/ai/jordan-curriculum-verification-engine.js';
import { JO03_PUBLISH_GATE } from '../../lib/ai/jordan-curriculum-verification-engine.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';
  const bookId = searchParams.get('bookId');

  if (view === 'preview' && bookId) {
    return Response.json(previewJordanBook(bookId), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (view === 'compare' && bookId) {
    return Response.json(compareBookWithCurriculum(bookId), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (view === 'review' && bookId) {
    return Response.json(verifyJordanBook(bookId, { dryRun: true }), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return Response.json(
    {
      phase: 'JO-03',
      publishGate: JO03_PUBLISH_GATE,
      dashboard: buildJo03Dashboard(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, bookId } = body;

    if (action === 'verify-all') {
      return Response.json(verifyAllJordanBooks());
    }
    if (action === 'verify') {
      if (!bookId) return Response.json({ error: 'BOOK_ID_REQUIRED' }, { status: 400 });
      return Response.json(verifyJordanBook(bookId));
    }
    if (action === 'approve') {
      if (!bookId) return Response.json({ error: 'BOOK_ID_REQUIRED' }, { status: 400 });
      return Response.json(adminApproveJordanBook(bookId, { notes: body.notes }));
    }
    if (action === 'reject') {
      if (!bookId) return Response.json({ error: 'BOOK_ID_REQUIRED' }, { status: 400 });
      return Response.json(adminRejectJordanBook(bookId, { notes: body.notes }));
    }
    if (action === 'regenerate') {
      if (!bookId) return Response.json({ error: 'BOOK_ID_REQUIRED' }, { status: 400 });
      return Response.json(adminRegenerateJordanBook(bookId));
    }
    if (action === 'edit') {
      if (!bookId) return Response.json({ error: 'BOOK_ID_REQUIRED' }, { status: 400 });
      return Response.json(adminEditJordanBook(bookId, body.patch || body));
    }
    if (action === 'preview') {
      if (!bookId) return Response.json({ error: 'BOOK_ID_REQUIRED' }, { status: 400 });
      return Response.json(previewJordanBook(bookId));
    }
    if (action === 'compare') {
      if (!bookId) return Response.json({ error: 'BOOK_ID_REQUIRED' }, { status: 400 });
      return Response.json(compareBookWithCurriculum(bookId));
    }
    if (action === 'dashboard') {
      return Response.json(buildJo03Dashboard());
    }

    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error.message || 'JO_03_FAILED', details: error.details || null },
      { status: 502 },
    );
  }
}
