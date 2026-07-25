-- جامعات أوروبا / بريطانيا / قبرص + مسارات تحضيرية ومالية لعام 2026

insert into public.institutions (id, name, type, official_email, is_partner, logo_url, country, majors)
values
  (
    '00000000-0000-4000-8000-000000000019',
    'جامعة برلين التقنية - ألمانيا',
    'university',
    'international@tu-berlin.de',
    false,
    'https://tu-berlin.de',
    'Germany',
    array['Engineering', 'Computing', 'Sciences', 'Architecture']
  ),
  (
    '00000000-0000-4000-8000-000000000020',
    'جامعة كوفنتري - بريطانيا',
    'university',
    'applications.io@coventry.ac.uk',
    true,
    'https://coventry.ac.uk',
    'United Kingdom',
    array['Engineering', 'Business', 'Computing', 'Design', 'Health']
  ),
  (
    '00000000-0000-4000-8000-000000000021',
    'جامعة الشرق الأدنى - قبرص',
    'university',
    'info@neu.edu.tr',
    true,
    'https://neu.edu.tr',
    'Cyprus',
    array['Medicine', 'Engineering', 'Business', 'Law', 'Dentistry']
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
  -- طالب مصري → برلين التقنية
  (
    '00000000-0000-4000-8000-000000000019',
    'Egyptian',
    3.00,
    'الشهادة الثانوية العامة تتطلب دراسة سنة تحضيرية (Studienkolleg) إجبارية. يشترط إثبات لغة ألمانية B2 أو إنجليزية IELTS 6.5 حسب المسار، وفتح حساب مغلق بمبلغ 11,900 يورو.',
    null,
    false,
    false,
    'Studienkolleg + Blocked Account',
    '900$ - 1100$ شهرياً',
    '2026-07-15',
    true
  ),
  -- طالب سعودي → كوفنتري
  (
    '00000000-0000-4000-8000-000000000020',
    'Saudi',
    2.80,
    'القبول مشروط بدراسة سنة تأسيسية (Foundation Year). يشترط رفع شهادة IELTS for UKVI حصراً بمعدل لا يقل عن 5.5، وتقديم كشف حساب بنكي يغطي الرسوم والمعيشة لـ 9 أشهر.',
    null,
    false,
    false,
    'IELTS for UKVI',
    '1200$ - 1600$ شهرياً',
    '2026-08-30',
    true
  ),
  -- طالب يمني → الشرق الأدنى (قبرص)
  (
    '00000000-0000-4000-8000-000000000021',
    'Yemeni',
    2.00,
    'قبول فوري مباشر بالشهادة الثانوية. يحصل الطالب تلقائياً على منحة جزئية بقيمة 50% على كافة التخصصات. الفيزا تصدر فوراً في المطار بناءً على ورقة القبول الحالية.',
    null,
    false,
    false,
    'القبول بالثانوية فقط',
    '300$ - 400$ شهرياً',
    '2026-10-01',
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
