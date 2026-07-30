/** Minimal structured logger — never logs secret values. */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

export function createLogger({ level = "info" } = {}) {
  const threshold = LEVELS[String(level).toLowerCase()] ?? LEVELS.info;
  function emit(lvl, msg, meta) {
    if ((LEVELS[lvl] ?? 99) > threshold) return;
    const line = {
      level: lvl,
      msg: String(msg),
      ...(meta && typeof meta === "object" ? sanitize(meta) : {}),
      at: new Date().toISOString(),
    };
    const out = lvl === "error" ? console.error : console.log;
    out(JSON.stringify(line));
  }
  return {
    error: (msg, meta) => emit("error", msg, meta),
    warn: (msg, meta) => emit("warn", msg, meta),
    info: (msg, meta) => emit("info", msg, meta),
    debug: (msg, meta) => emit("debug", msg, meta),
  };
}

function sanitize(meta) {
  const blocked = /key|secret|token|password|authorization|api[_-]?key/i;
  const out = {};
  for (const [k, v] of Object.entries(meta)) {
    if (blocked.test(k)) out[k] = "[redacted]";
    else out[k] = v;
  }
  return out;
}
