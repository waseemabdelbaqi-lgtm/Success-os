import {
  getElementaryStudioSnapshot,
  produceElementaryStudioVideo,
  rebuildWithGemini,
  refreshElementaryStudioJob,
  studioProviderStatus,
} from '@/app/lib/curriculum/elementary-studio';

export async function GET(request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') || 'jordan-g1-math-number-line-addition';
  const view = url.searchParams.get('view') || 'snapshot';
  if (view === 'status') {
    return Response.json(studioProviderStatus());
  }
  return Response.json(getElementaryStudioSnapshot(slug));
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = body.slug || 'jordan-g1-math-number-line-addition';
    const action = body.action || 'produce';

    if (action === 'refresh') {
      return Response.json(await refreshElementaryStudioJob(slug));
    }
    if (action === 'produce') {
      return Response.json(await produceElementaryStudioVideo(slug));
    }
    if (action === 'gemini-rebuild') {
      const steps = Array.isArray(body.steps) ? body.steps : ['all'];
      return Response.json(await rebuildWithGemini(steps));
    }
    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    const status =
      error.status ||
      (error.message === 'NO_AVATAR_PROVIDER_CONFIGURED' || error.message === 'NO_GEMINI_API_KEY' ? 503 : 500);
    return Response.json(
      {
        error: error.message || 'STUDIO_FAILED',
        message: error.messageAr || error.message,
        required: error.required,
      },
      { status },
    );
  }
}
