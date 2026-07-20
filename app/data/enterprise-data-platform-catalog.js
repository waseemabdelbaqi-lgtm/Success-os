/**
 * SUCCESS OS — Enterprise Data Platform, Knowledge Graph & Digital Twin Catalog
 *
 * Unified vocabulary for analytics, AI, recommendations, forecasting, and twins.
 * Bridges existing educational knowledge graph — does NOT rebuild it.
 * No duplicate business definitions; semantic layer is the single source of truth.
 */

import { KG_EDGE_TYPES, KG_NODE_KINDS } from './educational-knowledge-graph.js';

export const EDP_SCHEMA = 'success-os.enterprise-data-platform.v1';
export const EDP_VERSION = '1.0.0';

/** Modules that produce/consume the unified data layer. */
export const EDP_PRODUCER_MODULES = Object.freeze([
  'students',
  'parents',
  'teachers',
  'employees',
  'schools',
  'universities',
  'centers',
  'employers',
  'recruitment',
  'marketplace',
  'finance',
  'hr',
  'crm',
  'erp',
  'ai',
  'admissions',
  'scholarships',
  'books',
  'lessons',
  'exams',
  'jobs',
  'payments',
  'notifications',
  'support',
  'integrations',
]);

/** Global knowledge graph entity kinds (extends educational KG). */
export const EDP_ENTITY_KINDS = Object.freeze([
  ...KG_NODE_KINDS,
  'student',
  'parent',
  'teacher',
  'employee',
  'school',
  'university',
  'center',
  'employer',
  'recruitment_company',
  'career',
  'degree',
  'job',
  'internship',
  'scholarship',
  'enrollment',
  'subscription',
  'payment',
  'commission',
  'ai_agent',
  'tenant',
  'marketplace_listing',
  'event',
  'certification',
  'competency_framework',
]);

/** Relationship types — unlimited; includes educational edges + enterprise. */
export const EDP_EDGE_TYPES = Object.freeze([
  ...KG_EDGE_TYPES,
  'parent_of',
  'child_of',
  'teaches_student',
  'enrolled_in',
  'employs',
  'works_at',
  'requires_skill',
  'develops_skill',
  'maps_to_job',
  'maps_to_career',
  'awards_scholarship',
  'located_in',
  'belongs_to_tenant',
  'uses_curriculum',
  'recommends',
  'predicted_risk',
  'mastery_of',
  'weakness_in',
  'strength_in',
  'attended',
  'completed',
  'paid_for',
  'managed_by_ai',
  'similar_to',
  'prerequisite_career',
]);

/** Learning graph path vocabulary. */
export const EDP_LEARNING_PATH = Object.freeze([
  'book',
  'unit',
  'lesson',
  'activity',
  'quiz',
  'assignment',
  'exam',
  'weakness',
  'strength',
  'recommendation',
  'mastery',
]);

/** Digital twin kinds. */
export const EDP_TWIN_KINDS = Object.freeze([
  'student',
  'teacher',
  'school',
  'university',
  'center',
  'company',
  'employee',
  'marketplace',
  'country',
  'tenant',
]);

/** Structured platform events. */
export const EDP_EVENT_TYPES = Object.freeze([
  'registration',
  'payment',
  'booking',
  'lesson',
  'exam',
  'video',
  'attendance',
  'notification',
  'ai_usage',
  'login',
  'logout',
  'workflow',
  'approval',
  'export',
  'import',
  'audit',
  'mastery_update',
  'recommendation_served',
  'prediction_generated',
  'simulation_run',
  'twin_sync',
]);

/** Shared business semantic vocabulary — single definitions, no duplicates. */
export const EDP_SEMANTIC_TERMS = Object.freeze([
  {
    key: 'student',
    definition: 'Learner enrolled or registered on Success OS with an educational profile',
    owner: 'academic',
    aliases: ['learner', 'pupil'],
  },
  {
    key: 'teacher',
    definition: 'Instructor delivering lessons, courses, or tutoring on the platform',
    owner: 'academic',
    aliases: ['instructor', 'tutor'],
  },
  {
    key: 'enrollment',
    definition: 'Active relationship binding a student to a course, school, or program',
    owner: 'academic',
    aliases: ['registration_academic'],
  },
  {
    key: 'revenue',
    definition: 'Gross recognized platform income after discounts, before partner splits',
    owner: 'finance',
    aliases: ['gross_revenue'],
  },
  {
    key: 'commission',
    definition: 'Platform share of a transaction per commission engine rules',
    owner: 'finance',
    aliases: ['platform_fee'],
  },
  {
    key: 'lesson',
    definition: 'Atomic instructional unit within a book/unit/course',
    owner: 'academic',
    aliases: ['class_session'],
  },
  {
    key: 'exam',
    definition: 'Formal assessment measuring mastery of learning outcomes',
    owner: 'academic',
    aliases: ['test', 'assessment_formal'],
  },
  {
    key: 'completion',
    definition: 'Verified finish of a lesson, course, or learning path step',
    owner: 'academic',
    aliases: ['finished'],
  },
  {
    key: 'attendance',
    definition: 'Recorded presence at a live or scheduled learning session',
    owner: 'academic',
    aliases: ['presence'],
  },
  {
    key: 'subscription',
    definition: 'Recurring access entitlement to platform services or content',
    owner: 'finance',
    aliases: ['plan', 'membership'],
  },
]);

