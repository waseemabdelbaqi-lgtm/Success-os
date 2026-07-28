import type { AdmissionProfileInput } from "@/src/types/admission";

export const ADMISSION_PROFILE_KEY = "sos_admission_profile";
export const ADMISSION_PAYMENT_KEY = "sos_admission_payment";

export type StoredPaymentUnlock = {
  paymentId: string;
  unlockToken: string;
  institutionId: string;
};

export function readAdmissionProfile(): AdmissionProfileInput | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ADMISSION_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as AdmissionProfileInput) : null;
  } catch {
    return null;
  }
}

export function writeAdmissionProfile(profile: AdmissionProfileInput) {
  sessionStorage.setItem(ADMISSION_PROFILE_KEY, JSON.stringify(profile));
}

export function readPaymentUnlock(institutionId: string): StoredPaymentUnlock | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ADMISSION_PAYMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPaymentUnlock;
    if (parsed.institutionId !== institutionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePaymentUnlock(payload: StoredPaymentUnlock) {
  sessionStorage.setItem(ADMISSION_PAYMENT_KEY, JSON.stringify(payload));
}
