import { NextResponse } from 'next/server';
import {
  ADMISSION_DOC_PACKS,
  ISCED_FIELDS,
  LANGUAGE_BENCHMARKS,
  MAJOR_CLUSTERS,
  REGION_PLAYBOOKS,
  knowledgeSummary,
} from '@/app/data/admissions-knowledge';

/**
 * GET /api/v1/admissions-knowledge
 * Research layer: ISCED fields, major clusters, language bands, region playbooks.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    summary: knowledgeSummary(),
    iscedFields: ISCED_FIELDS,
    majorClusters: MAJOR_CLUSTERS,
    languageBenchmarks: LANGUAGE_BENCHMARKS,
    docPacks: ADMISSION_DOC_PACKS,
    regionPlaybooks: REGION_PLAYBOOKS,
  });
}
