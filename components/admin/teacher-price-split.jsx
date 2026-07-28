'use client';

/**
 * Teacher Price split display:
 * Teacher Price → Platform Commission → Teacher Receives → Success OS
 */
export function TeacherPriceSplitPanel({
  split,
  title = 'Teacher Price Split',
  compact = false,
}) {
  if (!split) return null;
  const rows = split.breakdown || [
    {
      key: 'teacherPrice',
      label: 'Teacher Price',
      display: `${split.teacherPrice} ${split.currency || 'USD'}`,
    },
    {
      key: 'platformCommission',
      label: 'Platform Commission',
      display: split.platformCommissionLabel || `${split.platformCommissionPercent}%`,
    },
    {
      key: 'teacherReceives',
      label: 'Teacher Receives',
      display: `${split.teacherReceives} ${split.currency || 'USD'}`,
    },
    {
      key: 'successOs',
      label: 'Success OS',
      display: `${split.successOs} ${split.currency || 'USD'}`,
    },
  ];

  return (
    <div
      data-testid="teacher-price-split"
      style={{
        marginTop: compact ? 8 : 12,
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: compact ? 10 : 14,
        background: '#fff',
      }}
    >
      <div style={{ fontWeight: 650, fontSize: 13, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((row, idx) => (
          <div key={row.key}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                fontSize: 13,
                padding: '6px 0',
              }}
            >
              <span style={{ color: '#4b5563' }}>{row.label}</span>
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{row.display}</strong>
            </div>
            {idx < rows.length - 1 ? (
              <div style={{ color: '#9ca3af', fontSize: 12, paddingLeft: 4 }}>↓</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
