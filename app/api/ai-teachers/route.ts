import { NextResponse } from "next/server";
import { buildAiTeachersCatalog, getAiTeacher } from "@/lib/ai-teachers/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const teacher = getAiTeacher(id);
    if (!teacher) {
      return NextResponse.json({ error: "TEACHER_NOT_FOUND", id }, { status: 404 });
    }
    return NextResponse.json({ schema: "success-os.ai-teacher.v1", teacher });
  }
  return NextResponse.json(buildAiTeachersCatalog());
}
