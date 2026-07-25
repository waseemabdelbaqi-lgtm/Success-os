/**
 * Server Action — dual-route application submission.
 * Route A (partner): insert `applications` + in-app notification (Realtime).
 * Route B (non-partner): Resend HTML email with Storage PDF attachments.
 *
 * Supports:
 * - Structured payload (ApplicationForm): `submitApplication(input)` → `{ ok, data }`
 * - FormData (ApplyPage): `submitApplication(formData, institutionId)` → `{ success }`
 */
import {
  submitApplication as submitApplicationCore,
  uploadAdmissionDocument,
  type ActionResult,
} from "@/src/actions/admission";
import type { AdmissionProfileInput, SubmitApplicationInput } from "@/src/types/admission";

export { uploadAdmissionDocument };
export type { ActionResult };

export type FormSubmitResult = {
  success: boolean;
  error?: string;
  applicationId?: string;
  route?: "partner" | "email";
  status?: string;
  emailPreviewHtml?: string;
};

export async function submitApplication(
  formData: FormData,
  institutionId: string,
): Promise<FormSubmitResult>;
export async function submitApplication(
  input: SubmitApplicationInput,
): Promise<
  ActionResult<{
    applicationId: string;
    route: "partner" | "email";
    status: string;
    emailPreviewHtml?: string;
    emailMessageId?: string | null;
    notifications?: Array<{ id: string; title: string; message: string }>;
  }>
>;
export async function submitApplication(
  inputOrForm: SubmitApplicationInput | FormData,
  institutionId?: string,
): Promise<FormSubmitResult | ActionResult<{
  applicationId: string;
  route: "partner" | "email";
  status: string;
  emailPreviewHtml?: string;
  emailMessageId?: string | null;
  notifications?: Array<{ id: string; title: string; message: string }>;
}>> {
  if (!(inputOrForm instanceof FormData)) {
    return submitApplicationCore(inputOrForm);
  }

  if (!institutionId?.trim()) {
    return { success: false, error: "institutionId is required" };
  }

  const formData = inputOrForm;
  const paymentId = String(formData.get("paymentId") || "").trim();
  const unlockToken = String(formData.get("unlockToken") || "").trim();

  if (!paymentId || !unlockToken) {
    return {
      success: false,
      error: "يجب إتمام الدفع أولاً قبل إرسال المستندات (paymentId / unlockToken).",
    };
  }

  let transcriptPath = String(formData.get("transcriptUrl") || formData.get("transcriptPath") || "").trim();
  let passportPath = String(formData.get("passportUrl") || formData.get("passportPath") || "").trim();

  const transcriptFile = formData.get("transcript");
  const passportFile = formData.get("passport");

  if (transcriptFile instanceof File && transcriptFile.size > 0) {
    const fd = new FormData();
    fd.set("file", transcriptFile);
    fd.set("kind", "transcript");
    fd.set("paymentId", paymentId);
    const uploaded = await uploadAdmissionDocument(fd);
    if (!uploaded.ok) return { success: false, error: uploaded.error };
    transcriptPath = uploaded.data.path;
  }

  if (passportFile instanceof File && passportFile.size > 0) {
    const fd = new FormData();
    fd.set("file", passportFile);
    fd.set("kind", "passport");
    fd.set("paymentId", paymentId);
    const uploaded = await uploadAdmissionDocument(fd);
    if (!uploaded.ok) return { success: false, error: uploaded.error };
    passportPath = uploaded.data.path;
  }

  if (!transcriptPath || !passportPath) {
    return {
      success: false,
      error: "يرجى رفع كشف الدرجات ونسخة جواز السفر قبل الإرسال.",
    };
  }

  const profile: AdmissionProfileInput = {
    fullName: String(formData.get("fullName") || "Applicant").trim(),
    email: String(formData.get("email") || "").trim() || undefined,
    phone: String(formData.get("phone") || "").trim() || undefined,
    nationality: String(formData.get("nationality") || "All").trim() || "All",
    gpa: Number(formData.get("gpa") || 0),
    targetDegree: (String(formData.get("targetDegree") || "bachelor") ||
      "bachelor") as AdmissionProfileInput["targetDegree"],
    major: String(formData.get("major") || "General").trim() || "General",
    userId: String(formData.get("userId") || "").trim() || undefined,
  };

  const result = await submitApplicationCore({
    paymentId,
    unlockToken,
    institutionId,
    profile,
    personal: {
      fullName: profile.fullName,
      email: profile.email || "applicant@example.com",
      phone: profile.phone || "",
      dateOfBirth: String(formData.get("dateOfBirth") || "").trim(),
      address: String(formData.get("address") || "").trim() || undefined,
    },
    transcriptPath,
    passportPath,
    message: String(formData.get("message") || "").trim() || undefined,
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    applicationId: result.data.applicationId,
    route: result.data.route,
    status: result.data.status,
    emailPreviewHtml: result.data.emailPreviewHtml,
  };
}
