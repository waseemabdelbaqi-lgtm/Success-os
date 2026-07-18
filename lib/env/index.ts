import { validateClientEnv, validateServerEnv } from "@/lib/env/schema";
import type { ClientEnv, ServerEnv } from "@/types/env";

let cachedClientEnv: ClientEnv | null = null;
let cachedServerEnv: ServerEnv | null = null;

function mapClientEnv(): ClientEnv {
  const env = validateClientEnv();

  return {
    appName: env.NEXT_PUBLIC_APP_NAME,
    appUrl: env.NEXT_PUBLIC_APP_URL,
    appEnv: env.NEXT_PUBLIC_APP_ENV,
    firebase: {
      apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    },
    features: {
      authEnabled: env.FEATURE_AUTH_ENABLED,
      analyticsEnabled: env.FEATURE_ANALYTICS_ENABLED,
    },
  };
}

function mapServerEnv(): ServerEnv {
  const clientEnv = getClientEnv();
  const env = validateServerEnv();

  return {
    ...clientEnv,
    firebaseAdmin: {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      databaseURL: env.FIREBASE_DATABASE_URL,
    },
    auth: {
      sessionCookieName: env.AUTH_SESSION_COOKIE_NAME,
      sessionCookieMaxAge: env.AUTH_SESSION_COOKIE_MAX_AGE,
      sessionMetaSecret: env.AUTH_SESSION_META_SECRET,
      secureCookies: env.AUTH_SECURE_COOKIES,
    },
    logging: {
      level: env.LOG_LEVEL,
    },
  };
}

export function getClientEnv(): ClientEnv {
  if (!cachedClientEnv) {
    cachedClientEnv = mapClientEnv();
  }

  return cachedClientEnv;
}

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() must only be called on the server.");
  }

  if (!cachedServerEnv) {
    cachedServerEnv = mapServerEnv();
  }

  return cachedServerEnv;
}

export function resetEnvCache(): void {
  cachedClientEnv = null;
  cachedServerEnv = null;
}
