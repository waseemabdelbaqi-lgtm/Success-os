import { z } from "zod";

const appEnvironmentSchema = z.enum([
  "development",
  "staging",
  "production",
  "test",
]);

const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Success OS"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: appEnvironmentSchema.default("development"),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_APPLE_SIGNIN_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  FEATURE_AUTH_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  FEATURE_ANALYTICS_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const serverEnvSchema = clientEnvSchema.extend({
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_DATABASE_URL: z.string().url().optional(),
  AUTH_SESSION_COOKIE_NAME: z.string().min(1).default("__session"),
  AUTH_SESSION_COOKIE_MAX_AGE: z.coerce.number().int().positive().default(432000),
  AUTH_SESSION_META_SECRET: z.string().min(32).default("ci-placeholder-session-meta-secret-32chars"),
  AUTH_SECURE_COOKIES: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  LOG_LEVEL: logLevelSchema.default("info"),
});

export type ValidatedClientEnv = z.infer<typeof clientEnvSchema>;
export type ValidatedServerEnv = z.infer<typeof serverEnvSchema>;

function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

export function validateClientEnv(
  env: NodeJS.ProcessEnv = process.env,
): ValidatedClientEnv {
  const result = clientEnvSchema.safeParse(env);

  if (!result.success) {
    throw new Error(
      `Invalid client environment variables:\n${formatZodErrors(result.error)}`,
    );
  }

  return result.data;
}

export function validateServerEnv(
  env: NodeJS.ProcessEnv = process.env,
): ValidatedServerEnv {
  const result = serverEnvSchema.safeParse(env);

  if (!result.success) {
    throw new Error(
      `Invalid server environment variables:\n${formatZodErrors(result.error)}`,
    );
  }

  return result.data;
}

export function validatePublicEnvOnly(
  env: NodeJS.ProcessEnv = process.env,
): ValidatedClientEnv {
  return validateClientEnv(env);
}
