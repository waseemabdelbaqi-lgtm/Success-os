import { NextResponse } from "next/server";
import type { ImportPipelineStageId } from "@/types/curriculum-import-engine";
import { IMPORT_PIPELINE_STAGES } from "@/types/curriculum-import-engine";
import {
  buildDashboardSnapshot,
  createImportJob,
  engineStatus,
  getHierarchySnapshot,
  getJob,
  listJobs,
  listSourceConnectors,
  rollbackJob,
  runImportJob,
  runJordanGrade1MathReference,
  runJordanPhase1Import,
  runJordanReferenceDataset,
  getGlobalSubjectRegistrySnapshot,
  resolveCountrySubject,
  getCrossCountryMathExamples,
  getGlobalSkillRegistrySnapshot,
  getMathSkillPathway,
  buildStudentSkillProgress,
  buildJordanDemoStudentSkillProgress,
  buildJordanMathDependencyExample,
  buildLessonDependencyGraph,
} from "@/lib/curriculum-import-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Curriculum Import Engine API — compiler only.
 * Never returns rendered lesson HTML; packages are ILE JSON.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";
  const jobId = url.searchParams.get("jobId");

  if (action === "status") {
    return NextResponse.json({ ok: true, ...engineStatus() });
  }
  if (action === "dashboard") {
    return NextResponse.json({ ok: true, dashboard: buildDashboardSnapshot() });
  }
  if (action === "hierarchy") {
    return NextResponse.json({ ok: true, hierarchy: getHierarchySnapshot() });
  }
  if (action === "global-subject-registry") {
    const country = url.searchParams.get("country");
    const localLabel = url.searchParams.get("localLabel");
    if (country && localLabel) {
      const resolved = resolveCountrySubject(country, localLabel);
      return NextResponse.json({
        ok: Boolean(resolved.globalSubjectId),
        resolve: resolved,
        note: "Local labels differ by country; SUB-XXXXX is shared globally.",
      });
    }
    return NextResponse.json({
      ok: true,
      registry: getGlobalSubjectRegistrySnapshot(),
      crossCountryExamples: getCrossCountryMathExamples(),
      note: "Jordan → رياضيات → SUB-00001 · USA → Mathematics → SUB-00001 · Egypt → رياضيات → SUB-00001",
    });
  }
  if (action === "global-skill-registry") {
    return NextResponse.json({
      ok: true,
      registry: getGlobalSkillRegistrySnapshot(),
      note: "SKL-00001…SKL-00012 — append-only. Math pathway: Fractions → Decimals → Percentages → Algebra → Functions",
    });
  }
  if (action === "skill-pathway") {
    const pathway = getMathSkillPathway();
    return NextResponse.json({
      ok: true,
      pathway,
      note: "Fractions → Decimals → Percentages → Algebra → Functions",
      displayPath: pathway.displayPath,
    });
  }
  if (action === "lesson-dependency") {
    runJordanReferenceDataset({ reset: true });
    const subjectId = url.searchParams.get("subjectId") || "SUB-00001";
    const rootLessonId =
      url.searchParams.get("rootLessonId") || "JO-NATIONAL-G01-MATH-B01-U01-L01";
    const graph =
      subjectId === "SUB-00001" && !url.searchParams.get("subjectId")
        ? buildJordanMathDependencyExample()
        : buildLessonDependencyGraph({ subjectId, rootLessonId });
    return NextResponse.json({
      ok: true,
      dependency: graph,
      note: "Lesson → depends on → Lesson → depends on → Lesson",
      exampleChain: graph.chains[0]?.displayPath || null,
    });
  }
  if (action === "student-skill-progress") {
    // Ensure Jordan reference hierarchy is seeded for skill/lesson lookups
    runJordanReferenceDataset({ reset: true });
    const completedParam = url.searchParams.get("completedLessonIds");
    const completedLessonIds = completedParam
      ? completedParam.split(",").map((s) => s.trim()).filter(Boolean)
      : ["JO-NATIONAL-G01-MATH-B01-U01-L01"];
    const progress =
      completedParam || url.searchParams.get("studentId")
        ? buildStudentSkillProgress({
            studentId: url.searchParams.get("studentId") || "student_jo_demo_001",
            countryId: url.searchParams.get("countryId") || "JO",
            curriculumId: url.searchParams.get("curriculumId") || "JO-NATIONAL",
            completedLessonIds,
          })
        : buildJordanDemoStudentSkillProgress();
    return NextResponse.json({
      ok: true,
      progress,
      note: "Student → Completed Lessons → Completed Skills → Missing Skills → Weak Skills → Recommended Lessons",
    });
  }
  if (action === "jordan-g1-math-example") {
    const result = runJordanGrade1MathReference({ reset: true, publish: true });
    return NextResponse.json({
      ok: result.ok,
      reference: true,
      result: {
        published: result.published,
        hierarchyPath: result.hierarchyPath,
        lessonId: result.lessonId,
        packageId: result.packageId,
        gates: result.gates,
        errors: result.errors,
        package: result.package
          ? {
              id: result.package.id,
              schema: result.package.schema,
              title: result.package.title,
              status: result.package.status,
              source: result.package.source,
              objectives: result.package.objectives,
              filters: result.package.filters,
              slideCount: result.package.slides.length,
              importMeta: result.package.importMeta,
              engineMeta: result.package.engineMeta,
            }
          : null,
        counts: result.snapshot.counts,
      },
    });
  }
  if (action === "jordan-reference-dataset") {
    const result = runJordanReferenceDataset({ reset: true });
    return NextResponse.json({
      ok: result.ok,
      dataset: "success-os.jordan-reference-dataset.v1",
      tree: result.tree,
      samplePath: result.samplePath,
      sampleMetadata: result.sampleMetadata,
      samplePackage: result.samplePackage
        ? {
            id: result.samplePackage.id,
            schema: result.samplePackage.schema,
            title: result.samplePackage.title,
            status: result.samplePackage.status,
            filters: result.samplePackage.filters,
            source: result.samplePackage.source,
            objectives: result.samplePackage.objectives,
            importMeta: result.samplePackage.importMeta,
            engineMeta: result.samplePackage.engineMeta,
          }
        : null,
      counts: result.counts,
      validationReport: result.validationReport,
      validationErrors: result.validationErrors,
      rightsWarnings: result.rightsWarnings,
      globalSubjectRegistry: result.globalSubjectRegistry,
      globalSkillRegistry: result.globalSkillRegistry,
      studentSkillProgress: result.studentSkillProgress,
      lessonDependency: result.lessonDependency,
    });
  }
  if (action === "connectors") {
    return NextResponse.json({
      ok: true,
      connectors: listSourceConnectors().map((c) => ({
        id: c.id,
        type: c.type,
        label: c.label,
        countries: c.countries,
      })),
    });
  }
  if (action === "jobs") {
    return NextResponse.json({
      ok: true,
      jobs: listJobs().map(summarizeJob),
    });
  }
  if (action === "job" && jobId) {
    const job = getJob(jobId);
    if (!job) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, job: summarizeJob(job, true) });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const action = String(body.action || "");

  if (action === "create") {
    const job = createImportJob({
      connectorId: typeof body.connectorId === "string" ? body.connectorId : "jordan-nccd",
      country: typeof body.country === "string" ? body.country : "Jordan",
      curriculum:
        typeof body.curriculum === "string"
          ? body.curriculum
          : "Jordan National Curriculum",
    });
    return NextResponse.json({ ok: true, job: summarizeJob(job) });
  }

  if (action === "run") {
    const jobId = typeof body.jobId === "string" ? body.jobId : "";
    if (!jobId) return NextResponse.json({ ok: false, error: "jobId required" }, { status: 400 });
    const fromStage =
      typeof body.fromStage === "string" &&
      IMPORT_PIPELINE_STAGES.includes(body.fromStage as ImportPipelineStageId)
        ? (body.fromStage as ImportPipelineStageId)
        : undefined;
    const job = await runImportJob(jobId, { fromStage });
    return NextResponse.json({ ok: true, job: summarizeJob(job, true) });
  }

  if (action === "run-jordan") {
    const job = await runJordanPhase1Import();
    return NextResponse.json({
      ok: true,
      job: summarizeJob(job, true),
      note: "Jordan Phase 1 — ILE packages only; no AI/video/quiz generation",
    });
  }

  if (action === "run-jordan-g1-math") {
    const result = runJordanGrade1MathReference({ reset: true, publish: true });
    return NextResponse.json({
      ok: result.ok,
      note: "Jordan Grade 1 Math reference — hierarchy → verified ILE package → publish",
      result: {
        published: result.published,
        hierarchyPath: result.hierarchyPath,
        lessonId: result.lessonId,
        packageId: result.packageId,
        gates: result.gates,
        errors: result.errors,
        package: result.package,
        counts: result.snapshot.counts,
      },
    });
  }

  if (action === "run-jordan-reference-dataset") {
    const result = runJordanReferenceDataset({ reset: true });
    return NextResponse.json({
      ok: result.ok,
      note: "Jordan reference dataset — metadata standard + verified ILE example (no AI)",
      result,
    });
  }

  if (action === "rollback") {
    const jobId = typeof body.jobId === "string" ? body.jobId : "";
    const job = rollbackJob(jobId);
    if (!job) return NextResponse.json({ ok: false, error: "Nothing to rollback" }, { status: 400 });
    return NextResponse.json({ ok: true, job: summarizeJob(job, true) });
  }

  if (action === "retry") {
    const jobId = typeof body.jobId === "string" ? body.jobId : "";
    if (!jobId) return NextResponse.json({ ok: false, error: "jobId required" }, { status: 400 });
    const existing = getJob(jobId);
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    const job = await runImportJob(jobId, {
      fromStage: existing.checkpoint?.stage || undefined,
    });
    return NextResponse.json({ ok: true, job: summarizeJob(job, true) });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

function summarizeJob(job: ReturnType<typeof getJob> extends infer J ? NonNullable<J> : never, full = false) {
  const base = {
    id: job.id,
    status: job.status,
    country: job.country,
    curriculum: job.curriculum,
    connectorId: job.connectorId,
    currentStage: job.currentStage,
    stagesCompleted: job.stagesCompleted,
    packageCount: job.packageCount,
    bookCount: job.bookCount,
    lessonCount: job.lessonCount,
    errors: job.errors,
    warnings: job.warnings,
    version: job.version,
    gates: job.gates.map((g) => ({ gate: g.gate, passed: g.passed })),
    verificationStatus: job.book?.metadata.verificationStatus || "pending",
    rightsStatus: job.book?.metadata.rightsStatus || "unknown",
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
  };
  if (!full) return base;
  return {
    ...base,
    source: job.source,
    book: job.book
      ? {
          id: job.book.id,
          title: job.book.title,
          checksum: job.book.checksum,
          units: job.book.units.length,
          lessons: job.lessonCount,
          metadata: job.book.metadata,
        }
      : null,
    packages: job.packages.map((p) => ({
      id: p.id,
      schema: p.schema,
      title: p.title,
      status: p.status,
      version: p.version,
      source: p.source,
      importMeta: p.importMeta,
      objectives: p.objectives,
      slideCount: p.slides.length,
      // Never include a rendered view — package JSON only
    })),
    events: job.events.slice(-30),
    history: job.history,
    checkpoint: job.checkpoint,
  };
}
