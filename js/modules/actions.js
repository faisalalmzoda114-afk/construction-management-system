/* ============================================================
   Action Management Center — source-linked actions,
   aging dashboard, overdue dashboard, responsibility matrix
   ============================================================ */

const ModActions = {
  render(container) {
    Engine.modulePage(container, 'action', [
      { key: 'dash', icon: '📊', label: t('tDashboard'), render: (b, rr) => this.dashboard(b, rr) },
      { key: 'register', icon: '⚡', label: t('tRegister') },
      { key: 'overdue', icon: '⏰', label: t('overdueDash'), render: (b, rr) => this.overdue(b, rr) },
      { key: 'matrix', icon: '🧑‍🤝‍🧑', label: t('respMatrix'), render: (b, rr) => this.matrix(b, rr) },
    ]);
  },

  dashboard(b, rr) {
    const acts = Store.list('action');
    const open = acts.filter(a => !Store.isClosed('action', a));
    const overdue = open.filter(a => Store.daysOver(a) > 0);
    const done = acts.filter(a => a.status === 'completed');
    const blocked = acts.filter(a => a.status === 'blocked');

    // aging buckets for open actions
    const buckets = [[0, 7, '0-7'], [8, 14, '8-14'], [15, 30, '15-30'], [31, 60, '31-60'], [61, 9999, '+60']];
    const aging = buckets.map(([lo, hi, lbl]) => ({
      label: lbl + ' ' + t('days'), value: open.filter(a => { const d = Store.ageDays(a); return d >= lo && d <= hi; }).length,
      color: lo >= 31 ? 'var(--red)' : lo >= 15 ? 'var(--orange)' : 'var(--accent)'
    }));

    const sources = ['meeting', 'observation', 'risk', 'issue', 'correspondence', 'lesson', 'manual'];
    const bySource = sources.map(s => ({ label: UI.optLabel(s), value: acts.filter(a => a.sourceType === s).length }))
      .filter(x => x.value > 0).sort((a, b) => b.value - a.value);

    const trend = Store.trend('action');
    b.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi" style="--kc:var(--accent)"><div class="k-label">${t('openItems')}</div><div class="k-value">${open.length}</div><div class="k-ico">⚡</div>
          <div class="k-sub">${t('total')}: ${acts.length}</div></div>
        <div class="kpi" style="--kc:var(--red)"><div class="k-label">${t('overdue')}</div><div class="k-value">${overdue.length}</div><div class="k-ico">⏰</div>
          <div class="k-sub">${open.length ? Math.round(overdue.length / open.length * 100) : 0}% ${LANG === 'ar' ? 'من المفتوحة' : 'of open'}</div></div>
        <div class="kpi" style="--kc:var(--orange)"><div class="k-label">${tl(Store.statusDef('action', 'blocked').label)}</div><div class="k-value">${blocked.length}</div><div class="k-ico">🚧</div>
          <div class="k-sub">${LANG === 'ar' ? 'تتطلب تدخل الإدارة' : 'need management intervention'}</div></div>
        <div class="kpi" style="--kc:var(--green)"><div class="k-label">${tl(Store.statusDef('action', 'completed').label)}</div><div class="k-value">${done.length}</div><div class="k-ico">✅</div>
          <div class="k-sub">${acts.length ? Math.round(done.length / acts.length * 100) : 0}% ${LANG === 'ar' ? 'نسبة الإغلاق' : 'closure rate'}</div></div>
      </div>
      <div class="grid g3" style="margin-bottom:16px">
        <div class="panel"><div class="panel-h"><span>⏳</span><h3>${t('agingBuckets')}</h3></div>${Charts.columns(aging)}</div>
        <div class="panel"><div class="panel-h"><span>🧭</span><h3>${t('bySource')}</h3></div>
          ${Charts.hbars(bySource, {})}</div>
        <div class="panel"><div class="panel-h"><span>🍩</span><h3>${t('status')}</h3></div>
          <div class="flex" style="justify-content:center">${Charts.donut(Store.schema('action').statuses.map(s => ({
            label: tl(s.label), value: acts.filter(a => a.status === s.key).length, color: s.color
          })), { size: 160, centerLabel: acts.length, centerSub: t('total') })}</div>
          <div class="flexw mt8" style="justify-content:center">${Store.schema('action').statuses.map(s =>
            `<span class="fs11 flex" style="gap:4px"><i style="width:8px;height:8px;border-radius:3px;background:${s.color};display:inline-block"></i>${tl(s.label)}</span>`).join('')}</div>
        </div>
      </div>
      <div class="panel"><div class="panel-h"><span>📈</span><h3>${LANG === 'ar' ? 'اتجاه الإجراءات — منشأة مقابل مغلقة' : 'Action Trend — created vs closed'}</h3></div>
        ${Charts.line([
          { name: LANG === 'ar' ? 'منشأة' : 'Created', color: 'var(--accent)', values: trend.map(x => x.created) },
          { name: LANG === 'ar' ? 'مغلقة' : 'Closed', color: 'var(--green)', values: trend.map(x => x.closed) },
        ], { labels: trend.map(x => x.label) })}
      </div>`;
  },

  overdue(b, rr) {
    const open = Store.list('action').filter(a => !Store.isClosed('action', a) && Store.daysOver(a) > 0)
      .sort((x, y) => Store.daysOver(y) - Store.daysOver(x));
    b.innerHTML = `
      <div class="panel" style="border-color:rgba(248,113,113,.4)">
        <div class="panel-h"><span>🚨</span><h3>${t('overdueDash')}</h3><span class="chip lg" style="--cc:#f87171">${open.length}</span></div>
        ${open.length ? `<table class="tbl"><thead><tr><th>#</th><th>${t('title')}</th><th>${t('assignee')}</th><th>${t('source')}</th><th>${t('dueDate')}</th><th>${t('overdue')}</th><th>${t('status')}</th></tr></thead><tbody>
        ${open.map(a => `<tr data-id="${a.id}">
          <td class="mut fs12">${esc(a.ref)}</td>
          <td class="t-title">${esc(a.title)}</td>
          <td>${UI.avatar(a.assignee)} ${esc(Store.userName(a.assignee))}</td>
          <td class="fs12">${UI.optLabel(a.sourceType)}</td>
          <td class="fs12">${UI.fmtDate(a.dueDate)}</td>
          <td><span class="chip" style="--cc:#f87171">${Store.daysOver(a)} ${t('days')}</span></td>
          <td>${UI.statusChip('action', a.status)}</td>
        </tr>`).join('')}</tbody></table>` : UI.empty('🎉', LANG === 'ar' ? 'لا توجد إجراءات متأخرة' : 'No overdue actions')}
      </div>`;
    b.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => Engine.detail('action', tr.dataset.id, rr));
  },

  matrix(b, rr) {
    const acts = Store.list('action');
    const statuses = Store.schema('action').statuses;
    const byUser = Store.db.users.map(u => {
      const mine = acts.filter(a => a.assignee === u.id);
      return { u, mine, overdue: mine.filter(a => !Store.isClosed('action', a) && Store.daysOver(a) > 0).length };
    }).filter(x => x.mine.length);
    b.innerHTML = `
      <div class="panel">
        <div class="panel-h"><span>🧑‍🤝‍🧑</span><h3>${t('respMatrix')}</h3><span class="sub">${t('byAssignee')}</span></div>
        <table class="tbl"><thead><tr><th>${t('assignee')}</th>${statuses.map(s => `<th><span style="color:${s.color}">●</span> ${tl(s.label)}</th>`).join('')}
          <th>${t('overdue')}</th><th>${t('total')}</th></tr></thead><tbody>
        ${byUser.map(x => `<tr>
          <td><div class="flex">${UI.avatar(x.u.id)} <div><div class="t-title">${esc(LANG === 'ar' ? x.u.name : x.u.nameEn)}</div>
            <div class="t-sub">${tl((Store.db.roles.find(r => r.key === x.u.role) || {}).label)}</div></div></div></td>
          ${statuses.map(s => { const n = x.mine.filter(a => a.status === s.key).length; return `<td class="${n ? 'b' : 'mut'}">${n || '—'}</td>`; }).join('')}
          <td>${x.overdue ? `<span class="chip" style="--cc:#f87171">${x.overdue}</span>` : '—'}</td>
          <td class="b">${x.mine.length}</td>
        </tr>`).join('')}</tbody></table>
      </div>`;
  },
};
