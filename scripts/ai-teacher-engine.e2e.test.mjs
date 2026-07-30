#!/usr/bin/env node
/**
 * ATE end-to-end API handler tests (no browser).
 * Exercises GET/POST route handlers with Request objects.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "scripts/_ate_e2e_runner.ts");

fs.writeFileSync(
  runner,
  `
import assert from "node:assert/strict";
import { GET, POST } from "../app/api/ai-teacher-engine/route.ts";
import { resetAteStoreForTests } from "../lib/ai-teacher-engine/index.ts";

async function read(res: Response) {
  const json = await res.json();
  return { status: res.status, json };
}

async function main() {
  resetAteStoreForTests();

  {
    const { status, json } = await read(
      await GET(new Request("http://local.test/api/ai-teacher-engine?action=status"), {}),
    );
    assert.equal(status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.schema, "success-os.ai-teacher-engine.v1");
    assert.equal(json.data.notAChatbot, true);
  }

  {
    const { status, json } = await read(
      await GET(
        new Request(
          "http://local.test/api/ai-teacher-engine?action=demo&utterance=I%20don%27t%20understand%20this.",
        ),
        {},
      ),
    );
    assert.equal(status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.ok, true);
    assert.equal(json.data.turn.intent, "dont_understand");
    assert.equal(json.data.turn.aiContentGenerated, false);
  }

  {
    const { status, json } = await read(
      await POST(
        new Request("http://local.test/api/ai-teacher-engine", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "chat",
            studentId: "stu_e2e",
            utterance: "Help",
          }),
        }),
        {},
      ),
    );
    assert.equal(status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, "VALIDATION_ERROR");
  }

  {
    const { status, json } = await read(
      await POST(
        new Request("http://local.test/api/ai-teacher-engine", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "chat",
            studentId: "stu_e2e_ok",
            studentName: "Lina",
            countryId: "AE",
            curriculumId: "AE-MOE",
            gradeId: "GRD-00007",
            focusLessonId: "AE-MOE-G07-MATH-B01-U01-L02",
            utterance: "Teach me slowly",
            language: "en",
          }),
        }),
        {},
      ),
    );
    assert.equal(status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.turn.intent, "teach_slowly");
    assert.equal(json.data.turn.memory.currentCurriculumId, "AE-MOE");
    assert.ok(json.data.turn.sessionId.startsWith("ate_"));
  }

  {
    const { status, json } = await read(
      await GET(new Request("http://local.test/api/ai-teacher-engine?action=nope"), {}),
    );
    assert.equal(status, 400);
    assert.equal(json.success, false);
  }

  console.log("ATE e2e API handler OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
`,
);

const result = spawnSync("npx", ["--yes", "tsx", runner], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, ATE_DEV_OPEN: "1" },
  stdio: "inherit",
});

try {
  fs.unlinkSync(runner);
} catch {
  // ignore
}

process.exit(result.status ?? 1);
