'use client';

export function CommissionCascadePanel({ cascade }) {
  if (!cascade) return null;
  const steps = cascade.cascadeSteps || [];
  return (
    <div
      data-testid="commission-cascade"
      style={{
        marginTop: 12,
        padding: 12,
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        background: '#fff',
      }}
    >
      <strong style={{ fontSize: 13 }}>Commission Cascade</strong>
      <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#6b7280' }}>
        Campaign → Course → Teacher → Partner type → Lesson source → Global
      </p>
      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
        {steps.map((step) => (
          <li key={step.key} style={{ opacity: step.active ? 1 : 0.55 }}>
            {step.label}: <b>{step.display}</b>
            {step.applied ? ' ← applied' : ''}
          </li>
        ))}
      </ol>
      <p style={{ margin: '8px 0 0', fontSize: 12 }}>
        Final: <b>{cascade.finalCommissionPercent}%</b> ({cascade.winnerLabel})
      </p>
    </div>
  );
}
