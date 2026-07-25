'use client';

import { useEffect, useMemo, useState } from 'react';
import { InnerNav } from '../components';
import PaymentModal from '../components/admissions/PaymentModal';
import {
  CONTACT_FEE_USD,
  DEGREE_OPTIONS,
  MAJOR_OPTIONS,
  filterInstitutionsForProfile,
  isInstitutionPaid,
  pushApplicationNotifications,
  readFunnelProfile,
  saveApplicationLocal,
  saveFunnelProfile,
  savePaymentReceipt,
  validateApplicationStep,
  validateOnboarding,
} from '../data/admission-funnel';
import { studentCountries } from '../data/university-registry';
import { DESTINATION_TRACKS } from '../data/nationality-admission-tracks';

const STEPS = [
  { id: 'onboarding', label: '1 · Profile' },
  { id: 'matches', label: '2 · Matches' },
  { id: 'payment', label: '3 · Pay $5' },
  { id: 'apply', label: '4 · Apply' },
];

const emptyPersonal = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
};

export default function AdmissionFunnelPage() {
  const [step, setStep] = useState('onboarding');
  const [profile, setProfile] = useState({
    studentName: '',
    nationality: 'الأردن',
    gpa: '',
    targetDegree: 'bachelor',
    major: 'هندسة',
    studyCountry: '',
    email: '',
    phone: '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [paidInstitutionId, setPaidInstitutionId] = useState('');
  const [applyStep, setApplyStep] = useState('personal');
  const [personal, setPersonal] = useState(emptyPersonal);
  const [documents, setDocuments] = useState({ transcript: null, passport: null });
  const [message, setMessage] = useState('');
  const [applyErrors, setApplyErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [filterBusy, setFilterBusy] = useState(false);

  const studyCountries = useMemo(
    () => Object.keys(DESTINATION_TRACKS).sort((a, b) => a.localeCompare(b, 'ar')),
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const saved = readFunnelProfile() || {};
    const seeded = {
      ...saved,
      nationality: params.get('nationality') || saved.nationality || 'الأردن',
      studyCountry: params.get('studyCountry') || saved.studyCountry || '',
    };
    setProfile((p) => ({ ...p, ...seeded }));
    setPersonal((prev) => ({
      ...prev,
      fullName: seeded.studentName || prev.fullName,
      email: seeded.email || prev.email,
      phone: seeded.phone || prev.phone,
    }));

    const institutionId = params.get('institution') || '';
    const paid = params.get('paymentId') || '';
    const stepParam = params.get('step') || '';

    if (institutionId) {
      const local = filterInstitutionsForProfile(seeded, {
        studyCountry: seeded.studyCountry,
      });
      // Prefer exact institution even if major filter excluded it
      const fromAll = filterInstitutionsForProfile(
        { ...seeded, major: '', targetDegree: seeded.targetDegree || '' },
        { studyCountry: seeded.studyCountry },
      );
      const inst =
        local.matches.find((m) => m.id === institutionId) ||
        fromAll.matches.find((m) => m.id === institutionId);
      if (inst) {
        setSelected(inst);
        setMatches(local.matches.length ? local.matches : [inst]);
        if (stepParam === 'apply' && (paid || isInstitutionPaid(institutionId))) {
          setPaymentId(paid);
          setPaidInstitutionId(institutionId);
          setStep('apply');
        } else {
          setStep('matches');
          if (stepParam === 'apply' || stepParam === 'pay') setPayOpen(true);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paymentUnlocked =
    Boolean(paymentId) &&
    selected &&
    (paidInstitutionId === selected.id || isInstitutionPaid(selected.id));

  async function runFilter(nextProfile = profile) {
    setFilterBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/v1/admissions/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: nextProfile }),
      });
      const json = await res.json();
      if (json.success) {
        setMatches(json.data.matches || []);
      } else {
        const local = filterInstitutionsForProfile(nextProfile);
        setMatches(local.matches);
      }
    } catch {
      const local = filterInstitutionsForProfile(nextProfile);
      setMatches(local.matches);
    } finally {
      setFilterBusy(false);
    }
  }

  function submitOnboarding(e) {
    e?.preventDefault?.();
    const errors = validateOnboarding(profile);
    setProfileErrors(errors);
    if (Object.keys(errors).length) return;
    const saved = saveFunnelProfile(profile);
    setPersonal((prev) => ({
      ...prev,
      fullName: saved.studentName || prev.fullName,
      email: saved.email || prev.email,
      phone: saved.phone || prev.phone,
    }));
    setStep('matches');
    runFilter(saved);
  }

  function openApply(institution) {
    setSelected(institution);
    setResult(null);
    if (paymentId && paidInstitutionId === institution.id) {
      setStep('apply');
      return;
    }
    if (isInstitutionPaid(institution.id)) {
      setPaidInstitutionId(institution.id);
      setStep('apply');
      return;
    }
    setPayOpen(true);
  }

  function handlePaid({ paymentId: id, receipt }) {
    setPaymentId(id);
    setPaidInstitutionId(selected.id);
    savePaymentReceipt({
      id,
      status: 'paid',
      institutionId: selected.id,
      amountUsd: CONTACT_FEE_USD,
      ...receipt,
    });
    setPayOpen(false);
    setStep('apply');
    setApplyStep('personal');
  }

  async function fileToDoc(file) {
    if (!file) return null;
    if (file.type && !file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('PDF only');
    }
    if (file.size > 1_400_000) {
      throw new Error('Max file size 1.4MB in preview mode');
    }
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return {
      name: file.name,
      type: file.type || 'application/pdf',
      size: file.size,
      dataBase64: btoa(binary),
    };
  }

  async function onFileChange(key, fileList) {
    const file = fileList?.[0];
    if (!file) return;
    try {
      const doc = await fileToDoc(file);
      setDocuments((d) => ({ ...d, [key]: doc }));
      setApplyErrors((e) => ({ ...e, [key]: undefined }));
    } catch (err) {
      setApplyErrors((e) => ({ ...e, [key]: err.message }));
    }
  }

  function nextApplyStep() {
    if (applyStep === 'personal') {
      const errors = validateApplicationStep('personal', personal);
      setApplyErrors(errors);
      if (Object.keys(errors).length) return;
      setApplyStep('documents');
      return;
    }
    if (applyStep === 'documents') {
      const errors = validateApplicationStep('documents', documents);
      setApplyErrors(errors);
      if (Object.keys(errors).length) return;
      setApplyStep('review');
    }
  }

  async function submitApplication() {
    if (!selected || !paymentUnlocked) {
      setPayOpen(true);
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const payload = {
        institutionId: selected.id,
        paymentId,
        nationality: profile.nationality,
        studyCountry: profile.studyCountry || selected.country,
        gpa: profile.gpa,
        targetDegree: profile.targetDegree,
        major: profile.major,
        personal,
        documents,
        message,
      };
      const res = await fetch('/api/v1/admissions/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Submit failed');
      }

      const application = json.data.application;
      saveApplicationLocal(application);

      if (json.data.route === 'A' || application.is_partner) {
        pushApplicationNotifications({ application, institution: selected });
      }

      setResult(json.data);
      setStep('done');
    } catch (err) {
      setApplyErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="os-page phase11-legacy-page admission-funnel-page">
      <InnerNav active="admissions" />
      <main className="os-page-content funnel-shell">
        <header className="funnel-hero">
          <small>SUCCESS OS · ADMISSION FUNNEL</small>
          <h1>Smart admission path by nationality</h1>
          <p>
            Filter matching universities, colleges, and schools — pay ${CONTACT_FEE_USD} — then
            submit via partner notifications or an official admissions email.
          </p>
        </header>

        <nav className="funnel-steps" aria-label="Funnel steps">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={
                step === s.id || (step === 'done' && s.id === 'apply')
                  ? 'active'
                  : step === 'matches' && s.id === 'onboarding'
                    ? 'done'
                    : ''
              }
              onClick={() => {
                if (s.id === 'onboarding') setStep('onboarding');
                if (s.id === 'matches' && matches.length) setStep('matches');
                if (s.id === 'apply' && paymentUnlocked) setStep('apply');
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {step === 'onboarding' && (
          <form className="funnel-card" onSubmit={submitOnboarding}>
            <header>
              <h2>Step 1 — Student profile</h2>
              <p>We use nationality and major to show only matching institutions and their criteria.</p>
            </header>
            <div className="funnel-grid">
              <label className="funnel-field">
                <span>Student name</span>
                <input
                  value={profile.studentName}
                  onChange={(e) => setProfile({ ...profile, studentName: e.target.value })}
                  autoComplete="name"
                />
                {profileErrors.studentName && <em>{profileErrors.studentName}</em>}
              </label>
              <label className="funnel-field">
                <span>Nationality</span>
                <select
                  value={profile.nationality}
                  onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                >
                  {studentCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {profileErrors.nationality && <em>{profileErrors.nationality}</em>}
              </label>
              <label className="funnel-field">
                <span>GPA (0–4.5 scale)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.5"
                  value={profile.gpa}
                  onChange={(e) => setProfile({ ...profile, gpa: e.target.value })}
                />
                {profileErrors.gpa && <em>{profileErrors.gpa}</em>}
              </label>
              <label className="funnel-field">
                <span>Target degree</span>
                <select
                  value={profile.targetDegree}
                  onChange={(e) => setProfile({ ...profile, targetDegree: e.target.value })}
                >
                  {DEGREE_OPTIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.labelEn} — {d.labelAr}
                    </option>
                  ))}
                </select>
              </label>
              <label className="funnel-field">
                <span>Major / field</span>
                <select
                  value={profile.major}
                  onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                >
                  {MAJOR_OPTIONS.map((m) => (
                    <option key={m.id} value={m.labelAr}>
                      {m.labelEn} — {m.labelAr}
                    </option>
                  ))}
                </select>
              </label>
              <label className="funnel-field">
                <span>Preferred study country (optional)</span>
                <select
                  value={profile.studyCountry}
                  onChange={(e) => setProfile({ ...profile, studyCountry: e.target.value })}
                >
                  <option value="">All researched destinations</option>
                  {studyCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="funnel-field">
                <span>Email (optional now)</span>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </label>
              <label className="funnel-field">
                <span>Phone (optional now)</span>
                <input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </label>
            </div>
            <footer className="funnel-actions">
              <button type="submit" className="funnel-btn primary" disabled={filterBusy}>
                {filterBusy ? 'Filtering…' : 'Show matching institutions'}
              </button>
            </footer>
          </form>
        )}

        {step === 'matches' && (
          <section className="funnel-card">
            <header>
              <h2>Matching institutions</h2>
              <p>
                Showing <strong>{matches.length}</strong> universities / colleges / schools with
                admission criteria mapped to nationality <strong>{profile.nationality}</strong>.
              </p>
            </header>
            <div className="funnel-match-list">
              {matches.map((u) => (
                <article key={u.id} className="funnel-match-item">
                  <header>
                    <div>
                      <small>
                        {u.kindLabelAr} · {u.city}, {u.country}
                      </small>
                      <h3>{u.name}</h3>
                    </div>
                    <span className={u.is_partner ? 'badge partner' : 'badge external'}>
                      {u.is_partner ? 'Partner · notifications' : 'Non-partner · email'}
                    </span>
                  </header>
                  {u.nationalityTrack && (
                    <div className="funnel-criteria">
                      <b>{u.nationalityTrack.titleAr}</b>
                      <p>{u.nationalityTrack.whenAr}</p>
                      <ul>
                        <li>Channel: {u.nationalityTrack.channelAr}</li>
                        <li>Fees: {u.nationalityTrack.feesAr}</li>
                        <li>Visa: {u.nationalityTrack.visaAr}</li>
                      </ul>
                    </div>
                  )}
                  <div className="funnel-criteria muted">
                    <b>{u.admissionCriteria.type}</b>
                    <p>{u.admissionCriteria.note}</p>
                    <ul>
                      {(u.admissionCriteria.docs || []).slice(0, 4).map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <footer>
                    <button type="button" className="funnel-btn primary" onClick={() => openApply(u)}>
                      Apply Now · ${CONTACT_FEE_USD}
                    </button>
                  </footer>
                </article>
              ))}
              {!matches.length && !filterBusy && (
                <p className="funnel-empty">No matches — widen major or study country.</p>
              )}
            </div>
            <footer className="funnel-actions">
              <button type="button" className="funnel-btn ghost" onClick={() => setStep('onboarding')}>
                Edit profile
              </button>
            </footer>
          </section>
        )}

        {step === 'apply' && selected && (
          <section className="funnel-card">
            <header>
              <h2>Step 3 — Unified application</h2>
              <p>
                Applying to <strong>{selected.name}</strong>. Payment{' '}
                {paymentUnlocked ? 'confirmed ✓' : 'required'}.
              </p>
            </header>

            {!paymentUnlocked ? (
              <div className="funnel-locked">
                <p>Application form is locked until the ${CONTACT_FEE_USD} payment succeeds.</p>
                <button type="button" className="funnel-btn primary" onClick={() => setPayOpen(true)}>
                  Open payment gateway
                </button>
              </div>
            ) : (
              <>
                <nav className="funnel-apply-steps" aria-label="Application steps">
                  {['personal', 'documents', 'review'].map((s) => (
                    <span key={s} className={applyStep === s ? 'active' : ''}>
                      {s}
                    </span>
                  ))}
                </nav>

                {applyStep === 'personal' && (
                  <div className="funnel-grid">
                    <label className="funnel-field">
                      <span>Full name</span>
                      <input
                        value={personal.fullName}
                        onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                      />
                      {applyErrors.fullName && <em>{applyErrors.fullName}</em>}
                    </label>
                    <label className="funnel-field">
                      <span>Email</span>
                      <input
                        type="email"
                        value={personal.email}
                        onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                      />
                      {applyErrors.email && <em>{applyErrors.email}</em>}
                    </label>
                    <label className="funnel-field">
                      <span>Phone</span>
                      <input
                        value={personal.phone}
                        onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                      />
                      {applyErrors.phone && <em>{applyErrors.phone}</em>}
                    </label>
                    <label className="funnel-field">
                      <span>Date of birth</span>
                      <input
                        type="date"
                        value={personal.dateOfBirth}
                        onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })}
                      />
                      {applyErrors.dateOfBirth && <em>{applyErrors.dateOfBirth}</em>}
                    </label>
                    <label className="funnel-field wide">
                      <span>Address</span>
                      <input
                        value={personal.address}
                        onChange={(e) => setPersonal({ ...personal, address: e.target.value })}
                      />
                    </label>
                  </div>
                )}

                {applyStep === 'documents' && (
                  <div className="funnel-grid">
                    <label className="funnel-field">
                      <span>Academic transcript (PDF)</span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(e) => onFileChange('transcript', e.target.files)}
                      />
                      {documents.transcript && <small>✓ {documents.transcript.name}</small>}
                      {applyErrors.transcript && <em>{applyErrors.transcript}</em>}
                    </label>
                    <label className="funnel-field">
                      <span>Passport (PDF)</span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(e) => onFileChange('passport', e.target.files)}
                      />
                      {documents.passport && <small>✓ {documents.passport.name}</small>}
                      {applyErrors.passport && <em>{applyErrors.passport}</em>}
                    </label>
                    <label className="funnel-field wide">
                      <span>Optional message to admissions</span>
                      <textarea
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </label>
                  </div>
                )}

                {applyStep === 'review' && (
                  <div className="funnel-review">
                    <p>
                      <b>Student:</b> {personal.fullName} · {personal.email}
                    </p>
                    <p>
                      <b>Nationality / GPA:</b> {profile.nationality} · {profile.gpa}
                    </p>
                    <p>
                      <b>Program:</b> {profile.targetDegree} · {profile.major}
                    </p>
                    <p>
                      <b>Documents:</b> {documents.transcript?.name}, {documents.passport?.name}
                    </p>
                    <p>
                      <b>Submission route:</b>{' '}
                      {selected.is_partner
                        ? 'A — Partner institution → save to platform + in-app notifications'
                        : 'B — Non-partner → official HTML email to admissions inbox'}
                    </p>
                    {applyErrors.submit && <em className="funnel-error">{applyErrors.submit}</em>}
                  </div>
                )}

                <footer className="funnel-actions">
                  {applyStep !== 'personal' && (
                    <button
                      type="button"
                      className="funnel-btn ghost"
                      onClick={() =>
                        setApplyStep(applyStep === 'review' ? 'documents' : 'personal')
                      }
                    >
                      Back
                    </button>
                  )}
                  {applyStep !== 'review' ? (
                    <button type="button" className="funnel-btn primary" onClick={nextApplyStep}>
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="funnel-btn primary"
                      disabled={submitting}
                      onClick={submitApplication}
                    >
                      {submitting ? 'Submitting…' : 'Submit application'}
                    </button>
                  )}
                </footer>
              </>
            )}
          </section>
        )}

        {step === 'done' && result && (
          <section className="funnel-card funnel-done">
            <span className="funnel-check">✓</span>
            <h2>Application submitted</h2>
            {result.route === 'A' || result.is_partner ? (
              <>
                <p>
                  <strong>Route A — Partner institution.</strong> Your application is saved on the
                  platform and linked to the institution. In-app alerts were created for status
                  updates.
                </p>
                <a className="funnel-btn primary" href="/notifications">
                  Open notifications
                </a>
              </>
            ) : (
              <>
                <p>
                  <strong>Route B — Non-partner institution.</strong> An official admissions email
                  was composed{result.email?.sent ? ' and sent' : ' (preview compose)'}.
                </p>
                <p>
                  To: <code>{result.email?.to}</code>
                </p>
                {!result.email?.sent && result.email?.mailto && (
                  <a className="funnel-btn primary" href={result.email.mailto}>
                    Open / send official email
                  </a>
                )}
                {result.email?.html && (
                  <details className="funnel-email-preview">
                    <summary>Preview HTML email</summary>
                    <iframe
                      title="Official email preview"
                      sandbox=""
                      srcDoc={result.email.html}
                    />
                  </details>
                )}
              </>
            )}
            <button
              type="button"
              className="funnel-btn ghost"
              onClick={() => {
                setStep('matches');
                setResult(null);
              }}
            >
              Apply to another institution
            </button>
          </section>
        )}
      </main>

      <PaymentModal
        open={payOpen}
        institution={selected}
        profile={profile}
        onClose={() => setPayOpen(false)}
        onPaid={handlePaid}
      />
    </div>
  );
}
