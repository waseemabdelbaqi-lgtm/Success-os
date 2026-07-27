-- توسيع الكتالوج: جامعة تركية (بهتشه شهير) + شروط سوريين/عراقيين لعام 2026
-- Requires: mena seed + criteria enrichment columns

insert into public.institutions (id, name, type, official_email, is_partner, logo_url, country, majors)
values
  (
    '00000000-0000-4000-8000-000000000014',
    'جامعة بهتشه شهير اسطنبول',
    'university',
    'international@bau.edu.tr',
    true,
    'https://bau.edu.tr',
    'Turkey',
    array['Engineering', 'Business', 'Medicine', 'Computing', 'Design']
  )
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  official_email = excluded.official_email,
  is_partner = excluded.is_partner,
  logo_url = excluded.logo_url,
  country = excluded.country,
  majors = excluded.majors;

insert into public.admission_criteria (
  institution_id,
  nationality,
  min_gpa,
  requirements_text,
  avg_living_cost,
  deadline_date,
  is_accredited_in_home_country
)
values
  -- شروط الطلاب السوريين في تركيا (قبول مباشر بدون يوس)
  (
    '00000000-0000-4000-8000-000000000014',
    'Syrian',
    2.00,
    'القبول بالشهادة الثانوية مباشرة بدون اختبارات قبول. يشترط فقط حيازة جواز سفر ساري وعمل معادلة شهادة Denklik بعد الوصول.',
    '350$ - 500$ شهرياً (إسطنبول)',
    '2026-09-30',
    true
  ),
  -- شروط الطلاب العراقيين في الأردن (الجامعة الأردنية)
  (
    '00000000-0000-4000-8000-000000000013',
    'Iraqi',
    3.20,
    'يتطلب القبول في البرنامج الدولي تصديق وثيقة الثانوية من وزارة التربية العراقية والخارجية، والحد الأدنى للطب البشري 90% والهندسة 80%.',
    '400$ - 600$ شهرياً (عمان)',
    '2026-09-15',
    true
  )
on conflict (institution_id, nationality) do update set
  min_gpa = excluded.min_gpa,
  requirements_text = excluded.requirements_text,
  avg_living_cost = excluded.avg_living_cost,
  deadline_date = excluded.deadline_date,
  is_accredited_in_home_country = excluded.is_accredited_in_home_country;
