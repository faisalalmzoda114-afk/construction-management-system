/* ============================================================
   App — boot, login, project selection center, shell & router
   ============================================================ */

const App = {
  route: 'exec',
  routeParam: null,
  groupBy: 'program',
  projQ: '',

  modules: {
    exec: c => ModExec.render(c),
    portfolio: c => ModPortfolio.render(c),
    actions: c => ModActions.render(c),
    risks: c => ModRisks.render(c),
    issues: c => ModIssues.render(c),
    observations: c => ModObservations.render(c),
    contractors: (c, p) => ModContractors.render(c, p),
    correspondence: c => ModCorrespondence.render(c),
    meetings: c => ModMeetings.render(c),
    lessons: c => ModLessons.render(c),
    documents: c => ModDocuments.render(c),
    dashbuilder: c => ModDashBuilder.render(c),
    workflow: c => ModWorkflow.render(c),
    ai: c => ModAI.render(c),
    admin: c => ModAdmin.render(c),
  },

  boot() {
    Store.load();
    if (!Store.db.currentUserId) return this.loginPage();
    if (!Store.db.currentProjectId) return this.projectCenter();
    this.shell();
  },

  /* ============ login ============ */
  loginPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="auth-page"><div class="auth-card">
        <div class="auth-logo">🏗️</div>
        <h1 class="center" style="font-size:21px;font-weight:900">${t('appName')}</h1>
        <div class="center fs12 mut" style="margin-bottom:24px">${t('appTag')}</div>
        <div class="fs12 b mut2" style="margin-bottom:10px">${t('loginHint')}</div>
        ${Store.db.users.map(u => `
          <div class="link-card" data-u="${u.id}">
            <span class="avatar">${esc(u.initials)}</span>
            <div style="flex:1"><b class="fs13">${esc(LANG === 'ar' ? u.name : u.nameEn)}</b>
              <div class="fs11 mut">${tl((Store.db.roles.find(r => r.key === u.role) || {}).label)} · ${esc(u.email)}</div></div>
            <span class="mut">←</span>
          </div>`).join('')}
        <div class="center mt14">
          <button class="btn ghost sm" id="lg-lang">🌐 ${LANG === 'ar' ? 'English' : 'العربية'}</button>
        </div>
      </div></div>`;
    app.querySelectorAll('[data-u]').forEach(el => el.onclick = () => {
      Store.db.currentUserId = el.dataset.u; Store.save();
      this.projectCenter();
    });
    app.querySelector('#lg-lang').onclick = () => { setLang(LANG === 'ar' ? 'en' : 'ar'); this.loginPage(); };
  },

  /* ============ project selection center ============ */
  projectCenter() {
    const app = document.getElementById('app');
    const groups = ['program', 'region', 'client', 'package', 'contractor'];
    let projects = Store.db.projects;
    if (this.projQ) {
      const q = this.projQ.toLowerCase();
      projects = projects.filter(p => (p.name + p.nameEn + p.code + p.program + p.region + p.client).toLowerCase().includes(q));
    }
    const keyOf = p => this.groupBy === 'contractor'
      ? (LANG === 'ar' ? (Store.contractor(p.contractorId) || {}).name : (Store.contractor(p.contractorId) || {}).nameEn) || '—'
      : p[this.groupBy] || '—';
    const grouped = {};
    projects.forEach(p => (grouped[keyOf(p)] = grouped[keyOf(p)] || []).push(p));

    app.innerHTML = `
      <div class="auth-page" style="place-items:start center"><div class="psc">
        <div class="psc-head">
          <div class="auth-logo" style="margin-bottom:14px">🏗️</div>
          <h1>${t('selectProject')}</h1>
          <p>${t('selectProjectHint')}</p>
        </div>
        <div class="psc-controls">
          <input class="input" id="pc-q" placeholder="🔍 ${t('searchProjects')}" value="${esc(this.projQ)}" style="width:280px">
          <select class="input" id="pc-group" style="width:auto">
            ${groups.map(g => `<option value="${g}" ${this.groupBy === g ? 'selected' : ''}>${t('groupBy')}: ${t(g)}</option>`).join('')}
          </select>
          <button class="btn" id="pc-portfolio">📊 ${t('portfolioDash')}</button>
          <button class="btn ghost" id="pc-lang">🌐 ${LANG === 'ar' ? 'EN' : 'ع'}</button>
          <button class="btn ghost" id="pc-out">⎋ ${t('logout')}</button>
        </div>
        ${Object.entries(grouped).map(([g, ps]) => `
          <div class="psc-group-h">${esc(g)} <span class="cnt">${ps.length}</span></div>
          <div class="grid g3">${ps.map(p => {
            const h = Store.health(p.id);
            const con = Store.contractor(p.contractorId);
            return `<div class="proj-card" data-p="${p.id}">
              <div class="pc-top"><div><span style="font-size:22px">${p.icon}</span> <b style="font-size:15px">${esc(LANG === 'ar' ? p.name : p.nameEn)}</b>
                <div class="pc-code">${p.code} · ${esc(p.region)} · ${esc(p.client)}</div></div>
                <span class="score-badge" style="--sc:${h >= 75 ? '#34d399' : h >= 50 ? '#f5b942' : '#f87171'}">${h}</span></div>
              <div class="bar"><i style="width:${p.progress}%;--bc:${p.progress >= p.plannedProgress ? 'var(--green)' : 'var(--gold)'}"></i></div>
              <div class="pc-stats">
                <div><b>${p.progress}%</b>${t('progress')}</div>
                <div><b>${p.budget}M</b>${t('budget')}</div>
                <div><b>${con ? con.icon : ''}</b>${con ? esc((LANG === 'ar' ? con.name : con.nameEn).split(' ').slice(0, 2).join(' ')) : ''}</div>
              </div>
            </div>`;
          }).join('')}</div>`).join('') || UI.empty('🔍')}
      </div></div>`;

    app.querySelector('#pc-q').oninput = e => { this.projQ = e.target.value; this.projectCenter(); const i = app.querySelector('#pc-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
    app.querySelector('#pc-group').onchange = e => { this.groupBy = e.target.value; this.projectCenter(); };
    app.querySelector('#pc-lang').onclick = () => { setLang(LANG === 'ar' ? 'en' : 'ar'); this.projectCenter(); };
    app.querySelector('#pc-out').onclick = () => { Store.db.currentUserId = null; Store.save(); this.loginPage(); };
    app.querySelector('#pc-portfolio').onclick = () => {
      if (!Store.db.currentProjectId) Store.setProject(Store.db.projects[0].id);
      this.route = 'portfolio'; this.shell();
    };
    app.querySelectorAll('[data-p]').forEach(el => el.onclick = () => {
      Store.setProject(el.dataset.p);
      this.route = 'exec';
      this.shell();
    });
  },

  /* ============ main shell ============ */
  shell() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="shell">
        <aside class="sidebar" id="sidebar"></aside>
        <div class="main">
          <header class="topbar" id="topbar"></header>
          <main class="content"><div id="page"></div></main>
        </div>
      </div>
      <button class="ai-fab" id="ai-fab" title="${t('mAI')}">✨</button>`;
    document.getElementById('ai-fab').onclick = () => this.nav('ai');
    this.renderSidebar();
    this.render();
  },

  visibleModules() {
    return Store.db.modules.filter(m => m.visible && (!m.adminOnly || Store.isAdmin()) && Store.can(m.key));
  },

  renderSidebar() {
    const sb = document.getElementById('sidebar');
    if (!sb) return;
    const p = Store.cur();
    const u = Store.user();
    const groups = ['gCommand', 'gExecution', 'gKnowledge', 'gPlatform'];
    const mods = this.visibleModules();
    const badge = key => {
      if (key === 'actions') {
        const n = Store.list('action').filter(a => !Store.isClosed('action', a) && Store.daysOver(a) > 0).length;
        return n ? `<span class="badge">${n}</span>` : '';
      }
      if (key === 'risks') {
        const n = Store.list('risk').filter(r => !Store.isClosed('risk', r) && Store.riskScore(r) >= 15).length;
        return n ? `<span class="badge warn">${n}</span>` : '';
      }
      return '';
    };
    sb.innerHTML = `
      <div class="sb-brand"><div class="sb-logo">🏗️</div>
        <div><b>${t('appName')}</b><small>${esc(LANG === 'ar' ? Store.db.settings.orgName : Store.db.settings.orgNameEn)}</small></div></div>
      <div class="sb-project" id="sb-proj" title="${t('switchProject')}">
        <div class="pj-name">${p.icon} ${esc(LANG === 'ar' ? p.name : p.nameEn)}</div>
        <div class="pj-meta"><span>${p.code}</span><span>🔄 ${t('switchProject')}</span></div>
      </div>
      <nav class="sb-nav">
        ${groups.map(g => {
          const items = mods.filter(m => m.group === g);
          if (!items.length) return '';
          return `<div class="sb-group">${t(g)}</div>` + items.map(m => `
            <div class="sb-item ${this.route === m.key ? 'active' : ''}" data-m="${m.key}">
              <span class="ico">${m.icon}</span><span>${m.labelKey ? t(m.labelKey) : esc(m.label)}</span>${badge(m.key)}
            </div>`).join('');
        }).join('')}
      </nav>
      <div class="sb-user">
        <span class="avatar">${esc(u.initials)}</span>
        <div style="flex:1"><div class="u-name">${esc(LANG === 'ar' ? u.name : u.nameEn)}</div>
          <div class="u-role">${tl((Store.db.roles.find(r => r.key === u.role) || {}).label)}</div></div>
        <button class="x-btn" id="sb-out" title="${t('logout')}">⎋</button>
      </div>`;
    sb.querySelector('#sb-proj').onclick = () => this.projectCenter();
    sb.querySelector('#sb-out').onclick = () => { Store.db.currentUserId = null; Store.save(); this.loginPage(); };
    sb.querySelectorAll('[data-m]').forEach(el => el.onclick = () => this.nav(el.dataset.m));
  },

  renderTopbar() {
    const tb = document.getElementById('topbar');
    const mod = Store.db.modules.find(m => m.key === this.route);
    const p = Store.cur();
    tb.innerHTML = `
      <button class="tb-btn" id="tb-menu" style="display:none">☰</button>
      <div><h1>${mod ? (mod.labelKey ? t(mod.labelKey) : esc(mod.label)) : ''}</h1>
        <div class="crumb">${esc(p.program)} ← ${p.code} · ${esc(LANG === 'ar' ? p.name : p.nameEn)}</div></div>
      <div class="tb-spacer"></div>
      <div class="tb-search" id="tb-go">🔍 <span>${t('search')}</span></div>
      <button class="tb-btn lang-btn" id="tb-lang">${LANG === 'ar' ? 'EN' : 'عربي'}</button>
      <button class="tb-btn" id="tb-ai" title="${t('mAI')}">✨</button>`;
    tb.querySelector('#tb-lang').onclick = () => { setLang(LANG === 'ar' ? 'en' : 'ar'); this.shell(); };
    tb.querySelector('#tb-ai').onclick = () => this.nav('ai');
    tb.querySelector('#tb-go').onclick = () => this.globalSearch();
    if (window.innerWidth <= 980) {
      const mb = tb.querySelector('#tb-menu');
      mb.style.display = 'grid';
      mb.onclick = () => document.getElementById('sidebar').classList.toggle('open');
    }
  },

  globalSearch() {
    const m = UI.modal(`
      <div class="drawer-h"><h2>🔍 ${t('search')}</h2><button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b"><input class="input" id="gs-q" placeholder="${t('search')}" style="font-size:15px;padding:12px 14px">
      <div id="gs-res" class="mt14"></div></div>`);
    const inp = m.el.querySelector('#gs-q');
    inp.focus();
    inp.oninput = () => {
      const q = inp.value.trim().toLowerCase();
      const res = m.el.querySelector('#gs-res');
      if (q.length < 2) { res.innerHTML = ''; return; }
      let html = '';
      Object.keys(Store.db.schemas).forEach(tp => {
        const hits = Store.list(tp).filter(r =>
          (r.title + ' ' + (r.ref || '') + ' ' + (r.description || '')).toLowerCase().includes(q)).slice(0, 4);
        hits.forEach(r => {
          html += `<div class="link-card" data-go="${tp}|${r.id}">${Store.db.schemas[tp].icon}
            <div style="flex:1"><b class="fs13">${esc(r.title)}</b><div class="fs11 mut">${esc(r.ref)} · ${tl(Store.db.schemas[tp].label)}</div></div>
            ${UI.statusChip(tp, r.status)}</div>`;
        });
      });
      res.innerHTML = html || UI.empty('🔍');
      res.querySelectorAll('[data-go]').forEach(el => el.onclick = () => {
        const [tp, id] = el.dataset.go.split('|');
        m.close(); Engine.detail(tp, id, () => this.render());
      });
    };
  },

  nav(key, param) {
    this.route = key;
    this.routeParam = param || null;
    if (key !== 'contractors') ModContractors.selected = null;
    this.renderSidebar();
    this.render();
  },

  render() {
    this.renderTopbar();
    const page = document.getElementById('page');
    page.innerHTML = '';
    const fn = this.modules[this.route];
    if (fn) fn(page, this.routeParam);
    else {
      // custom module created from admin → generic register
      const mod = Store.db.modules.find(m => m.key === this.route);
      if (mod && mod.entity && Store.db.schemas[mod.entity]) Engine.register(page, mod.entity);
      else page.innerHTML = UI.empty('🧭', '404');
    }
    document.getElementById('sidebar').classList.remove('open');
  },
};

document.addEventListener('DOMContentLoaded', () => App.boot());
