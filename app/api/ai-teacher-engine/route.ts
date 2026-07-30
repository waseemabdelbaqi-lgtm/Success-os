import { NextResponse } from "next/server";
import {
  aiTeacherEngineStatus,
  getAiTeacherEngineSnapshot,
  getAtePermissionsForRole,
  getOrCreateStudentMemory,
  resetStudentMemoryStore,
  runAiTeacherEngineDemo,
  runAiTeacherTurn,
  upsertStudentMemory,
} from "@/lib/ai-teacher-engine";
import { USER_ROLES, type UserRole } from "@/types/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AI Teacher Engine API — architecture, memory, orchestration.
 * Never builds avatars, animations, AI videos, or live classrooms.
 * Never invents curriculum facts.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";

  if (action === "status") {
    return NextResponse.json({ ok: true, ...aiTeacherEngineStatus() });
  }

  if (action === "snapshot" || action === "architecture") {
    const snapshot = getAiTeacherEngineSnapshot();
    return NextResponse.json({
      ok: true,
      snapshot,
      note: pathNote(),
    });
  }

  if (action === "demo") {
    const result = runAiTeacherEngineDemo({
      studentId: url.searchParams.get("studentId") || undefined,
      studentName: url.searchParams.get("studentName") || undefined,
      utterance: url.searchParams.get("utterance") || undefined,
      focusLessonId: url.searchParams.get("focusLessonId") || undefined,
    });
    return NextResponse.json({
      ...result,
      ok: result.ok,
      note: pathNote(),
    });
  }

  if (action === "chat" || action === "session" || action === "turn") {
    const turn = runAiTeacherTurn({
      studentId: url.searchParams.get("studentId") || "student_demo_001",
      studentName: url.searchParams.get("studentName") || "Ahmad",
      countryId: url.searchParams.get("countryId") || "JO",
      curriculumId: url.searchParams.get("curriculumId") || "JO-NATIONAL",
      gradeId: url.searchParams.get("gradeId") || "GRD-00001",
      subjectGlobalId: url.searchParams.get("subjectGlobalId") || "SUB-00001",
      focusLessonId:
        url.searchParams.get("focusLessonId") ||
        "JO-NATIONAL-G01-MATH-B01-U01-L01",
      language: (url.searchParams.get("language") as "ar" | "en") || "en",
      utterance:
        url.searchParams.get("utterance") || "Help me with this lesson",
      teachingStyle:
        (url.searchParams.get("teachingStyle") as
          | "direct"
          | "socratic"
          | "example_first"
          | "visual"
          | "step_by_step"
          | "story"
          | "simplified") || undefined,
      sessionId: url.searchParams.get("sessionId") || undefined,
    });
    return NextResponse.json({
      ok: true,
      turn,
      note: "Grounded teaching turn — ILE package referenced; no AI media generated",
    });
  }

  if (action === "memory") {
    const studentId = url.searchParams.get("studentId") || "student_demo_001";
    const memory = getOrCreateStudentMemory(studentId, {
      studentName: url.searchParams.get("studentName") || undefined,
    });
    return NextResponse.json({ ok: true, memory });
  }

  if (action === "recommend") {
    const turn = runAiTeacherTurn({
      studentId: url.searchParams.get("studentId") || "student_demo_001",
      studentName: url.searchParams.get("studentName") || "Ahmad",
      curriculumId: url.searchParams.get("curriculumId") || "JO-NATIONAL",
      focusLessonId:
        url.searchParams.get("focusLessonId") ||
        "JO-NATIONAL-G01-MATH-B01-U01-L01",
      utterance: url.searchParams.get("utterance") || "Recommend a lesson",
      language: "en",
    });
    return NextResponse.json({
      ok: true,
      recommendations: turn.recommendations,
      ilePackageId: turn.ilePackageId,
      note: "Lesson-aware recommendations; books/videos/quizzes may be reserved",
    });
  }

  if (action === "permissions") {
    const role = (url.searchParams.get("role") || USER_ROLES.STUDENT) as UserRole;
    return NextResponse.json({
      ok: true,
      role,
      permissions: getAtePermissionsForRole(role),
    });
  }

  if (action === "voice") {
    const snapshot = getAiTeacherEngineSnapshot();
    return NextResponse.json({ ok: true, voice: snapshot.voice });
  }

  if (action === "whiteboard") {
    const snapshot = getAiTeacherEngineSnapshot();
    return NextResponse.json({ ok: true, whiteboard: snapshot.whiteboard });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

function pathNote() {
  return "Student → AI Teacher → Conversation → Reasoning → Student Memory → Knowledge Graph → Curriculum Registry → ILE → Digital Books → Videos → Assessments";
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const action = String(body.action || "");

  if (action === "chat" || action === "turn" || action === "run") {
    const turn = runAiTeacherTurn({
      studentId:
        typeof body.studentId === "string" ? body.studentId : "student_demo_001",
      studentName:
        typeof body.studentName === "string" ? body.studentName : "Ahmad",
      countryId: typeof body.countryId === "string" ? body.countryId : "JO",
      curriculumId:
        typeof body.curriculumId === "string" ? body.curriculumId : "JO-NATIONAL",
      gradeId: typeof body.gradeId === "string" ? body.gradeId : "GRD-00001",
      subjectGlobalId:
        typeof body.subjectGlobalId === "string"
          ? body.subjectGlobalId
          : "SUB-00001",
      focusLessonId:
        typeof body.focusLessonId === "string"
          ? body.focusLessonId
          : "JO-NATIONAL-G01-MATH-B01-U01-L01",
      language: body.language === "ar" ? "ar" : "en",
      utterance:
        typeof body.utterance === "string"
          ? body.utterance
          : "I don't understand this.",
      sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
    });
    return NextResponse.json({
      ok: true,
      turn,
      note: "ATE teaching turn — grounded, no avatars/animations/AI videos",
    });
  }

  if (action === "memory:write" || action === "memory") {
    const studentId =
      typeof body.studentId === "string" ? body.studentId : "student_demo_001";
    const memory = upsertStudentMemory({
      studentId,
      studentName:
        typeof body.studentName === "string" ? body.studentName : undefined,
      preferredLanguage:
        typeof body.preferredLanguage === "string"
          ? body.preferredLanguage
          : undefined,
      currentCurriculumId:
        typeof body.currentCurriculumId === "string"
          ? body.currentCurriculumId
          : undefined,
      gradeId: typeof body.gradeId === "string" ? body.gradeId : undefined,
      learningPace:
        body.learningPace === "slow" ||
        body.learningPace === "normal" ||
        body.learningPace === "fast"
          ? body.learningPace
          : undefined,
      learningStyle:
        typeof body.learningStyle === "string"
          ? (body.learningStyle as
              | "visual"
              | "auditory"
              | "kinesthetic"
              | "reading_writing"
              | "mixed")
          : undefined,
      learningGoals: Array.isArray(body.learningGoals)
        ? body.learningGoals.filter((g): g is string => typeof g === "string")
        : undefined,
      weakSkillIds: Array.isArray(body.weakSkillIds)
        ? body.weakSkillIds.filter((g): g is string => typeof g === "string")
        : undefined,
      strongSkillIds: Array.isArray(body.strongSkillIds)
        ? body.strongSkillIds.filter((g): g is string => typeof g === "string")
        : undefined,
    });
    return NextResponse.json({ ok: true, memory });
  }

  if (action === "memory:reset") {
    resetStudentMemoryStore();
    return NextResponse.json({ ok: true, reset: true });
  }

  if (action === "demo") {
    const result = runAiTeacherEngineDemo({
      studentId: typeof body.studentId === "string" ? body.studentId : undefined,
      studentName:
        typeof body.studentName === "string" ? body.studentName : undefined,
      utterance: typeof body.utterance === "string" ? body.utterance : undefined,
      focusLessonId:
        typeof body.focusLessonId === "string" ? body.focusLessonId : undefined,
    });
    return NextResponse.json({ ...result, ok: result.ok });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
