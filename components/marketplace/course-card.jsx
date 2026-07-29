'use client';

import { isS4sIntelligenceSource, isTeacherRecordedSource } from '@/app/data/recorded-lesson-sources.js';

function formatDuration(mins) {
  const n = Number(mins || 0);
  if (!n) return '—';
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function realRating(course) {
  const count = Number(course.ratingCount ?? course.rating_count ?? 0);
  const avg = Number(course.ratingAverage ?? course.rating_average ?? course.rating);
  if (!count || !Number.isFinite(avg)) return null;
  return { avg, count };
}

export function CourseCard({ course, onPreview, onEnrol }) {
  if (!course) return null;
  const source = course.sourceType || course.lessonSource || course.source_type;
  const s4s = isS4sIntelligenceSource(source);
  const teacher = isTeacherRecordedSource(source);
  const rating = realRating(course);
  const price = Number(course.price || 0);

  return (
    <article
      data-testid="marketplace-course-card"
      data-source={source}
      className="marketplace-course-card"
      style={{
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding: '18px 0',
        display: 'grid',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          {s4s ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span data-testid="badge-s4s">S4S Intelligence</span>
              <span data-testid="badge-official-ai">Official AI Course</span>
              {course.recommended === true ? (
                <span data-testid="badge-recommended">Recommended</span>
              ) : null}
            </div>
          ) : null}
          {teacher ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              {course.teacherImage || course.teacher_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.teacherImage || course.teacher_image_url}
                  alt=""
                  width={36}
                  height={36}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : null}
              <div>
                <strong data-testid="teacher-name">
                  {course.teacherName || course.teacher_display_name || 'Teacher'}
                </strong>
                {course.teacherVerified || course.teacher_verified ? (
                  <span data-testid="teacher-verified" style={{ marginLeft: 8, fontSize: 12 }}>
                    Verified
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
          <h3 style={{ margin: 0, fontSize: 18 }}>{course.title}</h3>
        </div>
        <strong data-testid="course-price">{price <= 0 ? 'Free' : `$${price.toFixed(2)}`}</strong>
      </div>

      <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
        {[
          course.subject,
          course.curriculum,
          course.country,
          course.grade || course.grade_level,
          course.language,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, opacity: 0.85 }}>
        <span>{course.totalLessons ?? course.total_lessons ?? 0} lessons</span>
        <span>{formatDuration(course.durationMinutes ?? course.total_duration_minutes)}</span>
        {rating ? (
          <span data-testid="course-rating">
            {rating.avg.toFixed(1)} ({rating.count} reviews)
          </span>
        ) : (
          <span data-testid="course-rating-none">No ratings yet</span>
        )}
        <span>
          {course.enrolmentCount ?? course.enrolment_count ?? 0} students
        </span>
        <span>
          Updated{' '}
          {String(course.updatedAt || course.updated_at || course.publishedAt || '')
            .slice(0, 10) || '—'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        {(course.previewEnabled || course.preview_enabled) && (
          <button type="button" data-testid="preview-action" onClick={() => onPreview?.(course)}>
            Preview
          </button>
        )}
        <button
          type="button"
          className="primary"
          data-testid="enrol-action"
          onClick={() => onEnrol?.(course)}
        >
          {s4s ? 'Enrol' : 'Purchase / Enrol'}
        </button>
      </div>
    </article>
  );
}
