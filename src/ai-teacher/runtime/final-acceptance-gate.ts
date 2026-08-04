/* ==========================================================
   SUCCESS OS
   FINAL ACCEPTANCE GATE
   Sara & Ali
========================================================== */

export interface AcceptanceResult {
  passed: boolean;
  reason?: string;
}

export async function finalAcceptanceGate(
  teacher: "sara" | "ali",
  runtime: {
    realismScore: number;
    teachingScore: number;
    animationScore: number;
    lipSyncScore: number;
    interactionScore: number;
    has15SecondShowcase: boolean;
  },
): Promise<AcceptanceResult> {
  const MIN = 95;

  if (runtime.realismScore < MIN)
    return { passed: false, reason: "Photorealism below target" };

  if (runtime.teachingScore < MIN)
    return { passed: false, reason: "Teaching quality below target" };

  if (runtime.animationScore < MIN)
    return { passed: false, reason: "Animation quality below target" };

  if (runtime.lipSyncScore < MIN)
    return { passed: false, reason: "Lip sync below target" };

  if (runtime.interactionScore < MIN)
    return { passed: false, reason: "Interaction quality below target" };

  if (!runtime.has15SecondShowcase)
    return {
      passed: false,
      reason:
        "Missing mandatory 15-second showcase video demonstrating the teacher.",
    };

  console.log(`✅ ${teacher.toUpperCase()} accepted for production.`);

  return { passed: true };
}

export function assertFinalAcceptance(result: AcceptanceResult, teacher: "sara" | "ali") {
  if (!result.passed) {
    throw new Error(`
====================================================
 FINAL ACCEPTANCE GATE FAILED

 Teacher: ${teacher}
 Reason: ${result.reason || "unknown"}

 Sara & Ali are NOT accepted for production.

 Build FAILED.
====================================================
`);
  }
}
