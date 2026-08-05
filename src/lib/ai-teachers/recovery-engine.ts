// src/lib/ai-teachers/recovery-engine.ts
/**
 * Success OS — Automatic Recovery Engine for permanent primary teachers.
 * Platform teacher ids remain sara | ali (Sara.ts / Ali.ts sole identity).
 * Alias "sarah" is accepted and normalized to "sara".
 */

export const PRIMARY_TEACHER_IDS = ["sara", "ali"] as const;

export type PrimaryTeacherId = (typeof PRIMARY_TEACHER_IDS)[number];

export type QualityCategory =
  | "photorealism"
  | "lipsync"
  | "animation"
  | "teaching"
  | "showcase";

export type RecoveryTaskStatus =
  | "blocked"
  | "pending"
  | "in_progress"
  | "passed"
  | "failed";

export type AcceptanceStatus = "ACCEPTED" | "REJECTED";

export interface QualityEvidence {
  id: string;
  type: "image" | "video" | "audio" | "test-report" | "metric";
  url: string;
  createdAt: string;
  verified: boolean;
}

export interface QualityScore {
  category: QualityCategory;
  score: number;
  requiredScore: number;
  status: RecoveryTaskStatus;
  evidence: QualityEvidence[];
  failures: string[];
  updatedAt: string;
}

export interface RecoveryTask {
  id: string;
  teacherId: PrimaryTeacherId;
  category: QualityCategory;
  order: number;
  severity: "critical" | "high";
  dependency: QualityCategory | null;
  currentScore: number;
  requiredScore: number;
  status: RecoveryTaskStatus;
  nextAction: string;
  evidence: QualityEvidence[];
}

export interface PrimaryTeacher {
  id: PrimaryTeacherId;
  name: string;
  role: "GLOBAL_PRIMARY_HUMAN_TEACHER";
  active: true;
  canTeachAllSubjects: true;
  canTeachAllCurricula: true;
  canTeachAllCountries: true;
  quality: Record<QualityCategory, QualityScore>;
  recoveryPlan: RecoveryTask[];
  acceptanceStatus: AcceptanceStatus;
  version: number;
  lastTestAt: string | null;
}

export const REQUIRED_SCORE = 95;

export const RECOVERY_ORDER: readonly QualityCategory[] = [
  "photorealism",
  "lipsync",
  "animation",
  "teaching",
  "showcase",
] as const;

const CATEGORY_ACTIONS: Record<QualityCategory, string> = {
  photorealism:
    "Improve human facial anatomy, skin, eyes, hair, lighting and identity consistency.",
  lipsync:
    "Synchronize phonemes, visemes, jaw and mouth movement with Arabic and English audio.",
  animation:
    "Improve natural blinking, eye contact, gestures, breathing, posture and board interaction.",
  teaching:
    "Verify curriculum accuracy, explanation quality, worked examples and adaptive student interaction.",
  showcase:
    "Generate and verify a continuous 15-second teaching showcase without hidden defects.",
};

function createQualityScore(
  category: QualityCategory,
  score = 0,
): QualityScore {
  return {
    category,
    score,
    requiredScore: REQUIRED_SCORE,
    status: score >= REQUIRED_SCORE ? "passed" : "pending",
    evidence: [],
    failures: [],
    updatedAt: new Date().toISOString(),
  };
}

function createPrimaryTeacher(
  id: PrimaryTeacherId,
  name: string,
): PrimaryTeacher {
  const quality = Object.fromEntries(
    RECOVERY_ORDER.map((category) => [
      category,
      createQualityScore(category),
    ]),
  ) as Record<QualityCategory, QualityScore>;

  const teacher: PrimaryTeacher = {
    id,
    name,
    role: "GLOBAL_PRIMARY_HUMAN_TEACHER",
    active: true,
    canTeachAllSubjects: true,
    canTeachAllCurricula: true,
    canTeachAllCountries: true,
    quality,
    recoveryPlan: [],
    acceptanceStatus: "REJECTED",
    version: 1,
    lastTestAt: null,
  };

  teacher.recoveryPlan = buildRecoveryPlan(teacher);

  return teacher;
}

