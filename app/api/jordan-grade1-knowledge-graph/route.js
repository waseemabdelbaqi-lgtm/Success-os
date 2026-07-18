import {
  buildJordanKnowledgeGraphDashboard,
  queryJordanKnowledgeGraph,
  runJordanGrade1KnowledgeGraph,
  getJordanGrade1KnowledgeGraph,
} from '../../lib/ai/jordan-grade1-knowledge-graph-engine.js';
import {
  KG_AI_SERVICES,
  KG_EDGE_TYPES,
  KG_NODE_KINDS,
  KG_SEARCH_FACETS,
  KG_VERSION,
} from '../../data/educational-knowledge-graph.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'dashboard';

  if (view === 'visual') {
    return Response.json(getJordanGrade1KnowledgeGraph().readVisual() || { missing: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (view === 'search' || searchParams.get('q')) {
    return Response.json(
      queryJordanKnowledgeGraph('search', {
        query: searchParams.get('q') || '',
        facet: searchParams.get('facet') || null,
        limit: Number(searchParams.get('limit') || 40),
      }),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (view === 'query') {
    return Response.json(
      queryJordanKnowledgeGraph(searchParams.get('action') || 'search', {
        lessonId: searchParams.get('lessonId'),
        unitId: searchParams.get('unitId'),
        concept: searchParams.get('concept'),
        skill: searchParams.get('skill'),
        query: searchParams.get('q'),
      }),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return Response.json(
    {
      phase: 'JO-01.4',
      kgVersion: KG_VERSION,
      nodeKinds: KG_NODE_KINDS,
      edgeTypes: KG_EDGE_TYPES,
      searchFacets: KG_SEARCH_FACETS,
      aiServices: KG_AI_SERVICES,
      dashboard: buildJordanKnowledgeGraphDashboard(),
      visual: getJordanGrade1KnowledgeGraph().readVisual(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'build' || body.action === 'run') {
      return Response.json(runJordanGrade1KnowledgeGraph(body.options || {}));
    }
    if (body.action === 'dashboard') {
      return Response.json(buildJordanKnowledgeGraphDashboard());
    }
    if (body.action === 'query' || body.action === 'search' || body.action === 'recommendNext') {
      return Response.json(
        queryJordanKnowledgeGraph(body.queryAction || body.action, body.payload || body),
      );
    }
    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    return Response.json(
      {
        error: error.message || 'JO_01_4_FAILED',
        details: error.details || null,
      },
      { status: error.message?.includes('PREREQUISITE') ? 409 : 502 },
    );
  }
}
