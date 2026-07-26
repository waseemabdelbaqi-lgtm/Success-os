/** SUCCESS-OS journey routes + Cursor student book portal paths. */
export const ROUTES = Object.freeze({
  home: '/',
  journey: '/start-journey',
  join: '/join-us',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  student: {
    onboarding: '/student/onboarding',
    dashboard: '/student/dashboard',
    books: '/student/books',
    bookmarks: '/student/bookmarks',
    notes: '/student/notes',
    highlights: '/student/highlights',
    favorites: '/student/favorites',
    readingHistory: '/student/reading-history',
    assistant: '/student/assistant',
    notifications: '/student/notifications',
    profile: '/student/profile',
    settings: '/student/settings',
    material: '/student/material',
    results: '/student/results',
    service: '/student/service',
    subjects: '/student/school-subjects',
    universitySubjects: '/student/university-subjects',
    recorded: '/student/recorded-lessons',
    live: '/student/live-lessons',
    teachers: '/student/teachers',
    centers: '/student/centers',
    schools: '/student/schools',
    universities: '/student/universities',
    admissions: '/student/admissions',
  },
  jobs: {
    onboarding: '/jobs/onboarding',
    dashboard: '/jobs/dashboard',
    search: '/jobs/search',
    companies: '/jobs/companies',
    applications: '/jobs/applications',
    career: '/jobs/career-plan',
  },
  teacher: { search: '/teachers', join: '/access?portal=teacher&intent=join' },
  center: { search: '/centers', join: '/access?portal=center&intent=join' },
  school: { search: '/schools', join: '/access?portal=school&intent=join' },
  university: { search: '/admissions', join: '/access?portal=university&intent=join' },
  employer: { search: '/jobs', join: '/access?portal=employer&intent=join' },
});

/** Finish destinations after a partner join / access submit. */
export const joinFinishDestination = (portal) => {
  if (portal === 'teacher') return '/teacher-portal';
  if (portal === 'employer') return '/jobs';
  if (portal === 'jobseeker') return '/jobs/dashboard';
  if (portal === 'student') return '/students/dashboard';
  if (['center', 'school', 'university', 'college'].includes(portal)) {
    return `/control-center?role=institution&from=join&portal=${encodeURIComponent(portal)}`;
  }
  return '/join-us';
};

export const journeyDestination = (portal, intent) => {
  if (portal === 'student') return ROUTES.student.dashboard;
  if (portal === 'jobseeker') return ROUTES.jobs.dashboard;
  if (intent === 'join') return ROUTES[portal]?.join || '/join-us';
  return ROUTES[portal]?.[intent] || ROUTES[portal]?.search || ROUTES.journey;
};
