/* ============================================================
   Engine — metadata-driven register engine
   Renders any entity type from its (admin-editable) schema:
   multi-view register, generated forms, detail drawer,
   cross-module source links, history, kanban drag & drop.
   ============================================================ */

const Engine = {
  state: {}, // per-type UI state: {view, q, fStatus, fCat, fContractor, archived}

  st(type) {
    if (!this.state[type]) {
      const sch = Store.schema(type);
      this.state[type] = { view: sch.views[0], q: '', fStatus: '', fCat: '', fContractor: '', archived: false };
    }
    return this.state[type];
  },

  filtered(type) {
    const s = this.st(type);
    let recs = Store.list(type, { archived: s.archived });
    if (s.q) {
      const q = s.q.toLowerCase();
      recs = recs.filter(r => (r.title || '').toLowerCase().includes(q) || (r.ref || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q));
    }
    if (s.fStatus) recs = recs.filter(r => r.status === s.fStatus);
    if (s.fCat) recs = recs.filter(r => r.category === s.fCat);
    if (s.fContractor) recs = recs.filter(r => r.contractor === s.fContractor);
    return recs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  /* ============ register (toolbar + active view) ============ */
  register(container, type, opts = {}) {
    const sch = Store.schema(type);
    const s = this.st(type);
    const views = { list: 'vList', kanban: 'vKanban', gallery: 'vGallery', timeline: 'vTimeline', map: 'vMap' };
    const icons = { list: '☰', kanban: '▦', gallery: '🖼', timeline: '⏱', map: '🗺' };

    container.innerHTML = `
      <div class="reg-toolbar">
        <input class="input" id="rg-q" placeholder="${t('search')}" value="${esc(s.q)}">
        <select class="input" id="rg-status"><option value="">${t('status')}: ${t('all')}</option>
          ${sch.statuses.map(x => `<option value="${x.key}" ${s.fStatus === x.key ? 'selected' : ''}>${tl(x.label)}</option>`).join('')}</select>
        ${(sch.categories || []).length ? `<select class="input" id="rg-cat"><option value="">${t('category')}: ${t('all')}</option>
          ${sch.categories.map(x => `<option value="${x.key}" ${s.fCat === x.key ? 'selected' : ''}>${tl(x.label)}</option>`).join('')}</select>` : ''}
        <select class="input" id="rg-con"><option value="">${t('contractor')}: ${t('all')}</option>
          ${Store.db.contractors.map(c => `<option value="${c.id}" ${s.fContractor === c.id ? 'selected' : ''}>${esc(LANG === 'ar' ? c.name : c.nameEn)}</option>`).join('')}</select>
        <div class="view-switch">${sch.views.map(v =>
          `<button class="${s.view === v ? 'active' : ''}" data-view="${v}" title="${t(views[v])}">${icons[v]} ${t(views[v])}</button>`).join('')}</div>
        <button class="btn sm ghost ${s.archived ? 'danger' : ''}" id="rg-arch">🗄 ${t('archived')}</button>
        <div class="spacer"></div>
        <button class="btn primary" id="rg-add">＋ ${t('add')} ${tl(sch.label)}</button>
      </div>
      <div id="rg-body"></div>`;

    const rerender = () => this.register(container, type, opts);
    container.querySelector('#rg-q').oninput = e => { s.q = e.target.value; this.renderView(container.querySelector('#rg-body'), type, opts); };
    container.querySelector('#rg-status').onchange = e => { s.fStatus = e.target.value; rerender(); };
    const catSel = container.querySelector('#rg-cat'); if (catSel) catSel.onchange = e => { s.fCat = e.target.value; rerender(); };
    container.querySelector('#rg-con').onchange = e => { s.fContractor = e.target.value; rerender(); };
    container.querySelector('#rg-arch').onclick = () => { s.archived = !s.archived; rerender(); };
    container.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { s.view = b.dataset.view; rerender(); });
    container.querySelector('#rg-add').onclick = () => this.form(type, null, rerender);

    this.renderView(container.querySelector('#rg-body'), type, opts);
  },

  renderView(body, type, opts = {}) {
    const s = this.st(type);
    const recs = this.filtered(type);
    const rerender = () => this.renderView(body, type, opts);
    if (!recs.length) { body.innerHTML = UI.empty(Store.schema(type).icon, t('noData')); return; }
    if (s.view === 'kanban') this.kanban(body, type, recs, rerender);
    else if (s.view === 'gallery') this.gallery(body, type, recs, rerender);
    else if (s.view === 'timeline') this.timeline(body, type, recs, rerender);
    else if (s.view === 'map') this.map(body, type, recs, rerender);
    else this.listView(body, type, recs, rerender, opts);
  },

  cardMeta(type, r) {
    const bits = [];
    if (r.priority) bits.push(UI.prioChip(r.priority));
    if (r.severity) bits.push(UI.prioChip(r.severity));
    if (type === 'risk') bits.push(`<span class="chip" style="--cc:${Charts.heatColor(Store.riskScore(r))}">⚡ ${Store.riskScore(r)}</span>`);
    bits.push(UI.dueBadge(r, type));
    if (r.assignee) bits.push(UI.avatar(r.assignee));
    else if (r.owner) bits.push(UI.avatar(r.owner));
    return bits.filter(Boolean).join(' ');
  },

  /* ---------- list ---------- */
  listView(body, type, recs, rerender) {
    const sch = Store.schema(type);
    const cols = sch.fields.filter(f => !['textarea', 'attachments', 'tags', 'gps'].includes(f.type) && f.key !== 'title').slice(0, 4);
    body.innerHTML = `<div class="panel" style="padding:6px 14px;overflow-x:auto">
      <table class="tbl"><thead><tr>
        <th>#</th><th>${t('title')}</th>${cols.map(c => `<th>${tl(c.label)}</th>`).join('')}<th>${t('status')}</th><th></th>
      </tr></thead><tbody>
      ${recs.map(r => `<tr data-id="${r.id}">
        <td class="mut fs12">${esc(r.ref)}</td>
        <td><div class="t-title">${esc(r.title)}</div><div class="t-sub">${UI.fmtDate(r.createdAt)} · ${(r.tags || []).map(x => `<span class="tag">${esc(x)}</span>`).join(' ')}</div></td>
        ${cols.map(c => `<td>${UI.fieldDisplay(type, c, r)}</td>`).join('')}
        <td>${UI.statusChip(type, r.status)} ${UI.dueBadge(r, type)}</td>
        <td class="fs12 mut">›</td>
      </tr>`).join('')}
      </tbody></table></div>`;
    body.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => this.detail(type, tr.dataset.id, rerender));
  },

  /* ---------- kanban with drag & drop ---------- */
  kanban(body, type, recs, rerender) {
    const sch = Store.schema(type);
    body.innerHTML = `<div class="kanban">${sch.statuses.map(st => {
      const items = recs.filter(r => r.status === st.key);
      return `<div class="kb-col" data-st="${st.key}">
        <div class="kb-col-h"><span style="color:${st.color}">●</span> ${tl(st.label)} <span class="cnt">${items.length}</span></div>
        ${items.map(r => `<div class="kb-card" draggable="true" data-id="${r.id}">
          <div class="kc-title">${esc(r.title)}</div>
          <div class="kc-meta"><span class="mut fs11">${esc(r.ref)}</span> ${this.cardMeta(type, r)}</div>
        </div>`).join('')}
      </div>`;
    }).join('')}</div>`;

    body.querySelectorAll('.kb-card').forEach(card => {
      card.onclick = () => this.detail(type, card.dataset.id, rerender);
      card.ondragstart = e => { e.dataTransfer.setData('text/plain', card.dataset.id); card.classList.add('dragging'); };
      card.ondragend = () => card.classList.remove('dragging');
    });
    body.querySelectorAll('.kb-col').forEach(col => {
      col.ondragover = e => { e.preventDefault(); col.classList.add('dragover'); };
      col.ondragleave = () => col.classList.remove('dragover');
      col.ondrop = e => {
        e.preventDefault(); col.classList.remove('dragover');
        const id = e.dataTransfer.getData('text/plain');
        const stDef = Store.statusDef(type, col.dataset.st);
        Store.update(type, id, { status: col.dataset.st },
          (LANG === 'ar' ? 'تغيير الحالة إلى: ' : 'Status changed to: ') + tl(stDef.label));
        UI.toast(t('updated')); rerender();
      };
    });
  },

  /* ---------- gallery ---------- */
  gallery(body, type, recs, rerender) {
    body.innerHTML = `<div class="gallery">${recs.map(r => {
      const st = Store.statusDef(type, r.status);
      return `<div class="g-card" data-id="${r.id}">
        <div class="g-photo">${r.emoji || Store.schema(type).icon}
          ${(r.photos || r.attachments || []).length ? `<span class="g-count">📷 ${(r.photos || r.attachments).length}</span>` : ''}
          <span class="chip" style="position:absolute;top:9px;inset-inline-start:10px;--cc:${st ? st.color : '#64748b'}">${st ? tl(st.label) : ''}</span>
        </div>
        <div class="g-body">
          <div class="g-title">${esc(r.title)}</div>
          <div class="g-meta"><span class="mut">${esc(r.ref)}</span> ${r.location ? `· 📍 ${esc(r.location)}` : ''}</div>
          <div class="g-meta mt8">${this.cardMeta(type, r)}</div>
        </div>
      </div>`;
    }).join('')}</div>`;
    body.querySelectorAll('.g-card').forEach(c => c.onclick = () => this.detail(type, c.dataset.id, rerender));
  },

  /* ---------- timeline ---------- */
  timeline(body, type, recs, rerender) {
    const sorted = [...recs].sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
    body.innerHTML = `<div class="timeline" style="max-width:780px">${sorted.map(r => {
      const st = Store.statusDef(type, r.status);
      return `<div class="tl-item" style="--tc:${st ? st.color : 'var(--accent)'}">
        <div class="tl-date">${UI.fmtDate(r.date || r.createdAt)}</div>
        <div class="tl-card" data-id="${r.id}">
          <div class="flex" style="justify-content:space-between"><b class="fs13">${esc(r.title)}</b>${UI.statusChip(type, r.status)}</div>
          <div class="flexw fs11 mut mt8"><span>${esc(r.ref)}</span> ${this.cardMeta(type, r)}</div>
        </div>
      </div>`;
    }).join('')}</div>`;
    body.querySelectorAll('.tl-card').forEach(c => c.onclick = () => this.detail(type, c.dataset.id, rerender));
  },

  /* ---------- map (schematic site plan with GPS pins) ---------- */
  map(body, type, recs, rerender) {
    const withPos = recs.filter(r => r.mapX != null);
    body.innerHTML = `<div class="mapview">
      ${withPos.map(r => `<div class="map-pin" style="top:${r.mapY}%;${LANG === 'ar' ? 'right' : 'left'}:${r.mapX}%;--pc:${UI.prioColors[r.priority] || '#60a5fa'}" data-id="${r.id}">
        <div class="pin"><span>${r.emoji || '📍'}</span></div>
        <div class="pin-label">${esc(r.ref)}</div>
      </div>`).join('')}
      <div class="map-legend">
        <div class="fs11 b mb14" style="margin-bottom:8px">${t('priority')}</div>
        ${['critical', 'high', 'medium', 'low'].map(p => `<div class="flex fs11" style="gap:7px;margin-bottom:4px">
          <span class="prio-dot" style="background:${UI.prioColors[p]}"></span>${UI.prioLabel(p)}</div>`).join('')}
      </div>
    </div>
    <div class="fs11 mut mt8">🛰 ${LANG === 'ar' ? 'مخطط الموقع التوضيحي — مواقع الملاحظات وفق الإحداثيات المسجلة' : 'Schematic site plan — pins placed from recorded coordinates'}</div>`;
    body.querySelectorAll('.map-pin').forEach(p => p.onclick = () => this.detail(type, p.dataset.id, rerender));
  },

  /* ============ create / edit form ============ */
  form(type, rec, onDone) {
    const sch = Store.schema(type);
    const m = UI.modal(`
      <div class="drawer-h"><h2>${rec ? '✏️ ' + t('edit') : '＋ ' + t('add')} — ${tl(sch.label)} ${rec ? `<span class="mut fs12">${esc(rec.ref)}</span>` : ''}</h2>
        <button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b">${UI.entityForm(type, rec)}</div>
      <div class="drawer-f"><button class="btn primary" id="ef-save">💾 ${t('save')}</button>
        <button class="btn" data-close>${t('cancel')}</button></div>`, { wide: true });
    m.el.querySelector('#ef-save').onclick = () => {
      const data = UI.collectForm(m.el, type);
      if (!data) return;
      if (rec) Store.update(type, rec.id, data);
      else Store.create(type, data);
      m.close(); UI.toast(t('saved'));
      if (onDone) onDone();
    };
  },

  /* ============ detail drawer ============ */
  detail(type, id, onChange) {
    // constraint records open as full case files in the tracker module
    if (type === 'constraint' && typeof ModTracker !== 'undefined') return ModTracker.openDetail(id, onChange);
    const rec = Store.get(type, id);
    if (!rec) return;
    const sch = Store.schema(type);

    // linked: actions sourced from this record + the source of this record (for actions)
    const linkedActions = Store.list('action', { all: true }).filter(a => a.sourceId === id);
    let sourceHtml = '';
    if (type === 'action' && rec.sourceId && rec.sourceType && rec.sourceType !== 'manual') {
      const src = Store.get(rec.sourceType, rec.sourceId);
      if (src) sourceHtml = `<div class="section-t">🔗 ${t('source')}</div>
        <div class="link-card" data-go="${rec.sourceType}|${src.id}">
          <span>${Store.schema(rec.sourceType).icon}</span>
          <div style="flex:1"><b class="fs13">${esc(src.title)}</b><div class="fs11 mut">${esc(src.ref)} · ${UI.optLabel(rec.sourceType)}</div></div>
          ${UI.statusChip(rec.sourceType, src.status)}
        </div>`;
    }

    const escalatable = sch.statuses.some(s => s.key === 'escalated');
    const dr = UI.drawer(`
      <div class="drawer-h">
        <span style="font-size:22px">${sch.icon}</span>
        <h2>${esc(rec.title)}<div class="fs11 mut" style="font-weight:500">${esc(rec.ref)} · ${t('createdAt')}: ${UI.fmtDate(rec.createdAt)} · ${Store.userName(rec.createdBy)}</div></h2>
        <button class="x-btn" data-close>✕</button>
      </div>
      <div class="drawer-b">
        <div class="flexw mb14">${UI.statusChip(type, rec.status, true)} ${this.cardMeta(type, rec)} ${rec.archived ? `<span class="chip" style="--cc:#94a3b8">🗄 ${t('archived')}</span>` : ''}</div>
        ${sch.fields.filter(f => f.key !== 'title').map(f => `
          <div class="dt-row"><div class="dt-k">${tl(f.label)}</div><div class="dt-v">${UI.fieldDisplay(type, f, rec)}</div></div>`).join('')}
        ${sourceHtml}
        <div class="section-t">🔗 ${t('linked')} (${linkedActions.length})</div>
        ${linkedActions.length ? linkedActions.map(a => `
          <div class="link-card" data-go="action|${a.id}">⚡
            <div style="flex:1"><b class="fs13">${esc(a.title)}</b><div class="fs11 mut">${esc(a.ref)} · ${Store.userName(a.assignee)}</div></div>
            ${UI.statusChip('action', a.status)}
          </div>`).join('') : `<div class="fs12 mut">${t('noData')}</div>`}
        ${type !== 'action' ? `<button class="btn sm mt8" id="dt-mkaction">⚡ ＋ ${LANG === 'ar' ? 'إنشاء إجراء من هذا السجل' : 'Create action from this record'}</button>` : ''}
        ${['observation', 'meeting', 'correspondence'].includes(type) && Store.db.schemas.constraint ? `
          <button class="btn sm gold mt8" id="dt-mkcst">🚩 ${LANG === 'ar' ? 'تحويل إلى معوق / مشكلة' : 'Convert to Issue / Constraint'}</button>` : ''}
        <div class="section-t">🕓 ${t('history')}</div>
        ${(rec.history || []).slice().reverse().map(h => `
          <div class="hist-item">${UI.avatar(h.by)}<div class="h-body"><div class="fs12">${esc(h.text)}</div>
          <div class="h-meta">${UI.fmtDate(h.at)} · ${Store.userName(h.by)}</div></div></div>`).join('')}
      </div>
      <div class="drawer-f">
        <button class="btn primary" id="dt-edit">✏️ ${t('edit')}</button>
        ${escalatable && rec.status !== 'escalated' ? `<button class="btn gold" id="dt-esc">🚨 ${t('escalate')}</button>` : ''}
        <button class="btn" id="dt-arch">🗄 ${rec.archived ? t('restore') : t('archive')}</button>
        <div class="spacer"></div>
        <button class="btn danger" id="dt-del">🗑 ${t('delete')}</button>
      </div>`);

    const refresh = () => { dr.close(); if (onChange) onChange(); };
    dr.el.querySelectorAll('[data-go]').forEach(el => el.onclick = () => {
      const [gt, gid] = el.dataset.go.split('|');
      dr.close(); this.detail(gt, gid, onChange);
    });
    dr.el.querySelector('#dt-edit').onclick = () => { dr.close(); this.form(type, rec, onChange); };
    dr.el.querySelector('#dt-del').onclick = () => UI.confirm(t('confirmDelete'), () => { Store.remove(type, id); UI.toast(t('deleted')); refresh(); });
    dr.el.querySelector('#dt-arch').onclick = () => { Store.setArchived(type, id, !rec.archived); UI.toast(t('updated')); refresh(); };
    const escBtn = dr.el.querySelector('#dt-esc');
    if (escBtn) escBtn.onclick = () => {
      Store.update(type, id, { status: 'escalated' }, LANG === 'ar' ? '🚨 تم التصعيد للإدارة التنفيذية' : '🚨 Escalated to executive management');
      UI.toast(t('escalated')); refresh();
    };
    const mkCst = dr.el.querySelector('#dt-mkcst');
    if (mkCst) mkCst.onclick = () => {
      dr.close();
      ModTracker.createFrom(type, rec, onChange);
    };
    const mkAct = dr.el.querySelector('#dt-mkaction');
    if (mkAct) mkAct.onclick = () => {
      dr.close();
      const sch2 = Store.schema('action');
      const m = UI.modal(`
        <div class="drawer-h"><h2>⚡ ${t('add')} — ${tl(sch2.label)}</h2><button class="x-btn" data-close>✕</button></div>
        <div class="drawer-b">${UI.entityForm('action', { title: `${LANG === 'ar' ? 'إجراء بشأن' : 'Action for'}: ${rec.title}`, sourceType: type, priority: rec.priority || 'medium', contractor: rec.contractor, dueDate: dOff(7) })}</div>
        <div class="drawer-f"><button class="btn primary" id="ma-save">💾 ${t('save')}</button><button class="btn" data-close>${t('cancel')}</button></div>`, { wide: true });
      m.el.querySelector('#ma-save').onclick = () => {
        const data = UI.collectForm(m.el, 'action');
        if (!data) return;
        data.sourceType = type; data.sourceId = id;
        Store.create('action', data);
        m.close(); UI.toast(t('saved'));
        if (onChange) onChange();
      };
    };
  },

  /* ============ module page with tabs (dashboard / register / analytics…) ============ */
  modulePage(container, type, tabs) {
    let active = tabs[0].key;
    const render = () => {
      container.innerHTML = `
        <div class="module-tabs">${tabs.map(tb =>
          `<button class="${tb.key === active ? 'active' : ''}" data-tab="${tb.key}">${tb.icon || ''} ${tb.label}</button>`).join('')}</div>
        <div id="mod-body"></div>`;
      container.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { active = b.dataset.tab; render(); });
      const body = container.querySelector('#mod-body');
      const tb = tabs.find(x => x.key === active);
      if (tb.key === 'register') this.register(body, type);
      else tb.render(body, () => render());
    };
    render();
  },
};
