/**
 * External admissions portals — sourced from university_admission_portals-v4.csv
 * Schema: Name | Website | Type | Region | Details
 * Re-parse: node scripts/parse-admission-portals.mjs
 */

const TYPE_AR = {
  'Search & Directory': 'بحث ودليل',
  'Centralized Application System': 'نظام تقديم مركزي',
  'University System': 'نظام جامعي',
  Portal: 'بوابة تقديم',
  Directory: 'دليل مؤسسات',
};

const REGION_AR = {
  'United States': 'الولايات المتحدة',
  'Canada (Alberta)': 'كندا (ألبرتا)',
  'United States (Texas)': 'الولايات المتحدة (تكساس)',
  'Global / US': 'عالمي / الولايات المتحدة',
  Germany: 'ألمانيا',
  'Canada (Ontario)': 'كندا (أونتاريو)',
  France: 'فرنسا',
  Netherlands: 'هولندا',
  Global: 'عالمي',
  'Australia (NSW & ACT)': 'أستراليا (NSW وACT)',
  'United Kingdom': 'المملكة المتحدة',
  'United States (California)': 'الولايات المتحدة (كاليفورنيا)',
  'Australia (Victoria)': 'أستراليا (فيكتوريا)',
};

const REGION_BUCKET = {
  'United States': ['americas'],
  'Canada (Alberta)': ['americas'],
  'United States (Texas)': ['americas'],
  'Global / US': ['americas', 'global'],
  Germany: ['europe'],
  'Canada (Ontario)': ['americas'],
  France: ['europe'],
  Netherlands: ['europe'],
  Global: ['global', 'americas', 'europe', 'asia', 'mena', 'africa', 'oceania'],
  'Australia (NSW & ACT)': ['oceania'],
  'United Kingdom': ['europe'],
  'United States (California)': ['americas'],
  'Australia (Victoria)': ['oceania'],
};

/** Canonical v4 records (mirrors CSV). */
export const ADMISSION_PORTALS_V4 = [
  {
    Name: 'Appily',
    Website: 'https://www.appily.com/',
    Type: 'Search & Directory',
    Region: 'United States',
    Details:
      'Comprehensive search engine with financial aid and admission chance estimators.',
  },
  {
    Name: 'ApplyAlberta',
    Website: 'https://applyalberta.ca/',
    Type: 'Centralized Application System',
    Region: 'Canada (Alberta)',
    Details: 'Centralized application hub for post-secondary institutions in Alberta.',
  },
  {
    Name: 'ApplyTexas',
    Website: 'https://www.applytexas.org/',
    Type: 'University System',
    Region: 'United States (Texas)',
    Details:
      'Centralized application engine for the vast majority of higher education in Texas.',
  },
  {
    Name: 'BigFuture College Board',
    Website: 'https://bigfuture.collegeboard.org/',
    Type: 'Search & Directory',
    Region: 'United States',
    Details:
      'Official College Board tool for matching, tracking and exploring US universities.',
  },
  {
    Name: 'Coalition for College',
    Website: 'https://www.coalitionforcollegeaccess.org/',
    Type: 'Portal',
    Region: 'United States',
    Details:
      'A streamlined alternative platform focused on diverse and affordable institutions.',
  },
  {
    Name: 'Common App',
    Website: 'https://www.commonapp.org/',
    Type: 'Portal',
    Region: 'Global / US',
    Details: 'Centralized application portal for over 1100 institutions.',
  },
  {
    Name: 'Hochschulstart',
    Website: 'https://www.hochschulstart.de/',
    Type: 'Centralized Application System',
    Region: 'Germany',
    Details:
      'Coordinates applications for nationwide restricted university programs in Germany.',
  },
  {
    Name: 'OUAC',
    Website: 'https://www.ouac.on.ca/',
    Type: 'Centralized Application System',
    Region: 'Canada (Ontario)',
    Details: 'Centralized application service for all public universities in Ontario.',
  },
  {
    Name: 'Parcoursup',
    Website: 'https://www.parcoursup.gouv.fr/',
    Type: 'Centralized Application System',
    Region: 'France',
    Details:
      'Official national platform to register for first year higher education in France.',
  },
  {
    Name: 'Studielink',
    Website: 'https://www.studielink.nl/',
    Type: 'Centralized Application System',
    Region: 'Netherlands',
    Details:
      'Official national enrollment portal for Dutch higher education institutions.',
  },
  {
    Name: 'Top Universities',
    Website: 'https://www.topuniversities.com/',
    Type: 'Search & Directory',
    Region: 'Global',
    Details: 'QS rankings directory with direct links to top global universities.',
  },
  {
    Name: 'UAC',
    Website: 'https://www.uac.edu.au/',
    Type: 'Centralized Application System',
    Region: 'Australia (NSW & ACT)',
    Details:
      'Processes applications for institutions in New South Wales and the Australian Capital Territory.',
  },
  {
    Name: 'UCAS',
    Website: 'https://www.ucas.com/',
    Type: 'Centralized Application System',
    Region: 'United Kingdom',
    Details: 'The mandatory centralized admissions system for all UK university courses.',
  },
  {
    Name: 'University of California Admissions',
    Website: 'https://admission.universityofcalifornia.edu/',
    Type: 'University System',
    Region: 'United States (California)',
    Details: 'The dedicated portal for applying to all 9 UC undergraduate campuses.',
  },
  {
    Name: 'VTAC',
    Website: 'https://www.vtac.edu.au/',
    Type: 'Centralized Application System',
    Region: 'Australia (Victoria)',
    Details: 'Centralized admissions center for universities in Victoria.',
  },
  {
    Name: 'World Higher Education Database',
    Website: 'https://www.whed.net/',
    Type: 'Directory',
    Region: 'Global',
    Details:
      'IAU/UNESCO official list of higher education systems and accredited institutions.',
  },
];

function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** App-facing records used by admissions wizard + global sources. */
export const ADMISSION_PORTALS = ADMISSION_PORTALS_V4.map((row) => ({
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
  // Preserve original CSV/JSON keys for tooling
  Name: row.Name,
  Website: row.Website,
  Type: row.Type,
  Region: row.Region,
  Details: row.Details,
}));

/** Map study-country Arabic names to the most relevant portals. */
const COUNTRY_PORTAL_IDS = {
  'الولايات المتحدة': [
    'common-app',
    'coalition-for-college',
    'bigfuture-college-board',
    'appily',
    'applytexas',
    'university-of-california-admissions',
    'world-higher-education-database',
    'top-universities',
  ],
  'كندا': [
    'ouac',
    'applyalberta',
    'common-app',
    'world-higher-education-database',
    'top-universities',
  ],
  'المملكة المتحدة': ['ucas', 'world-higher-education-database', 'top-universities'],
  'ألمانيا': ['hochschulstart', 'world-higher-education-database', 'top-universities'],
  'فرنسا': ['parcoursup', 'world-higher-education-database', 'top-universities'],
  'هولندا': ['studielink', 'world-higher-education-database', 'top-universities'],
  'أستراليا': ['uac', 'vtac', 'world-higher-education-database', 'top-universities'],
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

/** Cursor-style iterative processor (same shape as the pandas/fast-csv loops). */
export function iterateAdmissionPortals(onRow) {
  ADMISSION_PORTALS_V4.forEach((row, index) => {
    onRow(row, index);
  });
  return ADMISSION_PORTALS_V4.length;
}
