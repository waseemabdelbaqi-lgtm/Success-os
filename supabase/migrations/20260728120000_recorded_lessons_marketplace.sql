-- Recorded Lessons Marketplace — reversible schema
-- Project: Success OS (auth.users IDs)
-- Default TEACHER_RECORDED commission: 15% platform / 85% teacher gross

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums / check helpers
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.recorded_course_source_type AS ENUM (
    'S4S_INTELLIGENCE',
    'TEACHER_RECORDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.recorded_publication_status AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'CHANGES_REQUESTED',
    'APPROVED',
    'PUBLISHED',
    'SUSPENDED',
    'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.marketplace_payment_status AS ENUM (
    'PENDING',
    'AUTHORIZED',
    'PAID',
    'FAILED',
    'REFUNDED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.enrolment_status AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'CANCELLED',
    'SUSPENDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payout_status AS ENUM (
    'PENDING',
    'AVAILABLE',
    'PROCESSING',
    'PAID',
    'ON_HOLD',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.commission_rule_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'EXPIRED',
    'SCHEDULED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.review_status AS ENUM (
    'PENDING',
    'PUBLISHED',
    'HIDDEN',
    'REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Role helper: reads JWT app_metadata.role / user_metadata.role
CREATE OR REPLACE FUNCTION public.marketplace_jwt_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ));
$$;

