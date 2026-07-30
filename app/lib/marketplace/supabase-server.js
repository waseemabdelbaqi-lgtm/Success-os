/**
 * Server-only Supabase client for marketplace persistence.
 * NEVER import this module from client components.
 * NEVER expose the service-role key to the browser.
 *
 * @supabase/supabase-js is optional until installed + configured.
 */

let _admin = null;
let _anon = null;
let _createClient = undefined;

async function loadCreateClientAsync() {
  if (_createClient !== undefined) return _createClient;
  try {
    const mod = await import('@supabase/supabase-js');
    _createClient = mod.createClient;
  } catch {
    _createClient = null;
  }
  return _createClient;
}

function envReadyForService() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key && !String(key).startsWith('change-me'));
}

export function marketplaceSupabaseConfigured() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !String(key).startsWith('change-me'));
}

/**
 * Sync accessor — returns cached client or null.
 * Call warmMarketplaceSupabase() once on server boot if using Supabase.
 */
export function getMarketplaceServiceClient() {
  if (_admin) return _admin;
  if (!envReadyForService()) return null;
  if (!_createClient) return null;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  _admin = _createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

export async function warmMarketplaceSupabase() {
  const createClient = await loadCreateClientAsync();
  if (!createClient || !envReadyForService()) return null;
  return getMarketplaceServiceClient();
}

export function getMarketplaceAnonClient() {
  if (_anon) return _anon;
  if (!_createClient) return null;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || String(key).startsWith('change-me')) return null;
  _anon = _createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _anon;
}

export function hasServiceRole() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(key && !String(key).startsWith('change-me'));
}

export function assertNoServiceRoleInPublicEnv() {
  const publicKeys = [
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY,
  ];
  if (publicKeys.some((k) => k && String(k).trim())) {
    throw new Error('SERVICE_ROLE_EXPOSED_TO_PUBLIC_ENV');
  }
  return true;
}
