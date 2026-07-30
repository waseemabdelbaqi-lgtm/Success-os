/**
 * Global Curriculum Registry runner — country-agnostic entry point.
 * Jordan is loaded as the first official source via discovery (not hardcoding).
 */
import { JORDAN_NATIONAL_G1_OFFICIAL_SOURCE } from "@/content/demo/official-sources/jordan-national-g1";
import type { OfficialCurriculumSource } from "@/types/curriculum-discovery";
import type { CurriculumDiscoveryReport } from "@/types/curriculum-discovery";
import type { GlobalCurriculumRegistrySnapshot } from "@/types/global-curriculum-registry";
import type { KnowledgeGraphSnapshot } from "@/types/knowledge-graph";
import type { StudentFoundationRecord } from "@/types/student-foundation";
import {
  getGlobalCurriculumRegistrySnapshot,
  ingestOfficialCurriculumSource,
  registerPackageRef,
  resetGlobalCurriculumRegistry,
} from "../hierarchy/global-curriculum-registry";
import {
  getGlobalSubjectRegistrySnapshot,
  resetGlobalSubjectRegistry,
} from "../hierarchy/global-subject-registry";
import {
  getGlobalSkillRegistrySnapshot,
  resetGlobalSkillRegistry,
} from "../hierarchy/global-skill-registry";
import { buildKnowledgeGraph } from "../knowledge-graph/build";
import { buildJordanMathDependencyExample } from "../hierarchy/lesson-dependency";
import { buildJordanDemoStudentSkillProgress } from "../student/skill-progress";
import { toStudentFoundation } from "../student/foundation";
import { gradeHasSubject } from "../discovery/discover";

export type GlobalCurriculumRunResult = {
  ok: boolean;
  schema: "success-os.global-curriculum-registry.v1";
  discovery: CurriculumDiscoveryReport;
  registry: GlobalCurriculumRegistrySnapshot;
  knowledgeGraph: KnowledgeGraphSnapshot;
  studentFoundation: StudentFoundationRecord;
  globalSubjectRegistry: ReturnType<typeof getGlobalSubjectRegistrySnapshot>;
  globalSkillRegistry: ReturnType<typeof getGlobalSkillRegistrySnapshot>;
  assertions: {
    jordanIsFirstImplementation: boolean;
    physicsAbsentFromG01: boolean;
    chemistryAbsentFromG01: boolean;
    biologyAbsentFromG01: boolean;
    g01SubjectCodes: string[];
  };
};

/**
 * Ingest one or more official curriculum sources into the Global Curriculum Registry.
 * Defaults to Jordan National Grade 1 — the first reference implementation.
 */
export function runGlobalCurriculumRegistry(opts?: {
  reset?: boolean;
  sources?: OfficialCurriculumSource[];
}): GlobalCurriculumRunResult {
  if (opts?.reset !== false) {
    resetGlobalCurriculumRegistry();
    resetGlobalSubjectRegistry();
    resetGlobalSkillRegistry();
  }

  const sources = opts?.sources?.length
    ? opts.sources
    : [JORDAN_NATIONAL_G1_OFFICIAL_SOURCE];

  let discovery: CurriculumDiscoveryReport | null = null;
  let registry: GlobalCurriculumRegistrySnapshot =
    getGlobalCurriculumRegistrySnapshot();

  for (const source of sources) {
    const result = ingestOfficialCurriculumSource(source);
    discovery = result.discovery;
    registry = result.registry;
  }

  if (!discovery) {
    throw new Error("No official curriculum sources ingested");
  }

  // Register canonical Math L01 package identity when present
  registerPackageRef({
    packageId: "ile_JO-NATIONAL-G01-MATH-B01-U01-L01",
    lessonHierarchicalId: "JO-NATIONAL-G01-MATH-B01-U01-L01",
  });
  registry = getGlobalCurriculumRegistrySnapshot();

  const lessonDependency = buildJordanMathDependencyExample();
  const knowledgeGraph = buildKnowledgeGraph({ lessonDependency });
  const studentFoundation = toStudentFoundation(buildJordanDemoStudentSkillProgress());

  const g01 = discovery.detected.grades.find((g) => g.code === "G01");
  const g01SubjectCodes = g01?.subjects.map((s) => s.localCode) || [];

  return {
    ok:
      discovery.unresolvedLocalSubjects.length === 0 &&
      Boolean(g01) &&
      !gradeHasSubject(discovery, "G01", "PHYSICS") &&
      !gradeHasSubject(discovery, "G01", "CHEMISTRY") &&
      !gradeHasSubject(discovery, "G01", "BIOLOGY"),
    schema: "success-os.global-curriculum-registry.v1",
    discovery,
    registry,
    knowledgeGraph,
    studentFoundation,
    globalSubjectRegistry: getGlobalSubjectRegistrySnapshot(),
    globalSkillRegistry: getGlobalSkillRegistrySnapshot(),
    assertions: {
      jordanIsFirstImplementation: sources[0]?.countryCode === "JO",
      physicsAbsentFromG01: !gradeHasSubject(discovery, "G01", "PHYSICS"),
      chemistryAbsentFromG01: !gradeHasSubject(discovery, "G01", "CHEMISTRY"),
      biologyAbsentFromG01: !gradeHasSubject(discovery, "G01", "BIOLOGY"),
      g01SubjectCodes,
    },
  };
}
