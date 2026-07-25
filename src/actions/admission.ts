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
    ألمانيا: "Germany",
    السعودية: "Saudi Arabia",
    "المملكة العربية السعودية": "Saudi Arabia",
    الإمارات: "United Arab Emirates",
  };
  return map[value] || value;
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
    const institutions = filterFallbackInstitutions({
      ...profile,
      nationality,
    });
    return { ok: true, data: { institutions, mode: "preview" } };
  }

  let query = supabase
    .from("institutions")
    .select(
      "id,slug,name,kind,country,city,majors,degrees,is_partner,official_email,website,min_gpa,admissions_criteria(*)",
    )
    .eq("active", true);

  if (profile.targetDegree === "school") {
    query = query.eq("kind", "school");
  } else {
    query = query.neq("kind", "school").contains("degrees", [profile.targetDegree]);
  }

  if (profile.preferredStudyCountry) {
    query = query.ilike("country", `%${profile.preferredStudyCountry}%`);
  }

  const { data, error } = await query;
  if (error) {
    return { ok: false, error: error.message };
  }

  const major = profile.major.toLowerCase();
  const gpa = Number(profile.gpa);

  const institutions: Institution[] = (data || [])
    .filter((row) => {
      if (gpa < Number(row.min_gpa || 0)) return false;
      const majors = (row.majors || []) as string[];
      return majors.some(
        (m) => m.toLowerCase().includes(major) || major.includes(m.toLowerCase()),
      );
    })
    .map((row) => {
      const criteriaRows = (row.admissions_criteria || []) as Array<{
        id: string;
        nationality: string;
        title: string;
        channel: string | null;
        fees_note: string | null;
        visa_note: string | null;
        docs: string[];
        summary: string | null;
      }>;
      const match =
        criteriaRows.find((c) => c.nationality === nationality) ||
        criteriaRows.find((c) => c.nationality.toLowerCase() === nationality.toLowerCase()) ||
        null;

      return {
        id: row.id as string,
        slug: row.slug as string,
        name: row.name as string,
        kind: row.kind as Institution["kind"],
        country: row.country as string,
        city: row.city as string | null,
        majors: (row.majors || []) as string[],
        degrees: (row.degrees || []) as string[],
        is_partner: Boolean(row.is_partner),
        official_email: row.official_email as string,
        website: row.website as string | null,
        min_gpa: row.min_gpa as number | null,
        criteria: match
          ? {
              id: match.id,
              nationality: match.nationality,
              title: match.title,
              channel: match.channel,
              fees_note: match.fees_note,
              visa_note: match.visa_note,
              docs: match.docs || [],
              summary: match.summary,
            }
          : {
              nationality,
              title: `${nationality} applicant track`,
              channel: row.is_partner ? "SUCCESS OS partner channel" : "Official email",
              fees_note: "Confirm on institution site",
              visa_note:
                nationality === row.country ? "Usually not required" : "Student visa likely",
              docs: ["Passport", "Transcripts", "Language proof"],
              summary: `Admission conditions for ${nationality} applicants at ${row.name}.`,
            },
      };
    })
    .sort((a, b) => Number(b.is_partner) - Number(a.is_partner));

  return { ok: true, data: { institutions, mode: "supabase" } };
}

export async function uploadAdmissionDocument(formData: FormData): Promise<
  ActionResult<{ path: string }>
> {
  const file = formData.get("file");
  const kind = String(formData.get("kind") || "document");
  const paymentId = String(formData.get("paymentId") || "");

  if (!(file instanceof File)) {
    return { ok: false, error: "No file provided." };
  }
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
    notifications?: Array<{ id: string; title: string; body: string }>;
  }>
