/**
 * External admissions portals & university directories.
 * Used inside the admissions wizard and global sources.
 * These are launch/search gateways — not a full scraped copy of their databases.
 */

export const ADMISSION_PORTALS = [
  {
    id: 'common-app',
    name: 'Common App',
    nameAr: 'Common App',
    website: 'https://www.commonapp.org/',
    type: 'Portal',
    typeAr: 'بوابة تقديم',
    coverage: 'Global (1100+ schools)',
    coverageAr: 'عالمي — أكثر من 1100 مدرسة/جامعة',
    regions: ['americas', 'global'],
    bestFor: ['international', 'local'],
    blurbAr: 'بوابة تقديم موحّدة لأكثر من 1100 مؤسسة، أساسية للطالب الدولي والمحلي المتقدم لأمريكا وكندا وبعض الجامعات العالمية.',
    blurbEn: 'Unified application portal for 1100+ institutions — core for US and many global applicants.',
  },
  {
    id: 'bigfuture',
    name: 'BigFuture College Board',
    nameAr: 'BigFuture — College Board',
    website: 'https://bigfuture.collegeboard.org/',
    type: 'Directory',
    typeAr: 'دليل بحث',
    coverage: 'United States',
    coverageAr: 'الولايات المتحدة',
    regions: ['americas'],
    bestFor: ['local', 'international'],
    blurbAr: 'دليل كليات أمريكية من College Board مع بحث التخصصات والتكلفة والمنح ومسارات SAT/AP.',
    blurbEn: 'College Board US college directory with majors, cost, scholarships, and SAT/AP pathways.',
  },
  {
    id: 'appily',
    name: 'Appily',
    nameAr: 'Appily',
    website: 'https://www.appily.com/',
    type: 'Directory',
    typeAr: 'دليل بحث',
    coverage: 'United States',
    coverageAr: 'الولايات المتحدة',
    regions: ['americas'],
    bestFor: ['local', 'international'],
    blurbAr: 'دليل كليات أمريكية مع مطابقة اهتمامات الطالب وبرامج القبول.',
    blurbEn: 'US college directory with interest matching and admissions program discovery.',
  },
  {
    id: 'whed',
    name: 'World Higher Education Database',
    nameAr: 'قاعدة WHED العالمية',
    website: 'https://www.whed.net/',
    type: 'Directory',
    typeAr: 'دليل مؤسسات',
    coverage: 'Global',
    coverageAr: 'عالمي',
    regions: ['global', 'americas', 'europe', 'asia', 'mena', 'africa', 'oceania'],
    bestFor: ['local', 'international'],
    blurbAr: 'مرجع IAU/UNESCO للمؤسسات المعترف بها عالمياً — للتحقق من وجود الجامعة قبل التقديم.',
    blurbEn: 'IAU/UNESCO reference of recognized higher-education institutions worldwide.',
  },
  {
    id: 'top-universities',
    name: 'Top Universities',
    nameAr: 'Top Universities (QS)',
    website: 'https://www.topuniversities.com/',
    type: 'Directory',
    typeAr: 'دليل وتصنيف',
    coverage: 'Global',
    coverageAr: 'عالمي',
    regions: ['global', 'americas', 'europe', 'asia', 'mena', 'africa', 'oceania'],
    bestFor: ['local', 'international'],
    blurbAr: 'دليل جامعات عالمي مع صفحات البرامج والتصنيفات — استخدمه للاستكشاف ثم تحقق من صفحة القبول الرسمية.',
    blurbEn: 'Global university directory and rankings — explore programs, then verify on the official admissions page.',
  },
];

export function portalsForRegion(regionId) {
  if (!regionId) return ADMISSION_PORTALS;
  return ADMISSION_PORTALS.filter(
    (p) => p.regions.includes('global') || p.regions.includes(regionId),
  );
}

export function portalsForCoverage(coverageHint) {
  if (!coverageHint) return ADMISSION_PORTALS;
  const key = coverageHint.toLowerCase();
  return ADMISSION_PORTALS.filter(
    (p) =>
      p.coverage.toLowerCase().includes(key) ||
      p.coverageAr.includes(coverageHint) ||
      p.regions.includes('global'),
  );
}
