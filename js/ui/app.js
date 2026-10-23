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
  // Saves in browser storage are compressed (FNG.lzCompress) behind this prefix; older saves are plain JSON.
  const LZ_PREFIX = 'LZ1:';

  const APPS = [
    { id: 'hub', label: 'Hub', icon: 'hub' },
    { id: 'roster', label: 'Roster', icon: 'roster' },
    { id: 'depth', label: 'Depth Chart', icon: 'depth' },
    { id: 'staff', label: 'Staff', icon: 'staff' },
    { id: 'schedule', label: 'Schedule', icon: 'schedule' },
    { id: 'standings', label: 'Standings', icon: 'standings' },
    { id: 'rankings', label: 'Team Rankings', icon: 'rankings' },
    { id: 'recruits', label: 'Recruits', icon: 'star' },
    { id: 'colleges', label: 'Colleges', icon: 'college' },
    { id: 'alumni', label: 'Alumni', icon: 'alumni' },
    { id: 'playoffs', label: 'Playoffs', icon: 'playoffs' },
    { id: 'schools', label: 'Schools', icon: 'schools' },
    { id: 'program', label: 'Facilities', icon: 'program' },
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
      const s = JSON.parse(raw.startsWith(LZ_PREFIX) ? FNG.lzDecompress(raw.slice(LZ_PREFIX.length)) : raw);
      return valid(s) ? s : null;
    } catch (e) {
      return null;
    }
  }

  function valid(s) {
    return s && (s.version >= 2 && s.version <= Season.SAVE_VERSION) && Array.isArray(s.schools) && Array.isArray(s.roster) && s.userId;
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
      localStorage.setItem(SAVE_KEY, LZ_PREFIX + FNG.lzCompress(JSON.stringify(App.state)));
      lastSave = Date.now();
      dirty = false;
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
          if (s && s.version && !valid(s)) {
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
  /* Shell: top bar with the program, the next action and section tabs   */
  /* ------------------------------------------------------------------ */
  function openApp(id) {
    if (!App.state && id !== 'settings') return;
    Win[id]();
  }

  let menuEl = null;
  function closeMenu() {
    if (menuEl) {
      menuEl.remove();
      menuEl = null;
    }
  }
  function toggleMenu(anchor) {
    if (menuEl) return closeMenu();
    const items = [];
    if (App.state) {
      items.push(h('button', { type: 'button', class: 'menu-item', onclick: () => { closeMenu(); App.save(); } }, icon('save', 16), 'Save Game'));
      items.push(h('button', { type: 'button', class: 'menu-item', onclick: () => { closeMenu(); Win.settings(); } }, icon('settings', 16), 'Settings'));
    }
    items.push(h('button', { type: 'button', class: 'menu-item', onclick: () => { closeMenu(); App.toTitle(); } }, icon('football', 16), 'Main Menu'));
    menuEl = h('div', { class: 'menu', role: 'menu' }, items);
    const r = anchor.getBoundingClientRect();
    menuEl.style.top = r.bottom + 6 + 'px';
    menuEl.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
    document.body.appendChild(menuEl);
  }
  document.addEventListener('pointerdown', (e) => {
    if (menuEl && !e.target.closest('.menu') && !e.target.closest('.menu-btn')) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  function renderTopbar() {
    const bar = document.getElementById('topbar');
    bar.replaceChildren();
    const st = App.state;
    const brand = st
      ? h('button', { type: 'button', class: 'brand', onclick: () => Win.hub() }, badge(Season.user(st), st), h('div', { class: 'brand-text' }, h('div', { class: 'brand-name' }, Season.user(st).name), h('div', { class: 'brand-sub' }, 'Coach ' + st.coach.name)))
      : h('div', { class: 'brand' }, h('span', { class: 'sbadge', style: { background: '#8b4513', color: '#fff' } }, 'FN'), h('div', { class: 'brand-text' }, h('div', { class: 'brand-name' }, 'Friday Night Gridiron'), h('div', { class: 'brand-sub' }, 'High School Football')));
    const right = h('div', { class: 'top-right' });
    if (st) {
      const u = Season.user(st);
      right.append(
        h('div', { class: 'top-status' }, h('b', null, st.year + ' · ' + Season.phaseLabel(st)), h('span', null, 'Varsity ' + u.rec.w + '-' + u.rec.l)),
        h('button', { type: 'button', class: 'btn primary', onclick: () => App.primaryAction() }, icon('play', 14), App.primaryLabel()));
    }
    right.appendChild(h('button', { type: 'button', class: 'btn ghost menu-btn', 'aria-label': 'Menu', onclick: (e) => toggleMenu(e.currentTarget) }, '☰'));
    bar.appendChild(h('div', { class: 'top-row' }, brand, right));
    if (st) {
      const active = WM.rootOf();
      const nav = h('nav', { class: 'top-nav', 'aria-label': 'Sections' });
      for (const a of APPS) {
        if (a.id === 'settings') continue;
        nav.appendChild(h('button', { type: 'button', class: 'nav-item' + (active === a.id ? ' on' : ''), onclick: () => openApp(a.id) }, icon(a.icon, 16), a.label));
      }
      bar.appendChild(nav);
      const on = nav.querySelector('.on');
      if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }
  WM.onChange(renderTopbar);

  App.changed = function () {
    WM.refreshAll();
    renderTopbar();
    const st = App.state;
    if (st && st.settings.autoSave) {
      dirty = true;
      scheduleAutoSave();
    }
  };
  /*
   * Autosave writes the whole world, which takes a moment with thousands of schools, so it runs
   * at most once every AUTOSAVE_MS while you play (just after the screen repaints), and right away
   * when the page is hidden or closed. Save Game and Ctrl+S always save immediately.
   */
  const AUTOSAVE_MS = 30000;
  let autoSaveTimer = null;
  let lastSave = 0;
  let dirty = false;
  function scheduleAutoSave() {
    if (autoSaveTimer) return;
    const wait = Math.max(60, lastSave + AUTOSAVE_MS - Date.now());
    autoSaveTimer = setTimeout(() => {
      autoSaveTimer = null;
      if (App.state && dirty) App.save(true);
    }, wait);
  }
  function flushSave() {
    if (App.state && dirty) App.save(true);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSave();
  });
  window.addEventListener('pagehide', flushSave);

  App.home = function () {
    if (App.state) Win.hub();
    else Win.title();
  };

  App.start = function (state) {
    App.state = Season.migrate(state);
    App.applyTheme(state.colors);
    WM.closeAll();
    Win.hub();
    renderTopbar();
  };

  App.toTitle = function () {
    if (App.state) App.save(true);
    App.state = null;
    WM.closeAll();
    App.applyTheme(null);
    renderTopbar();
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
    const us = Season.user(st).state;
    if (week === 10 && st.phase === 'playoffs' && !FNG.World.hasPlayoffs(us)) {
      toast('Regular season complete. ' + FNG.World.stateName(us) + '\u2019s ' + FNG.World.assoc(us) + ' playoffs are not in the game yet.', 'warn', 6000);
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
