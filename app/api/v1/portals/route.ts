import { NextResponse } from 'next/server';
import { getPortalsApiPayload } from '@/app/data/admission-portals';

export const dynamic = 'force-static';

/**
 * GET /api/v1/portals
 * Unified portals API — A–Z ordered production records:
 * { Name, Website, Type, Scope, Details }[]
 *
 * Optional query:
 *   ?type=Admission
 *   ?scope=United States
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get('type') || '').toLowerCase();
  const scope = (searchParams.get('scope') || '').toLowerCase();

  let data = getPortalsApiPayload();
  if (type) data = data.filter((p) => p.Type.toLowerCase().includes(type));
  if (scope) data = data.filter((p) => p.Scope.toLowerCase().includes(scope));

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Portals-Count': String(data.length),
    },
  });
}
