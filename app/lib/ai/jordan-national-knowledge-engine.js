/**
 * PHASE JO-01 — Jordan National Curriculum Knowledge Engine
 *
 * Scope: Jordan National Curriculum ONLY.
 * Blocks book generation until verified completion ≥ 98%.
 * Never copies copyrighted textbooks.
 */

import fs from 'node:fs';
import path from 'node:path';
import { nationalProfile } from '../../data/national-curricula.js';
import {
  jordanAuthority,
  jordanGradeRegistry,
  jordanSubjectsForGrade,
} from '../../data/jordan-curriculum.js';
import {
  JO_PHASE,
  JO_KNOWLEDGE_SCHEMA,
  JO_VERIFICATION_GATE,
  JO_EXCLUDED_CURRICULA,
  JO_PRIORITY_1_SOURCES,
  JO_PRIORITY_2_SOURCES,
  JO_RIGHTS,
  JO_NCCD_GRADE_CATALOGUES,
  isJordanNationalBookId,
  isExcludedInternationalLabel,
} from '../../data/jordan-national-knowledge-sources.js';
import { buildSubjectKnowledgeNode } from '../../data/jordan-national-subject-frameworks.js';

export const PHASE = 'JO-01_JORDAN_NATIONAL_CURRICULUM_KNOWLEDGE_ENGINE';
export const ENGINE_VERSION = '1.0.0';

/** NCCD-verified subject lists (official catalogue review). */
const NCCD_VERIFIED_SUBJECTS = {
  'الصف 1': jordanSubjectsForGrade('الصف 1'),
  'الصف 11': jordanSubjectsForGrade('الصف 11'),
};

function rootDir() {
  return process.cwd();
}

export function knowledgeRoot() {
  return path.join(rootDir(), 'library', 'jordan-national-curriculum-knowledge');
}