CREATE OR REPLACE FUNCTION public.marketplace_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.marketplace_jwt_role() IN (
    'admin', 'master-admin', 'master_admin', 'finance-admin', 'finance_admin', 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.marketplace_is_finance_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.marketplace_jwt_role() IN (
    'finance-admin', 'finance_admin', 'master-admin', 'master_admin', 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.marketplace_is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.marketplace_jwt_role() IN ('teacher', 'admin', 'master-admin', 'master_admin', 'owner');
$$;

-- ---------------------------------------------------------------------------
-- 1. recorded_courses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recorded_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL CHECK (owner_type IN ('PLATFORM', 'TEACHER')),
  teacher_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  source_type public.recorded_course_source_type NOT NULL,
  title text NOT NULL,
  description text,
  country text,
  educational_system text,
  curriculum text,
  qualification text,
  grade_level text,
  subject_family text,
  subject text,
  language text,
  subtitle_languages text[] DEFAULT '{}',
  course_level text,
  price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'USD',
  promotional_price numeric(12, 2),
  promotion_start_at timestamptz,
  promotion_end_at timestamptz,
  publication_status public.recorded_publication_status NOT NULL DEFAULT 'DRAFT',
  rating_average numeric(3, 2) DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  enrolment_count integer NOT NULL DEFAULT 0,
  total_lessons integer NOT NULL DEFAULT 0,
  total_duration_minutes integer NOT NULL DEFAULT 0,
  cover_asset_url text,
  preview_enabled boolean NOT NULL DEFAULT false,
  teacher_display_name text,
  teacher_verified boolean NOT NULL DEFAULT false,
  teacher_image_url text,
  teacher_gender text CHECK (
    teacher_gender IS NULL OR teacher_gender IN (
      'male', 'female', 'prefer_not_to_say', 'not_specified'
    )
  ),
  copyright_declaration_accepted boolean NOT NULL DEFAULT false,
  rights_policy_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT recorded_courses_owner_consistency CHECK (
    (source_type = 'S4S_INTELLIGENCE' AND owner_type = 'PLATFORM')
    OR (source_type = 'TEACHER_RECORDED' AND owner_type = 'TEACHER')
  )
);

CREATE INDEX IF NOT EXISTS idx_recorded_courses_source_status
  ON public.recorded_courses (source_type, publication_status);
CREATE INDEX IF NOT EXISTS idx_recorded_courses_teacher
  ON public.recorded_courses (teacher_id);
CREATE INDEX IF NOT EXISTS idx_recorded_courses_catalog
  ON public.recorded_courses (country, curriculum, grade_level, subject, language);

-- ---------------------------------------------------------------------------
-- 2. recorded_course_units
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recorded_course_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.recorded_courses (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recorded_course_units_course
  ON public.recorded_course_units (course_id, position);

-- ---------------------------------------------------------------------------
-- 3. recorded_course_lessons
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recorded_course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.recorded_course_units (id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.recorded_courses (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  lesson_type text NOT NULL DEFAULT 'video',
  duration_minutes integer NOT NULL DEFAULT 0,
  video_url text,
  audio_url text,
  interactive_asset_url text,
  preview_allowed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  media_provider text,
  media_model text,
  media_generated_at timestamptz,
  media_consent_reference text,
  media_disclosure_required boolean NOT NULL DEFAULT false,
  media_approval_status text DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recorded_course_lessons_course
  ON public.recorded_course_lessons (course_id, position);

-- ---------------------------------------------------------------------------
-- 4. course_commission_rules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (
    scope IN (
      'global',
      'lesson_source',
      'partner_type',
      'teacher_override',
      'course_override',
      'special_campaign'
    )
  ),
  source_type public.recorded_course_source_type,
  partner_type text,
  teacher_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.recorded_courses (id) ON DELETE CASCADE,
  campaign_id text,
  percentage numeric(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  priority integer NOT NULL DEFAULT 0,
  status public.commission_rule_status NOT NULL DEFAULT 'ACTIVE',
  effective_start_at timestamptz,
  effective_end_at timestamptz,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_commission_rules_scope
  ON public.course_commission_rules (scope, status, priority DESC);

-- Seed default TEACHER_RECORDED = 15% platform commission (teacher gross 85%)
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

-- ---------------------------------------------------------------------------
-- Commission audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_commission_rule_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES public.course_commission_rules (id) ON DELETE SET NULL,
  previous_value jsonb,
  new_value jsonb,
  scope text,
  reason text,
  changed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  effective_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. recorded_course_purchases
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recorded_course_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.recorded_courses (id) ON DELETE RESTRICT,
  payment_status public.marketplace_payment_status NOT NULL DEFAULT 'PENDING',
  payment_provider text NOT NULL DEFAULT 'TEST_MODE',
  payment_reference text,
  currency text NOT NULL DEFAULT 'USD',
  original_price numeric(12, 2) NOT NULL,
  discount_amount numeric(12, 2) NOT NULL DEFAULT 0,
  paid_amount numeric(12, 2) NOT NULL,
  purchased_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recorded_course_purchases_payment_ref_unique UNIQUE (payment_provider, payment_reference)
);

CREATE INDEX IF NOT EXISTS idx_recorded_course_purchases_student
  ON public.recorded_course_purchases (student_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 6. course_financial_snapshots (immutable after insert)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_financial_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL UNIQUE REFERENCES public.recorded_course_purchases (id) ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES public.recorded_courses (id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  teacher_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  source_type public.recorded_course_source_type NOT NULL,
  original_price numeric(12, 2) NOT NULL,
  discount_amount numeric(12, 2) NOT NULL DEFAULT 0,
  paid_amount numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  effective_commission_percentage numeric(5, 2) NOT NULL,
  platform_commission_amount numeric(12, 2) NOT NULL,
  teacher_gross_share numeric(12, 2) NOT NULL DEFAULT 0,
  payment_processing_fee numeric(12, 2) NOT NULL DEFAULT 0,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0,
  refund_amount numeric(12, 2) NOT NULL DEFAULT 0,
  teacher_final_payable numeric(12, 2) NOT NULL DEFAULT 0,
  platform_final_retained numeric(12, 2) NOT NULL,
  applied_commission_rule_id uuid REFERENCES public.course_commission_rules (id) ON DELETE SET NULL,
  calculation_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Block updates/deletes on snapshots (immutability)
CREATE OR REPLACE FUNCTION public.prevent_financial_snapshot_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'course_financial_snapshots are immutable';
END;
$$;

DROP TRIGGER IF EXISTS trg_course_financial_snapshots_immutable ON public.course_financial_snapshots;
CREATE TRIGGER trg_course_financial_snapshots_immutable
  BEFORE UPDATE OR DELETE ON public.course_financial_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_financial_snapshot_mutation();

-- ---------------------------------------------------------------------------
-- 7. recorded_course_enrolments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recorded_course_enrolments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.recorded_courses (id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES public.recorded_course_purchases (id) ON DELETE SET NULL,
  status public.enrolment_status NOT NULL DEFAULT 'ACTIVE',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  progress_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  last_accessed_at timestamptz
);

-- Unique active enrolment per student+course
CREATE UNIQUE INDEX IF NOT EXISTS uq_recorded_course_enrolments_active
  ON public.recorded_course_enrolments (student_id, course_id)
  WHERE status = 'ACTIVE';

-- ---------------------------------------------------------------------------
-- 8. teacher_payout_ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_payout_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  purchase_id uuid NOT NULL REFERENCES public.recorded_course_purchases (id) ON DELETE RESTRICT,
  financial_snapshot_id uuid NOT NULL REFERENCES public.course_financial_snapshots (id) ON DELETE RESTRICT,
  gross_teacher_share numeric(12, 2) NOT NULL,
  deductions numeric(12, 2) NOT NULL DEFAULT 0,
  net_payable numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payout_status public.payout_status NOT NULL DEFAULT 'PENDING',
  payout_reference text,
  payable_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_payout_ledger_teacher
  ON public.teacher_payout_ledger (teacher_id, payout_status);

-- ---------------------------------------------------------------------------
-- 9. recorded_course_reviews
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recorded_course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.recorded_courses (id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text text,
  status public.review_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id)
);

-- ---------------------------------------------------------------------------
-- 10. teacher_course_review_workflow
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_course_review_workflow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.recorded_courses (id) ON DELETE CASCADE,
  status public.recorded_publication_status NOT NULL DEFAULT 'DRAFT',
  reviewer_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_course_review_workflow_status
  ON public.teacher_course_review_workflow (status, updated_at DESC);

-- ---------------------------------------------------------------------------
-- 11. aios_course_production_jobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aios_course_production_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type text NOT NULL DEFAULT 'S4S_INTELLIGENCE_COURSE_PRODUCTION'
    CHECK (task_type = 'S4S_INTELLIGENCE_COURSE_PRODUCTION'),
  course_id uuid REFERENCES public.recorded_courses (id) ON DELETE SET NULL,
  requested_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  factory text,
  agent text,
  provider text,
  status text NOT NULL DEFAULT 'QUEUED',
  education_status text NOT NULL DEFAULT 'PENDING',
  media_status text NOT NULL DEFAULT 'PENDING',
  scientific_verification_status text NOT NULL DEFAULT 'PENDING',
  source_verification_status text NOT NULL DEFAULT 'PENDING',
  human_approval_status text NOT NULL DEFAULT 'PENDING',
  publication_readiness text NOT NULL DEFAULT 'NOT_READY',
  generated_assets jsonb NOT NULL DEFAULT '[]'::jsonb,
  auto_publish boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT aios_no_auto_publish CHECK (auto_publish = false)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.recorded_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorded_course_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorded_course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_commission_rule_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorded_course_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_financial_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorded_course_enrolments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_payout_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorded_course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_course_review_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aios_course_production_jobs ENABLE ROW LEVEL SECURITY;

-- Public / anon: published catalogue fields only
DROP POLICY IF EXISTS recorded_courses_public_read ON public.recorded_courses;
CREATE POLICY recorded_courses_public_read ON public.recorded_courses
  FOR SELECT
  USING (
    publication_status = 'PUBLISHED'
    OR teacher_id = auth.uid()
    OR public.marketplace_is_admin()
  );

DROP POLICY IF EXISTS recorded_courses_teacher_insert ON public.recorded_courses;
CREATE POLICY recorded_courses_teacher_insert ON public.recorded_courses
  FOR INSERT
  WITH CHECK (
    (teacher_id = auth.uid() AND source_type = 'TEACHER_RECORDED')
    OR public.marketplace_is_admin()
  );

DROP POLICY IF EXISTS recorded_courses_teacher_update ON public.recorded_courses;
CREATE POLICY recorded_courses_teacher_update ON public.recorded_courses
  FOR UPDATE
  USING (
    (teacher_id = auth.uid() AND publication_status IN ('DRAFT', 'CHANGES_REQUESTED'))
    OR public.marketplace_is_admin()
  )
  WITH CHECK (
    (teacher_id = auth.uid() AND publication_status IN ('DRAFT', 'CHANGES_REQUESTED', 'SUBMITTED'))
    OR public.marketplace_is_admin()
  );

-- Units / lessons: readable for published courses; editable by owner teacher / admin
DROP POLICY IF EXISTS recorded_units_read ON public.recorded_course_units;
CREATE POLICY recorded_units_read ON public.recorded_course_units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recorded_courses c
      WHERE c.id = course_id
        AND (c.publication_status = 'PUBLISHED' OR c.teacher_id = auth.uid() OR public.marketplace_is_admin())
    )
  );

DROP POLICY IF EXISTS recorded_units_write ON public.recorded_course_units;
CREATE POLICY recorded_units_write ON public.recorded_course_units
  FOR ALL USING (
    public.marketplace_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.recorded_courses c
      WHERE c.id = course_id AND c.teacher_id = auth.uid()
        AND c.publication_status IN ('DRAFT', 'CHANGES_REQUESTED')
    )
  )
  WITH CHECK (
    public.marketplace_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.recorded_courses c
      WHERE c.id = course_id AND c.teacher_id = auth.uid()
        AND c.publication_status IN ('DRAFT', 'CHANGES_REQUESTED')
    )
  );

DROP POLICY IF EXISTS recorded_lessons_read ON public.recorded_course_lessons;
CREATE POLICY recorded_lessons_read ON public.recorded_course_lessons
  FOR SELECT USING (
    preview_allowed = true
    OR EXISTS (
      SELECT 1 FROM public.recorded_courses c
      WHERE c.id = course_id
        AND (c.publication_status = 'PUBLISHED' OR c.teacher_id = auth.uid() OR public.marketplace_is_admin())
    )
    OR EXISTS (
      SELECT 1 FROM public.recorded_course_enrolments e
      WHERE e.course_id = recorded_course_lessons.course_id
        AND e.student_id = auth.uid()
        AND e.status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS recorded_lessons_write ON public.recorded_course_lessons;
CREATE POLICY recorded_lessons_write ON public.recorded_course_lessons
  FOR ALL USING (
    public.marketplace_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.recorded_courses c
      WHERE c.id = course_id AND c.teacher_id = auth.uid()
        AND c.publication_status IN ('DRAFT', 'CHANGES_REQUESTED')
    )
  )
  WITH CHECK (
    public.marketplace_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.recorded_courses c
      WHERE c.id = course_id AND c.teacher_id = auth.uid()
        AND c.publication_status IN ('DRAFT', 'CHANGES_REQUESTED')
    )
  );

-- Commission rules: finance/master admin only for writes; authenticated read of active % for previews
DROP POLICY IF EXISTS commission_rules_read ON public.course_commission_rules;
CREATE POLICY commission_rules_read ON public.course_commission_rules
  FOR SELECT USING (
    auth.role() = 'authenticated' OR public.marketplace_is_admin()
  );

DROP POLICY IF EXISTS commission_rules_write ON public.course_commission_rules;
CREATE POLICY commission_rules_write ON public.course_commission_rules
  FOR ALL USING (public.marketplace_is_finance_admin())
  WITH CHECK (public.marketplace_is_finance_admin());

DROP POLICY IF EXISTS commission_audit_read ON public.course_commission_rule_audit;
CREATE POLICY commission_audit_read ON public.course_commission_rule_audit
  FOR SELECT USING (public.marketplace_is_finance_admin());

DROP POLICY IF EXISTS commission_audit_insert ON public.course_commission_rule_audit;
CREATE POLICY commission_audit_insert ON public.course_commission_rule_audit
  FOR INSERT WITH CHECK (public.marketplace_is_finance_admin());

-- Purchases: student owns; admin all; no teacher list of other students
DROP POLICY IF EXISTS purchases_student_read ON public.recorded_course_purchases;
CREATE POLICY purchases_student_read ON public.recorded_course_purchases
  FOR SELECT USING (student_id = auth.uid() OR public.marketplace_is_admin());

-- Inserts/updates of purchases must be service-role / server only (no direct client insert policy)

-- Snapshots: student may read own receipt fields; teacher may read own earnings rows; never mutate via client
DROP POLICY IF EXISTS snapshots_read ON public.course_financial_snapshots;
CREATE POLICY snapshots_read ON public.course_financial_snapshots
  FOR SELECT USING (
    student_id = auth.uid()
    OR teacher_id = auth.uid()
    OR public.marketplace_is_finance_admin()
  );

-- Enrolments
DROP POLICY IF EXISTS enrolments_student_read ON public.recorded_course_enrolments;
CREATE POLICY enrolments_student_read ON public.recorded_course_enrolments
  FOR SELECT USING (student_id = auth.uid() OR public.marketplace_is_admin());

DROP POLICY IF EXISTS enrolments_teacher_aggregate ON public.recorded_course_enrolments;
CREATE POLICY enrolments_teacher_aggregate ON public.recorded_course_enrolments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recorded_courses c
      WHERE c.id = course_id AND c.teacher_id = auth.uid()
    )
  );

