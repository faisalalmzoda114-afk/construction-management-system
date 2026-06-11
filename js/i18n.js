/* ============================================================
   i18n — Arabic-first, full RTL/LTR support
   ============================================================ */
const I18N = {
  ar: {
    appName: 'منصة مشاريع التشييد', appTag: 'Project OS — نظام تشغيل المشاريع', theme: 'الثيم',
    login: 'تسجيل الدخول', loginAs: 'الدخول بصفة', welcome: 'مرحباً بك',
    loginHint: 'اختر المستخدم للدخول إلى المنصة',
    selectProject: 'مركز اختيار المشاريع', selectProjectHint: 'اختر مشروعاً للمتابعة — يتحكم المشروع المختار بجميع الوحدات',
    portfolioDash: 'لوحة المحفظة', allProjects: 'كل المشاريع', switchProject: 'تبديل المشروع',
    groupBy: 'تجميع حسب', program: 'البرنامج', region: 'المنطقة', client: 'العميل', package: 'الحزمة', contractor: 'المقاول',
    newProject: 'مشروع جديد', editProject: 'تعديل المشروع', projectCode: 'رمز المشروع', projectNameAr: 'اسم المشروع (عربي)',
    projectNameEn: 'اسم المشروع (إنجليزي)', projectIcon: 'أيقونة المشروع', plannedProgress: 'الإنجاز المخطط',
    milestones: 'المعالم الرئيسية', milestoneTitle: 'عنوان المعلم', milestoneDate: 'التاريخ', addMilestone: '+ إضافة معلم',
    confirmDeleteProject: 'سيتم حذف المشروع نهائياً. هل أنت متأكد؟',
    searchProjects: 'بحث في المشاريع…', search: 'بحث…', logout: 'تسجيل الخروج',
    // nav groups
    gCommand: 'القيادة', gExecution: 'التنفيذ', gKnowledge: 'المعرفة والوثائق', gPlatform: 'المنصة',
    // modules
    mExec: 'مركز القيادة التنفيذية', mPortfolio: 'محفظة المشاريع', mActions: 'مركز إدارة الإجراءات',
    mRisks: 'مركز ذكاء المخاطر', mIssues: 'مركز إدارة المعضلات', mObservations: 'مركز الملاحظات الميدانية',
    mTracker: 'مركز تتبع المعوقات والمشاكل', aiTrackerReport: 'تقرير المعوقات الأسبوعي',
    mSchedule: 'مركز إدارة الجدول الزمني',
    mContractors: 'مركز أداء المقاولين', mCorrespondence: 'مركز المراسلات', mMeetings: 'مركز إدارة الاجتماعات',
    mLessons: 'مركز الدروس المستفادة', mDocuments: 'مركز ضبط الوثائق', mDashBuilder: 'منشئ لوحات المعلومات',
    mWorkflow: 'منشئ مسارات العمل', mAI: 'المساعد الذكي', mAdmin: 'مركز التحكم الإداري',
    // common actions
    add: 'إضافة', edit: 'تعديل', delete: 'حذف', save: 'حفظ', cancel: 'إلغاء', close: 'إغلاق', archive: 'أرشفة',
    escalate: 'تصعيد', export: 'تصدير', view: 'عرض', confirmDelete: 'هل أنت متأكد من الحذف؟', yes: 'نعم', no: 'لا',
    duplicate: 'نسخ', restore: 'استعادة', archived: 'مؤرشف', newRecord: 'سجل جديد', all: 'الكل',
    saved: 'تم الحفظ بنجاح', deleted: 'تم الحذف', updated: 'تم التحديث', required: 'هذا الحقل مطلوب',
    // views
    vList: 'قائمة', vKanban: 'كانبان', vGallery: 'معرض', vTimeline: 'خط زمني', vMap: 'خريطة',
    tDashboard: 'لوحة المعلومات', tRegister: 'السجل', tAnalytics: 'التحليلات', tMatrix: 'مصفوفة المسؤولية',
    // fields
    title: 'العنوان', description: 'الوصف', status: 'الحالة', priority: 'الأولوية', category: 'الفئة',
    owner: 'المالك', assignee: 'المسؤول', dueDate: 'تاريخ الاستحقاق', date: 'التاريخ', tags: 'الوسوم',
    source: 'المصدر', location: 'الموقع', attachments: 'المرفقات', photos: 'الصور', notes: 'ملاحظات',
    createdAt: 'تاريخ الإنشاء', updatedAt: 'آخر تحديث', history: 'سجل التغييرات', linked: 'العناصر المرتبطة',
    probability: 'الاحتمالية', impact: 'الأثر', severity: 'الخطورة', rootCause: 'السبب الجذري',
    correctiveAction: 'الإجراء التصحيحي', preventiveAction: 'الإجراء الوقائي', mitigation: 'خطة المعالجة',
    reference: 'الرقم المرجعي', direction: 'الاتجاه', responseDue: 'موعد الرد', gps: 'الإحداثيات',
    // priorities
    pCritical: 'حرجة', pHigh: 'عالية', pMedium: 'متوسطة', pLow: 'منخفضة',
    // exec dashboard
    healthScore: 'مؤشر صحة المشروع', topRisks: 'أهم 10 مخاطر حرجة', topIssues: 'أهم 10 معضلات حرجة',
    contractorRanking: 'ترتيب أداء المقاولين', upcomingMilestones: 'المعالم القادمة', pendingCorr: 'مراسلات معلقة',
    overdueActions: 'إجراءات متأخرة', obsStatus: 'حالة الملاحظات الميدانية', lessonsAlerts: 'تنبيهات الدروس المستفادة',
    aiInsights: 'رؤى الذكاء الاصطناعي التنفيذية', warRoom: 'غرفة العمليات',
    daysOverdue: 'يوم تأخير', dueIn: 'يستحق خلال', days: 'يوم', today: 'اليوم', noData: 'لا توجد بيانات',
    openItems: 'مفتوحة', closedItems: 'مغلقة', total: 'الإجمالي', progress: 'الإنجاز', budget: 'الميزانية',
    // risks
    riskHeatmap: 'خريطة حرارة المخاطر', riskTrend: 'تحليل اتجاه المخاطر', riskAging: 'تقادم المخاطر',
    riskForecast: 'التنبؤ بالمخاطر', riskScore: 'درجة الخطر', generateMitigation: 'توليد خطة معالجة بالذكاء الاصطناعي',
    genReport: 'توليد تقرير', escalated: 'مُصعَّد',
    // actions center
    actionAging: 'تقادم الإجراءات', overdueDash: 'لوحة المتأخرات', respMatrix: 'مصفوفة المسؤولية',
    agingBuckets: 'أعمار الإجراءات المفتوحة', bySource: 'حسب المصدر', byAssignee: 'حسب المسؤول',
    // contractors
    perfScore: 'الأداء العام', safetyScore: 'السلامة', qualityScore: 'الجودة', scheduleScore: 'الجدول الزمني',
    commercialScore: 'التجاري', contacts: 'جهات الاتصال', contracts: 'العقود', profile: 'الملف التعريفي',
    trendAnalysis: 'تحليل الاتجاه', openNCRs: 'تقارير عدم مطابقة',
    // ai
    aiWelcome: 'مرحباً! أنا المساعد الذكي للمنصة. أحلل بيانات مشروعك الفعلية وأولّد التقارير والملخصات. كيف أخدمك؟',
    aiAnalyzeRisks: 'تحليل المخاطر', aiSummarizeMeetings: 'ملخص الاجتماعات', aiGenMOM: 'توليد محضر اجتماع',
    aiHealthReport: 'تقرير صحة المشروع', aiExecSummary: 'ملخص تنفيذي', aiContractorReview: 'تقييم المقاولين',
    aiCorrSummary: 'ملخص المراسلات', aiLessons: 'استخلاص دروس مستفادة', askAI: 'اسأل المساعد الذكي…', send: 'إرسال',
    // admin
    adminModules: 'الوحدات', adminFields: 'الحقول المخصصة', adminStatuses: 'الحالات', adminCategories: 'الفئات',
    adminTags: 'الوسوم', adminWorkflows: 'مسارات العمل', adminUsers: 'المستخدمون', adminRoles: 'الأدوار والصلاحيات',
    adminGeneral: 'إعدادات عامة', moduleVisible: 'ظاهرة', moduleHidden: 'مخفية', addField: 'إضافة حقل',
    fieldType: 'نوع الحقل', fieldLabel: 'اسم الحقل', options: 'الخيارات (افصل بفاصلة)', addStatus: 'إضافة حالة',
    color: 'اللون', addCategory: 'إضافة فئة', addUser: 'إضافة مستخدم', role: 'الدور', email: 'البريد الإلكتروني',
    permissions: 'الصلاحيات', name: 'الاسم', resetData: 'إعادة تعيين البيانات التجريبية', dangerZone: 'منطقة الخطر',
    resetWarn: 'سيتم حذف كل البيانات وإعادة تحميل البيانات التجريبية.',
    // builders
    addWidget: 'إضافة عنصر', widgetType: 'نوع العنصر', myDashboards: 'لوحاتي', newDashboard: 'لوحة جديدة',
    dragHint: 'اسحب العناصر لإعادة الترتيب', metric: 'المقياس', count: 'العدد', entity: 'الوحدة',
    newWorkflow: 'مسار جديد', addStep: 'إضافة خطوة', stepApproval: 'موافقة', stepReview: 'مراجعة',
    stepNotify: 'إشعار', stepEscalate: 'تصعيد', trigger: 'المحفِّز', onCreate: 'عند الإنشاء', onStatus: 'عند تغيير الحالة',
    afterDays: 'بعد (أيام)', active: 'مفعّل', inactive: 'متوقف',
    // meetings
    calendar: 'التقويم', minutes: 'محضر الاجتماع', attendance: 'الحضور', decisions: 'القرارات',
    // misc
    overdue: 'متأخر', pending: 'معلق', incoming: 'وارد', outgoing: 'صادر', awaitingResponse: 'بانتظار الرد',
    followUp: 'لوحة المتابعة التلقائية', versions: 'الإصدارات', approvalFlow: 'مسار الاعتماد',
    knowledgeBase: 'قاعدة المعرفة', bestPractice: 'ممارسة مثلى', failure: 'إخفاق', successStory: 'قصة نجاح',
    recommendation: 'توصية', searchKB: 'ابحث في قاعدة المعرفة…',
    weekDays: ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'],
    months: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
  },
  en: {
    appName: 'Construction Project OS', appTag: 'Project Operating System', theme: 'Theme',
    login: 'Sign In', loginAs: 'Sign in as', welcome: 'Welcome',
    loginHint: 'Select a user to enter the platform',
    selectProject: 'Project Selection Center', selectProjectHint: 'Select a project to continue — the selected project drives all modules',
    portfolioDash: 'Portfolio Dashboard', allProjects: 'All Projects', switchProject: 'Switch Project',
    groupBy: 'Group by', program: 'Program', region: 'Region', client: 'Client', package: 'Package', contractor: 'Contractor',
    newProject: 'New Project', editProject: 'Edit Project', projectCode: 'Project Code', projectNameAr: 'Project Name (Arabic)',
    projectNameEn: 'Project Name (English)', projectIcon: 'Project Icon', plannedProgress: 'Planned Progress',
    milestones: 'Key Milestones', milestoneTitle: 'Milestone Title', milestoneDate: 'Date', addMilestone: '+ Add Milestone',
    confirmDeleteProject: 'This project will be permanently deleted. Are you sure?',
    searchProjects: 'Search projects…', search: 'Search…', logout: 'Sign Out',
    gCommand: 'Command', gExecution: 'Execution', gKnowledge: 'Knowledge & Docs', gPlatform: 'Platform',
    mExec: 'Executive Command Center', mPortfolio: 'Project Portfolio', mActions: 'Action Management Center',
    mRisks: 'Risk Intelligence Center', mIssues: 'Issues Management Center', mObservations: 'Site Observation Center',
    mTracker: 'Issue & Constraint Tracking Center', aiTrackerReport: 'Weekly Constraints Report',
    mSchedule: 'Schedule & Planning Control Center',
    mContractors: 'Contractor Performance Center', mCorrespondence: 'Correspondence Center', mMeetings: 'Meeting Management Center',
    mLessons: 'Lessons Learned Center', mDocuments: 'Document Control Center', mDashBuilder: 'Dashboard Builder',
    mWorkflow: 'Workflow Builder', mAI: 'AI Assistant', mAdmin: 'Admin Control Center',
    add: 'Add', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel', close: 'Close', archive: 'Archive',
    escalate: 'Escalate', export: 'Export', view: 'View', confirmDelete: 'Are you sure you want to delete?', yes: 'Yes', no: 'No',
    duplicate: 'Duplicate', restore: 'Restore', archived: 'Archived', newRecord: 'New Record', all: 'All',
    saved: 'Saved successfully', deleted: 'Deleted', updated: 'Updated', required: 'This field is required',
    vList: 'List', vKanban: 'Kanban', vGallery: 'Gallery', vTimeline: 'Timeline', vMap: 'Map',
    tDashboard: 'Dashboard', tRegister: 'Register', tAnalytics: 'Analytics', tMatrix: 'Responsibility Matrix',
    title: 'Title', description: 'Description', status: 'Status', priority: 'Priority', category: 'Category',
    owner: 'Owner', assignee: 'Assignee', dueDate: 'Due Date', date: 'Date', tags: 'Tags',
    source: 'Source', location: 'Location', attachments: 'Attachments', photos: 'Photos', notes: 'Notes',
    createdAt: 'Created', updatedAt: 'Updated', history: 'History', linked: 'Linked Items',
    probability: 'Probability', impact: 'Impact', severity: 'Severity', rootCause: 'Root Cause',
    correctiveAction: 'Corrective Action', preventiveAction: 'Preventive Action', mitigation: 'Mitigation Plan',
    reference: 'Reference No.', direction: 'Direction', responseDue: 'Response Due', gps: 'GPS',
    pCritical: 'Critical', pHigh: 'High', pMedium: 'Medium', pLow: 'Low',
    healthScore: 'Project Health Score', topRisks: 'Top 10 Critical Risks', topIssues: 'Top 10 Critical Issues',
    contractorRanking: 'Contractor Performance Ranking', upcomingMilestones: 'Upcoming Milestones', pendingCorr: 'Pending Correspondence',
    overdueActions: 'Overdue Actions', obsStatus: 'Site Observation Status', lessonsAlerts: 'Lessons Learned Alerts',
    aiInsights: 'Executive AI Insights', warRoom: 'War Room',
    daysOverdue: 'days overdue', dueIn: 'due in', days: 'days', today: 'Today', noData: 'No data',
    openItems: 'Open', closedItems: 'Closed', total: 'Total', progress: 'Progress', budget: 'Budget',
    riskHeatmap: 'Risk Heat Map', riskTrend: 'Risk Trend Analysis', riskAging: 'Risk Aging',
    riskForecast: 'Risk Forecast', riskScore: 'Risk Score', generateMitigation: 'Generate AI Mitigation Plan',
    genReport: 'Generate Report', escalated: 'Escalated',
    actionAging: 'Action Aging', overdueDash: 'Overdue Dashboard', respMatrix: 'Responsibility Matrix',
    agingBuckets: 'Open Action Age', bySource: 'By Source', byAssignee: 'By Assignee',
    perfScore: 'Performance', safetyScore: 'Safety', qualityScore: 'Quality', scheduleScore: 'Schedule',
    commercialScore: 'Commercial', contacts: 'Contacts', contracts: 'Contracts', profile: 'Profile',
    trendAnalysis: 'Trend Analysis', openNCRs: 'Open NCRs',
    aiWelcome: "Hello! I'm the platform AI assistant. I analyze your live project data and generate reports and summaries. How can I help?",
    aiAnalyzeRisks: 'Analyze Risks', aiSummarizeMeetings: 'Summarize Meetings', aiGenMOM: 'Generate MOM',
    aiHealthReport: 'Project Health Report', aiExecSummary: 'Executive Summary', aiContractorReview: 'Contractor Review',
    aiCorrSummary: 'Correspondence Summary', aiLessons: 'Extract Lessons Learned', askAI: 'Ask the AI assistant…', send: 'Send',
    adminModules: 'Modules', adminFields: 'Custom Fields', adminStatuses: 'Statuses', adminCategories: 'Categories',
    adminTags: 'Tags', adminWorkflows: 'Workflows', adminUsers: 'Users', adminRoles: 'Roles & Permissions',
    adminGeneral: 'General Settings', moduleVisible: 'Visible', moduleHidden: 'Hidden', addField: 'Add Field',
    fieldType: 'Field Type', fieldLabel: 'Field Label', options: 'Options (comma separated)', addStatus: 'Add Status',
    color: 'Color', addCategory: 'Add Category', addUser: 'Add User', role: 'Role', email: 'Email',
    permissions: 'Permissions', name: 'Name', resetData: 'Reset Demo Data', dangerZone: 'Danger Zone',
    resetWarn: 'All data will be erased and demo data reloaded.',
    addWidget: 'Add Widget', widgetType: 'Widget Type', myDashboards: 'My Dashboards', newDashboard: 'New Dashboard',
    dragHint: 'Drag widgets to reorder', metric: 'Metric', count: 'Count', entity: 'Entity',
    newWorkflow: 'New Workflow', addStep: 'Add Step', stepApproval: 'Approval', stepReview: 'Review',
    stepNotify: 'Notification', stepEscalate: 'Escalation', trigger: 'Trigger', onCreate: 'On Create', onStatus: 'On Status Change',
    afterDays: 'After (days)', active: 'Active', inactive: 'Inactive',
    calendar: 'Calendar', minutes: 'Minutes', attendance: 'Attendance', decisions: 'Decisions',
    overdue: 'Overdue', pending: 'Pending', incoming: 'Incoming', outgoing: 'Outgoing', awaitingResponse: 'Awaiting Response',
    followUp: 'Automatic Follow-Up Dashboard', versions: 'Versions', approvalFlow: 'Approval Workflow',
    knowledgeBase: 'Knowledge Base', bestPractice: 'Best Practice', failure: 'Failure', successStory: 'Success Story',
    recommendation: 'Recommendation', searchKB: 'Search knowledge base…',
    weekDays: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  }
};

