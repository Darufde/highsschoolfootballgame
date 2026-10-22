/* Window manager: draggable, resizable, minimizable windows with a taskbar. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { h, icon } = FNG.UI;

  const LAYOUT_KEY = 'fng.layout.v1';
  const wins = new Map();
  let zTop = 10;
  let cascade = 0;
  let activeId = null;
  let listeners = [];
  let layout = {};
  try {
    layout = JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}') || {};
  } catch (e) {
    layout = {};
  }

  const root = () => document.getElementById('windows');
  const desk = () => {
    const d = document.getElementById('desktop');
    return { w: d.clientWidth, h: d.clientHeight };
  };
  const mobile = () => window.innerWidth <= 760;
  const layoutKey = (w) => w.opts.layoutKey || w.id.split(':')[0];

  function saveLayout(w) {
    if (w.opts.modal || mobile()) return;
    layout[layoutKey(w)] = { x: w.x, y: w.y, w: w.width, h: w.height };
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
    } catch (e) {
      /* storage unavailable: layout simply isn't remembered */
    }
  }

  function clampGeom(w) {
    const D = desk();
    w.width = Math.max(300, Math.min(w.width, D.w));
    w.height = Math.max(180, Math.min(w.height, D.h));
    w.x = Math.max(0, Math.min(w.x, D.w - Math.min(w.width, 120)));
    w.y = Math.max(0, Math.min(w.y, D.h - 40));
  }

  function applyGeom(w) {
    w.el.style.left = w.x + 'px';
    w.el.style.top = w.y + 'px';
    w.el.style.width = w.width + 'px';
    w.el.style.height = w.height + 'px';
  }

  function notify() {
    for (const fn of listeners) fn();
  }

  function open(id, opts) {
    let w = wins.get(id);
    if (w) {
      Object.assign(w.opts, opts);
      if (opts.title) w.titleEl.textContent = opts.title;
      w.minimized = false;
      w.el.hidden = false;
      focus(id);
      refresh(id);
      return w;
    }
    const D = desk();
    w = { id, opts, state: opts.state || {}, minimized: false, max: false };
    w.width = Math.min(opts.width || 640, D.w - 16);
    w.height = Math.min(opts.height || 480, D.h - 16);
    const saved = !opts.center && !opts.modal && layout[opts.layoutKey || id.split(':')[0]];
    if (saved) {
      w.x = saved.x;
      w.y = saved.y;
      w.width = saved.w;
      w.height = saved.h;
    } else if (opts.center || opts.modal) {
      w.x = Math.max(0, (D.w - w.width) / 2);
      w.y = Math.max(0, (D.h - w.height) / 2.4);
    } else {
      w.x = 112 + ((cascade * 32) % 260);
      w.y = 14 + ((cascade * 28) % 200);
      cascade++;
    }
    clampGeom(w);
    if (w.x + w.width > D.w) w.x = Math.max(0, D.w - w.width);
    if (w.y + w.height > D.h) w.y = Math.max(0, D.h - w.height);

    const btn = (cls, ic, title, fn) => h('button', { type: 'button', class: 'win-btn ' + cls, title, 'aria-label': title, onclick: (e) => { e.stopPropagation(); fn(); } }, icon(ic, 15));
    w.titleEl = h('div', { class: 'wtitle' }, opts.title || '');
    const btns = h('div', { class: 'win-btns' });
    if (!opts.modal) btns.appendChild(btn('minb', 'min', 'Minimize', () => minimize(id)));
    if (!opts.modal && opts.resizable !== false) btns.appendChild(btn('maxb', 'max', 'Maximize', () => toggleMax(id)));
    if (opts.closable !== false) btns.appendChild(btn('close', 'close', 'Close', () => close(id)));
    const bar = h('div', { class: 'win-title' }, h('span', { class: 'wicon' }, icon(opts.icon || 'box', 16)), w.titleEl, btns);
    w.body = h('div', { class: 'win-body' + (opts.flush ? ' flush' : '') });
    w.el = h('section', { class: 'win' + (opts.modal ? ' modal-win' : ''), role: 'dialog', 'aria-label': opts.title || id }, bar, w.body);
    if (opts.resizable !== false) {
      const rz = h('div', { class: 'win-resize' });
      w.el.appendChild(rz);
      dragger(rz, w, 'resize');
    }
    dragger(bar, w, 'move');
    bar.addEventListener('dblclick', (e) => {
      if (!e.target.closest('.win-btn') && opts.resizable !== false && !opts.modal) toggleMax(id);
    });
    w.el.addEventListener('pointerdown', () => focus(id), true);
    if (opts.modal) {
      w.shade = h('div', { class: 'modal-shade' });
      root().appendChild(w.shade);
    }
    applyGeom(w);
    if (opts.maximized && !opts.modal) {
      w.max = true;
      w.el.classList.add('max');
    }
    wins.set(id, w);
    root().appendChild(w.el);
    refresh(id);
    focus(id);
    return w;
  }

  function dragger(handle, w, mode) {
    let start = null;
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('.win-btn') || mobile() || w.max) return;
      e.preventDefault();
      start = { px: e.clientX, py: e.clientY, x: w.x, y: w.y, width: w.width, height: w.height };
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!start) return;
      const dx = e.clientX - start.px;
      const dy = e.clientY - start.py;
      if (mode === 'move') {
        w.x = start.x + dx;
        w.y = start.y + dy;
      } else {
        w.width = start.width + dx;
        w.height = start.height + dy;
      }
      clampGeom(w);
      applyGeom(w);
    });
    const end = () => {
      if (!start) return;
      start = null;
      saveLayout(w);
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  function refresh(id) {
    const w = wins.get(id);
    if (!w || !w.opts.render) return;
    const scroll = w.body.scrollTop;
    const inner = {};
    w.body.querySelectorAll('[data-scroll]').forEach((el) => (inner[el.dataset.scroll] = el.scrollTop));
    w.body.replaceChildren();
    try {
      w.opts.render(w.body, w);
    } catch (err) {
      console.error(err);
      w.body.appendChild(h('div', { class: 'empty' }, 'Something went wrong rendering this window: ' + err.message));
    }
    w.body.scrollTop = scroll;
    w.body.querySelectorAll('[data-scroll]').forEach((el) => {
      if (inner[el.dataset.scroll] != null) el.scrollTop = inner[el.dataset.scroll];
    });
  }

  function refreshAll() {
    for (const w of wins.values()) if (!w.opts.manual) refresh(w.id);
  }

  function close(id, force) {
    const w = wins.get(id);
    if (!w) return;
    if (!force && w.opts.onClose && w.opts.onClose() === false) return;
    w.el.remove();
    if (w.shade) w.shade.remove();
    wins.delete(id);
    if (activeId === id) {
      activeId = null;
      const top = [...wins.values()].filter((x) => !x.minimized).sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex))[0];
      if (top) focus(top.id);
    }
    notify();
  }

  function closeAll() {
    for (const id of [...wins.keys()]) close(id, true);
  }

  function focus(id) {
    const w = wins.get(id);
    if (!w) return;
    if (activeId !== id || w.el.style.zIndex === '') {
      zTop++;
      w.el.style.zIndex = w.opts.modal ? 9000 + zTop : zTop;
    }
    for (const x of wins.values()) x.el.classList.toggle('focused', x.id === id);
    activeId = id;
    notify();
  }

  function minimize(id) {
    const w = wins.get(id);
    if (!w) return;
    w.minimized = true;
    w.el.hidden = true;
    w.el.classList.remove('focused');
    if (activeId === id) activeId = null;
    notify();
  }

  function toggleMax(id) {
    const w = wins.get(id);
    if (!w) return;
    w.max = !w.max;
    w.el.classList.toggle('max', w.max);
  }

  function toggleFromTaskbar(id) {
    const w = wins.get(id);
    if (!w) return;
    if (w.minimized) {
      w.minimized = false;
      w.el.hidden = false;
      focus(id);
    } else if (activeId === id) minimize(id);
    else focus(id);
  }

  function setTitle(id, title) {
    const w = wins.get(id);
    if (!w) return;
    w.opts.title = title;
    w.titleEl.textContent = title;
    notify();
  }

  function dialog(o) {
    return new Promise((resolve) => {
      const id = 'dialog:' + Date.now();
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        close(id, true);
        resolve(v);
      };
      open(id, {
        title: o.title || 'Confirm',
        icon: o.icon || 'box',
        modal: true,
        resizable: false,
        width: o.width || 420,
        height: o.height || 230,
        manual: true,
        onClose: () => {
          finish(null);
          return false;
        },
        render: (body) => {
          body.appendChild(typeof o.body === 'string' ? h('p', { style: { marginTop: 0 } }, o.body) : o.body);
          const row = h('div', { class: 'row end mt' });
          for (const b of o.buttons || [{ label: 'Cancel', value: false }, { label: 'OK', value: true, cls: 'primary' }]) {
            row.appendChild(h('button', { type: 'button', class: 'btn ' + (b.cls || ''), onclick: () => finish(b.value) }, b.label));
          }
          body.appendChild(row);
        },
      });
    });
  }

  function confirm(title, text, okLabel, danger) {
    return dialog({ title, body: text, buttons: [{ label: 'Cancel', value: false }, { label: okLabel || 'OK', value: true, cls: danger ? 'danger' : 'primary' }] });
  }

  window.addEventListener('resize', () => {
    for (const w of wins.values()) {
      clampGeom(w);
      applyGeom(w);
    }
  });

  FNG.WM = {
    open, close, closeAll, focus, minimize, toggleMax, toggleFromTaskbar, refresh, refreshAll, setTitle, dialog, confirm,
    isOpen: (id) => wins.has(id),
    get: (id) => wins.get(id),
    list: () => [...wins.values()].filter((w) => !w.opts.modal && !w.opts.hideTask),
    active: () => activeId,
    onChange: (fn) => listeners.push(fn),
  };
})();
