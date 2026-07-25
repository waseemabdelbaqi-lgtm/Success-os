import { NextResponse } from 'next/server';
import productionPortals from '@/app/data/university_portals_production.json';

export const dynamic = 'force-static';

type Portal = {
  Name: string;
  Website: string;
  Type: string;
  Region: string;
  Details: string;
};

/**
 * GET /api/v1/portals
 * Unified University Portals API — A–Z ordered production records.
 * Shape matches FastAPI: list[Portal] with Name/Website/Type/Region/Details.
 */
export async function GET() {
  const data = ([...productionPortals] as Portal[]).sort((a, b) =>
    a.Name.localeCompare(b.Name, 'en'),
  );

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Portals-Count': String(data.length),
    },
  });
}
