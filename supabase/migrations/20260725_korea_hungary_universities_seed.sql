-- جامعة سيؤول الوطنية + جامعة دبرتسن (المجر) مع شروط 2026 حسب الجنسية

insert into public.institutions (id, name, type, official_email, is_partner, logo_url, country, majors)
values
  (
    '00000000-0000-4000-8000-000000000024',
    'جامعة سيؤول الوطنية - كوريا',
    'university',
    'admission@snu.ac.kr',
    false,
    'https://snu.ac.kr',
    'South Korea',
    array['Engineering', 'Medicine', 'Sciences', 'Business', 'Arts']
  ),
  (
    '00000000-0000-4000-8000-000000000025',
    'جامعة دبرتسن - المجر',
    'university',
    'sh@edu.unideb.hu',
    true,
    'https://unideb.hu',
    'Hungary',
    array['Medicine', 'Engineering', 'Sciences', 'Business', 'Pharmacy']
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
  -- طالب مغربي → سيؤول الوطنية
  (
    '00000000-0000-4000-8000-000000000024',
    'Moroccan',
    3.30,
    'يشترط ألا يحمل الطالب أو أحد والديه الجنسية الكورية. يتطلب تقديم شهادة TOPIK مستوى 3 للتخصصات الكورية أو آيلتس 5.5 للإنجليزية، مع توفير توثيق الأبوستيل للشهادات وكشف حساب بقيمة 20,000 دولار.',
    null,
    false,
    false,
    'Apostille + TOPIK/IELTS',
    '500$ - 700$ شهرياً',
    '2026-03-27',
    true
  ),
  -- طالب مصري → منحة المجر / دبرتسن
  (
    '00000000-0000-4000-8000-000000000025',
    'Egyptian',
    3.00,
    'القبول مشروط بترشيح وزارة التعليم العالي المصرية (Sending Partner). يشترط أن يكون السن فوق 18 عاماً، ورفع الفحص الطبي المعتمد (HIV, Hep B/C). المنحة تغطي الرسوم، السكن، وتمنح راتباً شهرياً.',
    null,
    true,
    false,
    'Nomination + Medical Check',
    '110$ شهرياً (المنحة تغطي السكن والرسوم)',
    '2026-01-15',
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
