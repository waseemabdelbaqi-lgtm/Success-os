import type { AppEnvironment } from "@/types";

export type ClientEnv = {
  appName: string;
  appUrl: string;
  appEnv: AppEnvironment;
  firebase: FirebaseClientConfig;
  features: FeatureFlags;
};

export type ServerEnv = ClientEnv & {
  firebaseAdmin: FirebaseAdminConfig;
  auth: AuthConfig;
  logging: LoggingConfig;
};

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

export type FirebaseAdminConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  databaseURL?: string;
};

export type AuthConfig = {
  sessionCookieName: string;
  sessionCookieMaxAge: number;
  sessionMetaSecret: string;
  secureCookies: boolean;
};

export type FeatureFlags = {
  authEnabled: boolean;
  analyticsEnabled: boolean;
};

export type LoggingConfig = {
  level: "debug" | "info" | "warn" | "error";
};
