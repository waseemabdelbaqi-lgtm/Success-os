'use client';
import { useEffect, useMemo, useState } from 'react';
import { InnerNav } from '../components';
import {
  ADMISSION_COUNTRIES,
  ADMISSION_REGIONS,
  countriesForRegion,
  countryAuthorities,
  globalInstitutions,
  institutionsForCountry,
  qualificationSystems,
  recognitionFor,
  requirementsForApplicant,
  studentCountries,
} from '../data/university-registry';
import {
  ADMISSION_PORTALS,
  portalsForCountry,
  portalsForRegion,
} from '../data/admission-portals';
import {
  ADMISSION_DOC_PACKS,
  LANGUAGE_BENCHMARKS,
  MAJOR_CLUSTERS,
  clusterForField,
  playbookForRegion,
} from '../data/admissions-knowledge';
import {
  compareNationalityTracks,
  exampleAlternateNationality,
  nationalityMatrixRows,
  nationalityTracksSummary,
  resolveNationalityTrack,
} from '../data/nationality-admission-tracks';
import { institutionKind, kindLabelAr } from '../data/university-inquiry';

const STEPS = [
  ['region', 'القارة'],
  ['country', 'الدولة'],
  ['applicant', 'نوع الطالب'],
  ['profile', 'مؤهلك'],
  ['filters', 'التخصص'],
  ['results', 'النتائج'],
];

