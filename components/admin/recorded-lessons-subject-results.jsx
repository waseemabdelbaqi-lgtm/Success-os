'use client';

/**
 * Subject results layout:
 * 📚 Physics
 * ▶ S4S Intelligence ⭐ Recommended
 * ──────────────
 * Teacher Lessons
 * ──────────────
 * Female Teacher Lessons
 */
export function RecordedLessonsSubjectResults({
  grouped,
  onSelectLesson,
  emptyLabel = 'No lessons in this section yet.',
}) {
  if (!grouped) return null;
  const visibleSections = (grouped.sections || []).filter((s) => s.visible !== false);

  return (
    <div
      data-testid="recorded-lessons-subject-results"
      style={{
        margin: '16px 0 8px',
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        padding: 16,
        background: '#fff',
      }}
    >
      <h2
        style={{
          margin: '0 0 16px',
          fontSize: 20,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span aria-hidden="true">📚</span>
        <span>{grouped.subject || 'All Subjects'}</span>
      </h2>

      {visibleSections.map((section, index) => (
        <div key={section.id}>
          {index > 0 ? (
            <div
              aria-hidden="true"
              style={{
                margin: '14px 0',
                borderTop: '1px solid #d1d5db',
                letterSpacing: 2,
                color: '#9ca3af',
                fontSize: 11,
                textAlign: 'center',
              }}
            >
              ──────────────
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {section.playPrefix ? (
                <span aria-hidden="true" style={{ color: '#111827', fontSize: 14 }}>
                  ▶
                </span>
              ) : null}
              <strong style={{ fontSize: 15 }}>{section.title}</strong>
              {section.recommended ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    color: '#b45309',
                    background: '#fffbeb',
                    border: '1px solid #fcd34d',
                    borderRadius: 999,
                    padding: '2px 8px',
                  }}
                >
                  <span aria-hidden="true">⭐</span>
                  {section.recommendedLabel || 'Recommended'}
                </span>
              ) : null}
            </div>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{section.count} lessons</span>
          </div>

          {(section.items || []).length === 0 ? (
            <p style={{ margin: '0 0 4px', color: '#9ca3af', fontSize: 13 }}>{emptyLabel}</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {section.items.map((lesson) => (
                <li
                  key={lesson.id}
                  style={{
                    border: '1px solid #f3f4f6',
                    borderRadius: 10,
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                    background: section.recommended ? '#fcfcff' : '#fafafa',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {lesson.title || lesson.name || 'Untitled lesson'}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {[lesson.grade, lesson.language, lesson.teacherName]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#374151' }}>
                      {lesson.durationMinutes ? `${lesson.durationMinutes} min` : ''}
                    </span>
                    {typeof onSelectLesson === 'function' ? (
                      <button type="button" onClick={() => onSelectLesson(lesson)}>
                        Open
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
