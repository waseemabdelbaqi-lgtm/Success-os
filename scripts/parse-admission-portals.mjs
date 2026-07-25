#!/usr/bin/env node
/**
 * Cursor-style iterative parse of university_portals_production.json
 * Mirrors the pandas / fast-csv loops and FastAPI /api/v1/portals payload.
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
  console.log(
    `[${index}] Parsing: ${row.Name} | Endpoint: ${row.Website} | Region: ${row.Region}`,
  );
  console.log(`         Type: ${row.Type}`);
  console.log(`         Details: ${row.Details}`);
}

console.log(
  `\nSuccessfully completed extraction of ${ordered.length} records.`,
);
console.log('API shape: GET /api/v1/portals → list[Portal]');
