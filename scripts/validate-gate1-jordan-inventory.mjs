#!/usr/bin/env node
/**
 * GATE 1 — Official inventory automated validation.
 * Exit 0 only when Gate 1 acceptance criteria pass.
 * Currently expected to FAIL until editions and NCCD verification are complete.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

const queuePath = join(root, "data/jordan-books/production-queue.json");
const inventoryPath = join(root, "src/lib/jordan-books/matrix/master-inventory.ts");
const curriculumPath = join(root, "app/data/jordan-curriculum.js");
const auditPath = join(root, "docs/gate1-jordan-inventory-audit.md");

if (!existsSync(auditPath)) fail("Missing docs/gate1-jordan-inventory-audit.md");
if (!existsSync(inventoryPath)) fail("Missing master-inventory.ts");
if (!existsSync(curriculumPath)) fail("Missing jordan-curriculum.js");
if (!existsSync(queuePath)) fail("Missing production-queue.json inventory snapshot");

let cells = [];
if (existsSync(queuePath)) {
  const raw = JSON.parse(readFileSync(queuePath, "utf8"));
  cells = raw.cells || [];
}

if (cells.length === 0) fail("Inventory has zero cells");

const verifiedCombos = new Set();
let official = 0;
let officialEditionOk = 0;
let inventedCompleteOfficial = 0;
let notDiscovered = 0;
let pendingIndexed = 0;

for (const c of cells) {
  const editionBad =
    !c.curriculumVersion ||
    !c.academicYear ||
    String(c.curriculumVersion).includes("NEEDS VERIFICATION") ||
    String(c.academicYear).includes("NEEDS VERIFICATION");

  if (c.subjectListStatus === "not_discovered" || c.matrixStatus === "NOT_DISCOVERED") {
    notDiscovered += 1;
  }
  if (c.subjectListStatus === "indexed-pending-nccd") pendingIndexed += 1;

  if (c.subjectListStatus === "verified" && c.subjectAr && !String(c.subjectAr).startsWith("(")) {
    verifiedCombos.add(`${c.gradeKey}|${c.pathway}|${c.subjectAr}`);
  }

  if (c.bookType !== "sos_companion") {
    official += 1;
    if (!editionBad) officialEditionOk += 1;
    // Empty completion: official row marked COMPLETE-like without edition/structure
    if (
      ["CONTENT_COMPLETE", "PUBLISHED", "COMPLETE"].includes(c.matrixStatus) &&
      (editionBad || !c.structuredBookId)
    ) {
      inventedCompleteOfficial += 1;
    }
  }
}

if (officialEditionOk === 0) {
  fail(
    `No official book rows have verified curriculumVersion/academicYear (0/${official}). All editions still NEEDS VERIFICATION.`,
  );
}

if (officialEditionOk < official) {
  fail(
    `Official edition coverage incomplete: ${officialEditionOk}/${official} rows have verified editions.`,
  );
}

if (inventedCompleteOfficial > 0) {
  fail(
    `${inventedCompleteOfficial} official rows marked complete without edition/structure — empty completion forbidden.`,
  );
}

// Gate 1 requires verified subject lists beyond only G1+G11 unless remaining are explicitly NOT_DISCOVERED with blockers
const gradesNeedingLists = ["kg1", "kg2", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12", "11-vocational", "12-vocational"];
for (const g of gradesNeedingLists) {
  const gradeCells = cells.filter((c) => c.gradeKey === g);
  if (!gradeCells.length) {
    fail(`Grade/pathway ${g} missing from inventory`);
    continue;
  }
  const statuses = new Set(gradeCells.map((c) => c.subjectListStatus));
  if (statuses.has("indexed-pending-nccd")) {
    fail(`Grade/pathway ${g} still indexed-pending-nccd — not NCCD-verified for Gate 1`);
  }
  if (statuses.has("not_discovered")) {
    warn(`Grade/pathway ${g} NOT_DISCOVERED — allowed only as explicit blocker, not as complete inventory`);
  }
}

if (verifiedCombos.size < 19) {
  fail(`Expected at least G1+G11 verified subject combos (19); found ${verifiedCombos.size}`);
}

// Companion CONTENT_COMPLETE must not be reported as Gate 1 pass
const companionComplete = cells.filter(
  (c) => c.bookType === "sos_companion" && c.matrixStatus === "CONTENT_COMPLETE",
).length;
if (companionComplete > 0) {
  warn(
    `${companionComplete} SOS companion rows are CONTENT_COMPLETE — these do NOT satisfy Gate 1 official inventory completion`,
  );
}

const report = {
  gate: 1,
  name: "Official Inventory",
  passed: errors.length === 0,
  errors,
  warnings,
  stats: {
    totalCells: cells.length,
    officialRows: official,
    officialEditionVerified: officialEditionOk,
    verifiedSubjectCombos: verifiedCombos.size,
    notDiscoveredRows: notDiscovered,
    pendingIndexedRows: pendingIndexed,
    companionContentComplete: companionComplete,
  },
};

console.log(JSON.stringify(report, null, 2));
if (!report.passed) {
  console.error("\nGATE 1 FAIL — fix inventory verification before proceeding.");
  process.exit(1);
}
console.log("\nGATE 1 PASS");
process.exit(0);
