-- Reversal for recorded lessons marketplace schema.
-- Apply manually only when rolling back (do not auto-run in forward migrate).

BEGIN;

DROP POLICY IF EXISTS aios_jobs_admin ON public.aios_course_production_jobs;
DROP POLICY IF EXISTS workflow_teacher_submit ON public.teacher_course_review_workflow;
DROP POLICY IF EXISTS workflow_admin_write ON public.teacher_course_review_workflow;
DROP POLICY IF EXISTS workflow_read ON public.teacher_course_review_workflow;
DROP POLICY IF EXISTS reviews_update_own ON public.recorded_course_reviews;
DROP POLICY IF EXISTS reviews_insert ON public.recorded_course_reviews;
DROP POLICY IF EXISTS reviews_read ON public.recorded_course_reviews;
DROP POLICY IF EXISTS payout_ledger_read ON public.teacher_payout_ledger;
DROP POLICY IF EXISTS enrolments_teacher_aggregate ON public.recorded_course_enrolments;
DROP POLICY IF EXISTS enrolments_student_read ON public.recorded_course_enrolments;
DROP POLICY IF EXISTS snapshots_read ON public.course_financial_snapshots;
DROP POLICY IF EXISTS purchases_student_read ON public.recorded_course_purchases;
DROP POLICY IF EXISTS commission_audit_insert ON public.course_commission_rule_audit;
DROP POLICY IF EXISTS commission_audit_read ON public.course_commission_rule_audit;
DROP POLICY IF EXISTS commission_rules_write ON public.course_commission_rules;
DROP POLICY IF EXISTS commission_rules_read ON public.course_commission_rules;
DROP POLICY IF EXISTS recorded_lessons_write ON public.recorded_course_lessons;
DROP POLICY IF EXISTS recorded_lessons_read ON public.recorded_course_lessons;
DROP POLICY IF EXISTS recorded_units_write ON public.recorded_course_units;
DROP POLICY IF EXISTS recorded_units_read ON public.recorded_course_units;
DROP POLICY IF EXISTS recorded_courses_teacher_update ON public.recorded_courses;
DROP POLICY IF EXISTS recorded_courses_teacher_insert ON public.recorded_courses;
DROP POLICY IF EXISTS recorded_courses_public_read ON public.recorded_courses;

DROP TRIGGER IF EXISTS trg_course_financial_snapshots_immutable ON public.course_financial_snapshots;
DROP FUNCTION IF EXISTS public.prevent_financial_snapshot_mutation();
DROP FUNCTION IF EXISTS public.marketplace_is_teacher();
DROP FUNCTION IF EXISTS public.marketplace_is_finance_admin();
DROP FUNCTION IF EXISTS public.marketplace_is_admin();
DROP FUNCTION IF EXISTS public.marketplace_jwt_role();

DROP TABLE IF EXISTS public.aios_course_production_jobs CASCADE;
DROP TABLE IF EXISTS public.teacher_course_review_workflow CASCADE;
DROP TABLE IF EXISTS public.recorded_course_reviews CASCADE;
DROP TABLE IF EXISTS public.teacher_payout_ledger CASCADE;
DROP TABLE IF EXISTS public.recorded_course_enrolments CASCADE;
DROP TABLE IF EXISTS public.course_financial_snapshots CASCADE;
DROP TABLE IF EXISTS public.recorded_course_purchases CASCADE;
DROP TABLE IF EXISTS public.course_commission_rule_audit CASCADE;
DROP TABLE IF EXISTS public.course_commission_rules CASCADE;
DROP TABLE IF EXISTS public.recorded_course_lessons CASCADE;
DROP TABLE IF EXISTS public.recorded_course_units CASCADE;
DROP TABLE IF EXISTS public.recorded_courses CASCADE;

DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.commission_rule_status;
DROP TYPE IF EXISTS public.payout_status;
DROP TYPE IF EXISTS public.enrolment_status;
DROP TYPE IF EXISTS public.marketplace_payment_status;
DROP TYPE IF EXISTS public.recorded_publication_status;
DROP TYPE IF EXISTS public.recorded_course_source_type;

COMMIT;
