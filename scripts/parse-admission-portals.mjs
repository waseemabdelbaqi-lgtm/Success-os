#!/usr/bin/env node
/**
 * Cursor-style iterative parse of university_admission_portals-v4.csv
 * Usage: node scripts/parse-admission-portals.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.resolve(
  __dirname,
  '../app/data/university_admission_portals-v4.csv',
);

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    // Simple CSV: no embedded commas in this dataset's Details fields that break columns
    // Details may contain commas — join remainder into Details
    const parts = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        parts.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    parts.push(current);
    const row = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (parts[i] || '').trim();
    });
    // If Details was split by commas, rejoin
    if (parts.length > headers.length) {
      row.Details = parts.slice(headers.length - 1).join(',').trim();
    }
    return row;
  });
}

const raw = fs.readFileSync(csvPath, 'utf8');
const rows = parseCsv(raw);

console.log(`Loaded ${rows.length} records from ${path.basename(csvPath)}\n`);
for (const [index, row] of rows.entries()) {
  console.log(
    `[${index}] Parsing: ${row.Name} | Endpoint: ${row.Website} | Region: ${row.Region}`,
  );
  console.log(`         Type: ${row.Type}`);
  console.log(`         Details: ${row.Details}`);
}

console.log(`\nSuccessfully completed extraction of ${rows.length} records.`);

const jsonOut = path.resolve(
  __dirname,
  '../app/data/university_admission_portals-v4.json',
);
fs.writeFileSync(jsonOut, JSON.stringify(rows, null, 2));
console.log(`Wrote JSON mirror → ${path.relative(process.cwd(), jsonOut)}`);