export const PRIMARY_TEACHERS: Record<PrimaryTeacherId, PrimaryTeacher> = {
  sara: createPrimaryTeacher("sara", "Sara"),
  ali: createPrimaryTeacher("ali", "Ali"),
};

/** Normalize sarah → sara; reject any other teacher id. */
export function normalizePrimaryTeacherId(teacherId: string): PrimaryTeacherId {
  const raw = teacherId.trim().toLowerCase();
  const id = raw === "sarah" ? "sara" : raw;
  assertPrimaryTeacher(id);
  return id;
}

export function assertPrimaryTeacher(
  teacherId: string,
): asserts teacherId is PrimaryTeacherId {
  const raw = teacherId.trim().toLowerCase();
  const id = raw === "sarah" ? "sara" : raw;
  if (!PRIMARY_TEACHER_IDS.includes(id as PrimaryTeacherId)) {
    throw new Error(
      `Teacher "${teacherId}" is not allowed. Success OS supports only Sara and Ali as permanent primary teachers.`,
    );
  }
}

export function buildRecoveryPlan(teacher: PrimaryTeacher): RecoveryTask[] {
  let previousCategory: QualityCategory | null = null;
  let previousPassed = true;

  const plan = RECOVERY_ORDER.map((category, index) => {
    const quality = teacher.quality[category];
    const categoryPassed = quality.score >= quality.requiredScore;

    let status: RecoveryTaskStatus;

    if (categoryPassed) {
      status = "passed";
    } else if (!previousPassed) {
      status = "blocked";
    } else {
      status = "pending";
    }

    const task: RecoveryTask = {
      id: `${teacher.id}-${category}-recovery`,
      teacherId: teacher.id,
      category,
      order: index + 1,
      severity: index < 2 ? "critical" : "high",
      dependency: previousCategory,
      currentScore: quality.score,
      requiredScore: quality.requiredScore,
      status,
      nextAction: CATEGORY_ACTIONS[category],
      evidence: quality.evidence,
    };

    previousCategory = category;
    previousPassed = previousPassed && categoryPassed;

    return task;
  });

  return plan;
}

export function updateTeacherScore(input: {
  teacherId: string;
  category: QualityCategory;
  score: number;
  failures?: string[];
  evidence?: QualityEvidence[];
}): PrimaryTeacher {
  const teacherId = normalizePrimaryTeacherId(input.teacherId);

  if (!Number.isFinite(input.score)) {
    throw new Error("Quality score must be a finite number.");
  }

  const normalizedScore = Math.max(0, Math.min(100, input.score));
  const teacher = PRIMARY_TEACHERS[teacherId];
  const currentQuality = teacher.quality[input.category];

  currentQuality.score = normalizedScore;
  currentQuality.failures = input.failures ?? [];
  currentQuality.evidence = input.evidence ?? currentQuality.evidence;
  currentQuality.status =
    normalizedScore >= currentQuality.requiredScore ? "passed" : "failed";
  currentQuality.updatedAt = new Date().toISOString();

  teacher.lastTestAt = new Date().toISOString();
  teacher.version += 1;

  applyRegressionLock(teacher);
  teacher.recoveryPlan = buildRecoveryPlan(teacher);
  teacher.acceptanceStatus = calculateAcceptanceStatus(teacher);

  return teacher;
}

export function startRecoveryTask(
  teacherId: string,
  category: QualityCategory,
): PrimaryTeacher {
  const id = normalizePrimaryTeacherId(teacherId);

  const teacher = PRIMARY_TEACHERS[id];
  const task = teacher.recoveryPlan.find((item) => item.category === category);

  if (!task) {
    throw new Error(`Recovery task "${category}" was not found.`);
  }

  if (task.status === "blocked") {
    throw new Error(
      `${category} is blocked until ${task.dependency} passes with a score of at least ${REQUIRED_SCORE}.`,
    );
  }

  if (task.status === "passed") {
    return teacher;
  }

  task.status = "in_progress";

  return teacher;
}

export function getActiveRecoveryTask(teacherId: string): RecoveryTask | null {
  const id = normalizePrimaryTeacherId(teacherId);

  const teacher = PRIMARY_TEACHERS[id];

  return (
    teacher.recoveryPlan.find(
      (task) =>
        task.status === "in_progress" ||
        task.status === "pending" ||
        task.status === "failed",
    ) ?? null
  );
}

