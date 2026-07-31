import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { createWriteStream, createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { STORAGE_ROOT } from "../db/store.js";

/** S3-compatible local object storage (swap to AWS/MinIO via env later). */
export function objectKey(...parts) {
  return parts.map((p) => String(p).replace(/[^a-zA-Z0-9._\-/]/g, "_")).join("/");
}

export function resolveObjectPath(key) {
  const full = path.join(STORAGE_ROOT, key);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  return full;
}

export async function putStreamFromUrl(url, key, { headers = {}, timeoutMs = 280000, resume = true } = {}) {
  const dest = resolveObjectPath(key);
  const partial = `${dest}.partial`;
  let start = 0;
  if (resume && fs.existsSync(partial)) start = fs.statSync(partial).size;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const reqHeaders = {
      "User-Agent":
        "SUCCESS-OS-CurriculumWorker/1.0 (+https://successos.local; educational ingestion)",
      Accept: "application/pdf,*/*",
      ...headers,
    };
    if (start > 0) reqHeaders.Range = `bytes=${start}-`;

    const res = await fetch(url, { headers: reqHeaders, signal: controller.signal, redirect: "follow" });
    if (!(res.ok || res.status === 206)) {
      throw new Error(`DOWNLOAD_HTTP_${res.status}`);
    }
    if (!res.body) throw new Error("EMPTY_BODY");

    // If server ignores Range and returns 200, restart file to avoid corruption.
    let writeStart = start;
    if (start > 0 && res.status === 200) writeStart = 0;
    const ws = createWriteStream(partial, { flags: writeStart > 0 ? "a" : "w" });
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const buf = Buffer.from(value);
      if (!ws.write(buf)) await new Promise((r) => ws.once("drain", r));
    }
    await new Promise((resolve, reject) => {
      ws.end(() => resolve());
      ws.on("error", reject);
    });

    fs.renameSync(partial, dest);
    const sha256 = await sha256File(dest);
    return { key, path: dest, size: fs.statSync(dest).size, sha256 };
  } finally {
    clearTimeout(timer);
  }
}

export async function sha256File(filePath) {
  return await new Promise((resolve, reject) => {
    const h = createHash("sha256");
    const s = createReadStream(filePath);
    s.on("data", (d) => h.update(d));
    s.on("error", reject);
    s.on("end", () => resolve(h.digest("hex")));
  });
}

export function storageStats() {
  let files = 0;
  let bytes = 0;
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else {
        files += 1;
        bytes += fs.statSync(p).size;
      }
    }
  };
  walk(STORAGE_ROOT);
  return { files, bytes, root: STORAGE_ROOT };
}

export function newId(prefix = "id") {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
