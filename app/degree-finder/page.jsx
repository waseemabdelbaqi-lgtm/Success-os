'use client';
import { useEffect, useMemo, useState } from 'react';
import { InnerNav } from '../components';
import { globalInstitutions, studentCountries } from '../data/university-registry';
import { ADMISSION_PORTALS } from '../data/admission-portals';

const COMPARE_KEY = 'success-os-university-compare';

function rowKey(x) {
  return x.id || `${x.name}|${x.modes?.[0]}|${x.fields?.[0]}`;
}

export default function DegreeFinder() {
  const [home, setHome] = useState('الأردن');
  const [mode, setMode] = useState('الكل');
  const [degree, setDegree] = useState('الكل');
  const [type, setType] = useState('الكل');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) setQuery(q);
    const m = params.get('mode');
    if (m === 'وجاهي' || m === 'أونلاين') setMode(m);
    const d = params.get('degree');
    if (d) setDegree(d);
    const c = params.get('country') || params.get('home');
    if (c) setHome(c);
    try {
      setSaved(JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]'));
    } catch {}
  }, []);

  const countries = useMemo(
    () => [...new Set(['الأردن', ...studentCountries])].sort((a, b) => a.localeCompare(b, 'ar')),
    [],
  );

  const types = useMemo(
    () => ['الكل', ...new Set(globalInstitutions.map((x) => x.type))],
    [],
  );

  const rows = useMemo(
    () =>
      globalInstitutions.filter((x) => {
        if (home !== 'الكل' && home !== 'دولة أخرى') {
          // Prefer institutions in home country OR online / international options
          const localHit = x.country === home;
          const onlineHit = x.modes.includes('أونلاين');
          if (!localHit && !(mode === 'أونلاين' && onlineHit) && mode !== 'الكل') {
            // when filtering by mode=وجاهي and home set: show home country face-to-face
            if (mode === 'وجاهي' && !localHit) return false;
          }
          if (mode === 'الكل' && !localHit && !onlineHit) return false;
        }
        if (mode !== 'الكل' && !x.modes.includes(mode)) return false;
        if (degree !== 'الكل' && x.degree && !String(x.degree).includes(degree)) return false;
        if (type !== 'الكل' && x.type !== type) return false;
        if (
          query &&
          !`${x.name} ${x.country} ${x.city} ${x.fields.join(' ')} ${x.type}`
            .toLowerCase()
            .includes(query.toLowerCase())
        ) {
          return false;
        }
        return true;
      }),
    [home, mode, degree, type, query],
  );

  const onlinePortals = useMemo(
    () =>
      ADMISSION_PORTALS.filter(
        (p) =>
          /online|degree|mooc|training|university search/i.test(p.type) ||
          /أونلاين|درجة|تدريب|بحث/i.test(p.typeAr || ''),
      ).slice(0, 12),
    [],
  );

  function saveForCompare(item) {
    try {
      const list = JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]');
      const entry = {
        id: item.id,
        institution: item.name,
        country: item.country,
        mode: item.modes[0],
        degree: item.degree,
        field: item.fields.join(' · '),
        home,
        savedAt: new Date().toISOString(),
      };
      const next = [entry, ...list.filter((x) => (x.id || rowKey(x)) !== item.id)].slice(0, 8);
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next.map((x) => x.id).filter(Boolean)));
      // also keep rich compare list for degree-finder toast UX
      localStorage.setItem('success-os-degree-compare-rich', JSON.stringify(next));
      setSaved(next);
      setToast(`تم حفظ ${item.name} للمقارنة`);
      window.setTimeout(() => setToast(''), 2200);
    } catch {
      setToast('تعذر الحفظ محليًا');
    }
  }

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="degrees" />
      <main className="os-page-content degree-page">
        <header className="degree-hero">
          <div>
            <span>DEGREE & RECOGNITION FINDER</span>
            <h1>جامعات وكليات ودرجات أونلاين — حسب دولتك</h1>
            <p>
              فهرس موحّد من {globalInstitutions.length} مؤسسة: جامعات، كليات مجتمعية، ومعاهد أونلاين — مع
              فلترة حقيقية حسب الدولة ونمط الدراسة والدرجة.
            </p>
          </div>
          <div>
            <b>{rows.length}</b>
            <small>نتيجة مطابقة</small>
          </div>
        </header>
        <section className="country-alert">
          <span>!</span>
          <div>
            <b>الاعتماد يُفحص لدولة استخدام الدرجة: {home}</b>
            <p>
              اختيار الدولة يُظهر مؤسسات محلية + خيارات أونلاين مناسبة. القرار النهائي لجهة المعادلة في
              دولتك — راجع{' '}
              <a href="/global-sources">المصادر الرسمية</a>.
            </p>
          </div>
        </section>
        <section className="degree-filter">
          <label>
            دولة استخدام الدرجة
            <select value={home} onChange={(e) => setHome(e.target.value)}>
              {countries.map((x) => (
                <option key={x}>{x}</option>
              ))}
              <option>دولة أخرى</option>
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
            الدرجة
            <select value={degree} onChange={(e) => setDegree(e.target.value)}>
              {['الكل', 'بكالوريوس', 'ماجستير', 'دكتوراه', 'دبلوم'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            نوع المؤسسة
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {types.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            التخصص أو الجامعة
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث داخل الفهرس"
            />
          </label>
        </section>
        <section className="degree-results">
          <header>
            <div>
              <small>نتائج SUCCESS OS</small>
              <h2>{rows.length} مؤسسة مطابقة</h2>
            </div>
            <div className="degree-result-links">
              <a href="/admissions">معالج القبول ←</a>
              <a href="/university-compare">المقارنة ({saved.length})</a>
              <a href="/global-sources">مصادر التحقق</a>
              <a href="/control-hubs">لوحات التحكم</a>
            </div>
          </header>
          {toast && <p className="degree-toast">{toast}</p>}
          <div>
            {rows.map((x) => (
              <article key={x.id}>
                <header>
                  <span>{x.modes.includes('أونلاين') ? '⌁' : '⌂'}</span>
                  <div>
                    <small>
                      {x.country} • {x.type} • {x.modes.join(' / ')}
                    </small>
                    <h2>{x.name}</h2>
                  </div>
                </header>
                <p>
                  {x.degree} • {x.fields.join(' · ')}
                </p>
                <p className="degree-status">{x.entry}</p>
                <footer>
                  <button type="button" onClick={() => saveForCompare(x)}>
                    احفظ للمقارنة
                  </button>
                  <a href={`/university-profile?id=${encodeURIComponent(x.id)}`}>الملف</a>
                  <a href={`/admissions?country=${encodeURIComponent(x.country)}`}>القبول</a>
                  <a href={x.admission} target="_blank" rel="noreferrer">
                    التقديم الرسمي ↗
                  </a>
                </footer>
              </article>
            ))}
          </div>
        </section>

        <section className="degree-results" style={{ marginTop: '2rem' }}>
          <header>
            <div>
              <small>ONLINE & TRAINING PORTALS</small>
              <h2>بوابات الدرجات والتدريب الأونلاين</h2>
            </div>
            <a href="/global-sources">كل البوابات ←</a>
          </header>
          <div>
            {onlinePortals.map((p) => (
              <article key={p.id}>
                <header>
                  <span>↗</span>
                  <div>
                    <small>
                      {p.type} • {p.scope}
                    </small>
                    <h2>{p.name}</h2>
                  </div>
                </header>
                <p>{p.details}</p>
                <footer>
                  <a href={p.website} target="_blank" rel="noreferrer">
                    فتح البوابة ↗
                  </a>
                </footer>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
