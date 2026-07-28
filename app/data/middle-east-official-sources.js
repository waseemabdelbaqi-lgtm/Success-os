/**
 * Middle East official curriculum sources — Phase 15.1 priority list.
 * Research / verification only. Never copy copyrighted textbooks.
 */

export const GLOBAL_OFFICIAL_SOURCES = [
  {
    name: 'UNESCO IBE Curriculum Database',
    url: 'https://www.ibe.unesco.org/',
    type: 'intergovernmental-curriculum',
    priority: 'highest',
  },
  {
    name: 'UNESCO Open Educational Resources',
    url: 'https://www.unesco.org/en/open-educational-resources',
    type: 'oer',
    priority: 'high',
  },
  {
    name: 'OER Commons',
    url: 'https://www.oercommons.org/',
    type: 'oer',
    priority: 'high',
  },
  {
    name: 'OpenStax',
    url: 'https://openstax.org',
    type: 'oer',
    priority: 'high',
  },
  {
    name: 'CK-12',
    url: 'https://www.ck12.org',
    type: 'oer',
    priority: 'high',
  },
  {
    name: 'PhET Interactive Simulations',
    url: 'https://phet.colorado.edu',
    type: 'oer-simulation',
    priority: 'high',
  },
  {
    name: 'LibreTexts',
    url: 'https://libretexts.org',
    type: 'oer',
    priority: 'high',
  },
  {
    name: 'MIT OpenCourseWare',
    url: 'https://ocw.mit.edu',
    type: 'oer-higher-ed',
    priority: 'medium',
  },
  {
    name: 'Khan Academy',
    url: 'https://www.khanacademy.org',
    type: 'explanations-only-never-copy',
    priority: 'medium',
    usage: 'explanations-only-never-copy',
  },
  {
    name: 'College Board (AP)',
    url: 'https://apstudents.collegeboard.org/courses',
    type: 'international-curriculum-authority',
    priority: 'highest-for-international',
  },
  {
    name: 'ACT',
    url: 'https://www.act.org/',
    type: 'international-assessment',
    priority: 'highest-for-international',
  },
  {
    name: 'International Baccalaureate (IB)',
    url: 'https://www.ibo.org/programmes/',
    type: 'international-curriculum-authority',
    priority: 'highest-for-international',
  },
  {
    name: 'Cambridge International',
    url: 'https://www.cambridgeinternational.org/programmes-and-qualifications/',
    type: 'international-curriculum-authority',
    priority: 'highest-for-international',
  },
  {
    name: 'Pearson / Edexcel',
    url: 'https://qualifications.pearson.com',
    type: 'international-curriculum-authority',
    priority: 'highest-for-international',
    note: 'Use only where openly available specifications allow reference',
  },
];

/** Country-priority official portals (Ministries + digital curriculum platforms). */
export const MIDDLE_EAST_OFFICIAL_SOURCES = {
  JO: [
    {
      name: 'Ministry of Education — Jordan',
      url: 'https://moe.gov.jo/',
      type: 'ministry',
    },
    {
      name: 'National Center for Curriculum Development (NCCD)',
      url: 'https://nccd.gov.jo/Ar/Pages/textbooks',
      type: 'national-curriculum',
    },
    {
      name: 'NCCD textbooks (www)',
      url: 'https://www.nccd.gov.jo/Ar/Pages/textbooks',
      type: 'national-curriculum',
    },
    {
      name: 'Minhaji — Jordan grade/subject structure index',
      url: 'https://minhaji.net/',
      type: 'structure-index-companion',
      usage: 'grade-subject-title-index-never-copy-prose',
    },
    {
      name: 'JoAcademy courses (delivery companion)',
      url: 'https://www.joacademy.com/user/courses',
      type: 'market-delivery-companion',
      usage: 'program-taxonomy-never-copy',
    },
    {
      name: 'Darsak Platform',
      url: 'https://darsak.gov.jo/',
      type: 'digital-learning-platform',
    },
    {
      name: 'Jordan official teacher / curriculum guides (via NCCD)',
      url: 'https://www.nccd.gov.jo/',
      type: 'teacher-guides',
    },
  ],
  SA: [
    {
      name: 'Ministry of Education — Saudi Arabia',
      url: 'https://www.moe.gov.sa/',
      type: 'ministry',
    },
    {
      name: 'Madrasati',
      url: 'https://www.madrasati.sa/',
      type: 'digital-platform',
    },
    {
      name: 'iEN National Education Portal',
      url: 'https://ien.edu.sa/',
      type: 'digital-content',
    },
    {
      name: 'Official Electronic Curricula (Saudi)',
      url: 'https://www.moe.gov.sa/',
      type: 'electronic-curricula',
    },
  ],
  AE: [
    {
      name: 'Ministry of Education — UAE',
      url: 'https://www.moe.gov.ae/',
      type: 'ministry',
    },
    {
      name: 'UAE National Curriculum Resources',
      url: 'https://www.moe.gov.ae/',
      type: 'national-curriculum',
    },
  ],
  QA: [
    {
      name: 'Ministry of Education and Higher Education — Qatar',
      url: 'https://www.edu.gov.qa/',
      type: 'ministry',
    },
  ],
  BH: [
    {
      name: 'Ministry of Education — Bahrain',
      url: 'https://www.moe.gov.bh/',
      type: 'ministry',
    },
  ],
  KW: [
    {
      name: 'Ministry of Education — Kuwait',
      url: 'https://moe.edu.kw/',
      type: 'ministry',
    },
  ],
  OM: [
    {
      name: 'Ministry of Education — Oman',
      url: 'https://moe.gov.om/',
      type: 'ministry',
    },
  ],
  EG: [
    {
      name: 'Ministry of Education and Technical Education — Egypt',
      url: 'https://moe.gov.eg/',
      type: 'ministry',
    },
    {
      name: 'Egypt official curriculum frameworks',
      url: 'https://moe.gov.eg/',
      type: 'curriculum-framework',
    },
  ],
  IQ: [
    {
      name: 'Ministry of Education — Iraq',
      url: 'https://moedu.gov.iq/',
      type: 'ministry',
    },
  ],
  SY: [
    {
      name: 'Ministry of Education — Syria',
      url: 'https://moed.gov.sy/',
      type: 'ministry',
    },
  ],
  LB: [
    {
      name: 'Ministry of Education and Higher Education — Lebanon',
      url: 'https://www.mehe.gov.lb/',
      type: 'ministry',
    },
  ],
  PS: [
    {
      name: 'Ministry of Education — Palestine',
      url: 'https://www.moe.edu.ps/',
      type: 'ministry',
    },
  ],
  YE: [
    {
      name: 'Ministry of Education — Yemen',
      url: 'https://moe-ye.net/',
      type: 'ministry',
    },
  ],
};

export function officialSourcesForCountry(countryCode) {
  const code = String(countryCode || '').toUpperCase();
  return {
    country: MIDDLE_EAST_OFFICIAL_SOURCES[code] || [],
    global: GLOBAL_OFFICIAL_SOURCES,
  };
}
