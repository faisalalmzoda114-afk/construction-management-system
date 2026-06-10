/* ============================================================
   Issues Management Center — register, RCA, severity,
   corrective/preventive actions, trend & closure analytics
   ============================================================ */

const ModIssues = {
  render(container) {
    Engine.modulePage(container, 'issue', [
      { key: 'dash', icon: '📊', label: t('tDashboard'), render: (b, rr) => this.dashboard(b, rr) },
      { key: 'register', icon: '🧩', label: t('tRegister') },
      { key: 'analytics', icon: '📈', label: t('tAnalytics'), render: (b, rr) => this.analytics(b, rr) },
    ]);
  },

  dashboard(b, rr) {
    const issues = Store.list('issue');
    const open = issues.filter(i => !Store.isClosed('issue', i));
    const crit = open.filter(i => i.severity === 'critical');
    const closed = issues.filter(i => Store.isClosed('issue', i));
    const noRCA = open.filter(i => !i.rootCause);
    const sevs = ['critical', 'high', 'medium', 'low'];

    b.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi" style="--kc:var(--accent)"><div class="k-label">${t('openItems')}</div><div class="k-value">${open.length}</div><div class="k-ico">🧩</div>
          <div class="k-sub">${t('total')}: ${issues.length}</div></div>
        <div class="kpi" style="--kc:var(--red)"><div class="k-label">${t('pCritical')}</div><div class="k-value">${crit.length}</div><div class="k-ico">🚨</div>
          <div class="k-sub">${LANG === 'ar' ? 'معضلات حرجة مفتوحة' : 'open critical issues'}</div></div>
        <div class="kpi" style="--kc:var(--gold)"><div class="k-label">${LANG === 'ar' ? 'دون تحليل سبب جذري' : 'Missing RCA'}</div><div class="k-value">${noRCA.length}</div><div class="k-ico">🔍</div>
          <div class="k-sub">${LANG === 'ar' ? 'تتطلب استكمال التحليل' : 'analysis required'}</div></div>
        <div class="kpi" style="--kc:var(--green)"><div class="k-label">${LANG === 'ar' ? 'نسبة الإغلاق' : 'Closure Rate'}</div>
          <div class="k-value">${issues.length ? Math.round(closed.length / issues.length * 100) : 0}%</div><div class="k-ico">✅</div>
          <div class="k-sub">${closed.length} ${t('closedItems')}</div></div>
      </div>
      <div class="grid g3" style="margin-bottom:16px">
        <div class="panel"><div class="panel-h"><span>🌡</span><h3>${t('severity')}</h3></div>
          ${Charts.columns(sevs.map(s => ({ label: UI.prioLabel(s), value: open.filter(i => i.severity === s).length, color: UI.prioColors[s] })))}</div>
        <div class="panel"><div class="panel-h"><span>🗂</span><h3>${t('category')}</h3></div>
          ${Charts.hbars((Store.schema('issue').categories || []).map(c => ({
            label: tl(c.label), value: open.filter(i => i.category === c.key).length
          })).filter(x => x.value).sort((a, b) => b.value - a.value))}</div>
        <div class="panel"><div class="panel-h"><span>🍩</span><h3>${t('status')}</h3></div>
          <div class="flex" style="justify-content:center">${Charts.donut(Store.schema('issue').statuses.map(s => ({
            label: tl(s.label), value: issues.filter(i => i.status === s.key).length, color: s.color
          })), { size: 160, centerLabel: open.length, centerSub: t('openItems') })}</div></div>
      </div>
      <div class="panel">
        <div class="panel-h"><span>🚨</span><h3>${LANG === 'ar' ? 'المعضلات الحرجة — جاهزية الإجراءات' : 'Critical Issues — action readiness'}</h3></div>
        ${crit.length ? `<table class="tbl"><thead><tr><th>#</th><th>${t('title')}</th><th>${t('rootCause')}</th><th>${t('correctiveAction')}</th><th>${t('preventiveAction')}</th><th>${t('status')}</th></tr></thead><tbody>
        ${crit.map(i => `<tr data-id="${i.id}">
          <td class="mut fs12">${esc(i.ref)}</td><td class="t-title">${esc(i.title)}</td>
          <td>${i.rootCause ? '✅' : '<span style="color:var(--red)">✖</span>'}</td>
          <td>${i.corrective ? '✅' : '<span style="color:var(--red)">✖</span>'}</td>
          <td>${i.preventive ? '✅' : '<span style="color:var(--red)">✖</span>'}</td>
          <td>${UI.statusChip('issue', i.status)}</td></tr>`).join('')}</tbody></table>` : UI.empty('🎉')}
      </div>`;
    b.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => Engine.detail('issue', tr.dataset.id, rr));
  },

  analytics(b, rr) {
    const trend = Store.trend('issue');
    const issues = Store.list('issue');
    const closed = issues.filter(i => Store.isClosed('issue', i));
    // closure time per category
    const cats = (Store.schema('issue').categories || []).map(c => {
      const cls = closed.filter(i => i.category === c.key);
      const avg = cls.length ? Math.round(cls.reduce((s, i) =>
        s + (new Date(i.updatedAt) - new Date(i.createdAt)) / 86400000, 0) / cls.length) : 0;
      return { label: tl(c.label), value: avg };
    }).filter(x => x.value > 0).sort((a, b) => b.value - a.value);

    b.innerHTML = `
      <div class="grid g2" style="margin-bottom:16px">
        <div class="panel"><div class="panel-h"><span>📈</span><h3>${LANG === 'ar' ? 'اتجاه المعضلات' : 'Issue Trend'}</h3></div>
          ${Charts.line([
            { name: LANG === 'ar' ? 'مسجلة' : 'Raised', color: 'var(--orange)', values: trend.map(x => x.created) },
            { name: LANG === 'ar' ? 'مغلقة' : 'Closed', color: 'var(--green)', values: trend.map(x => x.closed) },
          ], { labels: trend.map(x => x.label) })}</div>
        <div class="panel"><div class="panel-h"><span>⏱</span><h3>${LANG === 'ar' ? 'متوسط زمن الإغلاق حسب الفئة (يوم)' : 'Avg closure time by category (days)'}</h3></div>
          ${cats.length ? Charts.hbars(cats, { fmt: v => v + ' ' + t('days') }) : UI.empty('⏱')}</div>
      </div>
      <div class="panel">
        <div class="panel-h"><span>🏗️</span><h3>${LANG === 'ar' ? 'المعضلات المفتوحة حسب المقاول' : 'Open issues by contractor'}</h3></div>
        ${Charts.hbars(Store.db.contractors.map(c => ({
          label: LANG === 'ar' ? c.name : c.nameEn,
          value: issues.filter(i => i.contractor === c.id && !Store.isClosed('issue', i)).length
        })).filter(x => x.value).sort((a, b) => b.value - a.value))}
      </div>`;
  },
};
