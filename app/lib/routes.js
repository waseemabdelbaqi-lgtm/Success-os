export const ROUTES = Object.freeze({
  home:'/', journey:'/start-journey', join:'/join-us',
  student:{onboarding:'/student/onboarding',dashboard:'/student/dashboard',subjects:'/student/school-subjects',universitySubjects:'/student/university-subjects',recorded:'/student/recorded-lessons',live:'/student/live-lessons',teachers:'/student/teachers',centers:'/student/centers',schools:'/student/schools',universities:'/student/universities',admissions:'/student/admissions'},
  jobs:{onboarding:'/jobs/onboarding',dashboard:'/jobs/dashboard',search:'/jobs/search',companies:'/jobs/companies',applications:'/jobs/applications',career:'/jobs/career-plan'},
  teacher:{search:'/teachers',join:'/partners/teacher/apply'},
  center:{search:'/centers',join:'/partners/center/apply'},
  school:{search:'/schools',join:'/partners/school/apply'},
  university:{search:'/universities',join:'/partners/university/apply'},
  employer:{search:'/jobs/companies',join:'/partners/employer/apply'}
});

export const journeyDestination=(portal,intent)=>{
  if(portal==='student') return ROUTES.student.dashboard;
  if(portal==='jobseeker') return ROUTES.jobs.dashboard;
  return ROUTES[portal]?.[intent] || ROUTES.journey;
};
