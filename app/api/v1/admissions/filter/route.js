import { NextResponse } from 'next/server';
import { filterInstitutionsForProfile } from '@/app/data/admission-funnel';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = filterInstitutionsForProfile(body?.profile || body || {}, {
      studyCountry: body?.studyCountry,
      nationality: body?.nationality,
      major: body?.major,
      targetDegree: body?.targetDegree,
    });
    return NextResponse.json(
      {
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'FILTER_FAILED', message: error?.message || 'Filter failed' },
      },
      { status: 400 },
    );
  }
}
