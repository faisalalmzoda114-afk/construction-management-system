/* ============================================================
   Correspondence Center — incoming/outgoing, reference tracking,
   response due dates, automatic follow-up dashboard
   ============================================================ */

const ModCorrespondence = {
  render(container) {
    Engine.modulePage(container, 'correspondence', [
      { key: 'dash', icon: '📊', label: t('tDashboard'), render: (b, rr) => this.dashboard(b, rr) },
      { key: 'register', icon: '✉️', label: t('tRegister') },
      { key: 'followup', icon: '🔔', label: t('followUp'), render: (b, rr) => this.followUp(b, rr) },
    ]);
  },

  dashboard(b, rr) {
    const corr = Store.list('correspondence');
    const inc = corr.filter(c => c.direction === 'incoming');
    const out = corr.filter(c => c.direction === 'outgoing');
    const awaiting = corr.filter(c => c.status === 'awaiting');
    const esc_ = corr.filter(c => c.status === 'escalated');
    const late = corr.filter(c => !Store.isClosed('correspondence', c) && c.responseDue && Store.daysOver(c, 'responseDue') > 0);
    const trend = Store.trend('correspondence');

    b.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi" style="--kc:var(--blue)"><div class="k-label">${t('incoming')}</div><div class="k-value">${inc.length}</div><div class="k-ico">📥</div>
          <div class="k-sub">${t('outgoing')}: ${out.length}</div></div>
        <div class="kpi" style="--kc:var(--gold)"><div class="k-label">${t('awaitingResponse')}</div><div class="k-value">${awaiting.length}</div><div class="k-ico">⏳</div>
          <div class="k-sub">${LANG === 'ar' ? 'بانتظار رد رسمي' : 'awaiting formal reply'}</div></div>
        <div class="kpi" style="--kc:var(--red)"><div class="k-label">${LANG === 'ar' ? 'تجاوزت المهلة' : 'Past Due'}</div><div class="k-value">${late.length}</div><div class="k-ico">🚨</div>
          <div class="k-sub">${LANG === 'ar' ? 'مهلة الرد منقضية' : 'response deadline passed'}</div></div>
        <div class="kpi" style="--kc:var(--orange)"><div class="k-label">${t('escalated')}</div><div class="k-value">${esc_.length}</div><div class="k-ico">📛</div>
          <div class="k-sub">${LANG === 'ar' ? 'مُصعَّدة إدارياً' : 'management escalation'}</div></div>
      </div>
      <div class="grid g2">
        <div class="panel"><div class="panel-h"><span>📈</span><h3>${LANG === 'ar' ? 'حركة المراسلات' : 'Correspondence Flow'}</h3></div>
          ${Charts.line([
            { name: LANG === 'ar' ? 'مسجلة' : 'Logged', color: 'var(--blue)', values: trend.map(x => x.created) },
            { name: LANG === 'ar' ? 'مغلقة' : 'Closed', color: 'var(--green)', values: trend.map(x => x.closed) },
          ], { labels: trend.map(x => x.label) })}</div>
        <div class="panel"><div class="panel-h"><span>🗂</span><h3>${t('category')}</h3></div>
          ${Charts.hbars((Store.schema('correspondence').categories || []).map(c => ({
            label: tl(c.label), value: corr.filter(x => x.category === c.key).length
          })).filter(x => x.value).sort((a, b) => b.value - a.value))}</div>
      </div>`;
  },

  followUp(b, rr) {
    const corr = Store.list('correspondence').filter(c => !Store.isClosed('correspondence', c) && c.responseDue);
    const groups = [
      [LANG === 'ar' ? '🚨 متجاوزة للمهلة' : '🚨 Past due', c => Store.daysOver(c, 'responseDue') > 0, '#f87171'],
      [LANG === 'ar' ? '⏳ تستحق خلال 7 أيام' : '⏳ Due within 7 days', c => { const d = Store.daysOver(c, 'responseDue'); return d <= 0 && d > -7; }, '#f5b942'],
      [LANG === 'ar' ? '📅 قادمة' : '📅 Upcoming', c => Store.daysOver(c, 'responseDue') <= -7, '#60a5fa'],
    ];
    b.innerHTML = groups.map(([title, fn, color]) => {
      const items = corr.filter(fn).sort((a, b) => (a.responseDue || '').localeCompare(b.responseDue || ''));
      return `<div class="panel" style="margin-bottom:16px;border-color:color-mix(in srgb,${color} 35%,transparent)">
        <div class="panel-h"><h3>${title}</h3><span class="chip" style="--cc:${color}">${items.length}</span></div>
        ${items.length ? items.map(c => `
          <div class="rank-row clickable" data-id="${c.id}">
            <span>${c.direction === 'incoming' ? '📥' : '📤'}</span>
            <div style="flex:1;min-width:0"><div class="fs12 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.title)}</div>
              <div class="fs11 mut">${esc(c.reference)} · ${esc(c.from)} ← ${esc(c.toParty)}</div></div>
            <span class="fs11 mut">${UI.fmtDate(c.responseDue)}</span>
            ${UI.statusChip('correspondence', c.status)}
          </div>`).join('') : `<div class="fs12 mut">${t('noData')}</div>`}
      </div>`;
    }).join('');
    b.querySelectorAll('[data-id]').forEach(el => el.onclick = () => Engine.detail('correspondence', el.dataset.id, rr));
  },
};
