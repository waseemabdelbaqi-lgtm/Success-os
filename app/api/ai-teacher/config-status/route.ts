import { NextResponse } from "next/server";
import { validateConfiguration } from "@/lib/ai-teacher/providers";

export const runtime = "nodejs";

export async function GET() {
  // Booleans/status strings only — never a secret value.
  return NextResponse.json(validateConfiguration());
}
