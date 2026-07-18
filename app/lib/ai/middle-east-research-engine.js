import fs from 'node:fs';
import path from 'node:path';
import {
  MIDDLE_EAST_COUNTRY_CODES,
  listMiddleEastDossiers,
  middleEastDossier,
} from '../../data/middle-east-research-registry.js';

const PHASE = 'PHASE_1_RESEARCH_ONLY';
const BOOK_GENERATION_THRESHOLD = 95;

function researchRoot() {
  return path.resolve(
    process.env.SUCCESS_OS_ME_RESEARCH_ROOT ||
      path.join(process.cwd(), 'library', 'middle-east-research'),
  );
}

function ensureDirs() {
  const root = researchRoot();
  for (const dir of ['database', 'country-reports', 'master']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  return root;
}

function scoreBool(value, points) {
  return value ? points : 0;
}

/**
 * Honest readiness for book generation.
 * Structure alone cannot reach 95% — learning objectives, verified subject
 * catalogues, and HE inventories are required.
 */
export function computeReadinessScore(dossier) {
  const breakdown = {};
  let score = 0;

  breakdown.moe = scoreBool(dossier.ministryOfEducation?.verified, 8);
  breakdown.mohe = scoreBool(dossier.ministryOfHigherEducation?.verified, 8);
  breakdown.curriculumAuthority = scoreBool(
    dossier.curriculumAuthority?.verified,
    8,
  );
  breakdown.examAuthority = scoreBool(
    dossier.examinationAuthority?.verified,
    5,
  );
  breakdown.accreditation = scoreBool(
    dossier.accreditationAuthority?.verified,
    5,
  );

  const nationalStatus = dossier.nationalCurriculum?.learningObjectivesStatus || '';
  const structureOk = Array.isArray(dossier.nationalCurriculum?.stages)
    && dossier.nationalCurriculum.stages.length > 0;
  breakdown.nationalStructure = scoreBool(structureOk, 12);

  const subjectVerification = dossier.nationalCurriculum?.subjectListVerification;
  const subjectsVerified =
    /verified-structure/i.test(String(dossier.educationalSystems?.[0]?.status || '')) ||
    (subjectVerification &&
      Object.values(subjectVerification).some((value) =>
        /verified/i.test(String(value)),
      ));
  breakdown.subjectCatalogues = subjectsVerified ? 12 : structureOk ? 6 : 0;

  const objectives =
    /not-captured|insufficient|seeded structure only/i.test(nationalStatus)
      ? 0
      : /partial/i.test(nationalStatus)
        ? 8
        : /complete|captured/i.test(nationalStatus)
          ? 18
          : 4;
  breakdown.learningObjectives = objectives;

  const universities = (dossier.universities || []).filter((item) => item.verified);
  breakdown.universities = Math.min(10, universities.length * 3);

  const colleges = (dossier.colleges || []).filter((item) => item.verified);
  breakdown.colleges = colleges.length ? 4 : 0;

  const technical = (dossier.technicalInstitutes || []).filter(
    (item) => item.verified,
  );
  breakdown.technicalInstitutes = technical.length ? 4 : 0;

  breakdown.internationalCurricula = (dossier.internationalCurricula || [])
    .length
    ? 6
    : 0;

  breakdown.officialSourcesBreadth = Math.min(
    10,
    (dossier.officialSources || []).length,
  );

  score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  score = Math.min(100, Math.round(score * 10) / 10);

  return {
    score,
    breakdown,
    bookGenerationReady: score >= BOOK_GENERATION_THRESHOLD,
    threshold: BOOK_GENERATION_THRESHOLD,
  };
}

export function buildCountryReport(code) {
  const dossier = middleEastDossier(code);
  if (!dossier) throw new Error(`UNKNOWN_ME_COUNTRY_${code}`);

  const readiness = computeReadinessScore(dossier);
  const grades = (dossier.nationalCurriculum?.stages || []).flatMap(
    (stage) => stage.grades || [],
  );
  const subjects = [
    ...new Set(
      (dossier.nationalCurriculum?.stages || []).flatMap(
        (stage) => stage.subjects || [],
      ),
    ),
  ];

  return {
    schema: 'success-os.middle-east-country-research-report.v1',
    phase: PHASE,
    bookGenerationAllowed: false,
    country: dossier.country,
    countryAr: dossier.countryAr,
    code: dossier.code,
    ministryOfEducation: dossier.ministryOfEducation,
    ministryOfHigherEducation: dossier.ministryOfHigherEducation,
    educationalSystems: dossier.educationalSystems,
    nationalCurriculum: dossier.nationalCurriculum?.name,
    nationalCurriculumDetail: dossier.nationalCurriculum,
    internationalCurricula: dossier.internationalCurricula,
    universities: dossier.universities,
    colleges: dossier.colleges,
    technicalInstitutes: dossier.technicalInstitutes,
    professionalPrograms: dossier.professionalPrograms,
    officialSubjects: subjects,
    grades,
    officialSourcesUsed: dossier.officialSources,
    missingInformation: dossier.missingInformation,
    readinessScoreForBookGeneration: readiness.score,
    readinessDetail: readiness,
    generatedAt: new Date().toISOString(),
  };
}

export function buildMasterReport(countryReports) {
  const reports = countryReports || MIDDLE_EAST_COUNTRY_CODES.map(buildCountryReport);
  const averageReadiness =
    Math.round(
      (reports.reduce(
        (sum, report) => sum + report.readinessScoreForBookGeneration,
        0,
      ) /
        reports.length) *
        10,
    ) / 10;

  return {
    schema: 'success-os.middle-east-master-research-report.v1',
    phase: PHASE,
    bookGenerationAllowed: false,
    phase2BlockedUntil:
      'Owner approval AND regional verified coverage ≥ 95%',
    generatedAt: new Date().toISOString(),
    countriesProcessed: reports.map((report) => ({
      code: report.code,
      country: report.country,
      readiness: report.readinessScoreForBookGeneration,
    })),
    educationalSystemsByCountry: Object.fromEntries(
      reports.map((report) => [report.country, report.educationalSystems]),
    ),
    nationalCurriculaByCountry: Object.fromEntries(
      reports.map((report) => [report.country, report.nationalCurriculum]),
    ),
    internationalCurriculaByCountry: Object.fromEntries(
      reports.map((report) => [report.country, report.internationalCurricula]),
    ),
    universitiesAndCollegesByCountry: Object.fromEntries(
      reports.map((report) => [
        report.country,
        {
          universities: report.universities,
          colleges: report.colleges,
          technicalInstitutes: report.technicalInstitutes,
        },
      ]),
    ),
    professionalEducationProvidersByCountry: Object.fromEntries(
      reports.map((report) => [report.country, report.professionalPrograms]),
    ),
    subjectsAvailableByCountry: Object.fromEntries(
      reports.map((report) => [report.country, report.officialSubjects]),
    ),
    readinessForDigitalBookGeneration: {
      averageReadinessScore: averageReadiness,
      countriesAtOrAbove95: reports.filter(
        (report) => report.readinessScoreForBookGeneration >= 95,
      ).length,
      regionalCoveragePercent: averageReadiness,
      phase2Allowed: false,
      reason:
        averageReadiness >= 95
          ? 'Coverage threshold met mathematically, but Phase 2 still requires explicit owner approval.'
          : `Regional readiness ${averageReadiness}% is below the 95% verified-coverage gate. No books will be generated.`,
    },
    remainingGapsAndRecommendations: [
      'Capture grade-by-grade official subject lists from each MoE/curriculum authority with retrieval date and content hash.',
      'Extract publicly published learning objectives only; never invent outcomes.',
      'Harvest complete HE / college / technical institute directories from MoHE / accreditation registers.',
      'Map professional certification providers via official regulators.',
      'Record admission requirement matrices only where publicly published.',
      'Re-score readiness after each harvest; keep Phase 2 locked until owner approval.',
      ...reports.flatMap((report) =>
        (report.missingInformation || []).map(
          (gap) => `${report.country}: ${gap}`,
        ),
      ),
    ],
    totals: {
      countries: reports.length,
      universitiesListed: reports.reduce(
        (sum, report) => sum + (report.universities?.length || 0),
        0,
      ),
      collegesListed: reports.reduce(
        (sum, report) => sum + (report.colleges?.length || 0),
        0,
      ),
      technicalInstitutesListed: reports.reduce(
        (sum, report) => sum + (report.technicalInstitutes?.length || 0),
        0,
      ),
      averageReadiness,
    },
  };
}

export function persistMiddleEastResearch() {
  const root = ensureDirs();
  const dossiers = listMiddleEastDossiers();
  const databasePath = path.join(root, 'database', 'middle-east-knowledge-base.json');
  const database = {
    schema: 'success-os.middle-east-knowledge-base.v1',
    phase: PHASE,
    bookGenerationAllowed: false,
    updatedAt: new Date().toISOString(),
    countries: dossiers,
  };
  fs.writeFileSync(databasePath, JSON.stringify(database, null, 2), 'utf8');

  const countryReports = MIDDLE_EAST_COUNTRY_CODES.map((code) => {
    const report = buildCountryReport(code);
    const file = path.join(
      root,
      'country-reports',
      `${code}-${report.country.replace(/\s+/g, '-')}.json`,
    );
    fs.writeFileSync(file, JSON.stringify(report, null, 2), 'utf8');
    return { ...report, reportPath: file };
  });

  const master = buildMasterReport(countryReports);
  const masterPath = path.join(root, 'master', 'MIDDLE-EAST-MASTER-REPORT.json');
  fs.writeFileSync(masterPath, JSON.stringify(master, null, 2), 'utf8');

  return {
    databasePath,
    masterPath,
    countryReports,
    master: { ...master, reportPath: masterPath },
  };
}

export function middleEastResearchStatus() {
  return {
    engine: 'SUCCESS OS Middle East Education Research Engine',
    phase: PHASE,
    bookGenerationAllowed: false,
    countries: MIDDLE_EAST_COUNTRY_CODES,
    bookGenerationThreshold: BOOK_GENERATION_THRESHOLD,
    storageRoot: researchRoot(),
  };
}
