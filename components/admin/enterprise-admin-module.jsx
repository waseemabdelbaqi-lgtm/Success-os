'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultRecordedLessonFilters } from '@/app/data/recorded-lesson-filters.js';
import { DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT } from '@/app/lib/admin/teacher-price-split.js';
import { RecordedLessonsFilters } from '@/components/admin/recorded-lessons-filters.jsx';
import { RecordedLessonsSubjectResults } from '@/components/admin/recorded-lessons-subject-results.jsx';
import { TeacherPriceSplitPanel } from '@/components/admin/teacher-price-split.jsx';
import { CommissionCascadePanel } from '@/components/admin/commission-cascade-panel.jsx';
import { MarketplaceAdminReviewPanel } from '@/components/marketplace/admin-review-panel.jsx';

const emptyForm = {};

export function EnterpriseAdminModulePage({ moduleId }) {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [catalogFilters, setCatalogFilters] = useState(() => defaultRecordedLessonFilters());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [mode, setMode] = useState(null); // add | edit
  const [permMatrix, setPermMatrix] = useState(null);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [commissionDefaults, setCommissionDefaults] = useState(null);
  const [priceSplit, setPriceSplit] = useState(null);
  const [commissionCascade, setCommissionCascade] = useState(null);

  const isPermissions = moduleId === 'permissions';
  const isFinance = moduleId === 'finance';
  const isCommission = moduleId === 'commission-rules';
  const isPaymentSplits = moduleId === 'payment-splits';
  const isRecordedLessons = moduleId === 'recorded-lessons';
  const isPayouts = moduleId === 'payouts';

  const load = useCallback(async () => {
    setError('');
    if (isPermissions) {
      const res = await fetch('/api/enterprise-admin?view=permissions', { cache: 'no-store' });
      setPermMatrix(await res.json());
      return;
    }
    if (isFinance) {
      const res = await fetch('/api/enterprise-admin?view=finance-summary', { cache: 'no-store' });
      setFinanceSummary(await res.json());
    }
    if (isCommission) {
      const res = await fetch('/api/enterprise-admin?view=commission-defaults', { cache: 'no-store' });
      setCommissionDefaults(await res.json());
      const cascadeRes = await fetch(
        '/api/enterprise-admin?view=commission-cascade&teacherPrice=50&service=recorded-lesson&partnerType=teacher&sourceType=TEACHER_RECORDED',
        { cache: 'no-store' },
      );
      const cascadeJson = await cascadeRes.json();
      setCommissionCascade(cascadeJson.cascade || null);
    }
    const params = new URLSearchParams({
      view: 'module',
      module: moduleId,
      q,
      status,
    });
    if (isRecordedLessons) {
      params.set('lessonSource', catalogFilters.lessonSource || 'ALL');
      params.set('country', catalogFilters.country || 'all');
      params.set('educationalSystem', catalogFilters.educationalSystem || 'all');
      params.set('curriculum', catalogFilters.curriculum || 'all');
      params.set('qualification', catalogFilters.qualification || 'all');
      params.set('grade', catalogFilters.grade || 'all');
      params.set('subjectFamily', catalogFilters.subjectFamily || 'all');
      params.set('subject', catalogFilters.subject || 'all');
      params.set('teacherGender', catalogFilters.teacherGender || 'all');
      params.set('language', catalogFilters.language || 'all');
      params.set('subtitleLanguage', catalogFilters.subtitleLanguage || 'all');
      params.set('price', catalogFilters.price || 'all');
      params.set('rating', catalogFilters.rating || 'all');
      params.set('duration', catalogFilters.duration || 'all');
      params.set('level', catalogFilters.level || 'all');
      params.set('sort', catalogFilters.sort || 'newest');
      params.set('catalogSort', catalogFilters.sort || 'newest');
    }
    const res = await fetch(`/api/enterprise-admin?${params}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load module');
    setData(await res.json());
  }, [moduleId, q, status, catalogFilters, isPermissions, isFinance, isCommission, isRecordedLessons]);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  useEffect(() => {
    if (!isRecordedLessons || !mode) {
      setPriceSplit(null);
      return;
    }
    const price = form.price;
    if (price === '' || price == null) {
      setPriceSplit(null);
      return;
    }
    const params = new URLSearchParams({
      view: 'teacher-price-split',
      teacherPrice: String(price),
      service: 'recorded-lesson',
      sourceType: form.lessonSource || 'TEACHER_RECORDED',
      currency: 'USD',
    });
    fetch(`/api/enterprise-admin?${params}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => setPriceSplit(json.split || null))
      .catch(() => setPriceSplit(null));
  }, [isRecordedLessons, mode, form.price, form.lessonSource]);

  async function runAction(action, payload = {}) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/enterprise-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          moduleId: isPermissions ? 'permissions' : moduleId,
          payload,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'action failed');
      setMode(null);
      setForm({});
      await load();
    } catch (e) {
      setError(e.message || 'action failed');
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const params = new URLSearchParams({ view: 'export', module: moduleId, q, status });
    window.open(`/api/enterprise-admin?${params}`, '_blank');
  }

  const schema = data?.schema;
  const columns = schema?.columns || [];
  const actions = schema?.actions || [];
  const fields = schema?.fields || [];

  const title = useMemo(
    () => schema?.label || moduleId.replace(/-/g, ' '),
    [schema, moduleId],
  );

  if (isPermissions) {
    return (
      <PermissionsPanel
        matrix={permMatrix}
        busy={busy}
        error={error}
        onReload={load}
        onAction={runAction}
        onCreate={(payload) => runAction('createRole', payload)}
        onToggle={(key, permission) => runAction('togglePermission', { key, permission })}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, textTransform: 'capitalize' }}>{title}</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
            Total: {data ? data.total : 'Loading…'} · Dynamic table (search / filter / export)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {actions.includes('add') || actions.includes('create') ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setMode('add');
                setForm(
                  isRecordedLessons
                    ? { status: 'DRAFT', lessonSource: 'S4S_INTELLIGENCE', price: 50 }
                    : { status: 'active' },
                );
              }}
            >
              Add
            </button>
          ) : null}
          {isPaymentSplits || actions.includes('processPayment') ? (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                const gross = Number(window.prompt('Gross amount', '100') || 0);
                if (!gross) return;
                const partnerId = window.prompt('Partner ID (optional)', '') || null;
                const partnerType = window.prompt('Partner type (optional)', 'teacher') || null;
                setBusy(true);
                try {
                  const res = await fetch('/api/enterprise-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'processPayment',
                      payload: {
                        grossAmount: gross,
                        discount: 0,
                        coupon: 0,
                        taxes: 0,
                        gatewayFees: 0,
                        partnerId,
                        partnerType,
                        currency: 'USD',
                        payoutMethod: 'manual_transfer',
                      },
                    }),
                  });
                  const json = await res.json();
                  if (!res.ok || json.ok === false) throw new Error(json.error || 'payment failed');
                  await load();
                } catch (e) {
                  setError(e.message || 'payment failed');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Process payment
            </button>
          ) : null}
          <button type="button" disabled={busy} onClick={() => load()}>
            Refresh
          </button>
          <button type="button" disabled={busy} onClick={exportCsv}>
            Export CSV
          </button>
          {selected.length ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction('bulkDelete', { ids: selected })}
            >
              Delete selected ({selected.length})
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      {isFinance && financeSummary ? <FinanceSummaryCards summary={financeSummary} /> : null}
      {(isRecordedLessons || isFinance || isPayouts) && <MarketplaceAdminReviewPanel moduleId={moduleId} />}
      {isRecordedLessons ? (
        <>
          <RecordedLessonsFilters
            filters={catalogFilters}
            facets={data?.facets}
            total={data?.total || 0}
            onChange={setCatalogFilters}
            lessonSource={catalogFilters.lessonSource}
            onLessonSourceChange={(v) =>
              setCatalogFilters((f) => ({ ...f, lessonSource: v, teacherGender: 'all' }))
            }
          />
          <RecordedLessonsSubjectResults grouped={data?.grouped} />
        </>
      ) : null}
      {isCommission && commissionDefaults ? (
        <CommissionDefaultsBar
          defaults={commissionDefaults}
          busy={busy}
          onSave={async (percent) => {
            setBusy(true);
            try {
              const res = await fetch('/api/enterprise-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'setCommissionDefaults',
                  payload: {
                    defaultCommissionPercent: percent,
                    recordedLessonCommissionPercent:
                      commissionDefaults.recordedLessonCommissionPercent ??
                      DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
                    globalCommissionPercent:
                      commissionDefaults.globalCommissionPercent ??
                      DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
                  },
                  user: 'owner',
                }),
              });
              const json = await res.json();
              if (!res.ok || json.ok === false) throw new Error(json.error || 'failed');
              setCommissionDefaults(json.defaults);
            } catch (e) {
              setError(e.message || 'failed');
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}
      {isCommission && commissionCascade ? <CommissionCascadePanel cascade={commissionCascade} /> : null}
      {isRecordedLessons && mode ? <TeacherPriceSplitPanel split={priceSplit} /> : null}

      <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          style={{ flex: 1, minWidth: 180, padding: 8, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
          <option value="">All statuses</option>
          <option value="active">active</option>
          <option value="suspended">suspended</option>
          <option value="inactive">inactive</option>
          <option value="pending">pending</option>
          <option value="queued">queued</option>
          <option value="approved">approved</option>
        </select>
      </div>

      {mode ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAction(mode === 'add' ? 'add' : 'edit', form);
          }}
          style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, marginBottom: 12 }}
        >
          <h3 style={{ marginTop: 0 }}>{mode === 'add' ? 'Add' : 'Edit'}</h3>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
            {fields.map((f) => (
              <label key={f.key} style={{ fontSize: 13 }}>
                {f.label}
                {f.type === 'select' ? (
                  <select
                    required={f.required}
                    value={form[f.key] || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
                  >
                    <option value="">Select</option>
                    {(f.options || []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : 'text'}
                    required={f.required}
                    value={form[f.key] ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                      }))
                    }
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
                  />
                )}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button type="submit" disabled={busy}>
              Save
            </button>
            <button type="button" onClick={() => setMode(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={th}>
                <input
                  type="checkbox"
                  checked={!!data?.items?.length && selected.length === data.items.length}
                  onChange={(e) =>
                    setSelected(e.target.checked ? (data.items || []).map((i) => i.id) : [])
                  }
                />
              </th>
              {columns.map((c) => (
                <th key={c.key} style={th}>
                  {c.label}
                </th>
              ))}
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} style={{ padding: 12, color: '#6b7280' }}>
                  No records yet (live empty collection).
                </td>
              </tr>
            ) : (
              (data?.items || []).map((row) => (
                <tr key={row.id}>
                  <td style={td}>
                    <input
                      type="checkbox"
                      checked={selected.includes(row.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id),
                        )
                      }
                    />
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} style={td}>
                      {Array.isArray(row[c.key]) ? row[c.key].join(', ') : String(row[c.key] ?? '—')}
                    </td>
                  ))}
                  <td style={td}>
                    <RowActions
                      actions={actions}
                      row={row}
                      runAction={runAction}
                      setMode={setMode}
                      setForm={setForm}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowActions({ actions, row, runAction, setMode, setForm }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {actions.includes('edit') ? (
        <button
          type="button"
          onClick={() => {
            setMode('edit');
            setForm(row);
          }}
        >
          Edit
        </button>
      ) : null}
      {actions.includes('suspend') ? (
        <button type="button" onClick={() => runAction('suspend', { id: row.id })}>
          Suspend
        </button>
      ) : null}
      {actions.includes('activate') ? (
        <button type="button" onClick={() => runAction('activate', { id: row.id })}>
          Activate
        </button>
      ) : null}
      {actions.includes('transfer') ? (
        <button
          type="button"
          onClick={() => {
            const grade = window.prompt('Transfer to grade', row.grade || '');
            if (grade != null) runAction('transfer', { id: row.id, grade });
          }}
        >
          Transfer
        </button>
      ) : null}
      {actions.includes('assignSubjects') ? (
        <button
          type="button"
          onClick={() => {
            const subjects = window.prompt('Subjects (comma-separated)', row.subjects || '');
            if (subjects != null) runAction('assignSubjects', { id: row.id, subjects });
          }}
        >
          Subjects
        </button>
      ) : null}
      {actions.includes('assignClasses') ? (
        <button
          type="button"
          onClick={() => {
            const classes = window.prompt('Classes', row.classes || '');
            if (classes != null) runAction('assignClasses', { id: row.id, classes });
          }}
        >
          Classes
        </button>
      ) : null}
      {actions.includes('approve') ? (
        <button type="button" onClick={() => runAction('approve', { id: row.id })}>
          Approve
        </button>
      ) : null}
      {actions.includes('reject') ? (
        <button type="button" onClick={() => runAction('reject', { id: row.id })}>
          Reject
        </button>
      ) : null}
      {actions.includes('complete') ? (
        <button type="button" onClick={() => runAction('complete', { id: row.id })}>
          Complete
        </button>
      ) : null}
      {actions.includes('comment') ? (
        <button
          type="button"
          onClick={() => {
            const body = window.prompt('Comment');
            if (body != null) runAction('comment', { id: row.id, body });
          }}
        >
          Comment
        </button>
      ) : null}
      {actions.includes('notify') || actions.includes('send') ? (
        <button
          type="button"
          onClick={() => runAction(actions.includes('send') ? 'send' : 'notify', { id: row.id })}
        >
          Notify
        </button>
      ) : null}
      {actions.includes('verify') ? (
        <button type="button" onClick={() => runAction('verify', { id: row.id, verification: 'verified' })}>
          Verify
        </button>
      ) : null}
      {actions.includes('markPaid') ? (
        <button type="button" onClick={() => runAction('markPaid', { id: row.id })}>
          Mark paid
        </button>
      ) : null}
      {actions.includes('markTransferred') ? (
        <button
          type="button"
          onClick={() => {
            const referenceNumber = window.prompt('Reference number', '') || undefined;
            runAction('markTransferred', { id: row.id, referenceNumber });
          }}
        >
          Transferred
        </button>
      ) : null}
      {actions.includes('archive') ? (
        <button type="button" onClick={() => runAction('archive', { id: row.id })}>
          Archive
        </button>
      ) : null}
      {actions.includes('restore') ? (
        <button type="button" onClick={() => runAction('restore', { id: row.id })}>
          Restore
        </button>
      ) : null}
      {actions.includes('delete') ? (
        <button type="button" onClick={() => runAction('delete', { id: row.id })}>
          Delete
        </button>
      ) : null}
      {actions.includes('permanentDelete') ? (
        <button
          type="button"
          onClick={() => {
            const step1 = window.confirm('Step 1/2: Permanently delete? This cannot be undone.');
            if (!step1) return;
            const step2 = window.prompt('Step 2/2: Type PERMANENTLY_DELETE to confirm');
            if (step2 !== 'PERMANENTLY_DELETE') return;
            runAction('permanentDelete', {
              id: row.id,
              confirmation: 'PERMANENTLY_DELETE',
              confirmSteps: 2,
              _role: 'owner',
            });
          }}
        >
          Permanent delete
        </button>
      ) : null}
    </div>
  );
}

