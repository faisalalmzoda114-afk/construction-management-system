/* ============================================================
   AI Assistant — analyzes live project data and generates
   insights, reports, MOMs, executive summaries (rule-driven,
   fully offline — no external API required)
   ============================================================ */

const AIBrain = {
  ar() { return LANG === 'ar'; },

  /* ---------- executive insights for command center ---------- */
  execInsights() {
    const out = [];
    const p = Store.cur(); if (!p) return out;
    const risks = Store.list('risk').filter(r => !Store.isClosed('risk', r));
    const crit = risks.filter(r => Store.riskScore(r) >= 15);
    const actions = Store.list('action').filter(a => !Store.isClosed('action', a));
    const overdue = actions.filter(a => Store.daysOver(a) > 0);
    const obs = Store.list('observation').filter(o => !Store.isClosed('observation', o) && o.priority === 'critical');
    const corrLate = Store.list('correspondence').filter(c => !Store.isClosed('correspondence', c) && c.responseDue && Store.daysOver(c, 'responseDue') > 0);
    const schedVar = (p.progress || 0) - (p.plannedProgress || 0);

    if (schedVar < -3) out.push({ icon: '📉', text: this.ar()
      ? `المشروع متأخر ${Math.abs(schedVar)}% عن المخطط. المخاطر المرتبطة بالجدول تمثل ${risks.filter(r => r.category === 'schedule').length} من المخاطر المفتوحة — يُوصى بخطة استدراك عاجلة.`
      : `Project is ${Math.abs(schedVar)}% behind plan. Schedule risks make up ${risks.filter(r => r.category === 'schedule').length} of open risks — a recovery plan is recommended.` });
    else out.push({ icon: '📈', text: this.ar()
      ? `الإنجاز ${p.progress}% ${schedVar >= 0 ? 'متقدماً على المخطط' : 'قريباً من المخطط'} — حافظ على وتيرة الإنتاجية الحالية.`
      : `Progress at ${p.progress}%, ${schedVar >= 0 ? 'ahead of plan' : 'near plan'} — maintain current productivity.` });

    if (crit.length) out.push({ icon: '🔥', text: this.ar()
      ? `${crit.length} مخاطر حرجة (درجة ≥15) أبرزها: "${crit[0].title.slice(0, 60)}…". ${crit.filter(r => r.status !== 'escalated').length} منها لم تُصعَّد بعد.`
      : `${crit.length} critical risks (score ≥15), led by: "${crit[0].title.slice(0, 60)}…". ${crit.filter(r => r.status !== 'escalated').length} not yet escalated.` });

    if (overdue.length) {
      const worst = overdue.sort((a, b) => Store.daysOver(b) - Store.daysOver(a))[0];
      const byUser = {};
      overdue.forEach(a => byUser[a.assignee] = (byUser[a.assignee] || 0) + 1);
      const topUser = Object.entries(byUser).sort((a, b) => b[1] - a[1])[0];
      out.push({ icon: '⏰', text: this.ar()
        ? `${overdue.length} إجراءً متأخراً (أقدمها ${Store.daysOver(worst)} يوماً). التركيز الأعلى لدى ${Store.userName(topUser[0])} بواقع ${topUser[1]} إجراءات — يُقترح إعادة توزيع الأحمال.`
        : `${overdue.length} overdue actions (oldest ${Store.daysOver(worst)} days). Highest load on ${Store.userName(topUser[0])} with ${topUser[1]} — consider rebalancing.` });
    }
    if (obs.length) out.push({ icon: '🦺', text: this.ar()
      ? `${obs.length} ملاحظات ميدانية حرجة مفتوحة. تكرار ملاحظات السلامة لدى نفس المقاول مؤشر إنذار مبكر لاحتمال إيقاف الأعمال.`
      : `${obs.length} open critical site observations. Repeated safety findings with the same contractor are an early warning for potential work stoppage.` });
    if (corrLate.length) out.push({ icon: '✉️', text: this.ar()
      ? `${corrLate.length} مراسلات تجاوزت مهلة الرد التعاقدية — التأخر في الرد قد يُفسَّر كقبول ضمني ويُضعف الموقف التعاقدي.`
      : `${corrLate.length} letters past contractual response deadlines — late replies may weaken the contractual position.` });
    return out;
  },

  /* ---------- mitigation plan generator ---------- */
  mitigationPlan(r) {
    const score = Store.riskScore(r);
    const cat = UI.catLabel('risk', r.category);
    const ownerName = Store.userName(r.owner);
    if (this.ar()) return `✨ خطة معالجة مولّدة — ${r.ref}
الخطر: ${r.title}
التصنيف: ${cat} · الدرجة: ${score}/25 (احتمالية ${r.probability} × أثر ${r.impact})

1) الإجراءات الفورية (0–7 أيام):
   • عقد جلسة معالجة مع ${ownerName} والأطراف المعنية وتثبيت خط الأساس للخطر.
   • ${score >= 15 ? 'تصعيد الخطر للجنة التوجيهية وإدراجه في تقرير الإدارة الأسبوعي.' : 'تكليف مالك الخطر بمتابعة أسبوعية وتحديث السجل.'}

2) إجراءات التخفيف (أسبوعان – شهر):
   • ${{ schedule: 'إعادة تسلسل الأنشطة الحرجة ودراسة العمل بورديات إضافية لامتصاص التأخير.', cost: 'مراجعة المخصصات والاحتياطيات، وتفعيل بدائل توريد أقل كلفة مع تثبيت الأسعار تعاقدياً.', safety: 'تنفيذ حملة سلامة مكثفة، وإيقاف الأنشطة عالية الخطورة لحين استيفاء الاشتراطات.', design: 'تجميد الواجهات التصميمية المتأثرة وعقد ورشة تنسيق مع الاستشاري لحسم التعارضات.', procurement: 'تأهيل موردين بديلين وتقديم الطلبيات طويلة الأمد فوراً.', stakeholder: 'خطة تواصل مع أصحاب المصلحة واجتماعات دورية مع الجهات المعنية.', logistics: 'دراسة مسارات ومواقع بديلة وتأمين الموافقات اللازمة مسبقاً.' }[r.category] || 'تطوير خطة معالجة تفصيلية مع مسؤوليات ومدد واضحة.'}

3) المراقبة:
   • مؤشر إنذار مبكر يُراجع كل أسبوعين، مع حد تصعيد تلقائي عند بلوغ الدرجة ${Math.min(25, score + 4)}.
   • تحديث السجل بتاريخ مراجعة قادم: خلال 14 يوماً.

4) خطة الطوارئ:
   • في حال تحقق الخطر: تفعيل الاحتياطي المخصص، وإخطار الإدارة التنفيذية خلال 24 ساعة.`;
    return `✨ Generated Mitigation Plan — ${r.ref}
Risk: ${r.title}
Category: ${cat} · Score: ${score}/25 (P${r.probability} × I${r.impact})

1) Immediate (0–7 days):
   • Hold a treatment session with ${ownerName} and stakeholders; baseline the risk.
   • ${score >= 15 ? 'Escalate to the steering committee and include in the weekly executive report.' : 'Assign weekly follow-up to the risk owner.'}

2) Mitigation (2–4 weeks):
   • Category-specific treatment for ${cat}: re-sequence critical activities, qualify alternates, lock long-lead orders, and resolve interfaces in a dedicated workshop.

3) Monitoring:
   • Early-warning indicator reviewed bi-weekly; auto-escalation threshold at score ${Math.min(25, score + 4)}.
   • Next register review: within 14 days.

4) Contingency:
   • If realized: activate allocated reserves and notify executive management within 24h.`;
  },

  /* ---------- reports ---------- */
  riskReport() {
    const p = Store.cur();
    const risks = Store.list('risk');
    const open = risks.filter(r => !Store.isClosed('risk', r));
    const crit = open.filter(r => Store.riskScore(r) >= 15).sort((a, b) => Store.riskScore(b) - Store.riskScore(a));
    const byCat = {};
    open.forEach(r => byCat[r.category] = (byCat[r.category] || 0) + 1);
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    if (this.ar()) return `📄 تقرير المخاطر — ${p.name} (${p.code})
التاريخ: ${UI.fmtDate(todayISO())}

الملخص التنفيذي:
يضم السجل ${risks.length} خطراً، منها ${open.length} مفتوحاً و${crit.length} حرجاً (درجة ≥15). أعلى تركّز في فئة "${cats[0] ? UI.catLabel('risk', cats[0][0]) : '—'}" (${cats[0] ? cats[0][1] : 0} خطراً).

أهم المخاطر الحرجة:
${crit.slice(0, 5).map((r, i) => `${i + 1}. [${r.ref}] ${r.title} — درجة ${Store.riskScore(r)} — المالك: ${Store.userName(r.owner)} — الحالة: ${tl(Store.statusDef('risk', r.status).label)}`).join('\n') || 'لا توجد مخاطر حرجة.'}

التوزيع حسب الفئة:
${cats.map(([k, v]) => `• ${UI.catLabel('risk', k)}: ${v}`).join('\n')}

التوصيات:
1. تصعيد المخاطر الحرجة غير المُصعَّدة (${crit.filter(r => r.status !== 'escalated').length}) للجنة التوجيهية.
2. استكمال خطط المعالجة للمخاطر التي لا تملك خطة (${open.filter(r => !r.mitigation).length}).
3. مراجعة المخاطر المتقادمة (أكثر من 90 يوماً): ${open.filter(r => Store.ageDays(r) > 90).length} خطراً.`;
    return `📄 Risk Report — ${p.nameEn} (${p.code})
Date: ${UI.fmtDate(todayISO())}

Executive summary: register holds ${risks.length} risks; ${open.length} open, ${crit.length} critical (score ≥15). Highest concentration: "${cats[0] ? UI.catLabel('risk', cats[0][0]) : '—'}".

Top critical risks:
${crit.slice(0, 5).map((r, i) => `${i + 1}. [${r.ref}] ${r.title} — score ${Store.riskScore(r)} — owner ${Store.userName(r.owner)}`).join('\n') || 'None.'}

Recommendations:
1. Escalate ${crit.filter(r => r.status !== 'escalated').length} unescalated critical risks.
2. Complete mitigation plans for ${open.filter(r => !r.mitigation).length} risks lacking one.
3. Review ${open.filter(r => Store.ageDays(r) > 90).length} risks older than 90 days.`;
  },

  healthReport() {
    const p = Store.cur();
    const h = Store.health();
    const open = tp => Store.list(tp).filter(r => !Store.isClosed(tp, r));
    const overdue = open('action').filter(a => Store.daysOver(a) > 0);
    const schedVar = p.progress - p.plannedProgress;
    if (this.ar()) return `🩺 تقرير صحة المشروع — ${p.name} (${p.code})
التاريخ: ${UI.fmtDate(todayISO())}

مؤشر الصحة العام: ${h}/100 ${h >= 75 ? '🟢 جيد' : h >= 50 ? '🟡 يتطلب انتباهاً' : '🔴 حرج'}

الجدول الزمني: إنجاز فعلي ${p.progress}% مقابل مخطط ${p.plannedProgress}% (انحراف ${schedVar >= 0 ? '+' : ''}${schedVar}%).
المخاطر: ${open('risk').length} مفتوحة، منها ${open('risk').filter(r => Store.riskScore(r) >= 15).length} حرجة.
المعضلات: ${open('issue').length} مفتوحة، منها ${open('issue').filter(i => i.severity === 'critical').length} حرجة.
الإجراءات: ${open('action').length} مفتوحة، منها ${overdue.length} متأخرة.
الملاحظات الميدانية: ${open('observation').length} مفتوحة.
المراسلات المعلقة: ${open('correspondence').length}.

أهم ثلاث أولويات:
1. ${schedVar < 0 ? 'خطة استدراك للجدول الزمني لتعويض انحراف ' + Math.abs(schedVar) + '%.' : 'تثبيت التقدم الحالي وحماية المسار الحرج.'}
2. إغلاق الإجراءات المتأخرة (${overdue.length}) خلال أسبوعين كحد أقصى.
3. معالجة المخاطر والمعضلات الحرجة عبر جلسات معالجة أسبوعية.`;
    return `🩺 Project Health Report — ${p.nameEn} (${p.code})
Health score: ${h}/100 ${h >= 75 ? '🟢' : h >= 50 ? '🟡' : '🔴'}
Schedule: ${p.progress}% actual vs ${p.plannedProgress}% planned (${schedVar >= 0 ? '+' : ''}${schedVar}%).
Open: ${open('risk').length} risks, ${open('issue').length} issues, ${open('action').length} actions (${overdue.length} overdue), ${open('observation').length} observations.

Top priorities: schedule recovery, overdue-action closure within two weeks, weekly treatment sessions for critical risks/issues.`;
  },

  execSummary() {
    const insights = this.execInsights();
    const p = Store.cur();
    const head = this.ar()
      ? `📋 الملخص التنفيذي — ${p.name} (${p.code}) — ${UI.fmtDate(todayISO())}\n`
      : `📋 Executive Summary — ${p.nameEn} (${p.code}) — ${UI.fmtDate(todayISO())}\n`;
    return head + '\n' + insights.map((i, n) => `${n + 1}. ${i.text}`).join('\n\n');
  },

  contractorReview() {
    const ranked = Store.db.contractors.map(c => ({
      c, score: Math.round((c.scores.safety + c.scores.quality + c.scores.schedule + c.scores.commercial + c.scores.risk) / 5)
    })).sort((a, b) => b.score - a.score);
    const openOf = (tp, cid) => Store.db.entities[tp].filter(r => r.contractor === cid && !r.archived && !Store.isClosed(tp, r)).length;
    if (this.ar()) return `🏗️ تقييم أداء المقاولين — ${UI.fmtDate(todayISO())}

${ranked.map((x, i) => `${i + 1}. ${x.c.name} — ${x.score}/100
   السلامة ${x.c.scores.safety} · الجودة ${x.c.scores.quality} · الجدول ${x.c.scores.schedule} · التجاري ${x.c.scores.commercial} · المخاطر ${x.c.scores.risk}
   مفتوح: ${openOf('issue', x.c.id)} معضلة، ${openOf('observation', x.c.id)} ملاحظة، ${openOf('action', x.c.id)} إجراء
   ${x.score >= 85 ? '✅ أداء ممتاز — مرشح للأعمال الإضافية.' : x.score >= 70 ? '🟡 أداء مقبول — يتطلب خطة تحسين في الأبعاد الأدنى.' : '🔴 أداء متدنٍ — يُوصى باجتماع تصحيحي وخطة أداء ملزمة خلال 30 يوماً.'}`).join('\n\n')}`;
    return `🏗️ Contractor Performance Review — ${UI.fmtDate(todayISO())}

${ranked.map((x, i) => `${i + 1}. ${x.c.nameEn} — ${x.score}/100 (S${x.c.scores.safety}/Q${x.c.scores.quality}/Sch${x.c.scores.schedule}/C${x.c.scores.commercial}/R${x.c.scores.risk})
   Open: ${openOf('issue', x.c.id)} issues, ${openOf('observation', x.c.id)} observations · ${x.score >= 85 ? '✅ excellent' : x.score >= 70 ? '🟡 acceptable — improvement plan advised' : '🔴 poor — corrective meeting & 30-day performance plan'}`).join('\n')}`;
  },

  generateMOM() {
    const last = Store.list('meeting').filter(m => ['held', 'momissued'].includes(m.status))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
    if (!last) return this.ar() ? 'لا توجد اجتماعات منعقدة لتوليد محضر.' : 'No held meetings to generate MOM from.';
    const acts = Store.list('action').filter(a => a.sourceType === 'meeting');
    if (this.ar()) return `📝 محضر اجتماع مولّد — ${last.title}
المرجع: ${last.ref} · التاريخ: ${UI.fmtDate(last.date)} · المكان: ${last.location || '—'}
الحضور: ${last.attendees || '—'}

أولاً — ما تمت مناقشته:
${last.minutes || 'استعراض تقدم الأعمال والمعوقات القائمة.'}

ثانياً — القرارات:
${last.decisions || '—'}

ثالثاً — الإجراءات المتابعة (من سجل الإجراءات):
${acts.slice(0, 5).map((a, i) => `${i + 1}. [${a.ref}] ${a.title} — ${Store.userName(a.assignee)} — يستحق ${UI.fmtDate(a.dueDate)} — ${tl(Store.statusDef('action', a.status).label)}`).join('\n') || '—'}

يُعتمد المحضر ما لم ترد ملاحظات خلال 3 أيام عمل.`;
    return `📝 Generated MOM — ${last.title}
Ref ${last.ref} · ${UI.fmtDate(last.date)} · ${last.location || '—'}
Attendees: ${last.attendees || '—'}

Discussed: ${last.minutes || 'Progress and current blockers.'}
Decisions: ${last.decisions || '—'}
Follow-up actions:
${acts.slice(0, 5).map((a, i) => `${i + 1}. [${a.ref}] ${a.title} — ${Store.userName(a.assignee)} — due ${UI.fmtDate(a.dueDate)}`).join('\n') || '—'}`;
  },

  corrSummary() {
    const corr = Store.list('correspondence');
    const awaiting = corr.filter(c => c.status === 'awaiting');
    const late = corr.filter(c => !Store.isClosed('correspondence', c) && c.responseDue && Store.daysOver(c, 'responseDue') > 0);
    if (this.ar()) return `✉️ ملخص المراسلات — ${UI.fmtDate(todayISO())}
الإجمالي: ${corr.length} (وارد ${corr.filter(c => c.direction === 'incoming').length} / صادر ${corr.filter(c => c.direction === 'outgoing').length})
بانتظار الرد: ${awaiting.length} · متجاوزة للمهلة: ${late.length}

الأكثر إلحاحاً:
${late.slice(0, 5).map((c, i) => `${i + 1}. [${c.reference}] ${c.title} — متأخرة ${Store.daysOver(c, 'responseDue')} يوماً`).join('\n') || 'لا يوجد.'}

توصية: إصدار الردود المتأخرة خلال 48 ساعة حفاظاً على الموقف التعاقدي.`;
    return `✉️ Correspondence Summary — ${UI.fmtDate(todayISO())}
Total ${corr.length} (in ${corr.filter(c => c.direction === 'incoming').length} / out ${corr.filter(c => c.direction === 'outgoing').length}) · awaiting ${awaiting.length} · past due ${late.length}
Most urgent:
${late.slice(0, 5).map((c, i) => `${i + 1}. [${c.reference}] ${c.title} — ${Store.daysOver(c, 'responseDue')} days late`).join('\n') || 'None.'}`;
  },

  lessonsDigest() {
    const lessons = Store.list('lesson', { all: true }).filter(l => l.status === 'published');
    if (this.ar()) return `💡 خلاصة الدروس المستفادة عبر المحفظة — ${lessons.length} درساً منشوراً

${['failure', 'bestPractice', 'successStory', 'recommendation'].map(tp => {
  const items = lessons.filter(l => l.lessonType === tp);
  return `${UI.optLabel(tp)} (${items.length}):\n${items.slice(0, 3).map(l => `• ${l.title}`).join('\n') || '• —'}`;
}).join('\n\n')}

توصية: مراجعة دروس "الإخفاقات" أعلاه قبل بدء أي حزمة أعمال مشابهة.`;
    return `💡 Lessons Learned Digest — ${lessons.length} published
${['failure', 'bestPractice', 'successStory', 'recommendation'].map(tp =>
  `${UI.optLabel(tp)}: ${lessons.filter(l => l.lessonType === tp).slice(0, 2).map(l => l.title).join(' · ') || '—'}`).join('\n')}`;
  },

  meetingsSummary() {
    const ms = Store.list('meeting');
    const up = ms.filter(m => m.status === 'scheduled').sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const held = ms.filter(m => ['held', 'momissued'].includes(m.status));
    if (this.ar()) return `🗓️ ملخص الاجتماعات
المنعقدة: ${held.length} · القادمة: ${up.length}

القادمة:
${up.slice(0, 5).map(m => `• ${UI.fmtDate(m.date)} — ${m.title}`).join('\n') || '—'}

آخر القرارات الموثقة:
${held.filter(m => m.decisions).slice(0, 2).map(m => `• ${m.title}: ${m.decisions.slice(0, 120)}…`).join('\n') || '—'}`;
    return `🗓️ Meetings: ${held.length} held, ${up.length} upcoming.
Next: ${up.slice(0, 4).map(m => `${UI.fmtDate(m.date)} ${m.title}`).join(' · ') || '—'}`;
  },

  /* ---------- issue & constraint tracking ---------- */
  trackerReport() {
    const p = Store.cur();
    const all = Store.list('constraint');
    const open = all.filter(r => !Store.isClosed('constraint', r));
    const overdue = open.filter(r => ModTracker.daysOverdue(r) > 0).sort((a, b) => ModTracker.daysOverdue(b) - ModTracker.daysOverdue(a));
    const noResp = open.filter(r => ModTracker.respState(r) === 'none');
    const noEv = all.filter(r => ModTracker.closedNoEvidence(r));
    const escalated = open.filter(r => r.status === 'escalated');
    const byParty = {};
    open.forEach(r => byParty[r.responsibleParty] = (byParty[r.responsibleParty] || 0) + 1);
    const parties = Object.entries(byParty).sort((a, b) => b[1] - a[1]);
    const byCon = {};
    all.forEach(r => { if (r.contractor) byCon[r.contractor] = (byCon[r.contractor] || 0) + 1; });
    const repeat = Object.entries(byCon).filter(x => x[1] >= 3).sort((a, b) => b[1] - a[1]);
    if (this.ar()) return `🚩 التقرير الأسبوعي للمعوقات والمشاكل — ${p.name} (${p.code})
التاريخ: ${UI.fmtDate(todayISO())}

الملخص:
${all.length} معوقاً مسجلاً · ${open.length} مفتوحاً · ${overdue.length} متأخراً · ${escalated.length} مُصعَّداً · ${noResp.length} بلا أي رد.

أعلى تركّز حسب الجهة المسؤولة:
${parties.map(([k, v]) => `• ${UI.optLabel(k)}: ${v}`).join('\n') || '—'}

الأكثر تأخراً (تتطلب تدخلاً فورياً):
${overdue.slice(0, 5).map((r, i) => `${i + 1}. [${r.ref}] ${r.title} — متأخر ${ModTracker.daysOverdue(r)} يوماً — ${UI.optLabel(r.responsibleParty)} — ${tl(Store.statusDef('constraint', r.status).label)}`).join('\n') || 'لا يوجد.'}

معوقات بلا رد إطلاقاً (${noResp.length}):
${noResp.slice(0, 5).map(r => `• [${r.ref}] ${r.title} — مفتوح منذ ${ModTracker.daysOpen(r)} يوماً`).join('\n') || '—'}

أُغلقت بدون دليل (${noEv.length}):
${noEv.slice(0, 5).map(r => `• [${r.ref}] ${r.title}`).join('\n') || '—'}

تكرار ملحوظ حسب المقاول:
${repeat.map(([cid, n]) => `• ${(Store.contractor(cid) || {}).name || cid}: ${n} معوقات`).join('\n') || 'لا تكرار ملحوظ.'}

التوصيات:
1. تصعيد المعوقات المتأخرة أكثر من 14 يوماً (${open.filter(r => ModTracker.daysOverdue(r) > 14).length}) للجنة التوجيهية.
2. إرسال تذكير عاجل لكل معوق بلا رد، وتوثيق المتابعة في النظام.
3. استكمال أدلة الإغلاق للمعوقات المغلقة دون توثيق.`;
    return `🚩 Weekly Issues & Constraints Report — ${p.nameEn} (${p.code})
Date: ${UI.fmtDate(todayISO())}

Summary: ${all.length} total · ${open.length} open · ${overdue.length} overdue · ${escalated.length} escalated · ${noResp.length} without any response.

Top overdue:
${overdue.slice(0, 5).map((r, i) => `${i + 1}. [${r.ref}] ${r.title} — ${ModTracker.daysOverdue(r)}d late — ${UI.optLabel(r.responsibleParty)}`).join('\n') || 'None.'}

No response yet: ${noResp.slice(0, 5).map(r => `[${r.ref}]`).join(' ') || '—'}
Closed without evidence: ${noEv.length}
Repeated by contractor: ${repeat.map(([cid, n]) => `${(Store.contractor(cid) || {}).nameEn || cid} (${n})`).join(' · ') || 'none'}

Recommendations: escalate items overdue >14 days, send urgent reminders for unanswered items, complete closure evidence.`;
  },

  constraintCase(r) {
    const tlTxt = (r.timeline || []).slice(-8).map(e => {
      const lbl = (TRK.tlActions[e.action] || ['•', () => e.action])[1]();
      return `• ${(e.at || '').slice(0, 10)} — ${lbl}${e.comment ? ': ' + e.comment.slice(0, 90) : ''}`;
    }).join('\n');
    const lastR = ModTracker.lastResp(r);
    const lastF = ModTracker.lastFU(r);
    const delayed = ModTracker.daysOverdue(r) > 0 || ModTracker.respState(r) === 'none';
    if (this.ar()) return `🚩 ملخص حالة المعوق — ${r.ref}${r.extRef ? ' · ' + r.extRef : ''}
العنوان: ${r.title}
الموقع: ${r.zone || '—'} — ${r.street || '—'}
الحالة الحالية: ${tl(Store.statusDef('constraint', r.status).label)} · الأولوية: ${UI.prioLabel(r.priority)}
الجهة المسؤولة: ${UI.optLabel(r.responsibleParty)} · المالك الحالي: ${Store.userName(r.currentOwner)}
أُرسل إلى: ${r.sentTo || '—'}

التواريخ: أُنشئ ${UI.fmtDate(r.createdAt)} · أُرسل ${UI.fmtDate(r.sentAt)} · يستحق ${UI.fmtDate(r.dueDate)}${r.closedAt ? ' · أُغلق ' + UI.fmtDate(r.closedAt) : ''}
مفتوح منذ: ${ModTracker.daysOpen(r)} يوماً · متأخر: ${ModTracker.daysOverdue(r)} يوماً · منذ آخر تحديث: ${ModTracker.daysSinceUpdate(r)} يوماً

المتابعات: ${(r.followups || []).length} (آخرها ${lastF ? UI.fmtDate(lastF.date) : '—'})
الردود: ${(r.responses || []).length}${lastR ? ` (آخر رد ${UI.fmtDate(lastR.date)}: ${lastR.summary.slice(0, 80)})` : ' — لا يوجد رد حتى الآن'}
الأدلة: ${(r.evidence || []).length} مرفقاً${ModTracker.hasClosureEv(r) ? ' (يشمل دليل إغلاق)' : ''}

من يؤخر الملف؟ ${delayed ? `المؤشرات تشير إلى ${UI.optLabel(r.responsibleParty)} — ${ModTracker.respState(r) === 'none' ? 'لم يقدم أي رد منذ الإرسال' : 'تجاوز تاريخ الاستحقاق دون إغلاق'}.` : 'لا يوجد تعثر واضح حالياً.'}

الإجراء التالي المقترح:
${ModTracker.nextAction(r)}

آخر تحركات الخط الزمني:
${tlTxt || '—'}`;
    return `🚩 Issue Case Summary — ${r.ref}
Title: ${r.title}
Location: ${r.zone || '—'} — ${r.street || '—'}
Status: ${tl(Store.statusDef('constraint', r.status).label)} · Priority: ${UI.prioLabel(r.priority)}
Responsible: ${UI.optLabel(r.responsibleParty)} · Owner: ${Store.userName(r.currentOwner)}
Created ${UI.fmtDate(r.createdAt)} · sent ${UI.fmtDate(r.sentAt)} · due ${UI.fmtDate(r.dueDate)}${r.closedAt ? ' · closed ' + UI.fmtDate(r.closedAt) : ''}
Open ${ModTracker.daysOpen(r)}d · overdue ${ModTracker.daysOverdue(r)}d
Follow-ups: ${(r.followups || []).length} · Responses: ${(r.responses || []).length}${lastR ? ` (last: ${lastR.summary.slice(0, 70)})` : ' — none yet'}
Who is delaying? ${delayed ? UI.optLabel(r.responsibleParty) : 'no clear blocker'}
Next action: ${ModTracker.nextAction(r)}
Recent timeline:
${tlTxt || '—'}`;
  },

  constraintEmail(r, kind) {
    const esc2 = kind === 'escalation';
    const ov = ModTracker.daysOverdue(r);
    if (this.ar()) return `${esc2 ? '🚨 بريد تصعيد' : '✉️ بريد متابعة'} — مولّد تلقائياً

إلى: ${r.sentTo || UI.optLabel(r.responsibleParty)}${esc2 ? '\nنسخة: الإدارة التنفيذية — اللجنة التوجيهية' : ''}
الموضوع: ${esc2 ? 'تصعيد' : 'متابعة'} — ${r.title} (${r.ref}${r.extRef ? ' / ' + r.extRef : ''})

السادة الأفاضل،

بالإشارة إلى المعوق المسجل أعلاه بموقع ${r.zone || '—'} — ${r.street || '—'}، والمرسل إليكم بتاريخ ${UI.fmtDate(r.sentAt)}، ${ov > 0 ? `نفيدكم بأن مهلة المعالجة قد تجاوزت ${ov} يوماً دون إغلاق،` : 'نأمل موافاتنا بمستجدات المعالجة،'} ${ModTracker.respState(r) === 'none' ? 'علماً بأنه لم يصلنا أي رد رسمي حتى تاريخه.' : ''}

${esc2
  ? `ونظراً لأثر المعوق المباشر على ${r.impactedActivity || 'الأعمال الحرجة'}${r.impactedMilestone ? ` والمعلم التعاقدي (${r.impactedMilestone})` : ''}، فقد تم تصعيد الموضوع للإدارة التنفيذية، ونطلب منكم:
1. تسمية مسؤول مباشر للمعالجة خلال 24 ساعة.
2. خطة معالجة بمدد ملزمة خلال 48 ساعة.
3. اجتماع طارئ لمناقشة العوائق إن لزم.`
  : `وعليه نطلب منكم:
1. موافاتنا بخطة المعالجة وموعد الإغلاق المتوقع.
2. تحديد أي متطلبات من جانبنا لتسريع الحل.
3. الرد خلال (3) أيام عمل من تاريخه.`}

وتفضلوا بقبول فائق الاحترام،
${Store.userName(Store.db.currentUserId) || 'إدارة المشروع'} — ${(Store.cur() || {}).name || ''}`;
    return `${esc2 ? '🚨 Escalation Email' : '✉️ Follow-up Email'} — auto-generated

To: ${r.sentTo || UI.optLabel(r.responsibleParty)}${esc2 ? '\nCc: Executive Management — Steering Committee' : ''}
Subject: ${esc2 ? 'ESCALATION' : 'Follow-up'} — ${r.title} (${r.ref})

Dear Sir/Madam,
Reference the above constraint at ${r.zone || '—'} — ${r.street || '—'}, sent on ${UI.fmtDate(r.sentAt)}. ${ov > 0 ? `It is now ${ov} days overdue.` : 'Kindly provide a status update.'} ${ModTracker.respState(r) === 'none' ? 'No formal response has been received to date.' : ''}
${esc2 ? 'Given the direct impact on critical works, this matter has been escalated. Please nominate a focal point within 24h and submit a committed action plan within 48h.' : 'Please provide your treatment plan and expected closure date within three (3) working days.'}

Regards,
${Store.userName(Store.db.currentUserId) || 'Project Management'}`;
  },

  showReport(text, title) {
    const m = UI.modal(`
      <div class="drawer-h"><h2>✨ ${esc(title)}</h2><button class="x-btn" data-close>✕</button></div>
      <div class="drawer-b" style="white-space:pre-wrap;font-size:13.5px;line-height:1.85">${esc(text)}</div>
      <div class="drawer-f">
        <button class="btn primary" id="rp-copy">📋 ${LANG === 'ar' ? 'نسخ' : 'Copy'}</button>
        <button class="btn" onclick="window.print()">🖨 ${LANG === 'ar' ? 'طباعة' : 'Print'}</button>
        <button class="btn" data-close>${t('close')}</button></div>`, { wide: true });
    m.el.querySelector('#rp-copy').onclick = () => { navigator.clipboard.writeText(text).then(() => UI.toast(t('saved'))); };
  },

  answer(q) {
    const s = q.toLowerCase();
    if (/(معوق|معوقات|عائق|constraint|blocker|tracking)/.test(s)) return this.trackerReport();
    if (/(خطر|مخاطر|risk)/.test(s)) return this.riskReport();
    if (/(صحة|health)/.test(s)) return this.healthReport();
    if (/(محضر|mom|minute)/.test(s)) return this.generateMOM();
    if (/(اجتماع|meeting)/.test(s)) return this.meetingsSummary();
    if (/(مراسل|خطاب|correspond|letter)/.test(s)) return this.corrSummary();
    if (/(مقاول|contractor)/.test(s)) return this.contractorReview();
    if (/(درس|دروس|lesson)/.test(s)) return this.lessonsDigest();
    if (/(ملخص|تنفيذي|summary|executive)/.test(s)) return this.execSummary();
    return this.ar()
      ? `يمكنني توليد التقارير التالية من بيانات مشروعك الحالية:\n• تحليل المخاطر — اكتب "المخاطر"\n• تقرير المعوقات الأسبوعي — "المعوقات"\n• تقرير صحة المشروع — "صحة"\n• ملخص تنفيذي — "ملخص"\n• محضر اجتماع — "محضر"\n• ملخص المراسلات — "المراسلات"\n• تقييم المقاولين — "المقاولين"\n• خلاصة الدروس المستفادة — "الدروس"`
      : `I can generate from your live project data:\n• Risk analysis — type "risks"\n• Constraints report — "constraints"\n• Health report — "health"\n• Executive summary — "summary"\n• MOM — "mom"\n• Correspondence summary — "letters"\n• Contractor review — "contractors"\n• Lessons digest — "lessons"`;
  },
};

