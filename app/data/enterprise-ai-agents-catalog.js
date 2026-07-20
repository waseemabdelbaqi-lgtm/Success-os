/**
 * SUCCESS OS — AI Agents Operating System catalog.
 * Shared agent registry, prompt library, tools, memory scopes, governance defaults.
 * No duplicated prompts / no agent works outside the Master Orchestrator.
 */

export const AI_OS_DEFAULT_CONFIG = Object.freeze({
  realtimeEnabled: true,
  requireOrchestrator: true,
  requireGraphConsultation: true,
  defaultProvider: 'auto',
  defaultCurrency: 'USD',
  costPer1kTokensUsd: 0.002,
  dailyRequestLimitPerUser: 500,
  dailyCostLimitUsd: 50,
  orgDailyCostLimitUsd: 5000,
  qualityThreshold: 0.7,
  humanReviewThreshold: 0.55,
  approvalRequiredFor: ['legal.contract_review', 'finance.fraud_detection', 'owner.strategic_recommendations'],
  maxContextMessages: 24,
  sessionMemoryTtlMinutes: 120,
  updatedAt: null,
});

export const AI_MEMORY_SCOPES = Object.freeze([
  { key: 'conversation', label: 'Conversation Memory', labelAr: 'ذاكرة المحادثة' },
  { key: 'organization', label: 'Organization Memory', labelAr: 'ذاكرة المؤسسة' },
  { key: 'department', label: 'Department Memory', labelAr: 'ذاكرة القسم' },
  { key: 'student', label: 'Student Memory', labelAr: 'ذاكرة الطالب' },
  { key: 'teacher', label: 'Teacher Memory', labelAr: 'ذاكرة المعلم' },
  { key: 'partner', label: 'Partner Memory', labelAr: 'ذاكرة الشريك' },
  { key: 'long_term', label: 'Long-term Memory', labelAr: 'ذاكرة طويلة الأمد' },
  { key: 'session', label: 'Temporary Session Memory', labelAr: 'ذاكرة الجلسة المؤقتة' },
]);

export const AI_SHARED_KNOWLEDGE = Object.freeze([
  'knowledge_graph',
  'curriculum_database',
  'erp',
  'crm',
  'hr',
  'finance',
  'marketplace',
  'workflow_engine',
  'analytics',
  'permissions',
  'audit_logs',
]);

export const AI_ORCHESTRATOR_CAPABILITIES = Object.freeze([
  'agent_routing',
  'task_distribution',
  'context_sharing',
  'memory_management',
  'permission_validation',
  'workflow_execution',
  'tool_selection',
  'quality_control',
  'cost_optimization',
]);

