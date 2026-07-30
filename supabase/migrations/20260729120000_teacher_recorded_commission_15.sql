-- Correct TEACHER_RECORDED default platform commission: 30% → 15%
-- Teacher gross share becomes 85% (before fees/refunds/taxes/deductions).
-- Historical financial snapshots remain immutable and are not recalculated.

BEGIN;

UPDATE public.course_commission_rules
SET
  percentage = 15,
  reason = 'Default recorded teacher course commission: 15% platform / 85% teacher gross',
  updated_at = now()
WHERE scope = 'lesson_source'
  AND source_type = 'TEACHER_RECORDED'
  AND status = 'ACTIVE'
  AND percentage = 30;

INSERT INTO public.course_commission_rules (
  scope, source_type, percentage, priority, status, reason
)
SELECT 'lesson_source', 'TEACHER_RECORDED', 15, 0, 'ACTIVE',
       'Default recorded teacher course commission: 15% platform / 85% teacher gross'
WHERE NOT EXISTS (
  SELECT 1 FROM public.course_commission_rules
  WHERE scope = 'lesson_source'
    AND source_type = 'TEACHER_RECORDED'
    AND status = 'ACTIVE'
);

INSERT INTO public.course_commission_rule_audit (
  rule_id,
  previous_value,
  new_value,
  scope,
  reason,
  effective_date
)
SELECT
  r.id,
  jsonb_build_object('percentage', 30, 'source_type', 'TEACHER_RECORDED'),
  jsonb_build_object('percentage', 15, 'source_type', 'TEACHER_RECORDED', 'teacher_gross_share_percent', 85),
  'lesson_source',
  'Financial correction: cancelled 30/70 split; approved 15% platform / 85% teacher gross',
  now()
FROM public.course_commission_rules r
WHERE r.scope = 'lesson_source'
  AND r.source_type = 'TEACHER_RECORDED'
  AND r.status = 'ACTIVE'
  AND r.percentage = 15
  AND NOT EXISTS (
    SELECT 1 FROM public.course_commission_rule_audit a
    WHERE a.rule_id = r.id
      AND a.reason LIKE 'Financial correction: cancelled 30/70%'
  );

COMMIT;