let LANG = localStorage.getItem('cpos_lang') || 'ar';
function t(key){ return (I18N[LANG] && I18N[LANG][key]) ?? I18N.en[key] ?? key; }
// Localized label from an object holding {en, ar} (or labelEn/labelAr)
function tl(obj){
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return LANG === 'ar' ? (obj.ar || obj.labelAr || obj.en || obj.labelEn || '') : (obj.en || obj.labelEn || obj.ar || obj.labelAr || '');
}
function setLang(l){
  LANG = l;
  localStorage.setItem('cpos_lang', l);
  document.documentElement.lang = l;
  document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
}
setLang(LANG);

/* ============ themes ============ */
const THEMES = [
  { key: 'dark',    icon: '🌌', label: { ar: 'غرفة العمليات', en: 'War Room' } },
  { key: 'desert',  icon: '🏜️', label: { ar: 'الصحراء', en: 'Desert' } },
  { key: 'emerald', icon: '🌿', label: { ar: 'الزمردي', en: 'Emerald' } },
  { key: 'royal',   icon: '👑', label: { ar: 'الملكي', en: 'Royal' } },
  { key: 'light',   icon: '☀️', label: { ar: 'فاتح', en: 'Light' } },
];
let THEME = localStorage.getItem('cpos_theme') || 'dark';
function setTheme(k){
  THEME = k;
  localStorage.setItem('cpos_theme', k);
  if (k === 'dark') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', k);
}
setTheme(THEME);
