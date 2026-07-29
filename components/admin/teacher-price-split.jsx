'use client';

export function TeacherPriceSplitPanel({ split }) {
  if (!split) return null;
  return (
    <div
      data-testid="teacher-price-split"
      style={{
        marginTop: 12,
        padding: 12,
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        background: '#f9fafb',
      }}
    >
      <strong style={{ fontSize: 13 }}>Price & Commission Preview</strong>
      <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#6b7280' }}>
        Teachers set the public price. Commission is not editable by teachers.
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
        {(split.breakdown || []).map((row) => (
          <li key={row.key}>
            {row.label}: <b>{row.display}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
