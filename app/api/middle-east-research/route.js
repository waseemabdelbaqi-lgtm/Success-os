import {
  middleEastResearchStatus,
  persistMiddleEastResearch,
  buildCountryReport,
  buildMasterReport,
} from '../../lib/ai/middle-east-research-engine';
import { MIDDLE_EAST_COUNTRY_CODES } from '../../data/middle-east-research-registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'status';
  const code = searchParams.get('country');

  if (view === 'country' && code) {
    return Response.json(buildCountryReport(code));
  }
  if (view === 'master') {
    return Response.json(buildMasterReport());
  }
  if (view === 'countries') {
    return Response.json({ countries: MIDDLE_EAST_COUNTRY_CODES });
  }
  return Response.json(middleEastResearchStatus());
}

export async function POST() {
  const result = persistMiddleEastResearch();
  return Response.json({
    phase: 'PHASE_1_RESEARCH_ONLY',
    bookGenerationAllowed: false,
    databasePath: result.databasePath,
    masterPath: result.masterPath,
    master: result.master,
    countryReports: result.countryReports.map((report) => ({
      code: report.code,
      country: report.country,
      readinessScoreForBookGeneration: report.readinessScoreForBookGeneration,
      reportPath: report.reportPath,
      missingInformation: report.missingInformation,
    })),
  });
}
