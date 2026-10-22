/* Roster table and player card windows. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U, Team, Players } = FNG;
  const { h, ovrChip, stars, attrBar, seg, select, table, tabs } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  const GROUPS = {
    all: null,
    offense: ['QB', 'RB', 'WR', 'TE', 'OL'],
    defense: ['DL', 'LB', 'CB', 'S'],
    special: ['K', 'P'],
  };

  function starterMap(st) {
    const lineup = Team.resolveLineup(st.roster, st.depth);
    const m = {};
    for (const pos in lineup.groups) lineup.groups[pos].forEach((p, i) => (m[p.id] = (m[p.id] ? m[p.id] + ', ' : '') + pos + (lineup.groups[pos].length > 1 ? i + 1 : '')));
    return m;
  }

  Win.roster = function () {
    WM.open('roster', {
      title: 'Roster',
      icon: 'roster',
      width: 1000,
      height: 640,
      state: { group: 'all', pos: 'ALL', sort: { key: 'ovr', dir: 'desc' } },
      render(body, w) {
        const st = App.state;
        const S = w.state;
        const starters = starterMap(st);
        let rows = st.roster.slice();
        if (GROUPS[S.group]) rows = rows.filter((p) => GROUPS[S.group].includes(p.pos));
        if (S.pos !== 'ALL') rows = rows.filter((p) => p.pos === S.pos);
        const counts = [1, 2, 3, 4].map((y) => st.roster.filter((p) => p.year === y).length);
        body.appendChild(h('div', { class: 'toolbar' },
          seg([{ value: 'all', label: 'All' }, { value: 'offense', label: 'Offense' }, { value: 'defense', label: 'Defense' }, { value: 'special', label: 'Special' }], S.group, (v) => {
            S.group = v;
            S.pos = 'ALL';
            WM.refresh('roster');
          }),
          select([{ value: 'ALL', label: 'All positions' }].concat(Players.POSITIONS.map((p) => ({ value: p, label: Players.POS_NAME[p] }))), S.pos, (v) => {
            S.pos = v;
            WM.refresh('roster');
          }),
          h('div', { class: 'grow' }),
          h('span', { class: 'small muted' }, st.roster.length + ' players · ' + counts[3] + ' SR · ' + counts[2] + ' JR · ' + counts[1] + ' SO · ' + counts[0] + ' FR · ' + st.roster.filter((p) => p.injury > 0).length + ' injured')));
        const cols = [
          { key: 'num', label: '#', value: (p) => p.num, cls: 'num r', defaultDir: 'asc' },
          { key: 'name', label: 'Name', value: (p) => p.last + p.first, render: (p) => h('span', { class: 'bold' }, Players.fullName(p)), defaultDir: 'asc' },
          { key: 'pos', label: 'Pos', value: (p) => Players.POSITIONS.indexOf(p.pos), render: (p) => p.pos, defaultDir: 'asc' },
          { key: 'year', label: 'Yr', value: (p) => p.year, render: (p) => Players.CLASS_NAME[p.year] },
          { key: 'ht', label: 'Ht', value: (p) => p.ht, render: (p) => Players.heightStr(p.ht), cls: 'r' },
          { key: 'wt', label: 'Wt', value: (p) => p.wt, cls: 'num r' },
          { key: 'ovr', label: 'Ovr', value: (p) => Players.ovr(p), render: (p) => ovrChip(Players.ovr(p)), cls: 'c' },
          { key: 'pot', label: 'Pot', value: (p) => p.pot, render: (p) => stars(Players.potentialStars(p)), title: 'Potential' },
          { key: 'spd', label: 'Spd', value: (p) => p.a.spd, cls: 'num r' },
          { key: 'str', label: 'Str', value: (p) => p.a.str, cls: 'num r' },
          { key: 'agi', label: 'Agi', value: (p) => p.a.agi, cls: 'num r' },
          { key: 'awr', label: 'Awr', value: (p) => p.a.awr, cls: 'num r' },
          { key: 'role', label: 'Starting', value: (p) => (starters[p.id] ? 1 : 0), render: (p) => (starters[p.id] ? h('span', { class: 'tag team' }, starters[p.id]) : h('span', { class: 'dim' }, '—')) },
          { key: 'status', label: 'Status', value: (p) => p.injury, render: (p) => (p.injury > 0 ? h('span', { class: 'tag bad' }, 'INJ ' + p.injury + 'w') : h('span', { class: 'tag good' }, 'Healthy')) },
        ];
        body.appendChild(table(cols, rows, {
          sortState: S.sort,
          onSort: () => WM.refresh('roster'),
          onRow: (p) => Win.player(p.id),
          rowClass: (p) => (p.injury > 0 ? 'out' : ''),
          empty: 'No players at this position.',
        }));
      },
    });
  };

  const STAT_COLS = [
    ['gp', 'GP'], ['pCmp', 'Cmp'], ['pAtt', 'Att'], ['pYds', 'Pass Yds'], ['pTD', 'Pass TD'], ['pInt', 'Int'], ['rAtt', 'Rush'],
    ['rYds', 'Rush Yds'], ['rTD', 'Rush TD'], ['rec', 'Rec'], ['recYds', 'Rec Yds'], ['recTD', 'Rec TD'], ['tkl', 'Tkl'], ['sck', 'Sck'],
    ['dInt', 'Def Int'], ['fgm', 'FGM'], ['fga', 'FGA'], ['xpm', 'XPM'], ['pnt', 'Punts'],
  ];

  Win.player = function (id) {
    WM.open('player:' + id, {
      title: 'Player',
      icon: 'player',
      width: 760,
      height: 620,
      layoutKey: 'player',
      state: { tab: 'ratings' },
      render(body, w) {
        const st = App.state;
        const p = st.roster.find((x) => x.id === id);
        if (!p) {
          body.appendChild(h('div', { class: 'empty' }, 'This player is no longer on the roster.'));
          return;
        }
        WM.setTitle(w.id, '#' + p.num + ' ' + Players.fullName(p));
        const o = Players.ovr(p);
        const best = Players.bestPosition(p);
        body.appendChild(h('div', { class: 'hero' },
          h('div', { style: { fontSize: '40px', fontWeight: 900, fontFamily: 'var(--mono)', minWidth: '64px', textAlign: 'center', position: 'relative', zIndex: 1 } }, p.num),
          h('div', { class: 'grow', style: { position: 'relative', zIndex: 1 } },
            h('div', { class: 'name' }, Players.fullName(p)),
            h('div', { class: 'meta' }, Players.POS_NAME[p.pos] + ' · ' + ['', 'Freshman', 'Sophomore', 'Junior', 'Senior'][p.year] + ' · ' + Players.heightStr(p.ht) + ', ' + p.wt + ' lbs'),
            h('div', { class: 'meta' }, p.injury > 0 ? h('span', { class: 'tag bad' }, 'Injured · out ' + p.injury + ' week' + (p.injury > 1 ? 's' : '')) : h('span', { class: 'tag good' }, 'Healthy'), ' ', stars(Players.potentialStars(p)))),
          h('div', { class: 'center', style: { position: 'relative', zIndex: 1 } }, h('div', { class: 'tiny', style: { color: 'rgba(255,255,255,.75)' } }, 'OVERALL'), h('div', { style: { transform: 'scale(1.5)', marginTop: '8px' } }, ovrChip(o)))));

        body.appendChild(tabs([{ value: 'ratings', label: 'Ratings' }, { value: 'stats', label: 'Stats' }], w.state.tab, (v) => {
          w.state.tab = v;
          WM.refresh(w.id);
        }));

        if (w.state.tab === 'ratings') {
          const attrs = h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Attributes'), Players.ATTRS.map((k) => attrBar(Players.ATTR_LABEL[k], p.a[k])));
          const posGrid = h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '6px' } },
            Players.POSITIONS.map((pos) => h('div', { class: 'card tight center', style: pos === p.pos ? { borderColor: 'var(--team)' } : null },
              h('div', { class: 'tiny muted bold' }, pos + (pos === best ? ' ★' : '')), ovrChip(Players.ovrAt(p, pos)))));
          const posSel = select(Players.POSITIONS.map((pos) => ({ value: pos, label: Players.POS_NAME[pos] + ' (' + Players.ovrAt(p, pos) + ')' })), p.pos, (v) => {
            p.pos = v;
            App.changed();
          });
          const side = h('div', { class: 'col' },
            h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Position'), posSel, h('div', { class: 'help' }, best !== p.pos ? 'Projects best at ' + Players.POS_NAME[best] + '.' : 'Already at the best position.'), h('div', { class: 'mt' }, posGrid)),
            p.honors.length ? h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Honors'), p.honors.slice().reverse().map((x) => h('div', { class: 'small' }, '🏅 ' + x))) : null);
          body.appendChild(h('div', { class: 'grid c2' }, attrs, side));
        } else {
          const years = Object.keys(p.stats).sort();
          const cols = [{ key: 'year', label: 'Season', value: (r) => r.year }].concat(STAT_COLS.map(([k, label]) => ({ key: k, label, value: (r) => r[k] || 0, cls: 'num r' })));
          const rows = years.map((y) => Object.assign({ year: y }, p.stats[y]));
          if (rows.length > 1) {
            const tot = { year: 'Career' };
            for (const r of rows) for (const [k] of STAT_COLS) tot[k] = (tot[k] || 0) + (r[k] || 0);
            rows.push(tot);
          }
          body.appendChild(table(cols, rows, { empty: 'No game action yet.' }));
        }
      },
    });
  };
})();
