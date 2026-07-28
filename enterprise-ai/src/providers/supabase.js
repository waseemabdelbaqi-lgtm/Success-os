import { firstEnv, httpJson, ProviderNotConfiguredError } from "./base.js";

export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && firstEnv(["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"]));
}

export async function supabaseHealth() {
  if (!supabaseConfigured()) throw new ProviderNotConfiguredError("supabase");
  const key = firstEnv(["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"]).value;
  const base = process.env.SUPABASE_URL.replace(/\/$/, "");
  try {
    const data = await httpJson(`${base}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      timeoutMs: 10000,
    });
    return { provider: "supabase", ok: true, detail: "rest endpoint reachable", dataType: typeof data };
  } catch (err) {
    return { provider: "supabase", ok: false, detail: String(err?.message || err) };
  }
}
