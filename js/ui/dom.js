/* Small DOM toolkit: element builder, icons, tables, toasts, rating chips. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U } = FNG;

  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'value' || k === 'checked' || k === 'selected' || k === 'disabled' || k === 'hidden') el[k] = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    append(el, kids);
    return el;
  }

  function append(el, kids) {
    for (const kid of kids) {
      if (kid == null || kid === false || kid === true) continue;
      if (Array.isArray(kid)) append(el, kid);
      else if (kid instanceof Node) el.appendChild(kid);
      else el.appendChild(document.createTextNode(String(kid)));
    }
  }

  const ICONS = {
    hub: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    roster: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.6c2.6.2 4.6 1.9 5.3 4.9"/>',
    depth: '<rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="13" height="4" rx="1"/><rect x="3" y="16" width="8" height="4" rx="1"/>',
    schedule: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M7 14h3M7 17h3M14 14h3"/>',
    standings: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/>',
    rankings: '<path d="M5 20V11M11 20V5M17 20v-7"/><path d="M2 20h20"/>',
    playoffs: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H4.5v1.2A3 3 0 0 0 8 10M16 6h3.5v1.2A3 3 0 0 1 16 10"/><path d="M12 13v4M8 21h8M9.5 17h5v4h-5z"/>',
    schools: '<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M9.5 21v-5h5v5M10 11h4"/>',
    program: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5l3 3 5.8-5.8a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    football: '<ellipse cx="12" cy="12" rx="9.5" ry="5.6" transform="rotate(-35 12 12)"/><path d="M9.6 14.4l4.8-4.8M10.4 11.6l2 2M11.8 10.2l2 2"/>',
    player: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.2-7 8-7s7 2.5 8 7"/>',
    box: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    min: '<path d="M6 12h12"/>',
    max: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
    close: '<path d="M7 7l10 10M17 7L7 17"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    forward: '<path d="M5 6v12l7-6zM12 6v12l7-6z"/>',
    save: '<path d="M5 3h11l4 4v14H4V3z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    calendarNext: '<path d="M9 6l6 6-6 6"/>',
    news: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M7 9h10M7 13h10M7 17h6"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  };

  function icon(name, size) {
    const s = size || 18;
    const span = document.createElement('span');
    span.className = 'ico';
    span.style.display = 'inline-grid';
    span.innerHTML = '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
    return span;
  }

  // Deterministic colors for AI schools (badges only).
  const PALETTE = [
    ['#b91c1c', '#ffffff'], ['#1d4ed8', '#ffffff'], ['#15803d', '#ffffff'], ['#7e22ce', '#fde047'], ['#c2410c', '#111827'],
    ['#0f766e', '#ffffff'], ['#1e3a8a', '#fbbf24'], ['#991b1b', '#fbbf24'], ['#111827', '#f97316'], ['#334155', '#e2e8f0'],
    ['#7f1d1d', '#e5e7eb'], ['#065f46', '#fde68a'], ['#4338ca', '#e0e7ff'], ['#a16207', '#111827'], ['#be123c', '#f1f5f9'],
    ['#0369a1', '#f8fafc'], ['#581c87', '#f5f5f4'], ['#14532d', '#facc15'], ['#000000', '#d4af37'], ['#9a3412', '#fef3c7'],
  ];
  function schoolColors(s, state) {
    if (s.isUser && state) return state.colors;
    return PALETTE[FNG.hashString(s.name) % PALETTE.length];
  }

  function badge(s, state, size) {
    const [bg, fg] = schoolColors(s, state);
    const txt = U.initials(s.name);
    const style = { background: bg, color: fg, borderColor: fg };
    if (txt.length >= 3) style.fontSize = size === 'lg' ? '15px' : size === 'sm' ? '7px' : '8.5px';
    return h('span', { class: 'sbadge' + (size ? ' ' + size : ''), style, title: s.name }, txt);
  }

  function ratingClass(v) {
    if (v < 45) return 'r1';
    if (v < 55) return 'r2';
    if (v < 63) return 'r3';
    if (v < 71) return 'r4';
    if (v < 80) return 'r5';
    return 'r6';
  }
  function ovrChip(v, title) {
    return h('span', { class: 'ovr ' + ratingClass(v), title: title || null }, Math.round(v));
  }
  const RATING_COLORS = { r1: '#f87171', r2: '#fb923c', r3: '#facc15', r4: '#a3e635', r5: '#34d399', r6: '#22d3ee' };
  function attrBar(label, v) {
    return h('div', { class: 'abar' },
      h('span', { class: 'muted' }, label),
      h('div', { class: 'track' }, h('div', { class: 'fill', style: { width: U.clamp(v, 0, 99) + '%', background: RATING_COLORS[ratingClass(v)] } })),
      h('span', { class: 'v' }, Math.round(v)));
  }

  function stars(n) {
    const el = h('span', { class: 'stars', title: n + ' star potential' });
    for (let i = 1; i <= 5; i++) el.appendChild(h('span', { class: i <= n ? '' : 'off' }, '★'));
    return el;
  }

  function stat(k, v, s, cls) {
    return h('div', { class: 'card tight stat ' + (cls || '') }, h('div', { class: 'k' }, k), h('div', { class: 'v' }, v), s ? h('div', { class: 's' }, s) : null);
  }

  function seg(options, current, onChange, cls) {
    const el = h('div', { class: 'seg ' + (cls || ''), role: 'tablist' });
    for (const o of options) {
      const opt = typeof o === 'string' ? { value: o, label: o } : o;
      el.appendChild(h('button', { type: 'button', class: opt.value === current ? 'on' : '', title: opt.title || null, onclick: () => onChange(opt.value) }, opt.label));
    }
    return el;
  }

  function tabs(options, current, onChange) {
    const el = h('div', { class: 'tabs' });
    for (const o of options) el.appendChild(h('button', { type: 'button', class: o.value === current ? 'on' : '', onclick: () => onChange(o.value) }, o.label));
    return el;
  }

  function select(options, current, onChange, cls) {
    const el = h('select', { class: 'select ' + (cls || ''), onchange: (e) => onChange(e.target.value) });
    for (const o of options) {
      const opt = typeof o === 'object' ? o : { value: o, label: o };
      el.appendChild(h('option', { value: opt.value, selected: String(opt.value) === String(current), disabled: !!opt.disabled }, opt.label));
    }
    return el;
  }

  /*
   * columns: [{ key, label, value(row), render(row), sort(row), cls, title }]
   * opts: { sortState: {key, dir}, onSort, onRow, rowClass(row, i), empty, maxHeight, cutAfter }
   */
  function table(columns, rows, opts) {
    opts = opts || {};
    const ss = opts.sortState;
    let data = rows.slice();
    if (ss && ss.key) {
      const col = columns.find((c) => c.key === ss.key);
      if (col) {
        const f = col.sort || col.value || ((r) => r[col.key]);
        data.sort((a, b) => {
          const x = f(a);
          const y = f(b);
          const r = typeof x === 'string' ? x.localeCompare(y) : x - y;
          return ss.dir === 'asc' ? r : -r;
        });
      }
    }
    const thead = h('thead', null, h('tr', null, columns.map((c) => {
      const sortable = ss && c.sortable !== false && (c.sort || c.value);
      return h('th', {
        class: (c.cls || '') + (sortable ? ' sortable' : '') + (ss && ss.key === c.key ? ' sorted' : ''),
        title: c.title || null,
        onclick: sortable ? () => {
          if (ss.key === c.key) ss.dir = ss.dir === 'asc' ? 'desc' : 'asc';
          else {
            ss.key = c.key;
            ss.dir = c.defaultDir || 'desc';
          }
          if (opts.onSort) opts.onSort(ss);
        } : null,
      }, c.label, ss && ss.key === c.key ? (ss.dir === 'asc' ? ' ▲' : ' ▼') : '');
    })));
    const tbody = h('tbody');
    data.forEach((row, i) => {
      const tr = h('tr', { class: [(opts.rowClass && opts.rowClass(row, i)) || '', opts.onRow ? 'click' : '', opts.cutAfter && i === opts.cutAfter ? 'cut' : ''].join(' ').trim() || null });
      if (opts.onRow) tr.addEventListener('click', (e) => {
        if (e.target.closest('button, select, input, a')) return;
        opts.onRow(row);
      });
      for (const c of columns) {
        const content = c.render ? c.render(row, i) : c.value ? c.value(row, i) : row[c.key];
        tr.appendChild(h('td', { class: c.cls || null }, content));
      }
      tbody.appendChild(tr);
    });
    const wrap = h('div', { class: 'tbl-wrap', style: opts.maxHeight ? { maxHeight: opts.maxHeight } : null }, h('table', { class: 'data' }, thead, tbody));
    if (!data.length) wrap.appendChild(h('div', { class: 'empty' }, opts.empty || 'Nothing to show.'));
    return wrap;
  }

  function toast(text, kind, ms) {
    const root = document.getElementById('toasts');
    const el = h('div', { class: 'toast ' + (kind || '') }, text);
    root.appendChild(el);
    while (root.children.length > 4) root.removeChild(root.firstChild);
    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 300);
    }, ms || 3800);
  }

  function busy(show, text, pct) {
    const el = document.getElementById('busy');
    el.hidden = !show;
    if (show) {
      el.querySelector('.txt').textContent = text || 'Working...';
      el.querySelector('.prog i').style.width = (pct || 0) + '%';
    }
  }

  function recordStr(rec) {
    return rec.w + '-' + rec.l;
  }

  FNG.UI = { h, append, icon, badge, schoolColors, ovrChip, ratingClass, attrBar, stars, stat, seg, tabs, select, table, toast, busy, recordStr, PALETTE };
})();