export function calculateAcceptanceStatus(
  teacher: PrimaryTeacher,
): AcceptanceStatus {
  const allCategoriesPassed = RECOVERY_ORDER.every((category) => {
    const quality = teacher.quality[category];

    return (
      quality.score >= quality.requiredScore &&
      quality.status === "passed" &&
      quality.evidence.some((item) => item.verified)
    );
  });

  return allCategoriesPassed ? "ACCEPTED" : "REJECTED";
}

export function applyRegressionLock(teacher: PrimaryTeacher): void {
  for (const category of RECOVERY_ORDER) {
    const quality = teacher.quality[category];

    if (quality.score < REQUIRED_SCORE) {
      quality.status = "failed";
      teacher.acceptanceStatus = "REJECTED";
    }
  }
}

export function getRecoveryPlanResponse() {
  return PRIMARY_TEACHER_IDS.map((teacherId) => {
    const teacher = PRIMARY_TEACHERS[teacherId];
    const activeTask = getActiveRecoveryTask(teacherId);

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      role: teacher.role,
      acceptanceStatus: teacher.acceptanceStatus,
      version: teacher.version,
      lastTestAt: teacher.lastTestAt,
      activeRecoveryTask: activeTask,
      tasks: teacher.recoveryPlan,
      scores: RECOVERY_ORDER.map((category) => ({
        category,
        score: teacher.quality[category].score,
        requiredScore: teacher.quality[category].requiredScore,
        status: teacher.quality[category].status,
        failures: teacher.quality[category].failures,
        evidence: teacher.quality[category].evidence,
      })),
    };
  });
}

/**
 * Sync recovery engine scores from live Final Acceptance runtime metrics.
 * Showcase score is 100 only when the mandatory 15s file exists.
 */
export function syncTeacherFromAcceptanceRuntime(
  teacherId: string,
  runtime: {
    realismScore: number;
    teachingScore: number;
    animationScore: number;
    lipSyncScore: number;
    interactionScore: number;
    has15SecondShowcase: boolean;
    showcasePath?: string | null;
  },
): PrimaryTeacher {
  const id = normalizePrimaryTeacherId(teacherId);
  const now = new Date().toISOString();

  updateTeacherScore({
    teacherId: id,
    category: "photorealism",
    score: runtime.realismScore,
    failures:
      runtime.realismScore < REQUIRED_SCORE
        ? ["Photorealism below target"]
        : [],
    evidence: [
      {
        id: `${id}-photorealism-metric`,
        type: "metric",
        url: `/api/ai-teachers/final-acceptance?teacher=${id}`,
        createdAt: now,
        verified: false,
      },
    ],
  });

  updateTeacherScore({
    teacherId: id,
    category: "lipsync",
    score: runtime.lipSyncScore,
    failures:
      runtime.lipSyncScore < REQUIRED_SCORE ? ["Lip sync below target"] : [],
  });

  updateTeacherScore({
    teacherId: id,
    category: "animation",
    score: runtime.animationScore,
    failures:
      runtime.animationScore < REQUIRED_SCORE
        ? ["Animation quality below target"]
        : [],
  });

  const teachingScore = Math.min(
    runtime.teachingScore,
    runtime.interactionScore,
  );
  updateTeacherScore({
    teacherId: id,
    category: "teaching",
    score: teachingScore,
    failures:
      teachingScore < REQUIRED_SCORE
        ? ["Teaching / interaction quality below target"]
        : [],
  });

  updateTeacherScore({
    teacherId: id,
    category: "showcase",
    score: runtime.has15SecondShowcase ? 100 : 0,
    failures: runtime.has15SecondShowcase
      ? []
      : ["Missing mandatory 15-second showcase video"],
    evidence: runtime.has15SecondShowcase && runtime.showcasePath
      ? [
          {
            id: `${id}-showcase-15s`,
            type: "video",
            url: `/media/ai-teachers/${id}/showcase-15s.mp4`,
            createdAt: now,
            verified: false,
          },
        ]
      : [],
  });

  return PRIMARY_TEACHERS[id];
}