/* ============ AI chat module ============ */
const ModAI = {
  msgs: null,

  render(container) {
    if (!this.msgs) this.msgs = [{ me: false, text: t('aiWelcome') }];
    const chips = [
      [t('aiAnalyzeRisks'), () => AIBrain.riskReport()],
      [t('aiHealthReport'), () => AIBrain.healthReport()],
      [t('aiExecSummary'), () => AIBrain.execSummary()],
      [t('aiGenMOM'), () => AIBrain.generateMOM()],
      [t('aiSummarizeMeetings'), () => AIBrain.meetingsSummary()],
      [t('aiCorrSummary'), () => AIBrain.corrSummary()],
      [t('aiContractorReview'), () => AIBrain.contractorReview()],
      [t('aiTrackerReport'), () => AIBrain.trackerReport()],
      [t('aiLessons'), () => AIBrain.lessonsDigest()],
    ];
    container.innerHTML = `
      <div class="panel" style="max-width:880px;margin:0 auto;display:flex;flex-direction:column;height:calc(100vh - 170px)">
        <div class="panel-h"><span style="font-size:20px">✨</span><h3>${t('mAI')}</h3>
          <span class="sub">${Store.cur() ? esc(Store.cur().code) : ''} · ${LANG === 'ar' ? 'يعمل على بياناتك الفعلية' : 'works on your live data'}</span></div>
        <div id="ai-chips" class="ai-chips">${chips.map((c, i) => `<button data-chip="${i}">${c[0]}</button>`).join('')}</div>
        <div id="ai-log" style="flex:1;overflow-y:auto;padding:6px 2px"></div>
        <div class="flex mt8">
          <input class="input" id="ai-in" placeholder="${t('askAI')}" style="flex:1">
          <button class="btn primary" id="ai-send">↗ ${t('send')}</button>
        </div>
      </div>`;

    const log = container.querySelector('#ai-log');
    const draw = () => {
      log.innerHTML = this.msgs.map(m => `
        <div class="ai-msg ${m.me ? 'me' : ''}">
          ${m.me ? `<span class="avatar sm">${esc((Store.user() || {}).initials || '؟')}</span>` : '<span class="avatar sm" style="background:linear-gradient(135deg,#8b5cf6,#6366f1)">✨</span>'}
          <div class="m-body">${esc(m.text)}</div>
        </div>`).join('');
      log.scrollTop = log.scrollHeight;
    };
    draw();

    const push = (text, me) => { this.msgs.push({ me, text }); draw(); };
    const ask = q => {
      push(q, true);
      setTimeout(() => push(AIBrain.answer(q), false), 350);
    };
    chips.forEach((c, i) => container.querySelector(`[data-chip="${i}"]`).onclick = () => {
      push(c[0], true);
      setTimeout(() => push(c[1](), false), 350);
    });
    const inp = container.querySelector('#ai-in');
    const send = () => { const v = inp.value.trim(); if (!v) return; inp.value = ''; ask(v); };
    container.querySelector('#ai-send').onclick = send;
    inp.onkeydown = e => { if (e.key === 'Enter') send(); };
  },
};
