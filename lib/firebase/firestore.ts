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
} as const;
