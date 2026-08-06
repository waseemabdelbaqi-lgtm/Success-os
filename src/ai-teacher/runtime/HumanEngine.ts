import { startTeacherSession } from "./bootstrap-teacher";
import type { HumanTeacherMetrics } from "./quality-gate";
import type { HumanTeacherTeachResult } from "@/lib/human-teacher-engine/types";
import {
  assertFinalAcceptance,
  finalAcceptanceGate,
} from "./final-acceptance-gate";
import { buildAcceptanceRuntime } from "./acceptance-runtime";
import { RecoveryEngine } from "./RecoveryEngine";
import type { RecoveryTask } from "./recovery-plan";

export class HumanEngine {
  private teacherId: "sara" | "ali";

  private initialized = false;

  private session: {
    teacher: "sara" | "ali";
    metrics: HumanTeacherMetrics;
    status: "READY";
  } | null = null;

  private activeLesson: {
    lessonId: string;
    teacher: "sara" | "ali";
    status: "RUNNING";
    taught?: HumanTeacherTeachResult;
  } | null = null;

  private recovery: RecoveryEngine;

  constructor(id: "sara" | "ali") {
    this.teacherId = id;
    this.recovery = new RecoveryEngine(id);
  }

  async initialize() {
    // لا يبدأ أي معلم قبل اجتياز Quality Gate
    const session = await startTeacherSession(this.teacherId);

    // ثم بوابة القبول النهائي للإنتاج (تشمل فيديو 15 ثانية إلزامي)
    const runtime = buildAcceptanceRuntime(session.metrics);
    const acceptance = await finalAcceptanceGate(this.teacherId, runtime);

    if (!acceptance.passed) {
      // Start ordered recovery — next active task is photorealism while REJECTED.
      this.recovery.recoverFromRuntime(runtime);
    }

    assertFinalAcceptance(acceptance, this.teacherId);

    this.session = session;
    this.initialized = true;

    console.log(`🎓 ${session.teacher.toUpperCase()} HUMAN ENGINE READY`);

    return session;
  }

  /** Expose session RecoveryEngine (photorealism → … → showcase). */
  getRecoveryEngine(): RecoveryEngine {
    return this.recovery;
  }

  nextRecoveryTask(): RecoveryTask | null {
    return this.recovery.nextTask();
  }

  isRecovered(): boolean {
    return this.recovery.isRecovered();
  }

  async startLesson(lessonId: string) {
    if (!this.initialized) {
      throw new Error("HumanEngine not initialized. Call initialize() first.");
    }

    console.log(`📖 Starting lesson: ${lessonId}`);

    const { teachHumanLesson } = await import("@/lib/human-teacher-engine");
    const { buildProofLessonInput, getProofLessonMeta } = await import(
      "@/lib/human-engine"
    );

    let taught: HumanTeacherTeachResult;
    try {
      const meta = getProofLessonMeta(lessonId);
      const input = buildProofLessonInput(lessonId, this.teacherId);
      taught = teachHumanLesson({
        input,
        teacherId: this.teacherId,
        targetDurationMs: Math.max(65_000, meta.minDurationMs),
      });
    } catch {
      taught = teachHumanLesson({
        teacherId: this.teacherId,
        targetDurationMs: 65_000,
        input: {
          lessonId,
          title: lessonId,
          titleAr: lessonId,
          subject: "general",
          blocks: [
            {
              id: "explain",
              kind: "explain",
              text: "نبدأ الشرح خطوة بخطوة",
            },
            {
              id: "board",
              kind: "explain",
              text: "اكتبوا معي على السبورة الفكرة الأساسية",
            },
            {
              id: "check",
              kind: "check",
              text: "سؤال سريع للتأكد من الفهم",
            },
          ],
        },
      });
    }

    this.activeLesson = {
      lessonId,
      teacher: this.teacherId,
      status: "RUNNING",
      taught,
    };

    return {
      lessonId,
      teacher: this.teacherId,
      status: "RUNNING" as const,
      planId: taught.plan.planId,
      durationMs: taught.plan.timeline.durationMs,
      studio: taught.brief.studio.id,
      qualityGates: taught.qualityGates,
    };
  }

  async finishLesson() {
    console.log("✅ Lesson finished.");
    this.activeLesson = null;
    return true;
  }

  getTeacherId() {
    return this.teacherId;
  }

  isReady() {
    return this.initialized;
  }

  getSession() {
    return this.session;
  }

  getActiveLesson() {
    return this.activeLesson;
  }
}
