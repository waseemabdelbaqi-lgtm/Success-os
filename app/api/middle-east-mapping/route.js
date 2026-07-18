import {
  middleEastMappingStatus,
  persistMiddleEastEducationMaps,
  buildEducationMap,
  buildCountryEducationProfile,
  buildMiddleEastMasterIndex,
} from '../../lib/ai/middle-east-mapping-engine';
import { MIDDLE_EAST_COUNTRY_CODES } from '../../data/middle-east-research-registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'status';
  const code = searchParams.get('country');

  if (view === 'map' && code) {
    return Response.json(buildEducationMap(code));
  }
  if (view === 'profile' && code) {
    return Response.json(
      buildCountryEducationProfile(buildEducationMap(code)),
    );
  }
  if (view === 'master') {
    return Response.json(buildMiddleEastMasterIndex());
  }
  if (view === 'countries') {
    return Response.json({ countries: MIDDLE_EAST_COUNTRY_CODES });
  }
  return Response.json(middleEastMappingStatus());
}

export async function POST() {
  const result = persistMiddleEastEducationMaps();
  return Response.json({
    phase: 'PHASE_2_EDUCATION_MAPPING',
    bookGenerationAllowed: false,
    masterPath: result.masterPath,
    master: result.master,
    profiles: result.profiles.map((profile) => ({
      code: profile.code,
      country: profile.country,
      readinessScorePercent: profile.readinessScorePercent,
      universities: profile.universities.length,
      colleges: profile.colleges.length,
      technicalInstitutes: profile.technicalInstitutes.length,
      schoolSubjects: profile.schoolSubjects.length,
      missingInformation: profile.missingInformation.length,
      profilePath: profile.profilePath,
    })),
  });
}
