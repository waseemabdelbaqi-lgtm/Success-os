/**
 * Photorealism Engine API — Sara & Ali only.
 * Reports honest metric inspection; does not unlock teachers that fail ≥95.
 */
import { NextResponse } from "next/server";
import {
  inspectCurrentTeacherPhotorealism,
  PHOTOREALISM_REQUIRED_SCORE,
  type TeacherId,
} from "@/src/lib/ai-teachers/photorealism-engine";
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
      const sara = inspectCurrentTeacherPhotorealism("sara");
      const ali = inspectCurrentTeacherPhotorealism("ali");
      return NextResponse.json({
        success: true,
        engine: "photorealism-engine",
        requiredScore: PHOTOREALISM_REQUIRED_SCORE,
        teachers: { sara, ali },
        shipAllowed: sara.passed && ali.passed,
        recovery: {
          sara: {
            acceptanceStatus: PRIMARY_TEACHERS.sara.acceptanceStatus,
            active: getActiveRecoveryTask("sara"),
          },
          ali: {
            acceptanceStatus: PRIMARY_TEACHERS.ali.acceptanceStatus,
            active: getActiveRecoveryTask("ali"),
          },
        },
      });
    }

    const teacherId = asTeacherId(url.searchParams.get("teacher"));
    const inspection = inspectCurrentTeacherPhotorealism(teacherId);
    const teacher = PRIMARY_TEACHERS[teacherId];

    return NextResponse.json({
      success: true,
      engine: "photorealism-engine",
      requiredScore: PHOTOREALISM_REQUIRED_SCORE,
      inspection,
      shipAllowed: inspection.passed,
      recovery: {
        acceptanceStatus: teacher.acceptanceStatus,
        active: getActiveRecoveryTask(teacherId),
        photorealismTask: teacher.recoveryPlan.find(
          (t) => t.category === "photorealism",
        ),
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "photorealism inspect failed",
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
      const sara = inspectCurrentTeacherPhotorealism("sara");
      const ali = inspectCurrentTeacherPhotorealism("ali");
      return NextResponse.json({
        success: true,
        engine: "photorealism-engine",
        requiredScore: PHOTOREALISM_REQUIRED_SCORE,
        teachers: { sara, ali },
        shipAllowed: sara.passed && ali.passed,
      });
    }

    const teacherId = asTeacherId(body.teacherId ?? null);
    const inspection = inspectCurrentTeacherPhotorealism(teacherId);
    return NextResponse.json({
      success: true,
      engine: "photorealism-engine",
      requiredScore: PHOTOREALISM_REQUIRED_SCORE,
      inspection,
      shipAllowed: inspection.passed,
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "photorealism inspect failed",
      },
      { status: 400 },
    );
  }
}
