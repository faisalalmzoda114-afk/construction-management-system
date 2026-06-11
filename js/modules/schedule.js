/* ============================================================
   Schedule & Planning Control Center — Project Controls
   مركز إدارة الجدول الزمني — تحكم كامل بالمشروع
   Hierarchy explorer · Gantt · Delay analysis · Critical path
   Lookahead · Milestones · Timeline · Contractor/Zone boards
   Map · Versions & diff · Field-level audit · Smart analyzer
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

  // split a full .xer into its named tables → { TABLE: [rows…] }
  xerTables(text) {
    const tables = {}; let cur = null, fields = [];
    text.split(/\r?\n/).forEach(line => {
      const cells = line.split('\t');
      if (cells[0] === '%T') { cur = cells[1]; fields = []; tables[cur] = []; }
      else if (cells[0] === '%F') { fields = cells.slice(1); }
      else if (cells[0] === '%R' && cur) {
        const vals = cells.slice(1), row = {};
        fields.forEach((f, i) => row[f] = vals[i]);
        tables[cur].push(row);
      }
    });
    return tables;
  },

  xer(text) {
    const T = this.xerTables(text);
    const hrToDay = h => (h === undefined || h === '' || h === null) ? 0 : Math.round((parseFloat(h) / 8) * 10) / 10;
    const wbs = (T.PROJWBS || []).map(w => ({ xid: w.wbs_id, parentId: w.parent_wbs_id || '', name: w.wbs_name || '', code: w.wbs_short_name || '' }));
    const wbsName = {}; wbs.forEach(w => wbsName[w.xid] = w.name);
    const calendars = (T.CALENDAR || []).map(c => ({ xid: c.clndr_id, name: c.clndr_name || '' }));
    const resources = (T.RSRC || []).map(r => ({ xid: r.rsrc_id, name: r.rsrc_name || '', code: r.rsrc_short_name || '' }));
    const tasks = T.TASK || [];
    const idToCode = {}; tasks.forEach(t => idToCode[t.task_id] = t.task_code);
    let hasBaseline = false;
    const acts = tasks.map(row => {
      const float = (row.total_float_hr_cnt !== undefined && row.total_float_hr_cnt !== '') ? hrToDay(row.total_float_hr_cnt) : null;
      const bls = schParseDate(row.target_start_date), blf = schParseDate(row.target_end_date);
      if (bls || blf) hasBaseline = true;
      return {
        xid: row.task_id,
        activityId: row.task_code || '',
        name: row.task_name || '',
        wbs: wbsName[row.wbs_id] || row.wbs_id || '',
        wbsId: row.wbs_id || '',
        start: schParseDate(row.act_start_date || row.early_start_date || row.target_start_date),
        finish: schParseDate(row.act_end_date || row.early_end_date || row.target_end_date),
        baselineStart: bls, baselineFinish: blf,
        actualStart: schParseDate(row.act_start_date),
        actualFinish: schParseDate(row.act_end_date),
        pctComplete: row.phys_complete_pct ? parseFloat(row.phys_complete_pct) : (row.status_code === 'TK_Complete' ? 100 : 0),
        duration: hrToDay(row.target_drtn_hr_cnt),
        remainingDuration: hrToDay(row.remain_drtn_hr_cnt),
        float,
        critical: float !== null && float <= 0,
        milestone: (row.task_type || '').includes('Mile'),
        calendarId: row.clndr_id || '',
        predecessors: [], successors: [],
      };
    });
    const typeMap = { PR_FS: 'FS', PR_SS: 'SS', PR_FF: 'FF', PR_SF: 'SF' };
    const relationships = (T.TASKPRED || []).map(r => ({
      pred: idToCode[r.pred_task_id] || r.pred_task_id,
      succ: idToCode[r.task_id] || r.task_id,
      type: typeMap[r.pred_type] || 'FS',
      lag: hrToDay(r.lag_hr_cnt),
    })).filter(r => r.pred && r.succ);
    return { activities: acts, relationships, wbs, calendars, resources, hasBaseline };
  },

  xml(text) {
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    const local = (el, name) => Array.from(el.children).filter(c => c.localName === name);
    const txt = (el, name) => { const c = local(el, name)[0]; return c ? c.textContent.trim() : ''; };
    const durToDays = pt => {
      if (!pt) return 0;
      const m = String(pt).match(/PT(?:(\d+)H)?/); return m && m[1] ? Math.round((parseFloat(m[1]) / 8) * 10) / 10 : 0;
    };
    const byTag = name => Array.from(doc.getElementsByTagName('*')).filter(el => el.localName === name);
    const wbs = byTag('WBS').map(el => ({ xid: txt(el, 'ObjectId'), parentId: txt(el, 'ParentObjectId'), name: txt(el, 'Name'), code: txt(el, 'Code') }));
    const wbsName = {}; wbs.forEach(w => wbsName[w.xid] = w.name);
    const calendars = byTag('Calendar').map(el => ({ xid: txt(el, 'ObjectId'), name: txt(el, 'Name') }));
    const resources = byTag('Resource').map(el => ({ xid: txt(el, 'ObjectId'), name: txt(el, 'Name'), code: txt(el, 'Id') }));
    const actEls = byTag('Activity');
    const idToCode = {}; actEls.forEach(el => idToCode[txt(el, 'ObjectId')] = txt(el, 'Id'));
    let hasBaseline = false;
    const acts = actEls.map(el => {
      const pct = parseFloat(txt(el, 'PercentComplete')) || 0;
      const flt = txt(el, 'TotalFloat');
      const floatDays = flt ? durToDays(flt) : null;
      const type = txt(el, 'Type');
      const bls = schParseDate(txt(el, 'BaselineStartDate') || txt(el, 'BLEarlyStartDate'));
      const blf = schParseDate(txt(el, 'BaselineFinishDate') || txt(el, 'BLEarlyFinishDate'));
      if (bls || blf) hasBaseline = true;
      return {
        xid: txt(el, 'ObjectId'),
        activityId: txt(el, 'Id'),
        name: txt(el, 'Name'),
        wbs: wbsName[txt(el, 'WBSObjectId')] || txt(el, 'WBSObjectId') || txt(el, 'WBSPath'),
        wbsId: txt(el, 'WBSObjectId'),
        start: schParseDate(txt(el, 'StartDate')), finish: schParseDate(txt(el, 'FinishDate')),
        baselineStart: bls, baselineFinish: blf,
        actualStart: schParseDate(txt(el, 'ActualStartDate')),
        actualFinish: schParseDate(txt(el, 'ActualFinishDate')),
        pctComplete: pct <= 1 ? pct * 100 : pct,
        duration: durToDays(txt(el, 'PlannedDuration')),
        remainingDuration: durToDays(txt(el, 'RemainingDuration')),
        float: floatDays,
        critical: txt(el, 'DrivingPath') === 'true' || (floatDays !== null && floatDays <= 0),
        milestone: /milestone/i.test(type),
        calendarId: txt(el, 'CalendarObjectId'),
        predecessors: [], successors: [],
      };
    });
    const typeMap = { 'Finish to Start': 'FS', 'Start to Start': 'SS', 'Finish to Finish': 'FF', 'Start to Finish': 'SF', PR_FS: 'FS', PR_SS: 'SS', PR_FF: 'FF', PR_SF: 'SF' };
    const relationships = byTag('Relationship').map(el => {
      const rt = txt(el, 'Type');
      return {
        pred: idToCode[txt(el, 'PredecessorActivityObjectId')] || txt(el, 'PredecessorActivityObjectId'),
        succ: idToCode[txt(el, 'SuccessorActivityObjectId')] || txt(el, 'SuccessorActivityObjectId'),
        type: typeMap[rt] || (rt || 'FS').replace(/[^A-Z]/g, '').slice(0, 2) || 'FS',
        lag: durToDays(txt(el, 'Lag')),
      };
    }).filter(r => r.pred && r.succ);
    return { activities: acts, relationships, wbs, calendars, resources, hasBaseline };
  },

  async parse(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      const activities = await this.xlsx(file);
      return { activities, relationships: [], wbs: [], calendars: [], resources: [], hasBaseline: activities.some(a => a.baselineStart || a.baselineFinish) };
    }
    const text = await file.text();
    if (ext === 'xer') return this.xer(text);
    if (ext === 'xml') return this.xml(text);
    throw new Error('unsupported-format');
  },
};

/* ================= module ================= */
const ModSchedule = {
  laTab: '2',
  ganttZoom: 'month',

  SYSTEMS: [
    { key: 'roads', icon: '🛣️', label: () => TX('الطرق', 'Roads'), kw: ['road', 'asphalt', 'pav', 'kerb', 'curb', 'طريق', 'أسفلت', 'رصف', 'بردورة'] },
    { key: 'storm', icon: '🌧️', label: () => TX('تصريف الأمطار', 'Storm'), kw: ['storm', 'drainage', 'أمطار', 'تصريف'] },
    { key: 'sewer', icon: '🕳️', label: () => TX('الصرف الصحي', 'Sewer'), kw: ['sewer', 'sewage', 'صرف صحي', 'صرف', 'مجاري'] },
    { key: 'water', icon: '💧', label: () => TX('المياه', 'Water'), kw: ['water', 'مياه'] },
    { key: 'telecom', icon: '📡', label: () => TX('الاتصالات', 'Telecom'), kw: ['telecom', 'communication', 'fiber', 'اتصالات', 'ألياف'] },
    { key: 'electrical', icon: '⚡', label: () => TX('الكهرباء', 'Electrical'), kw: ['elect', 'power', 'lighting', 'كهرب', 'إنارة'] },
    { key: 'other', icon: '🧱', label: () => TX('أعمال أخرى', 'Other'), kw: [] },
  ],
  systemOf(a) { return this.SYSTEMS.find(s => s.key === (a.system || 'other')) || this.SYSTEMS[this.SYSTEMS.length - 1]; },
  detectSystem(a) {
    const hay = `${a.name} ${a.wbs}`.toLowerCase();
    const hit = this.SYSTEMS.find(s => s.kw.some(k => hay.includes(k)));
    return hit ? hit.key : 'other';
  },

  LINK_TYPES: [
    { type: 'correspondence', icon: '✉️', label: () => TX('المراسلات', 'Correspondence') },
    { type: 'meeting', icon: '🗓️', label: () => TX('الاجتماعات', 'Meetings') },
    { type: 'observation', icon: '📸', label: () => TX('الملاحظات الميدانية', 'Observations') },
    { type: 'document', icon: '📐', label: () => TX('الوثائق / RFI / Shop Drawings', 'Documents / RFI / Shop Drawings') },
    { type: 'action', icon: '⚡', label: () => TX('الإجراءات / الاعتمادات', 'Actions / Approvals') },
  ],

  /* -------- status helpers -------- */
  isComplete(a) { return a.pctComplete >= 100 || !!a.actualFinish; },
  isStarted(a) { return !!a.actualStart || (a.start && a.start <= todayISO()); },
  isDelayed(a) { return !this.isComplete(a) && a.finish && a.finish < todayISO(); },
  delayDays(a) {
    if (this.isDelayed(a)) return schDaysBetween(a.finish, todayISO());
    if (a.baselineFinish && a.finish && a.finish > a.baselineFinish) return schDaysBetween(a.baselineFinish, a.finish);
    return 0;
  },
  delayPct(a) {
    if (!this.delayDays(a)) return 0;
    const planned = Math.max(1, a.duration || schDaysBetween(a.baselineStart || a.start, a.baselineFinish || a.finish));
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
    return { done: '#34d399', delayed: '#f87171', progress: '#f5b942', notstarted: '#94a3b8' }[k];
  },
  dueWithin(a, days) {
    if (this.isComplete(a)) return false;
    const ref = a.start || a.finish; if (!ref) return false;
    const d = schDaysBetween(todayISO(), ref);
    return d >= 0 && d <= days;
  },
  zoneName(id) { const z = Store.getMasterList('zones', { includeArchived: true }).find(z => z.id === id); return z ? z.name : ''; },
  streetName(id) { const s = Store.getMasterList('streets', { includeArchived: true }).find(s => s.id === id); return s ? s.name : ''; },
  orgName(id) { const o = (Store.db.masterData.organizations || []).find(o => o.id === id); return o ? (LANG === 'ar' ? o.name : (o.nameEn || o.name)) : ''; },

  // earned-value style indicators (duration-weighted; no cost data → CPI is duration-based proxy)
  evm(acts) {
    const today = todayISO();
    let pv = 0, ev = 0, ac = 0, wTot = 0;
    acts.forEach(a => {
      const w = a.duration || 1; wTot += w;
      ev += w * (a.pctComplete || 0) / 100;
      const bs = a.baselineStart || a.start, bf = a.baselineFinish || a.finish;
      if (bs && bf) {
        const tot = Math.max(1, schDaysBetween(bs, bf));
        const el = Math.min(Math.max(schDaysBetween(bs, today), 0), tot);
        pv += w * el / tot;
      }
      const as = a.actualStart || (this.isStarted(a) ? a.start : '');
      if (as) {
        const end = a.actualFinish || (today < (a.finish || today) ? today : a.finish);
        ac += w * Math.max(0, Math.min(schDaysBetween(as, end), (a.duration || schDaysBetween(as, end)))) / Math.max(1, a.duration || 1);
      }
    });
    return {
      pct: wTot ? Math.round(ev / wTot * 100) : 0,
      plannedPct: wTot ? Math.round(pv / wTot * 100) : 0,
      spi: pv ? Math.round(ev / pv * 100) / 100 : null,
      cpi: ac ? Math.round(ev / ac * 100) / 100 : null,
    };
  },

  ensureDefaults(acts) {
    let dirty = false;
    acts.forEach(a => {
      if (a.system === undefined) { a.system = this.detectSystem(a); dirty = true; }
      [['attachments', []], ['linkedRecords', []], ['linkedConstraints', []], ['photos', []],
       ['predecessors', []], ['successors', []], ['remainingDuration', a.duration || 0], ['notes', ''], ['wbsId', ''], ['calendarId', ''],
       ['forecastStart', ''], ['forecastFinish', ''], ['delayCause', ''], ['delayResponsible', ''], ['delayAction', ''],
       ['contractor', ''], ['consultant', ''], ['gps', ''], ['needsApproval', false], ['needsMaterials', false], ['needsAccess', false]]
        .forEach(([k, d]) => { if (a[k] === undefined) { a[k] = d; dirty = true; } });
    });
    if (dirty) Store.save();
  },

  // accepts a parsed payload { activities, relationships, … } and denormalises links
  enrichOnUpload(parsed) {
    const acts = Array.isArray(parsed) ? parsed : parsed.activities;
    const rels = (Array.isArray(parsed) ? [] : parsed.relationships) || [];
    const zones = Store.getMasterList('zones', { includeArchived: true });
    const streets = Store.getMasterList('streets', { includeArchived: true });
    acts.forEach(a => {
      a.system = this.detectSystem(a);
      a.predecessors = []; a.successors = [];
      const hay = `${a.name} ${a.wbs}`;
      const z = zones.find(z => z.name && hay.includes(z.name)); if (z) a.zone = z.id;
      const s = streets.find(s => s.name && hay.includes(s.name)); if (s) a.street = s.id;
    });
    const byCode = {}; acts.forEach(a => byCode[a.activityId] = a);
    rels.forEach(r => {
      const p = byCode[r.pred], s = byCode[r.succ];
      if (!p || !s) return;
      s.predecessors.push({ code: p.activityId, type: r.type, lag: r.lag || 0 });
      p.successors.push({ code: s.activityId, type: r.type, lag: r.lag || 0 });
    });
    this.ensureDefaults(acts);
    return acts;
  },

  injectCSS() {
    if (document.getElementById('sch-css')) return;
    const st = document.createElement('style'); st.id = 'sch-css';
    st.textContent = `
      .sch-tree details{border:1px solid var(--bd);border-radius:8px;margin-bottom:6px;background:var(--bg2)}
      .sch-tree details details{margin:6px 8px}
      .sch-tree summary{cursor:pointer;padding:8px 12px;display:flex;gap:10px;align-items:center;list-style:none;flex-wrap:wrap}
      .sch-tree summary::-webkit-details-marker{display:none}
      .sch-tree summary .tw{transition:.15s}
      .sch-tree details[open]>summary .tw{transform:rotate(90deg)}
      .sch-act{display:flex;gap:10px;align-items:center;padding:6px 12px;border-top:1px dashed var(--bd);cursor:pointer;flex-wrap:wrap}
      .sch-act:hover{background:var(--bg)}
      .sch-pb{height:6px;border-radius:4px;background:var(--bd);min-width:70px;flex:0 0 70px;overflow:hidden}
      .sch-pb i{display:block;height:100%;border-radius:4px}
      .gantt-wrap{direction:ltr;overflow:auto;border:1px solid var(--bd);border-radius:8px;max-height:65vh;position:relative}
      .gantt-row{display:flex;border-bottom:1px solid var(--bd);min-height:30px;align-items:stretch}
      .gantt-lbl{flex:0 0 250px;max-width:250px;padding:4px 8px;font-size:11px;position:sticky;left:0;background:var(--bg2);border-right:1px solid var(--bd);z-index:2;direction:rtl;text-align:right;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;cursor:pointer}
      html[dir="ltr"] .gantt-lbl{direction:ltr;text-align:left}
      .gantt-bars{position:relative;flex:1}
      .gantt-bar{position:absolute;height:12px;top:9px;border-radius:3px;min-width:3px}
      .gantt-bl{position:absolute;height:4px;top:23px;border-radius:2px;background:#94a3b8;opacity:.7;min-width:3px}
      .gantt-fc{position:absolute;height:4px;top:2px;border-radius:2px;background:repeating-linear-gradient(90deg,#c084fc 0 4px,transparent 4px 8px);min-width:3px}
      .gantt-prog{display:block;height:100%;background:rgba(255,255,255,.45);border-radius:3px 0 0 3px}
      .gantt-head{display:flex;position:sticky;top:0;background:var(--bg2);z-index:3;border-bottom:2px solid var(--bd)}
      .gantt-head .gantt-lbl{cursor:default}
      .gantt-m{font-size:10px;padding:4px 2px;border-right:1px solid var(--bd);text-align:center;overflow:hidden;white-space:nowrap;flex:0 0 auto}
      .gantt-today{position:absolute;top:0;bottom:0;width:2px;background:var(--red,#f87171);z-index:1}
      .sch-mapwrap{border:1px solid var(--bd);border-radius:10px;background:var(--bg2);overflow:hidden}
      .sch-mapwrap svg circle{cursor:pointer}
      .sch-lane{border:1px solid var(--bd);border-radius:10px;background:var(--bg2);padding:10px;min-height:120px}
      .sch-card{border:1px solid var(--bd);border-radius:8px;padding:7px 10px;margin-bottom:6px;font-size:12px;background:var(--bg);cursor:pointer}
      .sch-card:hover{border-color:var(--accent)}`;
    document.head.appendChild(st);
  },

  /* ================= page ================= */
  render(container) {
    this.injectCSS();
    const file = Store.currentScheduleFile();
    if (file) this.ensureDefaults(Store.scheduleActivities(file.id));
    Engine.modulePage(container, 'schedule', [
      { key: 'dash', icon: '🎯', label: TX('اللوحة التنفيذية', 'Executive'), render: (b, rr) => this.dashboard(b, rr) },
      { key: 'explorer', icon: '🗂', label: TX('هيكل المشروع', 'Project Explorer'), render: (b, rr) => this.explorerView(b, rr) },
      { key: 'gantt', icon: '📅', label: TX('مخطط جانت', 'Gantt'), render: (b, rr) => this.ganttView(b, rr) },
      { key: 'delay', icon: '⏰', label: TX('تحليل التأخير', 'Delay Analysis'), render: (b, rr) => this.delayView(b, rr) },
      { key: 'critical', icon: '🔥', label: TX('المسار الحرج', 'Critical Path'), render: (b, rr) => this.criticalView(b, rr) },
      { key: 'baseline', icon: '🎯', label: TX('مقارنة Baseline', 'Baseline vs Current'), render: (b, rr) => this.baselineView(b, rr) },
      { key: 'scurve', icon: '📈', label: 'S-Curve', render: (b, rr) => this.sCurveView(b, rr) },
      { key: 'lookahead', icon: '👀', label: 'Look Ahead', render: (b, rr) => this.lookaheadView(b, rr) },
      { key: 'milestones', icon: '🏁', label: TX('المعالم', 'Milestones'), render: (b, rr) => this.milestonesView(b, rr) },
      { key: 'timeline', icon: '🧭', label: TX('الخط الزمني', 'Timeline'), render: (b, rr) => this.timelineView(b, rr) },
      { key: 'boards', icon: '🏗️', label: TX('المقاولون والمناطق', 'Contractors & Zones'), render: (b, rr) => this.boardsView(b, rr) },
      { key: 'map', icon: '🗺️', label: TX('الخريطة', 'Map'), render: (b, rr) => this.mapView(b, rr) },
      { key: 'files', icon: '📁', label: TX('الملفات والإصدارات', 'Files & Versions'), render: (b, rr) => this.filesView(b, rr) },
      { key: 'snapshots', icon: '🕓', label: TX('اللقطات', 'Snapshots'), render: (b, rr) => this.snapshotsView(b, rr) },
    ]);
    Store.ensureWeeklySnapshot();
  },

  noFileState() {
    return `<div class="panel" style="padding:40px;text-align:center">
      <div style="font-size:48px;margin-bottom:12px">🗓️</div>
      <h3>${TX('لا يوجد برنامج زمني مرفوع لهذا المشروع', 'No schedule file uploaded for this project')}</h3>
      <p class="mut">${TX('ارفع ملف Primavera (XER/XML) أو Excel — يتم بناء الهيكل واللوحات تلقائياً', 'Upload a Primavera (XER/XML) or Excel file — structure & dashboards are built automatically')}</p>
      <div class="flex" style="justify-content:center;margin-top:14px">
        <label class="btn primary" style="cursor:pointer">${TX('📤 رفع ملف الجدول الزمني', '📤 Upload Schedule File')}
          <input type="file" id="sc-upload-empty" accept=".xer,.xml,.xlsx,.xls" style="display:none"></label>
      </div>
    </div>`;
  },

  guard(b, rr) {
    const file = Store.currentScheduleFile();
    if (!file) { b.innerHTML = this.noFileState(); this.bindUpload(b, rr); return null; }
    const acts = Store.scheduleActivities(file.id);
    this.ensureDefaults(acts);
    return { file, acts };
  },

  /* ================= 1. executive dashboard ================= */
  dashboard(b, rr) {
    const ctx = this.guard(b, rr); if (!ctx) return;
    const { file, acts } = ctx;
    const delayed = acts.filter(a => this.isDelayed(a));
    const critical = acts.filter(a => a.critical && !this.isComplete(a));
    const evm = this.evm(acts);
    const risks = Store.list('risk').filter(r => !Store.isClosed('risk', r)).sort((x, y) => Store.riskScore(y) - Store.riskScore(x)).slice(0, 5);
    const openIssues = Store.list('constraint').filter(c => !Store.isClosed('constraint', c));
    const linkedIssueIds = new Set(); acts.forEach(a => (a.linkedConstraints || []).forEach(id => linkedIssueIds.add(id)));
    const blFinish = acts.reduce((mx, a) => (a.baselineFinish || '') > mx ? a.baselineFinish : mx, '');
    const curFinish = acts.reduce((mx, a) => { const f = a.forecastFinish || a.finish || ''; return f > mx ? f : mx; }, '');
    const slip = blFinish && curFinish ? schDaysBetween(blFinish, curFinish) : 0;
    const lastUpdateDays = schDaysBetween(file.uploadedAt.slice(0, 10), todayISO());
    const spiCls = evm.spi == null ? '' : evm.spi >= 1 ? '#34d399' : evm.spi >= .9 ? '#f5b942' : '#f87171';

    b.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi" style="--kc:var(--accent)"><div class="k-label">${TX('نسبة الإنجاز العامة', 'Overall Progress')}</div>
          <div class="k-value">${evm.pct}%</div><div class="k-ico">📈</div>
          <div class="k-sub">${TX('المخطط حتى اليوم', 'Planned to date')}: ${evm.plannedPct}%</div></div>
        <div class="kpi" style="--kc:${spiCls || 'var(--accent)'}"><div class="k-label">SPI</div>
          <div class="k-value">${evm.spi != null ? evm.spi : '—'}</div><div class="k-ico">⏱️</div>
          <div class="k-sub">CPI (${TX('تقديري — بدون تكاليف', 'duration proxy')}): ${evm.cpi != null ? evm.cpi : '—'}</div></div>
        <div class="kpi" style="--kc:var(--red)"><div class="k-label">${TX('متأخرة', 'Delayed')}</div>
          <div class="k-value">${delayed.length}</div><div class="k-ico">🔴</div>
          <div class="k-sub">🔥 ${TX('حرجة', 'critical')}: ${critical.length}</div></div>
        <div class="kpi" style="--kc:#c084fc"><div class="k-label">${TX('معوقات مفتوحة', 'Open Issues')}</div>
          <div class="k-value">${openIssues.length}</div><div class="k-ico">🚩</div>
          <div class="k-sub">${TX('مرتبطة بأنشطة', 'linked to activities')}: ${linkedIssueIds.size}</div></div>
      </div>
      <div class="grid g3" style="margin-bottom:16px">
        <div class="kpi" style="--kc:#60a5fa"><div class="k-label">${TX('الإنهاء الأساسي (Baseline)', 'Baseline Finish')}</div>
          <div class="k-value" style="font-size:18px">${UI.fmtDate(blFinish)}</div><div class="k-ico">🎯</div></div>
        <div class="kpi" style="--kc:${slip > 0 ? '#f87171' : '#34d399'}"><div class="k-label">${TX('الإنهاء المتوقع', 'Forecast Finish')}</div>
          <div class="k-value" style="font-size:18px">${UI.fmtDate(curFinish)}</div><div class="k-ico">🔮</div>
          <div class="k-sub">${slip > 0 ? `+${slip} ${TX('يوم انزلاق', 'days slip')}` : TX('ضمن الخطة', 'on plan')}</div></div>
        <div class="kpi" style="--kc:${lastUpdateDays > 14 ? '#f87171' : '#34d399'}"><div class="k-label">${TX('آخر تحديث للجدول', 'Last Schedule Update')}</div>
          <div class="k-value" style="font-size:18px">Rev.${file.revision}</div><div class="k-ico">🗂</div>
          <div class="k-sub">${esc(file.company || '—')} · ${TX('منذ', 'since')} ${lastUpdateDays} ${TX('يوم', 'd')}</div></div>
      </div>
      <div class="grid g3" style="margin-bottom:16px">
        <div class="panel"><div class="panel-h"><span>🍩</span><h3>${TX('حالة الأنشطة', 'Activity Status')}</h3></div>
          <div class="flex" style="justify-content:center">${Charts.donut(['done', 'progress', 'delayed', 'notstarted'].map(k => ({
            label: this.statusLabel(k), value: acts.filter(a => this.statusKey(a) === k).length, color: this.statusColor(k)
          })).filter(x => x.value), { size: 165, centerLabel: acts.length, centerSub: TX('نشاط', 'activities') })}</div></div>
        <div class="panel"><div class="panel-h"><span>🛡️</span><h3>${TX('أهم المخاطر', 'Top Risks')}</h3></div>
          ${risks.map(r => `<div class="flex" style="justify-content:space-between;border-bottom:1px dashed var(--bd);padding:5px 0">
            <span class="fs12">${esc(r.title)}</span><span class="chip" style="--cc:#f87171">${Store.riskScore(r)}</span></div>`).join('') || UI.empty('🛡️')}</div>
        <div class="panel"><div class="panel-h"><span>🚩</span><h3>${TX('معوقات مؤثرة على الجدول', 'Schedule-Impacting Issues')}</h3></div>
          ${this.impactingIssuesList(acts)}</div>
      </div>
      <div class="panel">
        <div class="panel-h"><span>✨</span><h3>${TX('تحليل الجدول الذكي', 'Smart Schedule Analysis')}</h3>
          <button class="btn primary sm" id="sc-ai-run">✨ ${TX('تحليل الجدول الذكي', 'Run Smart Analysis')}</button></div>
        <div id="sc-ai-out" class="fs13 mut">${TX('اضغط الزر لتوليد تقرير تنفيذي شامل: أكبر التأخيرات، المخاطر، المقاولون والمناطق المتعثرة، الأنشطة الحرجة والمعرضة للتأخر.', 'Click to generate a full executive report: top delays, risks, struggling contractors/zones, critical & at-risk activities.')}</div>
      </div>`;
    b.querySelector('#sc-ai-run').onclick = () => this.smartAnalysis(b.querySelector('#sc-ai-out'), acts);
  },

  impactingIssuesList(acts) {
    const rows = [];
    acts.filter(a => (a.linkedConstraints || []).length).forEach(a => (a.linkedConstraints || []).forEach(cid => {
      const c = Store.get('constraint', cid); if (!c || Store.isClosed('constraint', c)) return;
      rows.push(`<div class="flex" style="justify-content:space-between;border-bottom:1px dashed var(--bd);padding:5px 0">
        <div><div class="b fs12">${esc(c.title)}</div><div class="fs11 mut">${esc(a.activityId)} · ${esc(a.name).slice(0, 40)}</div></div>
        <div class="fs11">${this.isDelayed(a) ? `<span class="chip" style="--cc:#f87171">+${this.delayDays(a)}${TX('ي', 'd')}</span>` : UI.statusChip('constraint', c.status)}</div>
      </div>`);
    }));
    return rows.slice(0, 8).join('') || UI.empty('🚩');
  },

  smartAnalysis(out, acts) {
    const topDelays = acts.filter(a => this.delayDays(a) > 0).sort((x, y) => this.delayDays(y) - this.delayDays(x)).slice(0, 10);
    const risks = Store.list('risk').filter(r => !Store.isClosed('risk', r)).sort((x, y) => Store.riskScore(y) - Store.riskScore(x)).slice(0, 10);
    const critical = acts.filter(a => a.critical && !this.isComplete(a));
    const atRisk = acts.filter(a => !this.isComplete(a) && !this.isDelayed(a) && a.float != null && a.float > 0 && a.float <= 5);
    const lowFloat = acts.filter(a => !this.isComplete(a) && a.float != null && a.float <= 10).sort((x, y) => (x.float) - (y.float)).slice(0, 10);
    const byContr = {};
    acts.forEach(a => { if (!a.contractor) return; (byContr[a.contractor] = byContr[a.contractor] || []).push(a); });
    const worstContr = Object.entries(byContr).map(([id, list]) => ({ id, delayed: list.filter(a => this.isDelayed(a)).length, total: list.length }))
      .filter(x => x.delayed).sort((x, y) => y.delayed - x.delayed).slice(0, 5);
    const byZone = {};
    acts.forEach(a => { const z = a.zone || '_'; (byZone[z] = byZone[z] || []).push(a); });
    const worstZones = Object.entries(byZone).map(([id, list]) => ({ id, delayed: list.filter(a => this.isDelayed(a)).length, total: list.length }))
      .filter(x => x.delayed).sort((x, y) => y.delayed - x.delayed).slice(0, 5);
    const sec = (icon, title, rows) => `<div class="panel" style="background:var(--bg2);margin-top:10px">
      <div class="panel-h"><span>${icon}</span><h3>${title}</h3></div>${rows || `<div class="fs12 mut">${TX('لا توجد عناصر', 'None')}</div>`}</div>`;
    const aRow = a => `<div class="flex fs12" style="justify-content:space-between;border-bottom:1px dashed var(--bd);padding:4px 0">
      <span>${esc(a.activityId)} — ${esc(a.name).slice(0, 55)}</span>
      <span class="chip" style="--cc:#f87171">${this.delayDays(a) ? '+' + this.delayDays(a) + TX('ي', 'd') : 'F=' + a.float}</span></div>`;
    out.innerHTML =
      sec('⏰', TX('أكبر 10 تأخيرات', 'Top 10 Delays'), topDelays.map(aRow).join('')) +
      sec('🛡️', TX('أكبر 10 مخاطر', 'Top 10 Risks'), risks.map(r => `<div class="flex fs12" style="justify-content:space-between;border-bottom:1px dashed var(--bd);padding:4px 0">
        <span>${esc(r.title)}</span><span class="chip" style="--cc:#f87171">${Store.riskScore(r)}</span></div>`).join('')) +
      sec('🏗️', TX('أكثر المقاولين تأخراً', 'Most-Delaying Contractors'), worstContr.map(x => `<div class="flex fs12" style="justify-content:space-between;padding:4px 0">
        <span>${esc(this.orgName(x.id) || x.id)}</span><span>${x.delayed} / ${x.total}</span></div>`).join('')) +
      sec('📍', TX('أكثر المناطق تعثراً', 'Most-Struggling Zones'), worstZones.map(x => `<div class="flex fs12" style="justify-content:space-between;padding:4px 0">
        <span>${esc(this.zoneName(x.id) || TX('غير محدد', 'Unassigned'))}</span><span>${x.delayed} / ${x.total}</span></div>`).join('')) +
      sec('🔥', TX(`الأنشطة الحرجة (${critical.length})`, `Critical Activities (${critical.length})`), critical.slice(0, 10).map(aRow).join('')) +
      sec('⚠️', TX(`أنشطة معرضة للتأخر (Float ≤ 5) — ${atRisk.length}`, `At-Risk Activities (Float ≤ 5) — ${atRisk.length}`), atRisk.slice(0, 10).map(aRow).join('')) +
      sec('🪫', TX('أنشطة بدون Float كافٍ (≤ 10)', 'Low-Float Activities (≤ 10)'), lowFloat.map(aRow).join(''));
  },

  /* ================= 2. hierarchy explorer ================= */
  explorerView(b, rr) {
    const ctx = this.guard(b, rr); if (!ctx) return;
    const { acts } = ctx;
    const f = this._exF || (this._exF = { q: '', status: '' });
    const list = acts.filter(a => {
      if (f.q && !(`${a.activityId} ${a.name} ${a.wbs}`.toLowerCase().includes(f.q.toLowerCase()))) return false;
      if (f.status && this.statusKey(a) !== f.status) return false;
      return true;
    });
    const groupBy = (arr, fn) => { const m = new Map(); arr.forEach(x => { const k = fn(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }); return m; };
    const stats = arr => {
      const d = arr.filter(a => this.isDelayed(a)).length;
      const pct = arr.length ? Math.round(arr.reduce((s, a) => s + (a.pctComplete || 0), 0) / arr.length) : 0;
      return `<span class="fs11 mut">${arr.length} ${TX('نشاط', 'act')}</span>
        <div class="sch-pb"><i style="width:${pct}%;background:${pct >= 100 ? '#34d399' : 'var(--accent)'}"></i></div>
        <span class="fs11">${pct}%</span>${d ? `<span class="chip" style="--cc:#f87171">⏰ ${d}</span>` : ''}`;
    };
    const actRow = a => {
      const sk = this.statusKey(a);
      return `<div class="sch-act" data-id="${a.id}">
        <span class="fs11 mut" style="min-width:70px">${esc(a.activityId)}</span>
        <span class="fs12" style="flex:1;min-width:160px">${a.milestone ? '🏁 ' : ''}${a.critical ? '🔥 ' : ''}${esc(a.name)}</span>
        <span class="fs11 mut">${UI.fmtDate(a.start)} ← ${UI.fmtDate(a.finish)}</span>
        <div class="sch-pb"><i style="width:${Math.min(100, a.pctComplete || 0)}%;background:${this.statusColor(sk)}"></i></div>
        <span class="chip" style="--cc:${this.statusColor(sk)}">${this.statusLabel(sk)}</span>
        ${this.isDelayed(a) ? `<span class="chip" style="--cc:#f87171">+${this.delayDays(a)}${TX('ي', 'd')}</span>` : ''}
      </div>`;
    };
    const wbsLevel = arr => {
      const byWbs = groupBy(arr, a => a.wbs || TX('بدون WBS', 'No WBS'));
      if (byWbs.size <= 1) return arr.map(actRow).join('');
      return [...byWbs.entries()].map(([w, items]) => `<details><summary><span class="tw">▸</span><b class="fs12">${esc(w)}</b>${stats(items)}</summary>${items.map(actRow).join('')}</details>`).join('');
    };
    const streetLevel = arr => {
      const bySt = groupBy(arr, a => a.street || '_');
      if (bySt.size <= 1 && bySt.has('_')) return wbsLevel(arr);
      return [...bySt.entries()].map(([sid, items]) => `<details><summary><span class="tw">▸</span>🛣️ <b class="fs12">${esc(this.streetName(sid) || TX('بدون شارع', 'No street'))}</b>${stats(items)}</summary>${wbsLevel(items)}</details>`).join('');
    };
    const sysLevel = arr => {
      const bySys = groupBy(arr, a => a.system || 'other');
      return [...bySys.entries()].map(([sk, items]) => { const S = this.SYSTEMS.find(s => s.key === sk) || this.SYSTEMS[this.SYSTEMS.length - 1];
        return `<details><summary><span class="tw">▸</span>${S.icon} <b class="fs12">${S.label()}</b>${stats(items)}</summary>${streetLevel(items)}</details>`; }).join('');
    };
    const byZone = groupBy(list, a => a.zone || '_');
    const file = ctx.file;
    const relCount = (file.relationships || []).length, wbsCount = (file.wbsTree || []).length;
    const calCount = (file.calendars || []).length, resCount = (file.resources || []).length;
    const pill = (icon, lbl, n) => `<span class="chip" style="--cc:var(--accent)">${icon} ${lbl}: <b>${n}</b></span>`;
    b.innerHTML = `
      <div class="flex" style="gap:6px;margin-bottom:10px;flex-wrap:wrap;font-size:11px">
        ${pill('📋', TX('أنشطة', 'Activities'), acts.length)}${pill('🗂', 'WBS', wbsCount)}${pill('🔗', TX('علاقات', 'Relations'), relCount)}
        ${pill('📆', TX('تقويمات', 'Calendars'), calCount)}${pill('👷', TX('موارد', 'Resources'), resCount)}
        <span class="chip" style="--cc:${file.hasBaseline ? '#34d399' : '#94a3b8'}">🎯 Baseline: ${file.hasBaseline ? TX('نعم', 'Yes') : TX('لا', 'No')}</span>
      </div>
      <div class="flex" style="gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <input class="input" id="ex-q" placeholder="${TX('بحث في الهيكل…', 'Search structure…')}" value="${esc(f.q)}" style="max-width:260px">
        <select class="input" id="ex-st" style="max-width:160px"><option value="">${TX('الحالة: الكل', 'Status: All')}</option>
          ${['notstarted', 'progress', 'delayed', 'done'].map(k => `<option value="${k}" ${f.status === k ? 'selected' : ''}>${this.statusLabel(k)}</option>`).join('')}</select>
        <button class="btn sm" id="ex-open">${TX('فتح الكل', 'Expand all')}</button>
        <button class="btn sm" id="ex-close">${TX('إغلاق الكل', 'Collapse all')}</button>
        <div class="tb-spacer"></div><span class="fs11 mut">${list.length} / ${acts.length} ${TX('نشاط', 'activities')}</span>
      </div>
      <div class="sch-tree">
        ${[...byZone.entries()].map(([zid, items]) => `<details open><summary><span class="tw">▸</span>📍 <b>${esc(this.zoneName(zid) || TX('بدون منطقة', 'Unassigned zone'))}</b>${stats(items)}</summary>${sysLevel(items)}</details>`).join('') || UI.empty('🗂')}
      </div>`;
    b.querySelector('#ex-q').oninput = e => { f.q = e.target.value; this.explorerView(b, rr); const i = b.querySelector('#ex-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
    b.querySelector('#ex-st').onchange = e => { f.status = e.target.value; this.explorerView(b, rr); };
    b.querySelector('#ex-open').onclick = () => b.querySelectorAll('details').forEach(d => d.open = true);
    b.querySelector('#ex-close').onclick = () => b.querySelectorAll('details').forEach(d => d.open = false);
    b.querySelectorAll('.sch-act').forEach(el => el.onclick = () => this.activityDetail(el.dataset.id, rr));
  },

  /* ================= 3. gantt ================= */
  ganttView(b, rr) {
    const ctx = this.guard(b, rr); if (!ctx) return;
    const { acts } = ctx;
    const f = this._gF || (this._gF = { q: '', zone: '', system: '', crit: false });
    const list = acts.filter(a => {
      if (f.q && !(`${a.activityId} ${a.name}`.toLowerCase().includes(f.q.toLowerCase()))) return false;
      if (f.zone && a.zone !== f.zone) return false;
      if (f.system && a.system !== f.system) return false;
      if (f.crit && !a.critical) return false;
      return true;
    }).filter(a => a.start && a.finish).sort((x, y) => (x.start || '').localeCompare(y.start || ''));
    const shown = list.slice(0, 250);
    const ppdMap = { day: 24, week: 8, month: 2.5, quarter: 1, year: .4 };
    const ppd = ppdMap[this.ganttZoom] || 2.5;
    let min = '', max = '';
    shown.forEach(a => {
      [a.baselineStart, a.start, a.forecastStart].forEach(d => { if (d && (!min || d < min)) min = d; });
      [a.baselineFinish, a.finish, a.forecastFinish].forEach(d => { if (d && (!max || d > max)) max = d; });
    });
    if (!min) min = todayISO(); if (!max || max <= min) max = dOff(90);
    const total = schDaysBetween(min, max) + 15;
    const X = d => schDaysBetween(min, d) * ppd;
    const months = [];
    { let d = new Date(min); d.setDate(1);
      while (d.toISOString().slice(0, 10) <= max) {
        const startD = d.toISOString().slice(0, 10);
        const nm = new Date(d); nm.setMonth(nm.getMonth() + 1);
        const days = Math.round((nm - d) / 86400000);
        months.push({ label: `${t('months')[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, w: days * ppd });
        d = nm;
      } }
    const zones = Store.getMasterList('zones', { includeArchived: true });
    const todayX = X(todayISO());
    b.innerHTML = `
      <div class="flex" style="gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <input class="input" id="g-q" placeholder="${t('search')}" value="${esc(f.q)}" style="max-width:200px">
        <select class="input" id="g-zone" style="max-width:160px"><option value="">${TX('المنطقة: الكل', 'Zone: All')}</option>
          ${zones.map(z => `<option value="${z.id}" ${f.zone === z.id ? 'selected' : ''}>${esc(z.name)}</option>`).join('')}</select>
        <select class="input" id="g-sys" style="max-width:160px"><option value="">${TX('النظام: الكل', 'System: All')}</option>
          ${this.SYSTEMS.map(s => `<option value="${s.key}" ${f.system === s.key ? 'selected' : ''}>${s.icon} ${s.label()}</option>`).join('')}</select>
        <label class="fs12 flex" style="gap:5px"><input type="checkbox" id="g-crit" ${f.crit ? 'checked' : ''}>🔥 ${TX('حرجة فقط', 'Critical only')}</label>
        <div class="tb-spacer"></div>
        <button class="btn sm" id="g-zoomout" title="${TX('تصغير', 'Zoom out')}">➖</button>
        ${[['day', TX('يوم', 'Day')], ['week', TX('أسبوع', 'Week')], ['month', TX('شهر', 'Month')], ['quarter', TX('ربع', 'Quarter')], ['year', TX('سنة', 'Year')]]
          .map(([k, l]) => `<button class="btn sm ${this.ganttZoom === k ? 'primary' : ''}" data-z="${k}">${l}</button>`).join('')}
        <button class="btn sm" id="g-zoomin" title="${TX('تكبير', 'Zoom in')}">➕</button>
        <button class="btn sm" id="g-full" title="${TX('ملء الشاشة', 'Full screen')}">⛶</button>
      </div>
      <div class="flex fs11 mut" style="gap:14px;margin-bottom:8px;flex-wrap:wrap">
        <span><i style="display:inline-block;width:22px;height:8px;background:#94a3b8;border-radius:2px"></i> Baseline</span>
        <span><i style="display:inline-block;width:22px;height:8px;background:var(--accent);border-radius:2px"></i> Current</span>
        <span><i style="display:inline-block;width:22px;height:8px;background:repeating-linear-gradient(90deg,#c084fc 0 4px,transparent 4px 8px);border-radius:2px"></i> Forecast</span>
        <span><i style="display:inline-block;width:22px;height:8px;background:rgba(255,255,255,.45);border:1px solid var(--bd);border-radius:2px"></i> Actual Progress</span>
        <span><i style="display:inline-block;width:2px;height:12px;background:#f87171"></i> ${t('today')}</span>
      </div>
      <div class="gantt-wrap">
        <div class="gantt-head"><div class="gantt-lbl b">${TX('النشاط', 'Activity')}</div>
          <div style="display:flex;position:relative">${months.map(m => `<div class="gantt-m" style="width:${m.w}px">${m.label}</div>`).join('')}</div></div>
        ${shown.map(a => {
          const sk = this.statusKey(a);
          const w = Math.max(3, (schDaysBetween(a.start, a.finish) + 1) * ppd);
          const bl = a.baselineStart && a.baselineFinish ? `<div class="gantt-bl" style="left:${X(a.baselineStart)}px;width:${Math.max(3, (schDaysBetween(a.baselineStart, a.baselineFinish) + 1) * ppd)}px"></div>` : '';
          const fc = a.forecastStart && a.forecastFinish ? `<div class="gantt-fc" style="left:${X(a.forecastStart)}px;width:${Math.max(3, (schDaysBetween(a.forecastStart, a.forecastFinish) + 1) * ppd)}px"></div>` : '';
          return `<div class="gantt-row">
            <div class="gantt-lbl" data-id="${a.id}" title="${esc(a.name)}">${a.milestone ? '🏁 ' : ''}${a.critical ? '🔥 ' : ''}${esc(a.activityId)} — ${esc(a.name)}</div>
            <div class="gantt-bars" style="width:${total * ppd}px">
              <div class="gantt-today" style="left:${todayX}px"></div>
              ${bl}${fc}
              <div class="gantt-bar" data-id="${a.id}" title="${esc(a.name)} (${Math.round(a.pctComplete || 0)}%)"
                style="left:${X(a.start)}px;width:${w}px;background:${a.critical ? '#c084fc' : this.statusColor(sk) === '#94a3b8' ? 'var(--accent)' : this.statusColor(sk)}">
                <span class="gantt-prog" style="width:${Math.min(100, a.pctComplete || 0)}%"></span></div>
            </div></div>`;
        }).join('')}
      </div>
      <div class="fs11 mut mt8">${shown.length}${list.length > shown.length ? ` / ${list.length} — ${TX('استخدم الفلاتر لعرض المزيد بدقة', 'use filters to narrow down')}` : ''} ${TX('نشاط', 'activities')}</div>`;
    b.querySelectorAll('[data-z]').forEach(btn => btn.onclick = () => { this.ganttZoom = btn.dataset.z; this.ganttView(b, rr); });
    const zoomOrder = ['year', 'quarter', 'month', 'week', 'day'];
    b.querySelector('#g-zoomin').onclick = () => { const i = zoomOrder.indexOf(this.ganttZoom); this.ganttZoom = zoomOrder[Math.min(zoomOrder.length - 1, i + 1)]; this.ganttView(b, rr); };
    b.querySelector('#g-zoomout').onclick = () => { const i = zoomOrder.indexOf(this.ganttZoom); this.ganttZoom = zoomOrder[Math.max(0, i - 1)]; this.ganttView(b, rr); };
    b.querySelector('#g-full').onclick = () => { const w = b.querySelector('.gantt-wrap'); if (!document.fullscreenElement && w.requestFullscreen) w.requestFullscreen(); else if (document.exitFullscreen) document.exitFullscreen(); };
    b.querySelector('#g-q').oninput = e => { f.q = e.target.value; this.ganttView(b, rr); const i = b.querySelector('#g-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
    b.querySelector('#g-zone').onchange = e => { f.zone = e.target.value; this.ganttView(b, rr); };
    b.querySelector('#g-sys').onchange = e => { f.system = e.target.value; this.ganttView(b, rr); };
    b.querySelector('#g-crit').onchange = e => { f.crit = e.target.checked; this.ganttView(b, rr); };
    b.querySelectorAll('.gantt-lbl[data-id],.gantt-bar[data-id]').forEach(el => el.onclick = () => this.activityDetail(el.dataset.id, rr));
  },

  /* ================= 4. delay analysis ================= */
  delayView(b, rr) {
    const ctx = this.guard(b, rr); if (!ctx) return;
    const { acts } = ctx;
    const f = this._dF || (this._dF = { contractor: '', zone: '', system: '' });
    const delayed = acts.filter(a => this.delayDays(a) > 0)
      .filter(a => (!f.contractor || a.contractor === f.contractor) && (!f.zone || a.zone === f.zone) && (!f.system || a.system === f.system))
      .sort((x, y) => this.delayDays(y) - this.delayDays(x));
    const contractors = Store.getProjectOrgs('contractor');
    const zones = Store.getMasterList('zones', { includeArchived: true });
    const parties = Store.getMasterList('responsibleParties');
    b.innerHTML = `
      <div class="flex" style="gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <select class="input" id="d-co" style="max-width:180px"><option value="">${TX('المقاول: الكل', 'Contractor: All')}</option>
          ${contractors.map(c => `<option value="${c.id}" ${f.contractor === c.id ? 'selected' : ''}>${esc(LANG === 'ar' ? c.name : (c.nameEn || c.name))}</option>`).join('')}</select>
        <select class="input" id="d-zone" style="max-width:160px"><option value="">${TX('المنطقة: الكل', 'Zone: All')}</option>
          ${zones.map(z => `<option value="${z.id}" ${f.zone === z.id ? 'selected' : ''}>${esc(z.name)}</option>`).join('')}</select>
        <select class="input" id="d-sys" style="max-width:160px"><option value="">${TX('النظام: الكل', 'System: All')}</option>
          ${this.SYSTEMS.map(s => `<option value="${s.key}" ${f.system === s.key ? 'selected' : ''}>${s.icon} ${s.label()}</option>`).join('')}</select>
        <div class="tb-spacer"></div><span class="fs11 mut">${delayed.length} ${TX('نشاط متأخر', 'delayed activities')}</span>
      </div>
      <div class="panel" style="padding:6px 14px;overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>${TX('النشاط', 'Activity')}</th><th>${TX('النهاية الأساسية', 'BL Finish')}</th><th>${TX('النهاية الحالية', 'Current Finish')}</th>
          <th>${TX('أيام التأخير', 'Delay')}</th><th>${TX('سبب التأخير', 'Cause')}</th><th>${TX('المسؤول', 'Responsible')}</th><th>${TX('الإجراء المطلوب', 'Required Action')}</th><th></th>
        </tr></thead><tbody>
        ${delayed.map(a => `<tr data-id="${a.id}">
          <td style="min-width:180px"><div class="fs12 b">${a.critical ? '🔥 ' : ''}${esc(a.name)}</div><div class="fs11 mut">${esc(a.activityId)} · ${esc(this.zoneName(a.zone) || '')}</div></td>
          <td class="fs12">${UI.fmtDate(a.baselineFinish)}</td>
          <td class="fs12">${UI.fmtDate(a.finish)}</td>
          <td><span class="chip" style="--cc:#f87171">+${this.delayDays(a)}${TX('ي', 'd')} (${this.delayPct(a)}%)</span></td>
          <td class="fs12">${esc(a.delayCause || '—')}</td>
          <td class="fs12">${a.delayResponsible ? esc(Store.respPartyLabel(a.delayResponsible)) : '—'}</td>
          <td class="fs12">${esc(a.delayAction || '—')}</td>
          <td><button class="btn sm" data-edit="${a.id}">✏️</button></td>
        </tr>`).join('')}
        </tbody></table>
        ${!delayed.length ? UI.empty('⏰') : ''}
      </div>`;
    b.querySelector('#d-co').onchange = e => { f.contractor = e.target.value; this.delayView(b, rr); };
    b.querySelector('#d-zone').onchange = e => { f.zone = e.target.value; this.delayView(b, rr); };
    b.querySelector('#d-sys').onchange = e => { f.system = e.target.value; this.delayView(b, rr); };
    b.querySelectorAll('[data-edit]').forEach(btn => btn.onclick = (e) => { e.stopPropagation(); this.delayEditModal(btn.dataset.edit, () => this.delayView(b, rr)); });
    b.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => this.activityDetail(tr.dataset.id, rr));
  },

  delayEditModal(id, done) {
    const a = Store.db.schedule.activities.find(x => x.id === id); if (!a) return;
    const parties = Store.getMasterList('responsibleParties');
    const m = UI.modal(`
      <div style="padding:22px;max-width:480px">
        <h2 style="margin:0">⏰ ${TX('بيانات التأخير', 'Delay Details')}</h2>
        <div class="fs12 mut">${esc(a.activityId)} — ${esc(a.name)}</div>
        <div style="margin-top:14px"><label class="fl">${TX('سبب التأخير', 'Delay Cause')}</label>
          <input class="input" id="de-cause" value="${esc(a.delayCause || '')}"></div>
        <div style="margin-top:10px"><label class="fl">${TX('المسؤول عن التأخير', 'Responsible for Delay')}</label>
          <select class="input" id="de-resp"><option value="">${TX('— اختر —', '— Select —')}</option>
            ${parties.map(p => `<option value="${p.key}" ${a.delayResponsible === p.key ? 'selected' : ''}>${esc(LANG === 'ar' ? p.name : (p.nameEn || p.name))}</option>`).join('')}</select></div>
        <div style="margin-top:10px"><label class="fl">${TX('الإجراء المطلوب', 'Required Action')}</label>
          <input class="input" id="de-action" value="${esc(a.delayAction || '')}"></div>
        <div class="flex" style="justify-content:flex-end;margin-top:16px;gap:8px">
          <button class="btn" data-close>${t('cancel')}</button>
          <button class="btn primary" id="de-save">${t('save')}</button>
        </div>
      </div>`);
    m.el.querySelector('#de-save').onclick = () => {
      Store.updateScheduleActivity(id, {
        delayCause: m.el.querySelector('#de-cause').value.trim(),
        delayResponsible: m.el.querySelector('#de-resp').value,
        delayAction: m.el.querySelector('#de-action').value.trim(),
      });
      m.close(); UI.toast(t('saved')); done();
    };
  },

  /* ================= 5. critical path ================= */
  criticalView(b, rr) {
    const ctx = this.guard(b, rr); if (!ctx) return;
    const acts = ctx.acts.filter(a => a.critical && !this.isComplete(a)).sort((x, y) => (x.start || '').localeCompare(y.start || ''));
    const blFinish = ctx.acts.reduce((mx, a) => (a.baselineFinish || '') > mx ? a.baselineFinish : mx, '');
    b.innerHTML = `
      <div class="grid g3" style="margin-bottom:14px">
        <div class="kpi" style="--kc:#c084fc"><div class="k-label">${TX('أنشطة حرجة مفتوحة', 'Open Critical Activities')}</div>
          <div class="k-value">${acts.length}</div><div class="k-ico">🔥</div></div>
        <div class="kpi" style="--kc:#f87171"><div class="k-label">${TX('حرجة ومتأخرة', 'Critical & Delayed')}</div>
          <div class="k-value">${acts.filter(a => this.isDelayed(a)).length}</div><div class="k-ico">🚨</div></div>
        <div class="kpi" style="--kc:#60a5fa"><div class="k-label">${TX('تاريخ الإنجاز المستهدف', 'Target Completion')}</div>
          <div class="k-value" style="font-size:18px">${UI.fmtDate(blFinish)}</div><div class="k-ico">🎯</div></div>
      </div>
      <div class="panel" style="padding:6px 14px;overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>${TX('الكود', 'ID')}</th><th>${TX('النشاط', 'Activity')}</th><th>${TX('المنطقة', 'Zone')}</th><th>${TX('البداية', 'Start')}</th><th>${TX('النهاية', 'Finish')}</th>
          <th>%</th><th>Float</th><th>${TX('التأخير', 'Delay')}</th><th>${TX('أثر على المشروع', 'Project Impact')}</th>
        </tr></thead><tbody>
        ${acts.map(a => `<tr data-id="${a.id}">
          <td class="fs12 mut">${esc(a.activityId)}</td>
          <td class="fs12">${esc(a.name)}</td>
          <td class="fs12">${esc(this.zoneName(a.zone) || '—')}</td>
          <td class="fs12">${UI.fmtDate(a.start)}</td>
          <td class="fs12">${UI.fmtDate(a.finish)}</td>
          <td class="fs12">${Math.round(a.pctComplete || 0)}%</td>
          <td class="fs12">${a.float != null ? a.float : 0}</td>
          <td>${this.isDelayed(a) ? `<span class="chip" style="--cc:#f87171">+${this.delayDays(a)}${TX('ي', 'd')}</span>` : '—'}</td>
          <td class="fs12">${this.isDelayed(a) ? '🚨 ' + TX('يدفع تاريخ الإنهاء النهائي مباشرة', 'Directly pushes the final completion date') : TX('على المسار الحرج — أي تأخير يؤثر مباشرة', 'On critical path — any slip impacts finish')}</td>
        </tr>`).join('')}
        </tbody></table>
        ${!acts.length ? UI.empty('🔥') : ''}
      </div>`;
    b.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => this.activityDetail(tr.dataset.id, rr));
  },

  /* ================= 5b. baseline vs current ================= */
  baselineView(b, rr) {
    const ctx = this.guard(b, rr); if (!ctx) return;
    const { acts } = ctx;
    const f = this._blF || (this._blF = { q: '', only: 'all' });
    let list = acts.filter(a => !f.q || `${a.activityId} ${a.name}`.toLowerCase().includes(f.q.toLowerCase()));
    if (f.only === 'slip') list = list.filter(a => this.blVar(a) > 0);
    if (f.only === 'ahead') list = list.filter(a => this.blVar(a) < 0);
    list = list.sort((x, y) => this.blVar(y) - this.blVar(x));
    const withBl = acts.filter(a => a.baselineFinish);
    const slipped = withBl.filter(a => this.blVar(a) > 0);
    const avgSlip = slipped.length ? Math.round(slipped.reduce((s, a) => s + this.blVar(a), 0) / slipped.length) : 0;
    b.innerHTML = `
      <div class="grid g4" style="margin-bottom:14px">
        <div class="kpi" style="--kc:#60a5fa"><div class="k-label">${TX('أنشطة لها Baseline', 'Activities with Baseline')}</div><div class="k-value">${withBl.length}</div><div class="k-ico">🎯</div></div>
        <div class="kpi" style="--kc:#f87171"><div class="k-label">${TX('متأخرة عن الأساس', 'Slipped vs Baseline')}</div><div class="k-value">${slipped.length}</div><div class="k-ico">📉</div></div>
        <div class="kpi" style="--kc:#34d399"><div class="k-label">${TX('متقدمة على الأساس', 'Ahead of Baseline')}</div><div class="k-value">${withBl.filter(a => this.blVar(a) < 0).length}</div><div class="k-ico">📈</div></div>
        <div class="kpi" style="--kc:#f5b942"><div class="k-label">${TX('متوسط الانزلاق', 'Avg Slip')}</div><div class="k-value">${avgSlip} ${TX('ي', 'd')}</div><div class="k-ico">⏱️</div></div>
      </div>
      <div class="flex" style="gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <input class="input" id="bl-q" placeholder="${t('search')}" value="${esc(f.q)}" style="max-width:240px">
        ${[['all', t('all')], ['slip', TX('متأخرة', 'Slipped')], ['ahead', TX('متقدمة', 'Ahead')]].map(([k, l]) => `<button class="btn sm ${f.only === k ? 'primary' : ''}" data-only="${k}">${l}</button>`).join('')}
        <div class="tb-spacer"></div><span class="fs11 mut">${list.length} ${TX('نشاط', 'activities')}</span>
      </div>
      <div class="panel" style="padding:6px 14px;overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>${TX('النشاط', 'Activity')}</th><th>Baseline Start</th><th>Baseline Finish</th>
          <th>${TX('البداية الحالية', 'Current Start')}</th><th>${TX('النهاية الحالية', 'Current Finish')}</th>
          <th>Variance</th><th>Delay Days</th>
        </tr></thead><tbody>
        ${list.map(a => { const v = this.blVar(a);
          return `<tr data-id="${a.id}">
            <td style="min-width:180px"><div class="fs12 b">${a.critical ? '🔥 ' : ''}${a.milestone ? '🏁 ' : ''}${esc(a.name)}</div><div class="fs11 mut">${esc(a.activityId)}</div></td>
            <td class="fs12">${UI.fmtDate(a.baselineStart)}</td>
            <td class="fs12">${UI.fmtDate(a.baselineFinish)}</td>
            <td class="fs12">${UI.fmtDate(a.start)}</td>
            <td class="fs12">${UI.fmtDate(a.finish)}</td>
            <td>${a.baselineFinish ? `<span class="chip" style="--cc:${v > 0 ? '#f87171' : v < 0 ? '#34d399' : '#94a3b8'}">${v > 0 ? '+' : ''}${v}${TX('ي', 'd')}</span>` : '—'}</td>
            <td class="fs12">${this.delayDays(a) ? `<b style="color:#f87171">${this.delayDays(a)}</b>` : '0'}</td>
          </tr>`;
        }).join('')}
        </tbody></table>
        ${!list.length ? UI.empty('🎯') : ''}
      </div>`;
    b.querySelector('#bl-q').oninput = e => { f.q = e.target.value; this.baselineView(b, rr); const i = b.querySelector('#bl-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
    b.querySelectorAll('[data-only]').forEach(btn => btn.onclick = () => { f.only = btn.dataset.only; this.baselineView(b, rr); });
    b.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => this.activityDetail(tr.dataset.id, rr));
  },
  blVar(a) { return a.baselineFinish && a.finish ? schDaysBetween(a.baselineFinish, a.finish) : 0; },

  /* ================= 5c. S-Curve ================= */
  sCurveView(b, rr) {
    const ctx = this.guard(b, rr); if (!ctx) return;
    const { acts } = ctx;
    const today = todayISO();
    let min = '', max = '';
    acts.forEach(a => {
      [a.baselineStart, a.start, a.actualStart].forEach(d => { if (d && (!min || d < min)) min = d; });
      [a.baselineFinish, a.finish, a.forecastFinish].forEach(d => { if (d && (!max || d > max)) max = d; });
    });
    if (!min || !max) { b.innerHTML = `<div class="panel" style="padding:30px;text-align:center"><div style="font-size:40px">📈</div><h3>${TX('لا توجد تواريخ كافية لرسم منحنى S', 'Not enough dates to draw the S-Curve')}</h3></div>`; return; }
    // monthly buckets
    const buckets = []; let d = new Date(min); d.setDate(1);
    while (d.toISOString().slice(0, 10) <= max) { buckets.push(d.toISOString().slice(0, 10)); d = new Date(d); d.setMonth(d.getMonth() + 1); }
    if (buckets[buckets.length - 1] < max) buckets.push(max);
    const wTot = acts.reduce((s, a) => s + (a.duration || 1), 0) || 1;
    const frac = (D, s, f) => { if (!s || !f) return 0; if (D <= s) return 0; if (D >= f) return 1; return schDaysBetween(s, D) / Math.max(1, schDaysBetween(s, f)); };
    const planned = [], actual = [], forecast = [];
    buckets.forEach(D => {
      let pv = 0, av = 0, fc = 0;
      acts.forEach(a => {
        const w = a.duration || 1;
        pv += w * frac(D, a.baselineStart || a.start, a.baselineFinish || a.finish);
        const cs = a.actualStart || a.start, cf = a.forecastFinish || a.finish;
        if (D <= today) av += w * Math.min(frac(D, cs, cf), (a.pctComplete || 0) / 100);
        fc += w * frac(D, cs, cf);
      });
      planned.push(Math.round(pv / wTot * 100));
      actual.push(D <= today ? Math.round(av / wTot * 100) : null);
      forecast.push(Math.round(fc / wTot * 100));
    });
    // actual line only up to today
    const actualClean = actual.map(v => v == null ? null : v);
    const lastActualIdx = actualClean.reduce((mx, v, i) => v != null ? i : mx, 0);
    const series = [
      { name: TX('المخطط (Planned)', 'Planned'), color: '#60a5fa', values: planned },
      { name: TX('الفعلي (Actual)', 'Actual'), color: '#34d399', values: actualClean.map((v, i) => i <= lastActualIdx ? (v == null ? 0 : v) : null).filter(v => v != null) },
      { name: TX('المتوقع (Forecast)', 'Forecast'), color: '#c084fc', values: forecast },
    ];
    const labels = buckets.map(x => { const dt = new Date(x); return `${t('months')[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`; });
    const evm = this.evm(acts);
    b.innerHTML = `
      <div class="grid g3" style="margin-bottom:14px">
        <div class="kpi" style="--kc:#34d399"><div class="k-label">${TX('الإنجاز الفعلي', 'Actual Progress')}</div><div class="k-value">${evm.pct}%</div><div class="k-ico">✅</div></div>
        <div class="kpi" style="--kc:#60a5fa"><div class="k-label">${TX('المخطط حتى اليوم', 'Planned to date')}</div><div class="k-value">${evm.plannedPct}%</div><div class="k-ico">🎯</div></div>
        <div class="kpi" style="--kc:${evm.pct >= evm.plannedPct ? '#34d399' : '#f87171'}"><div class="k-label">${TX('الانحراف', 'Variance')}</div><div class="k-value">${evm.pct - evm.plannedPct > 0 ? '+' : ''}${evm.pct - evm.plannedPct}%</div><div class="k-ico">📊</div></div>
      </div>
      <div class="panel">
        <div class="panel-h"><span>📈</span><h3>${TX('منحنى S — المخطط مقابل الفعلي مقابل المتوقع', 'S-Curve — Planned vs Actual vs Forecast')}</h3></div>
        ${Charts.line(series, { height: 300, labels })}
      </div>`;
  },

  /* ================= 6. lookahead ================= */
  lookaheadView(b, rr) {
    const ctx = this.guard(b, rr); if (!ctx) return;
    const { acts } = ctx;
    const days = parseInt(this.laTab) * 7;
    const upcoming = acts.filter(a => this.dueWithin(a, days) || (this.isStarted(a) && !this.isComplete(a) && a.finish && schDaysBetween(todayISO(), a.finish) <= days && schDaysBetween(todayISO(), a.finish) >= 0))
      .sort((x, y) => (x.start || '').localeCompare(y.start || ''));
    b.innerHTML = `
      <div class="flex" style="gap:8px;margin-bottom:10px">
        ${['2', '4', '8', '12'].map(w => `<button class="btn sm ${this.laTab === w ? 'primary' : ''}" data-w="${w}">${w} ${TX('أسابيع', 'Weeks')}</button>`).join('')}
        <div class="tb-spacer"></div><span class="fs11 mut">${upcoming.length} ${TX('نشاط', 'activities')}</span>
      </div>
      <div class="panel" style="padding:6px 14px;overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>${TX('النشاط', 'Activity')}</th><th>${TX('البداية', 'Start')}</th><th>${TX('النهاية', 'Finish')}</th><th>%</th>
          <th>${TX('اعتماد؟', 'Approval?')}</th><th>${TX('مواد؟', 'Materials?')}</th><th>${TX('إتاحة؟', 'Access?')}</th>
          <th>${TX('معوق؟', 'Issue?')}</th><th>${TX('المسؤول', 'Responsible')}</th><th></th>
        </tr></thead><tbody>
        ${upcoming.map(a => `<tr data-id="${a.id}">
          <td style="min-width:200px"><div class="fs12 b">${a.critical ? '🔥 ' : ''}${a.milestone ? '🏁 ' : ''}${esc(a.name)}</div>
            <div class="fs11 mut">${esc(a.activityId)} · ${esc(this.zoneName(a.zone) || '')}</div></td>
          <td class="fs12">${UI.fmtDate(a.start)}</td>
          <td class="fs12">${UI.fmtDate(a.finish)}</td>
          <td class="fs12">${Math.round(a.pctComplete || 0)}%</td>
          <td>${a.needsApproval ? '🟠' : '—'}</td>
          <td>${a.needsMaterials ? '📦' : '—'}</td>
          <td>${a.needsAccess ? '🛣️' : '—'}</td>
          <td>${(a.linkedConstraints || []).length ? `<span class="chip" style="--cc:#f87171">🚩 ${(a.linkedConstraints || []).length}</span>` : '—'}</td>
          <td class="fs12">${a.contractor ? esc(this.orgName(a.contractor)) : '—'}</td>
          <td class="fs12 mut">›</td>
        </tr>`).join('')}
        </tbody></table>
        ${!upcoming.length ? UI.empty('👀') : ''}
      </div>`;
    b.querySelectorAll('[data-w]').forEach(btn => btn.onclick = () => { this.laTab = btn.dataset.w; this.lookaheadView(b, rr); });
    b.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => this.activityDetail(tr.dataset.id, rr));
  },

  /* ================= 7. milestones ================= */
  milestonesView(b, rr) {
    const ctx = this.guard(b, rr); if (!ctx) return;
    const ms = ctx.acts.filter(a => a.milestone);
    const groups = {
      completed: ms.filter(a => this.isComplete(a)),
      upcoming: ms.filter(a => !this.isComplete(a) && !this.isDelayed(a)),
      delayed: ms.filter(a => this.isDelayed(a)),
      critical: ms.filter(a => a.critical && !this.isComplete(a)),
    };
    const meta = {
      completed: ['✅', TX('مكتملة', 'Completed'), '#34d399'],
      upcoming: ['📅', TX('قادمة', 'Upcoming'), '#60a5fa'],
      delayed: ['🔴', TX('متأخرة', 'Delayed'), '#f87171'],
      critical: ['🔥', TX('حرجة', 'Critical'), '#c084fc'],
    };
    const fSel = this._msTab || 'all';
    const shown = fSel === 'all' ? ms : groups[fSel];
    b.innerHTML = `
      <div class="grid g4" style="margin-bottom:14px">
        ${Object.keys(groups).map(k => `<div class="kpi" style="--kc:${meta[k][2]};cursor:pointer" data-ms="${k}">
          <div class="k-label">${meta[k][1]}</div><div class="k-value">${groups[k].length}</div><div class="k-ico">${meta[k][0]}</div>
          <div class="k-sub">${ms.length ? Math.round(groups[k].length / ms.length * 100) : 0}% ${TX('من المعالم', 'of milestones')}</div></div>`).join('')}
      </div>
      <div class="flex" style="gap:8px;margin-bottom:10px">
        <button class="btn sm ${fSel === 'all' ? 'primary' : ''}" data-ms="all">${t('all')} (${ms.length})</button>
        ${Object.keys(groups).map(k => `<button class="btn sm ${fSel === k ? 'primary' : ''}" data-ms="${k}">${meta[k][0]} ${meta[k][1]}</button>`).join('')}
      </div>
      <div class="panel" style="padding:6px 14px;overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>${TX('المعلم', 'Milestone')}</th><th>${TX('المنطقة', 'Zone')}</th><th>${TX('التاريخ الأساسي', 'BL Date')}</th>
          <th>${TX('التاريخ الحالي', 'Current Date')}</th><th>${TX('الانحراف', 'Variance')}</th><th>${t('status')}</th>
        </tr></thead><tbody>
        ${shown.sort((x, y) => (x.finish || '').localeCompare(y.finish || '')).map(a => {
          const v = a.baselineFinish && a.finish ? schDaysBetween(a.baselineFinish, a.finish) : 0;
          const sk = this.statusKey(a);
          return `<tr data-id="${a.id}">
            <td class="fs12 b">🏁 ${esc(a.name)}<div class="fs11 mut">${esc(a.activityId)}</div></td>
            <td class="fs12">${esc(this.zoneName(a.zone) || '—')}</td>
            <td class="fs12">${UI.fmtDate(a.baselineFinish)}</td>
            <td class="fs12">${UI.fmtDate(a.finish)}</td>
            <td>${v > 0 ? `<span class="chip" style="--cc:#f87171">+${v}${TX('ي', 'd')}</span>` : v < 0 ? `<span class="chip" style="--cc:#34d399">${v}${TX('ي', 'd')}</span>` : '—'}</td>
            <td><span class="chip" style="--cc:${this.statusColor(sk)}">${this.statusLabel(sk)}</span></td>
          </tr>`;
        }).join('')}
        </tbody></table>
        ${!shown.length ? UI.empty('🏁') : ''}
      </div>`;
    b.querySelectorAll('[data-ms]').forEach(el => el.onclick = () => { this._msTab = el.dataset.ms; this.milestonesView(b, rr); });
    b.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => this.activityDetail(tr.dataset.id, rr));
  },

  /* ================= 8. interactive timeline ================= */
  timelineView(b, rr) {
    const ctx = this.guard(b, rr); if (!ctx) return;
    const { acts } = ctx;
    const lanes = [
      { key: 'done', icon: '✅', label: TX('تم إنجازه', 'Completed'), color: '#34d399',
        items: acts.filter(a => this.isComplete(a)).sort((x, y) => (y.actualFinish || y.finish || '').localeCompare(x.actualFinish || x.finish || '')).slice(0, 25) },
      { key: 'now', icon: '🚧', label: TX('قيد التنفيذ الآن', 'In Progress Now'), color: '#f5b942',
        items: acts.filter(a => this.statusKey(a) === 'progress').sort((x, y) => (y.pctComplete || 0) - (x.pctComplete || 0)).slice(0, 25) },
      { key: 'soon', icon: '⏭️', label: TX('قريباً (30 يوم)', 'Coming Soon (30d)'), color: '#60a5fa',
        items: acts.filter(a => this.statusKey(a) === 'notstarted' && this.dueWithin(a, 30)).sort((x, y) => (x.start || '').localeCompare(y.start || '')).slice(0, 25) },
      { key: 'late', icon: '🔴', label: TX('متأخر', 'Delayed'), color: '#f87171',
        items: acts.filter(a => this.isDelayed(a)).sort((x, y) => this.delayDays(y) - this.delayDays(x)).slice(0, 25) },
    ];
    b.innerHTML = `<div class="grid g4" style="align-items:start">
      ${lanes.map(l => `<div class="sch-lane" style="border-top:3px solid ${l.color}">
        <div class="flex" style="justify-content:space-between;margin-bottom:8px"><b>${l.icon} ${l.label}</b><span class="chip" style="--cc:${l.color}">${l.items.length}</span></div>
        ${l.items.map(a => `<div class="sch-card" data-id="${a.id}">
          <div class="b">${a.milestone ? '🏁 ' : ''}${a.critical ? '🔥 ' : ''}${esc(a.name).slice(0, 60)}</div>
          <div class="fs11 mut">${esc(a.activityId)} · ${UI.fmtDate(l.key === 'soon' ? a.start : a.finish)}</div>
          <div class="sch-pb" style="margin-top:4px"><i style="width:${Math.min(100, a.pctComplete || 0)}%;background:${l.color}"></i></div>
          ${l.key === 'late' ? `<span class="chip" style="--cc:#f87171;margin-top:4px">+${this.delayDays(a)}${TX('ي', 'd')}</span>` : ''}
        </div>`).join('') || `<div class="fs12 mut">${TX('لا شيء', 'Nothing here')}</div>`}
      </div>`).join('')}
    </div>`;
    b.querySelectorAll('.sch-card').forEach(el => el.onclick = () => this.activityDetail(el.dataset.id, rr));
  },

  /* ================= 9. contractor & zone boards ================= */
  boardsView(b, rr) {
    const ctx = this.guard(b, rr); if (!ctx) return;
    const { acts } = ctx;
    const rowsFor = (keyFn, nameFn, list) => list.map(id => {
      const items = acts.filter(a => keyFn(a) === id);
      if (!items.length) return null;
      const pct = Math.round(items.reduce((s, a) => s + (a.pctComplete || 0), 0) / items.length);
      const issues = new Set(); items.forEach(a => (a.linkedConstraints || []).forEach(c => issues.add(c)));
      return { id, name: nameFn(id), total: items.length, delayed: items.filter(a => this.isDelayed(a)).length,
        critical: items.filter(a => a.critical && !this.isComplete(a)).length, pct, issues: issues.size };
    }).filter(Boolean).sort((x, y) => y.delayed - x.delayed);
    const contrIds = [...new Set(acts.map(a => a.contractor).filter(Boolean))];
    const zoneIds = [...new Set(acts.map(a => a.zone).filter(Boolean))];
    const contr = rowsFor(a => a.contractor, id => this.orgName(id) || id, contrIds);
    const zones = rowsFor(a => a.zone, id => this.zoneName(id) || id, zoneIds);
    const tbl = (rows, nameLbl) => `<table class="tbl"><thead><tr>
        <th>${nameLbl}</th><th>${TX('الأنشطة', 'Activities')}</th><th>${TX('متأخرة', 'Delayed')}</th>
        <th>${TX('حرجة', 'Critical')}</th><th>${TX('الإنجاز', 'Progress')}</th><th>${TX('معوقات', 'Issues')}</th>
      </tr></thead><tbody>
      ${rows.map(r => `<tr>
        <td class="fs12 b">${esc(r.name)}</td><td class="fs12">${r.total}</td>
        <td>${r.delayed ? `<span class="chip" style="--cc:#f87171">${r.delayed}</span>` : '0'}</td>
        <td>${r.critical ? `<span class="chip" style="--cc:#c084fc">${r.critical}</span>` : '0'}</td>
        <td><div class="flex" style="gap:6px"><div class="sch-pb"><i style="width:${r.pct}%;background:var(--accent)"></i></div><span class="fs12">${r.pct}%</span></div></td>
        <td class="fs12">${r.issues || '—'}</td>
      </tr>`).join('')}</tbody></table>`;
    b.innerHTML = `
      <div class="panel" style="margin-bottom:14px;padding:6px 14px;overflow-x:auto">
        <div class="panel-h"><span>🏗️</span><h3>${TX('لوحة المقاولين', 'Contractors Board')}</h3></div>
        ${contr.length ? tbl(contr, TX('المقاول', 'Contractor')) : UI.empty('🏗️', TX('اربط الأنشطة بالمقاولين من صفحة تفاصيل النشاط', 'Assign contractors from the activity detail page'))}
      </div>
      <div class="panel" style="padding:6px 14px;overflow-x:auto">
        <div class="panel-h"><span>📍</span><h3>${TX('لوحة المناطق', 'Zones Board')}</h3></div>
        ${zones.length ? tbl(zones, TX('المنطقة', 'Zone')) : UI.empty('📍')}
      </div>`;
  },

  /* ================= 10. map ================= */
  mapView(b, rr) {
    const ctx = this.guard(b, rr); if (!ctx) return;
    const pts = [];
    ctx.acts.forEach(a => {
      const m = (a.gps || '').match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
      if (!m) return;
      const sk = this.statusKey(a);
      pts.push({ id: a.id, kind: 'act', lat: +m[1], lng: +m[2], color: a.critical && !this.isComplete(a) ? '#c084fc' : this.statusColor(sk) === '#94a3b8' ? '#f5b942' : this.statusColor(sk), label: `${a.activityId} — ${a.name}` });
    });
    Store.list('constraint').forEach(c => {
      const m = (c.gps || '').match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
      if (!m) return;
      pts.push({ id: c.id, kind: 'con', lat: +m[1], lng: +m[2], color: Store.isClosed('constraint', c) ? '#34d399' : '#f87171', label: `🚩 ${c.ref} — ${c.title}` });
    });
    if (!pts.length) {
      b.innerHTML = `<div class="panel" style="padding:40px;text-align:center"><div style="font-size:42px">🗺️</div>
        <h3>${TX('لا توجد إحداثيات بعد', 'No coordinates yet')}</h3>
        <p class="mut">${TX('أضف إحداثيات GPS للأنشطة من صفحة التفاصيل أو للمعوقات من نموذج الإنشاء لعرضها هنا.', 'Add GPS coordinates to activities (detail page) or issues (create form) to plot them here.')}</p></div>`;
      return;
    }
    const lats = pts.map(p => p.lat), lngs = pts.map(p => p.lng);
    const mnLa = Math.min(...lats), mxLa = Math.max(...lats), mnLo = Math.min(...lngs), mxLo = Math.max(...lngs);
    const W = 900, H = 520, P = 40;
    const X = lng => P + (mxLo === mnLo ? .5 : (lng - mnLo) / (mxLo - mnLo)) * (W - 2 * P);
    const Y = lat => H - P - (mxLa === mnLa ? .5 : (lat - mnLa) / (mxLa - mnLa)) * (H - 2 * P);
    b.innerHTML = `
      <div class="flex fs11 mut" style="gap:14px;margin-bottom:8px;flex-wrap:wrap">
        <span>🟢 ${TX('مكتمل', 'Completed')}</span><span>🟡 ${TX('جاري', 'In progress')}</span>
        <span>🔴 ${TX('متأخر / معوق مفتوح', 'Delayed / open issue')}</span><span>🟣 ${TX('حرج', 'Critical')}</span>
      </div>
      <div class="sch-mapwrap">
        <svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block">
          <defs><pattern id="schgrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="currentColor" stroke-opacity=".07"/></pattern></defs>
          <rect width="${W}" height="${H}" fill="url(#schgrid)"/>
          ${pts.map(p => `<circle data-id="${p.id}" data-kind="${p.kind}" cx="${X(p.lng).toFixed(1)}" cy="${Y(p.lat).toFixed(1)}"
            r="${p.kind === 'con' ? 7 : 9}" fill="${p.color}" fill-opacity=".85" stroke="#fff" stroke-width="1.5">
            <title>${esc(p.label)}</title></circle>`).join('')}
        </svg>
      </div>
      <div class="fs11 mut mt8">${pts.filter(p => p.kind === 'act').length} ${TX('نشاط', 'activities')} · ${pts.filter(p => p.kind === 'con').length} ${TX('معوق', 'issues')}</div>`;
    b.querySelectorAll('circle[data-id]').forEach(c => c.onclick = () => {
      if (c.dataset.kind === 'act') this.activityDetail(c.dataset.id, rr);
      else if (typeof ModTracker !== 'undefined' && ModTracker.openDetail) ModTracker.openDetail(c.dataset.id, () => rr());
    });
  },

  relRow(a, link) {
    const target = Store.scheduleActivities(a.fileId).find(x => x.activityId === link.code);
    const nm = target ? target.name : link.code;
    const sk = target ? this.statusKey(target) : 'notstarted';
    return `<div class="sch-card" data-relcode="${esc(link.code)}" style="display:flex;justify-content:space-between;gap:6px;align-items:center">
      <span><span class="chip" style="--cc:#60a5fa">${link.type}${link.lag ? (link.lag > 0 ? '+' : '') + link.lag : ''}</span>
        <b class="fs11">${esc(link.code)}</b> ${esc(String(nm).slice(0, 32))}</span>
      <span class="chip" style="--cc:${this.statusColor(sk)}">${target ? Math.round(target.pctComplete || 0) + '%' : '↗'}</span></div>`;
  },

  activityTimeline(a) {
    const ev = [];
    if (a.actualStart) ev.push(['▶️', TX('بدأ التنفيذ فعلياً', 'Actually started'), a.actualStart]);
    else if (a.start) ev.push(['📅', TX('بداية مخططة', 'Planned start'), a.start]);
    if (a.baselineFinish) ev.push(['🎯', TX('النهاية الأساسية', 'Baseline finish'), a.baselineFinish]);
    if (a.actualFinish) ev.push(['🏁', TX('اكتمل', 'Completed'), a.actualFinish]);
    else if (a.finish) ev.push(['⏳', TX('نهاية متوقعة', 'Forecast finish'), a.forecastFinish || a.finish]);
    const audit = Store.scheduleAuditLog().filter(e => e.activityId === a.id);
    const lastEdit = audit[0];
    if (lastEdit) ev.push(['✏️', `${TX('آخر تحديث', 'Last update')}: ${esc(lastEdit.field || lastEdit.action)}`, (lastEdit.at || '').slice(0, 10)]);
    const lastAtt = (a.attachments || []).slice().sort((x, y) => (y.at || '').localeCompare(x.at || ''))[0];
    if (lastAtt) ev.push(['📎', `${TX('آخر مرفق', 'Last attachment')}: ${esc(lastAtt.name)}`, (lastAtt.at || '').slice(0, 10)]);
    if (a.notes) ev.push(['💬', `${TX('ملاحظة', 'Note')}: ${esc(a.notes.slice(0, 40))}`, '']);
    const issues = (a.linkedConstraints || []).map(id => Store.get('constraint', id)).filter(Boolean).sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || ''));
    if (issues[0]) ev.push(['🚩', `${TX('آخر معوق مرتبط', 'Last linked issue')}: ${esc(issues[0].title)}`, (issues[0].createdAt || '').slice(0, 10)]);
    const sorted = ev.filter(e => e[2]).sort((x, y) => (x[2] || '').localeCompare(y[2] || '')).concat(ev.filter(e => !e[2]));
    if (!sorted.length) return `<div class="fs12 mut">${TX('لا توجد أحداث', 'No events')}</div>`;
    return `<div style="border-${LANG === 'ar' ? 'right' : 'left'}:2px solid var(--bd);padding-${LANG === 'ar' ? 'right' : 'left'}:12px;margin-top:4px">
      ${sorted.map(e => `<div class="flex" style="gap:8px;padding:4px 0;align-items:baseline">
        <span>${e[0]}</span><span class="fs12" style="flex:1">${e[1]}</span><span class="fs11 mut">${e[2] ? UI.fmtDate(e[2]) : ''}</span></div>`).join('')}</div>`;
  },

  /* ================= activity detail (360°) ================= */
  activityDetail(id, rr) {
    const a = Store.db.schedule.activities.find(x => x.id === id); if (!a) return;
    this.ensureDefaults([a]);
    const sk = this.statusKey(a);
    const zones = Store.getMasterList('zones', { includeArchived: true });
    const streets = Store.getMasterList('streets', { includeArchived: true }).filter(s => !a.zone || s.zone === a.zone);
    const contractors = Store.getProjectOrgs('contractor');
    const consultants = Store.getProjectOrgs('consultant');
    const constraints = Store.list('constraint');
    const audit = Store.scheduleAuditLog().filter(e => e.activityId === a.id).slice(0, 15);
    const info = (l, v) => `<div><div class="fs11 mut">${l}</div><div class="b fs13">${v || '—'}</div></div>`;
    const dr = UI.drawer(`
      <div style="padding:20px 22px;overflow-y:auto;height:100%">
        <div class="flex" style="justify-content:space-between;align-items:flex-start">
          <div><h2 style="margin:0">${a.milestone ? '🏁 ' : ''}${a.critical ? '🔥 ' : ''}${esc(a.name)}</h2>
            <div class="fs12 mut">${esc(a.activityId)} · ${esc(a.wbs || '')} ·
              <span class="chip" style="--cc:${this.statusColor(sk)}">${this.statusLabel(sk)}</span>
              ${this.isDelayed(a) ? `<span class="chip" style="--cc:#f87171">+${this.delayDays(a)}${TX('ي', 'd')}</span>` : ''}</div></div>
          <button class="btn sm" data-close>✕</button>
        </div>

        <div class="grid g3" style="margin-top:14px;gap:10px">
          ${info('Baseline Start', UI.fmtDate(a.baselineStart))}${info('Baseline Finish', UI.fmtDate(a.baselineFinish))}${info('WBS', esc(a.wbs || '—'))}
          ${info(TX('المدة الأصلية', 'Original Duration'), `${a.duration} ${TX('يوم', 'd')}`)}${info(TX('المدة المتبقية', 'Remaining Duration'), `${a.remainingDuration != null ? a.remainingDuration : a.duration} ${TX('يوم', 'd')}`)}${info('Float', `${a.float != null ? a.float : '—'} ${a.critical ? '🔥 Critical' : ''}`)}
          ${info(TX('البداية الحالية', 'Current Start'), UI.fmtDate(a.start))}${info(TX('النهاية الحالية', 'Current Finish'), UI.fmtDate(a.finish))}${info(TX('الإحداثيات', 'GPS'), esc(a.gps || '—'))}
          ${info(TX('البداية الفعلية', 'Actual Start'), UI.fmtDate(a.actualStart))}${info(TX('النهاية الفعلية', 'Actual Finish'), UI.fmtDate(a.actualFinish))}${info(TX('الإنجاز', 'Progress'), `${Math.round(a.pctComplete || 0)}%`)}
        </div>

        <div class="section-t" style="margin-top:16px">🔮 ${TX('التوقع والأطراف والموقع', 'Forecast, Parties & Location')}</div>
        <div class="grid g2" style="gap:10px">
          <div><label class="fl">Forecast Start</label><input type="date" class="input" id="av-fs" value="${esc(a.forecastStart || '')}"></div>
          <div><label class="fl">Forecast Finish</label><input type="date" class="input" id="av-ff" value="${esc(a.forecastFinish || '')}"></div>
          <div><label class="fl">${TX('المقاول', 'Contractor')}</label>
            <select class="input" id="av-co"><option value="">—</option>${contractors.map(c => `<option value="${c.id}" ${a.contractor === c.id ? 'selected' : ''}>${esc(LANG === 'ar' ? c.name : (c.nameEn || c.name))}</option>`).join('')}</select></div>
          <div><label class="fl">${TX('الاستشاري', 'Consultant')}</label>
            <select class="input" id="av-cs"><option value="">—</option>${consultants.map(c => `<option value="${c.id}" ${a.consultant === c.id ? 'selected' : ''}>${esc(LANG === 'ar' ? c.name : (c.nameEn || c.name))}</option>`).join('')}</select></div>
          <div><label class="fl">${TX('المنطقة', 'Zone')}</label>
            <select class="input" id="av-zone"><option value="">—</option>${zones.map(z => `<option value="${z.id}" ${a.zone === z.id ? 'selected' : ''}>${esc(z.name)}</option>`).join('')}</select></div>
          <div><label class="fl">${TX('الشارع', 'Street')}</label>
            <select class="input" id="av-street"><option value="">—</option>${streets.map(s => `<option value="${s.id}" ${a.street === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
          <div><label class="fl">${TX('النظام', 'System')}</label>
            <select class="input" id="av-sys">${this.SYSTEMS.map(s => `<option value="${s.key}" ${a.system === s.key ? 'selected' : ''}>${s.icon} ${s.label()}</option>`).join('')}</select></div>
          <div><label class="fl">GPS (lat, lng)</label><input class="input" id="av-gps" value="${esc(a.gps || '')}" placeholder="24.7136, 46.6753"></div>
        </div>
        <div class="flex" style="gap:14px;margin-top:8px">
          <label class="fs12 flex" style="gap:5px"><input type="checkbox" id="av-na" ${a.needsApproval ? 'checked' : ''}>🟠 ${TX('يحتاج اعتماد', 'Needs approval')}</label>
          <label class="fs12 flex" style="gap:5px"><input type="checkbox" id="av-nm" ${a.needsMaterials ? 'checked' : ''}>📦 ${TX('يحتاج مواد', 'Needs materials')}</label>
          <label class="fs12 flex" style="gap:5px"><input type="checkbox" id="av-nc" ${a.needsAccess ? 'checked' : ''}>🛣️ ${TX('يحتاج إتاحة', 'Needs access')}</label>
        </div>
        <div style="margin-top:10px"><label class="fl">${TX('ملاحظات', 'Notes')}</label>
          <textarea class="input" id="av-notes" rows="2">${esc(a.notes || '')}</textarea></div>

        <div class="section-t" style="margin-top:16px">🔗 ${TX('العلاقات المنطقية', 'Logic Relationships')}</div>
        <div class="grid g2" style="gap:14px">
          <div><div class="fs11 mut" style="margin-bottom:4px">⬅️ ${TX('السوابق (Predecessors)', 'Predecessors')} (${(a.predecessors || []).length})</div>
            ${(a.predecessors || []).map(p => this.relRow(a, p)).join('') || `<div class="fs12 mut">${TX('لا يوجد', 'None')}</div>`}</div>
          <div><div class="fs11 mut" style="margin-bottom:4px">➡️ ${TX('اللواحق (Successors)', 'Successors')} (${(a.successors || []).length})</div>
            ${(a.successors || []).map(s => this.relRow(a, s)).join('') || `<div class="fs12 mut">${TX('لا يوجد', 'None')}</div>`}</div>
        </div>

        <div class="section-t" style="margin-top:16px">🧭 ${TX('الخط الزمني للنشاط', 'Activity Timeline')}</div>
        ${this.activityTimeline(a)}

        <div class="section-t" style="margin-top:16px">🚩 ${TX('المعوقات المرتبطة', 'Linked Issues')}</div>
        ${(a.linkedConstraints || []).map(cid => { const c = Store.get('constraint', cid); if (!c) return '';
          return `<div class="flex fs12" style="justify-content:space-between;border-bottom:1px dashed var(--bd);padding:5px 0">
            <span>${esc(c.ref)} — ${esc(c.title)}</span>
            <span>${UI.statusChip('constraint', c.status)} ${c.responsibleParty ? `<span class="fs11 mut">${esc(Store.respPartyLabel(c.responsibleParty))}</span>` : ''}</span></div>`; }).join('') || `<div class="fs12 mut">${TX('لا يوجد', 'None')}</div>`}
        <select class="input" id="av-cons" multiple style="height:90px;margin-top:8px">
          ${constraints.map(c => `<option value="${c.id}" ${(a.linkedConstraints || []).includes(c.id) ? 'selected' : ''}>${esc(c.ref)} — ${esc(c.title)}</option>`).join('')}
        </select>

        <div class="section-t" style="margin-top:16px">🔗 ${TX('سجلات مرتبطة', 'Linked Records')}</div>
        ${this.LINK_TYPES.map(lt => {
          const recs = Store.list(lt.type);
          if (!recs.length) return '';
          const sel = (a.linkedRecords || []).filter(x => x.type === lt.type).map(x => x.id);
          return `<div style="margin-bottom:8px"><label class="fl">${lt.icon} ${lt.label()}</label>
            <select class="input" multiple data-lt="${lt.type}" style="height:64px">
              ${recs.map(r => `<option value="${r.id}" ${sel.includes(r.id) ? 'selected' : ''}>${esc(r.ref || '')} ${esc(r.title || r.subject || r.name || '')}</option>`).join('')}</select></div>`;
        }).join('')}

        <div class="section-t" style="margin-top:16px">📎 ${TX('المرفقات', 'Attachments')} (${(a.attachments || []).length})</div>
        <div id="av-att-list">${this.attachmentRows(a)}</div>
        <label class="btn sm" style="cursor:pointer;margin-top:6px">📤 ${TX('إضافة مرفق', 'Add attachment')}
          <input type="file" id="av-att" style="display:none" multiple></label>

        ${audit.length ? `<div class="section-t" style="margin-top:16px">🧾 ${TX('سجل التدقيق', 'Audit Trail')}</div>
        ${audit.map(e => `<div class="fs11" style="border-bottom:1px dashed var(--bd);padding:4px 0">
          <b>${esc(e.field || e.action)}</b>: <span class="mut">${esc((e.oldVal || '—').slice(0, 40))}</span> ← <b>${esc((e.newVal || '—').slice(0, 40))}</b>
          <span class="mut">· ${esc(Store.userName(e.by))} · ${esc((e.at || '').slice(0, 16).replace('T', ' '))}</span></div>`).join('')}` : ''}

        <div class="flex" style="justify-content:flex-end;margin-top:18px;gap:8px">
          <button class="btn" data-close>${t('cancel')}</button>
          <button class="btn primary" id="av-save">${t('save')}</button>
        </div>
      </div>`);
    const el = dr.el;
    el.querySelectorAll('[data-relcode]').forEach(r => r.onclick = () => {
      const target = Store.scheduleActivities(a.fileId).find(x => x.activityId === r.dataset.relcode);
      if (target) { dr.close(); this.activityDetail(target.id, rr); }
    });
    el.querySelector('#av-zone').onchange = () => {
      Store.updateScheduleActivity(id, { zone: el.querySelector('#av-zone').value, street: '' });
      dr.close(); this.activityDetail(id, rr);
    };
    el.querySelector('#av-att').onchange = () => {
      const files = [...el.querySelector('#av-att').files];
      let pend = files.length;
      files.forEach(file => {
        if (file.size > 4 * 1024 * 1024) { UI.toast(TX('الملف أكبر من 4MB', 'File exceeds 4MB'), 'err'); if (!--pend) {} return; }
        const fr = new FileReader();
        fr.onload = () => {
          (a.attachments = a.attachments || []).push({
            id: uid('att'), name: file.name, type: file.type || file.name.split('.').pop(), size: file.size,
            dataUrl: fr.result, by: Store.db.currentUserId, at: new Date().toISOString(), versions: [],
          });
          Store.scheduleAudit(a.fileId, 'edited', `📎 ${TX('إضافة مرفق', 'Attachment added')}: ${file.name}`, { activityId: a.id, activityName: a.name, field: 'attachments' });
          Store.save();
          if (!--pend) { el.querySelector('#av-att-list').innerHTML = this.attachmentRows(a); this.bindAttachments(el, a, id, rr); }
        };
        fr.readAsDataURL(file);
      });
    };
    this.bindAttachments(el, a, id, rr);
    el.querySelector('#av-save').onclick = () => {
      const linkedRecords = [];
      el.querySelectorAll('[data-lt]').forEach(s => [...s.selectedOptions].forEach(o => linkedRecords.push({ type: s.dataset.lt, id: o.value })));
      Store.updateScheduleActivity(id, {
        forecastStart: el.querySelector('#av-fs').value, forecastFinish: el.querySelector('#av-ff').value,
        contractor: el.querySelector('#av-co').value, consultant: el.querySelector('#av-cs').value,
        zone: el.querySelector('#av-zone').value, street: el.querySelector('#av-street').value,
        system: el.querySelector('#av-sys').value, gps: el.querySelector('#av-gps').value.trim(),
        needsApproval: el.querySelector('#av-na').checked, needsMaterials: el.querySelector('#av-nm').checked, needsAccess: el.querySelector('#av-nc').checked,
        notes: el.querySelector('#av-notes').value.trim(),
        linkedConstraints: [...el.querySelector('#av-cons').selectedOptions].map(o => o.value),
        linkedRecords,
      });
      dr.close(); UI.toast(t('saved')); rr();
    };
  },

  attachmentRows(a) {
    return (a.attachments || []).map(att => `
      <div class="flex fs12" style="justify-content:space-between;border-bottom:1px dashed var(--bd);padding:5px 0;flex-wrap:wrap" data-att="${att.id}">
        <div><b>${esc(att.name)}</b> <span class="fs11 mut">(${(att.size / 1024).toFixed(0)}KB · ${esc(String(att.type || '').slice(0, 20))})</span>
          <div class="fs11 mut">${esc(Store.userName(att.by))} · ${esc((att.at || '').slice(0, 16).replace('T', ' '))}
            ${(att.versions || []).length ? ` · ${TX('النسخ', 'versions')}: ${att.versions.length + 1}` : ''}</div></div>
        <div class="flex" style="gap:4px">
          <button class="btn sm" data-aview>${TX('عرض', 'View')}</button>
          <button class="btn sm" data-adl>⬇</button>
          <label class="btn sm" style="cursor:pointer">♻️<input type="file" data-arep style="display:none"></label>
          <button class="btn sm danger" data-adel>🗑</button>
        </div>
      </div>`).join('') || `<div class="fs12 mut">${TX('لا توجد مرفقات', 'No attachments')}</div>`;
  },

  bindAttachments(el, a, id, rr) {
    el.querySelectorAll('[data-att]').forEach(row => {
      const att = (a.attachments || []).find(x => x.id === row.dataset.att); if (!att) return;
      row.querySelector('[data-aview]').onclick = () => { const w = window.open(); w.document.write(`<iframe src="${att.dataUrl}" style="width:100%;height:100%;border:0"></iframe>`); };
      row.querySelector('[data-adl]').onclick = () => { const x = document.createElement('a'); x.href = att.dataUrl; x.download = att.name; x.click(); };
      row.querySelector('[data-arep]').onchange = e => {
        const file = e.target.files[0]; if (!file) return;
        const fr = new FileReader();
        fr.onload = () => {
          (att.versions = att.versions || []).push({ name: att.name, dataUrl: att.dataUrl, at: att.at, by: att.by });
          Object.assign(att, { name: file.name, dataUrl: fr.result, size: file.size, at: new Date().toISOString(), by: Store.db.currentUserId });
          Store.scheduleAudit(a.fileId, 'edited', `♻️ ${TX('استبدال مرفق', 'Attachment replaced')}: ${file.name}`, { activityId: a.id, activityName: a.name, field: 'attachments' });
          Store.save(); el.querySelector('#av-att-list').innerHTML = this.attachmentRows(a); this.bindAttachments(el, a, id, rr);
        };
        fr.readAsDataURL(file);
      };
      row.querySelector('[data-adel]').onclick = () => UI.confirm(t('confirmDelete'), () => {
        a.attachments = a.attachments.filter(x => x.id !== att.id);
        Store.scheduleAudit(a.fileId, 'edited', `🗑 ${TX('حذف مرفق', 'Attachment deleted')}: ${att.name}`, { activityId: a.id, activityName: a.name, field: 'attachments' });
        Store.save(); el.querySelector('#av-att-list').innerHTML = this.attachmentRows(a); this.bindAttachments(el, a, id, rr);
      });
    });
  },

  /* ================= 11. files / versions / audit ================= */
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
        <div class="flex" style="justify-content:space-between;margin-top:10px">
          <span class="fs11 mut">${TX('يتم تلقائياً: بناء الهيكل، تصنيف الأنظمة، ربط المناطق/الشوارع، استخراج الحرجة والمعالم وحساب التأخيرات.', 'Automatic: structure build, system classification, zone/street matching, critical & milestone extraction, delay computation.')}</span>
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
          <td class="fs12">${esc(f.uploaderName || Store.userName(f.uploadedBy))}${f.email ? `<div class="fs11 mut">${esc(f.email)}</div>` : ''}</td>
          <td class="fs11 mut">${esc((f.uploadedAt || '').slice(0, 16).replace('T', ' '))}</td>
          <td class="fs12">${Store.db.schedule.activities.filter(a => a.fileId === f.id).length}</td>
          <td><span class="chip" style="--cc:${f.status === 'active' ? '#34d399' : f.status === 'archived' ? '#f87171' : '#94a3b8'}">${
            f.status === 'active' ? TX('الحالي', 'Current') : f.status === 'archived' ? TX('مؤرشف', 'Archived') : TX('سابق', 'Superseded')}</span></td>
          <td class="fs12" style="white-space:nowrap">
            ${f.status !== 'active' ? `<button class="btn sm" data-act="setcurrent">↩️</button>` : ''}
            ${f.status === 'archived' ? `<button class="btn sm" data-act="restore">♻️</button>` : `<button class="btn sm" data-act="archive">🗄</button>`}
            ${f.status === 'archived' && Store.isAdmin() ? `<button class="btn sm danger" data-act="delete">🗑</button>` : ''}
            ${files.length > 1 && f.status !== 'active' ? `<button class="btn sm" data-act="compare">⇄</button>` : ''}
          </td>
        </tr>`).join('')}
        </tbody></table>
        ${!files.length ? UI.empty('📁') : ''}
      </div>
      <div class="panel" style="padding:6px 14px;overflow-x:auto">
        <div class="panel-h"><span>🧾</span><h3>${TX('سجل التدقيق الكامل', 'Full Audit Trail')}</h3></div>
        <table class="tbl"><thead><tr>
          <th>${TX('الإجراء', 'Action')}</th><th>${TX('النشاط/الحقل', 'Activity/Field')}</th><th>${TX('القيمة القديمة', 'Old')}</th><th>${TX('القيمة الجديدة', 'New')}</th>
          <th>${TX('بواسطة', 'By')}</th><th>${TX('الوقت', 'Time')}</th>
        </tr></thead><tbody>
        ${audit.slice(0, 60).map(e => `<tr>
          <td class="fs12">${this.auditLabel(e.action)}${e.notes ? `<div class="fs11 mut">${esc(e.notes)}</div>` : ''}</td>
          <td class="fs12">${e.activityName ? `${esc(e.activityName).slice(0, 30)}<div class="fs11 mut">${esc(e.field || '')}</div>` : '—'}</td>
          <td class="fs11 mut">${esc((e.oldVal || '—').slice(0, 30))}</td>
          <td class="fs11 b">${esc((e.newVal || '—').slice(0, 30))}</td>
          <td class="fs12">${esc(Store.userName(e.by))}</td>
          <td class="fs11 mut">${esc((e.at || '').slice(0, 16).replace('T', ' '))}</td>
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
    const map = { uploaded: TX('رفع ملف', 'File uploaded'), archived: TX('أرشفة', 'Archived'), restored: TX('استعادة/اعتماد', 'Restored/Set current'), deleted: TX('حذف نهائي', 'Permanently deleted'), edited: TX('تعديل', 'Edited') };
    return map[action] || action;
  },

  bindUpload(b, rr, sel) {
    const fileInput = b.querySelector(sel ? sel.fileInput : '#sc-upload-empty');
    if (!fileInput) return;
    const go = async () => {
      const file = fileInput.files[0];
      if (!file) return UI.toast(TX('اختر ملفاً أولاً', 'Select a file first'), 'err');
      try {
        const parsed = await SchParse.parse(file);
        const acts = this.enrichOnUpload(parsed);
        if (!acts.length) throw new Error('empty');
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const meta = {
          name: file.name, type: ext, size: file.size,
          company: sel ? b.querySelector(sel.company).value.trim() : '',
          uploaderName: sel ? b.querySelector(sel.uploader).value.trim() : Store.userName(Store.db.currentUserId),
          email: sel ? b.querySelector(sel.email).value.trim() : '',
          position: sel ? b.querySelector(sel.position).value.trim() : '',
          notes: sel ? b.querySelector(sel.notes).value.trim() : '',
          relationships: parsed.relationships || [], wbsTree: parsed.wbs || [],
          calendars: parsed.calendars || [], resources: parsed.resources || [], hasBaseline: !!parsed.hasBaseline,
        };
        Store.addScheduleFile(meta, acts);
        const rc = (parsed.relationships || []).length, wc = (parsed.wbs || []).length;
        UI.toast(TX(`تم استيراد ${acts.length} نشاط · ${wc} WBS · ${rc} علاقة وبناء اللوحات تلقائياً`,
          `Imported ${acts.length} activities · ${wc} WBS · ${rc} relationships — dashboards built`));
        rr();
      } catch (err) {
        UI.toast(TX('تعذر تحليل الملف. الصيغ المدعومة: XER / XML / XLSX.', 'Could not parse the file. Supported: XER / XML / XLSX.'), 'err');
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
    const added = [...map2.values()].filter(a => !map1.has(a.activityId));
    const removed = [...map1.values()].filter(a => !map2.has(a.activityId));
    const durCh = [], startCh = [], finishCh = [];
    let newDelayed = 0, newCritical = 0;
    map2.forEach((a, k) => {
      const o = map1.get(k); if (!o) return;
      if (this.isDelayed(a) && !this.isDelayed(o)) newDelayed++;
      if (a.critical && !o.critical) newCritical++;
      if ((a.duration || 0) !== (o.duration || 0)) durCh.push({ a, o, d: (a.duration || 0) - (o.duration || 0) });
      if (a.start !== o.start) startCh.push({ a, o, d: schDaysBetween(o.start, a.start) });
      if (a.finish !== o.finish) finishCh.push({ a, o, d: schDaysBetween(o.finish, a.finish) });
    });
    const lst = (items, fmt) => items.slice(0, 8).map(fmt).join('') + (items.length > 8 ? `<div class="fs11 mut">+${items.length - 8} ${TX('أخرى', 'more')}</div>` : '') || `<div class="fs12 mut">${TX('لا شيء', 'None')}</div>`;
    const aLine = a => `<div class="fs12" style="padding:3px 0;border-bottom:1px dashed var(--bd)">${esc(a.activityId)} — ${esc(a.name).slice(0, 45)}</div>`;
    const dLine = x => `<div class="fs12 flex" style="justify-content:space-between;padding:3px 0;border-bottom:1px dashed var(--bd)">
      <span>${esc(x.a.activityId)} — ${esc(x.a.name).slice(0, 38)}</span><span class="chip" style="--cc:${x.d > 0 ? '#f87171' : '#34d399'}">${x.d > 0 ? '+' : ''}${x.d}${TX('ي', 'd')}</span></div>`;
    UI.modal(`
      <div style="padding:22px;max-width:680px;max-height:80vh;overflow:auto">
        <h2 style="margin:0">⇄ ${TX('مقارنة الإصدارات', 'Version Comparison')}</h2>
        <div class="fs12 mut">Rev.${other.revision} ← Rev.${cur.revision}</div>
        <div class="grid g4" style="margin-top:14px;gap:8px">
          <div class="kpi"><div class="k-label">${TX('مضافة', 'Added')}</div><div class="k-value">${added.length}</div></div>
          <div class="kpi"><div class="k-label">${TX('محذوفة', 'Removed')}</div><div class="k-value">${removed.length}</div></div>
          <div class="kpi" style="--kc:#f87171"><div class="k-label">${TX('أصبحت متأخرة', 'Newly Delayed')}</div><div class="k-value">${newDelayed}</div></div>
          <div class="kpi" style="--kc:#c084fc"><div class="k-label">${TX('أصبحت حرجة', 'Newly Critical')}</div><div class="k-value">${newCritical}</div></div>
        </div>
        <div class="section-t" style="margin-top:14px">➕ ${TX('أنشطة جديدة', 'New Activities')}</div>${lst(added, aLine)}
        <div class="section-t" style="margin-top:12px">➖ ${TX('أنشطة محذوفة', 'Removed Activities')}</div>${lst(removed, aLine)}
        <div class="section-t" style="margin-top:12px">⏱ ${TX('تغير المدة', 'Duration Changes')}</div>${lst(durCh, dLine)}
        <div class="section-t" style="margin-top:12px">▶️ ${TX('تغير البداية', 'Start Changes')}</div>${lst(startCh, dLine)}
        <div class="section-t" style="margin-top:12px">🏁 ${TX('تغير النهاية', 'Finish Changes')}</div>${lst(finishCh, dLine)}
        <div class="flex" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-close>${t('close')}</button></div>
      </div>`, { wide: true });
  },

  /* ================= 12. snapshots ================= */
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
          <td class="fs12">${s.data.filter(a => !(a.pctComplete >= 100) && a.finish && a.finish < s.at.slice(0, 10)).length}</td>
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
            <th>${TX('الكود', 'ID')}</th><th>${TX('النشاط', 'Activity')}</th><th>%</th><th>${TX('النهاية', 'Finish')}</th><th>Float</th>
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
