-- جامعة مالطا + جامعة جورجيا (تبيليسي) مع شروط 2026 حسب الجنسية

insert into public.institutions (id, name, type, official_email, is_partner, logo_url, country, majors)
values
  (
    '00000000-0000-4000-8000-000000000022',
    'جامعة مالطا الحكومية',
    'university',
    'intl.admissions@um.edu.mt',
    false,
    'https://um.edu.mt',
    'Malta',
    array['Engineering', 'Medicine', 'Business', 'Sciences', 'Law']
  ),
  (
    '00000000-0000-4000-8000-000000000023',
    'جامعة جورجيا - تبيليسي',
    'university',
    'admissions.info@ug.edu.ge',
    true,
    'https://ug.edu.ge',
    'Georgia',
    array['Medicine', 'Dentistry', 'Business', 'Computing', 'Law']
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
  max_age_allowed,
  requires_embassy_letter,
  requires_security_clearance,
  alternative_exam_required,
  avg_living_cost,
  deadline_date,
  is_accredited_in_home_country
)
values
  -- طالب أردني → مالطا
  (
    '00000000-0000-4000-8000-000000000022',
    'Jordanian',
    3.00,
    'الشهادة الثانوية العامة (التوجيهي) مقبولة مباشرة. يشترط إثبات لغة إنجليزية IELTS 6.0 أو خوض اختبار الجامعة الداخلي، مع تقديم حساب بنكي بقيمة 10,000 يورو لتأشيرة الشنغن.',
    null,
    false,
    false,
    'IELTS 6.0 / University Test',
    '700$ - 900$ شهرياً',
    '2026-06-30',
    true
  ),
  -- طالب مصري → جورجيا (طب)
  (
    '00000000-0000-4000-8000-000000000023',
    'Egyptian',
    2.40,
    'معدل القبول للطب يبدأ من 60% في الثانوية. يشترط تسجيل ورفع فيديو تعريفي باللغة الإنجليزية (دقيقتين)، والخضوع لموافقة مركز الجودة الوزاري الجورجي EQE بعد صدور القبول المبدئي.',
    null,
    false,
    false,
    'فيديو تعريفي + موافقة EQE',
    '350$ - 500$ شهرياً',
    '2026-10-31',
    true
  )
on conflict (institution_id, nationality) do update set
  min_gpa = excluded.min_gpa,
  requirements_text = excluded.requirements_text,
  max_age_allowed = excluded.max_age_allowed,
  requires_embassy_letter = excluded.requires_embassy_letter,
  requires_security_clearance = excluded.requires_security_clearance,
  alternative_exam_required = excluded.alternative_exam_required,
  avg_living_cost = excluded.avg_living_cost,
  deadline_date = excluded.deadline_date,
  is_accredited_in_home_country = excluded.is_accredited_in_home_country;
