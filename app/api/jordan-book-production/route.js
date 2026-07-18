import {
  buildJordanProductionDashboard,
  buildJordanProductionQueue,
  produceNextJordanBook,
  produceJordanSubject,
  readProductionState,
} from '../../lib/ai/jordan-book-production-engine.js';
import { JO_EXCLUDED_CURRICULA } from '../../data/jordan-national-knowledge-sources.js';

export async function GET() {
  const dashboard = buildJordanProductionDashboard();
  const state = readProductionState();
  let queueSize = 0;
  try {
    queueSize = buildJordanProductionQueue().length;
  } catch {
    queueSize = 0;
  }
  return Response.json(
    {
      phase: 'JO-02',
      excludedCurricula: JO_EXCLUDED_CURRICULA,
      queueSize,
      state,
      dashboard,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'dashboard') {
      return Response.json(buildJordanProductionDashboard());
    }
    if (body.action === 'next') {
      return Response.json(produceNextJordanBook({ force: Boolean(body.force) }));
    }
    if (body.action === 'produce-subject') {
      if (!body.subject) {
        return Response.json({ error: 'SUBJECT_REQUIRED' }, { status: 400 });
      }
      return Response.json(
        produceJordanSubject(body.subject, { force: Boolean(body.force) }),
      );
    }
    if (body.action === 'queue') {
      const queue = buildJordanProductionQueue();
      return Response.json({
        total: queue.length,
        subjects: [...new Set(queue.map((j) => j.subject))],
        jobs: queue.slice(0, 50),
      });
    }
    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    return Response.json(
      {
        error: error.message || 'JO_02_FAILED',
        details: error.details || null,
      },
      { status: error.code === 'JO_01_BOOK_GENERATION_BLOCKED' ? 403 : 502 },
    );
  }
}
