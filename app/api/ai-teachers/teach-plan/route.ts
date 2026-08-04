import { NextResponse } from "next/server";
import {
  buildProofLessonInput,
  getProofLessonMeta,
  planLessonForTeacher,
  analyzeScriptedLesson,
  resolveTeachablePackage,
} from "@/lib/human-engine";

export const dynamic = "force-dynamic";

/**
 * Pre-lesson analysis → dynamic teaching plan.
 * Understand content first; Human Engine delivery second.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId") === "ali" ? "ali" : "sara";
  const proofId = searchParams.get("proofId");
  const packageId = searchParams.get("packageId");
  const level =
    searchParams.get("level") === "below" || searchParams.get("level") === "above"
      ? searchParams.get("level")
      : "on";

  try {
    if (proofId) {
      const meta = getProofLessonMeta(proofId);
      const input = buildProofLessonInput(proofId, teacherId);
      const plan = analyzeScriptedLesson({
        teacherId,
        subject: meta.subject,
        title: meta.titleAr || meta.title,
        lines: input.blocks.map((b) => b.text),
        student: { level: level as "below" | "on" | "above" },
      });
      return NextResponse.json({ success: true, plan });
    }

    if (packageId) {
      const pkg = resolveTeachablePackage({ packageId });
      const plan = planLessonForTeacher({
        pkg,
        teacherId,
        studentLevel: level as "below" | "on" | "above",
      });
      return NextResponse.json({ success: true, plan });
    }

    return NextResponse.json(
      { error: "Provide proofId or packageId" },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PLAN_FAILED" },
      { status: 500 },
    );
  }
}
