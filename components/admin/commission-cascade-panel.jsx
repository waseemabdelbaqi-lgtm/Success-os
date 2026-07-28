'use client';

/**
 * Global Commission → Teacher Override → Center Override → Special Campaign → Final Commission
 */
export function CommissionCascadePanel({
  cascade,
  title = 'Commission Cascade',
  teacherPrice = null,
}) {
  if (!cascade?.cascadeSteps?.length) return null;
  const steps = cascade.cascadeSteps;
  const split = cascade.teacherPriceSplit;

  return (
    <div
      data-testid="commission-cascade"
      style={{
        marginTop: 12,
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 14,
        background: '#fff',
      }}
    >
      <div style={{ fontWeight: 650, fontSize: 13, marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {steps.map((step, idx) => (
          <div key={step.key}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                fontSize: 13,
                padding: '6px 8px',
                borderRadius: 8,
                background: step.applied ? '#ecfdf5' : step.active ? '#f9fafb' : '#fafafa',
                border: step.applied ? '1px solid #a7f3d0' : '1px solid transparent',
              }}
            >
              <span style={{ color: '#374151' }}>
                {step.label}
                {step.ruleName ? (
                  <span style={{ color: '#6b7280', marginLeft: 6 }}>({step.ruleName})</span>
                ) : null}
                {step.applied && step.key !== 'final' ? (
                  <span style={{ color: '#059669', marginLeft: 6, fontSize: 11 }}>applied</span>
                ) : null}
              </span>
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{step.display}</strong>
            </div>
            {idx < steps.length - 1 ? (
              <div style={{ color: '#9ca3af', fontSize: 12, padding: '2px 8px' }}>↓</div>
            ) : null}
          </div>
        ))}
      </div>

      {teacherPrice != null && split ? (
        <div style={{ marginTop: 12, fontSize: 12, color: '#4b5563' }}>
          On Teacher Price <strong>{split.teacherPrice} {split.currency}</strong>: Teacher receives{' '}
          <strong>{split.teacherReceives} {split.currency}</strong> · Success OS{' '}
          <strong>{split.successOs} {split.currency}</strong>
        </div>
      ) : null}
    </div>
  );
}
