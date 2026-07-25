/**
 * External admissions portals, application systems, and university directories.
 * Name / Website / Type / Region / Details — launch gateways only (not scraped copies).
 */

export const ADMISSION_PORTALS = [
  {
    id: 'appily',
    name: 'Appily',
    nameAr: 'Appily',
    website: 'https://www.appily.com/',
    type: 'Directory',
    typeAr: 'دليل بحث',
    region: 'United States',
    regionAr: 'الولايات المتحدة',
    regions: ['americas'],
    details:
      'Comprehensive search engine with financial aid and admission chance estimators.',
    detailsAr:
      'محرك بحث شامل للكليات الأمريكية مع تقديرات المساعدات المالية وفرص القبول.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'applyalberta',
    name: 'ApplyAlberta',
    nameAr: 'ApplyAlberta',
    website: 'https://www.applyalberta.ca/',
    type: 'Application System',
    typeAr: 'نظام تقديم',
    region: 'Canada (Alberta)',
    regionAr: 'كندا (ألبرتا)',
    regions: ['americas'],
    details:
      'Centralized application hub for post-secondary institutions in Alberta.',
    detailsAr: 'بوابة تقديم مركزية لمؤسسات التعليم ما بعد الثانوي في ألبرتا.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'applytexas',
    name: 'ApplyTexas',
    nameAr: 'ApplyTexas',
    website: 'https://www.applytexas.org/',
    type: 'University System',
    typeAr: 'نظام جامعي',
    region: 'United States (Texas)',
    regionAr: 'الولايات المتحدة (تكساس)',
    regions: ['americas'],
    details:
      'Centralized application engine for the vast majority of higher education in Texas.',
    detailsAr: 'محرك تقديم مركزي لمعظم مؤسسات التعليم العالي في تكساس.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'bigfuture',
    name: 'BigFuture College Board',
    nameAr: 'BigFuture — College Board',
    website: 'https://bigfuture.collegeboard.org/',
    type: 'Directory',
    typeAr: 'دليل بحث',
    region: 'United States',
    regionAr: 'الولايات المتحدة',
    regions: ['americas'],
    details:
      'Official College Board tool for matching, tracking and exploring US universities.',
    detailsAr:
      'أداة College Board الرسمية لمطابقة وتتبع واستكشاف الجامعات الأمريكية.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'coalition',
    name: 'Coalition for College',
    nameAr: 'Coalition for College',
    website: 'https://www.coalitionforcollegeaccess.org/',
    type: 'Portal',
    typeAr: 'بوابة تقديم',
    region: 'United States',
    regionAr: 'الولايات المتحدة',
    regions: ['americas'],
    details:
      'A streamlined alternative platform focused on diverse and affordable institutions.',
    detailsAr: 'منصة بديلة مبسطة تركز على مؤسسات متنوعة وبأسعار ميسورة.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'common-app',
    name: 'Common App',
    nameAr: 'Common App',
    website: 'https://www.commonapp.org/',
    type: 'Portal',
    typeAr: 'بوابة تقديم',
    region: 'Global / US',
    regionAr: 'عالمي / الولايات المتحدة',
    regions: ['americas', 'global'],
    details: 'Centralized application portal for over 1100 institutions.',
    detailsAr: 'بوابة تقديم موحّدة لأكثر من 1100 مؤسسة.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'hochschulstart',
    name: 'Hochschulstart',
    nameAr: 'Hochschulstart',
    website: 'https://www.hochschulstart.de/',
    type: 'Application System',
    typeAr: 'نظام تقديم',
    region: 'Germany',
    regionAr: 'ألمانيا',
    regions: ['europe'],
    details:
      'Coordinates applications for nationwide restricted university programs in Germany.',
    detailsAr: 'ينسّق التقديم للبرامج الجامعية المقيدة على المستوى الوطني في ألمانيا.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'ouac',
    name: 'OUAC',
    nameAr: 'OUAC',
    website: 'https://www.ouac.on.ca/',
    type: 'Application System',
    typeAr: 'نظام تقديم',
    region: 'Canada (Ontario)',
    regionAr: 'كندا (أونتاريو)',
    regions: ['americas'],
    details: 'Centralized application service for all public universities in Ontario.',
    detailsAr: 'خدمة تقديم مركزية لجميع الجامعات العامة في أونتاريو.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'parcoursup',
    name: 'Parcoursup',
    nameAr: 'Parcoursup',
    website: 'https://www.parcoursup.gouv.fr/',
    type: 'Application System',
    typeAr: 'نظام تقديم',
    region: 'France',
    regionAr: 'فرنسا',
    regions: ['europe'],
    details:
      'Official national platform to register for first year higher education in France.',
    detailsAr: 'المنصة الوطنية الرسمية للتسجيل في السنة الأولى من التعليم العالي في فرنسا.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'studielink',
    name: 'Studielink',
    nameAr: 'Studielink',
    website: 'https://www.studielink.nl/',
    type: 'Application System',
    typeAr: 'نظام تقديم',
    region: 'Netherlands',
    regionAr: 'هولندا',
    regions: ['europe'],
    details:
      'Official national enrollment portal for Dutch higher education institutions.',
    detailsAr: 'بوابة التسجيل الوطنية الرسمية لمؤسسات التعليم العالي الهولندية.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'top-universities',
    name: 'Top Universities',
    nameAr: 'Top Universities (QS)',
    website: 'https://www.topuniversities.com/',
    type: 'Directory',
    typeAr: 'دليل وتصنيف',
    region: 'Global',
    regionAr: 'عالمي',
    regions: ['global', 'americas', 'europe', 'asia', 'mena', 'africa', 'oceania'],
    details: 'QS rankings directory with direct links to top global universities.',
    detailsAr: 'دليل تصنيفات QS مع روابط مباشرة لأبرز الجامعات العالمية.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'uac',
    name: 'UAC',
    nameAr: 'UAC',
    website: 'https://www.uac.edu.au/',
    type: 'Application System',
    typeAr: 'نظام تقديم',
    region: 'Australia (NSW & ACT)',
    regionAr: 'أستراليا (NSW وACT)',
    regions: ['oceania'],
    details:
      'Processes applications for institutions in New South Wales and the Australian Capital Territory.',
    detailsAr: 'يعالج طلبات القبول لمؤسسات نيو ساوث ويلز وإقليم العاصمة الأسترالية.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'ucas',
    name: 'UCAS',
    nameAr: 'UCAS',
    website: 'https://www.ucas.com/',
    type: 'Application System',
    typeAr: 'نظام تقديم',
    region: 'United Kingdom',
    regionAr: 'المملكة المتحدة',
    regions: ['europe'],
    details: 'The mandatory centralized admissions system for all UK university courses.',
    detailsAr: 'نظام القبول المركزي الإلزامي لجميع المقررات الجامعية في المملكة المتحدة.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'uc-admissions',
    name: 'University of California Admissions',
    nameAr: 'قبول جامعة كاليفورنيا',
    website: 'https://admission.universityofcalifornia.edu/',
    type: 'University System',
    typeAr: 'نظام جامعي',
    region: 'United States (California)',
    regionAr: 'الولايات المتحدة (كاليفورنيا)',
    regions: ['americas'],
    details: 'The dedicated portal for applying to all 9 UC undergraduate campuses.',
    detailsAr: 'البوابة المخصصة للتقديم إلى جميع فروع UC الجامعية التسعة.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'vtac',
    name: 'VTAC',
    nameAr: 'VTAC',
    website: 'https://www.vtac.edu.au/',
    type: 'Application System',
    typeAr: 'نظام تقديم',
    region: 'Australia (Victoria)',
    regionAr: 'أستراليا (فيكتوريا)',
    regions: ['oceania'],
    details: 'Centralized admissions center for universities in Victoria.',
    detailsAr: 'مركز قبول مركزي لجامعات ولاية فيكتوريا.',
    bestFor: ['local', 'international'],
  },
  {
    id: 'whed',
    name: 'World Higher Education Database',
    nameAr: 'قاعدة WHED العالمية',
    website: 'https://www.whed.net/',
    type: 'Directory',
    typeAr: 'دليل مؤسسات',
    region: 'Global',
    regionAr: 'عالمي',
    regions: ['global', 'americas', 'europe', 'asia', 'mena', 'africa', 'oceania'],
    details:
      'IAU/UNESCO official list of higher education systems and accredited institutions.',
    detailsAr: 'القائمة الرسمية لـ IAU/UNESCO لأنظمة التعليم العالي والمؤسسات المعتمدة.',
    bestFor: ['local', 'international'],
  },
];

