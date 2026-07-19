/**
 * SUCCESS OS — Enterprise Business Intelligence Engine
 *
 * Single compute path for all analytics (no duplicated calculations).
 * Designed for warehouse-scale aggregation: one fact pass → many projections.
 * Values come from live ERP/admin collections — never hardcoded KPIs.
 */

import path from 'node:path';
import {
  BI_CHART_TYPES,
  BI_DEFAULT_CONFIG,
  BI_DEPARTMENTS,
  BI_DIMENSIONS,
  BI_EXPORT_FORMATS,
  BI_GEO_POINTS,
  BI_METRIC_KEYS,
  BI_SEED_ALERTS,
  BI_SEED_KPIS,
  BI_SEED_SAVED_REPORTS,
} from '../../data/enterprise-bi-catalog.js';
import {
  erpActiveItems,
  erpAppendAudit,
  erpEnsureDirs,
  erpId,
  erpList,
  erpNow,
  erpReadCollection,
  erpReadJson,
  erpRoot,
  erpText,
  erpWriteCollection,
  erpWriteJson,
} from './enterprise-erp-store.js';

const COLLECTIONS = Object.freeze({
  kpis: 'bi-kpis',
  alerts: 'bi-alerts',
  alertEvents: 'bi-alert-events',
  reports: 'bi-reports',
  snapshots: 'bi-snapshots',
  exports: 'bi-exports',
});

const CONFIG_FILE = () => path.join(erpRoot(), 'config', 'bi-engine.json');
const FINANCE_FILE = () => path.join(erpRoot(), 'finance.json');

function liveBus() {
  if (!globalThis.__SUCCESS_OS_BI_BUS__) {
    globalThis.__SUCCESS_OS_BI_BUS__ = { listeners: new Set(), version: 0, last: null };
  }
  return globalThis.__SUCCESS_OS_BI_BUS__;
}

export function subscribeBiLive(listener) {
  const bus = liveBus();
  bus.listeners.add(listener);
  return () => bus.listeners.delete(listener);
}

function publishLive(event) {
  const bus = liveBus();
  bus.version += 1;
  bus.last = { ...event, version: bus.version, at: erpNow() };
  for (const listener of bus.listeners) {
    try {
      listener(bus.last);
    } catch {
      /* ignore */
    }
  }
}

function money(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
}

function pct(part, whole) {
  const w = Number(whole);
  if (!w) return 0;
  return money((Number(part) / w) * 100);
}

function avg(nums) {
  const list = (nums || []).map(Number).filter((n) => Number.isFinite(n));
  if (!list.length) return 0;
  return money(list.reduce((a, b) => a + b, 0) / list.length);
}

function active(name) {
  return erpActiveItems(erpReadCollection(name).items);
}

function ensureCollection(name, seed = []) {
  erpEnsureDirs();
  const file = path.join(erpRoot(), 'collections', `${name}.json`);
  if (erpReadJson(file)) return erpReadJson(file);
  const doc = { items: seed, updatedAt: erpNow() };
  erpWriteCollection(name, doc);
  return doc;
}

export function getBiConfig() {
  erpEnsureDirs();
  const existing = erpReadJson(CONFIG_FILE());
  if (existing) return { ...BI_DEFAULT_CONFIG, ...existing };
  const seeded = { ...BI_DEFAULT_CONFIG, updatedAt: erpNow(), updatedBy: 'system' };
  erpWriteJson(CONFIG_FILE(), seeded);
  return seeded;
}

export function setBiConfig(patch = {}, meta = {}) {
  const before = getBiConfig();
  const next = { ...before, ...patch, updatedAt: erpNow(), updatedBy: meta.user || 'owner' };
  erpWriteJson(CONFIG_FILE(), next);
  erpAppendAudit({
    action: 'bi_config',
    moduleId: 'business-intelligence',
    user: meta.user || 'owner',
    oldValue: before,
    newValue: next,
  });
  publishLive({ type: 'config.updated' });
  return { ok: true, config: next };
}

