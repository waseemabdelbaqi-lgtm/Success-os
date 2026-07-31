import { z } from "zod";

export const BLOCK_TYPES = [
  "heading",
  "paragraph",
  "rich_text",
  "definition",
  "vocabulary_card",
  "rule",
  "formula",
  "worked_example",
  "step_solution",
  "important_note",
  "warning",
  "comparison",
  "table",
  "image",
  "labeled_image",
  "svg_diagram",
  "hotspot_diagram",
  "chart",
  "graph",
  "number_line",
  "coordinate_plane",
  "geometry_figure",
  "map",
  "timeline",
  "process",
  "experiment",
  "observation",
  "data_table",
  "question",
  "hint",
  "feedback",
  "answer_explanation",
  "writing_area",
  "drawing_area",
  "tracing_area",
  "reflection",
  "citation",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const contentBlockSchema = z.object({
  blockId: z.string().min(1),
  type: z.enum(BLOCK_TYPES),
  position: z.number().int().nonnegative(),
  language: z.enum(["ar", "en", "math", "mixed"]),
  direction: z.enum(["rtl", "ltr", "isolate"]),
  content: z.record(z.string(), z.unknown()),
  configuration: z.record(z.string(), z.unknown()).optional(),
  sourceId: z.string().optional(),
  officialPageReference: z.string().optional(),
  rightsStatus: z.string().min(1),
  accessibilityText: z.string().optional(),
  reviewStatus: z.string().min(1),
  version: z.number().int().positive(),
});

export type ContentBlockInput = z.infer<typeof contentBlockSchema>;

export function validateContentBlock(input: unknown): {
  ok: boolean;
  errors: string[];
  data?: ContentBlockInput;
} {
  const parsed = contentBlockSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  const data = parsed.data;
  const errors: string[] = [];
  if (data.type === "heading" && !String(data.content.textAr || data.content.text || "").trim()) {
    errors.push("heading requires textAr");
  }
  if (data.type === "paragraph" && !String(data.content.bodyAr || "").trim()) {
    errors.push("paragraph requires bodyAr");
  }
  if (data.type === "formula" && !String(data.content.latex || "").trim()) {
    errors.push("formula requires latex");
  }
  if (data.type === "image" && !String(data.content.alt || data.accessibilityText || "").trim()) {
    errors.push("image requires accessibilityText/alt");
  }
  if (data.type === "question" && !String(data.content.promptAr || "").trim()) {
    errors.push("question requires promptAr");
  }
  // Placeholder detection
  const blob = JSON.stringify(data.content).toLowerCase();
  if (blob.includes("lorem ipsum") || blob.includes("todo:") || blob.includes("placeholder")) {
    errors.push("placeholder text forbidden");
  }
  return { ok: errors.length === 0, errors, data: errors.length ? undefined : data };
}

export const ACTIVITY_TYPES = [
  "single_choice",
  "multiple_response",
  "true_false",
  "fill_blank",
  "short_answer",
  "long_answer",
  "matching",
  "sorting",
  "ordering",
  "drag_drop",
  "image_selection",
  "hotspot",
  "diagram_labeling",
  "table_completion",
  "equation_building",
  "math_input",
  "graph_plotting",
  "timeline",
  "map_activity",
  "drawing",
  "tracing",
  "reflection",
  "experiment_observation",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const REVIEW_STATUSES = [
  "DRAFT",
  "SOURCE_REVIEW",
  "RIGHTS_REVIEW",
  "SUBJECT_REVIEW",
  "LANGUAGE_REVIEW",
  "TECHNICAL_REVIEW",
  "CORRECTIONS_REQUIRED",
  "FINAL_APPROVAL",
  "PUBLISHED",
  "ARCHIVED",
  "REPLACED",
] as const;
