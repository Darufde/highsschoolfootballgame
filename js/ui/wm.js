/*
 * Screen router. One full-page screen is shown at a time; detail screens (a player, a school,
 * a box score) stack on top of the screen they were opened from and offer a Back button.
 * Confirmation dialogs are modal overlays.
 *
 * Screens are opened with WM.open(id, { title, icon, render(body, screen), state }).
 * Ids without a colon are top-level sections; ids like "player:P123" are detail screens.
 */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { h, icon } = FNG.UI;

  const screens = new Map();
  let current = null;
  let stack = [];
  const listeners = [];
  const modals = new Map();

  const host = () => document.getElementById('screen');
  const notify = () => listeners.forEach((fn) => fn());

  function open(id, opts) {
    if (opts.modal) return openModal(id, opts);
    let s = screens.get(id);
    if (s) Object.assign(s.opts, opts);
    else {
      s = { id, opts, state: opts.state || {} };
      screens.set(id, s);
    }
    const isRoot = opts.root != null ? opts.root : !id.includes(':');
    opts.root = isRoot;
    opts.detail = !isRoot;
    if (isRoot) stack = [];
    else if (current && current !== id) {
      stack = stack.filter((x) => x !== id);
      stack.push(current);
      if (stack.length > 25) stack.shift();
    }
    const changed = current !== id;
    current = id;
    paint(changed);
    notify();
    return s;
  }

  function paint(scrollTop) {
    const root = host();
    const s = screens.get(current);
    root.replaceChildren();
    if (!s) return;
    s.titleEl = h('h1', { class: 'screen-title' }, s.opts.title || '');
    const back = stack.length && s.opts.back !== false ? h('button', { type: 'button', class: 'btn ghost sm back-btn', onclick: () => close(s.id) }, '‹ Back') : null;
    s.body = h('div', { class: 'screen-body' });
    root.appendChild(h('div', { class: 'screen' + (s.opts.wide ? ' wide' : '') + (s.opts.narrow ? ' narrow' : '') },
      h('div', { class: 'screen-head' }, back, h('span', { class: 'screen-icon' }, icon(s.opts.icon || 'box', 20)), s.titleEl),
      s.body));
    renderBody(s);
    if (scrollTop) root.scrollTop = 0;
  }

  function renderBody(s) {
    try {
      s.opts.render(s.body, s);
    } catch (err) {
      console.error(err);
      s.body.appendChild(h('div', { class: 'empty' }, 'Something went wrong showing this screen: ' + err.message));
    }
  }

  function refresh(id) {
    if (modals.has(id)) return;
    if (id !== current) return;
    const s = screens.get(id);
    const root = host();
    const top = root.scrollTop;
    s.body.replaceChildren();
    renderBody(s);
    root.scrollTop = top;
  }

  function refreshAll() {
    const s = screens.get(current);
    if (s && !s.opts.manual) refresh(current);
  }

  function back() {
    while (stack.length) {
      const prev = stack.pop();
      if (screens.has(prev)) {
        current = prev;
        paint(true);
        notify();
        return;
      }
    }
    current = null;
    host().replaceChildren();
    notify();
    if (FNG.App && FNG.App.home) FNG.App.home();
  }

  function close(id, force) {
    if (modals.has(id)) return closeModal(id);
    const s = screens.get(id);
    if (!s) return;
    if (!force && s.opts.onClose && s.opts.onClose() === false) return;
    if (s.opts.detail) screens.delete(id);
    if (current === id) back();
    else stack = stack.filter((x) => x !== id);
  }

  function closeAll() {
    for (const id of [...modals.keys()]) closeModal(id);
    screens.clear();
    stack = [];
    current = null;
    host().replaceChildren();
    notify();
  }

  function setTitle(id, title) {
    const s = screens.get(id);
    if (!s) return;
    s.opts.title = title;
    if (id === current && s.titleEl) s.titleEl.textContent = title;
  }

  /* Modal dialogs ---------------------------------------------------- */
  function openModal(id, opts) {
    const shade = h('div', { class: 'modal-shade' });
    const body = h('div', { class: 'modal-body' });
    const box = h('div', { class: 'modal', role: 'dialog', 'aria-label': opts.title || id, style: { maxWidth: (opts.width || 440) + 'px' } },
      h('div', { class: 'modal-title' }, opts.title || ''), body);
    shade.appendChild(box);
    shade.addEventListener('pointerdown', (e) => {
      if (e.target === shade && opts.onClose) opts.onClose();
    });
    document.getElementById('modals').appendChild(shade);
    const m = { id, opts, el: shade, body };
    modals.set(id, m);
    opts.render(body, m);
    return m;
  }

  function closeModal(id) {
    const m = modals.get(id);
    if (!m) return;
    m.el.remove();
    modals.delete(id);
  }

  function dialog(o) {
    return new Promise((resolve) => {
      const id = 'dialog:' + Date.now();
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        closeModal(id);
        resolve(v);
      };
      openModal(id, {
        title: o.title || 'Confirm',
        width: o.width || 440,
        onClose: () => finish(null),
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

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const ids = [...modals.keys()];
    if (ids.length) {
      const m = modals.get(ids[ids.length - 1]);
      if (m.opts.onClose) m.opts.onClose();
    }
  });

  FNG.WM = {
    open, close, closeAll, refresh, refreshAll, setTitle, dialog, confirm, back,
    isOpen: (id) => current === id,
    current: () => current,
    rootOf: () => {
      const ids = stack.concat(current ? [current] : []);
      for (const id of ids) {
        const s = screens.get(id);
        if (s && s.opts.root) return id;
      }
      return null;
    },
    onChange: (fn) => listeners.push(fn),
  };
})();
