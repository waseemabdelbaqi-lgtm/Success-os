import type { ZodError } from "zod";
import { z } from "zod";
import {
  aiDigitalHumanTeacherStatus,
  getAiDigitalHumanTeacherSnapshot,
  invokeProviderPort,
  listTeacherProfiles,
  planDigitalTeacherSession,
  runAiDigitalHumanTeacherDemo,
  upsertTeacherProfile,
  updatePersonalityMemory,
} from "@/lib/ai-digital-human-teacher";
import { withApiHandler, jsonResponse } from "@/lib/api/handler";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/response";
import { AppError } from "@/lib/logger";
import { requireAtePermission, ATE_PLATFORM_PERMISSIONS } from "@/lib/ai-teacher-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const localeTextSchema = z.object({ en: z.string(), ar: z.string() });

const profileUpsertSchema = z.object({
  id: z.string().optional(),
  displayName: localeTextSchema,
  countryCode: z.string().min(2),
  localeCodes: z.array(z.string()).optional(),
  educationalStages: z
    .array(
      z.enum([
        "early_childhood",
        "elementary",
        "middle_school",
        "high_school",
        "university",
      ]),
    )
    .optional(),
  defaultTeachingStyle: z
    .enum([
      "direct",
      "socratic",
      "example_first",
      "visual",
      "step_by_step",
      "story",
      "simplified",
    ])
    .optional(),
  enabled: z.boolean().optional(),
  accentLabel: localeTextSchema.optional(),
  culturalStyleNotes: localeTextSchema.optional(),
  personalityTone: localeTextSchema.optional(),
  appearanceNotes: localeTextSchema.optional(),
  providerHints: z
    .object({
      ttsVoiceKey: z.string().optional(),
      digitalHumanPresetKey: z.string().optional(),
    })
    .optional(),
});

const sessionPlanSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().optional(),
  countryCode: z.string().optional(),
  educationalStage: z
    .enum([
      "early_childhood",
      "elementary",
      "middle_school",
      "high_school",
      "university",
    ])
    .optional(),
  teacherProfileId: z.string().optional(),
  language: z.string().optional(),
});

function validationError(error: ZodError) {
  return jsonResponse(
    createErrorResponse("VALIDATION_ERROR", "Invalid ADHT request", {
      issues: error.flatten(),
    }),
    422,
  );
}

export const GET = withApiHandler(async (req: Request) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";

  if (action === "status") {
    return jsonResponse(createSuccessResponse(aiDigitalHumanTeacherStatus()));
  }

  if (action === "snapshot" || action === "architecture") {
    return jsonResponse(
      createSuccessResponse({
        snapshot: getAiDigitalHumanTeacherSnapshot(),
        note: "Digital Human Teacher architecture — provider-agnostic; no live avatar video",
      }),
    );
  }

  if (action === "profiles") {
    return jsonResponse(
      createSuccessResponse({ profiles: listTeacherProfiles() }),
    );
  }

  if (action === "demo") {
    const result = runAiDigitalHumanTeacherDemo({
      studentId: url.searchParams.get("studentId") || undefined,
      studentName: url.searchParams.get("studentName") || undefined,
      countryCode: url.searchParams.get("countryCode") || undefined,
      educationalStage:
        (url.searchParams.get("educationalStage") as
          | "early_childhood"
          | "elementary"
          | "middle_school"
          | "high_school"
          | "university"
          | null) || undefined,
    });
    return jsonResponse(createSuccessResponse(result));
  }

  if (action === "session" || action === "plan") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.SESSION_START);
    const parsed = sessionPlanSchema.safeParse({
      studentId: url.searchParams.get("studentId"),
      studentName: url.searchParams.get("studentName") || undefined,
      countryCode: url.searchParams.get("countryCode") || undefined,
      educationalStage: url.searchParams.get("educationalStage") || undefined,
      teacherProfileId: url.searchParams.get("teacherProfileId") || undefined,
      language: url.searchParams.get("language") || undefined,
    });
    if (!parsed.success) return validationError(parsed.error);
    const plan = planDigitalTeacherSession(parsed.data);
    return jsonResponse(createSuccessResponse({ plan }));
  }

  if (action === "providers") {
    const snapshot = getAiDigitalHumanTeacherSnapshot();
    return jsonResponse(
      createSuccessResponse({ providers: snapshot.providers }),
    );
  }

  if (action === "invoke-provider") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.ADMIN);
    const port = url.searchParams.get("port") || "";
    const result = invokeProviderPort(port);
    return jsonResponse(createSuccessResponse(result));
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

  const action = String(body.action || "");

  if (action === "profile:upsert") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.ADMIN);
    const parsed = profileUpsertSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const profile = upsertTeacherProfile(parsed.data);
    return jsonResponse(createSuccessResponse({ profile }));
  }

  if (action === "session" || action === "plan") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.SESSION_START);
    const parsed = sessionPlanSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const plan = planDigitalTeacherSession(parsed.data);
    return jsonResponse(createSuccessResponse({ plan }));
  }

  if (action === "personality:update") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.MEMORY_WRITE);
    const studentId = typeof body.studentId === "string" ? body.studentId : "";
    if (!studentId) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "studentId is required",
        statusCode: 422,
      });
    }
    const personality = updatePersonalityMemory({
      studentId,
      studentName:
        typeof body.studentName === "string" ? body.studentName : undefined,
      preferredLanguage:
        typeof body.preferredLanguage === "string"
          ? body.preferredLanguage
          : undefined,
      preferredTeachingSpeed:
        body.preferredTeachingSpeed === "slow" ||
        body.preferredTeachingSpeed === "normal" ||
        body.preferredTeachingSpeed === "fast"
          ? body.preferredTeachingSpeed
          : undefined,
      preferredExamples: Array.isArray(body.preferredExamples)
        ? body.preferredExamples.filter((x): x is string => typeof x === "string")
        : undefined,
      favoriteSubjectIds: Array.isArray(body.favoriteSubjectIds)
        ? body.favoriteSubjectIds.filter((x): x is string => typeof x === "string")
        : undefined,
      learningGoals: Array.isArray(body.learningGoals)
        ? body.learningGoals.filter((x): x is string => typeof x === "string")
        : undefined,
    });
    return jsonResponse(createSuccessResponse({ personality }));
  }

  if (action === "demo") {
    const result = runAiDigitalHumanTeacherDemo({
      studentId: typeof body.studentId === "string" ? body.studentId : undefined,
      studentName:
        typeof body.studentName === "string" ? body.studentName : undefined,
      countryCode:
        typeof body.countryCode === "string" ? body.countryCode : undefined,
    });
    return jsonResponse(createSuccessResponse(result));
  }

  return jsonResponse(
    createErrorResponse("VALIDATION_ERROR", "Unknown action", { action }),
    400,
  );
});
