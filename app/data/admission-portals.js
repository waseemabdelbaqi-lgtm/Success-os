/**
 * University / training portals production layer.
 * Source: university_portals_production.json
 * Schema: Name | Website | Type | Scope | Details
 */

import productionPortals from './university_portals_production.json';

const TYPE_AR = {
  'Training Center & Certifications': 'مركز تدريب وشهادات',
  'University & College Search': 'بحث جامعات وكليات',
  'Centralized Admission Portal': 'بوابة قبول مركزية',
  'Global College Marketplace': 'سوق كليات عالمي',
  'Online Degree University': 'جامعة درجات أونلاين',
  'Training Center & MOOC': 'مركز تدريب وMOOC',
  'University Search Directory': 'دليل بحث جامعات',
  'Online Degree Portal': 'بوابة درجات أونلاين',
  'Online Degree & Professional Training': 'درجات وتدريب مهني أونلاين',
  'Online Degree & MOOC Aggregator': 'مجمّع درجات وMOOC أونلاين',
  'Technical Training Center': 'مركز تدريب تقني',
  'Training Center & College Prep': 'تدريب وتحضير جامعي',
  'Professional Training Center': 'مركز تدريب مهني',
  'Creative Training Center': 'مركز تدريب إبداعي',
  'Community College Directory': 'دليل كليات مجتمعية',
  'Accreditation Directory': 'دليل اعتماد أكاديمي',
};

const SCOPE_AR = {
  Global: 'عالمي',
  International: 'دولي',
  'United States': 'الولايات المتحدة',
  'United States / Global': 'الولايات المتحدة / عالمي',
  'Canada (Alberta)': 'كندا (ألبرتا)',
  'United States (Texas)': 'الولايات المتحدة (تكساس)',
  'United States (California)': 'الولايات المتحدة (كاليفورنيا)',
  'Global / US': 'عالمي / الولايات المتحدة',
  'Global / UK': 'عالمي / المملكة المتحدة',
  Germany: 'ألمانيا',
  'Canada (Ontario)': 'كندا (أونتاريو)',
  'Canada (Quebec)': 'كندا (كيبيك)',
  France: 'فرنسا',
  Netherlands: 'هولندا',
  'Australia (NSW & ACT)': 'أستراليا (NSW وACT)',
  'Australia (Victoria)': 'أستراليا (فيكتوريا)',
  'Australia (Queensland)': 'أستراليا (كوينزلاند)',
  'Australia (SA & NT)': 'أستراليا (SA وNT)',
  'Australia (WA)': 'أستراليا (WA)',
  'United Kingdom': 'المملكة المتحدة',
  China: 'الصين',
  'Saudi Arabia': 'السعودية',
  India: 'الهند',
  Japan: 'اليابان',
};

function scopeBuckets(scope) {
  const s = (scope || '').toLowerCase();
  if (s.includes('international') || s === 'global') {
    return ['global', 'americas', 'europe', 'asia', 'mena', 'africa', 'oceania'];
  }
  if (s.includes('united states') || s.includes('/ us')) return ['americas', 'global'];
  if (s.includes('canada')) return ['americas'];
  if (s.includes('united kingdom') || s.includes('/ uk') || s.includes('germany') || s.includes('france') || s.includes('netherlands')) {
    return ['europe', 'global'];
  }
  if (s.includes('australia')) return ['oceania'];
  if (s.includes('china') || s.includes('india') || s.includes('japan')) return ['asia'];
  if (s.includes('saudi')) return ['mena'];
  return ['global'];
}

function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Normalize raw rows (support Scope or legacy Region). */
function normalizeRow(row) {
  const Scope = row.Scope || row.Region || 'Global';
  return {
    Name: row.Name,
    Website: row.Website,
    Type: row.Type,
    Scope,
    Region: Scope, // backward-compatible alias
    Details: row.Details,
  };
}

export const ADMISSION_PORTALS_V4 = productionPortals.map(normalizeRow);

export const ADMISSION_PORTALS = ADMISSION_PORTALS_V4.map((row) => ({
  id: slug(row.Name),
  name: row.Name,
  nameAr: row.Name,
  website: row.Website,
  type: row.Type,
  typeAr: TYPE_AR[row.Type] || row.Type,
  scope: row.Scope,
  scopeAr: SCOPE_AR[row.Scope] || row.Scope,
  region: row.Scope,
  regionAr: SCOPE_AR[row.Scope] || row.Scope,
  regions: scopeBuckets(row.Scope),
  details: row.Details,
  detailsAr: row.Details,
  bestFor: ['local', 'international'],
  Name: row.Name,
  Website: row.Website,
  Type: row.Type,
  Scope: row.Scope,
  Region: row.Scope,
  Details: row.Details,
}));

const COUNTRY_PORTAL_IDS = {
  'الولايات المتحدة': [
    'common-app',
    'caas-coalition-for-college',
    'bigfuture-college-board',
    'appily',
    'applytexas',
    'cal-state-apply',
    'university-of-california-admissions',
    'arizona-state-university-online',
    'southern-new-hampshire-university',
    'aacc-community-college-directory',
    'careeronestop-cc-finder',
    'college-navigator',
    'chea-directory',
    'dapip-us-department-of-education',
    'applyboard',
    'bachelorsportal',
    'top-universities',
    'world-higher-education-database',
  ],
  'كندا': [
    'ouac',
    'applyalberta',
    'sram',
    'applyboard',
    'bachelorsportal',
    'world-higher-education-database',
    'top-universities',
  ],
  'المملكة المتحدة': [
    'ucas',
    'open-university-uk',
    'futurelearn',
    'bachelorsportal',
    'mastersportal',
    'top-universities',
    'world-higher-education-database',
  ],
  'ألمانيا': ['hochschulstart', 'bachelorsportal', 'top-universities', 'world-higher-education-database'],
  'فرنسا': ['parcoursup', 'bachelorsportal', 'top-universities', 'world-higher-education-database'],
  'هولندا': ['studielink', 'bachelorsportal', 'top-universities', 'world-higher-education-database'],
  'أستراليا': [
    'uac',
    'vtac',
    'qtac',
    'satac',
    'tisc',
    'applyboard',
    'bachelorsportal',
    'top-universities',
    'world-higher-education-database',
  ],
  'الصين': ['caokao-hub-chinaschools', 'applyboard', 'top-universities', 'world-higher-education-database'],
  'السعودية': ['saddem-portal', 'applyboard', 'top-universities', 'world-higher-education-database'],
  'الهند': ['study-in-india-portal', 'applyboard', 'top-universities', 'world-higher-education-database'],
  'اليابان': ['study-in-japan-portal', 'applyboard', 'top-universities', 'world-higher-education-database'],
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
      p.scope.toLowerCase().includes(key) ||
      p.scopeAr.includes(coverageHint) ||
      p.regions.includes('global'),
  );
}

export function portalsByType(typeHint) {
  if (!typeHint) return ADMISSION_PORTALS;
  const key = typeHint.toLowerCase();
  return ADMISSION_PORTALS.filter((p) => p.type.toLowerCase().includes(key));
}

export function iterateAdmissionPortals(onRow) {
  ADMISSION_PORTALS_V4.forEach((row, index) => onRow(row, index));
  return ADMISSION_PORTALS_V4.length;
}

export function getPortalsApiPayload() {
  return [...ADMISSION_PORTALS_V4]
    .map(({ Name, Website, Type, Scope, Details }) => ({
      Name,
      Website,
      Type,
      Scope,
      Details,
    }))
    .sort((a, b) => a.Name.localeCompare(b.Name, 'en'));
}
