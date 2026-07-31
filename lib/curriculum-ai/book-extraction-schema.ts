/**
 * Zod schemas for Jordan curriculum book extraction (Step 2).
 * No lesson generation — structure + metadata only.
 */
import { z } from "zod";

export const BookMetadataSchema = z.object({
  officialTitle: z.string(),
  country: z.literal("Jordan"),
  curriculum: z.literal("Jordanian National Curriculum"),
  grade: z.literal("1"),
  semester: z.literal("1"),
  subject: z.literal("Mathematics"),
  bookType: z.literal("Student Book"),
  edition: z.string(),
  academicYear: z.string(),
  authority: z.string(),
  officialSourceUrl: z.string().url().or(z.literal("")),
  rightsStatus: z.string(),
  fileSizeBytes: z.number().int().nonnegative(),
  pageCount: z.number().int().nonnegative(),
  sha256: z.string(),
  language: z.string().default("ar"),
  catalogUrl: z.string().optional(),
  verificationStatus: z.enum([
    "verified",
    "identity_rejected",
    "download_blocked",
    "incomplete_capture_rejected",
    "pending",
  ]),
});

export const LessonSectionSchema = z.object({
  title: z.string(),
  startPage: z.number().int().positive(),
  endPage: z.number().int().positive(),
  contentTypes: z.array(z.string()).default([]),
  confidence: z.enum(["high", "medium", "low", "NEEDS_REVIEW"]).default("NEEDS_REVIEW"),
});

export const LessonSchema = z.object({
  title: z.string(),
  startPage: z.number().int().positive(),
  endPage: z.number().int().positive(),
  sections: z.array(LessonSectionSchema).default([]),
  confidence: z.enum(["high", "medium", "low", "NEEDS_REVIEW"]).default("NEEDS_REVIEW"),
});

export const UnitSchema = z.object({
  title: z.string(),
  startPage: z.number().int().positive(),
  endPage: z.number().int().positive(),
  lessons: z.array(LessonSchema).default([]),
  confidence: z.enum(["high", "medium", "low", "NEEDS_REVIEW"]).default("NEEDS_REVIEW"),
});

export const PartSchema = z.object({
  title: z.string(),
  startPage: z.number().int().positive(),
  endPage: z.number().int().positive(),
  units: z.array(UnitSchema).default([]),
});

export const SpecialSectionSchema = z.object({
  type: z.enum([
    "cover",
    "front_matter",
    "introduction",
    "table_of_contents",
    "unit_review",
    "exercises",
    "glossary",
    "answer_section",
    "back_matter",
    "other",
  ]),
  title: z.string(),
  startPage: z.number().int().positive(),
  endPage: z.number().int().positive(),
});

export const BookExtractionSchema = z.object({
  book: BookMetadataSchema,
  parts: z.array(PartSchema).default([]),
  specialSections: z.array(SpecialSectionSchema).default([]),
  extractionWarnings: z.array(z.string()).default([]),
  pagesNeedingReview: z.array(z.number().int().positive()).default([]),
  pageCoverage: z
    .object({
      totalPdfPages: z.number().int().nonnegative(),
      extractedPages: z.number().int().nonnegative(),
      textPages: z.number().int().nonnegative(),
      ocrPages: z.number().int().nonnegative(),
      missingPages: z.array(z.number().int().positive()).default([]),
    })
    .optional(),
  structureComparison: z
    .object({
      tocSource: z.string(),
      result: z.enum(["PASS", "FAIL", "NOT_RUN", "BLOCKED"]),
      notes: z.array(z.string()).default([]),
    })
    .optional(),
  processing: z
    .object({
      startedAt: z.string().optional(),
      finishedAt: z.string().optional(),
      processingTimeMs: z.number().optional(),
      lastCompletedPage: z.number().int().nonnegative().default(0),
      resumable: z.boolean().default(true),
      status: z.enum([
        "blocked_acquisition",
        "in_progress",
        "completed",
        "rejected",
        "needs_review",
      ]),
    })
    .optional(),
});

export type BookExtraction = z.infer<typeof BookExtractionSchema>;
export type BookMetadata = z.infer<typeof BookMetadataSchema>;

export function validateBookExtraction(data: unknown): BookExtraction {
  return BookExtractionSchema.parse(data);
}
