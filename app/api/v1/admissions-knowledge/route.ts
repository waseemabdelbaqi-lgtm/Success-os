import { NextResponse } from 'next/server';
import {
  ADMISSION_DOC_PACKS,
  ISCED_FIELDS,
  LANGUAGE_BENCHMARKS,
  MAJOR_CLUSTERS,
  REGION_PLAYBOOKS,
  knowledgeSummary,
} from '@/app/data/admissions-knowledge';
import {
  DESTINATION_TRACKS,
  compareNationalityTracks,
  exampleAlternateNationality,
  nationalityTracksSummary,
  resolveNationalityTrack,
} from '@/app/data/nationality-admission-tracks';

/**
 * GET /api/v1/admissions-knowledge
 * Research layer: ISCED fields, major clusters, language bands, region playbooks,
 * and nationality-aware admission tracks.
 *
 * Query: ?studyCountry=&nationality=&residenceCountry=&applicantType=
 * resolves the matching nationality track for that pair.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studyCountry = searchParams.get('studyCountry') || '';
  const nationality = searchParams.get('nationality') || '';
  const residenceCountry = searchParams.get('residenceCountry') || '';
  const applicantType = searchParams.get('applicantType') || '';

  const resolved =
    studyCountry && nationality
      ? resolveNationalityTrack({
          studyCountry,
          nationality,
          residenceCountry: residenceCountry || undefined,
          applicantType: applicantType || undefined,
        })
      : null;

  const contrast =
    studyCountry && nationality
      ? compareNationalityTracks(
          studyCountry,
          nationality,
          exampleAlternateNationality(studyCountry, nationality),
        )
      : null;

  return NextResponse.json({
    ok: true,
    summary: {
      ...knowledgeSummary(),
      nationality: nationalityTracksSummary(),
    },
    iscedFields: ISCED_FIELDS,
    majorClusters: MAJOR_CLUSTERS,
    languageBenchmarks: LANGUAGE_BENCHMARKS,
    docPacks: ADMISSION_DOC_PACKS,
    regionPlaybooks: REGION_PLAYBOOKS,
    nationalityTracks: DESTINATION_TRACKS,
    resolvedTrack: resolved,
    nationalityContrast: contrast,
  });
}
