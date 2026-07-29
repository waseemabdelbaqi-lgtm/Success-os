'use client';

/**
 * Subject results layout (corrected taxonomy):
 * Physics
 * ▶ S4S Intelligence ⭐ Recommended
 * ──────────────
 * Teacher Lessons
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
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  {section.recommendedLabel || 'Recommended'}
                </span>
              ) : null}
            </div>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{section.count || 0}</span>
          </div>

          {(section.items || []).length === 0 ? (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#9ca3af' }}>{emptyLabel}</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: 0 }}>
              {section.items.map((item) => (
                <li key={item.id || item.title}>
                  <button
                    type="button"
                    onClick={() => onSelectLesson?.(item)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      background: 'transparent',
                      padding: '8px 0',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    <b>{item.title || item.name}</b>
                    <span style={{ display: 'block', fontSize: 12, color: '#6b7280' }}>
                      {[item.subject, item.curriculum, item.country, item.grade || item.grade_level]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
