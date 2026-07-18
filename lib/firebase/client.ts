import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getClientEnv } from "@/lib/env";

let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;

function createFirebaseApp(): FirebaseApp {
  const env = getClientEnv();

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    apiKey: env.firebase.apiKey,
    authDomain: env.firebase.authDomain,
    projectId: env.firebase.projectId,
    storageBucket: env.firebase.storageBucket,
    messagingSenderId: env.firebase.messagingSenderId,
    appId: env.firebase.appId,
    measurementId: env.firebase.measurementId,
  });
}

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    firebaseApp = createFirebaseApp();
  }

  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp());

    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST
    ) {
      connectAuthEmulator(
        firebaseAuth,
        `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`,
        { disableWarnings: true },
      );
    }
  }

  return firebaseAuth;
}
