export type InstitutionType = "university" | "college" | "school";
export type TargetDegree = "bachelor" | "master" | "phd" | "diploma" | "school";
export type PaymentStatus = "pending" | "completed" | "failed";
export type ApplicationRoute = "partner" | "email";
export type ApplicationStatus = "submitted" | "under_review" | "accepted" | "rejected";

/** @deprecated use InstitutionType */
export type InstitutionKind = InstitutionType;

export interface AdmissionProfileInput {
  fullName: string;
  email?: string;
  phone?: string;
  nationality: string;
  gpa: number;
  targetDegree: TargetDegree;
  major: string;
  preferredStudyCountry?: string;
  /** Supabase auth user id when signed in */
  userId?: string;
}

export interface AdmissionCriteria {
  id?: string;
  institution_id?: string;
  nationality: string;
  min_gpa: number;
  requirements_text: string;
}

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  official_email: string;
  is_partner: boolean;
  logo_url?: string | null;
  country?: string | null;
  majors?: string[];
  /** Criteria matched to the student's nationality (or All) */
  criteria?: AdmissionCriteria | null;
}

export interface PaymentRecord {
  id: string;
  user_id?: string | null;
  institution_id: string;
  amount: number;
  status: PaymentStatus;
  stripe_session_id: string;
  /** Client unlock key — mirrors stripe_session_id in this schema */
  unlock_token?: string | null;
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
