/**
 * Server Action — dual-route application submission.
 * Route A (partner): insert `applications` + in-app notification (Realtime).
 * Route B (non-partner): Resend HTML email with Storage PDF attachments.
 */
export { submitApplication, uploadAdmissionDocument } from "@/src/actions/admission";
export type { ActionResult } from "@/src/actions/admission";
