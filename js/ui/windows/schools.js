/* Ohio schools directory and school profile windows. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U, Season, World, Team, Schedule } = FNG;
  const { h, badge, table, select, seg, tabs, ovrChip, stars } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  const KIND = { public: 'Public', catholic: 'Private · Catholic', christian: 'Private · Christian', prep: 'Private · Independent', private: 'Private' };

  Win.schools = function () {
    WM.open('schools', {
      title: 'Ohio Schools',
      icon: 'schools',
      width: 1040,
      height: 660,
      state: { q: '', type: 'all', div: '0', county: 'all', sort: { key: 'name', dir: 'asc' } },
      render(body, w) {
        const st = App.state;
        const S = w.state;
        const counties = [...new Set(st.schools.map((s) => s.county))].sort();
        const results = h('div');
        const count = h('span', { class: 'small muted' });
        const draw = () => {
          const q = S.q.trim().toLowerCase();
          const rows = st.schools.filter((s) =>
            (!q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.county.toLowerCase().includes(q)) &&
            (S.type === 'all' || s.type === S.type) &&
            (S.div === '0' || s.division === Number(S.div)) &&
            (S.county === 'all' || s.county === S.county));
          count.textContent = rows.length + ' of ' + st.schools.length + ' schools';
          results.replaceChildren(table([
            { key: 'name', label: 'School', value: (s) => s.name, render: (s) => h('div', { class: 'row nowrap', style: { gap: '8px' } }, badge(s, st, 'sm'), h('span', { class: 'bold' }, s.name)), defaultDir: 'asc' },
            { key: 'city', label: 'City', value: (s) => s.city, defaultDir: 'asc' },
            { key: 'county', label: 'County', value: (s) => s.county, defaultDir: 'asc' },
            { key: 'type', label: 'Type', value: (s) => s.kind, render: (s) => (s.type === 'public' ? h('span', { class: 'tag' }, 'Public') : h('span', { class: 'tag info' }, 'Private')) },
            { key: 'div', label: 'Div', value: (s) => s.division, render: (s) => U.roman(s.division), defaultDir: 'asc' },
            { key: 'region', label: 'Reg', value: (s) => s.region, cls: 'num', defaultDir: 'asc' },
            { key: 'enr', label: 'Enroll', value: (s) => s.enrollment, render: (s) => U.num(s.enrollment), cls: 'num r' },
            { key: 'rec', label: 'Record', value: (s) => U.pct(s.rec.w, s.rec.l) * 100 + s.rec.w, render: (s) => s.rec.w + '-' + s.rec.l, cls: 'num' },
            { key: 'pres', label: 'Tradition', value: (s) => s.prestige, render: (s) => stars(U.clamp(Math.round(s.prestige / 20), 1, 5)) },
          ], rows, { sortState: S.sort, onSort: draw, onRow: (s) => Win.school(s.id), rowClass: (s) => (s.isUser ? 'me' : '') }));
        };
        const search = h('input', { class: 'input', placeholder: 'Search by school, city or county…', value: S.q, style: { width: '260px' }, oninput: (e) => { S.q = e.target.value; draw(); } });
        body.appendChild(h('div', { class: 'toolbar' }, search,
          select([{ value: 'all', label: 'All types' }, { value: 'public', label: 'Public' }, { value: 'private', label: 'Private' }], S.type, (v) => { S.type = v; draw(); }),
          select([{ value: '0', label: 'All divisions' }].concat([1, 2, 3, 4, 5, 6, 7].map((d) => ({ value: String(d), label: 'Division ' + U.roman(d) }))), S.div, (v) => { S.div = v; draw(); }),
          select([{ value: 'all', label: 'All counties' }].concat(counties.map((c) => ({ value: c, label: c + ' County' }))), S.county, (v) => { S.county = v; draw(); }),
          h('div', { class: 'grow' }), count));
        body.appendChild(results);
        draw();
      },
    });
  };

  function ratingBars(r, label) {
    const units = ['qb', 'rb', 'wr', 'ol', 'dl', 'lb', 'db', 'k', 'p'];
    return h('div', { class: 'card' }, h('h3', { class: 'sect' }, label),
      h('div', { class: 'row mb' }, h('span', { class: 'muted small' }, 'Overall'), ovrChip(Team.teamOverall(r))),
      units.map((k) => FNG.UI.attrBar(Team.UNIT_LABEL[k], r[k])));
  }

  Win.school = function (id) {
    WM.open('school:' + id, {
      title: 'School',
      icon: 'schools',
      width: 860,
      height: 640,
      layoutKey: 'school',
      state: { tab: 'overview' },
      render(body, w) {
        const st = App.state;
        const s = Season.school(st, id);
        if (!s) return;
        WM.setTitle(w.id, s.name);
        const lg = Season.league(st, s.leagueId);
        const pr = Season.pollRank(st, s, s.division);
        body.appendChild(h('div', { class: 'hero', style: s.isUser ? null : { background: 'linear-gradient(115deg, ' + FNG.UI.schoolColors(s)[0] + '99, var(--panel-2) 65%)', borderColor: 'var(--line-2)' } },
          badge(s, st, 'lg'),
          h('div', { class: 'grow', style: { position: 'relative', zIndex: 1 } },
            h('div', { class: 'name' }, s.name, s.isUser ? h('span', { class: 'tag team', style: { marginLeft: '8px' } }, 'Your school') : null),
            h('div', { class: 'meta' }, s.city + ', ' + s.county + ' County, Ohio · ' + KIND[s.kind]),
            h('div', { class: 'meta' }, 'Division ' + U.roman(s.division) + ' · Region ' + s.region + ' (' + World.regionName(s.region) + ') · ' + lg.name)),
          h('div', { class: 'right', style: { position: 'relative', zIndex: 1 } }, h('div', { style: { fontSize: '26px', fontWeight: 800 } }, s.rec.w + '-' + s.rec.l), h('div', { class: 'small', style: { color: 'rgba(255,255,255,.75)' } }, pr ? '#' + pr + ' in D-' + U.roman(s.division) : 'Unranked'))));

        body.appendChild(tabs([{ value: 'overview', label: 'Overview' }, { value: 'schedule', label: 'Schedule' }, { value: 'history', label: 'History' }, { value: 'league', label: 'League' }], w.state.tab, (v) => { w.state.tab = v; WM.refresh(w.id); }));
        const T = w.state.tab;
        if (T === 'overview') {
          const info = h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Profile'), h('dl', { class: 'kv' },
            h('dt', null, 'Enrollment'), h('dd', null, U.num(s.enrollment) + (s.type === 'private' ? ' (×1.3 for divisions)' : '')),
            h('dt', null, 'Tradition'), h('dd', null, stars(U.clamp(Math.round(s.prestige / 20), 1, 5)), ' ', h('span', { class: 'muted small' }, s.prestige + '/100')),
            h('dt', null, 'League record'), h('dd', null, s.rec.lw + '-' + s.rec.ll),
            h('dt', null, 'Points'), h('dd', null, s.rec.pf + ' for · ' + s.rec.pa + ' against'),
            h('dt', null, 'Computer'), h('dd', null, s.cp.toFixed(4) + ' (#' + (s.cpRank || '—') + ' in Region ' + s.region + ')'),
            h('dt', null, 'Postseason'), h('dd', null, s.rec.result || (s.rec.seed ? 'No. ' + s.rec.seed + ' seed' : st.phase === 'regular' ? 'Season in progress' : 'Did not qualify')),
            h('dt', null, 'State titles'), h('dd', null, String(st.champions.filter((c) => c.id === s.id).length))));
          const r = s.isUser ? Team.userRatings(st) : Season.scout(st, s);
          body.appendChild(h('div', { class: 'grid c2' }, info, ratingBars(r, s.isUser ? 'Team Ratings' : 'Scouting Report' + (st.program.facilities.film < 4 ? ' (estimated)' : ''))));
        } else if (T === 'schedule') {
          const games = st.games.filter((g) => g.home === s.id || g.away === s.id).sort((a, b) => a.week - b.week);
          body.appendChild(table([
            { key: 'wk', label: 'Wk', render: (g) => (g.playoff ? 'P' + g.playoff.round : g.week) },
            { key: 'opp', label: 'Opponent', render: (g) => { const o = Season.opponentOf(st, g, s.id); return h('div', { class: 'row nowrap', style: { gap: '8px' } }, h('span', { class: 'muted' }, g.neutral ? 'vs' : g.home === s.id ? 'vs' : '@'), badge(o, st, 'sm'), h('button', { type: 'button', class: 'linklike', onclick: () => Win.school(o.id) }, o.name)); } },
            { key: 'type', label: '', render: (g) => (g.playoff ? h('span', { class: 'tag gold' }, 'Playoff') : g.league ? h('span', { class: 'tag team' }, 'League') : '') },
            { key: 'res', label: 'Result', render: (g) => { if (!g.played) return h('span', { class: 'dim' }, Schedule.weekDateStr(st.year, g.week)); const us = g.home === s.id ? g.hs : g.as; const them = g.home === s.id ? g.as : g.hs; return h('span', { class: 'tag ' + (us > them ? 'good' : 'bad') }, (us > them ? 'W ' : 'L ') + us + '-' + them + (g.ot ? ' OT' : '')); } },
          ], games, { empty: 'No games scheduled.' }));
        } else if (T === 'history') {
          const titles = st.champions.filter((c) => c.id === s.id);
          if (titles.length) body.appendChild(h('div', { class: 'card tight mb' }, '🏆 State champions: ' + titles.map((t) => t.year + ' (D-' + U.roman(t.div) + ')').join(', ')));
          body.appendChild(table([
            { key: 'y', label: 'Season', render: (x) => x.year, cls: 'bold' },
            { key: 'r', label: 'Record', render: (x) => x.w + '-' + x.l, cls: 'num' },
            { key: 'l', label: 'League', render: (x) => x.lw + '-' + x.ll + (x.league ? ' 🏅' : ''), cls: 'num' },
            { key: 'res', label: 'Result', render: (x) => (x.result === 'State Champion' ? h('span', { class: 'tag gold' }, x.result) : x.result) },
          ], s.history, { empty: 'No completed seasons yet. History builds as you play.' }));
        } else {
          const rows = Season.leagueStandings(st, lg.id);
          body.appendChild(h('h3', { class: 'sect' }, lg.name));
          body.appendChild(table([
            { key: 't', label: 'Team', render: (x) => h('div', { class: 'row nowrap', style: { gap: '8px' } }, badge(x, st, 'sm'), x.name) },
            { key: 'c', label: 'City', render: (x) => x.city, cls: 'muted' },
            { key: 'd', label: 'Div', render: (x) => U.roman(x.division) },
            { key: 'l', label: 'League', render: (x) => x.rec.lw + '-' + x.rec.ll, cls: 'num' },
            { key: 'o', label: 'Overall', render: (x) => x.rec.w + '-' + x.rec.l, cls: 'num' },
          ], rows, { rowClass: (x) => (x.id === s.id ? 'me' : ''), onRow: (x) => Win.school(x.id) }));
        }
      },
    });
  };
})();
