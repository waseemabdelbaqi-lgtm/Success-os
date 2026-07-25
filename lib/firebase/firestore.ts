import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp } from "@/lib/firebase/admin";

let firestore: Firestore | undefined;

export function getAdminFirestore(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getFirebaseAdminApp());
  }

  return firestore;
}

export const COLLECTIONS = {
  USERS: "users",
  ROLE_AUDIT_LOG: "role_audit_log",
  /** Admission funnel (partner route persistence when Admin SDK is live). */
  ADMISSION_PROFILES: "admission_profiles",
  ADMISSION_PAYMENTS: "admission_payments",
  ADMISSION_APPLICATIONS: "admission_applications",
  ADMISSION_NOTIFICATIONS: "admission_notifications",
} as const;
