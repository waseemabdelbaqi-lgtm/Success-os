import {
  buildReferenceLibraryDashboard,
  linkJordanBooksToReferenceLibrary,
  listVerifiedSources,
  probeReferenceUrls,
  readJordanReferenceLibrary,
  readJordanReferenceStatus,
  registerCurriculumUpdate,
  runJordanEducationalReferenceLibrary,
} from '../../lib/ai/jordan-educational-reference-library-engine.js';
import { JO05_CATEGORIES } from '../../data/jordan-educational-reference-seed.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'library') {
    return Response.json(readJordanReferenceLibrary() || { missing: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (view === 'status') {
    return Response.json(readJordanReferenceStatus() || { missing: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (view === 'sources') {
    return Response.json({
      sources: listVerifiedSources({
        category: searchParams.get('category') || undefined,
        subject: searchParams.get('subject') || undefined,
        grade: searchParams.get('grade') || undefined,
      }),
    });
  }

  return Response.json(
    {
      phase: 'JO-05',
      categories: JO05_CATEGORIES,
      status: readJordanReferenceStatus(),
      dashboard: buildReferenceLibraryDashboard(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'build' || body.action === 'rebuild') {
      return Response.json(runJordanEducationalReferenceLibrary(body.options || {}));
    }
    if (body.action === 'link') {
      return Response.json(linkJordanBooksToReferenceLibrary(body.options || {}));
    }
    if (body.action === 'dashboard') {
      return Response.json(buildReferenceLibraryDashboard());
    }
    if (body.action === 'probe') {
      return Response.json({ results: await probeReferenceUrls({ limit: body.limit || 20 }) });
    }
    if (body.action === 'curriculum-update') {
      return Response.json(registerCurriculumUpdate(body));
    }
    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error.message || 'JO_05_FAILED', details: error.details || null },
      { status: 502 },
    );
  }
}
