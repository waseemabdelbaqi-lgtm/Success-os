import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let connection;

export function getRedis() {
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }
  return connection;
}

export const QUEUE_NAMES = {
  discovery: "curriculum-discovery",
  download: "curriculum-download",
  validate: "curriculum-validate",
  extract: "curriculum-extract",
  structure: "curriculum-structure",
  aiDraft: "curriculum-ai-draft",
  review: "curriculum-review",
};

const queues = {};

export function getQueue(name) {
  if (!queues[name]) {
    queues[name] = new Queue(name, { connection: getRedis() });
  }
  return queues[name];
}

export async function enqueue(name, payload, opts = {}) {
  const q = getQueue(name);
  return q.add(name, payload, {
    attempts: opts.attempts ?? 5,
    backoff: { type: "exponential", delay: opts.delay ?? 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
    ...opts,
  });
}

export function startWorker(name, processor, concurrency = 1) {
  const worker = new Worker(name, processor, {
    connection: getRedis(),
    concurrency,
  });
  worker.on("failed", (job, err) => {
    console.error(`[worker:${name}] failed`, job?.id, err?.message);
  });
  worker.on("completed", (job) => {
    console.log(`[worker:${name}] completed`, job?.id);
  });
  return worker;
}

export async function queueHealth() {
  const redis = getRedis();
  const pong = await redis.ping();
  const counts = {};
  for (const name of Object.values(QUEUE_NAMES)) {
    const q = getQueue(name);
    counts[name] = await q.getJobCounts("waiting", "active", "completed", "failed", "delayed");
  }
  return { redis: pong, counts };
}
