-- Spec snapshot (idempotent). Full seed/RLS lives in 20260725_admission_funnel.sql.
-- Tables: profiles, institutions, admission_criteria, payments, applications, notifications.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid references auth.users (id) on delete cascade primary key,
  full_name text not null,
  nationality text not null,
  gpa numeric(3, 2) not null,
  target_degree text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('university', 'college', 'school')),
  official_email text not null,
  is_partner boolean not null default false,
  logo_url text
);

create table if not exists public.admission_criteria (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  nationality text not null,
  min_gpa numeric(3, 2) not null,
  requirements_text text not null,
  unique (institution_id, nationality)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  stripe_session_id text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  amount numeric(5, 2) not null default 5.00
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  passport_file_url text not null,
  transcript_file_url text not null,
  status text not null default 'submitted',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);