/** Feature store feature definitions (precomputed KPIs / AI features). */
export const EDP_FEATURE_DEFS = Object.freeze([
  { key: 'student.mastery_avg', domain: 'learning', refresh: 'event', ttlSec: 3600 },
  { key: 'student.dropout_risk', domain: 'prediction', refresh: 'hourly', ttlSec: 3600 },
  { key: 'student.attendance_rate_30d', domain: 'learning', refresh: 'hourly', ttlSec: 3600 },
  { key: 'student.engagement_score', domain: 'behavior', refresh: 'event', ttlSec: 1800 },
  { key: 'teacher.performance_score', domain: 'teacher', refresh: 'daily', ttlSec: 86400 },
  { key: 'teacher.completion_rate', domain: 'teacher', refresh: 'daily', ttlSec: 86400 },
  { key: 'finance.revenue_30d', domain: 'revenue', refresh: 'hourly', ttlSec: 3600 },
  { key: 'finance.churn_risk', domain: 'prediction', refresh: 'daily', ttlSec: 86400 },
  { key: 'finance.payment_risk', domain: 'prediction', refresh: 'hourly', ttlSec: 3600 },
  { key: 'institution.growth_index', domain: 'institution', refresh: 'daily', ttlSec: 86400 },
  { key: 'ai.recommendation_ctr', domain: 'ai', refresh: 'hourly', ttlSec: 3600 },
  { key: 'learning.weakness_topics', domain: 'learning', refresh: 'event', ttlSec: 1800 },
]);

/** Data quality rule templates. */
export const EDP_QUALITY_RULES = Object.freeze([
  { id: 'dup-entity', type: 'duplicate', severity: 'high', description: 'Duplicate entities by kind+externalKey+tenant' },
  { id: 'missing-required', type: 'missing', severity: 'high', description: 'Required fields null/empty' },
  { id: 'invalid-enum', type: 'invalid', severity: 'medium', description: 'Value outside allowed enum' },
  { id: 'orphan-edge', type: 'broken_relationship', severity: 'high', description: 'Edge references missing node' },
  { id: 'conflict-master', type: 'conflict', severity: 'high', description: 'Conflicting master data attributes' },
  { id: 'outlier-kpi', type: 'outlier', severity: 'low', description: 'KPI outside expected statistical range' },
]);

/** Recommendation catalog types. */
export const EDP_RECOMMENDATION_TYPES = Object.freeze([
  'lesson',
  'book',
  'teacher',
  'university',
  'scholarship',
  'course',
  'job',
  'internship',
  'event',
  'ai_session',
  'career_path',
]);

/** Prediction types. */
export const EDP_PREDICTION_TYPES = Object.freeze([
  'dropout_risk',
  'failure_risk',
  'attendance_risk',
  'payment_risk',
  'subscription_churn',
  'teacher_performance',
  'institution_growth',
  'revenue',
  'hiring_needs',
  'student_success',
]);

/** Simulation scenario types. */
export const EDP_SIMULATION_TYPES = Object.freeze([
  'commission_change',
  'pricing_change',
  'add_country',
  'launch_curriculum',
  'subscription_change',
]);

/** Personalization dimensions. */
export const EDP_PERSONALIZATION_DIMENSIONS = Object.freeze([
  'goals',
  'age',
  'country',
  'performance',
  'behavior',
  'interests',
  'history',
  'career',
  'curriculum',
  'language',
  'accessibility',
  'learning_style',
]);

/** Decision support audiences. */
export const EDP_DECISION_AUDIENCES = Object.freeze([
  'owner',
  'admin',
  'hr',
  'finance',
  'academic',
  'legal',
  'marketing',
  'sales',
  'support',
]);

export const EDP_DEFAULT_CONFIG = Object.freeze({
  version: 1,
  eventRetentionDays: 90,
  twinSyncIntervalSec: 300,
  featureDefaultTtlSec: 3600,
  searchMaxResults: 50,
  recommendationLimit: 10,
  predictionMinConfidence: 0.35,
  anonymizeAiTraining: true,
  requireTenantOnWrites: true,
  bridgeEducationalKg: true,
  disclaimer:
    'Enterprise Data Platform provides technical analytics readiness. Predictions are model estimates, not guarantees. AI training uses anonymized/authorized data only.',
});

