/**
 * SUCCESS OS Digital Book Factory — Phase 6
 * Universal Book Generation Engine (template + validation first).
 * Mass library generation is blocked until explicit owner approval.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  CONTENT_POLICY,
  PHASE,
  SUPPORTED_PROGRAM_TYPES,
  TEMPLATE_VERSION,
  UNIVERSAL_BOOK_SECTIONS,
  UNIVERSAL_LESSON_FIELDS,
  createUniversalBookTemplate,
  instantiateBookShellFromTemplate,
  validateUniversalBookTemplate,
} from './universal-book-template.js';

const MASS_GENERATION_ALLOWED = false;
const OWNER_APPROVAL_REQUIRED = true;

function factoryRoot() {
  return path.resolve(
    process.env.SUCCESS_OS_BOOK_FACTORY_ROOT ||
      path.join(process.cwd(), 'library', 'digital-book-factory'),
  );
}

function ensureDirs() {
  const root = factoryRoot();
  for (const dir of ['templates', 'reports', 'shells', 'approvals']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  return root;
}

function prerequisitesStatus() {
  const root = process.cwd();
  const checks = {
    phase2EducationMap: fs.existsSync(
      path.join(
        root,
        'library',
        'middle-east-education-maps',
        'master',
        'MIDDLE-EAST-MASTER-EDUCATION-INDEX.json',
      ),
    ),
    phase3KnowledgeGraph: fs.existsSync(
      path.join(
        root,
        'library',
        'middle-east-source-graph',
        'master',
        'MASTER-SOURCE-REPORT.json',
      ),
    ),
    phase4MasterCatalog: fs.existsSync(
      path.join(
        root,
        'library',
        'middle-east-master-catalog',
        'master',
        'MASTER-CATALOG-REPORT.json',
      ),
    ),
    phase5Normalization: fs.existsSync(
      path.join(
        root,
        'library',
        'middle-east-normalization',
        'master',
        'NORMALIZATION-REPORT.json',
      ),
    ),
  };

  const missing = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  return {
    checks,
    missing,
    allPresent: missing.length === 0,
    note: missing.length
      ? `Upstream Middle East artifacts missing: ${missing.join(', ')}. Template validation can still proceed; mass generation remains blocked.`
      : 'Upstream Middle East Phase 2–5 artifacts detected.',
  };
}

export function digitalBookFactoryStatus() {
  return {
    engine: 'SUCCESS OS Digital Book Factory',
    phase: PHASE,
    templateVersion: TEMPLATE_VERSION,
    massGenerationAllowed: MASS_GENERATION_ALLOWED,
    ownerApprovalRequired: OWNER_APPROVAL_REQUIRED,
    requiredBookSections: UNIVERSAL_BOOK_SECTIONS.length,
    requiredLessonFields: UNIVERSAL_LESSON_FIELDS.length,
    supportedProgramTypes: SUPPORTED_PROGRAM_TYPES,
    contentPolicy: CONTENT_POLICY,
    storageRoot: factoryRoot(),
    prerequisites: prerequisitesStatus(),
    pipeline: [
      'create-universal-book-template',
      'validate-template-production-ready',
      'emit-template-validation-report',
      'await-owner-approval-for-mass-generation',
      'generate-one-book-per-verified-subject',
    ],
  };
}

/**
 * Validate template and persist the production-readiness report.
 * Never generates the full library.
 */
export function validateAndPersistBookFactory() {
  const root = ensureDirs();
  const template = createUniversalBookTemplate();
  const validation = validateUniversalBookTemplate(template);
  const prerequisites = prerequisitesStatus();

  const templatePath = path.join(
    root,
    'templates',
    'UNIVERSAL-BOOK-TEMPLATE.json',
  );
  const reportPath = path.join(
    root,
    'reports',
    'UNIVERSAL-BOOK-TEMPLATE-VALIDATION-REPORT.json',
  );

  const report = {
    schema: 'success-os.digital-book-factory-validation-report.v1',
    phase: PHASE,
    generatedAt: new Date().toISOString(),
    massGenerationAllowed: false,
    ownerApprovalRequired: true,
    templateValidation: validation,
    prerequisites,
    factoryReadyForSingleShellPreview: validation.productionReady,
    factoryReadyForMassGeneration: false,
    reason:
      'Mass generation is blocked until owner approval. Template validation does not authorize library production.',
    nextSteps: [
      'Review UNIVERSAL-BOOK-TEMPLATE.json',
      'Confirm template validation report is production-ready',
      'Complete any missing upstream Phase 3–5 Middle East artifacts if required by policy',
      'Provide explicit owner approval before mass book generation',
    ],
  };

  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2), 'utf8');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  return {
    root,
    templatePath,
    reportPath,
    template,
    validation,
    report,
  };
}

/**
 * Create one empty book shell for a verified subject (preview only).
 * Does not invent units/lessons or write educational prose.
 * Does not persist unless persist=true.
 */
export function createSingleBookShell(input = {}, options = {}) {
  if (options.massGenerate) {
    throw new Error(
      'MASS_GENERATION_BLOCKED — owner approval required before mass library generation',
    );
  }

  const shell = instantiateBookShellFromTemplate(input);
  const result = {
    schema: 'success-os.digital-book-factory-shell-result.v1',
    phase: PHASE,
    massGenerationAllowed: false,
    persisted: false,
    shellPath: null,
    shell,
  };

  if (options.persist) {
    const root = ensureDirs();
    const safeId = String(shell.bookInformation.bookId || 'draft')
      .replace(/[^\w.-]+/g, '-')
      .slice(0, 120);
    const shellPath = path.join(root, 'shells', `${safeId}.json`);
    fs.writeFileSync(shellPath, JSON.stringify(shell, null, 2), 'utf8');
    result.persisted = true;
    result.shellPath = shellPath;
  }

  return result;
}

/**
 * Explicit mass-generation gate. Always false until owner approval file exists
 * AND this function is called with confirmMassGeneration: true.
 */
export function requestMassBookGeneration(options = {}) {
  const root = ensureDirs();
  const approvalPath = path.join(root, 'approvals', 'OWNER-MASS-GENERATION-APPROVAL.json');
  const approvalExists = fs.existsSync(approvalPath);

  if (!options.confirmMassGeneration || !approvalExists) {
    return {
      allowed: false,
      massGenerationAllowed: false,
      booksGenerated: 0,
      reason: !approvalExists
        ? 'Owner approval file missing. Place approvals/OWNER-MASS-GENERATION-APPROVAL.json after explicit approval.'
        : 'confirmMassGeneration flag was not set. Mass generation aborted.',
      approvalPath,
    };
  }

  // Even with approval file present in future runs, this Phase 6 delivery
  // intentionally does not execute mass generation.
  return {
    allowed: false,
    massGenerationAllowed: false,
    booksGenerated: 0,
    reason:
      'Phase 6 delivery validates the Universal Book Template only. Mass generation remains deferred by design.',
    approvalPath,
  };
}
