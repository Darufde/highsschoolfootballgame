/* App controller: game state ownership, save/load, theme, taskbar, start menu, week flow. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U, Season, Schedule } = FNG;
  const { h, icon, badge, toast, busy } = FNG.UI;
  const WM = FNG.WM;
  FNG.Win = FNG.Win || {};
  const Win = FNG.Win;

  const SAVE_KEY = 'fng.save.v1';

  const APPS = [
    { id: 'hub', label: 'Program Hub', icon: 'hub' },
    { id: 'roster', label: 'Roster', icon: 'roster' },
    { id: 'depth', label: 'Depth Chart', icon: 'depth' },
    { id: 'staff', label: 'Coaching Staff', icon: 'staff' },
    { id: 'schedule', label: 'Schedule', icon: 'schedule' },
    { id: 'standings', label: 'League Standings', icon: 'standings' },
    { id: 'rankings', label: 'Rankings', icon: 'rankings' },
    { id: 'playoffs', label: 'Playoffs', icon: 'playoffs' },
    { id: 'schools', label: 'Schools', icon: 'schools' },
    { id: 'program', label: 'Program & Facilities', icon: 'program' },
    { id: 'history', label: 'History', icon: 'history' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const App = {
    state: null,
    busy: false,
  };

  /* ------------------------------------------------------------------ */
  /* Storage                                                             */
  /* ------------------------------------------------------------------ */
  function readSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return valid(s) ? s : null;
    } catch (e) {
      return null;
    }
  }

  function valid(s) {
    return s && s.version === Season.SAVE_VERSION && Array.isArray(s.schools) && Array.isArray(s.roster) && s.userId;
  }

  // A save from an earlier version of the game that can no longer be loaded.
  App.hasOldSave = function () {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return !!raw && !readSave();
    } catch (e) {
      return false;
    }
  };

  App.save = function (quiet) {
    if (!App.state) return false;
    try {
      App.state.savedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(App.state));
      if (!quiet) toast('Game saved.', 'good', 1800);
      return true;
    } catch (e) {
      toast('Could not save: browser storage is full or unavailable. Use Settings → Export to keep a copy.', 'bad', 6000);
      return false;
    }
  };

  App.hasSave = () => !!readSave();
  App.saveSummary = function () {
    const s = readSave();
    if (!s) return null;
    const u = s.schools.find((x) => x.id === s.userId);
    return { name: u.name, city: u.city, year: s.year, phase: s.phase, week: s.week, coach: s.coach, colors: s.colors, rec: u.rec, savedAt: s.savedAt };
  };
  App.deleteSave = function () {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      /* nothing to delete */
    }
  };
  App.loadSaved = function () {
    const s = readSave();
    if (s) App.start(s);
  };

  App.exportSave = function () {
    if (!App.state) return;
    const u = Season.user(App.state);
    const blob = new Blob([JSON.stringify(App.state)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: (u.name.replace(/[^a-z0-9]+/gi, '-') + '-' + App.state.year + '.json').toLowerCase() });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  };

  App.importSave = function () {
    const input = h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
    input.addEventListener('change', () => {
      const f = input.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const s = JSON.parse(reader.result);
          if (s && s.version && s.version !== Season.SAVE_VERSION) {
            toast('That save is from an older version of the game and can\u2019t be loaded.', 'bad', 6000);
            return;
          }
          if (!valid(s)) throw new Error('not a save file');
          App.start(s);
          App.save(true);
          toast('Save imported.', 'good');
        } catch (e) {
          toast('That file is not a valid Friday Night Gridiron save.', 'bad');
        }
      };
      reader.readAsText(f);
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  };

  /* ------------------------------------------------------------------ */
  /* Theme                                                               */
  /* ------------------------------------------------------------------ */
  function luminance(hex) {
    const c = hex.replace('#', '');
    const v = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
    const rgb = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  App.applyTheme = function (colors) {
    const root = document.documentElement.style;
    const [c1, c2] = colors || ['#2563eb', '#ffffff'];
    root.setProperty('--team', c1);
    root.setProperty('--team-2', c2);
    root.setProperty('--team-ink', luminance(c1) > 0.45 ? '#0b1220' : '#ffffff');
  };

  /* ------------------------------------------------------------------ */
  /* Shell                                                               */
  /* ------------------------------------------------------------------ */
  function openApp(id) {
    closeStart();
    if (!App.state && id !== 'settings') return;
    Win[id]();
  }

  function renderIcons() {
    const box = document.getElementById('desktop-icons');
    box.replaceChildren();
    if (!App.state) return;
    for (const a of APPS) {
      const el = h('button', { type: 'button', class: 'dicon', title: a.label }, h('span', { class: 'glyph' }, icon(a.icon, 22)), h('span', null, a.label));
      el.addEventListener('dblclick', () => openApp(a.id));
      el.addEventListener('click', () => {
        if (window.matchMedia('(hover: none)').matches || window.innerWidth <= 760) openApp(a.id);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') openApp(a.id);
      });
      box.appendChild(el);
    }
  }

  let startEl = null;
  function closeStart() {
    if (startEl) {
      startEl.remove();
      startEl = null;
      document.querySelector('.tb-start') && document.querySelector('.tb-start').classList.remove('open');
    }
  }
  function toggleStart() {
    if (startEl) return closeStart();
    const st = App.state;
    const items = [];
    if (st) {
      const u = Season.user(st);
      items.push(h('div', { class: 'start-head' }, badge(u, st), h('div', null, h('div', { class: 't' }, u.name), h('div', { class: 's' }, 'Coach ' + st.coach.name + ' · ' + st.year))));
      for (const a of APPS) items.push(h('button', { type: 'button', class: 'start-item', onclick: () => openApp(a.id) }, h('span', { class: 'glyph' }, icon(a.icon, 18)), a.label));
      items.push(h('div', { class: 'start-sep' }));
      items.push(h('button', { type: 'button', class: 'start-item', onclick: () => { closeStart(); App.save(); } }, h('span', { class: 'glyph' }, icon('save', 18)), 'Save Game'));
      items.push(h('button', { type: 'button', class: 'start-item', onclick: () => { closeStart(); App.toTitle(); } }, h('span', { class: 'glyph' }, icon('football', 18)), 'Main Menu'));
    } else {
      items.push(h('div', { class: 'start-head' }, h('div', null, h('div', { class: 't' }, 'Friday Night Gridiron'), h('div', { class: 's' }, 'High School Football'))));
      items.push(h('button', { type: 'button', class: 'start-item', onclick: () => { closeStart(); App.toTitle(); } }, h('span', { class: 'glyph' }, icon('football', 18)), 'Main Menu'));
    }
    startEl = h('div', { class: 'start-menu', role: 'menu' }, items);
    document.body.appendChild(startEl);
    document.querySelector('.tb-start').classList.add('open');
  }
  document.addEventListener('pointerdown', (e) => {
    if (startEl && !e.target.closest('.start-menu') && !e.target.closest('.tb-start')) closeStart();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeStart();
  });

  function renderTaskbar() {
    const tb = document.getElementById('taskbar');
    tb.replaceChildren();
    const st = App.state;
    const startBtn = h('button', { type: 'button', class: 'tb-start', onclick: toggleStart, 'aria-label': 'Menu' },
      st ? badge(Season.user(st), st, 'sm') : h('span', { class: 'sbadge sm', style: { background: '#8b4513', color: '#fff' } }, 'FN'),
      h('span', null, 'Menu'));
    const winsBox = h('div', { class: 'tb-wins' });
    for (const w of WM.list()) {
      winsBox.appendChild(h('button', {
        type: 'button',
        class: 'tb-win' + (WM.active() === w.id ? ' active' : '') + (w.minimized ? ' min' : ''),
        title: w.opts.title,
        onclick: () => WM.toggleFromTaskbar(w.id),
      }, icon(w.opts.icon || 'box', 15), h('span', null, w.opts.title)));
    }
    tb.append(startBtn, winsBox);
    if (st) {
      const u = Season.user(st);
      const status = h('div', { class: 'tb-status' },
        h('span', { class: 'hide-sm' }, h('b', null, st.year), ' · ', Season.phaseLabel(st)),
        h('span', { class: 'hide-sm' }, 'Record ', h('b', null, u.rec.w + '-' + u.rec.l)),
        h('button', { type: 'button', class: 'btn primary sm', onclick: () => App.primaryAction() }, icon('play', 13), App.primaryLabel()));
      tb.appendChild(status);
    }
  }
  WM.onChange(renderTaskbar);

  App.changed = function () {
    WM.refreshAll();
    renderTaskbar();
    const st = App.state;
    if (st) {
      document.getElementById('desktop').dataset.watermark = Season.user(st).name;
      if (st.settings.autoSave) App.save(true);
    }
  };

  App.start = function (state) {
    App.state = state;
    App.applyTheme(state.colors);
    WM.closeAll();
    renderIcons();
    document.getElementById('desktop').dataset.watermark = Season.user(state).name;
    Win.hub();
    renderTaskbar();
  };

  App.toTitle = function () {
    if (App.state) App.save(true);
    App.state = null;
    WM.closeAll();
    renderIcons();
    document.getElementById('desktop').dataset.watermark = 'Friday Night Gridiron';
    App.applyTheme(null);
    renderTaskbar();
    Win.title();
  };

  /* ------------------------------------------------------------------ */
  /* Week flow                                                           */
  /* ------------------------------------------------------------------ */
  App.primaryLabel = function () {
    const st = App.state;
    if (!st) return '';
    if (st.phase === 'offseason') return 'Offseason';
    const g = Season.userGame(st);
    if (g && !g.played) return 'Sim Game';
    return 'Advance Week';
  };

  App.primaryAction = function () {
    const st = App.state;
    if (!st || App.busy) return;
    if (st.phase === 'offseason') return Win.offseason();
    const g = Season.userGame(st);
    if (g && !g.played) return App.simGame(g.id);
    App.advanceWeek();
  };

  function resultToast(st, game) {
    if (!game || !game.played) return;
    const home = game.home === st.userId;
    const us = home ? game.hs : game.as;
    const them = home ? game.as : game.hs;
    const opp = Season.opponentOf(st, game, st.userId);
    toast((us > them ? 'WIN ' : 'LOSS ') + us + '-' + them + (home ? ' vs ' : ' at ') + opp.name, us > them ? 'good' : 'bad', 5000);
  }

  // Finish the current week (user game must already be played or will be quick-simmed).
  App.advanceWeek = function () {
    const st = App.state;
    if (!st || st.phase === 'offseason') return;
    const week = st.week;
    const g = Season.userGame(st, week);
    Season.advanceWeek(st);
    if (g) resultToast(st, g);
    afterWeek(st, week);
  };

  function afterWeek(st, week) {
    if (week === 10 && st.phase === 'playoffs' && Season.user(st).state === 'KY') {
      toast('Regular season complete. Kentucky\u2019s KHSAA playoffs are not in the game yet.', 'warn', 6000);
    } else if (week === 10 && st.phase === 'playoffs') {
      const u = Season.user(st);
      toast(u.rec.seed ? 'Playoffs! ' + u.name + ' is the No. ' + u.rec.seed + ' seed in Region ' + u.region + '.' : u.name + ' missed the playoffs.', u.rec.seed ? 'good' : 'warn', 6000);
      if (u.rec.seed) Win.playoffs();
    }
    if (st.phase === 'offseason') Win.offseason();
    App.changed();
  }

  // The one button: simulate the user's game (and everyone else's), then show the box score.
  App.simGame = function (gameId) {
    const st = App.state;
    const game = st.games.find((g) => g.id === gameId);
    if (!game || game.played || App.busy) return;
    App.busy = true;
    busy(true, 'Simulating week ' + st.week + '\u2026', 40);
    setTimeout(() => {
      Season.simGame(st, game);
      App.busy = false;
      busy(false);
      App.advanceWeek();
      Win.box(game.id);
    }, 20);
  };

  // Simulate weeks in chunks so the UI stays responsive.
  App.simUntil = function (label, stop) {
    const st = App.state;
    if (!st || App.busy) return;
    App.busy = true;
    const startWeek = st.week;
    const loop = () => {
      if (st.phase === 'offseason' || stop(st)) {
        App.busy = false;
        busy(false);
        if (st.phase === 'offseason') Win.offseason();
        App.changed();
        return;
      }
      const week = st.week;
      const g = Season.userGame(st, week);
      Season.advanceWeek(st);
      if (g) resultToast(st, g);
      if (week === 10) afterWeek(st, week);
      busy(true, label + ' — ' + Season.phaseLabel(st), U.clamp(((st.week - startWeek) / Math.max(1, 17 - startWeek)) * 100, 0, 100));
      setTimeout(loop, 16);
    };
    busy(true, label, 0);
    setTimeout(loop, 30);
  };

  App.dateLabel = function (st, week) {
    return Schedule.weekDateStr(st.year, week || st.week, true);
  };

  App.APPS = APPS;
  FNG.App = App;
})();
