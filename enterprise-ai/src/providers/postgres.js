import { firstEnv, ProviderNotConfiguredError } from "./base.js";

export function postgresConfigured() {
  return Boolean(firstEnv(["DATABASE_URL", "POSTGRES_URL"]));
}

/**
 * Connectivity probe using `pg` when installed; otherwise reports CONFIGURED_BUT_CLIENT_MISSING.
 */
export async function postgresHealth() {
  const cred = firstEnv(["DATABASE_URL", "POSTGRES_URL"]);
  if (!cred) throw new ProviderNotConfiguredError("postgres");
  try {
    const pg = await import("pg");
    const client = new pg.default.Client({
      connectionString: cred.value,
      connectionTimeoutMillis: 8000,
    });
    await client.connect();
    const r = await client.query("select 1 as ok");
    await client.end();
    return { provider: "postgres", ok: true, detail: "connected", result: r.rows?.[0] };
  } catch (err) {
    const msg = String(err?.message || err);
    if (/Cannot find package 'pg'|ERR_MODULE_NOT_FOUND/i.test(msg)) {
      return {
        provider: "postgres",
        ok: false,
        detail: "DATABASE_URL present but `pg` package not installed",
        configured: true,
      };
    }
    return { provider: "postgres", ok: false, detail: msg, configured: true };
  }
}
