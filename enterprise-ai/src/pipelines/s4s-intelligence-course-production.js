/**
 * AIOS task type: S4S_INTELLIGENCE_COURSE_PRODUCTION
 *
 * Workflow (never auto-publish, never auto-deploy):
 * Admin request → AIOS plan → Education Factory → Scientific verification →
 * Media production → Source verification → Quality validation →
 * Human review → Approved catalogue draft → Manual publication
 */

export const S4S_INTELLIGENCE_COURSE_PRODUCTION = "S4S_INTELLIGENCE_COURSE_PRODUCTION";

export const S4S_COURSE_PRODUCTION_STAGES = Object.freeze([
  { id: "plan", factory: "orchestrator", label: "AIOS plan" },
  { id: "education", factory: "education", label: "Education Factory", statusKey: "education_status" },
  {
    id: "scientific_verification",
    factory: "education",
    label: "Scientific verification",
    statusKey: "scientific_verification_status",
  },
  { id: "media", factory: "media", label: "Media production", statusKey: "media_status" },
  {
    id: "source_verification",
    factory: "education",
    label: "Source verification",
    statusKey: "source_verification_status",
  },
  { id: "quality", factory: "orchestrator", label: "Quality validation" },
  {
    id: "human_approval",
    factory: "human",
    label: "Human review",
    statusKey: "human_approval_status",
  },
  { id: "catalogue_draft", factory: "human", label: "Approved catalogue draft" },
  { id: "manual_publication", factory: "human", label: "Manual publication" },
]);

export function createS4sCourseProductionJob({
  courseId = null,
  requestedBy = null,
  provider = null,
} = {}) {
  const now = new Date().toISOString();
  return {
    id: `aios-s4s-${Date.now()}`,
    task_type: S4S_INTELLIGENCE_COURSE_PRODUCTION,
    course_id: courseId,
    requested_by: requestedBy,
    factory: "education",
    agent: "curriculum",
    provider: provider || null,
    status: "QUEUED",
    education_status: "PENDING",
    media_status: "PENDING",
    scientific_verification_status: "PENDING",
    source_verification_status: "PENDING",
    human_approval_status: "PENDING",
    publication_readiness: "NOT_READY",
    generated_assets: [],
    auto_publish: false,
    vercel_auto_deploy: false,
    created_at: now,
    updated_at: now,
    stages: S4S_COURSE_PRODUCTION_STAGES.map((s) => ({ ...s, status: "PENDING" })),
  };
}

/**
 * Advance a job one stage. Media and publication always require human gates.
 */
export function advanceS4sCourseProductionJob(job, { approveMedia = false, approvePublish = false } = {}) {
  if (!job || job.task_type !== S4S_INTELLIGENCE_COURSE_PRODUCTION) {
    return { ok: false, error: "INVALID_JOB" };
  }
  if (job.auto_publish === true) {
    return { ok: false, error: "AUTO_PUBLISH_FORBIDDEN" };
  }

  const next = {
    ...job,
    stages: (job.stages || S4S_COURSE_PRODUCTION_STAGES.map((s) => ({ ...s, status: "PENDING" }))).map(
      (s) => ({ ...s }),
    ),
    updated_at: new Date().toISOString(),
  };

  const order = S4S_COURSE_PRODUCTION_STAGES.map((s) => s.id);
  const currentIdx = next.stages.findIndex((s) => s.status !== "COMPLETED" && s.status !== "APPROVED");
  if (currentIdx < 0) {
    next.status = "AWAITING_MANUAL_PUBLICATION";
    next.publication_readiness = next.human_approval_status === "APPROVED" ? "READY" : "NOT_READY";
    return { ok: true, job: next };
  }

  const stage = next.stages[currentIdx];

  if (stage.id === "media" && !approveMedia) {
    next.media_status = "AWAITING_APPROVAL";
    next.status = "AWAITING_MEDIA_APPROVAL";
    stage.status = "AWAITING_APPROVAL";
    return { ok: true, job: next, gate: "MEDIA_APPROVAL_REQUIRED" };
  }

  if (stage.id === "human_approval" && !approvePublish) {
    next.human_approval_status = "AWAITING_APPROVAL";
    next.status = "AWAITING_HUMAN_APPROVAL";
    stage.status = "AWAITING_APPROVAL";
    return { ok: true, job: next, gate: "HUMAN_APPROVAL_REQUIRED" };
  }

  if (stage.id === "manual_publication") {
    // Never auto-publish — leave as draft-ready for admin manual publish
    next.status = "APPROVED_CATALOGUE_DRAFT";
    next.publication_readiness = "READY_FOR_MANUAL_PUBLISH";
    next.human_approval_status = "APPROVED";
    stage.status = "READY_FOR_MANUAL_PUBLISH";
    return { ok: true, job: next, gate: "MANUAL_PUBLICATION_REQUIRED" };
  }

  stage.status = "COMPLETED";
  if (stage.statusKey) next[stage.statusKey] = "COMPLETED";
  if (stage.id === "education") next.education_status = "COMPLETED";
  if (stage.id === "scientific_verification") next.scientific_verification_status = "COMPLETED";
  if (stage.id === "source_verification") next.source_verification_status = "COMPLETED";
  if (stage.id === "media") next.media_status = "APPROVED";
  if (stage.id === "human_approval") next.human_approval_status = "APPROVED";

  next.status = `STAGE_${String(order[currentIdx + 1] || "DONE").toUpperCase()}`;
  next.factory = S4S_COURSE_PRODUCTION_STAGES[Math.min(currentIdx + 1, order.length - 1)].factory;

  return { ok: true, job: next };
}

export function isS4sCourseProductionTask(taskType) {
  return String(taskType || "").trim() === S4S_INTELLIGENCE_COURSE_PRODUCTION;
}
