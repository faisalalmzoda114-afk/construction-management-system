/* ============================================================
   Contractor Performance Center — profiles, multi-dimension
   scores, ranking, trends, linked records across modules
   ============================================================ */

const ModContractors = {
  selected: null,

  render(container, param) {
    if (param) this.selected = param;
    if (this.selected) return this.profile(container, this.selected);
    this.ranking(container);
  },

  overall(c) { const s = c.scores; return Math.round((s.safety + s.quality + s.schedule + s.commercial + s.risk) / 5); },
  scoreColor(v) { return v >= 85 ? '#34d399' : v >= 70 ? '#f5b942' : '#f87171'; },

  openCount(type, cid) {
    return Store.db.entities[type].filter(r => r.contractor === cid && !r.archived && !Store.isClosed(type, r)).length;
  },

  ranking(container) {
    const ranked = Store.db.contractors.map(c => ({ c, score: this.overall(c) })).sort((a, b) => b.score - a.score);
    const dims = [['safety', t('safetyScore'), '🦺'], ['quality', t('qualityScore'), '💎'], ['schedule', t('scheduleScore'), '📅'], ['commercial', t('commercialScore'), '💰'], ['risk', t('riskScore'), '🛡️']];

    container.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        ${ranked.slice(0, 4).map((x, i) => `
        <div class="kpi clickable" data-con="${x.c.id}" style="--kc:${this.scoreColor(x.score)}">
          <div class="k-label">#${i + 1} ${esc(LANG === 'ar' ? x.c.name : x.c.nameEn)}</div>
          <div class="k-value">${x.score}</div>
          <div class="k-sub">${this.openCount('issue', x.c.id)} ${t('mIssues').split(' ').pop()} · ${this.openCount('observation', x.c.id)} ${LANG === 'ar' ? 'ملاحظات' : 'obs'}</div>
          <div class="k-ico">${x.c.icon}</div>
        </div>`).join('')}
      </div>

      <div class="grid g23" style="margin-bottom:16px">
        <div class="panel">
          <div class="panel-h"><span>🏆</span><h3>${t('contractorRanking')}</h3>
            <div class="spacer"></div><button class="btn sm gold" id="cn-review">✨ ${t('aiContractorReview')}</button></div>
          <table class="tbl"><thead><tr><th>#</th><th>${t('contractor')}</th>
            ${dims.map(d => `<th>${d[2]} ${d[1]}</th>`).join('')}<th>${t('perfScore')}</th></tr></thead><tbody>
          ${ranked.map((x, i) => `<tr data-con="${x.c.id}">
            <td><span class="rank-num r${i + 1}">${i + 1}</span></td>
            <td><div class="t-title">${x.c.icon} ${esc(LANG === 'ar' ? x.c.name : x.c.nameEn)}</div>
              <div class="t-sub">${esc(x.c.contracts[0] ? x.c.contracts[0].scope : '')}</div></td>
            ${dims.map(d => `<td><span class="b" style="color:${this.scoreColor(x.c.scores[d[0]])}">${x.c.scores[d[0]]}</span></td>`).join('')}
            <td><span class="score-badge" style="--sc:${this.scoreColor(x.score)}">${x.score}</span></td>
          </tr>`).join('')}</tbody></table>
        </div>
        <div class="panel">
          <div class="panel-h"><span>📊</span><h3>${LANG === 'ar' ? 'متوسط الأبعاد عبر المقاولين' : 'Dimension averages'}</h3></div>
          ${Charts.hbars(dims.map(d => ({
            label: `${d[2]} ${d[1]}`,
            value: Math.round(Store.db.contractors.reduce((s, c) => s + c.scores[d[0]], 0) / Store.db.contractors.length),
          })), { max: 100 })}
          <div class="section-t">${LANG === 'ar' ? 'السجلات المفتوحة' : 'Open records'}</div>
          ${Charts.hbars(Store.db.contractors.map(c => ({
            label: LANG === 'ar' ? c.name : c.nameEn,
            value: this.openCount('issue', c.id) + this.openCount('risk', c.id) + this.openCount('observation', c.id) + this.openCount('action', c.id),
            color: 'var(--orange)'
          })).sort((a, b) => b.value - a.value))}
        </div>
      </div>`;

    container.querySelectorAll('[data-con]').forEach(el => el.onclick = () => { this.selected = el.dataset.con; this.render(container); });
    container.querySelector('#cn-review').onclick = () =>
      AIBrain.showReport(AIBrain.contractorReview(), t('aiContractorReview'));
  },

  profile(container, cid) {
    const c = Store.contractor(cid);
    if (!c) { this.selected = null; return this.ranking(container); }
    const score = this.overall(c);
    const dims = [['safety', t('safetyScore'), '🦺'], ['quality', t('qualityScore'), '💎'], ['schedule', t('scheduleScore'), '📅'], ['commercial', t('commercialScore'), '💰'], ['risk', t('riskScore'), '🛡️']];
    const linked = type => Store.db.entities[type].filter(r => r.contractor === cid && !r.archived && !Store.isClosed(type, r));
    const trendVals = [score - 7, score - 4, score - 6, score - 2, score - 1, score].map(v => Math.max(40, v));

    const linkSections = [
      ['constraint', '🚩', t('mTracker')], ['issue', '🧩', t('mIssues')], ['risk', '🛡️', t('mRisks')],
      ['observation', '📸', t('mObservations')], ['action', '⚡', t('mActions')],
      ['correspondence', '✉️', t('mCorrespondence')], ['meeting', '🗓️', t('mMeetings')],
    ];

    container.innerHTML = `
      <button class="btn sm mb14" id="cn-back" style="margin-bottom:14px">← ${t('contractorRanking')}</button>
      <div class="grid g32" style="margin-bottom:16px">
        <div class="panel center">
          <div style="font-size:46px">${c.icon}</div>
          <h2 style="font-size:18px;font-weight:900;margin:6px 0 2px">${esc(LANG === 'ar' ? c.name : c.nameEn)}</h2>
          <div class="fs12 mut">${esc(LANG === 'ar' ? c.nameEn : c.name)}</div>
          <div class="flex mt14" style="justify-content:center">${Charts.gauge(score, { label: t('perfScore') })}</div>
          <div class="section-t">${t('contacts')}</div>
          ${c.contacts.map(ct => `<div class="link-card" style="cursor:default">👤
            <div style="flex:1;text-align:start"><b class="fs13">${esc(ct.name)}</b>
            <div class="fs11 mut">${esc(ct.role)} · ${esc(ct.phone)} · ${esc(ct.email)}</div></div></div>`).join('')}
          <div class="section-t">${t('contracts')}</div>
          ${c.contracts.map(k => `<div class="link-card" style="cursor:default">📜
            <div style="flex:1;text-align:start"><b class="fs13">${esc(k.no)}</b>
            <div class="fs11 mut">${esc(k.scope)}</div>
            <div class="fs11 mut">${UI.fmtDate(k.start)} ← ${UI.fmtDate(k.end)} · ${k.value}M ${LANG === 'ar' ? 'ريال' : 'SAR'}</div></div></div>`).join('')}
        </div>
        <div>
          <div class="grid g4" style="grid-template-columns:repeat(5,1fr);margin-bottom:16px">
            ${dims.map(d => `<div class="kpi" style="--kc:${this.scoreColor(c.scores[d[0]])}">
              <div class="k-label">${d[2]} ${d[1]}</div><div class="k-value" style="font-size:24px">${c.scores[d[0]]}</div></div>`).join('')}
          </div>
          <div class="panel" style="margin-bottom:16px">
            <div class="panel-h"><span>📈</span><h3>${t('trendAnalysis')}</h3><span class="sub">${LANG === 'ar' ? 'آخر 6 أشهر' : 'last 6 months'}</span></div>
            ${Charts.line([{ name: t('perfScore'), color: 'var(--accent)', values: trendVals }],
              { labels: Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 5 + i); return t('months')[d.getMonth()]; }) })}
          </div>
          <div class="panel">
            <div class="panel-h"><span>🔗</span><h3>${LANG === 'ar' ? 'السجلات المفتوحة المرتبطة (كل المشاريع)' : 'Open linked records (all projects)'}</h3></div>
            <div class="grid g3">${linkSections.map(([tp, ic, lbl]) => {
              const items = linked(tp);
              return `<div class="kpi clickable" data-lk="${tp}" style="--kc:${items.length ? 'var(--orange)' : 'var(--green)'}">
                <div class="k-label">${ic} ${lbl}</div><div class="k-value" style="font-size:24px">${items.length}</div></div>`;
            }).join('')}</div>
            <div id="cn-linked"></div>
          </div>
        </div>
      </div>`;

    container.querySelector('#cn-back').onclick = () => { this.selected = null; this.render(container); };
    container.querySelectorAll('[data-lk]').forEach(el => el.onclick = () => {
      const tp = el.dataset.lk;
      const items = linked(tp);
      container.querySelector('#cn-linked').innerHTML = `
        <div class="section-t">${Store.schema(tp).icon} ${tl(Store.schema(tp).label)} (${items.length})</div>
        ${items.map(r => `<div class="link-card" data-det="${tp}|${r.id}">
          <div style="flex:1"><b class="fs13">${esc(r.title)}</b><div class="fs11 mut">${esc(r.ref)} · ${esc((Store.db.projects.find(p => p.id === r.projectId) || {}).code || '')}</div></div>
          ${UI.statusChip(tp, r.status)}</div>`).join('') || UI.empty('🎉')}`;
      container.querySelectorAll('[data-det]').forEach(x => x.onclick = () => {
        const [dt, did] = x.dataset.det.split('|');
        Engine.detail(dt, did, () => this.render(container));
      });
    });
  },
};
