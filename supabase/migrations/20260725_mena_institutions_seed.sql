-- جامعات تجريبية حقيقية (MENA) — شركاء وغير شركاء + شروط قبول 2026 حسب الجنسية
-- Idempotent: fixed UUIDs + upsert on (institution_id, nationality)

insert into public.institutions (id, name, type, official_email, is_partner, logo_url, country, majors)
values
  (
    '00000000-0000-4000-8000-000000000011',
    'جامعة الملك سعود - الرياض',
    'university',
    'admission@ksu.edu.sa',
    true,
    'https://ksu.edu.sa',
    'Saudi Arabia',
    array['Engineering', 'Medicine', 'Sciences', 'Business']
  ),
  (
    '00000000-0000-4000-8000-000000000012',
    'جامعة القاهرة - مصر',
    'university',
    'foreign.students@cu.edu.eg',
    false,
    'https://cu.edu.eg',
    'Egypt',
    array['Engineering', 'Computing', 'Medicine', 'Arts']
  ),
  (
    '00000000-0000-4000-8000-000000000013',
    'الجامعة الأردنية - عمان',
    'university',
    'intl.students@ju.edu.jo',
    false,
    'https://ju.edu.jo',
    'Jordan',
    array['Engineering', 'Pharmacy', 'Computing', 'Sciences']
  )
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  official_email = excluded.official_email,
  is_partner = excluded.is_partner,
  logo_url = excluded.logo_url,
  country = excluded.country,
  majors = excluded.majors;

-- الشروط الحقيقية المحدثة لعام 2026 حسب الجنسيات للتصفية التلقائية
insert into public.admission_criteria (institution_id, nationality, min_gpa, requirements_text)
values
  -- جامعة الملك سعود (مصري / سوري)
  (
    '00000000-0000-4000-8000-000000000011',
    'Egyptian',
    3.20,
    'يتطلب القبول للطلاب المصريين شهادة الثانوية العامة مصدقة من الخارجية المصرية والسفارة السعودية، مع فحص طبي معتمد وخلو سوابق من وزارة الداخلية لتأشيرة الدخول.'
  ),
  (
    '00000000-0000-4000-8000-000000000011',
    'Syrian',
    3.00,
    'القبول متاح عبر مسار المنح الدراسية للوافدين، يتطلب جواز سفر ساري المفعول لمدة لا تقل عن سنة، وإعفاء من شرط السن إن كان المتقدم حاصلاً على تميز أكاديمي.'
  ),

  -- جامعة القاهرة (سعودي / أردني)
  (
    '00000000-0000-4000-8000-000000000012',
    'Saudi',
    2.50,
    'التقديم متاح عبر الإدارة العامة للوافدين بمصر، يتطلب دفع رسوم القيد السنوية البالغة 1500 دولار للمرة الأولى، وتصديق الشهادة الثانوية من الملحقية الثقافية المصرية بالرياض.'
  ),
  (
    '00000000-0000-4000-8000-000000000012',
    'Jordanian',
    2.50,
    'القبول فوري لتخصصات الهندسة والحاسبات بمعدل لا يقل عن 65%، يتطلب توفير شهادة ميلاد أصلية وصورة جواز السفر معتمدة من السفارة الأردنية بالقاهرة.'
  ),

  -- الجامعة الأردنية (مصري)
  (
    '00000000-0000-4000-8000-000000000013',
    'Egyptian',
    2.80,
    'القبول عبر البرنامج الدولي بالجامعة، الحد الأدنى للهندسة والصيدلة هو 80% وللتخصصات الأخرى 60%، يشترط مراجعة مكتب الفحص الأمني للوافدين في عمان فور الدخول لإتمام الإقامة.'
  )
on conflict (institution_id, nationality) do update set
  min_gpa = excluded.min_gpa,
  requirements_text = excluded.requirements_text;
