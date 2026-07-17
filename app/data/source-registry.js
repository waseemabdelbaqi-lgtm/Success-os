// Policy registry, not a content scraper. Each source still needs item-level license checks.
const group = (category, policy, names) => names.map(([name,url])=>({category,policy,name,url}));

export const sourceRegistry = [
  ...group('جامعات وتصنيفات','مرجع ومقارنة — لا تنسخ الجداول',[
    ['QS / Top Universities','https://www.topuniversities.com'],['Times Higher Education','https://www.timeshighereducation.com'],['U.S. News Education','https://www.usnews.com/education'],['ShanghaiRanking','https://www.shanghairanking.com'],['Studyportals','https://www.studyportals.com'],['Bachelorsportal','https://www.bachelorsportal.com'],['Mastersportal','https://www.mastersportal.com'],['PhDportal','https://www.phdportal.com'],['Distance Learning Portal','https://www.distancelearningportal.com'],['UCAS','https://www.ucas.com'],['Common App','https://www.commonapp.org']
  ]),
  ...group('مصادر تعليم مفتوح','افحص ترخيص كل مادة قبل التحويل',[
    ['MIT OpenCourseWare','https://ocw.mit.edu'],['OpenLearn','https://www.open.edu/openlearn'],['OpenStax','https://openstax.org'],['OER Commons','https://oercommons.org'],['MERLOT','https://merlot.org'],['LibreTexts','https://libretexts.org'],['CK-12','https://www.ck12.org'],['Khan Academy','https://www.khanacademy.org'],['Saylor Academy','https://www.saylor.org'],['Open Library','https://openlibrary.org'],['Project Gutenberg','https://gutenberg.org']
  ]),
  ...group('مختبرات وأدوات','ربط أو تضمين حسب شروط الخدمة',[
    ['PhET','https://phet.colorado.edu'],['GeoGebra','https://www.geogebra.org'],['Desmos','https://www.desmos.com'],['ChemCollective','https://chemcollective.org'],['WolframAlpha','https://www.wolframalpha.com']
  ]),
  ...group('منصات دورات تجارية','مرجع لتجربة المستخدم — يحتاج اتفاقية للمحتوى',[
    ['Coursera','https://www.coursera.org'],['edX','https://www.edx.org'],['FutureLearn','https://www.futurelearn.com'],['Udemy','https://www.udemy.com'],['LinkedIn Learning','https://www.linkedin.com/learning'],['Udacity','https://www.udacity.com'],['DataCamp','https://www.datacamp.com'],['Pluralsight','https://www.pluralsight.com'],['Skillshare','https://www.skillshare.com']
  ]),
  ...group('مناهج واختبارات رسمية','نطاق ومتطلبات ومواعيد — المحتوى محمي',[
    ['College Board','https://www.collegeboard.org'],['ACT','https://www.act.org'],['IB','https://www.ibo.org'],['Cambridge International','https://www.cambridgeinternational.org'],['Pearson Qualifications','https://qualifications.pearson.com'],['AQA','https://www.aqa.org.uk'],['OCR','https://www.ocr.org.uk'],['ETS','https://www.ets.org'],['IELTS','https://www.ielts.org']
  ]),
  ...group('برمجة وتقنية','توثيق وتدريب — افحص ترخيص كل مستودع',[
    ['MDN','https://developer.mozilla.org'],['freeCodeCamp','https://freecodecamp.org'],['CS50','https://cs50.harvard.edu'],['GitHub','https://github.com'],['roadmap.sh','https://roadmap.sh'],['Python','https://python.org'],['React','https://react.dev'],['Google Developers','https://developers.google.com'],['Microsoft Learn','https://learn.microsoft.com'],['AWS Training','https://aws.amazon.com/training']
  ]),
  ...group('بحث علمي','بيانات وصفية وروابط — النص الكامل حسب الترخيص',[
    ['arXiv','https://arxiv.org'],['PubMed','https://pubmed.ncbi.nlm.nih.gov'],['DOAJ','https://doaj.org'],['ERIC','https://eric.ed.gov'],['Google Scholar','https://scholar.google.com'],['IEEE Xplore','https://ieeexplore.ieee.org'],['ScienceDirect','https://www.sciencedirect.com'],['SpringerLink','https://link.springer.com'],['JSTOR','https://www.jstor.org']
  ]),
  ...group('وظائف ومنح وفرص','ربط ومطابقة — لا إعادة نشر دون إذن',[
    ['LinkedIn','https://www.linkedin.com'],['Indeed','https://www.indeed.com'],['Glassdoor','https://www.glassdoor.com'],['Wellfound','https://wellfound.com'],['Remote OK','https://remoteok.com'],['DAAD','https://www.daad.de'],['Erasmus+','https://erasmus-plus.ec.europa.eu'],['Chevening','https://www.chevening.org'],['Fulbright','https://fulbrightprogram.org'],['EducationUSA','https://educationusa.state.gov']
  ])
];

export const policyLabels = {
  'مرجع ومقارنة — لا تنسخ الجداول':'مرجع فقط',
  'افحص ترخيص كل مادة قبل التحويل':'ترخيص لكل مادة',
  'ربط أو تضمين حسب شروط الخدمة':'تكامل مشروط',
  'مرجع لتجربة المستخدم — يحتاج اتفاقية للمحتوى':'تجاري / يحتاج اتفاقية',
  'نطاق ومتطلبات ومواعيد — المحتوى محمي':'مصدر رسمي محمي',
  'توثيق وتدريب — افحص ترخيص كل مستودع':'ترخيص متغير',
  'بيانات وصفية وروابط — النص الكامل حسب الترخيص':'بحث / وصول متغير',
  'ربط ومطابقة — لا إعادة نشر دون إذن':'ربط خارجي'
};
