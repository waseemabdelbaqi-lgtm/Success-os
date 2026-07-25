import { randomUUID } from "crypto";
import type {
  ApplicationPersonal,
  AdmissionProfileInput,
  PaymentRecord,
} from "@/src/types/admission";

type PreviewApplication = {
  id: string;
  user_id: string;
  institution_id: string;
  payment_id: string;
  status: string;
  route: "partner" | "email";
  personal: ApplicationPersonal;
  profile: AdmissionProfileInput;
  transcript_file_url: string;
  passport_file_url: string;
  message?: string;
  created_at: string;
};

type PreviewNotification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const g = globalThis as unknown as {
  __sosAdmissionPayments?: Map<string, PaymentRecord>;
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

export function previewCreatePayment(institutionId: string, userId?: string) {
  const id = randomUUID();
  const sessionId = `preview_cs_${id}`;
  const row: PaymentRecord = {
    id,
    user_id: userId || null,
    institution_id: institutionId,
    amount: 5,
    status: "pending",
    stripe_session_id: sessionId,
    unlock_token: sessionId,
  };
  payments().set(id, row);
  return row;
}

export function previewMarkPaidBySession(sessionId: string) {
  for (const row of payments().values()) {
    if (row.stripe_session_id === sessionId) {
      row.status = "completed";
      payments().set(row.id, row);
      return row;
    }
  }
  return null;
}

export function previewMarkPaidById(paymentId: string) {
  const row = payments().get(paymentId);
  if (!row) return null;
  row.status = "completed";
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
  userId: string;
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
    user_id: input.userId,
    institution_id: input.institutionId,
    payment_id: input.paymentId,
    status: "submitted",
    route: input.route,
    personal: input.personal,
    profile: input.profile,
    transcript_file_url: input.transcriptPath,
    passport_file_url: input.passportPath,
    message: input.message,
    created_at: new Date().toISOString(),
  };
  apps().set(id, row);
  return row;
}

export function previewPushNotifications(
  rows: Array<{ user_id: string; title: string; message: string }>,
) {
  const created = rows.map((r) => ({
    ...r,
    id: randomUUID(),
    created_at: new Date().toISOString(),
    is_read: false,
  }));
  notes().unshift(...created);
  return created;
}

export function previewListNotifications() {
  return notes();
}
