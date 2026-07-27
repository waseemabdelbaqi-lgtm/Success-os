import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const BASE = process.env.BASE_URL || 'https://drag-cartoons-course-anniversary.trycloudflare.com';
const OUT = '/opt/cursor/artifacts/screenshots';

const pages = [
  { name: '00-hub', path: '/preview-dashboards.html' },
  { name: '01-admin', path: '/dashboard/admin' },
  { name: '01b-permissions', path: '/dashboard/admin/permissions' },
  { name: '02-employee', path: '/dashboard/employee' },
  { name: '03-teacher', path: '/dashboard/teacher' },
  { name: '04-educational-center', path: '/dashboard/educational-center' },
  { name: '05-school', path: '/dashboard/school' },
  { name: '06-college', path: '/dashboard/college' },
  { name: '07-university', path: '/dashboard/university' },
  { name: '08-recruitment-company', path: '/dashboard/recruitment-company' },
  { name: '09-job-seeker', path: '/dashboard/job-seeker' },
  { name: '10-school-student', path: '/dashboard/school-student' },
  { name: '11-university-student', path: '/dashboard/university-student' },
  { name: '12-links', path: '/dashboard/links' },
  { name: '13-user-dashboards', path: '/dashboard/user-dashboards' },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: 'ar',
});
const page = await context.newPage();

const results = [];
for (const item of pages) {
  const url = BASE + item.path;
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1200);
    const file = `${OUT}/${item.name}.png`;
    await page.screenshot({ path: file, fullPage: true });
    const status = res?.status() ?? 0;
    results.push({ name: item.name, path: item.path, status, file, ok: status >= 200 && status < 400 });
    console.log(`OK ${status} ${item.name} -> ${file}`);
  } catch (err) {
    results.push({ name: item.name, path: item.path, ok: false, error: String(err) });
    console.error(`FAIL ${item.name}:`, err.message || err);
  }
}

await browser.close();
console.log(JSON.stringify({ base: BASE, results }, null, 2));
