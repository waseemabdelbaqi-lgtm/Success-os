import { redirect } from 'next/navigation';

/**
 * توحيد دخول الطالب — المسار القديم هو لوحة /student/dashboard
 * (المسار القديم /student-portal كان يشتت التجربة)
 */
export default function StudentPortalRedirect() {
  redirect('/student/dashboard');
}