> {
  const supabase = getSupabaseServerClient();

  // --- Preview / offline path ---
  if (!supabase) {
    const payment = previewGetPayment(input.paymentId);
    if (!payment || payment.status !== "paid") {
      return { ok: false, error: "Payment not completed. Unlock the form with the $5 fee first." };
    }
    if (payment.unlock_token !== input.unlockToken) {
      return { ok: false, error: "Invalid unlock token." };
    }
    if (payment.institution_id !== input.institutionId) {
      return { ok: false, error: "Payment does not match the selected institution." };
    }

    const institutions = filterFallbackInstitutions(input.profile);
    const institution =
      institutions.find((i) => i.id === input.institutionId) ||
      FALLBACK_INSTITUTIONS.find((i) => i.id === input.institutionId);

    if (!institution) return { ok: false, error: "Institution not found." };

    const route = institution.is_partner ? "partner" : "email";
    const app = previewSaveApplication({
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
          audience: "student",
          title: "Application received",
          body: `Your application to ${institution.name} is pending review on SUCCESS OS.`,
          application_id: app.id,
        },
        {
          audience: "institution",
          title: "New partner application",
          body: `${input.personal.fullName} applied to ${institution.name}.`,
          application_id: app.id,
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
          notifications: notes.map((n) => ({ id: n.id, title: n.title, body: n.body })),
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
  if (!payment || payment.status !== "paid") {
    return { ok: false, error: "Payment not completed. Unlock the form with the $5 fee first." };
  }
  if (payment.unlock_token !== input.unlockToken) {
    return { ok: false, error: "Invalid unlock token." };
  }
  if (payment.institution_id !== input.institutionId) {
    return { ok: false, error: "Payment does not match the selected institution." };
  }

  const { data: institution, error: instErr } = await supabase
    .from("institutions")
    .select("*")
    .eq("id", input.institutionId)
    .maybeSingle();

  if (instErr) return { ok: false, error: instErr.message };
  if (!institution) return { ok: false, error: "Institution not found." };

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .insert({
      full_name: input.personal.fullName,
      email: input.personal.email,
      phone: input.personal.phone,
      nationality: normalizeNationality(input.profile.nationality),
      gpa: input.profile.gpa,
      target_degree: input.profile.targetDegree,
      major: input.profile.major,
      preferred_study_country: input.profile.preferredStudyCountry || null,
    })
    .select("id")
    .single();

  if (profileErr) return { ok: false, error: profileErr.message };

  const route = institution.is_partner ? "partner" : "email";
  const status = route === "partner" ? "pending" : "emailed";

  const { data: application, error: appErr } = await supabase
    .from("applications")
    .insert({
      profile_id: profileRow.id,
      institution_id: institution.id,
      payment_id: payment.id,
      status,
      route,
      personal: input.personal,
      transcript_path: input.transcriptPath,
      passport_path: input.passportPath,
      message: input.message || null,
    })
    .select("id")
    .single();

  if (appErr) return { ok: false, error: appErr.message };

  if (route === "partner") {
    const { data: notes, error: noteErr } = await supabase
      .from("notifications")
      .insert([
        {
          profile_id: profileRow.id,
          institution_id: institution.id,
          application_id: application.id,
          audience: "student",
          title: "Application received",
          body: `Your application to ${institution.name} is pending review on SUCCESS OS.`,
        },
        {
          profile_id: profileRow.id,
          institution_id: institution.id,
          application_id: application.id,
          audience: "institution",
          title: "New partner application",
          body: `${input.personal.fullName} applied to ${institution.name}.`,
        },
      ])
      .select("id,title,body");

    if (noteErr) return { ok: false, error: noteErr.message };

    revalidatePath("/admission-funnel");
    revalidatePath("/notifications");
    return {
      ok: true,
      data: {
        applicationId: application.id,
        route,
        status,
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
    institution: institution as Institution,
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
    await supabase
      .from("applications")
      .update({ email_message_id: emailMessageId })
      .eq("id", application.id);
  }

  revalidatePath("/admission-funnel");
  return {
    ok: true,
    data: {
      applicationId: application.id,
      route,
      status,
      emailPreviewHtml: html,
      emailMessageId,
    },
  };
}

export async function listStudentNotifications(): Promise<
  ActionResult<Array<{ id: string; title: string; body: string; created_at: string; read: boolean }>>
> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: true,
      data: previewListNotifications()
        .filter((n) => n.audience === "student")
        .map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          created_at: n.created_at,
          read: n.read,
        })),
    };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,body,created_at,read")
    .eq("audience", "student")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data || [] };
}
