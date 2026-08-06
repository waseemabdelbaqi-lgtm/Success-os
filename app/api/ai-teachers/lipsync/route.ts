/**
 * Lip Sync Engine API — Sara & Ali only.
 * Reports honest metric inspection; recovery task stays blocked until photorealism ≥95.
 */
import { NextResponse } from "next/server";
import {
  inspectCurrentTeacherLipSync,
  LIPSYNC_REQUIRED_SCORE,
  type TeacherId,
} from "@/src/lib/ai-teachers/lipsync-engine";
import {
  getActiveRecoveryTask,
  PRIMARY_TEACHERS,
} from "@/src/lib/ai-teachers/recovery-engine";

export const dynamic = "force-dynamic";

function asTeacherId(raw: string | null): TeacherId {
  return raw === "ali" ? "ali" : "sara";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const both = url.searchParams.get("both") === "1";

  try {
    if (both) {
      const sara = inspectCurrentTeacherLipSync("sara");
      const ali = inspectCurrentTeacherLipSync("ali");
      return NextResponse.json({
        success: true,
        engine: "lipsync-engine",
        requiredScore: LIPSYNC_REQUIRED_SCORE,
        teachers: { sara, ali },
        shipAllowed: sara.passed && ali.passed,
        note: "Lipsync recovery task remains blocked until photorealism ≥95.",
        recovery: {
          sara: {
            acceptanceStatus: PRIMARY_TEACHERS.sara.acceptanceStatus,
            active: getActiveRecoveryTask("sara"),
            lipsyncTask: PRIMARY_TEACHERS.sara.recoveryPlan.find(
              (t) => t.category === "lipsync",
            ),
          },
          ali: {
            acceptanceStatus: PRIMARY_TEACHERS.ali.acceptanceStatus,
            active: getActiveRecoveryTask("ali"),
            lipsyncTask: PRIMARY_TEACHERS.ali.recoveryPlan.find(
              (t) => t.category === "lipsync",
            ),
          },
        },
      });
    }

    const teacherId = asTeacherId(url.searchParams.get("teacher"));
    const inspection = inspectCurrentTeacherLipSync(teacherId);
    const teacher = PRIMARY_TEACHERS[teacherId];

    return NextResponse.json({
      success: true,
      engine: "lipsync-engine",
      requiredScore: LIPSYNC_REQUIRED_SCORE,
      inspection,
      shipAllowed: inspection.passed,
      note: "Lipsync recovery task remains blocked until photorealism ≥95.",
      recovery: {
        acceptanceStatus: teacher.acceptanceStatus,
        active: getActiveRecoveryTask(teacherId),
        lipsyncTask: teacher.recoveryPlan.find((t) => t.category === "lipsync"),
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "lipsync inspect failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      teacherId?: string;
      both?: boolean;
    };

    if (body.both) {
      const sara = inspectCurrentTeacherLipSync("sara");
      const ali = inspectCurrentTeacherLipSync("ali");
      return NextResponse.json({
        success: true,
        engine: "lipsync-engine",
        requiredScore: LIPSYNC_REQUIRED_SCORE,
        teachers: { sara, ali },
        shipAllowed: sara.passed && ali.passed,
      });
    }

    const teacherId = asTeacherId(body.teacherId ?? null);
    const inspection = inspectCurrentTeacherLipSync(teacherId);
    return NextResponse.json({
      success: true,
      engine: "lipsync-engine",
      requiredScore: LIPSYNC_REQUIRED_SCORE,
      inspection,
      shipAllowed: inspection.passed,
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "lipsync inspect failed",
      },
      { status: 400 },
    );
  }
}
