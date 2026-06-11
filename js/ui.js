/* ============================================================
   UI — shared components: modal, drawer, toast, schema forms,
   chips/formatters used across all modules
   ============================================================ */

const UI = {
  /* ---------- toast ---------- */
  toast(msg, kind = 'ok') {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.innerHTML = `${kind === 'ok' ? '✅' : kind === 'err' ? '⚠️' : 'ℹ️'} <span>${esc(msg)}</span>`;
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 320); }, 2600);
  },

  /* ---------- overlay primitives ---------- */
  _close: null,
  closeOverlay() { if (UI._close) { UI._close(); UI._close = null; } },

  modal(html, { wide = false, onClose = null } = {}) {
    UI.closeOverlay();
    const ov = document.createElement('div'); ov.className = 'overlay';
    const md = document.createElement('div'); md.className = 'modal' + (wide ? ' wide' : '');
    md.innerHTML = html;
    document.body.append(ov, md);
    const close = () => { ov.remove(); md.remove(); if (onClose) onClose(); };
    ov.onclick = close;
    md.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
    UI._close = close;
    return { el: md, close };
  },

  drawer(html, { onClose = null } = {}) {
    UI.closeOverlay();
    const ov = document.createElement('div'); ov.className = 'overlay';
    const dr = document.createElement('div'); dr.className = 'drawer';
    dr.innerHTML = html;
    document.body.append(ov, dr);
    const close = () => { ov.remove(); dr.remove(); if (onClose) onClose(); };
    ov.onclick = close;
    dr.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
    UI._close = close;
    return { el: dr, close };
  },

  confirm(msg, onYes) {
    const m = UI.modal(`
      <div style="padding:26px 26px 20px">
        <div class="b" style="font-size:15px;margin-bottom:18px">⚠️ ${esc(msg)}</div>
        <div class="flex" style="justify-content:flex-end">
          <button class="btn" data-close>${t('cancel')}</button>
          <button class="btn danger" id="cf-yes">${t('yes')}</button>
        </div>
      </div>`);
    m.el.querySelector('#cf-yes').onclick = () => { m.close(); onYes(); };
  },

  /* ---------- formatters ---------- */
  fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.getDate()} ${t('months')[d.getMonth()]} ${d.getFullYear()}`;
  },

  prioColors: { critical: '#f87171', high: '#fb923c', medium: '#f5b942', low: '#34d399' },
  prioLabel(p) { return { critical: t('pCritical'), high: t('pHigh'), medium: t('pMedium'), low: t('pLow') }[p] || p || '—'; },
  prioChip(p) {
    if (!p) return '';
    return `<span class="chip" style="--cc:${UI.prioColors[p] || '#64748b'}">● ${UI.prioLabel(p)}</span>`;
  },

  statusChip(type, key, lg = false) {
    const s = Store.statusDef(type, key);
    if (!s) return `<span class="chip">${esc(key)}</span>`;
    return `<span class="chip${lg ? ' lg' : ''}" style="--cc:${s.color}">${tl(s.label)}</span>`;
  },

  catLabel(type, key) {
    const c = (Store.schema(type).categories || []).find(x => x.key === key);
    return c ? tl(c.label) : (key || '—');
  },

  optLabel(key) {
    // translate well-known option keys; fall back to raw value
    const map = {
      incoming: t('incoming'), outgoing: t('outgoing'),
      bestPractice: t('bestPractice'), failure: t('failure'), successStory: t('successStory'), recommendation: t('recommendation'),
      meeting: t('mMeetings'), observation: t('mObservations'), risk: t('mRisks'), issue: t('mIssues'),
      correspondence: t('mCorrespondence'), lesson: t('mLessons'), manual: LANG === 'ar' ? 'يدوي' : 'Manual',
      safety: LANG === 'ar' ? 'سلامة' : 'Safety', quality: LANG === 'ar' ? 'جودة' : 'Quality',
      progress: LANG === 'ar' ? 'تقدم أعمال' : 'Progress', environment: LANG === 'ar' ? 'بيئة' : 'Environment',
      housekeeping: LANG === 'ar' ? 'ترتيب الموقع' : 'Housekeeping',
      critical: t('pCritical'), high: t('pHigh'), medium: t('pMedium'), low: t('pLow'),
      drawing: LANG === 'ar' ? 'مخطط' : 'Drawing', report: LANG === 'ar' ? 'تقرير' : 'Report',
      itp: 'ITP', methodStatement: LANG === 'ar' ? 'بيان طريقة عمل' : 'Method Statement',
      submittal: LANG === 'ar' ? 'اعتماد مواد' : 'Submittal', rfi: 'RFI', transmittal: LANG === 'ar' ? 'إرسالية' : 'Transmittal',
      architectural: LANG === 'ar' ? 'معماري' : 'Architectural', structural: LANG === 'ar' ? 'إنشائي' : 'Structural',
      mechanical: LANG === 'ar' ? 'ميكانيكي' : 'Mechanical', electrical: LANG === 'ar' ? 'كهربائي' : 'Electrical',
      civil: LANG === 'ar' ? 'مدني' : 'Civil', general: LANG === 'ar' ? 'عام' : 'General',
      design: LANG === 'ar' ? 'تصميم' : 'Design', procurement: LANG === 'ar' ? 'مشتريات' : 'Procurement',
      construction: LANG === 'ar' ? 'تنفيذ' : 'Construction', commissioning: LANG === 'ar' ? 'تشغيل' : 'Commissioning',
      handover: LANG === 'ar' ? 'تسليم' : 'Handover',
      consultant: LANG === 'ar' ? 'الاستشاري' : 'Consultant', developer: LANG === 'ar' ? 'المطور' : 'Developer',
      client: LANG === 'ar' ? 'العميل' : 'Client', internal: LANG === 'ar' ? 'فريق المشروع' : 'Internal Team',
      contractor: LANG === 'ar' ? 'المقاول' : 'Contractor',
      constraint: LANG === 'ar' ? 'معوق / مشكلة' : 'Issue / Constraint',
    };
    return map[key] || key;
  },

  dueBadge(rec, type) {
    if (!rec.dueDate || Store.isClosed(type, rec)) return '';
    const over = Store.daysOver(rec);
    if (over > 0) return `<span class="chip" style="--cc:#f87171">⏰ ${over} ${t('daysOverdue')}</span>`;
    if (over > -7) return `<span class="chip" style="--cc:#f5b942">⏳ ${t('dueIn')} ${-over} ${t('days')}</span>`;
    return `<span class="fs11 mut">📅 ${UI.fmtDate(rec.dueDate)}</span>`;
  },

  avatar(userId, sm = true) {
    const u = Store.userById(userId);
    if (!u) return '';
    return `<span class="avatar${sm ? ' sm' : ''}" title="${esc(LANG === 'ar' ? u.name : u.nameEn)}">${esc(u.initials)}</span>`;
  },

  /* ---------- schema-driven form ---------- */
  fieldInput(f, val) {
    const v = val ?? '';
    const name = `data-fk="${f.key}"`;
    switch (f.type) {
      case 'textarea':
        return `<textarea class="input" ${name}>${esc(v)}</textarea>`;
      case 'date':
        return `<input type="date" class="input" ${name} value="${esc(v)}">`;
      case 'number':
        return `<input type="number" class="input" ${name} value="${esc(v)}">`;
      case 'select':
        return `<select class="input" ${name}><option value="">—</option>${(f.options || []).map(o =>
          `<option value="${esc(o)}" ${o == v ? 'selected' : ''}>${esc(UI.optLabel(o))}</option>`).join('')}</select>`;
      case 'priority':
        return `<select class="input" ${name}>${['critical', 'high', 'medium', 'low'].map(o =>
          `<option value="${o}" ${o == (v || 'medium') ? 'selected' : ''}>${UI.prioLabel(o)}</option>`).join('')}</select>`;
      case 'user':
        return `<select class="input" ${name}><option value="">—</option>${Store.db.users.map(u =>
          `<option value="${u.id}" ${u.id == v ? 'selected' : ''}>${esc(LANG === 'ar' ? u.name : u.nameEn)}</option>`).join('')}</select>`;
      case 'contractor':
        return `<select class="input" ${name}><option value="">—</option>${Store.db.contractors.map(c =>
          `<option value="${c.id}" ${c.id == v ? 'selected' : ''}>${esc(LANG === 'ar' ? c.name : c.nameEn)}</option>`).join('')}</select>`;
      case 'tags':
        return `<input class="input" ${name} value="${esc(Array.isArray(v) ? v.join(', ') : v)}" placeholder="${LANG === 'ar' ? 'افصل بفاصلة' : 'comma separated'}">`;
      case 'gps':
        return `<input class="input" ${name} value="${esc(v)}" placeholder="24.7136, 46.6753">`;
      case 'attachments':
        return `<input class="input" ${name} value="${esc(Array.isArray(v) ? v.map(a => a.name).join(', ') : v)}" placeholder="${LANG === 'ar' ? 'أسماء الملفات، افصل بفاصلة' : 'file names, comma separated'}">`;
      default:
        return `<input class="input" ${name} value="${esc(v)}">`;
    }
  },

  // build form HTML for entity (rec=null for new)
  entityForm(type, rec) {
    const sch = Store.schema(type);
    const statusSel = `
      <div><label class="fl">${t('status')}</label>
      <select class="input" data-fk="status">${sch.statuses.map(s =>
        `<option value="${s.key}" ${rec && rec.status === s.key ? 'selected' : ''}>${tl(s.label)}</option>`).join('')}</select></div>`;
    const catSel = (sch.categories && sch.categories.length) ? `
      <div><label class="fl">${t('category')}</label>
      <select class="input" data-fk="category"><option value="">—</option>${sch.categories.map(c =>
        `<option value="${c.key}" ${rec && rec.category === c.key ? 'selected' : ''}>${tl(c.label)}</option>`).join('')}</select></div>` : '';
    const fields = sch.fields.map(f => {
      const wide = ['textarea', 'attachments'].includes(f.type) || f.key === 'title';
      return `<div class="${wide ? 'full' : ''}">
        <label class="fl">${tl(f.label)} ${f.required ? '<span class="req">*</span>' : ''}</label>
        ${UI.fieldInput(f, rec ? rec[f.key] : undefined)}
      </div>`;
    }).join('');
    return `<div class="form-grid">${fields}${statusSel}${catSel}</div>`;
  },

  // collect values from a form container
  collectForm(container, type) {
    const sch = Store.schema(type);
    const data = {};
    container.querySelectorAll('[data-fk]').forEach(inp => {
      const key = inp.getAttribute('data-fk');
      let val = inp.value;
      const f = sch.fields.find(x => x.key === key);
      if (f && f.type === 'tags') val = val.split(',').map(s => s.trim()).filter(Boolean);
      if (f && f.type === 'attachments') val = val.split(',').map(s => s.trim()).filter(Boolean).map(n => ({ name: n }));
      data[key] = val;
    });
    // validation
    for (const f of sch.fields) {
      if (f.required && (!data[f.key] || (Array.isArray(data[f.key]) && !data[f.key].length))) {
        UI.toast(`${tl(f.label)}: ${t('required')}`, 'err');
        return null;
      }
    }
    return data;
  },

  /* ---------- generic value display ---------- */
  fieldDisplay(type, f, rec) {
    const v = rec[f.key];
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '—';
    switch (f.type) {
      case 'date': return UI.fmtDate(v);
      case 'user': return `${UI.avatar(v)} ${esc(Store.userName(v))}`;
      case 'contractor': {
        const c = Store.contractor(v); if (c) return `${c.icon} ${esc(LANG === 'ar' ? c.name : c.nameEn)}`;
        const o = Store.getOrganization(v); if (o) return esc(LANG === 'ar' ? o.name : (o.nameEn || o.name));
        return esc(v);
      }
      case 'tags': return v.map(x => `<span class="tag">${esc(x)}</span>`).join(' ');
      case 'attachments': return v.map(a => `<span class="tag">📎 ${esc(a.name)}</span>`).join(' ');
      case 'priority': return UI.prioChip(v);
      case 'select': return esc(UI.optLabel(v));
      default: {
        // resolve master-data ids (organizations / people) to display names
        const o = Store.getOrganization && Store.getOrganization(v);
        if (o) return esc(LANG === 'ar' ? o.name : (o.nameEn || o.name));
        const p = Store.getPerson && Store.getPerson(v);
        if (p) return esc(LANG === 'ar' ? p.name : (p.nameEn || p.name));
        return esc(String(v)).replace(/\n/g, '<br>');
      }
    }
  },

  empty(icon, msg) {
    return `<div class="empty"><div class="e-ico">${icon}</div><div>${esc(msg || t('noData'))}</div></div>`;
  },

  /* ---------- smart combobox for master data ---------- */
  smartCombo(id, options, settings = {}) {
    const {
      value = '',
      placeholder = '',
      displayFn = null,
      freeText = true,
      category = null,
      allowAdd = true
    } = settings;

    const uid = Math.random().toString(36).slice(2, 8);
    const cid = `smart_${id}_${uid}`;

    return `<div class="smart-combo" id="${cid}" style="position:relative">
      <input type="text" class="input smart-combo-input" placeholder="${placeholder}" value="${esc(value)}"
             data-cid="${cid}" data-category="${category || ''}" autocomplete="off"
             style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px">
      <div class="smart-combo-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--bg-2);border:1px solid var(--border);border-radius:6px;margin-top:2px;max-height:240px;overflow-y:auto;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,0.15)">
        <div class="smart-combo-list" style="max-height:200px;overflow-y:auto"></div>
        ${freeText && allowAdd ? `<div class="smart-combo-add" style="padding:10px 12px;cursor:pointer;color:var(--accent);font-weight:500;border-top:1px solid var(--border);text-align:center;background:rgba(0,0,0,0.2)">+ ${TX('إضافة', 'Add')}</div>` : ''}
      </div>
    </div>`;
  },

  initSmartCombo(container, id, options, onSelect, settings = {}) {
    const el = container.querySelector(`[id^="smart_${id}_"]`);
    if (!el) return;

    const input = el.querySelector('.smart-combo-input');
    const dropdown = el.querySelector('.smart-combo-dropdown');
    const listDiv = el.querySelector('.smart-combo-list');
    const addBtn = el.querySelector('.smart-combo-add');
    const category = input.getAttribute('data-category');

    const renderOptions = (items) => {
      listDiv.innerHTML = items.map((opt, idx) => {
        const text = displayFn ? settings.displayFn(opt) : (opt.name || opt.nameEn || opt.label?.ar || opt.label?.en || opt);
        const val = opt.id || opt.key || opt;
        return `<div class="smart-combo-option" data-value="${esc(val)}" style="padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border);background:${idx % 2 ? 'transparent' : 'rgba(255,255,255,0.02)'}">${esc(text)}</div>`;
      }).join('');

      el.querySelectorAll('.smart-combo-option').forEach(opt => {
        opt.addEventListener('click', () => {
          const val = opt.getAttribute('data-value');
          const text = opt.textContent;
          input.value = text;
          onSelect(val, text);
          dropdown.style.display = 'none';
        });
      });
    };

    const filterAndShow = () => {
      const q = input.value.toLowerCase().trim();
      const filtered = !q ? options : options.filter(opt => {
        const text = (opt.name || opt.nameEn || opt.label?.ar || opt.label?.en || opt.toString()).toLowerCase();
        return text.includes(q);
      });

      if (q && filtered.length === 0 && settings.freeText) {
        // Show "Add new" option
        listDiv.innerHTML = `<div style="padding:10px 12px;color:var(--mutedText);text-align:center">${TX('لا نتائج', 'No results')}</div>`;
        dropdown.style.display = 'block';
      } else {
        renderOptions(filtered);
        dropdown.style.display = filtered.length > 0 || q ? 'block' : 'none';
      }
    };

    input.addEventListener('input', filterAndShow);
    input.addEventListener('focus', () => {
      dropdown.style.display = 'block';
      filterAndShow();
    });

    document.addEventListener('click', (e) => {
      if (!el.contains(e.target)) dropdown.style.display = 'none';
    });

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const val = input.value.trim();
        if (val) {
          // Add to master data if category specified
          if (category && Store.db.masterData[category]) {
            const newItem = { id: uid(category), name: val, active: true, archived: false };
            Store.addToMasterList(category, newItem);
            // Add to current options
            options.push(newItem);
          }
          onSelect(val, val);
          dropdown.style.display = 'none';
        }
      });
    }

    renderOptions(options);
  },

  /* ---------- searchable combo box (legacy) ---------- */
  searchCombo(id, options, onSelect, { placeholder = '', multi = false, freeText = true, displayFn = null } = {}) {
    const idNum = Math.random().toString(36).slice(2, 9);
    const htmlId = `combo_${id}_${idNum}`;

    return `<div class="search-combo" id="${htmlId}">
      <input type="text" class="input combo-input" placeholder="${placeholder}" data-combo-search data-combo-id="${htmlId}">
      <div class="combo-results hidden" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--bg-2);border:1px solid var(--border);border-radius:6px;max-height:200px;overflow-y:auto;z-index:100">
        ${options.map(opt => `<div class="combo-result" data-value="${esc(opt.id || opt.key || opt)}" title="${esc(displayFn ? displayFn(opt) : (opt.name || opt))}" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border)">${esc(displayFn ? displayFn(opt) : (opt.name || opt))}</div>`).join('')}
        ${freeText ? `<div class="combo-add" style="padding:8px 12px;cursor:pointer;color:var(--accent);font-weight:500;border-top:1px solid var(--border)">+ ${t('add')}</div>` : ''}
      </div>
      <div class="combo-selected flex" style="flex-wrap:wrap;gap:6px;margin-top:8px"></div>
    </div>`;
  },

  initSearchCombo(container, id, options, onSelect, config = {}) {
    const comboEl = container.querySelector(`[id^="combo_${id}_"]`);
    if (!comboEl) return;

    const input = comboEl.querySelector('.combo-input');
    const results = comboEl.querySelector('.combo-results');
    const selected = comboEl.querySelector('.combo-selected');
    const resultItems = comboEl.querySelectorAll('.combo-result');
    const addBtn = comboEl.querySelector('.combo-add');

    input.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      let visible = 0;
      resultItems.forEach(item => {
        const match = !q || item.textContent.toLowerCase().includes(q);
        item.style.display = match ? 'block' : 'none';
        if (match) visible++;
      });
      results.style.display = visible > 0 || config.freeText ? 'block' : 'none';
    });

    resultItems.forEach(item => {
      item.addEventListener('click', () => {
        const val = item.getAttribute('data-value');
        const text = item.textContent;
        onSelect(val, text);
        input.value = '';
        results.style.display = 'none';
      });
    });

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const val = input.value.trim();
        if (val) {
          onSelect(val, val);
          input.value = '';
          results.style.display = 'none';
        }
      });
    }
  },
};
