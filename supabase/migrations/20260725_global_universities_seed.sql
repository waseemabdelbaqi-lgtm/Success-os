-- جامعات دولية كبرى + شروط سيادية دقيقة لعام 2026 حسب الجنسية

insert into public.institutions (id, name, type, official_email, is_partner, logo_url, country, majors)
values
  (
    '00000000-0000-4000-8000-000000000015',
    'جامعة الشارقة - الإمارات',
    'university',
    'admissions@sharjah.ac.ae',
    false,
    'https://sharjah.ac.ae',
    'United Arab Emirates',
    array['Engineering', 'Medicine', 'Business', 'Sciences']
  ),
  (
    '00000000-0000-4000-8000-000000000016',
    'جامعة قطر - الدوحة',
    'university',
    'admission@qu.edu.qa',
    false,
    'https://qu.edu.qa',
    'Qatar',
    array['Engineering', 'Medicine', 'Business', 'Law', 'Sciences']
  ),
  (
    '00000000-0000-4000-8000-000000000017',
    'جامعة مالايا - ماليزيا',
    'university',
    'international@um.edu.my',
    true,
    'https://um.edu.my',
    'Malaysia',
    array['Engineering', 'Medicine', 'Computing', 'Sciences', 'Business']
  ),
  (
    '00000000-0000-4000-8000-000000000018',
    'جامعة قازان الفيدرالية - روسيا',
    'university',
    'admission@kpfu.ru',
    false,
    'https://kpfu.ru',
    'Russia',
    array['Medicine', 'Engineering', 'Sciences', 'Languages']
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
  -- طالب يمني → جامعة الشارقة
  (
    '00000000-0000-4000-8000-000000000015',
    'Yemeni',
    3.50,
    'يشترط شهادة آيلتس 5.5 أكاديمية بشكل فوري، مع رفع درجات اختبار EmSAT الوطني بمعدل لا يقل عن 1100 في الرياضيات والفيزياء.',
    null,
    false,
    false,
    'IELTS 5.5 + EmSAT',
    '800$ - 1200$ شهرياً',
    '2026-08-15',
    true
  ),
  -- طالب سوري → جامعة مالايا
  (
    '00000000-0000-4000-8000-000000000017',
    'Syrian',
    3.00,
    'القبول يعتمد على درجات المواد العلمية (فوق 70% في الرياضيات). يشترط الخضوع للفحص الطبي الإلزامي لوزارة الهجرة EMGS للحصول على موافقة الفيزا (VAL).',
    28,
    false,
    false,
    'EMGS Medical Check',
    '400$ - 600$ شهرياً',
    '2026-09-01',
    true
  ),
  -- طالب مصري → جامعة قازان (طب)
  (
    '00000000-0000-4000-8000-000000000018',
    'Egyptian',
    2.00,
    'القبول مباشر بمعدل ثانوية يبدأ من 60% للقطاع الطبي. يشترط رفع شهادة فحص HIV مترجمة للروسية، واجتياز السنة التحضيرية للغة (Pre-University Russian Course).',
    null,
    false,
    false,
    'HIV Test + Russian Year',
    '250$ - 400$ شهرياً',
    '2026-10-15',
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