/** Seed semantic reference + sample graph for demos (tenant-scoped). */
export const EDP_SEED_ENTITIES = Object.freeze([
  { kind: 'country', key: 'JO', name: 'Jordan', country: 'JO' },
  { kind: 'country', key: 'AE', name: 'United Arab Emirates', country: 'AE' },
  { kind: 'tenant', key: 'success-os', name: 'Success OS Platform', country: '*' },
  { kind: 'school', key: 'demo-school-jo', name: 'Demo Amman School', country: 'JO' },
  { kind: 'university', key: 'demo-uni-jo', name: 'Demo Jordan University', country: 'JO' },
  { kind: 'student', key: 'demo-student-1', name: 'Demo Student', country: 'JO', grade: '10' },
  { kind: 'parent', key: 'demo-parent-1', name: 'Demo Parent', country: 'JO' },
  { kind: 'teacher', key: 'demo-teacher-1', name: 'Demo Teacher', country: 'JO' },
  { kind: 'subject', key: 'math', name: 'Mathematics', country: 'JO' },
  { kind: 'book', key: 'math-g10', name: 'Math Grade 10', country: 'JO' },
  { kind: 'lesson', key: 'math-g10-l1', name: 'Algebra Basics', country: 'JO' },
  { kind: 'skill', key: 'algebra', name: 'Algebraic Reasoning', country: '*' },
  { kind: 'career', key: 'data-analyst', name: 'Data Analyst', country: '*' },
  { kind: 'job', key: 'junior-analyst', name: 'Junior Data Analyst', country: 'JO' },
  { kind: 'employer', key: 'demo-employer', name: 'Demo Tech Employer', country: 'JO' },
  { kind: 'scholarship', key: 'stem-jo', name: 'STEM Scholarship JO', country: 'JO' },
  { kind: 'ai_agent', key: 'tutor-math', name: 'Math Tutor Agent', country: '*' },
  { kind: 'degree', key: 'bsc-cs', name: 'BSc Computer Science', country: '*' },
  { kind: 'certification', key: 'math-fundamentals', name: 'Math Fundamentals Cert', country: '*' },
]);

export const EDP_SEED_EDGES = Object.freeze([
  { fromKind: 'parent', fromKey: 'demo-parent-1', type: 'parent_of', toKind: 'student', toKey: 'demo-student-1' },
  { fromKind: 'teacher', fromKey: 'demo-teacher-1', type: 'teaches_student', toKind: 'student', toKey: 'demo-student-1' },
  { fromKind: 'teacher', fromKey: 'demo-teacher-1', type: 'teaches', toKind: 'subject', toKey: 'math' },
  { fromKind: 'student', fromKey: 'demo-student-1', type: 'enrolled_in', toKind: 'school', toKey: 'demo-school-jo' },
  { fromKind: 'student', fromKey: 'demo-student-1', type: 'belongs_to', toKind: 'country', toKey: 'JO' },
  { fromKind: 'book', fromKey: 'math-g10', type: 'contains', toKind: 'lesson', toKey: 'math-g10-l1' },
  { fromKind: 'lesson', fromKey: 'math-g10-l1', type: 'develops_skill', toKind: 'skill', toKey: 'algebra' },
  { fromKind: 'skill', fromKey: 'algebra', type: 'maps_to_career', toKind: 'career', toKey: 'data-analyst' },
  { fromKind: 'career', fromKey: 'data-analyst', type: 'maps_to_job', toKind: 'job', toKey: 'junior-analyst' },
  { fromKind: 'employer', fromKey: 'demo-employer', type: 'requires_skill', toKind: 'skill', toKey: 'algebra' },
  { fromKind: 'scholarship', fromKey: 'stem-jo', type: 'awards_scholarship', toKind: 'student', toKey: 'demo-student-1' },
  { fromKind: 'ai_agent', fromKey: 'tutor-math', type: 'managed_by_ai', toKind: 'student', toKey: 'demo-student-1' },
  { fromKind: 'school', fromKey: 'demo-school-jo', type: 'located_in', toKind: 'country', toKey: 'JO' },
  { fromKind: 'university', fromKey: 'demo-uni-jo', type: 'located_in', toKind: 'country', toKey: 'JO' },
  { fromKind: 'degree', fromKey: 'bsc-cs', type: 'requires_skill', toKind: 'skill', toKey: 'algebra' },
  { fromKind: 'certification', fromKey: 'math-fundamentals', type: 'develops_skill', toKind: 'skill', toKey: 'algebra' },
]);

export const EDP_MODULE_IDS = Object.freeze([
  'data-platform',
  'edp-graph',
  'edp-learning',
  'edp-skills',
  'edp-twins',
  'edp-personalization',
  'edp-recommendations',
  'edp-predictions',
  'edp-decisions',
  'edp-governance',
  'edp-events',
  'edp-features',
  'edp-quality',
  'edp-search',
  'edp-semantic',
  'edp-ai-pipeline',
  'edp-simulation',
  'edp-intelligence',
]);

export function findSemanticTerm(key) {
  return EDP_SEMANTIC_TERMS.find((t) => t.key === key || (t.aliases || []).includes(key)) || null;
}

export function findFeatureDef(key) {
  return EDP_FEATURE_DEFS.find((f) => f.key === key) || null;
}
