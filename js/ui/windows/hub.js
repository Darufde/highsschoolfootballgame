/* Program Hub: the dashboard window. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U, Season, Team, Players, World, Schedule } = FNG;
  const { h, icon, badge, ovrChip, stat, select } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  function compareRows(us, them) {
    const rows = [['qb', 'QB'], ['rb', 'Run'], ['wr', 'Rec'], ['ol', 'OL'], ['dl', 'DL'], ['lb', 'LB'], ['db', 'DB'], ['k', 'K']];
    return rows.map(([k, label]) => {
      const a = Math.round(us[k]);
      const b = Math.round(them[k]);
      const col = (x, y) => (x >= y ? 'var(--good)' : '#64748b');
      return h('div', { class: 'compare' },
        h('span', { class: 'l num bold' }, a),
        h('div', { class: 'bar left' }, h('i', { style: { width: a + '%', background: col(a, b) } })),
        h('span', { class: 'mid' }, label),
        h('div', { class: 'bar' }, h('i', { style: { width: b + '%', background: col(b, a) } })),
        h('span', { class: 'num bold' }, b));
    });
  }

  function thisWeekCard(st) {
    const u = Season.user(st);
    const card = h('div', { class: 'card accent' });
    if (st.phase === 'offseason') {
      const O = st.offseason;
      card.append(h('h3', { class: 'sect' }, 'Offseason'),
        h('div', { class: 'bold', style: { fontSize: '16px' } }, Season.OFFSEASON_STEPS[O.step]),
        h('p', { class: 'muted small' }, 'Step ' + (O.step + 1) + ' of ' + Season.OFFSEASON_STEPS.length + '. Work through graduation, development and your incoming class before the ' + (st.year + 1) + ' season.'),
        h('button', { type: 'button', class: 'btn primary', onclick: () => Win.offseason() }, icon('forward', 15), 'Continue Offseason'));
      return card;
    }
    const g = Season.userGame(st);
    const label = st.phase === 'playoffs' ? Season.ROUND_NAMES[st.week - 10] : 'Week ' + st.week;
    card.appendChild(h('div', { class: 'row between' }, h('h3', { class: 'sect', style: { margin: 0 } }, label), h('span', { class: 'small muted' }, App.dateLabel(st))));
    if (!g) {
      const alive = Season.userAlive(st);
      if (st.phase === 'playoffs' && !alive) {
        card.append(h('p', null, u.rec.seed ? 'Your season is over (' + u.rec.result + ').' : 'You did not qualify for the playoffs this year.'),
          h('p', { class: 'muted small' }, 'Follow the bracket or jump ahead to the offseason.'),
          h('div', { class: 'row' },
            h('button', { type: 'button', class: 'btn', onclick: () => App.advanceWeek() }, 'Sim Week'),
            h('button', { type: 'button', class: 'btn primary', onclick: () => App.simUntil('Simulating playoffs', () => false) }, icon('forward', 15), 'Sim to Offseason')));
      } else {
        card.append(h('p', { style: { fontSize: '15px', fontWeight: 700 } }, 'Bye week'), h('p', { class: 'muted small' }, 'No game this week. Rest up and get healthy.'),
          h('button', { type: 'button', class: 'btn primary', onclick: () => App.advanceWeek() }, icon('forward', 15), 'Advance Week'));
      }
      return card;
    }
    const home = g.home === st.userId;
    const opp = Season.opponentOf(st, g, st.userId);
    const lg = g.league ? h('span', { class: 'tag team' }, 'League') : g.playoff ? h('span', { class: 'tag gold' }, 'Playoffs') : h('span', { class: 'tag' }, 'Non-league');
    card.appendChild(h('div', { class: 'matchup mt mb' },
      h('div', { class: 'side' }, badge(u, st), h('div', { class: 'grow' }, h('div', { class: 'bold ellipsis' }, u.name), h('div', { class: 'small muted' }, u.rec.w + '-' + u.rec.l + (u.rec.seed ? ' · #' + u.rec.seed + ' seed' : '')))),
      h('div', { class: 'vs' }, g.neutral ? 'VS' : home ? 'VS' : 'AT'),
      h('div', { class: 'side r' }, badge(opp, st), h('div', { class: 'grow' },
        h('button', { type: 'button', class: 'linklike ellipsis', style: { maxWidth: '100%' }, onclick: () => Win.school(opp.id) }, opp.name),
        h('div', { class: 'small muted' }, opp.rec.w + '-' + opp.rec.l + ' · D-' + U.roman(opp.division) + (opp.rec.seed ? ' · #' + opp.rec.seed + ' seed' : ''))))));
    card.appendChild(h('div', { class: 'row small muted mb' }, lg, h('span', null, g.neutral ? 'Neutral site' : home ? 'Home' : 'Away'), h('span', null, '· Forecast: ' + Season.gameWeather(g))));
    const us = Team.userRatings(st);
    const them = Season.scout(st, opp);
    card.appendChild(h('div', { class: 'row between small muted' }, h('span', null, 'Us · ' + Team.teamOverall(us)), h('span', null, 'Scouting report'), h('span', null, Team.teamOverall(them) + ' · Them')));
    card.append(...compareRows(us, them));
    card.appendChild(h('div', { class: 'row mt' },
      h('button', { type: 'button', class: 'btn primary lg', onclick: () => Win.game(g.id) }, icon('play', 16), 'Play Game'),
      h('button', { type: 'button', class: 'btn lg', onclick: () => App.quickSimUserGame(g.id) }, 'Quick Sim')));
    return card;
  }

  function leaders(st) {
    const y = st.year;
    const s = (p) => p.stats[y] || {};
    const top = (key, fmt) => {
      const p = st.roster.slice().sort((a, b) => (s(b)[key] || 0) - (s(a)[key] || 0))[0];
      if (!p || !s(p)[key]) return h('div', { class: 'muted small' }, '—');
      return h('div', null, h('button', { type: 'button', class: 'linklike', onclick: () => Win.player(p.id) }, Players.shortName(p)), h('div', { class: 'small muted' }, fmt(s(p))));
    };
    return h('div', { class: 'grid c4' },
      h('div', null, h('div', { class: 'tiny muted bold' }, 'PASSING'), top('pYds', (x) => x.pYds + ' yds · ' + (x.pTD || 0) + ' TD')),
      h('div', null, h('div', { class: 'tiny muted bold' }, 'RUSHING'), top('rYds', (x) => x.rYds + ' yds · ' + (x.rTD || 0) + ' TD')),
      h('div', null, h('div', { class: 'tiny muted bold' }, 'RECEIVING'), top('recYds', (x) => x.recYds + ' yds · ' + (x.rec || 0) + ' rec')),
      h('div', null, h('div', { class: 'tiny muted bold' }, 'TACKLES'), top('tkl', (x) => x.tkl + ' tkl · ' + (x.sck || 0) + ' sck')));
  }

  Win.hub = function () {
    WM.open('hub', {
      title: 'Program Hub',
      icon: 'hub',
      width: 980,
      height: 690,
      render(body) {
        const st = App.state;
        const u = Season.user(st);
        const lg = Season.league(st, u.leagueId);
        const ratings = Team.userRatings(st);
        const pr = Season.pollRank(st, u);
        const prDiv = Season.pollRank(st, u, u.division);

        body.appendChild(h('div', { class: 'hero' },
          badge(u, st, 'lg'),
          h('div', { class: 'grow', style: { position: 'relative', zIndex: 1 } },
            h('div', { class: 'name' }, u.name),
            h('div', { class: 'meta' }, u.city + ', ' + u.county + ' County · ' + (u.type === 'public' ? 'Public' : 'Private') + ' · ' + U.num(u.enrollment) + ' students'),
            h('div', { class: 'meta' }, 'Division ' + U.roman(u.division) + ' · Region ' + u.region + ' (' + World.regionName(u.region) + ') · ', h('button', { type: 'button', class: 'linklike', style: { color: '#fff' }, onclick: () => Win.standings(lg.id) }, lg.name))),
          h('div', { class: 'right', style: { position: 'relative', zIndex: 1 } },
            h('div', { class: 'small', style: { color: 'rgba(255,255,255,.75)' } }, 'Head Coach'),
            h('div', { class: 'bold' }, st.coach.name),
            h('div', { class: 'small', style: { color: 'rgba(255,255,255,.75)' } }, 'Career ' + st.coach.wins + '-' + st.coach.losses + (st.coach.titles ? ' · ' + st.coach.titles + ' state title' + (st.coach.titles > 1 ? 's' : '') : '')))));

        body.appendChild(h('div', { class: 'grid c4 mb' },
          stat('Record', u.rec.w + '-' + u.rec.l, 'League ' + u.rec.lw + '-' + u.rec.ll + (u.rec.streak ? ' · ' + u.rec.streak : '')),
          stat('Region ' + u.region, u.rec.w + u.rec.l ? '#' + u.cpRank : '—', u.rec.w + u.rec.l ? u.cp.toFixed(4) + ' computer pts' : 'Ratings begin after Week 1'),
          stat('State Poll', prDiv ? '#' + prDiv + ' D-' + U.roman(u.division) : 'NR', pr ? '#' + pr + ' statewide' : 'Not in the top 25'),
          h('div', { class: 'card tight stat' }, h('div', { class: 'k' }, 'Team Overall'), h('div', { class: 'v row', style: { gap: '8px' } }, ovrChip(Team.teamOverall(ratings)), h('span', { class: 'small muted', style: { fontWeight: 500 } }, U.money(st.program.funds) + ' funds')), h('div', { class: 's' }, 'Prestige ' + u.prestige + '/100'))));

        const focus = select(Object.entries(Season.FOCUS).map(([value, label]) => ({ value, label })), st.program.focus, (v) => {
          st.program.focus = v;
          App.changed();
        });
        const left = h('div', { class: 'col' }, thisWeekCard(st),
          h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Practice Focus'), focus,
            h('div', { class: 'help' }, {
              balanced: 'Even development across the roster.',
              offense: 'Extra reps for throwing, catching and blocking.',
              defense: 'Extra reps for tackling and coverage.',
              conditioning: 'Speed, strength and agility work.',
              film: 'Study this week’s opponent: +1 to every unit on game day.',
            }[st.program.focus])));

        const news = h('ul', { class: 'news' }, st.news.slice(0, 14).map((n) => h('li', { class: 'n-' + n.kind }, h('span', { class: 'when' }, n.week > 16 ? 'Off ' + n.year : (n.week > 10 ? 'P' + (n.week - 10) : 'Wk ' + n.week) + ' ’' + String(n.year).slice(2)), h('span', { class: 'txt' }, n.text))));
        const right = h('div', { class: 'col' },
          h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Team Leaders · ' + st.year), leaders(st)),
          h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Around the Program'), news));
        body.appendChild(h('div', { class: 'grid c2' }, left, right));
      },
    });
  };
})();
