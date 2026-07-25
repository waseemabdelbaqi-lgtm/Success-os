export type InstitutionKind = "university" | "college" | "school";
export type TargetDegree = "bachelor" | "master" | "phd" | "diploma" | "school";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type ApplicationRoute = "partner" | "email";
export type ApplicationStatus =
  | "pending"
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected"
  | "emailed";

export interface AdmissionProfileInput {
  fullName: string;
  email?: string;
  phone?: string;
  nationality: string;
  gpa: number;
  targetDegree: TargetDegree;
  major: string;
  preferredStudyCountry?: string;
}

export interface AdmissionsCriteria {
  id?: string;
  institution_id?: string;
  nationality: string;
  title: string;
  channel?: string | null;
  fees_note?: string | null;
  visa_note?: string | null;
  docs: string[];
  summary?: string | null;
}

export interface Institution {
  id: string;
  slug: string;
  name: string;
  kind: InstitutionKind;
  country: string;
  city?: string | null;
  majors: string[];
  degrees: string[];
  is_partner: boolean;
  official_email: string;
  website?: string | null;
  min_gpa?: number | null;
  criteria?: AdmissionsCriteria | null;
}

export interface PaymentRecord {
  id: string;
  institution_id: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  stripe_session_id?: string | null;
  unlock_token?: string | null;
  paid_at?: string | null;
}

export interface ApplicationPersonal {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address?: string;
}

export interface SubmitApplicationInput {
  paymentId: string;
  unlockToken: string;
  institutionId: string;
  profile: AdmissionProfileInput;
  personal: ApplicationPersonal;
  transcriptPath: string;
  passportPath: string;
  message?: string;
}
