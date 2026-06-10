/* ============================================================
   Store — metadata-driven data layer
   Everything (modules, fields, statuses, categories, tags,
   workflows, users, roles, dashboards) lives in editable data.
   Persistence: localStorage. Seed: realistic mega-project portfolio.
   ============================================================ */

const DB_KEY = 'cpos_db_v1';
const DAY = 86400000;
const todayISO = () => new Date().toISOString().slice(0, 10);
const dOff = n => new Date(Date.now() + n * DAY).toISOString().slice(0, 10);
let _uid = Date.now() % 100000;
const uid = (p = 'id') => `${p}_${(_uid++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* ---------- module registry (admin can hide/show & add) ---------- */
function defaultModules() {
  return [
    { key: 'exec',           icon: '🎯', group: 'gCommand',   labelKey: 'mExec',           builtin: true, visible: true },
    { key: 'portfolio',      icon: '🗂️', group: 'gCommand',   labelKey: 'mPortfolio',      builtin: true, visible: true },
    { key: 'actions',        icon: '⚡', group: 'gExecution', labelKey: 'mActions',        builtin: true, visible: true, entity: 'action' },
    { key: 'risks',          icon: '🛡️', group: 'gExecution', labelKey: 'mRisks',          builtin: true, visible: true, entity: 'risk' },
    { key: 'issues',         icon: '🧩', group: 'gExecution', labelKey: 'mIssues',         builtin: true, visible: true, entity: 'issue' },
    { key: 'tracker',        icon: '🚩', group: 'gExecution', labelKey: 'mTracker',        builtin: true, visible: true, entity: 'constraint' },
    { key: 'observations',   icon: '📸', group: 'gExecution', labelKey: 'mObservations',   builtin: true, visible: true, entity: 'observation' },
    { key: 'contractors',    icon: '🏗️', group: 'gExecution', labelKey: 'mContractors',    builtin: true, visible: true },
    { key: 'correspondence', icon: '✉️', group: 'gKnowledge', labelKey: 'mCorrespondence', builtin: true, visible: true, entity: 'correspondence' },
    { key: 'meetings',       icon: '🗓️', group: 'gKnowledge', labelKey: 'mMeetings',       builtin: true, visible: true, entity: 'meeting' },
    { key: 'lessons',        icon: '💡', group: 'gKnowledge', labelKey: 'mLessons',        builtin: true, visible: true, entity: 'lesson' },
    { key: 'documents',      icon: '📐', group: 'gKnowledge', labelKey: 'mDocuments',      builtin: true, visible: true, entity: 'document' },
    { key: 'dashbuilder',    icon: '📊', group: 'gPlatform',  labelKey: 'mDashBuilder',    builtin: true, visible: true },
    { key: 'workflow',       icon: '🔀', group: 'gPlatform',  labelKey: 'mWorkflow',       builtin: true, visible: true },
    { key: 'ai',             icon: '✨', group: 'gPlatform',  labelKey: 'mAI',             builtin: true, visible: true },
    { key: 'admin',          icon: '🛠️', group: 'gPlatform',  labelKey: 'mAdmin',          builtin: true, visible: true, adminOnly: true },
  ];
}

/* ---------- entity schemas (fully editable in Admin) ---------- */
const L = (en, ar) => ({ en, ar });
const ST = (key, en, ar, color, closed = false) => ({ key, label: L(en, ar), color, closed });

function defaultSchemas() {
  const prioField = { key: 'priority', type: 'priority', label: L('Priority', 'الأولوية'), system: true };
  const base = (extra = []) => [
    { key: 'title',       type: 'text',     label: L('Title', 'العنوان'), required: true, system: true },
    { key: 'description', type: 'textarea', label: L('Description', 'الوصف'), system: true },
    ...extra,
    { key: 'tags', type: 'tags', label: L('Tags', 'الوسوم'), system: true },
  ];
  return {
    action: {
      icon: '⚡', label: L('Action', 'إجراء'), refPrefix: 'ACT',
      views: ['list', 'kanban', 'timeline'],
      fields: base([
        prioField,
        { key: 'assignee',   type: 'user',       label: L('Assignee', 'المسؤول'), required: true, system: true },
        { key: 'contractor', type: 'contractor', label: L('Contractor', 'المقاول') },
        { key: 'dueDate',    type: 'date',       label: L('Due Date', 'تاريخ الاستحقاق'), required: true, system: true },
        { key: 'sourceType', type: 'select',     label: L('Source', 'المصدر'), system: true,
          options: ['meeting', 'observation', 'risk', 'issue', 'correspondence', 'lesson', 'manual'] },
      ]),
      statuses: [
        ST('open', 'Open', 'مفتوح', '#60a5fa'), ST('inprogress', 'In Progress', 'قيد التنفيذ', '#22d3ee'),
        ST('pending', 'Pending', 'معلق', '#f5b942'), ST('blocked', 'Blocked', 'متعثر', '#f87171'),
        ST('completed', 'Completed', 'مكتمل', '#34d399', true), ST('cancelled', 'Cancelled', 'ملغي', '#64748b', true),
      ],
      categories: [
        { key: 'technical', label: L('Technical', 'فني') }, { key: 'commercial', label: L('Commercial', 'تجاري') },
        { key: 'safety', label: L('Safety', 'سلامة') }, { key: 'quality', label: L('Quality', 'جودة') },
        { key: 'coordination', label: L('Coordination', 'تنسيق') },
      ],
      tags: ['عاجل', 'تعاقدي', 'تصميم', 'موقع', 'حكومي'],
    },
    risk: {
      icon: '🛡️', label: L('Risk', 'خطر'), refPrefix: 'RSK',
      views: ['list', 'kanban', 'timeline'],
      fields: base([
        { key: 'probability', type: 'select', label: L('Probability (1-5)', 'الاحتمالية (1-5)'), options: ['1', '2', '3', '4', '5'], required: true, system: true },
        { key: 'impact',      type: 'select', label: L('Impact (1-5)', 'الأثر (1-5)'), options: ['1', '2', '3', '4', '5'], required: true, system: true },
        { key: 'owner',       type: 'user',   label: L('Risk Owner', 'مالك الخطر'), required: true, system: true },
        { key: 'contractor',  type: 'contractor', label: L('Contractor', 'المقاول') },
        { key: 'mitigation',  type: 'textarea', label: L('Mitigation Plan', 'خطة المعالجة') },
        { key: 'dueDate',     type: 'date',   label: L('Review Date', 'تاريخ المراجعة') },
      ]),
      statuses: [
        ST('open', 'Open', 'مفتوح', '#60a5fa'), ST('mitigating', 'Mitigating', 'قيد المعالجة', '#22d3ee'),
        ST('escalated', 'Escalated', 'مُصعَّد', '#f87171'), ST('accepted', 'Accepted', 'مقبول', '#a78bfa'),
        ST('closed', 'Closed', 'مغلق', '#34d399', true),
      ],
      categories: [
        { key: 'schedule', label: L('Schedule', 'الجدول الزمني') }, { key: 'cost', label: L('Cost', 'التكلفة') },
        { key: 'safety', label: L('Safety', 'السلامة') }, { key: 'design', label: L('Design', 'التصميم') },
        { key: 'procurement', label: L('Procurement', 'المشتريات') }, { key: 'stakeholder', label: L('Stakeholders', 'أصحاب المصلحة') },
        { key: 'logistics', label: L('Logistics', 'اللوجستيات') },
      ],
      tags: ['طويل الأمد', 'مالي', 'سمعة', 'تشغيلي'],
    },
    issue: {
      icon: '🧩', label: L('Issue', 'معضلة'), refPrefix: 'ISS',
      views: ['list', 'kanban', 'timeline'],
      fields: base([
        { key: 'severity', type: 'select', label: L('Severity', 'الخطورة'), options: ['critical', 'high', 'medium', 'low'], required: true, system: true },
        { key: 'owner',    type: 'user',   label: L('Owner', 'المالك'), required: true, system: true },
        { key: 'contractor', type: 'contractor', label: L('Contractor', 'المقاول') },
        { key: 'rootCause',  type: 'textarea', label: L('Root Cause Analysis', 'تحليل السبب الجذري') },
        { key: 'corrective', type: 'textarea', label: L('Corrective Action', 'الإجراء التصحيحي') },
        { key: 'preventive', type: 'textarea', label: L('Preventive Action', 'الإجراء الوقائي') },
        { key: 'dueDate',    type: 'date',  label: L('Target Closure', 'تاريخ الإغلاق المستهدف') },
      ]),
      statuses: [
        ST('open', 'Open', 'مفتوحة', '#f87171'), ST('analysis', 'Under Analysis', 'قيد التحليل', '#f5b942'),
        ST('action', 'Action In Progress', 'إجراء قيد التنفيذ', '#22d3ee'), ST('monitoring', 'Monitoring', 'تحت المراقبة', '#a78bfa'),
        ST('closed', 'Closed', 'مغلقة', '#34d399', true),
      ],
      categories: [
        { key: 'design', label: L('Design', 'تصميم') }, { key: 'site', label: L('Site', 'موقع') },
        { key: 'contractual', label: L('Contractual', 'تعاقدي') }, { key: 'authority', label: L('Authorities', 'جهات حكومية') },
        { key: 'interface', label: L('Interface', 'تداخلات') }, { key: 'material', label: L('Materials', 'مواد') },
      ],
      tags: ['متكرر', 'حرج للمسار', 'مطالبة محتملة'],
    },
    constraint: {
      icon: '🚩', label: L('Issue / Constraint', 'معوق / مشكلة'), refPrefix: 'CST',
      views: ['list', 'kanban', 'timeline'],
      fields: [
        { key: 'title',       type: 'text',     label: L('Title', 'العنوان'), required: true, system: true },
        { key: 'description', type: 'textarea', label: L('Description', 'الوصف'), system: true },
        { key: 'zone',        type: 'text',     label: L('Zone / Area', 'المنطقة / القطاع'), system: true },
        { key: 'street',      type: 'text',     label: L('Street / Location', 'الشارع / الموقع'), system: true },
        { key: 'gps',         type: 'gps',      label: L('GPS', 'الإحداثيات') },
        { key: 'subcategory', type: 'text',     label: L('Subcategory', 'الفئة الفرعية') },
        { key: 'priority',    type: 'priority', label: L('Priority', 'الأولوية'), system: true },
        { key: 'severity',    type: 'select',   label: L('Severity', 'الخطورة'), options: ['critical', 'high', 'medium', 'low'], system: true },
        { key: 'responsibleParty', type: 'select', label: L('Responsible Party', 'الجهة المسؤولة'),
          options: ['contractor', 'consultant', 'developer', 'client', 'authority', 'internal'], required: true, system: true },
        { key: 'currentOwner', type: 'user',    label: L('Current Owner', 'المالك الحالي'), required: true, system: true },
        { key: 'assignedTo',  type: 'user',     label: L('Assigned To', 'مسند إلى') },
        { key: 'raisedBy',    type: 'user',     label: L('Raised By', 'مُسجَّل بواسطة') },
        { key: 'sentTo',      type: 'text',     label: L('Sent To', 'أُرسل إلى'), system: true },
        { key: 'contractor',  type: 'contractor', label: L('Contractor', 'المقاول') },
        { key: 'consultant',  type: 'text',     label: L('Consultant', 'الاستشاري') },
        { key: 'developer',   type: 'text',     label: L('Developer', 'المطور') },
        { key: 'clientParty', type: 'text',     label: L('Client', 'العميل') },
        { key: 'extRef',      type: 'text',     label: L('Reference No.', 'الرقم المرجعي') },
        { key: 'impactedActivity',  type: 'text', label: L('Impacted Activity', 'النشاط المتأثر') },
        { key: 'impactedMilestone', type: 'text', label: L('Impacted Milestone', 'المعلم المتأثر') },
        { key: 'impactedWorkfront', type: 'text', label: L('Impacted Workfront', 'جبهة العمل المتأثرة') },
        { key: 'dueDate',       type: 'date',   label: L('Due Date', 'تاريخ الاستحقاق'), system: true },
        { key: 'targetClosure', type: 'date',   label: L('Target Closure', 'الإغلاق المستهدف') },
        { key: 'notes',         type: 'textarea', label: L('Notes', 'ملاحظات') },
        { key: 'tags', type: 'tags', label: L('Tags', 'الوسوم'), system: true },
      ],
      statuses: [
        ST('draft', 'Draft', 'مسودة', '#94a3b8'),
        ST('submitted', 'Submitted', 'مُقدَّم', '#60a5fa'),
        ST('sent', 'Sent', 'مُرسَل', '#38bdf8'),
        ST('received', 'Received', 'مُستلَم', '#2dd4bf'),
        ST('review', 'Under Review', 'قيد المراجعة', '#f5b942'),
        ST('actionreq', 'Action Required', 'يتطلب إجراء', '#fb923c'),
        ST('inprogress', 'In Progress', 'قيد المعالجة', '#22d3ee'),
        ST('pendingresp', 'Pending Response', 'بانتظار الرد', '#c084fc'),
        ST('blocked', 'Blocked', 'متعثر', '#f87171'),
        ST('escalated', 'Escalated', 'مُصعَّد', '#ef4444'),
        ST('readyclosure', 'Ready for Closure', 'جاهز للإغلاق', '#a3e635'),
        ST('closed', 'Closed', 'مغلق', '#34d399', true),
        ST('rejectedclosure', 'Closure Rejected', 'إغلاق مرفوض', '#f43f5e'),
        ST('reopened', 'Reopened', 'أُعيد فتحه', '#f97316'),
        ST('cancelled', 'Cancelled', 'ملغي', '#64748b', true),
      ],
      categories: [
        { key: 'utility', label: L('Utility Conflict', 'تعارض مرافق') },
        { key: 'contractorDelay', label: L('Contractor Delay', 'تأخير مقاول') },
        { key: 'developerDep', label: L('Developer Dependency', 'اعتمادية على المطور') },
        { key: 'siteProblem', label: L('Site Problem', 'مشكلة موقع') },
        { key: 'authority', label: L('Authorities / Permits', 'جهات حكومية / تصاريح') },
        { key: 'design', label: L('Design', 'تصميم') },
        { key: 'landAccess', label: L('Land / Right of Way', 'أراضٍ / حرم طريق') },
        { key: 'logistics', label: L('Logistics', 'لوجستيات') },
        { key: 'commercial', label: L('Commercial', 'تجاري') },
        { key: 'other', label: L('Other', 'أخرى') },
      ],
      tags: ['حرج للمسار', 'مطالبة محتملة', 'جهة خارجية', 'متكرر'],
    },
    observation: {
      icon: '📸', label: L('Observation', 'ملاحظة ميدانية'), refPrefix: 'OBS',
      views: ['gallery', 'kanban', 'timeline', 'map', 'list'],
      fields: base([
        prioField,
        { key: 'contractor', type: 'contractor', label: L('Contractor', 'المقاول'), required: true, system: true },
        { key: 'location',   type: 'text', label: L('Location', 'الموقع'), system: true },
        { key: 'gps',        type: 'gps',  label: L('GPS', 'الإحداثيات'), system: true },
        { key: 'dueDate',    type: 'date', label: L('Due Date', 'تاريخ الاستحقاق'), system: true },
        { key: 'photos',     type: 'attachments', label: L('Photos / Videos', 'الصور / الفيديو'), system: true },
        { key: 'obsType',    type: 'select', label: L('Type', 'النوع'), options: ['safety', 'quality', 'progress', 'environment', 'housekeeping'], system: true },
      ]),
      statuses: [
        ST('open', 'Open', 'مفتوحة', '#f87171'), ST('inprogress', 'In Progress', 'قيد المعالجة', '#22d3ee'),
        ST('review', 'Pending Approval', 'بانتظار الاعتماد', '#f5b942'), ST('closed', 'Closed', 'مغلقة', '#34d399', true),
      ],
      categories: [
        { key: 'structural', label: L('Structural', 'إنشائي') }, { key: 'mep', label: L('MEP', 'كهروميكانيك') },
        { key: 'finishes', label: L('Finishes', 'تشطيبات') }, { key: 'earthworks', label: L('Earthworks', 'أعمال ترابية') },
        { key: 'roads', label: L('Roads', 'طرق') }, { key: 'utilities', label: L('Utilities', 'مرافق') },
      ],
      tags: ['NCR محتمل', 'إيقاف عمل', 'سلامة عالية'],
    },
    correspondence: {
      icon: '✉️', label: L('Correspondence', 'مراسلة'), refPrefix: 'COR',
      views: ['list', 'kanban', 'timeline'],
      fields: base([
        { key: 'direction', type: 'select', label: L('Direction', 'الاتجاه'), options: ['incoming', 'outgoing'], required: true, system: true },
        { key: 'reference', type: 'text', label: L('Reference No.', 'الرقم المرجعي'), system: true },
        { key: 'from',  type: 'text', label: L('From', 'من'), system: true },
        { key: 'toParty', type: 'text', label: L('To', 'إلى'), system: true },
        { key: 'contractor', type: 'contractor', label: L('Contractor', 'المقاول') },
        { key: 'responseDue', type: 'date', label: L('Response Due', 'موعد الرد'), system: true },
        { key: 'attachments', type: 'attachments', label: L('Attachments', 'المرفقات') },
        prioField,
      ]),
      statuses: [
        ST('open', 'Open', 'مفتوحة', '#60a5fa'), ST('awaiting', 'Awaiting Response', 'بانتظار الرد', '#f5b942'),
        ST('escalated', 'Escalated', 'مُصعَّدة', '#f87171'), ST('closed', 'Closed', 'مغلقة', '#34d399', true),
      ],
      categories: [
        { key: 'technical', label: L('Technical', 'فنية') }, { key: 'commercial', label: L('Commercial', 'تجارية') },
        { key: 'contractual', label: L('Contractual', 'تعاقدية') }, { key: 'claims', label: L('Claims', 'مطالبات') },
        { key: 'authority', label: L('Authorities', 'جهات حكومية') },
      ],
      tags: ['رد مطلوب', 'مهلة تعاقدية'],
    },
    meeting: {
      icon: '🗓️', label: L('Meeting', 'اجتماع'), refPrefix: 'MTG',
      views: ['list', 'timeline'],
      fields: base([
        { key: 'date',  type: 'date', label: L('Date', 'التاريخ'), required: true, system: true },
        { key: 'time',  type: 'text', label: L('Time', 'الوقت') },
        { key: 'location', type: 'text', label: L('Location', 'المكان') },
        { key: 'attendees', type: 'textarea', label: L('Attendees', 'الحضور'), system: true },
        { key: 'minutes',   type: 'textarea', label: L('Minutes', 'محضر الاجتماع'), system: true },
        { key: 'decisions', type: 'textarea', label: L('Decisions', 'القرارات'), system: true },
        { key: 'contractor', type: 'contractor', label: L('Contractor', 'المقاول') },
      ]),
      statuses: [
        ST('scheduled', 'Scheduled', 'مجدول', '#60a5fa'), ST('held', 'Held', 'منعقد', '#22d3ee'),
        ST('momissued', 'MOM Issued', 'صدر المحضر', '#34d399', true), ST('cancelled', 'Cancelled', 'ملغي', '#64748b', true),
      ],
      categories: [
        { key: 'progress', label: L('Progress', 'تقدم الأعمال') }, { key: 'technical', label: L('Technical', 'فني') },
        { key: 'safety', label: L('HSE', 'سلامة') }, { key: 'commercial', label: L('Commercial', 'تجاري') },
        { key: 'steering', label: L('Steering Committee', 'لجنة توجيهية') },
      ],
      tags: ['أسبوعي', 'شهري', 'طارئ'],
    },
    lesson: {
      icon: '💡', label: L('Lesson Learned', 'درس مستفاد'), refPrefix: 'LSN',
      views: ['gallery', 'list'],
      fields: base([
        { key: 'lessonType', type: 'select', label: L('Type', 'النوع'), options: ['bestPractice', 'failure', 'successStory', 'recommendation'], required: true, system: true },
        { key: 'phase', type: 'select', label: L('Phase', 'المرحلة'), options: ['design', 'procurement', 'construction', 'commissioning', 'handover'] },
        { key: 'impactDesc', type: 'textarea', label: L('Impact', 'الأثر') },
        { key: 'recommendationText', type: 'textarea', label: L('Recommendation', 'التوصية'), system: true },
        { key: 'attachments', type: 'attachments', label: L('Attachments', 'المرفقات') },
      ]),
      statuses: [
        ST('draft', 'Draft', 'مسودة', '#64748b'), ST('review', 'Under Review', 'قيد المراجعة', '#f5b942'),
        ST('published', 'Published', 'منشور', '#34d399', true),
      ],
      categories: [
        { key: 'engineering', label: L('Engineering', 'هندسة') }, { key: 'planning', label: L('Planning', 'تخطيط') },
        { key: 'safety', label: L('Safety', 'سلامة') }, { key: 'procurement', label: L('Procurement', 'مشتريات') },
        { key: 'stakeholders', label: L('Stakeholders', 'أصحاب مصلحة') },
      ],
      tags: ['قابل للتعميم', 'مرتبط بعقد'],
    },
    document: {
      icon: '📐', label: L('Document', 'وثيقة'), refPrefix: 'DOC',
      views: ['list', 'kanban'],
      fields: base([
        { key: 'docType', type: 'select', label: L('Document Type', 'نوع الوثيقة'),
          options: ['drawing', 'report', 'itp', 'methodStatement', 'submittal', 'rfi', 'transmittal'], required: true, system: true },
        { key: 'docNumber', type: 'text', label: L('Document No.', 'رقم الوثيقة'), system: true },
        { key: 'revision', type: 'text', label: L('Revision', 'الإصدار'), system: true },
        { key: 'discipline', type: 'select', label: L('Discipline', 'التخصص'),
          options: ['architectural', 'structural', 'mechanical', 'electrical', 'civil', 'general'] },
        { key: 'contractor', type: 'contractor', label: L('Originator', 'الجهة المصدرة') },
        { key: 'dueDate', type: 'date', label: L('Review Due', 'موعد المراجعة') },
        { key: 'attachments', type: 'attachments', label: L('Files', 'الملفات') },
      ]),
      statuses: [
        ST('draft', 'Draft', 'مسودة', '#64748b'), ST('review', 'Under Review', 'قيد المراجعة', '#f5b942'),
        ST('approved', 'Approved', 'معتمدة', '#34d399', true), ST('approvedc', 'Approved w/ Comments', 'معتمدة بملاحظات', '#22d3ee', true),
        ST('rejected', 'Rejected', 'مرفوضة', '#f87171', true),
      ],
      categories: [
        { key: 'permanent', label: L('Permanent Works', 'أعمال دائمة') }, { key: 'temporary', label: L('Temporary Works', 'أعمال مؤقتة') },
        { key: 'qaqc', label: L('QA/QC', 'ضبط الجودة') }, { key: 'hse', label: L('HSE', 'سلامة وبيئة') },
      ],
      tags: ['عاجل', 'حرج للمسار'],
    },
  };
}

/* ---------- seed: portfolio, users, contractors, records ---------- */
function seedDB() {
  const users = [
    { id: 'u1', name: 'فيصل المزودة', nameEn: 'Faisal Almzoda', role: 'admin', email: 'faisalalmzoda114@gmail.com', initials: 'فم' },
    { id: 'u2', name: 'م. سارة العتيبي', nameEn: 'Eng. Sarah AlOtaibi', role: 'pm', email: 'sarah@cpos.sa', initials: 'سع' },
    { id: 'u3', name: 'م. خالد الشمري', nameEn: 'Eng. Khaled AlShammari', role: 'engineer', email: 'khaled@cpos.sa', initials: 'خش' },
    { id: 'u4', name: 'م. نورة القحطاني', nameEn: 'Eng. Noura AlQahtani', role: 'engineer', email: 'noura@cpos.sa', initials: 'نق' },
    { id: 'u5', name: 'أ. عبدالله الحربي', nameEn: 'Abdullah AlHarbi', role: 'doccontrol', email: 'abdullah@cpos.sa', initials: 'عح' },
    { id: 'u6', name: 'د. منى السبيعي', nameEn: 'Dr. Mona AlSubaie', role: 'executive', email: 'mona@cpos.sa', initials: 'مس' },
  ];
  const roles = [
    { key: 'admin',      label: L('System Admin', 'مدير النظام'), modules: ['*'] },
    { key: 'executive',  label: L('Executive', 'تنفيذي'), modules: ['exec', 'portfolio', 'risks', 'issues', 'contractors', 'ai', 'dashbuilder', 'meetings'] },
    { key: 'pm',         label: L('Project Manager', 'مدير مشروع'), modules: ['exec', 'portfolio', 'actions', 'risks', 'issues', 'observations', 'contractors', 'correspondence', 'meetings', 'lessons', 'documents', 'dashbuilder', 'workflow', 'ai'] },
    { key: 'engineer',   label: L('Engineer', 'مهندس'), modules: ['exec', 'actions', 'risks', 'issues', 'observations', 'meetings', 'lessons', 'documents', 'ai'] },
    { key: 'doccontrol', label: L('Document Controller', 'ضابط وثائق'), modules: ['exec', 'correspondence', 'documents', 'meetings', 'ai'] },
    { key: 'viewer',     label: L('Viewer', 'مُطّلع'), modules: ['exec', 'portfolio'] },
  ];
  const contractors = [
    { id: 'c1', name: 'شركة البناء المتحدة', nameEn: 'United Construction Co.', icon: '🏢',
      contacts: [{ name: 'م. أحمد فؤاد', role: 'مدير المشروع', phone: '0501234567', email: 'a.fouad@ucc.sa' }],
      contracts: [{ no: 'CNT-2024-011', scope: 'الأعمال الإنشائية والتشطيبات', value: 480, start: dOff(-420), end: dOff(240) }],
      scores: { safety: 88, quality: 84, schedule: 76, commercial: 81, risk: 79 } },
    { id: 'c2', name: 'مجموعة الإنشاءات الحديثة', nameEn: 'Modern Constructions Group', icon: '🏗️',
      contacts: [{ name: 'م. طارق سليم', role: 'مدير العمليات', phone: '0552223344', email: 't.salim@mcg.sa' }],
      contracts: [{ no: 'CNT-2024-018', scope: 'الأعمال الكهروميكانيكية', value: 310, start: dOff(-365), end: dOff(300) }],
      scores: { safety: 92, quality: 90, schedule: 88, commercial: 85, risk: 90 } },
    { id: 'c3', name: 'شركة الأسس العالمية', nameEn: 'Global Foundations Co.', icon: '⛏️',
      contacts: [{ name: 'م. ياسر النعيمي', role: 'مدير الموقع', phone: '0533334455', email: 'y.naimi@gfc.sa' }],
      contracts: [{ no: 'CNT-2023-042', scope: 'أعمال الحفر والأساسات العميقة', value: 195, start: dOff(-540), end: dOff(60) }],
      scores: { safety: 71, quality: 74, schedule: 62, commercial: 70, risk: 58 } },
    { id: 'c4', name: 'شركة دلتا للمقاولات', nameEn: 'Delta Contracting', icon: '🚧',
      contacts: [{ name: 'م. هاني عبدالرحمن', role: 'مدير المشروع', phone: '0544445566', email: 'h.abdulrahman@delta.sa' }],
      contracts: [{ no: 'CNT-2024-007', scope: 'أعمال الطرق والبنية التحتية', value: 260, start: dOff(-400), end: dOff(180) }],
      scores: { safety: 80, quality: 78, schedule: 71, commercial: 76, risk: 72 } },
    { id: 'c5', name: 'التحالف الهندسي', nameEn: 'Engineering Alliance', icon: '🛰️',
      contacts: [{ name: 'م. ريم الدوسري', role: 'مديرة التصميم', phone: '0566667788', email: 'r.dosari@ealliance.sa' }],
      contracts: [{ no: 'CNT-2024-025', scope: 'التصميم والإشراف الهندسي', value: 95, start: dOff(-300), end: dOff(365) }],
      scores: { safety: 95, quality: 93, schedule: 90, commercial: 88, risk: 92 } },
    { id: 'c6', name: 'شركة الرواد للبنية التحتية', nameEn: 'Pioneers Infrastructure', icon: '🌉',
      contacts: [{ name: 'م. سعد المالكي', role: 'مدير المشروع', phone: '0577778899', email: 's.malki@pioneers.sa' }],
      contracts: [{ no: 'CNT-2023-051', scope: 'شبكات المياه والصرف', value: 175, start: dOff(-480), end: dOff(120) }],
      scores: { safety: 84, quality: 80, schedule: 83, commercial: 79, risk: 81 } },
  ];

  const projects = [
    { id: 'p1', code: 'RYD-001', name: 'أبراج البوابة الشمالية', nameEn: 'North Gate Towers',
      program: 'برنامج الرياض الكبرى', region: 'الرياض', client: 'شركة التطوير العمراني', package: 'حزمة الأبراج',
      contractorId: 'c1', budget: 1850, progress: 58, plannedProgress: 64, icon: '🏙️',
      milestones: [
        { title: 'اكتمال الهيكل الخرساني — البرج A', date: dOff(18) }, { title: 'بدء أعمال الواجهات', date: dOff(40) },
        { title: 'تسليم الطابق النموذجي', date: dOff(75) }, { title: 'اكتمال أعمال الكهروميكانيك 50%', date: dOff(110) },
      ] },
    { id: 'p2', code: 'RYD-002', name: 'توسعة محور الملك سلمان', nameEn: 'King Salman Corridor Expansion',
      program: 'برنامج الرياض الكبرى', region: 'الرياض', client: 'أمانة منطقة الرياض', package: 'حزمة الطرق',
      contractorId: 'c4', budget: 920, progress: 41, plannedProgress: 45, icon: '🛣️',
      milestones: [{ title: 'تحويل المرور — المرحلة 2', date: dOff(12) }, { title: 'اكتمال جسر التقاطع الرابع', date: dOff(95) }] },
    { id: 'p3', code: 'RYD-003', name: 'المركز المالي — حزمة B', nameEn: 'Financial District — Package B',
      program: 'برنامج الرياض الكبرى', region: 'الرياض', client: 'صندوق الاستثمارات', package: 'حزمة الأبراج',
      contractorId: 'c2', budget: 2400, progress: 73, plannedProgress: 70, icon: '🏦',
      milestones: [{ title: 'الاختبار والتشغيل — أنظمة HVAC', date: dOff(25) }, { title: 'التسليم الابتدائي للمنطقة 1', date: dOff(140) }] },
    { id: 'p4', code: 'JED-001', name: 'الواجهة البحرية — المرحلة الثالثة', nameEn: 'Jeddah Waterfront — Phase 3',
      program: 'برنامج جدة التاريخية', region: 'جدة', client: 'أمانة محافظة جدة', package: 'حزمة التطوير الساحلي',
      contractorId: 'c6', budget: 640, progress: 35, plannedProgress: 38, icon: '🌊',
      milestones: [{ title: 'اكتمال الحماية البحرية', date: dOff(30) }, { title: 'افتتاح الممشى الجنوبي', date: dOff(160) }] },
    { id: 'p5', code: 'JED-002', name: 'صالة الشحن الجديدة — المطار', nameEn: 'New Cargo Terminal',
      program: 'برنامج جدة التاريخية', region: 'جدة', client: 'هيئة الطيران المدني', package: 'حزمة المباني',
      contractorId: 'c2', budget: 510, progress: 22, plannedProgress: 20, icon: '✈️',
      milestones: [{ title: 'اكتمال الأساسات', date: dOff(20) }, { title: 'تركيب الهيكل المعدني', date: dOff(85) }] },
    { id: 'p6', code: 'NEO-001', name: 'البنية التحتية — المنطقة الصناعية', nameEn: 'Industrial Zone Infrastructure',
      program: 'برنامج المدن الجديدة', region: 'تبوك', client: 'شركة المدن الصناعية', package: 'حزمة البنية التحتية',
      contractorId: 'c3', budget: 1320, progress: 47, plannedProgress: 56, icon: '🏭',
      milestones: [{ title: 'اكتمال شبكة الصرف الرئيسية', date: dOff(8) }, { title: 'تشغيل محطة الكهرباء المؤقتة', date: dOff(55) }] },
    { id: 'p7', code: 'NEO-002', name: 'محطة تحلية المياه المستقلة', nameEn: 'Independent Desalination Plant',
      program: 'برنامج المدن الجديدة', region: 'تبوك', client: 'شركة المياه الوطنية', package: 'حزمة المرافق',
      contractorId: 'c6', budget: 1750, progress: 64, plannedProgress: 61, icon: '💧',
      milestones: [{ title: 'وصول وحدات التناضح العكسي', date: dOff(15) }, { title: 'بدء الاختبارات الرطبة', date: dOff(120) }] },
    { id: 'p8', code: 'DMM-001', name: 'مجمع المستشفيات التخصصي', nameEn: 'Specialized Hospitals Complex',
      program: 'برنامج المنشآت الصحية', region: 'الدمام', client: 'وزارة الصحة', package: 'حزمة المباني',
      contractorId: 'c1', budget: 2100, progress: 30, plannedProgress: 33, icon: '🏥',
      milestones: [{ title: 'اكتمال هيكل برج العيادات', date: dOff(45) }, { title: 'اعتماد التصاميم الطبية النهائية', date: dOff(10) }] },
  ];

  /* ---- record factory ---- */
  const counters = {};
  const mk = (type, projectId, data, ageDays, prefix) => {
    counters[type] = (counters[type] || 0) + 1;
    const created = dOff(-ageDays);
    return Object.assign({
      id: uid(type), ref: `${prefix}-${String(counters[type]).padStart(4, '0')}`,
      projectId, status: 'open', tags: [], archived: false,
      createdAt: created, updatedAt: dOff(-Math.floor(ageDays / 3)), createdBy: 'u2',
      history: [{ at: created, by: 'u2', text: LANG === 'ar' ? 'تم الإنشاء' : 'Created' }],
    }, data);
  };

  const E = { action: [], risk: [], issue: [], constraint: [], observation: [], correspondence: [], meeting: [], lesson: [], document: [] };

  /* ---- risks ---- */
  const riskPool = [
    ['تأخر اعتماد التصاميم من الجهات الحكومية يؤثر على المسار الحرج', 'schedule', 4, 5, 'escalated', 95],
    ['ارتفاع أسعار حديد التسليح يتجاوز المخصصات التعاقدية', 'cost', 4, 4, 'mitigating', 120],
    ['نقص العمالة الماهرة في أعمال الواجهات الزجاجية', 'schedule', 3, 4, 'open', 60],
    ['تداخل أعمال المرافق مع شبكات قائمة غير موثقة', 'design', 4, 4, 'mitigating', 80],
    ['تأخر توريد المعدات الكهربائية الرئيسية (محولات)', 'procurement', 3, 5, 'escalated', 140],
    ['عدم استقرار التربة في القطاع الشمالي يتطلب معالجة إضافية', 'design', 3, 4, 'mitigating', 75],
    ['مخاطر السلامة في الأعمال المرتفعة خلال موسم الرياح', 'safety', 3, 5, 'open', 30],
    ['اعتراض ملاك الأراضي المجاورة على مسارات النقل', 'stakeholder', 2, 3, 'open', 50],
    ['تعارض جدول المقاول الفرعي للكهروميكانيك مع المقاول الرئيسي', 'schedule', 3, 3, 'mitigating', 45],
    ['تجاوز معدلات استهلاك الديزل المخططة لمولدات الموقع', 'cost', 2, 2, 'accepted', 90],
    ['عدم توفر منافذ تصريف معتمدة لمياه نزح الحفر', 'logistics', 3, 3, 'open', 25],
    ['احتمال مطالبات تعويض عن أوامر التغيير المتراكمة', 'cost', 4, 4, 'open', 110],
    ['تأخر إصدار تصاريح العمل الليلي من الأمانة', 'stakeholder', 3, 2, 'closed', 150],
    ['انقطاع سلاسل الإمداد للمواد المستوردة من شرق آسيا', 'procurement', 2, 4, 'mitigating', 100],
  ];
  projects.forEach((p, pi) => {
    const n = pi === 0 ? 14 : 6 + (pi % 4);
    for (let i = 0; i < n; i++) {
      const r = riskPool[(i + pi * 3) % riskPool.length];
      E.risk.push(mk('risk', p.id, {
        title: r[0], category: r[1], probability: String(r[2]), impact: String(r[3]),
        status: pi === 0 ? r[4] : (i % 5 === 0 ? 'closed' : r[4]),
        owner: users[(i % 4) + 1].id, contractor: p.contractorId,
        mitigation: 'متابعة أسبوعية مع الجهات المعنية، وتفعيل بدائل التوريد، ورفع تقرير شهري للجنة التوجيهية.',
        dueDate: dOff(7 + (i * 9) % 60), tags: i % 3 === 0 ? ['مالي'] : [],
        description: 'تم رصد الخطر خلال مراجعات الجدول الزمني الدورية وتقييم أثره على المسار الحرج والتكلفة.',
      }, r[5] - pi * 4, 'RSK'));
    }
  });

  /* ---- issues ---- */
  const issuePool = [
    ['عدم مطابقة نتائج اختبارات الخرسانة للمواصفات في الطابق 12', 'site', 'critical', 'open', 40],
    ['تعارض مناسيب شبكة الصرف مع التصميم المعتمد', 'design', 'high', 'analysis', 65],
    ['توقف أعمال الحفر بسبب اكتشاف خدمات غير مسجلة', 'site', 'critical', 'action', 22],
    ['تأخر المقاول في تقديم برنامج الأعمال المحدث', 'contractual', 'medium', 'open', 55],
    ['رفض الدفعة المستخلصة رقم 14 لنقص المستندات', 'contractual', 'high', 'action', 33],
    ['نقص تصاريح العمالة يؤثر على ورديات العمل الليلية', 'authority', 'high', 'open', 28],
    ['تضارب واجهات العمل بين مقاول المباني ومقاول البنية التحتية', 'interface', 'high', 'analysis', 47],
    ['تشققات سطحية في البلاطة الأرضية للمنطقة C', 'site', 'medium', 'monitoring', 70],
    ['تأخر اعتماد عينات مواد التشطيب من الاستشاري', 'design', 'medium', 'open', 36],
    ['عدم التزام مقاول فرعي بإجراءات الرفع الآمن', 'site', 'critical', 'action', 15],
    ['اختلاف كميات الحفر الفعلية عن جداول الكميات', 'contractual', 'medium', 'closed', 95],
    ['انقطاع متكرر للتيار الكهربائي المؤقت بالموقع', 'site', 'low', 'closed', 88],
  ];
  projects.forEach((p, pi) => {
    const n = pi === 0 ? 12 : 5 + (pi % 3);
    for (let i = 0; i < n; i++) {
      const s = issuePool[(i + pi * 2) % issuePool.length];
      E.issue.push(mk('issue', p.id, {
        title: s[0], category: s[1], severity: s[2], status: s[3],
        owner: users[(i % 4) + 1].id, contractor: p.contractorId,
        rootCause: 'ضعف التنسيق المسبق بين الأطراف وعدم تحديث سجلات الخدمات القائمة قبل بدء الأعمال.',
        corrective: 'تشكيل فريق مشترك لحصر الحالة، وإعادة الأعمال غير المطابقة وفق المواصفات.',
        preventive: 'تحديث إجراءات الفحص المسبق وتفعيل قوائم التحقق قبل بدء أي نشاط جديد.',
        dueDate: dOff((i * 7) % 45 - 10),
        description: 'تم تسجيل المعضلة ورفعها لفريق المشروع لتحليل السبب الجذري وتحديد الإجراءات.',
      }, s[4] - pi * 3, 'ISS'));
    }
  });

  /* ---- observations ---- */
  const obsPool = [
    ['عمال على ارتفاع دون أحزمة أمان مكتملة', 'safety', 'structural', 'critical', '🦺', 'البرج A — الطابق 18'],
    ['تكدس مواد بناء يعيق مسارات الطوارئ', 'safety', 'finishes', 'high', '🚧', 'الممر الرئيسي — المنطقة B'],
    ['تعشيش خرساني في عمود رئيسي يتطلب معالجة', 'quality', 'structural', 'critical', '🏗️', 'المحور 5 — الميزانين'],
    ['تركيب تمديدات كهربائية مخالف للمخططات المعتمدة', 'quality', 'mep', 'high', '⚡', 'غرفة الكهرباء الفرعية 3'],
    ['تسرب زيوت من معدات الحفر دون احتواء', 'environment', 'earthworks', 'medium', '🛢️', 'منطقة الحفر الجنوبية'],
    ['نقص لوحات إرشادية في مناطق العمل المشتركة', 'safety', 'roads', 'low', '🪧', 'مدخل البوابة 2'],
    ['عدم معايرة أجهزة المساحة المستخدمة في التوقيع', 'quality', 'earthworks', 'medium', '📐', 'القطاع الشمالي'],
    ['تقدم ممتاز في أعمال العزل المائي للأقبية', 'progress', 'structural', 'low', '✅', 'القبو — المنطقة A'],
    ['ركام ومخلفات بناء غير مفروزة', 'housekeeping', 'utilities', 'medium', '🗑️', 'الساحة الخلفية'],
    ['سقالات غير مثبتة وفق المعايير في الواجهة الشرقية', 'safety', 'finishes', 'critical', '⚠️', 'الواجهة الشرقية — مستوى 9'],
    ['لحامات أنابيب الحريق غير مطابقة لاختبار الضغط', 'quality', 'mep', 'high', '🔥', 'شبكة مكافحة الحريق — قبو'],
    ['التزام جيد بإجراءات الرفع للرافعة البرجية 2', 'progress', 'structural', 'low', '🏆', 'الرافعة TC-02'],
  ];
  projects.forEach((p, pi) => {
    const n = pi === 0 ? 12 : 5 + (pi % 4);
    for (let i = 0; i < n; i++) {
      const o = obsPool[(i + pi) % obsPool.length];
      const sts = ['open', 'inprogress', 'review', 'closed'][i % 4];
      E.observation.push(mk('observation', p.id, {
        title: o[0], obsType: o[1], category: o[2], priority: o[3], emoji: o[4],
        location: o[5], gps: `${(24.5 + (i * 7 % 40) / 100).toFixed(4)}, ${(46.4 + (i * 11 % 50) / 100).toFixed(4)}`,
        mapX: 12 + ((i * 17 + pi * 23) % 76), mapY: 15 + ((i * 29 + pi * 13) % 68),
        status: sts, contractor: p.contractorId, assignee: users[(i % 4) + 1].id,
        dueDate: dOff((i * 5) % 30 - 8),
        photos: [{ name: `IMG_${1000 + i * 3}.jpg` }, { name: `IMG_${1001 + i * 3}.jpg` }].slice(0, 1 + (i % 3)),
        description: 'تم رصد الملاحظة أثناء الجولة التفقدية الدورية وتوثيقها بالصور وإبلاغ ممثل المقاول فوراً.',
        tags: o[3] === 'critical' ? ['سلامة عالية'] : [],
      }, 4 + (i * 6) % 50, 'OBS'));
    }
  });

  /* ---- correspondence ---- */
  const corrPool = [
    ['إشعار تأخير — توريد المصاعد الرئيسية', 'incoming', 'contractual', 'awaiting', 'critical', 12],
    ['طلب تمديد مهلة الرد على RFI-204', 'incoming', 'technical', 'open', 'medium', 6],
    ['رد على ملاحظات اعتماد المخططات التنفيذية للواجهات', 'outgoing', 'technical', 'closed', 'medium', 30],
    ['مطالبة تعويض عن أعمال إضافية — أمر التغيير 17', 'incoming', 'claims', 'escalated', 'critical', 45],
    ['طلب موافقة على مقاول فرعي لأعمال العزل', 'incoming', 'commercial', 'awaiting', 'high', 9],
    ['إشعار بدء أعمال المرحلة الثالثة', 'outgoing', 'contractual', 'closed', 'low', 60],
    ['استفسار حول اشتراطات الدفاع المدني المحدثة', 'outgoing', 'authority', 'awaiting', 'high', 14],
    ['تحديث جدول التوريدات الرئيسية — الربع الثالث', 'incoming', 'commercial', 'open', 'medium', 4],
    ['إنذار بشأن تكرار ملاحظات السلامة دون معالجة', 'outgoing', 'contractual', 'awaiting', 'critical', 18],
    ['طلب اعتماد مواد التشطيب — الحزمة 4', 'incoming', 'technical', 'open', 'medium', 7],
  ];
  projects.forEach((p, pi) => {
    const n = pi === 0 ? 10 : 4 + (pi % 3);
    for (let i = 0; i < n; i++) {
      const c = corrPool[(i + pi * 2) % corrPool.length];
      E.correspondence.push(mk('correspondence', p.id, {
        title: c[0], direction: c[1], category: c[2], status: c[3], priority: c[4],
        reference: `${c[1] === 'incoming' ? 'IN' : 'OUT'}/${p.code}/${2026}/${String(100 + i + pi * 11)}`,
        from: c[1] === 'incoming' ? contractors.find(x => x.id === p.contractorId).name : 'إدارة المشروع',
        toParty: c[1] === 'incoming' ? 'إدارة المشروع' : contractors.find(x => x.id === p.contractorId).name,
        contractor: p.contractorId, responseDue: dOff(c[5] - 10),
        attachments: [{ name: 'letter.pdf' }],
        description: 'مراسلة رسمية مسجلة ضمن نظام ضبط المراسلات مع تتبع مهلة الرد والإجراءات المترتبة.',
      }, c[5], 'COR'));
    }
  });

  /* ---- meetings ---- */
  const mtgPool = [
    ['الاجتماع الأسبوعي لتقدم الأعمال', 'progress', -2, 'momissued'],
    ['اجتماع تنسيق الواجهات بين المقاولين', 'technical', -6, 'momissued'],
    ['اجتماع لجنة السلامة الشهري', 'safety', -12, 'momissued'],
    ['مراجعة الجدول الزمني المحدث Rev.6', 'progress', -16, 'momissued'],
    ['اجتماع اللجنة التوجيهية — الربع الثاني', 'steering', 5, 'scheduled'],
    ['ورشة معالجة معوقات التراخيص', 'technical', 2, 'scheduled'],
    ['الاجتماع التجاري — أوامر التغيير المعلقة', 'commercial', 9, 'scheduled'],
    ['الاجتماع الأسبوعي لتقدم الأعمال', 'progress', 5, 'scheduled'],
  ];
  projects.forEach((p, pi) => {
    const n = pi === 0 ? 8 : 4;
    for (let i = 0; i < n; i++) {
      const m = mtgPool[(i + pi) % mtgPool.length];
      E.meeting.push(mk('meeting', p.id, {
        title: m[0], category: m[1], date: dOff(m[2] - pi), time: '10:00', status: m[3],
        location: 'قاعة اجتماعات الموقع الرئيسية', contractor: p.contractorId,
        attendees: 'م. سارة العتيبي، م. خالد الشمري، ممثل المقاول، ممثل الاستشاري',
        minutes: m[3] === 'momissued' ? 'استعراض نسب الإنجاز الفعلية مقابل المخطط، ومناقشة معوقات التوريد، ومتابعة إغلاق ملاحظات السلامة عالية الخطورة، واعتماد خطة العمل للأسبوع القادم.' : '',
        decisions: m[3] === 'momissued' ? '1) تكثيف ورديات العمل في المنطقة B. 2) رفع تقرير التأخيرات للجنة التوجيهية. 3) إلزام المقاول بخطة استدراك خلال أسبوع.' : '',
        description: 'اجتماع دوري ضمن إيقاع حوكمة المشروع.',
      }, Math.max(2, 20 - m[2]), 'MTG'));
    }
  });

  /* ---- lessons ---- */
  const lsnPool = [
    ['التعاقد المبكر مع موردي المصاعد قلّص مخاطر التأخير', 'bestPractice', 'procurement', 'published'],
    ['تأخر حصر الخدمات القائمة تسبب بتوقف أعمال الحفر 3 أسابيع', 'failure', 'planning', 'published'],
    ['تطبيق النمذجة BIM في تنسيق الكهروميكانيك خفض التعارضات 70%', 'successStory', 'engineering', 'published'],
    ['ضرورة اشتراط مختبر مستقل لاختبارات الخرسانة في العقود القادمة', 'recommendation', 'engineering', 'review'],
    ['برنامج تحفيز السلامة الأسبوعي رفع الالتزام في الموقع', 'bestPractice', 'safety', 'published'],
    ['الاعتماد على مورد وحيد للحديد عرّض المشروع لتقلبات الأسعار', 'failure', 'procurement', 'published'],
    ['إشراك الجهات الحكومية مبكراً سرّع إصدار التصاريح', 'bestPractice', 'stakeholders', 'published'],
    ['توثيق أسبوعي بالطائرات المسيّرة حسم نزاعات نسب الإنجاز', 'successStory', 'planning', 'review'],
  ];
  projects.forEach((p, pi) => {
    const n = pi === 0 ? 8 : 3;
    for (let i = 0; i < n; i++) {
      const l = lsnPool[(i + pi) % lsnPool.length];
      E.lesson.push(mk('lesson', p.id, {
        title: l[0], lessonType: l[1], category: l[2], status: l[3], phase: 'construction',
        impactDesc: 'أثر مباشر على الجدول الزمني والتكلفة وجودة التسليم.',
        recommendationText: 'تعميم الممارسة على بقية مشاريع البرنامج وتضمينها في إجراءات بدء المشاريع الجديدة.',
        description: 'درس مستفاد موثق ضمن قاعدة المعرفة المؤسسية.',
      }, 20 + i * 15, 'LSN'));
    }
  });

  /* ---- documents ---- */
  const docPool = [
    ['المخططات التنفيذية — الواجهات الزجاجية', 'drawing', 'architectural', 'review', 'C'],
    ['تقرير التربة التكميلي — القطاع الشمالي', 'report', 'civil', 'approved', 'B'],
    ['خطة الفحص والاختبار — الأعمال الخرسانية', 'itp', 'structural', 'approved', 'A'],
    ['بيان طريقة العمل — الرفع الثقيل للجسور', 'methodStatement', 'civil', 'review', 'B'],
    ['اعتماد مواد — أنظمة العزل المائي', 'submittal', 'architectural', 'approvedc', 'D'],
    ['RFI — تعارض مناسيب السقف المستعار مع الدكتات', 'rfi', 'mechanical', 'review', 'A'],
    ['إرسالية المخططات المحدثة للجهة المالكة', 'transmittal', 'general', 'approved', 'A'],
    ['بيان طريقة العمل — صب الخرسانة الكتلية', 'methodStatement', 'structural', 'rejected', 'A'],
    ['المخططات التنفيذية — شبكة الحريق', 'drawing', 'mechanical', 'draft', 'B'],
    ['تقرير الفحص غير الإتلافي للحامات', 'report', 'structural', 'approved', 'A'],
  ];
  projects.forEach((p, pi) => {
    const n = pi === 0 ? 10 : 5;
    for (let i = 0; i < n; i++) {
      const d = docPool[(i + pi) % docPool.length];
      E.document.push(mk('document', p.id, {
        title: d[0], docType: d[1], discipline: d[2], status: d[3], revision: d[4],
        docNumber: `${p.code}-${d[1].slice(0, 3).toUpperCase()}-${String(2000 + i * 7 + pi * 3)}`,
        category: 'permanent', contractor: p.contractorId, dueDate: dOff((i * 6) % 25 - 5),
        attachments: [{ name: `${d[1]}_${i}.pdf` }],
        versions: [{ rev: 'A', date: dOff(-60 - i * 5), note: 'إصدار أولي' }, { rev: d[4], date: dOff(-10 - i * 2), note: 'إصدار محدث وفق الملاحظات' }],
        description: 'وثيقة خاضعة لمسار الاعتماد المعتمد في خطة ضبط الوثائق.',
      }, 15 + i * 8, 'DOC'));
    }
  });

  /* ---- actions (linked to sources) ---- */
  const actVerbs = [
    'إغلاق الملاحظة ومعالجة أسبابها الجذرية', 'تقديم خطة استدراك للجدول الزمني', 'رفع تقرير فني للجنة التوجيهية',
    'تحديث سجل المخاطر وخطط المعالجة', 'متابعة الرد على المراسلة قبل انقضاء المهلة', 'استكمال مستندات الدفعة المستخلصة',
    'تنفيذ التوصية وتعميمها على الفرق', 'إعادة تقديم الوثيقة بعد استيفاء الملاحظات', 'عقد ورشة تنسيق بين المقاولين',
    'توفير الكوادر المطلوبة لأعمال الواجهات',
  ];
  const srcMap = [['risk', E.risk], ['issue', E.issue], ['observation', E.observation], ['correspondence', E.correspondence], ['meeting', E.meeting], ['lesson', E.lesson]];
  projects.forEach((p, pi) => {
    const n = pi === 0 ? 18 : 7 + (pi % 4);
    for (let i = 0; i < n; i++) {
      const [srcType, pool] = srcMap[i % srcMap.length];
      const srcRecs = pool.filter(r => r.projectId === p.id);
      const src = srcRecs[i % Math.max(srcRecs.length, 1)];
      const stArr = ['open', 'inprogress', 'pending', 'blocked', 'completed', 'completed', 'open', 'inprogress'];
      E.action.push(mk('action', p.id, {
        title: `${actVerbs[i % actVerbs.length]} — ${src ? src.ref : p.code}`,
        priority: ['critical', 'high', 'medium', 'low'][i % 4],
        status: stArr[i % stArr.length], category: ['technical', 'commercial', 'safety', 'quality', 'coordination'][i % 5],
        assignee: users[(i % 5) + 1].id, contractor: p.contractorId,
        dueDate: dOff((i * 4) % 35 - 12),
        sourceType: srcType, sourceId: src ? src.id : null,
        description: 'إجراء ناتج عن ' + ({ risk: 'سجل المخاطر', issue: 'سجل المعضلات', observation: 'الملاحظات الميدانية', correspondence: 'المراسلات', meeting: 'محضر اجتماع', lesson: 'الدروس المستفادة' }[srcType]) + ' ويتطلب متابعة حتى الإغلاق.',
      }, 3 + (i * 5) % 55, 'ACT'));
    }
  });

  /* ---- workflows ---- */
  const workflows = [
    { id: uid('wf'), name: 'اعتماد الملاحظات الميدانية', entity: 'observation', trigger: 'onStatus', triggerValue: 'review', active: true,
      steps: [
        { type: 'review', role: 'engineer', label: 'مراجعة المهندس المختص', afterDays: 0 },
        { type: 'approval', role: 'pm', label: 'اعتماد مدير المشروع', afterDays: 2 },
        { type: 'notify', role: 'executive', label: 'إشعار الإدارة التنفيذية بالإغلاق', afterDays: 0 },
      ] },
    { id: uid('wf'), name: 'مسار اعتماد الوثائق', entity: 'document', trigger: 'onCreate', triggerValue: '', active: true,
      steps: [
        { type: 'review', role: 'engineer', label: 'مراجعة فنية أولية', afterDays: 3 },
        { type: 'review', role: 'doccontrol', label: 'تدقيق ضبط الوثائق', afterDays: 1 },
        { type: 'approval', role: 'pm', label: 'الاعتماد النهائي', afterDays: 2 },
      ] },
    { id: uid('wf'), name: 'تصعيد المراسلات المتأخرة', entity: 'correspondence', trigger: 'onStatus', triggerValue: 'awaiting', active: true,
      steps: [
        { type: 'notify', role: 'pm', label: 'تنبيه قبل انقضاء المهلة بـ3 أيام', afterDays: 0 },
        { type: 'escalate', role: 'executive', label: 'تصعيد للإدارة التنفيذية عند التجاوز', afterDays: 3 },
      ] },
  ];

  const dashboards = [
    { id: uid('db'), name: 'لوحة المتابعة اليومية', owner: 'u1', widgets: [
      { id: uid('w'), type: 'kpi', entity: 'action', metric: 'overdue', label: 'إجراءات متأخرة', color: '#f87171' },
      { id: uid('w'), type: 'kpi', entity: 'risk', metric: 'critical', label: 'مخاطر حرجة', color: '#fb923c' },
      { id: uid('w'), type: 'kpi', entity: 'observation', metric: 'open', label: 'ملاحظات مفتوحة', color: '#22d3ee' },
      { id: uid('w'), type: 'donut', entity: 'action', groupBy: 'status', label: 'الإجراءات حسب الحالة' },
      { id: uid('w'), type: 'bar', entity: 'issue', groupBy: 'category', label: 'المعضلات حسب الفئة' },
      { id: uid('w'), type: 'list', entity: 'risk', metric: 'top', label: 'أعلى المخاطر' },
    ] },
  ];

  const db = {
    version: 1, currentUserId: null, currentProjectId: null,
    settings: { orgName: 'الإدارة العامة للمشاريع', orgNameEn: 'Projects General Directorate' },
    users, roles, contractors, projects,
    modules: defaultModules(), schemas: defaultSchemas(),
    workflows, dashboards, entities: E,
    counters,
  };
  seedConstraintsFor(db);
  return db;
}

/* ---------- seed: issue & constraint tracking (case files) ---------- */
function seedConstraintsFor(db) {
  db.entities.constraint = db.entities.constraint || [];
  let n = db.counters.constraint || 0;
  const iso = d => d + 'T10:30:00';
  // [title, category, zone, street, party, priority, severity]
  const pool = [
    ['تعارض خط مياه قائم 600مم مع مسار شبكة الصرف الجديدة', 'utility', 'المنطقة A', 'شارع الملك عبدالعزيز', 'developer', 'critical', 'critical'],
    ['تأخر المقاول في تعبئة فريق أعمال الواجهات حسب البرنامج', 'contractorDelay', 'المنطقة B', 'واجهة البرج الشرقية', 'contractor', 'high', 'high'],
    ['بانتظار المطور لتسليم جبهة العمل — القطاع الشمالي', 'developerDep', 'القطاع الشمالي', 'حرم الطريق الدائري', 'developer', 'critical', 'high'],
    ['عدم صدور تصريح الحفر من الأمانة للتقاطع 12', 'authority', 'المنطقة C', 'تقاطع طريق الأمير محمد', 'authority', 'high', 'critical'],
    ['وجود كيبل ألياف بصرية غير مسجل يعترض مسار الحفر', 'utility', 'المنطقة A', 'شارع العليا الفرعي', 'authority', 'high', 'high'],
    ['خلاف على منسوب الربط مع شبكة تصريف السيول القائمة', 'design', 'المنطقة D', 'قناة التصريف الرئيسية', 'consultant', 'medium', 'medium'],
    ['تأخر اعتماد مخططات الورشة لأعمال الجسر', 'design', 'المنطقة B', 'جسر التقاطع 4', 'consultant', 'high', 'medium'],
    ['إغلاق مؤقت لمسار النقل بسبب أعمال مشروع مجاور', 'logistics', 'المدخل الجنوبي', 'طريق الخدمة الموازي', 'developer', 'medium', 'high'],
    ['نزاع على حدود حرم الطريق مع ملاك مجاورين', 'landAccess', 'القطاع الغربي', 'المخطط 7', 'client', 'high', 'critical'],
    ['تعثر توريد مواد الردم المطابقة بالكميات المطلوبة', 'contractorDelay', 'المنطقة E', 'مناطق الردم 3-5', 'contractor', 'medium', 'medium'],
    ['مطالبة المقاول بأمر تغيير قبل استكمال أعمال التحويلات', 'commercial', 'المنطقة C', 'تحويلة المرور 2', 'contractor', 'high', 'high'],
    ['تأخر مناقلة وإزالة عدادات الكهرباء القائمة', 'utility', 'المنطقة F', 'شارع الستين', 'authority', 'medium', 'low'],
  ];
  const stFlow = ['sent', 'pendingresp', 'escalated', 'inprogress', 'blocked', 'closed', 'review', 'actionreq', 'reopened', 'closed', 'submitted', 'received'];
  const partyName = { contractor: 'المقاول', consultant: 'الاستشاري', developer: 'المطور', client: 'العميل', authority: 'الجهة الحكومية', internal: 'فريق المشروع' };

  db.projects.forEach((p, pi) => {
    const cnt = pi === 0 ? 12 : 4 + (pi % 3);
    for (let i = 0; i < cnt; i++) {
      const it = pool[(i + pi * 2) % pool.length];
      const status = stFlow[(i + pi) % stFlow.length];
      const age = 12 + ((i * 17 + pi * 9) % 110);
      const created = dOff(-age);
      const con = db.contractors.find(c => c.id === p.contractorId) || {};
      n++;
      const rec = {
        id: uid('constraint'), ref: `CST-${String(n).padStart(4, '0')}`,
        projectId: p.id, status, archived: false,
        title: it[0], description: 'تم رصد المعوق خلال متابعة الأعمال الميدانية وتقييم أثره على الجدول الزمني وجبهات العمل، وجارٍ تتبعه حتى الإغلاق النهائي.',
        category: it[1], subcategory: '', zone: it[2], street: it[3],
        gps: `${(24.55 + (i * 7 % 40) / 100).toFixed(4)}, ${(46.42 + (i * 11 % 50) / 100).toFixed(4)}`,
        priority: it[5], severity: it[6], responsibleParty: it[4],
        currentOwner: db.users[(i % 4) + 1].id, assignedTo: db.users[(i % 3) + 2].id, raisedBy: 'u2',
        sentTo: partyName[it[4]], contractor: p.contractorId,
        consultant: 'التحالف الهندسي', developer: p.client, clientParty: p.client,
        extRef: `${p.code}/CST/${2026}/${100 + n}`,
        impactedActivity: 'أعمال الحفر والبنية التحتية — ' + it[2],
        impactedMilestone: (p.milestones && p.milestones[0]) ? p.milestones[0].title : '',
        impactedWorkfront: it[2] + ' — ' + it[3],
        dueDate: dOff(((i * 6) % 40) - 12), targetClosure: dOff(((i * 6) % 40) - 5),
        notes: '', tags: it[5] === 'critical' ? ['حرج للمسار'] : [],
        createdAt: created, updatedAt: dOff(-Math.max(1, Math.floor(age / 4))), createdBy: 'u2',
        submittedAt: dOff(-age + 1), sentAt: dOff(-age + 2),
        receivedAt: ['submitted', 'sent'].includes(status) ? '' : dOff(-age + 4),
        escalatedAt: status === 'escalated' ? dOff(-Math.floor(age / 3)) : '',
        closedAt: '', reopenedAt: '',
        followups: [], responses: [], evidence: [], links: [], closures: [],
        history: [{ at: created, by: 'u2', text: 'تم الإنشاء' }],
        timeline: [
          { at: iso(created), by: 'u2', action: 'created', comment: 'تم إنشاء ملف المعوق وتوثيق التفاصيل الأولية.', oldVal: '', newVal: '', attachments: [] },
          { at: iso(dOff(-age + 1)), by: 'u2', action: 'submitted', comment: 'تم تقديم المعوق للاعتماد الداخلي.', oldVal: 'draft', newVal: 'submitted', attachments: [] },
          { at: iso(dOff(-age + 2)), by: 'u2', action: 'sent', comment: `تم الإرسال رسمياً إلى ${partyName[it[4]]}.`, oldVal: 'submitted', newVal: 'sent', attachments: [] },
        ],
      };
      // follow-ups
      const fuN = 1 + (i % 3);
      for (let f = 0; f < fuN; f++) {
        const fd = dOff(-age + 6 + f * 9);
        rec.followups.push({
          id: uid('fu'), date: fd,
          method: ['email', 'meeting', 'phone', 'letter', 'whatsapp'][f % 5],
          fuType: ['firstReminder', 'secondReminder', 'urgentReminder', 'requestUpdate'][f % 4],
          sentToParty: partyName[it[4]], by: db.users[(f % 3) + 1].id,
          comment: 'تمت المتابعة مع الجهة المسؤولة وطلب موافاتنا بالمستجدات وخطة المعالجة.',
          requiredAction: 'تزويدنا بخطة معالجة وموعد إغلاق ملزم.',
          nextDate: dOff(-age + 13 + f * 9), attachment: '', statusAfter: '',
        });
        rec.timeline.push({ at: iso(fd), by: db.users[(f % 3) + 1].id, action: 'followup', comment: 'متابعة — تذكير بالرد المطلوب.', oldVal: '', newVal: '', attachments: [] });
      }
      // responses
      if (!['submitted', 'sent', 'pendingresp'].includes(status) && i % 3 !== 1) {
        const rd = dOff(-Math.max(2, Math.floor(age / 2)));
        const acc = status === 'closed' ? 'accepted' : ['pending', 'moreInfo', 'accepted'][i % 3];
        rec.responses.push({
          id: uid('rs'), date: rd, from: (con.contacts && con.contacts[0]) ? con.contacts[0].name : partyName[it[4]],
          company: it[4] === 'contractor' ? (con.name || '') : partyName[it[4]],
          summary: 'تم استلام رد رسمي يوضح خطة المعالجة والجدول الزمني المقترح.',
          fullText: 'بالإشارة إلى المعوق المرصود، نفيدكم بأنه جارٍ التنسيق مع الجهات المعنية وتخصيص الموارد اللازمة، وسيتم موافاتكم بخطة تنفيذية خلال المدة المحددة.',
          accepted: acc, furtherAction: acc === 'moreInfo' ? 'مطلوب تفاصيل فنية إضافية ومخطط معدل.' : '',
          nextAction: acc === 'accepted' ? 'متابعة التنفيذ حتى الإغلاق.' : 'انتظار استكمال المتطلبات.',
          newDue: '', attachment: 'response_letter.pdf',
        });
        rec.timeline.push({ at: iso(rd), by: rec.currentOwner, action: 'response', comment: 'تم استلام رد من ' + partyName[it[4]] + '.', oldVal: '', newVal: '', attachments: [] });
      }
      // evidence
      rec.evidence.push({
        id: uid('ev'), name: `IMG_${2200 + n}.jpg`, etype: 'photo', stage: 'before',
        desc: 'توثيق حالة الموقع عند رصد المعوق', at: created, by: 'u3', dataUrl: null, linkedStatus: 'sent',
      });
      if (['inprogress', 'blocked', 'escalated', 'closed', 'reopened'].includes(status)) {
        rec.evidence.push({
          id: uid('ev'), name: `IMG_${2300 + n}.jpg`, etype: 'photo', stage: 'during',
          desc: 'متابعة أعمال المعالجة في الموقع', at: dOff(-Math.floor(age / 2)), by: 'u4', dataUrl: null, linkedStatus: status,
        });
      }
      if (status === 'escalated') {
        rec.timeline.push({ at: iso(rec.escalatedAt), by: 'u2', action: 'escalation', comment: 'تصعيد للإدارة التنفيذية لتجاوز مهلة الرد دون معالجة.', oldVal: 'pendingresp', newVal: 'escalated', attachments: [] });
      }
      // closure (one closed-with-evidence, one closed-without for the dashboard highlight)
      if (status === 'closed' || status === 'reopened') {
        const cd = dOff(-Math.max(1, Math.floor(age / 5)));
        const withEv = i % 4 !== 1;
        if (withEv) rec.evidence.push({
          id: uid('ev'), name: `IMG_${2400 + n}.jpg`, etype: 'photo', stage: 'closure',
          desc: 'دليل إغلاق — الموقع بعد المعالجة النهائية', at: cd, by: 'u3', dataUrl: null, linkedStatus: 'closed',
        });
        rec.closures.push({
          at: cd, by: 'u2', verifiedBy: 'u6',
          comment: 'تمت معالجة المعوق بالكامل والتحقق ميدانياً من إزالة أسبابه.',
          ctype: withEv ? 'withEvidence' : 'withoutEvidence',
          evidence: withEv ? [`IMG_${2400 + n}.jpg`] : [], approved: true,
        });
        rec.closedAt = cd;
        rec.timeline.push({ at: iso(cd), by: 'u2', action: 'closed', comment: 'تم إغلاق المعوق بعد التحقق من المعالجة.', oldVal: 'inprogress', newVal: 'closed', attachments: [] });
        if (status === 'reopened') {
          const rd2 = dOff(-2);
          rec.reopenedAt = rd2;
          rec.timeline.push({ at: iso(rd2), by: 'u2', action: 'reopened', comment: 'أُعيد فتح المعوق — تكرار المشكلة في نفس الموقع.', oldVal: 'closed', newVal: 'reopened', attachments: [] });
        }
      }
      db.entities.constraint.push(rec);
    }
  });
  db.counters.constraint = n;
}

/* ---------- Store API ---------- */
const Store = {
  db: null,
  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) { this.db = JSON.parse(raw); this.migrate(); return; }
    } catch (e) { /* corrupted -> reseed */ }
    this.db = seedDB(); this.save();
  },
  // bring older saved databases up to date (new tracker module/entity)
  migrate() {
    let changed = false;
    if (!this.db.schemas.constraint) { this.db.schemas.constraint = defaultSchemas().constraint; changed = true; }
    if (!this.db.modules.some(m => m.key === 'tracker')) {
      const mod = defaultModules().find(m => m.key === 'tracker');
      const idx = this.db.modules.findIndex(m => m.key === 'issues');
      this.db.modules.splice(idx >= 0 ? idx + 1 : this.db.modules.length, 0, mod);
      changed = true;
    }
    if (!this.db.entities.constraint) { seedConstraintsFor(this.db); changed = true; }
    this.db.roles.forEach(r => {
      if (!r.modules.includes('*') && r.modules.includes('issues') && !r.modules.includes('tracker')) {
        r.modules.push('tracker'); changed = true;
      }
    });
    if (changed) this.save();
  },
  save() { localStorage.setItem(DB_KEY, JSON.stringify(this.db)); },
  reset() { localStorage.removeItem(DB_KEY); this.load(); },

  user() { return this.db.users.find(u => u.id === this.db.currentUserId) || null; },
  role() { const u = this.user(); return u ? this.db.roles.find(r => r.key === u.role) : null; },
  can(moduleKey) {
    const r = this.role(); if (!r) return false;
    return r.modules.includes('*') || r.modules.includes(moduleKey);
  },
  isAdmin() { const r = this.role(); return r && r.modules.includes('*'); },

  cur() { return this.db.projects.find(p => p.id === this.db.currentProjectId) || null; },
  setProject(id) { this.db.currentProjectId = id; this.save(); },

  createProject(data) {
    let n = (this.db.counters.project || this.db.projects.length) + 1;
    while (this.db.projects.some(p => p.id === 'p' + n)) n++;
    this.db.counters.project = n;
    const p = Object.assign({
      id: 'p' + n,
      progress: 0, plannedProgress: 0, budget: 0, icon: '🏗️', milestones: [],
    }, data);
    this.db.projects.push(p); this.save();
    return p;
  },
  updateProject(id, patch) {
    const p = this.db.projects.find(x => x.id === id); if (!p) return null;
    Object.assign(p, patch); this.save();
    return p;
  },
  deleteProject(id) {
    this.db.projects = this.db.projects.filter(p => p.id !== id);
    if (this.db.currentProjectId === id) {
      this.db.currentProjectId = (this.db.projects[0] || {}).id || null;
    }
    this.save();
  },

  schema(type) { return this.db.schemas[type]; },
  statusDef(type, key) { return (this.schema(type).statuses || []).find(s => s.key === key); },
  isClosed(type, rec) { const s = this.statusDef(type, rec.status); return s ? !!s.closed : false; },

  list(type, { all = false, archived = false } = {}) {
    const arr = this.db.entities[type] || [];
    return arr.filter(r =>
      (archived ? r.archived : !r.archived) &&
      (all || r.projectId === this.db.currentProjectId));
  },
  get(type, id) { return (this.db.entities[type] || []).find(r => r.id === id); },

  create(type, data) {
    const sch = this.schema(type);
    this.db.counters[type] = (this.db.counters[type] || 0) + 1;
    const rec = Object.assign({
      id: uid(type), ref: `${sch.refPrefix}-${String(this.db.counters[type]).padStart(4, '0')}`,
      projectId: this.db.currentProjectId, status: (sch.statuses[0] || {}).key || 'open',
      tags: [], archived: false, createdAt: todayISO(), updatedAt: todayISO(),
      createdBy: this.db.currentUserId,
      history: [{ at: todayISO(), by: this.db.currentUserId, text: LANG === 'ar' ? 'تم الإنشاء' : 'Created' }],
    }, data);
    this.db.entities[type].push(rec); this.save();
    return rec;
  },
  update(type, id, patch, histText) {
    const rec = this.get(type, id); if (!rec) return null;
    Object.assign(rec, patch, { updatedAt: todayISO() });
    rec.history = rec.history || [];
    rec.history.push({ at: todayISO(), by: this.db.currentUserId, text: histText || (LANG === 'ar' ? 'تم التعديل' : 'Updated') });
    this.save(); return rec;
  },
  remove(type, id) {
    this.db.entities[type] = this.db.entities[type].filter(r => r.id !== id);
    this.save();
  },
  setArchived(type, id, val) {
    this.update(type, id, { archived: val }, val ? (LANG === 'ar' ? 'تمت الأرشفة' : 'Archived') : (LANG === 'ar' ? 'تمت الاستعادة' : 'Restored'));
  },

  // rich activity-log entry (used by the tracker case files)
  logTL(type, id, action, { comment = '', oldVal = '', newVal = '', attachments = [], company = '' } = {}) {
    const rec = this.get(type, id); if (!rec) return null;
    rec.timeline = rec.timeline || [];
    rec.timeline.push({
      at: new Date().toISOString().slice(0, 16).replace('T', 'T'),
      by: this.db.currentUserId, action, comment, oldVal, newVal, attachments, company,
    });
    rec.updatedAt = todayISO();
    this.save();
    return rec;
  },

  contractor(id) { return this.db.contractors.find(c => c.id === id); },
  userById(id) { return this.db.users.find(u => u.id === id); },
  userName(id) { const u = this.userById(id); return u ? (LANG === 'ar' ? u.name : u.nameEn) : '—'; },

  // helpers
  daysOver(rec, field = 'dueDate') {
    if (!rec[field]) return 0;
    return Math.floor((Date.now() - new Date(rec[field]).getTime()) / DAY);
  },
  ageDays(rec) { return Math.max(0, Math.floor((Date.now() - new Date(rec.createdAt).getTime()) / DAY)); },
  riskScore(r) { return (parseInt(r.probability) || 0) * (parseInt(r.impact) || 0); },

  // monthly trend of created vs closed over last n months (from real record dates)
  trend(type, n = 6) {
    const recs = this.list(type);
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const ym = d.toISOString().slice(0, 7);
      const created = recs.filter(r => (r.createdAt || '').slice(0, 7) === ym).length;
      const closed = recs.filter(r => this.isClosed(type, r) && (r.updatedAt || '').slice(0, 7) === ym).length;
      out.push({ label: t('months')[d.getMonth()], created, closed });
    }
    return out;
  },

  // project health score from live data
  health(projectId) {
    const pid = projectId || this.db.currentProjectId;
    const inProj = arr => arr.filter(r => r.projectId === pid && !r.archived);
    const risks = inProj(this.db.entities.risk);
    const issues = inProj(this.db.entities.issue);
    const actions = inProj(this.db.entities.action);
    const obs = inProj(this.db.entities.observation);
    const p = this.db.projects.find(x => x.id === pid) || { progress: 0, plannedProgress: 0 };
    const openCrit = risks.filter(r => !this.isClosed('risk', r) && this.riskScore(r) >= 15).length;
    const critIss = issues.filter(i => !this.isClosed('issue', i) && i.severity === 'critical').length;
    const overdue = actions.filter(a => !this.isClosed('action', a) && this.daysOver(a) > 0).length;
    const openObs = obs.filter(o => !this.isClosed('observation', o) && o.priority === 'critical').length;
    const schedVar = (p.progress || 0) - (p.plannedProgress || 0);
    let score = 100 + Math.min(schedVar * 1.6, 8);
    score -= openCrit * 5 + critIss * 5 + Math.min(overdue * 1.8, 22) + openObs * 2.5;
    return Math.max(8, Math.min(99, Math.round(score)));
  },
};
