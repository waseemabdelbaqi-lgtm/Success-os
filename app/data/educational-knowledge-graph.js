/**
 * Success OS Educational Knowledge Graph
 *
 * The educational brain of Success OS.
 * Every AI recommendation must consult this graph.
 * Architecture supports unlimited countries/curricula without redesign.
 *
 * PHASE JO-01.4 — Jordan Grade 1 Knowledge Graph (first implementation)
 */

export const KG_SCHEMA = 'success-os.educational-knowledge-graph.v1';
export const KG_VERSION = '1.4.0';

/** Node kinds — permanent vocabulary. */
export const KG_NODE_KINDS = Object.freeze([
  'country',
  'educationalSystem',
  'grade',
  'semester',
  'subject',
  'book',
  'unit',
  'lesson',
  'topic',
  'subtopic',
  'learningOutcome',
  'concept',
  'skill',
  'vocabulary',
  'formula',
  'rule',
  'experiment',
  'activity',
  'assessment',
  'reference',
  'teacherNote',
  'aiVideo',
  'question',
  'questionExplanation',
  'competency',
  'misconception',
]);

/** Relationship (edge) types — permanent vocabulary. */
export const KG_EDGE_TYPES = Object.freeze([
  'belongs_to',
  'contains',
  'teaches',
  'requires_previous',
  'supports_future',
  'assessed_by',
  'measures',
  'develops',
  'appears_in',
  'used_in',
  'explains',
  'reinforces',
  'has_vocabulary',
  'has_skill',
  'has_outcome',
  'has_formula',
  'has_rule',
  'has_experiment',
  'has_activity',
  'has_assessment',
  'has_reference',
  'has_teacher_note',
  'has_ai_video',
  'has_question',
  'has_explanation',
  'has_misconception',
  'prerequisite_of',
  'depends_on',
  'cross_subject_related',
  'shares_vocabulary',
  'shares_concept',
  'next_lesson',
  'previous_lesson',
]);

/** Metadata required on every node and edge. */
export const KG_REQUIRED_META = Object.freeze([
  'globalId',
  'version',
  'officialSource',
  'verificationStatus',
  'createdAt',
  'updatedAt',
  'confidenceScore',
]);

/** Search facets. */
export const KG_SEARCH_FACETS = Object.freeze([
  'concept',
  'skill',
  'learningOutcome',
  'question',
  'keyword',
  'formula',
  'vocabulary',
  'unit',
  'lesson',
  'book',
  'subject',
  'grade',
]);

/** AI services that MUST consult the graph before recommendations. */
export const KG_AI_SERVICES = Object.freeze([
  'AI Teacher',
  'AI Tutor',
  'AI Mentor',
  'AI Parent Assistant',
  'AI Question Generator',
  'AI Exam Generator',
  'AI Study Planner',
  'AI Career Advisor',
  'AI Analytics',
  'AI Recommendation Engine',
]);

/** Cross-subject affinity pairs for automatic discovery (Jordan G1). */
export const KG_CROSS_SUBJECT_AFFINITIES = Object.freeze([
  ['اللغة العربية', 'التربية الإسلامية'],
  ['الرياضيات', 'العلوم'],
  ['العلوم', 'الدراسات الاجتماعية'],
  ['اللغة الإنجليزية', 'الرياضيات'],
  ['التربية الفنية والموسيقية والمسرحية', 'العلوم'],
  ['التربية الفنية والموسيقية والمسرحية', 'اللغة العربية'],
  ['التربية الرياضية', 'العلوم'],
  ['المهارات الرقمية', 'الرياضيات'],
  ['المهارات الرقمية', 'العلوم'],
]);

export function kgSlug(value) {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\u064b-\u065f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'unknown';
}

export function createKgMetadata({
  globalId,
  version = '1.0.0',
  officialSource = null,
  verificationStatus = 'verified',
  createdAt = null,
  updatedAt = null,
  confidenceScore = 0.9,
  extra = {},
}) {
  const now = new Date().toISOString();
  return {
    globalId,
    version,
    officialSource,
    verificationStatus,
    createdAt: createdAt || now,
    updatedAt: updatedAt || now,
    confidenceScore,
    ...extra,
  };
}

export function validateKgMetadata(obj) {
  const missing = KG_REQUIRED_META.filter((k) => {
    const v = obj?.[k];
    return v === undefined || v === null || v === '';
  });
  return { ok: missing.length === 0, missing };
}

/**
 * Hard rule helper — AI services must call this before recommending.
 */
export function assertGraphConsulted(consultationToken) {
  if (!consultationToken?.graphConsulted || !consultationToken?.queryId) {
    return {
      ok: false,
      error: 'GRAPH_CONSULTATION_REQUIRED',
      message:
        'No AI feature may generate recommendations without consulting the Educational Knowledge Graph.',
    };
  }
  return { ok: true };
}
