import { NextResponse } from "next/server";
import {
  getStudentAiLearningStackSnapshot,
  runStudentAiLearningStackDemo,
  runStudentLearningStack,
  studentAiLearningStackStatus,
} from "@/lib/student-ai-learning-stack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Student AI Learning Stack API — orchestration only.
 * Never generates lessons, videos, quizzes, or assessments.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";

  if (action === "status") {
    return NextResponse.json({ ok: true, ...studentAiLearningStackStatus() });
  }

  if (action === "snapshot" || action === "stack") {
    const snapshot = getStudentAiLearningStackSnapshot();
    return NextResponse.json({
      ok: true,
      snapshot,
      note: "Student → AI Teacher → … → Assessments — orchestration contract",
    });
  }

  if (action === "plan" || action === "session") {
    const plan = runStudentLearningStack({
      studentId: url.searchParams.get("studentId") || "student_demo_001",
      countryId: url.searchParams.get("countryId") || "JO",
      curriculumId: url.searchParams.get("curriculumId") || "JO-NATIONAL",
      subjectGlobalId: url.searchParams.get("subjectGlobalId") || "SUB-00001",
      focusLessonId:
        url.searchParams.get("focusLessonId") ||
        "JO-NATIONAL-G01-MATH-B01-U01-L01",
      language: (url.searchParams.get("language") as "ar" | "en") || "en",
      utterance: url.searchParams.get("utterance") || "Help me with this lesson",
    });
    return NextResponse.json({
      ok: true,
      plan,
      note: "Session plan only — ILE package referenced; no AI content generated",
    });
  }

  if (action === "demo") {
    const result = runStudentAiLearningStackDemo({
      studentId: url.searchParams.get("studentId") || undefined,
      utterance: url.searchParams.get("utterance") || undefined,
      focusLessonId: url.searchParams.get("focusLessonId") || undefined,
    });
    return NextResponse.json({
      ok: result.ok,
      ...result,
      note: snapshotNote(),
    });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

function snapshotNote() {
  return "Student → AI Teacher → Conversation → Reasoning → Knowledge Graph → Digital Books → Videos → ILE → Quizzes → Assessments";
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const action = String(body.action || "");

  if (action === "run" || action === "run-stack") {
    const result = runStudentAiLearningStackDemo({
      studentId: typeof body.studentId === "string" ? body.studentId : undefined,
      utterance: typeof body.utterance === "string" ? body.utterance : undefined,
      focusLessonId:
        typeof body.focusLessonId === "string" ? body.focusLessonId : undefined,
    });
    return NextResponse.json({
      ok: result.ok,
      note: "Student AI Learning Stack demo — orchestration only",
      result,
    });
  }

  if (action === "plan") {
    const plan = runStudentLearningStack({
      studentId: typeof body.studentId === "string" ? body.studentId : "student_demo_001",
      countryId: typeof body.countryId === "string" ? body.countryId : "JO",
      curriculumId:
        typeof body.curriculumId === "string" ? body.curriculumId : "JO-NATIONAL",
      subjectGlobalId:
        typeof body.subjectGlobalId === "string" ? body.subjectGlobalId : "SUB-00001",
      focusLessonId:
        typeof body.focusLessonId === "string"
          ? body.focusLessonId
          : "JO-NATIONAL-G01-MATH-B01-U01-L01",
      language: body.language === "ar" ? "ar" : "en",
      utterance: typeof body.utterance === "string" ? body.utterance : undefined,
    });
    return NextResponse.json({ ok: true, plan });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
