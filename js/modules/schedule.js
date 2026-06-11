/* ============================================================
   Schedule & Planning Control Center
   مركز إدارة الجدول الزمني — مرتبط بالمعوقات والمشروع
   Independent module: file upload/parsing (XLSX/XER/XML),
   activities register, critical path, lookahead, file/version
   management with audit trail, snapshots & AI-style analysis.
   ============================================================ */

/* ---------- date helpers ---------- */
function schParseDate(v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number') {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d) ? '' : d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  const d = new Date(s);
  return isNaN(d) ? '' : d.toISOString().slice(0, 10);
}
function schDaysBetween(a, b) {
  if (!a || !b) return 0;
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

/* ---------- file parsers ---------- */
const SchParse = {
  HEADER_MAP: {
    activityId: ['activity id', 'activity_id', 'task_code', 'id', 'رقم النشاط', 'كود النشاط'],
    name: ['activity name', 'task_name', 'activity', 'name', 'اسم النشاط', 'النشاط'],
    wbs: ['wbs', 'wbs name', 'wbs_name', 'wbs path'],
    start: ['start date', 'start', 'early start', 'es date', 'تاريخ البداية'],
    finish: ['finish date', 'finish', 'early finish', 'ef date', 'تاريخ النهاية'],
    baselineStart: ['baseline start', 'bl project start', 'bl start', 'target start'],
    baselineFinish: ['baseline finish', 'bl project finish', 'bl finish', 'target finish'],
    actualStart: ['actual start'],
    actualFinish: ['actual finish'],
    pctComplete: ['% complete', 'percent complete', 'pct complete', 'complete %', 'physical % complete'],
    duration: ['original duration', 'duration', 'remaining duration'],
    float: ['total float', 'float'],
    predecessors: ['predecessors', 'predecessor'],
    successors: ['successors', 'successor'],
  },
  matchCol(header) {
    const h = String(header || '').trim().toLowerCase();
    for (const key in this.HEADER_MAP) {
      if (this.HEADER_MAP[key].some(s => h === s || h.includes(s))) return key;
    }
    return null;
  },

  // Excel / Primavera export (.xlsx, .xls)
  async xlsx(file) {
    if (typeof XLSX === 'undefined') throw new Error('XLSX library not available');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellDates: false });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
    let headerRow = -1, colMap = {};
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const map = {};
      rows[i].forEach((c, ci) => { const k = this.matchCol(c); if (k) map[k] = ci; });
      if (map.name && (map.activityId || map.start || map.finish)) { headerRow = i; colMap = map; break; }
    }
    if (headerRow < 0) throw new Error('header-not-found');
    const acts = [];
    for (let i = headerRow + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r.length) continue;
      const name = colMap.name != null ? r[colMap.name] : '';
      if (!name) continue;
      const get = k => colMap[k] != null ? r[colMap[k]] : '';
      const pct = parseFloat(get('pctComplete')) || 0;
      const dur = parseFloat(get('duration')) || 0;
      const flt = parseFloat(get('float'));
      acts.push({
        activityId: String(get('activityId') || `A${i}`).trim(),
        name: String(name).trim(),
        wbs: String(get('wbs') || '').trim(),
        start: schParseDate(get('start')), finish: schParseDate(get('finish')),
        baselineStart: schParseDate(get('baselineStart')), baselineFinish: schParseDate(get('baselineFinish')),
        actualStart: schParseDate(get('actualStart')), actualFinish: schParseDate(get('actualFinish')),
        pctComplete: pct > 1 ? pct : pct * 100,
        duration: dur,
        float: isNaN(flt) ? null : flt,
        critical: !isNaN(flt) && flt <= 0,
        milestone: dur === 0,
        predecessors: String(get('predecessors') || '').split(/[,;]\s*/).filter(Boolean),
        successors: String(get('successors') || '').split(/[,;]\s*/).filter(Boolean),
      });
    }
    return acts;
  },

  // Primavera P6 .xer (tab-delimited text)
  xer(text) {
    const lines = text.split(/\r?\n/);
    let fields = [], rows = [], inTask = false;
    const acts = [];
    for (const line of lines) {
      if (line.startsWith('%T')) { inTask = line.split('\t')[1] === 'TASK'; continue; }
      if (!inTask) continue;
      if (line.startsWith('%F')) { fields = line.split('\t').slice(1); continue; }
      if (line.startsWith('%R')) {
        const vals = line.split('\t').slice(1);
        const row = {};
        fields.forEach((f, i) => row[f] = vals[i]);
        const hrToDay = h => h ? Math.round((parseFloat(h) / 8) * 10) / 10 : 0;
        const float = row.total_float_hr_cnt !== undefined ? hrToDay(row.total_float_hr_cnt) : null;
        acts.push({
          activityId: row.task_code || '',
          name: row.task_name || '',
          wbs: row.wbs_id || '',
          start: schParseDate(row.act_start_date || row.early_start_date || row.target_start_date),
          finish: schParseDate(row.act_end_date || row.early_end_date || row.target_end_date),
          baselineStart: schParseDate(row.target_start_date),
          baselineFinish: schParseDate(row.target_end_date),
          actualStart: schParseDate(row.act_start_date),
          actualFinish: schParseDate(row.act_end_date),
          pctComplete: row.phys_complete_pct ? parseFloat(row.phys_complete_pct) : (row.task_type === 'TT_Mile' ? (row.status_code === 'TK_Complete' ? 100 : 0) : 0),
          duration: hrToDay(row.target_drtn_hr_cnt),
          float,
          critical: float !== null && float <= 0,
          milestone: (row.task_type || '').includes('Mile'),
          predecessors: [], successors: [],
        });
      }
    }
    return acts;
  },

  // Primavera PMXML (.xml)
  xml(text) {
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    const local = (el, name) => Array.from(el.children).filter(c => c.localName === name);
    const txt = (el, name) => { const c = local(el, name)[0]; return c ? c.textContent.trim() : ''; };
    const durToDays = pt => {
      if (!pt) return 0;
      const m = pt.match(/PT(?:(\d+)H)?/); return m && m[1] ? Math.round((parseFloat(m[1]) / 8) * 10) / 10 : 0;
    };
    const allActs = Array.from(doc.getElementsByTagName('*')).filter(el => el.localName === 'Activity');
    return allActs.map(el => {
      const pct = parseFloat(txt(el, 'PercentComplete')) || 0;
      const flt = txt(el, 'TotalFloat');
      const floatDays = flt ? durToDays(flt) : null;
      const type = txt(el, 'Type');
      return {
        activityId: txt(el, 'Id'),
        name: txt(el, 'Name'),
        wbs: txt(el, 'WBSObjectId') || txt(el, 'WBSPath'),
        start: schParseDate(txt(el, 'StartDate')), finish: schParseDate(txt(el, 'FinishDate')),
        baselineStart: schParseDate(txt(el, 'BaselineStartDate') || txt(el, 'BLEarlyStartDate')),
        baselineFinish: schParseDate(txt(el, 'BaselineFinishDate') || txt(el, 'BLEarlyFinishDate')),
        actualStart: schParseDate(txt(el, 'ActualStartDate')),
        actualFinish: schParseDate(txt(el, 'ActualFinishDate')),
        pctComplete: pct <= 1 ? pct * 100 : pct,
        duration: durToDays(txt(el, 'PlannedDuration') || txt(el, 'RemainingDuration')),
        float: floatDays,
        critical: txt(el, 'DrivingPath') === 'true' || (floatDays !== null && floatDays <= 0),
        milestone: /milestone/i.test(type),
        predecessors: [], successors: [],
      };
    });
  },

  async parse(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') return this.xlsx(file);
    const text = await file.text();
    if (ext === 'xer') return this.xer(text);
    if (ext === 'xml') return this.xml(text);
    throw new Error('unsupported-format');
  },
};