-- Payout ledger: teacher own rows; finance admin; never students
DROP POLICY IF EXISTS payout_ledger_read ON public.teacher_payout_ledger;
CREATE POLICY payout_ledger_read ON public.teacher_payout_ledger
  FOR SELECT USING (
    teacher_id = auth.uid() OR public.marketplace_is_finance_admin()
  );

-- Reviews: public published; students create for enrolled courses only
DROP POLICY IF EXISTS reviews_read ON public.recorded_course_reviews;
CREATE POLICY reviews_read ON public.recorded_course_reviews
  FOR SELECT USING (
    status = 'PUBLISHED'
    OR student_id = auth.uid()
    OR public.marketplace_is_admin()
  );

DROP POLICY IF EXISTS reviews_insert ON public.recorded_course_reviews;
CREATE POLICY reviews_insert ON public.recorded_course_reviews
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.recorded_course_enrolments e
      WHERE e.course_id = recorded_course_reviews.course_id
        AND e.student_id = auth.uid()
        AND e.status IN ('ACTIVE', 'COMPLETED')
    )
  );

DROP POLICY IF EXISTS reviews_update_own ON public.recorded_course_reviews;
CREATE POLICY reviews_update_own ON public.recorded_course_reviews
  FOR UPDATE USING (student_id = auth.uid() OR public.marketplace_is_admin());

