/* ============================================================
   Issue & Constraint Tracking Center — مركز تتبع المعوقات والمشاكل
   Full case-file management: lifecycle workflow, follow-ups,
   responses, evidence gallery, closure control, audit timeline.
   ============================================================ */

const TX = (ar, en) => LANG === 'ar' ? ar : en;

const TRK = {
  type: 'constraint',
  fuMethods: [
    { key: 'email', icon: '✉️', label: () => TX('بريد إلكتروني', 'Email') },
    { key: 'meeting', icon: '🗓️', label: () => TX('اجتماع', 'Meeting') },
    { key: 'phone', icon: '📞', label: () => TX('اتصال هاتفي', 'Phone Call') },
    { key: 'siteVisit', icon: '🚶', label: () => TX('زيارة موقع', 'Site Visit') },
    { key: 'letter', icon: '📄', label: () => TX('خطاب رسمي', 'Letter') },
    { key: 'whatsapp', icon: '💬', label: () => TX('واتساب', 'WhatsApp') },
    { key: 'system', icon: '🔔', label: () => TX('إشعار نظام', 'System Notification') },
  ],
  fuTypes: [
    { key: 'firstReminder', label: () => TX('تذكير أول', 'First Reminder') },
    { key: 'secondReminder', label: () => TX('تذكير ثانٍ', 'Second Reminder') },
    { key: 'urgentReminder', label: () => TX('تذكير عاجل', 'Urgent Reminder') },
    { key: 'escalation', label: () => TX('تصعيد', 'Escalation') },
    { key: 'requestUpdate', label: () => TX('طلب مستجدات', 'Request for Update') },
    { key: 'closureRequest', label: () => TX('طلب إغلاق', 'Closure Request') },
    { key: 'infoRequest', label: () => TX('طلب معلومات', 'Information Request') },
  ],
  evStages: [
    { key: 'before', icon: '🟡', label: () => TX('قبل المعالجة', 'Before') },
    { key: 'during', icon: '🔵', label: () => TX('أثناء المعالجة', 'During') },
    { key: 'after', icon: '🟢', label: () => TX('بعد المعالجة', 'After') },
    { key: 'closure', icon: '✅', label: () => TX('دليل إغلاق', 'Closure Evidence') },
    { key: 'rejection', icon: '⛔', label: () => TX('دليل رفض', 'Rejection Evidence') },
    { key: 'general', icon: '📎', label: () => TX('مرفق عام', 'General Attachment') },
  ],
  evTypes: [
    { key: 'photo', icon: '📷', label: () => TX('صورة', 'Photo') },
    { key: 'video', icon: '🎬', label: () => TX('فيديو', 'Video') },
    { key: 'pdf', icon: '📕', label: () => TX('ملف PDF', 'PDF') },
    { key: 'emailShot', icon: '📧', label: () => TX('لقطة بريد', 'Email Screenshot') },
    { key: 'letter', icon: '📄', label: () => TX('خطاب', 'Letter') },
    { key: 'drawing', icon: '📐', label: () => TX('مخطط', 'Drawing') },
    { key: 'report', icon: '📊', label: () => TX('تقرير', 'Report') },
    { key: 'markup', icon: '🖊', label: () => TX('ترميز/ملاحظات', 'Markup') },
    { key: 'mom', icon: '📝', label: () => TX('مقتطف محضر', 'MOM Extract') },
  ],
  closureTypes: [
    { key: 'withEvidence', icon: '✅', label: () => TX('إغلاق بدليل', 'Closed with evidence') },
    { key: 'withoutEvidence', icon: '⚠️', label: () => TX('إغلاق بدون دليل', 'Closed without evidence') },
    { key: 'partial', icon: '◐', label: () => TX('إغلاق جزئي', 'Partially closed') },
  ],
  respStates: {
    none: { icon: '🔇', color: '#f87171', label: () => TX('لا يوجد رد', 'No Response Yet') },
    pending: { icon: '📩', color: '#60a5fa', label: () => TX('رد مستلم', 'Response Received') },
    accepted: { icon: '✅', color: '#34d399', label: () => TX('رد مقبول', 'Response Accepted') },
    rejected: { icon: '⛔', color: '#f43f5e', label: () => TX('رد مرفوض', 'Response Rejected') },
    moreInfo: { icon: 'ℹ️', color: '#f5b942', label: () => TX('مطلوب معلومات إضافية', 'More Information Required') },
  },
  tlActions: {
    created: ['🆕', () => TX('تم إنشاء المعوق', 'Issue created')],
    submitted: ['📤', () => TX('تم التقديم', 'Issue submitted')],
    sent: ['✉️', () => TX('تم الإرسال', 'Issue sent')],
    received: ['📥', () => TX('تم الاستلام', 'Issue received')],
    owner: ['👤', () => TX('تعيين مالك', 'Owner assigned')],
    status: ['🔁', () => TX('تغيير الحالة', 'Status changed')],
    followup: ['📨', () => TX('متابعة', 'Follow-up added')],
    reminder: ['🔔', () => TX('تذكير', 'Reminder sent')],
    response: ['💬', () => TX('رد مستلم', 'Response received')],
    attachment: ['📎', () => TX('رفع مرفق', 'Attachment uploaded')],
    photo: ['📷', () => TX('رفع صورة', 'Photo uploaded')],
    comment: ['🗒', () => TX('تعليق', 'Comment added')],
    due: ['📅', () => TX('تغيير تاريخ الاستحقاق', 'Due date changed')],
    escalation: ['🚨', () => TX('تصعيد', 'Escalation created')],
    closureRequest: ['🏁', () => TX('طلب إغلاق', 'Closure requested')],
    closureApproved: ['✅', () => TX('اعتماد الإغلاق', 'Closure approved')],
    closureRejected: ['⛔', () => TX('رفض الإغلاق', 'Closure rejected')],
    closed: ['✅', () => TX('تم الإغلاق', 'Issue closed')],
    reopened: ['♻️', () => TX('إعادة فتح', 'Issue reopened')],
    edit: ['✏️', () => TX('تعديل البيانات', 'Details edited')],
  },
  statusDates: { submitted: 'submittedAt', sent: 'sentAt', received: 'receivedAt', escalated: 'escalatedAt', closed: 'closedAt', reopened: 'reopenedAt' },
};

