/* ============================================================
   Document Control Center — drawings, reports, ITPs, method
   statements, submittals, RFIs, transmittals; versions & approvals
   ============================================================ */

const ModDocuments = {
  render(container) {
    Engine.modulePage(container, 'document', [
      { key: 'dash', icon: '📊', label: t('tDashboard'), render: (b, rr) => this.dashboard(b, rr) },
      { key: 'register', icon: '📐', label: t('tRegister') },
      { key: 'approvals', icon: '✍️', label: t('approvalFlow'), render: (b, rr) => this.approvals(b, rr) },
    ]);
  },

  typeIcons: { drawing: '📐', report: '📄', itp: '✅', methodStatement: '🛠', submittal: '📦', rfi: '❓', transmittal: '📨' },

  dashboard(b, rr) {
    const docs = Store.list('document');
    const inReview = docs.filter(d => d.status === 'review');
    const lateReview = inReview.filter(d => d.dueDate && Store.daysOver(d) > 0);
    const rejected = docs.filter(d => d.status === 'rejected');
    const types = Object.keys(this.typeIcons);

    b.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi" style="--kc:var(--accent)"><div class="k-label">${t('total')}</div><div class="k-value">${docs.length}</div><div class="k-ico">📐</div>
          <div class="k-sub">${[...new Set(docs.map(d => d.docType))].length} ${LANG === 'ar' ? 'أنواع' : 'types'}</div></div>
        <div class="kpi" style="--kc:var(--gold)"><div class="k-label">${LANG === 'ar' ? 'قيد المراجعة' : 'Under Review'}</div><div class="k-value">${inReview.length}</div><div class="k-ico">🔍</div>
          <div class="k-sub">${lateReview.length} ${LANG === 'ar' ? 'متأخرة عن موعد المراجعة' : 'past review due'}</div></div>
        <div class="kpi" style="--kc:var(--red)"><div class="k-label">${LANG === 'ar' ? 'مرفوضة' : 'Rejected'}</div><div class="k-value">${rejected.length}</div><div class="k-ico">✖️</div>
          <div class="k-sub">${LANG === 'ar' ? 'تتطلب إعادة تقديم' : 'resubmission required'}</div></div>
        <div class="kpi" style="--kc:var(--green)"><div class="k-label">${LANG === 'ar' ? 'نسبة الاعتماد' : 'Approval Rate'}</div>
          <div class="k-value">${docs.length ? Math.round(docs.filter(d => ['approved', 'approvedc'].includes(d.status)).length / docs.length * 100) : 0}%</div><div class="k-ico">✍️</div></div>
      </div>
      <div class="grid g2">
        <div class="panel"><div class="panel-h"><span>🗂</span><h3>${LANG === 'ar' ? 'حسب نوع الوثيقة' : 'By Document Type'}</h3></div>
          ${Charts.columns(types.map(tp => ({ label: UI.optLabel(tp), value: docs.filter(d => d.docType === tp).length })).filter(x => x.value))}</div>
        <div class="panel"><div class="panel-h"><span>🍩</span><h3>${t('status')}</h3></div>
          <div class="flex" style="justify-content:center">${Charts.donut(Store.schema('document').statuses.map(s => ({
            label: tl(s.label), value: docs.filter(d => d.status === s.key).length, color: s.color
          })), { size: 165, centerLabel: docs.length, centerSub: t('total') })}</div>
          <div class="flexw mt8" style="justify-content:center">${Store.schema('document').statuses.map(s =>
            `<span class="fs11 flex" style="gap:4px"><i style="width:8px;height:8px;border-radius:3px;background:${s.color};display:inline-block"></i>${tl(s.label)}</span>`).join('')}</div></div>
      </div>`;
  },

  approvals(b, rr) {
    const wf = Store.db.workflows.find(w => w.entity === 'document');
    const inReview = Store.list('document').filter(d => d.status === 'review')
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    b.innerHTML = `
      <div class="grid g32">
        <div class="panel">
          <div class="panel-h"><span>🔀</span><h3>${t('approvalFlow')}</h3></div>
          ${wf ? wf.steps.map((s, i) => `
            ${i ? '<div class="wf-arrow">↓</div>' : ''}
            <div class="wf-step"><span class="wf-num">${i + 1}</span>
              <div style="flex:1"><b class="fs13">${esc(s.label)}</b>
                <div class="fs11 mut">${tl((Store.db.roles.find(r => r.key === s.role) || {}).label)}</div></div>
              ${s.afterDays ? `<span class="tag">⏱ ${s.afterDays} ${t('days')}</span>` : ''}
            </div>`).join('') : UI.empty('🔀')}
        </div>
        <div class="panel">
          <div class="panel-h"><span>✍️</span><h3>${LANG === 'ar' ? 'وثائق قيد المراجعة' : 'Documents Under Review'}</h3>
            <span class="chip" style="--cc:#f5b942">${inReview.length}</span></div>
          ${inReview.map(d => `
            <div class="rank-row">
              <span style="font-size:17px">${this.typeIcons[d.docType] || '📄'}</span>
              <div style="flex:1;min-width:0" class="clickable" data-id="${d.id}">
                <div class="fs12 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(d.title)}</div>
                <div class="fs11 mut">${esc(d.docNumber || '')} · Rev.${esc(d.revision || '-')} · ${UI.optLabel(d.discipline)}</div></div>
              ${UI.dueBadge(d, 'document')}
              <button class="btn sm primary" data-ap="${d.id}">✓ ${LANG === 'ar' ? 'اعتماد' : 'Approve'}</button>
              <button class="btn sm" data-ac="${d.id}">✓± ${LANG === 'ar' ? 'بملاحظات' : 'w/ comments'}</button>
              <button class="btn sm danger" data-rj="${d.id}">✖</button>
            </div>`).join('') || UI.empty('🎉', LANG === 'ar' ? 'لا توجد وثائق قيد المراجعة' : 'Nothing under review')}
        </div>
      </div>`;
    b.querySelectorAll('[data-id]').forEach(el => el.onclick = () => Engine.detail('document', el.dataset.id, rr));
    const act = (sel, status, txtAr, txtEn) => b.querySelectorAll(sel).forEach(btn => btn.onclick = () => {
      Store.update('document', btn.dataset.ap || btn.dataset.ac || btn.dataset.rj, { status }, LANG === 'ar' ? txtAr : txtEn);
      UI.toast(t('updated')); rr();
    });
    act('[data-ap]', 'approved', '✅ اعتمدت الوثيقة', '✅ Document approved');
    act('[data-ac]', 'approvedc', '✅ اعتمدت بملاحظات', '✅ Approved with comments');
    act('[data-rj]', 'rejected', '✖️ رُفضت الوثيقة', '✖️ Document rejected');
  },
};
