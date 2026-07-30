/**
 * Multilingual global search index for UCE entities.
 * Search by country, curriculum, grade, subject, book, lesson, skill,
 * objective, keyword, standard, language — plus free-text.
 */
import type {
  GlobalAssessmentObjectiveRecord,
  GlobalLearningObjectiveRecord,
  GlobalStandardRecord,
  MappedEntityRef,
  SearchIndexDocument,
  SearchQuery,
  SearchResult,
  CurriculumMappingRecord,
} from "@/types/universal-curriculum-mapping";

function flattenLocale(label?: { en: string; ar: string }): string {
  if (!label) return "";
  return `${label.en} ${label.ar}`;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildSearchDocuments(input: {
  entities: MappedEntityRef[];
  objectives: GlobalLearningObjectiveRecord[];
  standards: GlobalStandardRecord[];
  assessmentObjectives: GlobalAssessmentObjectiveRecord[];
  mappings: CurriculumMappingRecord[];
}): SearchIndexDocument[] {
  const docs: SearchIndexDocument[] = [];

  for (const e of input.entities) {
    docs.push({
      id: `doc_${e.globalId}`,
      kind: e.kind,
      globalId: e.globalId,
      title: e.label || { en: e.globalId, ar: e.globalId },
      countryGlobalId: e.countryGlobalId,
      curriculumGlobalId: e.curriculumGlobalId,
      subjectGlobalId: e.subjectGlobalId,
      lessonGlobalId: e.kind === "lesson" ? e.globalId : undefined,
      skillIds: [],
      objectiveIds: [],
      standardIds: [],
      keywords: [],
      language: e.language,
      searchText: normalize(
        [
          e.globalId,
          e.hierarchicalId || "",
          flattenLocale(e.label),
          e.kind,
          e.countryGlobalId || "",
          e.curriculumGlobalId || "",
          e.subjectGlobalId || "",
          e.language || "",
        ].join(" "),
      ),
    });
  }

  for (const obj of input.objectives) {
    docs.push({
      id: `doc_${obj.globalId}`,
      kind: "learning_objective",
      globalId: obj.globalId,
      title: obj.statement,
      subjectGlobalId: obj.subjectGlobalIds[0],
      skillIds: [...obj.skillIds],
      objectiveIds: [obj.globalId],
      standardIds: [],
      keywords: [...obj.keywords],
      searchText: normalize(
        [
          obj.globalId,
          obj.code,
          flattenLocale(obj.statement),
          obj.keywords.join(" "),
          obj.skillIds.join(" "),
          obj.lessonIds.join(" "),
        ].join(" "),
      ),
    });
  }

  for (const std of input.standards) {
    docs.push({
      id: `doc_${std.globalId}`,
      kind: "standard",
      globalId: std.globalId,
      title: std.name,
      skillIds: [],
      objectiveIds: [...std.objectiveIds],
      standardIds: [std.globalId],
      keywords: [std.framework, std.code],
      searchText: normalize(
        [std.globalId, std.code, std.framework, flattenLocale(std.name)].join(" "),
      ),
    });
  }

  for (const aso of input.assessmentObjectives) {
    docs.push({
      id: `doc_${aso.globalId}`,
      kind: "assessment_objective",
      globalId: aso.globalId,
      title: aso.statement,
      skillIds: [...aso.skillIds],
      objectiveIds: [...aso.objectiveIds],
      standardIds: [],
      keywords: [aso.code],
      searchText: normalize(
        [aso.globalId, aso.code, flattenLocale(aso.statement)].join(" "),
      ),
    });
  }

  for (const m of input.mappings) {
    docs.push({
      id: `doc_${m.globalId}`,
      kind: "mapping",
      globalId: m.globalId,
      title: m.notes || {
        en: `${m.relation}: ${m.source.globalId} → ${m.target.globalId}`,
        ar: `${m.relation}: ${m.source.globalId} → ${m.target.globalId}`,
      },
      countryGlobalId: m.source.countryGlobalId || m.target.countryGlobalId,
      curriculumGlobalId: m.source.curriculumGlobalId || m.target.curriculumGlobalId,
      subjectGlobalId: m.source.subjectGlobalId || m.target.subjectGlobalId,
      lessonGlobalId:
        m.source.kind === "lesson"
          ? m.source.globalId
          : m.target.kind === "lesson"
            ? m.target.globalId
            : undefined,
      skillIds: [],
      objectiveIds: [],
      standardIds: [],
      keywords: [m.relation, String(m.confidence)],
      language: m.source.language || m.target.language,
      searchText: normalize(
        [
          m.globalId,
          m.relation,
          m.source.globalId,
          m.target.globalId,
          flattenLocale(m.source.label),
          flattenLocale(m.target.label),
          flattenLocale(m.notes),
          m.evidence.map((e) => flattenLocale(e.label)).join(" "),
        ].join(" "),
      ),
    });
  }

  return docs;
}

export function searchIndex(
  documents: SearchIndexDocument[],
  query: SearchQuery,
): SearchResult {
  const limit = query.limit ?? 25;
  const q = query.q ? normalize(query.q) : "";

  const filtered = documents.filter((doc) => {
    if (query.country && doc.countryGlobalId !== query.country) return false;
    if (query.curriculum && doc.curriculumGlobalId !== query.curriculum) return false;
    if (query.grade && doc.gradeGlobalId !== query.grade) return false;
    if (query.subject && doc.subjectGlobalId !== query.subject) return false;
    if (query.book && doc.bookGlobalId !== query.book) return false;
    if (query.lesson && doc.lessonGlobalId !== query.lesson && doc.globalId !== query.lesson)
      return false;
    if (query.skill && !doc.skillIds.includes(query.skill) && !doc.searchText.includes(normalize(query.skill)))
      return false;
    if (
      query.objective &&
      !doc.objectiveIds.includes(query.objective) &&
      doc.globalId !== query.objective
    )
      return false;
    if (
      query.standard &&
      !doc.standardIds.includes(query.standard) &&
      doc.globalId !== query.standard &&
      !doc.searchText.includes(normalize(query.standard))
    )
      return false;
    if (query.keyword && !doc.keywords.some((k) => normalize(k).includes(normalize(query.keyword!))) && !doc.searchText.includes(normalize(query.keyword)))
      return false;
    if (query.language && doc.language && doc.language !== query.language) return false;
    if (q && !doc.searchText.includes(q)) return false;
    return true;
  });

  return {
    schema: "success-os.uce-search.v1",
    query,
    hits: filtered.slice(0, limit),
    counts: { total: filtered.length, returned: Math.min(limit, filtered.length) },
  };
}