const ModTracker = {
  fs: { q: '', status: '', cat: '', party: '', contractor: '', priority: '', severity: '', zone: '',
        resp: '', ev: '', overdue: false, escalated: false, reopened: false, closedOnly: false,
        createdFrom: '', createdTo: '', dueFrom: '', dueTo: '', adv: false },
  dtTab: 'overview',

  /* ================= helpers ================= */
  isClosed(r) { return Store.isClosed('constraint', r); },
  daysOpen(r) {
    const end = this.isClosed(r) && r.closedAt ? new Date(r.closedAt).getTime() : Date.now();
    return Math.max(0, Math.floor((end - new Date(r.createdAt).getTime()) / 86400000));
  },
  daysOverdue(r) {
    if (this.isClosed(r) || !r.dueDate) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(r.dueDate).getTime()) / 86400000));
  },
  daysSinceUpdate(r) { return Math.max(0, Math.floor((Date.now() - new Date(r.updatedAt || r.createdAt).getTime()) / 86400000)); },
  lastFU(r) { const f = (r.followups || []); return f.length ? f.reduce((a, b) => a.date > b.date ? a : b) : null; },
  lastResp(r) { const x = (r.responses || []); return x.length ? x.reduce((a, b) => a.date > b.date ? a : b) : null; },
  respState(r) {
    const last = this.lastResp(r);
    if (!last) return 'none';
    return TRK.respStates[last.accepted] ? last.accepted : 'pending';
  },
  hasPhotos(r) { return (r.evidence || []).some(e => e.etype === 'photo' || e.etype === 'video'); },
  hasClosureEv(r) { return (r.evidence || []).some(e => e.stage === 'closure'); },
  closedNoEvidence(r) { return this.isClosed(r) && r.status === 'closed' && !this.hasClosureEv(r); },
  wasReopened(r) { return !!r.reopenedAt || r.status === 'reopened'; },

  badges(r, compact = false) {
    const out = [];
    const chip = (icon, txt, color) => `<span class="chip" style="--cc:${color}">${icon} ${txt}</span>`;
    if (!this.isClosed(r) && this.respState(r) === 'none') out.push(chip('🔇', TX('بلا رد', 'No Response'), '#f87171'));
    if (this.daysOverdue(r) > 0) out.push(chip('⏰', `${TX('متأخر', 'Overdue')} ${this.daysOverdue(r)}${TX('ي', 'd')}`, '#f87171'));
    if (r.status === 'escalated') out.push(chip('🚨', TX('مُصعَّد', 'Escalated'), '#ef4444'));
    if (this.hasPhotos(r)) out.push(chip('📷', compact ? (r.evidence || []).length : TX('صور', 'Photos'), '#60a5fa'));
    if (this.closedNoEvidence(r)) out.push(chip('⚠️', TX('أُغلق بلا دليل', 'No Evidence'), '#f5b942'));
    if (this.wasReopened(r)) out.push(chip('♻️', TX('أُعيد فتحه', 'Reopened'), '#f97316'));
    if (r.status === 'closed') out.push(chip('✅', TX('مغلق', 'Closed'), '#34d399'));
    return out.join(' ');
  },

  /* ================= module page ================= */
  render(container) {
    Engine.modulePage(container, 'constraint', [
      { key: 'dash', icon: '📊', label: t('tDashboard'), render: (b, rr) => this.dashboard(b, rr) },
      { key: 'reg', icon: '🗒', label: t('tRegister'), render: (b, rr) => this.registerView(b, rr) },
      { key: 'board', icon: '▦', label: TX('اللوحة', 'Board'), render: (b) => Engine.register(b, 'constraint') },
      { key: 'aging', icon: '⏳', label: TX('التقادم والتحليلات', 'Aging & Analytics'), render: (b, rr) => this.analytics(b, rr) },
    ]);
  },

  /* ================= dashboard ================= */
  dashboard(b, rr) {
    const all = Store.list('constraint');
    const open = all.filter(r => !this.isClosed(r));
    const closed = all.filter(r => r.status === 'closed');
    const overdue = open.filter(r => this.daysOverdue(r) > 0);
    const escalated = open.filter(r => r.status === 'escalated');
    const noResp = open.filter(r => this.respState(r) === 'none');
    const pendResp = open.filter(r => r.status === 'pendingresp');
    const reopened = all.filter(r => this.wasReopened(r));
    const noEv = all.filter(r => this.closedNoEvidence(r));
    const wkAgo = dOff(-7), moAgo = dOff(-30);
    const closedWk = closed.filter(r => (r.closedAt || '') >= wkAgo).length;
    const closedMo = closed.filter(r => (r.closedAt || '') >= moAgo).length;
    const avgClose = closed.length ? Math.round(closed.reduce((s, r) => s + this.daysOpen(r), 0) / closed.length) : 0;
    const responded = all.filter(r => (r.responses || []).length);
    const avgResp = responded.length ? Math.round(responded.reduce((s, r) => {
      const first = (r.responses || []).slice().sort((a, b2) => a.date.localeCompare(b2.date))[0];
      return s + Math.max(0, (new Date(first.date) - new Date(r.createdAt)) / 86400000);
    }, 0) / responded.length) : 0;
    const rate = all.length ? Math.round(closed.length / all.length * 100) : 0;
    const sch = Store.schema('constraint');
    const buckets = [[0, 7], [8, 14], [15, 30], [31, 60], [61, 90], [91, 9999]];
    const partyOpts = ['contractor', 'consultant', 'developer', 'client', 'authority', 'internal'];

    b.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi" style="--kc:var(--accent)"><div class="k-label">${TX('معوقات مفتوحة', 'Open Issues')}</div>
          <div class="k-value">${open.length}</div><div class="k-ico">🚩</div>
          <div class="k-sub">${t('total')}: ${all.length} · ${TX('بانتظار رد', 'pending response')}: ${pendResp.length}</div></div>
        <div class="kpi" style="--kc:var(--red)"><div class="k-label">${TX('متأخرة', 'Overdue')}</div>
          <div class="k-value">${overdue.length}</div><div class="k-ico">⏰</div>
          <div class="k-sub">🚨 ${TX('مُصعَّدة', 'escalated')}: ${escalated.length}</div></div>
        <div class="kpi" style="--kc:var(--orange)"><div class="k-label">${TX('بلا رد', 'No Response Yet')}</div>
          <div class="k-value">${noResp.length}</div><div class="k-ico">🔇</div>
          <div class="k-sub">${TX('متوسط زمن الرد', 'avg response time')}: ${avgResp} ${t('days')}</div></div>
        <div class="kpi" style="--kc:var(--green)"><div class="k-label">${TX('نسبة الإغلاق', 'Closure Rate')}</div>
          <div class="k-value">${rate}%</div><div class="k-ico">✅</div>
          <div class="k-sub">${TX('هذا الأسبوع', 'this week')}: ${closedWk} · ${TX('هذا الشهر', 'this month')}: ${closedMo}</div></div>
      </div>
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi" style="--kc:#34d399"><div class="k-label">${TX('مغلقة', 'Closed')}</div>
          <div class="k-value">${closed.length}</div><div class="k-ico">🏁</div>
          <div class="k-sub">${TX('متوسط زمن الإغلاق', 'avg closure time')}: ${avgClose} ${t('days')}</div></div>
        <div class="kpi" style="--kc:#f97316"><div class="k-label">${TX('أُعيد فتحها', 'Reopened')}</div>
          <div class="k-value">${reopened.length}</div><div class="k-ico">♻️</div>
          <div class="k-sub">${TX('تتطلب متابعة لصيقة', 'need close follow-up')}</div></div>
        <div class="kpi" style="--kc:#f5b942"><div class="k-label">${TX('أُغلقت بلا دليل', 'Closed w/o Evidence')}</div>
          <div class="k-value">${noEv.length}</div><div class="k-ico">⚠️</div>
          <div class="k-sub">${TX('تتطلب استكمال التوثيق', 'documentation required')}</div></div>
        <div class="kpi" style="--kc:#c084fc"><div class="k-label">${TX('بانتظار الرد', 'Pending Response')}</div>
          <div class="k-value">${pendResp.length}</div><div class="k-ico">📩</div>
          <div class="k-sub">${TX('متابعات مسجلة', 'follow-ups logged')}: ${all.reduce((s, r) => s + (r.followups || []).length, 0)}</div></div>
      </div>

      <div class="grid g3" style="margin-bottom:16px">
        <div class="panel"><div class="panel-h"><span>🍩</span><h3>${TX('حسب الحالة', 'By Status')}</h3></div>
          <div class="flex" style="justify-content:center">${Charts.donut(sch.statuses.map(s => ({
            label: tl(s.label), value: all.filter(r => r.status === s.key).length, color: s.color
          })).filter(x => x.value), { size: 165, centerLabel: open.length, centerSub: t('openItems') })}</div></div>
        <div class="panel"><div class="panel-h"><span>🏛</span><h3>${TX('حسب الجهة المسؤولة', 'By Responsible Party')}</h3></div>
          ${Charts.hbars(partyOpts.map(k => ({
            label: UI.optLabel(k), value: open.filter(r => r.responsibleParty === k).length
          })).filter(x => x.value).sort((a, b2) => b2.value - a.value))}</div>
        <div class="panel"><div class="panel-h"><span>🏗️</span><h3>${TX('حسب المقاول', 'By Contractor')}</h3></div>
          ${Charts.hbars(Store.db.contractors.map(c => ({
            label: LANG === 'ar' ? c.name : c.nameEn,
            value: open.filter(r => r.contractor === c.id).length
          })).filter(x => x.value).sort((a, b2) => b2.value - a.value)) || UI.empty('🏗️')}</div>
      </div>
      <div class="grid g3" style="margin-bottom:16px">
        <div class="panel"><div class="panel-h"><span>🗂</span><h3>${t('category')}</h3></div>
          ${Charts.hbars((sch.categories || []).map(c => ({
            label: tl(c.label), value: open.filter(r => r.category === c.key).length
          })).filter(x => x.value).sort((a, b2) => b2.value - a.value))}</div>
        <div class="panel"><div class="panel-h"><span>🌡</span><h3>${t('priority')}</h3></div>
          ${Charts.columns(['critical', 'high', 'medium', 'low'].map(p => ({
            label: UI.prioLabel(p), value: open.filter(r => r.priority === p).length, color: UI.prioColors[p]
          })))}</div>
        <div class="panel"><div class="panel-h"><span>📍</span><h3>${TX('حسب المنطقة', 'By Zone')}</h3></div>
          ${Charts.hbars([...new Set(open.map(r => r.zone).filter(Boolean))].map(z => ({
            label: z, value: open.filter(r => r.zone === z).length
          })).sort((a, b2) => b2.value - a.value).slice(0, 8)) || UI.empty('📍')}</div>
      </div>
      <div class="grid g3" style="margin-bottom:16px">
        <div class="panel"><div class="panel-h"><span>⏳</span><h3>${TX('تحليل التقادم (مفتوحة)', 'Aging Analysis (open)')}</h3></div>
          ${Charts.columns(buckets.map(([a, z]) => ({
            label: z > 9000 ? '90+' : `${a}-${z}`, value: open.filter(r => { const d = this.daysOpen(r); return d >= a && d <= z; }).length,
            color: z <= 14 ? '#34d399' : z <= 60 ? '#f5b942' : '#f87171'
          })))}</div>
        <div class="panel"><div class="panel-h"><span>📈</span><h3>${TX('الإغلاق الشهري', 'Closed by Month')}</h3></div>
          ${(() => { const tr = Store.trend('constraint'); return Charts.line([
            { name: TX('مسجلة', 'Raised'), color: 'var(--orange)', values: tr.map(x => x.created) },
            { name: TX('مغلقة', 'Closed'), color: 'var(--green)', values: tr.map(x => x.closed) },
          ], { labels: tr.map(x => x.label) }); })()}</div>
        <div class="panel"><div class="panel-h"><span>⏰</span><h3>${TX('المتأخرة حسب الجهة', 'Overdue by Party')}</h3></div>
          ${Charts.hbars(partyOpts.map(k => ({
            label: UI.optLabel(k), value: overdue.filter(r => r.responsibleParty === k).length, color: 'var(--red)'
          })).filter(x => x.value).sort((a, b2) => b2.value - a.value)) || UI.empty('🎉')}</div>
      </div>

      ${noEv.length ? `<div class="panel" style="border-color:rgba(245,185,66,.45)">
        <div class="panel-h"><span>⚠️</span><h3>${TX('أُغلقت بدون دليل — تتطلب استكمال التوثيق', 'Closed without evidence — documentation required')}</h3></div>
        ${noEv.map(r => `<div class="rank-row clickable" data-cst="${r.id}">
          <span class="mut fs12">${esc(r.ref)}</span>
          <div style="flex:1;min-width:0"><div class="fs13 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div>
            <div class="fs11 mut">${esc(r.zone || '')} · ${UI.fmtDate(r.closedAt)}</div></div>
          ${UI.statusChip('constraint', r.status)}</div>`).join('')}
      </div>` : ''}`;
    b.querySelectorAll('[data-cst]').forEach(el => el.onclick = () => this.openDetail(el.dataset.cst, rr));
  },

  /* ================= professional register ================= */
  registerView(b, rr) {
    const f = this.fs;
    const sch = Store.schema('constraint');
    let recs = Store.list('constraint');
    if (f.q) { const q = f.q.toLowerCase();
      recs = recs.filter(r => [r.title, r.ref, r.extRef, r.description, r.zone, r.street, r.notes,
        ...(r.followups || []).map(x => x.comment), ...(r.responses || []).map(x => x.summary + ' ' + x.fullText),
        ...(r.evidence || []).map(x => x.desc)].join(' ').toLowerCase().includes(q)); }
    if (f.status) recs = recs.filter(r => r.status === f.status);
    if (f.cat) recs = recs.filter(r => r.category === f.cat);
    if (f.party) recs = recs.filter(r => r.responsibleParty === f.party);
    if (f.contractor) recs = recs.filter(r => r.contractor === f.contractor);
    if (f.priority) recs = recs.filter(r => r.priority === f.priority);
    if (f.severity) recs = recs.filter(r => r.severity === f.severity);
    if (f.zone) recs = recs.filter(r => (r.zone || '').includes(f.zone) || (r.street || '').includes(f.zone));
    if (f.resp) recs = recs.filter(r => this.respState(r) === f.resp);
    if (f.ev === 'photos') recs = recs.filter(r => this.hasPhotos(r));
    if (f.ev === 'closureEv') recs = recs.filter(r => this.hasClosureEv(r));
    if (f.ev === 'missing') recs = recs.filter(r => !(r.evidence || []).length);
    if (f.ev === 'closedNoEv') recs = recs.filter(r => this.closedNoEvidence(r));
    if (f.overdue) recs = recs.filter(r => this.daysOverdue(r) > 0);
    if (f.escalated) recs = recs.filter(r => r.status === 'escalated');
    if (f.reopened) recs = recs.filter(r => this.wasReopened(r));
    if (f.closedOnly) recs = recs.filter(r => this.isClosed(r));
    if (f.createdFrom) recs = recs.filter(r => r.createdAt >= f.createdFrom);
    if (f.createdTo) recs = recs.filter(r => r.createdAt <= f.createdTo);
    if (f.dueFrom) recs = recs.filter(r => (r.dueDate || '') >= f.dueFrom);
    if (f.dueTo) recs = recs.filter(r => (r.dueDate || '') <= f.dueTo);
    recs.sort((a, b2) => (b2.createdAt || '').localeCompare(a.createdAt || ''));

    const partyOpts = ['contractor', 'consultant', 'developer', 'client', 'authority', 'internal'];
    b.innerHTML = `
      <div class="reg-toolbar">
        <input class="input" id="tk-q" placeholder="🔍 ${t('search')}" value="${esc(f.q)}" style="min-width:180px">
        <select class="input" id="tk-status"><option value="">${t('status')}: ${t('all')}</option>
          ${sch.statuses.map(s => `<option value="${s.key}" ${f.status === s.key ? 'selected' : ''}>${tl(s.label)}</option>`).join('')}</select>
        <select class="input" id="tk-cat"><option value="">${t('category')}: ${t('all')}</option>
          ${sch.categories.map(c => `<option value="${c.key}" ${f.cat === c.key ? 'selected' : ''}>${tl(c.label)}</option>`).join('')}</select>
        <select class="input" id="tk-party"><option value="">${TX('الجهة المسؤولة', 'Party')}: ${t('all')}</option>
          ${partyOpts.map(k => `<option value="${k}" ${f.party === k ? 'selected' : ''}>${UI.optLabel(k)}</option>`).join('')}</select>
        <select class="input" id="tk-con"><option value="">${t('contractor')}: ${t('all')}</option>
          ${Store.db.contractors.map(c => `<option value="${c.id}" ${f.contractor === c.id ? 'selected' : ''}>${esc(LANG === 'ar' ? c.name : c.nameEn)}</option>`).join('')}</select>
        <select class="input" id="tk-prio"><option value="">${t('priority')}: ${t('all')}</option>
          ${['critical', 'high', 'medium', 'low'].map(p => `<option value="${p}" ${f.priority === p ? 'selected' : ''}>${UI.prioLabel(p)}</option>`).join('')}</select>
        <button class="btn sm ghost ${f.adv ? 'gold' : ''}" id="tk-adv">⚙ ${TX('فلاتر متقدمة', 'Advanced')}</button>
        <div class="spacer"></div>
        <button class="btn primary" id="tk-add">＋ ${TX('معوق / مشكلة جديدة', 'New Issue / Constraint')}</button>
      </div>
      ${f.adv ? `<div class="reg-toolbar" style="margin-top:-6px">
        <input class="input" id="tk-zone" placeholder="📍 ${TX('المنطقة / الشارع', 'Zone / Street')}" value="${esc(f.zone)}" style="width:160px">
        <select class="input" id="tk-sev"><option value="">${t('severity')}: ${t('all')}</option>
          ${['critical', 'high', 'medium', 'low'].map(p => `<option value="${p}" ${f.severity === p ? 'selected' : ''}>${UI.prioLabel(p)}</option>`).join('')}</select>
        <select class="input" id="tk-resp"><option value="">${TX('حالة الرد', 'Response')}: ${t('all')}</option>
          ${Object.keys(TRK.respStates).map(k => `<option value="${k}" ${f.resp === k ? 'selected' : ''}>${TRK.respStates[k].label()}</option>`).join('')}</select>
        <select class="input" id="tk-ev"><option value="">${TX('الأدلة', 'Evidence')}: ${t('all')}</option>
          <option value="photos" ${f.ev === 'photos' ? 'selected' : ''}>${TX('لديه صور', 'Has photos')}</option>
          <option value="closureEv" ${f.ev === 'closureEv' ? 'selected' : ''}>${TX('لديه دليل إغلاق', 'Has closure evidence')}</option>
          <option value="missing" ${f.ev === 'missing' ? 'selected' : ''}>${TX('بدون أدلة', 'Missing evidence')}</option>
          <option value="closedNoEv" ${f.ev === 'closedNoEv' ? 'selected' : ''}>${TX('أُغلق بلا دليل', 'Closed w/o evidence')}</option></select>
        <label class="fs12 flex" style="gap:5px"><input type="checkbox" id="tk-ov" ${f.overdue ? 'checked' : ''}>${TX('متأخرة', 'Overdue')}</label>
        <label class="fs12 flex" style="gap:5px"><input type="checkbox" id="tk-esc" ${f.escalated ? 'checked' : ''}>${TX('مُصعَّدة', 'Escalated')}</label>
        <label class="fs12 flex" style="gap:5px"><input type="checkbox" id="tk-ro" ${f.reopened ? 'checked' : ''}>${TX('معاد فتحها', 'Reopened')}</label>
        <label class="fs12 flex" style="gap:5px"><input type="checkbox" id="tk-cl" ${f.closedOnly ? 'checked' : ''}>${TX('أرشيف المغلقة', 'Closed archive')}</label>
        <input type="date" class="input" id="tk-cf" value="${f.createdFrom}" title="${TX('الإنشاء من', 'Created from')}" style="width:140px">
        <input type="date" class="input" id="tk-ct" value="${f.createdTo}" title="${TX('الإنشاء إلى', 'Created to')}" style="width:140px">
      </div>` : ''}
      <div class="panel" style="padding:6px 14px;overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>#</th><th>${t('title')}</th><th>${TX('المنطقة / الشارع', 'Zone / Street')}</th><th>${t('category')}</th>
          <th>${TX('الجهة المسؤولة', 'Resp. Party')}</th><th>${TX('المالك الحالي', 'Owner')}</th><th>${t('status')}</th><th>${t('priority')}</th>
          <th>${TX('الإنشاء / الإرسال', 'Created / Sent')}</th><th>${TX('الاستحقاق', 'Due')}</th>
          <th>${TX('آخر متابعة / رد', 'Last FU / Resp')}</th><th>${TX('أيام مفتوح', 'Days Open')}</th><th>📎</th><th></th>
        </tr></thead><tbody>
        ${recs.map(r => {
          const fu = this.lastFU(r), rp = this.lastResp(r), ov = this.daysOverdue(r);
          return `<tr data-id="${r.id}">
            <td class="mut fs12">${esc(r.ref)}</td>
            <td style="min-width:220px"><div class="t-title">${esc(r.title)}</div><div class="t-sub">${this.badges(r, true)}</div></td>
            <td class="fs12">${esc(r.zone || '—')}<div class="fs11 mut">${esc(r.street || '')}</div></td>
            <td class="fs12">${UI.catLabel('constraint', r.category)}</td>
            <td class="fs12">${UI.optLabel(r.responsibleParty)}</td>
            <td class="fs12">${UI.avatar(r.currentOwner)} ${esc((Store.userName(r.currentOwner) || '').split(' ').slice(0, 2).join(' '))}</td>
            <td>${UI.statusChip('constraint', r.status)}</td>
            <td>${UI.prioChip(r.priority)}</td>
            <td class="fs11 mut">${UI.fmtDate(r.createdAt)}<br>${r.sentAt ? '✉️ ' + UI.fmtDate(r.sentAt) : '—'}</td>
            <td class="fs11">${UI.fmtDate(r.dueDate)}${ov ? `<br><span class="chip" style="--cc:#f87171">+${ov}${TX('ي', 'd')}</span>` : ''}</td>
            <td class="fs11 mut">${fu ? '📨 ' + UI.fmtDate(fu.date) : '—'}<br>${rp ? '💬 ' + UI.fmtDate(rp.date) : TX('لا رد', 'no reply')}</td>
            <td class="b fs13">${this.daysOpen(r)}</td>
            <td class="fs12">${(r.evidence || []).length || '—'}</td>
            <td class="fs12 mut">›</td>
          </tr>`;
        }).join('')}
        </tbody></table>
        ${!recs.length ? UI.empty('🚩') : ''}
      </div>
      <div class="fs11 mut mt8">${recs.length} ${TX('سجل', 'records')}</div>`;

    const re = () => this.registerView(b, rr);
    const bind = (id, prop, ev = 'onchange') => { const el = b.querySelector(id); if (el) el[ev] = e => { f[prop] = el.type === 'checkbox' ? el.checked : e.target.value; re(); }; };
    b.querySelector('#tk-q').oninput = e => { f.q = e.target.value; re(); const i = b.querySelector('#tk-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
    bind('#tk-status', 'status'); bind('#tk-cat', 'cat'); bind('#tk-party', 'party'); bind('#tk-con', 'contractor'); bind('#tk-prio', 'priority');
    bind('#tk-zone', 'zone', 'oninput'); bind('#tk-sev', 'severity'); bind('#tk-resp', 'resp'); bind('#tk-ev', 'ev');
    bind('#tk-ov', 'overdue'); bind('#tk-esc', 'escalated'); bind('#tk-ro', 'reopened'); bind('#tk-cl', 'closedOnly');
    bind('#tk-cf', 'createdFrom'); bind('#tk-ct', 'createdTo');
    b.querySelector('#tk-adv').onclick = () => { f.adv = !f.adv; re(); };
    b.querySelector('#tk-add').onclick = () => this.form(null, re);
    b.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => this.openDetail(tr.dataset.id, re));
  },

  /* ================= aging & analytics ================= */
  analytics(b, rr) {
    const all = Store.list('constraint');
    const open = all.filter(r => !this.isClosed(r));
    const closed = all.filter(r => r.status === 'closed');
    const buckets = [[0, 7], [8, 14], [15, 30], [31, 60], [61, 90], [91, 9999]];
    const sch = Store.schema('constraint');
    const closeByCat = (sch.categories || []).map(c => {
      const cls = closed.filter(r => r.category === c.key);
      return { label: tl(c.label), value: cls.length ? Math.round(cls.reduce((s, r) => s + this.daysOpen(r), 0) / cls.length) : 0 };
    }).filter(x => x.value).sort((a, b2) => b2.value - a.value);
    const repeats = Store.db.contractors.map(c => ({
      label: LANG === 'ar' ? c.name : c.nameEn,
      value: all.filter(r => r.contractor === c.id && ['contractorDelay', 'commercial'].includes(r.category)).length,
      color: 'var(--orange)'
    })).filter(x => x.value > 1).sort((a, b2) => b2.value - a.value);

    b.innerHTML = `
      <div class="grid g2" style="margin-bottom:16px">
        <div class="panel"><div class="panel-h"><span>⏳</span><h3>${TX('سلة التقادم — معوقات مفتوحة', 'Aging buckets — open')}</h3></div>
          ${buckets.map(([a, z]) => {
            const items = open.filter(r => { const d = this.daysOpen(r); return d >= a && d <= z; });
            return `<div class="rank-row"><span class="chip" style="--cc:${z <= 14 ? '#34d399' : z <= 60 ? '#f5b942' : '#f87171'}">${z > 9000 ? '90+' : a + '-' + z} ${t('days')}</span>
              <div class="bar" style="flex:1"><i style="width:${open.length ? Math.round(items.length / open.length * 100) : 0}%;--bc:${z <= 14 ? 'var(--green)' : z <= 60 ? 'var(--gold)' : 'var(--red)'}"></i></div>
              <b class="fs13">${items.length}</b></div>`;
          }).join('')}</div>
        <div class="panel"><div class="panel-h"><span>⏱</span><h3>${TX('متوسط زمن الإغلاق حسب الفئة (يوم)', 'Avg closure time by category (days)')}</h3></div>
          ${closeByCat.length ? Charts.hbars(closeByCat, { fmt: v => v + ' ' + t('days') }) : UI.empty('⏱')}</div>
      </div>
      <div class="grid g2" style="margin-bottom:16px">
        <div class="panel"><div class="panel-h"><span>🔁</span><h3>${TX('معوقات متكررة حسب المقاول', 'Repeated issues by contractor')}</h3></div>
          ${repeats.length ? Charts.hbars(repeats) : UI.empty('🎉', TX('لا تكرار ملحوظ', 'No notable repetition'))}</div>
        <div class="panel"><div class="panel-h"><span>📊</span><h3>${TX('أطول المعوقات بقاءً (مفتوحة)', 'Longest-open issues')}</h3></div>
          ${open.slice().sort((a, b2) => this.daysOpen(b2) - this.daysOpen(a)).slice(0, 8).map(r => `
            <div class="rank-row clickable" data-cst="${r.id}">
              <span class="chip" style="--cc:${this.daysOpen(r) > 60 ? '#f87171' : '#f5b942'}">${this.daysOpen(r)} ${t('days')}</span>
              <div style="flex:1;min-width:0"><div class="fs12 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div>
                <div class="fs11 mut">${esc(r.ref)} · ${UI.optLabel(r.responsibleParty)}</div></div>
              ${UI.statusChip('constraint', r.status)}</div>`).join('') || UI.empty('🎉')}</div>
      </div>
      <div class="panel">
        <div class="panel-h"><span>🤖</span><h3>${TX('فحوصات ذكية', 'Smart checks')}</h3>
          <div class="spacer"></div><button class="btn sm gold" id="tk-air">✨ ${t('aiTrackerReport')}</button></div>
        <div class="grid g3">
          ${[[TX('بلا رد إطلاقاً', 'No response at all'), open.filter(r => this.respState(r) === 'none')],
             [TX('بدون أي أدلة', 'No evidence'), open.filter(r => !(r.evidence || []).length)],
             [TX('متأخرة أكثر من 14 يوماً', 'Overdue > 14 days'), open.filter(r => this.daysOverdue(r) > 14)]].map(([lbl, items]) => `
            <div><div class="fs12 b mut2" style="margin-bottom:8px">${lbl} (${items.length})</div>
            ${items.slice(0, 5).map(r => `<div class="link-card" data-cst="${r.id}">🚩
              <div style="flex:1"><b class="fs12">${esc(r.title.slice(0, 55))}</b><div class="fs11 mut">${esc(r.ref)}</div></div></div>`).join('') || `<div class="fs12 mut">${TX('لا يوجد', 'None')} ✅</div>`}</div>`).join('')}
        </div>
      </div>`;
    b.querySelectorAll('[data-cst]').forEach(el => el.onclick = () => this.openDetail(el.dataset.cst, rr));
    const air = b.querySelector('#tk-air'); if (air) air.onclick = () => AIBrain.showReport(AIBrain.trackerReport(), t('aiTrackerReport'));
  },

  /* ================= create / edit form ================= */
  form(rec, onDone, preset) {
    const sch = Store.schema('constraint');
    const cur = Object.assign({}, rec || preset || {});
    const proj = Store.cur() || {};
    const F = key => sch.fields.find(f => f.key === key);
    const lbl = it => LANG === 'ar' ? (it.name || (it.label && it.label.ar)) : (it.nameEn || (it.label && it.label.en) || it.name);

    const people = Store.getMasterList('people');
    const orgs = Store.getMasterList('organizations');
    const consultants = orgs.filter(o => o.type === 'consultant');
    const developers = orgs.filter(o => o.type === 'developer');
    const clients = orgs.filter(o => o.type === 'client' || o.type === 'owner');
    const contractorOrgs = orgs.filter(o => o.type === 'contractor');
    const zones = Store.getMasterList('zones');
    const streets = Store.getMasterList('streets');
    const subcats = Store.getMasterList('subcategories');
    const personDisplay = v => {
      if (!v) return '';
      const u = Store.userById(v); if (u) return LANG === 'ar' ? u.name : (u.nameEn || u.name);
      const p = Store.getPerson(v); if (p) return lbl(p);
      return v;
    };
    const contractorDisplay = v => {
      if (!v) return '';
      const c = Store.contractor(v); if (c) return LANG === 'ar' ? c.name : (c.nameEn || c.name);
      const o = Store.getOrganization(v); if (o) return lbl(o);
      return v;
    };

    const dl = (id, items) => `<datalist id="${id}">${items.map(i => `<option value="${esc(lbl(i))}">`).join('')}</datalist>`;
    const streetOptions = (zoneName, selected) => {
      const z = zones.find(zz => zz.name === zoneName);
      const list = z ? streets.filter(s => s.zone === z.id) : streets;
      return `<option value="">${TX('— اختر —', '— Select —')}</option>` +
        list.map(s => `<option value="${esc(s.name)}" ${selected === s.name ? 'selected' : ''}>${esc(lbl(s))}</option>`).join('') +
        `<option value="__add">+ ${TX('إضافة شارع جديد', 'Add new street')}</option>`;
    };

    const tagPresets = [
      { ar: 'مرافق', en: 'Utilities' }, { ar: 'أسفلت', en: 'Asphalt' }, { ar: 'تصريف أمطار', en: 'Stormwater' },
      { ar: 'اتصالات', en: 'Telecom' }, { ar: 'كهرباء', en: 'Electricity' }, { ar: 'إغلاق طريق', en: 'Road Closure' },
      { ar: 'مطور', en: 'Developer' }, { ar: 'تصريح', en: 'Permit' }, { ar: 'سلامة', en: 'Safety' }, { ar: 'جودة', en: 'Quality' },
    ];
    const curTags = cur.tags || [];
    let draftEvidence = [];
    const relatedLinks = (preset && preset.links) ? preset.links.slice() : [];

    const m = UI.modal(`
      <div class="drawer-h"><h2>${rec ? '✏️ ' + t('edit') : '🚩 ＋ ' + TX('معوق / مشكلة جديدة', 'New Issue / Constraint')} ${rec ? `<span class="mut fs12">${esc(rec.ref)}</span>` : ''}</h2>
        <button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b">
        ${dl('dl-people', people.concat(Store.db.users))}${dl('dl-orgs', orgs)}${dl('dl-consultants', consultants)}${dl('dl-developers', developers)}${dl('dl-clients', clients)}${dl('dl-zones', zones)}${dl('dl-streets', streets)}${dl('dl-subcats', subcats)}${dl('dl-contractors', contractorOrgs.concat(Store.db.contractors))}

        <div class="panel" style="margin-bottom:14px">
          <div class="grid g4">
            <div><div class="fs11 mut">${TX('رقم الملف', 'Issue No.')}</div><div class="fs13 b">${rec ? esc(rec.ref) : TX('سيُنشأ عند الحفظ', 'Generated on save')}</div></div>
            <div><div class="fs11 mut">${TX('تاريخ الإنشاء', 'Created')}</div><div class="fs13 b">${UI.fmtDate(rec ? rec.createdAt : todayISO())}</div></div>
            <div><div class="fs11 mut">${TX('بواسطة', 'Created By')}</div><div class="fs13 b">${esc(Store.userName(rec ? rec.createdBy : Store.db.currentUserId))}</div></div>
            <div><div class="fs11 mut">${TX('المشروع', 'Project')}</div><div class="fs13 b">${esc(proj.code || '')} · ${esc((LANG === 'ar' ? proj.name : (proj.nameEn || proj.name)) || '')}</div></div>
          </div>
        </div>

        <div class="section-t">📝 ${TX('التفاصيل الأساسية', 'Core Details')}</div>
        <div class="form-grid">
          <div class="full"><label class="fl">${tl(F('title').label)} <span class="req">*</span></label>${UI.fieldInput(F('title'), cur.title)}</div>
          <div class="full"><label class="fl">${tl(F('description').label)}</label>${UI.fieldInput(F('description'), cur.description)}
            <div class="flexw mt8" style="gap:6px">
              <button type="button" class="btn xs" id="ai-title">✨ ${TX('اقتراح عنوان', 'Suggest Title')}</button>
              <button type="button" class="btn xs" id="ai-summary">✨ ${TX('توليد ملخص', 'Generate Summary')}</button>
              <button type="button" class="btn xs" id="ai-resp">✨ ${TX('اقتراح الجهة المسؤولة', 'Suggest Responsible Party')}</button>
              <button type="button" class="btn xs" id="ai-cat">✨ ${TX('اقتراح التصنيف', 'Suggest Category')}</button>
              <button type="button" class="btn xs" id="ai-pri">✨ ${TX('اقتراح الأولوية', 'Suggest Priority')}</button>
              <button type="button" class="btn xs" id="ai-next">✨ ${TX('اقتراح الإجراء التالي', 'Suggest Next Action')}</button>
            </div>
            <div class="fs11 mut mt8" id="ai-next-out"></div>
          </div>
          <div><label class="fl">${TX('التصنيف', 'Category')}</label>
            <select class="input" data-fk="category" id="cr-cat"><option value="">—</option>${sch.categories.map(c => `<option value="${c.key}" ${cur.category === c.key ? 'selected' : ''}>${tl(c.label)}</option>`).join('')}
            <option value="__add">+ ${TX('إضافة فئة جديدة', 'Add new category')}</option></select></div>
          <div><label class="fl">${tl(F('subcategory').label)}</label><input class="input" data-fk="subcategory" list="dl-subcats" value="${esc(cur.subcategory || '')}"></div>
          <div><label class="fl">${tl(F('priority').label)}</label>${UI.fieldInput(F('priority'), cur.priority)}</div>
          <div><label class="fl">${tl(F('severity').label)}</label>${UI.fieldInput(F('severity'), cur.severity)}</div>
          <div><label class="fl">${tl(F('dueDate').label)}</label>${UI.fieldInput(F('dueDate'), cur.dueDate || dOff(14))}</div>
          <div><label class="fl">${tl(F('targetClosure').label)}</label>${UI.fieldInput(F('targetClosure'), cur.targetClosure)}</div>
          ${rec ? `<div><label class="fl">${t('status')}</label><select class="input" data-fk="status">${sch.statuses.map(s => `<option value="${s.key}" ${rec.status === s.key ? 'selected' : ''}>${tl(s.label)}</option>`).join('')}</select></div>`
            : `<input type="hidden" data-fk="status" value="draft">`}
          <div><label class="fl">${tl(F('extRef').label)}</label>${UI.fieldInput(F('extRef'), cur.extRef)}</div>
        </div>

        <div class="section-t">📍 ${TX('الموقع الذكي', 'Location Intelligence')}</div>
        <div class="form-grid">
          <div><label class="fl">${tl(F('zone').label)}</label><select class="input" data-fk="zone" id="cr-zone">
            <option value="">${TX('— اختر —', '— Select —')}</option>${zones.map(z => `<option value="${esc(z.name)}" ${cur.zone === z.name ? 'selected' : ''}>${esc(lbl(z))}</option>`).join('')}
            <option value="__add">+ ${TX('إضافة منطقة جديدة', 'Add new zone')}</option></select></div>
          <div><label class="fl">${tl(F('street').label)}</label><select class="input" data-fk="street" id="cr-street">${streetOptions(cur.zone, cur.street)}</select></div>
          <div><label class="fl">${tl(F('gps').label)}</label>${UI.fieldInput(F('gps'), cur.gps)}</div>
        </div>

        <div class="section-t">👥 ${TX('مصفوفة المسؤولية', 'Responsibility Matrix')}</div>
        <div class="form-grid">
          <div><label class="fl">${tl(F('responsibleParty').label)} <span class="req">*</span></label>${UI.fieldInput(F('responsibleParty'), cur.responsibleParty)}</div>
          <div><label class="fl">${tl(F('currentOwner').label)} <span class="req">*</span></label><input class="input" data-fk="currentOwner" list="dl-people" placeholder="${TX('اكتب اسماً أو اختر من القائمة', 'Type a name or pick from the list')}" value="${esc(personDisplay(cur.currentOwner || Store.db.currentUserId))}"></div>
          <div><label class="fl">${tl(F('assignedTo').label)}</label><input class="input" data-fk="assignedTo" list="dl-people" placeholder="${TX('اكتب اسماً أو اختر من القائمة', 'Type a name or pick from the list')}" value="${esc(personDisplay(cur.assignedTo))}"></div>
          <div><label class="fl">${tl(F('raisedBy').label)}</label><input class="input" data-fk="raisedBy" list="dl-people" placeholder="${TX('اكتب اسماً أو اختر من القائمة', 'Type a name or pick from the list')}" value="${esc(personDisplay(cur.raisedBy || Store.db.currentUserId))}"></div>
          <div><label class="fl">${tl(F('reviewer').label)}</label><input class="input" data-fk="reviewer" list="dl-people" value="${esc(cur.reviewer || '')}"></div>
          <div><label class="fl">${tl(F('approver').label)}</label><input class="input" data-fk="approver" list="dl-people" value="${esc(cur.approver || '')}"></div>
          <div><label class="fl">${tl(F('watchers').label)}</label><input class="input" data-fk="watchers" list="dl-people" placeholder="${TX('افصل بفاصلة', 'comma separated')}" value="${esc((cur.watchers || []).join(', '))}"></div>
          <div><label class="fl">${tl(F('supportingParties').label)}</label><input class="input" data-fk="supportingParties" list="dl-orgs" placeholder="${TX('افصل بفاصلة', 'comma separated')}" value="${esc((cur.supportingParties || []).join(', '))}"></div>
          <div><label class="fl">${tl(F('sentTo').label)}</label>${UI.fieldInput(F('sentTo'), cur.sentTo)}</div>
        </div>

        <div class="section-t">⚠️ ${TX('قسم التأثير', 'Impact Section')}</div>
        <div class="form-grid">
          <div><label class="fl">${tl(F('contractor').label)}</label><input class="input" data-fk="contractor" list="dl-contractors" placeholder="${TX('اكتب اسماً أو اختر من القائمة', 'Type a name or pick from the list')}" value="${esc(contractorDisplay(cur.contractor))}"></div>
          <div><label class="fl">${tl(F('consultant').label)}</label><input class="input" data-fk="consultant" list="dl-consultants" value="${esc(cur.consultant || '')}"></div>
          <div><label class="fl">${tl(F('developer').label)}</label><input class="input" data-fk="developer" list="dl-developers" value="${esc(cur.developer || '')}"></div>
          <div><label class="fl">${tl(F('clientParty').label)}</label><input class="input" data-fk="clientParty" list="dl-clients" value="${esc(cur.clientParty || '')}"></div>
          <div><label class="fl">${tl(F('impactedActivity').label)}</label>${UI.fieldInput(F('impactedActivity'), cur.impactedActivity)}</div>
          <div><label class="fl">${tl(F('impactedMilestone').label)}</label>${UI.fieldInput(F('impactedMilestone'), cur.impactedMilestone)}</div>
          <div><label class="fl">${tl(F('impactedWorkfront').label)}</label>${UI.fieldInput(F('impactedWorkfront'), cur.impactedWorkfront)}</div>
          <div><label class="fl">${tl(F('affectedZone').label)}</label><input class="input" data-fk="affectedZone" list="dl-zones" value="${esc(cur.affectedZone || '')}"></div>
          <div><label class="fl">${tl(F('affectedStreet').label)}</label><input class="input" data-fk="affectedStreet" list="dl-streets" value="${esc(cur.affectedStreet || '')}"></div>
        </div>

        <div class="section-t">📎 ${TX('الأدلة والمرفقات', 'Evidence & Attachments')}</div>
        <div class="form-grid">
          <div class="full">
            <input type="file" class="input" id="cr-files" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.dwg">
            <div class="fs11 mut mt8">${TX('معاينة فورية للصور قبل الحفظ', 'Instant preview for images before saving')}</div>
            <div id="cr-ev-preview" class="flexw mt8" style="gap:8px"></div>
          </div>
        </div>

        ${!rec ? `
        <div class="section-t">📨 ${TX('المتابعة الأولية', 'Initial Follow-up')}</div>
        <div class="form-grid">
          <div><label class="fl">${TX('تاريخ المتابعة', 'Follow-up Date')}</label><input type="date" class="input" id="cr-fu-date" value="${todayISO()}"></div>
          <div><label class="fl">${TX('أُرسل إلى', 'Sent To')}</label><input class="input" id="cr-fu-sentto" list="dl-people"></div>
          <div class="full"><label class="fl">${TX('ملاحظات المتابعة', 'Follow-up Notes')}</label><textarea class="input" id="cr-fu-notes" style="height:60px"></textarea></div>
        </div>

        <div class="section-t">💬 ${TX('الرد الأولي (إن وجد)', 'Initial Response (if available)')}</div>
        <div class="form-grid">
          <div><label class="fl">${TX('من', 'From')}</label><input class="input" id="cr-rs-from"></div>
          <div><label class="fl">${TX('التقييم', 'Evaluation')}</label><select class="input" id="cr-rs-acc">
            <option value="pending">${TRK.respStates.pending.label()}</option>
            <option value="accepted">${TRK.respStates.accepted.label()}</option>
            <option value="rejected">${TRK.respStates.rejected.label()}</option>
            <option value="moreInfo">${TRK.respStates.moreInfo.label()}</option></select></div>
          <div class="full"><label class="fl">${TX('ملخص الرد', 'Response Summary')}</label><input class="input" id="cr-rs-sum"></div>
        </div>

        <div class="section-t">🔗 ${TX('سجلات مرتبطة', 'Related Records')}</div>
        <div class="form-grid">
          <div><label class="fl">${TX('النوع', 'Type')}</label><select class="input" id="cr-rel-type">
            <option value="observation">${TX('ملاحظة ميدانية', 'Site Observation')}</option>
            <option value="meeting">${TX('اجتماع', 'Meeting')}</option>
            <option value="correspondence">${TX('مراسلة', 'Correspondence')}</option>
            <option value="risk">${TX('خطر', 'Risk')}</option>
            <option value="action">${TX('إجراء', 'Action')}</option>
            <option value="contractor">${TX('مقاول', 'Contractor')}</option></select></div>
          <div><label class="fl">${TX('المرجع', 'Reference')}</label><input class="input" id="cr-rel-ref" placeholder="${TX('رقم المرجع أو الاسم', 'Ref ID or name')}"></div>
          <div style="display:flex;align-items:flex-end"><button type="button" class="btn sm" id="cr-rel-add">＋ ${t('add')}</button></div>
          <div class="full flexw" id="cr-rel-list" style="gap:6px"></div>
        </div>` : ''}

        <div class="section-t">🏷️ ${TX('الوسوم الذكية', 'Smart Tags')}</div>
        <div class="flexw" id="cr-tag-chips" style="gap:6px;margin-bottom:8px">
          ${tagPresets.map(tg => `<span class="chip lg" data-tag="${esc(tg.ar)}|${esc(tg.en)}" style="cursor:pointer">${esc(LANG === 'ar' ? tg.ar : tg.en)}</span>`).join('')}
        </div>
        <input class="input" data-fk="tags" id="cr-tags-input" value="${esc(curTags.join(', '))}" placeholder="${TX('وسوم مخصصة، افصل بفاصلة', 'custom tags, comma separated')}">

        <div class="section-t">👁️ ${TX('معاينة الملف', 'Issue Preview')}</div>
        <div class="panel" id="cr-preview" style="margin-bottom:10px">
          <div class="fs12 mut">${TX('انقر "معاينة" لعرض ملخص الملف قبل الحفظ', 'Click "Preview" to see a summary before saving')}</div>
        </div>
        <button type="button" class="btn sm" id="cr-preview-btn">👁️ ${TX('معاينة', 'Preview')}</button>
      </div>
      <div class="drawer-f flexw" style="gap:8px">
        ${!rec ? `<button class="btn" id="cr-draft">📝 ${TX('حفظ كمسودة', 'Save Draft')}</button>` : ''}
        <button class="btn primary" id="cr-save">💾 ${rec ? t('save') : TX('حفظ وتقديم', 'Save & Submit')}</button>
        ${!rec ? `<button class="btn" id="cr-send">📤 ${TX('حفظ وإرسال', 'Save & Send')}</button>` : ''}
        ${!rec ? `<button class="btn" id="cr-another">➕ ${TX('حفظ وإنشاء آخر', 'Save & Create Another')}</button>` : ''}
        <button class="btn" data-close>${t('cancel')}</button>
      </div>`, { wide: true });

    /* ---- location cascading ---- */
    const zoneSel = m.el.querySelector('#cr-zone');
    const streetSel = m.el.querySelector('#cr-street');
    zoneSel.onchange = () => {
      if (zoneSel.value === '__add') {
        const nm = prompt(TX('أدخل اسم المنطقة الجديدة', 'Enter new zone name'));
        if (nm) {
          Store.addToMasterList('zones', { name: nm, nameEn: nm });
          zones.push({ name: nm, nameEn: nm });
          const opt = document.createElement('option'); opt.value = nm; opt.textContent = nm; opt.selected = true;
          zoneSel.insertBefore(opt, zoneSel.lastElementChild);
        } else zoneSel.value = '';
      }
      streetSel.innerHTML = streetOptions(zoneSel.value, '');
    };
    streetSel.onchange = () => {
      if (streetSel.value === '__add') {
        const nm = prompt(TX('أدخل اسم الشارع الجديد', 'Enter new street name'));
        if (nm) {
          const z = zones.find(zz => zz.name === zoneSel.value);
          Store.addToMasterList('streets', { name: nm, nameEn: nm, zone: z ? z.id : null });
          streets.push({ name: nm, nameEn: nm, zone: z ? z.id : null });
          const opt = document.createElement('option'); opt.value = nm; opt.textContent = nm; opt.selected = true;
          streetSel.insertBefore(opt, streetSel.lastElementChild);
        } else streetSel.value = '';
      }
    };

    /* ---- inline category creation ---- */
    const catSel = m.el.querySelector('#cr-cat');
    catSel.onchange = () => {
      if (catSel.value === '__add') {
        const ar = prompt(TX('اسم الفئة الجديدة (عربي)', 'New category name (Arabic)'));
        if (ar) {
          const en = prompt(TX('اسم الفئة (إنجليزي)', 'New category name (English)')) || ar;
          const key = 'cat_' + uid('c');
          sch.categories.push({ key, label: { ar, en } });
          Store.save();
          const opt = document.createElement('option'); opt.value = key; opt.textContent = LANG === 'ar' ? ar : en; opt.selected = true;
          catSel.insertBefore(opt, catSel.lastElementChild);
        } else catSel.value = cur.category || '';
      }
    };

    /* ---- evidence preview ---- */
    const filesInput = m.el.querySelector('#cr-files');
    const evPreview = m.el.querySelector('#cr-ev-preview');
    const renderEvPreview = () => {
      evPreview.innerHTML = draftEvidence.map((e, i) => `<div class="panel" style="padding:6px;text-align:center;width:90px">
        ${e.dataUrl ? `<img src="${e.dataUrl}" style="width:100%;height:60px;object-fit:cover;border-radius:6px">` : `<div style="font-size:24px">${e.etype === 'video' ? '🎬' : '📄'}</div>`}
        <div class="fs11" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.name)}</div>
        <button type="button" class="btn xs" data-rmev="${i}" style="margin-top:4px">✕</button>
      </div>`).join('');
      evPreview.querySelectorAll('[data-rmev]').forEach(b => b.onclick = () => { draftEvidence.splice(+b.dataset.rmev, 1); renderEvPreview(); });
    };
    filesInput.onchange = () => {
      const files = Array.from(filesInput.files || []);
      files.forEach(fl => {
        const etype = fl.type.startsWith('image/') ? 'photo' : fl.type.startsWith('video/') ? 'video' : 'document';
        if (fl.type.startsWith('image/') && fl.size < 4000000) {
          const rd = new FileReader();
          rd.onload = () => {
            const img = new Image();
            img.onload = () => {
              const cv = document.createElement('canvas');
              const sc = Math.min(1, 240 / Math.max(img.width, img.height));
              cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
              cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
              draftEvidence.push({ id: uid('ev'), name: fl.name, etype, stage: 'identification', desc: '', dataUrl: cv.toDataURL('image/jpeg', 0.72), fullDataUrl: rd.result, size: fl.size });
              renderEvPreview();
            };
            img.src = rd.result;
          };
          rd.readAsDataURL(fl);
        } else {
          draftEvidence.push({ id: uid('ev'), name: fl.name, etype, stage: 'identification', desc: '', size: fl.size });
          renderEvPreview();
        }
      });
      filesInput.value = '';
    };

    /* ---- related records ---- */
    const relList = m.el.querySelector('#cr-rel-list');
    if (relList) {
      const renderRel = () => {
        relList.innerHTML = relatedLinks.map((l, i) => `<span class="tag">${esc(UI.optLabel(l.type))}: ${esc(l.id)} <span data-rmrel="${i}" style="cursor:pointer">✕</span></span>`).join(' ');
        relList.querySelectorAll('[data-rmrel]').forEach(b => b.onclick = () => { relatedLinks.splice(+b.dataset.rmrel, 1); renderRel(); });
      };
      m.el.querySelector('#cr-rel-add').onclick = () => {
        const type = m.el.querySelector('#cr-rel-type').value;
        const ref = m.el.querySelector('#cr-rel-ref').value.trim();
        if (!ref) return;
        relatedLinks.push({ type, id: ref });
        m.el.querySelector('#cr-rel-ref').value = '';
        renderRel();
      };
      renderRel();
    }

    /* ---- smart tags ---- */
    m.el.querySelectorAll('[data-tag]').forEach(chip => {
      const [ar, en] = chip.dataset.tag.split('|');
      const val = LANG === 'ar' ? ar : en;
      const inp = m.el.querySelector('#cr-tags-input');
      if (curTags.includes(val)) chip.style.background = 'var(--accent)';
      chip.onclick = () => {
        let arr = inp.value.split(',').map(s => s.trim()).filter(Boolean);
        if (arr.includes(val)) { arr = arr.filter(x => x !== val); chip.style.background = ''; }
        else { arr.push(val); chip.style.background = 'var(--accent)'; }
        inp.value = arr.join(', ');
      };
    });

    /* ---- AI assistance (heuristic suggestions) ---- */
    const descEl = m.el.querySelector('[data-fk="description"]');
    const titleEl = m.el.querySelector('[data-fk="title"]');
    const catEl = m.el.querySelector('#cr-cat');
    const priEl = m.el.querySelector('[data-fk="priority"]');
    const respEl = m.el.querySelector('[data-fk="responsibleParty"]');
    const notesEl = m.el.querySelector('[data-fk="notes"]');
    const desc = () => (descEl ? descEl.value : '').trim();

    m.el.querySelector('#ai-title').onclick = () => {
      const d = desc(); if (!d) { UI.toast(TX('أدخل الوصف أولاً', 'Enter a description first'), 'err'); return; }
      const words = d.split(/\s+/).slice(0, 8).join(' ');
      const zoneTxt = zoneSel.value ? ` — ${zoneSel.value}` : '';
      titleEl.value = words + (d.split(/\s+/).length > 8 ? '…' : '') + zoneTxt;
    };
    m.el.querySelector('#ai-summary').onclick = () => {
      const d = desc(); if (!d) { UI.toast(TX('أدخل الوصف أولاً', 'Enter a description first'), 'err'); return; }
      if (notesEl) notesEl.value = d.length > 160 ? d.slice(0, 160) + '…' : d;
      UI.toast(TX('تم إدراج الملخص في الملاحظات', 'Summary inserted into notes'));
    };
    m.el.querySelector('#ai-resp').onclick = () => {
      const d = desc();
      let v = 'internal';
      if (/مقاول|contractor/i.test(d)) v = 'contractor';
      else if (/استشاري|consultant/i.test(d)) v = 'consultant';
      else if (/مطور|developer/i.test(d)) v = 'developer';
      else if (/أمانة|بلدية|حكوم|authority/i.test(d)) v = 'authority';
      else if (/عميل|client/i.test(d)) v = 'client';
      respEl.value = v;
    };
    m.el.querySelector('#ai-cat').onclick = () => {
      const d = desc();
      const map = [
        [/كهرب|electric/i, 'utility'], [/مياه|صرف|water|drain/i, 'utility'],
        [/تأخر.*مقاول|مقاول.*تأخر|contractor delay/i, 'contractorDelay'],
        [/مطور|developer/i, 'developerDep'], [/تصريح|أمانة|بلدية|permit|authority/i, 'authority'],
        [/تصميم|design/i, 'design'], [/أرض|حرم|land|right of way/i, 'landAccess'],
        [/نقل|لوجست|logistic/i, 'logistics'], [/مالي|تكلفة|commercial/i, 'commercial'],
      ];
      let key = 'other';
      for (const [re, k] of map) if (re.test(d)) { key = k; break; }
      catEl.value = key;
    };
    m.el.querySelector('#ai-pri').onclick = () => {
      const d = desc();
      priEl.value = /حرج|عاجل|خطير|critical|urgent|severe/i.test(d) ? 'high' : 'medium';
    };
    m.el.querySelector('#ai-next').onclick = () => {
      const d = desc();
      const out = m.el.querySelector('#ai-next-out');
      let txt;
      if (/حرج|عاجل|critical|urgent/i.test(d)) txt = TX('يوصى بالتصعيد الفوري وإشعار الإدارة التنفيذية.', 'Recommend immediate escalation and notify executive management.');
      else if (/مقاول|contractor/i.test(d)) txt = TX('يوصى بإرسال متابعة رسمية للمقاول مع تحديد مهلة للرد.', 'Recommend sending an official follow-up to the contractor with a response deadline.');
      else txt = TX('يوصى بمتابعة دورية مع الجهة المسؤولة حتى الحل.', 'Recommend routine follow-up with the responsible party until resolved.');
      out.textContent = '🎯 ' + txt;
    };

    /* ---- preview ---- */
    m.el.querySelector('#cr-preview-btn').onclick = () => {
      const data = {};
      m.el.querySelectorAll('[data-fk]').forEach(inp => { data[inp.getAttribute('data-fk')] = inp.value; });
      const impactParts = [
        data.contractor ? (Store.contractor(data.contractor) || {}).name : '',
        data.consultant, data.developer, data.impactedActivity, data.impactedMilestone,
      ].filter(Boolean).join(' · ') || '—';
      m.el.querySelector('#cr-preview').innerHTML = `
        <div class="grid g2">
          <div class="dt-row"><div class="dt-k">${TX('العنوان', 'Title')}</div><div class="dt-v">${esc(data.title || '—')}</div></div>
          <div class="dt-row"><div class="dt-k">${TX('الأولوية', 'Priority')}</div><div class="dt-v">${UI.prioChip(data.priority || 'medium')}</div></div>
          <div class="dt-row"><div class="dt-k">${TX('الجهة المسؤولة', 'Responsible Party')}</div><div class="dt-v">${esc(UI.optLabel(data.responsibleParty) || '—')}</div></div>
          <div class="dt-row"><div class="dt-k">${TX('المنطقة', 'Zone')}</div><div class="dt-v">${esc(data.zone || '—')}</div></div>
          <div class="dt-row"><div class="dt-k">${TX('الشارع', 'Street')}</div><div class="dt-v">${esc(data.street || '—')}</div></div>
          <div class="dt-row"><div class="dt-k">${TX('الاستحقاق', 'Due Date')}</div><div class="dt-v">${data.dueDate ? UI.fmtDate(data.dueDate) : '—'}</div></div>
          <div class="dt-row full" style="grid-column:1/-1"><div class="dt-k">${TX('التأثير', 'Impact')}</div><div class="dt-v">${esc(impactParts)}</div></div>
        </div>`;
    };

    /* ---- save handlers ---- */
    const doSave = (statusOverride, opts = {}) => {
      const statusInp = m.el.querySelector('[data-fk="status"]');
      if (statusInp && statusOverride) statusInp.value = statusOverride;
      const data = UI.collectForm(m.el, 'constraint');
      if (!data) return;

      /* auto-register free-typed names/companies into master data for future suggestions */
      const sameName = (it, v) => (it.name === v) || (it.nameEn === v) || (LANG === 'ar' ? it.name : it.nameEn) === v;
      ['currentOwner', 'assignedTo', 'raisedBy'].forEach(k => {
        const v = (data[k] || '').trim();
        if (!v) return;
        if (Store.userById(v) || Store.getPerson(v)) return;
        if (Store.db.users.some(u => sameName(u, v)) || people.some(p => sameName(p, v))) return;
        const created = Store.addToMasterList('people', { name: v, nameEn: v, active: true });
        people.push(created);
      });
      const cv = (data.contractor || '').trim();
      if (cv && !Store.contractor(cv) && !Store.getOrganization(cv)) {
        if (!Store.db.contractors.some(c => sameName(c, cv)) && !orgs.some(o => sameName(o, cv))) {
          const created = Store.addToMasterList('organizations', { type: 'contractor', name: cv, nameEn: cv, active: true });
          orgs.push(created);
        }
      }

      if (rec) {
        if (data.dueDate !== rec.dueDate) Store.logTL('constraint', rec.id, 'due', { oldVal: rec.dueDate, newVal: data.dueDate });
        if (data.currentOwner !== rec.currentOwner) Store.logTL('constraint', rec.id, 'owner', { oldVal: Store.userName(rec.currentOwner), newVal: Store.userName(data.currentOwner) });
        Store.update('constraint', rec.id, data);
        if (draftEvidence.length) {
          rec.evidence = rec.evidence || [];
          rec.evidence.push(...draftEvidence);
          Store.logTL('constraint', rec.id, 'attachment', { attachments: draftEvidence.map(e => e.name) });
        }
        Store.logTL('constraint', rec.id, 'edit', { comment: TX('تم تحديث بيانات ملف المعوق.', 'Case details updated.') });
        Store.save();
        m.close(); UI.toast(t('saved'));
        if (onDone) onDone();
        return;
      }

      const created = Store.create('constraint', Object.assign({
        followups: [], responses: [], evidence: draftEvidence.slice(), links: relatedLinks, closures: [], timeline: [],
      }, data, preset && preset.sourceType ? { sourceType: preset.sourceType, sourceId: preset.sourceId } : {}));
      Store.logTL('constraint', created.id, 'created', { comment: TX('تم إنشاء ملف المعوق.', 'Case file created.') });
      if (draftEvidence.length) Store.logTL('constraint', created.id, 'attachment', { attachments: draftEvidence.map(e => e.name) });

      if (opts.sendInitials) {
        const fuDate = m.el.querySelector('#cr-fu-date').value;
        const fuTo = m.el.querySelector('#cr-fu-sentto').value.trim();
        const fuNotes = m.el.querySelector('#cr-fu-notes').value.trim();
        const rsFrom = m.el.querySelector('#cr-rs-from').value.trim();
        const rsAcc = m.el.querySelector('#cr-rs-acc').value;
        const rsSum = m.el.querySelector('#cr-rs-sum').value.trim();
        if (fuTo || fuNotes) {
          created.followups.push({ id: uid('fu'), date: fuDate, method: 'email', fuType: 'reminder', sentToParty: fuTo, by: Store.db.currentUserId, comment: fuNotes, requiredAction: '', nextDate: '', attachment: '', statusAfter: '' });
          Store.logTL('constraint', created.id, 'followup', { comment: fuNotes, attachments: [] });
        }
        if (rsSum) {
          created.responses.push({ id: uid('rs'), date: todayISO(), from: rsFrom, company: fuTo, accepted: rsAcc, summary: rsSum, fullText: '' });
          Store.logTL('constraint', created.id, 'response', { comment: rsSum });
        }
      }
      Store.save();
      m.close(); UI.toast(t('saved'));
      if (opts.createAnother) { this.form(null, onDone, preset); return; }
      if (onDone) onDone();
    };

    if (!rec) {
      m.el.querySelector('#cr-draft').onclick = () => doSave('draft');
      m.el.querySelector('#cr-send').onclick = () => doSave('sent', { sendInitials: true });
      m.el.querySelector('#cr-another').onclick = () => doSave('submitted', { sendInitials: true, createAnother: true });
      m.el.querySelector('#cr-save').onclick = () => doSave('submitted', { sendInitials: true });
    } else {
      m.el.querySelector('#cr-save').onclick = () => doSave(null);
    }
  },

  /* convert from observation / meeting / correspondence */
  createFrom(srcType, src, onChange) {
    const preset = {
      title: src.title,
      description: (src.description || src.minutes || '') + `\n(${TX('محوّل من', 'Converted from')} ${src.ref})`,
      zone: src.location || '', street: src.location || '', gps: src.gps || '',
      contractor: src.contractor || '', priority: src.priority || 'medium', severity: src.severity || src.priority || 'medium',
      responsibleParty: 'contractor', currentOwner: Store.db.currentUserId, raisedBy: Store.db.currentUserId,
      dueDate: src.dueDate || src.responseDue || dOff(14),
      links: [{ type: srcType, id: src.id }], sourceType: srcType, sourceId: src.id,
    };
    this.form(null, () => {
      UI.toast(TX('تم إنشاء المعوق وربطه بالمصدر', 'Issue created and linked to source'));
      if (onChange) onChange();
    }, preset);
  },

  /* ================= case file detail ================= */
  openDetail(id, onChange, tab) {
    const r = Store.get('constraint', id);
    if (!r) return;
    this.dtTab = tab || 'overview';
    const tabs = [
      ['overview', '📋', TX('نظرة عامة', 'Overview')],
      ['timeline', '🕓', TX('الخط الزمني', 'Timeline'), (r.timeline || []).length],
      ['followups', '📨', TX('المتابعات', 'Follow-Ups'), (r.followups || []).length],
      ['responses', '💬', TX('الردود', 'Responses'), (r.responses || []).length],
      ['attachments', '📎', TX('المرفقات', 'Attachments'), (r.evidence || []).length],
      ['gallery', '🖼', TX('معرض الأدلة', 'Evidence Gallery')],
      ['related', '🔗', TX('عناصر مرتبطة', 'Related Items')],
      ['closure', '🏁', TX('سجل الإغلاق', 'Closure Record'), (r.closures || []).length],
    ];
    const closed = this.isClosed(r);
    const m = UI.modal(`
      <div class="drawer-h">
        <span style="font-size:22px">🚩</span>
        <h2>${esc(r.title)}
          <div class="fs11 mut" style="font-weight:500">${esc(r.ref)}${r.extRef ? ' · ' + esc(r.extRef) : ''} · ${t('createdAt')}: ${UI.fmtDate(r.createdAt)} · ${Store.userName(r.createdBy)}</div></h2>
        <button class="x-btn" data-close>✕</button>
      </div>
      <div class="flexw" style="padding:10px 22px 0;gap:6px">
        ${UI.statusChip('constraint', r.status, true)} ${UI.prioChip(r.priority)} ${this.badges(r)}
      </div>
      <div class="module-tabs" style="margin:10px 22px 0">
        ${tabs.map(([k, ic, lbl, n]) => `<button class="${this.dtTab === k ? 'active' : ''}" data-ct="${k}">${ic} ${lbl}${n ? ` <span class="cnt">${n}</span>` : ''}</button>`).join('')}
      </div>
      <div class="drawer-b" id="ct-body" style="flex:1"></div>
      <div class="drawer-f">
        <button class="btn primary" id="ct-edit">✏️ ${t('edit')}</button>
        <button class="btn" id="ct-fu">📨 ${TX('متابعة', 'Follow-up')}</button>
        <button class="btn" id="ct-resp">💬 ${TX('رد', 'Response')}</button>
        <button class="btn" id="ct-ev">📎 ${TX('مرفق', 'Attach')}</button>
        ${!closed && r.status !== 'escalated' ? `<button class="btn gold" id="ct-esc">🚨 ${t('escalate')}</button>` : ''}
        ${!closed && r.status !== 'readyclosure' ? `<button class="btn" id="ct-reqcl">🏁 ${TX('طلب إغلاق', 'Request Closure')}</button>` : ''}
        ${!closed ? `<button class="btn" id="ct-close" style="border-color:var(--green);color:var(--green)">✅ ${TX('إغلاق', 'Close')}</button>` : ''}
        ${closed || r.status === 'closed' ? `<button class="btn" id="ct-reopen" style="border-color:#f97316;color:#f97316">♻️ ${TX('إعادة فتح', 'Reopen')}</button>` : ''}
        <button class="btn" id="ct-export">🖨 ${TX('تقرير', 'Report')}</button>
        <div class="spacer"></div>
        <button class="btn danger" id="ct-del">🗑 ${t('delete')}</button>
      </div>`, { wide: true });
    m.el.classList.add('case');

    const refresh = (tb2) => { m.close(); this.openDetail(id, onChange, tb2 || this.dtTab); };
    const done = () => { m.close(); if (onChange) onChange(); };

    m.el.querySelectorAll('[data-ct]').forEach(b2 => b2.onclick = () => { this.dtTab = b2.dataset.ct; this.renderTab(m, r, refresh, onChange);
      m.el.querySelectorAll('[data-ct]').forEach(x => x.classList.toggle('active', x.dataset.ct === this.dtTab)); });
    this.renderTab(m, r, refresh, onChange);

    m.el.querySelector('#ct-edit').onclick = () => { m.close(); this.form(r, () => this.openDetail(id, onChange, this.dtTab)); };
    m.el.querySelector('#ct-fu').onclick = () => this.fuForm(r, () => refresh('followups'));
    m.el.querySelector('#ct-resp').onclick = () => this.respForm(r, () => refresh('responses'));
    m.el.querySelector('#ct-ev').onclick = () => this.evForm(r, () => refresh('attachments'));
    m.el.querySelector('#ct-export').onclick = () => AIBrain.showReport(AIBrain.constraintCase(r), TX('تقرير حالة المعوق', 'Issue Case Report') + ' — ' + r.ref);
    m.el.querySelector('#ct-del').onclick = () => UI.confirm(t('confirmDelete'), () => { Store.remove('constraint', id); UI.toast(t('deleted')); done(); });
    const escB = m.el.querySelector('#ct-esc');
    if (escB) escB.onclick = () => this.changeStatus(r, 'escalated', () => refresh());
    const reqB = m.el.querySelector('#ct-reqcl');
    if (reqB) reqB.onclick = () => {
      Store.update('constraint', r.id, { status: 'readyclosure' });
      Store.logTL('constraint', r.id, 'closureRequest', { comment: TX('تم طلب إغلاق المعوق — بانتظار الاعتماد.', 'Closure requested — awaiting approval.'), oldVal: r.status, newVal: 'readyclosure' });
      UI.toast(t('updated')); refresh('closure');
    };
    const clB = m.el.querySelector('#ct-close');
    if (clB) clB.onclick = () => this.closureForm(r, () => refresh('closure'));
    const roB = m.el.querySelector('#ct-reopen');
    if (roB) roB.onclick = () => this.reopenForm(r, () => refresh());
  },

  renderTab(m, r, refresh, onChange) {
    const body = m.el.querySelector('#ct-body');
    const k = this.dtTab;
    if (k === 'overview') this.tabOverview(body, r, refresh, m, onChange);
    else if (k === 'timeline') this.tabTimeline(body, r, refresh);
    else if (k === 'followups') this.tabFollowups(body, r, refresh);
    else if (k === 'responses') this.tabResponses(body, r, refresh);
    else if (k === 'attachments') this.tabAttachments(body, r, refresh);
    else if (k === 'gallery') this.tabGallery(body, r, refresh);
    else if (k === 'related') this.tabRelated(body, r, refresh, m, onChange);
    else if (k === 'closure') this.tabClosure(body, r, refresh);
  },

  /* ---------- overview ---------- */
  tabOverview(body, r, refresh) {
    const sch = Store.schema('constraint');
    const rs = TRK.respStates[this.respState(r)];
    const nextAction = this.nextAction(r);
    const dates = [
      [TX('تاريخ الإنشاء', 'Created'), r.createdAt], [TX('تاريخ التقديم', 'Submitted'), r.submittedAt],
      [TX('تاريخ الإرسال', 'Sent'), r.sentAt], [TX('تاريخ الاستلام', 'Received'), r.receivedAt],
      [TX('الاستحقاق', 'Due'), r.dueDate], [TX('أول متابعة', 'First Follow-up'), (r.followups || []).length ? (r.followups || []).slice().sort((a, b2) => a.date.localeCompare(b2.date))[0].date : ''],
      [TX('آخر متابعة', 'Last Follow-up'), (this.lastFU(r) || {}).date], [TX('آخر رد', 'Last Response'), (this.lastResp(r) || {}).date],
      [TX('التصعيد', 'Escalated'), r.escalatedAt], [TX('الإغلاق المستهدف', 'Target Closure'), r.targetClosure],
      [TX('الإغلاق الفعلي', 'Actual Closure'), r.closedAt], [TX('إعادة الفتح', 'Reopened'), r.reopenedAt],
    ];
    body.innerHTML = `
      <div class="grid g4" style="margin-bottom:14px">
        <div class="kpi" style="--kc:var(--accent)"><div class="k-label">${TX('أيام مفتوح', 'Days Open')}</div><div class="k-value" style="font-size:24px">${this.daysOpen(r)}</div></div>
        <div class="kpi" style="--kc:${this.daysOverdue(r) ? 'var(--red)' : 'var(--green)'}"><div class="k-label">${TX('أيام التأخر', 'Days Overdue')}</div><div class="k-value" style="font-size:24px">${this.daysOverdue(r)}</div></div>
        <div class="kpi" style="--kc:var(--gold)"><div class="k-label">${TX('منذ آخر تحديث', 'Since Last Update')}</div><div class="k-value" style="font-size:24px">${this.daysSinceUpdate(r)}</div></div>
        <div class="kpi" style="--kc:${rs.color}"><div class="k-label">${TX('حالة الرد', 'Response')}</div><div class="k-value" style="font-size:15px;padding-top:6px">${rs.icon} ${rs.label()}</div></div>
      </div>
      <div class="panel" style="margin-bottom:14px;border-color:rgba(167,139,250,.35)">
        <div class="flex" style="gap:10px"><span style="font-size:18px">🎯</span>
          <div><div class="fs11 b mut2">${TX('الإجراء التالي المقترح', 'Suggested next action')}</div>
          <div class="fs13">${esc(nextAction)}</div></div>
          <div class="spacer"></div>
          <button class="btn sm" id="ov-edit">✏️ ${t('edit')}</button>
          <button class="btn sm gold" id="ov-ai">✨ ${TX('تلخيص الحالة', 'Summarize')}</button>
          <button class="btn sm" id="ov-fu-mail">✉️ ${TX('بريد متابعة', 'Follow-up email')}</button>
          <button class="btn sm" id="ov-esc-mail">🚨 ${TX('بريد تصعيد', 'Escalation email')}</button>
        </div>
      </div>
      <div class="grid g2">
        <div>
          <div class="section-t">${TX('بيانات الحالة', 'Case data')}</div>
          ${sch.fields.filter(f => !['title', 'tags', 'notes', 'dueDate', 'targetClosure'].includes(f.key)).map(f => `
            <div class="dt-row"><div class="dt-k">${tl(f.label)}</div><div class="dt-v">${UI.fieldDisplay('constraint', f, r)}</div></div>`).join('')}
          ${r.notes ? `<div class="dt-row"><div class="dt-k">${TX('ملاحظات', 'Notes')}</div><div class="dt-v">${esc(r.notes)}</div></div>` : ''}
          ${(r.tags || []).length ? `<div class="dt-row"><div class="dt-k">${TX('الوسوم', 'Tags')}</div><div class="dt-v">${r.tags.map(x => `<span class="tag">${esc(x)}</span>`).join(' ')}</div></div>` : ''}
        </div>
        <div>
          <div class="section-t">${TX('سجل التواريخ', 'Date tracking')}</div>
          ${dates.map(([lbl, d]) => `<div class="dt-row"><div class="dt-k">${lbl}</div><div class="dt-v">${d ? UI.fmtDate(d) : '—'}</div></div>`).join('')}
          <div class="section-t">${TX('تغيير الحالة', 'Change status')}</div>
          <div class="flex"><select class="input" id="ov-st" style="flex:1">
            ${sch.statuses.map(s => `<option value="${s.key}" ${r.status === s.key ? 'selected' : ''}>${tl(s.label)}</option>`).join('')}</select>
            <button class="btn primary sm" id="ov-st-go">${t('save')}</button></div>
          <div class="fs11 mut mt8">${TX('اختيار "مغلق" يفتح نموذج الإغلاق الإلزامي مع الأدلة.', 'Choosing "Closed" opens the mandatory closure form with evidence.')}</div>
        </div>
      </div>`;
    body.querySelector('#ov-edit').onclick = () => this.editForm(r, () => refresh());
    body.querySelector('#ov-st-go').onclick = () => {
      const st = body.querySelector('#ov-st').value;
      if (st === r.status) return;
      this.changeStatus(r, st, () => refresh());
    };
    body.querySelector('#ov-ai').onclick = () => AIBrain.showReport(AIBrain.constraintCase(r), TX('ملخص الحالة', 'Case Summary') + ' — ' + r.ref);
    body.querySelector('#ov-fu-mail').onclick = () => AIBrain.showReport(AIBrain.constraintEmail(r, 'followup'), TX('بريد متابعة', 'Follow-up Email'));
    body.querySelector('#ov-esc-mail').onclick = () => AIBrain.showReport(AIBrain.constraintEmail(r, 'escalation'), TX('بريد تصعيد', 'Escalation Email'));
  },

  nextAction(r) {
    if (this.isClosed(r)) return TX('الملف مغلق — لا إجراء مطلوب. يمكن إعادة الفتح عند الحاجة.', 'Case closed — no action required. Reopen if needed.');
    if (r.status === 'readyclosure') return TX('بانتظار اعتماد أو رفض طلب الإغلاق من تبويب سجل الإغلاق.', 'Awaiting closure approval/rejection from the Closure tab.');
    if (this.respState(r) === 'none' && this.daysOverdue(r) > 7) return TX('لا يوجد رد والتأخر تجاوز أسبوعاً — يُوصى بتذكير عاجل ثم تصعيد.', 'No response and overdue >7 days — send urgent reminder then escalate.');
    if (this.respState(r) === 'none') return TX('لم يصل رد بعد — أرسل متابعة إلى ', 'No response yet — send a follow-up to ') + UI.optLabel(r.responsibleParty) + '.';
    if (this.respState(r) === 'moreInfo') return TX('الرد يطلب معلومات إضافية — جهّز التفاصيل المطلوبة وأرسلها.', 'Response requests more info — prepare and send the required details.');
    if (r.status === 'escalated') return TX('مُصعَّد — تابع مع الإدارة التنفيذية وحدّث الحالة بعد الاجتماع.', 'Escalated — follow up with executive management and update after the meeting.');
    if (this.daysOverdue(r) > 0) return TX('متأخر عن الاستحقاق — متابعة فورية مع المالك الحالي وتحديث خطة المعالجة.', 'Past due — follow up immediately with the current owner and update the treatment plan.');
    return TX('ضمن المسار — متابعة دورية حتى تاريخ الاستحقاق.', 'On track — routine follow-up until the due date.');
  },

  /* ---------- timeline ---------- */
  tabTimeline(body, r, refresh) {
    const items = (r.timeline || []).slice().sort((a, b2) => (b2.at || '').localeCompare(a.at || ''));
    body.innerHTML = `
      <div class="flex" style="margin-bottom:12px">
        <input class="input" id="tl-c" placeholder="🗒 ${TX('أضف تعليقاً للسجل…', 'Add a comment to the log…')}" style="flex:1">
        <button class="btn primary sm" id="tl-add">${t('add')}</button>
      </div>
      ${items.map(e => {
        const [ic, lblFn] = TRK.tlActions[e.action] || ['•', () => e.action];
        const dt = (e.at || '').replace('T', ' · ');
        return `<div class="hist-item" style="align-items:flex-start">
          <span class="avatar sm" title="${esc(Store.userName(e.by))}">${ic}</span>
          <div class="h-body">
            <div class="fs12"><b>${lblFn()}</b>${e.oldVal || e.newVal ? ` <span class="mut">(${esc(e.oldVal || '—')} ← ${esc(e.newVal || '—')})</span>` : ''}</div>
            ${e.comment ? `<div class="fs12" style="margin-top:2px">${esc(e.comment)}</div>` : ''}
            ${(e.attachments || []).length ? `<div class="mt8">${e.attachments.map(a => `<span class="tag">📎 ${esc(a)}</span>`).join(' ')}</div>` : ''}
            <div class="h-meta">${esc(dt)} · ${Store.userName(e.by)}${e.company ? ' · ' + esc(e.company) : ''}</div>
          </div>
        </div>`;
      }).join('') || UI.empty('🕓')}`;
    body.querySelector('#tl-add').onclick = () => {
      const v = body.querySelector('#tl-c').value.trim();
      if (!v) return;
      Store.logTL('constraint', r.id, 'comment', { comment: v });
      UI.toast(t('saved')); refresh('timeline');
    };
  },

  /* ---------- follow-ups ---------- */
  tabFollowups(body, r, refresh) {
    const items = (r.followups || []).slice().sort((a, b2) => (b2.date || '').localeCompare(a.date || ''));
    body.innerHTML = `
      <button class="btn primary sm" id="fu-add" style="margin-bottom:12px">＋ ${TX('إضافة متابعة', 'Add Follow-up')}</button>
      ${items.map(fu => {
        const mth = TRK.fuMethods.find(x => x.key === fu.method) || { icon: '📨', label: () => fu.method };
        const tp = TRK.fuTypes.find(x => x.key === fu.fuType) || { label: () => fu.fuType };
        return `<div class="panel" style="margin-bottom:10px;padding:13px 16px">
          <div class="flexw" style="justify-content:space-between">
            <div class="flex"><span style="font-size:17px">${mth.icon}</span>
              <b class="fs13">${tp.label()}</b>
              <span class="chip" style="--cc:#60a5fa">${mth.label()}</span></div>
            <span class="fs11 mut">${UI.fmtDate(fu.date)} · ${Store.userName(fu.by)}</span>
          </div>
          <div class="fs12 mt8">${esc(fu.comment || '')}</div>
          <div class="flexw fs11 mut mt8">
            ${fu.sentToParty ? `<span>📤 ${TX('إلى', 'To')}: ${esc(fu.sentToParty)}</span>` : ''}
            ${fu.requiredAction ? `<span>🎯 ${TX('المطلوب', 'Required')}: ${esc(fu.requiredAction)}</span>` : ''}
            ${fu.nextDate ? `<span>📅 ${TX('المتابعة القادمة', 'Next')}: ${UI.fmtDate(fu.nextDate)}</span>` : ''}
            ${fu.attachment ? `<span class="tag">📎 ${esc(fu.attachment)}</span>` : ''}
            ${fu.statusAfter ? UI.statusChip('constraint', fu.statusAfter) : ''}
          </div>
        </div>`;
      }).join('') || UI.empty('📨', TX('لا متابعات بعد', 'No follow-ups yet'))}`;
    body.querySelector('#fu-add').onclick = () => this.fuForm(r, () => refresh('followups'));
  },

  fuForm(r, onDone) {
    const m = UI.modal(`
      <div class="drawer-h"><h2>📨 ${TX('إضافة متابعة', 'Add Follow-up')} — ${esc(r.ref)}</h2><button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b"><div class="form-grid">
        <div><label class="fl">${TX('تاريخ المتابعة', 'Follow-up date')} <span class="req">*</span></label><input type="date" class="input" id="fu-date" value="${todayISO()}"></div>
        <div><label class="fl">${TX('الوسيلة', 'Method')}</label><select class="input" id="fu-method">
          ${TRK.fuMethods.map(x => `<option value="${x.key}">${x.icon} ${x.label()}</option>`).join('')}</select></div>
        <div><label class="fl">${TX('النوع', 'Type')}</label><select class="input" id="fu-type">
          ${TRK.fuTypes.map(x => `<option value="${x.key}">${x.label()}</option>`).join('')}</select></div>
        <div><label class="fl">${TX('أُرسلت إلى', 'Sent to')}</label><input class="input" id="fu-to" value="${esc(r.sentTo || UI.optLabel(r.responsibleParty))}"></div>
        <div class="full"><label class="fl">${TX('التعليق', 'Comment')} <span class="req">*</span></label><textarea class="input" id="fu-comment"></textarea></div>
        <div class="full"><label class="fl">${TX('الإجراء المطلوب', 'Required action')}</label><input class="input" id="fu-req"></div>
        <div><label class="fl">${TX('المتابعة القادمة', 'Next follow-up date')}</label><input type="date" class="input" id="fu-next"></div>
        <div><label class="fl">${TX('مرفق', 'Attachment')}</label><input class="input" id="fu-att" placeholder="follow_up.pdf"></div>
        <div><label class="fl">${TX('الحالة بعد المتابعة', 'Status after follow-up')}</label><select class="input" id="fu-st">
          <option value="">— ${TX('بدون تغيير', 'No change')} —</option>
          ${Store.schema('constraint').statuses.filter(s => !s.closed).map(s => `<option value="${s.key}">${tl(s.label)}</option>`).join('')}</select></div>
      </div></div>
      <div class="drawer-f"><button class="btn primary" id="fu-save">💾 ${t('save')}</button><button class="btn" data-close>${t('cancel')}</button></div>`, { wide: true });
    m.el.querySelector('#fu-save').onclick = () => {
      const comment = m.el.querySelector('#fu-comment').value.trim();
      if (!comment) { UI.toast(t('required'), 'err'); return; }
      const fu = {
        id: uid('fu'), date: m.el.querySelector('#fu-date').value, method: m.el.querySelector('#fu-method').value,
        fuType: m.el.querySelector('#fu-type').value, sentToParty: m.el.querySelector('#fu-to').value.trim(),
        by: Store.db.currentUserId, comment, requiredAction: m.el.querySelector('#fu-req').value.trim(),
        nextDate: m.el.querySelector('#fu-next').value, attachment: m.el.querySelector('#fu-att').value.trim(),
        statusAfter: m.el.querySelector('#fu-st').value,
      };
      r.followups = r.followups || []; r.followups.push(fu);
      if (fu.statusAfter && fu.statusAfter !== r.status) {
        const old = r.status; r.status = fu.statusAfter;
        const df = TRK.statusDates[fu.statusAfter]; if (df) r[df] = todayISO();
        Store.logTL('constraint', r.id, 'status', { oldVal: old, newVal: fu.statusAfter });
      }
      Store.logTL('constraint', r.id, fu.fuType.includes('Reminder') ? 'reminder' : 'followup',
        { comment: `${(TRK.fuTypes.find(x => x.key === fu.fuType) || { label: () => '' }).label()} — ${comment}`, attachments: fu.attachment ? [fu.attachment] : [] });
      m.close(); UI.toast(t('saved')); if (onDone) onDone();
    };
  },

  /* ---------- responses ---------- */
  tabResponses(body, r, refresh) {
    const items = (r.responses || []).slice().sort((a, b2) => (b2.date || '').localeCompare(a.date || ''));
    body.innerHTML = `
      <button class="btn primary sm" id="rs-add" style="margin-bottom:12px">＋ ${TX('تسجيل رد', 'Record Response')}</button>
      ${items.map(rp => {
        const st = TRK.respStates[rp.accepted] || TRK.respStates.pending;
        return `<div class="panel" style="margin-bottom:10px;padding:13px 16px;border-color:${st.color}40">
          <div class="flexw" style="justify-content:space-between">
            <div class="flex"><span style="font-size:17px">${st.icon}</span><b class="fs13">${esc(rp.from || '')}</b>
              ${rp.company ? `<span class="fs11 mut">· ${esc(rp.company)}</span>` : ''}
              <span class="chip" style="--cc:${st.color}">${st.label()}</span></div>
            <span class="fs11 mut">${UI.fmtDate(rp.date)}</span>
          </div>
          <div class="fs12 b mt8">${esc(rp.summary || '')}</div>
          ${rp.fullText ? `<div class="fs12 mut2 mt8" style="line-height:1.7">${esc(rp.fullText)}</div>` : ''}
          <div class="flexw fs11 mut mt8">
            ${rp.furtherAction ? `<span>🎯 ${esc(rp.furtherAction)}</span>` : ''}
            ${rp.nextAction ? `<span>⏭ ${esc(rp.nextAction)}</span>` : ''}
            ${rp.newDue ? `<span>📅 ${TX('استحقاق جديد', 'New due')}: ${UI.fmtDate(rp.newDue)}</span>` : ''}
            ${rp.attachment ? `<span class="tag">📎 ${esc(rp.attachment)}</span>` : ''}
          </div>
        </div>`;
      }).join('') || UI.empty('💬', TX('لا ردود مسجلة — أرسل متابعة', 'No responses yet — send a follow-up'))}`;
    body.querySelector('#rs-add').onclick = () => this.respForm(r, () => refresh('responses'));
  },

  editForm(r, onDone) {
    const zones = Store.getMasterList('zones');
    const consultants = Store.getOrganizations('consultant');
    const users = Store.db.users;
    const contractors = Store.db.contractors;

    const m = UI.modal(`
      <div class="drawer-h"><h2>✏️ ${TX('تعديل بيانات الملف', 'Edit case file')} — ${esc(r.ref)}</h2><button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b"><div class="form-grid">
        <div class="full"><label class="fl">${TX('العنوان', 'Title')} <span class="req">*</span></label><input class="input" id="ed-title" value="${esc(r.title)}" required></div>
        <div class="full"><label class="fl">${TX('الوصف', 'Description')}</label><textarea class="input" id="ed-desc" style="height:80px">${esc(r.description || '')}</textarea></div>

        <div><label class="fl">${TX('المالك الحالي', 'Current Owner')}</label><select class="input" id="ed-owner">
          <option value="">${TX('— اختر —', '— Select —')}</option>
          ${users.filter(u => u.id !== Store.db.currentUserId).map(u => `<option value="${u.id}" ${r.currentOwner === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></div>

        <div><label class="fl">${TX('مسند إلى', 'Assigned To')}</label><select class="input" id="ed-assigned">
          <option value="">${TX('— اختر —', '— Select —')}</option>
          ${users.map(u => `<option value="${u.id}" ${r.assignedTo === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></div>

        <div><label class="fl">${TX('الجهة المسؤولة', 'Responsible Party')}</label><select class="input" id="ed-respparty">
          <option value="">— ${TX('اختر', 'Select')} —</option>
          <option value="contractor" ${r.responsibleParty === 'contractor' ? 'selected' : ''}>${TX('المقاول', 'Contractor')}</option>
          <option value="consultant" ${r.responsibleParty === 'consultant' ? 'selected' : ''}>${TX('الاستشاري', 'Consultant')}</option>
          <option value="developer" ${r.responsibleParty === 'developer' ? 'selected' : ''}>${TX('المطور', 'Developer')}</option>
          <option value="client" ${r.responsibleParty === 'client' ? 'selected' : ''}>${TX('العميل', 'Client')}</option>
          <option value="authority" ${r.responsibleParty === 'authority' ? 'selected' : ''}>${TX('الجهة الحكومية', 'Authority')}</option>
          <option value="internal" ${r.responsibleParty === 'internal' ? 'selected' : ''}>${TX('فريق المشروع', 'Internal Team')}</option></select></div>

        <div><label class="fl">${TX('المقاول', 'Contractor')}</label><select class="input" id="ed-contractor">
          <option value="">${TX('— اختر —', '— Select —')}</option>
          ${contractors.map(c => `<option value="${c.id}" ${r.contractor === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>

        <div><label class="fl">${TX('المنطقة / القطاع', 'Zone / Area')}</label><select class="input" id="ed-zone">
          <option value="">${TX('— اختر —', '— Select —')}</option>
          ${zones.map(z => `<option value="${esc(z.name)}" ${r.zone === z.name ? 'selected' : ''}>${esc(LANG === 'ar' ? z.name : (z.nameEn || z.name))}</option>`).join('')}
          <option value="__add">+ ${TX('إضافة منطقة جديدة', 'Add new zone')}</option></select></div>

        <div><label class="fl">${TX('الاستشاري', 'Consultant')}</label><select class="input" id="ed-cons">
          <option value="">${TX('— اختر —', '— Select —')}</option>
          ${consultants.map(c => `<option value="${esc(c.name)}" ${r.consultant === c.name ? 'selected' : ''}>${esc(LANG === 'ar' ? c.name : (c.nameEn || c.name))}</option>`).join('')}
          <option value="__add">+ ${TX('إضافة استشاري جديد', 'Add new consultant')}</option></select></div>

        <div><label class="fl">${TX('الأولوية', 'Priority')}</label><select class="input" id="ed-pri" value="${r.priority || 'medium'}">
          <option value="low">${TX('منخفضة', 'Low')}</option>
          <option value="medium" selected>${TX('متوسطة', 'Medium')}</option>
          <option value="high">${TX('عالية', 'High')}</option></select></div>
        <div><label class="fl">${TX('الخطورة', 'Severity')}</label><select class="input" id="ed-sev" value="${r.severity || 'medium'}">
          <option value="low">${TX('منخفضة', 'Low')}</option>
          <option value="medium" selected>${TX('متوسطة', 'Medium')}</option>
          <option value="high">${TX('عالية', 'High')}</option>
          <option value="critical">${TX('حرجة', 'Critical')}</option></select></div>
        <div><label class="fl">${TX('تاريخ الاستحقاق', 'Due Date')}</label><input type="date" class="input" id="ed-due" value="${r.dueDate || ''}"></div>
        <div><label class="fl">${TX('الإغلاق المستهدف', 'Target Closure')}</label><input type="date" class="input" id="ed-tc" value="${r.targetClosure || ''}"></div>
        <div class="full"><label class="fl">${TX('ملاحظات', 'Notes')}</label><textarea class="input" id="ed-notes" style="height:60px">${esc(r.notes || '')}</textarea></div>
        <div class="full"><label class="fl">${TX('الوسوم (افصل بفاصلة)', 'Tags (comma separated)')}</label><input class="input" id="ed-tags" value="${(r.tags || []).join(', ')}"></div>
      </div></div>
      <div class="drawer-f"><button class="btn primary" id="ed-save">💾 ${t('save')}</button><button class="btn" data-close>${t('cancel')}</button></div>`, { wide: true });

    // Handle adding new zone/consultant
    const zoneEl = m.el.querySelector('#ed-zone');
    const consEl = m.el.querySelector('#ed-cons');
    if (zoneEl) zoneEl.onchange = () => {
      if (zoneEl.value === '__add') {
        const newZone = prompt(TX('أدخل اسم المنطقة الجديدة', 'Enter new zone name'));
        if (newZone) {
          Store.addToMasterList('zones', { name: newZone, nameEn: newZone });
          zoneEl.innerHTML += `<option value="${esc(newZone)}" selected>${esc(newZone)}</option>`;
          zoneEl.value = newZone;
        } else {
          zoneEl.value = r.zone || '';
        }
      }
    };
    if (consEl) consEl.onchange = () => {
      if (consEl.value === '__add') {
        const newCons = prompt(TX('أدخل اسم الاستشاري الجديد', 'Enter new consultant name'));
        if (newCons) {
          Store.addToMasterList('organizations', { type: 'consultant', name: newCons, nameEn: newCons });
          consEl.innerHTML += `<option value="${esc(newCons)}" selected>${esc(newCons)}</option>`;
          consEl.value = newCons;
        } else {
          consEl.value = r.consultant || '';
        }
      }
    };

    m.el.querySelector('#ed-save').onclick = () => {
      const title = m.el.querySelector('#ed-title').value.trim();
      if (!title) { UI.toast(t('required'), 'err'); return; }

      const changes = [];
      const fields = {
        title: m.el.querySelector('#ed-title').value.trim(),
        description: m.el.querySelector('#ed-desc').value.trim(),
        currentOwner: m.el.querySelector('#ed-owner').value,
        assignedTo: m.el.querySelector('#ed-assigned').value,
        responsibleParty: m.el.querySelector('#ed-respparty').value,
        contractor: m.el.querySelector('#ed-contractor').value,
        zone: m.el.querySelector('#ed-zone').value,
        consultant: m.el.querySelector('#ed-cons').value,
        priority: m.el.querySelector('#ed-pri').value,
        severity: m.el.querySelector('#ed-sev').value,
        dueDate: m.el.querySelector('#ed-due').value,
        targetClosure: m.el.querySelector('#ed-tc').value,
        notes: m.el.querySelector('#ed-notes').value.trim(),
        tags: m.el.querySelector('#ed-tags').value.split(',').map(t => t.trim()).filter(t => t),
      };

      Object.keys(fields).forEach(k => {
        const oldVal = r[k];
        const newVal = fields[k];
        if (k === 'tags') {
          if (JSON.stringify(newVal) !== JSON.stringify(oldVal || [])) {
            changes.push({ field: k, old: (oldVal || []).join(', '), new: newVal.join(', ') });
            r[k] = newVal;
          }
        } else if (newVal !== (oldVal || '')) {
          const displayOld = k.includes('Owner') || k.includes('assigned') || k === 'contractor' ? Store.userName(oldVal) || oldVal : oldVal;
          const displayNew = k.includes('Owner') || k.includes('assigned') || k === 'contractor' ? Store.userName(newVal) || newVal : newVal;
          changes.push({ field: k, old: displayOld || '', new: displayNew || '' });
          r[k] = newVal;
        }
      });

      if (changes.length === 0) { UI.toast(TX('لا تغييرات', 'No changes')); m.close(); return; }

      changes.forEach(c => {
        Store.logTL('constraint', r.id, 'edit', { comment: `${c.field} updated`, oldVal: c.old, newVal: c.new });
      });
      Store.save();
      m.close(); UI.toast(t('saved')); if (onDone) onDone();
    };
  },

  respForm(r, onDone) {
    const m = UI.modal(`
      <div class="drawer-h"><h2>💬 ${TX('تسجيل رد', 'Record Response')} — ${esc(r.ref)}</h2><button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b"><div class="form-grid">
        <div><label class="fl">${TX('تاريخ الرد', 'Response date')} <span class="req">*</span></label><input type="date" class="input" id="rs-date" value="${todayISO()}"></div>
        <div><label class="fl">${TX('الرد من', 'Response from')} <span class="req">*</span></label><input class="input" id="rs-from"></div>
        <div><label class="fl">${TX('الجهة / الشركة', 'Company')}</label><input class="input" id="rs-co" value="${esc(r.sentTo || '')}"></div>
        <div><label class="fl">${TX('تقييم الرد', 'Response evaluation')}</label><select class="input" id="rs-acc">
          <option value="pending">${TRK.respStates.pending.label()}</option>
          <option value="accepted">${TRK.respStates.accepted.label()}</option>
          <option value="rejected">${TRK.respStates.rejected.label()}</option>
          <option value="moreInfo">${TRK.respStates.moreInfo.label()}</option></select></div>
        <div class="full"><label class="fl">${TX('ملخص الرد', 'Response summary')} <span class="req">*</span></label><input class="input" id="rs-sum"></div>
        <div class="full"><label class="fl">${TX('نص الرد الكامل', 'Full response text')}</label><textarea class="input" id="rs-full"></textarea></div>
        <div><label class="fl">${TX('هل يلزم إجراء إضافي؟', 'Further action required?')}</label><input class="input" id="rs-fa"></div>
        <div><label class="fl">${TX('الإجراء التالي', 'Next action')}</label><input class="input" id="rs-na"></div>
        <div><label class="fl">${TX('استحقاق جديد', 'New due date')}</label><input type="date" class="input" id="rs-due"></div>
        <div><label class="fl">${TX('مرفق', 'Attachment')}</label><input class="input" id="rs-att" placeholder="response.pdf"></div>
      </div></div>
      <div class="drawer-f"><button class="btn primary" id="rs-save">💾 ${t('save')}</button><button class="btn" data-close>${t('cancel')}</button></div>`, { wide: true });
    m.el.querySelector('#rs-save').onclick = () => {
      const from = m.el.querySelector('#rs-from').value.trim();
      const summary = m.el.querySelector('#rs-sum').value.trim();
      if (!from || !summary) { UI.toast(t('required'), 'err'); return; }
      const rp = {
        id: uid('rs'), date: m.el.querySelector('#rs-date').value, from,
        company: m.el.querySelector('#rs-co').value.trim(), summary,
        fullText: m.el.querySelector('#rs-full').value.trim(), accepted: m.el.querySelector('#rs-acc').value,
        furtherAction: m.el.querySelector('#rs-fa').value.trim(), nextAction: m.el.querySelector('#rs-na').value.trim(),
        newDue: m.el.querySelector('#rs-due').value, attachment: m.el.querySelector('#rs-att').value.trim(),
      };
      r.responses = r.responses || []; r.responses.push(rp);
      if (rp.newDue) {
        Store.logTL('constraint', r.id, 'due', { oldVal: r.dueDate, newVal: rp.newDue });
        r.dueDate = rp.newDue;
      }
      Store.logTL('constraint', r.id, 'response', { comment: `${from}${rp.company ? ' (' + rp.company + ')' : ''}: ${summary}`, company: rp.company, attachments: rp.attachment ? [rp.attachment] : [] });
      m.close(); UI.toast(t('saved')); if (onDone) onDone();
    };
  },

  /* ---------- attachments & evidence ---------- */
  evIcon(e) { return (TRK.evTypes.find(x => x.key === e.etype) || { icon: '📎' }).icon; },

  tabAttachments(body, r, refresh) {
    const items = (r.evidence || []).slice().sort((a, b2) => (b2.at || '').localeCompare(a.at || ''));
    body.innerHTML = `
      <button class="btn primary sm" id="ev-add" style="margin-bottom:12px">＋ ${TX('رفع مرفق / دليل', 'Upload attachment / evidence')}</button>
      <table class="tbl"><thead><tr>
        <th></th><th>${TX('الملف', 'File')}</th><th>${TX('النوع', 'Type')}</th><th>${TX('مرحلة الدليل', 'Evidence stage')}</th>
        <th>${TX('الوصف', 'Description')}</th><th>${TX('الحالة عند الرفع', 'Status at upload')}</th><th>${TX('رُفع بواسطة', 'Uploaded by')}</th><th>${TX('التاريخ', 'Date')}</th><th></th>
      </tr></thead><tbody>
      ${items.map(e => {
        const stg = TRK.evStages.find(x => x.key === e.stage) || { icon: '📎', label: () => e.stage };
        return `<tr>
          <td>${e.dataUrl ? `<img src="${e.dataUrl}" class="ev-thumb clickable" data-ev="${e.id}" style="cursor:pointer" title="${TX('انقر للعرض', 'Click to view')}">` : `<span style="font-size:18px;cursor:pointer" class="clickable" data-ev="${e.id}">${this.evIcon(e)}</span>`}</td>
          <td class="fs12 b">${esc(e.name)}</td>
          <td class="fs12">${(TRK.evTypes.find(x => x.key === e.etype) || { label: () => e.etype }).label()}</td>
          <td><span class="chip" style="--cc:${e.stage === 'closure' ? '#34d399' : e.stage === 'rejection' ? '#f43f5e' : '#60a5fa'}">${stg.icon} ${stg.label()}</span></td>
          <td class="fs12">${esc(e.desc || '—')}</td>
          <td>${e.linkedStatus ? UI.statusChip('constraint', e.linkedStatus) : '—'}</td>
          <td class="fs12">${Store.userName(e.by)}</td>
          <td class="fs11 mut">${UI.fmtDate(e.at)}</td>
          <td><button class="btn xs" id="ev-dl-${e.id}" ${e.fullDataUrl ? '' : 'disabled'} title="${TX('تحميل', 'Download')}">⬇️</button></td>
        </tr>`;
      }).join('')}</tbody></table>
      ${!items.length ? UI.empty('📎', TX('لا مرفقات بعد', 'No attachments yet')) : ''}`;
    body.querySelector('#ev-add').onclick = () => this.evForm(r, () => refresh('attachments'));
    body.querySelectorAll('[data-ev]').forEach(img => img.onclick = () => this.lightbox(r, img.dataset.ev));
    items.forEach(e => {
      const btn = body.querySelector(`#ev-dl-${e.id}`);
      if (btn && e.fullDataUrl) {
        btn.onclick = () => {
          const a = document.createElement('a');
          a.href = e.fullDataUrl;
          a.download = e.name;
          a.click();
        };
      }
    });
  },

  evForm(r, onDone, presetStage) {
    const draftKey = `ev-draft-${r.id}`;
    const draft = JSON.parse(localStorage.getItem(draftKey) || '{}');
    const m = UI.modal(`
      <div class="drawer-h"><h2>📎 ${TX('رفع مرفق / دليل', 'Upload attachment / evidence')} — ${esc(r.ref)}</h2><button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b"><div class="form-grid">
        <div class="full"><label class="fl">${TX('الملفات (صور، فيديو، PDF…)', 'Files (photos, video, PDF…)')}</label>
          <input type="file" class="input" id="ev-files" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.dwg">
          <div class="fs11 mut mt8">${TX('أو أدخل أسماء الملفات يدوياً، افصل بفاصلة', 'or type file names manually, comma separated')}</div>
          <input class="input mt8" id="ev-names" placeholder="IMG_001.jpg, letter.pdf" value="${esc(draft.names || '')}" style="margin-top:6px"></div>
        <div><label class="fl">${TX('نوع المرفق', 'Attachment type')}</label><select class="input" id="ev-type">
          ${TRK.evTypes.map(x => `<option value="${x.key}" ${draft.type === x.key ? 'selected' : ''}>${x.icon} ${x.label()}</option>`).join('')}</select></div>
        <div><label class="fl">${TX('مرحلة الدليل', 'Evidence stage')}</label><select class="input" id="ev-stage">
          ${TRK.evStages.map(x => `<option value="${x.key}" ${(draft.stage || presetStage) === x.key ? 'selected' : ''}>${x.icon} ${x.label()}</option>`).join('')}</select></div>
        <div class="full"><label class="fl">${TX('الوصف', 'Description')}</label><input class="input" id="ev-desc" value="${esc(draft.desc || '')}"></div>
      </div></div>
      <div class="drawer-f"><button class="btn primary" id="ev-save">💾 ${t('save')}</button><button class="btn" data-close>${t('cancel')}</button></div>`, { wide: true, onClose: () => {
        const names = m.el.querySelector('#ev-names').value.trim();
        const type = m.el.querySelector('#ev-type').value;
        const stage = m.el.querySelector('#ev-stage').value;
        const desc = m.el.querySelector('#ev-desc').value.trim();
        if (names || desc) {
          localStorage.setItem(draftKey, JSON.stringify({ names, type, stage, desc }));
        }
      }});
    m.el.querySelector('#ev-save').onclick = () => {
      const fileInput = m.el.querySelector('#ev-files');
      const names = m.el.querySelector('#ev-names').value.split(',').map(s => s.trim()).filter(Boolean);
      const etype = m.el.querySelector('#ev-type').value;
      const stage = m.el.querySelector('#ev-stage').value;
      const desc = m.el.querySelector('#ev-desc').value.trim();
      const finish = (entries) => {
        if (!entries.length) { UI.toast(t('required'), 'err'); return; }
        r.evidence = r.evidence || [];
        entries.forEach(en => r.evidence.push(Object.assign({
          id: uid('ev'), etype, stage, desc, at: todayISO(), by: Store.db.currentUserId, linkedStatus: r.status, dataUrl: null, fullDataUrl: null,
        }, en)));
        Store.logTL('constraint', r.id, etype === 'photo' || etype === 'video' ? 'photo' : 'attachment',
          { comment: desc, attachments: entries.map(e => e.name) });
        localStorage.removeItem(draftKey);
        m.close(); UI.toast(t('saved')); if (onDone) onDone();
      };
      const files = Array.from(fileInput.files || []);
      if (files.length) {
        let pending = files.length; const entries = [];
        files.forEach(fl => {
          if (fl.type.startsWith('image/') && fl.size < 4000000) {
            const rd = new FileReader();
            rd.onload = () => {
              const img = new Image();
              img.onload = () => {
                const cv = document.createElement('canvas');
                const sc = Math.min(1, 420 / Math.max(img.width, img.height));
                cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                entries.push({ name: fl.name, dataUrl: cv.toDataURL('image/jpeg', 0.72), fullDataUrl: rd.result, size: fl.size });
                if (!--pending) finish(entries.concat(names.map(nm => ({ name: nm }))));
              };
              img.onerror = () => { entries.push({ name: fl.name, fullDataUrl: rd.result, size: fl.size }); if (!--pending) finish(entries.concat(names.map(nm => ({ name: nm })))); };
              img.src = rd.result;
            };
            rd.readAsDataURL(fl);
          } else {
            entries.push({ name: fl.name, size: fl.size });
            if (!--pending) finish(entries.concat(names.map(nm => ({ name: nm }))));
          }
        });
      } else finish(names.map(nm => ({ name: nm })));
    };
  },

  /* ---------- evidence gallery ---------- */
  tabGallery(body, r, refresh) {
    const ev = r.evidence || [];
    body.innerHTML = `
      <div class="flexw" style="margin-bottom:12px">
        ${TRK.evStages.map(s => { const n = ev.filter(e => e.stage === s.key).length;
          return `<span class="chip" style="--cc:${n ? '#60a5fa' : '#64748b'}">${s.icon} ${s.label()} (${n})</span>`; }).join(' ')}
        <div class="spacer"></div>
        <button class="btn primary sm" id="gl-add">＋ ${TX('إضافة دليل', 'Add evidence')}</button>
      </div>
      ${TRK.evStages.map(s => {
        const items = ev.filter(e => e.stage === s.key);
        if (!items.length) return '';
        return `<div class="section-t">${s.icon} ${s.label()} (${items.length})</div>
          <div class="ev-grid">${items.map(e => `
            <div class="ev-card" data-ev="${e.id}">
              <div class="ev-ph">${e.dataUrl ? `<img src="${e.dataUrl}">` : `<span>${this.evIcon(e)}</span>`}</div>
              <div class="ev-meta"><b class="fs11">${esc(e.name)}</b>
                <div class="fs11 mut">${esc(e.desc || '')}</div>
                <div class="fs11 mut">${UI.fmtDate(e.at)} · ${Store.userName(e.by)}</div></div>
            </div>`).join('')}</div>`;
      }).join('') || UI.empty('🖼', TX('لا أدلة موثقة بعد', 'No evidence documented yet'))}
      ${this.closedNoEvidence(r) ? `<div class="panel mt14" style="border-color:rgba(245,185,66,.5)">
        ⚠️ <b class="fs12">${TX('هذا المعوق مغلق دون دليل إغلاق — يُوصى برفع صور ما بعد المعالجة.', 'This issue is closed without closure evidence — upload after-treatment photos.')}</b></div>` : ''}`;
    body.querySelector('#gl-add').onclick = () => this.evForm(r, () => refresh('gallery'));
    body.querySelectorAll('[data-ev]').forEach(el => el.onclick = () => this.lightbox(r, el.dataset.ev));
  },

  lightbox(r, evId) {
    const idx = (r.evidence || []).findIndex(x => x.id === evId);
    if (idx < 0) return;
    const ev = r.evidence || [];
    let currentIdx = idx;
    const show = () => {
      const e = ev[currentIdx];
      if (!e) return;
      const stg = TRK.evStages.find(x => x.key === e.stage) || { icon: '📎', label: () => e.stage };
      const fileSize = e.size ? `${(e.size / 1024 / 1024).toFixed(1)} MB` : '—';
      const isImage = /\.(jpe?g|png|gif|webp)$/i.test(e.name);
      const isPdf = /\.pdf$/i.test(e.name);
      m.el.querySelector('.drawer-b').innerHTML = `
        <div class="center" style="padding:20px">
          <div style="position:relative;margin-bottom:20px">
            ${e.dataUrl ? (isImage ? `<img src="${e.dataUrl}" id="lb-img" style="max-width:100%;max-height:55vh;border-radius:12px;cursor:zoom-in" title="${TX('انقر للتكبير', 'Click to zoom')}">` :
              isPdf ? `<div style="font-size:60px;padding:40px;background:rgba(100,100,100,.1);border-radius:12px">📄</div>` :
              `<div style="font-size:60px;padding:40px;background:rgba(100,100,100,.1);border-radius:12px">${this.evIcon(e)}</div>`)
              : `<div style="font-size:60px;padding:40px;background:rgba(100,100,100,.1);border-radius:12px">${this.evIcon(e)}</div>`}
            <div style="position:absolute;top:10px;right:10px;display:flex;gap:8px">
              ${e.fullDataUrl ? `<button class="btn xs" id="lb-download" title="${TX('تحميل', 'Download')}">⬇️</button>` : ''}
              ${e.dataUrl ? `<button class="btn xs" id="lb-fullscreen" title="${TX('ملء الشاشة', 'Fullscreen')}">⛶</button>` : ''}
            </div>
            ${ev.length > 1 ? `<div style="position:absolute;top:50%;left:10px;right:10px;display:flex;justify-content:space-between">
              <button class="btn xs" id="lb-prev" style="opacity:${currentIdx > 0 ? 1 : 0.3}" ${currentIdx > 0 ? '' : 'disabled'}>◀ ${TX('السابق', 'Prev')}</button>
              <button class="btn xs" id="lb-next" style="opacity:${currentIdx < ev.length - 1 ? 1 : 0.3}" ${currentIdx < ev.length - 1 ? '' : 'disabled'}>▶ ${TX('التالي', 'Next')}</button>
            </div>` : ''}
            <div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,.6);color:white;padding:4px 8px;border-radius:6px;font-size:12px">${currentIdx + 1}/${ev.length}</div>
          </div>
          <div class="mt14 flexw" style="justify-content:center;flex-wrap:wrap;gap:8px">
            <span class="chip" style="--cc:#60a5fa">${stg.icon} ${stg.label()}</span>
            ${e.linkedStatus ? UI.statusChip('constraint', e.linkedStatus) : ''}
          </div>
          <div class="fs12 mt8 b">${esc(e.name)}</div>
          <div class="fs12 mt4">${esc(e.desc || '')}</div>
          <div class="fs11 mut mt8">${UI.fmtDate(e.at)} · ${Store.userName(e.by)} · ${fileSize}</div>
        </div>`;
      const btnPrev = m.el.querySelector('#lb-prev');
      const btnNext = m.el.querySelector('#lb-next');
      const btnDl = m.el.querySelector('#lb-download');
      const btnFs = m.el.querySelector('#lb-fullscreen');
      const imgEl = m.el.querySelector('#lb-img');
      if (btnPrev) btnPrev.onclick = () => { currentIdx = Math.max(0, currentIdx - 1); show(); };
      if (btnNext) btnNext.onclick = () => { currentIdx = Math.min(ev.length - 1, currentIdx + 1); show(); };
      if (btnDl) btnDl.onclick = () => {
        const a = document.createElement('a');
        a.href = ev[currentIdx].fullDataUrl;
        a.download = ev[currentIdx].name;
        a.click();
      };
      if (btnFs && imgEl) {
        btnFs.onclick = () => {
          if (imgEl.requestFullscreen) {
            imgEl.requestFullscreen().catch(() => {});
          } else if (imgEl.webkitRequestFullscreen) {
            imgEl.webkitRequestFullscreen();
          }
        };
      }
      if (imgEl) imgEl.onclick = () => {
        const zoom = m.el.querySelector('#lb-zoom');
        if (zoom) {
          zoom.remove();
        } else {
          const z = document.createElement('div');
          z.id = 'lb-zoom';
          z.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:zoom-out';
          const img = document.createElement('img');
          img.src = imgEl.src;
          img.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:12px';
          z.appendChild(img);
          z.onclick = () => z.remove();
          document.body.appendChild(z);
        }
      };
    };
    const m = UI.modal(`
      <div class="drawer-h"><h2>${this.evIcon(ev[idx])} ${esc(ev[idx].name)}</h2><button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b"></div>`, { wide: true });
    show();
  },

  /* ---------- related items ---------- */
  tabRelated(body, r, refresh, m, onChange) {
    const types = ['observation', 'meeting', 'correspondence', 'risk', 'document', 'action'];
    const links = (r.links || []).map(l => ({ l, rec: Store.get(l.type, l.id) })).filter(x => x.rec);
    const linkedActions = Store.list('action', { all: true }).filter(a => a.sourceType === 'constraint' && a.sourceId === r.id);
    const con = Store.contractor(r.contractor);
    body.innerHTML = `
      <div class="flexw" style="margin-bottom:12px">
        <select class="input" id="rl-type" style="width:auto">${types.map(tp => `<option value="${tp}">${Store.schema(tp).icon} ${tl(Store.schema(tp).label)}</option>`).join('')}</select>
        <select class="input" id="rl-rec" style="flex:1;min-width:200px"></select>
        <button class="btn primary sm" id="rl-add">🔗 ${TX('ربط', 'Link')}</button>
        <button class="btn sm" id="rl-mkact">⚡ ＋ ${TX('إنشاء إجراء', 'Create action')}</button>
      </div>
      ${con ? `<div class="section-t">${TX('المقاول المرتبط', 'Linked contractor')}</div>
        <div class="link-card" id="rl-con">${con.icon}
          <div style="flex:1"><b class="fs13">${esc(LANG === 'ar' ? con.name : con.nameEn)}</b>
          <div class="fs11 mut">${TX('فتح ملف المقاول وكل سجلاته', 'Open contractor profile & records')}</div></div>›</div>` : ''}
      ${r.impactedMilestone ? `<div class="section-t">${TX('المعلم المتأثر', 'Impacted milestone')}</div>
        <div class="link-card" style="cursor:default">🏁<div style="flex:1"><b class="fs13">${esc(r.impactedMilestone)}</b></div></div>` : ''}
      <div class="section-t">🔗 ${TX('سجلات مرتبطة', 'Linked records')} (${links.length})</div>
      ${links.map(({ l, rec }, idx) => `<div class="link-card">
        <span data-go="${l.type}|${rec.id}" style="cursor:pointer">${Store.schema(l.type).icon}</span>
        <div style="flex:1;cursor:pointer" data-go="${l.type}|${rec.id}"><b class="fs13">${esc(rec.title)}</b>
          <div class="fs11 mut">${esc(rec.ref)} · ${tl(Store.schema(l.type).label)}</div></div>
        ${UI.statusChip(l.type, rec.status)}
        <button class="x-btn sm" data-unlink="${idx}">✕</button>
      </div>`).join('') || `<div class="fs12 mut">${t('noData')}</div>`}
      <div class="section-t">⚡ ${TX('إجراءات ناتجة عن هذا المعوق', 'Actions raised from this issue')} (${linkedActions.length})</div>
      ${linkedActions.map(a => `<div class="link-card" data-go="action|${a.id}">⚡
        <div style="flex:1"><b class="fs13">${esc(a.title)}</b><div class="fs11 mut">${esc(a.ref)} · ${Store.userName(a.assignee)}</div></div>
        ${UI.statusChip('action', a.status)}</div>`).join('') || `<div class="fs12 mut">${t('noData')}</div>`}`;

    const typeSel = body.querySelector('#rl-type');
    const recSel = body.querySelector('#rl-rec');
    const fill = () => {
      const tp = typeSel.value;
      recSel.innerHTML = Store.list(tp).map(x => `<option value="${x.id}">${esc(x.ref)} — ${esc(x.title.slice(0, 60))}</option>`).join('') || `<option value="">${t('noData')}</option>`;
    };
    fill(); typeSel.onchange = fill;
    body.querySelector('#rl-add').onclick = () => {
      const tp = typeSel.value, rid = recSel.value;
      if (!rid) return;
      r.links = r.links || [];
      if (!r.links.some(l => l.id === rid)) {
        r.links.push({ type: tp, id: rid });
        Store.logTL('constraint', r.id, 'comment', { comment: TX('تم ربط سجل: ', 'Linked record: ') + (Store.get(tp, rid) || {}).ref });
      }
      refresh('related');
    };
    body.querySelectorAll('[data-unlink]').forEach(b2 => b2.onclick = () => {
      r.links.splice(parseInt(b2.dataset.unlink), 1); Store.save(); refresh('related');
    });
    body.querySelectorAll('[data-go]').forEach(el => el.onclick = () => {
      const [tp, gid] = el.dataset.go.split('|');
      m.close(); Engine.detail(tp, gid, onChange);
    });
    const conEl = body.querySelector('#rl-con');
    if (conEl) conEl.onclick = () => { m.close(); App.nav('contractors', r.contractor); };
    body.querySelector('#rl-mkact').onclick = () => {
      const m2 = UI.modal(`
        <div class="drawer-h"><h2>⚡ ${t('add')}</h2><button class="x-btn" data-close>✕</button></div>
        <div class="drawer-b">${UI.entityForm('action', { title: TX('إجراء بشأن: ', 'Action for: ') + r.title, sourceType: 'constraint', priority: r.priority || 'medium', contractor: r.contractor, dueDate: dOff(7) })}</div>
        <div class="drawer-f"><button class="btn primary" id="ma-save">💾 ${t('save')}</button><button class="btn" data-close>${t('cancel')}</button></div>`, { wide: true });
      m2.el.querySelector('#ma-save').onclick = () => {
        const data = UI.collectForm(m2.el, 'action');
        if (!data) return;
        data.sourceType = 'constraint'; data.sourceId = r.id;
        Store.create('action', data);
        m2.close(); UI.toast(t('saved')); refresh('related');
      };
    };
  },

  /* ---------- closure record ---------- */
  tabClosure(body, r, refresh) {
    const closures = (r.closures || []).slice().reverse();
    const ready = r.status === 'readyclosure';
    body.innerHTML = `
      ${ready ? `<div class="panel" style="margin-bottom:14px;border-color:rgba(163,230,53,.5)">
        <div class="flexw" style="justify-content:space-between">
          <div>🏁 <b class="fs13">${TX('طلب إغلاق بانتظار الاعتماد', 'Closure request awaiting approval')}</b></div>
          <div class="flex">
            <button class="btn sm" id="cl-approve" style="border-color:var(--green);color:var(--green)">✅ ${TX('اعتماد الإغلاق', 'Approve closure')}</button>
            <button class="btn sm danger" id="cl-reject">⛔ ${TX('رفض الإغلاق', 'Reject closure')}</button>
          </div></div></div>` : ''}
      ${!this.isClosed(r) && !ready ? `<button class="btn primary sm" id="cl-now" style="margin-bottom:12px">✅ ${TX('إغلاق المعوق الآن', 'Close issue now')}</button>` : ''}
      ${r.status === 'closed' ? `<button class="btn sm" id="cl-reopen" style="margin-bottom:12px;border-color:#f97316;color:#f97316">♻️ ${TX('إعادة فتح', 'Reopen')}</button>` : ''}
      ${closures.map((c, i) => {
        const ct = TRK.closureTypes.find(x => x.key === c.ctype) || { icon: '✅', label: () => c.ctype };
        return `<div class="panel" style="margin-bottom:10px;padding:14px 16px;${i === 0 && r.status === 'closed' ? 'border-color:rgba(52,211,153,.45)' : 'opacity:.85'}">
          <div class="flexw" style="justify-content:space-between">
            <div class="flex"><span style="font-size:17px">${ct.icon}</span><b class="fs13">${ct.label()}</b>
              ${i !== 0 || r.status !== 'closed' ? `<span class="chip" style="--cc:#94a3b8">${TX('سجل سابق', 'Previous record')}</span>` : `<span class="chip" style="--cc:#34d399">${TX('الإغلاق الحالي', 'Current closure')}</span>`}</div>
            <span class="fs11 mut">${UI.fmtDate(c.at)}</span>
          </div>
          <div class="dt-row mt8"><div class="dt-k">${TX('أُغلق بواسطة', 'Closed by')}</div><div class="dt-v">${UI.avatar(c.by)} ${Store.userName(c.by)}</div></div>
          <div class="dt-row"><div class="dt-k">${TX('تم التحقق بواسطة', 'Verified by')}</div><div class="dt-v">${c.verifiedBy ? UI.avatar(c.verifiedBy) + ' ' + Store.userName(c.verifiedBy) : '—'}</div></div>
          <div class="dt-row"><div class="dt-k">${TX('التعليق النهائي', 'Final comment')}</div><div class="dt-v">${esc(c.comment || '—')}</div></div>
          <div class="dt-row"><div class="dt-k">${TX('أدلة الإغلاق', 'Closure evidence')}</div><div class="dt-v">
            ${(c.evidence || []).map(nm => `<span class="tag">📎 ${esc(nm)}</span>`).join(' ') || `<span style="color:var(--gold)">⚠️ ${TX('بدون دليل', 'No evidence')}</span>`}</div></div>
          <div class="dt-row"><div class="dt-k">${TX('حالة الاعتماد', 'Approval status')}</div><div class="dt-v">${c.approved ? '✅ ' + TX('معتمد', 'Approved') : '⏳ ' + TX('قيد الاعتماد', 'Pending')}</div></div>
        </div>`;
      }).join('') || UI.empty('🏁', TX('لا سجلات إغلاق بعد', 'No closure records yet'))}`;
    const ap = body.querySelector('#cl-approve');
    if (ap) ap.onclick = () => { Store.logTL('constraint', r.id, 'closureApproved', { comment: TX('تم اعتماد طلب الإغلاق.', 'Closure request approved.') }); this.closureForm(r, () => refresh('closure')); };
    const rj = body.querySelector('#cl-reject');
    if (rj) rj.onclick = () => {
      const m2 = UI.modal(`
        <div class="drawer-h"><h2>⛔ ${TX('رفض الإغلاق', 'Reject closure')}</h2><button class="x-btn" data-close>✕</button></div>
        <div class="drawer-b"><label class="fl">${TX('سبب الرفض', 'Rejection reason')} <span class="req">*</span></label>
          <textarea class="input" id="rj-c"></textarea></div>
        <div class="drawer-f"><button class="btn danger" id="rj-go">⛔ ${TX('رفض', 'Reject')}</button><button class="btn" data-close>${t('cancel')}</button></div>`);
      m2.el.querySelector('#rj-go').onclick = () => {
        const c = m2.el.querySelector('#rj-c').value.trim();
        if (!c) { UI.toast(t('required'), 'err'); return; }
        Store.update('constraint', r.id, { status: 'rejectedclosure' });
        Store.logTL('constraint', r.id, 'closureRejected', { comment: c, oldVal: 'readyclosure', newVal: 'rejectedclosure' });
        m2.close(); UI.toast(t('updated')); refresh('closure');
      };
    };
    const cn = body.querySelector('#cl-now'); if (cn) cn.onclick = () => this.closureForm(r, () => refresh('closure'));
    const ro = body.querySelector('#cl-reopen'); if (ro) ro.onclick = () => this.reopenForm(r, () => refresh('closure'));
  },

  closureForm(r, onDone) {
    const m = UI.modal(`
      <div class="drawer-h"><h2>✅ ${TX('إغلاق المعوق', 'Close Issue')} — ${esc(r.ref)}</h2><button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b"><div class="form-grid">
        <div><label class="fl">${TX('تاريخ الإغلاق', 'Closure date')}</label><input type="date" class="input" id="cl-date" value="${todayISO()}"></div>
        <div><label class="fl">${TX('نوع الإغلاق', 'Closure type')}</label><select class="input" id="cl-type">
          ${TRK.closureTypes.map(x => `<option value="${x.key}">${x.icon} ${x.label()}</option>`).join('')}</select></div>
        <div><label class="fl">${TX('تم التحقق بواسطة', 'Verified by')}</label><select class="input" id="cl-ver">
          <option value="">—</option>${Store.db.users.map(u => `<option value="${u.id}">${esc(LANG === 'ar' ? u.name : u.nameEn)}</option>`).join('')}</select></div>
        <div><label class="fl">${TX('أدلة الإغلاق (صور / ملفات)', 'Closure evidence (photos / files)')}</label>
          <input type="file" class="input" id="cl-files" multiple accept="image/*,.pdf">
          <input class="input" id="cl-names" placeholder="${TX('أو أسماء ملفات، افصل بفاصلة', 'or file names, comma separated')}" style="margin-top:6px"></div>
        <div class="full"><label class="fl">${TX('تعليق الإغلاق', 'Closure comment')} <span class="req">*</span></label><textarea class="input" id="cl-c"></textarea></div>
      </div>
      <div class="fs11 mut">${TX('سيبقى المعوق ظاهراً في أرشيف المغلقة وقابلاً للبحث وإعادة الفتح.', 'The issue stays searchable in the closed archive and can be reopened.')}</div></div>
      <div class="drawer-f"><button class="btn primary" id="cl-save">✅ ${TX('تأكيد الإغلاق', 'Confirm closure')}</button><button class="btn" data-close>${t('cancel')}</button></div>`, { wide: true });
    m.el.querySelector('#cl-save').onclick = () => {
      const comment = m.el.querySelector('#cl-c').value.trim();
      if (!comment) { UI.toast(TX('تعليق الإغلاق مطلوب', 'Closure comment is required'), 'err'); return; }
      const ctype = m.el.querySelector('#cl-type').value;
      const date = m.el.querySelector('#cl-date').value || todayISO();
      const ver = m.el.querySelector('#cl-ver').value;
      const files = Array.from(m.el.querySelector('#cl-files').files || []).map(f => f.name);
      const names = m.el.querySelector('#cl-names').value.split(',').map(s => s.trim()).filter(Boolean);
      const evNames = files.concat(names);
      if (ctype === 'withEvidence' && !evNames.length && !this.hasClosureEv(r)) {
        UI.toast(TX('الإغلاق بدليل يتطلب رفع دليل واحد على الأقل', 'Closing with evidence requires at least one file'), 'err'); return;
      }
      r.closures = r.closures || [];
      r.closures.push({ at: date, by: Store.db.currentUserId, verifiedBy: ver, comment, ctype, evidence: evNames, approved: true });
      r.evidence = r.evidence || [];
      evNames.forEach(nm => r.evidence.push({ id: uid('ev'), name: nm, etype: /\.(jpe?g|png|gif|webp)$/i.test(nm) ? 'photo' : 'pdf', stage: 'closure', desc: TX('دليل إغلاق', 'Closure evidence'), at: date, by: Store.db.currentUserId, linkedStatus: 'closed', dataUrl: null }));
      const old = r.status;
      Store.update('constraint', r.id, { status: 'closed', closedAt: date });
      Store.logTL('constraint', r.id, 'closed', { comment, oldVal: old, newVal: 'closed', attachments: evNames });
      m.close(); UI.toast(TX('تم إغلاق المعوق', 'Issue closed')); if (onDone) onDone();
    };
  },

  reopenForm(r, onDone) {
    const m = UI.modal(`
      <div class="drawer-h"><h2>♻️ ${TX('إعادة فتح المعوق', 'Reopen Issue')} — ${esc(r.ref)}</h2><button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b">
        <div class="fs12 mut" style="margin-bottom:10px">${TX('سيُحتفظ بسجل الإغلاق السابق كاملاً ضمن سجل الإغلاق والخط الزمني.', 'The previous closure record is kept in full in the Closure Record and Timeline.')}</div>
        <label class="fl">${TX('سبب إعادة الفتح', 'Reopen reason')} <span class="req">*</span></label>
        <textarea class="input" id="ro-c"></textarea></div>
      <div class="drawer-f"><button class="btn primary" id="ro-go" style="background:linear-gradient(135deg,#f97316,#ea580c)">♻️ ${TX('إعادة فتح', 'Reopen')}</button><button class="btn" data-close>${t('cancel')}</button></div>`);
    m.el.querySelector('#ro-go').onclick = () => {
      const c = m.el.querySelector('#ro-c').value.trim();
      if (!c) { UI.toast(t('required'), 'err'); return; }
      const old = r.status;
      Store.update('constraint', r.id, { status: 'reopened', reopenedAt: todayISO() });
      Store.logTL('constraint', r.id, 'reopened', { comment: c, oldVal: old, newVal: 'reopened' });
      m.close(); UI.toast(t('updated')); if (onDone) onDone();
    };
  },

  /* ---------- status change with auto date-stamps ---------- */
  changeStatus(r, st, onDone) {
    if (st === 'closed') return this.closureForm(r, onDone);
    if (st === 'reopened' && this.isClosed(r)) return this.reopenForm(r, onDone);
    const old = r.status;
    const patch = { status: st };
    const df = TRK.statusDates[st]; if (df && !r[df]) patch[df] = todayISO();
    Store.update('constraint', r.id, patch);
    const stDef = Store.statusDef('constraint', st);
    Store.logTL('constraint', r.id, st === 'escalated' ? 'escalation' : (TRK.tlActions[st] ? st : 'status'),
      { comment: TX('تغيير الحالة إلى: ', 'Status changed to: ') + tl(stDef.label), oldVal: old, newVal: st });
    UI.toast(t('updated')); if (onDone) onDone();
  },
};
