/**
 * Whiteboard Mode — architecture-ready contract (no drawing UI).
 */
import type { WhiteboardSessionContract } from "@/types/ai-teacher-engine";

export function getWhiteboardSessionContract(
  enabled = true,
): WhiteboardSessionContract {
  return {
    schema: "success-os.ate-whiteboard.v1",
    enabled,
    canDrawDiagrams: true,
    canWriteEquations: true,
    canHighlightTextbook: true,
    canAnimateExplanations: true,
    canPointToFigures: true,
    canSolveStepByStep: true,
    implementationStatus: "ready_architecture",
    notes: [
      "Diagrams, equations, textbook highlights, animated explanations, figure pointing, step-by-step solve.",
      "No animation system or live whiteboard UI in PR #55.",
    ],
  };
}
