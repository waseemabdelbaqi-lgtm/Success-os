import assert from "node:assert/strict";
import test from "node:test";
import { validateConfiguration } from "../providers/config-validator.ts";

const LIVEAVATAR_VARS = ["LIVEAVATAR_API_KEY", "LIVEAVATAR_SARA_AVATAR_ID", "LIVEAVATAR_SARA_VOICE_AGENT_ID", "LIVEAVATAR_ALI_AVATAR_ID", "LIVEAVATAR_ALI_VOICE_AGENT_ID"];

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const originals: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    originals[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(originals)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test("Sara is blocked (not ready) when no LiveAvatar vars are set (the current real state)", () => {
  const alreadySet = LIVEAVATAR_VARS.filter((n) => process.env[n]);
  if (alreadySet.length > 0) return; // skip if this run somehow has real credentials

  const result = validateConfiguration();
  assert.equal(result.sara.ready, false);
  assert.equal(result.blocked, true);
  assert.deepEqual(result.sara.missingVariables, ["LIVEAVATAR_API_KEY", "LIVEAVATAR_SARA_AVATAR_ID", "LIVEAVATAR_SARA_VOICE_AGENT_ID"]);
});

test("Sara becomes ready with ONLY LiveAvatar's 3 vars set — ElevenLabs is never required", () => {
  withEnv(
    { LIVEAVATAR_API_KEY: "test-key", LIVEAVATAR_SARA_AVATAR_ID: "073b60a9-89a8-45aa-8902-c358f64d2852", LIVEAVATAR_SARA_VOICE_AGENT_ID: "6221651b-b6b7-45a7-8702-f8a7d1f4fb9b" },
    () => {
      const result = validateConfiguration();
      assert.equal(result.sara.ready, true);
      assert.equal(result.blocked, false);
      assert.deepEqual(result.sara.missingVariables, []);
      assert.equal(result.elevenLabsApiKey, "MISSING", "ElevenLabs remaining unset must not affect Sara's readiness");
    }
  );
});

test("Ali's readiness is tracked independently of Sara's", () => {
  withEnv(
    { LIVEAVATAR_API_KEY: "test-key", LIVEAVATAR_SARA_AVATAR_ID: "sara-avatar", LIVEAVATAR_SARA_VOICE_AGENT_ID: "sara-voice", LIVEAVATAR_ALI_AVATAR_ID: undefined, LIVEAVATAR_ALI_VOICE_AGENT_ID: undefined },
    () => {
      const result = validateConfiguration();
      assert.equal(result.sara.ready, true);
      assert.equal(result.ali.ready, false);
      assert.ok(result.ali.missingVariables.includes("LIVEAVATAR_ALI_AVATAR_ID"));
      assert.ok(result.ali.missingVariables.includes("LIVEAVATAR_ALI_VOICE_AGENT_ID"));
    }
  );
});

test("validator never returns the actual secret/id values, only SET/MISSING", () => {
  withEnv({ LIVEAVATAR_API_KEY: "sk-super-secret-value-not-to-leak" }, () => {
    const result = validateConfiguration();
    const serialized = JSON.stringify(result);
    assert.ok(!serialized.includes("sk-super-secret-value-not-to-leak"));
    assert.equal(result.liveAvatarApiKey, "SET");
  });
});
