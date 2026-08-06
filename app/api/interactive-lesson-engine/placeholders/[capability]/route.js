/**
 * Future capability placeholder endpoints — locked in foundation phase.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAP = {
  "ai-teacher-video": "ai_teacher_video",
  "human-recorded": "human_recorded_lesson",
  "voice-narration": "voice_narration",
  simulations: "interactive_simulations",
  "virtual-labs": "virtual_labs",
  adaptive: "adaptive_learning",
  "quiz-engine": "quiz_engine",
  "unit-tests": "unit_tests",
  "final-exams": "final_exams",
};

export async function GET(_request, context) {
  const params = await context.params;
  const capability = MAP[params.capability] || params.capability;
  return Response.json({
    ok: true,
    capability,
    status: "placeholder",
    phase: "foundation",
    ready: false,
    message:
      "Placeholder only. Do not generate AI videos or import curricula in this phase.",
  });
}

export async function POST(_request, context) {
  const params = await context.params;
  return Response.json(
    {
      ok: false,
      error: "PHASE_LOCKED",
      capability: params.capability,
      message: "Future capability not enabled in foundation phase.",
    },
    { status: 403 },
  );
}
