/**
 * PHASE JO-01.4 — Jordan Grade 1 Educational Knowledge Graph
 *
 * Prerequisite: JO-01.2 Grade 1 Learning Ecosystem must be complete.
 * Builds the Success OS Educational Knowledge Graph for الصف 1.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createEducationalKnowledgeGraph } from './educational-knowledge-graph-engine.js';
import {
  G1_GRADE,
  G1_OFFICIAL_CATALOG_URL,
  G1_OFFICIAL_SUBJECTS,
} from '../../data/jordan-grade1-learning-ecosystem.js';
import { buildGrade1EcosystemDashboard as liveG1Dashboard } from './jordan-grade1-learning-ecosystem-engine.js';
import { listLibraryBooks } from './library-store.js';
import { isJordanNationalBookId } from '../../data/jordan-national-knowledge-sources.js';
import { subjectCodeFromLabel } from '../../data/national-education-registry.js';
import {
  KG_VERSION,
  KG_NODE_KINDS,
  KG_EDGE_TYPES,
  KG_AI_SERVICES,
} from '../../data/educational-knowledge-graph.js';

export const PHASE = 'JO-01.4_EDUCATIONAL_KNOWLEDGE_GRAPH';
export const ENGINE_VERSION = '1.4.0';

function list(v) {
  return Array.isArray(v) ? v : [];
}

function _text(v) {
  return String(v || '').trim();
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function safeName(s) {
  return String(s || '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .slice(0, 120);
}

function fileKey(s) {
  return String(s || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[<>:"/\\|?*]/g, '_');
}

function ecosystemRoot() {
  return path.join(process.cwd(), 'library', 'jordan-grade1-learning-ecosystem');
}

function graphRoot() {
  return path.join(process.cwd(), 'library', 'educational-knowledge-graph');
}

function assertPrerequisite() {
  const dash = liveG1Dashboard();
  if (!dash.grade1Complete || dash.completedLessons < dash.totalLessons) {
    const err = new Error('PREREQUISITE_FAILED_G1_ECOSYSTEM_INCOMPLETE');
    err.details = {
      grade1Complete: dash.grade1Complete,
      completedLessons: dash.completedLessons,
      totalLessons: dash.totalLessons,
      required: 'JO-01.2 Grade 1 Learning Ecosystem must be fully completed.',
    };
    throw err;
  }
  return dash;
}

function loadEcosystemPackage(subject, lessonId) {
  return readJson(
    path.join(ecosystemRoot(), 'lessons', safeName(subject), `${safeName(lessonId)}.json`),
  );
}

function knowledgePath(subject) {
  return path.join(
    process.cwd(),
    'library',
    'jordan-national-curriculum-knowledge',
    'subjects',
    `${fileKey(G1_GRADE)}__${fileKey(subject)}.json`,
  );
}

function buildGrade1Payload() {
  const books = listLibraryBooks().filter(
    (b) => isJordanNationalBookId(b.id) && b.identity?.grade === G1_GRADE,
  );

  const gradeId = 'kg:jor:grade:G01';
  const subjects = [];

  for (const subjectLabel of G1_OFFICIAL_SUBJECTS) {
    const sCode = subjectCodeFromLabel(subjectLabel);
    const subjectId = `kg:jor:subject:G01:${sCode}`;
    const book = books.find((b) => b.identity?.subject === subjectLabel && b.jo02?.producedAt)
      || books.find((b) => b.identity?.subject === subjectLabel);
    const knowledge = readJson(knowledgePath(subjectLabel));

    const bookId = book?.id
      ? `kg:jor:book:${sCode}`
      : `kg:jor:book:knowledge:${sCode}`;

    const unitsSrc = book?.jo02?.producedAt
      ? list(book.units)
      : list(knowledge?.units).map((u) => ({
          id: u.unitId,
          title: u.titleAr || u.title,
          lessons: list(u.lessons).map((l) => ({
            id: l.lessonId,
            title: l.titleAr || l.title,
            learningOutcomes: l.learningOutcomes,
            keyConcepts: l.scientificConcepts,
            curriculumAlignment: { requiredSkills: l.requiredSkills },
            vocabulary: l.definitions,
          })),
        }));

    const units = unitsSrc.map((unit, ui) => {
      const uCode = `U${String(ui + 1).padStart(2, '0')}`;
      const unitId = `kg:jor:unit:G01:${sCode}:${uCode}`;
      const lessons = list(unit.lessons).map((lesson, li) => {
        const lCode = `L${String(li + 1).padStart(2, '0')}`;
        const lessonId = `kg:jor:lesson:G01:${sCode}:${uCode}:${lCode}`;
        const eco = loadEcosystemPackage(subjectLabel, lesson.id || lesson.lessonId);
        const concepts = list(
          lesson.keyConcepts ||
            lesson.scientificConcepts ||
            eco?.resources?.fullLesson?.sections?.coreConcepts,
        )
          .map((c) => (typeof c === 'string' ? c : c.label || c.term))
          .filter(Boolean);

        const questions = list(eco?.resources?.questionBank?.questions)
          .slice(0, 40)
          .map((q, qi) => ({
            ...q,
            id: `${lessonId}:q:${q.id || qi + 1}`,
          }));
        const activities = [
          ...list(eco?.resources?.practiceActivities),
          ...list(eco?.resources?.classActivities),
          ...list(eco?.resources?.educationalGames),
        ];

        return {
          id: lessonId,
          label: lesson.title || lesson.titleAr || eco?.title,
          sequence: li + 1,
          ecosystemPath: eco ? true : false,
          concepts,
          subtopics: concepts.slice(0, 3),
          learningOutcomes:
            list(lesson.learningOutcomes || lesson.learningObjectives) ||
            list(eco?.resources?.studentExperience?.learningObjectives),
          skills:
            list(lesson.curriculumAlignment?.requiredSkills) ||
            list(eco?.resources?.studentExperience?.requiredSkills),
          vocabulary: list(
            lesson.vocabulary ||
              eco?.resources?.vocabularyCards ||
              lesson.definitions,
          ),
          formulas: list(eco?.resources?.fullLesson ? lesson.formulasVerified : lesson.formulas),
          rules: list(lesson.rulesLawsFormulas),
          experiments: list(lesson.laboratoryActivities || lesson.experiments),
          activities,
          assessments: [
            eco?.resources?.lessonQuiz,
            eco?.resources?.unitQuiz,
            eco?.resources?.adaptiveAiPracticeExam,
          ].filter(Boolean),
          references: list(lesson.references || eco?.resources?.registryLinks ? [{
            title: 'NCCD Grade 1 Catalog',
            url: G1_OFFICIAL_CATALOG_URL,
          }] : []),
          teacherNote: eco?.resources?.aiTeacherNotes?.notes?.join(' ') || null,
          aiVideo: eco?.resources?.aiVideoLessonScript || null,
          misconceptions: list(
            eco?.resources?.misconceptions || lesson.commonMisconceptions,
          ),
          questions,
        };
      });

      return {
        id: unitId,
        label: unit.title || unit.titleAr || `Unit ${ui + 1}`,
        lessons,
      };
    });

    subjects.push({
      id: subjectId,
      label: subjectLabel,
      books: [
        {
          id: bookId,
          label: book?.cover?.title || `Success OS — ${subjectLabel} — الصف 1`,
          legacyBookId: book?.id || null,
          units,
        },
      ],
    });
  }

  return {
    countryId: 'kg:jor:country',
    systemId: 'kg:jor:system:national',
    educationalSystem: 'Jordan National Curriculum',
    officialSource: G1_OFFICIAL_CATALOG_URL,
    language: 'ar',
    meta: {
      grade: G1_GRADE,
      phase: PHASE,
      prerequisite: 'JO-01.2',
    },
    grades: [
      {
        id: gradeId,
        label: G1_GRADE,
        code: 'G01',
        semesters: [
          { id: 'kg:jor:semester:G01:S1', label: 'الفصل الأول' },
          { id: 'kg:jor:semester:G01:S2', label: 'الفصل الثاني' },
        ],
        subjects,
      },
    ],
  };
}

let engineSingleton = null;

export function getJordanGrade1KnowledgeGraph() {
  if (engineSingleton) return engineSingleton;
  engineSingleton = createEducationalKnowledgeGraph({
    countryCode: 'JOR',
    country: 'Jordan',
    rootDir: graphRoot(),
    buildGraphPayload: () => buildGrade1Payload(),
  });
  return engineSingleton;
}

export function buildJordanGrade1KnowledgeGraph(options = {}) {
  assertPrerequisite();
  return getJordanGrade1KnowledgeGraph().runBuild(options);
}

export function buildJordanKnowledgeGraphDashboard() {
  return getJordanGrade1KnowledgeGraph().buildDashboard();
}

export function searchJordanKnowledgeGraph(query, options = {}) {
  return getJordanGrade1KnowledgeGraph().search(query, options);
}

export function queryJordanKnowledgeGraph(action, payload = {}) {
  const eng = getJordanGrade1KnowledgeGraph();
  switch (action) {
    case 'prerequisites':
      return eng.prerequisitesForLesson(payload.lessonId);
    case 'dependents':
      return eng.futureDependents(payload.lessonId);
    case 'questionsForConcept':
      return eng.questionsForConcept(payload.conceptId || payload.concept);
    case 'vocabularyForUnit':
      return eng.vocabularyForUnit(payload.unitId);
    case 'lessonsForSkill':
      return eng.lessonsForSkill(payload.skillId || payload.skill);
    case 'experiments':
      return eng.experimentsForTopic(payload.topicId || payload.lessonId);
    case 'misconceptions':
      return eng.misconceptionsForLesson(payload.lessonId);
    case 'student':
      return eng.analyzeStudentState(payload.masteredConceptIds || [], payload.currentLessonId);
    case 'search':
      return eng.search(payload.query || payload.q || '', payload);
    case 'recommendNext':
      return eng.recommendWithGraph('recommendNext', () =>
        eng.analyzeStudentState(payload.masteredConceptIds || [], payload.currentLessonId),
      );
    default:
      return { ok: false, error: 'UNKNOWN_QUERY' };
  }
}

export function runJordanGrade1KnowledgeGraph(options = {}) {
  if (options.dashboardOnly) {
    return { dashboard: buildJordanKnowledgeGraphDashboard() };
  }
  if (options.query) {
    return queryJordanKnowledgeGraph(options.query, options);
  }
  const result = buildJordanGrade1KnowledgeGraph(options);
  return {
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    kgVersion: KG_VERSION,
    nodeKinds: KG_NODE_KINDS.length,
    edgeTypes: KG_EDGE_TYPES.length,
    aiServices: KG_AI_SERVICES,
    totals: result.manifest.totals,
    stats: result.stats,
    dashboard: result.dashboard,
    rule: result.manifest.rule,
  };
}

// Note: prerequisite enforced via liveG1Dashboard() in assertPrerequisite().
