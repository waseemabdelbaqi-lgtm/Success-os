#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

const catalogPath = path.join(root, "content/media/ai-teachers/catalog.json");
assert(fs.existsSync(catalogPath), "Missing catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
assert(catalog.schema === "success-os.ai-teachers.v1", "Bad catalog schema");
assert(Array.isArray(catalog.teachers) && catalog.teachers.length >= 4, "Need ≥4 teachers");

const females = catalog.teachers.filter((t) => t.gender === "female");
const males = catalog.teachers.filter((t) => t.gender === "male");
assert(females.length >= 2, "Need ≥2 female teachers");
assert(males.length >= 2, "Need ≥2 male teachers");

for (const t of catalog.teachers) {
  const portrait = path.join(root, "content/media/ai-teachers", t.id, "portrait.png");
  assert(fs.existsSync(portrait), `Missing portrait for ${t.id}`);
  assert(fs.statSync(portrait).size > 50_000, `Portrait too small: ${t.id}`);
  const posesDir = path.join(root, "content/media/ai-teachers", t.id, "poses");
  assert(fs.existsSync(posesDir), `Missing poses dir for ${t.id}`);
  const poses = fs.readdirSync(posesDir).filter((f) => f.endsWith(".png"));
  assert(poses.length >= 1, `Need ≥1 pose for ${t.id}`);
  const pubPortrait = path.join(root, "public/media/ai-teachers", t.id, "portrait.png");
  assert(fs.existsSync(pubPortrait), `Missing public portrait for ${t.id}`);
}

assert(fs.existsSync(path.join(root, "public/media/ai-teachers/index.html")), "Missing preview HTML");
assert(fs.existsSync(path.join(root, "lib/ai-teachers/catalog.ts")), "Missing catalog.ts");
assert(fs.existsSync(path.join(root, "types/ai-teachers.ts")), "Missing types");
assert(fs.existsSync(path.join(root, "app/ai-teachers/page.tsx")), "Missing app page");
assert(fs.existsSync(path.join(root, "app/api/ai-teachers/route.ts")), "Missing API route");

// Ensure TS catalog exports expected ids (static parse)
const ts = fs.readFileSync(path.join(root, "lib/ai-teachers/catalog.ts"), "utf8");
for (const id of ["sara", "omar", "layla", "waseem"]) {
  assert(ts.includes(`id: "${id}"`), `catalog.ts missing ${id}`);
}

if (failures.length) {
  console.error("validate-ai-teachers FAILED:");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}
console.log("validate-ai-teachers OK");
console.log(`teachers=${catalog.teachers.length} female=${females.length} male=${males.length}`);
void pathToFileURL;
