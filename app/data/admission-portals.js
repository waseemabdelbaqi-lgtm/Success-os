/**
 * University portals production layer.
 * Source of truth: university_portals_production.json (+ .sql schema)
 * Schema: Name | Website | Type | Region | Details (A–Z ordered)
 */

import productionPortals from './university_portals_production.json';

const TYPE_AR = {
  'Search & Directory': 'بحث ودليل',
  'Centralized Application System': 'نظام تقديم مركزي',
  'State University System': 'نظام جامعات ولاية',
  'Application Portal': 'بوابة تقديم',
  'Informational Hub': 'مركز معلومات',
  'Official Directory & Hub': 'دليل ومركز رسمي',
  'Rankings & Directory': 'تصنيفات ودليل',
  'Official Directory': 'دليل رسمي',
  Directory: 'دليل مؤسسات',
  Portal: 'بوابة تقديم',
};

const REGION_AR = {
  'United States': 'الولايات المتحدة',
  'Canada (Alberta)': 'كندا (ألبرتا)',
  'United States (Texas)': 'الولايات المتحدة (تكساس)',
  'United States (California)': 'الولايات المتحدة (كاليفورنيا)',
  'Global / US': 'عالمي / الولايات المتحدة',
  Germany: 'ألمانيا',
  'Canada (Ontario)': 'كندا (أونتاريو)',
  'Canada (Quebec)': 'كندا (كيبيك)',
  France: 'فرنسا',
  Netherlands: 'هولندا',
  Global: 'عالمي',
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

const REGION_BUCKET = {
  'United States': ['americas'],
  'Canada (Alberta)': ['americas'],
  'United States (Texas)': ['americas'],
  'United States (California)': ['americas'],
  'Global / US': ['americas', 'global'],
  Germany: ['europe'],
  'Canada (Ontario)': ['americas'],
  'Canada (Quebec)': ['americas'],
  France: ['europe'],
  Netherlands: ['europe'],
  Global: ['global', 'americas', 'europe', 'asia', 'mena', 'africa', 'oceania'],
  'Australia (NSW & ACT)': ['oceania'],
  'Australia (Victoria)': ['oceania'],
  'Australia (Queensland)': ['oceania'],
  'Australia (SA & NT)': ['oceania'],
  'Australia (WA)': ['oceania'],
  'United Kingdom': ['europe'],
  China: ['asia'],
  'Saudi Arabia': ['mena'],
  India: ['asia'],
  Japan: ['asia'],
};

/** Raw production records (FastAPI / SQL compatible shape). */
export const ADMISSION_PORTALS_V4 = productionPortals;

function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** App-facing records for wizard + global sources. */
export const ADMISSION_PORTALS = productionPortals.map((row) => ({
  id: slug(row.Name),
  name: row.Name,
  nameAr: row.Name,
  website: row.Website,
  type: row.Type,
  typeAr: TYPE_AR[row.Type] || row.Type,
  region: row.Region,
  regionAr: REGION_AR[row.Region] || row.Region,
  regions: REGION_BUCKET[row.Region] || ['global'],
  details: row.Details,
  detailsAr: row.Details,
  bestFor: ['local', 'international'],
  Name: row.Name,
  Website: row.Website,
  Type: row.Type,
  Region: row.Region,
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
    'world-higher-education-database',
    'top-universities',
  ],
  'كندا': [
    'ouac',
    'applyalberta',
    'sram',
    'common-app',
    'world-higher-education-database',
    'top-universities',
  ],
  'المملكة المتحدة': ['ucas', 'world-higher-education-database', 'top-universities'],
  'ألمانيا': ['hochschulstart', 'world-higher-education-database', 'top-universities'],
  'فرنسا': ['parcoursup', 'world-higher-education-database', 'top-universities'],
  'هولندا': ['studielink', 'world-higher-education-database', 'top-universities'],
  'أستراليا': [
    'uac',
    'vtac',
    'qtac',
    'satac',
    'tisc',
    'world-higher-education-database',
    'top-universities',
  ],
  'الصين': [
    'caokao-hub-chinaschools',
    'world-higher-education-database',
    'top-universities',
  ],
  'السعودية': [
    'saddem-portal',
    'world-higher-education-database',
    'top-universities',
  ],
  'الهند': [
    'study-in-india-portal',
    'world-higher-education-database',
    'top-universities',
  ],
  'اليابان': [
    'study-in-japan-portal',
    'world-higher-education-database',
    'top-universities',
  ],
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

/** Cursor-style iterative processor (pandas / fast-csv equivalent). */
export function iterateAdmissionPortals(onRow) {
  productionPortals.forEach((row, index) => onRow(row, index));
  return productionPortals.length;
}

/** API response shape: [{ Name, Website, Type, Region, Details }] A–Z. */
export function getPortalsApiPayload() {
  return [...productionPortals].sort((a, b) => a.Name.localeCompare(b.Name, 'en'));
}
