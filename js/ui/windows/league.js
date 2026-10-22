/* League standings, rankings (computer points + poll) and playoff brackets. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U, Season, World, Team } = FNG;
  const { h, badge, table, select, seg, tabs, ovrChip } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  function teamCell(st, s, extra) {
    return h('div', { class: 'row nowrap', style: { gap: '8px' } }, badge(s, st, 'sm'), h('button', { type: 'button', class: 'linklike', onclick: () => Win.school(s.id) }, s.name), extra || null);
  }

  Win.standings = function (leagueId) {
    WM.open('standings', {
      title: 'League Standings',
      icon: 'standings',
      width: 820,
      height: 560,
      state: { league: leagueId || null, sort: null },
      render(body, w) {
        const st = App.state;
        const u = Season.user(st);
        if (leagueId) {
          w.state.league = leagueId;
          leagueId = null;
        }
        const lid = w.state.league || u.leagueId;
        const lg = Season.league(st, lid);
        const opts = [{ value: u.leagueId, label: '★ ' + Season.league(st, u.leagueId).name }].concat(
          st.leagues.filter((l) => l.id !== u.leagueId).slice().sort((a, b) => a.name.localeCompare(b.name)).map((l) => ({ value: l.id, label: l.name })));
        const sel = select(opts, lid, (v) => { w.state.league = v; WM.refresh(w.id); });
        sel.style.maxWidth = '360px';
        body.appendChild(h('div', { class: 'toolbar' }, sel, h('div', { class: 'grow' }), h('span', { class: 'small muted' }, lg.members.length + ' members · ' + (lg.members.length - 1) + ' league games')));
        const rows = Season.leagueStandings(st, lid);
        body.appendChild(table([
          { key: 'rk', label: '#', render: (s, i) => i + 1, cls: 'num' },
          { key: 'team', label: 'Team', render: (s) => teamCell(st, s, s.rec.leagueChamp ? h('span', { class: 'tag gold' }, 'Champion') : null) },
          { key: 'lg', label: 'League', render: (s) => s.rec.lw + '-' + s.rec.ll, cls: 'num bold' },
          { key: 'ov', label: 'Overall', render: (s) => s.rec.w + '-' + s.rec.l, cls: 'num' },
          { key: 'pf', label: 'PF', render: (s) => s.rec.pf, cls: 'num r' },
          { key: 'pa', label: 'PA', render: (s) => s.rec.pa, cls: 'num r' },
          { key: 'strk', label: 'Strk', render: (s) => s.rec.streak || '—', cls: 'num' },
          { key: 'div', label: 'Div', render: (s) => U.roman(s.division) },
          { key: 'city', label: 'City', render: (s) => s.city, cls: 'muted' },
        ], rows, { rowClass: (s) => (s.isUser ? 'me' : ''), onRow: (s) => Win.school(s.id) }));
      },
    });
  };

  Win.rankings = function () {
    WM.open('rankings', {
      title: 'Rankings',
      icon: 'rankings',
      width: 860,
      height: 640,
      state: { tab: 'computer', region: null, div: 0 },
      render(body, w) {
        const st = App.state;
        const u = Season.user(st);
        const S = w.state;
        if (!S.region) S.region = u.region;
        body.appendChild(tabs([{ value: 'computer', label: 'Computer Ratings' }, { value: 'poll', label: 'State Poll' }], S.tab, (v) => { S.tab = v; WM.refresh(w.id); }));
        if (S.tab === 'computer') {
          const regionOpts = [];
          for (let r = 1; r <= 28; r++) regionOpts.push({ value: r, label: 'Division ' + U.roman(Math.ceil(r / 4)) + ' · Region ' + r + ' (' + World.regionName(r) + ')' + (r === u.region ? ' ★' : '') });
          body.appendChild(h('div', { class: 'toolbar' }, select(regionOpts, S.region, (v) => { S.region = Number(v); WM.refresh(w.id); }), h('div', { class: 'grow' }),
            h('span', { class: 'small muted' }, 'Top 16 qualify for the playoffs.')));
          const rows = Season.regionStandings(st, S.region);
          body.appendChild(table([
            { key: 'rk', label: 'Rk', render: (s, i) => i + 1, cls: 'num' },
            { key: 'team', label: 'Team', render: (s) => teamCell(st, s) },
            { key: 'rec', label: 'Record', render: (s) => s.rec.w + '-' + s.rec.l, cls: 'num' },
            { key: 'cp', label: 'Avg Pts', render: (s) => s.cp.toFixed(4), cls: 'num r bold' },
            { key: 'lg', label: 'League', render: (s) => Season.league(st, s.leagueId).name, cls: 'muted' },
            { key: 'st', label: 'Status', render: (s, i) => (st.phase !== 'regular' && st.playoffs ? (s.rec.seed ? h('span', { class: 'tag good' }, 'Seed ' + s.rec.seed) : h('span', { class: 'tag' }, 'Out')) : i < 16 ? h('span', { class: 'tag info' }, 'In') : h('span', { class: 'tag' }, 'Out')) },
          ], rows, { rowClass: (s) => (s.isUser ? 'me' : ''), cutAfter: 16, onRow: (s) => Win.school(s.id) }));
          body.appendChild(h('p', { class: 'help' }, 'Ohio-style computer ratings: Level 1 points for every win (6.0 vs Division I down to 3.0 vs Division VII) plus one-tenth of the Level 1 points earned by the teams you beat, divided by games scheduled.'));
        } else {
          body.appendChild(h('div', { class: 'toolbar' }, seg([{ value: 0, label: 'All' }].concat([1, 2, 3, 4, 5, 6, 7].map((d) => ({ value: d, label: U.roman(d) }))), S.div, (v) => { S.div = v; WM.refresh(w.id); })));
          const list = Season.poll(st, S.div || null);
          body.appendChild(table([
            { key: 'rk', label: 'Rk', render: (s, i) => i + 1, cls: 'num bold' },
            { key: 'team', label: 'Team', render: (s) => teamCell(st, s) },
            { key: 'rec', label: 'Record', render: (s) => s.rec.w + '-' + s.rec.l, cls: 'num' },
            { key: 'div', label: 'Div', render: (s) => U.roman(s.division) },
            { key: 'reg', label: 'Region', render: (s) => s.region, cls: 'num' },
            { key: 'pw', label: 'Power', render: (s) => Math.round(s.elo), cls: 'num r' },
            { key: 'city', label: 'City', render: (s) => s.city, cls: 'muted' },
          ], list, { rowClass: (s) => (s.isUser ? 'me' : ''), onRow: (s) => Win.school(s.id) }));
          const rank = Season.pollRank(st, u, S.div || null);
          body.appendChild(h('p', { class: 'help' }, u.name + (rank ? ' is ranked #' + rank + '.' : ' is not ranked here.') + ' Poll is based on a power rating that rewards wins, margin and strength of opponent.'));
        }
      },
    });
  };

  function matchBox(st, ids, game, seedOf) {
    const box = h('div', { class: 'bm' });
    for (let i = 0; i < 2; i++) {
      const id = ids[i];
      const s = id ? Season.school(st, id) : null;
      let cls = 'bt';
      let score = '';
      if (game && game.played && s) {
        const pts = game.home === id ? game.hs : game.as;
        const opp = game.home === id ? game.as : game.hs;
        cls += pts > opp ? ' won' : ' lost';
        score = pts;
      }
      if (s && s.isUser) cls += ' me';
      box.appendChild(h('div', { class: cls },
        h('span', { class: 'sd' }, s && seedOf(id) ? seedOf(id) : ''),
        s ? h('button', { type: 'button', class: 'linklike ellipsis', style: { fontWeight: 'inherit', color: 'inherit' }, onclick: () => Win.school(s.id) }, s.name) : h('span', { class: 'dim' }, ids[0] || ids[1] ? 'Bye' : 'TBD'),
        h('span', { class: 'num' }, score)));
    }
    return box;
  }

  Win.playoffs = function () {
    WM.open('playoffs', {
      title: 'Playoffs',
      icon: 'playoffs',
      width: 1040,
      height: 660,
      state: { div: null, view: null },
      render(body, w) {
        const st = App.state;
        const u = Season.user(st);
        const S = w.state;
        if (!S.div) S.div = u.division;
        if (!S.view) S.view = String(u.region);
        const divSeg = seg([1, 2, 3, 4, 5, 6, 7].map((d) => ({ value: d, label: 'Div ' + U.roman(d) })), S.div, (v) => {
          S.div = v;
          S.view = String((v - 1) * 4 + 1);
          WM.refresh(w.id);
        });
        const regions = [1, 2, 3, 4].map((k) => (S.div - 1) * 4 + k);
        const viewSeg = seg(regions.map((r) => ({ value: String(r), label: 'Region ' + r })).concat([{ value: 'state', label: 'State' }]), S.view, (v) => { S.view = v; WM.refresh(w.id); });
        body.appendChild(h('div', { class: 'toolbar' }, divSeg));
        body.appendChild(h('div', { class: 'toolbar' }, viewSeg));

        if (!st.playoffs) {
          const r = S.view === 'state' ? regions[0] : Number(S.view);
          body.appendChild(h('div', { class: 'card mb' }, h('div', { class: 'bold' }, 'The playoffs begin after Week 10.'), h('div', { class: 'small muted' }, 'Projected Region ' + r + ' field based on current computer ratings:')));
          const list = Season.regionStandings(st, r).slice(0, 16);
          body.appendChild(table([
            { key: 's', label: 'Seed', render: (s, i) => i + 1, cls: 'num bold' },
            { key: 't', label: 'Team', render: (s) => teamCell(st, s) },
            { key: 'r', label: 'Record', render: (s) => s.rec.w + '-' + s.rec.l, cls: 'num' },
            { key: 'cp', label: 'Avg Pts', render: (s) => s.cp.toFixed(4), cls: 'num r' },
          ], list, { rowClass: (s) => (s.isUser ? 'me' : '') }));
          return;
        }
        const P = st.playoffs[S.div];
        const seedOf = (id) => Season.school(st, id).rec.seed;
        const bracket = h('div', { class: 'bracket' });
        const findGame = (round, region, slot) => st.games.find((g) => g.playoff && g.playoff.div === S.div && g.playoff.round === round && g.playoff.region === region && g.playoff.slot === slot);
        if (S.view !== 'state') {
          const region = Number(S.view);
          const R = P.regions[region];
          for (let r = 0; r < 4; r++) {
            const arr = R.rounds[r];
            const col = h('div', { class: 'round' }, h('div', { class: 'rname' }, Season.ROUND_NAMES[r + 1]));
            if (!arr) {
              const n = 8 >> r;
              for (let i = 0; i < n; i++) col.appendChild(matchBox(st, [null, null], null, seedOf));
            } else {
              for (let i = 0; i < arr.length / 2; i++) col.appendChild(matchBox(st, [arr[2 * i], arr[2 * i + 1]], findGame(r + 1, region, i), seedOf));
            }
            bracket.appendChild(col);
          }
          const champ = h('div', { class: 'round' }, h('div', { class: 'rname' }, 'Region Champion'));
          champ.appendChild(R.champion ? h('div', { class: 'bm' }, h('div', { class: 'bt won' + (Season.school(st, R.champion).isUser ? ' me' : '') }, h('span', { class: 'sd' }, seedOf(R.champion)), h('span', null, '🏆 ' + Season.school(st, R.champion).name), h('span'))) : h('div', { class: 'bm' }, h('div', { class: 'bt' }, h('span'), h('span', { class: 'dim' }, 'TBD'), h('span'))));
          bracket.appendChild(champ);
        } else {
          const rounds = P.state.rounds;
          const names = ['State Semifinals', 'State Championship'];
          for (let r = 0; r < 2; r++) {
            const arr = rounds[r];
            const col = h('div', { class: 'round' }, h('div', { class: 'rname' }, names[r]));
            const n = r === 0 ? 2 : 1;
            for (let i = 0; i < n; i++) col.appendChild(arr ? matchBox(st, [arr[2 * i], arr[2 * i + 1]], findGame(r + 5, null, i), seedOf) : matchBox(st, [null, null], null, seedOf));
            bracket.appendChild(col);
          }
          const champ = h('div', { class: 'round' }, h('div', { class: 'rname' }, 'State Champion'));
          champ.appendChild(h('div', { class: 'bm' }, h('div', { class: 'bt won' }, h('span'), h('span', null, P.champion ? '🏆 ' + Season.school(st, P.champion).name : 'TBD'), h('span'))));
          bracket.appendChild(champ);
        }
        body.appendChild(bracket);
        body.appendChild(h('p', { class: 'help' }, 'Higher seeds host the first two rounds. Regional semifinals and later are played at neutral sites. Region champions meet in the state semifinals.'));
      },
    });
  };
})();
