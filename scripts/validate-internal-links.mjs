import fs from 'node:fs';
import path from 'node:path';

const appRoot = path.resolve('app');
const pages = new Set(['/']);
const source = [];

function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else if (/\.(jsx|js|tsx|ts)$/.test(item.name)) source.push(file);
  }
}

function normalizeRoute(rel) {
  // Strip Next.js route groups: (name)
  const parts = rel
    .split('/')
    .filter((part) => part && !/^\(.*\)$/.test(part));
  return parts.length ? `/${parts.join('/')}` : '/';
}

function routeFromPageFile(file) {
  const dir = path.dirname(file);
  const rel = path.relative(appRoot, dir).split(path.sep).join('/');
  let route = normalizeRoute(rel);

  // Dynamic and catch-all segments are represented as patterns.
  route = route
    .replace(/\/\[\.\.\.[^\]]+\]/g, '/*')
    .replace(/\/\[\.\.\.[^\]]+\]/g, '/*')
    .replace(/\/\[[^\]]+\]/g, '/*');

  return route;
}

function pathMatches(href, pageRoute) {
  if (href === pageRoute) return true;

  // Exact static match already handled. Support dynamic patterns.
  if (!pageRoute.includes('*')) return false;

  const hrefParts = href.split('/').filter(Boolean);
  const routeParts = pageRoute.split('/').filter(Boolean);

  for (let i = 0; i < routeParts.length; i += 1) {
    const part = routeParts[i];
    if (part === '*') {
      // Catch-all or single dynamic: remaining ok if last; else one segment.
      if (i === routeParts.length - 1) return true;
      if (!hrefParts[i]) return false;
      continue;
    }
    if (hrefParts[i] !== part) return false;
  }

  return hrefParts.length === routeParts.length;
}

function stripQueryHash(href) {
  return href.split('#')[0].split('?')[0];
}

walk(appRoot);

for (const file of source) {
  const base = path.basename(file);
  if (base === 'page.jsx' || base === 'page.tsx' || base === 'page.js' || base === 'page.ts') {
    pages.add(routeFromPageFile(file));
  }
}

const broken = [];
const hrefPattern =
  /(?:href|to)=(?:["'`]([^"'`]+)|\{["'`]([^"'`]+))/g;

for (const file of source) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(hrefPattern)) {
    const raw = match[1] || match[2];
    if (!raw) continue;

    const href = stripQueryHash(raw);
    if (!href.startsWith('/')) continue;
    if (href.startsWith('/api')) continue;
    if (href.includes('${')) continue;

    const known = [...pages].some(
      (page) => page === href || pathMatches(href, page),
    );

    if (!known && !pages.has(href)) {
      // Also accept parent catch-all coverage via /* patterns.
      const covered = [...pages].some((page) => pathMatches(href, page));
      if (!covered) {
        broken.push(`${path.relative(process.cwd(), file)} → ${href}`);
      }
    }
  }
}

if (broken.length) {
  console.error(`Broken internal links (${broken.length}):\n${broken.join('\n')}`);
  process.exit(1);
}

console.log(
  `Internal links validated across ${source.length} source files and ${pages.size} routes.`,
);
