/**
 * Server-driven recorded course catalog queries.
 * Prefer Supabase; fall back to empty published catalogue (no fake records).
 */

import { applyRecordedLessonCatalog } from '../../data/recorded-lesson-filters.js';
import { groupRecordedLessonsBySource } from '../../data/recorded-lesson-sections.js';
import { normalizeLessonSource } from '../../data/recorded-lesson-sources.js';
import { mem } from './in-memory-store.js';
import { getMarketplaceServiceClient, marketplaceSupabaseConfigured } from './supabase-server.js';

function mapCourseRow(row) {
  if (!row) return null;
  return {
    ...row,
    lessonSource: normalizeLessonSource(row.source_type || row.lessonSource || row.sourceType),
    sourceType: normalizeLessonSource(row.source_type || row.lessonSource || row.sourceType),
    rating: row.rating_average ?? row.ratingAverage ?? row.rating ?? null,
    ratingAverage: row.rating_average ?? row.ratingAverage ?? row.rating ?? null,
    ratingCount: row.rating_count ?? row.ratingCount ?? 0,
    enrolmentCount: row.enrolment_count ?? row.enrolmentCount ?? 0,
    totalLessons: row.total_lessons ?? row.totalLessons ?? 0,
    durationMinutes: row.total_duration_minutes ?? row.totalDurationMinutes ?? 0,
    grade: row.grade_level ?? row.gradeLevel ?? row.grade,
    teacherName: row.teacher_display_name ?? row.teacherName,
    teacherVerified: row.teacher_verified ?? row.teacherVerified ?? false,
    teacherImage: row.teacher_image_url ?? row.teacherImageUrl,
    teacherGender: row.teacher_gender ?? row.teacherGender,
    updatedAt: row.updated_at || row.updatedAt,
    publishedAt: row.published_at || row.publishedAt,
    previewEnabled: row.preview_enabled ?? row.previewEnabled ?? false,
  };
}

async function loadPublishedCoursesFromSupabase() {
  const client = getMarketplaceServiceClient();
  if (!client) return null;
  const { data, error } = await client
    .from('recorded_courses')
    .select('*')
    .eq('publication_status', 'PUBLISHED')
    .order('published_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapCourseRow);
}

function loadPublishedCoursesFromMemory() {
  return mem()
    .courses.filter((c) => c.publication_status === 'PUBLISHED')
    .map(mapCourseRow);
}

export async function listPublishedCourses(rawFilters = {}) {
  let items = [];
  if (marketplaceSupabaseConfigured() && getMarketplaceServiceClient()) {
    items = (await loadPublishedCoursesFromSupabase()) || [];
  } else {
    items = loadPublishedCoursesFromMemory();
  }

  const catalog = applyRecordedLessonCatalog(items, rawFilters);
  return {
    ok: true,
    persistence: marketplaceSupabaseConfigured() && getMarketplaceServiceClient() ? 'supabase' : 'memory',
    ...catalog,
    grouped: groupRecordedLessonsBySource(catalog.items, {
      subject: catalog.filters.subject,
      lessonSource: catalog.filters.lessonSource,
    }),
  };
}

export async function getPublishedCourse(courseId) {
  if (!courseId) return null;
  if (marketplaceSupabaseConfigured() && getMarketplaceServiceClient()) {
    const client = getMarketplaceServiceClient();
    const { data, error } = await client
      .from('recorded_courses')
      .select('*')
      .eq('id', courseId)
      .eq('publication_status', 'PUBLISHED')
      .maybeSingle();
    if (error) throw new Error(error.message);
    return mapCourseRow(data);
  }
  const hit = mem().courses.find(
    (c) => c.id === courseId && c.publication_status === 'PUBLISHED',
  );
  return mapCourseRow(hit);
}

export async function listCommissionRules() {
  if (marketplaceSupabaseConfigured() && getMarketplaceServiceClient()) {
    const client = getMarketplaceServiceClient();
    const { data, error } = await client
      .from('course_commission_rules')
      .select('*')
      .eq('status', 'ACTIVE');
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({
      ...r,
      percent: Number(r.percentage),
      percentage: Number(r.percentage),
      overrideLayer: r.scope,
      layer: r.scope,
      sourceType: r.source_type,
      teacherId: r.teacher_id,
      courseId: r.course_id,
      campaignId: r.campaign_id,
      partnerType: r.partner_type,
    }));
  }
  return mem().commissionRules.map((r) => ({
    ...r,
    percent: Number(r.percentage),
    percentage: Number(r.percentage),
    overrideLayer: r.scope,
    layer: r.scope,
    sourceType: r.source_type,
    teacherId: r.teacher_id,
    courseId: r.course_id,
    campaignId: r.campaign_id,
    partnerType: r.partner_type,
  }));
}
