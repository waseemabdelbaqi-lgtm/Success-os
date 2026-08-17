import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTeacherId, isValidTeacherId, requireTeacherId, TEACHER_IDS } from "../teacher-identity.ts";

test("only sara and ali are registered teacher ids", () => {
  assert.deepEqual([...TEACHER_IDS], ["sara", "ali"]);
});

test("sara and ali are accepted as-is", () => {
  assert.equal(normalizeTeacherId("sara"), "sara");
  assert.equal(normalizeTeacherId("ali"), "ali");
});

test("teacher ids are case-insensitive and trimmed", () => {
  assert.equal(normalizeTeacherId("SARA"), "sara");
  assert.equal(normalizeTeacherId("  Ali  "), "ali");
});

test("sarah normalizes to sara", () => {
  assert.equal(normalizeTeacherId("sarah"), "sara");
  assert.equal(normalizeTeacherId("Sarah"), "sara");
  assert.equal(normalizeTeacherId("SARAH"), "sara");
});

test("unknown teachers are rejected (return null, not a guess)", () => {
  assert.equal(normalizeTeacherId("bob"), null);
  assert.equal(normalizeTeacherId("mike"), null);
  assert.equal(normalizeTeacherId("teacher1"), null);
  assert.equal(normalizeTeacherId(""), null);
});

test("isValidTeacherId matches normalizeTeacherId behavior", () => {
  assert.equal(isValidTeacherId("sara"), true);
  assert.equal(isValidTeacherId("sarah"), true);
  assert.equal(isValidTeacherId("bob"), false);
});

test("requireTeacherId throws a clear error for unknown teachers", () => {
  assert.throws(() => requireTeacherId("bob"), /not a recognized teacher/);
});

test("requireTeacherId returns the canonical id for valid/aliased input", () => {
  assert.equal(requireTeacherId("Sarah"), "sara");
  assert.equal(requireTeacherId("ALI"), "ali");
});
