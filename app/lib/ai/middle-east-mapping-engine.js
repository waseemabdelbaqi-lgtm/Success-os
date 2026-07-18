import fs from 'node:fs';
import path from 'node:path';
import {
  MIDDLE_EAST_COUNTRY_CODES,
  middleEastDossier,
} from '../../data/middle-east-research-registry.js';
import { computeReadinessScore } from './middle-east-research-engine.js';

const PHASE = 'PHASE_2_EDUCATION_MAPPING';
const MAP_COMPLETENESS_THRESHOLD = 95;
const BOOK_GENERATION_ALLOWED = false;

const INTERNATIONAL_SYSTEMS = [
  {
    id: 'american',
    name: 'American',
    authorities: ['College Board (AP/SAT)', 'US-style high school diploma pathways'],
  },
  {
    id: 'british',
    name: 'British',
    authorities: ['Cambridge International', 'Pearson Edexcel', 'OxfordAQA'],
  },
  {
    id: 'ib',
    name: 'IB',
    authorities: ['International Baccalaureate'],
  },
  {
    id: 'cambridge',
    name: 'Cambridge',
    authorities: ['Cambridge International'],
  },
  {
    id: 'pearson-edexcel',
    name: 'Pearson Edexcel',
    authorities: ['Pearson Qualifications'],
  },
  {
    id: 'oxfordaqa',
    name: 'OxfordAQA',
    authorities: ['OxfordAQA'],
  },
  {
    id: 'ap',
    name: 'AP',
    authorities: ['College Board'],
  },
];

function mapRoot() {
  return path.resolve(
    process.env.SUCCESS_OS_ME_MAP_ROOT ||
      path.join(process.cwd(), 'library', 'middle-east-education-maps'),
  );
}

