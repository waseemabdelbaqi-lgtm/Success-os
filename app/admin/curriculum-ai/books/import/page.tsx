import { ImportReviewClient } from "./ImportReviewClient";

export const dynamic = "force-dynamic";

/**
 * Admin review for official curriculum book import (Step 2).
 * No lesson generation controls.
 */
export default function CurriculumBookImportPage() {
  return <ImportReviewClient />;
}
