import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

let adminApp: App | undefined;
let adminAuth: Auth | undefined;

function createAdminApp(): App {
  const env = getServerEnv();

  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  logger.info("Initializing Firebase Admin SDK", {
    projectId: env.firebaseAdmin.projectId,
  });

  return initializeApp({
    credential: cert({
      projectId: env.firebaseAdmin.projectId,
      clientEmail: env.firebaseAdmin.clientEmail,
      privateKey: env.firebaseAdmin.privateKey,
    }),
    projectId: env.firebaseAdmin.projectId,
    databaseURL: env.firebaseAdmin.databaseURL,
  });
}

export function getFirebaseAdminApp(): App {
  if (!adminApp) {
    adminApp = createAdminApp();
  }

  return adminApp;
}

export function getFirebaseAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(getFirebaseAdminApp());
  }

  return adminAuth;
}