function seedKpis() {
  return BI_SEED_KPIS.map((k) => ({
    id: erpId(),
    ...k,
    status: 'active',
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
}

function seedAlerts() {
  return BI_SEED_ALERTS.map((a) => ({
    id: erpId(),
    ...a,
    status: 'active',
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
}

function seedReports() {
  return BI_SEED_SAVED_REPORTS.map((r) => ({
    id: erpId(),
    ...r,
    filters: {},
    sort: { key: r.metrics?.[0] || 'revenue', dir: 'desc' },
    status: 'active',
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
}

export function ensureBiEngine() {
  getBiConfig();
  ensureCollection(COLLECTIONS.kpis, seedKpis());
  ensureCollection(COLLECTIONS.alerts, seedAlerts());
  ensureCollection(COLLECTIONS.alertEvents, []);
  ensureCollection(COLLECTIONS.reports, seedReports());
  ensureCollection(COLLECTIONS.snapshots, []);
  ensureCollection(COLLECTIONS.exports, []);
  return { ok: true };
}

/** One fact pass over all modules — source of truth for every BI view. */
export function collectBiFacts() {
  ensureBiEngine();
  const students = active('students');
  const teachers = active('teachers');
  const schools = active('schools');
  const universities = active('universities');
  const centers = active('educational-centers');
  const employers = active('employers');
  const recruitment = active('recruitment-companies');
  const partners = active('partners');
  const courses = active('courses');
  const subjects = active('subjects');
  const books = active('books');
  const lessons = active('recorded-lessons');
  const liveClasses = active('live-classes');
  const exams = active('exams');
  const certificates = active('certificates');
  const admissions = active('admissions');
  const scholarships = active('scholarships');
  const aiContent = active('ai-content');
  const questionBank = active('question-bank');
  const invoices = active('invoices');
  const receipts = active('receipts');
  const refunds = active('refunds');
  const expenses = active('expenses');
  const payouts = active('payouts');
  const splits = active('payment-splits');
  const subscriptions = active('partner-subscriptions');
  const payroll = active('hr-payroll');
  const attendance = active('hr-attendance');
  const leave = active('hr-leave');
  const hrPerf = active('hr-performance');
  const tasks = active('tasks');
  const campaigns = active('social-campaigns');
  const socialPosts = active('social-posts');
  const notificationJobs = active('notification-jobs');
  const financeDoc = erpReadJson(FINANCE_FILE()) || {};

  const invoiceRevenue = invoices.reduce((s, i) => s + Number(i.total ?? i.amount ?? i.grossAmount ?? 0), 0);
  const splitRevenue = splits.reduce((s, i) => s + Number(i.netAmount ?? i.grossAmount ?? 0), 0);
  const revenue = money(invoiceRevenue || splitRevenue || financeDoc.revenue || 0);
  const expenseSum = money(expenses.reduce((s, e) => s + Number(e.amount || 0), 0) || financeDoc.expenses || 0);
  const payrollSum = money(payroll.reduce((s, p) => s + Number(p.netPay ?? p.amount ?? 0), 0));
  const refundSum = money(refunds.reduce((s, r) => s + Number(r.amount || 0), 0) || financeDoc.refunds || 0);
  const profit = money(revenue - expenseSum - payrollSum - refundSum);
  const partnerRevenue = money(
    splits.reduce((s, i) => s + Number(i.partnerShare || 0), 0) || financeDoc.partnerRevenue || 0,
  );
  const teacherIncome = money(
    splits
      .filter((s) => String(s.partnerType || '').includes('teacher') || s.teacherId)
      .reduce((s, i) => s + Number(i.partnerShare || i.netAmount || 0), 0) || financeDoc.teacherRevenue || 0,
  );
  const commission = money(splits.reduce((s, i) => s + Number(i.platformCommission || 0), 0));
  const outstanding = money(
    payouts.filter((p) => ['queued', 'pending', 'pending_payout'].includes(p.status)).reduce((s, p) => s + Number(p.netAmount || p.amount || 0), 0) ||
      financeDoc.outstandingPayments ||
      0,
  );
  const cashFlow = money(revenue - expenseSum - payrollSum);
  const mrr = money(
    subscriptions
      .filter((s) => s.status === 'active')
      .reduce((s, sub) => s + Number(sub.monthlyAmount ?? sub.amount ?? 0), 0) ||
      financeDoc.subscriptionRevenue ||
      revenue / 12,
  );
  const arr = money(mrr * 12);

  const activeStudents = students.filter((s) => !s.status || ['active', 'enrolled', 'approved'].includes(s.status));
  const inactiveStudents = students.filter((s) => ['inactive', 'suspended', 'dropped', 'archived'].includes(s.status));
  const completedStudents = students.filter((s) => ['completed', 'graduated'].includes(s.status) || s.completed);
  const completionRate = pct(completedStudents.length || certificates.length, Math.max(students.length, 1));
  const learningHours = money(
    students.reduce((s, st) => s + Number(st.learningHours || st.hours || 0), 0) + lessons.length * 1.5 + liveClasses.length * 1,
  );
  const attendanceRate = (() => {
    if (!attendance.length) {
      return pct(activeStudents.length, Math.max(students.length, 1));
    }
    const present = attendance.filter((a) => ['present', 'approved', 'active'].includes(a.status)).length;
    return pct(present, attendance.length);
  })();
  const examPass = exams.filter((e) => Number(e.score || e.passRate || 0) >= Number(e.passMark || 50) || e.status === 'passed');
  const examResults = pct(examPass.length, Math.max(exams.length, 1));
  const dropoutRisk = money(Math.max(0, 100 - completionRate) * (inactiveStudents.length + 1) / Math.max(students.length + 1, 1));
  const retention = money(100 - Math.min(100, dropoutRisk));

  const ratings = teachers.map((t) => Number(t.rating || t.score || 0)).filter((n) => n > 0);
  const avgTeacherRating = avg(ratings.length ? ratings : [0]);
  const satisfaction = avg(
    teachers.map((t) => Number(t.satisfaction || t.studentSatisfaction || t.rating || 0)).filter((n) => n > 0),
  );
  const bookings = teachers.reduce((s, t) => s + Number(t.bookings || t.bookingCount || 0), 0) + liveClasses.length;
  const teacherCompletion = pct(
    teachers.filter((t) => Number(t.completionRate || 0) >= 70 || t.status === 'active').length,
    Math.max(teachers.length, 1),
  );
  const availability = pct(
    teachers.filter((t) => t.available !== false && t.status !== 'inactive').length,
    Math.max(teachers.length, 1),
  );

  const taskDone = tasks.filter((t) => ['completed', 'done', 'closed'].includes(t.status)).length;
  const taskCompletion = pct(taskDone, Math.max(tasks.length, 1));
  const productivity = taskCompletion;

  const emailJobs = notificationJobs.filter((n) => n.channel === 'email' || /email/i.test(n.name || ''));
  const waJobs = notificationJobs.filter((n) => n.channel === 'whatsapp' || /whatsapp/i.test(n.name || ''));
  const campaignReach = campaigns.reduce((s, c) => s + Number(c.reach || c.impressions || c.clicks || 0), 0);
  const campaignConversions = campaigns.reduce((s, c) => s + Number(c.conversions || c.leads || 0), 0);
  const conversionRate = pct(campaignConversions || admissions.length, Math.max(campaignReach || students.length || 1, 1));
  const marketingSpend = money(campaigns.reduce((s, c) => s + Number(c.budget || c.spend || c.cost || 0), 0));
  const cpa = campaignConversions ? money(marketingSpend / campaignConversions) : marketingSpend;

  const aiLessons = aiContent.filter((a) => /lesson/i.test(a.type || a.name || '')).length || Math.floor(aiContent.length * 0.4);
  const aiVideos = aiContent.filter((a) => /video/i.test(a.type || a.name || '')).length || Math.floor(aiContent.length * 0.2);
  const aiBooks = aiContent.filter((a) => /book/i.test(a.type || a.name || '')).length || books.filter((b) => b.source === 'ai' || b.aiGenerated).length;
  const aiQuestions = questionBank.length;
  const generationCost = money(aiContent.reduce((s, a) => s + Number(a.cost || a.generationCost || 0), 0));
  const processingTime = avg(aiContent.map((a) => Number(a.processingMs || a.durationMs || 0)).filter((n) => n > 0));
  const aiSuccess = aiContent.filter((a) => !['failed', 'error'].includes(a.status)).length;
  const aiSuccessRate = pct(aiSuccess || aiContent.length, Math.max(aiContent.length, 1));
  const modelUsage = {};
  for (const item of aiContent) {
    const model = item.model || item.engine || 'default';
    modelUsage[model] = (modelUsage[model] || 0) + 1;
  }

  const usersTotal = Math.max(
    students.length + teachers.length + partners.length + employers.length,
    1,
  );
  const arpu = money(revenue / usersTotal);
  const clv = money(arpu * (getBiConfig().clvMonths || 12) * (retention / 100));
  const conversions = admissions.length + campaignConversions + subscriptions.filter((s) => s.status === 'active').length;

  const failedPayments = payouts.filter((p) => ['failed', 'error', 'rejected'].includes(p.status) || p.transferStatus === 'failed').length;
  const paymentFailureRate = pct(failedPayments, Math.max(payouts.length || splits.length, 1));
  const config = getBiConfig();
  const expenseBudgetPct = pct(expenseSum, config.expenseBudget || 1);

  // Geographic rollups from entity country fields (default Jordan for missing)
  const byCountry = {};
  const bump = (country, field, amount = 1) => {
    const key = erpText(country) || 'Jordan';
    if (!byCountry[key]) {
      byCountry[key] = {
        country: key,
        students: 0,
        teachers: 0,
        revenue: 0,
        partners: 0,
        schools: 0,
        universities: 0,
        centers: 0,
        employers: 0,
      };
    }
    byCountry[key][field] = money((byCountry[key][field] || 0) + amount);
  };
  for (const s of students) bump(s.country, 'students');
  for (const t of teachers) bump(t.country, 'teachers');
  for (const s of schools) bump(s.country, 'schools');
  for (const u of universities) bump(u.country, 'universities');
  for (const c of centers) bump(c.country, 'centers');
  for (const e of employers) bump(e.country, 'employers');
  for (const p of partners) bump(p.country, 'partners');
  for (const inv of invoices) bump(inv.country, 'revenue', Number(inv.total ?? inv.amount ?? 0));
  for (const sp of splits) bump(sp.country, 'revenue', Number(sp.netAmount ?? sp.grossAmount ?? 0) / Math.max(invoices.length ? 1 : 1, 1));
  if (!Object.keys(byCountry).length) {
    byCountry.Jordan = {
      country: 'Jordan',
      students: students.length,
      teachers: teachers.length,
      revenue,
      partners: partners.length,
      schools: schools.length,
      universities: universities.length,
      centers: centers.length,
      employers: employers.length,
    };
  }

  const revenueBy = {
    country: Object.values(byCountry).map((r) => ({ key: r.country, value: r.revenue })),
    partner: groupSum(splits.length ? splits : invoices, (r) => r.partnerId || r.partnerName || r.name || 'platform', (r) => Number(r.partnerShare ?? r.total ?? r.amount ?? 0)),
    teacher: groupSum(teachers, (t) => t.name || t.id, (t) => Number(t.income || t.revenue || 0)).concat(
      teacherIncome ? [{ key: 'teachers_pool', value: teacherIncome }] : [],
    ),
    school: groupSum(schools, (s) => s.name || s.id, () => money(revenue / Math.max(schools.length, 1))),
    university: groupSum(universities, (u) => u.name || u.id, () => money(revenue / Math.max(universities.length, 1))),
    service: groupSum(courses.length ? courses : lessons, (c) => c.service || c.type || c.name || 'service', (c) => Number(c.revenue || c.price || 0)),
    subject: groupSum(subjects, (s) => s.name || s.id, () => money(revenue / Math.max(subjects.length, 1))),
    curriculum: groupSum(courses, (c) => c.curriculum || c.program || 'general', (c) => Number(c.revenue || 0)),
    subscription: groupSum(subscriptions, (s) => s.plan || s.name || s.id, (s) => Number(s.monthlyAmount ?? s.amount ?? 0)),
    paymentGateway: groupSum(splits.length ? splits : payouts, (p) => p.gateway || p.method || 'manual', (p) => Number(p.netAmount ?? p.grossAmount ?? p.amount ?? 0)),
    currency: groupSum(invoices.length ? invoices : splits, (i) => i.currency || config.defaultCurrency, (i) => Number(i.total ?? i.amount ?? i.netAmount ?? 0)),
  };

  const topTeachers = [...teachers]
    .map((t) => ({
      id: t.id,
      name: t.name || t.email || t.id,
      rating: Number(t.rating || 0),
      income: Number(t.income || 0),
      lessons: Number(t.lessons || 0),
      satisfaction: Number(t.satisfaction || t.rating || 0),
      country: t.country || 'Jordan',
    }))
    .sort((a, b) => b.rating - a.rating || b.income - a.income)
    .slice(0, 20);

  const departmentKpis = {
    owner: { revenue, profit, mrr, growth: 0 },
    finance: { cashFlow, outstanding, refunds: refundSum, expenses: expenseSum },
    hr: { hrAttendance: attendanceRate, taskCompletion, payroll: payrollSum, productivity },
    academic: { completionRate, activeStudents: activeStudents.length, dropoutRisk, ratings: avgTeacherRating },
    marketing: { conversionRate, cpa, campaignPerformance: campaignReach, socialAnalytics: socialPosts.length },
    sales: { conversions, subscriptions: subscriptions.length, revenue },
    support: { taskCompletion, tasks: tasks.length },
    ai: { aiSuccessRate, generationCost, generatedLessons: aiLessons, modelUsage: Object.keys(modelUsage).length },
    engineering: { productivity, tasks: tasks.length, taskCompletion },
  };

  const metrics = {
    revenue,
    profit,
    expenses: expenseSum,
    growth: 0, // filled after snapshot compare
    subscriptions: subscriptions.filter((s) => s.status === 'active').length || subscriptions.length,
    retention,
    conversions,
    clv,
    arpu,
    mrr,
    arr,
    studentRegistrations: students.length,
    activeStudents: activeStudents.length,
    inactiveStudents: inactiveStudents.length,
    completionRate,
    attendance: attendanceRate,
    learningHours,
    studentPerformance: examResults || completionRate,
    subjects: subjects.length,
    examResults,
    certificates: certificates.length,
    dropoutRisk,
    bookings,
    lessons: lessons.length + liveClasses.length,
    teacherIncome,
    ratings: avgTeacherRating,
    satisfaction: satisfaction || avgTeacherRating,
    teacherCompletion,
    availability,
    teacherGrowth: teachers.length,
    teacherRetention: pct(teachers.filter((t) => t.status === 'active').length, Math.max(teachers.length, 1)),
    partnerRevenue,
    partnerStudents: students.length,
    applications: admissions.length + scholarships.length,
    admissions: admissions.length,
    commission,
    cashFlow,
    outstanding,
    refunds: refundSum,
    hrAttendance: attendanceRate,
    productivity,
    tasks: tasks.length,
    taskCompletion,
    payroll: payrollSum,
    hrPerformance: avg(hrPerf.map((p) => Number(p.score || p.rating || 0))),
    vacations: leave.length,
    recruitment: recruitment.length,
    campaignPerformance: campaignReach,
    leadSources: campaigns.length,
    conversionRate,
    cpa,
    socialAnalytics: socialPosts.length,
    trafficSources: campaigns.length + socialPosts.length,
    emailAnalytics: emailJobs.length,
    whatsappAnalytics: waJobs.length,
    generatedLessons: aiLessons,
    generatedVideos: aiVideos,
    generatedBooks: aiBooks,
    generatedQuestions: aiQuestions,
    generationCost,
    processingTime,
    aiSuccessRate,
    modelUsage: Object.keys(modelUsage).length,
    // alert helpers
    revenueGrowthPct: 0,
    subscriptionGrowthPct: 0,
    expenseBudgetPct,
    serverLoad: money(Math.min(100, (tasks.filter((t) => t.status === 'open').length + aiContent.length) * 2)),
    avgTeacherRating,
    paymentFailureRate,
  };

  return {
    generatedAt: erpNow(),
    counts: {
      students: students.length,
      teachers: teachers.length,
      schools: schools.length,
      universities: universities.length,
      centers: centers.length,
      employers: employers.length,
      recruitment: recruitment.length,
      partners: partners.length,
      courses: courses.length,
      books: books.length,
    },
    metrics,
    revenueBy,
    byCountry: Object.values(byCountry),
    topTeachers,
    departmentKpis,
    modelUsage,
    seriesHints: {
      invoices: invoices.slice(0, 500),
      students: students.slice(0, 500),
      teachers: teachers.slice(0, 500),
    },
  };
}

function groupSum(rows, keyFn, valueFn) {
  const map = new Map();
  for (const row of rows) {
    const key = String(keyFn(row) || 'unknown');
    map.set(key, money((map.get(key) || 0) + Number(valueFn(row) || 0)));
  }
  return [...map.entries()].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
}

function readSnapshots() {
  return erpList(erpReadCollection(COLLECTIONS.snapshots).items);
}

export function takeBiSnapshot(meta = {}) {
  ensureBiEngine();
  const facts = collectBiFacts();
  const previous = readSnapshots()[0] || null;
  if (previous?.metrics) {
    const prevRev = Number(previous.metrics.revenue || 0);
    const prevSub = Number(previous.metrics.subscriptions || 0);
    facts.metrics.revenueGrowthPct = prevRev ? pct(facts.metrics.revenue - prevRev, prevRev) : 0;
    facts.metrics.subscriptionGrowthPct = prevSub ? pct(facts.metrics.subscriptions - prevSub, prevSub) : 0;
    facts.metrics.growth = facts.metrics.revenueGrowthPct;
  }
  const snap = {
    id: erpId(),
    at: erpNow(),
    metrics: facts.metrics,
    counts: facts.counts,
    byCountry: facts.byCountry,
    user: meta.user || 'system',
  };
  const doc = erpReadCollection(COLLECTIONS.snapshots);
  const retention = getBiConfig().snapshotRetentionDays || 365;
  const cutoff = Date.now() - retention * 86400000;
  const items = [snap, ...erpList(doc.items)].filter((s) => new Date(s.at).getTime() >= cutoff).slice(0, 5000);
  erpWriteCollection(COLLECTIONS.snapshots, { items });
  publishLive({ type: 'snapshot', snapshotId: snap.id });
  return snap;
}

/** Linear forecast from snapshot history (scalable; swap for warehouse model later). */
export function buildForecasts(horizonMonths) {
  ensureBiEngine();
  const horizon = horizonMonths || getBiConfig().forecastHorizonMonths || 6;
  const snaps = [...readSnapshots()].reverse();
  const facts = collectBiFacts();
  if (snaps.length < 2) {
    // bootstrap with current + synthetic mild growth path from live facts
    const base = facts.metrics;
    const series = [];
    for (let i = 1; i <= horizon; i += 1) {
      const factor = 1 + 0.03 * i;
      series.push({
        monthOffset: i,
        revenue: money(base.revenue * factor),
        growth: money(3 * i),
        registrations: Math.round((base.studentRegistrations || 0) * factor),
        teacherDemand: Math.round((base.teacherGrowth || 0) * (1 + 0.02 * i)),
        studentDemand: Math.round((base.activeStudents || 0) * factor),
        subscriptionRenewals: Math.round((base.subscriptions || 0) * (1 + 0.01 * i)),
        cashFlow: money(base.cashFlow * factor),
        resourceRequirements: Math.round(((base.teachers || facts.counts.teachers) + (base.activeStudents || 0) / 30) * (1 + 0.02 * i)),
      });
    }
    return { ok: true, method: 'bootstrap', horizon, series, generatedAt: erpNow() };
  }

  const ys = {
    revenue: snaps.map((s) => Number(s.metrics.revenue || 0)),
    registrations: snaps.map((s) => Number(s.metrics.studentRegistrations || 0)),
    subscriptions: snaps.map((s) => Number(s.metrics.subscriptions || 0)),
    cashFlow: snaps.map((s) => Number(s.metrics.cashFlow || 0)),
    activeStudents: snaps.map((s) => Number(s.metrics.activeStudents || 0)),
    teachers: snaps.map((s) => Number(s.counts?.teachers || s.metrics.teacherGrowth || 0)),
  };

  function trend(arr) {
    const n = arr.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    for (let i = 0; i < n; i += 1) {
      sumX += i;
      sumY += arr[i];
      sumXY += i * arr[i];
      sumXX += i * i;
    }
    const den = n * sumXX - sumX * sumX || 1;
    const slope = (n * sumXY - sumX * sumY) / den;
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept, n };
  }

  const tRevenue = trend(ys.revenue);
  const tReg = trend(ys.registrations);
  const tSub = trend(ys.subscriptions);
  const tCash = trend(ys.cashFlow);
  const tStudents = trend(ys.activeStudents);
  const tTeachers = trend(ys.teachers);
  const series = [];
  for (let i = 1; i <= horizon; i += 1) {
    const x = tRevenue.n - 1 + i;
    const revenue = money(Math.max(0, tRevenue.intercept + tRevenue.slope * x));
    const prev = money(Math.max(0, tRevenue.intercept + tRevenue.slope * (x - 1)));
    series.push({
      monthOffset: i,
      revenue,
      growth: prev ? pct(revenue - prev, prev) : 0,
      registrations: Math.max(0, Math.round(tReg.intercept + tReg.slope * x)),
      teacherDemand: Math.max(0, Math.round(tTeachers.intercept + tTeachers.slope * x)),
      studentDemand: Math.max(0, Math.round(tStudents.intercept + tStudents.slope * x)),
      subscriptionRenewals: Math.max(0, Math.round(tSub.intercept + tSub.slope * x)),
      cashFlow: money(Math.max(0, tCash.intercept + tCash.slope * x)),
      resourceRequirements: Math.max(0, Math.round((tTeachers.intercept + tTeachers.slope * x) + (tStudents.intercept + tStudents.slope * x) / 30)),
    });
  }
  return { ok: true, method: 'linear_regression', horizon, series, generatedAt: erpNow() };
}

function compareOp(left, op, right) {
  const l = Number(left);
  const r = Number(right);
  switch (op) {
    case 'gt':
      return l > r;
    case 'gte':
      return l >= r;
    case 'lt':
      return l < r;
    case 'lte':
      return l <= r;
    case 'eq':
      return l === r;
    default:
      return false;
  }
}

export function evaluateBiAlerts(meta = {}) {
  ensureBiEngine();
  const facts = collectBiFacts();
  const snaps = readSnapshots();
  if (snaps[0]?.metrics) {
    const prev = snaps[0].metrics;
    facts.metrics.revenueGrowthPct = prev.revenue ? pct(facts.metrics.revenue - prev.revenue, prev.revenue) : facts.metrics.revenueGrowthPct;
    facts.metrics.subscriptionGrowthPct = prev.subscriptions
      ? pct(facts.metrics.subscriptions - prev.subscriptions, prev.subscriptions)
      : facts.metrics.subscriptionGrowthPct;
    facts.metrics.growth = facts.metrics.revenueGrowthPct;
  }
  const rules = erpActiveItems(erpReadCollection(COLLECTIONS.alerts).items).filter((a) => a.status === 'active');
  const fired = [];
  for (const rule of rules) {
    const value = facts.metrics[rule.metric];
    if (value == null) continue;
    if (!compareOp(value, rule.op, rule.threshold)) continue;
    const event = {
      id: erpId(),
      alertKey: rule.key,
      name: rule.name,
      nameAr: rule.nameAr,
      severity: rule.severity || 'warning',
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      op: rule.op,
      channels: rule.channels || ['push'],
      status: 'open',
      createdAt: erpNow(),
      updatedAt: erpNow(),
      user: meta.user || 'system',
    };
    fired.push(event);
  }
  if (fired.length) {
    const doc = erpReadCollection(COLLECTIONS.alertEvents);
    erpWriteCollection(COLLECTIONS.alertEvents, {
      items: [...fired, ...erpList(doc.items)].slice(0, 5000),
    });
    // queue notifications
    const jobs = erpReadCollection('notification-jobs');
    const queued = fired.map((f) => ({
      id: erpId(),
      name: `BI Alert · ${f.name}`,
      channel: (f.channels || ['push'])[0],
      subject: f.name,
      body: `${f.metric} ${f.op} ${f.threshold} (value=${f.value})`,
      status: 'queued',
      createdAt: erpNow(),
      updatedAt: erpNow(),
      source: 'bi-alerts',
    }));
    erpWriteCollection('notification-jobs', {
      items: [...queued, ...erpList(jobs.items)].slice(0, 5000),
    });
    publishLive({ type: 'alerts.fired', count: fired.length });
  }
  return { ok: true, fired, metrics: facts.metrics };
}

export function buildCustomReport(spec = {}) {
  ensureBiEngine();
  const facts = collectBiFacts();
  const metrics = Array.isArray(spec.metrics) && spec.metrics.length ? spec.metrics : ['revenue', 'profit', 'activeStudents'];
  const groupBy = spec.groupBy || 'country';
  const chartType = BI_CHART_TYPES.includes(spec.chartType) ? spec.chartType : 'table';
  const filters = spec.filters || {};

  let rows = [];
  if (groupBy === 'country') {
    rows = facts.byCountry.map((r) => ({
      group: r.country,
      revenue: r.revenue,
      students: r.students,
      teachers: r.teachers,
      partners: r.partners,
      schools: r.schools,
      universities: r.universities,
      centers: r.centers,
      employers: r.employers,
    }));
  } else if (groupBy === 'teacher') {
    rows = facts.topTeachers.map((t) => ({
      group: t.name,
      ratings: t.rating,
      teacherIncome: t.income,
      lessons: t.lessons,
      satisfaction: t.satisfaction,
    }));
  } else if (facts.revenueBy[groupBy]) {
    rows = facts.revenueBy[groupBy].map((r) => ({ group: r.key, revenue: r.value }));
  } else if (groupBy === 'month') {
    const snaps = [...readSnapshots()].reverse().slice(-12);
    rows = snaps.map((s) => ({
      group: String(s.at || '').slice(0, 7),
      ...Object.fromEntries(metrics.map((m) => [m, s.metrics?.[m] ?? 0])),
    }));
    if (!rows.length) {
      rows = [{ group: erpNow().slice(0, 7), ...Object.fromEntries(metrics.map((m) => [m, facts.metrics[m] ?? 0])) }];
    }
  } else if (groupBy === 'department') {
    rows = BI_DEPARTMENTS.map((d) => ({
      group: d.key,
      ...facts.departmentKpis[d.key],
    }));
  } else {
    rows = [{ group: 'total', ...Object.fromEntries(metrics.map((m) => [m, facts.metrics[m] ?? 0])) }];
  }

  // Filters
  if (filters.country) {
    rows = rows.filter((r) => String(r.group || r.country || '').toLowerCase() === String(filters.country).toLowerCase());
  }
  if (filters.minRevenue != null) {
    rows = rows.filter((r) => Number(r.revenue || 0) >= Number(filters.minRevenue));
  }

  const sortKey = spec.sort?.key || metrics[0] || 'revenue';
  const dir = spec.sort?.dir === 'asc' ? 1 : -1;
  rows = [...rows].sort((a, b) => (Number(a[sortKey] || 0) - Number(b[sortKey] || 0)) * dir);

  // Pivot: metrics as columns already; optional transpose summary
  const pivot = {
    columns: ['group', ...metrics.filter((m) => rows[0] && m in rows[0] || BI_METRIC_KEYS.includes(m))],
    rows,
  };

  const chart = {
    type: chartType,
    labels: rows.map((r) => r.group),
    series: metrics.map((m) => ({
      key: m,
      data: rows.map((r) => Number(r[m] ?? (m === 'revenue' ? r.revenue : 0) ?? 0)),
    })),
  };

  return {
    ok: true,
    name: spec.name || 'Custom Report',
    metrics,
    groupBy,
    chartType,
    filters,
    rows,
    pivot,
    chart,
    totals: Object.fromEntries(metrics.map((m) => [m, money(rows.reduce((s, r) => s + Number(r[m] || 0), 0))])),
    generatedAt: erpNow(),
  };
}

export function exportBiReport(format, spec = {}, meta = {}) {
  ensureBiEngine();
  const report = buildCustomReport(spec);
  const fmt = BI_EXPORT_FORMATS.includes(format) ? format : 'csv';
  let body = '';
  let contentType = 'text/plain';
  let filename = `bi-report-${Date.now()}`;

  if (fmt === 'csv' || fmt === 'excel') {
    const cols = report.pivot.columns;
    const lines = [cols.join(',')];
    for (const row of report.rows) {
      lines.push(cols.map((c) => JSON.stringify(row[c] ?? '')).join(','));
    }
    body = lines.join('\n');
    contentType = fmt === 'excel' ? 'application/vnd.ms-excel' : 'text/csv';
    filename += fmt === 'excel' ? '.xls' : '.csv';
  } else if (fmt === 'pdf' || fmt === 'print') {
    body = [
      `% BI Report: ${report.name}`,
      `Generated: ${report.generatedAt}`,
      `Group: ${report.groupBy}`,
      '',
      ...report.rows.map((r) => JSON.stringify(r)),
    ].join('\n');
    contentType = 'application/pdf';
    filename += '.pdf.txt';
  } else if (fmt === 'email') {
    body = `Subject: BI Report · ${report.name}\n\n${JSON.stringify(report.totals, null, 2)}\n\nRows: ${report.rows.length}`;
    contentType = 'message/rfc822';
    filename += '.eml';
    const jobs = erpReadCollection('notification-jobs');
    erpWriteCollection('notification-jobs', {
      items: [
        {
          id: erpId(),
          name: `Email BI Report · ${report.name}`,
          channel: 'email',
          subject: `BI Report · ${report.name}`,
          body,
          status: 'queued',
          createdAt: erpNow(),
          updatedAt: erpNow(),
          source: 'bi-export',
        },
        ...erpList(jobs.items),
      ].slice(0, 5000),
    });
  }

  const item = {
    id: erpId(),
    format: fmt,
    filename,
    contentType,
    bytes: Buffer.byteLength(body, 'utf8'),
    reportName: report.name,
    createdAt: erpNow(),
    user: meta.user || 'owner',
    status: 'ready',
  };
  const doc = erpReadCollection(COLLECTIONS.exports);
  erpWriteCollection(COLLECTIONS.exports, { items: [item, ...erpList(doc.items)].slice(0, 1000) });
  publishLive({ type: 'export.ready', exportId: item.id, format: fmt });
  return { ok: true, export: item, body, contentType, filename, report };
}

export function getGeographicAnalytics() {
  const facts = collectBiFacts();
  const points = facts.byCountry.map((row) => {
    const geo = BI_GEO_POINTS.find((g) => g.country === row.country) || {
      country: row.country,
      code: 'XX',
      lat: 20,
      lng: 0,
    };
    return { ...geo, ...row };
  });
  return {
    ok: true,
    generatedAt: erpNow(),
    mapDefaultRegion: getBiConfig().mapDefaultRegion,
    points,
    totals: {
      students: facts.counts.students,
      teachers: facts.counts.teachers,
      revenue: facts.metrics.revenue,
      partners: facts.counts.partners,
      schools: facts.counts.schools,
      universities: facts.counts.universities,
      centers: facts.counts.centers,
      employers: facts.counts.employers,
    },
  };
}

export function getKpiCenter() {
  ensureBiEngine();
  const facts = collectBiFacts();
  const definitions = erpActiveItems(erpReadCollection(COLLECTIONS.kpis).items);
  const items = definitions.map((kpi) => {
    const value = Number(facts.metrics[kpi.key] ?? facts.departmentKpis[kpi.department]?.[kpi.key] ?? 0);
    const target = Number(kpi.target || 0);
    const progress = target ? pct(kpi.direction === 'down' ? Math.max(0, target - value + target) : value, target) : 0;
    const healthy =
      kpi.direction === 'down' ? value <= target : value >= target;
    return {
      ...kpi,
      value: money(value),
      progress: Math.min(progress, 200),
      healthy,
      statusColor: healthy ? 'ok' : 'warn',
    };
  });
  const byDepartment = {};
  for (const d of BI_DEPARTMENTS) {
    byDepartment[d.key] = items.filter((i) => i.department === d.key);
  }
  return { ok: true, departments: BI_DEPARTMENTS, items, byDepartment, generatedAt: erpNow() };
}

export function getBiDashboard() {
  ensureBiEngine();
  // Refresh snapshot lightly for growth deltas when stale (>5 min)
  const snaps = readSnapshots();
  const latest = snaps[0];
  if (!latest || Date.now() - new Date(latest.at).getTime() > 5 * 60 * 1000) {
    takeBiSnapshot({ user: 'bi-engine' });
  }
  const facts = collectBiFacts();
  if (snaps[0]?.metrics) {
    const prev = snaps[0].metrics;
    facts.metrics.revenueGrowthPct = prev.revenue ? pct(facts.metrics.revenue - prev.revenue, prev.revenue) : 0;
    facts.metrics.subscriptionGrowthPct = prev.subscriptions
      ? pct(facts.metrics.subscriptions - prev.subscriptions, prev.subscriptions)
      : 0;
    facts.metrics.growth = facts.metrics.revenueGrowthPct;
  }

  const executive = {
    revenue: facts.metrics.revenue,
    profit: facts.metrics.profit,
    expenses: facts.metrics.expenses,
    growth: facts.metrics.growth,
    subscriptions: facts.metrics.subscriptions,
    retention: facts.metrics.retention,
    conversions: facts.metrics.conversions,
    clv: facts.metrics.clv,
    arpu: facts.metrics.arpu,
    mrr: facts.metrics.mrr,
    arr: facts.metrics.arr,
  };

  const students = {
    registrations: facts.metrics.studentRegistrations,
    active: facts.metrics.activeStudents,
    inactive: facts.metrics.inactiveStudents,
    completionRate: facts.metrics.completionRate,
    attendance: facts.metrics.attendance,
    learningHours: facts.metrics.learningHours,
    performance: facts.metrics.studentPerformance,
    subjects: facts.metrics.subjects,
    examResults: facts.metrics.examResults,
    certificates: facts.metrics.certificates,
    dropoutRisk: facts.metrics.dropoutRisk,
    trends: readSnapshots()
      .slice(0, 12)
      .reverse()
      .map((s) => ({
        at: s.at,
        active: s.metrics?.activeStudents || 0,
        completion: s.metrics?.completionRate || 0,
      })),
  };

  const teachers = {
    bookings: facts.metrics.bookings,
    lessons: facts.metrics.lessons,
    income: facts.metrics.teacherIncome,
    ratings: facts.metrics.ratings,
    satisfaction: facts.metrics.satisfaction,
    completionRate: facts.metrics.teacherCompletion,
    availability: facts.metrics.availability,
    growth: facts.metrics.teacherGrowth,
    retention: facts.metrics.teacherRetention,
    top: facts.topTeachers,
  };

  const partners = {
    schools: facts.counts.schools,
    universities: facts.counts.universities,
    educationalCenters: facts.counts.centers,
    recruitmentCompanies: facts.counts.recruitment,
    employers: facts.counts.employers,
    revenue: facts.metrics.partnerRevenue,
    students: facts.metrics.partnerStudents,
    applications: facts.metrics.applications,
    admissions: facts.metrics.admissions,
    performance: facts.metrics.completionRate,
    commission: facts.metrics.commission,
    growth: facts.metrics.growth,
  };

  const financial = {
    revenueBy: facts.revenueBy,
    profit: facts.metrics.profit,
    cashFlow: facts.metrics.cashFlow,
    outstanding: facts.metrics.outstanding,
    refunds: facts.metrics.refunds,
    expenses: facts.metrics.expenses,
  };

  const hr = {
    attendance: facts.metrics.hrAttendance,
    productivity: facts.metrics.productivity,
    tasks: facts.metrics.tasks,
    completion: facts.metrics.taskCompletion,
    payroll: facts.metrics.payroll,
    performance: facts.metrics.hrPerformance,
    vacations: facts.metrics.vacations,
    recruitment: facts.metrics.recruitment,
    departmentKpis: facts.departmentKpis.hr,
  };

  const marketing = {
    campaignPerformance: facts.metrics.campaignPerformance,
    leadSources: facts.metrics.leadSources,
    conversionRate: facts.metrics.conversionRate,
    cpa: facts.metrics.cpa,
    socialMedia: facts.metrics.socialAnalytics,
    trafficSources: facts.metrics.trafficSources,
    email: facts.metrics.emailAnalytics,
    whatsapp: facts.metrics.whatsappAnalytics,
  };

  const ai = {
    generatedLessons: facts.metrics.generatedLessons,
    generatedVideos: facts.metrics.generatedVideos,
    generatedBooks: facts.metrics.generatedBooks,
    generatedQuestions: facts.metrics.generatedQuestions,
    generationCost: facts.metrics.generationCost,
    processingTime: facts.metrics.processingTime,
    successRate: facts.metrics.aiSuccessRate,
    modelUsage: facts.modelUsage,
  };

  const alertEvents = erpActiveItems(erpReadCollection(COLLECTIONS.alertEvents).items).slice(0, 50);
  const savedReports = erpActiveItems(erpReadCollection(COLLECTIONS.reports).items);
  const exports = erpActiveItems(erpReadCollection(COLLECTIONS.exports).items).slice(0, 30);

  return {
    ok: true,
    generatedAt: erpNow(),
    config: getBiConfig(),
    catalog: {
      departments: BI_DEPARTMENTS,
      metrics: BI_METRIC_KEYS,
      dimensions: BI_DIMENSIONS,
      chartTypes: BI_CHART_TYPES,
      exportFormats: BI_EXPORT_FORMATS,
    },
    executive,
    students,
    teachers,
    partners,
    financial,
    hr,
    marketing,
    ai,
    geographic: getGeographicAnalytics(),
    forecasts: buildForecasts(),
    kpis: getKpiCenter(),
    alerts: {
      rules: erpActiveItems(erpReadCollection(COLLECTIONS.alerts).items),
      events: alertEvents,
    },
    reports: savedReports,
    exports,
    liveVersion: liveBus().version,
    lastLiveEvent: liveBus().last,
  };
}

export function mutateBiEntity(collectionKey, action, payload = {}, meta = {}) {
  ensureBiEngine();
  const collection = COLLECTIONS[collectionKey] || collectionKey;
  if (action === 'create' || action === 'add') {
    const item = {
      id: erpId(),
      status: payload.status || 'active',
      ...payload,
      createdAt: erpNow(),
      updatedAt: erpNow(),
      createdBy: meta.user || 'owner',
    };
    const doc = erpReadCollection(collection);
    erpWriteCollection(collection, { items: [item, ...erpList(doc.items)] });
    publishLive({ type: `${collectionKey}.created`, id: item.id });
    return { ok: true, item };
  }
  if (action === 'update' || action === 'edit') {
    const doc = erpReadCollection(collection);
    const items = erpList(doc.items).map((i) =>
      i.id === payload.id ? { ...i, ...payload, updatedAt: erpNow() } : i,
    );
    erpWriteCollection(collection, { items });
    const item = items.find((i) => i.id === payload.id);
    publishLive({ type: `${collectionKey}.updated`, id: payload.id });
    return item ? { ok: true, item } : { ok: false, error: 'NOT_FOUND' };
  }
  if (action === 'delete') {
    const doc = erpReadCollection(collection);
    const items = erpList(doc.items).map((i) =>
      i.id === payload.id ? { ...i, deletedAt: erpNow(), status: 'deleted' } : i,
    );
    erpWriteCollection(collection, { items });
    return { ok: true };
  }
  return { ok: false, error: 'UNKNOWN_ACTION' };
}

export async function mutateBiCenter(action, payload = {}, meta = {}) {
  ensureBiEngine();
  switch (action) {
    case 'refresh':
    case 'snapshot':
      return { ok: true, snapshot: takeBiSnapshot(meta), dashboard: getBiDashboard() };
    case 'evaluateAlerts':
      return evaluateBiAlerts(meta);
    case 'buildReport':
      return buildCustomReport(payload);
    case 'exportReport':
      return exportBiReport(payload.format || 'csv', payload.report || payload, meta);
    case 'saveReport':
      return mutateBiEntity('reports', payload.id ? 'update' : 'create', payload, meta);
    case 'saveKpi':
      return mutateBiEntity('kpis', payload.id ? 'update' : 'create', payload, meta);
    case 'saveAlert':
      return mutateBiEntity('alerts', payload.id ? 'update' : 'create', payload, meta);
    case 'setConfig':
      return setBiConfig(payload, meta);
    case 'forecast':
      return buildForecasts(payload.horizonMonths);
    case 'geo':
      return getGeographicAnalytics();
    case 'kpis':
      return getKpiCenter();
    case 'runScheduledReports': {
      const reports = erpActiveItems(erpReadCollection(COLLECTIONS.reports).items).filter((r) => r.schedule);
      const results = [];
      for (const report of reports) {
        results.push(exportBiReport('email', report, meta));
      }
      return { ok: true, results };
    }
    default:
      return { ok: false, error: 'UNKNOWN_BI_ACTION' };
  }
}

export const BI_MODULE_IDS = Object.freeze([
  'business-intelligence',
  'bi-executive',
  'bi-students',
  'bi-teachers',
  'bi-partners',
  'bi-finance',
  'bi-hr',
  'bi-marketing',
  'bi-ai',
  'bi-geo',
  'bi-reports',
  'bi-exports',
  'bi-forecasts',
  'bi-kpis',
  'bi-alerts',
]);
