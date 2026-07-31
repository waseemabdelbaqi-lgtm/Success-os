/**
 * Gate 3 orchestration + audit runner (executed via Next API or tsx).
 * Prefer: POST /api/global-curriculum { action: "run_pipeline" }
 */
import { applyMigrations } from "../src/lib/book-engine/db/client.ts";

console.log("Use: curl -X POST http://127.0.0.1:3000/api/global-curriculum -H 'content-type: application/json' -d '{\"action\":\"run_pipeline\"}'");
console.log("Or npm run gate3:pipeline");
applyMigrations();
