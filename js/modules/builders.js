/* ============================================================
   Dashboard Builder (drag & drop widgets, custom KPIs)
   + Workflow Builder (no-code approvals/reviews/escalations)
   ============================================================ */

const ModDashBuilder = {
  currentId: null,

  render(container) {
    const dbs = Store.db.dashboards;
    if (!this.currentId && dbs.length) this.currentId = dbs[0].id;
    const cur = dbs.find(d => d.id === this.currentId);

    container.innerHTML = `
      <div class="reg-toolbar">
        <select class="input" id="db-pick" style="min-width:220px">
          ${dbs.map(d => `<option value="${d.id}" ${d.id === this.currentId ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}
        </select>
        <button class="btn" id="db-new">＋ ${t('newDashboard')}</button>
        ${cur ? `<button class="btn danger sm" id="db-del">🗑</button>` : ''}
        <div class="spacer"></div>
        <span class="fs12 mut">↔️ ${t('dragHint')}</span>
        ${cur ? `<button class="btn primary" id="db-addw">＋ ${t('addWidget')}</button>` : ''}
      </div>
      <div class="grid g3" id="db-grid"></div>`;

    container.querySelector('#db-pick').onchange = e => { this.currentId = e.target.value; this.render(container); };
    container.querySelector('#db-new').onclick = () => this.newDashboard(container);
    const del = container.querySelector('#db-del');
    if (del) del.onclick = () => UI.confirm(t('confirmDelete'), () => {
      Store.db.dashboards = dbs.filter(d => d.id !== this.currentId);
      this.currentId = null; Store.save(); this.render(container);
    });
    const addw = container.querySelector('#db-addw');
    if (addw) addw.onclick = () => this.widgetForm(container, cur);

    if (cur) this.renderWidgets(container.querySelector('#db-grid'), cur, container);
    else container.querySelector('#db-grid').innerHTML = UI.empty('📊', t('newDashboard'));
  },

  newDashboard(container) {
    const m = UI.modal(`
      <div class="drawer-h"><h2>＋ ${t('newDashboard')}</h2><button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b"><label class="fl">${t('name')}</label><input class="input" id="nd-name"></div>
      <div class="drawer-f"><button class="btn primary" id="nd-save">💾 ${t('save')}</button></div>`);
    m.el.querySelector('#nd-save').onclick = () => {
      const name = m.el.querySelector('#nd-name').value.trim();
      if (!name) return UI.toast(t('required'), 'err');
      const d = { id: uid('db'), name, owner: Store.db.currentUserId, widgets: [] };
      Store.db.dashboards.push(d); Store.save();
      this.currentId = d.id; m.close(); this.render(container);
    };
  },

  metricCount(w) {
    const recs = Store.list(w.entity);
    switch (w.metric) {
      case 'open': return recs.filter(r => !Store.isClosed(w.entity, r)).length;
      case 'overdue': return recs.filter(r => !Store.isClosed(w.entity, r) && Store.daysOver(r) > 0).length;
      case 'critical': return recs.filter(r => (r.priority === 'critical' || r.severity === 'critical' || (w.entity === 'risk' && Store.riskScore(r) >= 15)) && !Store.isClosed(w.entity, r)).length;
      default: return recs.length;
    }
  },

  groupData(w) {
    const recs = Store.list(w.entity);
    const sch = Store.schema(w.entity);
    if (w.groupBy === 'status') return sch.statuses.map(s => ({ label: tl(s.label), value: recs.filter(r => r.status === s.key).length, color: s.color }));
    if (w.groupBy === 'category') return (sch.categories || []).map(c => ({ label: tl(c.label), value: recs.filter(r => r.category === c.key).length })).filter(x => x.value);
    if (w.groupBy === 'contractor') return Store.db.contractors.map(c => ({ label: LANG === 'ar' ? c.name : c.nameEn, value: recs.filter(r => r.contractor === c.id).length })).filter(x => x.value);
    if (w.groupBy === 'assignee') return Store.db.users.map(u => ({ label: LANG === 'ar' ? u.name : u.nameEn, value: recs.filter(r => r.assignee === u.id || r.owner === u.id).length })).filter(x => x.value);
    return [];
  },

  widgetHtml(w) {
    const sch = Store.schema(w.entity);
    const palette = ['#22d3ee', '#f5b942', '#a78bfa', '#34d399', '#f87171', '#60a5fa', '#fb923c', '#f472b6'];
    if (w.type === 'kpi') {
      return `<div class="kpi" style="--kc:${w.color || 'var(--accent)'}">
        <div class="k-label">${esc(w.label)}</div><div class="k-value">${this.metricCount(w)}</div>
        <div class="k-ico">${sch.icon}</div><div class="k-sub">${tl(sch.label)}</div></div>`;
    }
    let data = this.groupData(w).map((d, i) => ({ ...d, color: d.color || palette[i % palette.length] }));
    if (w.type === 'donut') {
      return `<div class="panel"><div class="panel-h"><h3>${esc(w.label)}</h3></div>
        <div class="flex" style="justify-content:center">${Charts.donut(data, { size: 150, centerLabel: data.reduce((s, d) => s + d.value, 0), centerSub: t('total') })}</div>
        <div class="flexw mt8" style="justify-content:center">${data.map(d => `<span class="fs11 flex" style="gap:4px"><i style="width:8px;height:8px;border-radius:2px;background:${d.color};display:inline-block"></i>${esc(d.label)}</span>`).join('')}</div></div>`;
    }
    if (w.type === 'bar') {
      return `<div class="panel"><div class="panel-h"><h3>${esc(w.label)}</h3></div>${Charts.hbars(data.sort((a, b) => b.value - a.value).slice(0, 7))}</div>`;
    }
    // list
    const items = Store.list(w.entity).filter(r => !Store.isClosed(w.entity, r))
      .sort((a, b) => (w.entity === 'risk' ? Store.riskScore(b) - Store.riskScore(a) : (b.createdAt || '').localeCompare(a.createdAt || ''))).slice(0, 5);
    return `<div class="panel"><div class="panel-h"><h3>${esc(w.label)}</h3></div>
      ${items.map(r => `<div class="rank-row" style="padding:8px 2px">
        <span>${sch.icon}</span><div style="flex:1;min-width:0"><div class="fs12 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div>
        <div class="fs11 mut">${esc(r.ref)}</div></div>${UI.statusChip(w.entity, r.status)}</div>`).join('') || UI.empty(sch.icon)}</div>`;
  },

  renderWidgets(grid, dash, container) {
    grid.innerHTML = dash.widgets.map(w => `
      <div class="widget" draggable="true" data-wid="${w.id}">
        <div class="w-tools">
          <button class="x-btn" style="width:26px;height:26px;font-size:12px" data-edit="${w.id}">✏️</button>
          <button class="x-btn" style="width:26px;height:26px;font-size:12px" data-del="${w.id}">🗑</button>
        </div>
        ${this.widgetHtml(w)}
      </div>`).join('') || UI.empty('📊', t('addWidget'));

    let dragId = null;
    grid.querySelectorAll('.widget').forEach(el => {
      el.ondragstart = () => { dragId = el.dataset.wid; };
      el.ondragover = e => { e.preventDefault(); el.classList.add('drag-target'); };
      el.ondragleave = () => el.classList.remove('drag-target');
      el.ondrop = e => {
        e.preventDefault(); el.classList.remove('drag-target');
        const from = dash.widgets.findIndex(w => w.id === dragId);
        const to = dash.widgets.findIndex(w => w.id === el.dataset.wid);
        if (from < 0 || to < 0 || from === to) return;
        const [moved] = dash.widgets.splice(from, 1);
        dash.widgets.splice(to, 0, moved);
        Store.save(); this.render(container);
      };
    });
    grid.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      dash.widgets = dash.widgets.filter(w => w.id !== b.dataset.del);
      Store.save(); this.render(container);
    });
    grid.querySelectorAll('[data-edit]').forEach(b => b.onclick = () =>
      this.widgetForm(container, dash, dash.widgets.find(w => w.id === b.dataset.edit)));
  },

  widgetForm(container, dash, w) {
    const entities = Object.keys(Store.db.schemas);
    const m = UI.modal(`
      <div class="drawer-h"><h2>${w ? '✏️' : '＋'} ${t('addWidget')}</h2><button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b"><div class="form-grid">
        <div class="full"><label class="fl">${t('name')}</label><input class="input" id="wf-label" value="${esc(w ? w.label : '')}"></div>
        <div><label class="fl">${t('widgetType')}</label>
          <select class="input" id="wf-type">
            ${[['kpi', 'KPI'], ['donut', 'Donut'], ['bar', 'Bars'], ['list', t('vList')]].map(([k, l]) =>
              `<option value="${k}" ${w && w.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div><label class="fl">${t('entity')}</label>
          <select class="input" id="wf-entity">${entities.map(e =>
            `<option value="${e}" ${w && w.entity === e ? 'selected' : ''}>${Store.db.schemas[e].icon} ${tl(Store.db.schemas[e].label)}</option>`).join('')}</select></div>
        <div><label class="fl">${t('metric')} (KPI)</label>
          <select class="input" id="wf-metric">${[['total', t('total')], ['open', t('openItems')], ['overdue', t('overdue')], ['critical', t('pCritical')]].map(([k, l]) =>
            `<option value="${k}" ${w && w.metric === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div><label class="fl">${t('groupBy')} (Donut/Bars)</label>
          <select class="input" id="wf-group">${[['status', t('status')], ['category', t('category')], ['contractor', t('contractor')], ['assignee', t('assignee')]].map(([k, l]) =>
            `<option value="${k}" ${w && w.groupBy === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div><label class="fl">${t('color')}</label><input type="color" class="input" id="wf-color" value="${w && w.color ? w.color : '#22d3ee'}" style="height:40px;padding:4px"></div>
      </div></div>
      <div class="drawer-f"><button class="btn primary" id="wf-save">💾 ${t('save')}</button><button class="btn" data-close>${t('cancel')}</button></div>`);
    m.el.querySelector('#wf-save').onclick = () => {
      const label = m.el.querySelector('#wf-label').value.trim();
      if (!label) return UI.toast(t('required'), 'err');
      const data = {
        label, type: m.el.querySelector('#wf-type').value, entity: m.el.querySelector('#wf-entity').value,
        metric: m.el.querySelector('#wf-metric').value, groupBy: m.el.querySelector('#wf-group').value,
        color: m.el.querySelector('#wf-color').value,
      };
      if (w) Object.assign(w, data);
      else dash.widgets.push(Object.assign({ id: uid('w') }, data));
      Store.save(); m.close(); this.render(container);
    };
  },
};

/* ============ Workflow Builder ============ */
const ModWorkflow = {
  render(container) {
    const wfs = Store.db.workflows;
    container.innerHTML = `
      <div class="reg-toolbar">
        <div class="fs12 mut">🔀 ${LANG === 'ar' ? 'ابنِ مسارات الموافقات والمراجعات والإشعارات والتصعيد دون برمجة' : 'Build approvals, reviews, notifications and escalations — no code'}</div>
        <div class="spacer"></div>
        <button class="btn primary" id="wf-new">＋ ${t('newWorkflow')}</button>
      </div>
      <div class="grid g2">${wfs.map(wf => {
        const sch = Store.db.schemas[wf.entity];
        return `<div class="panel">
          <div class="panel-h"><span>${sch ? sch.icon : '🔀'}</span>
            <h3>${esc(wf.name)}</h3>
            <span class="chip" style="--cc:${wf.active ? '#34d399' : '#64748b'}">${wf.active ? t('active') : t('inactive')}</span>
            <div class="spacer"></div>
            <button class="btn sm" data-tg="${wf.id}">${wf.active ? '⏸' : '▶️'}</button>
            <button class="btn sm" data-ed="${wf.id}">✏️</button>
            <button class="btn sm danger" data-dl="${wf.id}">🗑</button>
          </div>
          <div class="fs11 mut" style="margin-bottom:12px">${t('entity')}: ${sch ? tl(sch.label) : wf.entity} ·
            ${t('trigger')}: ${wf.trigger === 'onCreate' ? t('onCreate') : t('onStatus') + (wf.triggerValue ? ` → ${wf.triggerValue}` : '')}</div>
          ${wf.steps.map((s, i) => `
            ${i ? '<div class="wf-arrow">↓</div>' : ''}
            <div class="wf-step"><span class="wf-num">${i + 1}</span>
              <div style="flex:1"><b class="fs13">${esc(s.label)}</b>
                <div class="fs11 mut">${{ approval: '✍️ ' + t('stepApproval'), review: '🔍 ' + t('stepReview'), notify: '🔔 ' + t('stepNotify'), escalate: '🚨 ' + t('stepEscalate') }[s.type] || s.type}
                  · ${tl((Store.db.roles.find(r => r.key === s.role) || {}).label) || s.role}</div></div>
              ${s.afterDays ? `<span class="tag">⏱ ${s.afterDays} ${t('days')}</span>` : ''}
            </div>`).join('')}
        </div>`;
      }).join('') || UI.empty('🔀')}</div>`;

    container.querySelector('#wf-new').onclick = () => this.form(container, null);
    container.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => this.form(container, wfs.find(w => w.id === b.dataset.ed)));
    container.querySelectorAll('[data-tg]').forEach(b => b.onclick = () => {
      const wf = wfs.find(w => w.id === b.dataset.tg); wf.active = !wf.active; Store.save(); this.render(container);
    });
    container.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => UI.confirm(t('confirmDelete'), () => {
      Store.db.workflows = wfs.filter(w => w.id !== b.dataset.dl); Store.save(); this.render(container);
    }));
  },

  form(container, wf) {
    const entities = Object.keys(Store.db.schemas);
    const steps = wf ? JSON.parse(JSON.stringify(wf.steps)) : [];
    const m = UI.modal(`
      <div class="drawer-h"><h2>🔀 ${wf ? t('edit') : t('newWorkflow')}</h2><button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b">
        <div class="form-grid">
          <div class="full"><label class="fl">${t('name')}</label><input class="input" id="w-name" value="${esc(wf ? wf.name : '')}"></div>
          <div><label class="fl">${t('entity')}</label><select class="input" id="w-entity">${entities.map(e =>
            `<option value="${e}" ${wf && wf.entity === e ? 'selected' : ''}>${tl(Store.db.schemas[e].label)}</option>`).join('')}</select></div>
          <div><label class="fl">${t('trigger')}</label><select class="input" id="w-trigger">
            <option value="onCreate" ${wf && wf.trigger === 'onCreate' ? 'selected' : ''}>${t('onCreate')}</option>
            <option value="onStatus" ${wf && wf.trigger === 'onStatus' ? 'selected' : ''}>${t('onStatus')}</option></select></div>
        </div>
        <div class="section-t">${LANG === 'ar' ? 'الخطوات' : 'Steps'}</div>
        <div id="w-steps"></div>
        <button class="btn sm mt8" id="w-add">＋ ${t('addStep')}</button>
      </div>
      <div class="drawer-f"><button class="btn primary" id="w-save">💾 ${t('save')}</button><button class="btn" data-close>${t('cancel')}</button></div>`, { wide: true });

    const renderSteps = () => {
      m.el.querySelector('#w-steps').innerHTML = steps.map((s, i) => `
        <div class="wf-step" style="margin-bottom:8px">
          <span class="wf-num">${i + 1}</span>
          <select class="input" style="width:130px" data-sf="type|${i}">
            ${[['approval', t('stepApproval')], ['review', t('stepReview')], ['notify', t('stepNotify')], ['escalate', t('stepEscalate')]].map(([k, l]) =>
              `<option value="${k}" ${s.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <input class="input" style="flex:1" data-sf="label|${i}" value="${esc(s.label)}" placeholder="${t('description')}">
          <select class="input" style="width:140px" data-sf="role|${i}">
            ${Store.db.roles.map(r => `<option value="${r.key}" ${s.role === r.key ? 'selected' : ''}>${tl(r.label)}</option>`).join('')}</select>
          <input class="input" type="number" style="width:75px" data-sf="afterDays|${i}" value="${s.afterDays || 0}" title="${t('afterDays')}">
          <button class="x-btn" data-srm="${i}">✕</button>
        </div>`).join('') || `<div class="fs12 mut">${t('noData')}</div>`;
      m.el.querySelectorAll('[data-sf]').forEach(inp => inp.onchange = () => {
        const [f, i] = inp.dataset.sf.split('|');
        steps[+i][f] = f === 'afterDays' ? +inp.value : inp.value;
      });
      m.el.querySelectorAll('[data-srm]').forEach(b => b.onclick = () => { steps.splice(+b.dataset.srm, 1); renderSteps(); });
    };
    renderSteps();
    m.el.querySelector('#w-add').onclick = () => { steps.push({ type: 'approval', label: '', role: 'pm', afterDays: 0 }); renderSteps(); };
    m.el.querySelector('#w-save').onclick = () => {
      const name = m.el.querySelector('#w-name').value.trim();
      if (!name) return UI.toast(t('required'), 'err');
      const data = { name, entity: m.el.querySelector('#w-entity').value, trigger: m.el.querySelector('#w-trigger').value, steps };
      if (wf) Object.assign(wf, data);
      else Store.db.workflows.push(Object.assign({ id: uid('wf'), active: true, triggerValue: '' }, data));
      Store.save(); m.close(); this.render(container); UI.toast(t('saved'));
    };
  },
};
