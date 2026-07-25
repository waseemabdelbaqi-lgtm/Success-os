-- SUCCESS OS — University Admission Funnel schema (Supabase / PostgreSQL)
-- Apply in Supabase SQL editor or via supabase db push.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users when using Supabase Auth)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  full_name text,
  email text,
  phone text,
  nationality text not null,
  gpa numeric(3,2),
  target_degree text check (target_degree in ('bachelor','master','phd','diploma','school')),
  major text,
  preferred_study_country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Institutions (universities / colleges / schools)
-- ---------------------------------------------------------------------------
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  kind text not null check (kind in ('university','college','school')),
  country text not null,
  city text,
  majors text[] not null default '{}',
  degrees text[] not null default '{}',
  is_partner boolean not null default false,
  official_email text not null,
  website text,
  min_gpa numeric(3,2) default 2.0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists institutions_country_idx on public.institutions (country);
create index if not exists institutions_partner_idx on public.institutions (is_partner);
create index if not exists institutions_majors_gin on public.institutions using gin (majors);

-- ---------------------------------------------------------------------------
-- Admission criteria per nationality (dynamic conditions)
-- ---------------------------------------------------------------------------
create table if not exists public.admissions_criteria (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  nationality text not null,
  title text not null,
  channel text,
  fees_note text,
  visa_note text,
  docs text[] not null default '{}',
  summary text,
  unique (institution_id, nationality)
);

create index if not exists admissions_criteria_nat_idx
  on public.admissions_criteria (nationality);

-- ---------------------------------------------------------------------------
-- Payments ($5 Stripe fee)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  amount_cents integer not null default 500 check (amount_cents = 500),
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending','paid','failed','refunded')),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  unlock_token text unique default encode(gen_random_bytes(16), 'hex'),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payments_status_idx on public.payments (status);

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  payment_id uuid not null references public.payments (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending','submitted','under_review','accepted','rejected','emailed')),
  route text not null check (route in ('partner','email')),
  personal jsonb not null default '{}'::jsonb,
  transcript_path text,
  passport_path text,
  message text,
  email_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_institution_idx on public.applications (institution_id);
create index if not exists applications_status_idx on public.applications (status);

-- ---------------------------------------------------------------------------
-- In-app notifications (Realtime-ready)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete cascade,
  institution_id uuid references public.institutions (id) on delete set null,
  application_id uuid references public.applications (id) on delete cascade,
  audience text not null check (audience in ('student','institution')),
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_profile_idx on public.notifications (profile_id, created_at desc);

-- Realtime: stream new student notifications to the in-app dashboard
alter table public.notifications replica identity full;
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
exception
  when undefined_object then
    -- Local Postgres without supabase_realtime publication — skip safely
    null;
end $$;

-- ---------------------------------------------------------------------------
-- Storage bucket for application PDFs
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('admission-documents', 'admission-documents', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS (enable; tighten policies in production)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.institutions enable row level security;
alter table public.admissions_criteria enable row level security;
alter table public.payments enable row level security;
alter table public.applications enable row level security;
alter table public.notifications enable row level security;

create policy "Public read active institutions"
  on public.institutions for select
  using (active = true);

create policy "Public read admissions criteria"
  on public.admissions_criteria for select
  using (true);

create policy "Service role full access institutions"
  on public.institutions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Seed sample institutions (safe to re-run)
-- ---------------------------------------------------------------------------
insert into public.institutions (slug, name, kind, country, city, majors, degrees, is_partner, official_email, website, min_gpa)
values
  ('tum', 'Technical University of Munich', 'university', 'Germany', 'Munich',
   array['Engineering','Computing','Sciences'], array['bachelor','master','phd'], true,
   'studium@tum.de', 'https://www.tum.de', 3.0),
  ('rwth', 'RWTH Aachen University', 'university', 'Germany', 'Aachen',
   array['Engineering','Computing','Sciences'], array['bachelor','master','phd'], false,
   'international@rwth-aachen.de', 'https://www.rwth-aachen.de', 2.8),
  ('ju', 'University of Jordan', 'university', 'Jordan', 'Amman',
   array['Engineering','Business','Medicine','Sciences'], array['bachelor','master','phd'], true,
   'admission@ju.edu.jo', 'https://www.ju.edu.jo', 2.5),
  ('fontys', 'Fontys University of Applied Sciences', 'college', 'Netherlands', 'Eindhoven',
   array['Engineering','Computing','Business','Design'], array['bachelor','diploma'], true,
   'international@fontys.nl', 'https://fontys.edu', 2.5),
  ('patana', 'Bangkok Patana School', 'school', 'Thailand', 'Bangkok',
   array['IB','British Curriculum'], array['school'], true,
   'admissions@patana.ac.th', 'https://www.patana.ac.th', 0)
on conflict (slug) do update set
  name = excluded.name,
  is_partner = excluded.is_partner,
  official_email = excluded.official_email,
  majors = excluded.majors;

insert into public.admissions_criteria (institution_id, nationality, title, channel, fees_note, visa_note, docs, summary)
select i.id, c.nationality, c.title, c.channel, c.fees_note, c.visa_note, c.docs, c.summary
from public.institutions i
join (
  values
    ('tum', 'Jordan', 'Non-EU international track', 'uni-assist / direct', 'No tuition at most public unis; semester fee applies', 'National D visa / residence',
     array['Secondary certificate','Passport','Proof of funds','German or English proof'],
     'Jordanian nationals follow the international / uni-assist path for TUM.'),
    ('tum', 'Germany', 'Domestic / EU track', 'Hochschulstart or direct', 'Semester contribution only', 'No student visa for EU/DE',
     array['Abitur or equivalent','ID'],
     'German / EU applicants use domestic channels.'),
    ('rwth', 'Jordan', 'Non-EU international track', 'Direct international office', 'Semester fee + living costs', 'Student residence permit',
     array['Secondary certificate','Passport','Language proof'],
     'Non-partner route — applications are emailed to RWTH admissions.'),
    ('ju', 'Jordan', 'Unified admission (Jordanian)', 'Unified Admission Unit', 'Public tuition bands', 'N/A',
     array['Tawjihi','National ID'],
     'Jordanian citizens use the national unified admission path.'),
    ('ju', 'Egypt', 'International / non-Jordanian', 'studyinjordan.jo', 'International fee schedule', 'Study residency',
     array['Secondary certificate','Passport','Equivalency'],
     'Non-Jordanian applicants use the international unified portal.')
) as c(slug, nationality, title, channel, fees_note, visa_note, docs, summary)
  on i.slug = c.slug
on conflict (institution_id, nationality) do update set
  title = excluded.title,
  channel = excluded.channel,
  summary = excluded.summary;
