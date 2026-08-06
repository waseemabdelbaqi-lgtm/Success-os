import { NextResponse } from "next/server";
import {
  buildCoreTeacherCatalog,
  getCoreTeacherProfile,
} from "@/lib/ai-teachers/core-profiles";

export const dynamic = "force-dynamic";

/** Core Entity TeacherProfile — Sara & Ali only. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const teacher = getCoreTeacherProfile(id);
    if (!teacher) {
      return NextResponse.json({ error: "TEACHER_NOT_FOUND", id }, { status: 404 });
    }
    return NextResponse.json({
      schema: "success-os.ai-teacher-profile.v1",
      teacher,
    });
  }
  return NextResponse.json(buildCoreTeacherCatalog());
}
