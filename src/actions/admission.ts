"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import {
  FALLBACK_INSTITUTIONS,
  filterFallbackInstitutions,
} from "@/src/lib/admission/fallback-data";
import { buildApplicationEmailHtml } from "@/src/lib/admission/email-template";
import {
  previewGetFile,
  previewGetPayment,
  previewListNotifications,
  previewPushNotifications,
  previewSaveApplication,
  previewSaveFile,
} from "@/src/lib/admission/preview-store";
import { getResend, isResendConfigured } from "@/src/lib/resend";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import type {
  AdmissionProfileInput,
  Institution,
  SubmitApplicationInput,
} from "@/src/types/admission";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function normalizeNationality(value: string) {
  const map: Record<string, string> = {
    الأردن: "Jordan",
    الاردن: "Jordan",
    مصر: "Egypt",
    Egyptian: "Egypt",
    Syrian: "Syria",
    ألمانيا: "Germany",
    السعودية: "Saudi Arabia",
    "المملكة العربية السعودية": "Saudi Arabia",
    الإمارات: "United Arab Emirates",
  };
  return map[value] || value;
}

function degreeToTypes(degree: string): Array<"university" | "college" | "school"> {
  if (degree === "school") return ["school"];
  if (degree === "diploma") return ["college", "university"];
  return ["university", "college"];
}

export async function filterInstitutions(
  profile: AdmissionProfileInput,
): Promise<ActionResult<{ institutions: Institution[]; mode: "supabase" | "preview" }>> {
  if (!profile.nationality || !profile.major || !profile.targetDegree) {
    return { ok: false, error: "Nationality, GPA, degree, and major are required." };
  }
  if (Number.isNaN(Number(profile.gpa))) {
    return { ok: false, error: "GPA must be a valid number." };
  }

  const nationality = normalizeNationality(profile.nationality);
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      ok: true,
      data: {
        institutions: filterFallbackInstitutions({ ...profile, nationality }),
        mode: "preview",
      },
    };
  }

  const types = degreeToTypes(profile.targetDegree);
  let query = supabase
    .from("institutions")
    .select(
      "id,name,type,official_email,is_partner,logo_url,country,majors,admission_criteria(id,nationality,min_gpa,requirements_text)",
    )
    .in("type", types);

  if (profile.preferredStudyCountry) {
    query = query.ilike("country", `%${profile.preferredStudyCountry}%`);
  }

  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };

  const major = profile.major.toLowerCase();
  const gpa = Number(profile.gpa);

  const institutions: Institution[] = (data || [])
    .map((row) => {
      const criteriaRows = (row.admission_criteria || []) as Array<{
        id: string;
        nationality: string;
        min_gpa: number;
        requirements_text: string;
      }>;
      const match =
        criteriaRows.find((c) => c.nationality === nationality) ||
        criteriaRows.find((c) => c.nationality === "All") ||
        null;
      return { row, match };
    })
    .filter(({ row, match }) => {
      if (!match) return false;
      if (gpa < Number(match.min_gpa)) return false;
      const majors = (row.majors || []) as string[];
      if (!majors.length || profile.targetDegree === "school") return true;
      return majors.some(
        (m) => m.toLowerCase().includes(major) || major.includes(m.toLowerCase()),
      );
    })
    .map(({ row, match }) => ({
      id: row.id as string,
      name: row.name as string,
      type: row.type as Institution["type"],
      official_email: row.official_email as string,
      is_partner: Boolean(row.is_partner),
      logo_url: row.logo_url as string | null,
      country: row.country as string | null,
      majors: (row.majors || []) as string[],
      criteria: match
        ? {
            id: match.id,
            nationality: match.nationality,
            min_gpa: Number(match.min_gpa),
            requirements_text: match.requirements_text,
          }
        : null,
    }))
    .sort((a, b) => Number(b.is_partner) - Number(a.is_partner));

  return { ok: true, data: { institutions, mode: "supabase" } };
}

export async function uploadAdmissionDocument(formData: FormData): Promise<
  ActionResult<{ path: string; publicUrl?: string }>
