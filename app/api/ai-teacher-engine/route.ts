import type { ZodError } from "zod";
import {
  aiTeacherEngineStatus,
  clearStudentMemory,
  getAiTeacherEngineSnapshot,
  getAtePermissionsForRole,
  getOrCreateStudentMemory,
  loadTeachingTurn,
  requireAtePermission,
  ATE_PLATFORM_PERMISSIONS,
  runAiTeacherEngineDemo,
  runAiTeacherTurn,
  upsertStudentMemory,
  getAteMetrics,
  ateDemoRequestSchema,
  ateMemoryWriteSchema,
  ateTurnRequestSchema,
  formatZodError,
  appendAteAudit,
} from "@/lib/ai-teacher-engine";
import { withApiHandler, jsonResponse } from "@/lib/api/handler";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/response";
import { AppError } from "@/lib/logger";
import { USER_ROLES, type UserRole } from "@/types/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pathNote() {
  return "Student → AI Teacher → Conversation → Reasoning → Student Memory → Knowledge Graph → Curriculum Registry → ILE → Digital Books → Videos → Assessments";
}

function validationError(error: ZodError) {
  return jsonResponse(
    createErrorResponse("VALIDATION_ERROR", "Invalid AI Teacher Engine request", {
      issues: formatZodError(error),
    }),
    422,
  );
}

export const GET = withApiHandler(async (req: Request) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";

  if (action === "status") {
    return jsonResponse(createSuccessResponse({ ...aiTeacherEngineStatus() }));
  }

  if (action === "snapshot" || action === "architecture") {
    return jsonResponse(
      createSuccessResponse({
        snapshot: getAiTeacherEngineSnapshot(),
        note: pathNote(),
      }),
    );
  }

  if (action === "metrics") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.ADMIN);
    return jsonResponse(createSuccessResponse({ metrics: getAteMetrics() }));
  }

  if (action === "demo") {
    const parsed = ateDemoRequestSchema.safeParse({
      studentId: url.searchParams.get("studentId") || undefined,
      studentName: url.searchParams.get("studentName") || undefined,
      utterance: url.searchParams.get("utterance") || undefined,
      focusLessonId: url.searchParams.get("focusLessonId") || undefined,
    });
    if (!parsed.success) return validationError(parsed.error);
    const result = runAiTeacherEngineDemo(parsed.data);
    return jsonResponse(
      createSuccessResponse({
        ...result,
        note: pathNote(),
      }),
    );
  }

  if (action === "chat" || action === "session" || action === "turn") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.SESSION_CHAT);
    const parsed = ateTurnRequestSchema.safeParse({
      studentId: url.searchParams.get("studentId"),
      studentName: url.searchParams.get("studentName") || undefined,
      countryId: url.searchParams.get("countryId"),
      curriculumId: url.searchParams.get("curriculumId"),
      gradeId: url.searchParams.get("gradeId") || undefined,
      subjectGlobalId: url.searchParams.get("subjectGlobalId") || undefined,
      focusLessonId: url.searchParams.get("focusLessonId"),
      language: url.searchParams.get("language") || undefined,
      utterance: url.searchParams.get("utterance"),
      teachingStyle: url.searchParams.get("teachingStyle") || undefined,
      sessionId: url.searchParams.get("sessionId") || undefined,
      demoMode: url.searchParams.get("demoMode") === "true",
    });
    if (!parsed.success) return validationError(parsed.error);
    const turn = runAiTeacherTurn(parsed.data);
    return jsonResponse(
      createSuccessResponse({
        turn,
        note: "Grounded teaching turn — durable session saved; no AI media generated",
      }),
    );
  }

  if (action === "memory") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.MEMORY_READ);
    const studentId = url.searchParams.get("studentId");
    if (!studentId) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "studentId is required",
        statusCode: 422,
      });
    }
    const memory = getOrCreateStudentMemory(studentId, {
      studentName: url.searchParams.get("studentName") || undefined,
    });
    return jsonResponse(createSuccessResponse({ memory }));
  }

  if (action === "session-record") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.MEMORY_READ);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "sessionId is required",
        statusCode: 422,
      });
    }
    const turn = loadTeachingTurn(sessionId);
    if (!turn) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Teaching turn session not found",
        statusCode: 404,
      });
    }
    return jsonResponse(createSuccessResponse({ turn }));
  }

  if (action === "recommend") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.RECOMMEND);
    const parsed = ateTurnRequestSchema.safeParse({
      studentId: url.searchParams.get("studentId"),
      studentName: url.searchParams.get("studentName") || undefined,
      countryId: url.searchParams.get("countryId"),
      curriculumId: url.searchParams.get("curriculumId"),
      focusLessonId: url.searchParams.get("focusLessonId"),
      utterance: url.searchParams.get("utterance") || "Recommend a lesson",
      language: "en",
      demoMode: url.searchParams.get("demoMode") === "true",
    });
    if (!parsed.success) return validationError(parsed.error);
    const turn = runAiTeacherTurn(parsed.data);
    return jsonResponse(
      createSuccessResponse({
        recommendations: turn.recommendations,
        ilePackageId: turn.ilePackageId,
        note: "Lesson-aware recommendations; books/videos/quizzes may be reserved",
      }),
    );
  }

  if (action === "permissions") {
    const role = (url.searchParams.get("role") || USER_ROLES.STUDENT) as UserRole;
    return jsonResponse(
      createSuccessResponse({
        role,
        permissions: getAtePermissionsForRole(role),
      }),
    );
  }

  if (action === "voice") {
    return jsonResponse(
      createSuccessResponse({ voice: getAiTeacherEngineSnapshot().voice }),
    );
  }

  if (action === "whiteboard") {
    return jsonResponse(
      createSuccessResponse({
        whiteboard: getAiTeacherEngineSnapshot().whiteboard,
      }),
    );
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

  if (action === "chat" || action === "turn" || action === "run") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.SESSION_CHAT);
    const parsed = ateTurnRequestSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const turn = runAiTeacherTurn(parsed.data);
    return jsonResponse(
      createSuccessResponse({
        turn,
        note: "ATE teaching turn — grounded, durable, no avatars/animations/AI videos",
      }),
    );
  }

  if (action === "memory:write" || action === "memory") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.MEMORY_WRITE);
    const parsed = ateMemoryWriteSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const memory = upsertStudentMemory(parsed.data);
    return jsonResponse(createSuccessResponse({ memory }));
  }

  if (action === "memory:clear") {
    await requireAtePermission(ATE_PLATFORM_PERMISSIONS.ADMIN);
    const studentId = typeof body.studentId === "string" ? body.studentId : "";
    if (!studentId) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "studentId is required to clear memory",
        statusCode: 422,
      });
    }
    const cleared = clearStudentMemory(studentId);
    appendAteAudit({
      kind: "memory.clear",
      studentId,
      ok: cleared,
    });
    return jsonResponse(createSuccessResponse({ cleared, studentId }));
  }

  if (action === "demo") {
    const parsed = ateDemoRequestSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const result = runAiTeacherEngineDemo(parsed.data);
    return jsonResponse(createSuccessResponse(result));
  }

  return jsonResponse(
    createErrorResponse("VALIDATION_ERROR", "Unknown action", { action }),
    400,
  );
});