function Status({ recognition }) {
  return (
    <div className={`admission-recognition ${recognition.level}`}>
      <span>{recognition.level === 'verified' ? '✓' : recognition.level === 'review' ? '!' : '?'}</span>
      <div>
        <b>{recognition.title}</b>
        <p>{recognition.text}</p>
        {recognition.authority && (
          <a href={recognition.authority.url} target="_blank" rel="noreferrer">
            تحقق لدى {recognition.authority.authority} ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default function AdmissionsPage() {
  const [step, setStep] = useState('region');
  const [regionId, setRegionId] = useState('');
  const [studyCountry, setStudyCountry] = useState('');
  const [applicantType, setApplicantType] = useState(''); // local | international
  const [nationality, setNationality] = useState('الأردن');
  const [qualificationCountry, setQualificationCountry] = useState('الأردن');
  const [system, setSystem] = useState('jordan');
  const [degree, setDegree] = useState('بكالوريوس');
  const [field, setField] = useState('الكل');
  const [mode, setMode] = useState('الكل');
  const [institutionType, setInstitutionType] = useState('الكل');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState([]);
  const [globalName, setGlobalName] = useState('');

  const region = ADMISSION_REGIONS.find((r) => r.id === regionId);
  const countryProfile = ADMISSION_COUNTRIES[studyCountry];
  const regionCountries = useMemo(
    () => (regionId ? countriesForRegion(regionId) : []),
    [regionId],
  );
  const activePortals = useMemo(() => {
    const byCountry = studyCountry ? portalsForCountry(studyCountry) : null;
    if (byCountry?.length) return byCountry;
    if (regionId) return portalsForRegion(regionId);
    return ADMISSION_PORTALS;
  }, [regionId, studyCountry]);
  const qSystem = qualificationSystems.find((x) => x.id === system) || qualificationSystems.at(-1);
  const fieldCluster = useMemo(() => clusterForField(field), [field]);
  const regionPlaybook = useMemo(() => playbookForRegion(regionId), [regionId]);
  const nationalityTrack = useMemo(
    () =>
      studyCountry && nationality
        ? resolveNationalityTrack({
            studyCountry,
            nationality,
            residenceCountry: nationality,
            qualificationCountry,
            applicantType,
          })
        : null,
    [studyCountry, nationality, qualificationCountry, applicantType],
  );
  const nationalityContrast = useMemo(() => {
    if (!studyCountry || !nationality) return null;
    const other = exampleAlternateNationality(studyCountry, nationality);
    return compareNationalityTracks(studyCountry, nationality, other);
  }, [studyCountry, nationality]);
  const nationalityMatrix = useMemo(() => nationalityMatrixRows(), []);
  const tracksSummary = useMemo(() => nationalityTracksSummary(), []);
  const studyCountryUniversities = useMemo(
    () => (studyCountry ? institutionsForCountry(studyCountry) : []),
    [studyCountry],
  );
  const docPack = applicantType === 'local' ? ADMISSION_DOC_PACKS.local : ADMISSION_DOC_PACKS.international;

  const pool = useMemo(() => {
    if (!regionId) return [];
    return globalInstitutions.filter((x) => {
      if (x.region !== regionId) return false;
      if (studyCountry && x.country !== studyCountry) return false;
      return true;
    });
  }, [regionId, studyCountry]);

  const fields = useMemo(
    () => ['الكل', ...new Set(pool.flatMap((x) => x.fields))],
    [pool],
  );

  const institutionTypes = useMemo(
    () => ['الكل', ...new Set(pool.map((x) => x.type))],
    [pool],
  );

  const results = useMemo(() => {
    return pool.filter((x) => {
      if (field !== 'الكل' && !x.fields.includes(field)) return false;
      if (mode !== 'الكل' && !x.modes.includes(mode)) return false;
      if (institutionType !== 'الكل' && x.type !== institutionType) return false;
      if (degree !== 'الكل' && x.degree && !String(x.degree).includes(degree)) return false;
      if (system && x.systems && !x.systems.includes(system)) return false;
      if (
        query &&
        !`${x.name} ${x.country} ${x.city} ${x.type} ${x.fields.join(' ')}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [pool, field, mode, degree, system, query, institutionType]);

  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem('success-os-university-compare') || '[]'));
    } catch {}
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const country = q.get('country');
    const regionParam = q.get('region');
    const applicant = q.get('applicant');
    const degreeParam = q.get('degree');
    const modeParam = q.get('mode');
    const fieldParam = q.get('field');
    const typeParam = q.get('type');
    const searchQ = q.get('q') || q.get('name');

    if (regionParam && ADMISSION_REGIONS.some((r) => r.id === regionParam)) {
      setRegionId(regionParam);
      setStep('country');
    }
    if (country && ADMISSION_COUNTRIES[country]) {
      setStudyCountry(country);
      setRegionId(ADMISSION_COUNTRIES[country].region);
      setStep('applicant');
    }
    if (applicant === 'local' || applicant === 'international') {
      setApplicantType(applicant);
      if (applicant === 'local' && country && ADMISSION_COUNTRIES[country]) {
        setNationality(country);
        setQualificationCountry(country);
      }
      setStep('profile');
    }
    if (degreeParam) setDegree(degreeParam);
    if (modeParam === 'وجاهي' || modeParam === 'أونلاين') setMode(modeParam);
    if (fieldParam) setField(fieldParam);
    if (typeParam) setInstitutionType(typeParam);
    if (searchQ) setQuery(searchQ);

    // Journey deep-link: jump to filters/results when enough context exists
    if (country && ADMISSION_COUNTRIES[country] && (degreeParam || modeParam || fieldParam || applicant)) {
      setStep(applicant ? 'filters' : 'applicant');
    }
    if (country && ADMISSION_COUNTRIES[country] && applicant && (degreeParam || modeParam || fieldParam)) {
      setStep('results');
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        'success-os-admission-wizard',
        JSON.stringify({
          step,
          regionId,
          studyCountry,
          applicantType,
          nationality,
          qualificationCountry,
          system,
          degree,
          field,
          mode,
        }),
      );
    } catch {}
  }, [
    step,
    regionId,
    studyCountry,
    applicantType,
    nationality,
    qualificationCountry,
    system,
    degree,
    field,
    mode,
  ]);

  const toggleSave = (id) =>
    setSaved((s) => {
      const next = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
      localStorage.setItem('success-os-university-compare', JSON.stringify(next));
      return next;
    });

  const stepIndex = STEPS.findIndex(([id]) => id === step);

  function chooseRegion(id) {
    setRegionId(id);
    setStudyCountry('');
    setApplicantType('');
    setField('الكل');
    setMode('الكل');
    setStep('country');
  }

  function chooseCountry(name) {
    setStudyCountry(name);
    setApplicantType('');
    setField('الكل');
    setStep('applicant');
  }

  function chooseApplicant(type) {
    setApplicantType(type);
    // Local path assumes citizenship of the study country; international keeps selected nationality.
    if (type === 'local' && studyCountry) {
      setNationality(studyCountry);
      setQualificationCountry(studyCountry);
    } else if (type === 'international' && studyCountry && nationality === studyCountry) {
      // Nudge away from same-country nationality so the international track can resolve.
      setNationality('الأردن');
    }
    setStep('profile');
  }

  function onNationalityChange(next) {
    setNationality(next);
    if (studyCountry && next === studyCountry && applicantType === 'international') {
      setApplicantType('local');
    } else if (studyCountry && next !== studyCountry && applicantType === 'local') {
      setApplicantType('international');
    }
  }

  function goResults() {
    setStep('results');
  }

  function resetWizard() {
    setStep('region');
    setRegionId('');
    setStudyCountry('');
    setApplicantType('');
    setField('الكل');
    setMode('الكل');
    setQuery('');
  }

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="admissions" />
      <main className="os-page-content admission-match-page admission-wizard-page">
        <header className="admissions-hero admission-premium-hero">
          <div>
            <span>REGION → COUNTRY → NATIONALITY → LOCAL / INTERNATIONAL</span>
            <h1>قبول الجامعات: سلسلة اختيارات واضحة</h1>
            <p>
              ابدأ بالقارة، اختر دولة الدراسة، ثم جنسيتك — فشروط القبول والرسوم والتأشيرة وقناة التقديم تختلف باختلاف
              جنسية الطالب وبلد إقامته وبلد شهادته، وليس بمجرد مسار «محلي/دولي» فقط.
            </p>
          </div>
          <div className="admission-orbit">
            <b>{ADMISSION_REGIONS.length}</b>
            <small>قارات / أقاليم</small>
            <i>{globalInstitutions.length}</i>
            <em>مؤسسة في فهرس الإطلاق</em>
          </div>
        </header>

        <nav className="admission-wizard-progress" aria-label="مراحل القبول">
          {STEPS.map(([id, label], i) => (
            <button
              type="button"
              key={id}
              className={step === id ? 'active' : i < stepIndex ? 'done' : ''}
              onClick={() => {
                if (i <= stepIndex) setStep(id);
              }}
            >
              <b>{i + 1}</b>
              {label}
            </button>
          ))}
        </nav>

        <section className="admission-nationality-matrix" aria-label="مصفوفة الجنسية ودولة الدراسة">
          <header>
            <div>
              <small>NATIONALITY × DESTINATION</small>
              <h2>نفس الدولة — جنسيتان = مساران</h2>
              <p>
                {tracksSummary.principleAr} تغطية بحثية: {tracksSummary.destinations} دولة دراسة و{' '}
                {tracksSummary.tracks} مساراً (حدّث {tracksSummary.researchedAt}).
              </p>
            </div>
          </header>
          <div className="admission-nationality-matrix-scroll">
            <table>
              <thead>
                <tr>
                  <th>دولة الدراسة</th>
                  <th>جامعات في الفهرس</th>
                  <th>مواطن الدولة</th>
                  <th>جنسية أخرى (مثال)</th>
                </tr>
              </thead>
              <tbody>
                {nationalityMatrix.map((row) => {
                  const unis = institutionsForCountry(row.destination);
                  return (
                  <tr key={row.destination} className={row.differs ? 'differs' : 'same'}>
                    <td>
                      <b>{row.destination}</b>
                      <small>{row.trackCount} مسارات</small>
                    </td>
                    <td>
                      <b>{unis.length} جامعة</b>
                      <small>{unis.slice(0, 3).map((u) => u.name).join(' · ') || '—'}</small>
                    </td>
                    <td>
                      <b>{row.citizen.titleAr}</b>
                      <small>{row.citizen.channelAr}</small>
                    </td>
                    <td>
                      <em>{row.other.nationality}</em>
                      <b>{row.other.titleAr}</b>
                      <small>{row.other.channelAr}</small>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admission-portals-band">
          <header>
            <div>
              <small>EXTERNAL PORTALS & APPLICATION SYSTEMS</small>
              <h2>بوابات وأنظمة القبول الرسمية</h2>
              <p>
                {studyCountry
                  ? `الأنظمة الأنسب لدولة الدراسة: ${studyCountry}.`
                  : region
                    ? `بوابات منطقة ${region.nameAr} + المراجع العالمية.`
                    : 'Common App، UCAS، Parcoursup، Studielink، Hochschulstart، OUAC، ApplyTexas والمزيد — ثم المطابقة المحلية/الدولية داخل SUCCESS OS.'}{' '}
                ({activePortals.length} مصدر)
              </p>
            </div>
            <a href="/global-sources">الجدول الكامل ←</a>
          </header>
          <div className="admission-portals-grid">
            {activePortals.map((p) => (
              <article key={p.id}>
                <small>
                  {p.type} • {p.scope || p.region}
                </small>
                <h3>{p.name}</h3>
                <p>{p.detailsAr || p.details}</p>
                <div className="admission-portal-meta">
                  <span>{p.typeAr}</span>
                  <span>{p.scopeAr || p.regionAr}</span>
                </div>
                <a href={p.website} target="_blank" rel="noreferrer">
                  فتح {p.name} ↗
                </a>
              </article>
            ))}
          </div>
        </section>

        {step === 'region' && (
          <section className="admission-choice-panel">
            <header>
              <small>01 — اختر القارة بالترتيب</small>
              <h2>من أين تبدأ رحلة القبول؟</h2>
              <p>السلسلة المقترحة: الأمريكتان → أوروبا → آسيا → الشرق الأوسط وشمال أفريقيا → أفريقيا → أوقيانوسيا.</p>
            </header>
            <div className="admission-region-grid">
              {ADMISSION_REGIONS.map((r) => (
                <button type="button" key={r.id} className="admission-region-card" onClick={() => chooseRegion(r.id)}>
                  <span className="region-order">{String(r.order).padStart(2, '0')}</span>
                  <span className="region-icon">{r.icon}</span>
                  <b>{r.nameAr}</b>
                  <small>{r.nameEn}</small>
                  <p>{r.blurbAr}</p>
                  <em>
                    {countriesForRegion(r.id).length} دول •{' '}
                    {globalInstitutions.filter((x) => x.region === r.id).length} جامعات
                  </em>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 'country' && region && (
          <section className="admission-choice-panel">
            <header>
              <small>02 — {region.nameAr}</small>
              <h2>اختر دولة الدراسة</h2>
              <p>{region.blurbAr}</p>
            </header>
            <div className="admission-country-grid">
              {regionCountries.map((c) => (
                <button type="button" key={c.name} onClick={() => chooseCountry(c.name)}>
                  <b>{c.name}</b>
                  <small>{c.nameEn}</small>
                  <p>{c.localSummaryAr}</p>
                  <em>
                    {globalInstitutions.filter((x) => x.country === c.name).length} جامعات في الفهرس
                  </em>
                </button>
              ))}
            </div>
            <footer className="admission-wizard-actions">
              <button type="button" onClick={() => setStep('region')}>
                رجوع للقارات
              </button>
            </footer>
          </section>
        )}

        {step === 'applicant' && countryProfile && (
          <section className="admission-choice-panel">
            <header>
              <small>03 — {studyCountry}</small>
              <h2>الجنسية تحدّد المسار — ثم محلي أو دولي</h2>
              <p>
                في {studyCountry} تختلف قناة التقديم والرسوم والتأشيرة والوثائق باختلاف جنسية الطالب (وأحياناً بلد
                الإقامة وبلد الشهادة). اختر وضعك التقريبي الآن، ثم حدّد جنسيتك بدقة في الخطوة التالية.
              </p>
            </header>
            <aside className="admission-nationality-banner">
              <b>قاعدة مهمة</b>
              <p>
                طالبان لنفس الجامعة في {studyCountry} قد يحصلان على مسارين رسميين مختلفين فقط لأن جنسيتيهما مختلفة —
                مثال شائع: مواطن الدولة مقابل وافد/أجنبي، أو أوروبي مقابل غير أوروبي.
              </p>
            </aside>
            <div className="admission-applicant-grid">
              <button type="button" className="applicant-card local" onClick={() => chooseApplicant('local')}>
                <span>⌂</span>
                <b>مواطن / مسار محلي في {studyCountry}</b>
                <p>{countryProfile.localSummaryAr}</p>
                <small>قناة التقديم: {countryProfile.applyChannelLocal}</small>
                <ul>
                  {countryProfile.localDocs.slice(0, 4).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </button>
              <button
                type="button"
                className="applicant-card international"
                onClick={() => chooseApplicant('international')}
              >
                <span>✈</span>
                <b>جنسية أخرى / مسار دولي نحو {studyCountry}</b>
                <p>{countryProfile.internationalSummaryAr}</p>
                <small>قناة التقديم: {countryProfile.applyChannelInternational}</small>
                <ul>
                  {countryProfile.internationalDocs.slice(0, 4).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </button>
            </div>
            <aside className="admission-country-sources">
              <b>مصادر رسمية لـ {studyCountry}</b>
              <p>
                الجهة المختصة: {countryProfile.authority} — {countryProfile.notesAr}
              </p>
              <div>
                <a href={countryProfile.authorityUrl} target="_blank" rel="noreferrer">
                  الجهة المختصة ↗
                </a>
                {countryProfile.sources?.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                    {s.label} ↗
                  </a>
                ))}
              </div>
            </aside>
            <footer className="admission-wizard-actions">
              <button type="button" onClick={() => setStep('country')}>
                رجوع للدول
              </button>
            </footer>
          </section>
        )}

        {step === 'profile' && (
          <section className="admission-choice-panel student-admission-profile">
            <header>
              <div>
                <small>04 — ملف المؤهل</small>
                <h2>جنسيتك وشهادتك</h2>
              </div>
              <b>
                {applicantType === 'local' ? 'مسار محلي' : 'مسار دولي'} • {studyCountry}
              </b>
            </header>
            <div>
              <label>
                جنسية الطالب (تغيّر شروط القبول)
                <select value={nationality} onChange={(e) => onNationalityChange(e.target.value)}>
                  {studentCountries.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                دولة إصدار الشهادة
                <select value={qualificationCountry} onChange={(e) => setQualificationCountry(e.target.value)}>
                  {studentCountries.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                النظام التعليمي / الشهادة
                <select value={system} onChange={(e) => setSystem(e.target.value)}>
                  {qualificationSystems.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                الدرجة المطلوبة
                <select value={degree} onChange={(e) => setDegree(e.target.value)}>
                  <option>الكل</option>
                  <option>بكالوريوس</option>
                  <option>دبلوم</option>
                  <option>ماجستير</option>
                  <option>دكتوراه</option>
                </select>
              </label>
            </div>
            <aside>
              <span>مسار مؤهلك</span>
              <b>{qSystem.credential}</b>
              <p>{qSystem.route}</p>
              <small>
                دولة الشهادة: {qualificationCountry} • جنسية الطالب: {nationality}
              </small>
            </aside>
            {nationalityTrack && (
              <aside className="admission-nationality-track">
                <small>مسار حسب الجنسية — بحث من مصادر رسمية</small>
                <h3>{nationalityTrack.titleAr}</h3>
                <p>{nationalityTrack.whenAr}</p>
                <ul>
                  <li>
                    <b>قناة التقديم:</b> {nationalityTrack.channelAr}
                  </li>
                  <li>
                    <b>الرسوم:</b> {nationalityTrack.feesAr}
                  </li>
                  <li>
                    <b>التأشيرة/الإقامة:</b> {nationalityTrack.visaAr}
                  </li>
                </ul>
                <b>وثائق هذا المسار</b>
                <ul>
                  {(nationalityTrack.docs || []).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                {(nationalityTrack.caveats || []).length > 0 && (
                  <>
                    <b>تنبيهات</b>
                    <ul>
                      {nationalityTrack.caveats.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="admission-inline-links">
                  {(nationalityTrack.sources || []).map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                      {s.label} ↗
                    </a>
                  ))}
                </div>
                {(nationalityTrack.universities?.length || studyCountryUniversities.length > 0) && (
                  <div className="admission-track-universities">
                    <b>جامعات / كليات / مدارس مرتبطة بهذا المسار</b>
                    <ul>
                      {(nationalityTrack.universities?.length
                        ? nationalityTrack.universities
                        : studyCountryUniversities.map((u) => u.name)
                      ).slice(0, 8).map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                    {studyCountryUniversities.length > 0 && (
                      <small>
                        في فهرس SUCCESS OS: {studyCountryUniversities.length} مؤسسة في {studyCountry}
                        {studyCountryUniversities.length > 3
                          ? ` — منها: ${studyCountryUniversities
                              .slice(0, 3)
                              .map((u) => u.name)
                              .join('، ')}`
                          : ''}
                      </small>
                    )}
                  </div>
                )}
                {nationalityContrast && !nationalityContrast.sameTrack && (
                  <div className="admission-nationality-contrast">
                    <b>نفس دولة الدراسة — جنسية مختلفة = مسار مختلف</b>
                    <p>{nationalityContrast.principleAr}</p>
                    <ul>
                      <li>
                        <b>{nationalityContrast.a.nationality}:</b> {nationalityContrast.a.titleAr}
                        <br />
                        <small>{nationalityContrast.a.channelAr}</small>
                      </li>
                      <li>
                        <b>{nationalityContrast.b.nationality}:</b> {nationalityContrast.b.titleAr}
                        <br />
                        <small>{nationalityContrast.b.channelAr}</small>
                      </li>
                    </ul>
                  </div>
                )}
              </aside>
            )}
            <footer className="admission-wizard-actions">
              <button type="button" onClick={() => setStep('applicant')}>
                رجوع
              </button>
              <button type="button" className="primary" onClick={() => setStep('filters')}>
                متابعة للتخصص ←
              </button>
            </footer>
          </section>
        )}

        {step === 'filters' && (
          <section className="admission-choice-panel university-match-filter">
            <header>
              <div>
                <small>05 — التخصص والطريقة</small>
                <h2>ماذا تريد أن تدرس في {studyCountry}؟</h2>
              </div>
              <a className="compare-counter" href="/university-compare">
                {saved.length} محفوظة للمقارنة ←
              </a>
            </header>
            <div>
              <label>
                الدرجة
                <select value={degree} onChange={(e) => setDegree(e.target.value)}>
                  {['الكل', 'بكالوريوس', 'دبلوم', 'ماجستير', 'دكتوراه'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                طريقة الدراسة
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  {['الكل', 'وجاهي', 'أونلاين'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                المجال (اختياري)
                <select value={field} onChange={(e) => setField(e.target.value)}>
                  {fields.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                نوع المؤسسة (اختياري)
                <select value={institutionType} onChange={(e) => setInstitutionType(e.target.value)}>
                  {institutionTypes.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="wide">
                بحث سريع (اختياري)
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="اسم جامعة أو تخصص…"
                />
              </label>
            </div>
            {fieldCluster && (
              <aside className="admission-field-intel">
                <b>مواد ثانوية مفيدة لـ {fieldCluster.labelAr}</b>
                <p>{fieldCluster.competitiveNoteAr}</p>
                <ul>
                  {fieldCluster.secondarySubjectsAr.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <small>
                  لغة تقريبية: IELTS {fieldCluster.typicalLanguage.ielts}+ / TOEFL iBT{' '}
                  {fieldCluster.typicalLanguage.toeflIbt}+ — {fieldCluster.typicalLanguage.noteAr}
                </small>
              </aside>
            )}
            {!fieldCluster && (
              <aside className="admission-field-intel muted">
                <b>مجالات شائعة للفلترة</b>
                <p>اختر مجالاً لعرض المواد الثانوية والحد اللغوي التقريبي، أو تخطَّ لعرض كل البرامج.</p>
                <div className="admission-chip-row">
                  {MAJOR_CLUSTERS.map((c) => (
                    <button key={c.id} type="button" onClick={() => setField(c.labelAr)}>
                      {c.labelAr}
                    </button>
                  ))}
                </div>
              </aside>
            )}
            <footer className="admission-wizard-actions">
              <button type="button" onClick={() => setStep('profile')}>
                رجوع
              </button>
              <button
                type="button"
                onClick={() => {
                  setField('الكل');
                  setMode('الكل');
                  setInstitutionType('الكل');
                  setQuery('');
                  goResults();
                }}
              >
                تخطي — اعرض الكل
              </button>
              <button type="button" className="primary" onClick={goResults}>
                عرض النتائج ←
              </button>
            </footer>
          </section>
        )}

        {step === 'results' && (
          <>
            <section className="admission-safety">
              <span>◎</span>
              <div>
                <b>
                  {nationalityTrack?.titleAr ||
                    `مسار ${applicantType === 'local' ? 'طالب محلي' : 'طالب دولي'} في ${studyCountry}`}{' '}
                  — جنسية {nationality}
                </b>
                <p>
                  {nationalityTrack?.whenAr ||
                    countryProfile?.[applicantType === 'local' ? 'localSummaryAr' : 'internationalSummaryAr']}{' '}
                  الشروط تختلف بالجنسية وبلد الإقامة وبلد الشهادة. النتائج إرشادية — تحقق من الصفحة الرسمية.
                </p>
              </div>
              <a
                href={
                  nationalityTrack?.sources?.[0]?.url ||
                  countryAuthorities[nationality]?.url ||
                  countryProfile?.authorityUrl ||
                  'https://www.whed.net/home.php'
                }
                target="_blank"
                rel="noreferrer"
              >
                المصدر الرسمي ↗
              </a>
            </section>

            {(nationalityTrack || countryProfile) && (
              <section className="admission-path-summary">
                <article>
                  <small>قناة التقديم حسب جنسيتك</small>
                  <h3>{nationalityTrack?.channelAr || (applicantType === 'local'
                      ? countryProfile?.applyChannelLocal
                      : countryProfile?.applyChannelInternational)}</h3>
                  {nationalityTrack && (
                    <>
                      <p>
                        <b>رسوم:</b> {nationalityTrack.feesAr}
                      </p>
                      <p>
                        <b>تأشيرة:</b> {nationalityTrack.visaAr}
                      </p>
                    </>
                  )}
                </article>
                <article>
                  <small>وثائق هذا المسار</small>
                  <ul>
                    {(nationalityTrack?.docs ||
                      (applicantType === 'local'
                        ? countryProfile?.localDocs
                        : countryProfile?.internationalDocs) ||
                      docPack.items)
                      .slice(0, 6)
                      .map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                  </ul>
                </article>
                <article>
                  <small>مصادر رسمية للتحقق</small>
                  <div className="admission-inline-links">
                    {(nationalityTrack?.sources?.length
                      ? nationalityTrack.sources
                      : countryProfile?.sources
                    )?.map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                        {s.label} ↗
                      </a>
                    ))}
                  </div>
                  {(nationalityTrack?.caveats || []).slice(0, 2).map((c) => (
                    <p key={c}>
                      <small>⚠ {c}</small>
                    </p>
                  ))}
                </article>
              </section>
            )}

            <section className="admission-contact-channel" aria-label="قناة التواصل بعد المطابقة">
              <header>
                <small>بعد مطابقة الجامعة أو الكلية أو المدرسة</small>
                <h2>تواصل رسمي بـ $5 — حالتان حسب اشتراك المؤسسة</h2>
                <p>
                  نفس القناة لـ جامعة / كلية / مدرسة: تدفع رسوم التواصل الثابتة عبر بوابة الدفع، ثم يُفتح أحد
                  المسارين حسب حالة المؤسسة في SUCCESS OS.
                </p>
              </header>
              <ol>
                <li>
                  <b>1 — اختر المؤسسة بالاسم</b>
                  <span>من النتائج أدناه (جامعة أو كلية أو مدرسة مسماة)</span>
                </li>
                <li>
                  <b>2 — ادفع $5 عبر بوابة الدفع</b>
                  <span>رسوم تواصل ثابتة لفتح القناة الرسمية</span>
                </li>
                <li>
                  <b>3أ — مشتركة → إشعارات</b>
                  <span>تخاطب مباشر داخل مركز الإشعارات مع مكتب القبول</span>
                </li>
                <li>
                  <b>3ب — غير مشتركة → إيميل رسمي</b>
                  <span>تعبّئ البيانات الضرورية ثم ترسل الإيميل بنفسك</span>
                </li>
              </ol>
            </section>

            {(regionPlaybook || fieldCluster) && (
              <section className="admission-path-summary admission-research-panel">
                {regionPlaybook && (
                  <article>
                    <small>دليل المنطقة (بحث 2026)</small>
                    <h3>{regionPlaybook.titleAr}</h3>
                    <ul>
                      {regionPlaybook.stepsAr.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </article>
                )}
                <article>
                  <small>{docPack.titleAr}</small>
                  <ul>
                    {docPack.items.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <small>معايير لغة شائعة (إرشادية)</small>
                  <ul>
                    {LANGUAGE_BENCHMARKS.slice(0, 4).map((t) => (
                      <li key={t.id}>
                        <a href={t.url} target="_blank" rel="noreferrer">
                          {t.name}
                        </a>
                        : {t.typicalMin} (تنافسي {t.competitive})
                      </li>
                    ))}
                  </ul>
                  {fieldCluster && (
                    <p>
                      لتخصص {fieldCluster.labelAr}: IELTS {fieldCluster.typicalLanguage.ielts}+ / TOEFL{' '}
                      {fieldCluster.typicalLanguage.toeflIbt}+
                    </p>
                  )}
                </article>
              </section>
            )}

            <section className="matched-universities">
              <header>
                <div>
                  <small>06 — النتائج</small>
                  <h2>
                    {results.length} مؤسسة مطابقة في {studyCountry || region?.nameAr}
                  </h2>
                  <p>
                    جامعات وكليات ومدارس بأسمائها — متطلبات{' '}
                    {applicantType === 'local' ? 'الطالب المحلي' : 'الطالب الدولي'} حسب الجنسية، ثم تواصل بـ $5
                    (إشعار أو إيميل رسمي).
                  </p>
                </div>
                <div className="admission-wizard-actions compact">
                  <button type="button" onClick={() => setStep('filters')}>
                    تعديل الفلاتر
                  </button>
                  <button type="button" onClick={resetWizard}>
                    بدء سلسلة جديدة
                  </button>
                </div>
              </header>
              <div>
                {results.map((u) => {
                  const recognition = recognitionFor(u, nationality);
                  const req = requirementsForApplicant(u, applicantType);
                  return (
                    <article className="matched-university-card" key={u.id}>
                      <header>
                        <span>🎓</span>
                        <div>
                          <small>
                            {u.country} • {u.city} • {u.modes.join(' / ')}
                          </small>
                          <h2>{u.name}</h2>
                          <p>
                            {u.type} • {u.degree}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={saved.includes(u.id) ? 'saved' : ''}
                          onClick={() => toggleSave(u.id)}
                        >
                          {saved.includes(u.id) ? '✓ محفوظة' : '＋ مقارنة'}
                        </button>
                      </header>
                      <div className="program-chips">
                        {u.fields.map((x) => (
                          <span key={x}>{x}</span>
                        ))}
                      </div>
                      <section className="entry-snapshot">
                        <div>
                          <small>{req.type}</small>
                          <b>{req.channel}</b>
                          <p>{req.note}</p>
                        </div>
                        <div>
                          <small>مؤهلك</small>
                          <b>{qSystem.credential}</b>
                          <p>{u.entry}</p>
                        </div>
                      </section>
                      <ul className="admission-doc-list">
                        {req.docs.slice(0, 5).map((d) => (
                          <li key={d}>✓ {d}</li>
                        ))}
                      </ul>
                      <Status recognition={recognition} />
                      {u.platformMember ? (
                        <p className="admission-partner-flag">
                          {kindLabelAr(institutionKind(u))} مشتركة — تواصل عبر الإشعارات بعد الدفع
                        </p>
                      ) : (
                        <p className="admission-partner-flag external">
                          {kindLabelAr(institutionKind(u))} غير مشتركة — تواصل عبر إيميل رسمي بعد الدفع
                        </p>
                      )}
                      <footer>
                        <a href={`/university-profile?id=${u.id}`}>الملف الكامل</a>
                        <a href={`/eligibility-check?id=${u.id}`}>فحص الأهلية</a>
                        <a
                          className="contact-uni-cta"
                          href={`/university-contact?id=${encodeURIComponent(u.id)}&nationality=${encodeURIComponent(nationality)}&studyCountry=${encodeURIComponent(studyCountry || '')}&applicantType=${encodeURIComponent(applicantType || '')}`}
                        >
                          تواصل مع {kindLabelAr(institutionKind(u))} · $5
                        </a>
                        <button
                          type="button"
                          onClick={() => setSelected({ ...u, recognition, req })}
                        >
                          الشروط الكاملة
                        </button>
                      </footer>
                    </article>
                  );
                })}
              </div>
              {!results.length && (
                <section className="directory-empty">
                  <span>🎓</span>
                  <h2>لا توجد جامعة مطابقة لهذه الفلاتر</h2>
                  <p>وسّع المجال أو طريقة الدراسة، أو أرسل طلب تحقق لمؤسسة أخرى.</p>
                  <button type="button" onClick={() => setStep('filters')}>
                    تعديل الفلاتر
                  </button>
                </section>
              )}
            </section>

            <section className="global-coverage-request">
              <div>
                <small>لم تجد الجامعة؟</small>
                <h2>افحص أي جامعة في العالم</h2>
                <p>أدخل الاسم وسننشئ بطاقة تحقق مرتبطة بمسارك ({applicantType === 'local' ? 'محلي' : 'دولي'}).</p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!globalName.trim()) return;
                  setSelected({
                    name: globalName.trim(),
                    country: studyCountry || 'غير محدد بعد',
                    city: '—',
                    type: 'طلب تحقق عالمي',
                    modes: ['بحاجة تحقق'],
                    fields: [],
                    degree: '—',
                    entry: 'يجب تحديد المؤسسة والبرنامج والحرم أولاً.',
                    local: countryProfile?.localDocs || [],
                    international: countryProfile?.internationalDocs || [],
                    admission: 'https://www.whed.net/home.php',
                    recognition: {
                      level: 'unknown',
                      title: 'طلب تحقق جديد',
                      text: `لم تُحسم حالة ${globalName.trim()} بعد.`,
                      authority: countryAuthorities[nationality] || null,
                    },
                    req: {
                      type: applicantType === 'local' ? 'طالب محلي' : 'طالب دولي',
                      note: 'تحقق يدوي مطلوب',
                      docs: applicantType === 'local' ? countryProfile?.localDocs || [] : countryProfile?.internationalDocs || [],
                      channel: 'WHED + الجهة الوطنية',
                    },
                  });
                }}
              >
                <input
                  value={globalName}
                  onChange={(e) => setGlobalName(e.target.value)}
                  placeholder="اكتب الاسم الكامل للمؤسسة"
                />
                <button type="submit">ابدأ التحقق داخل SUCCESS OS</button>
              </form>
            </section>
          </>
        )}

        <section className="admission-verification-flow">
          <h2>كيف تُصدر المنصة النتيجة؟</h2>
          <div>
            {[
              ['1', 'القارة', 'الأمريكتان → أوروبا → آسيا…'],
              ['2', 'الدولة', 'قوانين القبول الوطنية'],
              ['3', 'محلي / دولي', 'وثائق وقناة مختلفة'],
              ['4', 'المؤهل', 'الشهادة والدرجات'],
              ['5', 'البرنامج', 'التخصص ونمط الدراسة'],
              ['6', 'الاعتراف', 'جهة المعادلة في دولتك'],
            ].map(([n, t, p]) => (
              <article key={n}>
                <b>{n}</b>
                <h3>{t}</h3>
                <p>{p}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      {selected && (
        <div
          className="admission-modal detailed"
          onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div>
            <button type="button" className="close" onClick={() => setSelected(null)}>
              ×
            </button>
            <small>
              {selected.country} • {selected.city}
            </small>
            <h2>{selected.name}</h2>
            <Status recognition={selected.recognition} />
            <section className="modal-student-context">
              <span>
                القارة: <b>{region?.nameAr || '—'}</b>
              </span>
              <span>
                المسار: <b>{selected.req?.type || (applicantType === 'local' ? 'محلي' : 'دولي')}</b>
              </span>
              <span>
                المؤهل: <b>{qSystem.label}</b>
              </span>
            </section>
            <div className="admission-audiences">
              <section>
                <h3>قناة التقديم</h3>
                <p>
                  <span>✓</span>
                  {selected.req?.channel || 'تطبيق الجامعة'}
                </p>
                <p>
                  <span>✓</span>
                  {selected.entry}
                </p>
                <p>
                  <span>✓</span>
                  اللغة: {selected.language || 'حسب لغة البرنامج'}
                </p>
              </section>
              <section>
                <h3>{selected.req?.type || 'المتطلبات'}</h3>
                {(selected.req?.docs || selected.international || []).map((x) => (
                  <p key={x}>
                    <span>✓</span>
                    {x}
                  </p>
                ))}
              </section>
            </div>
            <div className="decision-warning">
              <b>قبل دفع أي رسوم</b>
              <p>
                احصل على تأكيد رسمي للبرنامج والفرع ونمط الدراسة، ثم إفادة الاعتراف من جهة {nationality}. التصنيف
                العالمي لا يساوي الاعتماد أو المعادلة.
              </p>
            </div>
            <a href={selected.admission} target="_blank" rel="noreferrer">
              فتح مصدر القبول/التحقق الرسمي ↗
            </a>
            {selected.id && (
              <a
                className="apply-button"
                href={`/university-contact?id=${encodeURIComponent(selected.id)}&nationality=${encodeURIComponent(nationality)}&studyCountry=${encodeURIComponent(studyCountry || '')}&applicantType=${encodeURIComponent(applicantType || '')}`}
              >
                تواصل مع {kindLabelAr(institutionKind(selected))} — دفع $5 ثم إشعار أو إيميل
              </a>
            )}
            <button
              type="button"
              className="apply-button secondary"
              onClick={() =>
                (location.href = `/application-tracker?id=${encodeURIComponent(selected.id || selected.name || '')}&applicant=${applicantType || ''}&country=${encodeURIComponent(studyCountry || '')}`)
              }
            >
              أضفها إلى رحلة القبول
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
