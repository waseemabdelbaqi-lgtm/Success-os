import { NextResponse } from 'next/server';
import {
  getRootsManifest,
  getRootsSnapshot,
  pulseRoots,
} from '@/app/lib/os/success-os-roots';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ok(data, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

function fail(error, status = 400) {
  return NextResponse.json(
    { ok: false, error: error?.message || String(error || 'REQUEST_FAILED') },
    { status },
  );
}

function requestOrigin(request) {
  try {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'http://127.0.0.1:3055';
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'snapshot';

    if (view === 'manifest') {
      return ok({ manifest: getRootsManifest() });
    }

    return ok({ snapshot: getRootsSnapshot() });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || 'pulse');

    if (action === 'pulse') {
      const report = await pulseRoots({
        origin: body.origin || requestOrigin(request),
        actor: body.actor || 'Waseem · Partner',
      });
      return ok({ report, snapshot: getRootsSnapshot() });
    }

    return fail(new Error('UNKNOWN_ACTION'), 400);
  } catch (error) {
    return fail(error, 400);
  }
}
