import { createHash } from "node:crypto";
import type { DetectedBook } from "@/types/curriculum-import-engine";

export function checksumBook(book: DetectedBook): string {
  const payload = JSON.stringify({
    id: book.id,
    title: book.title,
    metadata: {
      country: book.metadata.country,
      curriculum: book.metadata.curriculum,
      grade: book.metadata.grade,
      subject: book.metadata.subject,
      semester: book.metadata.semester,
    },
    units: book.units.map((u) => ({
      id: u.id,
      title: u.title,
      lessons: u.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        body: l.body,
        objectives: l.objectives,
      })),
    })),
  });
  return createHash("sha256").update(payload).digest("hex");
}
