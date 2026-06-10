/* ============================================================
   Risk Intelligence Center — heat map, trend, aging,
   forecast, escalation, AI mitigation, auto reports
   ============================================================ */

const ModRisks = {
  render(container) {
    Engine.modulePage(container, 'risk', [
      { key: 'dash', icon: '📊', label: t('tDashboard'), render: (b, rr) => this.dashboard(b, rr) },
      { key: 'register', icon: '🛡️', label: t('tRegister') },
      { key: 'heatmap', icon: '🔥', label: t('riskHeatmap'), render: (b, rr) => this.heatmap(b, rr) },
      { key: 'analytics', icon: '📈', label: t('tAnalytics'), render: (b, rr) => this.analytics(b, rr) },
    ]);
  },

  dashboard(b, rr) {
    const risks = Store.list('risk');
    const open = risks.filter(r => !Store.isClosed('risk', r));
    const crit = open.filter(r => Store.riskScore(r) >= 15);
    const esc_ = open.filter(r => r.status === 'escalated');
    const avgScore = open.length ? (open.reduce((s, r) => s + Store.riskScore(r), 0) / open.length).toFixed(1) : 0;
    const byCat = (Store.schema('risk').categories || []).map(c => ({
      label: tl(c.label), value: open.filter(r => r.category === c.key).length
    })).filter(x => x.value).sort((a, b) => b.value - a.value);

    b.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi" style="--kc:var(--accent)"><div class="k-label">${t('openItems')}</div><div class="k-value">${open.length}</div><div class="k-ico">🛡️</div>
          <div class="k-sub">${t('total')}: ${risks.length}</div></div>
        <div class="kpi" style="--kc:var(--red)"><div class="k-label">${t('pCritical')} (≥15)</div><div class="k-value">${crit.length}</div><div class="k-ico">🔥</div>
          <div class="k-sub">${LANG === 'ar' ? 'تتطلب معالجة فورية' : 'require immediate treatment'}</div></div>
        <div class="kpi" style="--kc:var(--gold)"><div class="k-label">${t('escalated')}</div><div class="k-value">${esc_.length}</div><div class="k-ico">🚨</div>
          <div class="k-sub">${LANG === 'ar' ? 'لدى الإدارة التنفيذية' : 'with executive management'}</div></div>
        <div class="kpi" style="--kc:var(--purple)"><div class="k-label">${LANG === 'ar' ? 'متوسط درجة الخطر' : 'Avg Risk Score'}</div><div class="k-value">${avgScore}</div><div class="k-ico">⚡</div>
          <div class="k-sub">${LANG === 'ar' ? 'من 25' : 'out of 25'}</div></div>
      </div>
      <div class="grid g2" style="margin-bottom:16px">
        <div class="panel"><div class="panel-h"><span>🗂</span><h3>${LANG === 'ar' ? 'المخاطر حسب الفئة' : 'Risks by Category'}</h3></div>
          ${Charts.hbars(byCat)}</div>
        <div class="panel">
          <div class="panel-h"><span>🚨</span><h3>${LANG === 'ar' ? 'المخاطر المُصعَّدة والحرجة' : 'Escalated & Critical Risks'}</h3>
            <div class="spacer"></div><button class="btn sm gold" id="rk-report">📄 ${t('genReport')}</button></div>
          ${[...esc_, ...crit.filter(r => r.status !== 'escalated')].slice(0, 7).map(r => `
            <div class="rank-row clickable" data-id="${r.id}">
              <span class="score-badge" style="--sc:${Charts.heatColor(Store.riskScore(r))};width:36px;height:36px;font-size:13px">${Store.riskScore(r)}</span>
              <div style="flex:1;min-width:0"><div class="fs12 b" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div>
                <div class="fs11 mut">${esc(r.ref)} · ${Store.userName(r.owner)}</div></div>
              ${UI.statusChip('risk', r.status)}
            </div>`).join('') || UI.empty('🎉')}
        </div>
      </div>
      <div class="panel" style="border-color:rgba(167,139,250,.3)">
        <div class="panel-h"><span>✨</span><h3>${t('generateMitigation')}</h3><span class="sub">${LANG === 'ar' ? 'اختر خطراً لتوليد خطة معالجة' : 'pick a risk to generate a plan'}</span></div>
        <div class="flexw">
          <select class="input" id="rk-pick" style="max-width:440px">${open.map(r => `<option value="${r.id}">${esc(r.ref)} — ${esc(r.title)}</option>`).join('')}</select>
          <button class="btn primary" id="rk-gen">✨ ${t('generateMitigation')}</button>
        </div>
        <div id="rk-mit"></div>
      </div>`;

    b.querySelectorAll('[data-id]').forEach(el => el.onclick = () => Engine.detail('risk', el.dataset.id, rr));
    b.querySelector('#rk-report').onclick = () => AIBrain.showReport(AIBrain.riskReport(), LANG === 'ar' ? 'تقرير المخاطر' : 'Risk Report');
    b.querySelector('#rk-gen').onclick = () => {
      const r = Store.get('risk', b.querySelector('#rk-pick').value);
      if (!r) return;
      const plan = AIBrain.mitigationPlan(r);
      b.querySelector('#rk-mit').innerHTML = `<div class="panel mt14" style="background:var(--bg-2);white-space:pre-wrap;font-size:13px;line-height:1.8">${esc(plan)}</div>
        <button class="btn sm mt8" id="rk-apply">💾 ${LANG === 'ar' ? 'حفظ كخطة معالجة للخطر' : 'Save as mitigation plan'}</button>`;
      b.querySelector('#rk-apply').onclick = () => {
        Store.update('risk', r.id, { mitigation: plan }, LANG === 'ar' ? '✨ خطة معالجة مولدة بالذكاء الاصطناعي' : '✨ AI-generated mitigation plan');
        UI.toast(t('saved'));
      };
    };
  },

  heatmap(b, rr) {
    const open = Store.list('risk').filter(r => !Store.isClosed('risk', r));
    const cell = (p, i) => open.filter(r => parseInt(r.probability) === p && parseInt(r.impact) === i);
    let rows = '';
    for (let p = 5; p >= 1; p--) {
      rows += `<div class="hm-axis">${p}</div>` + [1, 2, 3, 4, 5].map(i => {
        const items = cell(p, i), score = p * i;
        return `<div class="hm-cell" style="background:${Charts.heatColor(score)};opacity:${items.length ? 1 : .25}"
          data-p="${p}" data-i="${i}" title="${items.map(r => r.ref + ' ' + r.title).join('\n')}">${items.length || ''}</div>`;
      }).join('');
    }
    b.innerHTML = `
      <div class="grid g23">
        <div class="panel">
          <div class="panel-h"><span>🔥</span><h3>${t('riskHeatmap')}</h3>
            <span class="sub">${t('probability')} × ${t('impact')}</span></div>
          <div class="heatmap">${rows}<div></div>${[1, 2, 3, 4, 5].map(i => `<div class="hm-axis">${i}</div>`).join('')}</div>
          <div class="flex mt14" style="justify-content:space-between" >
            <span class="fs11 mut">↑ ${t('probability')}</span><span class="fs11 mut">${t('impact')} →</span></div>
        </div>
        <div class="panel"><div class="panel-h"><h3 id="hm-title">${LANG === 'ar' ? 'اختر خلية لعرض المخاطر' : 'Select a cell to view risks'}</h3></div>
          <div id="hm-list">${UI.empty('🎯')}</div></div>
      </div>`;
    b.querySelectorAll('.hm-cell').forEach(c => c.onclick = () => {
      const items = cell(+c.dataset.p, +c.dataset.i);
      b.querySelector('#hm-title').textContent = `${t('probability')} ${c.dataset.p} × ${t('impact')} ${c.dataset.i} — ${items.length}`;
      b.querySelector('#hm-list').innerHTML = items.length ? items.map(r => `
        <div class="rank-row clickable" data-id="${r.id}">
          <span class="score-badge" style="--sc:${Charts.heatColor(Store.riskScore(r))};width:34px;height:34px;font-size:13px">${Store.riskScore(r)}</span>
          <div style="flex:1"><div class="fs12 b">${esc(r.title)}</div><div class="fs11 mut">${esc(r.ref)}</div></div>
        </div>`).join('') : UI.empty('🎯');
      b.querySelectorAll('#hm-list [data-id]').forEach(el => el.onclick = () => Engine.detail('risk', el.dataset.id, rr));
    });
  },

  analytics(b, rr) {
    const risks = Store.list('risk');
    const open = risks.filter(r => !Store.isClosed('risk', r));
    const trend = Store.trend('risk');
    // aging
    const buckets = [[0, 30, '0-30'], [31, 60, '31-60'], [61, 90, '61-90'], [91, 9999, '+90']];
    const aging = buckets.map(([lo, hi, lbl]) => ({
      label: lbl, value: open.filter(r => { const d = Store.ageDays(r); return d >= lo && d <= hi; }).length,
      color: lo >= 61 ? 'var(--red)' : lo >= 31 ? 'var(--orange)' : 'var(--green)'
    }));
    // forecast: naive projection from net monthly delta
    const deltas = trend.map(x => x.created - x.closed);
    const avgDelta = deltas.reduce((a, c) => a + c, 0) / Math.max(deltas.length, 1);
    const fc = [open.length, Math.max(0, Math.round(open.length + avgDelta)), Math.max(0, Math.round(open.length + avgDelta * 2)), Math.max(0, Math.round(open.length + avgDelta * 3))];

    b.innerHTML = `
      <div class="grid g2" style="margin-bottom:16px">
        <div class="panel"><div class="panel-h"><span>📈</span><h3>${t('riskTrend')}</h3></div>
          ${Charts.line([
            { name: LANG === 'ar' ? 'مسجلة' : 'Identified', color: 'var(--red)', values: trend.map(x => x.created) },
            { name: LANG === 'ar' ? 'مغلقة' : 'Closed', color: 'var(--green)', values: trend.map(x => x.closed) },
          ], { labels: trend.map(x => x.label) })}</div>
        <div class="panel"><div class="panel-h"><span>⏳</span><h3>${t('riskAging')}</h3><span class="sub">${t('days')}</span></div>
          ${Charts.columns(aging)}</div>
      </div>
      <div class="panel">
        <div class="panel-h"><span>🔮</span><h3>${t('riskForecast')}</h3>
          <span class="sub">${LANG === 'ar' ? 'إسقاط المخاطر المفتوحة للأشهر القادمة بناءً على المعدل الشهري الصافي' : 'open-risk projection from net monthly rate'}</span></div>
        ${Charts.line([{ name: t('riskForecast'), color: 'var(--purple)', values: fc }],
          { labels: [t('today'), '+1', '+2', '+3'] })}
        <div class="fs12 mut2 mt8">${avgDelta > 0
          ? (LANG === 'ar' ? `⚠️ الاتجاه تصاعدي: صافي ${avgDelta.toFixed(1)} خطر جديد شهرياً — يُوصى بتكثيف جلسات المعالجة.` : `⚠️ Upward trend: net +${avgDelta.toFixed(1)} risks/month — intensify treatment sessions.`)
          : (LANG === 'ar' ? '✅ الاتجاه مستقر أو تنازلي — استمر بوتيرة المعالجة الحالية.' : '✅ Stable or downward trend — keep current treatment cadence.')}</div>
      </div>`;
  },
};
