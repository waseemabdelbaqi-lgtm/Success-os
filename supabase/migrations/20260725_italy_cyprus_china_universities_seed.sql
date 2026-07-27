-- ميلانو / نيقوسيا / تسينغهوا مع شروط ومسارات 2026 حسب الجنسية

insert into public.institutions (id, name, type, official_email, is_partner, logo_url, country, majors)
values
  (
    '00000000-0000-4000-8000-000000000026',
    'جامعة البوليتكنيك في ميلانو - إيطاليا',
    'university',
    'international-admissions@polimi.it',
    false,
    'https://polimi.it',
    'Italy',
    array['Engineering', 'Architecture', 'Design', 'Computing']
  ),
  (
    '00000000-0000-4000-8000-000000000027',
    'جامعة نيقوسيا - قبرص اليونانية',
    'university',
    'admissions@unic.ac.cy',
    true,
    'https://unic.ac.cy',
    'Cyprus',
    array['Medicine', 'Business', 'Law', 'Computing', 'Pharmacy']
  ),
  (
    '00000000-0000-4000-8000-000000000028',
    'جامعة تسينغهوا - بكين الصين',
    'university',
    'admissions@tsinghua.edu.cn',
    false,
    'https://tsinghua.edu.cn',
    'China',
    array['Engineering', 'Computing', 'Sciences', 'Business', 'Architecture']
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
  -- طالب مغربي → بوليتكنيك ميلانو
  (
    '00000000-0000-4000-8000-000000000026',
    'Moroccan',
    3.20,
    'القبول مشروط باجتياز اختبار English TOLC-I بمعدل مرجعي مطلوب للكلية. يتطلب التسجيل لاحقاً في Universitaly وتجهيز وثائق ISEE المالي لمنحة المعيشة والسكن DSU.',
    null,
    false,
    false,
    'English TOLC-I + Universitaly',
    '600$ - 850$ شهرياً',
    '2026-04-15',
    true
  ),
  -- طالب لبناني → نيقوسيا
  (
    '00000000-0000-4000-8000-000000000027',
    'Lebanese',
    2.50,
    'يشترط كشف حساب بنكي لولي الأمر بقيمة 7000 يورو، ورفع كفالة بنكية مستردة بقيمة 600 يورو للهجرة، بالإضافة لشهادة الفحوصات الطبية الأربعة المصدقة من الخارجية.',
    null,
    false,
    false,
    'Bank Guarantee + Medical Pack',
    '700$ - 950$ شهرياً',
    '2026-07-30',
    true
  ),
  -- طالب يمني → تسينغهوا (منحة CSC)
  (
    '00000000-0000-4000-8000-000000000028',
    'Yemeni',
    3.50,
    'القبول منافس جداً، يشترط رفع شهادة خلو سوابق جنائية (فيش وتشبيه) مصدق، وخطابين توصية أكاديميين، مع فحص طبي معتمد (Foreigner Physical Examination). المنحة تعفي من الرسوم وتوفر السكن وراتب شهري.',
    25,
    false,
    false,
    'Non-Criminal Record + 2 Recommendation Letters',
    '150$ شهرياً (المنحة تغطي المعيشة الأساسية والسكن)',
    '2026-03-01',
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