> {
  const file = formData.get("file");
  const kind = String(formData.get("kind") || "document");
  const paymentId = String(formData.get("paymentId") || "");

  if (!(file instanceof File)) return { ok: false, error: "No file provided." };
  if (file.type !== "application/pdf") {
    return { ok: false, error: "Only PDF files are accepted." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "File must be under 8MB." };
  }

  const path = `${paymentId || "anonymous"}/${kind}-${randomUUID()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    previewSaveFile(path, {
      name: file.name,
      type: file.type,
      dataBase64: buffer.toString("base64"),
    });
    return { ok: true, data: { path } };
  }

  const { error } = await supabase.storage
    .from("admission-documents")
    .upload(path, buffer, { contentType: "application/pdf", upsert: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { path } };
}

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
> {
  const supabase = getSupabaseServerClient();
  const nationality = normalizeNationality(input.profile.nationality);

  // --- Preview / offline path ---
  if (!supabase) {
    const payment = previewGetPayment(input.paymentId);
    if (!payment || payment.status !== "completed") {
      return { ok: false, error: "Payment not completed. Unlock the form with the $5 fee first." };
    }
    const unlock = payment.unlock_token || payment.stripe_session_id;
    if (unlock !== input.unlockToken) {
      return { ok: false, error: "Invalid unlock token." };
    }
    if (payment.institution_id !== input.institutionId) {
      return { ok: false, error: "Payment does not match the selected institution." };
    }

    const institution =
      filterFallbackInstitutions({ ...input.profile, nationality }).find(
        (i) => i.id === input.institutionId,
      ) || FALLBACK_INSTITUTIONS.find((i) => i.id === input.institutionId);

    if (!institution) return { ok: false, error: "Institution not found." };

    const userId = input.profile.userId || payment.user_id || randomUUID();
    const route = institution.is_partner ? "partner" : "email";
    const app = previewSaveApplication({
      userId,
      institutionId: institution.id,
      paymentId: payment.id,
      route,
      personal: input.personal,
      profile: input.profile,
      transcriptPath: input.transcriptPath,
      passportPath: input.passportPath,
      message: input.message,
    });

    if (route === "partner") {
      const notes = previewPushNotifications([
        {
          user_id: userId,
          title: "Application received",
          message: `Your application to ${institution.name} was submitted and is under review on SUCCESS OS.`,
        },
      ]);
      revalidatePath("/admission-funnel");
      revalidatePath("/notifications");
      return {
        ok: true,
        data: {
          applicationId: app.id,
          route,
          status: app.status,
          notifications: notes.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
          })),
        },
      };
    }

    const html = buildApplicationEmailHtml({
      institution,
      personal: input.personal,
      profile: input.profile,
      message: input.message,
      applicationId: app.id,
    });

    let emailMessageId: string | null = null;
    if (isResendConfigured()) {
      const attachments = [input.transcriptPath, input.passportPath]
        .map((p) => {
          const f = previewGetFile(p);
          if (!f) return null;
          return {
            filename: f.name || `${p.split("/").pop()}`,
            content: Buffer.from(f.dataBase64, "base64"),
          };
        })
        .filter(Boolean) as Array<{ filename: string; content: Buffer }>;

      const resend = getResend();
      const sent = await resend.emails.send({
        from: process.env.EMAIL_FROM || "SUCCESS OS <admissions@successos.app>",
        to: institution.official_email,
        replyTo: input.personal.email,
        subject: `Admission application — ${input.personal.fullName} → ${institution.name}`,
        html,
        attachments,
      });
      emailMessageId = sent.data?.id || null;
    }

    revalidatePath("/admission-funnel");
    return {
      ok: true,
      data: {
        applicationId: app.id,
        route,
        status: app.status,
        emailPreviewHtml: html,
        emailMessageId,
      },
    };
  }

  // --- Supabase path ---
  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .select("*")
    .eq("id", input.paymentId)
    .maybeSingle();

  if (payErr) return { ok: false, error: payErr.message };
  if (!payment || payment.status !== "completed") {
    return { ok: false, error: "Payment not completed. Unlock the form with the $5 fee first." };
  }
  if (payment.stripe_session_id !== input.unlockToken) {
    return { ok: false, error: "Invalid unlock token." };
  }
  if (payment.institution_id !== input.institutionId) {
    return { ok: false, error: "Payment does not match the selected institution." };
  }

  const userId = payment.user_id as string;

  const { data: institution, error: instErr } = await supabase
    .from("institutions")
    .select("*")
    .eq("id", input.institutionId)
    .maybeSingle();

  if (instErr) return { ok: false, error: instErr.message };
  if (!institution) return { ok: false, error: "Institution not found." };

  // Keep profile in sync with application data
  await supabase.from("profiles").upsert({
    id: userId,
    full_name: input.personal.fullName,
    nationality,
    gpa: input.profile.gpa,
    target_degree: input.profile.targetDegree,
    major: input.profile.major,
    email: input.personal.email,
  });

  const route = institution.is_partner ? "partner" : "email";

  const { data: application, error: appErr } = await supabase
    .from("applications")
    .insert({
      user_id: userId,
      institution_id: institution.id,
      passport_file_url: input.passportPath,
      transcript_file_url: input.transcriptPath,
      status: "submitted",
    })
    .select("id")
    .single();

  if (appErr) return { ok: false, error: appErr.message };

  if (route === "partner") {
    const { data: notes, error: noteErr } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title: "Application received",
        message: `Your application to ${institution.name} was submitted and is under review on SUCCESS OS.`,
        is_read: false,
      })
      .select("id,title,message");

    if (noteErr) return { ok: false, error: noteErr.message };

    revalidatePath("/admission-funnel");
    revalidatePath("/notifications");
    return {
      ok: true,
      data: {
        applicationId: application.id,
        route,
        status: "submitted",
        notifications: notes || [],
      },
    };
  }

  // Route B — Resend official email with Storage attachments
  const attachments: Array<{ filename: string; content: Buffer }> = [];
  for (const storagePath of [input.transcriptPath, input.passportPath]) {
    const { data: blob, error } = await supabase.storage
      .from("admission-documents")
      .download(storagePath);
    if (error || !blob) {
      return { ok: false, error: `Could not fetch attachment: ${storagePath}` };
    }
    const ab = await blob.arrayBuffer();
    attachments.push({
      filename: storagePath.split("/").pop() || "document.pdf",
      content: Buffer.from(ab),
    });
  }

  const html = buildApplicationEmailHtml({
    institution: {
      id: institution.id,
      name: institution.name,
      type: institution.type,
      official_email: institution.official_email,
      is_partner: institution.is_partner,
      logo_url: institution.logo_url,
      country: institution.country,
      majors: institution.majors || [],
    },
    personal: input.personal,
    profile: input.profile,
    message: input.message,
    applicationId: application.id,
  });

  let emailMessageId: string | null = null;
  if (isResendConfigured()) {
    const resend = getResend();
    const sent = await resend.emails.send({
      from: process.env.EMAIL_FROM || "SUCCESS OS <admissions@successos.app>",
      to: institution.official_email,
      replyTo: input.personal.email,
      subject: `Admission application — ${input.personal.fullName} → ${institution.name}`,
      html,
      attachments,
    });
    emailMessageId = sent.data?.id || null;
  }

  revalidatePath("/admission-funnel");
  return {
    ok: true,
    data: {
      applicationId: application.id,
      route,
      status: "submitted",
      emailPreviewHtml: html,
      emailMessageId,
    },
  };
}

export async function listStudentNotifications(): Promise<
  ActionResult<
    Array<{ id: string; title: string; body: string; created_at: string; read: boolean }>
  >
> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: true,
      data: previewListNotifications().map((n) => ({
        id: n.id,
        title: n.title,
        body: n.message,
        created_at: n.created_at,
        read: n.is_read,
      })),
    };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,message,created_at,is_read")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data || []).map((n) => ({
      id: n.id as string,
      title: n.title as string,
      body: n.message as string,
      created_at: n.created_at as string,
      read: Boolean(n.is_read),
    })),
  };
}
