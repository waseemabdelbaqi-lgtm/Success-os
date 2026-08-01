import { NextRequest } from "next/server";
import { z } from "zod";
import {
  adaptStudioSession,
  buildStudioLessonPlan,
  demoStudioPlan,
  lessonInputFromTexts,
} from "@/lib/digital-human-studio";
import type { StudioLessonPlan, StudentStudioEvent } from "@/types/digital-human-studio";

function ok(data: unknown, status = 200) {
  return Response.json(
    { success: true, data, meta: { schema: "success-os.digital-human-studio.v1" } },
    { status },
  );
}

function fail(message: string, status = 400) {
  return Response.json({ success: false, error: { message } }, { status });
}

const planSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().min(1),
  titleAr: z.string().optional(),
  subject: z.string().optional(),
  grade: z.string().optional(),
  texts: z.array(z.string()).default([]),
  preferredTeacherId: z.enum(["sara", "ali"]).optional(),
  studentLevel: z.enum(["below", "on", "above"]).optional(),
  provider: z.enum(["local_photoreal_studio", "heygen", "tavus"]).optional(),
});

const adaptSchema = z.object({
  plan: z.custom<StudioLessonPlan>(),
  sceneIndex: z.number().int().min(0),
  event: z.custom<StudentStudioEvent>(),
});

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || "demo";
  const teacher = (req.nextUrl.searchParams.get("teacher") || "sara") as "sara" | "ali";

  if (action === "status") {
    return ok({
      role: "digital_human_studio_engine",
      teachers: ["sara", "ali"],
      providers: ["local_photoreal_studio", "heygen", "tavus"],
      scalable: true,
      autoCastOnLessonOpen: true,
    });
  }

  if (action === "demo") {
    return ok(demoStudioPlan(teacher === "ali" ? "ali" : "sara"));
  }

  return fail("Unknown action. Use action=status|demo");
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || "plan";
  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid JSON body");

  if (action === "plan") {
    const parsed = planSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.message);
    const heygenConfigured = Boolean(
      process.env.HEYGEN_API_KEY &&
        (process.env.HEYGEN_AVATAR_ID_SARA || process.env.HEYGEN_AVATAR_ID),
    );
    const input = lessonInputFromTexts({
      lessonId: parsed.data.lessonId,
      title: parsed.data.title,
      titleAr: parsed.data.titleAr,
      subject: parsed.data.subject,
      grade: parsed.data.grade,
      texts: parsed.data.texts.length ? parsed.data.texts : [parsed.data.title],
      preferredTeacherId: parsed.data.preferredTeacherId,
    });
    input.studentLevel = parsed.data.studentLevel;
    const plan = buildStudioLessonPlan({
      input,
      provider: parsed.data.provider || "local_photoreal_studio",
      heygenConfigured,
    });
    return ok(plan);
  }

  if (action === "adapt") {
    const parsed = adaptSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.message);
    return ok(
      adaptStudioSession(parsed.data.plan, parsed.data.event, parsed.data.sceneIndex),
    );
  }

  return fail("Unknown action. Use action=plan|adapt");
}
