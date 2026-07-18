/**
 * PHASE JO-09 — Jordan Content Factory Adapter
 *
 * Enrolls Jordan National Curriculum lessons into the Success OS Content Factory.
 * Does NOT publish educational content directly.
 * Does NOT generate new educational content.
 */

import path from 'node:path';
import { createContentFactory } from './content-factory-engine-core.js';
import { isJordanNationalBookId } from '../../data/jordan-national-knowledge-sources.js';
import { listLibraryBooks } from './library-store.js';
import {
  CONTENT_FACTORY_VERSION,
  PIPELINE_STAGES,
  CONTENT_STATUSES,
  LESSON_TEMPLATE_SECTIONS,
  ADMIN_ACTIONS,
} from '../../data/success-os-content-factory.js';

export const PHASE = 'JO-09_SUCCESS_OS_CONTENT_FACTORY';
export const ENGINE_VERSION = '9.0.0';

function list(v) {
  return Array.isArray(v) ? v : [];
}

function factoryRoot() {
  return path.join(process.cwd(), 'library', 'success-os-content-factory');
}

let engineSingleton = null;

export function getJordanContentFactory() {
  if (engineSingleton) return engineSingleton;
  engineSingleton = createContentFactory({
    countryCode: 'JO',
    country: 'Jordan',
    educationalSystem: 'Jordan National Curriculum',
    rootDir: factoryRoot(),
    listSourceBooks: () => {
      const all = listLibraryBooks().filter((b) => isJordanNationalBookId(b.id));
      const produced = all.filter((b) => b.jo02?.producedAt);
      return produced.length ? produced : all.filter((b) =>
        list(b.units).some((u) => list(u.lessons).length),
      );
    },
  });
  return engineSingleton;
}

export function runJordanContentFactory(options = {}) {
  const engine = getJordanContentFactory();
  if (options.dashboardOnly) {
    return { phase: PHASE, dashboard: engine.buildDashboard() };
  }
  const result = engine.runFactory(options);
  return {
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    factoryVersion: CONTENT_FACTORY_VERSION,
    countryCode: 'JO',
    enrolled: result.records?.length || 0,
    metrics: result.registry?.metrics,
    dashboard: result.dashboard,
    pipelineStages: PIPELINE_STAGES.length,
    rule: 'No lesson may skip any production stage. No direct publication.',
  };
}

export function buildJordanContentFactoryDashboard() {
  return getJordanContentFactory().buildDashboard();
}

export function jordanContentFactoryAdminAction(recordId, action, payload = {}) {
  return getJordanContentFactory().adminAction(recordId, action, payload);
}

export function readJordanContentFactoryLesson(recordId) {
  return getJordanContentFactory().readLesson(recordId);
}

export function listJordanContentFactoryQueue(status = 'Admin Review') {
  return getJordanContentFactory()
    .listRecords()
    .filter((r) => r.status === status)
    .map((r) => ({
      recordId: r.recordId,
      title: r.title,
      grade: r.grade,
      subject: r.subject,
      status: r.status,
      currentStage: r.currentStage,
      qualityScore: r.qualityScore,
      completedStages: r.completedStages?.length || 0,
      totalStages: PIPELINE_STAGES.length,
    }));
}

export function getJordanContentFactoryMeta() {
  return {
    phase: PHASE,
    factoryVersion: CONTENT_FACTORY_VERSION,
    pipelineStages: PIPELINE_STAGES,
    contentStatuses: CONTENT_STATUSES,
    lessonTemplate: LESSON_TEMPLATE_SECTIONS.map((s) => s.label),
    adminActions: ADMIN_ACTIONS,
  };
}
