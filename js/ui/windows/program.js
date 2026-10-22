/* Program & facilities, offseason, history and settings windows. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U, Season, World, Team, Players } = FNG;
  const { h, icon, badge, table, seg, tabs, ovrChip, stars, toast } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  function pips(level) {
    return h('div', { class: 'row', style: { gap: '4px' } }, [1, 2, 3, 4, 5].map((i) => h('span', { style: { width: '18px', height: '6px', borderRadius: '3px', background: i <= level ? 'var(--team)' : 'rgba(255,255,255,.1)' } })));
  }

  Win.program = function () {
    WM.open('program', {
      title: 'Program & Facilities',
      icon: 'program',
      width: 880,
      height: 640,
      render(body) {
        const st = App.state;
        const u = Season.user(st);
        const P = st.program;
        body.appendChild(h('div', { class: 'grid c3 mb' },
          FNG.UI.stat('Program Funds', U.money(P.funds), 'Available to spend'),
          FNG.UI.stat('Season Revenue', U.money(P.revenue), 'Gate receipts this season'),
          FNG.UI.stat('Annual Budget', U.money(Season.budget(u)), (u.type === 'public' ? 'Levy & boosters' : 'Tuition & boosters') + ' · arrives in the offseason')));
        const grid = h('div', { class: 'grid c2' });
        for (const key in Season.FACILITIES) {
          const F = Season.FACILITIES[key];
          const lvl = P.facilities[key];
          const cost = Season.upgradeCost(st, key);
          grid.appendChild(h('div', { class: 'card' },
            h('div', { class: 'row between' }, h('div', { class: 'bold' }, F.name), h('span', { class: 'small muted' }, 'Level ' + lvl + ' / 5')),
            h('div', { class: 'mt', style: { marginTop: '8px' } }, pips(lvl)),
            h('div', { class: 'small muted', style: { margin: '8px 0 10px' } }, F.desc),
            cost == null ? h('span', { class: 'tag gold' }, 'Fully upgraded') :
              h('button', { type: 'button', class: 'btn sm' + (P.funds >= cost ? ' primary' : ''), disabled: P.funds < cost, onclick: async () => {
                if (!(await WM.confirm('Upgrade ' + F.name, 'Spend ' + U.money(cost) + ' to upgrade the ' + F.name + ' to level ' + (lvl + 1) + '?', 'Upgrade'))) return;
                if (Season.upgrade(st, key)) {
                  toast(F.name + ' upgraded to level ' + (lvl + 1) + '.', 'good');
                  App.changed();
                }
              } }, 'Upgrade · ' + U.money(cost))));
        }
        body.appendChild(h('h3', { class: 'sect' }, 'Facilities'));
        body.appendChild(grid);
        body.appendChild(h('div', { class: 'card mt' }, h('h3', { class: 'sect' }, 'School Type: ' + (u.type === 'public' ? 'Public' : 'Private')),
          h('p', { class: 'small', style: { margin: 0 } }, u.type === 'public'
            ? 'Your players come from the ' + u.name + ' attendance zone. Budgets come from the levy and the booster club. Transfers are rare, so your youth program and player development are what build a winner.'
            : u.name + ' draws from all over the ' + u.county + ' County area. Expect a few transfers every year and a healthier budget, but the OHSAA competitive balance formula counts your enrollment at ' + U.num(World.adjustedEnrollment(u)) + ', placing you in Division ' + U.roman(u.division) + '.')));
      },
    });
  };

  Win.offseason = function () {
    WM.open('offseason', {
      title: 'Offseason',
      icon: 'calendarNext',
      width: 860,
      height: 640,
      render(body) {
        const st = App.state;
        if (st.phase !== 'offseason' || !st.offseason) {
          body.appendChild(h('div', { class: 'empty' }, 'The offseason begins after the state championships.'));
          return;
        }
        const O = st.offseason;
        const u = Season.user(st);
        const steps = Season.OFFSEASON_STEPS;
        body.appendChild(h('div', { class: 'row mb', style: { gap: '6px' } }, steps.map((name, i) => h('span', { class: 'tag ' + (i === O.step ? 'team' : i < O.step ? 'good' : '') }, (i + 1) + '. ' + name))));
        const next = (label) => h('div', { class: 'row end mt' }, h('button', { type: 'button', class: 'btn primary lg', onclick: () => {
          Season.offseasonNext(st);
          if (st.phase !== 'offseason') {
            WM.close('offseason', true);
            toast('Welcome to the ' + st.year + ' season!', 'good', 5000);
            Win.hub();
            Win.schedule();
          }
          App.changed();
        } }, label, icon('calendarNext', 15)));

        if (O.step === 0) {
          const hist = st.history[0];
          body.appendChild(h('div', { class: 'hero' }, badge(u, st, 'lg'), h('div', { class: 'grow', style: { position: 'relative', zIndex: 1 } },
            h('div', { class: 'name' }, st.year + ' Season: ' + hist.w + '-' + hist.l),
            h('div', { class: 'meta' }, hist.result + ' · League ' + hist.lw + '-' + hist.ll + (hist.leagueChamp ? ' (league champions)' : '') + ' · ' + hist.pf + ' points for, ' + hist.pa + ' against'),
            h('div', { class: 'meta' }, 'Program prestige is now ' + u.prestige + '/100.'))));
          const champs = st.champions.filter((c) => c.year === st.year);
          body.appendChild(h('div', { class: 'grid c2' },
            h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Player Honors'),
              O.awards.length ? table([
                { key: 'n', label: 'Player', render: (a) => h('button', { type: 'button', class: 'linklike', onclick: () => Win.player(a.id) }, a.name) },
                { key: 'p', label: 'Pos', render: (a) => a.pos },
                { key: 'y', label: 'Yr', render: (a) => a.year },
                { key: 'h', label: 'Honor', render: (a) => h('span', { class: 'tag ' + (a.honor === 'All-Ohio' ? 'gold' : 'info') }, a.honor) },
              ], O.awards) : h('div', { class: 'muted small' }, 'No players earned postseason honors this year.')),
            h('div', { class: 'card' }, h('h3', { class: 'sect' }, st.year + ' State Champions'),
              champs.map((c) => h('div', { class: 'row nowrap', style: { marginBottom: '6px' } }, h('span', { class: 'tag gold' }, 'D-' + U.roman(c.div)), badge(Season.school(st, c.id), st, 'sm'), h('button', { type: 'button', class: 'linklike', onclick: () => Win.school(c.id) }, c.name))))));
          body.appendChild(next('Graduation'));
        } else if (O.step === 1) {
          body.appendChild(h('p', { class: 'muted' }, O.graduates.length + ' seniors graduate from ' + u.name + '. Thank you, seniors.'));
          body.appendChild(table([
            { key: 'n', label: 'Player', render: (g) => h('span', { class: 'bold' }, g.name) },
            { key: 'p', label: 'Pos', render: (g) => g.pos },
            { key: 'o', label: 'Ovr', render: (g) => ovrChip(g.ovr), cls: 'c' },
            { key: 'h', label: 'Honors', render: (g) => g.honors.join(', ') || '—', cls: 'muted' },
          ], O.graduates.sort((a, b) => b.ovr - a.ovr), { empty: 'No seniors this year.' }));
          body.appendChild(next('Player Development'));
        } else if (O.step === 2) {
          const avg = U.avg(O.development.map((d) => d.delta));
          body.appendChild(h('p', { class: 'muted' }, 'Offseason workouts are complete. Average change: ' + (avg >= 0 ? '+' : '') + avg.toFixed(1) + ' overall. Weight Room level ' + st.program.facilities.weight + ', Practice Fields level ' + st.program.facilities.practice + '.'));
          body.appendChild(table([
            { key: 'n', label: 'Player', render: (d) => h('button', { type: 'button', class: 'linklike', onclick: () => Win.player(d.id) }, d.name) },
            { key: 'p', label: 'Pos', render: (d) => d.pos },
            { key: 'y', label: 'Now', render: (d) => d.year },
            { key: 'b', label: 'Before', render: (d) => ovrChip(d.before), cls: 'c' },
            { key: 'a', label: 'After', render: (d) => ovrChip(d.after), cls: 'c' },
            { key: 'd', label: 'Change', render: (d) => h('span', { class: 'num bold ' + (d.delta > 0 ? 'good-t' : d.delta < 0 ? 'bad-t' : 'muted') }, (d.delta > 0 ? '+' : '') + d.delta), cls: 'r' },
          ], O.development));
          body.appendChild(next('Incoming Class'));
        } else if (O.step === 3) {
          const fresh = O.incoming.filter((p) => p.origin === 'Freshman').length;
          body.appendChild(h('p', { class: 'muted' }, fresh + ' freshmen join the program' + (O.incoming.length > fresh ? ', plus ' + (O.incoming.length - fresh) + ' transfer/walk-on' + (O.incoming.length - fresh > 1 ? 's' : '') : '') + '. Youth Program level ' + st.program.facilities.youth + '.'));
          body.appendChild(table([
            { key: 'n', label: 'Player', render: (p) => h('button', { type: 'button', class: 'linklike', onclick: () => Win.player(p.id) }, p.name) },
            { key: 'p', label: 'Pos', render: (p) => p.pos },
            { key: 'y', label: 'Yr', render: (p) => p.year },
            { key: 'o', label: 'Ovr', render: (p) => ovrChip(p.ovr), cls: 'c' },
            { key: 's', label: 'Potential', render: (p) => stars(p.stars) },
            { key: 'f', label: 'From', render: (p) => h('span', { class: 'tag ' + (p.origin === 'Transfer' ? 'info' : '') }, p.origin) },
          ], O.incoming.slice().sort((a, b) => b.stars - a.stars || b.ovr - a.ovr)));
          if (O.departures && O.departures.length) {
            body.appendChild(h('p', { class: 'help' }, O.departures.length + ' player' + (O.departures.length > 1 ? 's' : '') + ' buried on the depth chart decided to move on: ' + O.departures.join(', ') + '.'));
          }
          body.appendChild(next('Program Budget'));
        } else {
          body.appendChild(h('div', { class: 'card accent mb' }, h('div', { class: 'bold', style: { fontSize: '16px' } }, U.money(O.budgetAdded) + ' added to program funds'),
            h('div', { class: 'small muted' }, 'You now have ' + U.money(st.program.funds) + '. Spend it on facilities before the season starts — or save up for a big upgrade.'),
            h('div', { class: 'row mt' }, h('button', { type: 'button', class: 'btn', onclick: () => Win.program() }, icon('program', 15), 'Open Program & Facilities'))));
          body.appendChild(h('p', { class: 'muted small' }, 'Starting the new season generates a fresh schedule, updates every program across Ohio, and resets the standings.'));
          body.appendChild(next('Begin ' + (st.year + 1) + ' Season'));
        }
      },
    });
  };

  Win.history = function () {
    WM.open('history', {
      title: 'History',
      icon: 'history',
      width: 860,
      height: 600,
      state: { tab: 'program', div: 0 },
      render(body, w) {
        const st = App.state;
        const C = st.coach;
        body.appendChild(tabs([{ value: 'program', label: 'My Program' }, { value: 'champions', label: 'State Champions' }], w.state.tab, (v) => { w.state.tab = v; WM.refresh(w.id); }));
        if (w.state.tab === 'program') {
          body.appendChild(h('div', { class: 'grid c4 mb' },
            FNG.UI.stat('Career Record', C.wins + '-' + C.losses, C.seasons + ' completed season' + (C.seasons === 1 ? '' : 's')),
            FNG.UI.stat('Playoff Wins', C.playoffWins),
            FNG.UI.stat('League Titles', C.leagueTitles, C.regionTitles + ' region title' + (C.regionTitles === 1 ? '' : 's')),
            FNG.UI.stat('State Titles', C.titles)));
          body.appendChild(table([
            { key: 'y', label: 'Season', render: (x) => x.year, cls: 'bold' },
            { key: 'r', label: 'Record', render: (x) => x.w + '-' + x.l, cls: 'num' },
            { key: 'l', label: 'League', render: (x) => x.lw + '-' + x.ll + (x.leagueChamp ? ' 🏅' : ''), cls: 'num' },
            { key: 'pts', label: 'PF-PA', render: (x) => x.pf + '-' + x.pa, cls: 'num' },
            { key: 'd', label: 'Div/Reg', render: (x) => U.roman(x.division) + ' / ' + x.region },
            { key: 'res', label: 'Result', render: (x) => (x.result === 'State Champion' ? h('span', { class: 'tag gold' }, '🏆 ' + x.result) : x.result) },
          ], st.history, { empty: 'Finish a season to start building your program’s history.' }));
        } else {
          const years = [...new Set(st.champions.map((c) => c.year))].sort((a, b) => b - a);
          const cols = [{ key: 'y', label: 'Year', render: (y) => y, cls: 'bold' }].concat([1, 2, 3, 4, 5, 6, 7].map((d) => ({
            key: 'd' + d, label: 'D-' + U.roman(d), render: (y) => {
              const c = st.champions.find((x) => x.year === y && x.div === d);
              return c ? h('button', { type: 'button', class: 'linklike', style: c.id === st.userId ? { color: 'var(--gold)' } : null, onclick: () => Win.school(c.id) }, c.name) : '—';
            },
          })));
          body.appendChild(table(cols, years, { empty: 'No champions crowned yet.' }));
        }
      },
    });
  };

  Win.settings = function () {
    WM.open('settings', {
      title: 'Settings',
      icon: 'settings',
      width: 560,
      height: 520,
      render(body) {
        const st = App.state;
        if (st) {
          body.appendChild(h('div', { class: 'card mb' }, h('h3', { class: 'sect' }, 'Saving'),
            h('div', { class: 'row between' }, h('span', null, 'Auto-save after every change'), seg([{ value: true, label: 'On' }, { value: false, label: 'Off' }], st.settings.autoSave, (v) => { st.settings.autoSave = v; App.changed(); App.save(true); })),
            h('div', { class: 'row mt' },
              h('button', { type: 'button', class: 'btn primary', onclick: () => App.save() }, icon('save', 15), 'Save Now'),
              h('button', { type: 'button', class: 'btn', onclick: () => App.exportSave() }, 'Export Save'),
              h('button', { type: 'button', class: 'btn', onclick: () => App.importSave() }, 'Import Save'))));
          body.appendChild(h('div', { class: 'card mb' }, h('h3', { class: 'sect' }, 'Game Day'),
            h('div', { class: 'row between mb' }, h('span', null, 'Default play speed'), seg([{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }], st.settings.speed, (v) => { st.settings.speed = v; App.changed(); })),
            h('div', { class: 'row between mb' }, h('span', null, 'Coordinator calls offense'), seg([{ value: true, label: 'On' }, { value: false, label: 'Off' }], !!st.settings.autoOffense, (v) => { st.settings.autoOffense = v; App.changed(); })),
            h('div', { class: 'row between' }, h('span', null, 'Coordinator calls defense'), seg([{ value: true, label: 'On' }, { value: false, label: 'Off' }], st.settings.autoDefense !== false, (v) => { st.settings.autoDefense = v; App.changed(); }))));
          body.appendChild(h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Program'),
            h('div', { class: 'row' },
              h('button', { type: 'button', class: 'btn', onclick: () => App.toTitle() }, 'Main Menu'),
              h('button', { type: 'button', class: 'btn danger', onclick: async () => {
                if (await WM.confirm('Start Over', 'Abandon ' + Season.user(st).name + ' and start a new program? Your current save will be replaced when the new program begins.', 'Start Over', true)) {
                  App.toTitle();
                  Win.setup();
                }
              } }, 'Start a New Program'))));
        } else {
          body.appendChild(h('p', { class: 'muted' }, 'Start or load a program to change settings.'));
        }
        body.appendChild(h('p', { class: 'help mt' }, 'Friday Night Gridiron · Saves live in this browser’s local storage. Export a copy to move a program between devices.'));
      },
    });
  };
})();
