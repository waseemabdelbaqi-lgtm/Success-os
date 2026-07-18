import http from 'node:http';

const base = process.env.CRAWL_BASE || 'http://127.0.0.1:3000';

const routes = [
  '/',
  '/start-journey',
  '/access',
  '/join-us',
  '/student-portal',
  '/jobseeker-portal',
  '/teacher-portal',
  '/schools',
  '/universities',
  '/teachers',
  '/centers',
  '/jobs',
  '/partners/teacher',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/dashboard',
  '/dashboard/student',
  '/student',
  '/student/dashboard',
  '/student/books',
  '/student/bookmarks',
  '/student/notes',
  '/student/highlights',
  '/student/favorites',
  '/student/reading-history',
  '/student/assistant',
  '/student/notifications',
  '/student/profile',
  '/student/settings',
  '/student/material',
  '/student/results',
  '/student/service',
  '/student/onboarding',
  '/portals/student',
  '/portals/teachers',
  '/content-studio',
  '/curriculum-lab',
  '/knowledge',
  '/admin/jordan-curriculum',
  '/global-knowledge-system',
  '/api/health',
  '/api/auth/session',
  '/about',
  '/passport',
  '/tutor',
  '/world',
  '/subject-catalog',
  '/university-subjects',
  '/source-registry',
];

/** Auth/session without a cookie correctly returns 401. */
function isAcceptable(path, status) {
  if (status > 0 && status < 400) return true;
  if (path === '/api/auth/session' && status === 401) return true;
  return false;
}

function fetchStatus(path) {
  return new Promise((resolve) => {
    const url = new URL(path, base);
    const req = http.get(url, { timeout: 15000 }, (res) => {
      res.resume();
      resolve({ path, status: res.statusCode });
    });
    req.on('error', (err) => resolve({ path, status: 0, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ path, status: 0, error: 'timeout' });
    });
  });
}

const results = [];
for (const route of routes) {
  results.push(await fetchStatus(route));
}

const failed = results.filter((r) => !isAcceptable(r.path, r.status));

for (const r of results) {
  console.log(`${r.status || 'ERR'}\t${r.path}${r.error ? ` (${r.error})` : ''}`);
}

if (failed.length) {
  console.error(`\nRoute crawl FAILED: ${failed.length}/${results.length}`);
  process.exit(1);
}

console.log(`\nRoute crawl OK: ${results.length}/${results.length}`);
