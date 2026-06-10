/* ============================================================
   Executive Command Center (war room) + Portfolio dashboard
   ============================================================ */

const ModExec = {
  render(container) {
    const p = Store.cur();
    const health = Store.health();
    const risks = Store.list('risk').filter(r => !Store.isClosed('risk', r))
      .sort((a, b) => Store.riskScore(b) - Store.riskScore(a)).slice(0, 10);
    const issues = Store.list('issue').filter(i => !Store.isClosed('issue', i))
      .sort((a, b) => ['critical', 'high', 'medium', 'low'].indexOf(a.severity) - ['critical', 'high', 'medium', 'low'].indexOf(b.severity)).slice(0, 10);
    const actions = Store.list('action');
    const overdue = actions.filter(a => !Store.isClosed('action', a) && Store.daysOver(a) > 0)
      .sort((a, b) => Store.daysOver(b) - Store.daysOver(a));
    const corr = Store.list('correspondence').filter(c => ['awaiting', 'escalated', 'open'].includes(c.status));
    const corrLate = corr.filter(c => c.responseDue && Store.daysOver(c, 'responseDue') > 0);
    const obs = Store.list('observation');
    const obsOpen = obs.filter(o => !Store.isClosed('observation', o));
    const lessons = Store.list('lesson').filter(l => l.status === 'published').slice(0, 4);
    const milestones = (p.milestones || []).slice().sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

    // contractor ranking across portfolio
    const ranked = Store.db.contractors.map(c => ({
      c, score: Math.round((c.scores.safety + c.scores.quality + c.scores.schedule + c.scores.commercial + c.scores.risk) / 5)
    })).sort((a, b) => b.score - a.score);

    const schedVar = (p.progress || 0) - (p.plannedProgress || 0);
    const insights = AIBrain.execInsights();

    container.innerHTML = `
      <!-- top strip -->
      <div class="grid g4 mb14" style="margin-bottom:16px">
        <div class="kpi" style="--kc:${health >= 75 ? 'var(--green)' : health >= 50 ? 'var(--gold)' : 'var(--red)'}">
          <div class="k-label">${t('healthScore')}</div><div class="k-value">${health}</div>
          <div class="k-sub">${p.code} · ${esc(LANG === 'ar' ? p.name : p.nameEn)}</div><div class="k-ico">${health >= 75 ? '🟢' : health >= 50 ? '🟡' : '🔴'}</div>
        </div>
        <div class="kpi" style="--kc:var(--accent)">
          <div class="k-label">${t('progress')}</div><div class="k-value">${p.progress}%</div>
          <div class="k-sub"><span class="k-trend ${schedVar >= 0 ? 'up' : 'down'}">${schedVar >= 0 ? '▲' : '▼'} ${Math.abs(schedVar)}%</span> ${LANG === 'ar' ? 'مقابل المخطط' : 'vs planned'} ${p.plannedProgress}%</div>
          <div class="k-ico">📈</div>
        </div>
        <div class="kpi" style="--kc:var(--red)">
          <div class="k-label">${t('overdueActions')}</div><div class="k-value">${overdue.length}</div>
          <div class="k-sub">${LANG === 'ar' ? 'من أصل' : 'of'} ${actions.filter(a => !Store.isClosed('action', a)).length} ${t('openItems')}</div><div class="k-ico">⏰</div>
        </div>
        <div class="kpi" style="--kc:var(--orange)">
          <div class="k-label">${t('pendingCorr')}</div><div class="k-value">${corr.length}</div>
          <div class="k-sub">${corrLate.length} ${LANG === 'ar' ? 'تجاوزت مهلة الرد' : 'past response due'}</div><div class="k-ico">✉️</div>
        </div>
      </div>

      <!-- AI insights bar -->
      <div class="panel mb14" style="margin-bottom:16px;border-color:rgba(167,139,250,.35);background:linear-gradient(135deg,rgba(139,92,246,.09),var(--panel))">
        <div class="panel-h" style="margin-bottom:8px"><span style="font-size:18px">✨</span><h3>${t('aiInsights')}</h3>
          <div class="spacer"></div><button class="btn sm" id="ex-ai">${t('mAI')} ←</button></div>
        <div class="grid g3">${insights.slice(0, 3).map(ins => `
          <div class="flex" style="align-items:flex-start;gap:9px"><span>${ins.icon}</span>
          <div class="fs12" style="line-height:1.6">${esc(ins.text)}</div></div>`).join('')}</div>
      </div>

      <div class="grid g23" style="margin-bottom:16px">
        <!-- top risks -->
        <div class="panel">
          <div class="panel-h"><span>🛡️</span><h3>${t('topRisks')}</h3><div class="spacer"></div>
            <button class="btn sm ghost" data-nav="risks">${t('view')} ←</button></div>
          ${risks.length ? risks.map((r, i) => `
            <div class="rank-row clickable" data-det="risk|${r.id}">
              <span class="score-badge" style="--sc:${Charts.heatColor(Store.riskScore(r))};width:38px;height:38px;font-size:14px">${Store.riskScore(r)}</span>
              <div style="flex:1;min-width:0"><div class="fs13 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div>
                <div class="fs11 mut">${esc(r.ref)} · ${UI.catLabel('risk', r.category)} · ${Store.userName(r.owner)}</div></div>
              ${UI.statusChip('risk', r.status)}
            </div>`).join('') : UI.empty('🛡️')}
        </div>
        <!-- health + obs donut -->
        <div>
          <div class="panel mb14" style="margin-bottom:16px">
            <div class="panel-h"><span>📸</span><h3>${t('obsStatus')}</h3></div>
            <div class="flex" style="justify-content:center">${Charts.donut(
              Store.schema('observation').statuses.map(s => ({
                label: tl(s.label), value: obs.filter(o => o.status === s.key).length, color: s.color
              })), { size: 150, stroke: 20, centerLabel: obsOpen.length, centerSub: t('openItems') })}</div>
            <div class="flexw mt8" style="justify-content:center">${Store.schema('observation').statuses.map(s =>
              `<span class="fs11 flex" style="gap:4px"><i style="width:9px;height:9px;border-radius:3px;background:${s.color};display:inline-block"></i>${tl(s.label)} (${obs.filter(o => o.status === s.key).length})</span>`).join('')}</div>
          </div>
          <div class="panel">
            <div class="panel-h"><span>🏁</span><h3>${t('upcomingMilestones')}</h3></div>
            ${milestones.map(m => {
              const days = Math.ceil((new Date(m.date) - Date.now()) / 86400000);
              return `<div class="flex" style="padding:7px 0;border-bottom:1px dashed var(--line)">
                <span class="chip" style="--cc:${days <= 14 ? '#f5b942' : '#60a5fa'}">${days} ${t('days')}</span>
                <div class="fs12" style="flex:1">${esc(m.title)}</div>
                <span class="fs11 mut">${UI.fmtDate(m.date)}</span></div>`;
            }).join('') || UI.empty('🏁')}
          </div>
        </div>
      </div>

      <div class="grid g3" style="margin-bottom:16px">
        <!-- top issues -->
        <div class="panel">
          <div class="panel-h"><span>🧩</span><h3>${t('topIssues')}</h3><div class="spacer"></div>
            <button class="btn sm ghost" data-nav="issues">${t('view')} ←</button></div>
          ${issues.length ? issues.map(i => `
            <div class="rank-row clickable" data-det="issue|${i.id}">
              <span class="prio-dot" style="background:${UI.prioColors[i.severity]}"></span>
              <div style="flex:1;min-width:0"><div class="fs13 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(i.title)}</div>
                <div class="fs11 mut">${esc(i.ref)} · ${UI.catLabel('issue', i.category)}</div></div>
              ${UI.prioChip(i.severity)}
            </div>`).join('') : UI.empty('🧩')}
        </div>
        <!-- critical open constraints -->
        <div class="panel">
          <div class="panel-h"><span>🚩</span><h3>${LANG === 'ar' ? 'معوقات حرجة مفتوحة' : 'Critical Open Constraints'}</h3><div class="spacer"></div>
            <button class="btn sm ghost" data-nav="tracker">${t('view')} ←</button></div>
          ${(() => {
            const cst = Store.list('constraint').filter(c => !Store.isClosed('constraint', c))
              .sort((a, b) => (['critical', 'high', 'medium', 'low'].indexOf(a.priority) - ['critical', 'high', 'medium', 'low'].indexOf(b.priority)) || ModTracker.daysOverdue(b) - ModTracker.daysOverdue(a))
              .slice(0, 8);
            return cst.length ? cst.map(c => `
              <div class="rank-row clickable" data-det="constraint|${c.id}">
                <span class="prio-dot" style="background:${UI.prioColors[c.priority]}"></span>
                <div style="flex:1;min-width:0"><div class="fs13 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.title)}</div>
                  <div class="fs11 mut">${esc(c.ref)} · ${UI.optLabel(c.responsibleParty)}</div></div>
                ${ModTracker.daysOverdue(c) ? `<span class="chip" style="--cc:#f87171">⏰ ${ModTracker.daysOverdue(c)}${LANG === 'ar' ? 'ي' : 'd'}</span>` : UI.statusChip('constraint', c.status)}
              </div>`).join('') : UI.empty('🎉');
          })()}
        </div>
        <!-- contractor ranking -->
        <div class="panel">
          <div class="panel-h"><span>🏗️</span><h3>${t('contractorRanking')}</h3><div class="spacer"></div>
            <button class="btn sm ghost" data-nav="contractors">${t('view')} ←</button></div>
          ${ranked.map((x, i) => `
            <div class="rank-row clickable" data-con="${x.c.id}">
              <span class="rank-num r${i + 1}">${i + 1}</span>
              <span style="font-size:17px">${x.c.icon}</span>
              <div style="flex:1"><div class="fs13 b">${esc(LANG === 'ar' ? x.c.name : x.c.nameEn)}</div>
                <div class="bar mt8" style="width:90%"><i style="width:${x.score}%;--bc:${x.score >= 85 ? 'var(--green)' : x.score >= 70 ? 'var(--gold)' : 'var(--red)'}"></i></div></div>
              <span class="score-badge" style="--sc:${x.score >= 85 ? '#34d399' : x.score >= 70 ? '#f5b942' : '#f87171'}">${x.score}</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="grid g3">
        <!-- overdue actions -->
        <div class="panel">
          <div class="panel-h"><span>⏰</span><h3>${t('overdueActions')}</h3><div class="spacer"></div>
            <button class="btn sm ghost" data-nav="actions">${t('view')} ←</button></div>
          ${overdue.slice(0, 6).map(a => `
            <div class="rank-row clickable" data-det="action|${a.id}">
              <div style="flex:1;min-width:0"><div class="fs12 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(a.title)}</div>
                <div class="fs11 mut">${Store.userName(a.assignee)}</div></div>
              <span class="chip" style="--cc:#f87171">${Store.daysOver(a)} ${t('days')}</span>
            </div>`).join('') || UI.empty('✅')}
        </div>
        <!-- pending correspondence -->
        <div class="panel">
          <div class="panel-h"><span>✉️</span><h3>${t('pendingCorr')}</h3><div class="spacer"></div>
            <button class="btn sm ghost" data-nav="correspondence">${t('view')} ←</button></div>
          ${corr.slice(0, 6).map(c => `
            <div class="rank-row clickable" data-det="correspondence|${c.id}">
              <span>${c.direction === 'incoming' ? '📥' : '📤'}</span>
              <div style="flex:1;min-width:0"><div class="fs12 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.title)}</div>
                <div class="fs11 mut">${esc(c.reference)}</div></div>
              ${UI.statusChip('correspondence', c.status)}
            </div>`).join('') || UI.empty('✉️')}
        </div>
        <!-- lessons alerts -->
        <div class="panel">
          <div class="panel-h"><span>💡</span><h3>${t('lessonsAlerts')}</h3><div class="spacer"></div>
            <button class="btn sm ghost" data-nav="lessons">${t('view')} ←</button></div>
          ${lessons.map(l => `
            <div class="rank-row clickable" data-det="lesson|${l.id}">
              <span>${{ bestPractice: '🏆', failure: '⚠️', successStory: '🌟', recommendation: '📌' }[l.lessonType] || '💡'}</span>
              <div style="flex:1;min-width:0"><div class="fs12 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(l.title)}</div>
                <div class="fs11 mut">${UI.optLabel(l.lessonType)}</div></div>
            </div>`).join('') || UI.empty('💡')}
        </div>
      </div>`;

    container.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => App.nav(b.dataset.nav));
    container.querySelectorAll('[data-det]').forEach(el => el.onclick = () => {
      const [tp, id] = el.dataset.det.split('|');
      Engine.detail(tp, id, () => this.render(container));
    });
    container.querySelectorAll('[data-con]').forEach(el => el.onclick = () => App.nav('contractors', el.dataset.con));
    const aiBtn = container.querySelector('#ex-ai'); if (aiBtn) aiBtn.onclick = () => App.nav('ai');
  },
};

/* ============ Portfolio ============ */
const ModPortfolio = {
  render(container) {
    const projects = Store.db.projects;
    const totBudget = projects.reduce((s, p) => s + p.budget, 0);
    const avgProg = Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length);
    const allRisks = Store.db.entities.risk.filter(r => !r.archived && !Store.isClosed('risk', r) && Store.riskScore(r) >= 15);
    const healths = projects.map(p => ({ p, h: Store.health(p.id) }));
    const avgH = Math.round(healths.reduce((s, x) => s + x.h, 0) / healths.length);

    container.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi" style="--kc:var(--accent)"><div class="k-label">${t('allProjects')}</div><div class="k-value">${projects.length}</div>
          <div class="k-sub">${[...new Set(projects.map(p => p.program))].length} ${t('program')}</div><div class="k-ico">🗂️</div></div>
        <div class="kpi" style="--kc:var(--gold)"><div class="k-label">${t('budget')}</div><div class="k-value">${(totBudget / 1000).toFixed(1)}B</div>
          <div class="k-sub">${LANG === 'ar' ? 'ريال سعودي' : 'SAR'}</div><div class="k-ico">💰</div></div>
        <div class="kpi" style="--kc:var(--green)"><div class="k-label">${t('progress')}</div><div class="k-value">${avgProg}%</div>
          <div class="k-sub">${LANG === 'ar' ? 'متوسط الإنجاز' : 'average progress'}</div><div class="k-ico">📊</div></div>
        <div class="kpi" style="--kc:${avgH >= 70 ? 'var(--green)' : 'var(--red)'}"><div class="k-label">${t('healthScore')}</div><div class="k-value">${avgH}</div>
          <div class="k-sub">${allRisks.length} ${LANG === 'ar' ? 'خطر حرج بالمحفظة' : 'critical portfolio risks'}</div><div class="k-ico">❤️‍🩹</div></div>
      </div>

      <div class="grid g23" style="margin-bottom:16px">
        <div class="panel">
          <div class="panel-h"><span>📊</span><h3>${LANG === 'ar' ? 'الإنجاز الفعلي مقابل المخطط' : 'Actual vs Planned Progress'}</h3></div>
          ${Charts.hbars(projects.map(p => ({
            label: `${p.code} — ${LANG === 'ar' ? p.name : p.nameEn}`, value: p.progress,
            color: p.progress >= p.plannedProgress ? 'var(--green)' : 'var(--red)'
          })), { max: 100, fmt: v => v + '%' })}
        </div>
        <div class="panel">
          <div class="panel-h"><span>❤️‍🩹</span><h3>${t('healthScore')}</h3></div>
          ${healths.sort((a, b) => a.h - b.h).map(x => `
            <div class="rank-row clickable" data-pj="${x.p.id}">
              <span style="font-size:16px">${x.p.icon}</span>
              <div style="flex:1"><div class="fs12 b">${esc(x.p.code)}</div><div class="fs11 mut">${esc(LANG === 'ar' ? x.p.name : x.p.nameEn)}</div></div>
              <span class="score-badge" style="--sc:${x.h >= 75 ? '#34d399' : x.h >= 50 ? '#f5b942' : '#f87171'}">${x.h}</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="panel">
        <div class="panel-h"><span>🗂️</span><h3>${t('allProjects')}</h3></div>
        <div class="grid g3">${projects.map(p => {
          const h = Store.health(p.id);
          return `<div class="proj-card" data-pj="${p.id}">
            <div class="pc-top"><div><span style="font-size:20px">${p.icon}</span> <b>${esc(LANG === 'ar' ? p.name : p.nameEn)}</b>
              <div class="pc-code">${p.code} · ${esc(p.program)}</div></div>
              <span class="score-badge" style="--sc:${h >= 75 ? '#34d399' : h >= 50 ? '#f5b942' : '#f87171'}">${h}</span></div>
            <div class="bar"><i style="width:${p.progress}%;--bc:${p.progress >= p.plannedProgress ? 'var(--green)' : 'var(--gold)'}"></i></div>
            <div class="pc-stats">
              <div><b>${p.progress}%</b>${t('progress')}</div>
              <div><b>${p.budget}M</b>${t('budget')}</div>
              <div><b>${Store.db.entities.risk.filter(r => r.projectId === p.id && !r.archived && !Store.isClosed('risk', r)).length}</b>${t('mRisks').split(' ')[1] || 'Risks'}</div>
            </div>
          </div>`;
        }).join('')}</div>
      </div>`;

    container.querySelectorAll('[data-pj]').forEach(el => el.onclick = () => {
      Store.setProject(el.dataset.pj);
      App.nav('exec');
      UI.toast((LANG === 'ar' ? 'تم التبديل إلى: ' : 'Switched to: ') + Store.cur().code);
    });
  },
};
