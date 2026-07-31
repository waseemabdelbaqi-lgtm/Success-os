import type { ZodError } from "zod";
import { z } from "zod";
import {
  educationIntelligenceCoreStatus,
  getEducationIntelligenceCoreSnapshot,
  getOrCreateLearningDna,
  processEducationalInteraction,
  runEducationIntelligenceDemo,
} from "@/lib/education-intelligence-core";
import { withApiHandler, jsonResponse } from "@/lib/api/handler";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/response";
import { AppError } from "@/lib/logger";
import {
  requireAtePermission,
  ATE_PLATFORM_PERMISSIONS,
} from "@/lib/ai-teacher-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const localeSchema = z.object({ en: z.string(), ar: z.string() });

const interactionSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().optional(),
  utterance: z.string().optional(),
  focusLessonId: z.string().optional(),
  focusConceptLabel: localeSchema.optional(),
  prerequisiteSkillId: z.string().nullable().optional(),
  weakSkillIds: z.array(z.string()).optional(),
  strongSkillIds: z.array(z.string()).optional(),
  completedLessonIds: z.array(z.string()).optional(),
  language: z.string().optional(),
  currentGoals: z.array(z.string()).optional(),
});

function validationError(error: ZodError) {
  return jsonResponse(
    createErrorResponse("VALIDATION_ERROR", "Invalid EIC request", {
      issues: error.flatten(),
    }),
    422,
  );
}

export const GET = withApiHandler(async (req: Request) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";

  if (action === "status") {
    return jsonResponse(createSuccessResponse(educationIntelligenceCoreStatus()));
  }

  if (action === "snapshot" || action === "architecture") {
    return jsonResponse(
      createSuccessResponse({
        snapshot: getEducationIntelligenceCoreSnapshot(),
        note: "Education Intelligence Core — Learning DNA + adaptive teacher intelligence",
      }),
    );
  }

  if (action === "demo") {
    const result = runEducationIntelligenceDemo({
      studentId: url.searchParams.get("studentId") || undefined,
      studentName: url.searchParams.get("studentName") || undefined,
      utterance: url.searchParams.get("utterance") || undefined,
      focusLessonId: url.searchParams.get("focusLessonId") || undefined,
      prerequisiteSkillId:
        url.searchParams.get("prerequisiteSkillId") || undefined,
    });
    return jsonResponse(createSuccessResponse(result));
  }

  if (action === "dna") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.MEMORY_READ);
    const studentId = url.searchParams.get("studentId");
    if (!studentId) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "studentId is required",
        statusCode: 422,
      });
    }
    const dna = getOrCreateLearningDna(
      studentId,
      url.searchParams.get("studentName") || undefined,
    );
    return jsonResponse(createSuccessResponse({ dna }));
  }

  return jsonResponse(
    createErrorResponse("VALIDATION_ERROR", "Unknown action", { action }),
    400,
  );
});

export const POST = withApiHandler(async (req: Request) => {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Request body must be valid JSON",
      statusCode: 422,
    });
  }

  const action = String(body.action || "interact");

  if (action === "interact" || action === "process") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.SESSION_CHAT);
    const parsed = interactionSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const result = processEducationalInteraction(parsed.data);
    return jsonResponse(createSuccessResponse({ result }));
  }

  if (action === "demo") {
    const result = runEducationIntelligenceDemo({
      studentId: typeof body.studentId === "string" ? body.studentId : undefined,
      studentName:
        typeof body.studentName === "string" ? body.studentName : undefined,
      utterance: typeof body.utterance === "string" ? body.utterance : undefined,
    });
    return jsonResponse(createSuccessResponse(result));
  }

  return jsonResponse(
    createErrorResponse("VALIDATION_ERROR", "Unknown action", { action }),
    400,
  );
});