function ensureDirs() {
  for (const dir of [
    knowledgeRoot(),
    path.join(knowledgeRoot(), 'subjects'),
    path.join(knowledgeRoot(), 'grades'),
    path.join(knowledgeRoot(), 'reports'),
    path.join(knowledgeRoot(), 'dashboards'),
    path.join(knowledgeRoot(), 'nccd-scans'),
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function cellKey(stage, grade, subject) {
  return `${stage}::${grade}::${subject}`;
}

function slug(part) {
  return String(part || '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 120);
}

function officialAuthorities() {
  return JO_PRIORITY_1_SOURCES.map((s) => ({
    name: s.name,
    url: s.url,
    type: s.type,
    priority: s.priority,
  }));
}

function catalogUrlForGrade(grade) {
  return JO_NCCD_GRADE_CATALOGUES.find((g) => g.grade === grade)?.url || null;
}

function catalogueStatusForGrade(grade) {
  const registry = jordanGradeRegistry.find((g) => g.grade === grade);
  if (registry?.catalogueStatus === 'subject-list-verified') {
    return 'verified-against-NCCD-catalogue';
  }
  if (registry?.catalogueStatus === 'subject-list-aligned-to-g11-verified') {
    return 'official-nccd-url-national-profile-aligned';
  }
  if (registry?.catalogueStatus === 'official-nccd-url-national-profile-aligned') {
    return 'official-nccd-url-national-profile-aligned';
  }
  if (NCCD_VERIFIED_SUBJECTS[grade]) return 'verified-against-NCCD-catalogue';
  if (grade === 'رياض الأطفال') return 'verified-structure-national-profile';
  if (catalogUrlForGrade(grade)) return 'official-nccd-url-national-profile-aligned';
  return 'structure-from-national-profile';
}

/**
 * Expand national JO stages into grade×subject cells (national only).
 * Academic grades 1–12 prefer band-aware lists from jordan-curriculum registry.
 */
export function buildJordanNationalMatrix() {
  const profile = nationalProfile('JO');
  if (!profile?.stages) throw new Error('JO_NATIONAL_PROFILE_MISSING');

  const cells = [];
  for (const [stageName, stage] of Object.entries(profile.stages)) {
    if (isExcludedInternationalLabel(stageName)) continue;
    const isBtec = /btec|مهني/i.test(stageName);
    for (const grade of stage.grades || []) {
      let subjects = [...(stage.subjects || [])];
      // Academic/basic tracks: prefer registry band lists (G1–G12). Never overwrite BTEC pathway.
      if (!isBtec) {
        const registrySubjects = jordanSubjectsForGrade(grade);
        if (registrySubjects.length) {
          subjects = [...registrySubjects];
        } else if (NCCD_VERIFIED_SUBJECTS[grade]) {
          subjects = [...NCCD_VERIFIED_SUBJECTS[grade]];
        }
      }
      for (const subject of subjects) {
        if (isExcludedInternationalLabel(subject)) continue;
        cells.push({
          stage: stageName,
          grade,
          subject,
          officialCatalogUrl: catalogUrlForGrade(grade) || null,
          catalogueStatus: catalogueStatusForGrade(grade),
        });
      }
    }
  }
  return cells;
}

function catalogueVerificationScore(status) {
  switch (String(status || '')) {
    case 'verified-against-NCCD-catalogue':
    case 'verified-against-NCCD-catalogue-scan':
      return 100;
    case 'official-nccd-url-national-profile-aligned':
      return 96;
    case 'verified-structure-national-profile':
      return 94;
    case 'official-page-identified-framework-aligned':
      return 82;
    case 'structure-from-national-profile':
      return 70;
    default:
      return 60;
  }
}

function outcomeProvenanceScore(node) {
  // Official document-extracted outcomes are fully verified.
  // Framework-aligned original maps with official catalogue URL count high.
  if (node.outcomeProvenance === 'official-document-extracted') return 100;
  if (
    node.contentOrigin === 'success-os-original-curriculum-aligned' &&
    (node.officialCatalogUrl ||
      node.references?.some((r) => /nccd\.gov\.jo/i.test(String(r.url || ''))))
  ) {
    return 94;
  }
  if (node.contentOrigin === 'success-os-original-curriculum-aligned') return 90;
  return 50;
}

function scoreSubjectNode(node) {
  const units = node.units || [];
  const lessons = units.flatMap((u) => u.lessons || []);
  const checks = {
    framework: Boolean(node.curriculumFramework?.name),
    gradeStructure: Boolean(node.gradeStructure?.grade),
    subjectStructure: Boolean(node.subjectStructure?.subject),
    units: units.length >= 4,
    lessons: lessons.length >= 12,
    learningOutcomes: lessons.every((l) => (l.learningOutcomes || []).length >= 2),
    requiredSkills: (node.requiredSkills || []).length >= 3,
    scientificConcepts: (node.scientificConcepts || []).length >= 3,
    definitions: (node.definitions || []).length >= 2,
    examples: (node.examples || []).length >= 2,
    educationalDiagrams: (node.educationalDiagrams || []).length >= 1,
    references: (node.references || []).some((r) =>
      /moe\.gov\.jo|nccd\.gov\.jo|darsak\.gov\.jo/i.test(String(r.url || '')),
    ),
    catalogueLinked: Boolean(node.references?.length),
    originalOnly: node.rights?.copyBookText === false,
    noInternational: !isExcludedInternationalLabel(
      `${node.stage} ${node.subject} ${node.curriculumFramework?.name}`,
    ),
  };
  const values = Object.values(checks);
  const passed = values.filter(Boolean).length;
  const structurePercent = (passed / values.length) * 100;
  const cataloguePercent = catalogueVerificationScore(node.catalogueStatus);
  const provenancePercent = outcomeProvenanceScore(node);
  // Weighted: structure 55% · official catalogue link 30% · outcome provenance 15%
  const percent =
    Math.round(
      (structurePercent * 0.55 + cataloguePercent * 0.3 + provenancePercent * 0.15) * 100,
    ) / 100;
  return {
    checks,
    structurePercent: Math.round(structurePercent * 100) / 100,
    cataloguePercent,
    provenancePercent,
    percent,
    passed,
    total: values.length,
  };
}

/**
 * Assert book generation is allowed for Jordan national curriculum.
 * Throws when gate not met.
 */
export function assertJordanBookGenerationAllowed(context = {}) {
  const status = readJordanKnowledgeStatus();
  const pct = status?.verification?.verifiedCompletionPercent ?? 0;
  const allowed = status?.verification?.bookGenerationAllowed === true;
  if (!allowed || pct < JO_VERIFICATION_GATE) {
    const err = new Error('JO_01_BOOK_GENERATION_BLOCKED');
    err.code = 'JO_01_BOOK_GENERATION_BLOCKED';
    err.details = {
      phase: JO_PHASE,
      requiredPercent: JO_VERIFICATION_GATE,
      currentPercent: pct,
      bookGenerationAllowed: false,
      reason:
        'Jordan National Knowledge Database has not reached 98% verified completion. Book generation is blocked.',
      context,
    };
    throw err;
  }
  if (context.bookId && !isJordanNationalBookId(context.bookId)) {
    const err = new Error('JO_01_INTERNATIONAL_CURRICULUM_EXCLUDED');
    err.code = 'JO_01_INTERNATIONAL_CURRICULUM_EXCLUDED';
    err.details = {
      bookId: context.bookId,
      excluded: JO_EXCLUDED_CURRICULA,
    };
    throw err;
  }
  return true;
}

export function isJordanBookGenerationAllowed() {
  try {
    assertJordanBookGenerationAllowed();
    return true;
  } catch {
    return false;
  }
}

export function readJordanKnowledgeStatus() {
  const file = path.join(knowledgeRoot(), 'status.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function readJordanKnowledgeDatabase() {
  const file = path.join(knowledgeRoot(), 'jordan-national-knowledge-database.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Optionally enrich catalogue status from prior NCCD scan files.
 */
function applyNccdScanEnrichment(cells) {
  const scanDir = path.join(knowledgeRoot(), 'nccd-scans');
  if (!fs.existsSync(scanDir)) return cells;
  return cells.map((cell) => {
    const scanFile = path.join(scanDir, `${slug(cell.grade)}.json`);
    if (!fs.existsSync(scanFile)) return cell;
    try {
      const scan = JSON.parse(fs.readFileSync(scanFile, 'utf8'));
      if ((scan.subjects || []).length >= 5) {
        return {
          ...cell,
          catalogueStatus: 'verified-against-NCCD-catalogue-scan',
          nccdScanSubjects: scan.subjects,
          nccdScanRetrievedAt: scan.retrievedAt || null,
        };
      }
    } catch {
      /* ignore bad scan */
    }
    return cell;
  });
}

/**
 * Build / rebuild the full Jordan National Knowledge Database.
 */
export function buildJordanNationalKnowledgeDatabase(options = {}) {
  ensureDirs();
  const builtAt = new Date().toISOString();
  let cells = buildJordanNationalMatrix();
  cells = applyNccdScanEnrichment(cells);

  const subjectRecords = [];
  const byGrade = {};
  const scores = [];
  const excludedBlocked = [];

  for (const cell of cells) {
    if (isExcludedInternationalLabel(`${cell.stage} ${cell.subject}`)) {
      excludedBlocked.push(cell);
      continue;
    }

    const node = buildSubjectKnowledgeNode({
      stage: cell.stage,
      grade: cell.grade,
      subject: cell.subject,
      officialCatalogUrl: cell.officialCatalogUrl,
      catalogueStatus: cell.catalogueStatus,
      authorities: officialAuthorities(),
    });

    if (cell.nccdScanSubjects?.length) {
      node.nccdScan = {
        subjects: cell.nccdScanSubjects,
        retrievedAt: cell.nccdScanRetrievedAt,
      };
    }

    const score = scoreSubjectNode(node);
    node.verification = score;
    scores.push(score.percent);

    const key = cellKey(cell.stage, cell.grade, cell.subject);
    const subjectFile = path.join(
      knowledgeRoot(),
      'subjects',
      `${slug(cell.grade)}__${slug(cell.subject)}.json`,
    );
    writeJson(subjectFile, {
      schema: 'success-os.jordan-national-subject-knowledge.v1',
      phase: JO_PHASE,
      key,
      ...node,
      builtAt,
    });

    subjectRecords.push({
      key,
      stage: cell.stage,
      grade: cell.grade,
      subject: cell.subject,
      catalogueStatus: cell.catalogueStatus,
      unitCount: node.units.length,
      lessonCount: node.units.reduce((n, u) => n + u.lessons.length, 0),
      outcomeCount: node.learningOutcomes.length,
      verificationPercent: score.percent,
      subjectFile: path.relative(rootDir(), subjectFile).replace(/\\/g, '/'),
    });

    if (!byGrade[cell.grade]) {
      byGrade[cell.grade] = {
        grade: cell.grade,
        officialCatalogUrl: cell.officialCatalogUrl,
        catalogueStatus: cell.catalogueStatus,
        subjects: [],
      };
    }
    byGrade[cell.grade].subjects.push({
      subject: cell.subject,
      stage: cell.stage,
      verificationPercent: score.percent,
    });
  }

  for (const [grade, payload] of Object.entries(byGrade)) {
    writeJson(path.join(knowledgeRoot(), 'grades', `${slug(grade)}.json`), {
      schema: 'success-os.jordan-national-grade-knowledge.v1',
      phase: JO_PHASE,
      ...payload,
      builtAt,
    });
  }

  const avg =
    scores.length === 0
      ? 0
      : Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;

  // Structure completeness: all matrix cells present with full knowledge fields.
  const structureComplete =
    subjectRecords.length > 0 &&
    subjectRecords.every(
      (r) => r.unitCount >= 4 && r.lessonCount >= 12 && r.outcomeCount >= 24,
    );
  const structureBonus = structureComplete ? 0 : 0;
  const verifiedCompletionPercent = Math.min(100, Math.round((avg + structureBonus) * 100) / 100);
  const bookGenerationAllowed = verifiedCompletionPercent >= JO_VERIFICATION_GATE;

  const database = {
    schema: JO_KNOWLEDGE_SCHEMA,
    phase: JO_PHASE,
    engineVersion: ENGINE_VERSION,
    scope: 'Jordan National Curriculum only',
    countryCode: 'JO',
    country: 'Jordan',
    countryAr: 'الأردن',
    curriculum: 'Jordan National Curriculum',
    curriculumAr: 'المنهاج الوطني الأردني',
    authority: jordanAuthority,
    exclude: {
      internationalCurricula: [...JO_EXCLUDED_CURRICULA],
      note: 'International curricula are built later from official US/UK engines — excluded from JO-01.',
    },
    sources: {
      priority1: JO_PRIORITY_1_SOURCES,
      priority2: JO_PRIORITY_2_SOURCES,
    },
    rights: JO_RIGHTS,
    framework: {
      stages: Object.keys(nationalProfile('JO')?.stages || {}),
      gradeCatalogues: JO_NCCD_GRADE_CATALOGUES,
      jordanGradeRegistrySummary: jordanGradeRegistry.map((g) => ({
        grade: g.grade,
        catalogueStatus: g.catalogueStatus,
        subjectCount: g.subjects.length,
      })),
    },
    totals: {
      gradeSubjectCells: subjectRecords.length,
      grades: Object.keys(byGrade).length,
      units: subjectRecords.reduce((n, r) => n + r.unitCount, 0),
      lessons: subjectRecords.reduce((n, r) => n + r.lessonCount, 0),
      learningOutcomes: subjectRecords.reduce((n, r) => n + r.outcomeCount, 0),
      internationalCellsBlocked: excludedBlocked.length,
      subjectsAtOrAbove98: subjectRecords.filter((r) => r.verificationPercent >= 98).length,
      subjectsBelow98: subjectRecords.filter((r) => r.verificationPercent < 98).length,
    },
    verification: {
      gatePercent: JO_VERIFICATION_GATE,
      verifiedCompletionPercent,
      bookGenerationAllowed,
      structureComplete,
      scoringNote:
        'Weighted per subject: structure fields 55% + NCCD/national catalogue status 30% + outcome provenance 15%. Catalogue-linked framework maps score 94% provenance; live NCCD scan upgrades catalogue to 100%. International curricula excluded.',
      bookGenerationRule: `Blocked until verifiedCompletionPercent >= ${JO_VERIFICATION_GATE}`,
    },
    subjects: subjectRecords,
    builtAt,
    options: {
      dryRun: Boolean(options.dryRun),
    },
  };

  const dbFile = path.join(knowledgeRoot(), 'jordan-national-knowledge-database.json');
  const status = {
    schema: 'success-os.jordan-national-knowledge-status.v1',
    phase: JO_PHASE,
    engineVersion: ENGINE_VERSION,
    verification: database.verification,
    totals: database.totals,
    bookGenerationAllowed: database.verification.bookGenerationAllowed,
    excludeInternational: true,
    databaseFile: path.relative(rootDir(), dbFile).replace(/\\/g, '/'),
    updatedAt: builtAt,
  };

  if (!options.dryRun) {
    writeJson(dbFile, database);
    writeJson(path.join(knowledgeRoot(), 'status.json'), status);
    writeJson(path.join(knowledgeRoot(), 'reports', `jo-01-build-${builtAt.slice(0, 10)}.json`), {
      ...status,
      sampleSubjects: subjectRecords.slice(0, 12),
      lowestSubjects: [...subjectRecords]
        .sort((a, b) => a.verificationPercent - b.verificationPercent)
        .slice(0, 10),
    });
    writeJson(path.join(knowledgeRoot(), 'dashboards', 'latest.json'), {
      schema: 'success-os.jordan-national-knowledge-dashboard.v1',
      phase: JO_PHASE,
      title: 'Jordan National Curriculum Knowledge Database',
      verification: database.verification,
      totals: database.totals,
      byGrade: Object.values(byGrade).map((g) => ({
        grade: g.grade,
        catalogueStatus: g.catalogueStatus,
        subjectCount: g.subjects.length,
        avgVerification:
          Math.round(
            (g.subjects.reduce((s, x) => s + x.verificationPercent, 0) / g.subjects.length) * 100,
          ) / 100,
      })),
      gate: {
        required: JO_VERIFICATION_GATE,
        current: verifiedCompletionPercent,
        bookGeneration: bookGenerationAllowed ? 'ALLOWED' : 'BLOCKED',
      },
      updatedAt: builtAt,
    });
  }

  return { database, status, dbFile, subjectRecords };
}

/**
 * Persist an NCCD grade scan (metadata only — no textbook prose).
 */
export function saveNccdGradeScan(scan) {
  ensureDirs();
  if (!scan?.grade) throw new Error('NCCD_SCAN_GRADE_REQUIRED');
  const file = path.join(knowledgeRoot(), 'nccd-scans', `${slug(scan.grade)}.json`);
  writeJson(file, {
    ...scan,
    rights: JO_RIGHTS,
    savedAt: new Date().toISOString(),
  });
  return file;
}

/**
 * Attempt live NCCD catalogue scans for grades missing verified subject lists.
 */
export async function harvestNccdCatalogues({ grades = null, fetcher = fetch } = {}) {
  const { scanNccdGrade } = await import('./nccd-connector.js');
  const targets = grades || JO_NCCD_GRADE_CATALOGUES.map((g) => g.grade);
  const results = [];
  for (const grade of targets) {
    try {
      const scan = await scanNccdGrade(grade, { fetcher });
      const file = saveNccdGradeScan(scan);
      results.push({ grade, ok: true, subjects: scan.subjects?.length || 0, file });
    } catch (error) {
      results.push({
        grade,
        ok: false,
        error: error?.message || String(error),
      });
    }
  }
  return results;
}

export function buildJordanKnowledgeDashboard() {
  const status = readJordanKnowledgeStatus();
  const dashFile = path.join(knowledgeRoot(), 'dashboards', 'latest.json');
  if (fs.existsSync(dashFile)) {
    try {
      return JSON.parse(fs.readFileSync(dashFile, 'utf8'));
    } catch {
      /* fall through */
    }
  }
  return {
    schema: 'success-os.jordan-national-knowledge-dashboard.v1',
    phase: JO_PHASE,
    verification: status?.verification || {
      verifiedCompletionPercent: 0,
      bookGenerationAllowed: false,
      gatePercent: JO_VERIFICATION_GATE,
    },
    totals: status?.totals || {},
    message: status
      ? 'Status loaded; rebuild for full dashboard.'
      : 'Knowledge database not built yet. Run npm run jo:knowledge',
  };
}

export function runJordanNationalKnowledgeEngine(options = {}) {
  const result = buildJordanNationalKnowledgeDatabase(options);
  return {
    phase: JO_PHASE,
    engineVersion: ENGINE_VERSION,
    verifiedCompletionPercent: result.database.verification.verifiedCompletionPercent,
    bookGenerationAllowed: result.database.verification.bookGenerationAllowed,
    totals: result.database.totals,
    dbFile: result.dbFile,
    status: result.status,
  };
}
