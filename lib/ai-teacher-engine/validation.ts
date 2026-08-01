/**
 * Zod validation for AI Teacher Engine API / orchestration inputs.
 */
import { z } from "zod";

export const teachingStyleSchema = z.enum([
  "direct",
  "socratic",
  "example_first",
  "visual",
  "step_by_step",
  "story",
  "simplified",
]);

export const languageSchema = z.enum(["ar", "en", "bilingual"]);

export const multimodalKindSchema = z.enum([
  "text",
  "voice",
  "image",
  "screenshot",
  "homework_photo",
  "pdf",
  "handwritten_solution",
  "video_conversation",
  "live_whiteboard",
]);

export const multimodalInputSchema = z.object({
  kind: multimodalKindSchema,
  ref: z.string().optional(),
  mimeType: z.string().optional(),
  transcript: z.string().optional(),
  text: z.string().optional(),
  language: z.string().optional(),
  ready: z.boolean().default(true),
  notes: z.array(z.string()).optional(),
});

/** Production teaching turn — no country defaults; required grounding context. */
export const ateTurnRequestSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().optional(),
  countryId: z.string().min(1),
  curriculumId: z.string().min(1),
  gradeId: z.string().min(1).optional(),
  subjectGlobalId: z.string().min(1).optional(),
  focusLessonId: z.string().min(1),
  language: languageSchema.optional(),
  utterance: z.string().min(1),
  teachingStyle: teachingStyleSchema.optional(),
  sessionId: z.string().min(1).optional(),
  multimodal: z.array(multimodalInputSchema).optional(),
  /** When true, may seed reference fixtures for demos only */
  demoMode: z.boolean().optional(),
});

export const ateMemoryWriteSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().optional(),
  preferredLanguage: z.string().optional(),
  currentCurriculumId: z.string().nullable().optional(),
  gradeId: z.string().nullable().optional(),
  subjectIds: z.array(z.string()).optional(),
  completedLessonIds: z.array(z.string()).optional(),
  weakSkillIds: z.array(z.string()).optional(),
  strongSkillIds: z.array(z.string()).optional(),
  learningGoals: z.array(z.string()).optional(),
  learningPace: z.enum(["slow", "normal", "fast"]).optional(),
  learningStyle: z
    .enum(["visual", "auditory", "kinesthetic", "reading_writing", "mixed"])
    .optional(),
  preferredTeachingStyle: teachingStyleSchema.optional(),
});

export const ateDemoRequestSchema = z.object({
  studentId: z.string().optional(),
  studentName: z.string().optional(),
  utterance: z.string().optional(),
  focusLessonId: z.string().optional(),
});

export type AteTurnRequest = z.infer<typeof ateTurnRequestSchema>;
export type AteMemoryWriteRequest = z.infer<typeof ateMemoryWriteSchema>;

export function formatZodError(error: z.ZodError) {
  return error.flatten();
}
