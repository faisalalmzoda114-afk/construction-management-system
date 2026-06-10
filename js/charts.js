/* ============================================================
   Charts — dependency-free SVG visualizations
   donut · gauge ring · horizontal bars · column trend · line/area · heat cells
   ============================================================ */
const Charts = {

  donut(data, { size = 160, stroke = 22, centerLabel = '', centerSub = '' } = {}) {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const r = (size - stroke) / 2, c = size / 2, circ = 2 * Math.PI * r;
    let off = 0;
    const segs = data.filter(d => d.value > 0).map(d => {
      const frac = d.value / total, dash = frac * circ;
      const s = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${stroke}"
        stroke-dasharray="${dash - 2} ${circ - dash + 2}" stroke-dashoffset="${-off}" stroke-linecap="butt"
        transform="rotate(-90 ${c} ${c})"><title>${esc(d.label)}: ${d.value}</title></circle>`;
      off += dash; return s;
    }).join('');
    return `<div class="ring-wrap" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}">
        <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--panel-3)" stroke-width="${stroke}"/>${segs}
      </svg>
      <div class="ring-val"><b>${centerLabel}</b><small>${centerSub}</small></div>
    </div>`;
  },

  gauge(value, { size = 150, color = null, label = '' } = {}) {
    const col = color || (value >= 75 ? 'var(--green)' : value >= 50 ? 'var(--gold)' : 'var(--red)');
    return Charts.donut(
      [{ label, value, color: col }, { label: '', value: 100 - value, color: 'var(--panel-3)' }],
      { size, stroke: 14, centerLabel: Math.round(value), centerSub: label }
    );
  },

  hbars(data, { max = null, height = 26, fmt = v => v } = {}) {
    const m = max || Math.max(...data.map(d => d.value), 1);
    return `<div>` + data.map(d => `
      <div style="margin-bottom:10px">
        <div class="flex" style="justify-content:space-between;margin-bottom:4px">
          <span class="fs12 mut2 b">${esc(d.label)}</span><span class="fs12 b" style="color:${d.color || 'var(--accent)'}">${fmt(d.value)}</span>
        </div>
        <div class="bar" style="height:${height > 16 ? 8 : 6}px">
          <i style="width:${Math.round(d.value / m * 100)}%;--bc:${d.color || 'var(--accent)'}"></i>
        </div>
      </div>`).join('') + `</div>`;
  },

  columns(data, { height = 170, color = 'var(--accent)' } = {}) {
    const w = Math.max(data.length * 46, 200), bw = 26;
    const m = Math.max(...data.map(d => d.value), 1);
    const bars = data.map((d, i) => {
      const h = Math.max(Math.round(d.value / m * (height - 42)), 2);
      const x = i * (w / data.length) + (w / data.length - bw) / 2;
      return `<g>
        <rect x="${x}" y="${height - 24 - h}" width="${bw}" height="${h}" rx="5" fill="${d.color || color}" opacity=".88"><title>${esc(d.label)}: ${d.value}</title></rect>
        <text x="${x + bw / 2}" y="${height - 30 - h}" text-anchor="middle" font-size="11" font-weight="800" fill="var(--txt-2)">${d.value}</text>
        <text x="${x + bw / 2}" y="${height - 8}" text-anchor="middle" font-size="10" fill="var(--txt-3)">${esc(d.label)}</text>
      </g>`;
    }).join('');
    return `<svg viewBox="0 0 ${w} ${height}" style="width:100%;max-height:${height}px" preserveAspectRatio="xMidYMid meet">${bars}</svg>`;
  },

  line(series, { height = 180, labels = [] } = {}) {
    // series: [{name, color, values:[...] }]
    const n = Math.max(...series.map(s => s.values.length), 2);
    const w = 560, padL = 26, padB = 22, padT = 14;
    const m = Math.max(...series.flatMap(s => s.values), 1);
    const X = i => padL + i * (w - padL - 10) / (n - 1);
    const Y = v => padT + (1 - v / m) * (height - padT - padB);
    const grid = [0, .5, 1].map(f => {
      const y = Y(m * f);
      return `<line x1="${padL}" y1="${y}" x2="${w - 8}" y2="${y}" stroke="var(--line)" stroke-dasharray="3 4"/>
        <text x="${padL - 5}" y="${y + 3}" text-anchor="end" font-size="9" fill="var(--txt-3)">${Math.round(m * f)}</text>`;
    }).join('');
    const paths = series.map(s => {
      const pts = s.values.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
      const area = `M${X(0)},${Y(s.values[0])} ` + s.values.map((v, i) => `L${X(i)},${Y(v)}`).join(' ') +
        ` L${X(s.values.length - 1)},${height - padB} L${X(0)},${height - padB} Z`;
      const dots = s.values.map((v, i) =>
        `<circle cx="${X(i)}" cy="${Y(v)}" r="3.2" fill="${s.color}"><title>${esc(s.name)}: ${v}</title></circle>`).join('');
      return `<path d="${area}" fill="${s.color}" opacity=".08"/>
        <polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linejoin="round"/>${dots}`;
    }).join('');
    const xLabels = labels.map((l, i) =>
      `<text x="${X(i)}" y="${height - 6}" text-anchor="middle" font-size="9.5" fill="var(--txt-3)">${esc(l)}</text>`).join('');
    const legend = series.length > 1 ? `<div class="flexw fs11 mt8" style="justify-content:center">` +
      series.map(s => `<span class="flex" style="gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:${s.color};display:inline-block"></i>${esc(s.name)}</span>`).join('') + `</div>` : '';
    return `<svg viewBox="0 0 ${w} ${height}" style="width:100%" preserveAspectRatio="xMidYMid meet">${grid}${paths}${xLabels}</svg>${legend}`;
  },

  spark(values, { width = 110, height = 32, color = 'var(--accent)' } = {}) {
    if (!values.length) return '';
    const m = Math.max(...values, 1), mn = Math.min(...values, 0);
    const X = i => i * width / Math.max(values.length - 1, 1);
    const Y = v => 3 + (1 - (v - mn) / Math.max(m - mn, 1)) * (height - 6);
    const pts = values.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
    return `<svg width="${width}" height="${height}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2"/></svg>`;
  },

  heatColor(score) { // 1..25
    if (score >= 17) return '#dc2626';
    if (score >= 10) return '#ea580c';
    if (score >= 5) return '#d97706';
    return '#16a34a';
  }
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
