/* ============================================================
   Meeting Management Center — calendar, minutes, decisions,
   action tracking, analytics
   ============================================================ */

const ModMeetings = {
  monthOffset: 0,

  render(container) {
    Engine.modulePage(container, 'meeting', [
      { key: 'calendar', icon: '🗓️', label: t('calendar'), render: (b, rr) => this.calendar(b, rr) },
      { key: 'register', icon: '📋', label: t('tRegister') },
      { key: 'analytics', icon: '📈', label: t('tAnalytics'), render: (b, rr) => this.analytics(b, rr) },
    ]);
  },

  calendar(b, rr) {
    const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + this.monthOffset);
    const y = base.getFullYear(), m = base.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const meetings = Store.list('meeting');
    const byDay = {};
    meetings.forEach(mt => { if (mt.date) { (byDay[mt.date] = byDay[mt.date] || []).push(mt); } });

    let cells = '';
    for (let i = 0; i < firstDow; i++) cells += `<div></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const items = byDay[iso] || [];
      const isToday = iso === todayISO();
      cells += `<div class="panel" style="padding:8px;min-height:88px;${isToday ? 'border-color:var(--accent);box-shadow:var(--glow)' : ''}">
        <div class="fs11 b ${isToday ? '' : 'mut'}" style="${isToday ? 'color:var(--accent)' : ''}">${d}</div>
        ${items.map(mt => {
          const st = Store.statusDef('meeting', mt.status);
          return `<div class="clickable fs11" data-id="${mt.id}" style="background:color-mix(in srgb,${st.color} 18%,transparent);border:1px solid color-mix(in srgb,${st.color} 40%,transparent);border-radius:6px;padding:3px 6px;margin-top:4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${mt.time || ''} ${esc(mt.title)}</div>`;
        }).join('')}
      </div>`;
    }

    b.innerHTML = `
      <div class="flex" style="margin-bottom:14px">
        <button class="btn sm" id="cal-prev">←</button>
        <h3 style="font-size:16px;font-weight:900">${t('months')[m]} ${y}</h3>
        <button class="btn sm" id="cal-next">→</button>
        <div class="spacer"></div>
        <button class="btn primary" id="cal-add">＋ ${t('add')}</button>
      </div>
      <div class="grid" style="grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px">
        ${t('weekDays').map(d => `<div class="center fs11 b mut">${d}</div>`).join('')}
      </div>
      <div class="grid" style="grid-template-columns:repeat(7,1fr);gap:6px">${cells}</div>`;

    b.querySelector('#cal-prev').onclick = () => { this.monthOffset--; this.calendar(b, rr); };
    b.querySelector('#cal-next').onclick = () => { this.monthOffset++; this.calendar(b, rr); };
    b.querySelector('#cal-add').onclick = () => Engine.form('meeting', null, () => this.calendar(b, rr));
    b.querySelectorAll('[data-id]').forEach(el => el.onclick = () => Engine.detail('meeting', el.dataset.id, () => this.calendar(b, rr)));
  },

  analytics(b, rr) {
    const meetings = Store.list('meeting');
    const held = meetings.filter(m => ['held', 'momissued'].includes(m.status));
    const noMom = meetings.filter(m => m.status === 'held');
    const actions = Store.list('action').filter(a => a.sourceType === 'meeting');
    const openActs = actions.filter(a => !Store.isClosed('action', a));

    b.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi" style="--kc:var(--accent)"><div class="k-label">${t('total')}</div><div class="k-value">${meetings.length}</div><div class="k-ico">🗓️</div>
          <div class="k-sub">${held.length} ${LANG === 'ar' ? 'منعقد' : 'held'}</div></div>
        <div class="kpi" style="--kc:var(--gold)"><div class="k-label">${LANG === 'ar' ? 'محاضر معلقة' : 'Pending MOMs'}</div><div class="k-value">${noMom.length}</div><div class="k-ico">📝</div>
          <div class="k-sub">${LANG === 'ar' ? 'لم يصدر المحضر بعد' : 'MOM not yet issued'}</div></div>
        <div class="kpi" style="--kc:var(--blue)"><div class="k-label">${LANG === 'ar' ? 'إجراءات من الاجتماعات' : 'Meeting Actions'}</div><div class="k-value">${actions.length}</div><div class="k-ico">⚡</div>
          <div class="k-sub">${openActs.length} ${t('openItems')}</div></div>
        <div class="kpi" style="--kc:var(--green)"><div class="k-label">${LANG === 'ar' ? 'نسبة إغلاق إجراءاتها' : 'Action Closure'}</div>
          <div class="k-value">${actions.length ? Math.round((actions.length - openActs.length) / actions.length * 100) : 0}%</div><div class="k-ico">✅</div></div>
      </div>
      <div class="grid g2">
        <div class="panel"><div class="panel-h"><span>🗂</span><h3>${LANG === 'ar' ? 'الاجتماعات حسب النوع' : 'Meetings by Type'}</h3></div>
          ${Charts.hbars((Store.schema('meeting').categories || []).map(c => ({
            label: tl(c.label), value: meetings.filter(m => m.category === c.key).length
          })).filter(x => x.value).sort((a, b) => b.value - a.value))}</div>
        <div class="panel">
          <div class="panel-h"><span>⚡</span><h3>${LANG === 'ar' ? 'إجراءات الاجتماعات المفتوحة' : 'Open Meeting Actions'}</h3>
            <div class="spacer"></div><button class="btn sm gold" id="mt-mom">✨ ${t('aiGenMOM')}</button></div>
          ${openActs.slice(0, 8).map(a => `
            <div class="rank-row clickable" data-id="${a.id}">
              <div style="flex:1;min-width:0"><div class="fs12 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(a.title)}</div>
                <div class="fs11 mut">${Store.userName(a.assignee)}</div></div>
              ${UI.dueBadge(a, 'action')} ${UI.statusChip('action', a.status)}
            </div>`).join('') || UI.empty('🎉')}
        </div>
      </div>`;
    b.querySelectorAll('[data-id]').forEach(el => el.onclick = () => Engine.detail('action', el.dataset.id, rr));
    b.querySelector('#mt-mom').onclick = () => AIBrain.showReport(AIBrain.generateMOM(), t('aiGenMOM'));
  },
};