/** Map study-country Arabic names to the most relevant portals. */
const COUNTRY_PORTAL_IDS = {
  'الولايات المتحدة': [
    'common-app',
    'coalition',
    'bigfuture',
    'appily',
    'applytexas',
    'uc-admissions',
    'whed',
    'top-universities',
  ],
  'كندا': ['ouac', 'applyalberta', 'common-app', 'whed', 'top-universities'],
  'المملكة المتحدة': ['ucas', 'whed', 'top-universities'],
  'ألمانيا': ['hochschulstart', 'whed', 'top-universities'],
  'فرنسا': ['parcoursup', 'whed', 'top-universities'],
  'هولندا': ['studielink', 'whed', 'top-universities'],
  'أستراليا': ['uac', 'vtac', 'whed', 'top-universities'],
};

export function portalsForRegion(regionId) {
  if (!regionId) return ADMISSION_PORTALS;
  return ADMISSION_PORTALS.filter(
    (p) => p.regions.includes('global') || p.regions.includes(regionId),
  );
}

export function portalsForCountry(countryName) {
  const ids = COUNTRY_PORTAL_IDS[countryName];
  if (!ids) return null;
  const map = new Map(ADMISSION_PORTALS.map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

export function portalsForCoverage(coverageHint) {
  if (!coverageHint) return ADMISSION_PORTALS;
  const key = coverageHint.toLowerCase();
  return ADMISSION_PORTALS.filter(
    (p) =>
      p.region.toLowerCase().includes(key) ||
      p.regionAr.includes(coverageHint) ||
      p.regions.includes('global'),
  );
}
