-- إضافة حقول الفحص الأمني، السن، والموافقة الدبلوماسية للفلاتر
alter table public.admission_criteria
  add column if not exists max_age_allowed integer,
  add column if not exists requires_embassy_letter boolean default false,
  add column if not exists requires_security_clearance boolean default false,
  add column if not exists alternative_exam_required text; -- TR-YÖS, SAT, TÖMER, etc.

-- الشروط العميقة لجنسيات محددة (fixed MENA UUIDs + upsert)
insert into public.admission_criteria (
  institution_id,
  nationality,
  min_gpa,
  requirements_text,
  max_age_allowed,
  requires_embassy_letter,
  requires_security_clearance,
  alternative_exam_required,
  is_accredited_in_home_country
)
values
  -- طالب كويتي → جامعة القاهرة
  (
    '00000000-0000-4000-8000-000000000012',
    'Kuwaiti',
    2.50,
    'يشترط إحضار موافقة رسمية وخطاب عدم ممانعة من المكتب الثقافي الكويتي بالقاهرة مصدقاً وموجهاً للكلية.',
    null,
    true,
    false,
    null,
    true
  ),
  -- طالب سوري → جامعة الملك سعود (تحديث/إدراج مع حد سن وفحص أمني)
  (
    '00000000-0000-4000-8000-000000000011',
    'Syrian',
    3.20,
    'القبول متاح عبر نظام المنح الخارجية للوافدين، يشترط ألا يتجاوز السن 25 عاماً، وتوفير صلة قرابة (محرم نظامي) للطالبات الإناث بالمملكة.',
    25,
    false,
    true,
    null,
    true
  ),
  -- طالب عراقي → بهتشه شهير (قبول مباشر + سنة لغة)
  (
    '00000000-0000-4000-8000-000000000014',
    'Iraqi',
    2.00,
    'القبول بالشهادة الثانوية العراقية مباشرة بدون يوس، ويشترط الخضوع لسنة اللغة التحضيرية وعمل معادلة Denklik بالقنصلية التركية.',
    null,
    false,
    false,
    'TÖMER/IELTS',
    true
  )
on conflict (institution_id, nationality) do update set
  min_gpa = excluded.min_gpa,
  requirements_text = excluded.requirements_text,
  max_age_allowed = excluded.max_age_allowed,
  requires_embassy_letter = excluded.requires_embassy_letter,
  requires_security_clearance = excluded.requires_security_clearance,
  alternative_exam_required = excluded.alternative_exam_required,
  is_accredited_in_home_country = excluded.is_accredited_in_home_country;
