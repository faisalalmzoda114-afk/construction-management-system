/* ============================================================
   Lessons Learned Center — knowledge base with search engine,
   types (best practice / failure / success / recommendation)
   ============================================================ */

const ModLessons = {
  q: '', fType: '',

  render(container) {
    Engine.modulePage(container, 'lesson', [
      { key: 'kb', icon: '📚', label: t('knowledgeBase'), render: (b, rr) => this.kb(b, rr) },
      { key: 'register', icon: '💡', label: t('tRegister') },
    ]);
  },

  typeMeta: {
    bestPractice: ['🏆', '#34d399'], failure: ['⚠️', '#f87171'],
    successStory: ['🌟', '#f5b942'], recommendation: ['📌', '#60a5fa'],
  },

  kb(b, rr) {
    // knowledge base searches across ALL projects (organizational knowledge)
    let lessons = Store.list('lesson', { all: true });
    const types = Object.keys(this.typeMeta);
    if (this.q) {
      const q = this.q.toLowerCase();
      lessons = lessons.filter(l => (l.title + ' ' + (l.description || '') + ' ' + (l.recommendationText || '') + ' ' + (l.tags || []).join(' ')).toLowerCase().includes(q));
    }
    if (this.fType) lessons = lessons.filter(l => l.lessonType === this.fType);

    b.innerHTML = `
      <div class="panel center" style="margin-bottom:16px;background:linear-gradient(135deg,rgba(245,185,66,.07),var(--panel))">
        <h2 style="font-size:19px;font-weight:900;margin-bottom:4px">📚 ${t('knowledgeBase')}</h2>
        <div class="fs12 mut" style="margin-bottom:14px">${LANG === 'ar' ? 'المعرفة المؤسسية عبر كامل المحفظة — ابحث قبل أن تبدأ' : 'Organizational knowledge across the whole portfolio — search before you start'}</div>
        <input class="input" id="kb-q" placeholder="🔍 ${t('searchKB')}" value="${esc(this.q)}" style="max-width:520px;margin:0 auto;font-size:15px;padding:12px 16px">
        <div class="flexw mt14" style="justify-content:center">
          <button class="btn sm ${!this.fType ? 'primary' : ''}" data-ft="">${t('all')}</button>
          ${types.map(tp => `<button class="btn sm ${this.fType === tp ? 'primary' : ''}" data-ft="${tp}">${this.typeMeta[tp][0]} ${UI.optLabel(tp)}</button>`).join('')}
        </div>
      </div>
      <div class="grid g4" style="margin-bottom:16px">
        ${types.map(tp => { const n = Store.list('lesson', { all: true }).filter(l => l.lessonType === tp).length;
          return `<div class="kpi" style="--kc:${this.typeMeta[tp][1]}"><div class="k-label">${UI.optLabel(tp)}</div>
            <div class="k-value">${n}</div><div class="k-ico">${this.typeMeta[tp][0]}</div></div>`; }).join('')}
      </div>
      <div class="gallery">${lessons.map(l => {
        const [ic, col] = this.typeMeta[l.lessonType] || ['💡', '#a78bfa'];
        const proj = Store.db.projects.find(p => p.id === l.projectId);
        return `<div class="g-card" data-id="${l.id}">
          <div class="g-photo" style="height:96px;background:linear-gradient(135deg,color-mix(in srgb,${col} 18%,var(--panel-3)),var(--panel-2))">${ic}</div>
          <div class="g-body">
            <div class="g-title">${esc(l.title)}</div>
            <div class="g-meta"><span class="chip" style="--cc:${col}">${UI.optLabel(l.lessonType)}</span>
              <span class="mut">${proj ? esc(proj.code) : ''}</span></div>
            <div class="fs11 mut2 mt8" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(l.recommendationText || l.description || '')}</div>
            <div class="g-meta mt8">${UI.statusChip('lesson', l.status)} ${(l.tags || []).map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>
          </div>
        </div>`;
      }).join('') || UI.empty('📚')}</div>`;

    b.querySelector('#kb-q').oninput = e => { this.q = e.target.value; this.kb(b, rr); b.querySelector('#kb-q').focus(); b.querySelector('#kb-q').setSelectionRange(this.q.length, this.q.length); };
    b.querySelectorAll('[data-ft]').forEach(btn => btn.onclick = () => { this.fType = btn.dataset.ft; this.kb(b, rr); });
    b.querySelectorAll('[data-id]').forEach(el => el.onclick = () => Engine.detail('lesson', el.dataset.id, rr));
  },
};
