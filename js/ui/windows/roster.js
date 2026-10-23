/* Program roster (varsity / JV / freshman) and player card windows. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { Team, Players, Season } = FNG;
  const { h, ovrChip, stars, attrBar, seg, select, table, tabs, toast } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  const GROUPS = {
    all: null,
    offense: ['QB', 'RB', 'WR', 'TE', 'OL'],
    defense: ['DL', 'LB', 'CB', 'S'],
    special: ['K', 'P'],
  };
  const LEVEL_TAG = { V: 'team', JV: 'info', FR: '' };

  function starterMap(st) {
    const lineup = Team.resolveLineup(st.roster, st.depth);
    const m = {};
    for (const pos in lineup.groups) lineup.groups[pos].forEach((p, i) => (m[p.id] = (m[p.id] ? m[p.id] + ', ' : '') + pos + (lineup.groups[pos].length > 1 ? i + 1 : '')));
    return m;
  }

  function levelSelect(st, p) {
    const sel = h('select', { class: 'select', style: { height: '28px', padding: '0 22px 0 6px', fontSize: '12px' }, title: 'Move between teams', onchange: (e) => {
      if (Season.setLevel(st, p.id, e.target.value)) {
        toast(Players.fullName(p) + ' moved to ' + Players.LEVEL_NAME[e.target.value] + '.', 'good', 1800);
        App.changed();
      }
    } });
    for (const lv of Players.LEVELS) sel.appendChild(h('option', { value: lv, selected: p.level === lv, disabled: !Players.levelAllowed(p, lv) }, lv === 'V' ? 'Varsity' : lv === 'JV' ? 'JV' : 'Freshman'));
    return sel;
  }

  Win.roster = function () {
    WM.open('roster', {
      title: 'Roster',
      icon: 'roster',
      state: { level: 'V', group: 'all', pos: 'ALL', sort: { key: 'ovr', dir: 'desc' } },
      render(body, w) {
        const st = App.state;
        const S = w.state;
        const starters = starterMap(st);
        const counts = { V: 0, JV: 0, FR: 0 };
        for (const p of st.roster) counts[p.level]++;
        let rows = st.roster.slice();
        if (S.level !== 'ALL') rows = rows.filter((p) => p.level === S.level);
        if (GROUPS[S.group]) rows = rows.filter((p) => GROUPS[S.group].includes(p.pos));
        if (S.pos !== 'ALL') rows = rows.filter((p) => p.pos === S.pos);

        body.appendChild(h('div', { class: 'row between mb' },
          seg([{ value: 'V', label: 'Varsity (' + counts.V + ')' }, { value: 'JV', label: 'JV (' + counts.JV + ')' }, { value: 'FR', label: 'Freshman (' + counts.FR + ')' }, { value: 'ALL', label: 'Whole Program (' + st.roster.length + ')' }], S.level, (v) => {
            S.level = v;
            WM.refresh('roster');
          }),
          h('div', { class: 'row' },
            h('span', { class: 'small muted' }, 'JV ' + st.lower.JV.w + '-' + st.lower.JV.l + ' · Freshman ' + st.lower.FR.w + '-' + st.lower.FR.l),
            h('button', { type: 'button', class: 'btn sm', onclick: async () => {
              if (!(await WM.confirm('Auto-Assign Teams', 'Re-sort the whole program: seniors and the best underclassmen on varsity, the rest of the sophomores and juniors on JV, remaining freshmen on the freshman team. Your manual moves will be replaced.', 'Auto-Assign'))) return;
              Season.autoLevels(st);
              App.changed();
              toast('Teams re-sorted.', 'good');
            } }, 'Auto-Assign Teams'))));
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
          h('span', { class: 'small muted' }, 'Freshman team: freshmen only. JV: no seniors. Only varsity players can start in varsity games.')));
        const cols = [
          { key: 'num', label: '#', value: (p) => p.num, cls: 'num r', defaultDir: 'asc' },
          { key: 'name', label: 'Name', value: (p) => p.last + p.first, render: (p) => h('span', { class: 'bold' }, Players.fullName(p)), defaultDir: 'asc' },
          { key: 'pos', label: 'Pos', value: (p) => Players.POSITIONS.indexOf(p.pos), render: (p) => p.pos, defaultDir: 'asc' },
          { key: 'year', label: 'Yr', value: (p) => p.year, render: (p) => Players.CLASS_NAME[p.year] },
          { key: 'ht', label: 'Ht/Wt', value: (p) => p.wt, render: (p) => Players.heightStr(p.ht) + ' ' + p.wt, cls: 'muted' },
          { key: 'ovr', label: 'Ovr', value: (p) => Players.ovr(p), render: (p) => ovrChip(Players.ovr(p)), cls: 'c' },
          { key: 'pot', label: 'Ceiling', value: (p) => p.pot, render: (p) => stars(Players.potentialStars(p)), title: 'Career potential' },
          { key: 'spd', label: 'Spd', value: (p) => p.a.spd, cls: 'num r' },
          { key: 'str', label: 'Str', value: (p) => p.a.str, cls: 'num r' },
          { key: 'awr', label: 'Awr', value: (p) => p.a.awr, cls: 'num r' },
          { key: 'rec', label: 'Recruit', value: (p) => { const i = Season.recruitInfo(st, p); return i ? 10000 - i.rank - (i.classYear - st.year) * 1000 : 0; }, render: (p) => { const i = Season.recruitInfo(st, p); return i ? h('span', { class: 'nowrap' }, stars(i.stars), ' #' + i.rank) : h('span', { class: 'dim' }, '—'); } },
          { key: 'off', label: 'Offers', value: (p) => (st.cr && st.cr.offers[p.id] ? st.cr.offers[p.id].length : 0), render: (p) => FNG.CollegeView.offersCell(Season.collegeOffers(st, p, Season.user(st)), 3), title: 'Major college offers' },
          { key: 'role', label: 'Starting', value: (p) => (starters[p.id] ? 1 : 0), render: (p) => (starters[p.id] ? h('span', { class: 'tag team' }, starters[p.id]) : h('span', { class: 'dim' }, '—')) },
          { key: 'status', label: 'Status', value: (p) => p.injury, render: (p) => (p.injury > 0 ? h('span', { class: 'tag bad' }, 'INJ ' + p.injury + 'w') : h('span', { class: 'tag good' }, 'Healthy')) },
          { key: 'level', label: 'Team', value: (p) => Players.LEVELS.indexOf(p.level), render: (p) => levelSelect(st, p), sortable: true },
        ];
        body.appendChild(table(cols, rows, {
          sortState: S.sort,
          onSort: () => WM.refresh('roster'),
          onRow: (p) => Win.player(p.id),
          rowClass: (p) => (p.injury > 0 ? 'out' : ''),
          empty: 'No players match.',
        }));
      },
    });
  };

  const STAT_COLS = [
    ['gp', 'GP'], ['lgp', 'JV/FR GP'], ['pCmp', 'Cmp'], ['pAtt', 'Att'], ['pYds', 'Pass Yds'], ['pTD', 'Pass TD'], ['pInt', 'Int'], ['rAtt', 'Rush'],
    ['rYds', 'Rush Yds'], ['rTD', 'Rush TD'], ['rec', 'Rec'], ['recYds', 'Rec Yds'], ['recTD', 'Rec TD'], ['tkl', 'Tkl'], ['sck', 'Sck'],
    ['dInt', 'Def Int'], ['fgm', 'FGM'], ['fga', 'FGA'], ['xpm', 'XPM'], ['pnt', 'Punts'],
  ];

  Win.player = function (id) {
    WM.open('player:' + id, {
      title: 'Player',
      icon: 'player',
      state: { tab: 'ratings' },
      render(body, w) {
        const st = App.state;
        const p = st.roster.find((x) => x.id === id);
        if (!p) {
          body.appendChild(h('div', { class: 'empty' }, 'This player is no longer in the program.'));
          return;
        }
        WM.setTitle(w.id, '#' + p.num + ' ' + Players.fullName(p));
        const o = Players.ovr(p);
        const best = Players.bestPosition(p);
        const outlook = Players.collegeOutlook(p);
        const info = Season.recruitInfo(st, p, Season.user(st));
        body.appendChild(h('div', { class: 'hero' },
          h('div', { style: { fontSize: '40px', fontWeight: 900, fontFamily: 'var(--mono)', minWidth: '64px', textAlign: 'center', position: 'relative', zIndex: 1 } }, p.num),
          h('div', { class: 'grow', style: { position: 'relative', zIndex: 1 } },
            h('div', { class: 'name' }, Players.fullName(p)),
            h('div', { class: 'meta' }, Players.POS_NAME[p.pos] + ' · ' + ['', 'Freshman', 'Sophomore', 'Junior', 'Senior'][p.year] + ' · ' + Players.heightStr(p.ht) + ', ' + p.wt + ' lbs'),
            h('div', { class: 'meta row', style: { gap: '6px' } },
              h('span', { class: 'tag ' + LEVEL_TAG[p.level] }, Players.LEVEL_NAME[p.level]),
              p.injury > 0 ? h('span', { class: 'tag bad' }, 'Injured · out ' + p.injury + ' week' + (p.injury > 1 ? 's' : '')) : h('span', { class: 'tag good' }, 'Healthy'),
              stars(Players.potentialStars(p))),
            Season.collegeCommit(st, p) ? h('div', { class: 'meta row', style: { gap: '6px' } }, FNG.UI.collegeLogo(Season.collegeCommit(st, p).college, 'sm'), h('span', { class: 'bold' }, 'Committed to ' + Season.collegeCommit(st, p).college.name)) : null),
          h('div', { class: 'center', style: { position: 'relative', zIndex: 1 } }, h('div', { class: 'tiny', style: { color: 'rgba(255,255,255,.75)' } }, 'OVERALL'), h('div', { style: { transform: 'scale(1.5)', marginTop: '8px' } }, ovrChip(o)))));

        body.appendChild(tabs([{ value: 'ratings', label: 'Ratings' }, { value: 'stats', label: 'Stats' }], w.state.tab, (v) => {
          w.state.tab = v;
          WM.refresh(w.id);
        }));

        if (w.state.tab === 'ratings') {
          const attrs = h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Attributes'), Players.ATTRS.map((k) => attrBar(Players.ATTR_LABEL[k], p.a[k])),
            h('div', { class: 'help' }, 'Ratings are on a career scale: 99 is a Hall of Fame pro, so even all-state high schoolers rarely pass 65.'));
          const posGrid = h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '6px' } },
            Players.POSITIONS.map((pos) => h('div', { class: 'card tight center', style: pos === p.pos ? { borderColor: 'var(--team)' } : null },
              h('div', { class: 'tiny muted bold' }, pos + (pos === best ? ' ★' : '')), ovrChip(Players.ovrAt(p, pos)))));
          const posSel = select(Players.POSITIONS.map((pos) => ({ value: pos, label: Players.POS_NAME[pos] + ' (' + Players.ovrAt(p, pos) + ')' })), p.pos, (v) => {
            p.pos = v;
            App.changed();
          });
          const side = h('div', { class: 'col' },
            h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Team'), levelSelect(st, p), h('div', { class: 'help' }, p.level === 'V' ? 'Varsity players compete for starting jobs and develop fastest when they start.' : 'Lower-level players get game reps every week, which helps them develop.')),
            h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Recruiting'),
              info ? h('div', null,
                h('div', { class: 'row', style: { gap: '8px' } }, stars(info.stars), h('b', null, '#' + info.rank + ' in the class of ' + info.classYear), FNG.RecruitView.moveTag(info.move)),
                h('div', { class: 'small muted', style: { marginTop: '4px' } }, 'Rating ' + info.score.toFixed(1) + (st.perf[p.id] ? ' · ' + FNG.Recruits.statLine(p, st.perf[p.id]) : '')),
                h('div', { class: 'small', style: { marginTop: '6px' } }, info.offers.length ? h('span', null, h('b', null, info.offers.length + ' major college offer' + (info.offers.length > 1 ? 's' : '') + ' '), FNG.CollegeView.logoStrip(info.offers, 8)) : 'No major college offers yet.'))
                : h('div', null, h('div', { class: 'bold' }, 'Not ranked'), h('div', { class: 'help' }, outlook.label + '. Production, development and varsity snaps can move a player into the rankings.')),
              h('button', { type: 'button', class: 'btn sm mt', onclick: () => Win.recruits({ team: st.userId }) }, 'Recruit Rankings')),
            FNG.CollegeView.offersCard(st, p, Season.user(st)),
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

  FNG.RosterView = { levelSelect };
})();
