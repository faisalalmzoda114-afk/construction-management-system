/* ============================================================
   Site Observation Center — gallery/kanban/timeline/map/list,
   photos, GPS, contractor, approval workflow status
   ============================================================ */

const ModObservations = {
  render(container) {
    Engine.modulePage(container, 'observation', [
      { key: 'dash', icon: '📊', label: t('tDashboard'), render: (b, rr) => this.dashboard(b, rr) },
      { key: 'register', icon: '📸', label: t('tRegister') },
      { key: 'workflow', icon: '🔀', label: t('approvalFlow'), render: (b, rr) => this.workflowTab(b, rr) },
    ]);
  },

  dashboard(b, rr) {
    const obs = Store.list('observation');
    const open = obs.filter(o => !Store.isClosed('observation', o));
    const crit = open.filter(o => o.priority === 'critical');
    const overdue = open.filter(o => Store.daysOver(o) > 0);
    const pendingAppr = obs.filter(o => o.status === 'review');
    const types = ['safety', 'quality', 'progress', 'environment', 'housekeeping'];
    const typeColors = { safety: 'var(--red)', quality: 'var(--gold)', progress: 'var(--green)', environment: 'var(--blue)', housekeeping: 'var(--purple)' };

    b.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi" style="--kc:var(--accent)"><div class="k-label">${t('openItems')}</div><div class="k-value">${open.length}</div><div class="k-ico">📸</div>
          <div class="k-sub">${t('total')}: ${obs.length}</div></div>
        <div class="kpi" style="--kc:var(--red)"><div class="k-label">${t('pCritical')}</div><div class="k-value">${crit.length}</div><div class="k-ico">🚨</div>
          <div class="k-sub">${LANG === 'ar' ? 'ملاحظات حرجة مفتوحة' : 'open critical observations'}</div></div>
        <div class="kpi" style="--kc:var(--orange)"><div class="k-label">${t('overdue')}</div><div class="k-value">${overdue.length}</div><div class="k-ico">⏰</div>
          <div class="k-sub">${LANG === 'ar' ? 'تجاوزت تاريخ الاستحقاق' : 'past due date'}</div></div>
        <div class="kpi" style="--kc:var(--gold)"><div class="k-label">${tl(Store.statusDef('observation', 'review').label)}</div><div class="k-value">${pendingAppr.length}</div><div class="k-ico">✍️</div>
          <div class="k-sub">${LANG === 'ar' ? 'بانتظار اعتماد الإغلاق' : 'awaiting closure approval'}</div></div>
      </div>
      <div class="grid g3" style="margin-bottom:16px">
        <div class="panel"><div class="panel-h"><span>🏷</span><h3>${LANG === 'ar' ? 'حسب النوع' : 'By Type'}</h3></div>
          ${Charts.columns(types.map(tp => ({ label: UI.optLabel(tp), value: obs.filter(o => o.obsType === tp).length, color: typeColors[tp] })))}</div>
        <div class="panel"><div class="panel-h"><span>🏗️</span><h3>${LANG === 'ar' ? 'المفتوحة حسب المقاول' : 'Open by Contractor'}</h3></div>
          ${Charts.hbars(Store.db.contractors.map(c => ({
            label: LANG === 'ar' ? c.name : c.nameEn,
            value: open.filter(o => o.contractor === c.id).length
          })).filter(x => x.value).sort((a, b) => b.value - a.value))}</div>
        <div class="panel"><div class="panel-h"><span>🍩</span><h3>${t('status')}</h3></div>
          <div class="flex" style="justify-content:center">${Charts.donut(Store.schema('observation').statuses.map(s => ({
            label: tl(s.label), value: obs.filter(o => o.status === s.key).length, color: s.color
          })), { size: 160, centerLabel: obs.length, centerSub: t('total') })}</div>
          <div class="flexw mt8" style="justify-content:center">${Store.schema('observation').statuses.map(s =>
            `<span class="fs11 flex" style="gap:4px"><i style="width:8px;height:8px;border-radius:3px;background:${s.color};display:inline-block"></i>${tl(s.label)}</span>`).join('')}</div></div>
      </div>
      <div class="panel" style="border-color:rgba(248,113,113,.35)">
        <div class="panel-h"><span>🚨</span><h3>${LANG === 'ar' ? 'الملاحظات الحرجة المفتوحة' : 'Open Critical Observations'}</h3></div>
        <div class="gallery">${crit.slice(0, 8).map(o => `
          <div class="g-card" data-id="${o.id}">
            <div class="g-photo">${o.emoji || '📸'}
              ${(o.photos || []).length ? `<span class="g-count">📷 ${o.photos.length}</span>` : ''}</div>
            <div class="g-body"><div class="g-title">${esc(o.title)}</div>
              <div class="g-meta"><span class="mut">${esc(o.ref)}</span> · 📍 ${esc(o.location || '')}</div>
              <div class="g-meta mt8">${UI.dueBadge(o, 'observation')} ${UI.statusChip('observation', o.status)}</div></div>
          </div>`).join('') || UI.empty('🎉')}</div>
      </div>`;
    b.querySelectorAll('[data-id]').forEach(el => el.onclick = () => Engine.detail('observation', el.dataset.id, rr));
  },

  workflowTab(b, rr) {
    const wf = Store.db.workflows.find(w => w.entity === 'observation');
    const pending = Store.list('observation').filter(o => o.status === 'review');
    b.innerHTML = `
      <div class="grid g32">
        <div class="panel">
          <div class="panel-h"><span>🔀</span><h3>${t('approvalFlow')}</h3>
            <div class="spacer"></div><button class="btn sm ghost" data-nav-wf>${t('mWorkflow')} ←</button></div>
          ${wf ? wf.steps.map((s, i) => `
            ${i ? '<div class="wf-arrow">↓</div>' : ''}
            <div class="wf-step"><span class="wf-num">${i + 1}</span>
              <div style="flex:1"><b class="fs13">${esc(s.label)}</b>
                <div class="fs11 mut">${{ approval: '✍️ ' + t('stepApproval'), review: '🔍 ' + t('stepReview'), notify: '🔔 ' + t('stepNotify'), escalate: '🚨 ' + t('stepEscalate') }[s.type]} · ${tl((Store.db.roles.find(r => r.key === s.role) || {}).label)}</div></div>
              ${s.afterDays ? `<span class="tag">⏱ ${s.afterDays} ${t('days')}</span>` : ''}
            </div>`).join('') : UI.empty('🔀')}
        </div>
        <div class="panel">
          <div class="panel-h"><span>✍️</span><h3>${LANG === 'ar' ? 'بانتظار الاعتماد' : 'Awaiting Approval'}</h3>
            <span class="chip" style="--cc:#f5b942">${pending.length}</span></div>
          ${pending.map(o => `
            <div class="rank-row">
              <span style="font-size:17px">${o.emoji || '📸'}</span>
              <div style="flex:1;min-width:0" class="clickable" data-id="${o.id}">
                <div class="fs12 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(o.title)}</div>
                <div class="fs11 mut">${esc(o.ref)} · ${Store.userName(o.assignee)}</div></div>
              <button class="btn sm primary" data-appr="${o.id}">✓ ${LANG === 'ar' ? 'اعتماد الإغلاق' : 'Approve'}</button>
              <button class="btn sm" data-rej="${o.id}">↩ ${LANG === 'ar' ? 'إرجاع' : 'Return'}</button>
            </div>`).join('') || UI.empty('🎉', LANG === 'ar' ? 'لا توجد ملاحظات بانتظار الاعتماد' : 'Nothing awaiting approval')}
        </div>
      </div>`;
    b.querySelectorAll('[data-id]').forEach(el => el.onclick = () => Engine.detail('observation', el.dataset.id, rr));
    b.querySelectorAll('[data-appr]').forEach(btn => btn.onclick = () => {
      Store.update('observation', btn.dataset.appr, { status: 'closed' }, LANG === 'ar' ? '✅ اعتماد الإغلاق وفق مسار العمل' : '✅ Closure approved per workflow');
      UI.toast(t('updated')); rr();
    });
    b.querySelectorAll('[data-rej]').forEach(btn => btn.onclick = () => {
      Store.update('observation', btn.dataset.rej, { status: 'inprogress' }, LANG === 'ar' ? '↩ أُعيدت للمعالجة' : '↩ Returned for rework');
      UI.toast(t('updated')); rr();
    });
    const nv = b.querySelector('[data-nav-wf]'); if (nv) nv.onclick = () => App.nav('workflow');
  },
};
