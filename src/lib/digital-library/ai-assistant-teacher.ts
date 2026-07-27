/** Canonical title for every AI teacher persona on SUCCESS OS. */
export const AI_ASSISTANT_TEACHER_TITLE_M = "معلّم مساعد";
export const AI_ASSISTANT_TEACHER_TITLE_F = "معلّمة مساعدة";

/** Default (elementary cast is female). */
export const AI_ASSISTANT_TEACHER_TITLE = AI_ASSISTANT_TEACHER_TITLE_F;

/** Strip a previously appended assistant title so we never double-label. */
export function stripAiAssistantTitle(name: string): string {
  return String(name || "")
    .replace(/\s*[·•|\-–—]\s*معلّ?مة?\s*مساعدة?\s*$/u, "")
    .replace(/\s*\(\s*معلّ?مة?\s*مساعدة?\s*\)\s*$/u, "")
    .trim();
}

export function withAiAssistantTitle(
  name: string,
  gender: "female" | "male" = "female",
): string {
  const base = stripAiAssistantTitle(name);
  if (!base) return gender === "male" ? AI_ASSISTANT_TEACHER_TITLE_M : AI_ASSISTANT_TEACHER_TITLE_F;
  const title = gender === "male" ? AI_ASSISTANT_TEACHER_TITLE_M : AI_ASSISTANT_TEACHER_TITLE_F;
  return `${base} · ${title}`;
}