function ensureDirs() {
  const root = mapRoot();
  for (const dir of ['database', 'country-profiles', 'master']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  return root;
}

function subjectsByGrade(stages = []) {
  const rows = [];
  for (const stage of stages) {
    for (const grade of stage.grades || []) {
      rows.push({
        stage: stage.name,
        grade,
        subjects: stage.subjects || [],
        note: stage.note || null,
      });
    }
  }
  return rows;
}

function enrichInstitution(item, kind) {
  return {
    name: item.name,
    url: item.url || null,
    type: item.type || kind,
    verified: Boolean(item.verified),
    note: item.note || null,
    degreesOffered: item.degreesOffered || {
      status: 'pending-official-catalogue-harvest',
      known: item.degree || [],
    },
    faculties: item.faculties || {
      status: 'pending-official-catalogue-harvest',
      known: [],
    },
    departments: item.departments || {
      status: 'pending-official-catalogue-harvest',
      known: [],
    },
    programs: item.programs || {
      status: 'pending-official-catalogue-harvest',
      known: item.fields || [],
    },
    languagesOfInstruction: item.languagesOfInstruction ||
      item.language || ['pending-official-confirmation'],
    accreditation: item.accreditation || {
      status: 'verify-against-national-accreditation-register',
      note: 'Do not invent accreditation claims.',
    },
  };
}

function nationalExaminations(dossier) {
  const code = dossier.code;
  const defaults = {
    JO: [
      {
        name: 'General Secondary Education Certificate (Tawjihi)',
        authority: dossier.examinationAuthority?.name,
        url: dossier.examinationAuthority?.url,
        status: 'identified',
      },
    ],
    SA: [
      {
        name: 'Secondary pathways assessments + ETEC/Qiyas ecosystem (as applicable)',
        authority: dossier.examinationAuthority?.name,
        url: dossier.examinationAuthority?.url,
        status: 'identified',
      },
    ],
    AE: [
      {
        name: 'MoE secondary assessments / EmSAT ecosystem (as applicable by year)',
        authority: dossier.examinationAuthority?.name,
        url: dossier.examinationAuthority?.url,
        status: 'identified',
      },
    ],
    EG: [
      {
        name: 'Thanaweya Amma',
        authority: dossier.examinationAuthority?.name,
        url: dossier.examinationAuthority?.url,
        status: 'identified',
      },
    ],
    LB: [
      {
        name: 'Lebanese Official Baccalaureate',
        authority: dossier.examinationAuthority?.name,
        url: dossier.examinationAuthority?.url,
        status: 'identified',
      },
    ],
    PS: [
      {
        name: 'Tawjihi / General Secondary',
        authority: dossier.examinationAuthority?.name,
        url: dossier.examinationAuthority?.url,
        status: 'identified',
      },
    ],
  };

  return (
    defaults[code] || [
      {
        name: dossier.examinationAuthority?.name || 'National examinations',
        authority: dossier.examinationAuthority?.name,
        url: dossier.examinationAuthority?.url,
        status: 'authority-identified-exam-catalogue-pending',
      },
    ]
  );
}

function graduationRequirements(dossier) {
  return {
    status: 'high-level-only',
    summary:
      dossier.admissionRequirements?.nationalSecondary ||
      'Complete required national secondary pathway and examinations as published by MoE.',
    detailsPending: [
      'Official credit/hour or subject-pass matrices by track',
      'Yearly circular updates',
      'Vocational vs academic pathway differences',
    ],
    publicAvailability: dossier.admissionRequirements?.publicAvailability || 'partial',
  };
}

function mapInternationalSystems(dossier) {
  const named = new Set(
    (dossier.internationalCurricula || []).map((item) =>
      String(item.name || '').toLowerCase(),
    ),
  );

  return INTERNATIONAL_SYSTEMS.map((system) => {
    const recognized =
      system.id === 'american' ||
      system.id === 'british' ||
      system.id === 'other'
        ? Boolean(dossier.educationalSystems?.some((s) => s.type === 'international'))
        : [...named].some(
            (name) =>
              name.includes(system.id) ||
              name.includes(system.name.toLowerCase()) ||
              (system.id === 'ap' && name.includes('college board')) ||
              (system.id === 'pearson-edexcel' && name.includes('pearson')),
          );

    return {
      ...system,
      officiallyRecognizedPresence: recognized ? 'presence-indicated' : 'not-confirmed-in-phase-1',
      verificationNote:
        'Recognition for schools/students must be confirmed via MoE licensing and equivalency services; do not assume automatic acceptance.',
    };
  }).concat([
    {
      id: 'other',
      name: 'Other officially recognized systems',
      authorities: ['Country MoE private-school licensing registers'],
      officiallyRecognizedPresence: 'requires-official-licence-register-harvest',
      verificationNote:
        'Capture only systems listed on official MoE/accreditation portals.',
    },
  ]);
}

function classifyHigherEducation(dossier) {
  const all = [
    ...(dossier.universities || []).map((item) =>
      enrichInstitution(item, 'university'),
    ),
    ...(dossier.colleges || []).map((item) => enrichInstitution(item, 'college')),
    ...(dossier.technicalInstitutes || []).map((item) =>
      enrichInstitution(item, 'technical'),
    ),
  ];

  return {
    publicUniversities: all.filter((item) =>
      /university/i.test(item.type) && !/private|american|german/i.test(item.name),
    ),
    privateUniversities: all.filter((item) =>
      /university/i.test(item.type) && /private|american|german/i.test(item.name),
    ),
    communityColleges: all.filter((item) =>
      /college|community|polytechnic|paaet|utas|applied/i.test(
        `${item.type} ${item.name}`,
      ),
    ),
    technicalColleges: all.filter((item) =>
      /technical|tvtc|vocational|polytechnic|utas|paaet/i.test(
        `${item.type} ${item.name}`,
      ),
    ),
    vocationalInstitutes: all.filter((item) =>
      /technical|vocational|tvtc|institute/i.test(`${item.type} ${item.name}`),
    ),
    allInstitutions: all,
    inventoryCompleteness:
      'sample-seed-only — full official directories pending MoHE/accreditation harvest',
  };
}

function computeMapCompleteness(map) {
  const checks = {
    sectionA_government:
      map.sectionA.ministryOfEducation?.verified &&
      map.sectionA.ministryOfHigherEducation?.verified &&
      map.sectionA.nationalAccreditationAuthority?.verified &&
      map.sectionA.nationalExaminationAuthorities?.length > 0,
    sectionB_stages: (map.sectionB.educationalStages || []).length > 0,
    sectionB_subjectsByGrade: (map.sectionB.subjectsByGrade || []).length > 0,
    sectionB_subjectsConcrete: (map.sectionB.subjectsByGrade || []).some(
      (row) =>
        (row.subjects || []).length > 0 &&
        !(row.subjects || []).every((subject) =>
          /قيد الحصر|pending/i.test(String(subject)),
        ),
    ),
    sectionB_graduation: Boolean(map.sectionB.graduationRequirements?.summary),
    sectionB_exams: (map.sectionB.nationalExaminations || []).length > 0,
    sectionC_international: (map.sectionC.internationalSystems || []).length >= 7,
    sectionD_heSample: (map.sectionD.allInstitutions || []).length > 0,
    sectionD_heComplete:
      map.sectionD.inventoryCompleteness === 'complete-official-directory',
    sectionD_programCatalogues: (map.sectionD.allInstitutions || []).every(
      (item) => item.programs?.status === 'verified-official-catalogue',
    ),
    sectionE_professional:
      (map.sectionE.providers || []).length > 0 &&
      !(map.sectionE.providers || []).every(
        (item) => item.status === 'directory-pending',
      ),
    sectionF_sources: (map.sectionF.officialSourcesUsed || []).length >= 3,
  };

  const weights = {
    sectionA_government: 12,
    sectionB_stages: 8,
    sectionB_subjectsByGrade: 8,
    sectionB_subjectsConcrete: 14,
    sectionB_graduation: 6,
    sectionB_exams: 6,
    sectionC_international: 8,
    sectionD_heSample: 8,
    sectionD_heComplete: 12,
    sectionD_programCatalogues: 10,
    sectionE_professional: 4,
    sectionF_sources: 4,
  };

  let score = 0;
  for (const [key, passed] of Object.entries(checks)) {
    if (passed) score += weights[key];
  }

  return {
    score: Math.min(100, score),
    threshold: MAP_COMPLETENESS_THRESHOLD,
    mapCompleteEnoughForBooks: false,
    bookGenerationAllowed: BOOK_GENERATION_ALLOWED,
    checks,
    note:
      'Book generation remains disabled until map completeness ≥95% AND owner approval. Sample HE seeds cannot unlock completion.',
  };
}

export function buildEducationMap(code) {
  const dossier = middleEastDossier(code);
  if (!dossier) throw new Error(`UNKNOWN_ME_COUNTRY_${code}`);

  const researchReadiness = computeReadinessScore(dossier);
  const he = classifyHigherEducation(dossier);
  const byGrade = subjectsByGrade(dossier.nationalCurriculum?.stages || []);

  const map = {
    schema: 'success-os.middle-east-education-map.v1',
    phase: PHASE,
    bookGenerationAllowed: BOOK_GENERATION_ALLOWED,
    code: dossier.code,
    country: dossier.country,
    countryAr: dossier.countryAr,
    generatedAt: new Date().toISOString(),
    sectionA: {
      title: 'Government',
      ministryOfEducation: dossier.ministryOfEducation,
      ministryOfHigherEducation: dossier.ministryOfHigherEducation,
      nationalAccreditationAuthority: dossier.accreditationAuthority,
      nationalExaminationAuthorities: [
        dossier.examinationAuthority,
        ...(dossier.curriculumAuthority
          ? [
              {
                name: `${dossier.curriculumAuthority.name} (curriculum authority)`,
                url: dossier.curriculumAuthority.url,
                verified: dossier.curriculumAuthority.verified,
              },
            ]
          : []),
      ].filter(Boolean),
    },
    sectionB: {
      title: 'School Education',
      educationalStages: dossier.nationalCurriculum?.stages || [],
      nationalCurriculum: {
        name: dossier.nationalCurriculum?.name,
        learningObjectivesStatus:
          dossier.nationalCurriculum?.learningObjectivesStatus || null,
        subjectListVerification:
          dossier.nationalCurriculum?.subjectListVerification || null,
        note: dossier.nationalCurriculum?.note || null,
      },
      gradeStructure: byGrade.map((row) => ({
        stage: row.stage,
        grade: row.grade,
      })),
      subjectsByGrade: byGrade,
      graduationRequirements: graduationRequirements(dossier),
      nationalExaminations: nationalExaminations(dossier),
    },
    sectionC: {
      title: 'International Education',
      internationalSystems: mapInternationalSystems(dossier),
      linkedOfficialOrganizations: dossier.internationalCurricula || [],
    },
    sectionD: {
      title: 'Higher Education',
      ...he,
    },
    sectionE: {
      title: 'Professional Education',
      professionalCertifications: dossier.professionalPrograms || [],
      technicalDiplomas: {
        status: 'pending-official-tvets-harvest',
        known: [],
      },
      nationalVocationalPrograms: {
        status: 'pending-official-tvets-harvest',
        known: (dossier.technicalInstitutes || []).map((item) => item.name),
      },
      internationalCertificationProviders: {
        status: 'pending-official-confirmation',
        note: 'List only providers officially licensed/operating per national regulators.',
        known: [],
      },
      providers: dossier.professionalPrograms || [],
    },
    sectionF: {
      title: 'Output metadata',
      officialSourcesUsed: dossier.officialSources || [],
      missingInformation: [
        ...(dossier.missingInformation || []),
        'Complete official HE directories (public/private/community/technical/vocational)',
        'Degree/faculty/department/program catalogues per institution',
        'Graduation requirement matrices by track',
        'Official private-school international curriculum licence register',
        'Professional certification provider register',
      ],
      languagesOfInstruction: dossier.languagesOfInstruction || [],
      accreditationStatus: dossier.accreditationStatus || null,
      researchReadinessScore: researchReadiness.score,
    },
  };

  map.mapCompleteness = computeMapCompleteness(map);
  return map;
}

export function buildCountryEducationProfile(map) {
  const universities = map.sectionD.allInstitutions.filter((item) =>
    /university/i.test(item.type),
  );
  const colleges = map.sectionD.allInstitutions.filter((item) =>
    /college|polytechnic|paaet|utas|applied/i.test(`${item.type} ${item.name}`),
  );
  const technical = map.sectionD.allInstitutions.filter((item) =>
    /technical|vocational|tvtc|institute/i.test(`${item.type} ${item.name}`),
  );

  return {
    schema: 'success-os.country-education-profile.v1',
    phase: PHASE,
    bookGenerationAllowed: BOOK_GENERATION_ALLOWED,
    country: map.country,
    countryAr: map.countryAr,
    code: map.code,
    ministries: {
      education: map.sectionA.ministryOfEducation,
      higherEducation: map.sectionA.ministryOfHigherEducation,
    },
    accreditationAuthorities: map.sectionA.nationalAccreditationAuthority,
    educationalSystems: [
      map.sectionB.nationalCurriculum?.name,
      ...map.sectionC.internationalSystems
        .filter((system) => system.officiallyRecognizedPresence === 'presence-indicated')
        .map((system) => system.name),
    ].filter(Boolean),
    nationalCurriculum: map.sectionB.nationalCurriculum,
    internationalCurricula: map.sectionC.internationalSystems,
    universities,
    colleges,
    technicalInstitutes: technical,
    professionalEducationProviders: map.sectionE.providers,
    degreePrograms: universities.flatMap((item) =>
      Array.isArray(item.programs?.known) ? item.programs.known : [],
    ),
    schoolSubjects: [
      ...new Set(
        (map.sectionB.subjectsByGrade || []).flatMap((row) => row.subjects || []),
      ),
    ],
    universityPrograms: universities.map((item) => ({
      institution: item.name,
      programsStatus: item.programs?.status,
      knownPrograms: item.programs?.known || [],
    })),
    languagesOfInstruction: map.sectionF.languagesOfInstruction,
    accreditationStatus: map.sectionF.accreditationStatus,
    officialSourcesUsed: map.sectionF.officialSourcesUsed,
    missingInformation: map.sectionF.missingInformation,
    readinessScorePercent: map.mapCompleteness.score,
    mapCompleteness: map.mapCompleteness,
    generatedAt: new Date().toISOString(),
  };
}

export function buildMiddleEastMasterIndex(profiles) {
  const list = profiles || MIDDLE_EAST_COUNTRY_CODES.map((code) => {
    const map = buildEducationMap(code);
    return buildCountryEducationProfile(map);
  });

  const average =
    Math.round(
      (list.reduce((sum, profile) => sum + profile.readinessScorePercent, 0) /
        list.length) *
        10,
    ) / 10;

  return {
    schema: 'success-os.middle-east-master-education-index.v1',
    phase: PHASE,
    bookGenerationAllowed: BOOK_GENERATION_ALLOWED,
    mapCompletenessThreshold: MAP_COMPLETENESS_THRESHOLD,
    generatedAt: new Date().toISOString(),
    countries: list.map((profile) => ({
      code: profile.code,
      country: profile.country,
      readinessScorePercent: profile.readinessScorePercent,
      universities: profile.universities.length,
      colleges: profile.colleges.length,
      technicalInstitutes: profile.technicalInstitutes.length,
      schoolSubjects: profile.schoolSubjects.length,
      missingItems: profile.missingInformation.length,
    })),
    index: {
      ministriesByCountry: Object.fromEntries(
        list.map((profile) => [profile.country, profile.ministries]),
      ),
      accreditationByCountry: Object.fromEntries(
        list.map((profile) => [
          profile.country,
          profile.accreditationAuthorities,
        ]),
      ),
      educationalSystemsByCountry: Object.fromEntries(
        list.map((profile) => [profile.country, profile.educationalSystems]),
      ),
      nationalCurriculumByCountry: Object.fromEntries(
        list.map((profile) => [profile.country, profile.nationalCurriculum]),
      ),
      internationalCurriculaByCountry: Object.fromEntries(
        list.map((profile) => [profile.country, profile.internationalCurricula]),
      ),
      universitiesByCountry: Object.fromEntries(
        list.map((profile) => [profile.country, profile.universities]),
      ),
      collegesByCountry: Object.fromEntries(
        list.map((profile) => [profile.country, profile.colleges]),
      ),
      technicalInstitutesByCountry: Object.fromEntries(
        list.map((profile) => [profile.country, profile.technicalInstitutes]),
      ),
      professionalProvidersByCountry: Object.fromEntries(
        list.map((profile) => [
          profile.country,
          profile.professionalEducationProviders,
        ]),
      ),
      schoolSubjectsByCountry: Object.fromEntries(
        list.map((profile) => [profile.country, profile.schoolSubjects]),
      ),
      universityProgramsByCountry: Object.fromEntries(
        list.map((profile) => [profile.country, profile.universityPrograms]),
      ),
    },
    readiness: {
      averageMapCompletenessPercent: average,
      countriesAtOrAbove95: list.filter(
        (profile) => profile.readinessScorePercent >= 95,
      ).length,
      digitalBooksAllowed: false,
      reason:
        average >= MAP_COMPLETENESS_THRESHOLD
          ? 'Map completeness threshold met mathematically, but digital books still require explicit owner approval.'
          : `Middle East map completeness ${average}% is below ${MAP_COMPLETENESS_THRESHOLD}%. Digital books remain blocked.`,
    },
    missingInformationSummary: list.flatMap((profile) =>
      profile.missingInformation.map((item) => `${profile.country}: ${item}`),
    ),
    totals: {
      countries: list.length,
      universities: list.reduce(
        (sum, profile) => sum + profile.universities.length,
        0,
      ),
      colleges: list.reduce((sum, profile) => sum + profile.colleges.length, 0),
      technicalInstitutes: list.reduce(
        (sum, profile) => sum + profile.technicalInstitutes.length,
        0,
      ),
      averageMapCompletenessPercent: average,
    },
  };
}

export function persistMiddleEastEducationMaps() {
  const root = ensureDirs();
  const maps = [];
  const profiles = [];

  for (const code of MIDDLE_EAST_COUNTRY_CODES) {
    const map = buildEducationMap(code);
    const profile = buildCountryEducationProfile(map);
    maps.push(map);
    profiles.push(profile);

    const dbFile = path.join(root, 'database', `${code}-education-map.json`);
    fs.writeFileSync(dbFile, JSON.stringify(map, null, 2), 'utf8');

    const profileFile = path.join(
      root,
      'country-profiles',
      `${code}-${profile.country.replace(/\s+/g, '-')}-profile.json`,
    );
    fs.writeFileSync(profileFile, JSON.stringify(profile, null, 2), 'utf8');
    profile.profilePath = profileFile;
    map.databasePath = dbFile;
  }

  const master = buildMiddleEastMasterIndex(profiles);
  const masterPath = path.join(
    root,
    'master',
    'MIDDLE-EAST-MASTER-EDUCATION-INDEX.json',
  );
  fs.writeFileSync(masterPath, JSON.stringify(master, null, 2), 'utf8');

  return {
    root,
    maps,
    profiles,
    master: { ...master, reportPath: masterPath },
    masterPath,
  };
}

export function middleEastMappingStatus() {
  return {
    engine: 'SUCCESS OS Middle East Education Mapping Engine',
    phase: PHASE,
    bookGenerationAllowed: BOOK_GENERATION_ALLOWED,
    mapCompletenessThreshold: MAP_COMPLETENESS_THRESHOLD,
    countries: MIDDLE_EAST_COUNTRY_CODES,
    storageRoot: mapRoot(),
  };
}
