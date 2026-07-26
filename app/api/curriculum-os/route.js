import { NextResponse } from 'next/server';
import {
  getCurriculumOsSnapshot,
  getCurriculumOutline,
  ingestCurriculumOutline,
  listCurriculumOutlines,
  matchTeachersForLesson,
  publishCurriculumOutline,
} from '@/app/lib/curriculum/curriculum-os-store';
import {
  getJordanWave1Snapshot,
  harvestJordanStructure,
  reformulateJordanHarvest,
  runJordanWave1,
} from '@/app/lib/curriculum/jordan-wave1-engine';
import {
  buildJordanElementaryStage,
  getJordanElementarySnapshot,
} from '@/app/lib/curriculum/jordan-elementary-stage';

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'snapshot';
    const id = searchParams.get('id') || '';
    const lessonSlug = searchParams.get('lessonSlug') || '';

    if (view === 'jordan' || view === 'jordan-wave1') {
      return ok({ jordan: getJordanWave1Snapshot() });
    }

    if (view === 'jordan-elementary' || view === 'elementary') {
      return ok({ elementary: getJordanElementarySnapshot() });
    }

    if (view === 'outline' && id) {
      const outline = getCurriculumOutline(id);
      if (!outline) return fail(new Error('OUTLINE_NOT_FOUND'), 404);
      const teachers = matchTeachersForLesson({
        subjects: outline.teacherHints?.subjects || [outline.subject],
        curricula: outline.teacherHints?.curricula || [outline.curriculumType],
      });
      return ok({ outline, teachers });
    }

    if (view === 'teachers') {
      return ok({
        teachers: matchTeachersForLesson({
          subjects: (searchParams.get('subjects') || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          curricula: (searchParams.get('curricula') || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          q: searchParams.get('q') || '',
        }),
      });
    }

    if (view === 'list') {
      return ok({
        outlines: listCurriculumOutlines({
          status: searchParams.get('status') || undefined,
          region: searchParams.get('region') || undefined,
          subject: searchParams.get('subject') || undefined,
          lessonSlug: lessonSlug || undefined,
          q: searchParams.get('q') || undefined,
        }),
      });
    }

    return ok({ snapshot: getCurriculumOsSnapshot() });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = String(body?.action || 'ingest');

    if (action === 'ingest') {
      const outline = ingestCurriculumOutline(body);
      return ok({ outline }, 201);
    }

    if (action === 'publish') {
      if (!body?.id) return fail(new Error('ID_REQUIRED'));
      const outline = publishCurriculumOutline(body.id, body.actor || 'partner');
      return ok({ outline });
    }

    if (action === 'match-teachers') {
      return ok({
        teachers: matchTeachersForLesson({
          subjects: body?.subjects,
          curricula: body?.curricula,
          q: body?.q,
        }),
      });
    }

    if (action === 'jordan-harvest') {
      const harvest = await harvestJordanStructure();
      return ok({ harvest, jordan: getJordanWave1Snapshot() });
    }

    if (action === 'jordan-reformulate') {
      const reformulation = reformulateJordanHarvest({
        limit: body?.limit,
        grade: body?.grade,
        subject: body?.subject,
        publish: body?.publish === true,
      });
      return ok({ reformulation, jordan: getJordanWave1Snapshot() });
    }

    if (action === 'jordan-wave1' || action === 'jordan-run') {
      const result = await runJordanWave1({
        harvest: body?.harvest !== false,
        reformulate: body?.reformulate !== false,
        limit: Number(body?.limit) || 24,
        grade: body?.grade || '',
        subject: body?.subject || '',
        publish: body?.publish === true,
      });
      return ok(result);
    }

    if (action === 'jordan-elementary-build' || action === 'elementary-build') {
      const build = await buildJordanElementaryStage({
        harvest: body?.harvest !== false,
        limitPerGrade: Number(body?.limitPerGrade) || 12,
        publish: body?.publish === true,
      });
      return ok({ build, elementary: getJordanElementarySnapshot() });
    }

    return fail(new Error('UNKNOWN_ACTION'));
  } catch (error) {
    const msg = error?.message || String(error);
    const status = msg.includes('REQUIRED') || msg.includes('NOT_FOUND') ? 400 : 500;
    return fail(error, status);
  }
}
