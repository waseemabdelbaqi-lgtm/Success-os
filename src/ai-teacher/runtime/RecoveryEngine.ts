/* ==========================================================
   SUCCESS OS
   HUMAN TEACHER RECOVERY ENGINE
   Sara & Ali
========================================================== */

import {
  type AcceptanceFailure,
  buildRecoveryPlan,
  buildTeacherRecoveryPlan,
  type RecoveryTask,
} from "./recovery-plan";
import type { FinalAcceptanceRuntime } from "./acceptance-runtime";

export class RecoveryEngine {
  private teacher: "sara" | "ali";

  private tasks: RecoveryTask[] = [];

  constructor(teacher: "sara" | "ali") {
    this.teacher = teacher;
  }

  recover(failure: AcceptanceFailure) {
    this.tasks = buildRecoveryPlan(failure);

    console.log("======================================");
    console.log(" HUMAN TEACHER RECOVERY STARTED");
    console.log(" Teacher:", this.teacher);
    console.log("======================================");

    this.tasks.forEach((task) => {
      console.log(`[${task.priority}] ${task.title}`);
    });

    return this.tasks;
  }

  /** Build + start recovery from live Final Acceptance runtime metrics. */
  recoverFromRuntime(runtime: FinalAcceptanceRuntime) {
    const { failure, tasks } = buildTeacherRecoveryPlan(this.teacher, runtime);
    this.recover(failure);
    return { failure, tasks: this.tasks.length ? this.tasks : tasks };
  }

  nextTask(): RecoveryTask | null {
    const next = this.tasks.find((t) => !t.completed);

    return next ?? null;
  }

  complete(priority: number) {
    const task = this.tasks.find((t) => t.priority === priority);

    if (task) {
      task.completed = true;

      console.log(`✔ ${task.title}`);
    }
  }

  isRecovered(): boolean {
    return this.tasks.length > 0 && this.tasks.every((t) => t.completed);
  }

  getTasks(): RecoveryTask[] {
    return [...this.tasks];
  }

  getTeacher(): "sara" | "ali" {
    return this.teacher;
  }
}
