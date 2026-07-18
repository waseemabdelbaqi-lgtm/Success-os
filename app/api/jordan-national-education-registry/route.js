import {
  buildJordanNationalEducationRegistryDashboard,
  getJordanRegistryEntity,
  readJordanNationalEducationRegistry,
  runJordanNationalEducationRegistry,
  searchJordanNationalEducationRegistry,
} from '../../lib/ai/jordan-national-education-registry-engine.js';
import {
  REGISTRY_ENTITY_KINDS,
  REGISTRY_SEARCH_FACETS,
  REGISTRY_VERSION,
} from '../../data/national-education-registry.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';
  const q = searchParams.get('q') || searchParams.get('search');
  const globalId = searchParams.get('globalId');

  if (view === 'search' || q) {
    return Response.json(
      searchJordanNationalEducationRegistry(q || '', {
        facet: searchParams.get('facet') || null,
        gradeId: searchParams.get('gradeId') || null,
        subjectId: searchParams.get('subjectId') || null,
        limit: Number(searchParams.get('limit') || 40),
      }),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (view === 'entity' && globalId) {
    return Response.json(getJordanRegistryEntity(globalId) || { missing: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (view === 'registry') {
    const reg = readJordanNationalEducationRegistry();
    return Response.json(
      reg
        ? {
            schema: reg.schema,
            registryVersion: reg.registryVersion,
            countries: reg.countries,
            totals: reg.totals,
            countryTotals: reg.countryTotals,
            validation: reg.validation,
            searchDocumentCount: reg.searchDocumentCount,
            expansion: reg.expansion,
          }
        : { missing: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return Response.json(
    {
      phase: 'JO-10',
      registryVersion: REGISTRY_VERSION,
      entityKinds: REGISTRY_ENTITY_KINDS,
      searchFacets: REGISTRY_SEARCH_FACETS,
      dashboard: buildJordanNationalEducationRegistryDashboard(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'register' || body.action === 'rebuild') {
      return Response.json(runJordanNationalEducationRegistry(body.options || {}));
    }
    if (body.action === 'dashboard') {
      return Response.json(buildJordanNationalEducationRegistryDashboard());
    }
    if (body.action === 'search') {
      return Response.json(
        searchJordanNationalEducationRegistry(body.query || body.q || '', body.options || {}),
      );
    }
    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error.message || 'JO_10_FAILED', details: error.details || null },
      { status: 502 },
    );
  }
}
