/**
 * S3-compatible cloud object storage adapter.
 * Production: set S3_BUCKET + AWS credentials (or S3_* endpoint for MinIO/R2).
 * Local fallback remains object-store.js when CURRICULUM_STORAGE_BACKEND=local.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { STORAGE_ROOT } from "../db/store.js";

export function storageBackend() {
  return process.env.CURRICULUM_STORAGE_BACKEND || "local";
}

export function productionStorageStatus() {
  const backend = storageBackend();
  if (backend === "s3" || backend === "minio" || backend === "r2") {
    const bucket = process.env.S3_BUCKET || process.env.CURRICULUM_S3_BUCKET;
    const endpoint = process.env.S3_ENDPOINT || null;
    if (!bucket) {
      return {
        status: "NOT_CONFIGURED",
        backend,
        detail: "S3_BUCKET missing",
      };
    }
    return {
      status: "CONFIGURED",
      backend,
      bucket,
      endpoint,
      region: process.env.AWS_REGION || process.env.S3_REGION || "auto",
    };
  }
  return {
    status: "LOCAL_DEV_ONLY",
    backend: "local",
    root: STORAGE_ROOT,
    detail: "Production requires CURRICULUM_STORAGE_BACKEND=s3|minio|r2",
  };
}

export async function putObjectLocalFallback(key, filePath) {
  const dest = path.join(STORAGE_ROOT, key);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(filePath, dest);
  const buf = fs.readFileSync(dest);
  return {
    key,
    size: buf.length,
    sha256: createHash("sha256").update(buf).digest("hex"),
    backend: "local-fallback",
  };
}