/* ================= module ================= */
const ModSchedule = {
  laTab: '2',

  /* -------- activity status helpers -------- */
  isComplete(a) { return a.pctComplete >= 100 || !!a.actualFinish; },
  isStarted(a) { return !!a.actualStart || (a.start && a.start <= todayISO()); },
  isDelayed(a) { return !this.isComplete(a) && a.finish && a.finish < todayISO(); },
  delayDays(a) { return this.isDelayed(a) ? schDaysBetween(a.finish, todayISO()) : 0; },
  delayPct(a) {
    if (!a.baselineFinish || !a.finish) return 0;
    const planned = Math.max(1, schDaysBetween(a.baselineStart || a.start, a.baselineFinish));
    return Math.round((this.delayDays(a) / planned) * 100);
  },
  statusKey(a) {
    if (this.isComplete(a)) return 'done';
    if (this.isDelayed(a)) return 'delayed';
    if (this.isStarted(a)) return 'progress';
    return 'notstarted';
  },
  statusLabel(k) {
    return { done: TX('مكتمل', 'Completed'), delayed: TX('متأخر', 'Delayed'),
      progress: TX('قيد التنفيذ', 'In Progress'), notstarted: TX('لم يبدأ', 'Not Started') }[k];
  },
  statusColor(k) {
    return { done: '#34d399', delayed: '#f87171', progress: '#60a5fa', notstarted: '#94a3b8' }[k];
  },
  dueWithin(a, days) {
    if (this.isComplete(a)) return false;
    if (!a.start) return false;
    const d = schDaysBetween(todayISO(), a.start);
    return d >= 0 && d <= days;
  },

  /* ================= page ================= */
  render(container) {
    Engine.modulePage(container, 'schedule', [
      { key: 'dash', icon: '📊', label: TX('اللوحة الرئيسية', 'Dashboard'), render: (b, rr) => this.dashboard(b, rr) },
      { key: 'activities', icon: '📋', label: TX('الأنشطة', 'Activities'), render: (b, rr) => this.activitiesView(b, rr) },
      { key: 'critical', icon: '🔥', label: TX('المسار الحرج', 'Critical Path'), render: (b, rr) => this.criticalView(b, rr) },
      { key: 'lookahead', icon: '👀', label: TX('النظرة المستقبلية', 'Lookahead'), render: (b, rr) => this.lookaheadView(b, rr) },
      { key: 'files', icon: '📁', label: TX('إدارة ملفات الجدول', 'File Management'), render: (b, rr) => this.filesView(b, rr) },
      { key: 'snapshots', icon: '🕓', label: TX('اللقطات الأسبوعية', 'Snapshots'), render: (b, rr) => this.snapshotsView(b, rr) },
    ]);
    Store.ensureWeeklySnapshot();
  },

  /* ================= dashboard ================= */
  dashboard(b, rr) {
    const file = Store.currentScheduleFile();
    const acts = Store.scheduleActivities(file ? file.id : null);
    if (!file || !acts.length) { b.innerHTML = this.noFileState(); this.bindUpload(b, rr); return; }

    const total = acts.length;
    const done = acts.filter(a => this.isComplete(a)).length;
    const progress = acts.filter(a => this.statusKey(a) === 'progress').length;
    const delayed = acts.filter(a => this.isDelayed(a));
    const critical = acts.filter(a => a.critical);
    const milestones = acts.filter(a => a.milestone);
    const due7 = acts.filter(a => this.dueWithin(a, 7)).length;
    const due14 = acts.filter(a => this.dueWithin(a, 14)).length;
    const due30 = acts.filter(a => this.dueWithin(a, 30)).length;
    const overallPct = total ? Math.round(acts.reduce((s, a) => s + (a.pctComplete || 0), 0) / total) : 0;
    const linkedCount = acts.filter(a => (a.linkedConstraints || []).length).length;
    const lastUpdateDays = schDaysBetween(file.uploadedAt.slice(0, 10), todayISO());

    b.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi" style="--kc:var(--accent)"><div class="k-label">${TX('إجمالي الأنشطة', 'Total Activities')}</div>
          <div class="k-value">${total}</div><div class="k-ico">📋</div>
          <div class="k-sub">${TX('نسبة الإنجاز العامة', 'Overall progress')}: ${overallPct}%</div></div>
        <div class="kpi" style="--kc:var(--green)"><div class="k-label">${TX('مكتملة', 'Completed')}</div>
          <div class="k-value">${done}</div><div class="k-ico">✅</div>
          <div class="k-sub">${TX('قيد التنفيذ', 'In progress')}: ${progress}</div></div>
        <div class="kpi" style="--kc:var(--red)"><div class="k-label">${TX('متأخرة', 'Delayed')}</div>
          <div class="k-value">${delayed.length}</div><div class="k-ico">🔴</div>
          <div class="k-sub">${TX('أنشطة حرجة', 'Critical')}: ${critical.length}</div></div>
        <div class="kpi" style="--kc:#f5b942"><div class="k-label">${TX('معالم رئيسية', 'Milestones')}</div>
          <div class="k-value">${milestones.length}</div><div class="k-ico">🏁</div>
          <div class="k-sub">${TX('مرتبطة بمعوقات', 'Linked to issues')}: ${linkedCount}</div></div>
      </div>
      <div class="grid g3" style="margin-bottom:16px">
        <div class="kpi" style="--kc:#60a5fa"><div class="k-label">${TX('مستحقة خلال 7 أيام', 'Due in 7 days')}</div>
          <div class="k-value">${due7}</div><div class="k-ico">📅</div></div>
        <div class="kpi" style="--kc:#60a5fa"><div class="k-label">${TX('مستحقة خلال 14 يوم', 'Due in 14 days')}</div>
          <div class="k-value">${due14}</div><div class="k-ico">📅</div></div>
        <div class="kpi" style="--kc:#60a5fa"><div class="k-label">${TX('مستحقة خلال 30 يوم', 'Due in 30 days')}</div>
          <div class="k-value">${due30}</div><div class="k-ico">📅</div></div>
      </div>
      <div class="panel" style="margin-bottom:16px">
        <div class="panel-h"><span>🗂</span><h3>${TX('آخر تحديث للبرنامج الزمني', 'Schedule Update Status')}</h3></div>
        <div class="grid g4">
          <div><div class="fs11 mut">${TX('آخر تحديث من', 'Last update from')}</div><div class="b">${esc(file.company || '—')}</div></div>
          <div><div class="fs11 mut">${TX('منذ', 'Since')}</div><div class="b">${lastUpdateDays} ${TX('يوم', 'days')}</div></div>
          <div><div class="fs11 mut">${TX('آخر إصدار', 'Last revision')}</div><div class="b">Rev.${file.revision}</div></div>
          <div><div class="fs11 mut">${TX('الحالة', 'Status')}</div><div class="b">${lastUpdateDays > 14
            ? `<span class="chip" style="--cc:#f87171">${TX('يحتاج تحديث', 'Needs update')}</span>`
            : `<span class="chip" style="--cc:#34d399">${TX('محدّث', 'Up to date')}</span>`}</div></div>
        </div>
      </div>
      <div class="grid g3" style="margin-bottom:16px">
        <div class="panel"><div class="panel-h"><span>🍩</span><h3>${TX('حالة الأنشطة', 'Activity Status')}</h3></div>
          <div class="flex" style="justify-content:center">${Charts.donut(['done', 'progress', 'delayed', 'notstarted'].map(k => ({
            label: this.statusLabel(k), value: acts.filter(a => this.statusKey(a) === k).length, color: this.statusColor(k)
          })).filter(x => x.value), { size: 165, centerLabel: total, centerSub: TX('نشاط', 'activities') })}</div></div>
        <div class="panel"><div class="panel-h"><span>⏰</span><h3>${TX('أكثر الأنشطة تأخراً', 'Most Delayed Activities')}</h3></div>
          ${Charts.hbars(delayed.slice().sort((x, y) => this.delayDays(y) - this.delayDays(x)).slice(0, 8).map(a => ({
            label: `${a.activityId} ${a.name}`.slice(0, 30), value: this.delayDays(a)
          })).filter(x => x.value)) || UI.empty('⏰')}</div>
        <div class="panel"><div class="panel-h"><span>🚩</span><h3>${TX('معوقات مؤثرة على الجدول', 'Issues Impacting Schedule')}</h3></div>
          ${this.impactingIssuesList()}</div>
      </div>
      <div class="panel" style="margin-bottom:16px">
        <div class="panel-h"><span>✨</span><h3>${TX('محلل الجدول الزمني الذكي', 'AI Schedule Analyzer')}</h3>
          <button class="btn sm" id="sc-ai-run">${TX('تحليل الآن', 'Analyze Now')}</button></div>
        <div id="sc-ai-out" class="fs13"></div>
      </div>`;
    b.querySelector('#sc-ai-run').onclick = () => this.runAnalyzer(b, file, acts);
  },

  noFileState() {
    return `<div class="panel" style="padding:40px;text-align:center">
      <div style="font-size:48px;margin-bottom:12px">🗓️</div>
      <h3>${TX('لا يوجد برنامج زمني مرفوع لهذا المشروع', 'No schedule file uploaded for this project')}</h3>
      <p class="mut">${TX('ارفع ملف Primavera (XER/XML) أو Excel لبدء التحليل', 'Upload a Primavera (XER/XML) or Excel file to start analysis')}</p>
      <div class="flex" style="justify-content:center;margin-top:14px">
        <label class="btn primary" style="cursor:pointer">${TX('📤 رفع ملف الجدول الزمني', '📤 Upload Schedule File')}
          <input type="file" id="sc-upload-empty" accept=".xer,.xml,.xlsx,.xls" style="display:none"></label>
      </div>
    </div>`;
  },

  impactingIssuesList() {
    const file = Store.currentScheduleFile();
    const acts = (file ? Store.scheduleActivities(file.id) : []).filter(a => (a.linkedConstraints || []).length);
    if (!acts.length) return UI.empty('🚩');
    const rows = [];
    acts.forEach(a => (a.linkedConstraints || []).forEach(cid => {
      const c = Store.get('constraint', cid); if (!c) return;
      rows.push(`<div class="flex" style="justify-content:space-between;border-bottom:1px solid var(--bd);padding:6px 0">
        <div><div class="b fs12">${esc(c.title)}</div><div class="fs11 mut">${esc(a.activityId)} · ${esc(a.name)}</div></div>
        <div class="fs11">${this.isDelayed(a) ? `<span class="chip" style="--cc:#f87171">+${this.delayDays(a)}${TX('ي', 'd')}</span>` : '—'}</div>
      </div>`);
    }));
    return rows.join('');
  },

  runAnalyzer(b, file, acts) {
    const out = b.querySelector('#sc-ai-out');
    const delayed = acts.filter(a => this.isDelayed(a));
    const critical = acts.filter(a => a.critical);
    const linked = acts.filter(a => (a.linkedConstraints || []).length);
    const overallPct = acts.length ? Math.round(acts.reduce((s, a) => s + (a.pctComplete || 0), 0) / acts.length) : 0;
    const lastFinish = acts.reduce((mx, a) => a.finish && a.finish > mx ? a.finish : mx, '');
    // top delay causes by responsible party of linked constraints
    const causeCounts = {};
    linked.forEach(a => (a.linkedConstraints || []).forEach(cid => {
      const c = Store.get('constraint', cid); if (!c) return;
      const k = Store.respPartyLabel(c.responsibleParty) || TX('غير محدد', 'Unspecified');
      causeCounts[k] = (causeCounts[k] || 0) + 1;
    }));
    const topCauses = Object.entries(causeCounts).sort((a, b2) => b2[1] - a[1]).slice(0, 3);
    out.innerHTML = `
      <div class="panel" style="background:var(--bg2);margin-top:8px">
        <p>📌 ${TX(`نسبة الإنجاز العامة للمشروع: <b>${overallPct}%</b>، تاريخ الإنهاء المتوقع حالياً: <b>${UI.fmtDate(lastFinish)}</b>.`,
          `Overall project progress: <b>${overallPct}%</b>. Currently expected finish date: <b>${UI.fmtDate(lastFinish)}</b>.`)}</p>
        <p>🔴 ${TX(`يوجد <b>${delayed.length}</b> نشاط متأخر و<b>${critical.length}</b> نشاط على المسار الحرج.`,
          `There are <b>${delayed.length}</b> delayed activities and <b>${critical.length}</b> on the critical path.`)}</p>
        <p>🚩 ${TX(`<b>${linked.length}</b> نشاط مرتبط بمعوقات مسجلة في النظام.`,
          `<b>${linked.length}</b> activities are linked to registered issues/constraints.`)}</p>
        ${topCauses.length ? `<p>🏗️ ${TX('أكثر الجهات تسبباً في التأخير:', 'Top delay-causing parties:')} ${topCauses.map(([k, v]) => `<b>${esc(k)}</b> (${v})`).join('، ')}</p>` : ''}
        <p>${delayed.length || critical.length
          ? '⚠️ ' + TX('يوصى بمتابعة الأنشطة المتأخرة والحرجة أعلاه ومعالجة المعوقات المرتبطة بها بشكل عاجل.', 'Recommend urgent follow-up on the delayed/critical activities above and resolution of linked issues.')
          : '✅ ' + TX('لا توجد مؤشرات تأخير حرجة حالياً.', 'No critical delay indicators at this time.')}</p>
      </div>`;
  },

  /* ================= activities ================= */
  activitiesView(b, rr) {
    const file = Store.currentScheduleFile();
    if (!file) { b.innerHTML = this.noFileState(); this.bindUpload(b, rr); return; }
    const acts = Store.scheduleActivities(file.id);
    const f = this._actFilter || (this._actFilter = { q: '', status: '', critical: false });
    const filtered = acts.filter(a => {
      if (f.q && !(`${a.activityId} ${a.name}`.toLowerCase().includes(f.q.toLowerCase()))) return false;
      if (f.status && this.statusKey(a) !== f.status) return false;
      if (f.critical && !a.critical) return false;
      return true;
    });
    b.innerHTML = `
      <div class="flex" style="gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <input class="input" id="sc-q" placeholder="${TX('بحث عن نشاط…', 'Search activity…')}" value="${esc(f.q)}" style="max-width:260px">
        <select class="input" id="sc-status" style="max-width:160px"><option value="">${TX('الحالة: الكل', 'Status: All')}</option>
          ${['notstarted', 'progress', 'delayed', 'done'].map(k => `<option value="${k}" ${f.status === k ? 'selected' : ''}>${this.statusLabel(k)}</option>`).join('')}</select>
        <label class="fs12 flex" style="gap:5px"><input type="checkbox" id="sc-crit" ${f.critical ? 'checked' : ''}>${TX('حرجة فقط', 'Critical only')}</label>
        <div class="tb-spacer"></div>
        <span class="fs11 mut">${TX('الإصدار الحالي', 'Current revision')}: Rev.${file.revision} · ${esc(file.name)}</span>
      </div>
      <div class="panel" style="padding:6px 14px;overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>${TX('الكود', 'ID')}</th><th>${TX('النشاط', 'Activity')}</th><th>${TX('البداية', 'Start')}</th><th>${TX('النهاية', 'Finish')}</th>
          <th>${TX('% الإنجاز', '% Done')}</th><th>${t('status')}</th><th>Float</th><th>${TX('المنطقة/الشارع', 'Zone/Street')}</th>
          <th>${TX('معوقات مرتبطة', 'Linked Issues')}</th><th></th>
        </tr></thead><tbody>
        ${filtered.map(a => {
          const sk = this.statusKey(a);
          const zone = Store.getMasterList('zones', { includeArchived: true }).find(z => z.id === a.zone);
          const street = Store.getMasterList('streets', { includeArchived: true }).find(s => s.id === a.street);
          return `<tr data-id="${a.id}">
            <td class="fs12 mut">${esc(a.activityId)}</td>
            <td style="min-width:200px">${a.milestone ? '🏁 ' : ''}${esc(a.name)}</td>
            <td class="fs12">${UI.fmtDate(a.start)}</td>
            <td class="fs12">${UI.fmtDate(a.finish)}${this.isDelayed(a) ? `<br><span class="chip" style="--cc:#f87171">+${this.delayDays(a)}${TX('ي', 'd')} (${this.delayPct(a)}%)</span>` : ''}</td>
            <td class="fs12">${Math.round(a.pctComplete || 0)}%</td>
            <td><span class="chip" style="--cc:${this.statusColor(sk)}">${this.statusLabel(sk)}</span></td>
            <td class="fs12">${a.float != null ? a.float : '—'}${a.critical ? ' 🔥' : ''}</td>
            <td class="fs12">${zone ? esc(zone.name) : '—'}${street ? '<br>' + esc(street.name) : ''}</td>
            <td class="fs12">${(a.linkedConstraints || []).length || '—'}</td>
            <td class="fs12 mut">›</td>
          </tr>`;
        }).join('')}
        </tbody></table>
        ${!filtered.length ? UI.empty('📋') : ''}
      </div>
      <div class="fs11 mut mt8">${filtered.length} / ${acts.length} ${TX('نشاط', 'activities')}</div>`;
    b.querySelector('#sc-q').oninput = e => { f.q = e.target.value; this.activitiesView(b, rr); };
    b.querySelector('#sc-status').onchange = e => { f.status = e.target.value; this.activitiesView(b, rr); };
    b.querySelector('#sc-crit').onchange = e => { f.critical = e.target.checked; this.activitiesView(b, rr); };
    b.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => this.activityDetail(tr.dataset.id, rr));
  },

  activityDetail(id, rr) {
    const a = Store.db.schedule.activities.find(x => x.id === id); if (!a) return;
    const zones = Store.getMasterList('zones', { includeArchived: true });
    const streets = Store.getMasterList('streets', { includeArchived: true }).filter(s => !a.zone || s.zone === a.zone);
    const constraints = Store.list('constraint');
    const sk = this.statusKey(a);
    const m = UI.modal(`
      <div style="padding:22px;max-width:640px">
        <div class="flex" style="justify-content:space-between;align-items:flex-start">
          <div><h2 style="margin:0">${a.milestone ? '🏁 ' : ''}${esc(a.name)}</h2>
            <div class="fs12 mut">${esc(a.activityId)} · <span class="chip" style="--cc:${this.statusColor(sk)}">${this.statusLabel(sk)}</span></div></div>
          <button class="btn sm" data-close>✕</button>
        </div>
        <div class="grid g3" style="margin-top:14px">
          <div><div class="fs11 mut">${TX('البداية', 'Start')}</div><div class="b">${UI.fmtDate(a.start)}</div></div>
          <div><div class="fs11 mut">${TX('النهاية', 'Finish')}</div><div class="b">${UI.fmtDate(a.finish)}</div></div>
          <div><div class="fs11 mut">${TX('المدة', 'Duration')}</div><div class="b">${a.duration} ${TX('يوم', 'd')}</div></div>
          <div><div class="fs11 mut">Baseline Start</div><div class="b">${UI.fmtDate(a.baselineStart)}</div></div>
          <div><div class="fs11 mut">Baseline Finish</div><div class="b">${UI.fmtDate(a.baselineFinish)}</div></div>
          <div><div class="fs11 mut">Float</div><div class="b">${a.float != null ? a.float : '—'} ${a.critical ? '🔥' : ''}</div></div>
        </div>
        ${this.isDelayed(a) ? `<div class="panel" style="background:var(--bg2);margin-top:12px">
          🔴 ${TX(`نشاط متأخر بمقدار <b>${this.delayDays(a)}</b> يوم (<b>${this.delayPct(a)}%</b> من المدة المخططة).`,
          `Delayed by <b>${this.delayDays(a)}</b> days (<b>${this.delayPct(a)}%</b> of planned duration).`)}</div>` : ''}
        <div class="grid g2" style="margin-top:14px;gap:10px">
          <div><label class="fl">${TX('المنطقة', 'Zone')}</label>
            <select class="input" id="ad-zone"><option value="">${TX('— بدون —', '— None —')}</option>
              ${zones.map(z => `<option value="${z.id}" ${a.zone === z.id ? 'selected' : ''}>${esc(z.name)}</option>`).join('')}</select></div>
          <div><label class="fl">${TX('الشارع', 'Street')}</label>
            <select class="input" id="ad-street"><option value="">${TX('— بدون —', '— None —')}</option>
              ${streets.map(s => `<option value="${s.id}" ${a.street === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
        </div>
        <div style="margin-top:14px">
          <label class="fl">${TX('ربط بمعوقات/قيود', 'Linked Issues / Constraints')}</label>
          <select class="input" id="ad-constraints" multiple style="height:100px">
            ${constraints.map(c => `<option value="${c.id}" ${(a.linkedConstraints || []).includes(c.id) ? 'selected' : ''}>${esc(c.ref)} — ${esc(c.title)}</option>`).join('')}
          </select>
          <div class="fs11 mut mt8">${TX('استخدم Ctrl/Cmd للاختيار المتعدد', 'Use Ctrl/Cmd to multi-select')}</div>
        </div>
        <div class="flex" style="justify-content:flex-end;margin-top:16px;gap:8px">
          <button class="btn" data-close>${t('cancel')}</button>
          <button class="btn primary" id="ad-save">${t('save')}</button>
        </div>
      </div>`, { wide: true });
    m.el.querySelector('#ad-zone').onchange = () => {
      a.zone = m.el.querySelector('#ad-zone').value || '';
      a.street = '';
      Store.save();
      this.activityDetail(id, rr);
    };
    m.el.querySelector('#ad-save').onclick = () => {
      a.zone = m.el.querySelector('#ad-zone').value || '';
      a.street = m.el.querySelector('#ad-street').value || '';
      a.linkedConstraints = Array.from(m.el.querySelector('#ad-constraints').selectedOptions).map(o => o.value);
      Store.save(); m.close(); UI.toast(t('saved')); rr();
    };
  },

  /* ================= critical path ================= */
  criticalView(b, rr) {
    const file = Store.currentScheduleFile();
    if (!file) { b.innerHTML = this.noFileState(); this.bindUpload(b, rr); return; }
    const acts = Store.scheduleActivities(file.id).filter(a => a.critical);
    b.innerHTML = `
      <div class="panel" style="padding:6px 14px;overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>${TX('الكود', 'ID')}</th><th>${TX('النشاط', 'Activity')}</th><th>${TX('البداية', 'Start')}</th><th>${TX('النهاية', 'Finish')}</th>
          <th>${TX('% الإنجاز', '% Done')}</th><th>Float</th><th>${TX('التأخير', 'Delay')}</th><th>${TX('أثر المشروع', 'Project Impact')}</th>
        </tr></thead><tbody>
        ${acts.map(a => `<tr>
          <td class="fs12 mut">${esc(a.activityId)}</td>
          <td>${esc(a.name)}</td>
          <td class="fs12">${UI.fmtDate(a.start)}</td>
          <td class="fs12">${UI.fmtDate(a.finish)}</td>
          <td class="fs12">${Math.round(a.pctComplete || 0)}%</td>
          <td class="fs12">${a.float != null ? a.float : 0}</td>
          <td class="fs12">${this.isDelayed(a) ? `<span class="chip" style="--cc:#f87171">+${this.delayDays(a)}${TX('ي', 'd')}</span>` : '—'}</td>
          <td class="fs12">${this.isDelayed(a) ? TX('قد يؤخر تاريخ التسليم النهائي', 'May push the overall finish date') : TX('—', '—')}</td>
        </tr>`).join('')}
        </tbody></table>
        ${!acts.length ? UI.empty('🔥') : ''}
      </div>
      <div class="fs11 mut mt8">${acts.length} ${TX('نشاط على المسار الحرج', 'critical-path activities')}</div>`;
  },

  /* ================= lookahead ================= */
  lookaheadView(b, rr) {
    const file = Store.currentScheduleFile();
    if (!file) { b.innerHTML = this.noFileState(); this.bindUpload(b, rr); return; }
    const acts = Store.scheduleActivities(file.id);
    const days = parseInt(this.laTab) * 7;
    const upcoming = acts.filter(a => this.dueWithin(a, days)).sort((x, y) => (x.start || '').localeCompare(y.start || ''));
    b.innerHTML = `
      <div class="flex" style="gap:8px;margin-bottom:10px">
        ${['2', '4', '8'].map(w => `<button class="btn sm ${this.laTab === w ? 'primary' : ''}" data-w="${w}">${w} ${TX('أسابيع', 'Weeks')}</button>`).join('')}
      </div>
      <div class="panel" style="padding:6px 14px;overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>${TX('الكود', 'ID')}</th><th>${TX('النشاط', 'Activity')}</th><th>${TX('البداية المخططة', 'Planned Start')}</th>
          <th>${TX('% الإنجاز', '% Done')}</th><th>${TX('يحتاج اعتماد', 'Needs Approval')}</th>
          <th>${TX('يحتاج إتاحة موقع', 'Needs Access')}</th><th>${TX('يحتاج مواد', 'Needs Materials')}</th>
        </tr></thead><tbody>
        ${upcoming.map(a => `<tr>
          <td class="fs12 mut">${esc(a.activityId)}</td>
          <td>${esc(a.name)}</td>
          <td class="fs12">${UI.fmtDate(a.start)}</td>
          <td class="fs12">${Math.round(a.pctComplete || 0)}%</td>
          <td class="fs12">${(a.linkedConstraints || []).length ? '⚠️' : '—'}</td>
          <td class="fs12">${a.zone || a.street ? '🛣️' : '—'}</td>
          <td class="fs12">—</td>
        </tr>`).join('')}
        </tbody></table>
        ${!upcoming.length ? UI.empty('👀') : ''}
      </div>
      <div class="fs11 mut mt8">${upcoming.length} ${TX('نشاط ضمن النافذة المختارة', 'activities in selected window')}</div>`;
    b.querySelectorAll('[data-w]').forEach(btn => btn.onclick = () => { this.laTab = btn.dataset.w; this.lookaheadView(b, rr); });
  },

  /* ================= files / version control ================= */
  filesView(b, rr) {
    const files = Store.scheduleFiles().sort((a, b2) => b2.revision - a.revision);
    const audit = Store.scheduleAuditLog();
    b.innerHTML = `
      <div class="panel" style="margin-bottom:14px">
        <div class="panel-h"><span>📤</span><h3>${TX('رفع ملف برنامج زمني جديد', 'Upload New Schedule File')}</h3></div>
        <div class="grid g2" style="gap:10px">
          <div><label class="fl">${TX('الملف (XER / XML / Excel)', 'File (XER / XML / Excel)')}</label>
            <input type="file" class="input" id="sc-file" accept=".xer,.xml,.xlsx,.xls"></div>
          <div><label class="fl">${TX('الجهة المرسلة', 'Sending Company')}</label>
            <input class="input" id="sc-company" placeholder="${TX('مثال: شركة الأومير', 'e.g. Al-Omair Co.')}"></div>
          <div><label class="fl">${TX('اسم الرافع', 'Uploader Name')}</label>
            <input class="input" id="sc-uploader" value="${esc(Store.userName(Store.db.currentUserId))}"></div>
          <div><label class="fl">${TX('البريد الإلكتروني', 'Email')}</label>
            <input class="input" id="sc-email" type="email"></div>
          <div><label class="fl">${TX('المنصب', 'Position')}</label>
            <input class="input" id="sc-position"></div>
          <div><label class="fl">${TX('ملاحظات', 'Notes')}</label>
            <input class="input" id="sc-notes"></div>
        </div>
        <div class="flex" style="justify-content:flex-end;margin-top:10px">
          <button class="btn primary" id="sc-do-upload">${TX('رفع وتحليل', 'Upload & Parse')}</button>
        </div>
      </div>
      <div class="panel" style="padding:6px 14px;overflow-x:auto;margin-bottom:14px">
        <div class="panel-h"><span>📁</span><h3>${TX('سجل الإصدارات', 'Revision Log')}</h3></div>
        <table class="tbl"><thead><tr>
          <th>${TX('الإصدار', 'Rev.')}</th><th>${TX('الملف', 'File')}</th><th>${TX('الجهة', 'Company')}</th>
          <th>${TX('الرافع', 'Uploader')}</th><th>${TX('التاريخ', 'Date')}</th><th>${TX('الأنشطة', 'Activities')}</th>
          <th>${t('status')}</th><th></th>
        </tr></thead><tbody>
        ${files.map(f => `<tr data-fid="${f.id}">
          <td class="b fs12">Rev.${f.revision}</td>
          <td class="fs12">${esc(f.name)}<div class="fs11 mut">${esc((f.type || '').toUpperCase())}</div></td>
          <td class="fs12">${esc(f.company || '—')}</td>
          <td class="fs12">${esc(f.uploaderName || Store.userName(f.uploadedBy))}</td>
          <td class="fs11 mut">${esc((f.uploadedAt || '').slice(0, 16).replace('T', ' '))}</td>
          <td class="fs12">${Store.db.schedule.activities.filter(a => a.fileId === f.id).length}</td>
          <td><span class="chip" style="--cc:${f.status === 'active' ? '#34d399' : f.status === 'archived' ? '#f87171' : '#94a3b8'}">${
            f.status === 'active' ? TX('الحالي', 'Current') : f.status === 'archived' ? TX('مؤرشف', 'Archived') : TX('سابق', 'Superseded')}</span></td>
          <td class="fs12">
            ${f.status !== 'active' ? `<button class="btn sm" data-act="setcurrent">↩️ ${TX('اعتماد', 'Set Current')}</button>` : ''}
            ${f.status === 'archived' ? `<button class="btn sm" data-act="restore">♻️</button>` : `<button class="btn sm" data-act="archive">🗄</button>`}
            ${f.status === 'archived' && Store.isAdmin() ? `<button class="btn sm danger" data-act="delete">🗑</button>` : ''}
            ${files.length > 1 ? `<button class="btn sm" data-act="compare">⇄ ${TX('مقارنة', 'Compare')}</button>` : ''}
          </td>
        </tr>`).join('')}
        </tbody></table>
        ${!files.length ? UI.empty('📁') : ''}
      </div>
      <div class="panel" style="padding:6px 14px;overflow-x:auto">
        <div class="panel-h"><span>🧾</span><h3>${TX('سجل التدقيق', 'Audit Trail')}</h3></div>
        <table class="tbl"><thead><tr>
          <th>${TX('الإجراء', 'Action')}</th><th>${TX('بواسطة', 'By')}</th><th>${TX('التاريخ', 'Date')}</th><th>${TX('ملاحظات', 'Notes')}</th>
        </tr></thead><tbody>
        ${audit.slice(0, 30).map(e => `<tr>
          <td class="fs12">${this.auditLabel(e.action)}</td>
          <td class="fs12">${esc(Store.userName(e.by))}</td>
          <td class="fs11 mut">${esc((e.at || '').slice(0, 16).replace('T', ' '))}</td>
          <td class="fs12">${esc(e.notes || '')}</td>
        </tr>`).join('')}
        </tbody></table>
        ${!audit.length ? UI.empty('🧾') : ''}
      </div>`;
    this.bindUpload(b, rr, { company: '#sc-company', uploader: '#sc-uploader', email: '#sc-email', position: '#sc-position', notes: '#sc-notes', fileInput: '#sc-file', btn: '#sc-do-upload' });
    b.querySelectorAll('tr[data-fid]').forEach(tr => {
      const fid = tr.dataset.fid;
      tr.querySelectorAll('[data-act]').forEach(btn => btn.onclick = (e) => {
        e.stopPropagation();
        const act = btn.dataset.act;
        if (act === 'setcurrent') { Store.setCurrentScheduleFile(fid); UI.toast(t('saved')); rr(); }
        else if (act === 'archive') { Store.archiveScheduleFile(fid); rr(); }
        else if (act === 'restore') { Store.restoreScheduleFile(fid); rr(); }
        else if (act === 'delete') UI.confirm(TX('سيتم حذف الملف وأنشطته نهائياً. متابعة؟', 'This will permanently delete the file and its activities. Continue?'), () => { Store.deleteScheduleFile(fid); rr(); });
        else if (act === 'compare') this.compareModal(fid);
      });
    });
  },

  auditLabel(action) {
    const map = { uploaded: TX('رفع ملف', 'File uploaded'), archived: TX('أرشفة', 'Archived'), restored: TX('استعادة/اعتماد', 'Restored/Set current'), deleted: TX('حذف نهائي', 'Permanently deleted') };
    return map[action] || action;
  },

  bindUpload(b, rr, sel) {
    const fileInput = b.querySelector(sel ? sel.fileInput : '#sc-upload-empty');
    if (!fileInput) return;
    const go = async () => {
      const file = fileInput.files[0];
      if (!file) return UI.toast(TX('اختر ملفاً أولاً', 'Select a file first'), 'err');
      try {
        const acts = await SchParse.parse(file);
        if (!acts.length) throw new Error('empty');
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const meta = {
          name: file.name, type: ext, size: file.size,
          company: sel ? b.querySelector(sel.company).value.trim() : '',
          uploaderName: sel ? b.querySelector(sel.uploader).value.trim() : Store.userName(Store.db.currentUserId),
          email: sel ? b.querySelector(sel.email).value.trim() : '',
          position: sel ? b.querySelector(sel.position).value.trim() : '',
          notes: sel ? b.querySelector(sel.notes).value.trim() : '',
        };
        Store.addScheduleFile(meta, acts);
        UI.toast(TX(`تم تحليل ${acts.length} نشاط بنجاح`, `Successfully parsed ${acts.length} activities`));
        rr();
      } catch (err) {
        UI.toast(TX('تعذر تحليل الملف. تأكد من الصيغة والأعمدة المطلوبة.', 'Could not parse the file. Check the format and required columns.'), 'err');
      }
    };
    if (sel && sel.btn) b.querySelector(sel.btn).onclick = go;
    else fileInput.onchange = go;
  },

  compareModal(otherFileId) {
    const cur = Store.currentScheduleFile();
    const other = Store.db.schedule.files.find(f => f.id === otherFileId);
    if (!cur || !other || cur.id === other.id) return UI.toast(TX('اختر إصداراً مختلفاً للمقارنة', 'Select a different version to compare'), 'err');
    const a1 = Store.scheduleActivities(other.id), a2 = Store.scheduleActivities(cur.id);
    const map1 = new Map(a1.map(a => [a.activityId, a])), map2 = new Map(a2.map(a => [a.activityId, a]));
    const added = [...map2.keys()].filter(k => !map1.has(k)).length;
    const removed = [...map1.keys()].filter(k => !map2.has(k)).length;
    let newDelayed = 0, newCritical = 0, finishDiffs = [];
    map2.forEach((a, k) => {
      const b = map1.get(k); if (!b) return;
      if (this.isDelayed(a) && !this.isDelayed(b)) newDelayed++;
      if (a.critical && !b.critical) newCritical++;
      if (a.finish !== b.finish) finishDiffs.push(schDaysBetween(b.finish, a.finish));
    });
    const avgFinishDiff = finishDiffs.length ? Math.round(finishDiffs.reduce((s, x) => s + x, 0) / finishDiffs.length) : 0;
    UI.modal(`
      <div style="padding:22px;max-width:520px">
        <h2 style="margin:0">${TX('مقارنة الإصدارات', 'Version Comparison')}</h2>
        <div class="fs12 mut">Rev.${other.revision} ⇄ Rev.${cur.revision}</div>
        <div class="grid g2" style="margin-top:14px;gap:10px">
          <div class="kpi"><div class="k-label">${TX('أنشطة مضافة', 'Activities Added')}</div><div class="k-value">${added}</div></div>
          <div class="kpi"><div class="k-label">${TX('أنشطة محذوفة', 'Activities Removed')}</div><div class="k-value">${removed}</div></div>
          <div class="kpi"><div class="k-label">${TX('أنشطة أصبحت متأخرة', 'Newly Delayed')}</div><div class="k-value">${newDelayed}</div></div>
          <div class="kpi"><div class="k-label">${TX('أنشطة أصبحت حرجة', 'Newly Critical')}</div><div class="k-value">${newCritical}</div></div>
        </div>
        <div class="fs12 mt8">${TX('متوسط فرق تاريخ الانتهاء', 'Avg. finish-date shift')}: <b>${avgFinishDiff}</b> ${TX('يوم', 'days')}</div>
        <div class="flex" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-close>${t('close')}</button></div>
      </div>`);
  },

  /* ================= snapshots ================= */
  snapshotsView(b, rr) {
    const snaps = Store.scheduleSnapshots();
    b.innerHTML = `
      <div class="flex" style="justify-content:flex-end;margin-bottom:10px">
        <button class="btn" id="sc-snap-now">📸 ${TX('إنشاء لقطة الآن', 'Create Snapshot Now')}</button>
      </div>
      <div class="panel" style="padding:6px 14px;overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>${TX('اللقطة', 'Snapshot')}</th><th>${TX('التاريخ', 'Date')}</th><th>${TX('عدد الأنشطة', 'Activities')}</th>
          <th>${TX('متأخرة وقتها', 'Delayed Then')}</th><th>${TX('حرجة وقتها', 'Critical Then')}</th><th></th>
        </tr></thead><tbody>
        ${snaps.map(s => `<tr data-sid="${s.id}">
          <td class="b fs12">${esc(s.label)}</td>
          <td class="fs11 mut">${esc((s.at || '').slice(0, 16).replace('T', ' '))}</td>
          <td class="fs12">${s.data.length}</td>
          <td class="fs12">${s.data.filter(a => !( a.pctComplete >= 100) && a.finish && a.finish < s.at.slice(0, 10)).length}</td>
          <td class="fs12">${s.data.filter(a => a.critical).length}</td>
          <td class="fs12 mut">›</td>
        </tr>`).join('')}
        </tbody></table>
        ${!snaps.length ? UI.empty('🕓') : ''}
      </div>
      <div class="fs11 mut mt8">${TX('تُحفظ لقطة تلقائياً مرة كل أسبوع لعرض تطور المشروع عبر الزمن.', 'A snapshot is automatically saved once per week to show project evolution over time.')}</div>`;
    b.querySelector('#sc-snap-now').onclick = () => { Store.scheduleSnapshot(`${TX('يدوية', 'Manual')} ${todayISO()}`); UI.toast(t('saved')); rr(); };
    b.querySelectorAll('tr[data-sid]').forEach(tr => tr.onclick = () => this.snapshotDetail(tr.dataset.sid));
  },

  snapshotDetail(sid) {
    const s = Store.db.schedule.snapshots.find(x => x.id === sid); if (!s) return;
    UI.modal(`
      <div style="padding:22px;max-width:600px">
        <h2 style="margin:0">${esc(s.label)}</h2>
        <div class="fs12 mut">${esc((s.at || '').slice(0, 16).replace('T', ' '))}</div>
        <div class="panel" style="padding:6px 14px;overflow:auto;max-height:340px;margin-top:12px">
          <table class="tbl"><thead><tr>
            <th>${TX('الكود', 'ID')}</th><th>${TX('النشاط', 'Activity')}</th><th>${TX('% الإنجاز', '% Done')}</th><th>${TX('النهاية', 'Finish')}</th><th>Float</th>
          </tr></thead><tbody>
          ${s.data.map(a => `<tr>
            <td class="fs12 mut">${esc(a.activityId)}</td><td class="fs12">${esc(a.name)}</td>
            <td class="fs12">${Math.round(a.pctComplete || 0)}%</td><td class="fs12">${UI.fmtDate(a.finish)}</td>
            <td class="fs12">${a.float != null ? a.float : '—'}${a.critical ? ' 🔥' : ''}</td>
          </tr>`).join('')}
          </tbody></table>
        </div>
        <div class="flex" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-close>${t('close')}</button></div>
      </div>`, { wide: true });
  },
};
