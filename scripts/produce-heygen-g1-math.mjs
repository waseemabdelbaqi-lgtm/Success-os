#!/usr/bin/env node
/**
 * Produce a real moving AI assistant teacher via HeyGen/Synthesia.
 *
 * Requires in .env.local (then restart Next):
 *   HEYGEN_API_KEY + HEYGEN_AVATAR_ID + HEYGEN_VOICE_ID
 * or SYNTHESIA_API_KEY + SYNTHESIA_AVATAR_ID
 *
 * Usage (server must be running):
 *   node scripts/produce-heygen-g1-math.mjs
 *   node scripts/produce-heygen-g1-math.mjs --refresh
 *   node scripts/produce-heygen-g1-math.mjs --status
 */

const base = process.env.STUDIO_BASE || 'http://127.0.0.1:3055';
const refresh = process.argv.includes('--refresh');
const statusOnly = process.argv.includes('--status');
const slug = 'jordan-g1-math-number-line-addition';

async function main() {
  if (statusOnly) {
    const r = await fetch(`${base}/api/elementary-studio?view=status`);
    console.log(await r.text());
    return;
  }
  const snap = await fetch(`${base}/api/elementary-studio?slug=${encodeURIComponent(slug)}`);
  console.log('SNAPSHOT', await snap.text());

  const r = await fetch(`${base}/api/elementary-studio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: refresh ? 'refresh' : 'produce', slug }),
  });
  console.log('RESULT', r.status, await r.text());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
