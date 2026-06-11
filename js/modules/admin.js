/* ============================================================
   Admin Control Center — no-code configuration:
   modules, custom fields, statuses, categories, tags,
   workflows, users, roles & permissions, general settings
   ============================================================ */

const ModAdmin = {
  tab: 'modules',
  selEntity: 'action',

  render(container) {
    const tabs = [
      ['modules', '🧩', t('adminModules')],
      ['fields', '🔠', t('adminFields')],
      ['statuses', '🏷', t('adminStatuses')],
      ['categories', '🗂', t('adminCategories')],
      ['masterData', '🗄', LANG === 'ar' ? 'مركز البيانات الرئيسية' : 'Master Data Center'],
      ['users', '👥', t('adminUsers')],
      ['roles', '🔐', t('adminRoles')],
      ['general', '⚙️', t('adminGeneral')],
    ];
    container.innerHTML = `
      <div class="module-tabs">${tabs.map(([k, ic, l]) =>
        `<button class="${this.tab === k ? 'active' : ''}" data-t="${k}">${ic} ${l}</button>`).join('')}</div>
      <div id="ad-body"></div>`;
    container.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { this.tab = b.dataset.t; this.render(container); });
    const body = container.querySelector('#ad-body');
    this[this.tab](body, () => this.render(container));
  },

  /* ---------- entity picker used by fields/statuses/categories ---------- */
  entityPicker(rr) {
    return `<div class="reg-toolbar">
      <label class="fl" style="margin:0">${t('entity')}:</label>
      <select class="input" id="ad-ent" style="min-width:220px">
        ${Object.keys(Store.db.schemas).map(k =>
          `<option value="${k}" ${this.selEntity === k ? 'selected' : ''}>${Store.db.schemas[k].icon} ${tl(Store.db.schemas[k].label)}</option>`).join('')}
      </select></div>`;
  },
  bindPicker(body, rr) {
    body.querySelector('#ad-ent').onchange = e => { this.selEntity = e.target.value; rr(); };
  },

  /* ---------- modules: show/hide + create ---------- */
  modules(body, rr) {
    body.innerHTML = `
      <div class="reg-toolbar"><div class="fs12 mut">${LANG === 'ar' ? 'تحكم في ظهور الوحدات بالقائمة الجانبية أو أنشئ وحدة مخصصة' : 'Toggle module visibility or create a custom module'}</div>
        <div class="spacer"></div><button class="btn primary" id="md-new">＋ ${t('add')}</button></div>
      <div class="grid g3">${Store.db.modules.map(m => `
        <div class="panel flex">
          <span style="font-size:22px">${m.icon}</span>
          <div style="flex:1"><b class="fs13">${m.labelKey ? t(m.labelKey) : esc(m.label || m.key)}</b>
            <div class="fs11 mut">${m.builtin ? (LANG === 'ar' ? 'وحدة أساسية' : 'built-in') : (LANG === 'ar' ? 'وحدة مخصصة' : 'custom')}</div></div>
          <button class="btn sm ${m.visible ? 'primary' : ''}" data-vis="${m.key}">${m.visible ? '👁 ' + t('moduleVisible') : '🚫 ' + t('moduleHidden')}</button>
          ${!m.builtin ? `<button class="btn sm danger" data-del="${m.key}">🗑</button>` : ''}
        </div>`).join('')}</div>`;
    body.querySelectorAll('[data-vis]').forEach(b => b.onclick = () => {
      const m = Store.db.modules.find(x => x.key === b.dataset.vis);
      if (m.key === 'admin') return UI.toast(LANG === 'ar' ? 'لا يمكن إخفاء مركز التحكم' : 'Cannot hide admin center', 'err');
      m.visible = !m.visible; Store.save(); rr(); App.renderSidebar();
    });
    body.querySelectorAll('[data-del]').forEach(b => b.onclick = () => UI.confirm(t('confirmDelete'), () => {
      Store.db.modules = Store.db.modules.filter(x => x.key !== b.dataset.del); Store.save(); rr(); App.renderSidebar();
    }));
    body.querySelector('#md-new').onclick = () => {
      const m = UI.modal(`
        <div class="drawer-h"><h2>＋ ${t('adminModules')}</h2><button class="x-btn" data-close>✕</button></div>
        <div class="drawer-b"><div class="form-grid">
          <div><label class="fl">${t('name')}</label><input class="input" id="nm-name"></div>
          <div><label class="fl">${LANG === 'ar' ? 'أيقونة (إيموجي)' : 'Icon (emoji)'}</label><input class="input" id="nm-icon" value="📦"></div>
        </div><div class="fs11 mut mt8">${LANG === 'ar' ? 'الوحدة المخصصة تنشئ سجلاً عاماً بحقول قابلة للتخصيص من تبويب الحقول.' : 'A custom module creates a generic register with fields you can customize from the Fields tab.'}</div></div>
        <div class="drawer-f"><button class="btn primary" id="nm-save">💾 ${t('save')}</button></div>`);
      m.el.querySelector('#nm-save').onclick = () => {
        const name = m.el.querySelector('#nm-name').value.trim();
        if (!name) return UI.toast(t('required'), 'err');
        const key = 'custom_' + uid('m');
        const icon = m.el.querySelector('#nm-icon').value || '📦';
        Store.db.modules.push({ key, icon, group: 'gExecution', label: name, visible: true, entity: key });
        Store.db.schemas[key] = {
          icon, label: { en: name, ar: name }, refPrefix: name.slice(0, 3).toUpperCase(),
          views: ['list', 'kanban', 'timeline'],
          fields: [
            { key: 'title', type: 'text', label: { en: 'Title', ar: 'العنوان' }, required: true, system: true },
            { key: 'description', type: 'textarea', label: { en: 'Description', ar: 'الوصف' } },
            { key: 'priority', type: 'priority', label: { en: 'Priority', ar: 'الأولوية' } },
            { key: 'assignee', type: 'user', label: { en: 'Assignee', ar: 'المسؤول' } },
            { key: 'dueDate', type: 'date', label: { en: 'Due Date', ar: 'تاريخ الاستحقاق' } },
            { key: 'tags', type: 'tags', label: { en: 'Tags', ar: 'الوسوم' } },
          ],
          statuses: [
            { key: 'open', label: { en: 'Open', ar: 'مفتوح' }, color: '#60a5fa' },
            { key: 'inprogress', label: { en: 'In Progress', ar: 'قيد التنفيذ' }, color: '#22d3ee' },
            { key: 'closed', label: { en: 'Closed', ar: 'مغلق' }, color: '#34d399', closed: true },
          ],
          categories: [], tags: [],
        };
        Store.db.entities[key] = []; Store.db.counters[key] = 0;
        Store.save(); m.close(); UI.toast(t('saved')); this.render(document.getElementById('page')); App.renderSidebar();
      };
    };
  },

  /* ---------- custom fields ---------- */
  fields(body, rr) {
    const sch = Store.db.schemas[this.selEntity];
    const typeNames = { text: 'نص / Text', textarea: 'نص طويل / Long text', select: 'قائمة / Select', date: 'تاريخ / Date', number: 'رقم / Number', user: 'مستخدم / User', contractor: 'مقاول / Contractor', tags: 'وسوم / Tags', priority: 'أولوية / Priority', gps: 'GPS', attachments: 'مرفقات / Files' };
    body.innerHTML = this.entityPicker(rr) + `
      <div class="panel">
        <div class="panel-h"><h3>${t('adminFields')} — ${tl(sch.label)}</h3>
          <div class="spacer"></div><button class="btn primary" id="fd-add">＋ ${t('addField')}</button></div>
        <table class="tbl"><thead><tr><th>${t('fieldLabel')}</th><th>${t('fieldType')}</th><th>${t('options')}</th><th>${LANG === 'ar' ? 'إلزامي' : 'Required'}</th><th></th></tr></thead><tbody>
        ${sch.fields.map((f, i) => `<tr>
          <td class="t-title">${tl(f.label)} ${f.system ? `<span class="tag">${LANG === 'ar' ? 'نظامي' : 'system'}</span>` : ''}</td>
          <td class="fs12">${typeNames[f.type] || f.type}</td>
          <td class="fs12 mut">${(f.options || []).join('، ') || '—'}</td>
          <td>${f.required ? '✅' : '—'}</td>
          <td style="white-space:nowrap">
            <button class="btn sm" data-ed="${i}">✏️</button>
            ${!f.system ? `<button class="btn sm danger" data-rm="${i}">🗑</button>` : ''}
          </td></tr>`).join('')}</tbody></table>
      </div>`;
    this.bindPicker(body, rr);

    const fieldForm = (f, idx) => {
      const m = UI.modal(`
        <div class="drawer-h"><h2>${f ? '✏️' : '＋'} ${t('addField')}</h2><button class="x-btn" data-close>✕</button></div>
        <div class="drawer-b"><div class="form-grid">
          <div><label class="fl">${t('fieldLabel')} (AR)</label><input class="input" id="ff-ar" value="${f ? esc(f.label.ar || '') : ''}"></div>
          <div><label class="fl">${t('fieldLabel')} (EN)</label><input class="input" id="ff-en" value="${f ? esc(f.label.en || '') : ''}"></div>
          <div><label class="fl">${t('fieldType')}</label><select class="input" id="ff-type" ${f && f.system ? 'disabled' : ''}>
            ${Object.entries(typeNames).map(([k, l]) => `<option value="${k}" ${f && f.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div><label class="fl">${LANG === 'ar' ? 'إلزامي' : 'Required'}</label><select class="input" id="ff-req">
            <option value="">${t('no')}</option><option value="1" ${f && f.required ? 'selected' : ''}>${t('yes')}</option></select></div>
          <div class="full"><label class="fl">${t('options')}</label><input class="input" id="ff-opts" value="${f ? esc((f.options || []).join(', ')) : ''}"></div>
        </div></div>
        <div class="drawer-f"><button class="btn primary" id="ff-save">💾 ${t('save')}</button></div>`);
      m.el.querySelector('#ff-save').onclick = () => {
        const ar = m.el.querySelector('#ff-ar').value.trim(), en = m.el.querySelector('#ff-en').value.trim();
        if (!ar && !en) return UI.toast(t('required'), 'err');
        const opts = m.el.querySelector('#ff-opts').value.split(',').map(s => s.trim()).filter(Boolean);
        if (f) {
          f.label = { ar: ar || en, en: en || ar };
          if (!f.system) f.type = m.el.querySelector('#ff-type').value;
          f.required = !!m.el.querySelector('#ff-req').value;
          f.options = opts;
        } else {
          sch.fields.push({
            key: 'cf_' + uid('f'), type: m.el.querySelector('#ff-type').value,
            label: { ar: ar || en, en: en || ar }, required: !!m.el.querySelector('#ff-req').value, options: opts,
          });
        }
        Store.save(); m.close(); UI.toast(t('saved')); rr();
      };
    };
    body.querySelector('#fd-add').onclick = () => fieldForm(null);
    body.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => fieldForm(sch.fields[+b.dataset.ed], +b.dataset.ed));
    body.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => UI.confirm(t('confirmDelete'), () => {
      sch.fields.splice(+b.dataset.rm, 1); Store.save(); rr();
    }));
  },

  /* ---------- statuses ---------- */
  statuses(body, rr) {
    const sch = Store.db.schemas[this.selEntity];
    body.innerHTML = this.entityPicker(rr) + `
      <div class="panel">
        <div class="panel-h"><h3>${t('adminStatuses')} — ${tl(sch.label)}</h3>
          <div class="spacer"></div><button class="btn primary" id="st-add">＋ ${t('addStatus')}</button></div>
        ${sch.statuses.map((s, i) => `
          <div class="rank-row">
            <input type="color" value="${s.color}" data-cl="${i}" style="width:34px;height:30px;border:none;background:none;cursor:pointer">
            <input class="input" style="max-width:200px" value="${esc(s.label.ar || '')}" data-ar="${i}" placeholder="عربي">
            <input class="input" style="max-width:200px" value="${esc(s.label.en || '')}" data-en="${i}" placeholder="English">
            <label class="fs12 flex" style="gap:5px"><input type="checkbox" ${s.closed ? 'checked' : ''} data-cls="${i}"> ${LANG === 'ar' ? 'حالة إغلاق' : 'closing status'}</label>
            <div class="spacer"></div>
            <span class="chip" style="--cc:${s.color}">${tl(s.label)}</span>
            <button class="btn sm danger" data-rm="${i}">🗑</button>
          </div>`).join('')}
      </div>`;
    this.bindPicker(body, rr);
    const upd = (i, fn) => { fn(sch.statuses[i]); Store.save(); };
    body.querySelectorAll('[data-cl]').forEach(inp => inp.onchange = () => { upd(+inp.dataset.cl, s => s.color = inp.value); rr(); });
    body.querySelectorAll('[data-ar]').forEach(inp => inp.onchange = () => upd(+inp.dataset.ar, s => s.label.ar = inp.value));
    body.querySelectorAll('[data-en]').forEach(inp => inp.onchange = () => upd(+inp.dataset.en, s => s.label.en = inp.value));
    body.querySelectorAll('[data-cls]').forEach(inp => inp.onchange = () => upd(+inp.dataset.cls, s => s.closed = inp.checked));
    body.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      if (sch.statuses.length <= 2) return UI.toast(LANG === 'ar' ? 'يلزم حالتان على الأقل' : 'At least two statuses required', 'err');
      UI.confirm(t('confirmDelete'), () => { sch.statuses.splice(+b.dataset.rm, 1); Store.save(); rr(); });
    });
    body.querySelector('#st-add').onclick = () => {
      sch.statuses.push({ key: 'st_' + uid('s'), label: { ar: 'حالة جديدة', en: 'New status' }, color: '#a78bfa', closed: false });
      Store.save(); rr();
    };
  },

  /* ---------- categories & tags ---------- */
  categories(body, rr) {
    const sch = Store.db.schemas[this.selEntity];
    body.innerHTML = this.entityPicker(rr) + `
      <div class="grid g2">
        <div class="panel">
          <div class="panel-h"><h3>${t('adminCategories')} — ${tl(sch.label)}</h3>
            <div class="spacer"></div><button class="btn primary sm" id="ct-add">＋ ${t('addCategory')}</button></div>
          ${(sch.categories || []).map((c, i) => `
            <div class="rank-row">
              <input class="input" style="max-width:220px" value="${esc(c.label.ar || '')}" data-car="${i}">
              <input class="input" style="max-width:220px" value="${esc(c.label.en || '')}" data-cen="${i}">
              <div class="spacer"></div><button class="btn sm danger" data-crm="${i}">🗑</button>
            </div>`).join('') || UI.empty('🗂')}
        </div>
        <div class="panel">
          <div class="panel-h"><h3>${t('adminTags')} — ${tl(sch.label)}</h3></div>
          <div class="flexw">${(sch.tags || []).map((tg, i) =>
            `<span class="chip lg" style="--cc:#a78bfa">${esc(tg)} <b class="clickable" data-trm="${i}" style="margin-inline-start:4px">✕</b></span>`).join('')}</div>
          <div class="flex mt14">
            <input class="input" id="tg-new" placeholder="${LANG === 'ar' ? 'وسم جديد…' : 'New tag…'}">
            <button class="btn sm primary" id="tg-add">＋</button>
          </div>
        </div>
      </div>`;
    this.bindPicker(body, rr);
    sch.categories = sch.categories || []; sch.tags = sch.tags || [];
    body.querySelector('#ct-add').onclick = () => { sch.categories.push({ key: 'cat_' + uid('c'), label: { ar: 'فئة جديدة', en: 'New category' } }); Store.save(); rr(); };
    body.querySelectorAll('[data-car]').forEach(inp => inp.onchange = () => { sch.categories[+inp.dataset.car].label.ar = inp.value; Store.save(); });
    body.querySelectorAll('[data-cen]').forEach(inp => inp.onchange = () => { sch.categories[+inp.dataset.cen].label.en = inp.value; Store.save(); });
    body.querySelectorAll('[data-crm]').forEach(b => b.onclick = () => UI.confirm(t('confirmDelete'), () => { sch.categories.splice(+b.dataset.crm, 1); Store.save(); rr(); }));
    body.querySelector('#tg-add').onclick = () => {
      const v = body.querySelector('#tg-new').value.trim();
      if (v) { sch.tags.push(v); Store.save(); rr(); }
    };
    body.querySelectorAll('[data-trm]').forEach(b => b.onclick = () => { sch.tags.splice(+b.dataset.trm, 1); Store.save(); rr(); });
  },

  /* ---------- master data center ---------- */
  mdCat: 'people',
  mdCategories: [
    { key: 'people', icon: '🧑‍💼', label: () => LANG === 'ar' ? 'الأشخاص' : 'People', fields: [
      { key: 'name', label: () => LANG === 'ar' ? 'الاسم (عربي)' : 'Name (AR)' },
      { key: 'nameEn', label: () => 'Name (EN)' },
      { key: 'company', label: () => LANG === 'ar' ? 'الجهة' : 'Organization', type: 'org' },
      { key: 'position', label: () => LANG === 'ar' ? 'المسمى الوظيفي' : 'Position' },
      { key: 'department', label: () => LANG === 'ar' ? 'القسم' : 'Department' },
      { key: 'discipline', label: () => LANG === 'ar' ? 'التخصص' : 'Discipline' },
      { key: 'email', label: () => 'Email' },
      { key: 'mobile', label: () => LANG === 'ar' ? 'الجوال' : 'Mobile' },
    ] },
    { key: 'organizations', icon: '🏢', label: () => LANG === 'ar' ? 'الجهات / الشركات' : 'Organizations', fields: [
      { key: 'type', label: () => LANG === 'ar' ? 'النوع' : 'Type', type: 'orgtype' },
      { key: 'name', label: () => LANG === 'ar' ? 'الاسم (عربي)' : 'Name (AR)' },
      { key: 'nameEn', label: () => 'Name (EN)' },
      { key: 'contactPerson', label: () => LANG === 'ar' ? 'مسؤول التواصل' : 'Contact Person' },
      { key: 'email', label: () => 'Email' },
      { key: 'mobile', label: () => LANG === 'ar' ? 'الجوال' : 'Mobile' },
      { key: 'notes', label: () => LANG === 'ar' ? 'ملاحظات' : 'Notes' },
    ] },
    { key: 'zones', icon: '📍', label: () => LANG === 'ar' ? 'المناطق' : 'Zones', fields: [
      { key: 'name', label: () => LANG === 'ar' ? 'الاسم (عربي)' : 'Name (AR)' },
      { key: 'nameEn', label: () => 'Name (EN)' },
    ] },
    { key: 'streets', icon: '🛣', label: () => LANG === 'ar' ? 'الشوارع' : 'Streets', fields: [
      { key: 'name', label: () => LANG === 'ar' ? 'الاسم (عربي)' : 'Name (AR)' },
      { key: 'nameEn', label: () => 'Name (EN)' },
      { key: 'zone', label: () => LANG === 'ar' ? 'المنطقة' : 'Zone', type: 'zone' },
    ] },
    { key: 'subcategories', icon: '🗃', label: () => LANG === 'ar' ? 'الفئات الفرعية' : 'Subcategories', fields: [
      { key: 'name', label: () => LANG === 'ar' ? 'الاسم (عربي)' : 'Name (AR)' },
      { key: 'nameEn', label: () => 'Name (EN)' },
    ] },
    { key: 'departments', icon: '🏬', label: () => LANG === 'ar' ? 'الأقسام' : 'Departments', fields: [
      { key: 'name', label: () => LANG === 'ar' ? 'الاسم (عربي)' : 'Name (AR)' },
      { key: 'nameEn', label: () => 'Name (EN)' },
    ] },
    { key: 'disciplines', icon: '🔧', label: () => LANG === 'ar' ? 'التخصصات' : 'Disciplines', fields: [
      { key: 'name', label: () => LANG === 'ar' ? 'الاسم (عربي)' : 'Name (AR)' },
      { key: 'nameEn', label: () => 'Name (EN)' },
    ] },
  ],
  orgTypeOptions: [
    { key: 'contractor', ar: 'مقاول', en: 'Contractor' }, { key: 'consultant', ar: 'استشاري', en: 'Consultant' },
    { key: 'developer', ar: 'مطور', en: 'Developer' }, { key: 'client', ar: 'عميل', en: 'Client' },
    { key: 'owner', ar: 'مالك', en: 'Owner' }, { key: 'authority', ar: 'جهة حكومية', en: 'Authority' },
    { key: 'utility', ar: 'مزود خدمة', en: 'Utility Provider' }, { key: 'other', ar: 'أخرى', en: 'Other' },
  ],
  mdFieldDisplay(f, it) {
    const v = it[f.key];
    if (!v) return '—';
    if (f.type === 'org') { const o = Store.getOrganization(v); return o ? (LANG === 'ar' ? o.name : (o.nameEn || o.name)) : v; }
    if (f.type === 'zone') { const z = (Store.db.masterData.zones || []).find(z2 => z2.id === v); return z ? (LANG === 'ar' ? z.name : (z.nameEn || z.name)) : v; }
    if (f.type === 'orgtype') { const o = this.orgTypeOptions.find(o2 => o2.key === v); return o ? (LANG === 'ar' ? o.ar : o.en) : v; }
    return v;
  },
  mdFieldInput(f, val) {
    if (f.type === 'org') {
      const orgs = Store.getMasterList('organizations', { onlyActive: false });
      return `<select class="input" id="mdf-${f.key}"><option value="">—</option>${orgs.map(o => `<option value="${o.id}" ${val === o.id ? 'selected' : ''}>${esc(LANG === 'ar' ? o.name : (o.nameEn || o.name))}</option>`).join('')}</select>`;
    }
    if (f.type === 'zone') {
      const zones = Store.getMasterList('zones', { onlyActive: false });
      return `<select class="input" id="mdf-${f.key}"><option value="">—</option>${zones.map(z => `<option value="${z.id}" ${val === z.id ? 'selected' : ''}>${esc(LANG === 'ar' ? z.name : (z.nameEn || z.name))}</option>`).join('')}</select>`;
    }
    if (f.type === 'orgtype') {
      return `<select class="input" id="mdf-${f.key}">${this.orgTypeOptions.map(o => `<option value="${o.key}" ${val === o.key ? 'selected' : ''}>${esc(LANG === 'ar' ? o.ar : o.en)}</option>`).join('')}</select>`;
    }
    return `<input class="input" id="mdf-${f.key}" value="${esc(val || '')}">`;
  },
  masterData(body, rr) {
    this.mdCat = this.mdCat || 'people';
    const catCfg = this.mdCategories.find(c => c.key === this.mdCat);
    const items = Store.getMasterList(this.mdCat, { includeArchived: true });
    body.innerHTML = `
      <div style="display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:start">
        <div class="panel">
          <div class="panel-h"><h3>🗄 ${LANG === 'ar' ? 'البيانات الرئيسية' : 'Master Data'}</h3></div>
          <div class="flex" style="flex-direction:column;gap:6px">
            ${this.mdCategories.map(c => `<button class="btn sm ${this.mdCat === c.key ? 'primary' : ''}" data-mdc="${c.key}" style="justify-content:flex-start">${c.icon} ${c.label()}</button>`).join('')}
          </div>
        </div>
        <div class="panel" style="overflow-x:auto">
          <div class="panel-h"><h3>${catCfg.icon} ${catCfg.label()}</h3><div class="spacer"></div><button class="btn primary sm" id="md-add">＋ ${t('add')}</button></div>
          <table class="tbl"><thead><tr>${catCfg.fields.map(f => `<th>${f.label()}</th>`).join('')}<th>${LANG === 'ar' ? 'الحالة' : 'Status'}</th><th></th></tr></thead><tbody>
          ${items.map(it => `<tr style="${it.archived ? 'opacity:.5' : ''}">
            ${catCfg.fields.map(f => `<td class="fs12">${esc(this.mdFieldDisplay(f, it))}</td>`).join('')}
            <td>${it.archived ? `<span class="tag">${LANG === 'ar' ? 'مؤرشف' : 'archived'}</span>` : (it.active === false ? `<span class="tag">${LANG === 'ar' ? 'غير نشط' : 'inactive'}</span>` : `<span class="tag" style="background:rgba(52,211,153,.15);color:#34d399">${LANG === 'ar' ? 'نشط' : 'active'}</span>`)}</td>
            <td style="white-space:nowrap">
              <button class="btn sm" data-mded="${it.id}">✏️</button>
              <button class="btn sm" data-mdarc="${it.id}">${it.archived ? '♻️' : '🗄'}</button>
              <button class="btn sm danger" data-mdrm="${it.id}">🗑</button>
            </td></tr>`).join('') || `<tr><td colspan="${catCfg.fields.length + 2}">${UI.empty('🗄')}</td></tr>`}
          </tbody></table>
          <div class="fs11 mut mt8">${LANG === 'ar' ? 'العناصر المؤرشفة تبقى مرتبطة بالسجلات القديمة لكنها تختفي من القوائم الجديدة.' : 'Archived items stay linked to old records but are hidden from new dropdowns.'}</div>
        </div>
      </div>`;
    body.querySelectorAll('[data-mdc]').forEach(b => b.onclick = () => { this.mdCat = b.dataset.mdc; rr(); });

    const itemForm = (it) => {
      const m = UI.modal(`
        <div class="drawer-h"><h2>${it ? '✏️' : '＋'} ${catCfg.label()}</h2><button class="x-btn" data-close>✕</button></div>
        <div class="drawer-b"><div class="form-grid">
          ${catCfg.fields.map(f => `<div><label class="fl">${f.label()}</label>${this.mdFieldInput(f, it ? it[f.key] : '')}</div>`).join('')}
          <div><label class="fl">${LANG === 'ar' ? 'نشط' : 'Active'}</label><select class="input" id="mdf-active">
            <option value="1" ${!it || it.active !== false ? 'selected' : ''}>${t('yes')}</option>
            <option value="0" ${it && it.active === false ? 'selected' : ''}>${t('no')}</option></select></div>
        </div></div>
        <div class="drawer-f"><button class="btn primary" id="mdf-save">💾 ${t('save')}</button></div>`);
      m.el.querySelector('#mdf-save').onclick = () => {
        const data = {};
        catCfg.fields.forEach(f => { data[f.key] = m.el.querySelector(`#mdf-${f.key}`).value.trim(); });
        if (!data.name && !data.nameEn) return UI.toast(t('required'), 'err');
        data.active = m.el.querySelector('#mdf-active').value === '1';
        if (it) { Object.assign(it, data); }
        else { data.id = uid(this.mdCat); data.archived = false; Store.db.masterData[this.mdCat].push(data); }
        Store.save(); m.close(); UI.toast(t('saved')); rr();
      };
    };
    body.querySelector('#md-add').onclick = () => itemForm(null);
    body.querySelectorAll('[data-mded]').forEach(b => b.onclick = () => itemForm(items.find(i => i.id === b.dataset.mded)));
    body.querySelectorAll('[data-mdarc]').forEach(b => b.onclick = () => {
      const it = items.find(i => i.id === b.dataset.mdarc);
      it.archived = !it.archived; Store.save(); rr();
    });
    body.querySelectorAll('[data-mdrm]').forEach(b => b.onclick = () => UI.confirm(t('confirmDelete'), () => {
      Store.db.masterData[this.mdCat] = Store.db.masterData[this.mdCat].filter(i => i.id !== b.dataset.mdrm);
      Store.save(); rr();
    }));
  },

  /* ---------- users ---------- */
  users(body, rr) {
    body.innerHTML = `
      <div class="panel">
        <div class="panel-h"><h3>${t('adminUsers')}</h3>
          <div class="spacer"></div><button class="btn primary" id="us-add">＋ ${t('addUser')}</button></div>
        <table class="tbl"><thead><tr><th>${t('name')}</th><th>${t('email')}</th><th>${t('role')}</th><th></th></tr></thead><tbody>
        ${Store.db.users.map(u => `<tr>
          <td><div class="flex">${UI.avatar(u.id)} <div><div class="t-title">${esc(u.name)}</div><div class="t-sub">${esc(u.nameEn)}</div></div></div></td>
          <td class="fs12">${esc(u.email)}</td>
          <td><select class="input" style="width:auto" data-role="${u.id}">
            ${Store.db.roles.map(r => `<option value="${r.key}" ${u.role === r.key ? 'selected' : ''}>${tl(r.label)}</option>`).join('')}</select></td>
          <td>${u.id !== Store.db.currentUserId ? `<button class="btn sm danger" data-rm="${u.id}">🗑</button>` : `<span class="tag">${LANG === 'ar' ? 'أنت' : 'you'}</span>`}</td>
        </tr>`).join('')}</tbody></table>
      </div>`;
    body.querySelectorAll('[data-role]').forEach(sel => sel.onchange = () => {
      Store.db.users.find(u => u.id === sel.dataset.role).role = sel.value; Store.save(); UI.toast(t('updated'));
    });
    body.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => UI.confirm(t('confirmDelete'), () => {
      Store.db.users = Store.db.users.filter(u => u.id !== b.dataset.rm); Store.save(); rr();
    }));
    body.querySelector('#us-add').onclick = () => {
      const m = UI.modal(`
        <div class="drawer-h"><h2>＋ ${t('addUser')}</h2><button class="x-btn" data-close>✕</button></div>
        <div class="drawer-b"><div class="form-grid">
          <div><label class="fl">${t('name')} (AR)</label><input class="input" id="nu-ar"></div>
          <div><label class="fl">${t('name')} (EN)</label><input class="input" id="nu-en"></div>
          <div><label class="fl">${t('email')}</label><input class="input" id="nu-em"></div>
          <div><label class="fl">${t('role')}</label><select class="input" id="nu-role">
            ${Store.db.roles.map(r => `<option value="${r.key}">${tl(r.label)}</option>`).join('')}</select></div>
        </div></div>
        <div class="drawer-f"><button class="btn primary" id="nu-save">💾 ${t('save')}</button></div>`);
      m.el.querySelector('#nu-save').onclick = () => {
        const ar = m.el.querySelector('#nu-ar').value.trim(), en = m.el.querySelector('#nu-en').value.trim();
        if (!ar && !en) return UI.toast(t('required'), 'err');
        Store.db.users.push({
          id: uid('u'), name: ar || en, nameEn: en || ar, email: m.el.querySelector('#nu-em').value.trim(),
          role: m.el.querySelector('#nu-role').value, initials: (ar || en).split(' ').map(w => w[0]).slice(0, 2).join(''),
        });
        Store.save(); m.close(); UI.toast(t('saved')); rr();
      };
    };
  },

  /* ---------- roles & permissions matrix ---------- */
  roles(body, rr) {
    const mods = Store.db.modules.filter(m => !m.adminOnly);
    body.innerHTML = `
      <div class="panel" style="overflow-x:auto">
        <div class="panel-h"><h3>${t('adminRoles')}</h3><span class="sub">${LANG === 'ar' ? 'صلاحيات الوصول للوحدات حسب الدور' : 'module access per role'}</span></div>
        <table class="tbl"><thead><tr><th>${t('role')}</th>
          ${mods.map(m => `<th class="center">${m.icon}<div class="fs11" style="text-transform:none">${(m.labelKey ? t(m.labelKey) : m.label).split('—')[0].split(' ').slice(0, 2).join(' ')}</div></th>`).join('')}
        </tr></thead><tbody>
        ${Store.db.roles.map(r => `<tr>
          <td><div class="t-title">${tl(r.label)}</div><div class="t-sub">${r.key}</div></td>
          ${mods.map(m => {
            const all = r.modules.includes('*');
            const has = all || r.modules.includes(m.key);
            return `<td class="center">${all ? '🔓' : `<input type="checkbox" ${has ? 'checked' : ''} data-perm="${r.key}|${m.key}" style="cursor:pointer;width:16px;height:16px">`}</td>`;
          }).join('')}
        </tr>`).join('')}</tbody></table>
        <div class="fs11 mut mt8">🔓 = ${LANG === 'ar' ? 'وصول كامل (مدير النظام)' : 'full access (system admin)'}</div>
      </div>`;
    body.querySelectorAll('[data-perm]').forEach(cb => cb.onchange = () => {
      const [rk, mk] = cb.dataset.perm.split('|');
      const role = Store.db.roles.find(r => r.key === rk);
      if (cb.checked) role.modules.push(mk);
      else role.modules = role.modules.filter(x => x !== mk);
      Store.save(); UI.toast(t('updated')); App.renderSidebar();
    });
  },

  /* ---------- general ---------- */
  general(body, rr) {
    body.innerHTML = `
      <div class="grid g2">
        <div class="panel">
          <div class="panel-h"><h3>⚙️ ${t('adminGeneral')}</h3></div>
          <label class="fl">${LANG === 'ar' ? 'اسم المنشأة (عربي)' : 'Organization (AR)'}</label>
          <input class="input mb14" id="gn-ar" value="${esc(Store.db.settings.orgName)}" style="margin-bottom:12px">
          <label class="fl">${LANG === 'ar' ? 'اسم المنشأة (إنجليزي)' : 'Organization (EN)'}</label>
          <input class="input" id="gn-en" value="${esc(Store.db.settings.orgNameEn)}" style="margin-bottom:12px">
          <button class="btn primary" id="gn-save">💾 ${t('save')}</button>
        </div>
        <div class="panel" style="border-color:rgba(248,113,113,.4)">
          <div class="panel-h"><h3 style="color:var(--red)">⚠️ ${t('dangerZone')}</h3></div>
          <div class="fs12 mut2" style="margin-bottom:14px">${t('resetWarn')}</div>
          <button class="btn danger" id="gn-reset">♻️ ${t('resetData')}</button>
        </div>
      </div>`;
    body.querySelector('#gn-save').onclick = () => {
      Store.db.settings.orgName = body.querySelector('#gn-ar').value;
      Store.db.settings.orgNameEn = body.querySelector('#gn-en').value;
      Store.save(); UI.toast(t('saved'));
    };
    body.querySelector('#gn-reset').onclick = () => UI.confirm(t('resetWarn'), () => {
      Store.reset(); location.reload();
    });
  },
};
