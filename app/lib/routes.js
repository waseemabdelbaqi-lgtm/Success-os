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
  teacher: { search: '/teachers', join: '/partners/teacher/apply' },
  center: { search: '/centers', join: '/partners/center/apply' },
  school: { search: '/schools', join: '/partners/school/apply' },
  university: { search: '/universities', join: '/partners/university/apply' },
  employer: { search: '/jobs/companies', join: '/partners/employer/apply' },
});

export const journeyDestination = (portal, intent) => {
  if (portal === 'student') return ROUTES.student.dashboard;
  if (portal === 'jobseeker') return ROUTES.jobs.dashboard;
  return ROUTES[portal]?.[intent] || ROUTES.journey;
};
