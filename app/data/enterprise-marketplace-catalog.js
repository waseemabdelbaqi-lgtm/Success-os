/**
 * SUCCESS OS — Global Marketplace, Booking & Commerce catalog.
 * Configurable from Owner Dashboard; reuses ERP identities and payment/commission engines.
 */

export const MARKET_LISTING_TYPES = Object.freeze([
  { key: 'teacher', label: 'Teachers', labelAr: 'معلمون' },
  { key: 'educational_center', label: 'Educational Centers', labelAr: 'مراكز تعليمية' },
  { key: 'school', label: 'Schools', labelAr: 'مدارس' },
  { key: 'university', label: 'Universities', labelAr: 'جامعات' },
  { key: 'college', label: 'Colleges', labelAr: 'كليات' },
  { key: 'employer', label: 'Employers', labelAr: 'جهات عمل' },
  { key: 'recruitment_company', label: 'Recruitment Companies', labelAr: 'شركات توظيف' },
  { key: 'course', label: 'Courses', labelAr: 'دورات' },
  { key: 'recorded_lesson', label: 'Recorded Lessons', labelAr: 'دروس مسجّلة' },
  { key: 'live_class', label: 'Live Classes', labelAr: 'حصص مباشرة' },
  { key: 'book', label: 'Books', labelAr: 'كتب' },
  { key: 'question_bank', label: 'Question Banks', labelAr: 'بنوك أسئلة' },
  { key: 'exam', label: 'Exams', labelAr: 'امتحانات' },
  { key: 'scholarship', label: 'Scholarships', labelAr: 'منح' },
  { key: 'study_abroad', label: 'Study Abroad Services', labelAr: 'دراسة بالخارج' },
  { key: 'educational_consultant', label: 'Educational Consultants', labelAr: 'مستشارون تعليميون' },
  { key: 'career_consultant', label: 'Career Consultants', labelAr: 'مستشارون مهنيون' },
  { key: 'ai_service', label: 'AI Services', labelAr: 'خدمات ذكاء اصطناعي' },
  { key: 'future_service', label: 'Future Services', labelAr: 'خدمات مستقبلية' },
]);

export const MARKET_BOOKING_TYPES = Object.freeze([
  'private_lesson',
  'group_class',
  'recorded_course',
  'meeting',
  'consultation',
  'admission',
  'career_session',
  'interview',
  'school_visit',
  'university_appointment',
  'support_appointment',
  'online_service',
  'physical_service',
]);

export const MARKET_ORDER_STATUSES = Object.freeze([
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'refund_requested',
  'refunded',
]);

export const MARKET_DELIVERY_MODES = Object.freeze(['online', 'offline', 'hybrid']);

export const MARKET_SUBSCRIPTION_PLANS = Object.freeze([
  { key: 'monthly', label: 'Monthly', months: 1 },
  { key: 'quarterly', label: 'Quarterly', months: 3 },
  { key: 'yearly', label: 'Yearly', months: 12 },
  { key: 'lifetime', label: 'Lifetime', months: 0 },
  { key: 'family', label: 'Family Plans', months: 12 },
  { key: 'school', label: 'School Plans', months: 12 },
  { key: 'university', label: 'University Plans', months: 12 },
  { key: 'corporate', label: 'Corporate Plans', months: 12 },
]);

export const MARKET_SEARCH_FILTERS = Object.freeze([
  'country',
  'city',
  'language',
  'educationalSystem',
  'curriculum',
  'grade',
  'subject',
  'universityMajor',
  'teacher',
  'priceMin',
  'priceMax',
  'ratingMin',
  'availability',
  'deliveryMode',
  'experienceMin',
  'certification',
  'gender',
  'online',
  'offline',
  'hybrid',
  'listingType',
  'q',
]);

export const MARKET_DEFAULT_CONFIG = Object.freeze({
  defaultCurrency: 'USD',
  taxRatePercent: 5,
  maxDailyBookingsDefault: 8,
  loyaltyPointsPerCurrency: 1,
  affiliateCommissionPercent: 5,
  referralBonusPoints: 50,
  fraudScoreThreshold: 80,
  requireVerifiedProviders: true,
  realtimeEnabled: true,
  updatedAt: null,
  updatedBy: 'system',
});

export const MARKET_SEED_COUPONS = Object.freeze([
  { code: 'WELCOME10', type: 'percent', value: 10, status: 'active', maxUses: 1000 },
  { code: 'SAVE20', type: 'percent', value: 20, status: 'active', maxUses: 200 },
  { code: 'FLAT5', type: 'fixed', value: 5, status: 'active', maxUses: 500 },
]);

export const MARKET_SEED_GIFT_CARDS = Object.freeze([
  { code: 'GIFT50', balance: 50, currency: 'USD', status: 'active' },
  { code: 'GIFT100', balance: 100, currency: 'USD', status: 'active' },
]);

/** Seed listings bootstrapped from ERP entities where possible. */
export const MARKET_SEED_LISTINGS = Object.freeze([
  {
    key: 'listing_math_tutor',
    title: 'Private Math Tutoring',
    titleAr: 'دروس خصوصية رياضيات',
    listingType: 'teacher',
    bookingType: 'private_lesson',
    providerRole: 'teacher',
    price: 25,
    currency: 'USD',
    country: 'Jordan',
    city: 'Amman',
    language: 'ar',
    subject: 'Mathematics',
    grade: '10',
    deliveryMode: 'hybrid',
    rating: 4.8,
    experienceYears: 7,
    certification: true,
    verified: true,
  },
  {
    key: 'listing_live_english',
    title: 'Live English Group Class',
    titleAr: 'حصة إنجليزية مباشرة جماعية',
    listingType: 'live_class',
    bookingType: 'group_class',
    providerRole: 'educational_center',
    price: 15,
    currency: 'USD',
    country: 'UAE',
    city: 'Dubai',
    language: 'en',
    subject: 'English',
    deliveryMode: 'online',
    rating: 4.6,
    experienceYears: 5,
    certification: true,
    verified: true,
  },
  {
    key: 'listing_career_consult',
    title: 'Career Consultation Session',
    titleAr: 'جلسة استشارة مهنية',
    listingType: 'career_consultant',
    bookingType: 'career_session',
    providerRole: 'employer',
    price: 40,
    currency: 'USD',
    country: 'Saudi Arabia',
    city: 'Riyadh',
    language: 'ar',
    deliveryMode: 'online',
    rating: 4.5,
    experienceYears: 10,
    certification: true,
    verified: true,
  },
  {
    key: 'listing_ai_curriculum',
    title: 'AI Curriculum Generation Pack',
    titleAr: 'حزمة توليد منهج بالذكاء الاصطناعي',
    listingType: 'ai_service',
    bookingType: 'online_service',
    providerRole: 'admin',
    price: 99,
    currency: 'USD',
    country: 'Jordan',
    city: 'Amman',
    language: 'ar',
    deliveryMode: 'online',
    rating: 4.9,
    experienceYears: 3,
    certification: true,
    verified: true,
  },
]);