-- Workflow
DROP POLICY IF EXISTS workflow_read ON public.teacher_course_review_workflow;
CREATE POLICY workflow_read ON public.teacher_course_review_workflow
  FOR SELECT USING (
    public.marketplace_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.recorded_courses c
      WHERE c.id = course_id AND c.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS workflow_admin_write ON public.teacher_course_review_workflow;
CREATE POLICY workflow_admin_write ON public.teacher_course_review_workflow
  FOR ALL USING (public.marketplace_is_admin())
  WITH CHECK (public.marketplace_is_admin());

-- Teachers may insert SUBMITTED workflow rows for own courses (cannot approve/publish)
DROP POLICY IF EXISTS workflow_teacher_submit ON public.teacher_course_review_workflow;
CREATE POLICY workflow_teacher_submit ON public.teacher_course_review_workflow
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recorded_courses c
      WHERE c.id = course_id AND c.teacher_id = auth.uid()
    )
    AND status IN ('DRAFT', 'SUBMITTED')
  );

-- AIOS jobs: admin only
DROP POLICY IF EXISTS aios_jobs_admin ON public.aios_course_production_jobs;
CREATE POLICY aios_jobs_admin ON public.aios_course_production_jobs
  FOR ALL USING (public.marketplace_is_admin())
  WITH CHECK (public.marketplace_is_admin());

COMMIT;
