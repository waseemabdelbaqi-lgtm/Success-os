import assert from "node:assert/strict";
import test from "node:test";
import { BoundedMemorySessionStore } from "../session-store.ts";

function session(id: string, stage: "INITIALIZE" | "PLAN" = "INITIALIZE") {
  return { sessionId: id, teacherId: "sara" as const, subject: "physics", lesson: "motion", stage };
}

test("session store records creation and stage advancement", () => {
  const store = new BoundedMemorySessionStore();
  store.put(session("one"), "created");
  store.put(session("one", "PLAN"), "advanced");
  assert.equal(store.get("one")?.stage, "PLAN");
  assert.deepEqual(store.audit("one").map((event) => event.action), ["created", "advanced"]);
});

test("session store evicts the oldest session at its configured bound", () => {
  const store = new BoundedMemorySessionStore(2, 10);
  store.put(session("one"), "created");
  store.put(session("two"), "created");
  store.put(session("three"), "created");
  assert.equal(store.get("one"), undefined);
  assert.equal(store.count(), 2);
});

