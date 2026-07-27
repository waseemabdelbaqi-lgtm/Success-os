-- إضافة حقول التكاليف والاعتراف والتواريخ لجدول الشروط لتعزيز الفلترة الذكية
alter table public.admission_criteria
  add column if not exists avg_living_cost text,
  add column if not exists deadline_date date,
  add column if not exists is_accredited_in_home_country boolean default true;

-- تحديث البيانات الحقيقية كمثال حي للمنصة (MENA seed UUIDs)
update public.admission_criteria
set
  avg_living_cost = '350$ - 500$ شهرياً (شامل السكن والطعام المتوسط)',
  deadline_date = '2026-08-25',
  is_accredited_in_home_country = true
where nationality = 'Egyptian'
  and institution_id = '00000000-0000-4000-8000-000000000011';

update public.admission_criteria
set
  avg_living_cost = '150$ - 300$ شهرياً (معيشة اقتصادية جداً للطلاب)',
  deadline_date = '2026-09-10',
  is_accredited_in_home_country = true
where nationality = 'Saudi'
  and institution_id = '00000000-0000-4000-8000-000000000012';