/** Shared prompt library — single source of truth (versioned in engine). */
export const AI_SHARED_PROMPTS = Object.freeze([
  {
    key: 'system.orchestrator',
    version: 1,
    title: 'Master Orchestrator',
    body: 'You are the Success OS Master AI Orchestrator. Route tasks to specialized agents, enforce permissions, consult the knowledge graph, and never invent business data.',
  },
  {
    key: 'system.safety',
    version: 1,
    title: 'Safety & Governance',
    body: 'Respect RBAC, privacy, curriculum truthfulness, and escalate high-risk legal/finance actions for human review.',
  },
  {
    key: 'student.tutor',
    version: 1,
    title: 'Student Tutor',
    body: 'Guide the learner step-by-step. Prefer Socratic hints before full answers. Align with the learner grade, curriculum, and goals.',
  },
  {
    key: 'student.planner',
    version: 1,
    title: 'Study Planner',
    body: 'Build realistic study plans from goals, availability, and performance history. Prefer spaced repetition.',
  },
  {
    key: 'parent.progress',
    version: 1,
    title: 'Parent Progress',
    body: 'Explain student progress clearly for parents. Include attendance, homework, behavior, and actionable recommendations.',
  },
  {
    key: 'teacher.generator',
    version: 1,
    title: 'Teacher Content Generator',
    body: 'Generate lessons, exams, questions, rubrics, and homework aligned to curriculum standards and Bloom levels.',
  },
  {
    key: 'school.ops',
    version: 1,
    title: 'School Operations',
    body: 'Assist school admissions, scheduling, staffing, academic quality, and financial reporting.',
  },
  {
    key: 'university.advising',
    version: 1,
    title: 'University Advising',
    body: 'Support admissions, programs, scholarships, international students, and visa guidance with policy awareness.',
  },
  {
    key: 'employer.recruit',
    version: 1,
    title: 'Employer Recruitment',
    body: 'Match jobs to candidates, rank skills, screen CVs, and schedule interviews with fair, bias-aware criteria.',
  },
  {
    key: 'hr.assistant',
    version: 1,
    title: 'HR Assistant',
    body: 'Help with recruitment, performance reviews, payroll questions, contracts, leave, and task allocation.',
  },
  {
    key: 'finance.analyst',
    version: 1,
    title: 'Finance Analyst',
    body: 'Analyze invoices, revenue, expenses, commissions, cash flow, and fraud signals with auditable reasoning.',
  },
  {
    key: 'support.agent',
    version: 1,
    title: 'Support Agent',
    body: 'Classify tickets, draft replies from the knowledge base, escalate when needed, and track CSAT.',
  },
  {
    key: 'content.factory',
    version: 1,
    title: 'Content Factory',
    body: 'Create books, lessons, videos scripts, questions, summaries, flashcards, and interactive activities with curriculum verification.',
  },
  {
    key: 'marketing.campaign',
    version: 1,
    title: 'Marketing Campaign',
    body: 'Create campaigns, social content, ads, SEO plans, analytics summaries, and lead scores.',
  },
  {
    key: 'sales.crm',
    version: 1,
    title: 'Sales CRM',
    body: 'Qualify leads, follow up in CRM, recommend subscriptions, and suggest ethical upsell/cross-sell.',
  },
  {
    key: 'legal.compliance',
    version: 1,
    title: 'Legal Compliance',
    body: 'Review contracts and policies, flag compliance risks, draft documents, and recommend human legal review when uncertain.',
  },
  {
    key: 'owner.executive',
    version: 1,
    title: 'Owner Executive',
    body: 'Produce executive reports, strategic recommendations, forecasts, health scores, risk alerts, and growth opportunities.',
  },
]);

export const AI_TOOL_CATALOG = Object.freeze([
  { key: 'knowledge_graph.query', label: 'Query Knowledge Graph', systems: ['knowledge_graph', 'curriculum_database'] },
  { key: 'erp.read', label: 'Read ERP', systems: ['erp'] },
  { key: 'crm.read', label: 'Read CRM', systems: ['crm'] },
  { key: 'hr.read', label: 'Read HR', systems: ['hr'] },
  { key: 'finance.read', label: 'Read Finance', systems: ['finance'] },
  { key: 'marketplace.read', label: 'Read Marketplace', systems: ['marketplace'] },
  { key: 'workflow.execute', label: 'Execute Workflow', systems: ['workflow_engine'] },
  { key: 'analytics.query', label: 'Query Analytics', systems: ['analytics'] },
  { key: 'notifications.send', label: 'Send Notification', systems: ['permissions', 'audit_logs'] },
  { key: 'permissions.check', label: 'Validate Permissions', systems: ['permissions'] },
  { key: 'audit.write', label: 'Write Audit Log', systems: ['audit_logs'] },
  { key: 'memory.read', label: 'Read Memory', systems: [] },
  { key: 'memory.write', label: 'Write Memory', systems: [] },
  { key: 'llm.generate', label: 'Generate with LLM', systems: [] },
]);

function agent(def) {
  return Object.freeze({
    status: 'active',
    orchestratorOnly: true,
    ...def,
  });
}

