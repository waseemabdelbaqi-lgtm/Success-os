#!/usr/bin/env node
/**
 * Cursor-style iterative parse of university_portals_production.json
 * Schema: Name | Website | Type | Scope | Details
 *
 * Usage: node scripts/parse-admission-portals.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.resolve(
  __dirname,
  '../app/data/university_portals_production.json',
);

const rows = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const ordered = [...rows].sort((a, b) => a.Name.localeCompare(b.Name, 'en'));

console.log(`Loaded ${ordered.length} production portal records\n`);

for (const [index, row] of ordered.entries()) {
  const scope = row.Scope || row.Region || '—';
  console.log(
    `[${index}] Parsing: ${row.Name} | Endpoint: ${row.Website} | Scope: ${scope}`,
  );
  console.log(`         Type: ${row.Type}`);
  console.log(`         Details: ${row.Details}`);
}

const types = [...new Set(ordered.map((r) => r.Type))].sort();
console.log(`\nSuccessfully completed extraction of ${ordered.length} records.`);
console.log(`Types (${types.length}): ${types.join(' | ')}`);
console.log('API: GET /api/v1/portals  (?type=&scope=)');
