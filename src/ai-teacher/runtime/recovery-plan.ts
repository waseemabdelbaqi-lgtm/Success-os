/* ==========================================================
   SUCCESS OS
   AUTOMATIC RECOVERY PLAN
   Sara & Ali
========================================================== */

export interface AcceptanceFailure {
  teacher: "sara" | "ali";

  failedChecks: string[];
}

export interface RecoveryTask {
  priority: number;

  title: string;

  completed: boolean;
}

export function buildRecoveryPlan(failure: AcceptanceFailure): RecoveryTask[] {
  const tasks: RecoveryTask[] = [];

  if (failure.failedChecks.includes("Photorealism")) {
    tasks.push({
      priority: 1,
      title:
        "Upgrade digital human realism (face, skin, eyes, hair, lighting).",
      completed: false,
    });
  }

  if (failure.failedChecks.includes("LipSync")) {
    tasks.push({
      priority: 2,
      title: "Improve real-time lip synchronization.",
      completed: false,
    });
  }

  if (failure.failedChecks.includes("Animation")) {
    tasks.push({
      priority: 3,
      title: "Improve full-body natural animation and gestures.",
      completed: false,
    });
  }

  if (failure.failedChecks.includes("Teaching")) {
    tasks.push({
      priority: 4,
      title: "Improve explanation quality and adaptive teaching.",
      completed: false,
    });
  }

  if (failure.failedChecks.includes("Showcase")) {
    tasks.push({
      priority: 5,
      title: "Generate mandatory 15-second showcase lesson.",
      completed: false,
    });
  }

  return tasks.sort((a, b) => a.priority - b.priority);
}

/** Map Final Acceptance runtime into recovery check tags (all failures, not first-only). */
export function collectFailedChecks(runtime: {
  realismScore: number;
  teachingScore: number;
  animationScore: number;
  lipSyncScore: number;
  interactionScore: number;
  has15SecondShowcase: boolean;
}): string[] {
  const MIN = 95;
  const failed: string[] = [];
  if (runtime.realismScore < MIN) failed.push("Photorealism");
  if (runtime.lipSyncScore < MIN) failed.push("LipSync");
  if (runtime.animationScore < MIN) failed.push("Animation");
  if (runtime.teachingScore < MIN || runtime.interactionScore < MIN) {
    failed.push("Teaching");
  }
  if (!runtime.has15SecondShowcase) failed.push("Showcase");
  return failed;
}

export function buildTeacherRecoveryPlan(
  teacher: "sara" | "ali",
  runtime: {
    realismScore: number;
    teachingScore: number;
    animationScore: number;
    lipSyncScore: number;
    interactionScore: number;
    has15SecondShowcase: boolean;
  },
): { failure: AcceptanceFailure; tasks: RecoveryTask[] } {
  const failure: AcceptanceFailure = {
    teacher,
    failedChecks: collectFailedChecks(runtime),
  };
  return { failure, tasks: buildRecoveryPlan(failure) };
}