function FinanceSummaryCards({ summary }) {
  const cards = [
    ['Revenue', summary.revenue],
    ['Expenses', summary.expenses],
    ['Payroll', summary.payroll],
    ['Profit & Loss', summary.profitLoss],
    ['Cash flow', summary.cashFlow],
    ['Partner revenue', summary.partnerRevenue],
    ['Invoices', summary.invoices],
    ['Receipts', summary.receipts],
    ['Refunds', summary.refunds],
    ['Taxes', summary.taxes],
    ['Ledger entries', summary.ledgerEntries],
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
        gap: 10,
        margin: '12px 0',
      }}
    >
      {cards.map(([label, value]) => (
        <div key={label} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{label}</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function CommissionDefaultsBar({ defaults, busy, onSave }) {
  const [percent, setPercent] = useState(defaults.defaultCommissionPercent);
  useEffect(() => {
    setPercent(defaults.defaultCommissionPercent);
  }, [defaults.defaultCommissionPercent]);
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <div style={{ fontSize: 13 }}>
        <strong>Default commission</strong> (Owner-configurable, not hardcoded)
      </div>
      <label style={{ fontSize: 13 }}>
        %
        <input
          type="number"
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          style={{ marginLeft: 6, padding: 6, width: 80 }}
        />
      </label>
      <button type="button" disabled={busy} onClick={() => onSave(percent)}>
        Save default
      </button>
      <span style={{ fontSize: 12, color: '#6b7280' }}>
        Updated {defaults.updatedAt || '—'} by {defaults.updatedBy || '—'}
      </span>
    </div>
  );
}

const th = { textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };
const td = { padding: '8px 6px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' };

function listIncludes(arr, value) {
  return Array.isArray(arr) && arr.includes(value);
}

function PermissionsPanel({ matrix, busy, error, onReload, onCreate, onToggle }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    if (!selectedKey && matrix?.roles?.length) {
      setSelectedKey(matrix.roles[0].key);
    }
  }, [matrix, selectedKey]);

  const role = (matrix?.roles || []).find((r) => r.key === selectedKey) || null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Permissions</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
            Configurable role matrix · {matrix?.flags?.length ?? 0} permission flags
          </p>
        </div>
        <button type="button" disabled={busy} onClick={() => onReload()}>
          Refresh
        </button>
      </div>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onCreate({ name, key, description, permissions: [] });
          setName('');
          setKey('');
          setDescription('');
        }}
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}
      >
        <input
          required
          placeholder="Role name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          required
          placeholder="Role key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: 8, flex: 1 }}
        />
        <button type="submit" disabled={busy}>
          Create Role
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 8 }}>
          {(matrix?.roles || []).map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setSelectedKey(r.key)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: 8,
                marginBottom: 4,
                background: selectedKey === r.key ? '#ecfdf5' : 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
              }}
            >
              {r.name}
              <div style={{ fontSize: 11, color: '#6b7280' }}>{r.permissionCount} permissions</div>
            </button>
          ))}
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>{role?.name || 'Select a role'}</h3>
          <p style={{ color: '#6b7280', fontSize: 13 }}>{role?.description}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 6 }}>
            {(matrix?.flags || []).map((flag) => {
              const on = listIncludes(role?.permissions, flag);
              return (
                <label key={flag} style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={!!on}
                    disabled={busy || !role}
                    onChange={() => onToggle(role.key, flag)}
                  />
                  {flag}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
