import type { UserRole } from "@/types/roles";
import type { Permission } from "@/types/permissions";
import type { UserStatus } from "@/types/auth";

export const SESSION_META_COOKIE_NAME = "__session_meta";

export type SessionMeta = {
  uid: string;
  role: UserRole;
  permissions: Permission[];
  status: UserStatus;
  exp: number;
};

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64UrlToBytes(data: string): Uint8Array {
  const padded = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function fromBase64UrlToString(data: string): string {
  return new TextDecoder().decode(fromBase64UrlToBytes(data));
}

function encodeUtf8(value: string): ArrayBuffer {
  return new TextEncoder().encode(value).buffer.slice(0);
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }

  return mismatch === 0;
}

async function hmacSha256Base64Url(
  payload: string,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encodeUtf8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encodeUtf8(payload),
  );
  return toBase64Url(new Uint8Array(signature));
}

export async function signSessionMeta(
  meta: SessionMeta,
  secret: string,
): Promise<string> {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(meta)));
  const signature = await hmacSha256Base64Url(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionMeta(
  token: string,
  secret: string,
): Promise<SessionMeta | null> {
  const parts = token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts as [string, string];
  const expectedSignature = await hmacSha256Base64Url(payload, secret);

  const sigBytes = fromBase64UrlToBytes(signature);
  const expectedBytes = fromBase64UrlToBytes(expectedSignature);

  if (!timingSafeEqual(sigBytes, expectedBytes)) {
    return null;
  }

  try {
    const meta = JSON.parse(fromBase64UrlToString(payload)) as SessionMeta;

    if (meta.exp < Date.now()) {
      return null;
    }

    return meta;
  } catch {
    return null;
  }
}

export function buildSessionMetaCookieHeader(
  value: string,
  maxAge: number,
  secure: boolean,
): string {
  const parts = [
    `${SESSION_META_COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function buildClearSessionMetaCookieHeader(secure: boolean): string {
  const parts = [
    `${SESSION_META_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function createSessionMetaFromClaims(
  uid: string,
  role: UserRole,
  permissions: Permission[],
  status: UserStatus,
  maxAgeSeconds: number,
): SessionMeta {
  return {
    uid,
    role,
    permissions,
    status,
    exp: Date.now() + maxAgeSeconds * 1000,
  };
}
