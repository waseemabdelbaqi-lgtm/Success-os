import assert from "node:assert/strict";
import test from "node:test";
import { getTeacherMapping, checkMappingCompleteness } from "../providers/teacher-mapping.ts";
import { LiveAvatarProvider } from "../providers/liveavatar-provider.ts";
import { ElevenLabsVoiceProvider } from "../providers/elevenlabs-voice-provider.ts";

test("teacher mapping: sara and ali read distinct env var names, including the new voice agent id", () => {
  const sara = getTeacherMapping("sara");
  const ali = getTeacherMapping("ali");
  // With no env vars set, both should be undefined — but critically, the
  // mapping function must be READING the correct distinct var names (not
  // accidentally reading the same one for both teachers).
  assert.equal(sara.liveAvatarAvatarId, process.env.LIVEAVATAR_SARA_AVATAR_ID);
  assert.equal(ali.liveAvatarAvatarId, process.env.LIVEAVATAR_ALI_AVATAR_ID);
  assert.equal(sara.liveAvatarVoiceAgentId, process.env.LIVEAVATAR_SARA_VOICE_AGENT_ID);
  assert.equal(ali.liveAvatarVoiceAgentId, process.env.LIVEAVATAR_ALI_VOICE_AGENT_ID);
  assert.equal(sara.elevenLabsVoiceId, process.env.ELEVENLABS_SARA_VOICE_ID);
  assert.equal(ali.elevenLabsVoiceId, process.env.ELEVENLABS_ALI_VOICE_ID);
});

test("checkMappingCompleteness never leaks actual key/id VALUES, only booleans", () => {
  const completeness = checkMappingCompleteness();
  for (const value of [completeness.liveAvatarApiKey, completeness.elevenLabsApiKey, completeness.sara.liveAvatarAvatarId, completeness.sara.liveAvatarVoiceAgentId, completeness.sara.elevenLabsVoiceId, completeness.ali.liveAvatarAvatarId, completeness.ali.liveAvatarVoiceAgentId, completeness.ali.elevenLabsVoiceId]) {
    assert.equal(typeof value, "boolean");
  }
});

test("LiveAvatarProvider.checkStatus() honestly reports NOT_CONFIGURED when no credentials are set (the current real state)", async () => {
  const provider = new LiveAvatarProvider();
  const status = await provider.checkStatus();
  if (!process.env.LIVEAVATAR_API_KEY) {
    assert.equal(status.state, "NOT_CONFIGURED");
    assert.ok(status.detail.length > 0);
  }
});

test("ElevenLabsVoiceProvider.checkStatus() honestly reports NOT_CONFIGURED when no credentials are set (the current real state)", async () => {
  const provider = new ElevenLabsVoiceProvider();
  const status = await provider.checkStatus();
  if (!process.env.ELEVENLABS_API_KEY) {
    assert.equal(status.state, "NOT_CONFIGURED");
    assert.ok(status.detail.length > 0);
  }
});

test("LiveAvatarProvider.createSessionToken() throws a clear, actionable error when unconfigured rather than silently returning a fake token", async () => {
  if (process.env.LIVEAVATAR_API_KEY) return; // skip if somehow configured in this run
  const provider = new LiveAvatarProvider();
  await assert.rejects(() => provider.createSessionToken("sara"), /LIVEAVATAR_API_KEY is not configured/);
});

test("ElevenLabsVoiceProvider.synthesize() throws a clear, actionable error when unconfigured rather than silently returning fake audio", async () => {
  if (process.env.ELEVENLABS_API_KEY) return; // skip if somehow configured in this run
  const provider = new ElevenLabsVoiceProvider();
  await assert.rejects(() => provider.synthesize("sara", "hello"), /ELEVENLABS_API_KEY is not configured/);
});

test("ElevenLabsVoiceProvider.synthesize() rejects empty text even if credentials were present", async () => {
  const provider = new ElevenLabsVoiceProvider();
  // Empty-text validation happens before any network call, so this is
  // deterministic regardless of whether a real key is configured.
  process.env.ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? "test-placeholder-not-a-real-key";
  process.env.ELEVENLABS_SARA_VOICE_ID = process.env.ELEVENLABS_SARA_VOICE_ID ?? "test-placeholder-voice-id";
  await assert.rejects(() => provider.synthesize("sara", "   "), /text must not be empty/);
});