/** Agent families + specialized agents (all must go through orchestrator). */
export const AI_AGENT_FAMILIES = Object.freeze([
  {
    key: 'orchestrator',
    label: 'AI Orchestrator',
    labelAr: 'منسّق الذكاء الاصطناعي',
    portal: 'platform',
    agents: [
      agent({
        key: 'orchestrator.master',
        label: 'Master AI Controller',
        labelAr: 'المتحكم الرئيسي',
        promptKey: 'system.orchestrator',
        permissions: ['ai.orchestrate', 'ai.read'],
        tools: ['permissions.check', 'memory.read', 'memory.write', 'knowledge_graph.query', 'workflow.execute', 'llm.generate', 'audit.write'],
        capabilities: [...AI_ORCHESTRATOR_CAPABILITIES],
        task: 'reasoning',
      }),
    ],
  },
  {
    key: 'student',
    label: 'Student AI',
    labelAr: 'ذكاء الطالب',
    portal: 'student',
    agents: [
      agent({ key: 'student.personal_teacher', label: 'Personal AI Teacher', labelAr: 'معلم شخصي', promptKey: 'student.tutor', permissions: ['ai.student', 'ai.read'], tools: ['knowledge_graph.query', 'memory.read', 'memory.write', 'llm.generate'], task: 'lesson-writing' }),
      agent({ key: 'student.personal_tutor', label: 'Personal AI Tutor', labelAr: 'مدرّس خصوصي', promptKey: 'student.tutor', permissions: ['ai.student', 'ai.read'], tools: ['knowledge_graph.query', 'memory.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'student.homework', label: 'Homework Assistant', labelAr: 'مساعد الواجبات', promptKey: 'student.tutor', permissions: ['ai.student', 'ai.read'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'student.exam', label: 'Exam Assistant', labelAr: 'مساعد الامتحانات', promptKey: 'student.tutor', permissions: ['ai.student', 'ai.read'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'question-generation' }),
      agent({ key: 'student.revision', label: 'Revision Planner', labelAr: 'مخطط المراجعة', promptKey: 'student.planner', permissions: ['ai.student', 'ai.read'], tools: ['analytics.query', 'memory.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'student.study_planner', label: 'Study Planner', labelAr: 'مخطط الدراسة', promptKey: 'student.planner', permissions: ['ai.student', 'ai.read'], tools: ['memory.read', 'analytics.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'student.learning_coach', label: 'Learning Coach', labelAr: 'مدرب التعلم', promptKey: 'student.tutor', permissions: ['ai.student', 'ai.read'], tools: ['memory.read', 'analytics.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'student.progress', label: 'Progress Analyzer', labelAr: 'محلل التقدم', promptKey: 'student.planner', permissions: ['ai.student', 'ai.read'], tools: ['analytics.query', 'erp.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'student.career', label: 'Career Advisor', labelAr: 'مستشار مهني', promptKey: 'student.planner', permissions: ['ai.student', 'ai.read'], tools: ['knowledge_graph.query', 'marketplace.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'student.university', label: 'University Advisor', labelAr: 'مستشار جامعي', promptKey: 'university.advising', permissions: ['ai.student', 'ai.read'], tools: ['marketplace.read', 'knowledge_graph.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'student.scholarship', label: 'Scholarship Advisor', labelAr: 'مستشار المنح', promptKey: 'university.advising', permissions: ['ai.student', 'ai.read'], tools: ['marketplace.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'student.study_abroad', label: 'Study Abroad Advisor', labelAr: 'مستشار الدراسة بالخارج', promptKey: 'university.advising', permissions: ['ai.student', 'ai.read'], tools: ['marketplace.read', 'llm.generate'], task: 'reasoning' }),
    ],
  },
  {
    key: 'parent',
    label: 'Parent AI',
    labelAr: 'ذكاء ولي الأمر',
    portal: 'parent',
    agents: [
      agent({ key: 'parent.progress', label: 'Student Progress', labelAr: 'تقدم الطالب', promptKey: 'parent.progress', permissions: ['ai.parent', 'ai.read'], tools: ['analytics.query', 'erp.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'parent.attendance', label: 'Attendance', labelAr: 'الحضور', promptKey: 'parent.progress', permissions: ['ai.parent', 'ai.read'], tools: ['erp.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'parent.behavior', label: 'Behavior', labelAr: 'السلوك', promptKey: 'parent.progress', permissions: ['ai.parent', 'ai.read'], tools: ['erp.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'parent.homework', label: 'Homework', labelAr: 'الواجبات', promptKey: 'parent.progress', permissions: ['ai.parent', 'ai.read'], tools: ['erp.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'parent.payment', label: 'Payment Assistant', labelAr: 'مساعد الدفع', promptKey: 'parent.progress', permissions: ['ai.parent', 'finance.read'], tools: ['finance.read', 'notifications.send', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'parent.reports', label: 'Academic Reports', labelAr: 'التقارير الأكاديمية', promptKey: 'parent.progress', permissions: ['ai.parent', 'ai.read'], tools: ['analytics.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'parent.notifications', label: 'Parent Notifications', labelAr: 'إشعارات ولي الأمر', promptKey: 'parent.progress', permissions: ['ai.parent', 'notifications.send'], tools: ['notifications.send', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'parent.recommendations', label: 'Recommendations', labelAr: 'التوصيات', promptKey: 'parent.progress', permissions: ['ai.parent', 'ai.read'], tools: ['knowledge_graph.query', 'marketplace.read', 'llm.generate'], task: 'reasoning' }),
    ],
  },
  {
    key: 'teacher',
    label: 'Teacher AI',
    labelAr: 'ذكاء المعلم',
    portal: 'teacher',
    agents: [
      agent({ key: 'teacher.lesson', label: 'Lesson Generator', labelAr: 'مولّد الدروس', promptKey: 'teacher.generator', permissions: ['ai.teacher', 'content.write'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'lesson-writing' }),
      agent({ key: 'teacher.exam', label: 'Exam Generator', labelAr: 'مولّد الامتحانات', promptKey: 'teacher.generator', permissions: ['ai.teacher', 'content.write'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'question-generation' }),
      agent({ key: 'teacher.question', label: 'Question Generator', labelAr: 'مولّد الأسئلة', promptKey: 'teacher.generator', permissions: ['ai.teacher', 'content.write'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'question-generation' }),
      agent({ key: 'teacher.homework', label: 'Homework Generator', labelAr: 'مولّد الواجبات', promptKey: 'teacher.generator', permissions: ['ai.teacher', 'content.write'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'lesson-writing' }),
      agent({ key: 'teacher.rubric', label: 'Rubric Generator', labelAr: 'مولّد معايير التقييم', promptKey: 'teacher.generator', permissions: ['ai.teacher', 'content.write'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'quality' }),
      agent({ key: 'teacher.analytics', label: 'Student Analytics', labelAr: 'تحليلات الطلاب', promptKey: 'teacher.generator', permissions: ['ai.teacher', 'ai.read'], tools: ['analytics.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'teacher.classroom', label: 'Classroom Assistant', labelAr: 'مساعد الصف', promptKey: 'teacher.generator', permissions: ['ai.teacher', 'ai.read'], tools: ['erp.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'teacher.attendance', label: 'Attendance Assistant', labelAr: 'مساعد الحضور', promptKey: 'teacher.generator', permissions: ['ai.teacher', 'ai.read'], tools: ['erp.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'teacher.presentation', label: 'AI Presentation Generator', labelAr: 'مولّد العروض', promptKey: 'content.factory', permissions: ['ai.teacher', 'content.write'], tools: ['llm.generate'], task: 'lesson-writing' }),
      agent({ key: 'teacher.video', label: 'AI Video Lesson Assistant', labelAr: 'مساعد دروس الفيديو', promptKey: 'content.factory', permissions: ['ai.teacher', 'content.write'], tools: ['llm.generate'], task: 'lesson-writing' }),
    ],
  },
  {
    key: 'school',
    label: 'School AI',
    labelAr: 'ذكاء المدرسة',
    portal: 'school',
    agents: [
      agent({ key: 'school.admissions', label: 'Admissions', labelAr: 'القبول', promptKey: 'school.ops', permissions: ['ai.school', 'orgs.write'], tools: ['erp.read', 'crm.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'school.scheduling', label: 'Scheduling', labelAr: 'الجداول', promptKey: 'school.ops', permissions: ['ai.school', 'ai.read'], tools: ['erp.read', 'workflow.execute', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'school.students', label: 'Student Management', labelAr: 'إدارة الطلاب', promptKey: 'school.ops', permissions: ['ai.school', 'students.read'], tools: ['erp.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'school.teachers', label: 'Teacher Management', labelAr: 'إدارة المعلمين', promptKey: 'school.ops', permissions: ['ai.school', 'teachers.read'], tools: ['hr.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'school.academic_reports', label: 'Academic Reports', labelAr: 'التقارير الأكاديمية', promptKey: 'school.ops', permissions: ['ai.school', 'reports.view'], tools: ['analytics.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'school.financial_reports', label: 'Financial Reports', labelAr: 'التقارير المالية', promptKey: 'school.ops', permissions: ['ai.school', 'finance.read'], tools: ['finance.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'school.qa', label: 'Quality Assurance', labelAr: 'ضمان الجودة', promptKey: 'school.ops', permissions: ['ai.school', 'ai.read'], tools: ['analytics.query', 'knowledge_graph.query', 'llm.generate'], task: 'quality' }),
    ],
  },
  {
    key: 'university',
    label: 'University AI',
    labelAr: 'ذكاء الجامعة',
    portal: 'university',
    agents: [
      agent({ key: 'university.admissions', label: 'Admissions', labelAr: 'القبول', promptKey: 'university.advising', permissions: ['ai.university', 'orgs.write'], tools: ['erp.read', 'crm.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'university.programs', label: 'Programs', labelAr: 'البرامج', promptKey: 'university.advising', permissions: ['ai.university', 'ai.read'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'university.scholarships', label: 'Scholarships', labelAr: 'المنح', promptKey: 'university.advising', permissions: ['ai.university', 'ai.read'], tools: ['marketplace.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'university.student_services', label: 'Student Services', labelAr: 'خدمات الطلاب', promptKey: 'university.advising', permissions: ['ai.university', 'ai.read'], tools: ['erp.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'university.academic_advising', label: 'Academic Advising', labelAr: 'الإرشاد الأكاديمي', promptKey: 'university.advising', permissions: ['ai.university', 'ai.read'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'university.international', label: 'International Students', labelAr: 'الطلاب الدوليون', promptKey: 'university.advising', permissions: ['ai.university', 'ai.read'], tools: ['erp.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'university.visa', label: 'Visa Guidance', labelAr: 'إرشاد التأشيرة', promptKey: 'legal.compliance', permissions: ['ai.university', 'ai.read'], tools: ['llm.generate'], task: 'reasoning', requiresHumanReview: true }),
    ],
  },
  {
    key: 'employer',
    label: 'Employer AI',
    labelAr: 'ذكاء صاحب العمل',
    portal: 'employer',
    agents: [
      agent({ key: 'employer.job_matching', label: 'Job Matching', labelAr: 'مطابقة الوظائف', promptKey: 'employer.recruit', permissions: ['ai.employer', 'ai.read'], tools: ['crm.read', 'marketplace.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'employer.candidate_ranking', label: 'Candidate Ranking', labelAr: 'ترتيب المرشحين', promptKey: 'employer.recruit', permissions: ['ai.employer', 'ai.read'], tools: ['crm.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'employer.interview', label: 'Interview Scheduling', labelAr: 'جدولة المقابلات', promptKey: 'employer.recruit', permissions: ['ai.employer', 'ai.write'], tools: ['workflow.execute', 'notifications.send', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'employer.skill_analysis', label: 'Skill Analysis', labelAr: 'تحليل المهارات', promptKey: 'employer.recruit', permissions: ['ai.employer', 'ai.read'], tools: ['analytics.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'employer.cv_screening', label: 'CV Screening', labelAr: 'فرز السير الذاتية', promptKey: 'employer.recruit', permissions: ['ai.employer', 'ai.read'], tools: ['crm.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'employer.recruitment_analytics', label: 'Recruitment Analytics', labelAr: 'تحليلات التوظيف', promptKey: 'employer.recruit', permissions: ['ai.employer', 'reports.view'], tools: ['analytics.query', 'llm.generate'], task: 'reasoning' }),
    ],
  },
  {
    key: 'hr',
    label: 'HR AI',
    labelAr: 'ذكاء الموارد البشرية',
    portal: 'hr',
    agents: [
      agent({ key: 'hr.recruitment', label: 'Recruitment', labelAr: 'التوظيف', promptKey: 'hr.assistant', permissions: ['ai.hr', 'hr.write'], tools: ['hr.read', 'crm.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'hr.performance', label: 'Performance Reviews', labelAr: 'تقييم الأداء', promptKey: 'hr.assistant', permissions: ['ai.hr', 'hr.write'], tools: ['hr.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'hr.payroll', label: 'Payroll Assistant', labelAr: 'مساعد الرواتب', promptKey: 'hr.assistant', permissions: ['ai.hr', 'hr.payroll'], tools: ['hr.read', 'finance.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'hr.contract', label: 'Contract Review', labelAr: 'مراجعة العقود', promptKey: 'legal.compliance', permissions: ['ai.hr', 'hr.write'], tools: ['hr.read', 'llm.generate'], task: 'reasoning', requiresHumanReview: true }),
      agent({ key: 'hr.leave', label: 'Leave Management', labelAr: 'إدارة الإجازات', promptKey: 'hr.assistant', permissions: ['ai.hr', 'hr.write'], tools: ['hr.read', 'workflow.execute', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'hr.task_allocation', label: 'Task Allocation', labelAr: 'توزيع المهام', promptKey: 'hr.assistant', permissions: ['ai.hr', 'tasks.write'], tools: ['workflow.execute', 'llm.generate'], task: 'reasoning' }),
    ],
  },
  {
    key: 'finance',
    label: 'Finance AI',
    labelAr: 'ذكاء المالية',
    portal: 'finance',
    agents: [
      agent({ key: 'finance.invoices', label: 'Invoices', labelAr: 'الفواتير', promptKey: 'finance.analyst', permissions: ['ai.finance', 'finance.read'], tools: ['finance.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'finance.revenue', label: 'Revenue Analysis', labelAr: 'تحليل الإيرادات', promptKey: 'finance.analyst', permissions: ['ai.finance', 'finance.read'], tools: ['finance.read', 'analytics.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'finance.expense', label: 'Expense Analysis', labelAr: 'تحليل المصروفات', promptKey: 'finance.analyst', permissions: ['ai.finance', 'finance.read'], tools: ['finance.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'finance.commission', label: 'Commission Validation', labelAr: 'التحقق من العمولات', promptKey: 'finance.analyst', permissions: ['ai.finance', 'finance.commission'], tools: ['finance.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'finance.fraud', label: 'Fraud Detection', labelAr: 'كشف الاحتيال', promptKey: 'finance.analyst', permissions: ['ai.finance', 'finance.write'], tools: ['finance.read', 'analytics.query', 'audit.write', 'llm.generate'], task: 'quality', requiresHumanReview: true }),
      agent({ key: 'finance.forecasting', label: 'Forecasting', labelAr: 'التنبؤ', promptKey: 'finance.analyst', permissions: ['ai.finance', 'finance.read'], tools: ['analytics.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'finance.cashflow', label: 'Cash Flow Analysis', labelAr: 'تحليل التدفق النقدي', promptKey: 'finance.analyst', permissions: ['ai.finance', 'finance.read'], tools: ['finance.read', 'llm.generate'], task: 'reasoning' }),
    ],
  },
  {
    key: 'support',
    label: 'Support AI',
    labelAr: 'ذكاء الدعم',
    portal: 'support',
    agents: [
      agent({ key: 'support.classify', label: 'Ticket Classification', labelAr: 'تصنيف التذاكر', promptKey: 'support.agent', permissions: ['ai.support', 'support.write'], tools: ['crm.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'support.replies', label: 'Automatic Replies', labelAr: 'الردود التلقائية', promptKey: 'support.agent', permissions: ['ai.support', 'support.write'], tools: ['llm.generate', 'notifications.send'], task: 'reasoning' }),
      agent({ key: 'support.knowledge', label: 'Knowledge Base', labelAr: 'قاعدة المعرفة', promptKey: 'support.agent', permissions: ['ai.support', 'ai.read'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'support.escalation', label: 'Escalation', labelAr: 'التصعيد', promptKey: 'support.agent', permissions: ['ai.support', 'support.write'], tools: ['workflow.execute', 'notifications.send', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'support.csat', label: 'Customer Satisfaction', labelAr: 'رضا العملاء', promptKey: 'support.agent', permissions: ['ai.support', 'ai.read'], tools: ['analytics.query', 'llm.generate'], task: 'reasoning' }),
    ],
  },
  {
    key: 'content',
    label: 'Content AI',
    labelAr: 'ذكاء المحتوى',
    portal: 'content',
    agents: [
      agent({ key: 'content.books', label: 'Books', labelAr: 'الكتب', promptKey: 'content.factory', permissions: ['ai.content', 'content.write'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'lesson-writing' }),
      agent({ key: 'content.lessons', label: 'Lessons', labelAr: 'الدروس', promptKey: 'content.factory', permissions: ['ai.content', 'content.write'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'lesson-writing' }),
      agent({ key: 'content.videos', label: 'Videos', labelAr: 'الفيديو', promptKey: 'content.factory', permissions: ['ai.content', 'content.write'], tools: ['llm.generate'], task: 'lesson-writing' }),
      agent({ key: 'content.questions', label: 'Questions', labelAr: 'الأسئلة', promptKey: 'content.factory', permissions: ['ai.content', 'content.write'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'question-generation' }),
      agent({ key: 'content.summaries', label: 'Summaries', labelAr: 'الملخصات', promptKey: 'content.factory', permissions: ['ai.content', 'content.write'], tools: ['llm.generate'], task: 'reasoning' }),
      agent({ key: 'content.flashcards', label: 'Flashcards', labelAr: 'البطاقات التعليمية', promptKey: 'content.factory', permissions: ['ai.content', 'content.write'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'question-generation' }),
      agent({ key: 'content.activities', label: 'Interactive Activities', labelAr: 'أنشطة تفاعلية', promptKey: 'content.factory', permissions: ['ai.content', 'content.write'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'lesson-writing' }),
      agent({ key: 'content.curriculum_verify', label: 'Curriculum Verification', labelAr: 'التحقق من المنهج', promptKey: 'content.factory', permissions: ['ai.content', 'content.publish'], tools: ['knowledge_graph.query', 'llm.generate'], task: 'quality' }),
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing AI',
    labelAr: 'ذكاء التسويق',
    portal: 'marketing',
    agents: [
      agent({ key: 'marketing.campaign', label: 'Campaign Creation', labelAr: 'إنشاء الحملات', promptKey: 'marketing.campaign', permissions: ['ai.marketing', 'marketing.write'], tools: ['crm.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'marketing.social', label: 'Social Media Content', labelAr: 'محتوى التواصل', promptKey: 'marketing.campaign', permissions: ['ai.marketing', 'social.write'], tools: ['llm.generate'], task: 'reasoning' }),
      agent({ key: 'marketing.ads', label: 'Advertising', labelAr: 'الإعلانات', promptKey: 'marketing.campaign', permissions: ['ai.marketing', 'marketing.write'], tools: ['analytics.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'marketing.seo', label: 'SEO', labelAr: 'تحسين محركات البحث', promptKey: 'marketing.campaign', permissions: ['ai.marketing', 'marketing.write'], tools: ['llm.generate'], task: 'reasoning' }),
      agent({ key: 'marketing.analytics', label: 'Analytics', labelAr: 'التحليلات', promptKey: 'marketing.campaign', permissions: ['ai.marketing', 'reports.view'], tools: ['analytics.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'marketing.lead_scoring', label: 'Lead Scoring', labelAr: 'تقييم العملاء المحتملين', promptKey: 'marketing.campaign', permissions: ['ai.marketing', 'sales.read'], tools: ['crm.read', 'analytics.query', 'llm.generate'], task: 'reasoning' }),
    ],
  },
  {
    key: 'sales',
    label: 'Sales AI',
    labelAr: 'ذكاء المبيعات',
    portal: 'sales',
    agents: [
      agent({ key: 'sales.qualify', label: 'Lead Qualification', labelAr: 'تأهيل العملاء', promptKey: 'sales.crm', permissions: ['ai.sales', 'sales.write'], tools: ['crm.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'sales.followup', label: 'CRM Follow-up', labelAr: 'متابعة CRM', promptKey: 'sales.crm', permissions: ['ai.sales', 'sales.write'], tools: ['crm.read', 'notifications.send', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'sales.subscriptions', label: 'Subscription Recommendations', labelAr: 'توصيات الاشتراك', promptKey: 'sales.crm', permissions: ['ai.sales', 'sales.write'], tools: ['marketplace.read', 'crm.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'sales.upsell', label: 'Upselling', labelAr: 'البيع التصاعدي', promptKey: 'sales.crm', permissions: ['ai.sales', 'sales.write'], tools: ['crm.read', 'marketplace.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'sales.cross_sell', label: 'Cross-selling', labelAr: 'البيع المتقاطع', promptKey: 'sales.crm', permissions: ['ai.sales', 'sales.write'], tools: ['crm.read', 'marketplace.read', 'llm.generate'], task: 'reasoning' }),
    ],
  },
  {
    key: 'legal',
    label: 'Legal AI',
    labelAr: 'ذكاء القانونية',
    portal: 'legal',
    agents: [
      agent({ key: 'legal.contract_review', label: 'Contract Review', labelAr: 'مراجعة العقود', promptKey: 'legal.compliance', permissions: ['ai.legal', 'ai.read'], tools: ['llm.generate', 'audit.write'], task: 'reasoning', requiresHumanReview: true }),
      agent({ key: 'legal.policy', label: 'Policy Verification', labelAr: 'التحقق من السياسات', promptKey: 'legal.compliance', permissions: ['ai.legal', 'ai.read'], tools: ['llm.generate'], task: 'quality', requiresHumanReview: true }),
      agent({ key: 'legal.compliance', label: 'Compliance', labelAr: 'الامتثال', promptKey: 'legal.compliance', permissions: ['ai.legal', 'ai.read'], tools: ['audit.write', 'llm.generate'], task: 'quality' }),
      agent({ key: 'legal.drafting', label: 'Document Drafting', labelAr: 'صياغة المستندات', promptKey: 'legal.compliance', permissions: ['ai.legal', 'ai.write'], tools: ['llm.generate'], task: 'reasoning', requiresHumanReview: true }),
      agent({ key: 'legal.risk', label: 'Risk Detection', labelAr: 'كشف المخاطر', promptKey: 'legal.compliance', permissions: ['ai.legal', 'ai.read'], tools: ['analytics.query', 'llm.generate'], task: 'quality' }),
    ],
  },
  {
    key: 'owner',
    label: 'Owner AI',
    labelAr: 'ذكاء المالك',
    portal: 'owner',
    agents: [
      agent({ key: 'owner.executive_reports', label: 'Executive Reports', labelAr: 'تقارير تنفيذية', promptKey: 'owner.executive', permissions: ['ai.owner', 'reports.view'], tools: ['analytics.query', 'finance.read', 'erp.read', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'owner.strategic_recommendations', label: 'Strategic Recommendations', labelAr: 'توصيات استراتيجية', promptKey: 'owner.executive', permissions: ['ai.owner', 'platform.manage'], tools: ['analytics.query', 'llm.generate'], task: 'reasoning', requiresHumanReview: true }),
      agent({ key: 'owner.revenue_forecast', label: 'Revenue Forecasting', labelAr: 'توقعات الإيرادات', promptKey: 'owner.executive', permissions: ['ai.owner', 'finance.read'], tools: ['finance.read', 'analytics.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'owner.business_health', label: 'Business Health', labelAr: 'صحة الأعمال', promptKey: 'owner.executive', permissions: ['ai.owner', 'reports.view'], tools: ['analytics.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'owner.risk_alerts', label: 'Risk Alerts', labelAr: 'تنبيهات المخاطر', promptKey: 'owner.executive', permissions: ['ai.owner', 'platform.audit'], tools: ['analytics.query', 'audit.write', 'notifications.send', 'llm.generate'], task: 'quality' }),
      agent({ key: 'owner.growth', label: 'Growth Opportunities', labelAr: 'فرص النمو', promptKey: 'owner.executive', permissions: ['ai.owner', 'reports.view'], tools: ['marketplace.read', 'analytics.query', 'llm.generate'], task: 'reasoning' }),
      agent({ key: 'owner.ops_insights', label: 'Operational Insights', labelAr: 'رؤى تشغيلية', promptKey: 'owner.executive', permissions: ['ai.owner', 'reports.view'], tools: ['erp.read', 'analytics.query', 'llm.generate'], task: 'reasoning' }),
    ],
  },
]);

export const AI_ALL_AGENTS = Object.freeze(
  AI_AGENT_FAMILIES.flatMap((family) =>
    family.agents.map((a) => ({
      ...a,
      family: family.key,
      familyLabel: family.label,
      portal: family.portal,
    })),
  ),
);

export const AI_TASK_MODEL_DEFAULTS = Object.freeze({
  reasoning: { preferredProviders: ['openai', 'gemini'], modelHint: 'auto' },
  'lesson-writing': { preferredProviders: ['openai', 'gemini'], modelHint: 'auto' },
  'question-generation': { preferredProviders: ['openai', 'gemini'], modelHint: 'auto' },
  translation: { preferredProviders: ['gemini', 'openai', 'deepl'], modelHint: 'auto' },
  quality: { preferredProviders: ['openai', 'gemini'], modelHint: 'auto' },
  image: { preferredProviders: ['openai', 'flux', 'ideogram'], modelHint: 'auto' },
  'avatar-video': { preferredProviders: ['heygen', 'synthesia'], modelHint: 'auto' },
  voice: { preferredProviders: ['elevenlabs', 'cartesia'], modelHint: 'auto' },
});

export function findAiAgent(agentKey) {
  return AI_ALL_AGENTS.find((a) => a.key === agentKey) || null;
}

export function findAiPrompt(promptKey) {
  return AI_SHARED_PROMPTS.find((p) => p.key === promptKey) || null;
}
