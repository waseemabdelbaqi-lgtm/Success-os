import { randomUUID } from "crypto";
import type {
  ApplicationPersonal,
  AdmissionProfileInput,
  PaymentRecord,
} from "@/src/types/admission";

type PreviewApplication = {
  id: string;
  institution_id: string;
  payment_id: string;
  status: string;
  route: "partner" | "email";
  personal: ApplicationPersonal;
  profile: AdmissionProfileInput;
  transcript_path: string;
  passport_path: string;
  message?: string;
  created_at: string;
};

type PreviewNotification = {
  id: string;
  audience: "student" | "institution";
  title: string;
  body: string;
  application_id: string;
  created_at: string;
  read: boolean;
};

const g = globalThis as unknown as {
  __sosAdmissionPayments?: Map<string, PaymentRecord & { unlock_token: string }>;
  __sosAdmissionApps?: Map<string, PreviewApplication>;
  __sosAdmissionNotes?: PreviewNotification[];
  __sosAdmissionFiles?: Map<string, { name: string; type: string; dataBase64: string }>;
};

function payments() {
  if (!g.__sosAdmissionPayments) g.__sosAdmissionPayments = new Map();
  return g.__sosAdmissionPayments;
}
function apps() {
  if (!g.__sosAdmissionApps) g.__sosAdmissionApps = new Map();
  return g.__sosAdmissionApps;
}
function notes() {
  if (!g.__sosAdmissionNotes) g.__sosAdmissionNotes = [];
  return g.__sosAdmissionNotes;
}
function files() {
  if (!g.__sosAdmissionFiles) g.__sosAdmissionFiles = new Map();
  return g.__sosAdmissionFiles;
}

export function previewCreatePayment(institutionId: string) {
  const id = randomUUID();
  const unlock = randomUUID().replace(/-/g, "");
  const row = {
    id,
    institution_id: institutionId,
    amount_cents: 500,
    currency: "usd",
    status: "pending" as const,
    stripe_session_id: `preview_cs_${id}`,
    unlock_token: unlock,
    paid_at: null,
  };
  payments().set(id, row);
  return row;
}

export function previewMarkPaidBySession(sessionId: string) {
  for (const row of payments().values()) {
    if (row.stripe_session_id === sessionId) {
      row.status = "paid";
      row.paid_at = new Date().toISOString();
      payments().set(row.id, row);
      return row;
    }
  }
  return null;
}

export function previewMarkPaidById(paymentId: string) {
  const row = payments().get(paymentId);
  if (!row) return null;
  row.status = "paid";
  row.paid_at = new Date().toISOString();
  payments().set(paymentId, row);
  return row;
}

export function previewGetPayment(paymentId: string) {
  return payments().get(paymentId) || null;
}

export function previewSaveFile(
  path: string,
  file: { name: string; type: string; dataBase64: string },
) {
  files().set(path, file);
  return path;
}

export function previewGetFile(path: string) {
  return files().get(path) || null;
}

export function previewSaveApplication(input: {
  institutionId: string;
  paymentId: string;
  route: "partner" | "email";
  personal: ApplicationPersonal;
  profile: AdmissionProfileInput;
  transcriptPath: string;
  passportPath: string;
  message?: string;
}) {
  const id = randomUUID();
  const row: PreviewApplication = {
    id,
    institution_id: input.institutionId,
    payment_id: input.paymentId,
    status: input.route === "partner" ? "pending" : "emailed",
    route: input.route,
    personal: input.personal,
    profile: input.profile,
    transcript_path: input.transcriptPath,
    passport_path: input.passportPath,
    message: input.message,
    created_at: new Date().toISOString(),
  };
  apps().set(id, row);
  return row;
}

export function previewPushNotifications(rows: Omit<PreviewNotification, "id" | "created_at" | "read">[]) {
  const created = rows.map((r) => ({
    ...r,
    id: randomUUID(),
    created_at: new Date().toISOString(),
    read: false,
  }));
  notes().unshift(...created);
  return created;
}

export function previewListNotifications() {
  return notes();
}
