-- SUCCESS OS — University Admission Funnel
-- Schema aligned with product spec (profiles → institutions → admission_criteria
-- → payments → applications → notifications).
-- Apply in Supabase SQL editor or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Profiles (student data; id = auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users (id) on delete cascade primary key,
  full_name text not null,
  nationality text not null,
  gpa numeric(3, 2) not null,
  target_degree text not null, -- bachelor, master, diploma, phd, school
  major text,
  email text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------------
-- 2. Institutions (university / college / school)
-- ---------------------------------------------------------------------------
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('university', 'college', 'school')),
  official_email text not null,
  is_partner boolean not null default false,
  logo_url text,
  -- helpers for smart filtering (optional; seed uses these)
  country text,
  majors text[] not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists institutions_type_idx on public.institutions (type);
create index if not exists institutions_partner_idx on public.institutions (is_partner);

-- ---------------------------------------------------------------------------
-- 3. Dynamic admission criteria by nationality
-- ---------------------------------------------------------------------------
create table if not exists public.admission_criteria (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  nationality text not null, -- 'All' or e.g. 'Egyptian', 'Jordan'
  min_gpa numeric(3, 2) not null,
  requirements_text text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (institution_id, nationality)
);

create index if not exists admission_criteria_nat_idx
  on public.admission_criteria (nationality);

-- ---------------------------------------------------------------------------
-- 4. $5 USD payment tracking
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  stripe_session_id text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  amount numeric(5, 2) not null default 5.00,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists payments_user_idx on public.payments (user_id);
create index if not exists payments_status_idx on public.payments (status);

-- ---------------------------------------------------------------------------
-- 5. Unified applications
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  passport_file_url text not null,
  transcript_file_url text not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'accepted', 'rejected')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists applications_user_idx on public.applications (user_id);
create index if not exists applications_institution_idx on public.applications (institution_id);

-- ---------------------------------------------------------------------------
-- 6. In-app notifications (partner institutions)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Realtime (corrected from invalid `alter publish replica identity target`)
-- ---------------------------------------------------------------------------
alter table public.notifications replica identity full;
alter table public.applications replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'applications'
  ) then
    alter publication supabase_realtime add table public.applications;
  end if;
exception
  when undefined_object then
    null; -- local Postgres without supabase_realtime
end $$;

-- ---------------------------------------------------------------------------
-- Storage bucket for passport / transcript PDFs
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('admission-documents', 'admission-documents', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.institutions enable row level security;
alter table public.admission_criteria enable row level security;
alter table public.payments enable row level security;
alter table public.applications enable row level security;
alter table public.notifications enable row level security;

create policy "Public read institutions"
  on public.institutions for select
  using (true);

create policy "Public read admission criteria"
  on public.admission_criteria for select
  using (true);

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Users read own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Service role full access profiles"
  on public.profiles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role full access institutions"
  on public.institutions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role full access payments"
  on public.payments for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role full access applications"
  on public.applications for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role full access notifications"
  on public.notifications for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Seed sample institutions + nationality criteria
-- ---------------------------------------------------------------------------
insert into public.institutions (id, name, type, official_email, is_partner, logo_url, country, majors)
values
  ('00000000-0000-4000-8000-000000000001', 'Technical University of Munich', 'university',
   'studium@tum.de', true, null, 'Germany',
   array['Engineering', 'Computing', 'Sciences']),
  ('00000000-0000-4000-8000-000000000002', 'RWTH Aachen University', 'university',
   'international@rwth-aachen.de', false, null, 'Germany',
   array['Engineering', 'Computing', 'Sciences']),
  ('00000000-0000-4000-8000-000000000003', 'University of Jordan', 'university',
   'admission@ju.edu.jo', true, null, 'Jordan',
   array['Engineering', 'Business', 'Medicine', 'Sciences']),
  ('00000000-0000-4000-8000-000000000004', 'Fontys University of Applied Sciences', 'college',
   'international@fontys.nl', true, null, 'Netherlands',
   array['Engineering', 'Computing', 'Business', 'Design']),
  ('00000000-0000-4000-8000-000000000005', 'Bangkok Patana School', 'school',
   'admissions@patana.ac.th', true, null, 'Thailand',
   array['IB', 'British Curriculum'])
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  is_partner = excluded.is_partner,
  official_email = excluded.official_email,
  majors = excluded.majors,
  country = excluded.country;

insert into public.admission_criteria (institution_id, nationality, min_gpa, requirements_text)
values
  ('00000000-0000-4000-8000-000000000001', 'Jordan', 3.00,
   'Non-EU international track via uni-assist/direct. Docs: secondary certificate, passport, proof of funds, German or English language proof. Semester fee applies; national D visa required.'),
  ('00000000-0000-4000-8000-000000000001', 'All', 3.00,
   'International applicants: secondary certificate, passport, language proof, proof of funds. Confirm channel on tum.de.'),
  ('00000000-0000-4000-8000-000000000002', 'Jordan', 2.80,
   'Non-EU track via RWTH international office. Docs: secondary certificate, passport, language proof. Student residence permit required. Non-partner — applications emailed to admissions.'),
  ('00000000-0000-4000-8000-000000000002', 'All', 2.80,
   'International GPA floor 2.8. Language proof and passport required.'),
  ('00000000-0000-4000-8000-000000000003', 'Jordan', 2.50,
   'Jordanian unified admission path. Docs: Tawjihi, national ID. Public tuition bands.'),
  ('00000000-0000-4000-8000-000000000003', 'Egypt', 2.50,
   'Non-Jordanian / international path via studyinjordan.jo. Docs: secondary certificate, passport, equivalency. International fee schedule.'),
  ('00000000-0000-4000-8000-000000000003', 'All', 2.50,
   'Minimum GPA 2.5. Passport and recognized secondary certificate required.'),
  ('00000000-0000-4000-8000-000000000004', 'All', 2.50,
   'Applied sciences bachelor/diploma. English proficiency, passport, transcripts.'),
  ('00000000-0000-4000-8000-000000000005', 'All', 0.00,
   'K–12 international school admissions. Passport, prior school records, placement assessment as required.')
on conflict (institution_id, nationality) do update set
  min_gpa = excluded.min_gpa,
  requirements_text = excluded.requirements_text;
