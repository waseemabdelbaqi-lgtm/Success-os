/**
 * Human Teacher Quality Gate API — Sara & Ali only.
 * Does NOT unlock teachers that fail; reports honest metrics.
 */
import { NextResponse } from "next/server";
import { probeTeacherQuality } from "@/src/ai-teacher/runtime";
import { HUMAN_TEACHER_QUALITY_MIN } from "@/src/ai-teacher/runtime/quality-gate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("teacher") === "ali" ? "ali" : "sara";
  const both = url.searchParams.get("both") === "1";

  try {
    if (both) {
      const sara = await probeTeacherQuality("sara");
      const ali = await probeTeacherQuality("ali");
      return NextResponse.json({
        success: true,
        min: HUMAN_TEACHER_QUALITY_MIN,
        teachers: { sara, ali },
        shipAllowed: sara.status === "READY" && ali.status === "READY",
      });
    }

    const probe = await probeTeacherQuality(id);
    return NextResponse.json({
      success: true,
      min: HUMAN_TEACHER_QUALITY_MIN,
      ...probe,
      shipAllowed: probe.status === "READY",
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "quality probe failed",
      },
      { status: 500 },
    );
  }
}
